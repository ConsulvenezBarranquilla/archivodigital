import crypto from "node:crypto";
import { Redis } from "@upstash/redis";

import {
  actualizarCasoConsular,
  agregarCasoConsular,
  HOJA_DETALLE,
  leerHoja,
  obtenerCaja,
  obtenerFilasCasosConsulares,
} from "@/lib/googleSheets";
import type { CasoConsular, CategoriaCaso, EventoCaso, EstadoCaso, PendienteRegistroCivil } from "@/lib/casosConsularesTypes";

const REDIS_KEY_CORRELATIVO = "registro-consular:casos:ultimo-correlativo";
const ACTUACIONES_REGISTRO_CIVIL = {
  "INSER-N": { actuacion: "Inserción Nacimiento", tipoRegistroCivil: "Nacimiento" },
  "REG-REC": { actuacion: "Reconocimiento", tipoRegistroCivil: "Reconocimiento" },
  "REG-MAT": { actuacion: "Matrimonio", tipoRegistroCivil: "Matrimonio" },
  "REG-DEF": { actuacion: "Defunción", tipoRegistroCivil: "Defunción" },
} as const;

export class ErrorValidacionCaso extends Error {}
export class ErrorCasoOcupado extends Error {}

function obtenerRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Falta configurar Redis para la gestión segura de casos.");
  return new Redis({ url, token });
}

function cadena(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function esFechaISOValida(fecha: string) {
  const coincidencia = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!coincidencia) return false;
  const [, anio, mes, dia] = coincidencia;
  const valor = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  return valor.getUTCFullYear() === Number(anio)
    && valor.getUTCMonth() === Number(mes) - 1
    && valor.getUTCDate() === Number(dia);
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown>
    : {};
}

function campoObligatorio(datos: Record<string, unknown>, campo: string, etiqueta = campo) {
  const valor = cadena(datos[campo]);
  if (!valor) throw new ErrorValidacionCaso(`El campo ${etiqueta} es obligatorio.`);
  return valor;
}

function normalizarEventos(valor: unknown, requerido = false): EventoCaso[] {
  if (valor !== undefined && !Array.isArray(valor)) throw new ErrorValidacionCaso("La bitácora debe ser una lista de eventos.");
  const eventos = (Array.isArray(valor) ? valor : []).map((entradaEvento: unknown) => {
    const evento = objeto(entradaEvento);
    const fecha = cadena(evento.fecha);
    const descripcion = cadena(evento.descripcion);
    if (!esFechaISOValida(fecha)) {
      throw new ErrorValidacionCaso("Cada evento debe incluir una fecha válida.");
    }
    if (!descripcion) throw new ErrorValidacionCaso("Cada evento debe incluir una descripción.");
    return { fecha, descripcion, usuario: cadena(evento.usuario) };
  });
  if (requerido && eventos.length === 0) throw new ErrorValidacionCaso("Agrega al menos un evento a la bitácora.");
  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function validarDatosCaso(categoria: CategoriaCaso, entrada: unknown): Record<string, unknown> {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) throw new ErrorValidacionCaso("Los datos del caso no son válidos.");
  const datos = entrada as Record<string, unknown>;
  const nombre = categoria === "Registro Civil"
    ? cadena(Array.isArray(datos.titulares) ? datos.titulares[0] : "")
    : campoObligatorio(datos, "nombre", "nombre");
  if (!nombre) throw new ErrorValidacionCaso("Indica el nombre de al menos un titular.");
  const normalizados: Record<string, unknown> = {
    ...datos,
    nombre,
  };

  if (categoria === "NNA") {
    normalizados.resumen = campoObligatorio(datos, "resumen", "resumen");
    for (const pais of ["Venezuela", "Colombia"] as const) {
      const contacto = (datos[`contacto${pais}`] ?? {}) as Record<string, unknown>;
      const lleno = [contacto.nombre, contacto.telefono, contacto.vinculo].some((valor) => cadena(valor));
      normalizados[`contacto${pais}`] = lleno ? {
        nombre: campoObligatorio(contacto, "nombre", `nombre del contacto en ${pais}`),
        telefono: campoObligatorio(contacto, "telefono", `teléfono del contacto en ${pais}`),
        vinculo: campoObligatorio(contacto, "vinculo", `vínculo del contacto en ${pais}`),
      } : { nombre: "", telefono: "", vinculo: "" };
    }
    normalizados.eventos = normalizarEventos(datos.eventos);
  } else if (categoria === "Personas Privadas de Libertad") {
    normalizados.genero = campoObligatorio(datos, "genero", "género");
    if (!["Masculino", "Femenino"].includes(String(normalizados.genero))) throw new ErrorValidacionCaso("Selecciona Masculino o Femenino para el género.");
    normalizados.cedula = campoObligatorio(datos, "cedula", "cédula");
    normalizados.centroPenitenciario = campoObligatorio(datos, "centroPenitenciario", "centro penitenciario");
    for (const campo of ["motivo", "estatus", "sentencia", "fechaCulminacion"]) normalizados[campo] = cadena(datos[campo]);
    if (normalizados.fechaCulminacion && !esFechaISOValida(String(normalizados.fechaCulminacion))) {
      throw new ErrorValidacionCaso("La fecha de culminación no es válida.");
    }
  } else if (categoria === "Verificación de Identidad") {
    normalizados.cedula = campoObligatorio(datos, "cedula", "cédula");
    normalizados.registroDactiloscopico = campoObligatorio(datos, "registroDactiloscopico", "registro dactiloscópico");
    if (!["Sí", "No"].includes(String(normalizados.registroDactiloscopico))) throw new ErrorValidacionCaso("Indica si cuenta con registro dactiloscópico.");
  } else if (categoria === "Fallecidos") {
    normalizados.cedula = campoObligatorio(datos, "cedula", "cédula");
    normalizados.motivo = campoObligatorio(datos, "motivo", "motivo");
    if (!["Homicidio", "Suicidio", "Natural", "Otros"].includes(String(normalizados.motivo))) throw new ErrorValidacionCaso("Selecciona un motivo válido.");
    normalizados.detalleMotivo = cadena(datos.detalleMotivo);
  } else if (categoria === "Repatriaciones") {
    normalizados.condicion = campoObligatorio(datos, "condicion", "condición");
    if (!["Vivo", "Fallecido"].includes(String(normalizados.condicion))) throw new ErrorValidacionCaso("Selecciona Vivo o Fallecido.");
    normalizados.cedula = campoObligatorio(datos, "cedula", "cédula");
    normalizados.fechaRepatriacion = campoObligatorio(datos, "fechaRepatriacion", "fecha");
    if (!esFechaISOValida(String(normalizados.fechaRepatriacion))) throw new ErrorValidacionCaso("Indica una fecha válida.");
    const familiares = Array.isArray(datos.familiares) ? datos.familiares : [];
    normalizados.familiares = normalizados.condicion === "Vivo" ? familiares.map((familiarEntrada: unknown, indice: number) => {
      const familiar = objeto(familiarEntrada);
      return {
        nombre: campoObligatorio(familiar, "nombre", `nombre del familiar ${indice + 1}`),
        parentesco: campoObligatorio(familiar, "parentesco", `parentesco del familiar ${indice + 1}`),
      };
    }) : [];
  } else if (categoria === "Registro Civil") {
    const titularesEntrada = Array.isArray(datos.titulares) ? datos.titulares : [];
    normalizados.titulares = titularesEntrada.map((titular, indice) => {
      const titularNombre = cadena(titular);
      if (!titularNombre) throw new ErrorValidacionCaso(`El nombre del titular ${indice + 1} es obligatorio.`);
      return titularNombre;
    });
    if ((normalizados.titulares as string[]).length === 0) throw new ErrorValidacionCaso("Agrega al menos un titular.");

    const presentantes = Array.isArray(datos.presentantes) ? datos.presentantes : [];
    normalizados.presentantes = presentantes.map((presentanteEntrada: unknown, indice: number) => {
      const presentante = objeto(presentanteEntrada);
      return {
        nombre: campoObligatorio(presentante, "nombre", `nombre del presentante ${indice + 1}`),
        documento: campoObligatorio(presentante, "documento", `cédula o pasaporte del presentante ${indice + 1}`),
      };
    });
    if ((normalizados.presentantes as unknown[]).length === 0) throw new ErrorValidacionCaso("Agrega al menos un presentante.");

    normalizados.tipoRegistroCivil = campoObligatorio(datos, "tipoRegistroCivil", "tipo de Registro Civil");
    if (!["Nacimiento", "Reconocimiento", "Matrimonio", "Defunción"].includes(String(normalizados.tipoRegistroCivil))) {
      throw new ErrorValidacionCaso("Selecciona un tipo de Registro Civil válido.");
    }
    normalizados.eventos = normalizarEventos(datos.eventos, true);
  } else {
    normalizados.personasInvolucradas = (Array.isArray(datos.personasInvolucradas) ? datos.personasInvolucradas : []).map((personaEntrada: unknown, indice: number) => {
      const persona = objeto(personaEntrada);
      return {
        nombre: campoObligatorio(persona, "nombre", `nombre de la persona involucrada ${indice + 1}`),
        cedula: campoObligatorio(persona, "cedula", `cédula de la persona involucrada ${indice + 1}`),
      };
    });
    if ((normalizados.personasInvolucradas as unknown[]).length === 0) throw new ErrorValidacionCaso("Agrega al menos una persona involucrada.");
    normalizados.descripcion = campoObligatorio(datos, "descripcion", "descripción");
    normalizados.eventos = normalizarEventos(datos.eventos, true);
  }

  return normalizados;
}

function leerCaso(fila: unknown[]): CasoConsular | null {
  if (!fila[0] || !fila[1]) return null;
  let datos: Record<string, unknown>;
  try {
    datos = JSON.parse(String(fila[10] ?? "{}"));
  } catch {
    datos = {};
  }
  return {
    id: String(fila[0]), correlativo: String(fila[1]), categoria: String(fila[2]) as CategoriaCaso,
    nombre: String(fila[3] ?? ""), tipo: String(fila[4] ?? fila[2] ?? ""), fecha: String(fila[5] ?? ""),
    creadoPor: String(fila[6] ?? ""), creadoEl: String(fila[7] ?? ""),
    actualizadoPor: String(fila[8] ?? ""), actualizadoEl: String(fila[9] ?? ""),
    estado: fila[11] === "Finalizado" ? "Finalizado" : "Abierto", datos,
    reciboCaja: String(fila[12] ?? "") || undefined,
    codigoActuacion: String(fila[13] ?? "") || undefined,
  };
}

export async function listarCasosConsulares() {
  const filas = await obtenerFilasCasosConsulares();
  return filas.slice(1).map((fila) => leerCaso(fila)).filter((caso): caso is CasoConsular => caso !== null)
    .sort((a, b) => b.correlativo.localeCompare(a.correlativo, undefined, { numeric: true }));
}

export async function listarPendientesRegistroCivil(casosRegistrados?: CasoConsular[]): Promise<PendienteRegistroCivil[]> {
  const [caja, detalleCaja, casos] = await Promise.all([
    obtenerCaja(),
    leerHoja(HOJA_DETALLE, "A:F"),
    casosRegistrados ? Promise.resolve(casosRegistrados) : listarCasosConsulares(),
  ]);
  const referenciasRegistradas = new Set(casos.flatMap((caso) =>
    caso.reciboCaja && caso.codigoActuacion ? [`${caso.reciboCaja}|${caso.codigoActuacion}`] : []
  ));
  const codigosPorRecibo = new Map<string, Set<string>>();
  for (const detalle of detalleCaja.slice(1)) {
    const reciboDetalle = cadena(detalle[0]);
    const codigoDetalle = cadena(detalle[1]).toUpperCase();
    if (!reciboDetalle || !codigoDetalle) continue;
    const codigos = codigosPorRecibo.get(reciboDetalle) ?? new Set<string>();
    codigos.add(codigoDetalle);
    codigosPorRecibo.set(reciboDetalle, codigos);
  }
  const pendientes: PendienteRegistroCivil[] = [];

  for (const fila of caja.slice(1)) {
    const recibo = cadena(fila[1]);
    if (!recibo || cadena(fila[10]).toUpperCase() !== "GENERADO") continue;
    const codigosRecibo = codigosPorRecibo.get(recibo) ?? new Set<string>();
    for (const codigo of codigosRecibo) {
      const actuacionCivil = ACTUACIONES_REGISTRO_CIVIL[codigo as keyof typeof ACTUACIONES_REGISTRO_CIVIL];
      if (!actuacionCivil || referenciasRegistradas.has(`${recibo}|${codigo}`)) continue;
      pendientes.push({
        recibo,
        codigoActuacion: codigo as PendienteRegistroCivil["codigoActuacion"],
        actuacion: actuacionCivil.actuacion,
        tipoRegistroCivil: actuacionCivil.tipoRegistroCivil,
        fecha: String(fila[0] ?? ""),
        presentante: String(fila[3] ?? "").trim(),
        documentoPresentante: String(fila[11] || fila[12] || "").trim(),
      });
    }
  }
  return pendientes.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

async function encontrarCaso(id: string) {
  const filas = await obtenerFilasCasosConsulares();
  const indice = filas.findIndex((fila, index) => index > 0 && String(fila[0]) === id);
  if (indice < 1) return null;
  const caso = leerCaso(filas[indice]);
  return caso ? { caso, filaNumero: indice + 1 } : null;
}

export async function consultarCasoConsular(id: string) {
  return (await encontrarCaso(id))?.caso ?? null;
}

async function adquirirBloqueo(id: string) {
  const redis = obtenerRedis();
  const clave = `registro-consular:casos:bloqueo:${id}`;
  const token = crypto.randomUUID();
  for (let intento = 0; intento < 100; intento++) {
    const resultado = await redis.set(clave, token, { nx: true, ex: 90 });
    if (resultado === "OK") return { redis, clave, token };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new ErrorCasoOcupado("El caso está siendo actualizado. Intenta nuevamente en unos segundos.");
}

async function liberarBloqueo(bloqueo: { redis: Redis; clave: string; token: string }) {
  await bloqueo.redis.eval(
    `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end`,
    [bloqueo.clave],
    [bloqueo.token]
  );
}

function filaDeCaso(caso: CasoConsular) {
  return [caso.id, caso.correlativo, caso.categoria, caso.nombre, caso.tipo, caso.fecha,
    caso.creadoPor, caso.creadoEl, caso.actualizadoPor, caso.actualizadoEl, JSON.stringify(caso.datos), caso.estado,
    caso.reciboCaja ?? "", caso.codigoActuacion ?? ""];
}

export async function crearCasoConsular(
  categoria: CategoriaCaso,
  entrada: unknown,
  usuario: string,
  tipo: string = categoria,
  referenciaCaja?: { reciboCaja: string; codigoActuacion: string }
) {
  const datos = validarDatosCaso(categoria, entrada);
  if (Array.isArray(datos.eventos)) {
    datos.eventos = (datos.eventos as EventoCaso[]).map((evento) => ({ ...evento, usuario }));
  }
  const nombre = String(datos.nombre);
  const filas = await obtenerFilasCasosConsulares(true);
  const ultimoEnHoja = filas.slice(1).reduce((maximo, fila) => {
    const coincidencia = String(fila[1] ?? "").match(/^CASO-(\d+)$/i);
    return coincidencia ? Math.max(maximo, Number(coincidencia[1])) : maximo;
  }, 0);
  const redis = obtenerRedis();
  const numero = Number(await redis.eval(
    `local actual = tonumber(redis.call("GET", KEYS[1]) or "0") or 0; local hoja = tonumber(ARGV[1]) or 0; if hoja > actual then actual = hoja end; actual = actual + 1; redis.call("SET", KEYS[1], actual); return actual`,
    [REDIS_KEY_CORRELATIVO],
    [String(ultimoEnHoja)]
  ));
  const ahora = new Date().toISOString();
  const caso: CasoConsular = {
    id: crypto.randomUUID(), correlativo: `CASO-${String(numero).padStart(6, "0")}`,
    categoria, nombre, tipo, fecha: ahora, creadoPor: usuario, creadoEl: ahora,
    actualizadoPor: usuario, actualizadoEl: ahora, estado: "Abierto", datos,
    reciboCaja: referenciaCaja?.reciboCaja,
    codigoActuacion: referenciaCaja?.codigoActuacion,
  };
  await agregarCasoConsular(filaDeCaso(caso));
  return caso;
}

export async function crearCasoRegistroCivilDesdeCaja(
  recibo: string,
  codigoEntrada: string,
  entrada: unknown,
  usuario: string
) {
  const codigo = codigoEntrada.trim().toUpperCase();
  const actuacionCivil = ACTUACIONES_REGISTRO_CIVIL[codigo as keyof typeof ACTUACIONES_REGISTRO_CIVIL];
  if (!actuacionCivil) throw new ErrorValidacionCaso("La actuación no corresponde a Registro Civil.");
  const referencia = `${recibo.trim()}|${codigo}`;
  const bloqueo = await adquirirBloqueo(`registrocivil-${referencia}`);
  try {
    const filas = await obtenerFilasCasosConsulares(true);
    const existente = filas.slice(1).map((fila) => leerCaso(fila))
      .find((caso) => caso?.reciboCaja === recibo && caso.codigoActuacion === codigo);
    if (existente) return existente;

    const [caja, detalleCaja] = await Promise.all([
      obtenerCaja(),
      leerHoja(HOJA_DETALLE, "A:F"),
    ]);
    const filaCaja = caja.slice(1).find((fila) => cadena(fila[1]) === recibo.trim());
    const hayActuacion = detalleCaja.slice(1).some((detalle) =>
      cadena(detalle[0]) === recibo.trim() && cadena(detalle[1]).toUpperCase() === codigo
    );
    if (!filaCaja || cadena(filaCaja[10]).toUpperCase() !== "GENERADO" || !hayActuacion) {
      throw new ErrorValidacionCaso("El recibo ya no está vigente o no contiene esta actuación.");
    }

    const datosEntrada = objeto(entrada);
    const presentantesSolicitados = Array.isArray(datosEntrada.presentantes) ? datosEntrada.presentantes : [];
    const primerPresentanteSolicitado = objeto(presentantesSolicitados[0]);
    const presentanteRecibo = {
      nombre: String(filaCaja[3] ?? "").trim() || cadena(primerPresentanteSolicitado.nombre),
      documento: String(filaCaja[11] || filaCaja[12] || "").trim() || cadena(primerPresentanteSolicitado.documento),
    };
    const presentantes = [presentanteRecibo, ...presentantesSolicitados.filter((valor) => {
      const presentante = objeto(valor);
      return !(cadena(presentante.nombre).toLocaleLowerCase() === presentanteRecibo.nombre.toLocaleLowerCase()
        && cadena(presentante.documento) === presentanteRecibo.documento);
    })];
    const datos = {
      ...datosEntrada,
      tipoRegistroCivil: actuacionCivil.tipoRegistroCivil,
      presentantes,
    };
    return await crearCasoConsular(
      "Registro Civil",
      datos,
      usuario,
      actuacionCivil.actuacion,
      { reciboCaja: recibo.trim(), codigoActuacion: codigo }
    );
  } finally {
    await liberarBloqueo(bloqueo);
  }
}

export async function actualizarCasoConsularPorId(id: string, categoria: CategoriaCaso, entrada: unknown, usuario: string) {
  const bloqueo = await adquirirBloqueo(id);
  try {
    const encontrado = await encontrarCaso(id);
    if (!encontrado) return null;
    if (encontrado.caso.categoria !== categoria) throw new ErrorValidacionCaso("La categoría de un caso no se puede cambiar.");
    const datosRecibidos = entrada && typeof entrada === "object" && !Array.isArray(entrada)
      ? entrada as Record<string, unknown>
      : {};
    const datos = validarDatosCaso(categoria, {
      ...datosRecibidos,
      ...( "eventos" in encontrado.caso.datos ? { eventos: encontrado.caso.datos.eventos } : {}),
    });
    const ahora = new Date().toISOString();
    const actualizado: CasoConsular = {
      ...encontrado.caso,
      nombre: String(datos.nombre),
      datos,
      actualizadoPor: usuario,
      actualizadoEl: ahora,
    };
    await actualizarCasoConsular(encontrado.filaNumero, filaDeCaso(actualizado));
    return actualizado;
  } finally {
    await liberarBloqueo(bloqueo);
  }
}

export async function agregarEventoCaso(id: string, eventoEntrada: unknown, usuario: string) {
  const bloqueo = await adquirirBloqueo(id);
  try {
    const encontrado = await encontrarCaso(id);
    if (!encontrado) return null;
    if (!["NNA", "Casos Especiales", "Registro Civil"].includes(encontrado.caso.categoria)) throw new ErrorValidacionCaso("Esta categoría no admite bitácora de eventos.");
    const nuevo = normalizarEventos([eventoEntrada])[0];
    nuevo.usuario = usuario;
    const eventos = normalizarEventos([...(Array.isArray(encontrado.caso.datos.eventos) ? encontrado.caso.datos.eventos as EventoCaso[] : []), nuevo]);
    const ahora = new Date().toISOString();
    const actualizado: CasoConsular = {
      ...encontrado.caso, datos: { ...encontrado.caso.datos, eventos }, actualizadoPor: usuario, actualizadoEl: ahora,
    };
    await actualizarCasoConsular(encontrado.filaNumero, filaDeCaso(actualizado));
    return actualizado;
  } finally {
    await liberarBloqueo(bloqueo);
  }
}

export async function actualizarEstadoCaso(id: string, estado: EstadoCaso, usuario: string) {
  const bloqueo = await adquirirBloqueo(id);
  try {
    const encontrado = await encontrarCaso(id);
    if (!encontrado) return null;
    const actualizado: CasoConsular = {
      ...encontrado.caso,
      estado,
      actualizadoPor: usuario,
      actualizadoEl: new Date().toISOString(),
    };
    await actualizarCasoConsular(encontrado.filaNumero, filaDeCaso(actualizado));
    return actualizado;
  } finally {
    await liberarBloqueo(bloqueo);
  }
}
