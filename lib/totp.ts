import crypto from "crypto";
import { generateSecret, generateURI, verify } from "otplib";

const TOTP_ISSUER = "Consulnet Barranquilla";

function obtenerClaveCifrado(): Buffer {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado");
  }

  return crypto
    .createHash("sha256")
    .update(secret)
    .digest();
}

export function generarSecretoTOTP(): string {
  return generateSecret();
}

export function generarURI_TOTP(
  usuario: string,
  secreto: string
): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: usuario,
    secret: secreto,
  });
}

export async function verificarCodigoTOTP(
  secreto: string,
  codigo: string
): Promise<boolean> {
  if (!secreto || !codigo) {
    return false;
  }

  const resultado = await verify({
    secret: secreto,
    token: codigo.replace(/\s/g, ""),
  });

  return resultado.valid;
}

export function cifrarSecretoTOTP(secreto: string): string {
  const key = obtenerClaveCifrado();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const cifrado = Buffer.concat([
    cipher.update(secreto, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    cifrado.toString("base64"),
  ].join(".");
}

export function descifrarSecretoTOTP(
  valor: string
): string {
  const key = obtenerClaveCifrado();

  const partes = valor.split(".");

  if (partes.length !== 3) {
    throw new Error("Secreto TOTP inválido");
  }

  const iv = Buffer.from(partes[0], "base64");
  const authTag = Buffer.from(partes[1], "base64");
  const cifrado = Buffer.from(partes[2], "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const descifrado = Buffer.concat([
    decipher.update(cifrado),
    decipher.final(),
  ]);

  return descifrado.toString("utf8");
}