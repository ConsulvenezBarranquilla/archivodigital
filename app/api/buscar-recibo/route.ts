import { NextRequest, NextResponse } from "next/server";

import {
  obtenerCorrelativos,
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET(
  req: NextRequest
) {

  try {

    const correlativo =
      req.nextUrl.searchParams
        .get("correlativo")
        ?.trim();

    if (!correlativo) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Correlativo requerido",
      });

    }

    const response =
      await sheets
        .spreadsheets
        .values
        .get({
          spreadsheetId:
            MODULO_CAJA_SHEET_ID,
          range: "Caja!A:K",
        });

    const rows =
      response.data.values || [];

    const recibo =
      rows.find(
        (row, index) => {

          if (index === 0)
            return false;

          return (
            row[1] === correlativo
          );

        }
      );

    if (!recibo) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Recibo no encontrado",
      });

    }

    return NextResponse.json({
      ok: true,

      fecha: recibo[0],
      correlativo:
        recibo[1],
      documento:
        recibo[2],
      nombre:
        recibo[3],
      correo:
        recibo[4],
      actuaciones:
        recibo[5],
      totalUSD:
        recibo[6],
      usuario:
        recibo[7],
        caja:
        recibo [8],
      pdfUrl:
        recibo[9],
      estado:
        recibo[10],
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}