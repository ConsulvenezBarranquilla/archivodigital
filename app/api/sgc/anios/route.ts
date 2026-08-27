import {
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

  // --------------------------------------------------
  // Intentar interpretar como fecha
  // --------------------------------------------------

  const fecha =
    new Date(texto);

  if (
    !Number.isNaN(
      fecha.getTime()
    )
  ) {

    const anio =
      fecha.getFullYear();

    if (
      anio >= 2000 &&
      anio <= 2100
    ) {

      return anio;

    }

  }

  // --------------------------------------------------
  // Buscar un año explícito
  // --------------------------------------------------

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

export async function GET() {

  try {

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:A",

      });

    const filas =
      response.data.values || [];

    const anios =
      new Set<number>();

    // --------------------------------------------------
    // Ignorar encabezado
    // --------------------------------------------------

    filas
      .slice(1)
      .forEach((fila) => {

        const anio =
          obtenerAnio(
            fila[0]
          );

        if (anio !== null) {

          anios.add(
            anio
          );

        }

      });

    // --------------------------------------------------
    // Ordenar de más reciente a más antiguo
    // --------------------------------------------------

    const resultado =
      Array.from(
        anios
      ).sort(
        (a, b) => b - a
      );

    // --------------------------------------------------
    // Respuesta
    // --------------------------------------------------

    return NextResponse.json({

      ok: true,

      anios:
        resultado,

    });

  }

  catch (error: any) {

    console.error(

      "Error obteniendo años SGC:",

      error

    );

    return NextResponse.json(

      {

        ok: false,

        anios: [],

        error:
          error?.message ||

          "No fue posible obtener los años disponibles.",

      },

      {

        status: 500,

      }

    );

  }

}