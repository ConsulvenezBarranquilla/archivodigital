import { NextRequest, NextResponse } from "next/server";
import { fechaHoraActual } from "@/lib/fechas";
import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  invalidarCacheHojaGoogle,
  actualizarRangosAtomico,
} from "@/lib/googleSheets";
import { exigirPermiso } from "@/lib/autorizacion";
import { conBloqueoGestionConsular } from "@/lib/bloqueo-sgc";

export async function POST(req: NextRequest) {
  try {
    const autorizacion = await exigirPermiso("sgc");
    if (autorizacion.respuesta) return autorizacion.respuesta;

    const usuario = autorizacion.sesion.nombre;
    if (!usuario?.trim()) {
      return NextResponse.json({ ok: false, error: "Usuario no identificado." }, { status: 401 });
    }

    const entrada = await req.json();
    const filaGestionSolicitada = Number(entrada.filaGestion);
    const filaDetalleSolicitada = Number(entrada.filaDetalle);
    const numeroActuacion = String(entrada.numeroActuacion ?? "").trim();
    const correlativoSolicitado = String(entrada.recibo ?? "").trim();
    const codigoSolicitado = String(entrada.codigo ?? "").trim().toUpperCase();
    const observaciones = String(entrada.observaciones ?? "").trim();

    return await conBloqueoGestionConsular(async () => {
      const [gestionResponse, detalleResponse] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "GestionConsular!A:M" }),
        sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "DetalleCaja!A:H" }),
      ]);
      const gestion: unknown[][] = gestionResponse.data.values || [];
      const detalle: unknown[][] = detalleResponse.data.values || [];
      const encabezadoM = String(gestion[0]?.[12] ?? "").trim();
      if (encabezadoM && encabezadoM !== "FilaDetalle") {
        return NextResponse.json({ ok: false, error: "La columna M de GestionConsular ya está ocupada." }, { status: 409 });
      }
      const indiceGestion = Number.isInteger(filaGestionSolicitada) && filaGestionSolicitada >= 2
        ? filaGestionSolicitada - 1
        : -1;

      let filaGestion: unknown[] | undefined;
      let filaGestionReal = -1;
      if (indiceGestion > 0) {
        filaGestion = gestion[indiceGestion];
        filaGestionReal = filaGestion ? indiceGestion + 1 : -1;
      } else if (numeroActuacion && correlativoSolicitado && codigoSolicitado) {
        const candidatas = gestion.slice(1).map((fila, indice) => ({ fila, numeroFila: indice + 2 }))
          .filter(({ fila }) =>
            String(fila[0] ?? "").trim() === correlativoSolicitado &&
            String(fila[1] ?? "").trim().toUpperCase() === codigoSolicitado &&
            String(fila[11] ?? "").trim() === numeroActuacion &&
            ["VINCULADO", "SIN PLANILLA"].includes(String(fila[6] ?? "").trim().toUpperCase())
          );
        if (candidatas.length === 1) {
          filaGestion = candidatas[0].fila;
          filaGestionReal = candidatas[0].numeroFila;
        } else if (candidatas.length > 1) {
          return NextResponse.json({ ok: false, error: "La actuación coincide con varios registros. Actualiza la lista para identificar su fila exacta." }, { status: 409 });
        }
      }

      if (!filaGestion || filaGestionReal < 2) {
        return NextResponse.json({ ok: false, error: "No se encontró la fila de Gestión Consular seleccionada." }, { status: 404 });
      }

      const correlativo = String(filaGestion[0] ?? "").trim();
      const codigo = String(filaGestion[1] ?? "").trim();
      const estadoAnterior = String(filaGestion[6] ?? "").trim().toUpperCase();
      const numeroGuardado = estadoAnterior === "SIN PLANILLA" ? "" : String(filaGestion[11] ?? "").trim();
      if (correlativoSolicitado && correlativoSolicitado !== correlativo) {
        return NextResponse.json({ ok: false, error: "El recibo ya no coincide con el registro seleccionado." }, { status: 409 });
      }
      if (codigoSolicitado && codigoSolicitado !== codigo.toUpperCase()) {
        return NextResponse.json({ ok: false, error: "El código ya no coincide con el registro seleccionado." }, { status: 409 });
      }
      if (numeroActuacion && numeroActuacion !== numeroGuardado) {
        return NextResponse.json({ ok: false, error: "El número de actuación ya no coincide con el registro seleccionado." }, { status: 409 });
      }
      if (estadoAnterior !== "VINCULADO" && estadoAnterior !== "SIN PLANILLA") {
        return NextResponse.json({ ok: false, error: "La actuación ya no está activa o ya fue desvinculada." }, { status: 409 });
      }

      const filaDetallePersistida = Number(filaGestion[12]);
      if (
        Number.isInteger(filaDetallePersistida) && filaDetallePersistida >= 2 &&
        Number.isInteger(filaDetalleSolicitada) && filaDetalleSolicitada >= 2 &&
        filaDetallePersistida !== filaDetalleSolicitada
      ) {
        return NextResponse.json({ ok: false, error: "La fila DetalleCaja no coincide con la asociada al registro." }, { status: 409 });
      }
      let filaDetalleReal = Number.isInteger(filaDetallePersistida) && filaDetallePersistida >= 2
        ? filaDetallePersistida
        : filaDetalleSolicitada;
      let indiceDetalle = filaDetalleReal >= 2 ? filaDetalleReal - 1 : -1;
      const coincideDetalle = (fila: unknown[]) =>
        String(fila[0] ?? "").trim() === correlativo &&
        String(fila[1] ?? "").trim().toUpperCase() === codigo.toUpperCase() &&
        (!numeroGuardado || !String(fila[4] ?? "").trim() || String(fila[4] ?? "").trim() === numeroGuardado);

      if (indiceDetalle > 0) {
        if (!detalle[indiceDetalle] || !coincideDetalle(detalle[indiceDetalle])) {
          return NextResponse.json({ ok: false, error: "La fila DetalleCaja asociada ya no coincide con esta actuación." }, { status: 409 });
        }
      } else {
        const candidatas = detalle.slice(1).map((fila, indice) => ({ fila, indice: indice + 1 }))
          .filter(({ fila }) => coincideDetalle(fila) &&
            (numeroGuardado ? String(fila[4] ?? "").trim() === numeroGuardado : !String(fila[4] ?? "").trim() && !String(fila[5] ?? "").trim())
          );
        if (candidatas.length !== 1) {
          return NextResponse.json({
            ok: false,
            error: candidatas.length
              ? "No se puede identificar una única fila DetalleCaja. Actualiza la lista e intenta nuevamente."
              : "No se encontró la fila de DetalleCaja asociada a la actuación.",
          }, { status: 409 });
        }
        indiceDetalle = candidatas[0].indice;
        filaDetalleReal = indiceDetalle + 1;
      }

      const ahora = fechaHoraActual();
      const fechaRegistroAnterior = String(filaGestion[7] ?? "");
      const observacionAnterior = String(filaGestion[10] ?? "");
      const nuevoHistorial = [
        observacionAnterior,
        "-----------------------",
        `DESVINCULADO (${estadoAnterior})`,
        ahora,
        `Usuario: ${usuario}`,
        observaciones,
      ].filter(Boolean).join("\n\n").trim();

      await actualizarRangosAtomico(MODULO_CAJA_SHEET_ID, [
        ...(!encabezadoM ? [{ hoja: "GestionConsular", fila: 1, columna: 13, valores: [["FilaDetalle"]] }] : []),
        {
          hoja: "GestionConsular",
          fila: filaGestionReal,
          columna: 7,
          valores: [["DESVINCULADO", fechaRegistroAnterior, ahora, usuario, nuevoHistorial, numeroGuardado, filaDetalleReal]],
        },
        { hoja: "DetalleCaja", fila: filaDetalleReal, columna: 7, valores: [["DESVINCULADO"]] },
      ]);
      invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "GestionConsular");
      invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "DetalleCaja");

      return NextResponse.json({ ok: true, mensaje: "La actuación fue desvinculada correctamente." });
    });
  } catch (error: unknown) {
    console.error("Error desvinculando actuación de Gestión Consular:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No fue posible desvincular la actuación." }, { status: 500 });
  }
}
