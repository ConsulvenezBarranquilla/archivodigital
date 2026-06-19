import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  actualizarEstadoRecibo,
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
        range: "Caja!A:K",
      });

    const rows =
      response.data.values || [];

    let fila = -1;

    rows.forEach(
      (row, index) => {

        if (
          row[1] === correlativo
        ) {

          fila = index + 1;

        }

      }
    );

    if (fila === -1) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Recibo no encontrado",
      });

    }

    await actualizarEstadoRecibo(
      fila,
      "ANULADO"
    );

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