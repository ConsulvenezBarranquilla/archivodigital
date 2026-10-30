
import { NextRequest, NextResponse } from "next/server";
import {
  CANAL_EVENTOS_TURNERO,
  obtenerLlamadosPublicos,
  solicitarVinculacionDispositivo,
} from "@/lib/turnero";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DURACION_STREAM_MS = 240_000;

type EventoTurnero = {
  tipo?: string;
  deviceId?: string;
  accion?: string;
};

function extraerMensajeRedis(data: string) {
  if (!data.startsWith("message,")) return "";

  const primerSeparador = data.indexOf(",");
  const segundoSeparador = data.indexOf(",", primerSeparador + 1);

  return segundoSeparador < 0
    ? ""
    : data.slice(segundoSeparador + 1);
}

function respuestaSinVinculo(estado: {
  vinculado: boolean;
  codigo?: string;
}) {
  return NextResponse.json(
    { tipo: "estado", ...estado, llamados: [] },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  let deviceId = "";
  let tokenDispositivo = "";

  try {
    const body = await request.json();

    deviceId =
      typeof body.deviceId === "string" ? body.deviceId : "";

    tokenDispositivo =
      typeof body.token === "string" ? body.token : "";

    if (
      !/^[a-f0-9-]{36}$/i.test(deviceId) ||
      !/^[a-f0-9]{64}$/i.test(tokenDispositivo)
    ) {
      return NextResponse.json(
        { ok: false, error: "Dispositivo no valido." },
        { status: 401 }
      );
    }

    const estadoInicial = await solicitarVinculacionDispositivo(
      deviceId,
      tokenDispositivo
    );

    if (!estadoInicial.vinculado) {
      return respuestaSinVinculo(estadoInicial);
    }

    const url = process.env.KV_REST_API_URL;
    const redisToken = process.env.KV_REST_API_TOKEN;

    if (!url || !redisToken) {
      console.error("Turnero público: configuración Redis incompleta", {
        urlConfigurada: Boolean(url),
        tokenConfigurado: Boolean(redisToken),
      });

      return NextResponse.json({ ok: false }, { status: 503 });
    }

    if (request.signal.aborted) {
      return new Response(null, { status: 204 });
    }

    const upstream = await fetch(
      `${url.replace(/\/$/, "")}/subscribe/${encodeURIComponent(
        CANAL_EVENTOS_TURNERO
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          Accept: "text/event-stream",
        },
        cache: "no-store",
        signal: request.signal,
      }
    );

    if (!upstream.ok || !upstream.body) {
      console.warn("Turnero público: suscripción Redis rechazada", {
        status: upstream.status,
      });

      await upstream.body?.cancel().catch(() => undefined);

      return NextResponse.json({ ok: false }, { status: 503 });
    }

    // Se conserva la segunda validación para evitar perder
    // un evento de vinculación durante la apertura del stream.
    const estadoActual = await solicitarVinculacionDispositivo(
      deviceId,
      tokenDispositivo
    );

    if (!estadoActual.vinculado) {
      await upstream.body.cancel().catch(() => undefined);
      return respuestaSinVinculo(estadoActual);
    }

    const llamadosIniciales = await obtenerLlamadosPublicos();

    if (request.signal.aborted) {
      await upstream.body.cancel().catch(() => undefined);
      return new Response(null, { status: 204 });
    }

    const reader = upstream.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let cerrado = false;
    let dispositivoVinculado = true;
    let limiteStream: ReturnType<typeof setTimeout> | undefined;

    let buffer = "";

    let cerrarStream: (
      motivo: string,
      controller?: ReadableStreamDefaultController<Uint8Array>
    ) => Promise<void>;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enviar = (data: unknown) => {
          if (cerrado) return;

          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            void cerrarStream("error_envio");
          }
        };

        cerrarStream = async (motivo, controlador) => {
          if (cerrado) return;

          cerrado = true;

          if (limiteStream) {
            clearTimeout(limiteStream);
            limiteStream = undefined;
          }

          console.info("Turnero público: stream finalizado", {
            motivo,
          });

          try {
            controlador?.close();
          } catch {
            // El cliente ya pudo cerrar la conexión.
          }

          try {
            await reader.cancel();
          } catch {
            // Redis pudo cerrar antes la conexión.
          }
        };

        const procesarEvento = async (evento: EventoTurnero) => {
          if (cerrado) return;

          if (
            evento.tipo === "dispositivo" &&
            evento.deviceId === deviceId
          ) {
            const estado = await solicitarVinculacionDispositivo(
              deviceId,
              tokenDispositivo
            );

            dispositivoVinculado = estado.vinculado;

            if (!estado.vinculado) {
              enviar({
                tipo: "estado",
                ...estado,
                llamados: [],
              });

              await cerrarStream(
                "dispositivo_desvinculado",
                controller
              );

              return;
            }

            const llamados = await obtenerLlamadosPublicos();

            enviar({
              tipo: "estado",
              vinculado: true,
              codigo: "",
              llamados,
            });

            return;
          }

          if (
            evento.tipo === "actualizacion" &&
            evento.accion === "llamar" &&
            dispositivoVinculado
          ) {
            const llamados = await obtenerLlamadosPublicos();

            enviar({
              tipo: "llamados",
              llamados,
            });
          }
        };

        const procesarLinea = async (linea: string) => {
          if (!linea.startsWith("data:")) return;

          const contenido = extraerMensajeRedis(
            linea.slice(5).trimStart()
          );

          if (!contenido) return;

          try {
            const evento = JSON.parse(contenido) as EventoTurnero;
            await procesarEvento(evento);
          } catch {
            // Ignorar mensajes inválidos sin interrumpir el stream.
          }
        };

        const leer = async () => {
          try {
            while (!cerrado) {
              const { value, done } = await reader.read();

              if (done) {
                await cerrarStream("upstream_eof", controller);
                break;
              }

              buffer += decoder.decode(value, { stream: true });

              const lineas = buffer.split(/\r?\n/);
              buffer = lineas.pop() ?? "";

              for (const linea of lineas) {
                if (cerrado) break;
                await procesarLinea(linea);
              }
            }
          } catch (error) {
            if (!request.signal.aborted && !cerrado) {
              console.warn("Turnero público: error leyendo stream", {
                tipo: error instanceof Error ? error.name : "unknown",
              });
            }

            await cerrarStream(
              request.signal.aborted
                ? "cliente_cancelado"
                : "error_lectura",
              controller
            );
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

        cerrarStream = async (motivo, controlador) => {
          if (cerrado) return;

          cerrado = true;

          if (limiteStream) {
            clearTimeout(limiteStream);
            limiteStream = undefined;
          }

          console.info("Turnero público: stream finalizado", {
            motivo,
          });

          try {
            controlador?.close();
          } catch {
            // El cliente ya pudo cerrar la conexión.
          }

          try {
            await reader.cancel();
          } catch {
            // Redis pudo cerrar antes la conexión.
          }
        };

        enviar({
          tipo: "estado",
          ...estadoActual,
          llamados: llamadosIniciales,
        });

        limiteStream = setTimeout(() => {
          void cerrarStream("limite_de_duracion", controller);
        }, DURACION_STREAM_MS);

        void leer();
      },

      async cancel() {
        await cerrarStream("cliente_cancelado");
      },
    });

    request.signal.addEventListener(
      "abort",
      () => {
        void cerrarStream("cliente_cancelado");
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
  } catch (error) {
    console.warn("Turnero público: no fue posible iniciar el stream", {
      tipo: error instanceof Error ? error.name : "unknown",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "No fue posible conectar con el turnero.",
      },
      { status: 503 }
    );
  }
}
