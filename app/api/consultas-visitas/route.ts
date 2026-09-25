import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

import {
  convertirFecha,
  inicioDelDia,
  finDelDia,
} from "@/lib/fechas";

import { obtenerSesion } from "@/lib/auth";

export async function POST(
  req: NextRequest
) {

  try {

    // ============================================
    // VALIDAR SESIÓN
    // ============================================

    const sesion =
      await obtenerSesion();

    if (!sesion) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "Sesión no válida o expirada.",
        },
        {
          status: 401,
        }
      );

    }

    const {
      desde,
      hasta,
      documento,
      tipo,
    } = await req.json();

    // ============================================
    // LEER BITÁCORA DE VISITAS
    // ============================================

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "BitacoraVisitas!A:G",

      });

    const filas =
      response.data.values || [];

    const filasSinEncabezado =
      filas.slice(1);

    // ============================================
    // FILTRAR REGISTROS
    // ============================================

    const resultado =
      filasSinEncabezado.filter((row) => {

        const fecha =
          convertirFecha(row[0]);

        if (!fecha) {

          return false;

        }

        const fechaDesde =
          inicioDelDia(desde);

        const fechaHasta =
          finDelDia(hasta);

        if (
          fechaDesde &&
          fecha < fechaDesde
        ) {

          return false;

        }

        if (
          fechaHasta &&
          fecha > fechaHasta
        ) {

          return false;

        }

        // ========================================
        // FILTRO POR DOCUMENTO
        // ========================================

        if (documento) {

          const buscado =
            documento
              .trim()
              .toUpperCase();

          const cedula =
            (row[2] || "")
              .toString()
              .trim()
              .toUpperCase();

          const pasaporte =
            (row[3] || "")
              .toString()
              .trim()
              .toUpperCase();

          if (

            cedula !== buscado &&
            pasaporte !== buscado

          ) {

            return false;

          }

        }

        // ========================================
        // FILTRO POR TIPO
        // ========================================

        if (

          tipo &&
          tipo !== "Todas" &&
          row[5] !== tipo

        ) {

          return false;

        }

        return true;

      });

    // ============================================
    // PREPARAR REGISTROS
    // ============================================

    const registros =
      resultado.map((row) => {

        const cedula =
          row[2] || "";

        const pasaporte =
          row[3] || "";

        const nacionalidad =
          row[6] || "";

        const documentoPrincipal =
          obtenerDocumentoPrincipal(
            cedula,
            pasaporte,
            nacionalidad
          );

        return [

          row[0],             // 0 Fecha

          documentoPrincipal, // 1 Documento

          row[4] || "",       // 2 Nombre

          row[5] || "",       // 3 Tipo

          row[1] || "",       // 4 Observación

        ];

      });

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    const tramite =
      registros.filter(
        (r) =>
          r[3] === "Trámite"
      ).length;

    const informacion =
      registros.filter(
        (r) =>
          r[3] === "Información"
      ).length;

    const acompanante =
      registros.filter(
        (r) =>
          r[3] === "Acompañante"
      ).length;

    const institucional =
      registros.filter(
        (r) =>
          r[3] === "Cita Institucional"
      ).length;

    // ============================================
    // ORDENAR POR FECHA DESCENDENTE
    // ============================================

    registros.sort((a, b) => {

      const fechaA =
        convertirFecha(a[0]);

      const fechaB =
        convertirFecha(b[0]);

      if (
        !fechaA ||
        !fechaB
      ) {

        return 0;

      }

      return (
        fechaB.getTime() -
        fechaA.getTime()
      );

    });

    // ============================================
    // RESPUESTA
    // ============================================

    return NextResponse.json({

      ok: true,

      registros,

      total:
        registros.length,

      tramite,

      informacion,

      acompanante,

      institucional,

    });

  } catch (
    error: any
  ) {

    console.error(
      "Error generando reporte de visitas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ??
          "No fue posible generar el reporte.",
      },
      {
        status: 500,
      }
    );

  }

}