import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuariosCaja } from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {
  try {

    const {
      usuario,
      password,
    } = await req.json();

    const rows =
      await obtenerUsuariosCaja();

    const encontrado =
      rows.find(
        (row, index) => {

          if (index === 0)
            return false;

          return (

  row[0]
    ?.trim()
    .toUpperCase() ===
  usuario
    .trim()
    .toUpperCase() &&

  row[1]
    ?.trim() ===
  password.trim() &&

  row[4]
    ?.trim()
    .toUpperCase() === "SI"

);

        }
      );

    if (!encontrado) {

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Usuario o contraseña incorrectos",
        },
        {
          status: 401,
        }
      );

    }

    return NextResponse.json({
  ok: true,
  usuario: encontrado[0],
  nombre: encontrado[2],
  rol: encontrado[3],
  caja: encontrado[5],
  debug: encontrado,
});

  } catch (error: any) {

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error.message,
      },
      {
        status: 500,
      }
    );

  }
}