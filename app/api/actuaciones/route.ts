import { NextResponse } from "next/server";
import { obtenerActuaciones } from "@/lib/googleSheets";

export async function GET() {
  try {

    const rows = await obtenerActuaciones();

    const actuaciones = rows
      .slice(1)
      .filter(
        (row) =>
          row[3]?.toUpperCase() === "SI"
      )
      .map((row) => ({
        codigo: row[0],
        actuacion: row[1],
        monto: row[2],
      }));

    return NextResponse.json({
      ok: true,
      actuaciones,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error: error.message,
    });

  }
}