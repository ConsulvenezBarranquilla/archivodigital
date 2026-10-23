"use client";

import { useEffect, useRef, useState } from "react";

type Llamado = { id: string; nombre: string; tipo: "analista" | "caja" | "recepcion"; caja: string; actualizadoEl: string };
type Dispositivo = { deviceId: string; token: string };
const llaveLlamado = (llamado: Llamado) => `${llamado.id}:${llamado.actualizadoEl}`;

function credencialesLocales(): Dispositivo {
  const key = "consulnet-turnero-device-v1";
  const saved = window.localStorage.getItem(key);
  if (saved) {
    try { const value = JSON.parse(saved) as Dispositivo; if (value.deviceId && value.token) return value; } catch { /* crear credenciales nuevas */ }
  }
  const value = { deviceId: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("") };
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function sonar() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.65);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.7);
    oscillator.onended = () => { void context.close(); };
  } catch { /* el navegador puede bloquear el audio */ }
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
    const timer = window.setTimeout(() => setDevice(credencialesLocales()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!device) return;
    let cancelado = false;
    let controlador: AbortController | null = null;
    let esperaReconectar: number | null = null;

    const procesar = (evento: { tipo?: string; vinculado?: boolean; codigo?: string; llamados?: Llamado[] }) => {
      if (evento.tipo === "estado") {
        setVinculado(Boolean(evento.vinculado));
        setCodigo(evento.codigo || "");
        const next = evento.vinculado && Array.isArray(evento.llamados) ? evento.llamados : [];
        vistos.current = new Set(next.map(llaveLlamado));
        setLlamados(next);
      } else if (evento.tipo === "llamados" && Array.isArray(evento.llamados)) {
        const next = evento.llamados;
        const nuevo = next.find((item) => !vistos.current?.has(llaveLlamado(item)));
        if (nuevo) {
          setLlamadoNuevo(llaveLlamado(nuevo));
          if (sonidoRef.current) sonar();
          if (timeout.current) window.clearTimeout(timeout.current);
          timeout.current = window.setTimeout(() => setLlamadoNuevo(""), 4500);
        }
        vistos.current = new Set(next.map(llaveLlamado));
        setLlamados(next);
      }
      setError("");
    };

    const conectar = async () => {
      let demoraMs = 1000;
      while (!cancelado) {
        controlador = new AbortController();
        let esperarVinculacion = false;
        try {
          const response = await fetch("/api/turnos/publico/eventos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(device),
            cache: "no-store",
            signal: controlador.signal,
          });
          if (response.status === 401 || response.status === 403) {
            setError("Esta pantalla no está autorizada para consultar el turnero.");
            break;
          }
          if (!response.ok) throw new Error("No fue posible conectar con el turnero.");
          if (response.headers.get("content-type")?.includes("application/json")) {
            const estado = await response.json() as { tipo?: string; vinculado?: boolean; codigo?: string; llamados?: Llamado[] };
            procesar(estado);
            esperarVinculacion = !estado.vinculado;
          } else if (!response.body) {
            throw new Error("La conexión del turnero no entregó un flujo de eventos.");
          }
          if (esperarVinculacion) {
            // Las pantallas no vinculadas solo consultan su estado cada 15 s;
            // no mantienen una función Vercel ni una suscripción Redis abierta.
          } else if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!cancelado) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const bloques = buffer.split(/\r?\n\r?\n/);
            buffer = bloques.pop() ?? "";
            for (const bloque of bloques) {
              const data = bloque.split(/\r?\n/).find((linea) => linea.startsWith("data: "))?.slice(6);
              if (!data) continue;
              try {
                procesar(JSON.parse(data) as { tipo?: string; vinculado?: boolean; codigo?: string; llamados?: Llamado[] });
                demoraMs = 1000;
              }
              catch { /* Ignorar mensajes incompletos. */ }
            }
          }
          }
        } catch (cause) {
          if (!cancelado) setError(cause instanceof Error ? cause.message : "Error de conexion con el turnero.");
        } finally {
          controlador = null;
        }
        if (!cancelado) {
          const espera = esperarVinculacion ? 30_000 : demoraMs;
          await new Promise<void>((resolve) => { esperaReconectar = window.setTimeout(resolve, espera); });
          if (esperarVinculacion) demoraMs = 1000;
          else demoraMs = Math.min(demoraMs * 2, 30_000);
        }
      }
    };

    void conectar();
    return () => {
      cancelado = true;
      controlador?.abort();
      if (esperaReconectar) window.clearTimeout(esperaReconectar);
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, [device]);

  // El codigo de vinculacion vence a los 10 minutos. Solo mientras la pantalla
  // siga sin vincularse se renueva una vez despues del vencimiento.
  useEffect(() => {
    if (!device || vinculado || !codigo) return;
    let cancelado = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/turnero/dispositivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(device),
          cache: "no-store",
        });
        const data = await response.json();
        if (cancelado || !response.ok || !data.ok) return;
        setVinculado(Boolean(data.vinculado));
        setCodigo(data.codigo || "");
        if (data.vinculado) {
          const llamadosResponse = await fetch("/api/turnos/publico", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(device),
            cache: "no-store",
          });
          const llamadosData = await llamadosResponse.json();
          if (!cancelado && llamadosResponse.ok && llamadosData.ok) {
            const next = Array.isArray(llamadosData.llamados) ? llamadosData.llamados as Llamado[] : [];
            vistos.current = new Set(next.map(llaveLlamado));
            setLlamados(next);
          }
        }
      } catch {
        if (!cancelado) setError("No fue posible renovar el codigo de vinculacion.");
      }
    }, 10 * 60 * 1000 + 1500);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [device, vinculado, codigo]);

  return <main className="flex min-h-screen flex-col bg-slate-950 p-5 text-white md:p-8">
    <header className="mb-6 text-center text-lg font-semibold uppercase tracking-[0.25em] text-amber-300">Consulado de Venezuela · Barranquilla</header>
    {!vinculado ? <section className="m-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl md:p-14">
      <h1 className="text-3xl font-bold md:text-5xl">Vincular pantalla</h1>
      <p className="mt-4 text-lg text-slate-300">Ingresa este código en Configuración para autorizar el acceso al turnero.</p>
      <div aria-live="polite" className="my-8 rounded-2xl bg-white py-5 font-mono text-5xl font-black tracking-[0.35em] text-blue-950 md:text-7xl">{codigo || "······"}</div>
      <p className="text-sm text-slate-400">El código se renueva automáticamente si vence.</p>
      {error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}
    </section> : <>
      <div className="mb-5 flex flex-wrap items-center justify-center gap-4">
        <h1 className="text-3xl font-extrabold md:text-5xl">Turnos llamados</h1>
        <button onClick={() => { setSonidoActivo(true); sonar(); }} className={`rounded-xl px-5 py-3 font-bold ${sonidoActivo ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-500"}`} aria-pressed={sonidoActivo}>{sonidoActivo ? "🔊 Sonido activado" : "🔔 Activar sonido"}</button>
      </div>
      {error && <p role="status" className="mb-3 text-center text-amber-200">{error}</p>}
      <section aria-live="polite" className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
        {[0, 1, 2, 3].map((index) => {
          const llamado = llamados[index];
          const esUltimoLlamado = index === 0;
          return llamado ? <article key={llaveLlamado(llamado)} className={`flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border-2 p-5 text-center text-blue-950 shadow-2xl md:p-8 ${llamadoNuevo === llaveLlamado(llamado) ? "animate-pulse" : ""} ${esUltimoLlamado ? "border-amber-400 bg-amber-200 ring-2 ring-amber-400" : "border-white bg-white"}`}>
            <p className="text-lg font-bold uppercase tracking-widest text-slate-500 md:text-2xl">{llamado.tipo === "analista" ? "Atención consular" : "Pase por favor"}</p>
            <h2 className="mt-4 break-words text-3xl font-extrabold md:text-5xl">{llamado.nombre}</h2>
            {llamado.tipo === "analista" ? <p className="mt-5 text-2xl font-extrabold text-amber-600 md:text-4xl">Espere llamado</p> : llamado.tipo === "recepcion" ? <p className="mt-5 text-2xl font-extrabold text-amber-600 md:text-4xl">Diríjase a Recepción</p> : <p className="mt-5 text-3xl font-extrabold text-amber-600 md:text-5xl">{llamado.caja}</p>}
          </article> : <article key={`vacio-${index}`} className="flex min-h-[22vh] items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-900/60 text-2xl text-slate-500">Esperando llamado</article>;
        })}
      </section>
    </>}
    <p className="mt-5 text-center text-xs text-slate-500">La pantalla se actualiza automáticamente.</p>
  </main>;
}
