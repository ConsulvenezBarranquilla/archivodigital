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
  invalidarCacheHojaGoogle,
  actualizarRangosAtomico,

} from "@/lib/googleSheets";
import { conBloqueoGestionConsular } from "@/lib/bloqueo-sgc";

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

    const usuario =
      autorizacion.sesion.nombre;

    if (

      !actuaciones ||

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

    const filasGestion =
      registrosGestion.slice(1);

    const encabezadoM =
      String(registrosGestion[0]?.[12] ?? "").trim();

    if (encabezadoM && encabezadoM !== "FilaDetalle") {
      return NextResponse.json({ ok: false, error: "La columna M de GestionConsular ya estÃ¡ ocupada." }, { status: 409 });
    }

    const ultimaOperacion = new Map<string, unknown[]>();
    filasGestion.forEach((fila) => {
      const clave = [fila[0], fila[1], fila[11]].map((valor) => String(valor ?? "").trim().toUpperCase()).join("|");
      ultimaOperacion.set(clave, fila);
    });

    const nuevasFilas: Array<Array<string | number>> = [];

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

        observaciones || "",

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
    ]);
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "GestionConsular");
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "DetalleCaja");

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
