import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STATE_COOKIE = "drive_oauth_state";
const REDIRECT_URI = "http://localhost:3000/api/drive/oauth/callback";
const REFRESH_TOKEN_KEY = "GOOGLE_DRIVE_REFRESH_TOKEN";

function response(text: string, status: number, clearState = false) {
  const result = new NextResponse(text, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });

  if (clearState) {
    result.cookies.set(STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/api/drive/oauth/callback",
      maxAge: 0,
    });
  }

  return result;
}

async function saveRefreshToken(refreshToken: string) {
  const envPath = path.join(process.cwd(), ".env.local");
  const original = await readFile(envPath, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  const updated: string[] = [];
  let replaced = false;

  for (const line of lines) {
    if (/^\s*GOOGLE_DRIVE_REFRESH_TOKEN\s*=/.test(line)) {
      if (!replaced) {
        updated.push(`${REFRESH_TOKEN_KEY}=${refreshToken}`);
        replaced = true;
      }
      continue;
    }

    updated.push(line);
  }

  if (!replaced) {
    if (updated.at(-1) === "") updated.pop();
    updated.push(`${REFRESH_TOKEN_KEY}=${refreshToken}`);
    updated.push("");
  }

  await writeFile(envPath, updated.join(newline), { encoding: "utf8" });
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return response("Este callback OAuth solo está disponible en desarrollo local.", 403);
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return response("La solicitud OAuth no es válida o expiró. Inicia el proceso nuevamente.", 400, true);
  }

  const authorizationError = searchParams.get("error");
  if (authorizationError) {
    return response("La autorización de Google Drive fue cancelada o rechazada.", 400, true);
  }

  const code = searchParams.get("code");
  if (!code) {
    return response("Google no devolvió un código de autorización. Inicia el proceso nuevamente.", 400, true);
  }

  let failurePhase = "read_oauth_config";

  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return response("Faltan las credenciales OAuth de Google Drive en el entorno local.", 500, true);
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
    failurePhase = "exchange_authorization_code";
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return response("Google no entregó un refresh token. Revoca el acceso anterior e inicia OAuth nuevamente.", 500, true);
    }

    failurePhase = "write_env_local";
    await saveRefreshToken(tokens.refresh_token);

    return response(
      "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><title>Drive autorizado</title></head><body><main><h1>Autorización completada</h1><p>El refresh token se guardó directamente en el entorno local. No se muestra en esta página.</p><p>Reinicia el servidor de desarrollo para que cargue el valor nuevo y prueba una previsualización.</p></main></body></html>",
      200,
      true
    );
  } catch (error) {
    const details = error as { name?: unknown; code?: unknown; status?: unknown; response?: { status?: unknown } };
    console.error("OAUTH DRIVE CALLBACK FAILED", {
      phase: failurePhase,
      name: String(details?.name ?? "Error"),
      code: typeof details?.code === "string" ? details.code : undefined,
      status: details?.status ?? details?.response?.status,
    });
    return response("No se pudo completar OAuth o guardar la configuración local. Revisa el servidor sin compartir tokens.", 500, true);
  }
}
