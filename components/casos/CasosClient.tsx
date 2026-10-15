"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";
import { CATEGORIAS_CASO } from "@/lib/casosConsularesTypes";
import type { CasoConsular, CategoriaCaso, PendienteRegistroCivil } from "@/lib/casosConsularesTypes";

type FamiliarCaso = { nombre: string; parentesco: string };
type PersonaCaso = { nombre: string; cedula: string };
type PresentanteCaso = { nombre: string; documento: string };
type DatosCaso = Record<string, unknown>;
type Evento = { fecha: string; descripcion: string; usuario?: string };

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const buttonClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const CATEGORIAS_MANUALES = CATEGORIAS_CASO.filter((categoria) => categoria !== "Registro Civil");
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function partesFecha(fecha: string | undefined): { anio: number; mes: number } | null {
  const valor = String(fecha ?? "").trim();
  const iso = valor.match(/^(\d{4})[-/](\d{1,2})/);
  if (iso) return { anio: Number(iso[1]), mes: Number(iso[2]) };
  const diaMesAnio = valor.match(/^\d{1,2}[/-](\d{1,2})[/-](\d{4})/);
  if (diaMesAnio) return { anio: Number(diaMesAnio[2]), mes: Number(diaMesAnio[1]) };
  const parsed = new Date(valor);
  return Number.isNaN(parsed.getTime()) ? null : { anio: parsed.getFullYear(), mes: parsed.getMonth() + 1 };
}

function nombreCasoParaTabla(caso: CasoConsular): string {
  if (caso.categoria !== "Registro Civil") return caso.nombre;
  const titulares = leerLista<unknown>(caso.datos.titulares);
  const titular = titulares.map(texto).find((nombre) => nombre.trim());
  if (titular) return titular;
  const presentantes = leerLista<PresentanteCaso>(caso.datos.presentantes);
  return presentantes.find((presentante) => presentante.nombre?.trim())?.nombre ?? caso.nombre;
}

function leerObjeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function leerLista<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? valor as T[] : [];
}

function texto(valor: unknown): string {
  return typeof valor === "string" || typeof valor === "number" ? String(valor) : "";
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function datosVacios(categoria: CategoriaCaso): DatosCaso {
  const base: DatosCaso = { nombre: "" };
  if (categoria === "NNA") return { ...base, resumen: "", contactoVenezuela: { nombre: "", telefono: "", vinculo: "" }, contactoColombia: { nombre: "", telefono: "", vinculo: "" }, eventos: [] };
  if (categoria === "Personas Privadas de Libertad") return { ...base, genero: "Masculino", cedula: "", centroPenitenciario: "", motivo: "", estatus: "", sentencia: "", fechaCulminacion: "" };
  if (categoria === "Verificación de Identidad") return { ...base, cedula: "", registroDactiloscopico: "No" };
  if (categoria === "Fallecidos") return { ...base, cedula: "", motivo: "Natural", detalleMotivo: "" };
  if (categoria === "Repatriaciones") return { ...base, condicion: "Vivo", cedula: "", fechaRepatriacion: hoyISO(), familiares: [] };
  if (categoria === "Registro Civil") return { ...base, titulares: [""], presentantes: [{ nombre: "", documento: "" }], tipoRegistroCivil: "Nacimiento", eventos: [{ fecha: hoyISO(), descripcion: "" }] };
  return { ...base, personasInvolucradas: [{ nombre: "", cedula: "" }], descripcion: "", eventos: [{ fecha: hoyISO(), descripcion: "" }] };
}

function Campo({ label, value, onChange, type = "text", required = false, placeholder = "", readOnly = false }: {
  label: string; value: unknown; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; readOnly?: boolean;
}) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-600"> *</span>}<input className={`${inputClass} ${readOnly ? "bg-slate-100" : ""}`} type={type} value={texto(value)} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} readOnly={readOnly} /></label>;
}

function Area({ label, value, onChange, required = false, rows = 3 }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean; rows?: number }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-600"> *</span>}<textarea className={inputClass} rows={rows} value={texto(value)} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Lista({ label, value, onChange, opciones, required = false }: { label: string; value: unknown; onChange: (value: string) => void; opciones: string[]; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-600"> *</span>}<select className={inputClass} value={texto(value)} onChange={(event) => onChange(event.target.value)} required={required}>{opciones.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}</select></label>;
}

function EditorEventos({ eventos, onChange, requerido = false, titulo = "Bitácora de eventos" }: { eventos: Evento[]; onChange: (eventos: Evento[]) => void; requerido?: boolean; titulo?: string }) {
  const eventosRequeridos = requerido || eventos.length > 0;
  function cambiar(indice: number, campo: keyof Evento, valor: string) {
    onChange(eventos.map((evento, i) => i === indice ? { ...evento, [campo]: valor } : evento));
  }
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-blue-950">{titulo}{requerido && <span className="text-red-600"> *</span>}</h3><button type="button" onClick={() => onChange([...eventos, { fecha: hoyISO(), descripcion: "" }])} className={`${buttonClass} bg-blue-50 text-blue-800 hover:bg-blue-100`}>+ Evento</button></div>
    {eventos.length === 0 && <p className="text-sm text-slate-500">Todavía no hay eventos registrados.</p>}
    {eventos.map((evento, indice) => <div key={indice} className="grid gap-3 rounded-lg bg-white p-3 md:grid-cols-[180px_1fr_auto]">
      <Campo label="Fecha" type="date" value={evento.fecha} onChange={(valor) => cambiar(indice, "fecha", valor)} required={eventosRequeridos} />
      <Area label="Descripción" value={evento.descripcion} onChange={(valor) => cambiar(indice, "descripcion", valor)} required={eventosRequeridos} />
      <button type="button" onClick={() => onChange(eventos.filter((_, i) => i !== indice))} className={`${buttonClass} self-end text-red-700 hover:bg-red-50`}>Quitar</button>
    </div>)}
  </section>;
}

export default function CasosClient({ esAdmin = false }: { esAdmin?: boolean }) {
  const [casos, setCasos] = useState<CasoConsular[]>([]);
  const [pendientesRegistroCivil, setPendientesRegistroCivil] = useState<PendienteRegistroCivil[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [anioFiltro, setAnioFiltro] = useState(String(new Date().getFullYear()));
  const [mesFiltro, setMesFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"nuevo" | "detalle" | "editar" | null>(null);
  const [seleccionado, setSeleccionado] = useState<CasoConsular | null>(null);
  const [origenRegistroCivil, setOrigenRegistroCivil] = useState<PendienteRegistroCivil | null>(null);
  const [categoriaNueva, setCategoriaNueva] = useState<CategoriaCaso>(CATEGORIAS_CASO[0]);
  const [datos, setDatos] = useState<DatosCaso>(datosVacios(CATEGORIAS_CASO[0]));
  const [guardando, setGuardando] = useState(false);
  const [eventoFecha, setEventoFecha] = useState(hoyISO());
  const [eventoDescripcion, setEventoDescripcion] = useState("");

  const cargarCasos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await fetch("/api/casos", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No fue posible cargar los casos.");
      setCasos(result.casos ?? []);
      setPendientesRegistroCivil(result.pendientesRegistroCivil ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cargar los casos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void cargarCasos(); }, 0);
    return () => window.clearTimeout(timer);
  }, [cargarCasos]);

  const aniosDisponibles = useMemo(() => Array.from(new Set([
    new Date().getFullYear(),
    ...casos.map((caso) => partesFecha(caso.fecha)?.anio),
    ...pendientesRegistroCivil.map((pendiente) => partesFecha(pendiente.fecha)?.anio),
  ].filter((anio): anio is number => typeof anio === "number"))).sort((a, b) => b - a), [casos, pendientesRegistroCivil]);

  const casosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return casos.filter((caso) => {
      const fecha = partesFecha(caso.fecha);
      return fecha?.anio === Number(anioFiltro) && (!mesFiltro || fecha.mes === Number(mesFiltro))
      && (categoriaFiltro === "Todas" || caso.categoria === categoriaFiltro)
      && (!termino || [caso.correlativo, nombreCasoParaTabla(caso), caso.nombre, caso.tipo, caso.categoria].some((valor) => valor.toLocaleLowerCase().includes(termino)));
    });
  }, [casos, categoriaFiltro, busqueda, anioFiltro, mesFiltro]);

  const pendientesRegistroCivilFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return pendientesRegistroCivil.filter((pendiente) =>
      partesFecha(pendiente.fecha)?.anio === Number(anioFiltro)
      && (!mesFiltro || partesFecha(pendiente.fecha)?.mes === Number(mesFiltro))
      && (categoriaFiltro === "Todas" || categoriaFiltro === "Registro Civil")
      && (!termino || [pendiente.recibo, pendiente.actuacion, pendiente.presentante, pendiente.documentoPresentante]
        .some((valor) => valor.toLocaleLowerCase().includes(termino)))
    );
  }, [pendientesRegistroCivil, categoriaFiltro, busqueda, anioFiltro, mesFiltro]);

  const resumenCasos = useMemo(() => {
    const tipos = Object.fromEntries(CATEGORIAS_CASO.map((categoria) => [categoria, { total: 0, abiertos: 0, finalizados: 0 }])) as Record<CategoriaCaso, { total: number; abiertos: number; finalizados: number }>;
    let abiertos = 0;
    let finalizados = 0;
    for (const caso of casos) {
      tipos[caso.categoria].total += 1;
      if (caso.estado === "Finalizado") {
        finalizados += 1;
        tipos[caso.categoria].finalizados += 1;
      }
      else {
        abiertos += 1;
        tipos[caso.categoria].abiertos += 1;
      }
    }
    tipos["Registro Civil"].total += pendientesRegistroCivil.length;
    tipos["Registro Civil"].abiertos += pendientesRegistroCivil.length;
    abiertos += pendientesRegistroCivil.length;
    return { total: casos.length + pendientesRegistroCivil.length, abiertos, finalizados, tipos };
  }, [casos, pendientesRegistroCivil]);

  function abrirNuevo() {
    setCategoriaNueva(CATEGORIAS_CASO[0]);
    setDatos(datosVacios(CATEGORIAS_CASO[0]));
    setSeleccionado(null);
    setOrigenRegistroCivil(null);
    setError("");
    setModal("nuevo");
  }

  function abrirDetalle(caso: CasoConsular) {
    setSeleccionado(caso);
    setOrigenRegistroCivil(null);
    setError("");
    setModal("detalle");
  }

  function abrirRegistroCivilPendiente(pendiente: PendienteRegistroCivil) {
    setSeleccionado(null);
    setOrigenRegistroCivil(pendiente);
    setCategoriaNueva("Registro Civil");
    setDatos({
      ...datosVacios("Registro Civil"),
      presentantes: [{ nombre: pendiente.presentante, documento: pendiente.documentoPresentante }],
      tipoRegistroCivil: pendiente.tipoRegistroCivil,
    });
    setError("");
    setModal("nuevo");
  }

  function editarCaso() {
    if (!seleccionado) return;
    setCategoriaNueva(seleccionado.categoria);
    setDatos(structuredClone(seleccionado.datos));
    setError("");
    setModal("editar");
  }

  function setCampo(campo: string, valor: unknown) {
    setDatos((actual: DatosCaso) => ({ ...actual, [campo]: valor }));
  }

  function setSubcampo(campo: string, subcampo: string, valor: string) {
    setDatos((actual: DatosCaso) => ({ ...actual, [campo]: { ...(actual[campo] ?? {}), [subcampo]: valor } }));
  }

  async function guardarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const url = modal === "editar" && seleccionado ? `/api/casos/${encodeURIComponent(seleccionado.id)}` : "/api/casos";
      const response = await fetch(url, {
        method: modal === "editar" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: categoriaNueva, datos, ...(origenRegistroCivil ? { referenciaCaja: { recibo: origenRegistroCivil.recibo, codigoActuacion: origenRegistroCivil.codigoActuacion } } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No fue posible guardar el caso.");
      setModal("detalle");
      setSeleccionado(result.caso);
      setOrigenRegistroCivil(null);
      await cargarCasos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar el caso.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEvento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seleccionado) return;
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(`/api/casos/${encodeURIComponent(seleccionado.id)}/eventos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: eventoFecha, descripcion: eventoDescripcion }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No fue posible añadir el evento.");
      setSeleccionado(result.caso);
      setEventoDescripcion("");
      setEventoFecha(hoyISO());
      await cargarCasos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible añadir el evento.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoCaso() {
    if (!seleccionado || !esAdmin) return;
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(`/api/casos/${encodeURIComponent(seleccionado.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: seleccionado.estado === "Finalizado" ? "Abierto" : "Finalizado" }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No fue posible cambiar el estado.");
      setSeleccionado(result.caso);
      await cargarCasos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cambiar el estado.");
    } finally {
      setGuardando(false);
    }
  }

  async function descargarPdfCaso() {
    if (!seleccionado) return;
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(`/api/casos/${encodeURIComponent(seleccionado.id)}/pdf`);
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "No fue posible generar el PDF.");
      }
      const archivo = await response.blob();
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `${seleccionado.correlativo}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible generar el PDF.");
    } finally {
      setGuardando(false);
    }
  }

  function renderFormulario(categoria: CategoriaCaso, value: DatosCaso, setValue: (campo: string, valor: unknown) => void, incluirBitacora = true) {
    const eventoSetter = (eventos: Evento[]) => setValue("eventos", eventos);
    const familiaresActuales = leerLista<FamiliarCaso>(value.familiares);
    const personasActuales = leerLista<PersonaCaso>(value.personasInvolucradas);
    const contactoVenezuela = leerObjeto(value.contactoVenezuela);
    const contactoColombia = leerObjeto(value.contactoColombia);
    const eventosActuales = leerLista<Evento>(value.eventos);
    const titularesActuales = leerLista<string>(value.titulares);
    const presentantesActuales = leerLista<PresentanteCaso>(value.presentantes);
    return <div className="space-y-4">
      {categoria !== "Registro Civil" && <Campo label="Nombre completo" value={value.nombre} onChange={(dato) => setValue("nombre", dato)} required />}
      {categoria === "NNA" && <>
        <Area label="Resumen del caso" value={value.resumen} onChange={(dato) => setValue("resumen", dato)} required />
        {(["Venezuela", "Colombia"] as const).map((pais) => {
          const contacto = pais === "Venezuela" ? contactoVenezuela : contactoColombia;
          return <fieldset key={pais} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-3"><legend className="px-1 text-sm font-bold text-blue-950">Contacto en {pais} (opcional)</legend>{([ ["nombre", "Nombre"], ["telefono", "Teléfono"], ["vinculo", "Vínculo"] ] as const).map(([campo, label]) => <Campo key={campo} label={label} value={contacto[campo]} onChange={(dato) => setSubcampo(`contacto${pais}`, campo, dato)} />)}</fieldset>;
        })}
        {incluirBitacora && <EditorEventos eventos={eventosActuales} onChange={eventoSetter} />}
      </>}
      {categoria === "Personas Privadas de Libertad" && <>
        <div className="grid gap-4 md:grid-cols-2"><Lista label="Género" value={value.genero} onChange={(dato) => setValue("genero", dato)} opciones={["Masculino", "Femenino"]} required /><Campo label="Cédula" value={value.cedula} onChange={(dato) => setValue("cedula", dato)} required /><Campo label="Centro penitenciario" value={value.centroPenitenciario} onChange={(dato) => setValue("centroPenitenciario", dato)} required /><Campo label="Motivo" value={value.motivo} onChange={(dato) => setValue("motivo", dato)} /><Campo label="Estatus" value={value.estatus} onChange={(dato) => setValue("estatus", dato)} /><Campo label="Fecha de culminación" type="date" value={value.fechaCulminacion} onChange={(dato) => setValue("fechaCulminacion", dato)} /></div><Area label="Sentencia" value={value.sentencia} onChange={(dato) => setValue("sentencia", dato)} />
      </>}
      {categoria === "Verificación de Identidad" && <div className="grid gap-4 md:grid-cols-2"><Campo label="Cédula" value={value.cedula} onChange={(dato) => setValue("cedula", dato)} required /><Lista label="Registro dactiloscópico" value={value.registroDactiloscopico} onChange={(dato) => setValue("registroDactiloscopico", dato)} opciones={["Sí", "No"]} required /></div>}
      {categoria === "Fallecidos" && <div className="grid gap-4 md:grid-cols-2"><Campo label="Cédula" value={value.cedula} onChange={(dato) => setValue("cedula", dato)} required /><Lista label="Motivo" value={value.motivo} onChange={(dato) => setValue("motivo", dato)} opciones={["Homicidio", "Suicidio", "Natural", "Otros"]} required /><Campo label="Detalle del motivo" value={value.detalleMotivo} onChange={(dato) => setValue("detalleMotivo", dato)} /></div>}
      {categoria === "Repatriaciones" && <>
        <div className="grid gap-4 md:grid-cols-2"><Lista label="Condición" value={value.condicion} onChange={(dato) => { setValue("condicion", dato); if (dato === "Fallecido") setValue("familiares", []); }} opciones={["Vivo", "Fallecido"]} required /><Campo label="Cédula" value={value.cedula} onChange={(dato) => setValue("cedula", dato)} required /><Campo label="Fecha de repatriación" type="date" value={value.fechaRepatriacion} onChange={(dato) => setValue("fechaRepatriacion", dato)} required /></div>
        {value.condicion === "Vivo" && <section className="space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-blue-950">Núcleo familiar (opcional)</h3><button type="button" className={`${buttonClass} bg-blue-50 text-blue-800`} onClick={() => setValue("familiares", [...familiaresActuales, { nombre: "", parentesco: "" }])}>+ Familiar</button></div>{familiaresActuales.map((familiar, indice) => <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={indice}><Campo label="Nombre" value={familiar.nombre} onChange={(dato) => setValue("familiares", familiaresActuales.map((item, i) => i === indice ? { ...item, nombre: dato } : item))} /><Campo label="Parentesco" value={familiar.parentesco} onChange={(dato) => setValue("familiares", familiaresActuales.map((item, i) => i === indice ? { ...item, parentesco: dato } : item))} /><button type="button" onClick={() => setValue("familiares", familiaresActuales.filter((_, i) => i !== indice))} className={`${buttonClass} self-end text-red-700`}>Quitar</button></div>)}</section>}
      </>}
      {categoria === "Casos Especiales" && <>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-blue-950">Personas involucradas <span className="text-red-600">*</span></h3><button type="button" className={`${buttonClass} bg-blue-50 text-blue-800`} onClick={() => setValue("personasInvolucradas", [...personasActuales, { nombre: "", cedula: "" }])}>+ Persona</button></div>{personasActuales.map((persona, indice) => <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={indice}><Campo label="Nombre" value={persona.nombre} onChange={(dato) => setValue("personasInvolucradas", personasActuales.map((item, i) => i === indice ? { ...item, nombre: dato } : item))} required /><Campo label="Cédula" value={persona.cedula} onChange={(dato) => setValue("personasInvolucradas", personasActuales.map((item, i) => i === indice ? { ...item, cedula: dato } : item))} required /><button type="button" onClick={() => setValue("personasInvolucradas", personasActuales.filter((_, i) => i !== indice))} className={`${buttonClass} self-end text-red-700`}>Quitar</button></div>)}</section>
        <Area label="Descripción del caso" value={value.descripcion} onChange={(dato) => setValue("descripcion", dato)} required rows={10} />
        {incluirBitacora && <EditorEventos eventos={eventosActuales} onChange={eventoSetter} requerido />}
      </>}
      {categoria === "Registro Civil" && <>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-blue-950">Presentantes <span className="text-red-600">*</span></h3><button type="button" className={`${buttonClass} bg-blue-50 text-blue-800`} onClick={() => setValue("presentantes", [...presentantesActuales, { nombre: "", documento: "" }])}>+ Presentante</button></div>{presentantesActuales.map((presentante, indice) => <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={indice}><Campo label={`Nombre del presentante ${indice + 1}`} value={presentante.nombre} onChange={(dato) => setValue("presentantes", presentantesActuales.map((item, i) => i === indice ? { ...item, nombre: dato } : item))} required readOnly={Boolean(origenRegistroCivil && indice === 0 && origenRegistroCivil.presentante)} /><Campo label="Cédula de identidad o pasaporte" value={presentante.documento} onChange={(dato) => setValue("presentantes", presentantesActuales.map((item, i) => i === indice ? { ...item, documento: dato } : item))} required readOnly={Boolean(origenRegistroCivil && indice === 0 && origenRegistroCivil.documentoPresentante)} /><button type="button" disabled={presentantesActuales.length <= 1 || (Boolean(origenRegistroCivil) && indice === 0)} onClick={() => setValue("presentantes", presentantesActuales.filter((_, i) => i !== indice))} className={`${buttonClass} self-end text-red-700 disabled:opacity-40`}>Quitar</button></div>)}</section>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-blue-950">Titulares <span className="text-red-600">*</span></h3><button type="button" className={`${buttonClass} bg-blue-50 text-blue-800`} onClick={() => setValue("titulares", [...titularesActuales, ""])}>+ Titular</button></div>{titularesActuales.map((titular, indice) => <div className="grid gap-3 md:grid-cols-[1fr_auto]" key={indice}><Campo label={`Nombre del titular ${indice + 1}`} value={titular} onChange={(dato) => setValue("titulares", titularesActuales.map((item, i) => i === indice ? dato : item))} required /><button type="button" disabled={titularesActuales.length <= 1} onClick={() => setValue("titulares", titularesActuales.filter((_, i) => i !== indice))} className={`${buttonClass} self-end text-red-700 disabled:opacity-40`}>Quitar</button></div>)}</section>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><span className="text-xs font-bold uppercase tracking-wide text-blue-800">Tipo de Registro Civil · determinado por la actuación</span><p className="mt-1 font-semibold text-blue-950">{texto(value.tipoRegistroCivil)}</p></div>
        {incluirBitacora && <EditorEventos eventos={eventosActuales} onChange={eventoSetter} requerido titulo="Bitácora de hechos" />}
      </>}
    </div>;
  }

  function mostrarValor(valor: unknown): string {
    if (typeof valor === "boolean") return valor ? "Sí" : "No";
    if (Array.isArray(valor)) return valor.map((item) => typeof item === "object" ? Object.values(item).filter(Boolean).join(" · ") : String(item)).join(", ");
    if (valor && typeof valor === "object") return Object.entries(valor as Record<string, unknown>).filter(([, item]) => item).map(([clave, item]) => `${clave}: ${item}`).join(" · ");
    return String(valor ?? "—") || "—";
  }

  return <SistemaLayout titulo="Casos Consulares" permiso={MODULOS.CASOS}>
    <main className="space-y-5 rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <header><h1 className="text-2xl font-bold text-blue-950">Casos Consulares</h1><p className="mt-1 text-sm text-slate-500">Registro y seguimiento de casos consulares</p></header>
      <section aria-label="Resumen de casos" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border-l-4 border-blue-700 bg-blue-50 p-6 shadow-md">
          <h2 className="text-lg font-bold text-blue-950">Total de casos</h2>
          <p className="mt-2 text-4xl font-extrabold text-blue-900">{cargando ? "—" : resumenCasos.total.toLocaleString("es-CO")}</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">{CATEGORIAS_CASO.map((categoria) => <li key={categoria} className="flex justify-between gap-3"><span>{categoria}</span><span className="font-semibold text-slate-800">{cargando ? "—" : resumenCasos.tipos[categoria].total}</span></li>)}</ul>
        </article>
        <article className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-6 shadow-md">
          <h2 className="text-lg font-bold text-blue-950">Casos abiertos</h2>
          <p className="mt-2 text-4xl font-extrabold text-amber-700">{cargando ? "—" : resumenCasos.abiertos.toLocaleString("es-CO")}</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">{CATEGORIAS_CASO.map((categoria) => <li key={categoria} className="flex justify-between gap-3"><span>{categoria}</span><span className="font-semibold text-slate-800">{cargando ? "—" : resumenCasos.tipos[categoria].abiertos}</span></li>)}</ul>
        </article>
        <article className="rounded-2xl border-l-4 border-emerald-700 bg-green-50 p-6 shadow-md">
          <h2 className="text-lg font-bold text-blue-950">Casos cerrados</h2>
          <p className="mt-2 text-4xl font-extrabold text-emerald-800">{cargando ? "—" : resumenCasos.finalizados.toLocaleString("es-CO")}</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">{CATEGORIAS_CASO.map((categoria) => <li key={categoria} className="flex justify-between gap-3"><span>{categoria}</span><span className="font-semibold text-slate-800">{cargando ? "—" : resumenCasos.tipos[categoria].finalizados}</span></li>)}</ul>
        </article>
      </section>
      <div className="flex justify-end">
        <button onClick={abrirNuevo} className={`${buttonClass} bg-blue-700 text-white hover:bg-blue-800`}>+ Nuevo caso</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(130px,0.55fr)_minmax(150px,0.65fr)_minmax(190px,0.8fr)_minmax(220px,1fr)]">
        <label className="text-sm font-semibold text-slate-700">Año<select className={inputClass} value={anioFiltro} onChange={(event) => setAnioFiltro(event.target.value)}>{aniosDisponibles.map((anio) => <option key={anio} value={anio}>{anio}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Mes<select className={inputClass} value={mesFiltro} onChange={(event) => setMesFiltro(event.target.value)}><option value="">Todos los meses</option>{MESES.map((mes, indice) => <option key={mes} value={String(indice + 1)}>{mes}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Categoría<select className={inputClass} value={categoriaFiltro} onChange={(event) => setCategoriaFiltro(event.target.value)}><option>Todas</option>{CATEGORIAS_CASO.map((categoria) => <option key={categoria}>{categoria}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Buscar<input className={inputClass} value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Correlativo, nombre o tipo" /></label>
      </div>
      {error && !modal && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[760px] w-full border-collapse text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Recibo / Caso</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{cargando ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Cargando casos…</td></tr> : casosFiltrados.length === 0 && pendientesRegistroCivilFiltrados.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay casos que coincidan con la búsqueda.</td></tr>: <>{pendientesRegistroCivilFiltrados.map((pendiente) => <tr key={`caja-${pendiente.recibo}-${pendiente.codigoActuacion}`} onClick={() => abrirRegistroCivilPendiente(pendiente)} className="cursor-pointer bg-amber-50/50 hover:bg-amber-50"><td className="px-4 py-3 font-bold text-blue-800">{pendiente.recibo}</td><td className="px-4 py-3 font-medium text-slate-800">{pendiente.presentante || "Presentante por completar"}</td><td className="px-4 py-3 text-slate-700">{pendiente.actuacion}</td><td className="px-4 py-3 text-slate-600">{pendiente.fecha ? new Date(pendiente.fecha).toLocaleDateString("es-CO") : "—"}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pendiente por completar</span></td></tr>)}{casosFiltrados.map((caso) => <tr key={caso.id} onClick={() => abrirDetalle(caso)} className="cursor-pointer hover:bg-blue-50"><td className="px-4 py-3 font-bold text-blue-800">{caso.correlativo}</td><td className="px-4 py-3 font-medium text-slate-800">{nombreCasoParaTabla(caso)}</td><td className="px-4 py-3 text-slate-700">{caso.tipo}</td><td className="px-4 py-3 text-slate-600">{caso.fecha ? new Date(caso.fecha).toLocaleDateString("es-CO") : "—"}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${caso.estado === "Finalizado" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>{caso.estado === "Finalizado" ? "Finalizado" : "Abierto"}</span></td></tr>)}</>}</tbody></table></div>
    </main>

    {modal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-1 sm:p-2" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section role="dialog" aria-modal="true" className="flex h-[98dvh] max-h-[98dvh] w-[98vw] max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="text-xl font-bold text-blue-950">{modal === "nuevo" ? "Nuevo caso consular" : modal === "editar" ? `Editar ${seleccionado?.correlativo ?? "caso"}` : `${seleccionado?.correlativo ?? "Caso"} · ${seleccionado?.categoria ?? ""}`}</h2>{seleccionado && modal === "detalle" && <p className="mt-1 text-sm text-slate-500">{seleccionado.nombre}</p>}</div><button aria-label="Cerrar" onClick={() => setModal(null)} className="rounded-md px-2 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {(modal === "nuevo" || modal === "editar") ? <form onSubmit={guardarFormulario} className="space-y-5">
          {modal === "nuevo" && !origenRegistroCivil && <Lista label="Categoría del caso" value={categoriaNueva} onChange={(categoria) => { const nueva = categoria as CategoriaCaso; setCategoriaNueva(nueva); setDatos(datosVacios(nueva)); }} opciones={[...CATEGORIAS_MANUALES]} required />}
          {origenRegistroCivil && <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-3"><div><span className="text-xs font-bold uppercase text-blue-700">Recibo de Caja</span><p className="mt-1 font-semibold text-blue-950">{origenRegistroCivil.recibo}</p></div><div><span className="text-xs font-bold uppercase text-blue-700">Actuación</span><p className="mt-1 font-semibold text-blue-950">{origenRegistroCivil.actuacion}</p></div><div><span className="text-xs font-bold uppercase text-blue-700">Presentante precargado</span><p className="mt-1 font-semibold text-blue-950">{origenRegistroCivil.presentante || "Completar nombre"}</p></div></div>}
          {renderFormulario(categoriaNueva, datos, setCampo, modal === "nuevo")}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => modal === "editar" ? setModal("detalle") : setModal(null)} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancelar</button><button disabled={guardando} className={`${buttonClass} bg-blue-700 text-white`}>{guardando ? "Guardando…" : modal === "editar" ? "Guardar cambios" : "Crear caso"}</button></div>
        </form> : seleccionado && <div className="space-y-5">
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div><span className="text-xs font-bold uppercase text-slate-500">Nombre</span><p className="mt-1 font-medium text-slate-800">{seleccionado.nombre}</p></div><div><span className="text-xs font-bold uppercase text-slate-500">Fecha de registro</span><p className="mt-1 text-slate-800">{new Date(seleccionado.fecha).toLocaleString("es-CO")}</p></div><div><span className="text-xs font-bold uppercase text-slate-500">Creado por</span><p className="mt-1 text-slate-800">{seleccionado.creadoPor}</p></div><div><span className="text-xs font-bold uppercase text-slate-500">Última actualización</span><p className="mt-1 text-slate-800">{seleccionado.actualizadoPor} · {seleccionado.actualizadoEl ? new Date(seleccionado.actualizadoEl).toLocaleString("es-CO") : "—"}</p></div></div>
          {seleccionado.reciboCaja && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><span className="text-xs font-bold uppercase tracking-wide text-blue-700">Origen de Caja</span><p className="mt-1 text-sm font-semibold text-blue-950">Recibo {seleccionado.reciboCaja} · Actuación {seleccionado.codigoActuacion}</p></div>}
          <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(seleccionado.datos).filter(([key]) => key !== "eventos").map(([key, valor]) => <div className={`rounded-lg border border-slate-200 p-3 ${key === "descripcion" ? "sm:col-span-2" : ""}`} key={key}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{({ nombre: "Nombre", resumen: "Resumen", cedula: "Cédula", genero: "Género", centroPenitenciario: "Centro penitenciario", motivo: "Motivo", estatus: "Estatus", sentencia: "Sentencia", fechaCulminacion: "Fecha de culminación", registroDactiloscopico: "Registro dactiloscópico", detalleMotivo: "Detalle del motivo", condicion: "Condición", fechaRepatriacion: "Fecha de repatriación", familiares: "Núcleo familiar", personasInvolucradas: "Personas involucradas", titulares: "Titulares", presentantes: "Presentantes", tipoRegistroCivil: "Tipo de Registro Civil", descripcion: "Descripción", contactoVenezuela: "Contacto en Venezuela", contactoColombia: "Contacto en Colombia" } as Record<string,string>)[key] ?? key}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{mostrarValor(valor)}</dd></div>)}</dl>
          {Array.isArray(seleccionado.datos.eventos) && <section className="space-y-3"><h3 className="font-bold text-blue-950">Bitácora de eventos</h3>{seleccionado.datos.eventos.length ? seleccionado.datos.eventos.map((evento: Evento, indice: number) => <article key={`${evento.fecha}-${indice}`} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-blue-900">{new Date(`${evento.fecha}T00:00:00`).toLocaleDateString("es-CO")}</strong><span className="text-xs text-slate-500">Registrado por {evento.usuario || seleccionado.creadoPor}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{evento.descripcion}</p></article>) : <p className="text-sm text-slate-500">Sin eventos registrados.</p>}</section>}
          {Array.isArray(seleccionado.datos.eventos) && <form onSubmit={guardarEvento} className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-[180px_1fr_auto] md:items-end"><Campo label="Fecha del evento" type="date" value={eventoFecha} onChange={setEventoFecha} required /><Area label="Descripción del evento" value={eventoDescripcion} onChange={setEventoDescripcion} required /><button disabled={guardando} className={`${buttonClass} bg-blue-700 text-white`}>{guardando ? "Guardando…" : "Añadir evento"}</button></form>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button disabled={guardando} onClick={() => void descargarPdfCaso()} className={`${buttonClass} border border-slate-300 text-slate-700 hover:bg-slate-50`}>Guardar caso en PDF</button>{esAdmin && <button disabled={guardando} onClick={() => void cambiarEstadoCaso()} className={`${buttonClass} ${seleccionado.estado === "Finalizado" ? "bg-amber-100 text-amber-900 hover:bg-amber-200" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>{seleccionado.estado === "Finalizado" ? "Reabrir caso" : "Finalizar"}</button>}<button onClick={editarCaso} className={`${buttonClass} border border-blue-200 text-blue-800 hover:bg-blue-50`}>Editar caso</button><button onClick={() => setModal(null)} className={`${buttonClass} bg-slate-100 text-slate-700`}>Cerrar</button></div>
        </div>}
      </div></section></div>}
  </SistemaLayout>;
}
