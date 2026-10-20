"use client";

import { FormEvent, useState } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";

interface Expediente {
  documento: string;
  cedula: string;
  pasaporte: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  nacionalidad: string;
  datosRegistro: Array<{ indice: number; etiqueta: string; valor: string }>;
  datosEditables: {
    direccionColombia: string;
    direccionVenezuela: string;
    contactoColombiaNombre: string;
    contactoColombiaTelefono: string;
    contactoExtranjeroNombre: string;
    contactoExtranjeroTelefono: string;
    fotoOrigen: "expediente" | "constancia" | "ninguna";
    actualizadoEl: string;
    actualizadoPor: string;
    tieneHijos: boolean | null;
    hijos: Hijo[];
  };
  fotoUrl: string;
  visitas: Array<{ fecha: string; tipo: string; referencia: string; detalle?: string }>;
  tramites: Array<{ fecha: string; tipo: string; referencia: string; estado?: string; detalle?: string }>;
}

interface CasoResumen {
  correlativo: string;
  nombre: string;
  tipo: string;
  categoria: string;
  fecha: string;
  estado: string;
}

interface Hijo {
  nombre: string;
  genero: "Masculino" | "Femenino" | "";
  fechaNacimiento: string;
}

type FormularioExpediente = Pick<Expediente["datosEditables"],
  | "direccionColombia"
  | "direccionVenezuela"
  | "contactoColombiaNombre"
  | "contactoColombiaTelefono"
  | "contactoExtranjeroNombre"
  | "contactoExtranjeroTelefono"
> & Pick<Expediente["datosEditables"], "tieneHijos" | "hijos">;

const formularioVacio: FormularioExpediente = {
  direccionColombia: "",
  direccionVenezuela: "",
  contactoColombiaNombre: "",
  contactoColombiaTelefono: "",
  contactoExtranjeroNombre: "",
  contactoExtranjeroTelefono: "",
  tieneHijos: null,
  hijos: [],
};

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</div>
      <div className="mt-1 break-words text-sm text-slate-800">{valor || "—"}</div>
    </div>
  );
}

function Entrada({ etiqueta, value, onChange, multiline = false, type = "text", disabled = false, placeholder }: {
  etiqueta: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const clases = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {etiqueta}
      {multiline ? <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} className={`${clases} disabled:bg-slate-100 disabled:text-slate-500`} />
        : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} className={`${clases} disabled:bg-slate-100 disabled:text-slate-500`} />}
    </label>
  );
}

function Historial({ titulo, items, vacio }: {
  titulo: string;
  items: Array<{ fecha: string; tipo: string; referencia: string; estado?: string; detalle?: string; documentos?: Array<{ nombre: string; estado: string }> }>;
  vacio: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-blue-950">{titulo} <span className="text-sm font-medium text-slate-500">({items.length})</span></h2>
      {items.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{vacio}</p> : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={`${item.fecha}-${item.referencia}-${index}`} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-blue-900">{item.tipo}{item.referencia ? ` · ${item.referencia}` : ""}</strong>
                <span className="text-sm text-slate-500">{item.fecha || "Fecha no indicada"}</span>
              </div>
              {item.estado && <div className="mt-1 text-sm text-slate-600">Estado: {item.estado}</div>}
              {item.documentos && item.documentos.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Avance documental</div>
                  {item.detalle && <p className="text-sm font-medium text-slate-700">{item.detalle}</p>}
                  <div className="flex flex-wrap gap-2">
                    {item.documentos.map((documento, indice) => (
                      <span key={`${documento.nombre}-${indice}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${documento.estado === "En Proceso" ? "bg-amber-100 text-amber-800" : documento.estado === "Procesado" ? "bg-blue-100 text-blue-800" : documento.estado === "Entregado" ? "bg-emerald-100 text-emerald-800" : documento.estado === "Entregado por correo" ? "bg-violet-100 text-violet-800" : "bg-red-100 text-red-800"}`}>
                        {documento.estado}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.detalle && !item.documentos?.length && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.detalle}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CasosRelacionados({ casos }: { casos: CasoResumen[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-blue-950">Casos consulares <span className="text-sm font-medium text-slate-500">({casos.length})</span></h2>
      {casos.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No hay casos asociados a este documento.</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr><th className="px-4 py-3">Recibo / Caso</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casos.map((caso) => (
                <tr key={`${caso.correlativo}-${caso.categoria}`}>
                  <td className="px-4 py-3 font-bold text-blue-800">{caso.correlativo || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{caso.nombre || "—"}</td>
                  <td className="px-4 py-3 text-slate-700"><span>{caso.tipo || "—"}</span><span className="mt-1 block text-xs text-slate-500">{caso.categoria}</span></td>
                  <td className="px-4 py-3 text-slate-600">{caso.fecha ? new Date(caso.fecha).toLocaleDateString("es-CO") : "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${caso.estado === "Finalizado" ? "bg-slate-200 text-slate-700" : caso.estado === "Eliminado" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{caso.estado || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function datosComplementariosNormalizados(datos: Partial<FormularioExpediente> | undefined) {
  return {
    direccionColombia: datos?.direccionColombia ?? "",
    direccionVenezuela: datos?.direccionVenezuela ?? "",
    contactoColombiaNombre: datos?.contactoColombiaNombre ?? "",
    contactoColombiaTelefono: datos?.contactoColombiaTelefono ?? "",
    contactoExtranjeroNombre: datos?.contactoExtranjeroNombre ?? "",
    contactoExtranjeroTelefono: datos?.contactoExtranjeroTelefono ?? "",
    tieneHijos: datos?.tieneHijos ?? null,
    hijos: Array.isArray(datos?.hijos)
      ? datos.hijos.map((hijo) => ({
        nombre: hijo.nombre ?? "",
        genero: hijo.genero ?? "",
        fechaNacimiento: hijo.fechaNacimiento ?? "",
      }))
      : [],
  };
}

export default function ExpedienteCiudadanoPage() {
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [casosRelacionados, setCasosRelacionados] = useState<CasoResumen[]>([]);
  const [formulario, setFormulario] = useState<FormularioExpediente>(formularioVacio);
  const [datosGenerales, setDatosGenerales] = useState<string[]>(Array(18).fill(""));
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [puedeEditar, setPuedeEditar] = useState(false);
  const hayCambiosComplementarios = Boolean(expediente) &&
    JSON.stringify(datosComplementariosNormalizados(formulario)) !==
    JSON.stringify(datosComplementariosNormalizados(expediente?.datosEditables));
  const hayCambiosGenerales = Boolean(expediente) && JSON.stringify(datosGenerales) !== JSON.stringify(
    Array.from({ length: 18 }, (_, indice) => expediente?.datosRegistro.find((dato) => dato.indice === indice + 1)?.valor ?? "")
  );

  function limpiarBusqueda() {
    setNumeroDocumento("");
    setExpediente(null);
    setCasosRelacionados([]);
    setFormulario(formularioVacio);
    setDatosGenerales(Array(18).fill(""));
    setPuedeEditar(false);
    setError("");
    setMensaje("");
  }

  function limpiarInformacionComplementaria() {
    setFormulario((actual) => ({
      ...actual,
      direccionColombia: "",
      direccionVenezuela: "",
      contactoColombiaNombre: "",
      contactoColombiaTelefono: "",
      contactoExtranjeroNombre: "",
      contactoExtranjeroTelefono: "",
      tieneHijos: false,
      hijos: [],
    }));
    setError("");
    setMensaje("");
  }

  function actualizar(campo: keyof FormularioExpediente, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function actualizarHijo(indice: number, campo: keyof Hijo, valor: string) {
    setFormulario((anterior) => ({
      ...anterior,
      hijos: anterior.hijos.map((hijo, actual) => actual === indice ? { ...hijo, [campo]: valor } : hijo),
    }));
  }

  function actualizarRespuestaHijos(valor: string) {
    setFormulario((anterior) => ({
      ...anterior,
      tieneHijos: valor === "si" ? true : valor === "no" ? false : null,
      hijos: valor === "no" ? [] : anterior.hijos,
    }));
  }

  function agregarHijo() {
    setFormulario((anterior) => ({
      ...anterior,
      hijos: [...anterior.hijos, { nombre: "", genero: "", fechaNacimiento: "" }],
    }));
  }

  async function buscar(event: FormEvent) {
    event.preventDefault();
    if (!numeroDocumento.trim()) {
      setError("Ingrese un número de documento para buscar.");
      return;
    }
    setBuscando(true);
    setError("");
    setMensaje("");
    setExpediente(null);
    setCasosRelacionados([]);
    try {
      const response = await fetch(`/api/expedienteciudadano?documento=${encodeURIComponent(numeroDocumento.trim())}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo buscar el expediente.");
      setCasosRelacionados(Array.isArray(data.casos) ? data.casos : []);
      if (!data.encontrado) {
        setFormulario(formularioVacio);
        setError(Array.isArray(data.casos) && data.casos.length > 0
          ? "No se encontró al ciudadano en el Registro Consular; sí hay casos consulares asociados al documento."
          : "No se encontró al ciudadano en el Registro Consular ni hay casos consulares asociados.");
        return;
      }
      const item = data.expediente as Expediente;
      setPuedeEditar(data.puedeEditar === true);
      setExpediente(item);
      setDatosGenerales(Array.from({ length: 18 }, (_, indice) => item.datosRegistro.find((dato) => dato.indice === indice + 1)?.valor ?? ""));
      setFormulario({
        direccionColombia: item.datosEditables.direccionColombia,
        direccionVenezuela: item.datosEditables.direccionVenezuela,
        contactoColombiaNombre: item.datosEditables.contactoColombiaNombre,
        contactoColombiaTelefono: item.datosEditables.contactoColombiaTelefono,
        contactoExtranjeroNombre: item.datosEditables.contactoExtranjeroNombre,
        contactoExtranjeroTelefono: item.datosEditables.contactoExtranjeroTelefono,
        tieneHijos: typeof item.datosEditables?.tieneHijos === "boolean" ? item.datosEditables.tieneHijos : null,
        hijos: Array.isArray(item.datosEditables?.hijos) ? item.datosEditables.hijos.map((hijo) => ({ ...hijo })) : [],
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error buscando el expediente.");
    } finally {
      setBuscando(false);
    }
  }

  async function guardarDatos() {
    if (!expediente) return;
    if (formulario.tieneHijos === null) {
      setError("Indique si el ciudadano tiene hijos.");
      return;
    }
    if (formulario.tieneHijos && (
      formulario.hijos.length === 0 ||
      formulario.hijos.some((hijo) => !hijo.nombre.trim() || !hijo.genero || !hijo.fechaNacimiento)
    )) {
      setError("Complete nombre, género y fecha de nacimiento de cada hijo.");
      return;
    }
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const response = await fetch("/api/expedienteciudadano", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: expediente.documento, ...formulario }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible guardar los cambios.");
      setMensaje("Datos adicionales guardados.");
      await recargarExpediente(expediente.documento);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarInformacionGeneral() {
    if (!expediente) return;
    if (!datosGenerales[0]?.trim() && !datosGenerales[13]?.trim()) {
      setError("Debe conservar una cédula o un pasaporte.");
      return;
    }
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const response = await fetch("/api/expedienteciudadano", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: expediente.documento, documentoOriginal: expediente.documento, datosGenerales }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible guardar la información general.");
      const nuevoDocumento = datosGenerales[0]?.trim() || datosGenerales[13]?.trim() || expediente.documento;
      setNumeroDocumento(nuevoDocumento);
      setMensaje("Información general guardada en Registro Consular.");
      await recargarExpediente(nuevoDocumento);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar la información general.");
    } finally {
      setGuardando(false);
    }
  }

  async function recargarExpediente(documento: string) {
    const response = await fetch(`/api/expedienteciudadano?documento=${encodeURIComponent(documento)}`, { credentials: "include", cache: "no-store" });
    const data = await response.json();
    if (response.ok && data.ok && data.encontrado) {
      const item = data.expediente as Expediente;
      setCasosRelacionados(Array.isArray(data.casos) ? data.casos : []);
      setPuedeEditar(data.puedeEditar === true);
      setExpediente(item);
      setDatosGenerales(Array.from({ length: 18 }, (_, indice) => item.datosRegistro.find((dato) => dato.indice === indice + 1)?.valor ?? ""));
      setFormulario({
        direccionColombia: item.datosEditables.direccionColombia,
        direccionVenezuela: item.datosEditables.direccionVenezuela,
        contactoColombiaNombre: item.datosEditables.contactoColombiaNombre,
        contactoColombiaTelefono: item.datosEditables.contactoColombiaTelefono,
        contactoExtranjeroNombre: item.datosEditables.contactoExtranjeroNombre,
        contactoExtranjeroTelefono: item.datosEditables.contactoExtranjeroTelefono,
        tieneHijos: typeof item.datosEditables?.tieneHijos === "boolean" ? item.datosEditables.tieneHijos : null,
        hijos: Array.isArray(item.datosEditables?.hijos) ? item.datosEditables.hijos.map((hijo) => ({ ...hijo })) : [],
      });
    }
  }

  async function subirFoto(archivo: File | undefined) {
    if (!archivo || !expediente) return;
    setSubiendoFoto(true);
    setError("");
    setMensaje("");
    try {
      const formData = new FormData();
      formData.append("documento", expediente.documento);
      formData.append("foto", archivo);
      const response = await fetch("/api/expedienteciudadano", { method: "POST", credentials: "include", body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible subir la foto.");
      setMensaje(data.mensaje || "Foto guardada en Google Drive.");
      await recargarExpediente(expediente.documento);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function descargarPdf() {
    if (!expediente) return;
    setDescargandoPdf(true);
    setError("");
    try {
      const response = await fetch(`/api/expedienteciudadano/pdf?documento=${encodeURIComponent(expediente.documento)}`, { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No fue posible generar la ficha PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `expediente-${expediente.documento.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible descargar la ficha.");
    } finally {
      setDescargandoPdf(false);
    }
  }

  return (
    <SistemaLayout titulo="Expediente Único Ciudadano" permiso={MODULOS.EXPEDIENTE_CIUDADANO}>
      <div className="space-y-6">
        <form onSubmit={buscar} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <label htmlFor="documento" className="mb-2 block font-bold text-blue-950">Buscar por número de documento</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="documento" value={numeroDocumento} onChange={(event) => setNumeroDocumento(event.target.value)} placeholder="Cédula o pasaporte" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600" />
            <button disabled={buscando} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">{buscando ? "Buscando..." : "Buscar ciudadano"}</button>
            <button type="button" onClick={limpiarBusqueda} disabled={buscando} className="rounded-xl border border-slate-300 bg-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-60">Limpiar datos</button>
          </div>
        </form>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
        {mensaje && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{mensaje}</div>}

        {expediente && (
          <>
            <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[180px_1fr]">
              <div className="space-y-3">
                <div className="flex h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {expediente.fotoUrl ? <img src={expediente.fotoUrl} alt={`Foto de ${expediente.nombreCompleto}`} className="h-full w-full object-cover" /> : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <img src="/logo.png" alt="Consulado" className="max-h-20 max-w-28 object-contain opacity-60" />
                      <span className="font-bold">Sin Foto</span>
                    </div>
                  )}
                </div>
                {puedeEditar && (
                  <label className="block cursor-pointer rounded-lg bg-blue-50 px-3 py-2 text-center text-sm font-semibold text-blue-800 hover:bg-blue-100">
                    {subiendoFoto ? "Subiendo foto..." : "Subir o reemplazar foto"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={subiendoFoto} className="sr-only" onChange={(event) => { void subirFoto(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                  </label>
                )}
                <p className="text-center text-xs text-slate-500">{expediente.datosEditables.fotoOrigen === "constancia" ? "Foto obtenida de la constancia de registro" : expediente.datosEditables.fotoOrigen === "expediente" ? "Foto guardada en el expediente" : "Sin fotografía asociada"}</p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-950">{expediente.nombreCompleto || "—"}</h2>
                    <p className="mt-1 font-semibold text-blue-700">Documento: {expediente.documento}</p>
                  </div>
                  <button type="button" onClick={() => void descargarPdf()} disabled={descargandoPdf} className="shrink-0 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{descargandoPdf ? "Preparando PDF..." : "Descargar ficha PDF"}</button>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Campo etiqueta="Nacionalidad" valor={expediente.nacionalidad} />
                  <Campo etiqueta="Cédula" valor={expediente.cedula} />
                  <Campo etiqueta="Pasaporte" valor={expediente.pasaporte} />
                  <Campo etiqueta="Fecha de nacimiento" valor={expediente.fechaNacimiento} />
                  <Campo etiqueta="Correo" valor={expediente.correo} />
                  <Campo etiqueta="Teléfono" valor={expediente.telefono} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-blue-950">Información General</h2>
                {puedeEditar && <button type="button" onClick={() => void guardarInformacionGeneral()} disabled={guardando || !hayCambiosGenerales} className={`rounded-lg px-4 py-2 font-bold text-white disabled:cursor-not-allowed ${hayCambiosGenerales ? "bg-blue-700 hover:bg-blue-800" : "bg-slate-400"}`}>{guardando ? "Guardando..." : "Guardar información general"}</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {expediente.datosRegistro.map((dato) => (
                  <div key={`${dato.indice}-${dato.etiqueta}`}>
                    {puedeEditar
                      ? <Entrada etiqueta={dato.etiqueta} value={datosGenerales[dato.indice - 1] ?? ""} placeholder="—" onChange={(valor) => setDatosGenerales((actual) => actual.map((anterior, indice) => indice === dato.indice - 1 ? valor : anterior))} />
                      : <Campo etiqueta={dato.etiqueta} valor={dato.valor} />}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-blue-950">Información Complementaria</h2>
                    <p className="mt-1 text-sm text-slate-500">Estos datos se guardan en la pestaña ExpedienteCiudadano del Registro Consular.</p>
                    {!puedeEditar && <p className="mt-1 text-sm text-slate-500">Acceso de consulta: los datos se muestran en modo lectura.</p>}
                </div>
                {puedeEditar && <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={limpiarInformacionComplementaria} disabled={guardando || !expediente} className="rounded-lg border border-slate-300 bg-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-60">Limpiar</button>
                  <button type="button" onClick={() => void guardarDatos()} disabled={guardando || !hayCambiosComplementarios} className={`rounded-lg px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-100 ${hayCambiosComplementarios ? "bg-blue-700 hover:bg-blue-800" : "bg-slate-400"}`}>{guardando ? "Guardando..." : "Guardar datos"}</button>
                </div>}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Entrada etiqueta="Dirección en Colombia" value={formulario.direccionColombia} onChange={(value) => actualizar("direccionColombia", value)} multiline disabled={!puedeEditar} />
                <Entrada etiqueta="Dirección en Venezuela" value={formulario.direccionVenezuela} onChange={(value) => actualizar("direccionVenezuela", value)} multiline disabled={!puedeEditar} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Entrada etiqueta="Persona de contacto en Colombia" value={formulario.contactoColombiaNombre} onChange={(value) => actualizar("contactoColombiaNombre", value)} disabled={!puedeEditar} />
                  <Entrada etiqueta="Teléfono de contacto en Colombia" value={formulario.contactoColombiaTelefono} onChange={(value) => actualizar("contactoColombiaTelefono", value)} type="tel" disabled={!puedeEditar} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Entrada etiqueta="Persona de contacto en el extranjero" value={formulario.contactoExtranjeroNombre} onChange={(value) => actualizar("contactoExtranjeroNombre", value)} disabled={!puedeEditar} />
                  <Entrada etiqueta="Teléfono de contacto en el extranjero" value={formulario.contactoExtranjeroTelefono} onChange={(value) => actualizar("contactoExtranjeroTelefono", value)} type="tel" disabled={!puedeEditar} />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-lg font-bold text-blue-950">Hijos</h3>
                <label className="mt-3 block max-w-sm text-sm font-semibold text-slate-700">
                  ¿Tiene hijos?
                  <select
                    value={formulario.tieneHijos == null ? "" : formulario.tieneHijos ? "si" : "no"}
                    onChange={(event) => actualizarRespuestaHijos(event.target.value)}
                    disabled={!puedeEditar}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione...</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {formulario.tieneHijos && (
                  <div className="mt-4 space-y-3">
                    {(formulario.hijos ?? []).map((hijo, index) => (
                      <div key={`hijo-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
                        <Entrada etiqueta={`Nombre del hijo/a ${index + 1}`} value={hijo.nombre} onChange={(value) => actualizarHijo(index, "nombre", value)} disabled={!puedeEditar} />
                        <label className="block text-sm font-semibold text-slate-700">
                          Género
                          <select
                            value={hijo.genero}
                            onChange={(event) => actualizarHijo(index, "genero", event.target.value)}
                            disabled={!puedeEditar}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Seleccione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                          </select>
                        </label>
                        <Entrada etiqueta="Fecha de nacimiento" value={hijo.fechaNacimiento} onChange={(value) => actualizarHijo(index, "fechaNacimiento", value)} type="date" disabled={!puedeEditar} />
                        {puedeEditar && <button type="button" onClick={() => setFormulario((actual) => ({ ...actual, hijos: actual.hijos.filter((_, posicion) => posicion !== index) }))} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Quitar</button>}
                      </div>
                    ))}
                    {puedeEditar && <button type="button" onClick={agregarHijo} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">Agregar hijo/a</button>}
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Historial titulo="Historial de visitas" items={expediente.visitas} vacio="No hay visitas registradas para este ciudadano." />
              <Historial titulo="Historial de trámites" items={expediente.tramites} vacio="No hay trámites registrados para este ciudadano." />
            </div>
            <CasosRelacionados casos={casosRelacionados} />
          </>
        )}
        {!expediente && numeroDocumento.trim() && !buscando && casosRelacionados.length > 0 && <CasosRelacionados casos={casosRelacionados} />}
      </div>
    </SistemaLayout>
  );
}
