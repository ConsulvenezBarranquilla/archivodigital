import { NextRequest, NextResponse } from "next/server";

import {
  obtenerDetalleOperacion,
} from "@/lib/services/LibroDiario/libroDiarioService";

import {
  exigirPermiso,
} from "@/lib/autorizacion";

interface Params {

  params: Promise<{

    referencia: string;

  }>;

}

export async function GET(

  request: NextRequest,

  { params }: Params

) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

    const { referencia } = await params;

    const detalle =

      await obtenerDetalleOperacion(

        referencia

      );

    return NextResponse.json({

      ok: true,

      detalle,

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