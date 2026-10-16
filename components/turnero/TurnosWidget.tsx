"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Turno = {
  id: string; nombre: string; tipoVisita: string; estado: "pendiente" | "llamado" | "atendido";
  cola: "visitas" | "analistas"; etapa: string; actuacion: string; correlativo: string; creadoEl: string;
  cantidadActuaciones?: number;
  usuario?: string;
};

export default function TurnosWidget({ titulo = "Turnos pendientes", cola }: { titulo?: string; cola?: "visitas" | "analistas" }) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");
  const canalRef = useRef<BroadcastChannel | null>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch(`/api/turnos${cola ? `?cola=${cola}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible cargar la cola.");
      setTurnos(data.turnos || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cargar la cola.");
    }
  }, [cola]);

  useEffect(() => {
    const actualizarSiVisible = () => {
      if (document.visibilityState === "visible") void cargar();
    };
    const initial = window.setTimeout(actualizarSiVisible, 0);
    const timer = window.setInterval(actualizarSiVisible, 2000);
    window.addEventListener("focus", actualizarSiVisible);
    document.addEventListener("visibilitychange", actualizarSiVisible);

    if (typeof BroadcastChannel !== "undefined") {
      canalRef.current = new BroadcastChannel("consulnet-turnero");
      canalRef.current.onmessage = (event: MessageEvent<{ tipo?: string }>) => {
        if (event.data?.tipo === "cola-actualizada") void cargar();
      };
    }

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", actualizarSiVisible);
      document.removeEventListener("visibilitychange", actualizarSiVisible);
      canalRef.current?.close();
      canalRef.current = null;
    };
  }, [cargar]);

  async function actuar(turno: Turno, accion: "llamar" | "atendido") {
    setOcupado(turno.id);
    setError("");
    try {
      const response = await fetch("/api/turnos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: turno.id, accion }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible actualizar el turno.");
      canalRef.current?.postMessage({ tipo: "cola-actualizada" });
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible actualizar el turno.");
      await cargar();
    } finally {
      setOcupado("");
    }
  }

  // El turno llamado continúa en cola hasta que el operador lo marque atendido.
  const pendientes = turnos.filter((turno) => turno.estado !== "atendido").length;
  if (!turnos.length) return null;

  return <>
    <button type="button" onClick={() => setAbierto(true)} className="fixed bottom-5 left-5 z-40 flex items-center gap-3 rounded-full bg-blue-950 px-5 py-3 font-bold text-white shadow-xl hover:bg-blue-900">
      <span>{titulo}</span><span className="rounded-full bg-amber-400 px-3 py-1 text-sm text-blue-950">{pendientes}</span>
    </button>
    {abierto && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setAbierto(false); }}>
      <section role="dialog" aria-modal="true" className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold text-blue-950">{titulo}</h2><p className="text-sm text-slate-500">{pendientes} pendiente{pendientes === 1 ? "" : "s"} · orden de llegada</p></div><button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="px-2 text-2xl text-slate-500">×</button></header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {!turnos.length && <p className="p-8 text-center text-slate-500">No hay turnos pendientes.</p>}
          {turnos.map((turno, indice) => <div key={turno.id}>
            {turno.cola === "analistas" && (indice === 0 || turnos[indice - 1]?.actuacion !== turno.actuacion) && <h3 className="mb-2 mt-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-blue-800">{turno.actuacion}</h3>}
            <article className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-blue-950">{turno.nombre}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${turno.estado === "llamado" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{turno.estado === "llamado" ? "Llamado" : "Pendiente"}</span></div>
              <p className="mt-1 text-sm text-slate-600">{turno.cola === "analistas" ? <>{turno.actuacion}{(turno.cantidadActuaciones || 1) > 1 ? ` (${turno.cantidadActuaciones})` : ""}</> : turno.tipoVisita}{turno.correlativo ? ` · Recibo ${turno.correlativo}` : ""}</p>
              <p className="text-xs text-slate-500">Registrado {new Date(turno.creadoEl).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
              {turno.usuario && <p className="text-xs text-slate-500">Responsable: {turno.usuario}</p>}
            </div>
            <div className="flex gap-2"><button disabled={Boolean(ocupado) || turno.estado === "llamado"} onClick={() => void actuar(turno, "llamar")} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{ocupado === turno.id ? "Procesando…" : "Llamar"}</button><button disabled={Boolean(ocupado)} onClick={() => void actuar(turno, "atendido")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Atendido</button></div>
            </article>
          </div>)}
        </div>
      </section>
    </div>}
  </>;
}
