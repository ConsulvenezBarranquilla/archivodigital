import { NextRequest, NextResponse } from "next/server";

import {
  obtenerMovimientosManuales,
  registrarMovimientoLibro,
} from "@/lib/services/LibroDiario/libroDiarioService";

import {
  exigirPermiso,
} from "@/lib/autorizacion";

export async function GET() {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

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

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

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