import { NextResponse } from "next/server";

import { obtenerSesion } from "@/lib/auth";
import { obtenerActuaciones } from "@/lib/googleSheets";

export async function GET() {
  try {

    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sesión no válida o expirada.",
        },
        {
          status: 401,
        }
      );
    }

    const rows =
      await obtenerActuaciones();

    const actuaciones =
      rows
        .slice(1)
        .filter(
          (row) =>
            row[3]?.toUpperCase() === "SI"
        )
        .map((row) => ({
          codigo: row[0],
          actuacion: row[1],
          monto: row[2],
          abreviacion: row[4] || "",
        }));

    return NextResponse.json({
      ok: true,
      actuaciones,
    });

  } catch (error: any) {

    console.error(
      "Error obteniendo actuaciones:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "No fue posible obtener las actuaciones.",
      },
      {
        status: 500,
      }
    );

  }
}