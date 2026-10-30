
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Llamado = {
  id: string;
  nombre: string;
  tipo: "analista" | "caja" | "recepcion";
  caja: string;
  actualizadoEl: string;
};

type Dispositivo = {
  deviceId: string;
  token: string;
};

type EstadoTurnero = {
  tipo?: string;
  vinculado?: boolean;
  codigo?: string;
  llamados?: Llamado[];
};

const llaveLlamado = (llamado: Llamado) =>
  `${llamado.id}:${llamado.actualizadoEl}`;

function credencialesLocales(): Dispositivo {
  const key = "consulnet-turnero-device-v1";
  const saved = window.localStorage.getItem(key);

  if (saved) {
    try {
      const value = JSON.parse(saved) as Dispositivo;

      if (value.deviceId && value.token) {
        return value;
      }
    } catch {
      // Crear credenciales nuevas.
    }
  }

  const value = {
    deviceId: crypto.randomUUID(),
    token: Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (byte) => byte.toString(16).padStart(2, "0")
    ).join(""),
  };

  window.localStorage.setItem(key, JSON.stringify(value));

  return value;
}

function sonar() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      context.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.65
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.7);

    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // El navegador puede bloquear el audio.
  }
}

export default function TurneroPublicoPage() {
  const [device, setDevice] = useState<Dispositivo | null>(null);
  const [codigo, setCodigo] = useState("");
  const [vinculado, setVinculado] = useState(false);
  const [llamados, setLlamados] = useState<Llamado[]>([]);
  const [error, setError] = useState("");
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const [llamadoNuevo, setLlamadoNuevo] = useState("");

  const vistos = useRef<Set<string> | null>(null);
  const timeout = useRef<number | null>(null);
  const sonidoRef = useRef(sonidoActivo);

  useEffect(() => {
    sonidoRef.current = sonidoActivo;
  }, [sonidoActivo]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDevice(credencialesLocales());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const procesar = useCallback(
    (evento: EstadoTurnero) => {
      if (evento.tipo === "estado") {
        const estaVinculado = Boolean(evento.vinculado);

        setVinculado(estaVinculado);
        setCodigo(evento.codigo || "");

        const next =
          estaVinculado && Array.isArray(evento.llamados)
            ? evento.llamados
            : [];

        // La primera carga establece el estado inicial sin producir sonidos.
        vistos.current = new Set(next.map(llaveLlamado));
        setLlamados(next);
      } else if (
        evento.tipo === "llamados" &&
        Array.isArray(evento.llamados)
      ) {
        const next = evento.llamados;

        const nuevo = next.find(
          (item) => !vistos.current?.has(llaveLlamado(item))
        );

        if (nuevo) {
          setLlamadoNuevo(llaveLlamado(nuevo));

          if (sonidoRef.current) {
            sonar();
          }

          if (timeout.current !== null) {
            window.clearTimeout(timeout.current);
          }

          timeout.current = window.setTimeout(() => {
            timeout.current = null;
            setLlamadoNuevo("");
          }, 4500);
        }

        vistos.current = new Set(next.map(llaveLlamado));
        setLlamados(next);
      }

      setError("");
    },
    []
  );

  // Consulta el estado actual del dispositivo al recuperar la conexión.
  const recuperarEstado = useCallback(
    async (dispositivo: Dispositivo, signal?: AbortSignal) => {
      const response = await fetch("/api/turnos/publico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dispositivo),
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error(
          "No fue posible recuperar el estado del turnero."
        );
      }

      const data = await response.json();

      if (data.ok && Array.isArray(data.llamados)) {
        const next = data.llamados as Llamado[];

        // No reproducir sonidos por llamados que ocurrieron
        // mientras la pantalla estuvo suspendida.
        vistos.current = new Set(next.map(llaveLlamado));
        setLlamados(next);
      }
    },
    []
  );

  // Conexión principal: JSON periódico si no está vinculado,
  // SSE si está vinculado.
  useEffect(() => {
    if (!device) return;

    let cancelado = false;
    let controlador: AbortController | null = null;
    let esperaReconectar: number | null = null;
    let generacion = 0;

    const limpiarEspera = () => {
      if (esperaReconectar !== null) {
        window.clearTimeout(esperaReconectar);
        esperaReconectar = null;
      }
    };

    const detenerConexion = () => {
      controlador?.abort();
      controlador = null;
    };

    const esperar = (ms: number, version: number) =>
      new Promise<void>((resolve) => {
        esperaReconectar = window.setTimeout(() => {
          esperaReconectar = null;

          if (!cancelado && generacion === version) {
            resolve();
          }
        }, ms);
      });

    const conectar = async (version: number) => {
      let demoraMs = 1000;

      while (
        !cancelado &&
        generacion === version &&
        document.visibilityState === "visible"
      ) {
        const nuevoControlador = new AbortController();
        controlador = nuevoControlador;

        let esperarVinculacion = false;

        try {
          const response = await fetch(
            "/api/turnos/publico/eventos",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(device),
              cache: "no-store",
              signal: nuevoControlador.signal,
            }
          );

          if (
            response.status === 401 ||
            response.status === 403
          ) {
            setError(
              "Esta pantalla no está autorizada para consultar el turnero."
            );
            break;
          }

          if (!response.ok) {
            throw new Error(
              "No fue posible conectar con el turnero."
            );
          }

          if (
            response.headers
              .get("content-type")
              ?.includes("application/json")
          ) {
            const estado =
              (await response.json()) as EstadoTurnero;

            if (
              cancelado ||
              generacion !== version ||
              nuevoControlador.signal.aborted
            ) {
              break;
            }

            procesar(estado);
            esperarVinculacion = !estado.vinculado;
          } else if (!response.body) {
            throw new Error(
              "La conexión del turnero no entregó un flujo de eventos."
            );
          }

          if (esperarVinculacion) {
            // No se mantiene SSE cuando el dispositivo no está vinculado.
          } else if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";

            try {
              while (
                !cancelado &&
                generacion === version &&
                document.visibilityState === "visible"
              ) {
                const { value, done } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {
                  stream: true,
                });

                const bloques = buffer.split(/\r?\n\r?\n/);
                buffer = bloques.pop() ?? "";

                for (const bloque of bloques) {
                  const data = bloque
                    .split(/\r?\n/)
                    .find((linea) =>
                      linea.startsWith("data: ")
                    )
                    ?.slice(6);

                  if (!data) continue;

                  try {
                    procesar(
                      JSON.parse(data) as EstadoTurnero
                    );

                    demoraMs = 1000;
                  } catch {
                    // Ignorar mensajes incompletos o inválidos.
                  }
                }
              }
            } finally {
              try {
                await reader.cancel();
              } catch {
                // La conexión puede haberse cerrado previamente.
              }

              try {
                reader.releaseLock();
              } catch {
                // La respuesta puede haberse cancelado.
              }
            }
          }
        } catch (cause) {
          if (
            !cancelado &&
            generacion === version &&
            document.visibilityState === "visible" &&
            !nuevoControlador.signal.aborted
          ) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Error de conexión con el turnero."
            );
          }
        } finally {
          if (controlador === nuevoControlador) {
            controlador = null;
          }
        }

        if (
          cancelado ||
          generacion !== version ||
          document.visibilityState !== "visible"
        ) {
          break;
        }

        const espera = esperarVinculacion
          ? 30_000
          : demoraMs;

        await esperar(espera, version);

        if (esperarVinculacion) {
          demoraMs = 1000;
        } else {
          demoraMs = Math.min(demoraMs * 2, 30_000);
        }
      }
    };

    const iniciar = () => {
      if (
        cancelado ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      generacion++;

      limpiarEspera();
      detenerConexion();

      const version = generacion;

      void conectar(version);
    };

    const suspender = () => {
      generacion++;

      limpiarEspera();
      detenerConexion();

      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
        timeout.current = null;
      }
    };

    const manejarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        suspender();
      } else {
        iniciar();
      }
    };

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    iniciar();

    return () => {
      cancelado = true;

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );

      suspender();

      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [device, procesar]);

  // Renovación del código de vinculación.
  // Se suspende mientras la pestaña esté oculta.
  useEffect(() => {
    if (!device || vinculado || !codigo) return;

    let cancelado = false;
    let controlador: AbortController | null = null;
    let timer: number | null = null;
    let ejecutando = false;

    const renovar = async () => {
      if (
        cancelado ||
        ejecutando ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      ejecutando = true;
      controlador = new AbortController();

      try {
        const response = await fetch(
          "/api/turnero/dispositivo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(device),
            cache: "no-store",
            signal: controlador.signal,
          }
        );

        const data = await response.json();

        if (
          cancelado ||
          controlador.signal.aborted ||
          !response.ok ||
          !data.ok
        ) {
          return;
        }

        setVinculado(Boolean(data.vinculado));
        setCodigo(data.codigo || "");

        if (data.vinculado) {
          try {
            await recuperarEstado(
              device,
              controlador.signal
            );
          } catch {
            // La conexión principal recuperará el estado.
          }
        }
      } catch {
        if (
          !cancelado &&
          document.visibilityState === "visible"
        ) {
          setError(
            "No fue posible renovar el código de vinculación."
          );
        }
      } finally {
        ejecutando = false;
        controlador = null;
      }
    };

    const programar = () => {
      if (
        cancelado ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        timer = null;
        void renovar();
      }, 10 * 60 * 1000 + 1500);
    };

    const suspender = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }

      controlador?.abort();
      controlador = null;
    };

    const manejarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        suspender();
      } else {
        programar();
      }
    };

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    programar();

    return () => {
      cancelado = true;

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );

      suspender();
    };
  }, [device, vinculado, codigo, recuperarEstado]);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-5 text-white md:p-8">
      <header className="mb-6 text-center text-lg font-semibold uppercase tracking-[0.25em] text-amber-300">
        Consulado de Venezuela · Barranquilla
      </header>

      {!vinculado ? (
        <section className="m-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl md:p-14">
          <h1 className="text-3xl font-bold md:text-5xl">
            Vincular pantalla
          </h1>

          <p className="mt-4 text-lg text-slate-300">
            Ingresa este código en Configuración para autorizar el acceso al turnero.
          </p>

          <div
            aria-live="polite"
            className="my-8 rounded-2xl bg-white py-5 font-mono text-5xl font-black tracking-[0.35em] text-blue-950 md:text-7xl"
          >
            {codigo || "······"}
          </div>

          <p className="text-sm text-slate-400">
            El código se renueva automáticamente si vence.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-rose-300">
              {error}
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-4">
            <h1 className="text-3xl font-extrabold md:text-5xl">
              Turnos llamados
            </h1>

            <button
              onClick={() => {
                setSonidoActivo(true);
                sonar();
              }}
              className={`rounded-xl px-5 py-3 font-bold ${
                sonidoActivo
                  ? "bg-emerald-600"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
              aria-pressed={sonidoActivo}
            >
              {sonidoActivo
                ? "🔊 Sonido activado"
                : "🔔 Activar sonido"}
            </button>
          </div>

          {error && (
            <p
              role="status"
              className="mb-3 text-center text-amber-200"
            >
              {error}
            </p>
          )}

          <section
            aria-live="polite"
            className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2"
          >
            {[0, 1, 2, 3].map((index) => {
              const llamado = llamados[index];
              const esUltimoLlamado = index === 0;

              return llamado ? (
                <article
                  key={llaveLlamado(llamado)}
                  className={`flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border-2 p-5 text-center text-blue-950 shadow-2xl md:p-8 ${
                    llamadoNuevo === llaveLlamado(llamado)
                      ? "animate-pulse"
                      : ""
                  } ${
                    esUltimoLlamado
                      ? "border-amber-400 bg-amber-200 ring-2 ring-amber-400"
                      : "border-white bg-white"
                  }`}
                >
                  <p className="text-lg font-bold uppercase tracking-widest text-slate-500 md:text-2xl">
                    {llamado.tipo === "analista"
                      ? "Atención consular"
                      : "Pase por favor"}
                  </p>

                  <h2 className="mt-4 break-words text-3xl font-extrabold md:text-5xl">
                    {llamado.nombre}
                  </h2>

                  {llamado.tipo === "analista" ? (
                    <p className="mt-5 text-2xl font-extrabold text-amber-600 md:text-4xl">
                      Espere llamado
                    </p>
                  ) : llamado.tipo === "recepcion" ? (
                    <p className="mt-5 text-2xl font-extrabold text-amber-600 md:text-4xl">
                      Diríjase a Recepción
                    </p>
                  ) : (
                    <p className="mt-5 text-3xl font-extrabold text-amber-600 md:text-5xl">
                      {llamado.caja}
                    </p>
                  )}
                </article>
              ) : (
                <article
                  key={`vacio-${index}`}
                  className="flex min-h-[22vh] items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-900/60 text-2xl text-slate-500"
                >
                  Esperando llamado
                </article>
              );
            })}
          </section>
        </>
      )}

      <p className="mt-5 text-center text-xs text-slate-500">
        La pantalla se actualiza automáticamente.
      </p>
    </main>
  );
}
