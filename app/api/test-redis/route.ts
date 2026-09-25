import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se encontraron KV_REST_API_URL o KV_REST_API_TOKEN.",
        },
        { status: 500 }
      );
    }

    const redis = new Redis({
      url,
      token,
    });

    const clave = "registro-consular:test-redis";

    await redis.set(
      clave,
      {
        prueba: true,
        fecha: new Date().toISOString(),
      },
      {
        ex: 60,
      }
    );

    const resultado = await redis.get(clave);

    return NextResponse.json({
      ok: true,
      mensaje: "Conexión con Redis funcionando correctamente.",
      resultado,
    });
  } catch (error) {
    console.error("Error probando Redis:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No fue posible conectarse a Redis.",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}