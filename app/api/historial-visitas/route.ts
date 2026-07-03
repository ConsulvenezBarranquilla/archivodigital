import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  } from "@/lib/googleSheets";

export async function GET(
  req: NextRequest
) {

  try {

    const documento =
      req.nextUrl.searchParams.get(
        "documento"
      );

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "BitacoraVisitas!A:F",
      });

    const rows =
      response.data.values || [];

      
    const historial =
  rows
    .slice(1)
    .map((row, index) => ({

  fila: index + 2,

  fecha: row[0] || "",

  documento: row[1] || "",

  cedula: row[2] || "",

  pasaporte: row[3] || "",

  nombre: row[4] || "",

  tipo: row[5] || "",

}))
    .filter((item) => {

  const buscado =
    documento
      ?.trim()
      .toUpperCase();

  return (

    item.documento
      .trim()
      .toUpperCase() === buscado ||

    item.cedula
      .trim()
      .toUpperCase() === buscado ||

    item.pasaporte
      .trim()
      .toUpperCase() === buscado

  );

})
historial.sort((a, b) =>
  b.fecha.localeCompare(a.fecha)
);
return NextResponse.json({
  ok: true,
  historial,
});

} catch (error: any) {

  return NextResponse.json({
    ok: false,
    error: error.message,
  });

}

}