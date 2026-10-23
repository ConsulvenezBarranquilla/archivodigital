import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { guardarEventoTurnoEnSheet } from "@/lib/googleSheets";

export type TipoVisitaTurnero = "Informaci\u00F3n" | "Tr\u00E1mite";
export type EstadoTurno = "pendiente" | "llamado" | "atendido";
export type ColaTurno = "visitas" | "analistas";

export interface TurnoAtencion {
  id: string;
  eventId: string;
  evento?: string;
  requestKey: string;
  creadoEl: string;
  nombre: string;
  documento: string;
  tipoVisita: TipoVisitaTurnero;
  cola: ColaTurno;
  estado: EstadoTurno;
  etapa: "recepcion" | "caja" | "analista";
  actuacion: string;
  cantidadActuaciones?: number;
  codigoActuacion: string;
  correlativo: string;
  visitaId: string;
  detalleId: string;
  usuario: string;
  fechaActualizacion: string;
  llamadoEnMs?: number;
  caja: string;
  llamadaPor: string;
  llamadaCaja: string;
  llamadaTipo: "recepcion" | "caja" | "analista" | "";
}

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
if (!redisUrl || !redisToken) throw new Error("Faltan KV_REST_API_URL y KV_REST_API_TOKEN para el Turnero.");
const redis = new Redis({ url: redisUrl, token: redisToken });
const PREFIX = "registro-consular:turnero:v1";
const KEY_ACTIVOS = `${PREFIX}:activos`;
const KEY_OUTBOX = `${PREFIX}:outbox`;
const KEY_SECUENCIA = `${PREFIX}:secuencia`;
export const CANAL_EVENTOS_TURNERO = `${PREFIX}:eventos`;

async function publicarEventoTurnero(evento: Record<string, unknown>) {
  try {
    await redis.publish(CANAL_EVENTOS_TURNERO, JSON.stringify(evento));
  } catch (error) {
    // La persistencia del turno tiene prioridad; el cliente recupera el estado
    // completo al reconectar o abrir nuevamente el widget.
    console.error("No fue posible publicar el evento del turnero:", error);
  }
}

function fechaActualBogota() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function claveLlamadosPublicos() {
  // A separate Redis list per local calendar day makes the public board reset at midnight.
  return `${PREFIX}:ultimos-llamados:v3:${fechaActualBogota()}`;
}

function sha(valor: string) { return crypto.createHash("sha256").update(valor).digest("hex"); }
function claveTurno(id: string) { return `${PREFIX}:turno:${id}`; }
function claveIdempotencia(requestKey: string) { return `${PREFIX}:idempotencia:${sha(requestKey)}`; }
function claveDocumento(documento: string) { return `${PREFIX}:documento:${sha(documento.trim().toUpperCase())}`; }
function epoch(fecha: string) {
  const local = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (local) return new Date(Number(local[3]), Number(local[2]) - 1, Number(local[1]), Number(local[4] || 0), Number(local[5] || 0), Number(local[6] || 0)).getTime();
  return new Date(fecha).getTime();
}

export async function conBloqueoSolicitud<T>(solicitud: string, operacion: () => Promise<T>): Promise<T> {
  const lock = `${PREFIX}:bloqueo:${sha(solicitud)}`;
  const token = crypto.randomUUID();
  const adquirido = await redis.set(lock, token, { nx: true, ex: 120 });
  if (!adquirido) throw new Error("Esta solicitud ya se est\u00C3\u00A1 procesando. Espera unos segundos y vuelve a consultar.");
  try { return await operacion(); }
  finally {
    const liberar = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;
    await redis.eval(liberar, [lock], [token]);
  }
}

function construirEvento(turno: TurnoAtencion, evento: string): TurnoAtencion {
  return { ...turno, evento, eventId: `${turno.id}:${turno.fechaActualizacion}:${evento}` };
}

const LUA_CREAR = `
local existente = redis.call('GET', KEYS[1])
if existente then return redis.call('GET', KEYS[2]) end
local turno = cjson.decode(ARGV[1])
local orden = redis.call('INCR', KEYS[6])
redis.call('SET', KEYS[2], ARGV[1])
redis.call('SET', KEYS[1], turno.id)
redis.call('ZADD', KEYS[3], orden, turno.id)
if KEYS[4] ~= '' then redis.call('SADD', KEYS[4], turno.id) end
redis.call('RPUSH', KEYS[5], 'OUTBOX:' .. ARGV[3])
return ARGV[1]
`;

const LUA_CAMBIAR = `
local valor = redis.call('GET', KEYS[1])
if not valor then return 'NO_TURNO' end
local turno = cjson.decode(valor)
if turno.estado == 'atendido' then return 'YA_ATENDIDO' end
local accion = ARGV[1]
local ahoraMs = tonumber(ARGV[7]) or 0
if accion == 'llamar' and turno.estado == 'llamado' then
  local ultimoLlamadoMs = tonumber(turno.llamadoEnMs) or tonumber(ARGV[8]) or 0
  local restanteMs = 20000 - (ahoraMs - ultimoLlamadoMs)
  if restanteMs > 0 then return 'ESPERAR_RELLAMADO:' .. tostring(restanteMs) end
end
local ahora = ARGV[2]
turno.estado = accion == 'llamar' and 'llamado' or 'atendido'
turno.usuario = ARGV[3]
turno.fechaActualizacion = ahora
turno.eventId = turno.id .. ':' .. ahora .. ':' .. accion
if accion == 'llamar' then
  turno.llamadoEnMs = ahoraMs
  turno.llamadaPor = ARGV[3]
  turno.llamadaCaja = ARGV[4]
  turno.llamadaTipo = turno.cola == 'analistas' and 'analista' or ARGV[5]
  turno.caja = turno.llamadaTipo == 'caja' and ARGV[4] or ''
  local llamado = cjson.encode({id=turno.id, nombre=turno.nombre, tipo=turno.llamadaTipo, caja=turno.llamadaTipo == 'caja' and ARGV[4] or '', actualizadoEl=ahora, personaKey=ARGV[6]})
  redis.call('LPUSH', KEYS[3], 'CALL:' .. llamado)
  redis.call('LTRIM', KEYS[3], 0, 19)
  redis.call('EXPIRE', KEYS[3], 604800)
else
  redis.call('ZREM', KEYS[2], turno.id)
end
turno.evento = accion
redis.call('SET', KEYS[1], cjson.encode(turno))
redis.call('RPUSH', KEYS[4], 'OUTBOX:' .. cjson.encode(turno))
return cjson.encode(turno)
`;

export async function crearTurno(input: Omit<TurnoAtencion, "id" | "eventId" | "estado" | "fechaActualizacion" | "usuario" | "llamadaPor" | "llamadaCaja" | "llamadaTipo"> & { usuario: string }) {
  const id = `T-${sha(input.requestKey).slice(0, 24)}`;
  const ahora = input.creadoEl;
  const turno: TurnoAtencion = {
    ...input,
    id,
    estado: "pendiente",
    fechaActualizacion: ahora,
    eventId: "",
    usuario: input.usuario,
    llamadaPor: "",
    llamadaCaja: "",
    llamadaTipo: "",
  };
  const evento = construirEvento(turno, "creado");
  const respuesta = await redis.eval(
    LUA_CREAR,
    [claveIdempotencia(input.requestKey), claveTurno(id), KEY_ACTIVOS, input.documento ? claveDocumento(input.documento) : "", KEY_OUTBOX, KEY_SECUENCIA],
    [JSON.stringify(turno), 0, JSON.stringify(evento)],
  );
  const respuestaTexto = typeof respuesta === "string" ? respuesta : "";
  const existente = respuesta && typeof respuesta === "object"
    ? respuesta as TurnoAtencion
    : respuestaTexto.startsWith("{") ? JSON.parse(respuestaTexto) as TurnoAtencion : turno;
  await publicarEventoTurnero({ tipo: "actualizacion" });
  await vaciarOutbox();
  return existente;
}

export async function listarTurnos(filtro: { cola?: ColaTurno; tipos?: TipoVisitaTurnero[] } = {}): Promise<TurnoAtencion[]> {
  const ids = await redis.zrange(KEY_ACTIVOS, 0, -1) as unknown as string[];
  if (!ids?.length) return [];
  // MGET sustituye una petición HTTP por cada turno por una sola lectura Redis.
  const resultados = await redis.mget<(TurnoAtencion | null)[]>(
    ...ids.map((id) => claveTurno(String(id)))
  );
  return resultados.filter((turno): turno is TurnoAtencion => Boolean(turno))
    .filter((turno) => !filtro.cola || turno.cola === filtro.cola)
    .filter((turno) => !filtro.tipos || filtro.tipos.includes(turno.tipoVisita));
}

export async function obtenerTurno(id: string) {
  return await redis.get<TurnoAtencion>(claveTurno(id));
}

export async function cambiarEstadoTurno(id: string, accion: "llamar" | "atendido", usuario: string, caja = "", tipoOperador: "recepcion" | "caja" | "analista" = "caja") {
  const keyLlamados = claveLlamadosPublicos();
  const turnoActual = accion === "llamar" ? await obtenerTurno(id) : null;
  const ahoraMs = Date.now();
  const fallbackUltimoLlamadoMs = turnoActual?.estado === "llamado"
    ? Number(turnoActual.llamadoEnMs) || Date.parse(turnoActual.fechaActualizacion) || 0
    : 0;
  const documentoNormalizado = turnoActual?.documento.trim().toUpperCase() || "";
  const nombreNormalizado = turnoActual?.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() || "";
  const personaKey = sha(documentoNormalizado ? "doc:" + documentoNormalizado : "nombre:" + nombreNormalizado);
  const resultado = await redis.eval(
    LUA_CAMBIAR,
    [claveTurno(id), KEY_ACTIVOS, keyLlamados, KEY_OUTBOX, `${PREFIX}:turno:`],
    [accion, new Date(ahoraMs).toISOString(), usuario, caja, tipoOperador, personaKey, ahoraMs, fallbackUltimoLlamadoMs],
  );
  if (resultado === "NO_TURNO") throw new Error("No se encontr\u00C3\u00B3 el turno solicitado.");
  if (resultado === "YA_ATENDIDO") throw new Error("Este turno ya fue atendido por otro operador.");
  if (typeof resultado === "string" && resultado.startsWith("ESPERAR_RELLAMADO:")) {
    const restante = Math.max(1, Math.ceil(Number(resultado.split(":")[1]) / 1000));
    throw new Error(`Podrás volver a llamar en ${restante} segundo${restante === 1 ? "" : "s"}.`);
  }
  const turno = resultado && typeof resultado === "object" ? resultado as TurnoAtencion : JSON.parse(String(resultado)) as TurnoAtencion;
  await publicarEventoTurnero({ tipo: "actualizacion", accion });
  await vaciarOutbox();
  return turno;
}

export interface LlamadoPublico { id: string; nombre: string; tipo: "analista" | "caja" | "recepcion"; caja: string; actualizadoEl: string; }

export async function obtenerLlamadosPublicos(): Promise<LlamadoPublico[]> {
  const items = await redis.lrange(claveLlamadosPublicos(), 0, 19) as unknown as string[];
  const llamados = (items || []).flatMap((raw) => {
    try {
      const item = JSON.parse(String(raw).replace(/^CALL:/, "")) as Record<string, unknown>;
      if (!item.id || !item.nombre) return [];
      const nombreNormalizado = String(item.nombre).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
      return [{ id: String(item.id), nombre: String(item.nombre), tipo: item.tipo === "analista" || item.tipo === "recepcion" ? item.tipo : "caja", caja: item.tipo === "caja" ? String(item.caja || "") : "", actualizadoEl: String(item.actualizadoEl || ""), personaKey: typeof item.personaKey === "string" ? item.personaKey : "", nombreNormalizado }];
    } catch { return []; }
  }) as Array<LlamadoPublico & { personaKey: string; nombreNormalizado: string }>;
  const analistasPorPersona = new Set(llamados.filter((llamado) => llamado.tipo === "analista" && llamado.personaKey).map((llamado) => llamado.personaKey));
  const analistasPorNombre = new Set(llamados.filter((llamado) => llamado.tipo === "analista").map((llamado) => llamado.nombreNormalizado));
  const analistasLegacyPorNombre = new Set(llamados.filter((llamado) => llamado.tipo === "analista" && !llamado.personaKey).map((llamado) => llamado.nombreNormalizado));
  return llamados.filter((llamado) => llamado.tipo === "analista"
    || (llamado.personaKey
      ? !analistasPorPersona.has(llamado.personaKey) && !analistasLegacyPorNombre.has(llamado.nombreNormalizado)
      : !analistasPorNombre.has(llamado.nombreNormalizado)))
    .slice(0, 4)
    .map((llamado) => ({
      id: llamado.id,
      nombre: llamado.nombre,
      tipo: llamado.tipo,
      caja: llamado.caja,
      actualizadoEl: llamado.actualizadoEl,
    }));
}

const DEVICE_PREFIX = `${PREFIX}:device`;
const DEVICE_IDS = `${DEVICE_PREFIX}:linked`;
const CODE_TTL_SECONDS = 600;
const hashDeviceToken = (token: string) => sha(token);

export async function solicitarVinculacionDispositivo(deviceId: string, token: string) {
  const pair = await redis.get<{ tokenHash: string; linkedAt: string }>(`${DEVICE_PREFIX}:pair:${deviceId}`);
  if (pair) return { vinculado: pair.tokenHash === hashDeviceToken(token), codigo: "" };
  const pendingKey = `${DEVICE_PREFIX}:pending:${deviceId}`;
  const pending = await redis.get<{ tokenHash: string; codigo: string }>(pendingKey);
  if (pending && pending.tokenHash === hashDeviceToken(token)) return { vinculado: false, codigo: pending.codigo };
  for (let intento = 0; intento < 8; intento++) {
    const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const codeKey = `${DEVICE_PREFIX}:code:${codigo}`;
    const reservado = await redis.set(codeKey, `${deviceId}:${hashDeviceToken(token)}`, { nx: true, ex: CODE_TTL_SECONDS });
    if (reservado) {
      await redis.set(pendingKey, { tokenHash: hashDeviceToken(token), codigo }, { ex: CODE_TTL_SECONDS });
      return { vinculado: false, codigo };
    }
  }
  throw new Error("No fue posible generar un c\u00F3digo de vinculaci\u00F3n. Intenta nuevamente.");
}

export async function listarDispositivosVinculados() {
  const ids = await redis.smembers(DEVICE_IDS) as unknown as string[];
  const rows = await Promise.all((ids || []).map(async (deviceId) => {
    const pair = await redis.get<{ linkedAt: string }>(`${DEVICE_PREFIX}:pair:${deviceId}`);
    return pair ? { deviceId: String(deviceId), linkedAt: pair.linkedAt } : null;
  }));
  return rows.filter((row): row is { deviceId: string; linkedAt: string } => Boolean(row));
}

export async function vincularDispositivo(codigo: string) {
  const codeKey = `${DEVICE_PREFIX}:code:${codigo}`;
  const reserved = await redis.get<string>(codeKey);
  if (!reserved) throw new Error("El c\u00F3digo no existe o expir\u00F3. Actualiza el turnero para generar otro.");
  const [deviceId, tokenHash] = reserved.split(":");
  const pendingKey = `${DEVICE_PREFIX}:pending:${deviceId}`;
  const pending = await redis.get<{ tokenHash: string; codigo: string }>(pendingKey);
  if (!deviceId || !tokenHash || !pending || pending.codigo !== codigo || pending.tokenHash !== tokenHash) throw new Error("El c\u00F3digo ya no est\u00E1 vigente.");
  await redis.set(`${DEVICE_PREFIX}:pair:${deviceId}`, { tokenHash, linkedAt: new Date().toISOString() });
  await redis.sadd(DEVICE_IDS, deviceId);
  await redis.del(codeKey, pendingKey);
  await publicarEventoTurnero({ tipo: "dispositivo", deviceId });
  return { deviceId };
}

export async function desvincularDispositivo(deviceId: string) {
  await redis.del(`${DEVICE_PREFIX}:pair:${deviceId}`);
  await redis.srem(DEVICE_IDS, deviceId);
  await publicarEventoTurnero({ tipo: "dispositivo", deviceId });
}

export async function dispositivoEstaVinculado(deviceId: string, token: string) {
  const pair = await redis.get<{ tokenHash: string }>(`${DEVICE_PREFIX}:pair:${deviceId}`);
  if (!pair || pair.tokenHash.length !== 64) return false;
  return crypto.timingSafeEqual(Buffer.from(pair.tokenHash), Buffer.from(hashDeviceToken(token)));
}
export async function buscarVisitaReciente(documento: string, fechaReferencia?: string) {
  if (!documento.trim()) return "";
  const ids = await redis.smembers(claveDocumento(documento)) as unknown as string[];
  const candidatos = await Promise.all((ids || []).map((id) => redis.get<TurnoAtencion>(claveTurno(String(id)))));
  const referencia = fechaReferencia ? epoch(fechaReferencia) : Date.now();
  return candidatos.filter((turno): turno is TurnoAtencion => Boolean(turno) && turno!.cola === "visitas")
    .filter((turno) => Math.abs(referencia - epoch(turno.creadoEl)) <= 24 * 60 * 60 * 1000)
    .sort((a, b) => epoch(b.creadoEl) - epoch(a.creadoEl))[0]?.id || "";
}

export async function sincronizarTurnosAnalista(input: {
  correlativo: string; nombre: string; documento: string; fecha: string; usuario: string;
  actuaciones: Array<{ codigo: string; nombre: string; indice: number }>;
  visitaId?: string;
}) {
  const grupos = new Map<string, { etiqueta: string; actuaciones: typeof input.actuaciones }>();
  for (const actuacion of input.actuaciones) {
    const codigo = actuacion.codigo.trim().toUpperCase();
    const nombre = actuacion.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const categoria = ["REG-SLAE", "RES-SLAE", "MOD-SLAE"].includes(codigo) ? { clave: "slae", etiqueta: "SLAE" }
      : nombre.includes("PASAPORTE") ? { clave: "pasaporte", etiqueta: "Pasaporte" }
      : nombre.includes("APOSTILLA") ? { clave: "apostilla", etiqueta: "Apostilla" }
      : nombre.includes("VISA") ? { clave: "visa", etiqueta: "Visa" }
      : nombre.includes("FE DE VIDA") ? { clave: "fe_vida", etiqueta: "Fe de Vida" }
      : nombre.includes("CARTA DE SOLTERIA") ? { clave: "carta_solteria", etiqueta: "Carta de Solter\u00EDa" }
      : nombre.includes("VERIFICACION DE IDENTIDAD") ? { clave: "verificacion_identidad", etiqueta: "Verificaci\u00F3n de Identidad" }
      : nombre.includes("CONSTANCIA") && nombre.includes("REGISTRO") && nombre.includes("CONSULAR") ? { clave: "registro_consular", etiqueta: "Constancia de Registro Consular" }
      : nombre.includes("RESETEO") && nombre.includes("SAIME") ? { clave: "reseteo_saime", etiqueta: "Reseteo de Usuario SAIME" }
      : null;
    if (!categoria) continue;
    const grupo = grupos.get(categoria.clave) || { etiqueta: categoria.etiqueta, actuaciones: [] };
    grupo.actuaciones.push(actuacion);
    grupos.set(categoria.clave, grupo);
  }
  const creados: TurnoAtencion[] = [];
  for (const [clave, grupo] of grupos) {
    creados.push(await crearTurno({
      requestKey: "recibo:" + input.correlativo + ":analista:" + clave,
      creadoEl: input.fecha,
      nombre: input.nombre,
      documento: input.documento,
      tipoVisita: "Tr\u00E1mite",
      cola: "analistas",
      etapa: "analista",
      actuacion: grupo.etiqueta,
      cantidadActuaciones: grupo.actuaciones.length,
      codigoActuacion: grupo.actuaciones.map((item) => item.codigo).join(", "),
      correlativo: input.correlativo,
      visitaId: input.visitaId || "",
      detalleId: grupo.actuaciones.map((item) => String(item.indice)).join(","),
      usuario: input.usuario,
      caja: "",
    }));
  }
  return creados;
}

export async function marcarEventoTurneroPendiente(turno: TurnoAtencion, tipo: string) {
  const evento = construirEvento(turno, tipo);
  await redis.rpush(KEY_OUTBOX, `OUTBOX:${JSON.stringify(evento)}`);
  await vaciarOutbox();
}

async function vaciarOutbox() {
  const lock = `${PREFIX}:outbox:lock`;
  const token = crypto.randomUUID();
  const adquirido = await redis.set(lock, token, { nx: true, ex: 30 });
  if (!adquirido) return;
  try {
    const eventos = await redis.lrange(KEY_OUTBOX, 0, 19) as unknown as Array<string | TurnoAtencion>;
    for (const raw of eventos || []) {
      const valorLista = typeof raw === "string" ? raw : `OUTBOX:${JSON.stringify(raw)}`;
      const valorEvento = valorLista.startsWith("OUTBOX:") ? valorLista.slice(7) : JSON.stringify(raw);
      const evento = JSON.parse(valorEvento) as TurnoAtencion;
      try {
        await guardarEventoTurnoEnSheet(evento as unknown as Record<string, unknown>);
        await redis.lrem(KEY_OUTBOX, 1, valorLista);
      } catch (error) {
        console.error("Turnero: no se pudo sincronizar el evento de Sheets; queda en la cola de reintentos.", error);
        break;
      }
    }
  } finally {
    const liberar = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;
    await redis.eval(liberar, [lock], [token]);
  }
}
