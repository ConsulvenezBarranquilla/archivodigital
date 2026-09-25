import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  fechaHoraActual,
} from "@/lib/fechas";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import { exigirPermiso } from "@/lib/autorizacion";

export async function POST(
  req: NextRequest
) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {

      return autorizacion.respuesta;

    }

    const usuarioSesion =
      autorizacion.sesion;

    const {
      numeroActuacion,
      observaciones,
    } = await req.json();

    const usuario =
      usuarioSesion.nombre;

    if (!numeroActuacion?.trim()) {

      return NextResponse.json({

        ok: false,

        error:
          "Número de actuación requerido.",

      });

    }

    if (!usuario?.trim()) {

      return NextResponse.json({

        ok: false,

        error:
          "Usuario no identificado.",

      });

    }

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:H",

      });

    const rows =
      gestionResponse.data.values || [];

    const detalle =
      detalleResponse.data.values || [];

    const ahora =
      fechaHoraActual();

    let fila = -1;

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const numero =
        String(rows[i][11] ?? "")
          .trim();

      const estado =
        String(rows[i][6] ?? "")
          .trim()
          .toUpperCase();

      if (

        numero === numeroActuacion &&

        (
          estado === "VINCULADO" ||
          estado === "SIN PLANILLA"
        )

      ) {

        fila = i + 1;

        break;

      }

    }

    if (fila === -1) {

      return NextResponse.json({

        ok: false,

        error:
          "La actuación no se encuentra vinculada.",

      });

    }

    const correlativo =
      String(rows[fila - 1][0] ?? "")
        .trim();

    const codigo =
      String(rows[fila - 1][1] ?? "")
        .trim();

    const estadoAnterior =
      String(rows[fila - 1][6] ?? "")
        .trim();

    const observacionAnterior =
      String(rows[fila - 1][10] ?? "");

    const nuevaObservacion =

`${observacionAnterior}

-----------------------

DESVINCULADO (${estadoAnterior})

${ahora}

Usuario: ${usuario}

${observaciones || ""}`.trim();

    // ==========================
    // Gestion Consular
    // ==========================

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `GestionConsular!G${fila}:K${fila}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values: [[

          "DESVINCULADO",

          rows[fila - 1][7] || "",

          ahora,

          usuario,

          nuevaObservacion,

        ]],

      },

    });

    // ==========================
    // Detalle Caja
    // ==========================

    const filasDetalle =
      detalle.map(f => [...f]);

    for (
      let i = 1;
      i < filasDetalle.length;
      i++
    ) {

      const filaDetalle =
        filasDetalle[i];

      if (

        String(filaDetalle[0] ?? "").trim() === correlativo &&

        String(filaDetalle[1] ?? "").trim() === codigo &&

        String(filaDetalle[4] ?? "").trim() === numeroActuacion

      ) {

        filaDetalle[6] =
          "DESVINCULADO";

        break;

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

      mensaje:
        "La actuación fue desvinculada correctamente.",

    });

  }

  catch (error: any) {

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