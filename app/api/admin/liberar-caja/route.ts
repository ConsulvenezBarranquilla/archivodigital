import {
  NextResponse,
} from "next/server";

import {
  exigirPermiso,
} from "@/lib/autorizacion";

import {
  cerrarTodasLasSesiones,
} from "@/lib/auth";

import {
  liberarTodasLasCajasAdministrativamente,
} from "@/lib/bloqueo-caja";

export async function POST() {

  const autorizacion =
    await exigirPermiso("admin");

  if (autorizacion.respuesta) {
    return autorizacion.respuesta;
  }

  try {

    const sesionesCerradas =
      await cerrarTodasLasSesiones();

    const cajasLiberadas =
      await liberarTodasLasCajasAdministrativamente();

    return NextResponse.json({
      ok: true,

      sesionesCerradas,

      cajasLiberadas,

      mensaje:
        "Se cerraron todas las sesiones activas y se liberaron las cajas ocupadas.",
    });

  } catch (error) {

    console.error(
      "Error realizando limpieza administrativa de sesiones y cajas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        mensaje:
          "No fue posible completar la limpieza administrativa.",
      },
      {
        status: 500,
      }
    );

  }
}