import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { buscarExpedienteCiudadano, guardarDatosEditablesExpediente, normalizarDocumentoExpediente, type HijoExpediente } from "@/lib/expedienteCiudadano";
import { subirArchivoDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

function limitarTexto(valor: unknown, maximo = 500): string {
  return String(valor ?? "").trim().slice(0, maximo);
}

export async function GET(request: NextRequest) {
  const autorizacion = await exigirPermiso("expediente-ciudadano");
  if (autorizacion.respuesta) return autorizacion.respuesta;

  try {
    const documento = request.nextUrl.searchParams.get("documento")?.trim() ?? "";
    if (!documento) {
      return NextResponse.json({ ok: false, error: "Ingrese el número de documento." }, { status: 400 });
    }

    const { expediente } = await buscarExpedienteCiudadano(documento);
    if (!expediente) {
      return NextResponse.json({ ok: true, encontrado: false });
    }

    return NextResponse.json({
      ok: true,
      encontrado: true,
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
    if (typeof body?.tieneHijos !== "boolean") {
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
    await guardarDatosEditablesExpediente(expediente.documento, cambios, autorizacion.sesion.usuario);

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
