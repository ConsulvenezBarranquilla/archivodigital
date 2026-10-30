
import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import {
  cambiarEstadoTurno,
  listarTurnos,
  obtenerTurno,
} from "@/lib/turnero";

export const dynamic = "force-dynamic";

const ACCIONES_VALIDAS = new Set([
  "llamar",
  "iniciar_atencion",
  "finalizar_atencion",
  "atendido",
]);

function permisoCola(rol: string) {
  if (rol === "admin") return true;
  if (rol === "recepcion") return tienePermiso(rol, "recepcion");
  if (rol === "caja") return tienePermiso(rol, "caja");
  if (rol === "analista") return tienePermiso(rol, "atencion");
  return false;
}

function turnoVisible(
  turno: Awaited<ReturnType<typeof listarTurnos>>[number]
) {
  const llamadoEnMs =
    turno.estado === "llamado"
      ? Number(turno.llamadoEnMs) ||
        Date.parse(turno.fechaActualizacion) ||
        0
      : 0;

  return {
    id: turno.id,
    nombre: turno.nombre,
    documento: turno.documento,
    tipoVisita: turno.tipoVisita,
    estado: turno.estado,
    cola: turno.cola,
    etapa: turno.etapa,
    actuacion: turno.actuacion,
    cantidadActuaciones: turno.cantidadActuaciones || 1,
    correlativo: turno.correlativo,
    creadoEl: turno.creadoEl,
    usuario: turno.usuario,
    llamadoEnMs,
  };
}

function respuestaError(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status }
  );
}

async function obtenerSesionAutorizada(
  accion: "consultar" | "modificar"
) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return {
      sesion: null,
      respuesta: respuestaError(
        "Sesión no válida o expirada.",
        401
      ),
    };
  }

  if (!permisoCola(sesion.rol)) {
    return {
      sesion: null,
      respuesta: respuestaError(
        accion === "consultar"
          ? "No tiene permiso para consultar turnos."
          : "No tiene permiso para modificar turnos.",
        403
      ),
    };
  }

  return { sesion, respuesta: null };
}

export async function GET(request: Request) {
  const { sesion, respuesta } =
    await obtenerSesionAutorizada("consultar");

  if (respuesta || !sesion) return respuesta;

  try {
    const solicitada = new URL(request.url).searchParams.get("cola");

    if (
      solicitada === "analistas" &&
      sesion.rol !== "admin" &&
      sesion.rol !== "analista"
    ) {
      return respuestaError(
        "No tiene permiso para consultar la cola de Analistas.",
        403
      );
    }

    if (
      solicitada === "visitas" &&
      sesion.rol !== "admin" &&
      sesion.rol !== "caja" &&
      sesion.rol !== "recepcion"
    ) {
      return respuestaError(
        "No tiene permiso para consultar la cola de visitas.",
        403
      );
    }

    const cola =
      solicitada === "analistas"
        ? "analistas"
        : solicitada === "visitas"
          ? "visitas"
          : sesion.rol === "analista"
            ? "analistas"
            : sesion.rol === "admin"
              ? undefined
              : "visitas";

    const tipos: ("Información" | "Trámite")[] | undefined =
  sesion.rol === "recepcion"
    ? ["Información"]
    : sesion.rol === "caja"
      ? ["Información", "Trámite"]
      : undefined;

    const turnos = await listarTurnos({ cola, tipos });

    return NextResponse.json(
      {
        ok: true,
        turnos: turnos.map(turnoVisible),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error consultando turnos:", error);

    return respuestaError(
      "No fue posible consultar los turnos.",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  const { sesion, respuesta } =
    await obtenerSesionAutorizada("modificar");

  if (respuesta || !sesion) return respuesta;

  try {
    const body = await req.json();

    const id =
      typeof body.id === "string" ? body.id : "";

    const accion =
      typeof body.accion === "string" ? body.accion : "";

    if (
      !/^T-[a-f0-9]{24}$/.test(id) ||
      !ACCIONES_VALIDAS.has(accion)
    ) {
      return respuestaError(
        "Identificador o acción no válidos.",
        400
      );
    }

    const turno = await obtenerTurno(id);

    if (!turno) {
      return respuestaError(
        "No se encontró el turno solicitado.",
        404
      );
    }

    if (
      sesion.rol === "recepcion" &&
      turno.tipoVisita !== "Información"
    ) {
      return respuestaError(
        "Recepción solo puede gestionar turnos de Información.",
        403
      );
    }

    if (
      sesion.rol === "caja" &&
      !["Información", "Trámite"].includes(turno.tipoVisita)
    ) {
      return respuestaError(
        "Caja solo puede gestionar turnos de Información o Trámite.",
        403
      );
    }

    if (
      sesion.rol === "caja" &&
      turno.cola !== "visitas"
    ) {
      return respuestaError(
        "Caja no puede modificar atenciones de analistas.",
        403
      );
    }

    if (
      (accion === "iniciar_atencion" ||
        accion === "finalizar_atencion") &&
      !["caja", "admin"].includes(sesion.rol)
    ) {
      return respuestaError(
        "Solo Caja puede iniciar o finalizar esta atención.",
        403
      );
    }

    if (
      (accion === "iniciar_atencion" ||
        accion === "finalizar_atencion") &&
      turno.cola !== "visitas"
    ) {
      return respuestaError(
        "Esta acción solo aplica a la cola de Caja.",
        403
      );
    }

    if (
      accion === "atendido" &&
      sesion.rol === "caja"
    ) {
      return respuestaError(
        "En Caja, inicia la atención y luego usa Finalizar atención.",
        403
      );
    }

    if (
      accion === "finalizar_atencion" &&
      turno.estado !== "en_atencion"
    ) {
      return respuestaError(
        "La atención todavía no se ha iniciado.",
        409
      );
    }

    const tipoOperador =
      turno.cola === "analistas"
        ? "analista"
        : sesion.rol === "recepcion"
          ? "recepcion"
          : "caja";

    const actualizado = await cambiarEstadoTurno(
      id,
      accion,
      sesion.usuario,
      turno.cola === "analistas"
        ? ""
        : sesion.caja || "",
      tipoOperador
    );

    return NextResponse.json({
      ok: true,
      turno: turnoVisible(actualizado),
    });
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No fue posible actualizar el turno.";

    const status =
      mensaje.includes("ya fue atendido") ||
      mensaje.includes("volver a llamar")
        ? 409
        : 500;

    return respuestaError(mensaje, status);
  }
}
