import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET(
  req: NextRequest
) {

  try {

    const caja =
      req.nextUrl.searchParams.get(
        "caja"
      );

    if (!caja) {

      return NextResponse.json({
        ok: false,
        error: "Caja requerida",
      });

    }

    const hoy =
      new Date()
        .toLocaleDateString(
          "es-CO"
        );

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "Caja!A:K",
      });

    const rows =
      response.data.values || [];

    let recibosHoy = 0;
    let usdHoy = 0;
    let actuacionesHoy = 0;

    rows
      .slice(1)
      .forEach((row) => {

        const fecha =
          row[0]
            ?.split(",")[0]
            ?.trim();

        const cajaFila =
          row[8];

        const estado =
          row[10];

        if (
          fecha === hoy &&
          cajaFila === caja &&
          estado === "GENERADO"
        ) {

          recibosHoy++;

          usdHoy += Number(
            row[6] || 0
          );

          actuacionesHoy +=
            (row[5] || "")
              .split(";")
              .filter(
  (x: string) =>
    x.trim() !== ""
)
              .length;

        }

      });

    return NextResponse.json({

      ok: true,

      recibosHoy,

      usdHoy,

      actuacionesHoy,

    });

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}