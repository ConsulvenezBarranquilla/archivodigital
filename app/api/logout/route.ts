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
     * Antes de cerrar la sesión debemos
     * liberar cualquier caja asociada
     * a la sesión.
     */
    if (
      sesion &&
      sesion.caja &&
      sesion.sessionId
    ) {

      const liberada =
        await liberarCaja(
          sesion.caja,
          sesion.sessionId
        );

      console.log(
        "Liberación de caja:",
        {
          caja: sesion.caja,
          sessionId: sesion.sessionId,
          liberada,
        }
      );
    }

    /*
     * Cerrar la sesión después de
     * liberar la caja.
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