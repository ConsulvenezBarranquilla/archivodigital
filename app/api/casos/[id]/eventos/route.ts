import { NextRequest, NextResponse } from "next/server";

import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import { agregarEventoCaso, ErrorCasoOcupado, ErrorValidacionCaso } from "@/lib/casosConsulares";

type ContextoRuta = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, contexto: ContextoRuta) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const { id } = await contexto.params;
    const body = await request.json();
    const caso = await agregarEventoCaso(id, body, acceso.sesion.usuario);
    if (!caso) return NextResponse.json({ ok: false, error: "No se encontró el caso." }, { status: 404 });
    return NextResponse.json({ ok: true, caso });
  } catch (error) {
    const validacion = error instanceof ErrorValidacionCaso;
    const ocupado = error instanceof ErrorCasoOcupado;
    const mensaje = validacion || ocupado ? (error as Error).message : "No fue posible añadir el evento.";
    console.error("Error POST /api/casos/[id]/eventos:", error);
    return NextResponse.json({ ok: false, error: mensaje }, { status: validacion ? 400 : ocupado ? 409 : 500 });
  }
}
