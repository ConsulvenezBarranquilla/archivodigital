import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  fechaHoraActual,
} from "@/lib/fechas";
import {
  exigirPermiso,
} from "@/lib/autorizacion";
import {

  sheets,

  MODULO_CAJA_SHEET_ID,

} from "@/lib/googleSheets";

export async function POST(

  req: NextRequest

) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

    const {

      actuaciones,

      planilla,

      fechaPlanilla,

      observaciones,

    } = await req.json();

    const usuario =
      autorizacion.sesion.nombre;

    if (

      !actuaciones ||

      actuaciones.length === 0

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "No existen actuaciones para vincular.",

      });

    }

    if (

      !planilla?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar el número de Planilla de Gestión Consular.",

      });

    }

if (

  !/^\d+$/.test(
    planilla.trim()
  )

) {

  return NextResponse.json({

    ok: false,

    error:
      "El número de planilla debe contener únicamente números.",

  });

}

    if (

      !fechaPlanilla

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar la fecha de la Planilla.",

      });

    }

    if (

      !usuario?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Usuario no identificado.",

      });

    }

    const ahora = fechaHoraActual();

    // ===============================
    // Verificar actuaciones ya vinculadas
    // ===============================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const registrosGestion =
      gestionResponse.data.values || [];

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:H",

      });

    const detalleCaja =
      detalleResponse.data.values || [];

    const filasGestion =
      registrosGestion.slice(1);

    const nuevasFilas: any[] = [];

    for (const actuacion of actuaciones) {

      const correlativo =
        (actuacion.recibo || "")
          .toString()
          .trim();

      const codigo =
        (actuacion.codigo || "")
          .toString()
          .trim();

      const numeroActuacion =
        (actuacion.numeroActuacion || "")
          .toString()
          .trim();

      if (!numeroActuacion) {

        return NextResponse.json({

          ok: false,

          error:
            `Debe indicar el número de la actuación para ${codigo}.`,

        });

      }

      if (!/^\d+$/.test(numeroActuacion)) {

        return NextResponse.json({

          ok: false,

          error:
            `El número de actuación debe contener únicamente números.`,

        });

      }

      const existente =
        filasGestion.find((row) => {

          return (

            (row[11] || "")
              .toString()
              .trim() === numeroActuacion &&

            (row[6] || "")
              .toString()
              .trim() !== "DESVINCULADO"

          );

        });

      if (existente) {

        return NextResponse.json({

          ok: false,

          error:
            `La actuación ${numeroActuacion} del recibo ${correlativo} ya se encuentra vinculada.`,

        });

      }

      nuevasFilas.push([

        correlativo,

        codigo,

        actuacion.actuacion || "",

        planilla,

        fechaPlanilla,

        usuario,

        "VINCULADO",

        ahora,

        "",

        "",

        observaciones || "",

        numeroActuacion,

      ]);

    }

    // ===============================
    // Registrar actuaciones
    // ===============================

    await sheets.spreadsheets.values.append({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "GestionConsular!A:L",

      valueInputOption:
        "USER_ENTERED",

      insertDataOption:
        "INSERT_ROWS",

      requestBody: {

        values:
          nuevasFilas,

      },

    });

    // ===============================
    // Actualizar DetalleCaja
    // ===============================

    const filasDetalle =
      detalleCaja.map((fila) => [...fila]);

    for (const actuacion of actuaciones) {

      const correlativo =
        String(
          actuacion.recibo ?? ""
        ).trim();

      const codigo =
        String(
          actuacion.codigo ?? ""
        ).trim();

      const numeroActuacion =
        String(
          actuacion.numeroActuacion ?? ""
        ).trim();

      // ==========================================
      // Buscar la fila exacta de DetalleCaja
      // ==========================================
      //
      // Primera vinculación:
      // E está vacío.
      //
      // Revinculación:
      // E contiene el mismo número de actuación
      // y G está DESVINCULADA.
      //
      // De esta manera no se toma una fila
      // DESVINCULADA de otra actuación.
      // ==========================================

      let indiceDetalle = -1;

      // ------------------------------------------
      // 1. Buscar primero una fila ya asociada
      //    a esta misma actuación y DESVINCULADA
      // ------------------------------------------

      for (
        let i = 1;
        i < filasDetalle.length;
        i++
      ) {

        const fila =
          filasDetalle[i];

        const mismoCorrelativo =
          String(
            fila[0] ?? ""
          ).trim() === correlativo;

        const mismoCodigo =
          String(
            fila[1] ?? ""
          ).trim() === codigo;

        const mismoNumeroActuacion =
          String(
            fila[4] ?? ""
          ).trim() === numeroActuacion;

        const estaDesvinculada =
          String(
            fila[6] ?? ""
          )
            .trim()
            .toUpperCase() ===
          "DESVINCULADA";

        if (

          mismoCorrelativo &&
          mismoCodigo &&
          mismoNumeroActuacion &&
          estaDesvinculada

        ) {

          indiceDetalle = i;

          break;

        }

      }

      // ------------------------------------------
      // 2. Si no existe una fila previamente
      //    vinculada, buscar una fila nueva
      //    con E vacío.
      // ------------------------------------------

      if (indiceDetalle === -1) {

        for (
          let i = 1;
          i < filasDetalle.length;
          i++
        ) {

          const fila =
            filasDetalle[i];

          const mismoCorrelativo =
            String(
              fila[0] ?? ""
            ).trim() === correlativo;

          const mismoCodigo =
            String(
              fila[1] ?? ""
            ).trim() === codigo;

          const sinActuacion =
            !String(
              fila[4] ?? ""
            ).trim();

          if (

            mismoCorrelativo &&
            mismoCodigo &&
            sinActuacion

          ) {

            indiceDetalle = i;

            break;

          }

        }

      }

      // ------------------------------------------
      // 3. Actualizar solamente la fila encontrada
      // ------------------------------------------

      if (indiceDetalle !== -1) {

        const fila =
          filasDetalle[indiceDetalle];

        fila[4] =
          numeroActuacion;   // E

        fila[5] =
          planilla;          // F

        fila[6] =
          "VINCULADO";       // G

        fila[7] =
          fechaPlanilla;     // H

      }

    }

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `DetalleCaja!A2:H${filasDetalle.length}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values:
          filasDetalle.slice(1),

      },

    });

    return NextResponse.json({

      ok: true,

      cantidad:
        nuevasFilas.length,

      mensaje:
        `${nuevasFilas.length} actuación(es) vinculada(s) correctamente.`,

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