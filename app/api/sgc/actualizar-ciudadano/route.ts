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
} from "@/lib/googleSheets";

export async function POST(

  req: NextRequest

) {

  try {

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

    const buscado =
      body.documentoOriginal
        ?.trim()
        .toUpperCase();

    // ===============================
    // Buscar la fila del ciudadano
    // ===============================

    rows.forEach((row, index) => {

      if (index === 0) {

        return;

      }

      const cedula =
        (row[1] || "")
          .toString()
          .trim()
          .toUpperCase();

      const pasaporte =
        (row[14] || "")
          .toString()
          .trim()
          .toUpperCase();

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

      const cedulaExistente =
        (rows[i][1] || "")
          .toString()
          .trim()
          .toUpperCase();

      const pasaporteExistente =
        (rows[i][14] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (

        cedulaNueva &&

        cedulaNueva ===
        cedulaExistente

      ) {

        return NextResponse.json({

          ok: false,

          error:
            "Ya existe otro ciudadano con esa cédula.",

        });

      }

      if (

        pasaporteNuevo &&

        pasaporteNuevo ===
        pasaporteExistente

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

        const documento =
          (row[2] || "")
            .toString()
            .trim()
            .toUpperCase();

        const cedula =
          (row[11] || "")
            .toString()
            .trim()
            .toUpperCase();

        const pasaporte =
          (row[12] || "")
            .toString()
            .trim()
            .toUpperCase();

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

    return NextResponse.json({

      ok: true,

      mensaje:
        "Ciudadano actualizado correctamente.",

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