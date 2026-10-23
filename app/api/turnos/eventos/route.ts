import { NextResponse } from "next/server";
import { obtenerSesion, type UsuarioSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { CANAL_EVENTOS_TURNERO } from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const DURACION_STREAM_MS = 240_000;

function permisoCola(rol: string) {
  return rol === "admin" ||
    (rol === "recepcion" && tienePermiso(rol, "recepcion")) ||
    (rol === "caja" && tienePermiso(rol, "caja")) ||
    (rol === "analista" && tienePermiso(rol, "atencion"));
}

export async function GET(request: Request) {
  let sesion: UsuarioSesion | null;
  try {
    sesion = await obtenerSesion();
  } catch (error) {
    console.warn("Turnero interno: falló la verificación de sesión", {
      tipo: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!sesion) {
    console.info("Turnero interno: acceso rechazado", { status: 401, motivo: "sesion_invalida" });
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!permisoCola(sesion.rol)) {
    console.info("Turnero interno: acceso rechazado", { status: 403, motivo: "permiso_insuficiente" });
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error("Turnero interno: configuración Redis incompleta", {
      urlConfigurada: Boolean(url), tokenConfigurado: Boolean(token),
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const upstream = await fetch(`${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(CANAL_EVENTOS_TURNERO)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) {
      console.warn("Turnero interno: suscripción Redis rechazada", { status: upstream.status });
      await upstream.body?.cancel().catch(() => undefined);
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const reader = upstream.body.getReader();
    let terminado = false;
    let limiteStream: ReturnType<typeof setTimeout> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const cerrar = async (motivo: string) => {
          if (terminado) return;
          terminado = true;
          if (limiteStream) clearTimeout(limiteStream);
          console.info("Turnero interno: stream finalizado", { motivo });
          try { controller.close(); } catch { /* El cliente ya cerró la respuesta. */ }
          try { await reader.cancel(); } catch { /* El upstream pudo terminar primero. */ }
        };
        limiteStream = setTimeout(() => { void cerrar("limite_de_duracion"); }, DURACION_STREAM_MS);
        let motivo = "upstream_eof";
        try {
          while (!terminado) {
            const { value, done } = await reader.read();
            if (done) {
              await cerrar("upstream_eof");
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          motivo = request.signal.aborted ? "cliente_cancelado" : "error_lectura";
          if (!request.signal.aborted) {
            console.warn("Turnero interno: error durante stream", {
              tipo: error instanceof Error ? error.name : "unknown",
            });
          }
          await cerrar(motivo);
        } finally {
          if (limiteStream) clearTimeout(limiteStream);
          try { reader.releaseLock(); } catch { /* Puede estar liberado por cancelación. */ }
        }
      },
      async cancel() {
        if (!terminado) {
          terminado = true;
          if (limiteStream) clearTimeout(limiteStream);
          console.info("Turnero interno: stream finalizado", { motivo: "cliente_cancelado" });
        }
        try { await reader.cancel(); } catch { /* El upstream pudo cerrarse primero. */ }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.warn("Turnero interno: no fue posible iniciar la suscripción", {
      tipo: error instanceof Error ? error.name : "unknown",
      cancelado: request.signal.aborted,
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
