import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,

} from "@/lib/googleSheets";

// ======================================================
// Obtener año de una fecha
// ======================================================

function obtenerAnio(

  valor: unknown

): number | null {

  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {

    return null;

  }

  const texto =
    String(valor).trim();

  // ------------------------------------------
  // Fecha ISO / fecha reconocible
  // ------------------------------------------

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {

    return fecha.getFullYear();

  }

  // ------------------------------------------
  // Intentar extraer año directamente
  // ------------------------------------------

  const coincidencia =
    texto.match(
      /(?:^|[^\d])(20\d{2})(?:[^\d]|$)/
    );

  if (coincidencia) {

    return Number(
      coincidencia[1]
    );

  }

  return null;

}

// ======================================================
// GET
// ======================================================

export async function GET(

  req: NextRequest

) {

  try {

    // ==================================================
    // Año seleccionado
    // ==================================================

    const parametroAnio =
      req.nextUrl.searchParams.get(
        "anio"
      );

    const anioSeleccionado =
      parametroAnio
        ? Number(parametroAnio)
        : new Date().getFullYear();

    if (
      !Number.isInteger(
        anioSeleccionado
      )
    ) {

      return NextResponse.json(

        {

          ok: false,

          error:
            "El año indicado no es válido.",

        },

        {

          status: 400,

        }

      );

    }

    // ==================================================
    // Lectura de hojas
    // ==================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:F",

      });

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:K",

      });

    const caja =
      cajaResponse.data.values || [];

    const detalle =
      detalleResponse.data.values || [];

    const gestion =
      gestionResponse.data.values || [];

    const filasCaja =
      caja.slice(1);

    const filasDetalle =
      detalle.slice(1);

    const filasGestion =
      gestion.slice(1);

    // ==================================================
    // Recibos generados del año seleccionado
    // ==================================================

    const recibosGenerados =
      new Set<string>();

    filasCaja.forEach((row) => {

      const estado =
        (row[10] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (
        estado !== "GENERADO"
      ) {

        return;

      }

      // Caja!A = Marca temporal

      const anioFila =
        obtenerAnio(
          row[0]
        );

      if (
        anioFila !==
        anioSeleccionado
      ) {

        return;

      }

      // Caja!B = Recibo

      const recibo =
        (row[1] || "")
          .toString()
          .trim();

      if (recibo) {

        recibosGenerados.add(
          recibo
        );

      }

    });

    // ==================================================
    // Total de actuaciones
    // ==================================================

    let totalActuaciones = 0;

    filasDetalle.forEach((row) => {

      // DetalleCaja!A = Correlativo / recibo

      const correlativo =
        (row[0] || "")
          .toString()
          .trim();

      if (
        !recibosGenerados.has(
          correlativo
        )
      ) {

        return;

      }

      totalActuaciones++;

    });

    // ==================================================
    // Actuaciones vinculadas
    // ==================================================

    let vinculadas = 0;

    // ==================================================
    // Actuaciones SIN PLANILLA
    // ==================================================

    let sinPlanilla = 0;

    // ==================================================
    // Número de planillas distintas
    // ==================================================

    const planillas =
      new Set<string>();

    filasGestion.forEach((row) => {

      // GestionConsular!A = correlativo

      const correlativo =
        (row[0] || "")
          .toString()
          .trim();

      // ----------------------------------------------
      // Solo registros cuyo recibo pertenece
      // al año seleccionado
      // ----------------------------------------------

      if (
        !recibosGenerados.has(
          correlativo
        )
      ) {

        return;

      }

      // GestionConsular!G = Estado
      // Índice 6

      const estado =
        (row[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      // ----------------------------------------------
      // Vinculado
      // ----------------------------------------------

      if (
        estado === "VINCULADO"
      ) {

        vinculadas++;

        // GestionConsular!D = Planilla
        // Índice 3

        const planilla =
          (row[3] || "")
            .toString()
            .trim();

        if (planilla) {

          planillas.add(
            planilla
          );

        }

      }

      // ----------------------------------------------
      // Sin planilla
      // ----------------------------------------------

      if (
        estado === "SIN PLANILLA"
      ) {

        sinPlanilla++;

      }

    });

    // ==================================================
    // Pendientes
    // ==================================================

    const pendientes =

      Math.max(

        0,

        totalActuaciones -

        vinculadas -

        sinPlanilla

      );

    // ==================================================
    // Respuesta
    // ==================================================

    return NextResponse.json({

      ok: true,

      anio:
        anioSeleccionado,

      totalActuaciones,

      pendientes,

      vinculadas,

      planillas:
        planillas.size,

      expedientes:
        planillas.size,

      sinPlanilla,

    });

  }

  catch (error: any) {

    console.error(

      "Error estadísticas SGC:",

      error

    );

    return NextResponse.json(

      {

        ok: false,

        error:
          error?.message ||

          "No fue posible obtener las estadísticas SGC.",

      },

      {

        status: 500,

      }

    );

  }

}