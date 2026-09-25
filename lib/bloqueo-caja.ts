import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "Faltan las variables KV_REST_API_URL y KV_REST_API_TOKEN."
  );
}

const redis = new Redis({
  url,
  token,
});

const DURACION_BLOQUEO_SEGUNDOS = 8 * 60 * 60;

export interface BloqueoCaja {
  sessionId: string;
  usuario: string;
  nombre: string;
  caja: string;
  creadoEn: string;
}

function obtenerClaveCaja(caja: string): string {
  return `registro-consular:caja:${caja}:bloqueo`;
}

export async function reservarCaja(
  caja: string,
  sessionId: string,
  usuario: string,
  nombre: string
): Promise<{
  disponible: boolean;
  bloqueoExistente?: BloqueoCaja;
}> {
  const cajaNormalizada = caja.trim();

  if (!cajaNormalizada) {
    return {
      disponible: false,
    };
  }

  const clave = obtenerClaveCaja(cajaNormalizada);

  const bloqueo: BloqueoCaja = {
    sessionId,
    usuario,
    nombre,
    caja: cajaNormalizada,
    creadoEn: new Date().toISOString(),
  };

  const resultado = await redis.set(
    clave,
    bloqueo,
    {
      nx: true,
      ex: DURACION_BLOQUEO_SEGUNDOS,
    }
  );

  if (resultado === "OK") {
    return {
      disponible: true,
    };
  }

  const bloqueoExistente =
    await redis.get<BloqueoCaja>(clave);

  return {
    disponible: false,
    bloqueoExistente:
      bloqueoExistente ?? undefined,
  };
}

export async function liberarCaja(
  caja: string,
  sessionId: string
): Promise<boolean> {
  const cajaNormalizada = caja.trim();

  if (!cajaNormalizada || !sessionId) {
    return false;
  }

  const clave = obtenerClaveCaja(cajaNormalizada);

  const script = `
    local valor = redis.call("GET", KEYS[1])

    if not valor then
      return 0
    end

    local datos = cjson.decode(valor)

    if datos["sessionId"] == ARGV[1] then
      redis.call("DEL", KEYS[1])
      return 1
    end

    return 0
  `;

  const resultado = await redis.eval(
    script,
    [clave],
    [sessionId]
  );

  return Number(resultado) === 1;
}

export async function obtenerBloqueoCaja(
  caja: string
): Promise<BloqueoCaja | null> {

  const cajaNormalizada =
    caja.trim();

  if (!cajaNormalizada) {
    return null;
  }

  const clave =
    obtenerClaveCaja(
      cajaNormalizada
    );

  const bloqueo =
    await redis.get<BloqueoCaja>(
      clave
    );

  return bloqueo ?? null;
}

export async function liberarCajaAdministrativamente(
  caja: string
): Promise<boolean> {

  const cajaNormalizada =
    caja.trim();

  if (!cajaNormalizada) {
    return false;
  }

  const clave =
    obtenerClaveCaja(
      cajaNormalizada
    );

  const resultado =
    await redis.del(
      clave
    );

  return Number(resultado) === 1;
}