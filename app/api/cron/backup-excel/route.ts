import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { crearRespaldosGoogleSheets } from "@/lib/respaldoGoogleSheets";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const esperado = cronSecret ? `Bearer ${cronSecret}` : "";

  if (
    !esperado ||
    Buffer.byteLength(authorization) !== Buffer.byteLength(esperado) ||
    !timingSafeEqual(Buffer.from(authorization), Buffer.from(esperado))
  ) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const respaldo = await crearRespaldosGoogleSheets();
    return NextResponse.json({
      ok: true,
      cantidad: respaldo.respaldos.length,
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en respaldo automático de Google Sheets:", error);
    return NextResponse.json(
      { ok: false, error: "No fue posible guardar el respaldo automático." },
      { status: 500 }
    );
  }
}
