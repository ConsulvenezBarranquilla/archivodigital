import { NextRequest, NextResponse } from "next/server";

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

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "Caja!A:K",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "DetalleCaja!A:C",
      });

    const movimientos =
      cajaResponse.data.values || [];

    const detalles =
      detalleResponse.data.values || [];

    const recibo =
      movimientos.find(
        (row, index) => {

          if (index === 0) {
            return false;
          }

          return (
            row[1] === correlativo
          );

        }
      );

    if (!recibo) {

  return NextResponse.json({
    ok: false,
    error:
      "Recibo no encontrado",
  });

}

console.log(
  "RECIBO:",
  recibo
);

console.log(
  "ESTADO RECIBO:",
  recibo[10]
);

    const actuaciones =
      detalles
        .slice(1)
        .filter(
          (d) =>
            d[0] === correlativo
        )
        .map(
          (d) => ({
            actuacion:
              d[1],
            monto:
              Number(d[2]),
          })
        );

    return NextResponse.json({
      ok: true,

      correlativo,

      fecha:
        recibo[0],

      documento:
        recibo[2],

      nombre:
        recibo[3],

      correo:
        recibo[4],

      usuario:
        recibo[7],

        estado:
  recibo[10],
        

      caja: recibo[8],
        actuaciones,

      totalUSD:
        Number(
          recibo[6]
        ),
    });

   } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}