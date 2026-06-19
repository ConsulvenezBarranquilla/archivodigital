import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function PUT(
  req: NextRequest
) {

  try {

    const {
      usuario,
      password,
    } = await req.json();

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "UsuariosCaja!A:F",
      });

    const rows =
      response.data.values || [];

    let fila = -1;

    rows.forEach(
      (
        row,
        index
      ) => {

        if (
          index > 0 &&
          row[0] === usuario
        ) {

          fila =
            index + 1;

        }

      }
    );

    if (
      fila === -1
    ) {

      return NextResponse.json({
        ok: false,
        error:
          "Usuario no encontrado",
      });

    }

    await sheets.spreadsheets.values.update({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `UsuariosCaja!B${fila}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [[
          password,
        ]],
      },
    });

    return NextResponse.json({
      ok: true,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}