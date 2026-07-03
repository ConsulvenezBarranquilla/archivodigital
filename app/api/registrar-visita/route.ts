import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  } from "@/lib/googleSheets";

  import {
  fechaHoraActual,
} from "@/lib/fechas";

export async function POST(
  req: NextRequest
) {

 try {

  const {
    documento,
    cedula,
    pasaporte,
    nacionalidad,
    nombre,
    tipo,
  } = await req.json();

  
const fecha =
  fechaHoraActual();

  await sheets.spreadsheets.values.append({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "BitacoraVisitas!A:G",

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

        nacionalidad || "",

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