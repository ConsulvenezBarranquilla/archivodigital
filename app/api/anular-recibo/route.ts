import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  actualizarEstadoRecibo,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {
      correlativo,
    } = await req.json();

    // ======================================================
    // VALIDAR CORRELATIVO
    // ======================================================

    const recibo =
      String(correlativo ?? "")
        .trim();

    if (!recibo) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Debe indicar el número de recibo.",
      });

    }

    // ======================================================
    // LEER CAJA
    // ======================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const rowsCaja =
      cajaResponse.data.values || [];

    // ======================================================
    // BUSCAR RECIBO EN CAJA
    // ======================================================

    let filaCaja = -1;

    for (
      let index = 1;
      index < rowsCaja.length;
      index++
    ) {

      const correlativoCaja =
        String(
          rowsCaja[index]?.[1] ?? ""
        )
          .trim();

      if (
        correlativoCaja === recibo
      ) {

        filaCaja =
          index + 1;

        break;

      }

    }

    if (
      filaCaja === -1
    ) {

      return NextResponse.json({

        ok: false,

        mensaje:
          "Recibo no encontrado.",

      });

    }

    // ======================================================
    // LEER GESTIÓN CONSULAR
    // ======================================================
    //
    // A = Recibo
    // G = Estado
    // L = Número de actuación
    //
    // Una actuación sigue vinculada mientras
    // su estado sea diferente de DESVINCULADO.
    //
    // ======================================================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const filasGestion =
      gestionResponse.data.values || [];

    // ======================================================
    // COMPROBAR VINCULACIÓN ACTIVA
    // ======================================================

    const vinculacionActiva =
      filasGestion.some(
        (row, index) => {

          // Ignorar encabezado
          if (index === 0) {
            return false;
          }

          const reciboGestion =
            String(
              row?.[0] ?? ""
            )
              .trim();

          const estado =
            String(
              row?.[6] ?? ""
            )
              .trim()
              .toUpperCase();

          return (

            reciboGestion === recibo &&

            estado !== "DESVINCULADO"

          );

        }
      );

    // ======================================================
    // BLOQUEAR ANULACIÓN
    // ======================================================

    if (
      vinculacionActiva
    ) {

      return NextResponse.json({

        ok: false,

        mensaje:
          `El recibo ${recibo} se encuentra vinculado a Gestión Consular. Debe desvincular primero todas sus actuaciones antes de poder anular el recibo.`,

      });

    }

    // ======================================================
    // ANULAR RECIBO
    // ======================================================

    await actualizarEstadoRecibo(
      filaCaja,
      "ANULADO"
    );

    // ======================================================
    // RESPUESTA
    // ======================================================

    return NextResponse.json({

      ok: true,

      mensaje:
        `El recibo ${recibo} fue anulado correctamente.`,

    });

  }

  catch (
    error: any
  ) {

    console.error(
      "Error anulando recibo:",
      error
    );

    return NextResponse.json({

      ok: false,

      error:
        error?.message ??
        "No fue posible anular el recibo.",

    });

  }

}