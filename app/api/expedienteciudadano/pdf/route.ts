import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { buscarExpedienteCiudadano } from "@/lib/expedienteCiudadano";
import { descargarArchivoDrive } from "@/lib/googleDrive";
import { generarPdfExpedienteCiudadano } from "@/lib/generarPdfExpedienteCiudadano";

export const runtime = "nodejs";

function nombreSeguro(valor: string): string {
  return valor.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "ciudadano";
}

export async function GET(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;

  try {
    const documento = request.nextUrl.searchParams.get("documento")?.trim() ?? "";
    if (!documento) {
      return NextResponse.json({ ok: false, error: "Ingrese el número de documento." }, { status: 400 });
    }

    const { expediente, fotoDriveId } = await buscarExpedienteCiudadano(documento);
    if (!expediente) {
      return NextResponse.json({ ok: false, error: "No se encontró ese documento en el Registro Consular." }, { status: 404 });
    }

    let foto: Buffer | undefined;
    if (fotoDriveId) {
      try {
        foto = await descargarArchivoDrive(fotoDriveId);
      } catch {
        // La ficha se puede generar sin la foto si Drive no está disponible.
        foto = undefined;
      }
    }
    const pdf = await generarPdfExpedienteCiudadano(expediente, foto);
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="expediente-${nombreSeguro(expediente.documento)}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error GET /api/expedienteciudadano/pdf:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ ok: false, error: "No fue posible generar la ficha PDF." }, { status: 500 });
  }
}
