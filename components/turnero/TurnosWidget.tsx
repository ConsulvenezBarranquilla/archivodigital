
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Turno = {
  id: string;
  nombre: string;
  documento: string;
  tipoVisita: string;
  estado: "pendiente" | "llamado" | "en_atencion" | "atendido";
  cola: "visitas" | "analistas";
  etapa: string;
  actuacion: string;
  correlativo: string;
  creadoEl: string;
  cantidadActuaciones?: number;
  usuario?: string;
  llamadoEnMs?: number;
};

function segundosParaRellamar(turno: Turno, ahora: number) {
  if (turno.estado !== "llamado") return 0;

  return Math.max(
    0,
    Math.ceil(
      ((turno.llamadoEnMs || 0) + 20_000 - ahora) / 1000
    )
  );
}

export default function TurnosWidget({
  titulo = "Turnos pendientes",
  cola,
  onIniciarAtencion,
}: {
  titulo?: string;
  cola?: "visitas" | "analistas";
  onIniciarAtencion?: (turno: Turno) => void | Promise<void>;
}) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());

  const canalRef = useRef<BroadcastChannel | null>(null);
  const timerCargaRef = useRef<number | null>(null);
  const solicitudRef = useRef<Promise<void> | null>(null);
  const errorPermanenteRef = useRef(false);

  const cargar = useCallback(async () => {
    if (solicitudRef.current) return solicitudRef.current;
    if (errorPermanenteRef.current) return;

    const solicitud = (async () => {
      try {
        const response = await fetch(
          `/api/turnos${cola ? `?cola=${cola}` : ""}`,
          { cache: "no-store" }
        );

        if (response.status === 401 || response.status === 403) {
          errorPermanenteRef.current = true;
          setError(
            "La sesión no tiene permiso para consultar esta cola. Inicia sesión nuevamente."
          );
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || "No fue posible cargar la cola."
          );
        }

        setTurnos(data.turnos || []);
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar la cola."
        );
      }
    })();

    solicitudRef.current = solicitud;

    try {
      await solicitud;
    } finally {
      solicitudRef.current = null;
    }
  }, [cola]);

  const programarCarga = useCallback(() => {
    if (
      timerCargaRef.current !== null ||
      errorPermanenteRef.current ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    timerCargaRef.current = window.setTimeout(() => {
      timerCargaRef.current = null;
      void cargar();
    }, 100);
  }, [cargar]);

  useEffect(() => {
    let cancelado = false;
    let controlador: AbortController | null = null;
    let reintento: number | null = null;
    let reloj: number | null = null;
    let inicial: number | null = null;

    const cancelarTemporizadores = () => {
      if (reintento !== null) {
        window.clearTimeout(reintento);
        reintento = null;
      }

      if (inicial !== null) {
        window.clearTimeout(inicial);
        inicial = null;
      }

      if (reloj !== null) {
        window.clearInterval(reloj);
        reloj = null;
      }

      if (timerCargaRef.current !== null) {
        window.clearTimeout(timerCargaRef.current);
        timerCargaRef.current = null;
      }
    };

    const detenerConexion = () => {
      controlador?.abort();
      controlador = null;
    };

    const iniciarReloj = () => {
      if (reloj !== null) return;

      setAhora(Date.now());

      reloj = window.setInterval(() => {
        setAhora(Date.now());
      }, 1000);
    };

    const esperar = (ms: number) =>
      new Promise<void>((resolve) => {
        reintento = window.setTimeout(() => {
          reintento = null;
          resolve();
        }, ms);
      });

    const eventos = async () => {
      let demoraMs = 1000;

      while (
        !cancelado &&
        document.visibilityState === "visible" &&
        !errorPermanenteRef.current
      ) {
        const nuevoControlador = new AbortController();
        controlador = nuevoControlador;

        try {
          const response = await fetch("/api/turnos/eventos", {
            headers: {
              Accept: "text/event-stream",
            },
            cache: "no-store",
            signal: nuevoControlador.signal,
          });

          if (
            response.status === 401 ||
            response.status === 403
          ) {
            errorPermanenteRef.current = true;

            setError(
              "La sesión no tiene permiso para recibir actualizaciones del turnero. Inicia sesión nuevamente."
            );

            break;
          }

          if (!response.ok || !response.body) {
            throw new Error(
              "No fue posible recibir actualizaciones del turnero."
            );
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let buffer = "";

          try {
            while (
              !cancelado &&
              document.visibilityState === "visible"
            ) {
              const { value, done } = await reader.read();

              if (done) break;

              buffer += decoder.decode(value, {
                stream: true,
              });

              const bloques = buffer.split(/\r?\n\r?\n/);
              buffer = bloques.pop() ?? "";

              const hayEventos = bloques.some((bloque) =>
                bloque
                  .split(/\r?\n/)
                  .some((linea) => linea.startsWith("data:"))
              );

              if (hayEventos) {
                demoraMs = 1000;
                programarCarga();
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

          if (
            !cancelado &&
            document.visibilityState === "visible" &&
            !nuevoControlador.signal.aborted
          ) {
            throw new Error(
              "La conexión de eventos del turnero se cerró."
            );
          }
        } catch (cause) {
          if (
            !cancelado &&
            document.visibilityState === "visible" &&
            !nuevoControlador.signal.aborted &&
            !errorPermanenteRef.current
          ) {
            setError(
              cause instanceof Error
                ? cause.message
                : "No fue posible conectar con el turnero."
            );
          }
        } finally {
          if (controlador === nuevoControlador) {
            controlador = null;
          }
        }

        if (
          !cancelado &&
          document.visibilityState === "visible" &&
          !errorPermanenteRef.current
        ) {
          await esperar(demoraMs);
          demoraMs = Math.min(demoraMs * 2, 30_000);
        }
      }
    };

    const iniciarActividad = () => {
      if (
        cancelado ||
        document.visibilityState !== "visible" ||
        errorPermanenteRef.current
      ) {
        return;
      }

      cancelarTemporizadores();
      detenerConexion();

      iniciarReloj();

      inicial = window.setTimeout(() => {
        inicial = null;
        void cargar();
      }, 0);

      void eventos();
    };

    const suspenderActividad = () => {
      cancelarTemporizadores();
      detenerConexion();
    };

    const manejarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        suspenderActividad();
      } else {
        iniciarActividad();
      }
    };

    if (typeof BroadcastChannel !== "undefined") {
      canalRef.current = new BroadcastChannel(
        "consulnet-turnero"
      );

      canalRef.current.onmessage = (
        event: MessageEvent<{ tipo?: string }>
      ) => {
        if (event.data?.tipo === "cola-actualizada") {
          programarCarga();
        }
      };
    }

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    iniciarActividad();

    return () => {
      cancelado = true;

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );

      suspenderActividad();

      canalRef.current?.close();
      canalRef.current = null;
    };
  }, [cargar, programarCarga]);

  async function actuar(
    turno: Turno,
    accion:
      | "llamar"
      | "iniciar_atencion"
      | "finalizar_atencion"
      | "atendido"
  ) {
    if (
      accion === "llamar" &&
      turno.estado === "llamado" &&
      !window.confirm(
        `${turno.nombre} ya fue llamado. ¿Quieres volver a llamarlo?`
      )
    ) {
      return;
    }

    setOcupado(turno.id);
    setError("");

    try {
      const response = await fetch("/api/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: turno.id,
          accion,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "No fue posible actualizar el turno."
        );
      }

      canalRef.current?.postMessage({
        tipo: "cola-actualizada",
      });

      if (data.turno?.estado === "atendido") {
        setTurnos((actuales) =>
          actuales.filter((item) => item.id !== turno.id)
        );
      } else if (data.turno) {
        setTurnos((actuales) =>
          actuales.map((item) =>
            item.id === turno.id
              ? (data.turno as Turno)
              : item
          )
        );
      } else {
        programarCarga();
      }

      if (
        accion === "iniciar_atencion" &&
        turno.tipoVisita === "Trámite"
      ) {
        setAbierto(false);

        await onIniciarAtencion?.(
          (data.turno || turno) as Turno
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No fue posible actualizar el turno."
      );

      programarCarga();
    } finally {
      setOcupado("");
    }
  }

  // El turno llamado continúa en cola hasta que el operador lo marque atendido.
  const pendientes = turnos.filter(
    (turno) => turno.estado !== "atendido"
  ).length;

  if (!turnos.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAbierto(true);
          programarCarga();
        }}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-3 rounded-full bg-blue-950 px-5 py-3 font-bold text-white shadow-xl hover:bg-blue-900"
      >
        <span>{titulo}</span>
        <span className="rounded-full bg-amber-400 px-3 py-1 text-sm text-blue-950">
          {pendientes}
        </span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAbierto(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-blue-950">
                  {titulo}
                </h2>

                <p className="text-sm text-slate-500">
                  {pendientes} pendiente
                  {pendientes === 1 ? "" : "s"} · orden de llegada
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="px-2 text-2xl text-slate-500"
              >
                ×
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                >
                  {error}
                </p>
              )}

              {!turnos.length && (
                <p className="p-8 text-center text-slate-500">
                  No hay turnos pendientes.
                </p>
              )}

              {turnos.map((turno, indice) => (
                <div key={turno.id}>
                  {turno.cola === "analistas" &&
                    (indice === 0 ||
                      turnos[indice - 1]?.actuacion !==
                        turno.actuacion) && (
                      <h3 className="mb-2 mt-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-blue-800">
                        {turno.actuacion}
                      </h3>
                    )}

                  <article className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-blue-950">
                          {turno.nombre}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            turno.estado === "llamado"
                              ? "bg-blue-100 text-blue-800"
                              : turno.estado === "en_atencion"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {turno.estado === "llamado"
                            ? "Llamado"
                            : turno.estado === "en_atencion"
                              ? "En atención"
                              : "Pendiente"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {turno.cola === "analistas" ? (
                          <>
                            {turno.actuacion}
                            {(turno.cantidadActuaciones || 1) >
                              1
                              ? ` (${turno.cantidadActuaciones})`
                              : ""}
                          </>
                        ) : (
                          turno.tipoVisita
                        )}
                        {turno.correlativo
                          ? ` · Recibo ${turno.correlativo}`
                          : ""}
                      </p>

                      <p className="text-xs text-slate-500">
                        Registrado{" "}
                        {new Date(
                          turno.creadoEl
                        ).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {turno.usuario && (
                        <p className="text-xs text-slate-500">
                          Responsable: {turno.usuario}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={
                          Boolean(ocupado) ||
                          turno.estado === "en_atencion" ||
                          segundosParaRellamar(turno, ahora) > 0
                        }
                        onClick={() =>
                          void actuar(turno, "llamar")
                        }
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {ocupado === turno.id
                          ? "Procesando…"
                          : turno.estado === "llamado"
                            ? segundosParaRellamar(
                                turno,
                                ahora
                              ) > 0
                              ? `Rellamar en ${segundosParaRellamar(
                                  turno,
                                  ahora
                                )}s`
                              : "Rellamar"
                            : "Llamar"}
                      </button>

                      <button
                        disabled={Boolean(ocupado)}
                        onClick={() =>
                          void actuar(
                            turno,
                            onIniciarAtencion
                              ? turno.estado === "en_atencion"
                                ? "finalizar_atencion"
                                : "iniciar_atencion"
                              : "atendido"
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                          onIniciarAtencion &&
                          turno.estado === "en_atencion"
                            ? "bg-red-700 hover:bg-red-800"
                            : "bg-emerald-700"
                        }`}
                      >
                        {onIniciarAtencion
                          ? turno.estado === "en_atencion"
                            ? "Finalizar atención"
                            : "Atender"
                          : "Atendido"}
                      </button>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
