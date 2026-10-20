import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { CANAL_EVENTOS_TURNERO } from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function permisoCola(rol: string) {
  return rol === "admin" ||
    (rol === "recepcion" && tienePermiso(rol, "recepcion")) ||
    (rol === "caja" && tienePermiso(rol, "caja")) ||
    (rol === "analista" && tienePermiso(rol, "atencion"));
}

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false }, { status: 401 });
  if (!permisoCola(sesion.rol)) return NextResponse.json({ ok: false }, { status: 403 });

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const upstream = await fetch(`${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(CANAL_EVENTOS_TURNERO)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ ok: false }, { status: 503 });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
