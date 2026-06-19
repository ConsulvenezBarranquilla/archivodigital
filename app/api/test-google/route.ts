import { NextResponse } from "next/server";
import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {
  try {

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: "Respuestas de formulario 1!A2:N5",
      });

    return NextResponse.json({
      ok: true,
      values: response.data.values,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error: error.message,
      details: error.errors || null,
    });

  }
}