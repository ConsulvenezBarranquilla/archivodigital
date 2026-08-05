import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import {
  obtenerConfiguracionLibro,
  obtenerMovimientosManuales,
} from "@/lib/services/LibroDiario/libroDiarioService";

import {
  construirLibroDiario,
} from "@/lib/services/LibroDiario/libroDiarioCalculos";

export async function GET(
  req: NextRequest
) {

  try {

    const periodo =
      req.nextUrl.searchParams.get("periodo") ?? "";

    const configuracion =
      await obtenerConfiguracionLibro();

    const movimientos =
      await obtenerMovimientosManuales();

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: MODULO_CAJA_SHEET_ID,

        range: "Caja!A:N",

      });

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId: MODULO_CAJA_SHEET_ID,

        range: "GestionConsular!A:L",

      });

    const caja =
      cajaResponse.data.values || [];

    const gestion =
      gestionResponse.data.values || [];

    const libro =
      construirLibroDiario(

        periodo,

        configuracion,

        gestion,

        caja,

        movimientos

      );

    return NextResponse.json({

      ok: true,

      libro,

    });

  }

  catch (error: any) {

    return NextResponse.json(

      {

        ok: false,

        error: error.message,

      },

      {

        status: 500,

      }

    );

  }

}