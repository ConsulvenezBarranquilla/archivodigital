import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  fechaHoraActual,
} from "@/lib/fechas";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,
  invalidarCacheHojaGoogle,
  actualizarRangosAtomico,

} from "@/lib/googleSheets";

import { exigirPermiso } from "@/lib/autorizacion";
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

    const usuarioSesion =
      autorizacion.sesion;

    const {

      actuaciones,

      observaciones,

    } = await req.json();

    const usuario =
      usuarioSesion.nombre;

    if (

      !actuaciones ||

      actuaciones.length === 0

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "No existen actuaciones para registrar.",

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
    // Verificar actuaciones ya registradas
    // ===============================

    const [gestionResponse, detalleResponse] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "GestionConsular!A:M" }),
      sheets.spreadsheets.values.get({ spreadsheetId: MODULO_CAJA_SHEET_ID, range: "DetalleCaja!A:H" }),
    ]);

    const registrosGestion =
      gestionResponse.data.values || [];

    const filasGestion =
      registrosGestion.slice(1);

    const filasDetalle = detalleResponse.data.values || [];
    const encabezadoM = String(registrosGestion[0]?.[12] ?? "").trim();
    if (encabezadoM && encabezadoM !== "FilaDetalle") {
      return NextResponse.json({ ok: false, error: "La columna M de GestionConsular ya está ocupada." }, { status: 409 });
    }

    const nuevasFilas: Array<Array<string | number>> = [];
    const accionesVistas = new Set<string>();

    for (const actuacion of actuaciones) {

      const correlativo =
        (actuacion.recibo || "")
          .toString()
          .trim();

      const codigo =
        (actuacion.codigo || "")
          .toString()
          .trim();

      const filaDetalle = Number(actuacion.filaDetalle);
      if (!Number.isInteger(filaDetalle) || filaDetalle < 2) {
        return NextResponse.json({ ok: false, error: `No se recibió una fila DetalleCaja válida para ${correlativo} / ${codigo}. Actualiza la lista.` }, { status: 400 });
      }
      const detalle = filasDetalle[filaDetalle - 1];
      if (!detalle || String(detalle[0] ?? "").trim() !== correlativo || String(detalle[1] ?? "").trim().toUpperCase() !== codigo.toUpperCase()) {
        return NextResponse.json({ ok: false, error: "La fila DetalleCaja seleccionada ya no corresponde a esta actuación." }, { status: 409 });
      }
      const estadoDetalle = String(detalle[6] ?? "").trim().toUpperCase();
      if (
        String(detalle[4] ?? "").trim() || String(detalle[5] ?? "").trim() ||
        (estadoDetalle && estadoDetalle !== "DESVINCULADO")
      ) {
        return NextResponse.json({ ok: false, error: "La actuación seleccionada ya tiene un estado operativo en DetalleCaja." }, { status: 409 });
      }

      const llave = `${correlativo}|${codigo.toUpperCase()}|${filaDetalle}`;
      if (accionesVistas.has(llave)) {
        return NextResponse.json({ ok: false, error: "La selección contiene repetida una misma fila de detalle." }, { status: 409 });
      }
      accionesVistas.add(llave);

      const existente =
        filasGestion.find((row) => {

          return (

            String(row[0] || "").trim() === correlativo &&

            String(row[1] || "").trim().toUpperCase() === codigo.toUpperCase() &&

            (String(row[12] || "").trim() === String(filaDetalle) || !String(row[12] || "").trim()) &&

            (

              row[6] === "VINCULADO" ||

              row[6] === "SIN PLANILLA"

            )

          );

        });

      if (existente) {

        return NextResponse.json({

          ok: false,

          error:
            `La actuación ${codigo} del recibo ${correlativo} ya fue registrada.`,

        });

      }

      nuevasFilas.push([

        correlativo,

        codigo,

        actuacion.actuacion || "",

        "",

        "",

        usuario,

        "SIN PLANILLA",

        ahora,

        "",

        "",

        observaciones || "",

        "",

        filaDetalle,

      ]);

    }
        // ===============================
    // Registrar actuaciones
    // ===============================

    const primeraFilaGestion = registrosGestion.length + 1;
    await actualizarRangosAtomico(MODULO_CAJA_SHEET_ID, [
      ...(!encabezadoM ? [{ hoja: "GestionConsular", fila: 1, columna: 13, valores: [["FilaDetalle"]] }] : []),
      { hoja: "GestionConsular", fila: primeraFilaGestion, columna: 1, valores: nuevasFilas },
    ]);
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "GestionConsular");
    invalidarCacheHojaGoogle(MODULO_CAJA_SHEET_ID, "DetalleCaja");

    return NextResponse.json({

      ok: true,

      cantidad:
        nuevasFilas.length,

      mensaje:
        `${nuevasFilas.length} actuación(es) registrada(s) como SIN PLANILLA.`,

    });
    });

  } catch (error: unknown) {

    return NextResponse.json(

      {

        ok: false,

        error:
          error instanceof Error ? error.message : "No fue posible registrar las actuaciones SIN PLANILLA.",

      },

      {

        status: 500,

      }

    );

  }

}
