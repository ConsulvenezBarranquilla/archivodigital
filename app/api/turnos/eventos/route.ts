
import { NextResponse } from "next/server";
import { obtenerSesion, type UsuarioSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { CANAL_EVENTOS_TURNERO } from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DURACION_STREAM_MS = 240_000;

function permisoCola(rol: string) {
  return (
    rol === "admin" ||
    (rol === "recepcion" && tienePermiso(rol, "recepcion")) ||
    (rol === "caja" && tienePermiso(rol, "caja")) ||
    (rol === "analista" && tienePermiso(rol, "atencion"))
  );
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
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!permisoCola(sesion.rol)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.error("Turnero interno: configuración Redis incompleta", {
      urlConfigurada: Boolean(url),
      tokenConfigurado: Boolean(token),
    });

    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (request.signal.aborted) {
    return new Response(null, { status: 204 });
  }

  let upstream: Response;

  try {
    upstream = await fetch(
      `${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(
        CANAL_EVENTOS_TURNERO
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        cache: "no-store",
        signal: request.signal,
      }
    );
  } catch (error) {
    console.warn("Turnero interno: no fue posible iniciar la suscripción", {
      tipo: error instanceof Error ? error.name : "unknown",
      cancelado: request.signal.aborted,
    });

    return NextResponse.json(
      { ok: false },
      { status: request.signal.aborted ? 499 : 503 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    console.warn("Turnero interno: suscripción Redis rechazada", {
      status: upstream.status,
    });

    await upstream.body?.cancel().catch(() => undefined);

    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const reader = upstream.body.getReader();

  let terminado = false;
  let limiteStream: ReturnType<typeof setTimeout> | undefined;

  const cerrar = async (controller?: ReadableStreamDefaultController<Uint8Array>) => {
    if (terminado) return;

    terminado = true;

    if (limiteStream) {
      clearTimeout(limiteStream);
      limiteStream = undefined;
    }

    try {
      controller?.close();
    } catch {
      // El cliente pudo cerrar previamente la conexión.
    }

    try {
      await reader.cancel();
    } catch {
      // Redis pudo cerrar la conexión previamente.
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      limiteStream = setTimeout(() => {
        void cerrar(controller);
      }, DURACION_STREAM_MS);

      const leer = async () => {
        try {
          while (!terminado) {
            const { value, done } = await reader.read();

            if (done) {
              await cerrar(controller);
              break;
            }

            if (value && !terminado) {
              controller.enqueue(value);
            }
          }
        } catch (error) {
          if (!request.signal.aborted && !terminado) {
            console.warn("Turnero interno: error durante stream", {
              tipo: error instanceof Error ? error.name : "unknown",
            });
          }

          await cerrar(controller);
        } finally {
          if (limiteStream) {
            clearTimeout(limiteStream);
            limiteStream = undefined;
          }

          try {
            reader.releaseLock();
          } catch {
            // El lector pudo quedar liberado por cancelación.
          }
        }
      };

      void leer();
    },

    async cancel() {
      await cerrar();
    },
  });

  request.signal.addEventListener(
    "abort",
    () => {
      void cerrar();
    },
    { once: true }
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
