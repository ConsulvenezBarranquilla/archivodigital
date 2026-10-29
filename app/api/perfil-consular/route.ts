import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import {
  HOJA_DETALLE,
  obtenerActuaciones,
  obtenerCaja,
  obtenerGestionConsular,
  obtenerRegistroConsular,
  obtenerReportesEntregados,
  leerHoja,
  leerDatosJurisdiccionPerfil,
  guardarDatosJurisdiccionPerfil,
} from "@/lib/googleSheets";
import { listarCasosConsularesSoloLectura } from "@/lib/casosConsulares";
import { obtenerDocumentos, type ReportesData } from "@/lib/reportesEntregados/reportesService";
import type { CasoConsular } from "@/lib/casosConsularesTypes";
import type { ReporteEntregado } from "@/types/ReporteEntregado";

type Fuente<T> = { ok: true; datos: T } | { ok: false };

const ZONA_HORARIA = "America/Bogota";
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function claveFecha(valor: unknown): string {
  const texto = String(valor ?? "").trim();
  if (!texto) return "";
  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

function fechaISOValida(valor: string): boolean {
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const fecha = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return fecha.getUTCFullYear() === Number(match[1]) && fecha.getUTCMonth() === Number(match[2]) - 1 && fecha.getUTCDate() === Number(match[3]);
}

function normalizar(valor: unknown): string {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toUpperCase();
}

function claveDocumento(valor: unknown): string {
  return normalizar(valor).replace(/[^A-Z0-9]/g, "");
}

function enPeriodo(fecha: unknown, desde: string, hasta: string): boolean {
  const clave = claveFecha(fecha);
  return Boolean(clave && clave >= desde && clave <= hasta);
}

async function cargarFuente<T>(nombre: string, cargar: () => Promise<T>): Promise<Fuente<T>> {
  try {
    return { ok: true, datos: await cargar() };
  } catch (error) {
    console.error(`Perfil Consular: falló la fuente ${nombre}.`, error instanceof Error ? error.name : "Error");
    return { ok: false };
  }
}

function resumirRegistro(filas: unknown[][], desde: string, hasta: string) {
  const personas = new Map<string, { primeraFecha: string; ultimaFecha: string; localidad: string }>();
  const registros = filas.slice(1);
  registros.forEach((fila, indice) => {
    const nacionalidad = normalizar(fila[6]);
    if (!nacionalidad.startsWith("VENEZOLAN")) return;
    const fecha = claveFecha(fila[0]);
    if (!fecha || fecha > hasta) return;
    const documento = claveDocumento(fila[1]) || claveDocumento(fila[14]);
    const clave = documento ? `DOC:${documento}` : `FILA:${indice + 2}`;
    const localidad = String(fila[15] ?? "").trim();
    const existente = personas.get(clave);
    if (!existente) personas.set(clave, { primeraFecha: fecha, ultimaFecha: fecha, localidad });
    else {
      if (fecha < existente.primeraFecha) existente.primeraFecha = fecha;
      if (fecha >= existente.ultimaFecha) {
        existente.ultimaFecha = fecha;
        if (localidad) existente.localidad = localidad;
      }
    }
  });

  let nuevas = 0;
  const localidades = new Map<string, { nombre: string; cantidad: number }>();
  for (const persona of personas.values()) {
    if (persona.primeraFecha >= desde && persona.primeraFecha <= hasta) nuevas += 1;
    const nombre = persona.localidad || "Sin residencia registrada";
    const key = normalizar(nombre);
    const localidad = localidades.get(key) ?? { nombre, cantidad: 0 };
    localidad.cantidad += 1;
    localidades.set(key, localidad);
  }
  return {
    totalHistoricoAlCorte: personas.size,
    nuevasEnPeriodo: nuevas,
    porLugarResidencia: Array.from(localidades.values()).sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es")),
    regla: "Persona única por cédula o pasaporte; si falta ambos, se conserva cada respuesta como registro independiente. Nuevas inscripciones se fechan por la marca temporal del formulario; la residencia toma la respuesta más reciente al corte.",
  };
}

function resumirCasos(casos: CasoConsular[], desde: string, hasta: string) {
  const vigentes = casos.filter((caso) => caso.estado !== "Eliminado");
  const civil = vigentes.filter((caso) => caso.categoria === "Registro Civil" && caso.estado === "Abierto" && enPeriodo(caso.creadoEl, desde, hasta));
  const tipos = new Map<string, { cantidad: number; genero: Record<string, number> }>();
  for (const tipo of ["Inserción Nacimiento", "Reconocimiento", "Matrimonio", "Defunción", "Renuncia a la Nacionalidad"]) {
    tipos.set(tipo, { cantidad: 0, genero: { Masculino: 0, Femenino: 0, "Sin dato": 0 } });
  }
  for (const caso of civil) {
    const tipo = String(caso.tipo || caso.datos.tipoRegistroCivil || "Sin tipo registrado");
    const item = tipos.get(tipo) ?? { cantidad: 0, genero: { Masculino: 0, Femenino: 0, "Sin dato": 0 } };
    item.cantidad += 1;
    const genero = String(caso.datos.genero ?? "").trim();
    if (genero === "Masculino" || genero === "Femenino") item.genero[genero] += 1;
    else item.genero["Sin dato"] += 1;
    tipos.set(tipo, item);
  }

  const fallecidos = vigentes.filter((caso) => caso.categoria === "Fallecidos");
  const iniciados = fallecidos.filter((caso) => enPeriodo(caso.creadoEl || caso.fecha, desde, hasta));
  const historicos = fallecidos.filter((caso) => {
    const fecha = claveFecha(caso.creadoEl || caso.fecha);
    return fecha && fecha <= hasta;
  });
  const crearFilaCausa = () => ({ femenino: 0, masculino: 0, sinDato: 0, totalPeriodo: 0, totalAcumulado: 0 });
  const causas = new Map<string, ReturnType<typeof crearFilaCausa>>();
  for (const motivo of ["Homicidio", "Suicidio", "Natural", "Otros", "Sin motivo especificado"]) causas.set(motivo, crearFilaCausa());
  const contar = (caso: CasoConsular, periodo: "periodo" | "acumulado") => {
    const motivo = String(caso.datos.motivo ?? "").trim() || "Sin motivo especificado";
    const fila = causas.get(motivo) ?? crearFilaCausa();
    if (!causas.has(motivo)) causas.set(motivo, fila);
    const genero = String(caso.datos.genero ?? "").trim();
    if (periodo === "periodo") {
      fila.totalPeriodo += 1;
      if (genero === "Femenino") fila.femenino += 1;
      else if (genero === "Masculino") fila.masculino += 1;
      else fila.sinDato += 1;
    } else fila.totalAcumulado += 1;
  };
  for (const caso of iniciados) contar(caso, "periodo");
  for (const caso of historicos) contar(caso, "acumulado");
  const tablaCausas = Array.from(causas, ([causa, fila]) => ({ causa, ...fila }))
    .sort((a, b) => {
      const orden = ["Homicidio", "Suicidio", "Natural", "Otros", "Sin motivo especificado"];
      const ia = orden.indexOf(a.causa);
      const ib = orden.indexOf(b.causa);
      return (ia < 0 ? orden.length : ia) - (ib < 0 ? orden.length : ib) || a.causa.localeCompare(b.causa, "es");
    });
  return {
    registroCivil: {
      totalAbiertosIniciadosEnPeriodo: civil.length,
      porTipo: Array.from(tipos, ([tipo, valor]) => ({ tipo, ...valor })).sort((a, b) => a.tipo.localeCompare(b.tipo, "es")),
      tiposNoRegistradosEnElModelo: [],
      fechaUtilizada: "CasosConsulares: fecha de apertura (creadoEl); solo estado Abierto, excluidos Eliminado y Finalizado.",
    },
    fallecidos: {
      iniciadosEnPeriodo: iniciados.length,
      acumuladoHistoricoAlCorte: historicos.length,
      tablaCausas,
      generoDisponible: fallecidos.some((caso) => String(caso.datos.genero ?? "").trim()),
      fechaUtilizada: "CasosConsulares: fecha de apertura (creadoEl; fallback fecha); casos vigentes, excluidos Eliminado.",
    },
  };
}

function resumirVisas(caja: unknown[][], detalle: unknown[][], gestion: unknown[][], reportes: unknown[][], actuaciones: unknown[][], desde: string, hasta: string) {
  const nacionalidadesRestringidas: { nombre: string; claves: string[] }[] = [
    { nombre: "Estadounidense", claves: ["ESTADOUNIDENSE", "ESTADOS UNIDOS", "UNITED STATES", "USA", "US"] },
    { nombre: "Canadiense", claves: ["CANADIENSE", "CANADA", "CANADIAN"] },
    { nombre: "Ucraniano", claves: ["UCRANIANO", "UCRANIANA", "UCRANIA", "UKRAINIAN"] },
    { nombre: "Iraní", claves: ["IRANI", "IRAN", "IRANIAN"] },
    { nombre: "Salvadoreño", claves: ["SALVADORENO", "SALVADORENA", "EL SALVADOR", "SALVADORAN"] },
    { nombre: "Guatemalteco", claves: ["GUATEMALTECO", "GUATEMALTECA", "GUATEMALA", "GUATEMALAN"] },
    { nombre: "Israelí", claves: ["ISRAELI", "ISRAEL"] },
  ];
  const nacionalidadNormalizada = (valor: unknown) => normalizar(valor).replace(/[^A-Z0-9 ]/g, "");
  const porNacionalidad = new Map(nacionalidadesRestringidas.map(({ nombre }) => [nombre, 0]));
  const detalleNacionalidad = new Map<string, Map<string, { tipoVisa: string; solicitadas: number; aprobadas: number; negadas: number; pendientes: number }>>();
  let totalNacionalidadesRestringidas = 0;
  const catalogo = new Map<string, string>();
  for (const fila of actuaciones.slice(1)) {
    if (normalizar(fila[3]) !== "SI") continue;
    const codigo = String(fila[0] ?? "").trim().toUpperCase();
    const nombre = String(fila[1] ?? "").trim();
    if (codigo && normalizar(nombre).includes("VISA")) catalogo.set(codigo, nombre);
  }
  const recibos = new Map<string, unknown[]>();
  for (const fila of caja.slice(1)) {
    const recibo = String(fila[1] ?? "").trim();
    if (recibo && normalizar(fila[10]) === "GENERADO") recibos.set(recibo, fila);
  }
  const reportesPorId = new Map<string, unknown[]>();
  for (const fila of reportes.slice(1)) {
    const id = String(fila[0] ?? "").trim();
    if (id) reportesPorId.set(id, fila);
  }
  const gestionPorActuacion = new Map<string, unknown[][]>();
  for (const fila of gestion.slice(1)) {
    if (normalizar(fila[6]) !== "VINCULADO") continue;
    const clave = `${String(fila[0] ?? "").trim()}|${String(fila[1] ?? "").trim().toUpperCase()}`;
    const grupo = gestionPorActuacion.get(clave) ?? [];
    grupo.push(fila);
    gestionPorActuacion.set(clave, grupo);
  }
  const usadosPorActuacion = new Map<string, number>();
  const resumen = new Map<string, { codigo: string; actuacion: string; solicitadas: number; aprobadas: number; negadas: number; pendientes: number }>();
  catalogo.forEach((actuacion, codigo) => resumen.set(codigo, { codigo, actuacion, solicitadas: 0, aprobadas: 0, negadas: 0, pendientes: 0 }));

  detalle.slice(1).forEach((fila) => {
    const recibo = String(fila[0] ?? "").trim();
    const codigo = String(fila[1] ?? "").trim().toUpperCase();
    const resumenTipo = resumen.get(codigo);
    const cajaFila = recibos.get(recibo);
    if (!resumenTipo || !cajaFila) return;
    const solicitudEnPeriodo = enPeriodo(cajaFila[0], desde, hasta);
    const clave = `${recibo}|${codigo}`;
    const indiceGestion = usadosPorActuacion.get(clave) ?? 0;
    usadosPorActuacion.set(clave, indiceGestion + 1);
    const filaGestion = (gestionPorActuacion.get(clave) ?? [])[indiceGestion];
    const idGestion = String(filaGestion?.[11] ?? "").trim();
    const reporteVisa = reportesPorId.get(idGestion);
    const estado = normalizar(reporteVisa?.[8]);
    const decisionEnPeriodo = enPeriodo(reporteVisa?.[50], desde, hasta);
    const aprobada = estado === "APROBADA" || estado === "APROBADO";
    const negada = ["RECHAZADA", "RECHAZADO", "NEGADA", "NEGADO"].includes(estado);
    if (!solicitudEnPeriodo && !((aprobada || negada) && decisionEnPeriodo)) return;

    const nacionalidad = nacionalidadNormalizada(reporteVisa?.[20] || cajaFila[13]);
    const nacionalidadRestringida = nacionalidadesRestringidas.find(({ claves }) => claves.includes(nacionalidad));
    if (nacionalidadRestringida) {
      const porTipo = detalleNacionalidad.get(nacionalidadRestringida.nombre) ?? new Map();
      const detalleTipo = porTipo.get(codigo) ?? {
        tipoVisa: resumenTipo.actuacion,
        solicitadas: 0,
        aprobadas: 0,
        negadas: 0,
        pendientes: 0,
      };
      if (solicitudEnPeriodo) {
        detalleTipo.solicitadas += 1;
        porNacionalidad.set(nacionalidadRestringida.nombre, (porNacionalidad.get(nacionalidadRestringida.nombre) ?? 0) + 1);
        totalNacionalidadesRestringidas += 1;
      }
      if (aprobada && decisionEnPeriodo) detalleTipo.aprobadas += 1;
      else if (negada && decisionEnPeriodo) detalleTipo.negadas += 1;
      else if (solicitudEnPeriodo) detalleTipo.pendientes += 1;
      porTipo.set(codigo, detalleTipo);
      detalleNacionalidad.set(nacionalidadRestringida.nombre, porTipo);
    }
    if (solicitudEnPeriodo) resumenTipo.solicitadas += 1;
    if (aprobada && decisionEnPeriodo) resumenTipo.aprobadas += 1;
    else if (negada && decisionEnPeriodo) resumenTipo.negadas += 1;
    else if (solicitudEnPeriodo) resumenTipo.pendientes += 1;
  });
  return {
    porTipo: Array.from(resumen.values()).sort((a, b) => a.actuacion.localeCompare(b.actuacion, "es")),
    solicitadasEnPeriodo: Array.from(resumen.values()).reduce((total, item) => total + item.solicitadas, 0),
    porNacionalidadRestringida: Array.from(porNacionalidad, ([nacionalidad, cantidad]) => ({
      nacionalidad,
      cantidad,
      porTipo: Array.from(detalleNacionalidad.get(nacionalidad)?.values() ?? []).sort((a, b) => a.tipoVisa.localeCompare(b.tipoVisa, "es")),
    })),
    totalNacionalidadesRestringidas,
    porcentajeNacionalidadesRestringidas: Array.from(resumen.values()).reduce((total, item) => total + item.solicitadas, 0) > 0
      ? totalNacionalidadesRestringidas / Array.from(resumen.values()).reduce((total, item) => total + item.solicitadas, 0) * 100
      : null,
    aprobadasSegunEstadoActual: Array.from(resumen.values()).reduce((total, item) => total + item.aprobadas, 0),
    negadasSegunEstadoActual: Array.from(resumen.values()).reduce((total, item) => total + item.negadas, 0),
    pendientesSegunEstadoActual: Array.from(resumen.values()).reduce((total, item) => total + item.pendientes, 0),
    fechaSolicitudes: "Caja!A, fecha de generación del recibo; una fila de DetalleCaja por actuación, solo Caja en estado GENERADO.",
    fechaDecisiones: "Solicitudes: fecha del recibo en Caja!A. Aprobaciones y negativas: estado actual en ReportesEntregados!I, fechadas por la última actualización de ReportesEntregados!AY como aproximación a la fecha de decisión. Pendientes: solicitudes del período que siguen sin decisión aprobada o negada.",
  };
}

function resumirPasaportes(documentos: ReporteEntregado[], desde: string, hasta: string) {
  const unicos = Array.from(new Map(documentos.filter((documento) => documento.id).map((documento) => [documento.id, documento])).values());
  const grupos = () => ({ Adultos: 0, NNA: 0 });
  const sumar = (objeto: { Adultos: number; NNA: number }, tipo: string | undefined) => {
    if (tipo === "PASAPORTE_ADULTO") objeto.Adultos += 1;
    else if (tipo === "PASAPORTE_NNA") objeto.NNA += 1;
  };
  const tramitados = grupos();
  const recibidos = grupos();
  const entregados = grupos();
  for (const documento of unicos) {
    if (documento.planillaGC && enPeriodo(documento.fechaRecibo, desde, hasta)) sumar(tramitados, documento.tipoDocumento);
    if (documento.fechaValija && enPeriodo(documento.fechaValija, desde, hasta)) sumar(recibidos, documento.tipoDocumento);
    if (documento.entregado && documento.fechaEntrega && enPeriodo(documento.fechaEntrega, desde, hasta)) sumar(entregados, documento.tipoDocumento);
  }
  const conTotal = (grupo: { Adultos: number; NNA: number }) => ({ ...grupo, total: grupo.Adultos + grupo.NNA });
  return {
    tramitados: { ...conTotal(tramitados), fechaUtilizada: "Caja!A (generación del recibo); documentos vinculados con planilla GC, únicos por ID de Gestión Consular." },
    recibidos: { ...conTotal(recibidos), fechaUtilizada: "ReportesEntregados!P (fecha registrada al recibir la valija), únicos por ID." },
    entregados: { ...conTotal(entregados), fechaUtilizada: "ReportesEntregados!K (fecha real de entrega), únicos por ID." },
  };
}

function resumirDocumentosViaje(caja: unknown[][], gestion: unknown[][], detalle: unknown[][], desde: string, hasta: string) {
  const recibos = new Map<string, unknown[]>();
  for (const fila of caja.slice(1)) {
    const recibo = String(fila[1] ?? "").trim();
    if (recibo && normalizar(fila[10]) === "GENERADO") recibos.set(recibo, fila);
  }

  const filasDetalle = detalle.slice(1);
  const clavesContadas = new Set<string>();
  let pagas = 0;
  let exentas = 0;
  for (const fila of gestion.slice(1)) {
    const recibo = String(fila[0] ?? "").trim();
    const codigo = String(fila[1] ?? "").trim().toUpperCase();
    const nombre = normalizar(fila[2]);
    if (codigo !== "DV" || nombre !== "DOCUMENTO DE VIAJE") continue;

    const cajaFila = recibos.get(recibo);
    if (!cajaFila || !enPeriodo(cajaFila[0], desde, hasta)) continue;
    // El puntero de detalle (M) o el número de actuación (L) conserva actuaciones
    // diferentes del mismo recibo y evita contar dos veces una misma vinculación.
    const punteroDetalle = Number(fila[12]);
    const filaDetalle = Number.isInteger(punteroDetalle) && punteroDetalle > 0
      ? detalle[punteroDetalle]
      : filasDetalle.find((item) => String(item[0] ?? "").trim() === recibo && String(item[1] ?? "").trim().toUpperCase() === codigo && String(item[4] ?? "").trim() === String(fila[11] ?? "").trim());
    if (!filaDetalle || String(filaDetalle[0] ?? "").trim() !== recibo || String(filaDetalle[1] ?? "").trim().toUpperCase() !== codigo) continue;
    const referencia = String(fila[12] ?? "").trim() || String(fila[11] ?? "").trim();
    const clave = referencia ? `${recibo}|${codigo}|${referencia}` : `${recibo}|${codigo}|${String(fila[3] ?? "").trim()}|${String(fila[4] ?? "").trim()}`;
    if (clavesContadas.has(clave)) continue;
    clavesContadas.add(clave);
    const monto = Number(String(filaDetalle[3] ?? "").trim().replace(",", "."));
    if (!Number.isFinite(monto)) continue;
    if (monto > 0) pagas += 1;
    else exentas += 1;
  }

  return {
    pagas,
    exentas,
    total: pagas + exentas,
    fechaUtilizada: "GestionConsular!A:M, actuaciones Documento de Viaje (código DV) asociadas a recibos GENERADOS en Caja. Incluye pagos y exenciones; el período usa Caja!A.",
  };
}

function resumirOtrasActuaciones(caja: unknown[][], gestion: unknown[][], desde: string, hasta: string) {
  const recibos = new Map<string, unknown[]>();
  for (const fila of caja.slice(1)) {
    const recibo = String(fila[1] ?? "").trim();
    if (recibo && normalizar(fila[10]) === "GENERADO") recibos.set(recibo, fila);
  }

  const crearConteo = (nombres: string[]) => new Map(nombres.map((nombre) => [nombre, 0]));
  const poderes = crearConteo(["Especial", "General"]);
  const certificados = crearConteo(["Vehículo", "Enseres", "Vehículo y Enseres"]);
  const otras = crearConteo([
    "Carta de Soltería",
    "Otras Actuaciones Consulares",
    "Verificación de Identidad",
    "Constancia Consular",
    "Constancia de Registro Consular",
  ]);

  for (const fila of gestion.slice(1)) {
    if (normalizar(fila[6]) !== "VINCULADO") continue;
    const recibo = String(fila[0] ?? "").trim();
    const cajaFila = recibos.get(recibo);
    if (!cajaFila || !enPeriodo(cajaFila[0], desde, hasta)) continue;
    const codigo = String(fila[1] ?? "").trim().toUpperCase();
    const actuacion = normalizar(fila[2]);

    if (codigo === "PODR-E") poderes.set("Especial", (poderes.get("Especial") ?? 0) + 1);
    else if (codigo === "PODR-G") poderes.set("General", (poderes.get("General") ?? 0) + 1);
    else if (codigo === "CERT-V") certificados.set("Vehículo", (certificados.get("Vehículo") ?? 0) + 1);
    else if (codigo === "CERT-E") certificados.set("Enseres", (certificados.get("Enseres") ?? 0) + 1);
    else if (codigo === "CERT-VE") certificados.set("Vehículo y Enseres", (certificados.get("Vehículo y Enseres") ?? 0) + 1);
    else if (actuacion.includes("CARTA DE SOLTER")) otras.set("Carta de Soltería", (otras.get("Carta de Soltería") ?? 0) + 1);
    else if (actuacion.includes("OTRAS ACTUACIONES CONSULARES")) otras.set("Otras Actuaciones Consulares", (otras.get("Otras Actuaciones Consulares") ?? 0) + 1);
    else if (codigo === "VER-I" || actuacion.includes("VERIFICACION DE IDENTIDAD")) otras.set("Verificación de Identidad", (otras.get("Verificación de Identidad") ?? 0) + 1);
    else if (actuacion.includes("CONSTANCIA") && actuacion.includes("REGISTRO CONSULAR")) otras.set("Constancia de Registro Consular", (otras.get("Constancia de Registro Consular") ?? 0) + 1);
    else if (actuacion.includes("CONSTANCIA CONSULAR")) otras.set("Constancia Consular", (otras.get("Constancia Consular") ?? 0) + 1);
  }

  const filas = (conteos: Map<string, number>) => Array.from(conteos, ([documento, cantidad]) => ({ documento, cantidad }));
  const grupos = { poderes: filas(poderes), certificados: filas(certificados), otras: filas(otras) };
  return {
    ...grupos,
    total: [...poderes.values(), ...certificados.values(), ...otras.values()].reduce((suma, cantidad) => suma + cantidad, 0),
    fechaUtilizada: "GestionConsular!A:M: actuaciones vinculadas con un recibo GENERADO en Caja; el período usa Caja!A.",
  };
}

function resumirRegistroElectoral(caja: unknown[][], gestion: unknown[][], desde: string, hasta: string) {
  const recibos = new Map<string, unknown[]>();
  for (const fila of caja.slice(1)) {
    const correlativo = String(fila[1] ?? "").trim();
    if (correlativo) recibos.set(correlativo, fila);
  }

  const registros: { correlativo: string; nombre: string; cedula: string; tipo: string; fecha: string }[] = [];
  for (const fila of gestion.slice(1)) {
    const codigo = String(fila[1] ?? "").trim().toUpperCase();
    if (codigo !== "INS-RE" && codigo !== "MOD-RE") continue;
    if (normalizar(fila[6]) !== "VINCULADO") continue;

    const correlativo = String(fila[0] ?? "").trim();
    const cajaFila = recibos.get(correlativo);
    if (cajaFila && normalizar(cajaFila[10]) !== "GENERADO") continue;
    const fecha = cajaFila?.[0] ?? fila[4];
    if (!enPeriodo(fecha, desde, hasta)) continue;

    registros.push({
      correlativo,
      nombre: String(fila[2] || cajaFila?.[3] || "").trim(),
      cedula: String(cajaFila?.[11] ?? cajaFila?.[2] ?? "").trim(),
      tipo: codigo === "INS-RE" ? "Inserción" : "Modificación",
      fecha: claveFecha(fecha),
    });
  }

  registros.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.correlativo.localeCompare(b.correlativo));
  return {
    registros: registros.map((registro, indice) => ({
      numero: indice + 1,
      correlativo: registro.correlativo,
      nombre: registro.nombre,
      cedula: registro.cedula,
      tipo: registro.tipo,
    })),
    total: registros.length,
    fechaUtilizada: "GestionConsular!A:M, actuaciones INS-RE y MOD-RE vinculadas; el período usa la fecha del recibo en Caja!A o, si no existe, la fecha de planilla en GestionConsular!E.",
  };
}

function resumirAutorizaciones(documentos: ReporteEntregado[]) {
  const unicos = Array.from(new Map(documentos.filter((documento) => documento.id).map((documento) => [documento.id, documento])).values());
  const emitidos = unicos.filter((documento) => ["PROCESADO", "ENTREGADO"].includes(documento.estadoProcesamiento));
  const categorias = ["Para viajar con uno de los Padres", "Para viajar con un tercero", "Para viajar solo"];
  const porRelacion = new Map(categorias.map((categoria) => [categoria, 0]));
  for (const documento of emitidos) {
    const acompanante = normalizar(documento.acompanante);
    const cantidadSolicitantes = Array.isArray(documento.solicitantesAutorizacion) && documento.solicitantesAutorizacion.length > 0
      ? documento.solicitantesAutorizacion.length
      : (String(documento.solicitante ?? "").trim() ? 1 : 0);
    const categoria = !acompanante || acompanante === "SOLO"
      ? "Para viajar solo"
      : cantidadSolicitantes === 1
        ? "Para viajar con uno de los Padres"
        : cantidadSolicitantes >= 2
          ? "Para viajar con un tercero"
          : null;
    if (categoria) porRelacion.set(categoria, (porRelacion.get(categoria) ?? 0) + 1);
  }
  return {
    totalRegistradasComoProcesadasOEntregadas: emitidos.length,
    porRelacion: Array.from(porRelacion, ([modalidad, cantidad]) => ({ modalidad, cantidad })),
    periodoDisponible: false,
    fechaUtilizada: "Acumulado del estado actual PROCESADO/ENTREGADO en ReportesEntregados. El modelo no guarda fecha de emisión para Autorización de Viaje.",
  };
}

export async function GET(request: NextRequest) {
  const acceso = await exigirPermiso(MODULOS.CONSULTAS);
  if (acceso.respuesta) return acceso.respuesta;

  const desde = String(request.nextUrl.searchParams.get("desde") ?? "");
  const hasta = String(request.nextUrl.searchParams.get("hasta") ?? "");
  if (!fechaISOValida(desde) || !fechaISOValida(hasta) || desde > hasta) {
    return NextResponse.json({ ok: false, error: "Indica un período válido. La fecha inicial debe ser anterior o igual a la fecha final." }, { status: 400 });
  }

  const [registroFuente, casosFuente, cajaFuente, detalleFuente, gestionFuente, reportesFuente, actuacionesFuente, jurisdiccionFuente] = await Promise.all([
    cargarFuente("Registro Consular", obtenerRegistroConsular),
    cargarFuente("Casos Consulares", listarCasosConsularesSoloLectura),
    cargarFuente("Caja", obtenerCaja),
    cargarFuente("DetalleCaja", () => leerHoja(HOJA_DETALLE, "A:F")),
    cargarFuente("GestionConsular", obtenerGestionConsular),
    cargarFuente("ReportesEntregados", obtenerReportesEntregados),
    cargarFuente("Actuaciones", obtenerActuaciones),
    cargarFuente("Perfil Consular", leerDatosJurisdiccionPerfil),
  ]);

  const actualizadoEl = new Date().toISOString();
  const fuentes = {
    registroConsular: { estado: registroFuente.ok ? "disponible" : "error", nombre: "Respuestas de formulario 1!A:S", actualizadaEl: actualizadoEl },
    casos: { estado: casosFuente.ok ? "disponible" : "error", nombre: "CasosConsulares!A:N", actualizadaEl: actualizadoEl },
    caja: { estado: cajaFuente.ok ? "disponible" : "error", nombre: "Caja!A:ZZ y DetalleCaja!A:F", actualizadaEl: actualizadoEl },
    gestionConsular: { estado: gestionFuente.ok ? "disponible" : "error", nombre: "GestionConsular!A:ZZ", actualizadaEl: actualizadoEl },
    reportes: { estado: reportesFuente.ok ? "disponible" : "error", nombre: "ReportesEntregados!A:ZZ", actualizadaEl: actualizadoEl },
    actuaciones: { estado: actuacionesFuente.ok ? "disponible" : "error", nombre: "Actuaciones!A:E", actualizadaEl: actualizadoEl },
    jurisdiccion: { estado: jurisdiccionFuente.ok ? "disponible" : "error", nombre: "PerfilConsular!A:G", actualizadaEl: actualizadoEl },
  };

  const registro = registroFuente.ok ? resumirRegistro(registroFuente.datos, desde, hasta) : null;
  const casos = casosFuente.ok ? resumirCasos(casosFuente.datos, desde, hasta) : null;
  const reportesDataDisponible = cajaFuente.ok && gestionFuente.ok && reportesFuente.ok;
  let documentos: ReporteEntregado[] = [];
  let errorReportesData = false;
  if (reportesDataDisponible) {
    try {
      const data: ReportesData = { caja: cajaFuente.datos, gestionConsular: gestionFuente.datos, reportes: reportesFuente.datos };
      documentos = [
        ...obtenerDocumentos("PASAPORTES", data),
        ...obtenerDocumentos("AUTORIZACION_VIAJE", data),
      ];
    } catch (error) {
      errorReportesData = true;
      console.error("Perfil Consular: no fue posible consolidar ReportesEntregados.", error instanceof Error ? error.name : "Error");
    }
  }

  const documentosVisaRequieren = cajaFuente.ok && detalleFuente.ok && gestionFuente.ok && reportesFuente.ok && actuacionesFuente.ok;
  let visas = null;
  if (documentosVisaRequieren) visas = resumirVisas(cajaFuente.datos, detalleFuente.datos, gestionFuente.datos, reportesFuente.datos, actuacionesFuente.datos, desde, hasta);

  const documentosViajeDisponible = cajaFuente.ok && gestionFuente.ok && detalleFuente.ok;
  const documentosViaje = documentosViajeDisponible
    ? resumirDocumentosViaje(cajaFuente.datos, gestionFuente.datos, detalleFuente.datos, desde, hasta)
    : null;
  const otrasActuacionesDisponible = cajaFuente.ok && gestionFuente.ok;
  const otrasActuaciones = otrasActuacionesDisponible
    ? resumirOtrasActuaciones(cajaFuente.datos, gestionFuente.datos, desde, hasta)
    : null;
  const registroElectoralDisponible = gestionFuente.ok;
  const registroElectoral = registroElectoralDisponible
    ? resumirRegistroElectoral(cajaFuente.ok ? cajaFuente.datos : [], gestionFuente.datos, desde, hasta)
    : null;

  const documentosPasaporte = documentos.filter((documento) => documento.categoria === "PASAPORTES");
  const documentosAutorizacion = documentos.filter((documento) => documento.categoria === "AUTORIZACION_VIAJE");
  const pasaportesDisponibles = reportesDataDisponible && !errorReportesData;
  const autorizacionesDisponibles = reportesDataDisponible && !errorReportesData;
  const anioFin = Number(hasta.slice(0, 4));
  const mesFin = Number(hasta.slice(5, 7));
  const periodoCorte = hasta.slice(0, 7);
  const filaJurisdiccion = jurisdiccionFuente.ok
    ? jurisdiccionFuente.datos.filas.slice(1).filter((fila) => String(fila[0] ?? "").trim() === periodoCorte).at(-1)
    : undefined;
  const jurisdiccion = jurisdiccionFuente.ok ? {
    disponible: true,
    estado: filaJurisdiccion ? "disponible" : "sin_datos",
    periodo: periodoCorte,
    datos: filaJurisdiccion ? {
      atlantico: Number(filaJurisdiccion[1] ?? 0),
      magdalena: Number(filaJurisdiccion[2] ?? 0),
      sanAndres: Number(filaJurisdiccion[3] ?? 0),
      total: Number(filaJurisdiccion[4] ?? 0),
      actualizadoPor: String(filaJurisdiccion[5] ?? ""),
      actualizadoEl: String(filaJurisdiccion[6] ?? ""),
    } : null,
    fuente: "Estadísticas de acuerdo a Migración Colombia.",
    mensaje: filaJurisdiccion ? "Estadísticas de acuerdo a Migración Colombia." : "Aún no hay datos guardados para este mes. Un administrador puede registrarlos.",
  } : {
    disponible: false,
    estado: "error",
    periodo: periodoCorte,
    datos: null,
    fuente: "Estadísticas de acuerdo a Migración Colombia.",
    mensaje: "No fue posible consultar la pestaña PerfilConsular.",
  };

  return NextResponse.json({
    ok: true,
    puedeEditar: acceso.sesion.rol === "admin",
    periodo: { desde, hasta, zonaHoraria: ZONA_HORARIA },
    actualizadoEl,
    fuentes,
    comunidadResidente: jurisdiccion,
    ciudadanosRegistro: {
      disponible: Boolean(registro),
      estado: registro ? "disponible" : "error",
      datos: registro,
      fuente: "Registro Consular: marca temporal A, nacionalidad G, documento B/O y lugar de residencia P.",
    },
    registroCivil: {
      disponible: Boolean(casos),
      estado: casos ? "disponible" : "error",
      datos: casos?.registroCivil ?? null,
      fuente: casos?.registroCivil.fechaUtilizada ?? "CasosConsulares!A:N",
    },
    fallecidos: {
      disponible: Boolean(casos),
      estado: casos ? "disponible" : "error",
      datos: casos?.fallecidos ?? null,
      fuente: casos?.fallecidos.fechaUtilizada ?? "CasosConsulares!A:N",
    },
    visas: {
      disponible: Boolean(visas),
      estado: visas ? "disponible" : "error",
      datos: visas,
      fuente: "DetalleCaja!A:D + Caja!A:N, con decisiones y nacionalidad asociadas por ID de GestionConsular a ReportesEntregados!A:U; si falta nacionalidad en el reporte se usa Caja!N.",
      ...(!visas ? { advertencia: "No se pudieron leer todas las fuentes requeridas para contar solicitudes de visas." } : {}),
    },
    pasaportes: {
      disponible: pasaportesDisponibles,
      estado: pasaportesDisponibles ? "disponible" : "error",
      datos: pasaportesDisponibles ? resumirPasaportes(documentosPasaporte, desde, hasta) : null,
      fuente: "Actuaciones vinculadas con planilla GC, ReportesEntregados y fecha registrada de valija/entrega.",
    },
    documentosViaje: {
      disponible: documentosViajeDisponible,
      estado: documentosViajeDisponible ? "disponible" : "error",
      datos: documentosViaje,
      fuente: documentosViaje?.fechaUtilizada ?? "GestionConsular!A:M y Caja!A:K",
    },
    otrasActuaciones: {
      disponible: otrasActuacionesDisponible,
      estado: otrasActuacionesDisponible ? "disponible" : "error",
      datos: otrasActuaciones,
      fuente: otrasActuaciones?.fechaUtilizada ?? "GestionConsular!A:M y Caja!A:K",
    },
    registroElectoral: {
      disponible: registroElectoralDisponible,
      estado: registroElectoralDisponible ? "disponible" : "error",
      datos: registroElectoral,
      fuente: registroElectoral?.fechaUtilizada ?? "GestionConsular!A:M; cédula desde Caja!L cuando existe el recibo.",
    },
    autorizacionesViaje: {
      disponible: autorizacionesDisponibles,
      estado: autorizacionesDisponibles ? "incompleto" : "error",
      datos: autorizacionesDisponibles ? resumirAutorizaciones(documentosAutorizacion) : null,
      fuente: "ReportesEntregados y actuaciones vinculadas de Gestión Consular.",
    },
    corteCalendario: { anio: anioFin, mes: MESES[mesFin - 1] ?? "" },
  });
}

export async function POST(request: NextRequest) {
  const acceso = await exigirPermiso(MODULOS.ADMIN);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const body = await request.json();
    const periodo = String(body?.periodo ?? "").trim();
    const fechaPeriodo = `${periodo}-01`;
    const valores = [body?.atlantico, body?.magdalena, body?.sanAndres].map((valor) => Number(valor));
    if (!/^\d{4}-\d{2}$/.test(periodo) || !fechaISOValida(fechaPeriodo) || valores.some((valor) => !Number.isSafeInteger(valor) || valor < 0)) {
      return NextResponse.json({ ok: false, error: "Indica un mes válido y valores enteros no negativos para las tres jurisdicciones." }, { status: 400 });
    }
    const actualizadoEl = new Date().toISOString();
    const total = valores.reduce((suma, valor) => suma + valor, 0);
    await guardarDatosJurisdiccionPerfil([periodo, ...valores, total, acceso.sesion.usuario, actualizadoEl]);
    return NextResponse.json({ ok: true, periodo, total, actualizadoPor: acceso.sesion.usuario, actualizadoEl });
  } catch (error) {
    console.error("Perfil Consular: no fue posible guardar las cifras de jurisdicción.", error instanceof Error ? error.name : "Error");
    return NextResponse.json({ ok: false, error: "No fue posible guardar las cifras. Revisa la configuración de la hoja PerfilConsular y vuelve a intentar." }, { status: 500 });
  }
}
