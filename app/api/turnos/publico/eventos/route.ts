import { NextRequest, NextResponse } from "next/server";
import {
  CANAL_EVENTOS_TURNERO,
  obtenerLlamadosPublicos,
  solicitarVinculacionDispositivo,
} from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const DURACION_STREAM_MS = 240_000;

type EventoTurnero = { tipo?: string; deviceId?: string; accion?: string };

function extraerMensajeRedis(data: string) {
  if (!data.startsWith("message,")) return "";
  const primerSeparador = data.indexOf(",");
  const segundoSeparador = data.indexOf(",", primerSeparador + 1);
  return segundoSeparador < 0 ? "" : data.slice(segundoSeparador + 1);
}

function respuestaSinVinculo(estado: { vinculado: boolean; codigo?: string }) {
  return NextResponse.json(
    { tipo: "estado", ...estado, llamados: [] },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: NextRequest) {
  let deviceId = "";
  let tokenDispositivo = "";
  try {
    const body = await request.json();
    deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    tokenDispositivo = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9-]{36}$/i.test(deviceId) || !/^[a-f0-9]{64}$/i.test(tokenDispositivo)) {
      console.info("Turnero público: acceso rechazado", { status: 401, motivo: "credenciales_invalidas" });
      return NextResponse.json({ ok: false, error: "Dispositivo no valido." }, { status: 401 });
    }

    // Una pantalla sin vínculo recibe su código por JSON y no ocupa una función
    // ni una suscripción Redis mientras espera que un administrador la vincule.
    const estadoInicial = await solicitarVinculacionDispositivo(deviceId, tokenDispositivo);
    if (!estadoInicial.vinculado) {
      const estado = estadoInicial;
      return respuestaSinVinculo(estado);
    }

    const url = process.env.KV_REST_API_URL;
    const redisToken = process.env.KV_REST_API_TOKEN;
    if (!url || !redisToken) {
      console.error("Turnero público: configuración Redis incompleta", {
        urlConfigurada: Boolean(url), tokenConfigurado: Boolean(redisToken),
      });
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const upstream = await fetch(`${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(CANAL_EVENTOS_TURNERO)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, Accept: "text/event-stream" },
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) {
      console.warn("Turnero público: suscripción Redis rechazada", { status: upstream.status });
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    // Revalidar después de suscribirse evita la carrera entre el chequeo y la
    // apertura del stream, sin perder un evento de vinculación.
    const estadoActual = await solicitarVinculacionDispositivo(deviceId, tokenDispositivo);
    if (!estadoActual.vinculado) {
      await upstream.body.cancel().catch(() => undefined);
      return respuestaSinVinculo(estadoActual);
    }

    const llamados = await obtenerLlamadosPublicos();
    let dispositivoVinculado = true;
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();
    let cerrado = false;
    let limiteStream: ReturnType<typeof setTimeout> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enviar = (data: unknown) => {
          if (!cerrado) controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        const cerrar = async (motivo: string) => {
          if (cerrado) return;
          cerrado = true;
          if (limiteStream) clearTimeout(limiteStream);
          console.info("Turnero público: stream finalizado", { motivo });
          try { controller.close(); } catch { /* El consumidor ya cerró el stream. */ }
          try { await reader.cancel(); } catch { /* El upstream pudo terminar primero. */ }
        };

        enviar({ tipo: "estado", ...estadoActual, llamados });
        limiteStream = setTimeout(() => { void cerrar("limite_de_duracion"); }, DURACION_STREAM_MS);
        let buffer = "";
        const decoder = new TextDecoder();
        try {
          while (!cerrado) {
            const { value, done } = await reader.read();
            if (done) {
              await cerrar("upstream_eof");
              break;
            }
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
                const estado = await solicitarVinculacionDispositivo(deviceId, tokenDispositivo);
                dispositivoVinculado = estado.vinculado;
                if (!estado.vinculado) {
                  enviar({ tipo: "estado", ...estado, llamados: [] });
                  await cerrar("dispositivo_desvinculado");
                  break;
                }
                enviar({ tipo: "estado", vinculado: true, codigo: "", llamados: await obtenerLlamadosPublicos() });
              } else if (evento.tipo === "actualizacion" && evento.accion === "llamar" && dispositivoVinculado) {
                enviar({ tipo: "llamados", llamados: await obtenerLlamadosPublicos() });
              }
            }
          }
        } catch (error) {
          if (!request.signal.aborted) {
            console.warn("Turnero público: error leyendo stream", {
              tipo: error instanceof Error ? error.name : "unknown",
            });
          }
          await cerrar(request.signal.aborted ? "cliente_cancelado" : "error_lectura");
        } finally {
          try { reader.releaseLock(); } catch { /* El lector pudo liberar el lock. */ }
        }
      },
      async cancel() {
        if (!cerrado) {
          cerrado = true;
          if (limiteStream) clearTimeout(limiteStream);
          console.info("Turnero público: stream finalizado", { motivo: "cliente_cancelado" });
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
    console.warn("Turnero público: no fue posible iniciar el stream", {
      tipo: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ ok: false, error: "No fue posible conectar con el turnero." }, { status: 503 });
  }
}
