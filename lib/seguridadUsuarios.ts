import { google } from "googleapis";

const SPREADSHEET_ID = process.env.MODULO_CAJA_SHEET_ID;
const HOJA_SEGURIDAD = "SeguridadUsuarios";

if (!SPREADSHEET_ID) {
  throw new Error("MODULO_CAJA_SHEET_ID no está configurado");
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

export interface SeguridadUsuario {
  usuario: string;
  totpConfigurado: string;
  totpSecretCifrado: string;
  fechaConfiguracion: string;
}

export async function obtenerSeguridadUsuario(
  usuario: string
): Promise<SeguridadUsuario | null> {
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${HOJA_SEGURIDAD}!A:D`,
  });

  const filas = respuesta.data.values || [];

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i];

    if (
      String(fila[0] || "").trim().toLowerCase() ===
      usuario.trim().toLowerCase()
    ) {
      return {
        usuario: String(fila[0] || ""),
        totpConfigurado: String(fila[1] || "NO"),
        totpSecretCifrado: String(fila[2] || ""),
        fechaConfiguracion: String(fila[3] || ""),
      };
    }
  }

  return null;
}

export async function guardarSeguridadUsuario(
  usuario: string,
  totpSecretCifrado: string,
  totpConfigurado: string = "SI"
): Promise<void> {
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${HOJA_SEGURIDAD}!A:D`,
  });

  const filas = respuesta.data.values || [];

  const ahora = new Date().toISOString();

  for (let i = 1; i < filas.length; i++) {
    if (
      String(filas[i][0] || "").trim().toLowerCase() ===
      usuario.trim().toLowerCase()
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${HOJA_SEGURIDAD}!A${i + 1}:D${i + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            usuario,
            totpConfigurado,
            totpSecretCifrado,
            ahora,
          ]],
        },
      });

      return;
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${HOJA_SEGURIDAD}!A:D`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        usuario,
        totpConfigurado,
        totpSecretCifrado,
        ahora,
      ]],
    },
  });
}

export async function desactivarTOTPUsuario(
  usuario: string
): Promise<void> {
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${HOJA_SEGURIDAD}!A:D`,
  });

  const filas = respuesta.data.values || [];

  for (let i = 1; i < filas.length; i++) {
    if (
      String(filas[i][0] || "").trim().toLowerCase() ===
      usuario.trim().toLowerCase()
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${HOJA_SEGURIDAD}!B${i + 1}:D${i + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "NO",
            "",
            "",
          ]],
        },
      });

      return;
    }
  }
}