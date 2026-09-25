import { NextResponse } from "next/server";

import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

import { obtenerSesion } from "@/lib/auth";

export async function GET() {

  try {

    // ============================================
    // VALIDAR SESIÓN
    // ============================================

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

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,
        range:
          "Catalogos!A:D",
      });

    const rows =
      response.data.values || [];

    const nacionalidades =
      rows
        .slice(1)
        .map((r) => r[0])
        .filter(Boolean);

    const paises =
      rows
        .slice(1)
        .map((r) => r[1])
        .filter(Boolean);

    const estadosCivil =
      rows
        .slice(1)
        .map((r) => r[2])
        .filter(Boolean);

    const generos =
      rows
        .slice(1)
        .map((r) => r[3])
        .filter(Boolean);

    return NextResponse.json({

      ok: true,

      nacionalidades,

      paises,

      estadosCivil,

      generos,

    });

  } catch (error: any) {

    console.error(
      "Error obteniendo catálogos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "No fue posible obtener los catálogos.",
      },
      {
        status: 500,
      }
    );

  }

}