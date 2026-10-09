import { google } from "googleapis";

/*------------------------------------------
CONFIGURACIÓN
------------------------------------------*/

const MODULO_CAJA_SHEET_ID =
  process.env.MODULO_CAJA_SHEET_ID || "";

const HOJA_SELLOS_INSTITUCIONALES =
  "SellosInstitucionales";

/*------------------------------------------
AUTENTICACIÓN GOOGLE SHEETS
------------------------------------------*/

const GOOGLE_PROJECT_ID =
  process.env.GOOGLE_PROJECT_ID || "";

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL || "";

const GOOGLE_PRIVATE_KEY =
  (
    process.env.GOOGLE_PRIVATE_KEY || ""
  ).replace(/\\n/g, "\n");

const auth =
  new google.auth.GoogleAuth({
    credentials: {
      project_id:
        GOOGLE_PROJECT_ID,
      client_email:
        GOOGLE_CLIENT_EMAIL,
      private_key:
        GOOGLE_PRIVATE_KEY,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

const sheets =
  google.sheets({
    version: "v4",
    auth,
  });

/*------------------------------------------
INTERFAZ
------------------------------------------*/

export interface SelloInstitucional {
  idSello: string;
  nombreSello: string;
  archivoSello: string;
  archivoSelloDriveId: string;
  activo: string;
  fechaCreacion: string;
}

/*------------------------------------------
OBTENER TODOS LOS SELLOS
------------------------------------------*/

export async function obtenerSellos() {

  if (!MODULO_CAJA_SHEET_ID) {
    throw new Error(
      "Falta configurar MODULO_CAJA_SHEET_ID."
    );
  }

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `'${HOJA_SELLOS_INSTITUCIONALES}'!A:F`,
    });

  const filas =
    response.data.values || [];

  if (filas.length <= 1) {
    return [];
  }

  return filas
    .slice(1)
    .filter(
      (fila) =>
        fila[0]
    )
    .map(
      (fila): SelloInstitucional => ({
        idSello:
          fila[0] || "",

        nombreSello:
          fila[1] || "",

        archivoSello:
          fila[2] || "",

        archivoSelloDriveId:
          fila[3] || "",

        activo:
          fila[4] || "SI",

        fechaCreacion:
          fila[5] || "",
      })
    );
}

/*------------------------------------------
OBTENER SELLO POR ID
------------------------------------------*/

export async function obtenerSelloPorId(
  idSello: string
) {

  const sellos =
    await obtenerSellos();

  return (
    sellos.find(
      (sello) =>
        sello.idSello === idSello
    ) || null
  );
}

/*------------------------------------------
CREAR SELLO
------------------------------------------*/

export async function crearSello(
  sello: SelloInstitucional
) {

  if (!MODULO_CAJA_SHEET_ID) {
    throw new Error(
      "Falta configurar MODULO_CAJA_SHEET_ID."
    );
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `'${HOJA_SELLOS_INSTITUCIONALES}'!A:F`,

    valueInputOption:
      "USER_ENTERED",

    insertDataOption:
      "INSERT_ROWS",

    requestBody: {
      values: [
        [
          sello.idSello,
          sello.nombreSello,
          sello.archivoSello,
          sello.archivoSelloDriveId,
          sello.activo,
          sello.fechaCreacion,
        ],
      ],
    },
  });

  return sello;
}

/*------------------------------------------
ACTUALIZAR SELLO
------------------------------------------*/

export async function actualizarSello(
  idSello: string,
  cambios: Partial<SelloInstitucional>
) {

  if (!MODULO_CAJA_SHEET_ID) {
    throw new Error(
      "Falta configurar MODULO_CAJA_SHEET_ID."
    );
  }

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `'${HOJA_SELLOS_INSTITUCIONALES}'!A:F`,
    });

  const filas =
    response.data.values || [];

  const indice =
    filas.findIndex(
      (fila, index) =>
        index > 0 &&
        fila[0] === idSello
    );

  if (indice === -1) {
    throw new Error(
      "No se encontró el sello."
    );
  }

  const filaActual =
    filas[indice] || [];

  const fila = [
    cambios.idSello ??
      filaActual[0] ??
      "",

    cambios.nombreSello ??
      filaActual[1] ??
      "",

    cambios.archivoSello ??
      filaActual[2] ??
      "",

    cambios.archivoSelloDriveId ??
      filaActual[3] ??
      "",

    cambios.activo ??
      filaActual[4] ??
      "SI",

    cambios.fechaCreacion ??
      filaActual[5] ??
      "",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `'${HOJA_SELLOS_INSTITUCIONALES}'!A${indice + 1}:F${indice + 1}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [
        fila,
      ],
    },
  });

  return {
    idSello:
      fila[0],

    nombreSello:
      fila[1],

    archivoSello:
      fila[2],

    archivoSelloDriveId:
      fila[3],

    activo:
      fila[4],

    fechaCreacion:
      fila[5],
  } as SelloInstitucional;
}

/*------------------------------------------
ELIMINAR SELLO DEL REGISTRO
------------------------------------------*/

export async function eliminarSello(
  idSello: string
) {

  if (!MODULO_CAJA_SHEET_ID) {
    throw new Error(
      "Falta configurar MODULO_CAJA_SHEET_ID."
    );
  }

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `'${HOJA_SELLOS_INSTITUCIONALES}'!A:F`,
    });

  const filas =
    response.data.values || [];

  const indice =
    filas.findIndex(
      (fila, index) =>
        index > 0 &&
        fila[0] === idSello
    );

  if (indice === -1) {
    throw new Error(
      "No se encontró el sello."
    );
  }

  const spreadsheet =
    await sheets.spreadsheets.get({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      fields:
        "sheets.properties",
    });

  const hoja =
    spreadsheet.data.sheets?.find(
      (sheet) =>
        sheet.properties?.title ===
        HOJA_SELLOS_INSTITUCIONALES
    );

  const sheetId =
    hoja?.properties?.sheetId;

  if (
    sheetId === undefined
  ) {
    throw new Error(
      `No se encontró la hoja "${HOJA_SELLOS_INSTITUCIONALES}".`
    );
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex:
                indice - 0,
              endIndex:
                indice + 1,
            },
          },
        },
      ],
    },
  });

  return true;
}