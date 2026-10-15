import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { HOJA_DETALLE, leerHoja, obtenerActuaciones, obtenerCaja } from "@/lib/googleSheets";
import { buscarVisitaReciente, sincronizarTurnosAnalista } from "@/lib/turnero";

export async function POST(req: NextRequest) {
  const auth = await exigirPermiso("caja");
  if (auth.respuesta) return auth.respuesta;
  try {
    const body = await req.json();
    const correlativo = typeof body.correlativo === "string" ? body.correlativo.trim() : "";
    if (!/^\d{1,8}\/\d{4}$/.test(correlativo)) return NextResponse.json({ ok: false, error: "Correlativo no válido." }, { status: 400 });
    const [caja, detalle, actuaciones] = await Promise.all([obtenerCaja(), leerHoja(HOJA_DETALLE, "A:D"), obtenerActuaciones()]);
    const recibo = caja.slice(1).find((fila) => String(fila[1] || "").trim() === correlativo);
    if (!recibo || String(recibo[10] || "").toUpperCase() === "ANULADO") {
      return NextResponse.json({ ok: false, error: "No se encontró un recibo vigente para ese correlativo." }, { status: 404 });
    }
    const catalogo = new Map(actuaciones.slice(1)
      .filter((row) => String(row[3] || "").trim().toUpperCase() === "SI")
      .map((row) => [String(row[0] || "").trim(), String(row[1] || "").trim()]));
    const candidatas = detalle.slice(1).filter((row) => String(row[0] || "").trim() === correlativo)
      .map((row, indice) => ({ codigo: String(row[1] || "").trim(), nombre: catalogo.get(String(row[1] || "").trim()) || "", indice }))
      .filter((row) => row.nombre);
    const fecha = String(recibo[0] || "");
    const visitaId = await buscarVisitaReciente(String(recibo[2] || ""), fecha);
    const turnos = await sincronizarTurnosAnalista({
      correlativo, nombre: String(recibo[3] || ""), documento: String(recibo[2] || ""),
      fecha, usuario: auth.sesion.usuario, actuaciones: candidatas, visitaId,
    });
    return NextResponse.json({ ok: true, total: turnos.length });
  } catch (error) {
    console.error("No se pudieron recuperar las atenciones del recibo:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudieron recuperar las atenciones." }, { status: 500 });
  }
}
