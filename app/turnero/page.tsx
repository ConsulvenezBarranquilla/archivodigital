"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Llamado = { id: string; nombre: string; tipo: "analista" | "caja" | "recepcion"; caja: string; actualizadoEl: string };
type Dispositivo = { deviceId: string; token: string };

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

  const actualizar = useCallback(async () => {
    if (!device) return;
    try {
      const estadoRes = await fetch("/api/turnero/dispositivo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(device), cache: "no-store" });
      const estado = await estadoRes.json();
      if (!estadoRes.ok || !estado.ok) throw new Error(estado.error || "No fue posible registrar esta pantalla.");
      setVinculado(Boolean(estado.vinculado)); setCodigo(estado.codigo || "");
      if (!estado.vinculado) { setLlamados([]); return; }
      const response = await fetch("/api/turnos/publico", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(device), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 403 || response.status === 401) { setVinculado(false); setCodigo(""); setLlamados([]); return; }
        throw new Error(data.error || "No fue posible consultar los llamados.");
      }
      const next = (Array.isArray(data.llamados) ? data.llamados : []) as Llamado[];
      const ids = new Set(next.map((item) => item.id));
      const prev = vistos.current;
      if (prev) {
        const fresh = next.find((item) => !prev.has(item.id));
        if (fresh) {
          setLlamadoNuevo(fresh.id);
          if (sonidoActivo) sonar();
          if (timeout.current) window.clearTimeout(timeout.current);
          timeout.current = window.setTimeout(() => setLlamadoNuevo(""), 4500);
        }
      }
      vistos.current = ids;
      setLlamados(next); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error de conexión con el turnero."); }
  }, [device, sonidoActivo]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDevice(credencialesLocales()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!device) return;
    const initial = window.setTimeout(() => void actualizar(), 0);
    const timer = window.setInterval(() => void actualizar(), 3000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); if (timeout.current) window.clearTimeout(timeout.current); };
  }, [device, actualizar]);

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
          return llamado ? <article key={llamado.id} className={`flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border-2 p-5 text-center text-blue-950 shadow-2xl md:p-8 ${llamadoNuevo === llamado.id ? "animate-pulse border-amber-300 bg-amber-100" : "border-white bg-white"}`}>
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
