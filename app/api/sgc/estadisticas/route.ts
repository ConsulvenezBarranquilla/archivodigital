import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,

} from "@/lib/googleSheets";

import { exigirPermiso } from "@/lib/autorizacion";

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

    const autorizacion =
      await exigirPermiso("sgc");

    if (autorizacion.respuesta) {

      return autorizacion.respuesta;

    }

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
          "Caja!A:S",

      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:H",

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

      // Caja!K = Estado

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

      if (
        recibo
      ) {

        recibosGenerados.add(
          recibo
        );

      }

    });

    // ==================================================
    // Índice de actuaciones procesadas
    //
    // EXACTAMENTE EL MISMO CRITERIO UTILIZADO
    // POR /api/sgc/pendientes
    //
    // Clave:
    //
    //     correlativo + código
    //
    // GestionConsular:
    //
    // A = Correlativo
    // B = Código
    // G = Estado
    // ==================================================

    const actuacionesProcesadas =
      new Map<
        string,
        {
          vinculadas: number;
          sinPlanilla: number;
        }
      >();

    filasGestion.forEach((row) => {

      // GestionConsular!A
      // Correlativo

      const correlativo =
        (row[0] || "")
          .toString()
          .trim();

      if (
        !correlativo
      ) {

        return;

      }

      // ----------------------------------------------
      // Solo recibos pertenecientes al año seleccionado
      // ----------------------------------------------

      if (
        !recibosGenerados.has(
          correlativo
        )
      ) {

        return;

      }

      // GestionConsular!B
      // Código de actuación

      const codigo =
        (row[1] || "")
          .toString()
          .trim();

      if (
        !codigo
      ) {

        return;

      }

      // GestionConsular!G
      // Estado

      const estado =
        (row[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (
        estado !== "VINCULADO" &&
        estado !== "SIN PLANILLA"
      ) {

        return;

      }

      const llave =
        `${correlativo}|${codigo}`;

      const actual =
        actuacionesProcesadas.get(
          llave
        ) || {
          vinculadas: 0,
          sinPlanilla: 0,
        };

      if (
        estado === "VINCULADO"
      ) {

        actual.vinculadas++;

      }

      if (
        estado === "SIN PLANILLA"
      ) {

        actual.sinPlanilla++;

      }

      actuacionesProcesadas.set(
        llave,
        actual
      );

    });

    // ==================================================
    // Estadísticas
    // ==================================================

    let totalActuaciones = 0;

    let pendientes = 0;

    let vinculadas = 0;

    let sinPlanilla = 0;

    // ==================================================
    // Recorrer DetalleCaja
    //
    // EXACTAMENTE EL MISMO UNIVERSO UTILIZADO
    // PARA CONSTRUIR LA TABLA DE PENDIENTES
    //
    // DetalleCaja:
    //
    // A = Correlativo
    // B = Código de actuación
    // C = Nombre de actuación
    // D = Monto
    // E = Número de actuación
    // F = Planilla
    // G = EstadoGC
    // H = Fecha última vinculación
    // ==================================================

    filasDetalle.forEach((detalle) => {

      // ----------------------------------------------
      // DetalleCaja!A
      // Correlativo
      // ----------------------------------------------

      const correlativo =
        (detalle[0] || "")
          .toString()
          .trim();

      if (
        !correlativo
      ) {

        return;

      }

      // ----------------------------------------------
      // Solo recibos generados del año seleccionado
      // ----------------------------------------------

      if (
        !recibosGenerados.has(
          correlativo
        )
      ) {

        return;

      }

      // ----------------------------------------------
      // DetalleCaja!B
      // Código de actuación
      // ----------------------------------------------

      const codigo =
        (detalle[1] || "")
          .toString()
          .trim();

      if (
        !codigo
      ) {

        return;

      }

      // ----------------------------------------------
      // Cada fila representa una actuación
      // ----------------------------------------------

      totalActuaciones++;

      // ----------------------------------------------
      // Buscar actuaciones procesadas
      // para ese recibo + código
      // ----------------------------------------------

      const llave =
        `${correlativo}|${codigo}`;

      const actual =
        actuacionesProcesadas.get(
          llave
        ) || {
          vinculadas: 0,
          sinPlanilla: 0,
        };

      // ----------------------------------------------
      // Consumir primero una vinculación
      // ----------------------------------------------

      if (
        actual.vinculadas > 0
      ) {

        actual.vinculadas--;

        vinculadas++;

        actuacionesProcesadas.set(
          llave,
          actual
        );

        return;

      }

      // ----------------------------------------------
      // Luego consumir SIN PLANILLA
      // ----------------------------------------------

      if (
        actual.sinPlanilla > 0
      ) {

        actual.sinPlanilla--;

        sinPlanilla++;

        actuacionesProcesadas.set(
          llave,
          actual
        );

        return;

      }

      // ----------------------------------------------
      // Si no existe correspondencia en Gestión
      // o ya fueron consumidas todas las versiones:
      //
      // PENDIENTE
      // ----------------------------------------------

      pendientes++;

    });

    // ==================================================
    // Número de planillas distintas
    //
    // Se mantiene la lógica existente.
    // ==================================================

    const planillas =
      new Set<string>();

    filasGestion.forEach((row) => {

      // GestionConsular!A
      // Correlativo

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

      // GestionConsular!G
      // Estado

      const estado =
        (row[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (
        estado !== "VINCULADO"
      ) {

        return;

      }

      // GestionConsular!D
      // Planilla

      const planilla =
        (row[3] || "")
          .toString()
          .trim();

      if (
        planilla
      ) {

        planillas.add(
          planilla
        );

      }

    });

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