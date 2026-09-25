import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuariosCaja } from "@/lib/googleSheets";
import { crearSesion } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const usuarioIngresado = String(
      body?.usuario ?? ""
    ).trim();

    const passwordIngresado = String(
      body?.password ?? ""
    ).trim();

    if (!usuarioIngresado || !passwordIngresado) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Debe ingresar usuario y contraseña.",
        },
        { status: 400 }
      );
    }

    const rows = await obtenerUsuariosCaja();

    const encontrado = rows.find((row, index) => {
      if (index === 0) return false;

      const usuario = String(row[0] ?? "")
        .trim()
        .toUpperCase();

      const password = String(row[1] ?? "").trim();

      const activo = String(row[4] ?? "")
        .trim()
        .toUpperCase();

      return (
        usuario === usuarioIngresado.toUpperCase() &&
        password === passwordIngresado &&
        activo === "SI"
      );
    });

    if (!encontrado) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Usuario o contraseña incorrectos.",
        },
        { status: 401 }
      );
    }

    const usuario = String(
      encontrado[0] ?? ""
    ).trim();

    const nombre = String(
      encontrado[2] ?? ""
    ).trim();

    const rol = String(
      encontrado[3] ?? ""
    )
      .trim()
      .toLowerCase();

    /*
     * La caja no se obtiene de la hoja UsuariosCaja.
     *
     * Los usuarios con rol "caja" y "admin"
     * seleccionan la caja posteriormente desde
     * la pantalla de ingreso.
     */

    await crearSesion({
      usuario,
      nombre,
      rol,
    });

    return NextResponse.json({
      ok: true,
      usuario,
      nombre,
      rol,
    });
  } catch (error) {
    console.error("Error en login:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No fue posible procesar el inicio de sesión.",
      },
      { status: 500 }
    );
  }
}