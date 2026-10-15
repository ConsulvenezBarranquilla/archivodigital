"use client";

import { useCallback, useEffect, useState } from "react";

type Pantalla = { deviceId: string; linkedAt: string };

export default function TurneroDevicesCard() {
  const [codigo, setCodigo] = useState("");
  const [pantallas, setPantallas] = useState<Pantalla[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/turnero/dispositivos", { cache: "no-store", credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible cargar las pantallas.");
      setPantallas(data.dispositivos || []);
    } catch (error) { setMensaje(error instanceof Error ? error.message : "Error consultando pantallas."); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void cargar(); }, 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  async function vincular(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true); setMensaje("");
    try {
      const response = await fetch("/api/turnero/dispositivos", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible vincular la pantalla.");
      setCodigo(""); setMensaje("Pantalla vinculada correctamente."); await cargar();
    } catch (error) { setMensaje(error instanceof Error ? error.message : "Error al vincular."); }
    finally { setCargando(false); }
  }

  async function desvincular(deviceId: string) {
    setMensaje("");
    try {
      const response = await fetch(`/api/turnero/dispositivos?deviceId=${encodeURIComponent(deviceId)}`, { method: "DELETE", credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible desvincular la pantalla.");
      setMensaje("Pantalla desvinculada."); await cargar();
    } catch (error) { setMensaje(error instanceof Error ? error.message : "Error al desvincular."); }
  }

  return <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-blue-950">Pantallas del turnero</h2>
    <p className="mt-2 text-sm text-slate-600">Abre <a className="font-semibold text-blue-700 underline" href="/turnero" target="_blank" rel="noreferrer">/turnero</a> en la pantalla que quieras habilitar. Ingresa aquí el código que muestre.</p>
    <form onSubmit={vincular} className="mt-4 flex flex-wrap gap-3">
      <label className="sr-only" htmlFor="codigo-turnero">Código de vinculación</label>
      <input id="codigo-turnero" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} placeholder="Código de 6 dígitos" className="w-56 rounded-lg border border-slate-300 px-4 py-2 tracking-[0.3em]" />
      <button disabled={cargando || codigo.length !== 6} className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white disabled:bg-slate-400">{cargando ? "Vinculando…" : "Vincular pantalla"}</button>
    </form>
    {mensaje && <p role="status" className="mt-3 text-sm text-slate-700">{mensaje}</p>}
    <h3 className="mt-6 font-semibold text-slate-800">Pantallas vinculadas ({pantallas.length})</h3>
    {pantallas.length ? <ul className="mt-2 divide-y divide-slate-100">{pantallas.map((pantalla) => <li key={pantalla.deviceId} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-slate-600">Vinculada {new Date(pantalla.linkedAt).toLocaleString("es-CO")} · <code>{pantalla.deviceId.slice(0, 8)}…</code></span><button onClick={() => void desvincular(pantalla.deviceId)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">Desvincular</button></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No hay pantallas vinculadas.</p>}
  </section>;
}
