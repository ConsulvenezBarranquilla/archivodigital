import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          autenticado: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      autenticado: true,
      usuario: sesion.usuario,
      nombre: sesion.nombre,
      rol: sesion.rol,
      caja: sesion.caja,
    });
  } catch (error) {
    console.error("Error al consultar sesión:", error);

    return NextResponse.json(
      {
        ok: false,
        autenticado: false,
      },
      { status: 500 }
    );
  }
}