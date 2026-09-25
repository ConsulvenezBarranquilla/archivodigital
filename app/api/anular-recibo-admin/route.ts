import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import { obtenerSesion } from "@/lib/auth";

export async function POST(
  req: NextRequest
) {

  try {

    // ===============================
    // VALIDAR SESIÓN
    // ===============================

    const sesion =
      await obtenerSesion();

    if (!sesion) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "Sesión no válida o expirada.",
        },
        {
          status: 401,
        }
      );

    }

    const {
      correlativo,
    } = await req.json();

    // ===============================
    // Verificar si el recibo está
    // vinculado a Gestión Consular
    // ===============================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:G",

      });

    const registrosGestion =
      gestionResponse.data.values || [];

    const filasGestion =
      registrosGestion.slice(1);

    const vinculacion =
      filasGestion.find((row) => {

        return (

          (row[0] || "").toString().trim() === correlativo &&
          (row[6] || "").toString().trim().toUpperCase() === "VINCULADO"

        );

      });

    if (vinculacion) {

      return NextResponse.json(
        {
          ok: false,
          error:
            `No es posible anular el recibo ${correlativo} porque está vinculado a la Planilla de Gestión Consular ${vinculacion[3]}.`,
        },
        {
          status: 409,
        }
      );

    }

    // ===============================
    // Buscar el recibo en Caja
    // ===============================

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const rows =
      response.data.values || [];

    const index =
      rows.findIndex(
        (row, i) =>
          i > 0 &&
          row[1] === correlativo
      );

    if (index === -1) {

      return NextResponse.json({

        ok: false,

        error:
          "Recibo no encontrado",

      });

    }

    const filaReal =
      index + 1;

    // ===============================
    // Marcar el recibo como ANULADO
    // ===============================

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `Caja!K${filaReal}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values: [
          [
            "ANULADO",
          ],
        ],

      },

    });

    return NextResponse.json({

      ok: true,

    });

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}