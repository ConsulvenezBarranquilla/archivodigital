import { NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { crearRespaldosGoogleSheets } from "@/lib/respaldoGoogleSheets";

export const runtime = "nodejs";

export async function POST() {
  try {
    const autorizacion = await exigirPermiso("configuracion");
    if (autorizacion.respuesta) return autorizacion.respuesta;

    const respaldo = await crearRespaldosGoogleSheets(true);
    if (!respaldo.contenidoZip || !respaldo.nombreZip) {
      throw new Error("No se pudo preparar la copia local del respaldo.");
    }
    return new NextResponse(new Uint8Array(respaldo.contenidoZip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${respaldo.nombreZip}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error guardando respaldo de Google Sheets:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No fue posible guardar los respaldos.",
      },
      { status: 500 }
    );
  }
}
