import { google } from "googleapis";
console.log(
  "PROJECT:",
  process.env.GOOGLE_PROJECT_ID
);

console.log(
  "EMAIL:",
  process.env.GOOGLE_CLIENT_EMAIL
);

console.log(
  "KEY EXISTS:",
  !!process.env.GOOGLE_PRIVATE_KEY
);

console.log(
  "KEY LENGTH:",
  process.env.GOOGLE_PRIVATE_KEY?.length
);

console.log(
  "KEY START:",
  process.env.GOOGLE_PRIVATE_KEY?.substring(
    0,
    40
  )
);

console.log(
  "KEY END:",
  process.env.GOOGLE_PRIVATE_KEY?.slice(
    -40
  )
);
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
  ],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});

export const REGISTRO_CONSULAR_SHEET_ID =
  process.env.REGISTRO_CONSULAR_SHEET_ID || "";

export const MODULO_CAJA_SHEET_ID =
  process.env.MODULO_CAJA_SHEET_ID || "";

export async function obtenerUsuariosCaja() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "UsuariosCaja!A:F",
  });

  return response.data.values || [];
}
export async function obtenerConfiguracion() {

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,
      range:
        "Configuracion!A:B",
    });

  const rows =
    response.data.values || [];

  const config: any = {};

  rows.forEach(
    (row) => {

      if (
        row[0]
      ) {

        config[
          row[0]
        ] = row[1];

      }

    }
  );

  return config;

}
export async function obtenerActuaciones() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "Actuaciones!A:D",
  });

  return response.data.values || [];
}

export async function obtenerCorrelativos() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "Correlativos!A:B",
  });

  return response.data.values || [];
}

export async function actualizarCorrelativo(
  fila: number,
  valor: number
) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `Correlativos!B${fila}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[valor]],
    },
  });
}

export async function guardarMovimientoCaja(
  datos: any[]
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "Caja!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [datos],
            },
  });
}
export async function guardarDetalleCaja(
  datos: any[]
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "DetalleCaja!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [datos],
    },
  });
}
export async function actualizarEstadoRecibo(
  fila: number,
  estado: string
) {

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `Caja!K${fila}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[estado]],
    },
  });

}