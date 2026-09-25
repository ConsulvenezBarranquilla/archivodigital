import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  MODULO_CAJA_SHEET_ID,

  obtenerDocumentoPrincipal,

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
  // Intentar interpretar como fecha
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
  // Buscar un año explícito
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
    // Lectura Caja
    // ==================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:S",

      });

    // ==================================================
    // Lectura DetalleCaja
    // ==================================================

    const detalleResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "DetalleCaja!A:F",

      });

    // ==================================================
    // Lectura GestionConsular
    // ==================================================

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
    // Índice de actuaciones ya procesadas
    // ==================================================

    const actuacionesProcesadas =
      new Map<string, number>();

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

        estado !== "VINCULADO" &&

        estado !== "SIN PLANILLA"

      ) {

        return;

      }

      const llave =
        `${correlativo}|${codigo}`;

      actuacionesProcesadas.set(

        llave,

        (
          actuacionesProcesadas.get(
            llave
          ) || 0
        ) + 1

      );

    });

    // ==================================================
    // Registros
    // ==================================================

    const registros: any[] = [];

    // ==================================================
    // Construir actuaciones pendientes
    // ==================================================

    filasCaja.forEach((movimiento) => {

      // ================================================
      // FILTRO POR AÑO
      // ================================================

      const anioMovimiento =
        obtenerAnio(
          movimiento[0]
        );

      if (

        anioMovimiento !==
        anioSeleccionado

      ) {

        return;

      }

      // ================================================
      // Solo recibos generados
      // ================================================

      if (

        (movimiento[10] || "") !==
        "GENERADO"

      ) {

        return;

      }

      const correlativo =
        (
          movimiento[1] ||
          ""
        )
          .toString()
          .trim();

      const detallesRecibo =
        filasDetalle.filter(

          (d) =>

            (
              d[0] ||
              ""
            )
              .toString()
              .trim() ===
            correlativo

        );

      // ================================================
      // Titulares especiales
      // ================================================

      const titularesEspeciales =

        (movimiento[14] || "")
          .toString()
          .split(";")
          .map(
            (t: string) =>
              t.trim()
          )
          .filter(
            (t: string) =>
              t.length > 0
          );

      // ================================================
      // Pasaportes / Visa
      // ================================================

      const pasaportesVisa =

        (movimiento[15] || "")
          .toString()
          .split(";")
          .map(
            (t: string) =>
              t.trim()
          )
          .filter(
            (t: string) =>
              t.length > 0
          );

      // ================================================
      // Procesar actuaciones
      // ================================================

      detallesRecibo.forEach(
        (detalle) => {

          const codigo =
            detalle[1] || "";

          const llave =
            `${correlativo}|${codigo}`;

          const restantes =
            actuacionesProcesadas.get(
              llave
            ) || 0;

          if (

            restantes > 0

          ) {

            actuacionesProcesadas.set(

              llave,

              restantes - 1

            );

            return;

          }

          // ==========================================
          // Documento principal
          // ==========================================

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

          // ==========================================
          // Solicitante por defecto
          // ==========================================

          let nombreMostrar =
            movimiento[3] || "";

          let documentoMostrar =
            documento;

          // ==========================================
          // Visas
          // ==========================================

          if (

            (detalle[2] || "")
              .toUpperCase()
              .includes("VISA")

          ) {

            if (

              titularesEspeciales.length > 0

            ) {

              nombreMostrar =
                titularesEspeciales.shift()!;

            }

            if (

              pasaportesVisa.length > 0

            ) {

              documentoMostrar =
                pasaportesVisa.shift()!;

            }

          }

          // ==========================================
          // Agregar pendiente
          // ==========================================

          registros.push({

            fecha:
              movimiento[0],

            recibo:
              correlativo,

            documento:
              documentoMostrar,

            nombre:
              nombreMostrar,

            titular:
              nombreMostrar,

            codigo,

            actuacion:
              detalle[2] || "",

            usd:
              Number(
                detalle[3] || 0
              ),

          });

        }

      );

    });

    // ==================================================
    // Ordenar
    // ==================================================

    registros.sort(
      (a, b) => {

        return (

          new Date(
            b.fecha
          ).getTime() -

          new Date(
            a.fecha
          ).getTime()

        );

      }

    );

    // ==================================================
    // Respuesta
    // ==================================================

    return NextResponse.json({

      ok: true,

      anio:
        anioSeleccionado,

      total:
        registros.length,

      registros,

    });

  }

  catch (error: any) {

    console.error(

      "Error obteniendo pendientes SGC:",

      error

    );

    return NextResponse.json(

      {

        ok: false,

        error:
          error?.message ||

          "No fue posible obtener las actuaciones pendientes.",

      },

      {

        status: 500,

      }

    );

  }

}