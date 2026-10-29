"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";

type EstadoFuente = { estado?: string; fuente?: string; advertencia?: string; mensaje?: string };
type GrupoPasaportes = { Adultos: number; NNA: number; total: number; fechaUtilizada: string };
type RespuestaPerfil = {
  ok: boolean;
  puedeEditar: boolean;
  periodo: { desde: string; hasta: string; zonaHoraria: string };
  actualizadoEl: string;
  corteCalendario: { anio: number; mes: string };
  comunidadResidente: EstadoFuente & { disponible: boolean; periodo: string; datos: null | { atlantico: number; magdalena: number; sanAndres: number; total: number; actualizadoPor: string; actualizadoEl: string } };
  ciudadanosRegistro: EstadoFuente & { disponible: boolean; datos: null | { totalHistoricoAlCorte: number; nuevasEnPeriodo: number; porLugarResidencia: { nombre: string; cantidad: number }[]; regla: string } };
  registroCivil: EstadoFuente & { datos: null | { totalAbiertosIniciadosEnPeriodo: number; porTipo: { tipo: string; cantidad: number; genero: Record<string, number> }[]; fechaUtilizada: string } };
  fallecidos: EstadoFuente & { datos: null | { iniciadosEnPeriodo: number; acumuladoHistoricoAlCorte: number; tablaCausas: { causa: string; femenino: number; masculino: number; sinDato: number; totalPeriodo: number; totalAcumulado: number }[]; generoDisponible: boolean; fechaUtilizada: string } };
  visas: EstadoFuente & { datos: null | { porTipo: { actuacion: string; solicitadas: number; aprobadas: number; negadas: number; pendientes: number }[]; solicitadasEnPeriodo: number; porNacionalidadRestringida: { nacionalidad: string; cantidad: number; porTipo: { tipoVisa: string; solicitadas: number; aprobadas: number; negadas: number; pendientes: number }[] }[]; totalNacionalidadesRestringidas: number; porcentajeNacionalidadesRestringidas: number | null } };
  pasaportes: EstadoFuente & { datos: null | { tramitados: GrupoPasaportes; recibidos: GrupoPasaportes; entregados: GrupoPasaportes } };
  documentosViaje: EstadoFuente & { disponible?: boolean; datos?: null | { total: number; pagas: number; exentas: number; fechaUtilizada: string } };
  otrasActuaciones: EstadoFuente & { disponible: boolean; datos: null | { poderes: { documento: string; cantidad: number }[]; certificados: { documento: string; cantidad: number }[]; otras: { documento: string; cantidad: number }[]; total: number; fechaUtilizada: string } };
  registroElectoral: EstadoFuente & { disponible: boolean; datos: null | { registros: { numero: number; correlativo: string; nombre: string; cedula: string; tipo: string }[]; total: number; fechaUtilizada: string } };
  autorizacionesViaje: EstadoFuente & { datos: null | { totalRegistradasComoProcesadasOEntregadas: number; porRelacion: { modalidad: string; cantidad: number }[] } };
};
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fechaBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function periodoMes(anio: number, mes: number) {
  const mm = String(mes + 1).padStart(2, "0");
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-${String(ultimo).padStart(2, "0")}` };
}
function numero(valor: unknown) { return Number(valor ?? 0).toLocaleString("es-CO"); }

function EstadoSeccion({ seccion }: { seccion: EstadoFuente | null | undefined }) {
  if (!seccion) return null;
  const color = seccion.estado === "error" ? "text-red-700 bg-red-50" : seccion.estado === "incompleto" || seccion.estado === "fuente_pendiente" ? "text-amber-800 bg-amber-50" : "text-emerald-800 bg-emerald-50";
  const etiqueta = seccion.estado === "error" ? "Error de lectura" : seccion.estado === "incompleto" ? "Datos parciales" : seccion.estado === "fuente_pendiente" ? "Fuente pendiente" : "Fuente consultada";
  return <div className="mt-4 space-y-1 text-xs text-slate-500"><span className={`inline-block rounded-full px-2.5 py-1 font-semibold ${color}`}>{etiqueta}</span>{seccion.fuente && <p>Fuente: {seccion.fuente}</p>}{seccion.advertencia && <p className="text-amber-800">{seccion.advertencia}</p>}{seccion.mensaje && <p>{seccion.mensaje}</p>}</div>;
}

function Tabla({ columnas, filas, total, totalLabel = "Total" }: { columnas: string[]; filas: (string | number)[][]; total?: number | string; totalLabel?: string }) {
  return <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr>{columnas.map((col) => <th className="px-4 py-3" key={col}>{col}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filas.length ? filas.map((fila, i) => <tr key={i} className="bg-white"><td className="px-4 py-3 font-medium text-slate-800">{fila[0]}</td>{fila.slice(1).map((celda, j) => <td className="px-4 py-3 text-slate-700" key={j}>{celda}</td>)}</tr>) : <tr><td className="px-4 py-4 text-slate-500" colSpan={columnas.length}>Sin registros en el período consultado.</td></tr>}</tbody>{total !== undefined && <tfoot className="bg-slate-50 font-bold text-slate-800"><tr><td className="px-4 py-3" colSpan={columnas.length - 1}>{totalLabel}</td><td className="px-4 py-3">{typeof total === "number" ? numero(total) : total}</td></tr></tfoot>}</table></div>;
}

function Seccion({ titulo, children, fuente }: { titulo: string; children: ReactNode; fuente?: EstadoFuente }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#172554]">{titulo}</h2>{children}<EstadoSeccion seccion={fuente} /></section>;
}

export default function PerfilConsularPage() {
  const [hoy] = useState(() => fechaBogota());
  const [modo, setModo] = useState<"mes" | "rango">("mes");
  const [anio, setAnio] = useState(Number(hoy.slice(0, 4)));
  const [mes, setMes] = useState(Number(hoy.slice(5, 7)) - 1);
  const [desde, setDesde] = useState(`${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [consulta, setConsulta] = useState<{ desde: string; hasta: string }>(() => ({ desde: `${hoy.slice(0, 7)}-01`, hasta: hoy }));
  const [datos, setDatos] = useState<RespuestaPerfil | null>(null);
  const [nacionalidadVisaExpandida, setNacionalidadVisaExpandida] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [errorGuardado, setErrorGuardado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [atlantico, setAtlantico] = useState("");
  const [magdalena, setMagdalena] = useState("");
  const [sanAndres, setSanAndres] = useState("");

  async function cargar(periodo = consulta) {
    setCargando(true); setError("");
    try {
      const response = await fetch(`/api/perfil-consular?desde=${encodeURIComponent(periodo.desde)}&hasta=${encodeURIComponent(periodo.hasta)}`, { cache: "no-store", credentials: "include" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "No fue posible consultar el Perfil Consular.");
      const respuesta = body as RespuestaPerfil;
      setDatos(respuesta); setConsulta(periodo); setNacionalidadVisaExpandida(null);
      const cifras = respuesta.comunidadResidente.datos;
      setAtlantico(cifras ? String(cifras.atlantico) : "");
      setMagdalena(cifras ? String(cifras.magdalena) : "");
      setSanAndres(cifras ? String(cifras.sanAndres) : "");
    } catch (e) { setError(e instanceof Error ? e.message : "Error de consulta."); }
    finally { setCargando(false); }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void cargar(); }, 0);
    return () => window.clearTimeout(timer);
    // Una consulta al abrir; las siguientes son iniciadas por el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicar() {
    const rango = modo === "mes" ? periodoMes(anio, mes) : { desde, hasta };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rango.desde) || !/^\d{4}-\d{2}-\d{2}$/.test(rango.hasta) || rango.desde > rango.hasta) { setError("Verifica las fechas: el inicio debe ser anterior o igual al final."); return; }
    void cargar(rango);
  }

  async function guardarJurisdiccion() {
    if (!datos?.puedeEditar) return;
    const cifras = [atlantico, magdalena, sanAndres];
    if (cifras.some((valor) => !/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)))) {
      setErrorGuardado("Ingresa un número entero igual o mayor que cero en las tres jurisdicciones.");
      return;
    }
    setGuardando(true); setErrorGuardado("");
    try {
      const response = await fetch("/api/perfil-consular", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo: datos.comunidadResidente.periodo, atlantico: Number(atlantico), magdalena: Number(magdalena), sanAndres: Number(sanAndres) }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "No fue posible guardar las cifras.");
      await cargar(consulta);
    } catch (e) { setErrorGuardado(e instanceof Error ? e.message : "Error al guardar las cifras."); }
    finally { setGuardando(false); }
  }

  const years = Array.from({ length: Math.max(8, Number(hoy.slice(0, 4)) - 2019) }, (_, i) => Number(hoy.slice(0, 4)) - i);
  const registro = datos?.ciudadanosRegistro;
  const civil = datos?.registroCivil;
  const fallecidos = datos?.fallecidos;
  const visas = datos?.visas;
  const pasaportes = datos?.pasaportes;
  const autorizaciones = datos?.autorizacionesViaje;
  const otrasActuaciones = datos?.otrasActuaciones;
  const registroElectoral = datos?.registroElectoral;
  const filasJurisdiccion: [string, string, (value: string) => void][] = [
    ["Atlántico", atlantico, setAtlantico],
    ["Magdalena", magdalena, setMagdalena],
    ["San Andrés y Providencia", sanAndres, setSanAndres],
  ];
  const periodLabel = datos ? `${datos.periodo.desde} — ${datos.periodo.hasta}` : "";
  const resumenOtrasActuaciones = otrasActuaciones?.datos;

  return <SistemaLayout titulo="Perfil Consular" permiso={MODULOS.CONSULTAS}>
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold text-[#172554]">Perfil Consular</h1><p className="mt-1 text-slate-600">Indicadores de gestión con sus fuentes y reglas de conteo.</p></header>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold text-slate-700">Modo<select className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2" value={modo} onChange={(e) => setModo(e.target.value as "mes" | "rango")}><option value="mes">Año y mes</option><option value="rango">Rango personalizado</option></select></label>
          {modo === "mes" ? <><label className="text-sm font-semibold text-slate-700">Año<select className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>{years.map((year) => <option key={year}>{year}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Mes<select className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2" value={mes} onChange={(e) => setMes(Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label></> : <><label className="text-sm font-semibold text-slate-700">Desde<input className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label><label className="text-sm font-semibold text-slate-700">Hasta<input className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label></>}
          <button className="rounded-lg bg-blue-700 px-5 py-2.5 font-bold text-white disabled:opacity-60" disabled={cargando} onClick={aplicar}>{cargando ? "Consultando…" : "Aplicar filtros"}</button>
        </div>
        {datos && <p className="mt-3 text-sm text-slate-500">Período: {periodLabel} · Zona horaria: {datos.periodo.zonaHoraria} · Actualizado: {new Date(datos.actualizadoEl).toLocaleString("es-CO", { timeZone: datos.periodo.zonaHoraria })}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      </section>
      {!datos && cargando && <p className="rounded-xl bg-white p-8 text-center text-slate-600">Cargando estadísticas…</p>}
      {datos && <div className="space-y-5">
        <h2 className="text-3xl font-bold text-[#172554]">{datos.corteCalendario.mes ? `${datos.corteCalendario.mes[0].toUpperCase()}${datos.corteCalendario.mes.slice(1)}` : "Período"} {datos.corteCalendario.anio}</h2>
        <Seccion titulo="1. Venezolanos Registrados en la Jurisdicción (Atlántico - Magdalena - San Andrés y Providencia según Migración Colombia)" fuente={datos.comunidadResidente}>
          <p className="mt-3 text-sm text-slate-600">Cifras correspondientes a {datos.comunidadResidente.periodo}. En rangos personalizados se utiliza el mes de la fecha final seleccionada.</p>
          {datos.comunidadResidente.disponible && <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Jurisdicción</th><th className="px-4 py-3">Venezolanos registrados</th></tr></thead><tbody className="divide-y divide-slate-100">{filasJurisdiccion.map(([nombre, valor, setter]) => <tr key={nombre}><td className="px-4 py-3 font-medium text-slate-800">{nombre}</td><td className="px-4 py-2">{datos.puedeEditar ? <input aria-label={`Venezolanos registrados en ${nombre}`} className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2" type="number" min="0" step="1" inputMode="numeric" value={valor} onChange={(e) => setter(e.target.value)} /> : valor || "—"}</td></tr>)}</tbody><tfoot className="bg-slate-50 font-bold text-slate-800"><tr><td className="px-4 py-3">Total</td><td className="px-4 py-3">{[atlantico, magdalena, sanAndres].every((v) => /^\d+$/.test(v)) ? numero(Number(atlantico) + Number(magdalena) + Number(sanAndres)) : "—"}</td></tr></tfoot></table></div>
            {datos.puedeEditar && <div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-lg bg-blue-700 px-5 py-2.5 font-bold text-white disabled:opacity-60" disabled={guardando} onClick={() => void guardarJurisdiccion()}>{guardando ? "Guardando…" : "Guardar cifras del mes"}</button>{datos.comunidadResidente.datos && <span className="text-sm text-slate-500">Última actualización: {datos.comunidadResidente.datos.actualizadoPor} · {new Date(datos.comunidadResidente.datos.actualizadoEl).toLocaleString("es-CO", { timeZone: datos.periodo.zonaHoraria })}</span>}</div>}
            {errorGuardado && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{errorGuardado}</p>}
            <p className="mt-4 text-xs text-slate-500">{datos.comunidadResidente.datos ? `Estadísticas de acuerdo a Migración Colombia, actualizadas por ${datos.comunidadResidente.datos.actualizadoPor} en fecha ${new Date(datos.comunidadResidente.datos.actualizadoEl).toLocaleString("es-CO", { timeZone: datos.periodo.zonaHoraria })}.` : "Estadísticas de acuerdo a Migración Colombia. Aún no hay datos registrados para este mes."}</p>
          </>}
          {!datos.comunidadResidente.disponible && <p className="mt-3 text-sm text-red-700">{datos.comunidadResidente.mensaje}</p>}
        </Seccion>
        <Seccion titulo="2. Ciudadanos venezolanos registrados" fuente={{ ...datos.ciudadanosRegistro, fuente: datos.ciudadanosRegistro.fuente, estado: datos.ciudadanosRegistro.estado === "disponible" ? "disponible" : datos.ciudadanosRegistro.estado }}>
          {registro?.disponible && registro.datos && <><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-slate-600">Total histórico al corte</p><p className="text-3xl font-bold text-[#172554]">{numero(registro.datos.totalHistoricoAlCorte)}</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-slate-600">Nuevos en el período</p><p className="text-3xl font-bold text-emerald-800">{numero(registro.datos.nuevasEnPeriodo)}</p></div></div><Tabla columnas={["Lugar de residencia", "Ciudadanos"]} filas={registro.datos.porLugarResidencia.map((r) => [r.nombre, numero(r.cantidad)])} total={registro.datos.totalHistoricoAlCorte} /><p className="mt-2 text-xs text-slate-500">{registro.datos.regla}</p></>}
          {!registro?.disponible && <p className="mt-3 text-sm text-red-700">No fue posible leer el Registro Consular. El total no se presenta como cero.</p>}
        </Seccion>
        <Seccion titulo="3. Registro Civil · casos abiertos iniciados en el período" fuente={{ estado: civil?.estado ?? "error", fuente: civil?.fuente }}>
          {civil?.datos && <><Tabla columnas={["Tipo de registro", "Casos", "Masculino", "Femenino", "Sin dato"]} filas={civil.datos.porTipo.map((r) => [r.tipo, numero(r.cantidad), numero(r.genero.Masculino), numero(r.genero.Femenino), numero(r.genero["Sin dato"])])} total={civil.datos.totalAbiertosIniciadosEnPeriodo} /><p className="mt-2 text-xs text-slate-500">{civil.datos.fechaUtilizada}</p></>}
        </Seccion>
        <Seccion titulo="4. Especificaciones de los fallecidos" fuente={{ estado: fallecidos?.estado ?? "error", fuente: fallecidos?.fuente }}>
          {fallecidos?.datos && <><div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[760px] w-full border-collapse text-center text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="border-b border-slate-200 px-3 py-2" rowSpan={2}>Causas</th><th className="border-b border-slate-200 px-3 py-2" colSpan={4}>{datos.corteCalendario.mes.toLocaleUpperCase("es-CO")}</th><th className="border-b border-slate-200 px-3 py-2" rowSpan={2}>Total acumulado al corte</th></tr><tr><th className="border-b border-slate-200 px-3 py-2">Femenino</th><th className="border-b border-slate-200 px-3 py-2">Masculino</th><th className="border-b border-slate-200 px-3 py-2">Sin dato</th><th className="border-b border-slate-200 px-3 py-2">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{fallecidos.datos.tablaCausas.map((fila) => <tr key={fila.causa} className="even:bg-slate-50"><th className="px-3 py-2 text-left font-medium text-slate-800">{fila.causa}</th><td className="px-3 py-2 text-slate-700">{numero(fila.femenino)}</td><td className="px-3 py-2 text-slate-700">{numero(fila.masculino)}</td><td className="px-3 py-2 text-slate-700">{numero(fila.sinDato)}</td><td className="px-3 py-2 font-semibold text-slate-800">{numero(fila.totalPeriodo)}</td><td className="px-3 py-2 text-slate-700">{numero(fila.totalAcumulado)}</td></tr>)}</tbody><tfoot className="bg-slate-50 font-bold text-slate-800"><tr><th className="px-3 py-2 text-left">Total</th><td className="px-3 py-2">{numero(fallecidos.datos.tablaCausas.reduce((total, fila) => total + fila.femenino, 0))}</td><td className="px-3 py-2">{numero(fallecidos.datos.tablaCausas.reduce((total, fila) => total + fila.masculino, 0))}</td><td className="px-3 py-2">{numero(fallecidos.datos.tablaCausas.reduce((total, fila) => total + fila.sinDato, 0))}</td><td className="px-3 py-2">{numero(fallecidos.datos.iniciadosEnPeriodo)}</td><td className="px-3 py-2">{numero(fallecidos.datos.acumuladoHistoricoAlCorte)}</td></tr></tfoot></table></div><p className="mt-2 text-xs text-slate-500">El bloque del período agrupa casos según la fecha de apertura; el total acumulado comprende los casos vigentes hasta {datos.periodo.hasta}. Los casos sin género se conservan en “Sin dato”.</p></>}
        </Seccion>
        <Seccion titulo="5. Visados">
          {visas?.datos && <><Tabla columnas={["Tipo de visa", "Solicitadas", "Aprobadas", "Negadas", "Pendientes"]} filas={visas.datos.porTipo.map((r) => [r.actuacion, numero(r.solicitadas), numero(r.aprobadas), numero(r.negadas), numero(r.pendientes)])} total={visas.datos.solicitadasEnPeriodo} totalLabel="Solicitudes del período" /><div className="mt-6"><h3 className="text-lg font-bold text-[#172554]">Visas – ciudadanos norteamericanos y otras nacionalidades restringidas</h3><div className="my-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Total restringidas / total de visas del período: <strong>{numero(visas.datos.totalNacionalidadesRestringidas)} / {numero(visas.datos.solicitadasEnPeriodo)}</strong>{" · "}{visas.datos.porcentajeNacionalidadesRestringidas === null ? "porcentaje no disponible" : `${visas.datos.porcentajeNacionalidadesRestringidas.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%`}</div><div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Nacionalidad</th><th className="px-4 py-3">Visas solicitadas</th></tr></thead><tbody className="divide-y divide-slate-100">{visas.datos.porNacionalidadRestringida.map((r) => <Fragment key={r.nacionalidad}><tr className="bg-white"><td className="px-4 py-3"><button type="button" className="font-semibold text-blue-700 underline decoration-dotted underline-offset-2 hover:text-blue-900" aria-expanded={nacionalidadVisaExpandida === r.nacionalidad} onClick={() => setNacionalidadVisaExpandida((actual) => actual === r.nacionalidad ? null : r.nacionalidad)}>{r.nacionalidad} <span aria-hidden="true">{nacionalidadVisaExpandida === r.nacionalidad ? "▾" : "▸"}</span></button></td><td className="px-4 py-3 text-slate-700">{numero(r.cantidad)}</td></tr>{nacionalidadVisaExpandida === r.nacionalidad && <tr><td colSpan={2} className="bg-slate-50 px-4 py-4"><div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2">Tipo de visa</th><th className="px-3 py-2">Aprobadas</th><th className="px-3 py-2">Negadas</th><th className="px-3 py-2">Pendientes</th><th className="px-3 py-2">Solicitadas</th></tr></thead><tbody className="divide-y divide-slate-100">{r.porTipo.length ? r.porTipo.map((tipo) => <tr key={tipo.tipoVisa}><td className="px-3 py-2 font-medium text-slate-800">{tipo.tipoVisa}</td><td className="px-3 py-2">{numero(tipo.aprobadas)}</td><td className="px-3 py-2">{numero(tipo.negadas)}</td><td className="px-3 py-2">{numero(tipo.pendientes)}</td><td className="px-3 py-2 font-semibold">{numero(tipo.solicitadas)}</td></tr>) : <tr><td colSpan={5} className="px-3 py-3 text-slate-500">No hay solicitudes de esta nacionalidad en el período.</td></tr>}</tbody></table></div></td></tr>}</Fragment>)}</tbody><tfoot className="bg-slate-50 font-bold text-slate-800"><tr><td className="px-4 py-3">Total de visas restringidas</td><td className="px-4 py-3">{numero(visas.datos.totalNacionalidadesRestringidas)}</td></tr></tfoot></table></div></div></>}
        </Seccion>
        <Seccion titulo="6. Pasaportes, documentos de viaje y autorizaciones para NNA" fuente={{ estado: pasaportes?.estado ?? "error", fuente: pasaportes?.fuente }}>
          {pasaportes?.datos && <div className="grid gap-5 lg:grid-cols-3"><div><h3 className="font-bold text-slate-800">Pasaportes tramitados</h3><Tabla columnas={["Grupo", "Cantidad"]} filas={[["Adultos", numero(pasaportes.datos.tramitados.Adultos)], ["NNA", numero(pasaportes.datos.tramitados.NNA)]]} total={pasaportes.datos.tramitados.total} /></div><div><h3 className="font-bold text-slate-800">Pasaportes recibidos</h3><Tabla columnas={["Grupo", "Cantidad"]} filas={[["Adultos", numero(pasaportes.datos.recibidos.Adultos)], ["NNA", numero(pasaportes.datos.recibidos.NNA)]]} total={pasaportes.datos.recibidos.total} /></div><div><h3 className="font-bold text-slate-800">Pasaportes entregados</h3><Tabla columnas={["Grupo", "Cantidad"]} filas={[["Adultos", numero(pasaportes.datos.entregados.Adultos)], ["NNA", numero(pasaportes.datos.entregados.NNA)]]} total={pasaportes.datos.entregados.total} /></div></div>}
          <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="font-bold text-slate-800">Documentos de Viajes Emitidos</h3>{datos.documentosViaje.disponible && datos.documentosViaje.datos ? <><div className="mt-4 overflow-hidden rounded-xl border border-slate-200"><table className="w-full table-fixed border-collapse text-center text-xs"><thead className="bg-slate-100 uppercase tracking-wide text-slate-600"><tr><th className="w-[27%] border-b border-slate-200 px-1.5 py-2" rowSpan={2}>N° (entregas)</th><th className="border-b border-slate-200 px-1.5 py-2" colSpan={2}>{datos.corteCalendario.mes.toLocaleUpperCase("es-CO")}</th><th className="w-[16%] border-b border-slate-200 px-1.5 py-2" rowSpan={2}>Total</th></tr><tr><th className="w-[28%] border-b border-slate-200 px-1.5 py-2">Paga</th><th className="w-[29%] border-b border-slate-200 px-1.5 py-2">Exenta</th></tr></thead><tbody className="divide-y divide-slate-100"><tr className="bg-white"><th className="px-1.5 py-2 text-left font-medium text-slate-800">Documentos</th><td className="px-1.5 py-2 text-slate-700">{numero(datos.documentosViaje.datos.pagas)}</td><td className="px-1.5 py-2 text-slate-700">{numero(datos.documentosViaje.datos.exentas)}</td><td className="px-1.5 py-2 font-semibold text-slate-800">{numero(datos.documentosViaje.datos.total)}</td></tr></tbody><tfoot className="bg-slate-50 font-bold text-slate-800"><tr><th className="px-1.5 py-2 text-left">Total</th><td className="px-1.5 py-2">{numero(datos.documentosViaje.datos.pagas)}</td><td className="px-1.5 py-2">{numero(datos.documentosViaje.datos.exentas)}</td><td className="px-1.5 py-2">{numero(datos.documentosViaje.datos.total)}</td></tr></tfoot></table></div><p className="mt-2 text-xs text-slate-500">{datos.documentosViaje.datos.fechaUtilizada}</p></> : <p className="mt-2 text-sm text-red-700">No fue posible consultar GestionConsular, DetalleCaja y Caja; el total no se presenta como cero.</p>}</div><div><h3 className="font-bold text-slate-800">Autorizaciones de viaje</h3>{autorizaciones?.datos ? <><Tabla columnas={["Parentesco registrado", "Cantidad"]} filas={autorizaciones.datos.porRelacion.map((r) => [r.modalidad, numero(r.cantidad)])} total={autorizaciones.datos.totalRegistradasComoProcesadasOEntregadas} /><p className="mt-2 text-xs text-amber-800">{datos.autorizacionesViaje.advertencia}</p></> : <p className="mt-2 text-sm text-red-700">No fue posible consultar las autorizaciones.</p>}</div></div>
          <p className="mt-4 text-xs text-slate-500">Tramitados: fecha del recibo y planilla vinculada. Recibidos: fecha de recepción de valija. Entregados: fecha real de entrega. {pasaportes?.datos && `${pasaportes.datos.tramitados.fechaUtilizada} ${pasaportes.datos.recibidos.fechaUtilizada} ${pasaportes.datos.entregados.fechaUtilizada}`}</p>
        </Seccion>
        <Seccion titulo="7. Otras Actuaciones Consulares" fuente={{ estado: otrasActuaciones?.estado ?? "error", fuente: otrasActuaciones?.fuente }}>
          {resumenOtrasActuaciones ? <div className="mt-4 overflow-x-auto rounded-xl border border-slate-300"><table className="min-w-full border-collapse text-left text-sm"><thead className="bg-slate-100 text-center text-xs uppercase tracking-wide text-slate-600"><tr><th className="border border-slate-300 px-4 py-3">Tipo de trámite</th><th className="border border-slate-300 px-4 py-3">Documentos</th><th className="border border-slate-300 px-4 py-3">Cantidad</th></tr></thead><tbody>
            {resumenOtrasActuaciones.poderes.map((fila, indice) => <tr key={`poder-${fila.documento}`} className="bg-white">{indice === 0 && <th className="w-1/4 border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800" rowSpan={resumenOtrasActuaciones.poderes.length}>PODERES</th>}<td className="border border-slate-300 px-4 py-3 text-slate-800">Poder {fila.documento}</td><td className="border border-slate-300 px-4 py-3 text-center text-slate-700">{numero(fila.cantidad)}</td></tr>)}
            {resumenOtrasActuaciones.certificados.map((fila, indice) => <tr key={`certificado-${fila.documento}`} className="bg-white">{indice === 0 && <th className="w-1/4 border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800" rowSpan={resumenOtrasActuaciones.certificados.length}>CERTIFICADOS</th>}<td className="border border-slate-300 px-4 py-3 text-slate-800">{fila.documento}</td><td className="border border-slate-300 px-4 py-3 text-center text-slate-700">{numero(fila.cantidad)}</td></tr>)}
            {resumenOtrasActuaciones.otras.map((fila, indice) => <tr key={`otra-${fila.documento}`} className="bg-white">{indice === 0 && <th className="w-1/4 border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800" rowSpan={resumenOtrasActuaciones.otras.length}>OTRAS</th>}<td className="border border-slate-300 px-4 py-3 text-slate-800">{fila.documento}</td><td className="border border-slate-300 px-4 py-3 text-center text-slate-700">{numero(fila.cantidad)}</td></tr>)}
          </tbody><tfoot className="bg-slate-50 font-bold text-slate-800"><tr><th className="border border-slate-400 px-4 py-3 text-center">TOTAL</th><td className="border border-slate-300 px-4 py-3" /><td className="border border-slate-300 px-4 py-3 text-center">{numero(resumenOtrasActuaciones.total)}</td></tr></tfoot></table><p className="px-3 py-2 text-xs text-slate-500">{resumenOtrasActuaciones.fechaUtilizada}</p></div> : <p className="mt-3 text-sm text-red-700">No fue posible consultar GestionConsular y Caja.</p>}
        </Seccion>
        <Seccion titulo="8. Registro Electoral" fuente={{ estado: registroElectoral?.estado ?? "error", fuente: registroElectoral?.fuente }}>
          {registroElectoral?.datos ? <><Tabla columnas={["N°", "Nombre", "Cédula", "Inserción / Modificación"]} filas={registroElectoral.datos.registros.map((fila) => [fila.numero, fila.nombre || "-", fila.cedula || "-", fila.tipo])} /><p className="mt-2 text-xs text-slate-500">{registroElectoral.datos.fechaUtilizada}</p></> : <p className="mt-3 text-sm text-red-700">No fue posible consultar GestionConsular.</p>}
        </Seccion>
      </div>}
    </div>
  </SistemaLayout>;
}
