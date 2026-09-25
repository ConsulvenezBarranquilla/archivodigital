import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentosCaja,
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
          MODULO_CAJA_SHEET_ID,

        range:
          "Configuracion!A:B",
      });

    const rows =
      response.data.values || [];

    const configuracion: any = {};

    rows.slice(1).forEach(
      (row) => {

        configuracion[
          row[0]
        ] = row[1];

      }
    );

    return NextResponse.json({
      ok: true,
      configuracion,
    });

  } catch (error: any) {

    console.error(
      "Error obteniendo configuración:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "No fue posible obtener la configuración.",
      },
      {
        status: 500,
      }
    );

  }

}

export async function POST(
  req: NextRequest
) {

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

    const {
      guardarPdfDrive,
    } = await req.json();

    await sheets.spreadsheets.values.update({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "Configuracion!B2",

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [
          [
            guardarPdfDrive,
          ],
        ],
      },
    });

    return NextResponse.json({
      ok: true,
    });

  } catch (error: any) {

    console.error(
      "Error guardando configuración:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "No fue posible guardar la configuración.",
      },
      {
        status: 500,
      }
    );

  }

}