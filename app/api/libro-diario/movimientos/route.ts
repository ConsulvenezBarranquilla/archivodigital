import { NextRequest, NextResponse } from "next/server";

import {
  obtenerMovimientosManuales,
  registrarMovimientoLibro,
} from "@/lib/services/LibroDiario/libroDiarioService";

export async function GET() {

  try {

    const movimientos =
      await obtenerMovimientosManuales();

    return NextResponse.json({

      ok: true,

      movimientos,

    });

  } catch (error: any) {

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

export async function POST(

  request: NextRequest

) {

  try {

    const body =
      await request.json();

    await registrarMovimientoLibro(body);

    return NextResponse.json({

      ok: true,

    });

  } catch (error: any) {

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