import { NextRequest, NextResponse } from "next/server";
import { solicitarVinculacionDispositivo } from "@/lib/turnero";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9-]{36}$/i.test(deviceId) || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ ok: false, error: "Identificador de pantalla no válido." }, { status: 400 });
    }
    const estado = await solicitarVinculacionDispositivo(deviceId, token);
    return NextResponse.json({ ok: true, ...estado }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Error registrando pantalla del turnero:", error);
    return NextResponse.json({ ok: false, error: "No fue posible registrar esta pantalla." }, { status: 503 });
  }
}
