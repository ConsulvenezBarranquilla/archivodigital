import { Redis } from "@upstash/redis";

const DURACION_BLOQUEO_SEGUNDOS = 90;
const TIEMPO_ESPERA_MS = 10_000;

export async function conBloqueoGestionConsular<T>(operacion: () => Promise<T>): Promise<T> {
  const url = process.env.KV_REST_API_URL;
  const tokenRedis = process.env.KV_REST_API_TOKEN;
  if (!url || !tokenRedis) {
    throw new Error("Falta configurar Redis para coordinar las operaciones de Gestión Consular.");
  }

  const redis = new Redis({ url, token: tokenRedis });
  const clave = "registro-consular:sgc:bloqueo-operaciones";
  const token = crypto.randomUUID();
  const inicio = Date.now();

  while (Date.now() - inicio < TIEMPO_ESPERA_MS) {
    const adquirido = await redis.set(clave, token, { nx: true, ex: DURACION_BLOQUEO_SEGUNDOS });
    if (adquirido === "OK") {
      try {
        return await operacion();
      } finally {
        await redis.eval(
          'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
          [clave],
          [token],
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Otra operación de Gestión Consular está en curso. Intenta nuevamente.");
}
