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
    documento,
    cedula,
    pasaporte,
    nombre,
    tipo,
  } = await req.json();

  const fecha =
    new Date().toLocaleString(
      "es-CO"
    );

  await sheets.spreadsheets.values.append({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "BitacoraVisitas!A:F",

    valueInputOption:
      "USER_ENTERED",

    requestBody: {

      values: [[

        fecha,

        documento,

        cedula || "",

        pasaporte || "",

        nombre,

        tipo,

      ]],

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