import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { exigirPermiso } from "@/lib/autorizacion";
import { consultarCasoConsular } from "@/lib/casosConsulares";
import { MODULOS } from "@/lib/modulos";

export const runtime = "nodejs";

type ContextoRuta = { params: Promise<{ id: string }> };

function textoPdf(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return String(value)
      .replace(/\r\n?/g, "\n")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/•/g, "-");
  }
  if (Array.isArray(value)) return value.map((item) => textoPdf(item)).join("; ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${textoPdf(item)}`).join("; ");
  }
  return String(value);
}

export async function GET(_request: NextRequest, contexto: ContextoRuta) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;

  try {
    const { id } = await contexto.params;
    const caso = await consultarCasoConsular(id);
    if (!caso) return NextResponse.json({ ok: false, error: "No se encontró el caso." }, { status: 404 });

    const pdf = await PDFDocument.create();
    pdf.setTitle(`${caso.correlativo} · ${caso.nombre}`);
    pdf.setSubject("Ficha de seguimiento de caso consular");
    pdf.setCreator("Sistema Consular de Barranquilla");
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const width = 595.28;
    const height = 841.89;
    const margin = 48;
    const contentWidth = width - margin * 2;
    const fontSize = 10.5;
    const lineHeight = 15;
    let page = pdf.addPage([width, height]);
    let y = height - margin;

    const nuevaPaginaSiHaceFalta = () => {
      if (y < margin + 35) {
        page = pdf.addPage([width, height]);
        y = height - margin;
      }
    };
    const envolver = (value: string, font: typeof regular) => {
      const words = value.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, fontSize) <= contentWidth) line = candidate;
        else {
          if (line) lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [""];
    };
    const dibujarLinea = (line: string, font: typeof regular, color: ReturnType<typeof rgb>, justificar: boolean) => {
      nuevaPaginaSiHaceFalta();
      const words = line.split(" ").filter(Boolean);
      const anchoPalabras = words.reduce((total, word) => total + font.widthOfTextAtSize(word, fontSize), 0);
      const espacio = justificar && words.length > 1
        ? (contentWidth - anchoPalabras) / (words.length - 1)
        : font.widthOfTextAtSize(" ", fontSize);
      let x = margin;
      for (const word of words) {
        page.drawText(word, { x, y, size: fontSize, font, color });
        x += font.widthOfTextAtSize(word, fontSize) + espacio;
      }
      y -= lineHeight;
    };
    const dibujarTexto = (value: string, font: typeof regular = regular, color = rgb(0.12, 0.18, 0.3), justificar = false) => {
      const paragraphs = value.split("\n");
      paragraphs.forEach((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) {
          y -= lineHeight * 0.6;
          nuevaPaginaSiHaceFalta();
          return;
        }
        const lines = envolver(paragraph, font);
        lines.forEach((line, lineIndex) => {
          const esUltimaLinea = lineIndex === lines.length - 1;
          dibujarLinea(line, font, color, justificar && !esUltimaLinea);
        });
        if (paragraphIndex < paragraphs.length - 1) y -= lineHeight * 0.35;
      });
    };

    page.drawText("CASOS CONSULARES", { x: margin, y, size: 17, font: bold, color: rgb(0.08, 0.19, 0.42) });
    y -= 28;
    dibujarTexto(`${caso.correlativo} · ${caso.categoria}`, bold, rgb(0.08, 0.19, 0.42));
    dibujarTexto(`Estado: ${caso.estado}`);
    dibujarTexto(`Fecha de registro: ${new Date(caso.fecha).toLocaleString("es-CO")}`);
    dibujarTexto(`Creado por: ${caso.creadoPor}`);
    dibujarTexto(`Última actualización: ${caso.actualizadoPor} · ${caso.actualizadoEl ? new Date(caso.actualizadoEl).toLocaleString("es-CO") : "—"}`);
    y -= 10;

    for (const [key, value] of Object.entries(caso.datos)) {
      if (key === "eventos") continue;
      nuevaPaginaSiHaceFalta();
      dibujarTexto(key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()), bold, rgb(0.25, 0.34, 0.48));
      const valorPdf = key === "presentantes" && Array.isArray(value)
        ? value.map((presentante) => {
          if (!presentante || typeof presentante !== "object") return textoPdf(presentante);
          const persona = presentante as Record<string, unknown>;
          return `${textoPdf(persona.nombre)} · ${textoPdf(persona.documento)}`;
        }).join("\n")
        : key === "personasInvolucradas" && Array.isArray(value)
        ? value.map((persona) => {
          if (!persona || typeof persona !== "object") return textoPdf(persona);
          const involucrado = persona as Record<string, unknown>;
          return `${textoPdf(involucrado.nombre)} · Cédula: ${textoPdf(involucrado.cedula)}`;
        }).join("\n")
        : textoPdf(value);
      dibujarTexto(valorPdf, regular, undefined, key === "descripcion" || key === "resumen" || key === "sentencia");
      y -= 5;
    }

    const eventos = Array.isArray(caso.datos.eventos) ? caso.datos.eventos as Array<Record<string, unknown>> : [];
    if (eventos.length) {
      y -= 5;
      dibujarTexto("BITÁCORA DE EVENTOS", bold, rgb(0.08, 0.19, 0.42));
      for (const evento of eventos) {
        dibujarTexto(`${textoPdf(evento.fecha)} · ${textoPdf(evento.usuario)}`, bold);
        dibujarTexto(textoPdf(evento.descripcion), regular, undefined, true);
        y -= 5;
      }
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${caso.correlativo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error GET /api/casos/[id]/pdf:", error);
    return NextResponse.json({ ok: false, error: "No fue posible generar el PDF del caso." }, { status: 500 });
  }
}
