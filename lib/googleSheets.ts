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

export const drive =
  google.drive({
    version: "v3",
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

export const HOJA_CASOS_CONSULARES = "CasosConsulares";
export const HOJA_PERFIL_CONSULAR = "PerfilConsular";
export const HOJA_TURNOS_ATENCION = "TurnosAtencion";
const ENCABEZADOS_CASOS_CONSULARES = [
  "ID",
  "Correlativo",
  "Categoría",
  "Nombre",
  "Tipo",
  "Fecha",
  "Creado por",
  "Creado el",
  "Actualizado por",
  "Actualizado el",
  "Datos JSON",
  "Estado",
  "Recibo Caja",
  "Código actuación",
];

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

export function invalidarCacheHojaGoogle(spreadsheetId: string, hoja: string) {
  invalidarCacheHoja(spreadsheetId, hoja);
}

export async function actualizarRangosAtomico(
  spreadsheetId: string,
  cambios: Array<{
    hoja: string;
    fila?: number;
    columna?: number;
    valores?: Array<Array<string | number>>;
    anexar?: Array<string | number>;
  }>
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const ids = new Map(
    (metadata.data.sheets ?? []).map((hoja) => [String(hoja.properties?.title ?? ""), hoja.properties?.sheetId])
  );

  const requests = cambios.map(({ hoja, fila, columna, valores, anexar }) => {
    const sheetId = ids.get(hoja);
    if (anexar) {
      if (sheetId === undefined) throw new Error(`No existe la pestaña ${hoja} en la hoja de cálculo.`);
      return {
        appendCells: {
          sheetId,
          rows: [{
            values: anexar.map((valor) => ({
              userEnteredValue: typeof valor === "number"
                ? { numberValue: valor }
                : { stringValue: valor },
            })),
          }],
          fields: "userEnteredValue",
        },
      };
    }
    if (fila === undefined || columna === undefined || !valores) {
      throw new Error("La coordenada de actualización de Google Sheets no es válida.");
    }
    if (sheetId === undefined) throw new Error(`No existe la pestaña ${hoja} en la hoja de cálculo.`);
    if (!Number.isInteger(fila) || fila < 1 || !Number.isInteger(columna) || columna < 1) {
      throw new Error("La coordenada de actualización de Google Sheets no es válida.");
    }
    return {
      updateCells: {
        start: { sheetId, rowIndex: fila - 1, columnIndex: columna - 1 },
        rows: valores.map((linea) => ({
          values: linea.map((valor) => ({
            userEnteredValue: typeof valor === "number"
              ? { numberValue: valor }
              : { stringValue: valor },
          })),
        })),
        fields: "userEnteredValue",
      },
    };
  });

  return await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
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

const ENCABEZADOS_PERFIL_CONSULAR = [
  "Periodo",
  "Atlantico",
  "Magdalena",
  "San Andres y Providencia",
  "Total",
  "Actualizado por",
  "Actualizado el",
];

export async function leerDatosJurisdiccionPerfil() {
  if (!REGISTRO_CONSULAR_SHEET_ID) throw new Error("Falta configurar REGISTRO_CONSULAR_SHEET_ID.");
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    fields: "sheets.properties(title)",
  });
  const existe = (metadata.data.sheets ?? []).some((item) => item.properties?.title === HOJA_PERFIL_CONSULAR);
  if (!existe) return { existe: false, filas: [] as unknown[][] };
  const filas = await leerHojaRegistro(`${HOJA_PERFIL_CONSULAR}!A:G`);
  return { existe: true, filas };
}

export async function guardarDatosJurisdiccionPerfil(fila: Array<string | number>) {
  if (!REGISTRO_CONSULAR_SHEET_ID) throw new Error("Falta configurar REGISTRO_CONSULAR_SHEET_ID.");
  if (fila.length !== ENCABEZADOS_PERFIL_CONSULAR.length) throw new Error("La fila de estadísticas de jurisdicción no tiene el formato esperado.");

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    fields: "sheets.properties(title)",
  });
  const existe = (metadata.data.sheets ?? []).some((item) => item.properties?.title === HOJA_PERFIL_CONSULAR);
  if (!existe) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: HOJA_PERFIL_CONSULAR } } }] },
      });
    } catch {
      const confirmar = await sheets.spreadsheets.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        fields: "sheets.properties(title)",
      });
      if (!(confirmar.data.sheets ?? []).some((item) => item.properties?.title === HOJA_PERFIL_CONSULAR)) {
        throw new Error("No fue posible crear la pestaña PerfilConsular.");
      }
    }
  }

  const encabezado = await sheets.spreadsheets.values.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_PERFIL_CONSULAR}!A1:G1`,
  });
  const actual = encabezado.data.values?.[0] ?? [];
  if (!actual.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `${HOJA_PERFIL_CONSULAR}!A1:G1`,
      valueInputOption: "RAW",
      requestBody: { values: [ENCABEZADOS_PERFIL_CONSULAR] },
    });
  } else if (ENCABEZADOS_PERFIL_CONSULAR.some((valor, indice) => actual[indice] !== valor)) {
    throw new Error("La pestaña PerfilConsular tiene encabezados distintos a los esperados; no se guardaron cambios.");
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_PERFIL_CONSULAR}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [fila] },
  });
  invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_PERFIL_CONSULAR);
}

async function asegurarHojaCasosConsulares() {
  if (!REGISTRO_CONSULAR_SHEET_ID) {
    throw new Error("Falta configurar REGISTRO_CONSULAR_SHEET_ID.");
  }

  const obtenerHoja = async () => {
    const respuesta = await sheets.spreadsheets.get({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      fields: "sheets.properties(sheetId,title)",
    });
    return respuesta.data.sheets?.find(
      (hoja) => hoja.properties?.title === HOJA_CASOS_CONSULARES
    );
  };

  let hoja = await obtenerHoja();
  if (!hoja) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: HOJA_CASOS_CONSULARES } } }],
        },
      });
    } catch {
      // Otra instancia puede crear la pestaña a la vez; confirmar antes de fallar.
      hoja = await obtenerHoja();
      if (!hoja) throw new Error("No fue posible preparar la pestaña CasosConsulares.");
    }
    hoja = hoja ?? await obtenerHoja();
  }

  const encabezados = await sheets.spreadsheets.values.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_CASOS_CONSULARES}!A1:N1`,
  });
  const filaEncabezados = encabezados.data.values?.[0] || [];
  if (!filaEncabezados.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `${HOJA_CASOS_CONSULARES}!A1:N1`,
      valueInputOption: "RAW",
      requestBody: { values: [ENCABEZADOS_CASOS_CONSULARES] },
    });
    invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
  } else if (filaEncabezados[0] !== "ID" || filaEncabezados[1] !== "Correlativo") {
    throw new Error("La pestaña CasosConsulares existe con encabezados distintos a los esperados.");
  }
  if (filaEncabezados.length && !filaEncabezados[11]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `${HOJA_CASOS_CONSULARES}!L1`,
      valueInputOption: "RAW",
      requestBody: { values: [["Estado"]] },
    });
    invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
  } else if (filaEncabezados[11] && filaEncabezados[11] !== "Estado") {
    throw new Error("La columna L de CasosConsulares ya tiene otro encabezado.");
  }
  for (const [indice, encabezado] of [[12, "Recibo Caja"], [13, "Código actuación"]] as const) {
    const columna = String.fromCharCode(65 + indice);
    if (!filaEncabezados[indice]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: `${HOJA_CASOS_CONSULARES}!${columna}1`,
        valueInputOption: "RAW",
        requestBody: { values: [[encabezado]] },
      });
      invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
    } else if (filaEncabezados[indice] !== encabezado) {
      throw new Error(`La columna ${columna} de CasosConsulares ya tiene otro encabezado.`);
    }
  }
}

export async function obtenerFilasCasosConsulares(omitirCache = false) {
  await asegurarHojaCasosConsulares();
  if (omitirCache) {
    const respuesta = await sheets.spreadsheets.values.get({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `${HOJA_CASOS_CONSULARES}!A:N`,
    });
    return respuesta.data.values || [];
  }
  return await leerHojaConCache(
    REGISTRO_CONSULAR_SHEET_ID,
    HOJA_CASOS_CONSULARES,
    "A:N"
  );
}

export async function leerFilasCasosConsularesSoloLectura() {
  if (!REGISTRO_CONSULAR_SHEET_ID) throw new Error("Falta configurar REGISTRO_CONSULAR_SHEET_ID.");
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_CASOS_CONSULARES}!A:N`,
  });
  return respuesta.data.values || [];
}

export async function agregarCasoConsular(fila: unknown[]) {
  await asegurarHojaCasosConsulares();
  await sheets.spreadsheets.values.append({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_CASOS_CONSULARES}!A:N`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [fila] },
  });
  invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
}

export async function agregarCasosConsularesEnLote(filas: unknown[][]) {
  if (!filas.length) return;
  await asegurarHojaCasosConsulares();
  await sheets.spreadsheets.values.append({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_CASOS_CONSULARES}!A:N`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: filas },
  });
  invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
}

export async function actualizarCasoConsular(filaNumero: number, fila: unknown[]) {
  await asegurarHojaCasosConsulares();
  await sheets.spreadsheets.values.update({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `${HOJA_CASOS_CONSULARES}!A${filaNumero}:N${filaNumero}`,
    valueInputOption: "RAW",
    requestBody: { values: [fila] },
  });
  invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
}

export async function actualizarCasosConsularesEnLote(cambios: Array<{ filaNumero: number; fila: unknown[] }>) {
  if (!cambios.length) return;
  await asegurarHojaCasosConsulares();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: cambios.map(({ filaNumero, fila }) => ({
        range: `${HOJA_CASOS_CONSULARES}!A${filaNumero}:N${filaNumero}`,
        values: [fila],
      })),
    },
  });
  invalidarCacheHoja(REGISTRO_CONSULAR_SHEET_ID, HOJA_CASOS_CONSULARES);
}

const ENCABEZADOS_TURNOS_ATENCION = [
  "Evento ID", "Turno ID", "Evento", "Creado el", "Nombre", "Documento",
  "Tipo de visita", "Cola", "Estado", "Etapa", "Actuación", "Recibo",
  "Visita ID", "Detalle ID", "Usuario", "Fecha de actualización", "Caja",
];

async function asegurarHojaTurnosAtencion() {
  if (!MODULO_CAJA_SHEET_ID) throw new Error("Falta configurar MODULO_CAJA_SHEET_ID.");
  const obtenerHoja = async () => {
    const respuesta = await sheets.spreadsheets.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      fields: "sheets.properties(sheetId,title)",
    });
    return respuesta.data.sheets?.find((hoja) => hoja.properties?.title === HOJA_TURNOS_ATENCION);
  };
  let hoja = await obtenerHoja();
  if (!hoja) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: HOJA_TURNOS_ATENCION } } }] },
      });
    } catch {
      hoja = await obtenerHoja();
      if (!hoja) throw new Error("No fue posible crear la pestaña TurnosAtencion en el libro Modulo_de_caja.");
    }
  }
  const encabezados = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `${HOJA_TURNOS_ATENCION}!A1:Q1`,
  });
  const existentes = encabezados.data.values?.[0] || [];
  if (!existentes.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: `${HOJA_TURNOS_ATENCION}!A1:Q1`,
      valueInputOption: "RAW",
      requestBody: { values: [ENCABEZADOS_TURNOS_ATENCION] },
    });
    invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_TURNOS_ATENCION);
  } else if (ENCABEZADOS_TURNOS_ATENCION.some((encabezado, indice) => existentes[indice] !== encabezado)) {
    throw new Error("La pestaña TurnosAtencion existe con encabezados no compatibles.");
  }
}

export async function guardarEventoTurnoEnSheet(evento: Record<string, unknown>) {
  await asegurarHojaTurnosAtencion();
  await sheets.spreadsheets.values.append({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `${HOJA_TURNOS_ATENCION}!A:Q`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[
      evento.eventId, evento.id, evento.evento, evento.creadoEl, evento.nombre,
      evento.documento, evento.tipoVisita, evento.cola, evento.estado, evento.etapa,
      evento.actuacion, evento.correlativo, evento.visitaId, evento.detalleId,
      evento.usuario, evento.fechaActualizacion, evento.caja,
    ]] },
  });
  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_TURNOS_ATENCION);
}

export async function agregarFila(
  hoja: string,
  datos: any[]
) {
  await sheets.spreadsheets.values.append({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `${hoja}!A:BC`,

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
    "A:E"
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

export async function obtenerRegistroConsular() {
  return await leerHojaRegistro(
    "Respuestas de formulario 1!A:S"
  );
}

export async function asegurarColumnasReportesEntregados(
  cantidadRequerida: number
) {
  const resultado = await sheets.spreadsheets.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    fields: "sheets.properties(sheetId,title,gridProperties.columnCount)",
  });

  const hoja = resultado.data.sheets?.find(
    (item) => item.properties?.title === HOJA_REPORTES_ENTREGADOS
  );
  const sheetId = hoja?.properties?.sheetId;
  const columnasActuales = hoja?.properties?.gridProperties?.columnCount ?? 0;

  if (typeof sheetId !== "number") {
    throw new Error("No se encontro la hoja ReportesEntregados en Google Sheets.");
  }

  if (columnasActuales < cantidadRequerida) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      requestBody: {
        requests: [{
          appendDimension: {
            sheetId,
            dimension: "COLUMNS",
            length: cantidadRequerida - columnasActuales,
          },
        }],
      },
    });
  }
}

export async function sincronizarCorreoReportesEntregados(
  documentos: unknown[],
  correo: string
): Promise<number> {
  const clavesDocumento = new Set(
    documentos
      .map((documento) => String(documento ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""))
      .filter(Boolean)
  );
  if (clavesDocumento.size === 0) return 0;

  await asegurarColumnasReportesEntregados(64);
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `${HOJA_REPORTES_ENTREGADOS}!A:BL`,
  });
  const filas = respuesta.data.values ?? [];
  const encabezadoCorreo = String(filas[0]?.[63] ?? "").trim();
  const actualizaciones = filas.slice(1).flatMap((fila, indice) => {
    const documento = String(fila[7] ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!documento || !clavesDocumento.has(documento)) return [];
    if (String(fila[63] ?? "").trim() === correo.trim()) return [];
    return [{
      range: `${HOJA_REPORTES_ENTREGADOS}!BL${indice + 2}`,
      values: [[correo.trim()]],
    }];
  });

  if (!encabezadoCorreo) {
    actualizaciones.unshift({
      range: `${HOJA_REPORTES_ENTREGADOS}!BL1`,
      values: [["CORREO SOLICITANTE CONSTANCIA CONSULAR"]],
    });
  }
  if (actualizaciones.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      requestBody: { valueInputOption: "RAW", data: actualizaciones },
    });
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
  }
  return actualizaciones.length - (!encabezadoCorreo && actualizaciones.length > 0 ? 1 : 0);
}

export async function actualizarDatosFirmaConstancia(
  id: string,
  datos: {
    estadoProcesamiento: string;
    entregado: boolean;
    fechaEntrega?: string;
    entregadoPor?: string;
    observaciones?: string;
    pdfConstanciaFirmada?: string;
    metodoEntrega?: string;
    fechaEnvioCorreo?: string;
    correoDestino?: string;
    usuarioFirma?: string;
    idCorreoEnviado?: string;
    tokenValidacion?: string;
  }
) {
  const reporte = await buscarReportePorId(id);

  if (!reporte) {
    throw new Error("No se encontró la constancia en Reportes Entregados.");
  }

  // BK stores the source PDF for variable-format consular certificates.
  await asegurarColumnasReportesEntregados(63);

  const encabezadosExistentes = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "ReportesEntregados!BD1:BJ1",
  });
  const encabezados = encabezadosExistentes.data.values?.[0] ?? [];
  if (!encabezados.some((valor) => String(valor ?? "").trim())) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!BD1:BJ1",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          "PDF FIRMADO DRIVE ID",
          "MÉTODO DE ENTREGA",
          "FECHA ENVÍO CORREO",
          "CORREO DESTINO",
          "USUARIO FIRMA",
          "ID CORREO",
          "TOKEN VALIDACIÓN",
        ]],
      },
    });
  }

  const encabezadoPdfConsular = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "ReportesEntregados!BK1",
  });
  if (!String(encabezadoPdfConsular.data.values?.[0]?.[0] ?? "").trim()) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!BK1",
      valueInputOption: "RAW",
      requestBody: { values: [["PDF CONSTANCIA CONSULAR DRIVE ID"]] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `ReportesEntregados!J${reporte.fila}:M${reporte.fila}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        datos.entregado ? "SI" : "NO",
        datos.fechaEntrega ?? "",
        datos.entregadoPor ?? "",
        datos.observaciones ?? "",
      ]],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `ReportesEntregados!BA${reporte.fila}:BJ${reporte.fila}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        datos.estadoProcesamiento,
        reporte.datos[53] ?? "",
        reporte.datos[54] ?? "",
        datos.pdfConstanciaFirmada ?? reporte.datos[55] ?? "",
        datos.metodoEntrega ?? reporte.datos[56] ?? "",
        datos.fechaEnvioCorreo ?? reporte.datos[57] ?? "",
        datos.correoDestino ?? reporte.datos[58] ?? "",
        datos.usuarioFirma ?? reporte.datos[59] ?? "",
        datos.idCorreoEnviado ?? reporte.datos[60] ?? "",
        datos.tokenValidacion ?? reporte.datos[61] ?? "",
      ]],
    },
  });

  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
}

export async function actualizarPdfConstanciaConsular(id: string, driveId: string) {
  const reporte = await buscarReportePorId(id);
  if (!reporte) throw new Error("No se encontró la constancia consular en Reportes Entregados.");

  await asegurarColumnasReportesEntregados(63);
  const encabezado = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "ReportesEntregados!BK1",
  });
  if (!String(encabezado.data.values?.[0]?.[0] ?? "").trim()) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!BK1",
      valueInputOption: "RAW",
      requestBody: { values: [["PDF CONSTANCIA CONSULAR DRIVE ID"]] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `ReportesEntregados!BK${reporte.fila}`,
    valueInputOption: "RAW",
    requestBody: { values: [[driveId]] },
  });
  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
}

export async function actualizarCorreoConstanciaConsular(id: string, correo: string) {
  const reporte = await buscarReportePorId(id);
  if (!reporte) throw new Error("No se encontrÃ³ la constancia consular en Reportes Entregados.");

  await asegurarColumnasReportesEntregados(64);
  const encabezado = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "ReportesEntregados!BL1",
  });
  if (!String(encabezado.data.values?.[0]?.[0] ?? "").trim()) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!BL1",
      valueInputOption: "RAW",
      requestBody: { values: [["CORREO SOLICITANTE CONSTANCIA CONSULAR"]] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `ReportesEntregados!BL${reporte.fila}`,
    valueInputOption: "RAW",
    requestBody: { values: [[correo.trim()]] },
  });
  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
}

export async function actualizarPdfFichaIdentidadSaime(id: string, driveId: string) {
  const reporte = await buscarReportePorId(id);
  if (!reporte) throw new Error("No se encontro el reporte de Verificacion de Identidad.");

  await asegurarColumnasReportesEntregados(65);
  const encabezado = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "ReportesEntregados!BM1",
  });
  if (!String(encabezado.data.values?.[0]?.[0] ?? "").trim()) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "ReportesEntregados!BM1",
      valueInputOption: "RAW",
      requestBody: { values: [["PDF FICHA IDENTIDAD SAIME DRIVE ID"]] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: `ReportesEntregados!BM${reporte.fila}`,
    valueInputOption: "RAW",
    requestBody: { values: [[driveId]] },
  });
  invalidarCacheHoja(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
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

    // ==================================================
    // BA
    // ESTADO PROCESAMIENTO
    // ==================================================

    documento.estadoProcesamiento ?? "",

    // ==================================================
    // BB
    // PDF CONSTANCIA REGISTRO
    // ==================================================

    documento.pdfConstanciaRegistro ?? "",

    // ==================================================
    // BC
    // FOTO CARNET
    // ==================================================

    documento.fotoCarnet ?? "",

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
      `${hoja}!A${fila}:BC${fila}`,

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
    "Respuestas de formulario 1!B:O"
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
