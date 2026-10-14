import { PDFDocument, PDFImage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { ExpedienteCiudadano } from "@/lib/expedienteCiudadano";

function textoPdf(valor: unknown): string {
  return String(valor ?? "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2022\u00b7]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .trim();
}

function envolver(texto: string, font: PDFFont, size: number, ancho: number): string[] {
  const palabras = textoPdf(texto).split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(candidata, size) > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
}

export async function generarPdfExpedienteCiudadano(
  expediente: ExpedienteCiudadano,
  fotoBytes?: Buffer
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Expediente ciudadano - ${expediente.documento}`);
  pdf.setSubject("Ficha de expediente ciudadano consular");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.12, 0.19, 0.39);
  const blue = rgb(0.16, 0.36, 0.72);
  const muted = rgb(0.37, 0.43, 0.52);
  const border = rgb(0.85, 0.88, 0.92);
  const white = rgb(1, 1, 1);
  const pages = [];
  let page = pdf.addPage([612, 792]);
  pages.push(page);
  let y = 0;

  let logo: PDFImage | undefined;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    logo = await pdf.embedPng(logoBytes);
  } catch {
    logo = undefined;
  }

  function encabezado() {
    page.drawRectangle({ x: 0, y: 724, width: 612, height: 68, color: navy });
    if (logo) page.drawImage(logo, { x: 42, y: 735, width: 46, height: 46 });
    page.drawText("EXPEDIENTE ÚNICO CIUDADANO", {
      x: 102, y: 760, size: 15, font: bold, color: white,
    });
    page.drawText("Consulado General de Venezuela en Barranquilla", {
      x: 102, y: 741, size: 9, font: regular, color: white,
    });
    y = 704;
  }

  function nuevaPagina() {
    page = pdf.addPage([612, 792]);
    pages.push(page);
    encabezado();
  }

  function asegurar(altura: number) {
    if (y - altura < 48) nuevaPagina();
  }

  function seccion(titulo: string) {
    asegurar(34);
    page.drawRectangle({ x: 42, y: y - 21, width: 528, height: 25, color: rgb(0.93, 0.96, 0.99) });
    page.drawText(textoPdf(titulo).toUpperCase(), {
      x: 50, y: y - 13, size: 10, font: bold, color: navy,
    });
    y -= 34;
  }

  function par(label: string, value: string, ancho = 528) {
    if (!value.trim()) return;
    const etiqueta = `${textoPdf(label)}:`;
    const xEtiqueta = 58;
    const xValor = 250;
    const anchoEtiqueta = xValor - xEtiqueta - 12;
    const anchoValor = ancho - (xValor - 42);
    const lineasEtiqueta = envolver(etiqueta, bold, 9, anchoEtiqueta);
    const lineasValor = envolver(value, regular, 9, anchoValor);
    const cantidadLineas = Math.max(lineasEtiqueta.length, lineasValor.length);
    asegurar(15 + cantidadLineas * 12);
    for (let indice = 0; indice < cantidadLineas; indice++) {
      if (lineasEtiqueta[indice]) {
        page.drawText(lineasEtiqueta[indice], { x: xEtiqueta, y, size: 9, font: bold, color: muted });
      }
      if (lineasValor[indice]) {
        page.drawText(lineasValor[indice], { x: xValor, y, size: 9, font: regular, color: navy });
      }
      y -= 12;
    }
    y -= 3;
  }

  function filaHistorial(item: { fecha: string; tipo: string; referencia: string; estado?: string; detalle?: string }) {
    const contenido = [item.fecha, item.referencia, item.estado, item.detalle].filter(Boolean).join(" | ");
    const lineas = envolver(contenido, regular, 8.5, 510);
    asegurar(12 + lineas.length * 11);
    page.drawText(textoPdf(item.tipo), { x: 48, y, size: 8.5, font: bold, color: blue });
    y -= 11;
    for (const linea of lineas) {
      asegurar(11);
      page.drawText(linea, { x: 62, y, size: 8.5, font: regular, color: navy });
      y -= 11;
    }
    y -= 4;
  }

  encabezado();
  const nombre = expediente.nombreCompleto || "Nombre no disponible";
  page.drawText(textoPdf(nombre), { x: 48, y, size: 18, font: bold, color: navy });
  y -= 25;
  page.drawText(`Documento: ${textoPdf(expediente.documento)}`, { x: 48, y, size: 11, font: bold, color: blue });
  y -= 17;
  page.drawText(`Nacionalidad: ${textoPdf(expediente.nacionalidad || "No indicada")}`, { x: 48, y, size: 9, font: regular, color: muted });
  y -= 14;
  page.drawText(`Correo: ${textoPdf(expediente.correo || "No indicado")}`, { x: 48, y, size: 9, font: regular, color: muted });
  y -= 14;
  page.drawText(`Teléfono: ${textoPdf(expediente.telefono || "No indicado")}`, { x: 48, y, size: 9, font: regular, color: muted });

  const fotoX = 454;
  const fotoY = 545;
  const fotoW = 112;
  const fotoH = 132;
  page.drawRectangle({ x: fotoX, y: fotoY, width: fotoW, height: fotoH, borderColor: border, borderWidth: 1, color: rgb(0.97, 0.98, 0.99) });
  if (fotoBytes?.length) {
    try {
      const fotoNormalizada = await sharp(fotoBytes)
        .rotate()
        .resize({ width: 700, height: 900, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      const img = await pdf.embedPng(fotoNormalizada);
      const scale = Math.min((fotoW - 8) / img.width, (fotoH - 8) / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      page.drawImage(img, { x: fotoX + (fotoW - width) / 2, y: fotoY + (fotoH - height) / 2, width, height });
    } catch {
      page.drawText("Sin Foto", { x: fotoX + 28, y: fotoY + 61, size: 11, font: bold, color: muted });
    }
  } else {
    page.drawText("Sin Foto", { x: fotoX + 28, y: fotoY + 61, size: 11, font: bold, color: muted });
  }

  y = Math.min(y - 13, fotoY - 20);
  seccion("Información General");
  for (const dato of expediente.datosRegistro) par(dato.etiqueta, dato.valor);

  seccion("Direcciones y contactos");
  const editables = expediente.datosEditables;
  par("Dirección en Colombia", editables.direccionColombia || "No registrada");
  par("Dirección en Venezuela", editables.direccionVenezuela || "No registrada");
  par("Contacto en Colombia", [editables.contactoColombiaNombre, editables.contactoColombiaTelefono].filter(Boolean).join(" | ") || "No registrado");
  par("Contacto en el extranjero", [editables.contactoExtranjeroNombre, editables.contactoExtranjeroTelefono].filter(Boolean).join(" | ") || "No registrado");

  seccion("Hijos");
  par("¿Tiene hijos?", editables.tieneHijos === null ? "No indicado" : editables.tieneHijos ? "Sí" : "No");
  if (editables.tieneHijos && editables.hijos.length) {
    editables.hijos.forEach((hijo, indice) => {
      par(`Hijo/a ${indice + 1}`, `${hijo.nombre} | ${hijo.genero} | ${hijo.fechaNacimiento}`);
    });
  } else if (editables.tieneHijos) {
    par("Hijos", "Sin datos registrados.");
  }

  seccion(`Historial de visitas (${expediente.visitas.length})`);
  if (expediente.visitas.length) expediente.visitas.forEach(filaHistorial);
  else par("Visitas", "Sin visitas registradas.");

  seccion(`Historial de trámites (${expediente.tramites.length})`);
  if (expediente.tramites.length) expediente.tramites.forEach(filaHistorial);
  else par("Trámites", "Sin trámites registrados.");

  pages.forEach((pagina, indice) => {
    pagina.drawLine({ start: { x: 42, y: 34 }, end: { x: 570, y: 34 }, thickness: 0.6, color: border });
    pagina.drawText(`Documento interno - generado ${new Date().toLocaleDateString("es-CO")}`, {
      x: 42, y: 21, size: 7.5, font: regular, color: muted,
    });
    pagina.drawText(`Página ${indice + 1} de ${pages.length}`, {
      x: 500, y: 21, size: 7.5, font: regular, color: muted,
    });
  });

  return pdf.save();
}
