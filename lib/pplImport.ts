import crypto from "node:crypto";
import ExcelJS from "exceljs";

export type FilaPplImportada = {
  idImportacion: string;
  hoja: string;
  fila: number;
  nombre: string;
  nui: string;
  cedula: string;
  genero: "Masculino" | "Femenino";
  centroPenitenciario: string;
  situacionJuridica: "Sindicado" | "Condenado";
  estadoPenitenciario: "Detención Domiciliaria" | "Intramural" | "Prisión Domiciliaria" | "Vigilancia Electrónica" | "Otros";
  verificadoFuente: string;
};

export type ErrorFilaPpl = { hoja: string; fila: number; error: string };
export type ResultadoLecturaPpl = {
  hashArchivo: string;
  filasValidas: FilaPplImportada[];
  errores: ErrorFilaPpl[];
  duplicados: ErrorFilaPpl[];
  resumenHojas: Array<{ hoja: string; filasConDatos: number; validas: number; revisar: number; duplicadas: number }>;
};

function encabezado(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function textoCelda(celda: ExcelJS.Cell) {
  const valor = celda.value;
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) return "";
    const formato = String(celda.numFmt ?? "");
    if (Number.isInteger(valor) && /^0+$/.test(formato)) return String(valor).padStart(formato.length, "0");
    return String(valor);
  }
  if (valor instanceof Date) return Number.isFinite(valor.getTime()) ? valor.toISOString() : "";
  if (typeof valor === "object" && "richText" in valor) return valor.richText.map((parte) => parte.text).join("").trim();
  if (typeof valor === "object" && "text" in valor) return String(valor.text ?? "").trim();
  return String(celda.text ?? "").trim();
}

function normalizarIdentificador(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[\s.-]+/g, "").trim();
}

function detectarEncabezado(hoja: ExcelJS.Worksheet) {
  for (let numero = 1; numero <= Math.min(12, hoja.rowCount); numero++) {
    const fila = hoja.getRow(numero);
    const nombres = Array.from({ length: Math.max(fila.cellCount, hoja.columnCount) }, (_, indice) => encabezado(textoCelda(fila.getCell(indice + 1))));
    const buscar = (...alias: string[]) => nombres.findIndex((nombre) => alias.includes(nombre));
    const columnas = {
      nombre: buscar("NOMBRE Y APELLIDO", "NOMBRES Y APELLIDOS", "NOMBRE COMPLETO"),
      nui: buscar("NUI", "NUMERO UNICO DE IDENTIFICACION"),
      cedula: buscar("C I V", "CIV", "CEDULA", "CEDULA DE IDENTIDAD", "DOCUMENTO DE IDENTIDAD"),
      centro: buscar("ESTABLECIMIENTO", "CENTRO PENITENCIARIO", "CENTRO DE RECLUSION"),
      genero: buscar("GENERO", "SEXO"),
      situacion: buscar("SITUACION JURIDICA", "SITUACION JURIDICO PENAL"),
      estado: buscar("ESTADO", "ESTADO DE RECLUSION"),
      verificado: buscar("VERIFICADO", "VERIFICACION"),
    };
    if (columnas.nombre >= 0 && columnas.nui >= 0 && columnas.cedula >= 0 && columnas.centro >= 0
      && columnas.genero >= 0 && columnas.situacion >= 0 && columnas.estado >= 0) {
      return { filaEncabezado: numero, columnas };
    }
  }
  throw new Error(`No se encontraron los encabezados requeridos en la hoja ${hoja.name}.`);
}

function normalizarGenero(valor: string): FilaPplImportada["genero"] | null {
  const limpio = encabezado(valor);
  if (["M", "MASCULINO", "HOMBRE"].includes(limpio)) return "Masculino";
  if (["F", "FEMENINO", "MUJER"].includes(limpio)) return "Femenino";
  return null;
}

function normalizarSituacion(valor: string): FilaPplImportada["situacionJuridica"] | null {
  const limpio = encabezado(valor);
  if (limpio === "SINDICADO") return "Sindicado";
  if (limpio === "CONDENADO") return "Condenado";
  return null;
}

function normalizarEstado(valor: string): FilaPplImportada["estadoPenitenciario"] | null {
  const limpio = encabezado(valor);
  const estados: Record<string, FilaPplImportada["estadoPenitenciario"]> = {
    "DETENCION DOMICILIARIA": "Detención Domiciliaria",
    INTRAMURAL: "Intramural",
    "PRISION DOMICILIARIA": "Prisión Domiciliaria",
    "VIGILANCIA ELECTRONICA": "Vigilancia Electrónica",
    OTROS: "Otros",
  };
  return estados[limpio] ?? null;
}

export async function leerImportacionPpl(buffer: Buffer): Promise<ResultadoLecturaPpl> {
  const hashArchivo = crypto.createHash("sha256").update(buffer).digest("hex");
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer as unknown as Parameters<typeof libro.xlsx.load>[0]);
  const filasValidas: FilaPplImportada[] = [];
  const errores: ErrorFilaPpl[] = [];
  const duplicados: ErrorFilaPpl[] = [];
  const resumenHojas: ResultadoLecturaPpl["resumenHojas"] = [];
  const vistos = new Map<string, string>();

  for (const hoja of libro.worksheets) {
    const { filaEncabezado, columnas } = detectarEncabezado(hoja);
    let filasConDatos = 0;
    let validas = 0;
    let revisar = 0;
    let duplicadas = 0;
    const tomar = (fila: ExcelJS.Row, indice: number) => indice < 0 ? "" : textoCelda(fila.getCell(indice + 1)).replace(/\s+/g, " ").trim();

    for (let numero = filaEncabezado + 1; numero <= hoja.rowCount; numero++) {
      const fila = hoja.getRow(numero);
      if (!Array.from({ length: fila.cellCount }, (_, indice) => textoCelda(fila.getCell(indice + 1))).some(Boolean)) continue;
      filasConDatos += 1;
      const nombre = tomar(fila, columnas.nombre);
      const nui = tomar(fila, columnas.nui);
      const cedula = tomar(fila, columnas.cedula);
      const centroPenitenciario = tomar(fila, columnas.centro);
      const genero = normalizarGenero(tomar(fila, columnas.genero));
      const situacionJuridica = normalizarSituacion(tomar(fila, columnas.situacion));
      const estadoPenitenciario = normalizarEstado(tomar(fila, columnas.estado));
      const problemas: string[] = [];
      if (!nombre) problemas.push("Falta el nombre completo.");
      if (!nui && !cedula) problemas.push("Falta NUI y C.I.V.; se requiere al menos un identificador para evitar duplicados.");
      if (!centroPenitenciario) problemas.push("Falta el establecimiento penitenciario.");
      if (!genero) problemas.push("Género no reconocido; debe ser M o F.");
      if (!situacionJuridica) problemas.push("Situación Jurídica no reconocida.");
      if (!estadoPenitenciario) problemas.push("Estado penitenciario no reconocido.");
      if (problemas.length) {
        errores.push({ hoja: hoja.name, fila: numero, error: problemas.join(" ") });
        revisar += 1;
        continue;
      }

      const claveCedula = normalizarIdentificador(cedula);
      const claveNui = normalizarIdentificador(nui);
      const filaClave = claveCedula ? `DOC:${claveCedula}` : `NUI:${claveNui}`;
      const previaCedula = claveCedula ? vistos.get(`DOC:${claveCedula}`) : undefined;
      const previaNui = claveNui ? vistos.get(`NUI:${claveNui}`) : undefined;
      if (previaCedula && previaNui && previaCedula !== previaNui) {
        duplicados.push({ hoja: hoja.name, fila: numero, error: "C.I.V. y NUI apuntan a filas anteriores distintas; requiere revisión manual." });
        duplicadas += 1;
        continue;
      }
      if (previaCedula || previaNui) {
        duplicados.push({ hoja: hoja.name, fila: numero, error: `Identificador repetido en ${previaCedula ?? previaNui}; se omite para evitar duplicar personas.` });
        duplicadas += 1;
        continue;
      }

      vistos.set(filaClave, `${hoja.name}:${numero}`);
      if (claveCedula) vistos.set(`DOC:${claveCedula}`, `${hoja.name}:${numero}`);
      if (claveNui) vistos.set(`NUI:${claveNui}`, `${hoja.name}:${numero}`);
      filasValidas.push({
        idImportacion: `${hashArchivo}:${hoja.name}:${numero}`,
        hoja: hoja.name,
        fila: numero,
        nombre,
        nui,
        cedula,
        genero: genero!,
        centroPenitenciario,
        situacionJuridica: situacionJuridica!,
        estadoPenitenciario: estadoPenitenciario!,
        verificadoFuente: tomar(fila, columnas.verificado),
      });
      validas += 1;
    }
    resumenHojas.push({ hoja: hoja.name, filasConDatos, validas, revisar, duplicadas });
  }
  if (resumenHojas.length === 0) throw new Error("El libro no contiene hojas con encabezados PPL reconocidos.");
  return { hashArchivo, filasValidas, errores, duplicados, resumenHojas };
}
