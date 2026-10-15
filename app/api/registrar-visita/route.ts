import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sheets, MODULO_CAJA_SHEET_ID } from "@/lib/googleSheets";
import { fechaHoraActual } from "@/lib/fechas";
import { exigirPermiso } from "@/lib/autorizacion";
import { crearTurno, conBloqueoSolicitud } from "@/lib/turnero";

export async function POST(req: NextRequest) {
  const autorizacion = await exigirPermiso("recepcion");
  if (autorizacion.respuesta) return autorizacion.respuesta;
  try {
    const body = await req.json();
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    const documento = typeof body.documento === "string" ? body.documento.trim() : "";
    const tipo = typeof body.tipo === "string" ? body.tipo.trim() : "";
    const solicitudId = typeof body.solicitudId === "string" ? body.solicitudId.trim() : "";
    if (!nombre || !documento || !["Información", "Trámite", "Acompañante", "Cita Institucional"].includes(tipo) || !/^[\w-]{8,100}$/.test(solicitudId)) {
      return NextResponse.json({ ok: false, error: "Faltan datos requeridos o el identificador de solicitud no es válido." }, { status: 400 });
    }

    const resultado = await conBloqueoSolicitud(`visita:${solicitudId}`, async () => {
      const respuesta = await sheets.spreadsheets.values.get({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        range: "BitacoraVisitas!A:I",
      });
      const filas = respuesta.data.values || [];
      const existente = filas.find((fila) => String(fila[8] || "") === solicitudId);
      const idTurno = `T-${crypto.createHash("sha256").update(`visita:${solicitudId}`).digest("hex").slice(0, 24)}`;
      const fecha = existente?.[0] ? String(existente[0]) : fechaHoraActual();
      const nombrePersistido = String(existente?.[4] || nombre);
      const documentoPersistido = String(existente?.[1] || documento);
      const tipoPersistido = String(existente?.[5] || tipo);

      if (!existente) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: MODULO_CAJA_SHEET_ID,
          range: "BitacoraVisitas!A:I",
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [[
            fecha, documento, body.cedula || "", body.pasaporte || "", nombre,
            tipo, body.nacionalidad || "", idTurno, solicitudId,
          ]] },
        });
      }

      let turnoCreado = false;
      if (tipoPersistido === "Información" || tipoPersistido === "Trámite") {
        await crearTurno({
          requestKey: `visita:${solicitudId}`,
          creadoEl: fecha,
          nombre: nombrePersistido,
          documento: documentoPersistido,
          tipoVisita: tipoPersistido,
          cola: "visitas",
          etapa: tipoPersistido === "Información" ? "recepcion" : "caja",
          actuacion: "",
          codigoActuacion: "",
          correlativo: "",
          visitaId: idTurno,
          detalleId: "",
          usuario: autorizacion.sesion.usuario,
          caja: "",
        });
        turnoCreado = true;
      }
      return { idTurno, fecha, turnoCreado };
    });

    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error registrando la visita.";
    return NextResponse.json({ ok: false, error: mensaje }, { status: mensaje.includes("ya se está procesando") ? 409 : 500 });
  }
}
