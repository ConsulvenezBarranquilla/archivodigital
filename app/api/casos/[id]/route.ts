import { NextRequest, NextResponse } from "next/server";

import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import {
  actualizarCasoConsularPorId,
  actualizarEstadoCaso,
  consultarCasoConsular,
  ErrorCasoOcupado,
  ErrorValidacionCaso,
} from "@/lib/casosConsulares";
import { CATEGORIAS_CASO } from "@/lib/casosConsularesTypes";

type ContextoRuta = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, contexto: ContextoRuta) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const { id } = await contexto.params;
    const caso = await consultarCasoConsular(id);
    if (!caso) return NextResponse.json({ ok: false, error: "No se encontró el caso." }, { status: 404 });
    return NextResponse.json({ ok: true, caso });
  } catch (error) {
    console.error("Error GET /api/casos/[id]:", error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar el caso." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, contexto: ContextoRuta) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const { id } = await contexto.params;
    const body = await request.json();
    if (!CATEGORIAS_CASO.includes(body?.categoria)) {
      return NextResponse.json({ ok: false, error: "Categoría no válida." }, { status: 400 });
    }
    const caso = await actualizarCasoConsularPorId(id, body.categoria, body.datos, acceso.sesion.usuario);
    if (!caso) return NextResponse.json({ ok: false, error: "No se encontró el caso." }, { status: 404 });
    return NextResponse.json({ ok: true, caso });
  } catch (error) {
    const validacion = error instanceof ErrorValidacionCaso;
    const ocupado = error instanceof ErrorCasoOcupado;
    const mensaje = validacion || ocupado ? (error as Error).message : "No fue posible actualizar el caso.";
    console.error("Error PUT /api/casos/[id]:", error);
    return NextResponse.json({ ok: false, error: mensaje }, { status: validacion ? 400 : ocupado ? 409 : 500 });
  }
}

export async function PATCH(request: NextRequest, contexto: ContextoRuta) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  if (acceso.sesion.rol !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo un administrador puede cambiar el estado del caso." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (body?.estado !== "Abierto" && body?.estado !== "Finalizado") {
      return NextResponse.json({ ok: false, error: "Estado de caso no válido." }, { status: 400 });
    }
    const { id } = await contexto.params;
    const caso = await actualizarEstadoCaso(id, body.estado, acceso.sesion.usuario);
    if (!caso) return NextResponse.json({ ok: false, error: "No se encontró el caso." }, { status: 404 });
    return NextResponse.json({ ok: true, caso });
  } catch (error) {
    const ocupado = error instanceof ErrorCasoOcupado;
    console.error("Error PATCH /api/casos/[id]:", error);
    return NextResponse.json({ ok: false, error: ocupado ? error.message : "No fue posible actualizar el estado del caso." }, { status: ocupado ? 409 : 500 });
  }
}
