import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { cambiarEstadoTurno, listarTurnos, obtenerTurno } from "@/lib/turnero";

export const dynamic = "force-dynamic";

function permisoCola(rol: string) {
  if (rol === "admin") return true;
  if (rol === "recepcion") return tienePermiso(rol, "recepcion");
  if (rol === "caja") return tienePermiso(rol, "caja");
  if (rol === "analista") return tienePermiso(rol, "atencion");
  return false;
}

function turnoVisible(turno: Awaited<ReturnType<typeof listarTurnos>>[number]) {
  return {
    id: turno.id,
    nombre: turno.nombre,
    tipoVisita: turno.tipoVisita,
    estado: turno.estado,
    cola: turno.cola,
    etapa: turno.etapa,
    actuacion: turno.actuacion,
    correlativo: turno.correlativo,
    creadoEl: turno.creadoEl,
    usuario: turno.usuario,
  };
}

export async function GET(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "Sesión no válida o expirada." }, { status: 401 });
  if (!permisoCola(sesion.rol)) return NextResponse.json({ ok: false, error: "No tiene permiso para consultar turnos." }, { status: 403 });

  try {
    const solicitada = new URL(request.url).searchParams.get("cola");
    if (solicitada === "analistas" && sesion.rol !== "admin" && sesion.rol !== "analista") {
      return NextResponse.json({ ok: false, error: "No tiene permiso para consultar la cola de Analistas." }, { status: 403 });
    }
    if (solicitada === "visitas" && sesion.rol !== "admin" && sesion.rol !== "caja" && sesion.rol !== "recepcion") {
      return NextResponse.json({ ok: false, error: "No tiene permiso para consultar la cola de visitas." }, { status: 403 });
    }
    const cola = solicitada === "analistas" ? "analistas" : solicitada === "visitas" ? "visitas" : sesion.rol === "analista" ? "analistas" : sesion.rol === "admin" ? undefined : "visitas";
    const tipos = sesion.rol === "recepcion" ? ["Información" as const] : sesion.rol === "caja" ? ["Información" as const, "Trámite" as const] : undefined;
    const turnos = await listarTurnos({ cola, tipos });
    return NextResponse.json({ ok: true, turnos: turnos.map(turnoVisible) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error consultando turnos:", error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar los turnos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "Sesión no válida o expirada." }, { status: 401 });
  if (!permisoCola(sesion.rol)) return NextResponse.json({ ok: false, error: "No tiene permiso para modificar turnos." }, { status: 403 });
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const accion = body.accion;
    if (!/^T-[a-f0-9]{24}$/.test(id) || !["llamar", "atendido"].includes(accion)) {
      return NextResponse.json({ ok: false, error: "Identificador o acción no válidos." }, { status: 400 });
    }
    const turno = await obtenerTurno(id);
    if (!turno) return NextResponse.json({ ok: false, error: "No se encontró el turno solicitado." }, { status: 404 });
    if (sesion.rol === "recepcion" && turno.tipoVisita !== "Información") {
      return NextResponse.json({ ok: false, error: "Recepción solo puede gestionar turnos de Información." }, { status: 403 });
    }
    if (sesion.rol === "caja" && !["Información", "Trámite"].includes(turno.tipoVisita)) {
      return NextResponse.json({ ok: false, error: "Caja solo puede gestionar turnos de Información o Trámite." }, { status: 403 });
    }
    if (sesion.rol === "caja" && turno.cola !== "visitas") {
      return NextResponse.json({ ok: false, error: "Caja no puede modificar atenciones de analistas." }, { status: 403 });
    }
    const tipoOperador = turno.cola === "analistas" ? "analista" : sesion.rol === "recepcion" ? "recepcion" : "caja";
    const actualizado = await cambiarEstadoTurno(id, accion, sesion.usuario, turno.cola === "analistas" ? "" : sesion.caja || "", tipoOperador);
    return NextResponse.json({ ok: true, turno: turnoVisible(actualizado) });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No fue posible actualizar el turno.";
    return NextResponse.json({ ok: false, error: mensaje }, { status: mensaje.includes("ya fue atendido") || mensaje.includes("ya fue llamado") ? 409 : 500 });
  }
}
