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

export const HOJA_GESTION_CONSULAR =
  "GestionConsular";

export const HOJA_REPORTES_ENTREGADOS =
  "ReportesEntregados";

/*------------------------------------------
FUNCIONES GENÉRICAS
------------------------------------------*/

const CACHE_TTL_MS = 10_000;

const cacheHojas = new Map<string, { datos: any[][]; timestamp: number }>();
const lecturasEnCurso = new Map<string, Promise<any[][]>>();

function obtenerClaveCache(spreadsheetId: string, hoja: string, rango: string) {
  return `${spreadsheetId}|${hoja}|${rango}`;
}

function invalidarCacheHoja(spreadsheetId: string, hoja: string) {
  const prefijo = `${spreadsheetId}|${hoja}|`;

  for (const clave of cacheHojas.keys()) {
    if (clave.startsWith(prefijo)) {
      cacheHojas.delete(clave);
    }
  }
}

async function leerHojaConCache(
  spreadsheetId: string,
  hoja: string,
  rango: string
) {
  const clave = obtenerClaveCache(spreadsheetId, hoja, rango);
  const cache = cacheHojas.get(clave);

  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.datos;
  }

  const lecturaExistente = lecturasEnCurso.get(clave);
  if (lecturaExistente) {
    return await lecturaExistente;
  }

  const lectura = (async () => {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${hoja}!${rango}`,
    });

    const datos = response.data.values || [];
    cacheHojas.set(clave, { datos, timestamp: Date.now() });
    return datos;
  })();

  lecturasEnCurso.set(clave, lectura);
  try {
    return await lectura;
  } finally {
    if (lecturasEnCurso.get(clave) === lectura) {
      lecturasEnCurso.delete(clave);
    }
  }
}

export async function leerHoja(
  hoja: string,
  rango: string
) {
  return await leerHojaConCache(MODULO_CAJA_SHEET_ID, hoja, rango);
}

export async function leerHojaRegistro(
  rango: string
) {
  const separador = rango.indexOf('!');
  const hoja = separador >= 0 ? rango.substring(0, separador) : '__RANGO_DIRECTO__';
  const rangoReal = separador >= 0 ? rango.substring(separador + 1) : rango;

  return await leerHojaConCache(REGISTRO_CONSULAR_SHEET_ID, hoja, rangoReal);
}

export async function agregarFila(
  hoja: string,
  datos: any[]
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${hoja}!A:AZ`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [datos],
    },
  });

  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, hoja);
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

  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, hoja);
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

  const config: any = {};

  rows.forEach((row) => {
    if (row[0]) {
      config[row[0]] =
        row[1];
    }
  });

  return config;
}

export async function obtenerCatalogoNacionalidades() {
  const rows = await leerHojaRegistro(
    "Catalogos!A1:A1000"
  );

  return rows
    .map((row) => String(row[0] ?? "").trim())
    .filter(Boolean);
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

export async function obtenerCaja() {
  return await leerHoja(
    HOJA_CAJA,
    "A:ZZ"
  );
}

export async function obtenerGestionConsular() {
  return await leerHoja(
    HOJA_GESTION_CONSULAR,
    "A:ZZ"
  );
}

export async function obtenerReportesEntregados() {
  return await leerHoja(
    HOJA_REPORTES_ENTREGADOS,
    "A:ZZ"
  );
}

/*------------------------------------------
ESCRITURA
------------------------------------------*/

export async function actualizarCorrelativo(
  fila: number,
  valor: number
) {
  await actualizarCelda(
    HOJA_CORRELATIVOS,
    `B${fila}`,
    valor
  );
}

export async function guardarMovimientoCaja(
  datos: any[]
) {
  await agregarFila(
    HOJA_CAJA,
    datos
  );
}

export async function guardarDetalleCaja(
  datos: any[]
) {
  await agregarFila(
    HOJA_DETALLE,
    datos
  );
}

export async function actualizarEstadoRecibo(
  fila: number,
  estado: string
) {
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

/*------------------------------------------
REPORTES ENTREGADOS
------------------------------------------*/

export async function buscarReportePorId(
  id: string
) {
  const filas =
    await obtenerReportesEntregados();

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {
    if (
      (filas[i][0] ?? "") === id
    ) {
      return {
        fila: i + 1,
        datos: filas[i],
      };
    }
  }

  return null;
}

/*------------------------------------------
CONVERTIR REPORTE A FILA
------------------------------------------*/

function convertirReporteAFila(
  documento: any,
  usuario: string,
  esNuevo: boolean
): string[] {

  const ahora =
    new Date().toISOString();

  /*
  ======================================================
  PODERES
  ======================================================

  Los solicitantes y apoderados se almacenan en una
  sola celda cada uno, separados por saltos de línea.

  AI = Tipo de Poder
  AJ = Solicitantes
  AK = Apoderados
  AL = Estado del Poder
  ======================================================
  */

  const solicitantesPoder =
  Array.isArray(
    documento.solicitantesPoder
  )
    ? documento.solicitantesPoder
        .filter(
          (
            solicitante: {
              nombre?: string;
              documento?: string;
            }
          ) =>
            String(
              solicitante?.nombre ?? ""
            ).trim() !== "" ||
            String(
              solicitante?.documento ?? ""
            ).trim() !== ""
        )
    : [];

const nombresSolicitantes =
  solicitantesPoder
    .map(
      (
        solicitante: {
          nombre?: string;
          documento?: string;
        }
      ) =>
        String(
          solicitante?.nombre ?? ""
        ).trim()
    )
    .filter(Boolean)
    .join("\n");

const documentosSolicitantes =
  solicitantesPoder
    .map(
      (
        solicitante: {
          nombre?: string;
          documento?: string;
        }
      ) =>
        String(
          solicitante?.documento ?? ""
        ).trim()
    )
    .filter(Boolean)
    .join("\n");

const apoderadosPoder =
  Array.isArray(
    documento.apoderadosPoder
  )
    ? documento.apoderadosPoder
        .filter(
          (
            apoderado: {
              nombre?: string;
              documento?: string;
            }
          ) =>
            String(
              apoderado?.nombre ?? ""
            ).trim() !== "" ||
            String(
              apoderado?.documento ?? ""
            ).trim() !== ""
        )
    : [];

const nombresApoderados =
  apoderadosPoder
    .map(
      (
        apoderado: {
          nombre?: string;
          documento?: string;
        }
      ) =>
        String(
          apoderado?.nombre ?? ""
        ).trim()
    )
    .filter(Boolean)
    .join("\n");

const documentosApoderados =
  apoderadosPoder
    .map(
      (
        apoderado: {
          nombre?: string;
          documento?: string;
        }
      ) =>
        String(
          apoderado?.documento ?? ""
        ).trim()
    )
    .filter(Boolean)
    .join("\n");

  return [

    // ==================================================
    // A - M
    // ==================================================

    documento.id ?? "",
    documento.categoria ?? "",
    documento.tipoDocumento ?? "",
    documento.recibo ?? "",
    documento.fechaRecibo ?? "",
    documento.planillaGC ?? "",
    // G - Solicitante / Solicitantes
documento.categoria === "PODER"
  ? nombresSolicitantes
  : documento.solicitante ?? "",

// H - Documento / Documentos de solicitantes
documento.categoria === "PODER"
  ? documentosSolicitantes
  : documento.documento ?? "",
    documento.estado ?? "",
    documento.entregado
      ? "SI"
      : "NO",
    documento.fechaEntrega ?? "",
    documento.entregadoPor ?? "",
    documento.observaciones ?? "",

    // ==================================================
    // N - R
    // PASAPORTES
    // ==================================================

    documento.titularPasaporte ?? "",
    documento.numeroPasaporte ?? "",
    documento.fechaValija ?? "",
    documento.fechaEmision ?? "",
    documento.fechaVencimiento ?? "",

    // ==================================================
    // S - V
    // VISAS
    // ==================================================

    documento.numeroVisa ?? "",
    documento.tipoVisa ?? "",
    documento.nacionalidad ?? "",
    documento.fechaVencimiento ?? "",

    // ==================================================
    // W
    // APOSTILLA
    // ==================================================

    documento.estadoApostilla ?? "",

    // ==================================================
    // X
    // ==================================================

    documento.fechaEmisionDocumento ?? "",

    // ==================================================
    // Y
    // ==================================================

    documento.correlativoDocumento ?? "",

    // ==================================================
    // Z
    // ==================================================

    documento.fechaCarta ?? "",

    // ==================================================
    // AA
    // ==================================================

    documento.correlativoCarta ?? "",

    // ==================================================
    // AB
    // ==================================================

    documento.tipoCertificado ?? "",

    // ==================================================
    // AC
    // ==================================================

    documento.fechaRegistro ?? "",

    // ==================================================
    // AD
    // ==================================================

    documento.numeroCertificado ?? "",

    // ==================================================
    // AE
    // ==================================================

    documento.numeroRegistro ?? "",

    // ==================================================
    // AF
    // ==================================================

    documento.fechaRegistroConsular ?? "",

    // ==================================================
    // AG
    // ==================================================

    documento.fechaConstancia ?? "",

    // ==================================================
    // AH
    // ==================================================

    documento.correlativoConstancia ?? "",

    // ==================================================
    // AI - AL
    // PODERES
    // ==================================================

    // AI - Tipo de Poder
    documento.tipoPoder ?? "",

   // AJ - Apoderados
nombresApoderados,

// AK - Documentos de apoderados
documentosApoderados,

    // AL - Estado
    documento.estadoPoder ?? "",

    // ==================================================
    // AM - AT
    // PERMISO DE SALIDA
    // ==================================================

    documento.origen ?? "",
    documento.parentesco ?? "",
    documento.menor ?? "",
    documento.pasaporteMenor ?? "",
    documento.destino ?? "",
    documento.fechaIda ?? "",
    documento.fechaRetorno ?? "",
    documento.acompanante ?? "",

    // ==================================================
    // AU
    // ==================================================

    documento.pasaporteAcompanante ?? "",

    // ==================================================
    // AV
    // ==================================================

    documento.modalidad ?? "",

    // ==================================================
    // AW
    // FECHA CREACIÓN
    // ==================================================

    esNuevo
      ? ahora
      : (
          documento.fechaCreacion ?? ""
        ),

    // ==================================================
    // AX
    // USUARIO CREACIÓN
    // ==================================================

    esNuevo
      ? usuario
      : (
          documento.usuarioCreacion ?? ""
        ),

    // ==================================================
    // AY
    // FECHA ACTUALIZACIÓN
    // ==================================================

    ahora,

    // ==================================================
    // AZ
    // USUARIO ACTUALIZACIÓN
    // ==================================================

    usuario,

  ];
}

/*------------------------------------------
ACTUALIZAR FILA
------------------------------------------*/

export async function actualizarFila(
  hoja: string,
  fila: number,
  datos: any[]
) {
  await sheets.spreadsheets.values.update({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${hoja}!A${fila}:AZ${fila}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [datos],
    },
  });

  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, hoja);
}

/*------------------------------------------
VALIDAR NÚMERO DE ETIQUETA DE VISA
------------------------------------------*/

async function validarNumeroEtiquetaVisa(
  numeroVisa: string,
  idActual: string
) {

  const etiqueta =
    String(numeroVisa ?? "")
      .trim()
      .toUpperCase();

  if (!etiqueta) {
    throw new Error(
      "El N° Etiqueta es obligatorio."
    );
  }

  if (
    !/^[A-Z0-9]+$/.test(
      etiqueta
    )
  ) {
    throw new Error(
      "El N° Etiqueta solamente puede contener letras mayúsculas y números."
    );
  }

  const filas =
    await obtenerReportesEntregados();

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {

    const fila =
      filas[i];

    const categoria =
      String(
        fila[1] ?? ""
      )
        .trim()
        .toUpperCase();

    // Solo revisar VISAS
    if (
      categoria !== "VISA"
    ) {
      continue;
    }

    const etiquetaExistente =
      String(
        fila[18] ?? ""
      )
        .trim()
        .toUpperCase();

    if (
      !etiquetaExistente
    ) {
      continue;
    }

    if (
      etiquetaExistente !==
      etiqueta
    ) {
      continue;
    }

    const idExistente =
      String(
        fila[0] ?? ""
      ).trim();

    // Si es el mismo documento
    // que estamos editando,
    // permitirlo.

    if (
      idExistente ===
      String(idActual).trim()
    ) {
      continue;
    }

    throw new Error(
      `El N° Etiqueta ${etiqueta} ya está registrado.`
    );
  }
}

/*------------------------------------------
GUARDAR REPORTE
------------------------------------------*/

export async function guardarReporte(
  documento: any,
  usuario: string
) {

  // ==========================================
  // Buscar documento existente
  // ==========================================

  const existente =
    await buscarReportePorId(
      documento.id
    );

  // ==========================================
  // VISA
  // ==========================================

  if (
    String(
      documento.categoria ?? ""
    )
      .trim()
      .toUpperCase() ===
    "VISA"
  ) {

    // ----------------------------------------
    // Normalizar estado
    // ----------------------------------------

    const estado =
      String(
        documento.estado ?? ""
      )
        .trim()
        .toUpperCase();

    documento.estado =
      estado;

    // ----------------------------------------
    // VISA RECHAZADA
    // ----------------------------------------

    if (
      estado === "RECHAZADA" ||
      estado === "NEGADA"
    ) {

      documento.numeroVisa =
        "";

    }

    // ----------------------------------------
    // VISA APROBADA / EN PROCESO
    // ----------------------------------------

    else {

      const numeroEtiqueta =
        String(
          documento.numeroVisa ?? ""
        )
          .trim()
          .toUpperCase();

      await validarNumeroEtiquetaVisa(
        numeroEtiqueta,
        documento.id
      );

      documento.numeroVisa =
        numeroEtiqueta;
    }
  }

  // ==========================================
  // APOSTILLA
  // ==========================================

  if (
    String(
      documento.categoria ?? ""
    )
      .trim()
      .toUpperCase() ===
    "APOSTILLA"
  ) {

    const estado =
      String(
        documento.estado ?? ""
      )
        .trim()
        .toUpperCase();

    documento.estado =
      estado;

    documento.estadoApostilla =
      estado;
  }

  // ==========================================
  // Convertir documento a fila
  // ==========================================

  const fila =
    convertirReporteAFila(
      documento,
      usuario,
      !existente
    );

  // ==========================================
  // Guardar / actualizar
  // ==========================================

  if (existente) {

    await actualizarFila(
      HOJA_REPORTES_ENTREGADOS,
      existente.fila,
      fila
    );

  }

  else {

    await agregarFila(
      HOJA_REPORTES_ENTREGADOS,
      fila
    );

  }

  // ==========================================
  // Sincronizar pasaporte de
  // PASAPORTE_ADULTO con Registro Consular
  // ==========================================

  if (
    documento.tipoDocumento ===
    "PASAPORTE_ADULTO"
  ) {

    await actualizarPasaporteAdultoRegistro(
      documento.documento,
      documento.numeroPasaporte
    );

  }
}

/*------------------------------------------
ACTUALIZAR PASAPORTE ADULTO
EN REGISTRO CONSULAR
------------------------------------------*/

export async function actualizarPasaporteAdultoRegistro(
  cedula: string,
  numeroPasaporte: string
) {

  const filas =
    await leerHojaRegistro(
      "B:O"
    );

  const cedulaBuscada =
    String(cedula ?? "")
      .trim()
      .toUpperCase();

  const pasaporte =
    String(numeroPasaporte ?? "")
      .trim();

  if (
    !cedulaBuscada ||
    !pasaporte
  ) {
    return false;
  }

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {

    // Como estamos leyendo B:O,
    // B corresponde al índice 0.

    const cedulaFila =
      String(
        filas[i][0] ?? ""
      )
        .trim()
        .toUpperCase();

    if (
      cedulaFila !==
      cedulaBuscada
    ) {
      continue;
    }

    const filaReal =
      i + 1;

    // O = columna 15

    await sheets.spreadsheets.values.update({
      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range:
        `Respuestas de formulario 1!O${filaReal}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [
          [pasaporte]
        ],
      },
    });

    invalidarCacheHoja(
      REGISTRO_CONSULAR_SHEET_ID,
      "Respuestas de formulario 1"
    );

    return true;
  }

  return false;
}