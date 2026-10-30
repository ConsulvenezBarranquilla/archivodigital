import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  fechaHoraActual,
} from "@/lib/fechas";
import {
  exigirPermiso,
} from "@/lib/autorizacion";
import {

  sheets,

  MODULO_CAJA_SHEET_ID,
  HOJA_REPORTES_ENTREGADOS,
  invalidarCacheHojaGoogle,
  actualizarRangosAtomico,

} from "@/lib/googleSheets";
import { conBloqueoGestionConsular } from "@/lib/bloqueo-sgc";

function claveNumeroConsular(valor: unknown): string {
  const numero = String(valor ?? "").trim().replace(/\.0+$/, "");
  return numero.replace(/^0+(?=\d)/, "");
}

export async function POST(

  req: NextRequest

) {

  try {

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

    const {

      actuaciones,

      planilla,

      fechaPlanilla,

      observaciones,

    } = await req.json();
    const observacionVinculacion = String(observaciones ?? "").trim();

    const usuario =
      autorizacion.sesion.nombre;

    if (

      !Array.isArray(actuaciones) ||

      actuaciones.length === 0

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "No existen actuaciones para vincular.",

      });

    }

    if (

      !planilla?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar el nÃºmero de Planilla de GestiÃ³n Consular.",

      });

    }

if (

  !/^\d+$/.test(
    planilla.trim()
  )

) {

  return NextResponse.json({

    ok: false,

    error:
      "El nÃºmero de planilla debe contener Ãºnicamente nÃºmeros.",

  });

}

    if (

      !fechaPlanilla

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar la fecha de la Planilla.",

      });

    }

    if (

      !usuario?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Usuario no identificado.",

      });

    }

    return await conBloqueoGestionConsular(async () => {
    const ahora = fechaHoraActual();

    // ===============================
    // Verificar actuaciones ya vinculadas
    // ===============================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:M",

      });

    const registrosGestion =
      gestionResponse.data.values || [];

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:H",

      });

    const detalleCaja =
      detalleResponse.data.values || [];

    const reportesResponse = observacionVinculacion
      ? await sheets.spreadsheets.values.get({
          spreadsheetId: MODULO_CAJA_SHEET_ID,
          range: `${HOJA_REPORTES_ENTREGADOS}!A:M`,
        })
      : null;
    const filasReportes = reportesResponse?.data.values || [];

    const filasGestion =
      registrosGestion.slice(1);

    const encabezadoM =
      String(registrosGestion[0]?.[12] ?? "").trim();

    // Se permite compartir la planilla dentro de esta solicitud, pero no
    // reutilizar una planilla que ya tenga una vinculacion activa.
    const planillaClave = claveNumeroConsular(planilla);
    const planillaExistente = filasGestion.find((fila) =>
      claveNumeroConsular(fila[3]) === planillaClave &&
      String(fila[6] ?? "").trim().toUpperCase() !== "DESVINCULADO"
    );
    if (planillaExistente) {
      return NextResponse.json({
        ok: false,
        error: `El numero de planilla ${planilla.trim()} ya esta asignado a una vinculacion activa.`,
      }, { status: 409 });
    }

    if (encabezadoM && encabezadoM !== "FilaDetalle") {
      return NextResponse.json({ ok: false, error: "La columna M de GestionConsular ya estÃ¡ ocupada." }, { status: 409 });
    }

    const ultimaOperacion = new Map<string, unknown[]>();
    filasGestion.forEach((fila) => {
      const clave = [fila[0], fila[1], fila[11]].map((valor) => String(valor ?? "").trim().toUpperCase()).join("|");
      ultimaOperacion.set(clave, fila);
    });

    const nuevasFilas: Array<Array<string | number>> = [];
    const numerosActuacionSolicitud = new Set<string>();

    for (const actuacion of actuaciones) {

      const correlativo =
        (actuacion.recibo || "")
          .toString()
          .trim();

      const codigo =
        (actuacion.codigo || "")
          .toString()
          .trim();

      const numeroActuacion =
        (actuacion.numeroActuacion || "")
          .toString()
          .trim();

      if (!numeroActuacion) {

        return NextResponse.json({

          ok: false,

          error:
            `Debe indicar el nÃºmero de la actuaciÃ³n para ${codigo}.`,

        });

      }

      if (!/^\d+$/.test(numeroActuacion)) {

        return NextResponse.json({

          ok: false,

          error:
            `El nÃºmero de actuaciÃ³n debe contener Ãºnicamente nÃºmeros.`,

        });

      }

      const numeroActuacionClave = claveNumeroConsular(numeroActuacion);
      if (numerosActuacionSolicitud.has(numeroActuacionClave)) {
        return NextResponse.json({
          ok: false,
          error: `El numero de actuacion ${numeroActuacion} esta repetido en la solicitud.`,
        }, { status: 409 });
      }
      numerosActuacionSolicitud.add(numeroActuacionClave);

      
const usosActuacionExistentes = filasGestion.filter((fila) =>
  claveNumeroConsular(fila[11]) === numeroActuacionClave
);

const usoNoPermitido = usosActuacionExistentes.some((fila) => {
  const estado = String(fila[6] ?? "").trim().toUpperCase();

  // Solo impedir la reutilización si existe una asignación activa.
  return estado !== "DESVINCULADO";
});

if (usoNoPermitido) {
  return NextResponse.json({
    ok: false,
    error: `El numero de actuacion ${numeroActuacion} ya esta asignado a otra vinculacion.`,
  }, { status: 409 });
}


      const llaveActuacion = [correlativo, codigo, numeroActuacion]
        .map((valor) => valor.trim().toUpperCase())
        .join("|");
      const existente = ultimaOperacion.get(llaveActuacion);
      const estadoExistente = String(existente?.[6] ?? "").trim().toUpperCase();

      if (existente && estadoExistente !== "DESVINCULADO") {

        return NextResponse.json({

          ok: false,

          error:
            `La actuaciÃ³n ${numeroActuacion} del recibo ${correlativo} ya se encuentra vinculada.`,

        });

      }

      const filaDetalleSolicitada = Number(actuacion.filaDetalle);
      const sinPlanillaActiva = filasGestion.find((fila) =>
        String(fila[0] ?? "").trim() === correlativo &&
        String(fila[1] ?? "").trim().toUpperCase() === codigo.toUpperCase() &&
        (!String(fila[12] ?? "").trim() || Number(fila[12]) === filaDetalleSolicitada) &&
        String(fila[6] ?? "").trim().toUpperCase() === "SIN PLANILLA"
      );
      if (sinPlanillaActiva) {
        return NextResponse.json({ ok: false, error: `La actuaciÃ³n ${codigo} ya estÃ¡ registrada SIN PLANILLA. DesvincÃºlala antes de asignarle una planilla.` }, { status: 409 });
      }

      nuevasFilas.push([

        correlativo,

        codigo,

        actuacion.actuacion || "",

        planilla,

        fechaPlanilla,

        usuario,

        "VINCULADO",

        ahora,

        "",

        "",

        observacionVinculacion,

        numeroActuacion,

        "",

      ]);

      ultimaOperacion.set(llaveActuacion, nuevasFilas[nuevasFilas.length - 1]);

    }

    // ===============================
    // Registrar actuaciones
    // ===============================

    const rangosDetalle: Array<{ fila: number; values: Array<Array<string | number>> }> = [];
    const indicesDetalleUsados = new Set<number>();
    const cambiosObservacionesReportes: Array<{
      hoja: string;
      fila?: number;
      columna?: number;
      valores?: Array<Array<string | number>>;
      anexar?: Array<string | number>;
    }> = [];
    const filasReportesActualizadas = new Set<number>();

    if (observacionVinculacion) {
      for (let i = 0; i < nuevasFilas.length; i++) {
        const idReporte = String(nuevasFilas[i][11] ?? "").trim();
        const filaReporteIndice = filasReportes.findIndex((fila, indice) =>
          indice > 0 && String(fila[0] ?? "").trim() === idReporte
        );
        const observacionActual = filaReporteIndice >= 0
          ? String(filasReportes[filaReporteIndice][12] ?? "")
          : "";
        const observacionNueva = observacionVinculacion;

        if (filaReporteIndice >= 0) {
          const numeroFila = filaReporteIndice + 1;
          if (filasReportesActualizadas.has(numeroFila)) continue;
          filasReportesActualizadas.add(numeroFila);

          const observacionFinal = observacionActual.trim()
            ? observacionActual.includes(observacionNueva)
              ? observacionActual
              : `${observacionActual.trim()}\n${observacionNueva}`
            : observacionNueva;

          if (observacionFinal !== observacionActual) {
            cambiosObservacionesReportes.push({
              hoja: HOJA_REPORTES_ENTREGADOS,
              fila: numeroFila,
              columna: 13,
              valores: [[observacionFinal]],
            });
          }
          continue;
        }

        const filaReporte = new Array<string | number>(53).fill("");
        filaReporte[0] = idReporte;
        filaReporte[12] = observacionNueva;
        cambiosObservacionesReportes.push({
          hoja: HOJA_REPORTES_ENTREGADOS,
          anexar: filaReporte,
        });
      }
    }

    const filasDetalle =
      detalleCaja.map((fila) => [...fila]);

    for (let indiceActuacion = 0; indiceActuacion < actuaciones.length; indiceActuacion++) {
      const actuacion = actuaciones[indiceActuacion];

      const correlativo =
        String(
          actuacion.recibo ?? ""
        ).trim();

      const codigo =
        String(
          actuacion.codigo ?? ""
        ).trim();

      const numeroActuacion =
        String(
          actuacion.numeroActuacion ?? ""
        ).trim();

      // ==========================================
      // Buscar la fila exacta de DetalleCaja
      // ==========================================
      //
      // Primera vinculaciÃ³n:
      // E estÃ¡ vacÃ­o.
      //
      // RevinculaciÃ³n:
      // E contiene el mismo nÃºmero de actuaciÃ³n
      // y G estÃ¡ DESVINCULADA.
      //
      // De esta manera no se toma una fila
      // DESVINCULADA de otra actuaciÃ³n.
      // ==========================================

      const filaSolicitada = Number(actuacion.filaDetalle);
      let indiceDetalle = Number.isInteger(filaSolicitada) ? filaSolicitada - 1 : -1;
      const mismoRegistro = (fila: unknown[]) =>
        String(fila[0] ?? "").trim() === correlativo &&
        String(fila[1] ?? "").trim().toUpperCase() === codigo.toUpperCase();

      if (indiceDetalle >= 1) {
        if (!filasDetalle[indiceDetalle] || !mismoRegistro(filasDetalle[indiceDetalle])) {
          return NextResponse.json({ ok: false, error: "La fila de detalle ya no corresponde a esta actuaciÃ³n. Actualiza la lista e intenta nuevamente." }, { status: 409 });
        }
        const numeroDetalleActual = String(filasDetalle[indiceDetalle][4] ?? "").trim();
        if (numeroDetalleActual && numeroDetalleActual !== numeroActuacion) {
          return NextResponse.json({ ok: false, error: "La fila de detalle ya pertenece a otro nÃºmero de actuaciÃ³n." }, { status: 409 });
        }
      } else {
        indiceDetalle = -1;
      }

      // ------------------------------------------
      // 1. Buscar primero una fila ya asociada
      //    a esta misma actuaciÃ³n y DESVINCULADA
      // ------------------------------------------

      if (indiceDetalle === -1) {
        for (let i = 1; i < filasDetalle.length; i++) {
          const fila = filasDetalle[i];
          const mismoNumeroActuacion = String(fila[4] ?? "").trim() === numeroActuacion;
          const estaDesvinculada = String(fila[6] ?? "").trim().toUpperCase() === "DESVINCULADO";

          if (mismoRegistro(fila) && mismoNumeroActuacion && estaDesvinculada) {
            indiceDetalle = i;
            break;
          }
        }
      }

      // ------------------------------------------
      // 2. Si no existe una fila previamente
      //    vinculada, buscar una fila nueva
      //    con E vacÃ­o.
      // ------------------------------------------

      if (indiceDetalle === -1) {

        for (
          let i = 1;
          i < filasDetalle.length;
          i++
        ) {

          const fila =
            filasDetalle[i];

          const sinActuacion = !String(fila[4] ?? "").trim() &&
            !String(fila[5] ?? "").trim() && !String(fila[6] ?? "").trim();

          if (

            mismoRegistro(fila) &&
            sinActuacion

          ) {

            indiceDetalle = i;

            break;

          }

        }

      }

      // ------------------------------------------
      // 3. Actualizar solamente la fila encontrada
      // ------------------------------------------

      if (indiceDetalle === -1) {
        return NextResponse.json({ ok: false, error: `No se encontrÃ³ una fila DetalleCaja exacta para el recibo ${correlativo}, cÃ³digo ${codigo}.` }, { status: 409 });
      }
      if (indicesDetalleUsados.has(indiceDetalle)) {
        return NextResponse.json({ ok: false, error: "Dos actuaciones seleccionadas apuntan a la misma fila de DetalleCaja." }, { status: 409 });
      }
      indicesDetalleUsados.add(indiceDetalle);

      if (indiceDetalle !== -1) {

        const fila =
          filasDetalle[indiceDetalle];

        const estadoDetalle = String(fila[6] ?? "").trim().toUpperCase();
        if (estadoDetalle === "VINCULADO") {
          return NextResponse.json({ ok: false, error: `La fila de DetalleCaja del recibo ${correlativo} ya estÃ¡ vinculada.` }, { status: 409 });
        }

        fila[4] =
          numeroActuacion;   // E

        fila[5] =
          planilla;          // F

        fila[6] =
          "VINCULADO";       // G

        fila[7] =
          fechaPlanilla;     // H

        const filaDetalle = indiceDetalle + 1;
        nuevasFilas[indiceActuacion][12] = filaDetalle;
        rangosDetalle.push({ fila: filaDetalle, values: [[numeroActuacion, planilla, "VINCULADO", fechaPlanilla]] });

      }

    }

    const primeraFilaGestion = registrosGestion.length + 1;
    await actualizarRangosAtomico(MODULO_CAJA_SHEET_ID, [
      ...(!encabezadoM ? [{ hoja: "GestionConsular", fila: 1, columna: 13, valores: [["FilaDetalle"]] }] : []),
      { hoja: "GestionConsular", fila: primeraFilaGestion, columna: 1, valores: nuevasFilas },
      ...rangosDetalle.map(({ fila, values }) => ({ hoja: "DetalleCaja", fila, columna: 5, valores: values })),
      ...cambiosObservacionesReportes,
    ]);
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "GestionConsular");
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "DetalleCaja");
    if (cambiosObservacionesReportes.length > 0) {
      invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, HOJA_REPORTES_ENTREGADOS);
    }

    return NextResponse.json({

      ok: true,

      cantidad:
        nuevasFilas.length,

      mensaje:
        `${nuevasFilas.length} actuaciÃ³n(es) vinculada(s) correctamente.`,

    });
    });

  } catch (error: unknown) {

    return NextResponse.json(

      {

        ok: false,

        error:
          error instanceof Error ? error.message : "No fue posible vincular la actuación.",

      },

      {

        status: 500,

      }

    );

  }

}
