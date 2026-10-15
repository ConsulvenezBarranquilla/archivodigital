import { NextRequest, NextResponse } from "next/server";
import { dispositivoEstaVinculado, obtenerLlamadosPublicos } from "@/lib/turnero";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9-]{36}$/i.test(deviceId) || token.length < 32 || token.length > 200) {
      return NextResponse.json({ ok: false, error: "Dispositivo no vinculado." }, { status: 401 });
    }
    if (!await dispositivoEstaVinculado(deviceId, token)) {
      return NextResponse.json({ ok: false, error: "Esta pantalla no está vinculada." }, { status: 403 });
    }
    const llamados = await obtenerLlamadosPublicos();
    return NextResponse.json({ ok: true, llamados }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Error consultando llamados del turnero:", error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar los llamados." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
