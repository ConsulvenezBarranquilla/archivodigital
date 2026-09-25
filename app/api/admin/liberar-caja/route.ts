import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  exigirPermiso,
} from "@/lib/autorizacion";

import {
  liberarCajaAdministrativamente,
} from "@/lib/bloqueo-caja";

export async function POST(
  request: NextRequest
) {
  const autorizacion =
    await exigirPermiso("admin");

  if (autorizacion.respuesta) {
    return autorizacion.respuesta;
  }

  try {
    const body =
      await request.json();

    const caja = String(
      body?.caja ?? ""
    ).trim();

    if (
      caja !== "Caja 1" &&
      caja !== "Caja 2"
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Caja no válida.",
        },
        {
          status: 400,
        }
      );
    }

    const liberada =
      await liberarCajaAdministrativamente(
        caja
      );

    return NextResponse.json({
      ok: true,
      caja,
      liberada,
      mensaje:
        liberada
          ? `El bloqueo de ${caja} fue liberado correctamente.`
          : `No existía un bloqueo activo para ${caja}.`,
    });

  } catch (error) {
    console.error(
      "Error liberando caja administrativamente:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No fue posible liberar la caja.",
      },
      {
        status: 500,
      }
    );
  }
}