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
    nacionalidad,
    nombre,
    tipo,
  } = await req.json();

  const ahora = new Date();

const fecha = new Intl.DateTimeFormat(
  "sv-SE",
  {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }
)
.format(new Date())
.replace(" ", "T");

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