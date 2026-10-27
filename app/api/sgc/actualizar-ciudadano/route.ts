import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  fechaDesdeInput,

} from "@/lib/fechas";

import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
  MODULO_CAJA_SHEET_ID,
  invalidarCacheHojaGoogle,
  sincronizarCorreoReportesEntregados,
} from "@/lib/googleSheets";

import { exigirPermiso } from "@/lib/autorizacion";

function normalizarDocumento(valor: unknown) {
  return String(valor ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function POST(

  req: NextRequest

) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {

      return autorizacion.respuesta;

    }

    const body =
      await req.json();

    // Debe existir al menos un documento

    if (

      !body.cedula?.trim() &&

      !body.pasaporte?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe existir al menos un documento.",

      });

    }

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,

        range:
          "Respuestas de formulario 1!A:O",

      });

    const rows =
      response.data.values || [];

    let fila = -1;

    const buscado = normalizarDocumento(body.documentoOriginal);
    if (!buscado) {
      return NextResponse.json({ ok: false, error: "No se recibió el documento original del ciudadano." }, { status: 400 });
    }

    // ===============================
    // Buscar la fila del ciudadano
    // ===============================

    rows.forEach((row, index) => {

      if (index === 0) {

        return;

      }

      const cedula = normalizarDocumento(row[1]);

      const pasaporte = normalizarDocumento(row[14]);

      if (

        cedula === buscado ||

        pasaporte === buscado

      ) {

        fila = index + 1;

      }

    });

    if (fila === -1) {

      return NextResponse.json({

        ok: false,

        error:
          "Ciudadano no encontrado.",

      });

    }

    const cedulaNueva =
      body.cedula
        ?.trim()
        .toUpperCase();

    const pasaporteNuevo =
      body.pasaporte
        ?.trim()
        .toUpperCase();

    // ===============================
    // Validar que la cédula
    // solo contenga números
    // ===============================

    if (

      cedulaNueva &&

      !/^\d+$/.test(
        cedulaNueva
      )

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "La cédula solo puede contener números.",

      });

    }

    // ===============================
    // Validar documentos duplicados
    // ===============================

    for (

      let i = 1;

      i < rows.length;

      i++

    ) {

      if (i + 1 === fila) {

        continue;

      }

      const cedulaExistente = normalizarDocumento(rows[i][1]);

      const pasaporteExistente = normalizarDocumento(rows[i][14]);

      if (

        cedulaNueva &&

        normalizarDocumento(cedulaNueva) === cedulaExistente

      ) {

        return NextResponse.json({

          ok: false,

          error:
            "Ya existe otro ciudadano con esa cédula.",

        });

      }

      if (

        pasaporteNuevo &&

        normalizarDocumento(pasaporteNuevo) === pasaporteExistente

      ) {

        return NextResponse.json({

          ok: false,

          error:
            "Ya existe otro ciudadano con ese pasaporte.",

        });

      }

    }

    // ===============================
    // Actualizar ciudadano
    // ===============================

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range:
        `Respuestas de formulario 1!B${fila}:O${fila}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values: [[

          body.cedula,

          body.primerNombre,

          body.segundoNombre,

          body.primerApellido,

          body.segundoApellido,

          body.nacionalidad,

          body.ciudadNacimiento,

          body.paisNacimiento,

          body.estadoCivil,

          body.genero,

          body.correo,

          body.telefono,

          fechaDesdeInput(
            body.fechaNacimiento
          ),

          body.pasaporte,

        ]],

      },

    });

    invalidarCacheHojaGoogle(REGISTRO_CONSULAR_SHEET_ID, "Respuestas de formulario 1");

    // ===============================
    // Determinar documento principal
    // ===============================

    const nacionalidadNueva =
      (body.nacionalidad || "")
        .toString()
        .trim()
        .toUpperCase();

    let documentoPrincipal = "";

    if (

      nacionalidadNueva ===
        "VENEZOLANA" ||

      nacionalidadNueva ===
        "VENEZOLANO"

    ) {

      documentoPrincipal =
        cedulaNueva ||
        pasaporteNuevo ||
        "";

    } else {

      documentoPrincipal =
        pasaporteNuevo ||
        cedulaNueva ||
        "";

    }

    // ===============================
    // Sincronizar datos en Caja
    // ===============================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const cajaRows =
      cajaResponse.data.values || [];

    const requests: any[] = [];

    cajaRows
      .slice(1)
      .forEach((row, index) => {

        const documento = normalizarDocumento(row[2]);

        const cedula = normalizarDocumento(row[11]);

        const pasaporte = normalizarDocumento(row[12]);

        if (

          documento !== buscado &&

          cedula !== buscado &&

          pasaporte !== buscado

        ) {

          return;

        }

        requests.push({

          range:
            `Caja!C${index + 2}:N${index + 2}`,

          values: [[

            documentoPrincipal,

            `${body.primerNombre} ${body.segundoNombre} ${body.primerApellido} ${body.segundoApellido}`
              .replace(/\s+/g, " ")
              .trim(),

            body.correo,

            row[5] || "",     // actuaciones

            row[6] || "",     // total

            row[7] || "",     // usuario

            row[8] || "",     // caja

            row[9] || "",     // pdf

            row[10] || "",    // estado

            cedulaNueva,

            pasaporteNuevo,

            body.nacionalidad,

          ]],

        });

      });

    if (requests.length) {

      await sheets.spreadsheets.values.batchUpdate({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        requestBody: {

          valueInputOption:
            "USER_ENTERED",

          data:
            requests,

        },

      });

    }

    const reportesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!A:H",
    });
    const reportesRows = reportesResponse.data.values || [];
    const actualizacionesReportes: Array<{ range: string; values: string[][] }> = [];

    reportesRows.slice(1).forEach((reporte, index) => {
      if (normalizarDocumento(reporte[7]) !== buscado) return;
      const filaReporte = index + 2;
      actualizacionesReportes.push({
        range: `ReportesEntregados!H${filaReporte}`,
        values: [[documentoPrincipal]],
      });
    });

    if (actualizacionesReportes.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: actualizacionesReportes,
        },
      });
      invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "ReportesEntregados");
    }
    await sincronizarCorreoReportesEntregados(
      [buscado, rows[fila - 1]?.[1], rows[fila - 1]?.[14], body.cedula, body.pasaporte, documentoPrincipal],
      String(body.correo ?? "")
    );
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "Caja");

    return NextResponse.json({
      ok: true,
      mensaje: actualizacionesReportes.length
        ? "Ciudadano actualizado correctamente. Se sincronizaron los datos de los reportes asociados."
        : "Ciudadano actualizado correctamente. No se encontraron reportes asociados que requirieran sincronización.",
    });

  } catch (error: any) {

    return NextResponse.json(

      {

        ok: false,

        error:
          error.message,

      },

      {

        status: 500,

      }

    );

  }

}
