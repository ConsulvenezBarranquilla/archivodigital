import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

export const TIPOS_PLANILLA_SLAE: Record<string, string> = {
  "REG-SLAE": "Registro",
  "RES-SLAE": "Reseteo",
  "MOD-SLAE": "Modificación",
  "REG-SIGESAP": "Registro",
  "RES-SIGESAP": "Reseteo",
  "RES-SAIME": "RESETEO",
  "MOD-SIGESAP": "Modificación",
};

const PLANTILLAS_PLANILLA: Record<string, string> = {
  SLAE: "NUEVA PLANILLA DE REGISTRO Y RESETEO SLAE.xlsx",
  SIGESAP: "NUEVA PLANILLA DE REGISTRO Y RESETEO SIGESAP.xlsx",
  SAIME: "RECIBO PARA TRAMITES SAIME (1)(1).xlsx",
};

export interface DatosPlanillaSlae {
  codigo: keyof typeof TIPOS_PLANILLA_SLAE;
  documento: string;
  fechaNacimiento: string | number;
  nombres: string;
  apellidos: string;
  correo: string;
  fechaRecibo: string | number;
  correlativo: string;
  observacion?: string;
}

function parsearFecha(valor: string | number, etiqueta: string): Date {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    const serial = new Date(Date.UTC(1899, 11, 30) + valor * 86_400_000);
    return new Date(serial.getUTCFullYear(), serial.getUTCMonth(), serial.getUTCDate());
  }
  const limpio = String(valor).trim();
  let anio: number;
  let mes: number;
  let dia: number;

  const diaMesAnio = limpio.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  const anioMesDia = limpio.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (diaMesAnio) {
    dia = Number(diaMesAnio[1]);
    mes = Number(diaMesAnio[2]);
    anio = Number(diaMesAnio[3]);
  } else if (anioMesDia) {
    anio = Number(anioMesDia[1]);
    mes = Number(anioMesDia[2]);
    dia = Number(anioMesDia[3]);
  } else {
    throw new Error(`La fecha de ${etiqueta} no tiene un formato reconocido.`);
  }

  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    throw new Error(`La fecha de ${etiqueta} no es válida.`);
  }
  return fecha;
}

function nombreMes(fecha: Date) {
  return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][fecha.getMonth()];
}

function nombreArchivo(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

export function nombreArchivoPlanillaSlae(datos: DatosPlanillaSlae) {
  const tipo = TIPOS_PLANILLA_SLAE[datos.codigo];
  const sistema = datos.codigo.endsWith("SIGESAP") ? "SIGESAP" : datos.codigo.endsWith("SAIME") ? "SAIME" : "SLAE";
  return `Planilla_${sistema}_${nombreArchivo(tipo)}_${nombreArchivo(datos.documento)}_${nombreArchivo(datos.correlativo.replaceAll("/", "-"))}.xlsx`;
}

export async function generarPlanillaSlae(datos: DatosPlanillaSlae): Promise<Buffer> {
  const tipo = TIPOS_PLANILLA_SLAE[datos.codigo];
  if (!tipo) throw new Error("El código de actuación no corresponde a una planilla SLAE.");
  if (!datos.documento.trim() || !datos.nombres.trim() || !datos.apellidos.trim() || !datos.correo.trim()) {
    throw new Error("Faltan datos obligatorios del ciudadano para generar la planilla SLAE.");
  }
  if (datos.codigo === "MOD-SLAE" && !datos.observacion?.trim()) {
    throw new Error("No se encontró la naturaleza de la modificación SLAE guardada con el recibo.");
  }
  if (datos.codigo === "MOD-SIGESAP" && !datos.observacion?.trim()) {
    throw new Error("No se encontró la naturaleza de la modificación SIGESAP guardada con el recibo.");
  }

  const nacimiento = parsearFecha(datos.fechaNacimiento, "nacimiento");
  const fechaRecibo = parsearFecha(datos.fechaRecibo, "recibo");
  const sistema = datos.codigo.endsWith("SIGESAP") ? "SIGESAP" : datos.codigo.endsWith("SAIME") ? "SAIME" : "SLAE";
  const plantilla = path.join(process.cwd(), "plantillas", PLANTILLAS_PLANILLA[sistema]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(plantilla) as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const hoja = workbook.getWorksheet("Hoja1");
  if (!hoja) throw new Error(`La plantilla ${sistema} no contiene la hoja Hoja1.`);

  if (sistema === "SAIME") {
    hoja.getCell("B10").value = datos.documento.trim();
    hoja.getCell("D10").value = nacimiento;
    hoja.getCell("E10").value = datos.nombres.trim();
    hoja.getCell("F10").value = datos.apellidos.trim();
    hoja.getCell("H10").value = { text: datos.correo.trim(), hyperlink: `mailto:${datos.correo.trim()}` };
    hoja.getCell("K10").value = tipo;
    if (datos.observacion?.trim()) hoja.getCell("L10").value = datos.observacion;

    const nombreCompleto = `${datos.nombres.trim()} ${datos.apellidos.trim()}`.replace(/\s+/g, " ");
    const declaracion = String(hoja.getCell("B13").value ?? "");
    if (!declaracion.includes("{{NOMBRE_COMPLETO}}") || !declaracion.includes("{{DOCUMENTO}}")) {
      throw new Error("La plantilla SAIME no contiene los marcadores de nombre y documento esperados.");
    }
    hoja.getCell("B13").value = declaracion
      .replace("{{NOMBRE_COMPLETO}}", nombreCompleto)
      .replace("{{DOCUMENTO}}", datos.documento.trim());

    const fechaTexto = String(hoja.getCell("B17").value ?? "");
    const patronFecha = /A los \d{1,2} d\u00EDas del mes de [\p{L}]+\s+de \d{4}/iu;
    if (!patronFecha.test(fechaTexto)) throw new Error("La plantilla SAIME no contiene la frase de fecha esperada en B17.");
    hoja.getCell("B17").value = fechaTexto.replace(
      patronFecha,
      `A los ${fechaRecibo.getDate()} d\u00EDas del mes de ${nombreMes(fechaRecibo).toLowerCase()} de ${fechaRecibo.getFullYear()}`,
    );
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Las celdas combinadas conservan el estilo; se escribe en su celda superior izquierda.
  hoja.getCell("A10").value = datos.documento.trim();
  hoja.getCell("C10").value = nacimiento;
  hoja.getCell("C10").numFmt = "dd/mm/yyyy";
  hoja.getCell("D10").value = datos.nombres.trim();
  hoja.getCell("E10").value = datos.apellidos.trim();
  hoja.getCell("G10").value = { text: datos.correo.trim(), hyperlink: `mailto:${datos.correo.trim()}` };
  hoja.getCell("J10").value = tipo;
  if (datos.codigo.startsWith("MOD-")) {
    // K10 es la celda superior izquierda del rango combinado K10:L10.
    hoja.getCell("K10").value = datos.observacion!;
  }

  const nombreCompleto = `${datos.nombres.trim()} ${datos.apellidos.trim()}`.replace(/\s+/g, " ");
  const declaracionOriginal = String(hoja.getCell("A13").value ?? "");
  if (!declaracionOriginal.includes("{{NOMBRE_COMPLETO}}") || !declaracionOriginal.includes("{{DOCUMENTO}}")) {
    throw new Error("La plantilla SLAE no contiene los marcadores de nombre y documento esperados.");
  }
  hoja.getCell("A13").value = declaracionOriginal
    .replace("{{NOMBRE_COMPLETO}}", nombreCompleto)
    .replace("{{DOCUMENTO}}", datos.documento.trim());

  const fechaTexto = String(hoja.getCell("A18").value ?? "");
  const patronFecha = /a los \d{1,2} dias del mes de [\p{L}]+\s+año \d{4}/iu;
  if (!patronFecha.test(fechaTexto)) throw new Error("La plantilla SLAE no contiene la frase de fecha esperada en A18.");
  hoja.getCell("A18").value = fechaTexto.replace(
    patronFecha,
    `a los ${fechaRecibo.getDate()} dias del mes de ${nombreMes(fechaRecibo)} año ${fechaRecibo.getFullYear()}`,
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
