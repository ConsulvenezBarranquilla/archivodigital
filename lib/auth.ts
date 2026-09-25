import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-registro-session"
    : "registro-session";

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

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
      !payload.exp
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

export async function crearSesion(
  usuario: UsuarioSesion
): Promise<void> {
  const ahora =
    Math.floor(Date.now() / 1000);

  const payload: PayloadSesion = {
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    rol: usuario.rol,
    caja: usuario.caja,

    sessionId:
      usuario.sessionId ??
      crypto.randomUUID(),

    iat: ahora,

    exp:
      ahora +
      SESSION_DURATION_SECONDS,
  };

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

    return {
      usuario: payload.usuario,
      nombre: payload.nombre,
      rol: payload.rol,
      caja: payload.caja,
      sessionId:
        payload.sessionId,
    };
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
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

  await crearSesion({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    rol: sesion.rol,
    caja: cajaNormalizada,
    sessionId: sesion.sessionId,
  });

  return {
    ...sesion,
    caja: cajaNormalizada,
  };
}