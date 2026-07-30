import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,

  obtenerDocumentoPrincipal,

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
    // Índice de actuaciones ya procesadas
    // ===============================

    const actuacionesProcesadas =
      new Map<string, string>();

    filasGestion.forEach((row) => {

      const correlativo =
        (row[0] || "")
          .toString()
          .trim();

      const codigo =
        (row[1] || "")
          .toString()
          .trim();

      const estado =
        (row[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      if (

        estado === "VINCULADO" ||

        estado === "SIN PLANILLA"

      ) {

        actuacionesProcesadas.set(

          `${correlativo}|${codigo}`,

          estado

        );

      }

    });

    const registros: any[] = [];
        // ===============================
    // Construir actuaciones pendientes
    // ===============================

    filasCaja.forEach((movimiento) => {

      // Solo recibos generados

      if (
        (movimiento[10] || "") !==
        "GENERADO"
      ) {

        return;

      }

      const correlativo =
        movimiento[1];

      const detallesRecibo =
        filasDetalle.filter(

          (d) =>

            d[0] === correlativo

        );

      detallesRecibo.forEach((detalle) => {

        const codigo =
          detalle[1] || "";

        const llave =
          `${correlativo}|${codigo}`;

        // Si ya fue vinculado
        // o marcado SIN PLANILLA,
        // no debe aparecer

        if (

          actuacionesProcesadas.has(
            llave
          )

        ) {

          return;

        }

        const cedula =
          movimiento[11] ||
          movimiento[2] ||
          "";

        const pasaporte =
          movimiento[12] ||
          "";

        const nacionalidad =
          movimiento[13] ||
          "";

        const documento =
          obtenerDocumentoPrincipal(

            cedula,
            pasaporte,
            nacionalidad

          );

        registros.push({

          fecha:
            movimiento[0],

          recibo:
            correlativo,

          documento,

          nombre:
            movimiento[3] || "",

          codigo,

          actuacion:
            detalle[2] || "",

          usd:
            Number(
              detalle[3] || 0
            ),

        });

      });

    });

    registros.sort((a, b) => {

      return (

        new Date(b.fecha).getTime() -

        new Date(a.fecha).getTime()

      );

    });
        return NextResponse.json({

      ok: true,

      total:
        registros.length,

      registros,

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