import { NextRequest, NextResponse } from "next/server";

import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import {
  crearCasoConsular,
  ErrorCasoOcupado,
  ErrorValidacionCaso,
  listarPendientesRegistroCivil,
  listarCasosConsulares,
  listarCasosConsularesConEliminados,
  crearCasoRegistroCivilDesdeCaja,
  registrarVerificacionIdentidad,
} from "@/lib/casosConsulares";
import { CATEGORIAS_CASO } from "@/lib/casosConsularesTypes";

export async function GET(request: NextRequest) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const categoria = request.nextUrl.searchParams.get("categoria");
    if (categoria && !CATEGORIAS_CASO.includes(categoria as (typeof CATEGORIAS_CASO)[number])) {
      return NextResponse.json({ ok: false, error: "Categoría no válida." }, { status: 400 });
    }
    const casosConEliminados = await listarCasosConsularesConEliminados();
    const casos = casosConEliminados.filter((caso) => caso.estado !== "Eliminado");
    const pendientesRegistroCivil = await listarPendientesRegistroCivil(casosConEliminados);
    return NextResponse.json({ ok: true, casos: categoria ? casos.filter((caso) => caso.categoria === categoria) : casos, pendientesRegistroCivil });
  } catch (error) {
    console.error("Error GET /api/casos:", error);
    return NextResponse.json({ ok: false, error: "No fue posible cargar los casos consulares." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  try {
    const body = await request.json();
    if (!CATEGORIAS_CASO.includes(body?.categoria)) {
      return NextResponse.json({ ok: false, error: "Selecciona una categoría válida." }, { status: 400 });
    }
    if (body.categoria === "Registro Civil") {
      if (!body?.referenciaCaja?.recibo || !body?.referenciaCaja?.codigoActuacion) {
        return NextResponse.json({ ok: false, error: "Registro Civil debe iniciar desde una actuación vigente de Caja." }, { status: 400 });
      }
      const caso = await crearCasoRegistroCivilDesdeCaja(
        String(body.referenciaCaja.recibo),
        String(body.referenciaCaja.codigoActuacion),
        body.datos,
        acceso.sesion.usuario
      );
      return NextResponse.json({ ok: true, caso }, { status: 201 });
    }
    if (body.categoria === "Verificación de Identidad") {
      const caso = await registrarVerificacionIdentidad(body.datos, acceso.sesion.usuario);
      return NextResponse.json({ ok: true, caso }, { status: 201 });
    }
    const caso = await crearCasoConsular(body.categoria, body.datos, acceso.sesion.usuario);
    return NextResponse.json({ ok: true, caso }, { status: 201 });
  } catch (error) {
    const validacion = error instanceof ErrorValidacionCaso;
    const ocupado = error instanceof ErrorCasoOcupado;
    const mensaje = validacion || ocupado ? (error as Error).message : "No fue posible crear el caso.";
    console.error("Error POST /api/casos:", error);
    return NextResponse.json({ ok: false, error: mensaje }, { status: validacion ? 400 : ocupado ? 409 : 500 });
  }
}
