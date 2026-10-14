import { NextRequest } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { buscarExpedienteCiudadano } from "@/lib/expedienteCiudadano";
import { descargarArchivoDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

function detectarTipoImagen(bytes: Buffer): string {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;

  try {
    const documento = request.nextUrl.searchParams.get("documento")?.trim() ?? "";
    const { expediente, fotoDriveId } = await buscarExpedienteCiudadano(documento);
    if (!expediente || !fotoDriveId) return new Response("Foto no disponible", { status: 404 });

    const bytes = await descargarArchivoDrive(fotoDriveId);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": detectarTipoImagen(bytes),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error GET /api/expedienteciudadano/foto:", error instanceof Error ? error.message : "error");
    return new Response("No fue posible cargar la foto", { status: 500 });
  }
}
