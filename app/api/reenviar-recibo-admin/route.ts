import { NextRequest, NextResponse } from "next/server";

import { exigirPermiso } from "@/lib/autorizacion";
import { generarPdfRecibo } from "@/lib/generarPdfRecibo";
import { enviarReciboPorCorreo } from "@/lib/gmail";
import {
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
  sheets,
} from "@/lib/googleSheets";

function listaSeparadaPorPuntoYComa(valor: unknown): string[] {
  return String(valor ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const autorizacion = await exigirPermiso("reportes");
  if (autorizacion.respuesta) return autorizacion.respuesta;

  try {
    const body = await request.json();
    const correlativo = String(body?.correlativo ?? "").trim();
    if (!correlativo) {
      return NextResponse.json({ ok: false, error: "Debe indicar el número del recibo." }, { status: 400 });
    }

    const [cajaResponse, detalleResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        range: "Caja!A:S",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        range: "DetalleCaja!A:F",
      }),
    ]);

    const filasCaja = cajaResponse.data.values || [];
    const filasDetalle = detalleResponse.data.values || [];
    const recibo = filasCaja.slice(1).find((fila) => String(fila[1] ?? "").trim() === correlativo);

    if (!recibo) {
      return NextResponse.json({ ok: false, error: "Recibo no encontrado." }, { status: 404 });
    }

    if (String(recibo[10] ?? "").trim().toUpperCase() !== "GENERADO") {
      return NextResponse.json({ ok: false, error: "Solo se pueden reenviar recibos en estado GENERADO." }, { status: 409 });
    }

    const actuaciones = filasDetalle
      .slice(1)
      .filter((fila) => String(fila[0] ?? "").trim() === correlativo)
      .map((fila) => ({
        codigo: String(fila[1] ?? "").trim(),
        actuacion: String(fila[2] ?? "").trim(),
        monto: Number(fila[3] ?? 0),
      }));

    if (!actuaciones.length) {
      return NextResponse.json({ ok: false, error: "El recibo no tiene actuaciones asociadas." }, { status: 409 });
    }

    if (actuaciones.some((actuacion) => actuacion.codigo.toUpperCase() === "CONST-RC-E")) {
      return NextResponse.json({ ok: false, error: "Este recibo contiene CONST-RC-E y no aplica para envío por correo." }, { status: 409 });
    }

    const correo = String(recibo[4] ?? "").trim();
    if (!correo) {
      return NextResponse.json({ ok: false, error: "El recibo no tiene un correo registrado." }, { status: 409 });
    }

    const titularesPasaporte = listaSeparadaPorPuntoYComa(recibo[14]);
    const titularesApostilla = listaSeparadaPorPuntoYComa(recibo[15]);
    const titularesVisa = listaSeparadaPorPuntoYComa(recibo[16]);
    const pasaportesVisa = listaSeparadaPorPuntoYComa(recibo[17]);
    const observaciones = listaSeparadaPorPuntoYComa(recibo[18]);
    let indicePasaporte = 0;
    let indiceApostilla = 0;
    let indiceVisa = 0;
    let indicePasaporteVisa = 0;
    let indiceObservacion = 0;

    const titularesEspeciales = actuaciones.map((actuacion) => {
      const descripcion = actuacion.actuacion.toUpperCase();
      let tipo: "PASAPORTE" | "APOSTILLA" | "VISA" = "PASAPORTE";
      let titular = "";
      let pasaporteTitular = "";

      if (descripcion.includes("VISA")) {
        tipo = "VISA";
        titular = titularesVisa[indiceVisa] || "";
        pasaporteTitular = pasaportesVisa[indicePasaporteVisa] || "";
        if (titular) indiceVisa++;
        if (pasaporteTitular) indicePasaporteVisa++;
      } else if (descripcion.includes("APOSTILLA") && descripcion.includes("NNA")) {
        tipo = "APOSTILLA";
        titular = titularesApostilla[indiceApostilla] || "";
        if (titular) indiceApostilla++;
      } else if (descripcion.includes("PASAPORTE") && descripcion.includes("NNA")) {
        tipo = "PASAPORTE";
        titular = titularesPasaporte[indicePasaporte] || "";
        if (titular) indicePasaporte++;
      }

      const observacion = observaciones[indiceObservacion] || "";
      if (observacion) indiceObservacion++;

      return {
        tipo,
        titular,
        pasaporte: pasaporteTitular || undefined,
        mismaPersona: !titular,
        esNNA: descripcion.includes("NNA"),
        tieneObservacion: Boolean(observacion),
        observacion: observacion || undefined,
      };
    });

    const pdf = await generarPdfRecibo({
      correlativo,
      fecha: String(recibo[0] ?? ""),
      documento: obtenerDocumentoPrincipal(
        String(recibo[11] ?? recibo[2] ?? ""),
        String(recibo[12] ?? ""),
        String(recibo[13] ?? "")
      ),
      nombre: String(recibo[3] ?? ""),
      correo,
      usuario: String(recibo[7] ?? ""),
      actuaciones,
      totalUSD: Number(recibo[6] ?? 0),
      titularesEspeciales,
      soloOriginal: true,
    });

    const envio = await enviarReciboPorCorreo({
      destinatario: correo,
      nombre: String(recibo[3] ?? ""),
      correlativo,
      pdfBytes: pdf,
    });

    return NextResponse.json({
      ok: true,
      correlativo,
      destinatario: envio.destinatario,
      messageId: envio.messageId,
    });
  } catch (error) {
    console.error("Error POST /api/reenviar-recibo-admin:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No fue posible reenviar el recibo." },
      { status: 500 }
    );
  }
}
