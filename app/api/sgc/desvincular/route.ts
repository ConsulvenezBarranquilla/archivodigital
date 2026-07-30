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

export async function POST(

  req: NextRequest

) {

  try {

    const {

      recibo,

      codigo,

      numeroActuacion,

      usuario,

      observaciones,
      
    } = await req.json();

    if (

      !recibo?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Recibo requerido.",

      });

    }

    if (

      !codigo?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Código de actuación requerido.",

      });

    }
if (

  !numeroActuacion?.trim()

) {

  return NextResponse.json({

    ok: false,

    error:
      "Número de actuación requerido.",

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

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const rows =
      response.data.values || [];

    const ahora = fechaHoraActual();

            // ===============================
    // Buscar la actuación
    // ===============================

    let fila = -1;

    for (

      let i = 1;

      i < rows.length;

      i++

    ) {

      const correlativo =
        (rows[i][0] || "")
          .toString()
          .trim();

      const numeroFila =
  (rows[i][11] || "")
    .toString()
    .trim();

const estado =
  (rows[i][6] || "")
    .toString()
    .trim()
    .toUpperCase();

if (

  numeroFila === numeroActuacion &&

  (

    estado === "VINCULADO" ||

    estado === "SIN PLANILLA"

  )

) {

  fila = i + 1;

  break;

}

    }

    if (

      fila === -1

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "La actuación no se encuentra vinculada.",

      });

    }
const estadoAnterior =
  (rows[fila - 1][6] || "")
    .toString()
    .trim()
    .toUpperCase();
    const observacionAnterior =
      rows[fila - 1][10] || "";

    const nuevaObservacion =

      `${observacionAnterior}

-----------------------

DESVINCULADO (${estadoAnterior})

${ahora}

Usuario: ${usuario}

${observaciones || ""}`.trim();
    // ===============================
    // Actualizar la actuación
    // ===============================

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

    return NextResponse.json({

      ok: true,

      mensaje:
        "La actuación fue desvinculada correctamente.",

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