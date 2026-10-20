import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { actualizarDocumentoExpedienteCiudadano, buscarExpedienteCiudadano, guardarDatosEditablesExpediente, normalizarDocumentoExpediente, type HijoExpediente } from "@/lib/expedienteCiudadano";
import { obtenerDocumentoPrincipal } from "@/lib/googleSheets";
import { subirArchivoDrive } from "@/lib/googleDrive";
import { sheets, REGISTRO_CONSULAR_SHEET_ID, MODULO_CAJA_SHEET_ID } from "@/lib/googleSheets";
import { listarCasosConsularesSoloLectura } from "@/lib/casosConsulares";
import type { CasoConsular } from "@/lib/casosConsularesTypes";

export const runtime = "nodejs";

function limitarTexto(valor: unknown, maximo = 500): string {
  return String(valor ?? "").trim().slice(0, maximo);
}

function identificadoresCaso(caso: CasoConsular): string[] {
  const datos = caso.datos;
  const valores: unknown[] = [datos.cedula, datos.numeroDocumento, datos.documentoIdentidad, datos.nui, datos.pasaporte];
  for (const verificacion of Array.isArray(datos.verificaciones) ? datos.verificaciones : []) {
    if (verificacion && typeof verificacion === "object") valores.push((verificacion as Record<string, unknown>).numeroDocumento);
  }
  for (const persona of Array.isArray(datos.personasInvolucradas) ? datos.personasInvolucradas : []) {
    if (persona && typeof persona === "object") valores.push((persona as Record<string, unknown>).cedula);
  }
  for (const presentante of Array.isArray(datos.presentantes) ? datos.presentantes : []) {
    if (presentante && typeof presentante === "object") valores.push((presentante as Record<string, unknown>).documento);
  }
  return valores.map(normalizarDocumentoExpediente).filter(Boolean);
}

function nombreCasoParaTabla(caso: CasoConsular): string {
  if (caso.categoria !== "Registro Civil") return caso.nombre;
  const titulares = Array.isArray(caso.datos.titulares) ? caso.datos.titulares : [];
  const titular = titulares.find((valor) => typeof valor === "string" && valor.trim());
  if (typeof titular === "string") return titular;
  const presentantes = Array.isArray(caso.datos.presentantes) ? caso.datos.presentantes : [];
  const presentante = presentantes.find((valor) => valor && typeof valor === "object" && typeof (valor as Record<string, unknown>).nombre === "string" && String((valor as Record<string, unknown>).nombre).trim());
  return presentante ? String((presentante as Record<string, unknown>).nombre) : caso.nombre;
}

export async function GET(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;

  try {
    const documento = request.nextUrl.searchParams.get("documento")?.trim() ?? "";
    if (!documento) {
      return NextResponse.json({ ok: false, error: "Ingrese el número de documento." }, { status: 400 });
    }

    const documentoNormalizado = normalizarDocumentoExpediente(documento);
    const casos = await listarCasosConsularesSoloLectura();
    const casosRelacionados = casos
      .filter((caso) => identificadoresCaso(caso).includes(documentoNormalizado))
      .map((caso) => ({
        correlativo: caso.correlativo,
        nombre: nombreCasoParaTabla(caso),
        tipo: caso.tipo,
        categoria: String(caso.categoria),
        fecha: caso.fecha,
        estado: caso.estado,
      }));

    const { expediente } = await buscarExpedienteCiudadano(documento);
    if (!expediente) {
      return NextResponse.json({ ok: true, encontrado: false, casos: casosRelacionados });
    }

    return NextResponse.json({
      ok: true,
      encontrado: true,
      casos: casosRelacionados,
      puedeEditar: ['admin', 'analista'].includes(autorizacion.sesion.rol),
      expediente: {
        ...expediente,
        fotoUrl: expediente.datosEditables.fotoOrigen === "ninguna"
          ? ""
          : `/api/expedienteciudadano/foto?documento=${encodeURIComponent(expediente.documento)}&v=${encodeURIComponent(expediente.datosEditables.actualizadoEl || expediente.datosEditables.fotoOrigen)}`,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error GET /api/expedienteciudadano:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ ok: false, error: "No fue posible cargar el expediente ciudadano." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;
  if (!['admin', 'analista'].includes(autorizacion.sesion.rol)) {
    return NextResponse.json({ ok: false, error: "Solo administración y analistas pueden editar el expediente." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const documento = limitarTexto(body?.documento, 100);
    if (!documento || !normalizarDocumentoExpediente(documento)) {
      return NextResponse.json({ ok: false, error: "Número de documento inválido." }, { status: 400 });
    }

    const { expediente } = await buscarExpedienteCiudadano(documento);
    if (!expediente) {
      return NextResponse.json({ ok: false, error: "No se encontró ese documento en el Registro Consular." }, { status: 404 });
    }

    if (Array.isArray(body?.datosGenerales)) {
      const datosGenerales = body.datosGenerales.map((valor: unknown) => limitarTexto(valor, 500));
      if (datosGenerales.length !== 18) {
        return NextResponse.json({ ok: false, error: "La información general debe incluir todos los campos del registro." }, { status: 400 });
      }
      const cedulaNueva = datosGenerales[0].trim().toUpperCase();
      const pasaporteNuevo = datosGenerales[13].trim().toUpperCase();
      if (!cedulaNueva && !pasaporteNuevo) {
        return NextResponse.json({ ok: false, error: "Debe conservar una cédula o un pasaporte." }, { status: 400 });
      }

      const respuestaRegistro = await sheets.spreadsheets.values.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: "'Respuestas de formulario 1'!A:S",
      });
      const filasRegistro = respuestaRegistro.data.values ?? [];
      const original = normalizarDocumentoExpediente(body?.documentoOriginal || documento);
      const filaCiudadano = filasRegistro.findIndex((fila, index) => index > 0 && (
        normalizarDocumentoExpediente(fila[1]) === original || normalizarDocumentoExpediente(fila[14]) === original
      ));
      if (filaCiudadano < 1) {
        return NextResponse.json({ ok: false, error: "No se encontró el registro original del ciudadano." }, { status: 404 });
      }
      for (let index = 1; index < filasRegistro.length; index++) {
        if (index === filaCiudadano) continue;
        const cedulaExistente = String(filasRegistro[index][1] ?? "").trim().toUpperCase();
        const pasaporteExistente = String(filasRegistro[index][14] ?? "").trim().toUpperCase();
        if ((cedulaNueva && cedulaNueva === cedulaExistente) || (pasaporteNuevo && pasaporteNuevo === pasaporteExistente)) {
          return NextResponse.json({ ok: false, error: "La cédula o el pasaporte ya pertenece a otro ciudadano." }, { status: 409 });
        }
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: `'Respuestas de formulario 1'!B${filaCiudadano + 1}:S${filaCiudadano + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [datosGenerales] },
      });

      const documentoNuevo = obtenerDocumentoPrincipal(cedulaNueva, pasaporteNuevo, datosGenerales[5]) || cedulaNueva || pasaporteNuevo;
      await actualizarDocumentoExpedienteCiudadano(expediente.documento, documentoNuevo);

      const respuestaCaja = await sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "Caja!A:N" });
      const nombreCompleto = datosGenerales.slice(1, 5).map((valor: string) => valor.trim()).filter(Boolean).join(" ");
      const actualizacionesCaja = (respuestaCaja.data.values ?? []).slice(1).flatMap((fila, index) => {
        const documentosFila = [fila[2], fila[11], fila[12]].map(normalizarDocumentoExpediente);
        if (!documentosFila.includes(original)) return [];
        return [{
          range: `Caja!C${index + 2}:N${index + 2}`,
          values: [[datosGenerales[0] || datosGenerales[13], nombreCompleto, datosGenerales[10], fila[5], fila[6], fila[7], fila[8], fila[9], fila[10], datosGenerales[0], datosGenerales[13], datosGenerales[5]]],
        }];
      });
      if (actualizacionesCaja.length) {
        await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: MODULO_CAJA_SHEET_ID, requestBody: { valueInputOption: "USER_ENTERED", data: actualizacionesCaja } });
      }
    }

    const hijosEntrada = Array.isArray(body?.hijos)
      ? body.hijos as Array<Record<string, unknown>>
      : [];
    const hijos = hijosEntrada.map((hijo) => ({
      nombre: limitarTexto(hijo?.nombre, 200),
      genero: limitarTexto(hijo?.genero, 20),
      fechaNacimiento: limitarTexto(hijo?.fechaNacimiento, 10),
    }));
    const cambios: {
      direccionColombia: string;
      direccionVenezuela: string;
      contactoColombiaNombre: string;
      contactoColombiaTelefono: string;
      contactoExtranjeroNombre: string;
      contactoExtranjeroTelefono: string;
      tieneHijos: boolean;
      hijos: HijoExpediente[];
    } = {
      direccionColombia: limitarTexto(body?.direccionColombia),
      direccionVenezuela: limitarTexto(body?.direccionVenezuela),
      contactoColombiaNombre: limitarTexto(body?.contactoColombiaNombre, 200),
      contactoColombiaTelefono: limitarTexto(body?.contactoColombiaTelefono, 80),
      contactoExtranjeroNombre: limitarTexto(body?.contactoExtranjeroNombre, 200),
      contactoExtranjeroTelefono: limitarTexto(body?.contactoExtranjeroTelefono, 80),
      tieneHijos: typeof body?.tieneHijos === "boolean" ? body.tieneHijos : null,
      hijos: [],
    };
    if (body?.tieneHijos !== undefined && typeof body.tieneHijos !== "boolean") {
      return NextResponse.json({ ok: false, error: "Indique si el ciudadano tiene hijos." }, { status: 400 });
    }
    if (cambios.tieneHijos && (
      hijos.length === 0 ||
      hijos.some((hijo) =>
        !hijo.nombre ||
        (hijo.genero !== "Masculino" && hijo.genero !== "Femenino") ||
        !/^\d{4}-\d{2}-\d{2}$/.test(hijo.fechaNacimiento)
      )
    )) {
      return NextResponse.json({ ok: false, error: "Complete nombre, género y fecha de nacimiento de cada hijo." }, { status: 400 });
    }
    if (cambios.tieneHijos) cambios.hijos = hijos as HijoExpediente[];
    if (typeof body?.tieneHijos === "boolean") {
      await guardarDatosEditablesExpediente(expediente.documento, cambios, autorizacion.sesion.usuario);
    }

    return NextResponse.json({ ok: true, mensaje: "Datos del expediente guardados." });
  } catch (error) {
    console.error("Error PUT /api/expedienteciudadano:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ ok: false, error: "No fue posible guardar los datos del expediente." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;
  if (!['admin', 'analista'].includes(autorizacion.sesion.rol)) {
    return NextResponse.json({ ok: false, error: "Solo administración y analistas pueden editar el expediente." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const documentoSolicitado = limitarTexto(formData.get("documento"), 100);
    const archivo = formData.get("foto");
    if (!(archivo instanceof File)) {
      return NextResponse.json({ ok: false, error: "Seleccione una imagen." }, { status: 400 });
    }
    if (!documentoSolicitado || !normalizarDocumentoExpediente(documentoSolicitado)) {
      return NextResponse.json({ ok: false, error: "Número de documento inválido." }, { status: 400 });
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(archivo.type)) {
      return NextResponse.json({ ok: false, error: "La foto debe ser JPG, PNG o WEBP." }, { status: 400 });
    }
    if (archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "La foto no puede superar 10 MB." }, { status: 400 });
    }

    const { expediente, fotoDriveId } = await buscarExpedienteCiudadano(documentoSolicitado);
    if (!expediente) {
      return NextResponse.json({ ok: false, error: "No se encontró ese documento en el Registro Consular." }, { status: 404 });
    }

    const documentoSeguro = normalizarDocumentoExpediente(expediente.documento);
    const subida = await subirArchivoDrive({
      archivo,
      categoria: "CONSTANCIA_REGISTRO",
      tipoArchivo: "FOTO_CARNET",
      documentoId: `EXPEDIENTE-${documentoSeguro}`,
      archivoIdExistente: expediente.datosEditables.fotoOrigen === "expediente" ? fotoDriveId : undefined,
    });
    await guardarDatosEditablesExpediente(expediente.documento, { fotoDriveId: subida.id }, autorizacion.sesion.usuario);

    return NextResponse.json({ ok: true, mensaje: "Foto guardada en Google Drive." });
  } catch (error) {
    console.error("Error POST /api/expedienteciudadano:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ ok: false, error: "No fue posible guardar la foto del ciudadano." }, { status: 500 });
  }
}
