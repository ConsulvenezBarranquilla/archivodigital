import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,

} from "@/lib/googleSheets";

export async function GET(

  req: NextRequest

) {

  try {

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
          // ===============================
    // Recibos generados
    // ===============================

    const recibosGenerados =
      new Set<string>();

    filasCaja.forEach((row) => {

      const estado =
        (row[10] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (estado === "GENERADO") {

        recibosGenerados.add(

          (row[1] || "")
            .toString()
            .trim()

        );

      }

    });

    // ===============================
    // Total de actuaciones
    // ===============================

    let totalActuaciones = 0;

    filasDetalle.forEach((row) => {

      const correlativo =
        (row[0] || "")
          .toString()
          .trim();

      if (

        recibosGenerados.has(
          correlativo
        )

      ) {

        totalActuaciones++;

      }

    });

    // ===============================
    // Actuaciones Vinculadas
    // ===============================

    let vinculadas = 0;

    // ===============================
    // Actuaciones SIN PLANILLA
    // ===============================

    let sinPlanilla = 0;

    // ===============================
    // Número de planillas distintas
    // ===============================

    const planillas =
      new Set<string>();

    filasGestion.forEach((row) => {

      const estado =
        (row[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (

        estado === "VINCULADO"

      ) {

        vinculadas++;

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

      if (

        estado === "SIN PLANILLA"

      ) {

        sinPlanilla++;

      }

    });

    // ===============================
    // Pendientes
    // ===============================

    const pendientes =

      totalActuaciones -

      vinculadas -

      sinPlanilla;
          return NextResponse.json({

      ok: true,

      totalActuaciones,

      pendientes,

      vinculadas,

      planillas:
        planillas.size,

      expedientes:
        planillas.size,

      sinPlanilla,

    });

  } catch (error: any) {

    return NextResponse.json(

      {

        ok: false,

        error:
          error.message,

      },

      {

        status: 500,

      }

    );

  }

}