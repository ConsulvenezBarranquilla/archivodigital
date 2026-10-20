import crypto from "node:crypto";
import ExcelJS from "exceljs";
import type { VerificacionIdentidad } from "@/lib/casosConsularesTypes";

export type FilaVerificacionImportada = VerificacionIdentidad & {
  nombreCompleto: string;
  datosOrigen: string[];
};
export type ErrorFilaImportacion = { hoja: string; fila: number; error: string };
export type ResultadoLecturaImportacion = {
  hashArchivo: string;
  filasValidas: FilaVerificacionImportada[];
  errores: ErrorFilaImportacion[];
  fechasVaciadas: ErrorFilaImportacion[];
  duplicadosExactosPosibles: number;
  resumenHojas: Array<{ hoja: string; filasConDatos: number; validas: number; revisar: number; fechasVaciadas: number }>;
};

function normalizarEncabezado(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function textoCelda(celda: ExcelJS.Cell) {
  const valor = celda.value;
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number") return String(celda.text || valor).trim();
  if (valor instanceof Date) return celda.text.trim() || valor.toISOString();
  if (typeof valor === "object" && "text" in valor) return String(valor.text ?? "").trim();
  return String(celda.text || "").trim();
}

function fechaISO(celda: ExcelJS.Cell): { fecha: string; original: string; aviso?: string } {
  const valor = celda.value;
  const original = textoCelda(celda);
  if (valor instanceof Date && Number.isFinite(valor.getTime())) return { fecha: valor.toISOString().slice(0, 10), original: valor.toISOString() };
  if (typeof valor === "number" && Number.isFinite(valor)) {
    const milisegundos = Date.UTC(1899, 11, 30) + Math.round(valor * 86_400_000);
    const fecha = new Date(milisegundos);
    if (fecha.getUTCFullYear() >= 1900 && fecha.getUTCFullYear() <= 2200) return { fecha: fecha.toISOString().slice(0, 10), original };
    return { fecha: "", original, aviso: "Fecha inválida; se importará sin fecha." };
  }
  const fuente = String(valor ?? "").trim();
  const iso = fuente.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if (iso) {
    try { return { fecha: validarFecha(Number(iso[1]), Number(iso[2]), Number(iso[3])), original }; }
    catch { return { fecha: "", original, aviso: "Fecha inválida; se importará sin fecha." }; }
  }
  const corta = fuente.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (corta) {
    const primero = Number(corta[1]);
    const segundo = Number(corta[2]);
    if (primero <= 12 && segundo <= 12 && primero !== segundo) return { fecha: "", original, aviso: "Fecha ambigua; se importará sin fecha." };
    const dia = primero > 12 ? primero : segundo > 12 ? segundo : primero;
    const mes = primero > 12 ? segundo : segundo > 12 ? primero : segundo;
    try { return { fecha: validarFecha(Number(corta[3]), mes, dia), original }; }
    catch { return { fecha: "", original, aviso: "Fecha inválida; se importará sin fecha." }; }
  }
  return { fecha: "", original, aviso: "Fecha vacía o inválida; se importará sin fecha." };
}

function validarFecha(anio: number, mes: number, dia: number) {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    throw new Error("Fecha inválida; requiere revisión manual.");
  }
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function detectarColumnas(hoja: ExcelJS.Worksheet) {
  let filaEncabezado = 0;
  let encabezados: string[] = [];
  for (let numero = 1; numero <= Math.min(5, hoja.rowCount); numero++) {
    const fila = hoja.getRow(numero);
    const valores = Array.from({ length: Math.max(fila.cellCount, hoja.columnCount) }, (_, indice) => normalizarEncabezado(fila.getCell(indice + 1).value));
    if (valores.some((valor) => valor.includes("NOMBRES Y APELLIDOS")) && valores.some((valor) => valor.includes("NUMERO DE IDENTIDAD")) && valores.some((valor) => valor.includes("FECHA"))) {
      filaEncabezado = numero;
      encabezados = valores;
      break;
    }
  }
  if (!filaEncabezado) throw new Error(`No se detectaron los encabezados requeridos en la hoja ${hoja.name}.`);
  const buscar = (parte: string) => encabezados.findIndex((encabezado) => encabezado.includes(parte));
  const columnas = {
    nombre: buscar("NOMBRES Y APELLIDOS"), tipoDocumento: buscar("DOCUMENTO DE IDENTIDAD"),
    documento: buscar("NUMERO DE IDENTIDAD"), sexo: buscar("SEXO"), delito: buscar("DELITO"),
    organismo: buscar("ORGANISMO SOLICITANTE"), resultado: buscar("IDENTIDAD CORRESPONDE"),
    observacion: buscar("OBSERVACION"), comunicacion: buscar("COMUNICACION RESPUESTA"), fecha: buscar("FECHA"),
  };
  if (hoja.name === "2023" && columnas.organismo < 0 && columnas.resultado === 7 && encabezados[6] === "") {
    // G no tiene título, pero contiene el organismo y precede al resultado en H.
    columnas.organismo = 6;
  }
  const requeridas = [columnas.nombre, columnas.documento, columnas.fecha, columnas.resultado];
  if (requeridas.some((indice) => indice < 0)) throw new Error(`La hoja ${hoja.name} no incluye nombre, número de identidad, resultado o fecha.`);
  return { filaEncabezado, encabezados, columnas };
}

export async function leerImportacionVerificacionIdentidad(buffer: Buffer): Promise<ResultadoLecturaImportacion> {
  const hashArchivo = crypto.createHash("sha256").update(buffer).digest("hex");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const hojas = workbook.worksheets.filter((hoja) => ["2023", "2024", "2025", "2026"].includes(hoja.name));
  if (hojas.length !== 4) throw new Error("El archivo debe incluir exactamente las hojas anuales 2023, 2024, 2025 y 2026.");
  const filasValidas: FilaVerificacionImportada[] = [];
  const errores: ErrorFilaImportacion[] = [];
  const fechasVaciadas: ErrorFilaImportacion[] = [];
  const resumenHojas: ResultadoLecturaImportacion["resumenHojas"] = [];
  const huellas = new Set<string>();
  let duplicadosExactosPosibles = 0;

  for (const hoja of hojas) {
    const { filaEncabezado, encabezados, columnas } = detectarColumnas(hoja);
    let filasConDatos = 0;
    let validas = 0;
    let revisar = 0;
    let fechasVaciadasHoja = 0;
    for (let filaNumero = filaEncabezado + 1; filaNumero <= hoja.rowCount; filaNumero++) {
      const fila = hoja.getRow(filaNumero);
      if (!Array.from({ length: fila.cellCount }, (_, indice) => textoCelda(fila.getCell(indice + 1))).some(Boolean)) continue;
      filasConDatos += 1;
      const tomar = (indice: number) => indice < 0 ? "" : textoCelda(fila.getCell(indice + 1));
      const nombreCompleto = tomar(columnas.nombre).replace(/\s+/g, " ").trim();
      if (!nombreCompleto) {
        errores.push({ hoja: hoja.name, fila: filaNumero, error: "Falta el nombre completo." });
        revisar += 1;
        continue;
      }
      const fecha = fechaISO(fila.getCell(columnas.fecha + 1));
      if (fecha.aviso) {
        fechasVaciadas.push({ hoja: hoja.name, fila: filaNumero, error: fecha.aviso });
        fechasVaciadasHoja += 1;
      }
      const datosOrigen = Array.from({ length: Math.max(encabezados.length, fila.cellCount) }, (_, indice) => textoCelda(fila.getCell(indice + 1)));
      const registro: FilaVerificacionImportada = {
        id: crypto.createHash("sha256").update(`${hashArchivo}|${hoja.name}|${filaNumero}`).digest("hex"),
        idImportacion: `${hashArchivo}:${hoja.name}:${filaNumero}`,
        nombreCompleto,
        fechaComunicacion: fecha.fecha,
        fechaOriginal: fecha.original,
        tipoDocumento: tomar(columnas.tipoDocumento),
        numeroDocumento: tomar(columnas.documento),
        sexo: tomar(columnas.sexo),
        delito: tomar(columnas.delito),
        organismoSolicitante: tomar(columnas.organismo),
        resultadoIdentidad: tomar(columnas.resultado),
        observacion: tomar(columnas.observacion),
        numeroComunicacion: tomar(columnas.comunicacion),
        registroDactiloscopico: "",
        usuario: "",
        hojaOrigen: hoja.name,
        filaOrigen: filaNumero,
        datosOrigen,
      };
      const huella = crypto.createHash("sha256").update(JSON.stringify({ ...registro, id: undefined, idImportacion: undefined, datosOrigen: undefined })).digest("hex");
      if (huellas.has(huella)) duplicadosExactosPosibles += 1;
      huellas.add(huella);
      filasValidas.push(registro);
      validas += 1;
    }
    resumenHojas.push({ hoja: hoja.name, filasConDatos, validas, revisar, fechasVaciadas: fechasVaciadasHoja });
  }
  return { hashArchivo, filasValidas, errores, fechasVaciadas, duplicadosExactosPosibles, resumenHojas };
}

export function claveDocumentoIdentidad(valor: unknown) {
  const documento = String(valor ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!documento) return "";
  return /^[0-9 .\-]+$/.test(documento) ? documento.replace(/[ .\-]/g, "") : documento;
}
