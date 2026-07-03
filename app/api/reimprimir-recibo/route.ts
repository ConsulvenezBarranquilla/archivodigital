import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
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
        range: "Caja!A:N",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "DetalleCaja!A:F",
      });

    const movimientos =
      cajaResponse.data.values || [];

    const detalles =
      detalleResponse.data.values || [];

    const recibo =
  movimientos
    .slice(1)
    .find(
      (row) =>
        row[1] === correlativo
    );

    if (!recibo) {
      return NextResponse.json({
    ok: false,
    error:
      "Recibo no encontrado",
  });

}
const cedula =
  recibo[11] || recibo[2];

const pasaporte =
  recibo[12] || "";

const nacionalidad =
  recibo[13] || "";

const documento =
  obtenerDocumentoPrincipal(
    cedula,
    pasaporte,
    nacionalidad
  );
  


    const actuaciones =
  detalles
    .slice(1)
    .filter(
      (d) => d[0] === correlativo
    )
    .map((d) => ({
      codigo: d[1],
      actuacion: d[2],
      monto: Number(d[3]),
    }));

    return NextResponse.json({
      ok: true,

      correlativo,

      fecha:
        recibo[0],

      documento,

cedula,

pasaporte,

nacionalidad,

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