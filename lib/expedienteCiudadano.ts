import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
  MODULO_CAJA_SHEET_ID,
  obtenerCaja,
  obtenerDocumentoPrincipal as obtenerDocumentoPrincipalRegistro,
  obtenerGestionConsular,
  obtenerRegistroConsular,
  obtenerReportesEntregados,
} from "@/lib/googleSheets";
import { obtenerDocumentos } from "@/lib/reportesEntregados/reportesService";

const HOJA_EXPEDIENTE = "ExpedienteCiudadano";
const ETIQUETAS_REGISTRO_EXPEDIENTE: Record<number, string> = {
  1: "Número de Cédula (National ID Number)",
  2: "Primer Nombre (First Name)",
  3: "Segundo Nombre (Middle Name)",
  4: "Primer Apellido (Last Name)",
  5: "Segundo Apellido (Second Last Name)",
  6: "Nacionalidad (Nationality)",
  7: "Ciudad de Nacimiento",
  8: "País de Nacimiento (Place of Birth)",
  9: "Estado Civil (Civil Status)",
  10: "Género (Gender)",
  11: "Correo electrónico (Email Address)",
  12: "Número Teléfono (Phone Number)",
  13: "Fecha Nacimiento (Date of Birth)",
  14: "Número de Pasaporte (Passport Number)",
  15: "Lugar de Residencia",
  16: "Estatus Migratorio",
  17: "Nivel Académico",
  18: "Profesión u oficio",
};
const ENCABEZADOS_EXPEDIENTE = [
  "Documento principal",
  "Dirección en Colombia",
  "Dirección en Venezuela",
  "Contacto en Colombia",
  "Teléfono contacto Colombia",
  "Contacto en el extranjero",
  "Teléfono contacto extranjero",
  "Foto Drive ID",
  "Actualizado el",
  "Actualizado por",
  "¿Tiene hijos?",
  "Hijos (JSON)",
];

export interface HijoExpediente {
  nombre: string;
  genero: "Masculino" | "Femenino";
  fechaNacimiento: string;
}

export interface DatosEditablesExpediente {
  direccionColombia: string;
  direccionVenezuela: string;
  contactoColombiaNombre: string;
  contactoColombiaTelefono: string;
  contactoExtranjeroNombre: string;
  contactoExtranjeroTelefono: string;
  fotoDriveId: string;
  fotoOrigen: "expediente" | "constancia" | "ninguna";
  actualizadoEl: string;
  actualizadoPor: string;
  tieneHijos: boolean | null;
  hijos: HijoExpediente[];
}

export interface FilaHistorialExpediente {
  fecha: string;
  tipo: string;
  referencia: string;
  estado?: string;
  detalle?: string;
}

export interface ExpedienteCiudadano {
  documento: string;
  cedula: string;
  pasaporte: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  nacionalidad: string;
  datosRegistro: Array<{ etiqueta: string; valor: string }>;
  datosEditables: DatosEditablesExpediente;
  visitas: FilaHistorialExpediente[];
  tramites: FilaHistorialExpediente[];
}

function normalizarDocumento(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function tiempoFecha(valor: unknown): number {
  const textoFecha = texto(valor);
  const local = textoFecha.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (local) {
    const [, dia, mes, anio, hora = "0", minuto = "0", segundo = "0"] = local;
    return new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo)).getTime();
  }
  const fechaParseada = Date.parse(textoFecha);
  return Number.isFinite(fechaParseada) ? fechaParseada : 0;
}

async function asegurarHojaExpedientes(): Promise<void> {
  if (!REGISTRO_CONSULAR_SHEET_ID) {
    throw new Error("REGISTRO_CONSULAR_SHEET_ID no está configurado.");
  }

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    fields: "sheets.properties(sheetId,title,gridProperties.columnCount)",
  });
  const hojaExpediente = metadata.data.sheets?.find(
    (hoja) => hoja.properties?.title === HOJA_EXPEDIENTE
  );
  let existe = Boolean(hojaExpediente);

  if (!existe) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: HOJA_EXPEDIENTE,
                gridProperties: { rowCount: 1000, columnCount: ENCABEZADOS_EXPEDIENTE.length },
              },
            },
          }],
        },
      });
      existe = true;
    } catch {
      // Otra solicitud simultánea pudo crear la pestaña primero.
      const actualizada = await sheets.spreadsheets.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        fields: "sheets.properties(title)",
      });
      existe = actualizada.data.sheets?.some(
        (hoja) => hoja.properties?.title === HOJA_EXPEDIENTE
      ) ?? false;
      if (!existe) throw new Error("No fue posible preparar la pestaña del expediente.");
    }
  }

  const hojaActual = hojaExpediente?.properties;
  if (hojaActual?.sheetId !== undefined && (hojaActual.gridProperties?.columnCount ?? 0) < ENCABEZADOS_EXPEDIENTE.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      requestBody: {
        requests: [{
          appendDimension: {
            sheetId: hojaActual.sheetId,
            dimension: "COLUMNS",
            length: ENCABEZADOS_EXPEDIENTE.length - (hojaActual.gridProperties?.columnCount ?? 0),
          },
        }],
      },
    });
  }

  const encabezados = await sheets.spreadsheets.values.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `'${HOJA_EXPEDIENTE}'!A1:L1`,
  });
  if (!texto(encabezados.data.values?.[0]?.[0])) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `'${HOJA_EXPEDIENTE}'!A1:L1`,
      valueInputOption: "RAW",
      requestBody: { values: [ENCABEZADOS_EXPEDIENTE] },
    });
  } else {
    for (const [indice, encabezado] of [[10, ENCABEZADOS_EXPEDIENTE[10]], [11, ENCABEZADOS_EXPEDIENTE[11]]] as const) {
      if (!texto(encabezados.data.values?.[0]?.[indice])) {
        const columna = indice === 10 ? "K" : "L";
        await sheets.spreadsheets.values.update({
          spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
          range: `'${HOJA_EXPEDIENTE}'!${columna}1`,
          valueInputOption: "RAW",
          requestBody: { values: [[encabezado]] },
        });
      }
    }
  }
}

async function leerDatosEditables(): Promise<string[][]> {
  await asegurarHojaExpedientes();
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `'${HOJA_EXPEDIENTE}'!A:L`,
  });
  return (respuesta.data.values ?? []) as string[][];
}

export async function guardarDatosEditablesExpediente(
  documento: string,
  cambios: Partial<DatosEditablesExpediente>,
  usuario: string
): Promise<void> {
  const normalizado = normalizarDocumento(documento);
  const filas = await leerDatosEditables();
  const indice = filas.findIndex((fila, index) =>
    index > 0 && normalizarDocumento(fila[0]) === normalizado
  );
  const anterior = indice > 0 ? filas[indice] : [];
  const fotoDriveId = cambios.fotoDriveId ?? texto(anterior[7]);
  const tieneHijosAnterior = texto(anterior[10]);
  const tieneHijos = cambios.tieneHijos !== undefined
    ? cambios.tieneHijos
    : tieneHijosAnterior
      ? /^(si|sí|true)$/i.test(tieneHijosAnterior)
      : null;
  let hijosAnteriores: HijoExpediente[] = [];
  try {
    const guardados = JSON.parse(texto(anterior[11]));
    if (Array.isArray(guardados)) hijosAnteriores = guardados;
  } catch {
    hijosAnteriores = [];
  }
  const hijos = tieneHijos === false ? [] : cambios.hijos ?? hijosAnteriores;
  const fila = [
    documento.trim(),
    cambios.direccionColombia ?? texto(anterior[1]),
    cambios.direccionVenezuela ?? texto(anterior[2]),
    cambios.contactoColombiaNombre ?? texto(anterior[3]),
    cambios.contactoColombiaTelefono ?? texto(anterior[4]),
    cambios.contactoExtranjeroNombre ?? texto(anterior[5]),
    cambios.contactoExtranjeroTelefono ?? texto(anterior[6]),
    fotoDriveId,
    new Date().toISOString(),
    usuario,
    tieneHijos === null ? "" : tieneHijos ? "Sí" : "No",
    JSON.stringify(hijos),
  ];

  if (indice > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `'${HOJA_EXPEDIENTE}'!A${indice + 1}:L${indice + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [fila] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
      range: `'${HOJA_EXPEDIENTE}'!A:L`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [fila] },
    });
  }
}

export async function actualizarDocumentoExpedienteCiudadano(documentoAnterior: string, documentoNuevo: string): Promise<void> {
  const anterior = normalizarDocumento(documentoAnterior);
  const nuevo = texto(documentoNuevo);
  if (!anterior || !nuevo || anterior === normalizarDocumento(nuevo)) return;
  const filas = await leerDatosEditables();
  const indice = filas.findIndex((fila, index) => index > 0 && normalizarDocumento(fila[0]) === anterior);
  if (indice < 1) return;
  const fila = [...filas[indice]];
  while (fila.length < ENCABEZADOS_EXPEDIENTE.length) fila.push("");
  fila[0] = nuevo;
  await sheets.spreadsheets.values.update({
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    range: `'${HOJA_EXPEDIENTE}'!A${indice + 1}:L${indice + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [fila.slice(0, ENCABEZADOS_EXPEDIENTE.length)] },
  });
}

export async function buscarExpedienteCiudadano(
  numeroDocumento: string
): Promise<{ expediente: ExpedienteCiudadano | null; fotoDriveId: string }> {
  const buscado = normalizarDocumento(numeroDocumento);
  if (!buscado) return { expediente: null, fotoDriveId: "" };
  if (!REGISTRO_CONSULAR_SHEET_ID) {
    throw new Error("REGISTRO_CONSULAR_SHEET_ID no está configurado.");
  }

  const [registro, caja, gestionConsular, reportes, visitas, editables] = await Promise.all([
    obtenerRegistroConsular(),
    obtenerCaja(),
    obtenerGestionConsular(),
    obtenerReportesEntregados(),
    sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "BitacoraVisitas!A:F",
    }).then((respuesta) => respuesta.data.values ?? []),
    leerDatosEditables(),
  ]);

  const coincidencias = registro
    .slice(1)
    .map((fila) => ({ fila }))
    .filter(({ fila }) =>
      normalizarDocumento(fila[1]) === buscado || normalizarDocumento(fila[14]) === buscado
    )
    .sort((a, b) => {
      return tiempoFecha(b.fila[0]) - tiempoFecha(a.fila[0]);
    });

  const seleccion = coincidencias[0];
  if (!seleccion) return { expediente: null, fotoDriveId: "" };

  const filaRegistro = seleccion.fila;
  const cedula = texto(filaRegistro[1]);
  const pasaporte = texto(filaRegistro[14]);
  const nacionalidad = texto(filaRegistro[6]);
  const documento = obtenerDocumentoPrincipalRegistro(cedula, pasaporte, nacionalidad) || numeroDocumento.trim();
  const claveDocumento = normalizarDocumento(documento);
  const extras = editables.find((fila, index) =>
    index > 0 && normalizarDocumento(fila[0]) === claveDocumento
  ) ?? [];
  const valorTieneHijos = texto(extras[10]);
  let hijos: HijoExpediente[] = [];
  try {
    const guardados = JSON.parse(texto(extras[11]));
    if (Array.isArray(guardados)) {
      hijos = guardados.filter((hijo): hijo is HijoExpediente =>
        hijo && typeof hijo.nombre === "string" &&
        (hijo.genero === "Masculino" || hijo.genero === "Femenino") &&
        typeof hijo.fechaNacimiento === "string"
      );
    }
  } catch {
    hijos = [];
  }

  const docsConstancia = obtenerDocumentos("CONSTANCIA_REGISTRO", {
    caja,
    gestionConsular,
    reportes,
  });
  const fotoConstancia = docsConstancia.find((doc) =>
    normalizarDocumento(doc.documento) === claveDocumento && texto(doc.fotoCarnet)
  )?.fotoCarnet ?? "";
  const fotoExpediente = texto(extras[7]);
  const fotoDriveId = fotoExpediente || fotoConstancia;

  const encabezadosRegistro = registro[0] ?? [];
  const datosRegistro = Array.from({ length: 18 }, (_, desplazamiento) => {
      const indice = desplazamiento + 1;
      const valor = filaRegistro[indice];
      return {
        indice,
        etiqueta: ETIQUETAS_REGISTRO_EXPEDIENTE[indice]
          || (texto(encabezadosRegistro[indice]) || `Dato ${indice + 1}`).replace(/^32750\s*/i, ""),
        valor: texto(valor),
      };
    });

  const nombreCompleto = [filaRegistro[2], filaRegistro[3], filaRegistro[4], filaRegistro[5]]
    .map(texto)
    .filter(Boolean)
    .join(" ");

  const visitasExpediente = visitas.slice(1)
    .filter((fila) => [fila[1], fila[2], fila[3]].some((doc) => normalizarDocumento(doc) === claveDocumento))
    .map((fila) => ({
      fecha: texto(fila[0]),
      tipo: "Visita",
      referencia: texto(fila[5]) || "Visita consular",
      detalle: texto(fila[4]),
    }))
    .sort((a, b) => tiempoFecha(b.fecha) - tiempoFecha(a.fecha));

  const detalles = await sheets.spreadsheets.values.get({
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    range: "DetalleCaja!A:F",
  }).then((respuesta) => respuesta.data.values ?? []);
  const tramitesExpediente = caja.slice(1)
    .filter((fila) => [fila[2], fila[11], fila[12]].some((doc) => normalizarDocumento(doc) === claveDocumento))
    .map((fila) => {
      const correlativo = texto(fila[1]);
      const actuaciones = detalles.slice(1)
        .filter((detalle) => texto(detalle[0]) === correlativo)
        .map((detalle) => texto(detalle[2] || detalle[1]))
        .filter(Boolean);
      return {
        fecha: texto(fila[0]),
        tipo: "Trámite",
        referencia: correlativo,
        estado: texto(fila[10]) || "GENERADO",
        detalle: actuaciones.join(" · ") || "Sin detalle de actuación",
      };
    })
    .sort((a, b) => tiempoFecha(b.fecha) - tiempoFecha(a.fecha));

  return {
    fotoDriveId,
    expediente: {
      documento,
      cedula,
      pasaporte,
      nombreCompleto,
      correo: texto(filaRegistro[11]),
      telefono: texto(filaRegistro[12]),
      fechaNacimiento: texto(filaRegistro[13]),
      nacionalidad,
      datosRegistro,
      datosEditables: {
        direccionColombia: texto(extras[1]),
        direccionVenezuela: texto(extras[2]),
        contactoColombiaNombre: texto(extras[3]),
        contactoColombiaTelefono: texto(extras[4]),
        contactoExtranjeroNombre: texto(extras[5]),
        contactoExtranjeroTelefono: texto(extras[6]),
        fotoDriveId,
        fotoOrigen: fotoExpediente ? "expediente" : fotoConstancia ? "constancia" : "ninguna",
        actualizadoEl: texto(extras[8]),
        actualizadoPor: texto(extras[9]),
        tieneHijos: valorTieneHijos ? /^(si|sí|true)$/i.test(valorTieneHijos) : null,
        hijos,
      },
      visitas: visitasExpediente,
      tramites: tramitesExpediente,
    },
  };
}

export function normalizarDocumentoExpediente(valor: unknown): string {
  return normalizarDocumento(valor);
}
