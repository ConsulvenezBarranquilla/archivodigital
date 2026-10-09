import { google } from "googleapis";

/*------------------------------------------
CONFIGURACIÓN
------------------------------------------*/

const MODULO_CAJA_SHEET_ID =
  process.env.MODULO_CAJA_SHEET_ID || "";

const HOJA_FIRMAS_USUARIOS =
  "FirmasUsuarios";

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

export interface FirmaUsuario {
  idFirma: string;
  usuario: string;
  nombreFirma: string;
  archivoFirma: string;
  archivoFirmaDriveId: string;
  activo: string;
  fechaCreacion: string;
}

/*------------------------------------------
OBTENER TODAS LAS FIRMAS
------------------------------------------*/

export async function obtenerFirmas() {
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
        `${HOJA_FIRMAS_USUARIOS}!A:G`,
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
      (fila): FirmaUsuario => ({
        idFirma:
          fila[0] || "",

        usuario:
          fila[1] || "",

        nombreFirma:
          fila[2] || "",

        archivoFirma:
          fila[3] || "",

        archivoFirmaDriveId:
          fila[4] || "",

        activo:
          fila[5] || "SI",

        fechaCreacion:
          fila[6] || "",
      })
    );
}

/*------------------------------------------
OBTENER FIRMAS DE UN USUARIO
------------------------------------------*/

export async function obtenerFirmasUsuario(
  usuario: string
) {
  const firmas =
    await obtenerFirmas();

  return firmas.filter(
    (firma) =>
      firma.usuario
        .trim()
        .toLowerCase() ===
      usuario
        .trim()
        .toLowerCase()
  );
}

/*------------------------------------------
OBTENER UNA FIRMA POR ID
------------------------------------------*/

export async function obtenerFirmaPorId(
  idFirma: string
) {
  const firmas =
    await obtenerFirmas();

  return (
    firmas.find(
      (firma) =>
        firma.idFirma === idFirma
    ) || null
  );
}

/*------------------------------------------
CREAR FIRMA
------------------------------------------*/

export async function crearFirma(
  firma: FirmaUsuario
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
      `${HOJA_FIRMAS_USUARIOS}!A:G`,

    valueInputOption:
      "USER_ENTERED",

    insertDataOption:
      "INSERT_ROWS",

    requestBody: {
      values: [
        [
          firma.idFirma,
          firma.usuario,
          firma.nombreFirma,
          firma.archivoFirma,
          firma.archivoFirmaDriveId,
          firma.activo,
          firma.fechaCreacion,
        ],
      ],
    },
  });

  return firma;
}

/*------------------------------------------
ACTUALIZAR FIRMA
------------------------------------------*/

export async function actualizarFirma(
  idFirma: string,
  cambios: Partial<FirmaUsuario>
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
        `${HOJA_FIRMAS_USUARIOS}!A:G`,
    });

  const filas =
    response.data.values || [];

  const indice =
    filas.findIndex(
      (fila, index) =>
        index > 0 &&
        fila[0] === idFirma
    );

  if (indice === -1) {
    throw new Error(
      "No se encontró la firma."
    );
  }

  const filaActual =
    filas[indice] || [];

  const fila = [
    cambios.idFirma ??
      filaActual[0] ??
      "",

    cambios.usuario ??
      filaActual[1] ??
      "",

    cambios.nombreFirma ??
      filaActual[2] ??
      "",

    cambios.archivoFirma ??
      filaActual[3] ??
      "",

    cambios.archivoFirmaDriveId ??
      filaActual[4] ??
      "",

    cambios.activo ??
      filaActual[5] ??
      "SI",

    cambios.fechaCreacion ??
      filaActual[6] ??
      "",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${HOJA_FIRMAS_USUARIOS}!A${indice + 1}:G${indice + 1}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [
        fila,
      ],
    },
  });

  return {
    ...filaActual,
    idFirma:
      fila[0],
    usuario:
      fila[1],
    nombreFirma:
      fila[2],
    archivoFirma:
      fila[3],
    archivoFirmaDriveId:
      fila[4],
    activo:
      fila[5],
    fechaCreacion:
      fila[6],
  } as FirmaUsuario;
}

/*------------------------------------------
ELIMINAR FIRMA DEL REGISTRO
------------------------------------------*/

export async function eliminarFirma(
  idFirma: string
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
        `${HOJA_FIRMAS_USUARIOS}!A:G`,
    });

  const filas =
    response.data.values || [];

  const indice =
    filas.findIndex(
      (fila, index) =>
        index > 0 &&
        fila[0] === idFirma
    );

  if (indice === -1) {
    throw new Error(
      "No se encontró la firma."
    );
  }

  const filaSheets =
    indice + 1;

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
        HOJA_FIRMAS_USUARIOS
    );

  const sheetId =
    hoja?.properties?.sheetId;

  if (
    sheetId === undefined
  ) {
    throw new Error(
      `No se encontró la hoja "${HOJA_FIRMAS_USUARIOS}".`
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
              dimension:
                "ROWS",
              startIndex:
                filaSheets - 1,
              endIndex:
                filaSheets,
            },
          },
        },
      ],
    },
  });

  return true;
}