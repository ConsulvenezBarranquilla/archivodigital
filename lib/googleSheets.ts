import { google } from "googleapis";

if (process.env.NODE_ENV === "development") {

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

}

const auth =
  new google.auth.JWT({

    email:
      process.env.GOOGLE_CLIENT_EMAIL,

    key:
      process.env.GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),

    scopes: [

      "https://www.googleapis.com/auth/spreadsheets",

      "https://www.googleapis.com/auth/drive",

    ],

  });

export const sheets =
  google.sheets({

    version: "v4",

    auth,

  });

export const REGISTRO_CONSULAR_SHEET_ID =
  process.env.REGISTRO_CONSULAR_SHEET_ID || "";

export const MODULO_CAJA_SHEET_ID =
  process.env.MODULO_CAJA_SHEET_ID || "";

/*------------------------------------------
 NOMBRES DE HOJAS
------------------------------------------*/

export const HOJA_CAJA =
  "Caja";

export const HOJA_DETALLE =
  "DetalleCaja";

export const HOJA_VISITAS =
  "BitacoraVisitas";

export const HOJA_USUARIOS =
  "UsuariosCaja";

export const HOJA_ACTUACIONES =
  "Actuaciones";

export const HOJA_CORRELATIVOS =
  "Correlativos";

export const HOJA_CONFIGURACION =
  "Configuracion";

  /*------------------------------------------
 FUNCIONES GENÉRICAS
------------------------------------------*/

export async function leerHoja(
  hoja: string,
  rango: string
) {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        `${hoja}!${rango}`,

    });

  return response.data.values || [];

}

export async function leerHojaRegistro(
  rango: string
) {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range: rango,

    });

  return response.data.values || [];

}

export async function agregarFila(
  hoja: string,
  datos: any[]
) {

  await sheets.spreadsheets.values.append({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${hoja}!A:Z`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {

      values: [datos],

    },

  });

}

export async function actualizarCelda(
  hoja: string,
  celda: string,
  valor: any
) {

  await sheets.spreadsheets.values.update({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${hoja}!${celda}`,

    valueInputOption:
      "RAW",

    requestBody: {

      values: [[valor]],

    },

  });

}
/*------------------------------------------
 LECTURA DE HOJAS
------------------------------------------*/

export async function obtenerUsuariosCaja() {

  return await leerHoja(
    HOJA_USUARIOS,
    "A:F"
  );

}

export async function obtenerConfiguracion() {

  const rows =
    await leerHoja(
      HOJA_CONFIGURACION,
      "A:B"
    );

  const config:any = {};

  rows.forEach((row)=>{

    if (row[0]) {

      config[row[0]] =
        row[1];

    }

  });

  return config;

}

export async function obtenerActuaciones() {

  return await leerHoja(
    HOJA_ACTUACIONES,
    "A:D"
  );

}

export async function obtenerCorrelativos() {

  return await leerHoja(
    HOJA_CORRELATIVOS,
    "A:B"
  );

}

/*------------------------------------------
 ESCRITURA
------------------------------------------*/

export async function actualizarCorrelativo(
  fila:number,
  valor:number
){

  await actualizarCelda(

    HOJA_CORRELATIVOS,

    `B${fila}`,

    valor

  );

}

export async function guardarMovimientoCaja(
  datos:any[]
){

  await agregarFila(

    HOJA_CAJA,

    datos

  );

}

export async function guardarDetalleCaja(
  datos:any[]
){

  await agregarFila(

    HOJA_DETALLE,

    datos

  );

}

export async function actualizarEstadoRecibo(
  fila:number,
  estado:string
){

  await actualizarCelda(

    HOJA_CAJA,

    `K${fila}`,

    estado

  );

}
/*------------------------------------------
 DOCUMENTOS
------------------------------------------*/

export function obtenerDocumentoPrincipal(
  cedula: string,
  pasaporte: string,
  nacionalidad: string
) {

  if (
    nacionalidad
      ?.trim()
      .toUpperCase() ===
    "VENEZOLANO"
  ) {

    return (
      cedula?.trim() || ""
    );

  }

  if (
    pasaporte?.trim()
  ) {

    return pasaporte.trim();

  }

  return (
    cedula?.trim() || ""
  );

}

export function obtenerDocumentosCaja(
  row: any[]
) {

  const cedula =
    row[11] || row[2] || "";

  const pasaporte =
    row[12] || "";

  const nacionalidad =
    row[13] || "";

  return {

    cedula,

    pasaporte,

    nacionalidad,

    documento:
      obtenerDocumentoPrincipal(
        cedula,
        pasaporte,
        nacionalidad
      ),

  };

}

export function obtenerDocumentosRegistro(
  row: any[]
) {

  const cedula =
    row[1] || "";

  const pasaporte =
    row[14] || "";

  const nacionalidad =
    row[6] || "";

  return {

    cedula,

    pasaporte,

    nacionalidad,

    documento:
      obtenerDocumentoPrincipal(
        cedula,
        pasaporte,
        nacionalidad
      ),

  };

}