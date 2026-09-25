import { NextResponse } from "next/server";

import {
  cerrarSesion,
  obtenerSesion,
} from "@/lib/auth";

import {
  liberarCajasUsuario,
} from "@/lib/bloqueo-caja";

export async function POST() {
  try {

    const sesion =
      await obtenerSesion();

    /*
     * Antes de cerrar la sesión debemos
     * liberar ambas cajas asociadas
     * al usuario.
     */
    if (
      sesion &&
      sesion.usuario
    ) {

      const resultado =
        await liberarCajasUsuario(
          sesion.usuario
        );

      console.log(
        "Liberación de cajas del usuario:",
        {
          usuario:
            sesion.usuario,
          liberadas:
            resultado.liberadas,
        }
      );

    }

    /*
     * Cerrar la sesión después de
     * liberar las cajas.
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