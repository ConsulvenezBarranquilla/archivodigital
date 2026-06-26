import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  } from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {
      correlativo,
    } = await req.json();

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "Caja!A:M",
      });

    const rows =
      response.data.values || [];

    const index =
      rows.findIndex(
        (row, i) =>
          i > 0 &&
          row[1] ===
            correlativo
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