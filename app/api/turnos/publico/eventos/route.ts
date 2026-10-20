import { NextRequest, NextResponse } from "next/server";
import {
  CANAL_EVENTOS_TURNERO,
  obtenerLlamadosPublicos,
  solicitarVinculacionDispositivo,
} from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type EventoTurnero = { tipo?: string; deviceId?: string; accion?: string };

function extraerMensajeRedis(data: string) {
  if (!data.startsWith("message,")) return "";
  const primerSeparador = data.indexOf(",");
  const segundoSeparador = data.indexOf(",", primerSeparador + 1);
  return segundoSeparador < 0 ? "" : data.slice(segundoSeparador + 1);
}

export async function POST(request: NextRequest) {
  let deviceId = "";
  let tokenDispositivo = "";
  try {
    const body = await request.json();
    deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    tokenDispositivo = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9-]{36}$/i.test(deviceId) || !/^[a-f0-9]{64}$/i.test(tokenDispositivo)) {
      return NextResponse.json({ ok: false, error: "Dispositivo no valido." }, { status: 401 });
    }

    const url = process.env.KV_REST_API_URL;
    const redisToken = process.env.KV_REST_API_TOKEN;
    if (!url || !redisToken) return NextResponse.json({ ok: false }, { status: 503 });

    // Se abre la suscripcion antes de leer el estado para no perder un llamado
    // que ocurra durante la inicializacion de la pantalla.
    const upstream = await fetch(`${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(CANAL_EVENTOS_TURNERO)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, Accept: "text/event-stream" },
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ ok: false }, { status: 503 });

    const estado = await solicitarVinculacionDispositivo(deviceId, tokenDispositivo);
    const llamados = estado.vinculado ? await obtenerLlamadosPublicos() : [];
    let dispositivoVinculado = estado.vinculado;
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let cerrado = false;
        const enviar = (data: unknown) => {
          if (!cerrado) controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        enviar({ tipo: "estado", ...estado, llamados });
        let buffer = "";
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lineas = buffer.split(/\r?\n/);
            buffer = lineas.pop() ?? "";
            for (const linea of lineas) {
              if (!linea.startsWith("data: ")) continue;
              const contenido = extraerMensajeRedis(linea.slice(6));
              if (!contenido) continue;
              let evento: EventoTurnero;
              try { evento = JSON.parse(contenido) as EventoTurnero; } catch { continue; }

              if (evento.tipo === "dispositivo" && evento.deviceId === deviceId) {
                const estadoActual = await solicitarVinculacionDispositivo(deviceId, tokenDispositivo);
                dispositivoVinculado = estadoActual.vinculado;
                const llamadosActuales = estadoActual.vinculado ? await obtenerLlamadosPublicos() : [];
                enviar({ tipo: "estado", ...estadoActual, llamados: llamadosActuales });
              } else if (evento.tipo === "actualizacion" && evento.accion === "llamar") {
                if (dispositivoVinculado) enviar({ tipo: "llamados", llamados: await obtenerLlamadosPublicos() });
              }
            }
          }
          if (!cerrado) controller.close();
        } catch {
          if (!cerrado) controller.close();
        } finally {
          cerrado = true;
          try { await reader.cancel(); } catch { /* La conexion pudo cerrarse primero. */ }
        }
      },
      async cancel() {
        try { await reader.cancel(); } catch { /* La conexion pudo cerrarse primero. */ }
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
  } catch {
    return NextResponse.json({ ok: false, error: "No fue posible conectar con el turnero." }, { status: 503 });
  }
}
