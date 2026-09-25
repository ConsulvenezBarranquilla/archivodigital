import crypto from "crypto";

import { cookies } from "next/headers";

import { Redis } from "@upstash/redis";

const COOKIE_NAME =

  process.env.NODE_ENV === "production"

    ? "__Host-registro-session"

    : "registro-session";

const SESSION_DURATION_SECONDS = 30 * 60;

const redisUrl =
  process.env.KV_REST_API_URL;

const redisToken =
  process.env.KV_REST_API_TOKEN;

if (
  !redisUrl ||
  !redisToken
) {

  throw new Error(
    "Faltan las variables KV_REST_API_URL y KV_REST_API_TOKEN."
  );

}

const redis =
  new Redis({
    url: redisUrl,
    token: redisToken,
  });

export interface UsuarioSesion {

  usuario: string;

  nombre: string;

  rol: string;

  caja?: string;

  sessionId?: string;

}

interface PayloadSesion extends UsuarioSesion {

  iat: number;

  exp: number;

}

function obtenerClaveSesionUsuario(

  usuario: string

): string {

  const usuarioNormalizado =
    usuario
      .trim()
      .toUpperCase();

  const hash =
    crypto
      .createHash("sha256")
      .update(usuarioNormalizado)
      .digest("hex");

  return `registro-consular:usuario:${hash}:sesion`;

}

function obtenerClaveSecreta(): Buffer {

  const secret = process.env.AUTH_SECRET;

  if (!secret) {

    throw new Error(

      "Falta la variable de entorno AUTH_SECRET."

    );

  }

  return crypto

    .createHash("sha256")

    .update(secret)

    .digest();

}

function base64UrlEncode(

  buffer: Buffer

): string {

  return buffer

    .toString("base64")

    .replace(/\+/g, "-")

    .replace(/\//g, "_")

    .replace(/=+$/, "");

}

function base64UrlDecode(

  value: string

): Buffer {

  const base64 = value

    .replace(/-/g, "+")

    .replace(/_/g, "/");

  const padding = "=".repeat(

    (4 - (base64.length % 4)) % 4

  );

  return Buffer.from(

    base64 + padding,

    "base64"

  );

}

function cifrarSesion(

  payload: PayloadSesion

): string {

  const key = obtenerClaveSecreta();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(

    "aes-256-gcm",

    key,

    iv

  );

  const texto = JSON.stringify(payload);

  const ciphertext = Buffer.concat([

    cipher.update(texto, "utf8"),

    cipher.final(),

  ]);

  const authTag = cipher.getAuthTag();

  return [

    base64UrlEncode(iv),

    base64UrlEncode(authTag),

    base64UrlEncode(ciphertext),

  ].join(".");

}

function descifrarSesion(

  token: string

): PayloadSesion | null {

  try {

    const partes = token.split(".");

    if (partes.length !== 3) {

      return null;

    }

    const [

      ivEncoded,

      tagEncoded,

      ciphertextEncoded,

    ] = partes;

    const iv =

      base64UrlDecode(ivEncoded);

    const authTag =

      base64UrlDecode(tagEncoded);

    const ciphertext =

      base64UrlDecode(

        ciphertextEncoded

      );

    const key = obtenerClaveSecreta();

    const decipher =

      crypto.createDecipheriv(

        "aes-256-gcm",

        key,

        iv

      );

    decipher.setAuthTag(authTag);

    const texto = Buffer.concat([

      decipher.update(ciphertext),

      decipher.final(),

    ]).toString("utf8");

    const payload =

      JSON.parse(texto) as PayloadSesion;

    if (

      !payload.usuario ||

      !payload.nombre ||

      !payload.rol ||

      !payload.iat ||

      !payload.exp ||

      !payload.sessionId

    ) {

      return null;

    }

    const ahora =

      Math.floor(Date.now() / 1000);

    if (payload.exp <= ahora) {

      return null;

    }

    return payload;

  } catch {

    return null;

  }

}

async function registrarSesionActiva(

  usuario: UsuarioSesion

): Promise<boolean> {

  if (!usuario.sessionId) {

    return false;

  }

  const clave =

    obtenerClaveSesionUsuario(

      usuario.usuario

    );

  const ahora =

    Math.floor(Date.now() / 1000);

  const datos = JSON.stringify({

    sessionId:

      usuario.sessionId,

    usuario:

      usuario.usuario,

    nombre:

      usuario.nombre,

    rol:

      usuario.rol,

    actualizadoEn:

      ahora,

  });

  const script = `

    local existente = redis.call(

      "GET",

      KEYS[1]

    )

    if not existente then

      redis.call(

        "SET",

        KEYS[1],

        ARGV[1],

        "EX",

        ARGV[2]

      )

      return 1

    end

    local datosExistentes =

      cjson.decode(existente)

    if (

      datosExistentes["sessionId"]

      == ARGV[3]

    ) then

      redis.call(

        "SET",

        KEYS[1],

        ARGV[1],

        "EX",

        ARGV[2]

      )

      return 1

    end

    return 0

  `;

  const resultado =

    await redis.eval(

      script,

      [clave],

      [

        datos,

        SESSION_DURATION_SECONDS,

        usuario.sessionId,

      ]

    );

  return Number(resultado) === 1;

}

async function validarSesionActiva(

  usuario: string,

  sessionId: string

): Promise<boolean> {

  const clave =

    obtenerClaveSesionUsuario(

      usuario

    );

  const activa =

    await redis.get<{

      sessionId?: string;

    }>(clave);

  if (!activa) {

    return false;

  }

  return (

    activa.sessionId ===

    sessionId

  );

}

export async function crearSesion(

  usuario: UsuarioSesion

): Promise<boolean> {

  const ahora =

    Math.floor(Date.now() / 1000);

  const sessionId =

    usuario.sessionId ??

    crypto.randomUUID();

  const payload: PayloadSesion = {

    usuario: usuario.usuario,

    nombre: usuario.nombre,

    rol: usuario.rol,

    caja: usuario.caja,

    sessionId,

    iat: ahora,

    exp:

      ahora +

      SESSION_DURATION_SECONDS,

  };

  const sesionRegistrada =

    await registrarSesionActiva({

      ...usuario,

      sessionId,

    });

  if (!sesionRegistrada) {

    return false;

  }

  const token =

    cifrarSesion(payload);

  const cookieStore =

    await cookies();

  cookieStore.set({

    name: COOKIE_NAME,

    value: token,

    httpOnly: true,

    secure:

      process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge:

      SESSION_DURATION_SECONDS,

  });

  return true;

}

export async function obtenerSesion(): Promise<

  UsuarioSesion | null

> {

  try {

    const cookieStore =

      await cookies();

    const cookie =

      cookieStore.get(COOKIE_NAME);

    if (!cookie?.value) {

      return null;

    }

    const payload =

      descifrarSesion(

        cookie.value

      );

    if (!payload) {

      return null;

    }

    if (!payload.sessionId) {

      return null;

    }

    const sesionActiva =

      await validarSesionActiva(

        payload.usuario,

        payload.sessionId

      );

    if (!sesionActiva) {

      return null;

    }

    const sesionActualizada = {

      usuario:

        payload.usuario,

      nombre:

        payload.nombre,

      rol:

        payload.rol,

      caja:

        payload.caja,

      sessionId:

        payload.sessionId,

    };

    await crearSesion(

      sesionActualizada

    );

    return sesionActualizada;

  } catch {

    return null;

  }

}

export async function cerrarSesion(): Promise<void> {

  try {

    const cookieStore =

      await cookies();

    const cookie =

      cookieStore.get(COOKIE_NAME);

    if (cookie?.value) {

      const payload =

        descifrarSesion(

          cookie.value

        );

      if (

        payload?.usuario &&

        payload?.sessionId

      ) {

        const clave =

          obtenerClaveSesionUsuario(

            payload.usuario

          );

        const script = `

          local existente =

            redis.call(

              "GET",

              KEYS[1]

            )

          if not existente then

            return 0

          end

          local datos =

            cjson.decode(existente)

          if (

            datos["sessionId"]

            == ARGV[1]

          ) then

            redis.call(

              "DEL",

              KEYS[1]

            )

            return 1

          end

          return 0

        `;

        await redis.eval(

          script,

          [clave],

          [payload.sessionId]

        );

      }

    }

    cookieStore.set({

      name: COOKIE_NAME,

      value: "",

      httpOnly: true,

      secure:

        process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,

    });

  } catch {

    const cookieStore =

      await cookies();

    cookieStore.set({

      name: COOKIE_NAME,

      value: "",

      httpOnly: true,

      secure:

        process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,

    });

  }

}

export async function estaAutenticado(): Promise<boolean> {

  const sesion =

    await obtenerSesion();

  return sesion !== null;

}

export async function actualizarCajaSesion(

  caja: string

): Promise<UsuarioSesion | null> {

  const sesion =

    await obtenerSesion();

  if (!sesion) {

    return null;

  }

  const cajaNormalizada =

    caja.trim();

  if (!cajaNormalizada) {

    return null;

  }

  const sesionActualizada = {

    usuario: sesion.usuario,

    nombre: sesion.nombre,

    rol: sesion.rol,

    caja: cajaNormalizada,

    sessionId: sesion.sessionId,

  };

  const actualizada =

    await crearSesion(

      sesionActualizada

    );

  if (!actualizada) {

    return null;

  }

  return {

    ...sesion,

    caja: cajaNormalizada,

  };

}