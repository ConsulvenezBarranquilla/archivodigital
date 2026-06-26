import {
  NextRequest,
  NextResponse,
} from "next/server";

import { google } from "googleapis";

import {
  MODULO_CAJA_SHEET_ID,
  } from "@/lib/googleSheets";

const auth =
  new google.auth.JWT({
    email:
      process.env.GOOGLE_CLIENT_EMAIL,
    key:
      process.env.GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

export async function POST(
  req: NextRequest
) {

  try {

    const {
      fila,
    } = await req.json();

    const sheets =
      google.sheets({
        version: "v4",
        auth,
      });

    const spreadsheet =
      await sheets.spreadsheets.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
      });

    const hoja =
      spreadsheet.data.sheets?.find(
        (s) =>
          s.properties?.title ===
          "BitacoraVisitas"
      );

    if (!hoja) {

      return NextResponse.json({
        ok: false,
        error:
          "Hoja no encontrada",
      });

    }

    await sheets.spreadsheets.batchUpdate({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      requestBody: {

        requests: [

          {
            deleteDimension: {

              range: {

                sheetId:
                  hoja.properties?.sheetId,

                dimension:
                  "ROWS",

                startIndex:
                  fila - 1,

                endIndex:
                  fila,

              },

            },

          },

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