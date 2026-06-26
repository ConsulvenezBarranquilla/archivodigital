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

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "Caja!A:K",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "DetalleCaja!A:D",
      });

    const cajaRows =
  cajaResponse.data.values || [];

const detalleRows =
  detalleResponse.data.values || [];

console.log(
  "DOCUMENTO BUSCADO:",
  documento
);

console.log(
  "PRIMEROS DOCUMENTOS CAJA:"
);

cajaRows
  .slice(1, 6)
  .forEach((row) => {

    console.log(
      row[2]
    );

  });

const tramites =
  cajaRows
    .slice(1)
    .filter((row) => {

      return (
        row[2]
          ?.toString()
          .trim()
          .toUpperCase() ===
        documento
          ?.toString()
          .trim()
          .toUpperCase()
      );

    })
    .map((row) => {

      const correlativo =
        row[1];

      const actuaciones =
        detalleRows
          .slice(1)
          .filter(
            (d) =>
              d[0] ===
              correlativo
          )
          .map((d) => ({
  codigo: d[1],
  actuacion: d[2],
  monto: d[3],
}));

      return {

        fecha:
          row[0],

        correlativo,

        nombre:
          row[3],

        correo:
          row[4],

        total:
          row[6],

        usuario:
          row[7],

        caja:
          row[8],

        estado:
          row[10] ||
          "GENERADO",

        actuaciones,

      };

    });

console.log(
  "TRAMITES ENCONTRADOS:",
  tramites.length
);

console.log(
  tramites
);
        return NextResponse.json({
      ok: true,
      tramites,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}