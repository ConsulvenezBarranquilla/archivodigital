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

import {
  exigirPermiso,
} from "@/lib/autorizacion";

export async function GET(
  req: NextRequest
) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

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

const detalleResponse =
  await sheets.spreadsheets.values.get({

    spreadsheetId: MODULO_CAJA_SHEET_ID,

    range: "DetalleCaja!A:H",

  });

const detalleCaja =
  detalleResponse.data.values || [];

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

        detalleCaja,

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