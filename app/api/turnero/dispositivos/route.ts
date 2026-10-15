import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { desvincularDispositivo, listarDispositivosVinculados, vincularDispositivo } from "@/lib/turnero";

export const dynamic = "force-dynamic";

async function admin() {
  const session = await obtenerSesion();
  return session?.rol === "admin" ? session : null;
}

export async function GET() {
  if (!await admin()) return NextResponse.json({ ok: false, error: "Acceso restringido a administradores." }, { status: 403 });
  try {
    return NextResponse.json({ ok: true, dispositivos: await listarDispositivosVinculados() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error listando pantallas vinculadas:", error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar las pantallas." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!await admin()) return NextResponse.json({ ok: false, error: "Acceso restringido a administradores." }, { status: 403 });
  try {
    const body = await request.json();
    const codigo = typeof body.codigo === "string" ? body.codigo.replace(/\s/g, "") : "";
    if (!/^\d{6}$/.test(codigo)) return NextResponse.json({ ok: false, error: "Ingresa el código de seis dígitos mostrado en la pantalla." }, { status: 400 });
    const vinculacion = await vincularDispositivo(codigo);
    return NextResponse.json({ ok: true, ...vinculacion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible vincular la pantalla.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await admin()) return NextResponse.json({ ok: false, error: "Acceso restringido a administradores." }, { status: 403 });
  try {
    const deviceId = new URL(request.url).searchParams.get("deviceId") || "";
    if (!/^[a-f0-9-]{36}$/i.test(deviceId)) return NextResponse.json({ ok: false, error: "Identificador de pantalla no válido." }, { status: 400 });
    await desvincularDispositivo(deviceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error desvinculando pantalla:", error);
    return NextResponse.json({ ok: false, error: "No fue posible desvincular la pantalla." }, { status: 503 });
  }
}
