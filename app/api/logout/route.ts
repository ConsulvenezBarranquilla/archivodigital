import { NextResponse } from "next/server";
import {
  cerrarSesion,
  obtenerSesion,
} from "@/lib/auth";
import { liberarCaja } from "@/lib/bloqueo-caja";

export async function POST() {
  try {
    const sesion =
      await obtenerSesion();

    /*
     * Los usuarios con rol "caja" ocupan
     * un bloqueo exclusivo en Redis.
     *
     * Antes de cerrar la sesión debemos
     * liberar ese bloqueo.
     */
    if (
      sesion &&
      sesion.rol === "caja" &&
      sesion.caja &&
      sesion.sessionId
    ) {
      await liberarCaja(
        sesion.caja,
        sesion.sessionId
      );
    }

    /*
     * Los administradores no tienen bloqueo
     * exclusivo de caja, por lo que no
     * realizan ninguna operación en Redis.
     */

    await cerrarSesion();

    return NextResponse.json({
      ok: true,
      mensaje:
        "Sesión cerrada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No fue posible cerrar la sesión.",
      },
      { status: 500 }
    );
  }
}