import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { obtenerSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { MODULO_CAJA_SHEET_ID, REGISTRO_CONSULAR_SHEET_ID, sheets } from "@/lib/googleSheets";
import {
  DatosPlanillaSlae,
  generarPlanillaSlae,
  nombreArchivoPlanillaSlae,
  TIPOS_PLANILLA_SLAE,
} from "@/lib/planillasSlae";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function claveDocumento(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function observacionModificacion(observaciones: string, codigo: string, numero: number) {
  const lineas = observaciones.split(/\r?\n/);
  const prefijo = `${codigo} #${numero}:`;
  const indice = lineas.findIndex((linea) => linea.startsWith(prefijo));
  if (indice < 0) return "";
  const textoInicial = lineas[indice].slice(prefijo.length);
  const partes = [textoInicial.startsWith(" ") ? textoInicial.slice(1) : textoInicial];
  for (let actual = indice + 1; actual < lineas.length && !/^(?:MOD-(?:SLAE|SIGESAP)|RES-SAIME) #\d+:/.test(lineas[actual]); actual += 1) {
    partes.push(lineas[actual]);
  }
  return partes.join("\n");
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "Sesión no válida o expirada." }, { status: 401 });
    if (!tienePermiso(sesion.rol, "caja")) return NextResponse.json({ ok: false, error: "No tiene permiso para descargar planillas." }, { status: 403 });

  try {
    const cuerpo = await request.json();
    const correlativo = typeof cuerpo.correlativo === "string" ? cuerpo.correlativo.trim() : "";
    if (!/^\d{1,8}\/\d{4}$/.test(correlativo)) {
      return NextResponse.json({ ok: false, error: "El correlativo del recibo no es válido." }, { status: 400 });
    }
    if (!MODULO_CAJA_SHEET_ID || !REGISTRO_CONSULAR_SHEET_ID) {
      return NextResponse.json({ ok: false, error: "No están configuradas las hojas de Caja y Registro Consular." }, { status: 500 });
    }

    const [cajaRespuesta, detalleRespuesta, registroRespuesta] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "Caja!A:S" }),
      sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "DetalleCaja!A:D" }),
      sheets.spreadsheets.values.get({ spreadsheetId: REGISTRO_CONSULAR_SHEET_ID, range: "Respuestas de formulario 1!A:O" }),
    ]);
    const filasCaja = cajaRespuesta.data.values || [];
    const filaCajaIndice = filasCaja.findIndex((fila) => String(fila[1] ?? "").trim() === correlativo);
    if (filaCajaIndice < 0) return NextResponse.json({ ok: false, error: "No se encontró el recibo solicitado." }, { status: 404 });
    const filaCaja = filasCaja[filaCajaIndice];
    if (sesion.rol === "caja" && String(sesion.caja ?? "").trim() !== String(filaCaja[8] ?? "").trim()) {
      return NextResponse.json({ ok: false, error: "Solo puede descargar planillas de recibos de su caja asignada." }, { status: 403 });
    }
    if (String(filaCaja[10] ?? "").trim().toUpperCase() !== "GENERADO") {
      return NextResponse.json({ ok: false, error: "El recibo no está en estado Generado; no se puede emitir la planilla." }, { status: 409 });
    }

    const detallePlanillas = (detalleRespuesta.data.values || []).filter((fila) =>
      String(fila[0] ?? "").trim() === correlativo && Object.hasOwn(TIPOS_PLANILLA_SLAE, String(fila[1] ?? "").trim().toUpperCase()),
    );
    if (!detallePlanillas.length) return NextResponse.json({ ok: false, error: "El recibo no contiene actuaciones que requieran planilla." }, { status: 404 });

    const cedula = String(filaCaja[11] ?? "").trim();
    const pasaporte = String(filaCaja[12] ?? "").trim();
    const documentoPrincipal = String(filaCaja[2] ?? "").trim();
    const documentosBuscados = new Set([cedula, pasaporte, documentoPrincipal].map(claveDocumento).filter(Boolean));
    const filasRegistro = registroRespuesta.data.values || [];
    const indiceRegistro = filasRegistro.findIndex((fila, indice) => indice > 0 && (
      documentosBuscados.has(claveDocumento(fila[1])) || documentosBuscados.has(claveDocumento(fila[14]))
    ));
    if (indiceRegistro < 1) return NextResponse.json({ ok: false, error: "No se encontraron los datos del ciudadano en Registro Consular." }, { status: 409 });

    const ciudadano = filasRegistro[indiceRegistro];
    const nombres = [ciudadano[2], ciudadano[3]].map((valor) => String(valor ?? "").trim()).filter(Boolean).join(" ");
    const apellidos = [ciudadano[4], ciudadano[5]].map((valor) => String(valor ?? "").trim()).filter(Boolean).join(" ");
    const correo = String(filaCaja[4] || ciudadano[11] || "").trim();
    const documento = documentoPrincipal || cedula || pasaporte;
    const observaciones = String(filaCaja[18] ?? "");
    if (!nombres || !apellidos || !correo || !documento) {
      return NextResponse.json({ ok: false, error: "Faltan datos obligatorios del ciudadano en Caja o Registro Consular." }, { status: 409 });
    }

    const [fechaNacimientoRespuesta, fechaReciboRespuesta] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: `'Respuestas de formulario 1'!N${indiceRegistro + 1}`,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: MODULO_CAJA_SHEET_ID,
        range: `Caja!A${filaCajaIndice + 1}`,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      }),
    ]);
    const fechaNacimiento = fechaNacimientoRespuesta.data.values?.[0]?.[0] ?? ciudadano[13];
    const fechaRecibo = fechaReciboRespuesta.data.values?.[0]?.[0] ?? filaCaja[0];
    if ((typeof fechaNacimiento !== "string" && typeof fechaNacimiento !== "number") || (typeof fechaRecibo !== "string" && typeof fechaRecibo !== "number")) {
      return NextResponse.json({ ok: false, error: "No se pudieron leer las fechas del recibo y del registro consular." }, { status: 409 });
    }
    const indicesModificacion: Record<string, number> = {};
    const planillas: Array<{ buffer: Buffer; nombre: string }> = [];

    for (const fila of detallePlanillas) {
      const codigo = String(fila[1] ?? "").trim().toUpperCase() as keyof typeof TIPOS_PLANILLA_SLAE;
      if (codigo.startsWith("MOD-") || codigo === "RES-SAIME") {
        indicesModificacion[codigo] = (indicesModificacion[codigo] || 0) + 1;
      }
      const datos: DatosPlanillaSlae = {
        codigo,
        documento,
        fechaNacimiento,
        nombres,
        apellidos,
        correo,
        fechaRecibo,
        correlativo,
        observacion: codigo.startsWith("MOD-") || codigo === "RES-SAIME"
          ? observacionModificacion(observaciones, codigo, indicesModificacion[codigo])
          : "",
      };
      planillas.push({ buffer: await generarPlanillaSlae(datos), nombre: nombreArchivoPlanillaSlae(datos) });
    }

    if (planillas.length === 1) {
      const [planilla] = planillas;
      return new NextResponse(new Uint8Array(planilla.buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${planilla.nombre}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const zip = new JSZip();
    for (const planilla of planillas) zip.file(planilla.nombre, planilla.buffer);
    const archivo = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    return new NextResponse(new Uint8Array(archivo), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Planillas_Caja_${correlativo.replace("/", "-")}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando planilla SLAE.", error instanceof Error ? error.message : "Error desconocido.");
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No fue posible generar la planilla SLAE." }, { status: 500 });
  }
}
