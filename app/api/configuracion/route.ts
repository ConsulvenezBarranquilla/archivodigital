import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {

  try {

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "Configuracion!A:B",
      });

    const rows =
      response.data.values || [];

    const configuracion: any = {};

    rows.slice(1).forEach(
      (row) => {

        configuracion[
          row[0]
        ] = row[1];

      }
    );

    return NextResponse.json({
      ok: true,
      configuracion,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}

export async function POST(
  req: NextRequest
) {

  try {

    const {
      guardarPdfDrive,
    } = await req.json();

    await sheets.spreadsheets.values.update({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "Configuracion!B2",

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [
          [
            guardarPdfDrive,
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