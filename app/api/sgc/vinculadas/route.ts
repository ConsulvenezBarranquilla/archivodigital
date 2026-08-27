import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,

  MODULO_CAJA_SHEET_ID,

  obtenerDocumentoPrincipal,

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

    return fecha.getFullYear();

  }

  // --------------------------------------------------
  // Buscar año explícito
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
    // Filtros existentes
    // ==================================================

    const fechaDesde =
      req.nextUrl.searchParams.get(
        "fechaDesde"
      ) || "";

    const fechaHasta =
      req.nextUrl.searchParams.get(
        "fechaHasta"
      ) || "";

    const planilla =
      req.nextUrl.searchParams.get(
        "planilla"
      )?.trim()
       .toUpperCase() || "";

    const documento =
      req.nextUrl.searchParams.get(
        "documento"
      )?.trim()
       .toUpperCase() || "";

    const nombre =
      req.nextUrl.searchParams.get(
        "nombre"
      )?.trim()
       .toUpperCase() || "";

    const recibo =
      req.nextUrl.searchParams.get(
        "recibo"
      )?.trim()
       .toUpperCase() || "";

    const codigo =
      req.nextUrl.searchParams.get(
        "codigo"
      )?.trim()
       .toUpperCase() || "";

    const estado =
      req.nextUrl.searchParams.get(
        "estado"
      )?.trim()
       .toUpperCase() || "";

    // ==================================================
    // Leer Caja
    // ==================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:S",

      });

    // ==================================================
    // Leer Gestión Consular
    // ==================================================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const caja =
      cajaResponse.data.values || [];

    const gestion =
      gestionResponse.data.values || [];

    const filasCaja =
      caja.slice(1);

    const filasGestion =
      gestion.slice(1);

    const registros: any[] = [];

    // ==================================================
    // Índice rápido de recibos
    // ==================================================

    const cajaMap =
      new Map<string, any>();

    filasCaja.forEach((filaCaja) => {

      const correlativo =
        (filaCaja[1] || "")
          .toString()
          .trim();

      if (correlativo) {

        cajaMap.set(

          correlativo,

          filaCaja

        );

      }

    });

    // ==================================================
    // Construir listado de actuaciones vinculadas
    // ==================================================

    filasGestion.forEach((gc) => {

      // ==================================================
      // Datos Gestión Consular
      // ==================================================

      const correlativo =
        (gc[0] || "")
          .toString()
          .trim();

      const codigoGC =
        (gc[1] || "")
          .toString()
          .trim()
          .toUpperCase();

      const actuacionGC =
        (gc[2] || "")
          .toString()
          .trim();

      const planillaGC =
        (gc[3] || "")
          .toString()
          .trim();

      const fechaPlanilla =
        gc[4] || "";

      const usuario =
        gc[5] || "";

      const estadoGC =
        (gc[6] || "")
          .toString()
          .trim()
          .toUpperCase();

      // ==================================================
      // No mostrar actuaciones históricas desvinculadas
      // ==================================================

      if (
        estadoGC === "DESVINCULADO"
      ) {

        return;

      }

      const fechaRegistro =
        gc[7] || "";

      const fechaDesvinculacion =
        gc[8] || "";

      const usuarioDesvinculacion =
        gc[9] || "";

      const observaciones =
        gc[10] || "";

      const numeroActuacion =
        (gc[11] || "")
          .toString()
          .trim();

      // ==================================================
      // Buscar recibo en Caja
      // ==================================================

      const recibo =
        cajaMap.get(
          correlativo
        );

      if (!recibo) {

        return;

      }

      // ==================================================
      // FILTRO POR AÑO
      //
      // Caja!A = fecha del recibo
      // ==================================================

      const anioRecibo =
        obtenerAnio(
          recibo[0]
        );

      if (
        anioRecibo !==
        anioSeleccionado
      ) {

        return;

      }

      // ==================================================
      // Titulares especiales
      // ==================================================

      const titularesEspeciales =

        (recibo[14] || "")
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

      // ==================================================
      // Pasaportes / Visa
      // ==================================================

      const pasaportesVisa =

        (recibo[15] || "")
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

      // ==================================================
      // Datos del ciudadano
      // ==================================================

      const cedula =
        recibo[11] || "";

      const pasaporte =
        recibo[12] || "";

      const nacionalidad =
        recibo[13] || "";

      const documento =
        obtenerDocumentoPrincipal(

          cedula,

          pasaporte,

          nacionalidad

        );

      // ==================================================
      // Nombre / documento por defecto
      // ==================================================

      let nombreMostrar =
        recibo[3] || "";

      let documentoMostrar =
        documento;

      // ==================================================
      // VISAS
      // ==================================================

      if (

        actuacionGC
          .toUpperCase()
          .includes("VISA")

      ) {

        const titularVisa =
          (recibo[16] || "")
            .toString()
            .trim();

        const pasaporteVisa =
          (recibo[17] || "")
            .toString()
            .trim();

        if (titularVisa) {

          nombreMostrar =
            titularVisa;

        }

        if (pasaporteVisa) {

          documentoMostrar =
            pasaporteVisa;

        }

      }

      // ==================================================
      // Agregar registro
      // ==================================================

      registros.push({

        fechaRecibo:
          recibo[0] || "",

        recibo:
          correlativo,

        documento:
          documentoMostrar,

        cedula,

        pasaporte,

        nombre:
          nombreMostrar,

        titular:
          nombreMostrar,

        codigo:
          codigoGC,

        actuacion:
          actuacionGC,

        planilla:
          planillaGC,

        fechaPlanilla,

        usuario,

        estado:
          estadoGC,

        fechaRegistro,

        fechaDesvinculacion,

        usuarioDesvinculacion,

        observaciones,

        numeroActuacion,

      });

    });

    // ==================================================
    // Aplicar filtros adicionales
    // ==================================================

    const resultado =
      registros.filter((r) => {

        // ----------------------------------------------
        // Fecha desde
        // ----------------------------------------------

        if (fechaDesde) {

          const fechaRegistro =
            new Date(
              r.fechaRecibo
            );

          const desde =
            new Date(
              `${fechaDesde}T00:00:00`
            );

          if (
            Number.isNaN(
              fechaRegistro.getTime()
            ) ||

            fechaRegistro < desde
          ) {

            return false;

          }

        }

        // ----------------------------------------------
        // Fecha hasta
        // ----------------------------------------------

        if (fechaHasta) {

          const fechaRegistro =
            new Date(
              r.fechaRecibo
            );

          const hasta =
            new Date(
              `${fechaHasta}T23:59:59`
            );

          if (
            Number.isNaN(
              fechaRegistro.getTime()
            ) ||

            fechaRegistro > hasta
          ) {

            return false;

          }

        }

        // ----------------------------------------------
        // Planilla
        // ----------------------------------------------

        if (

          planilla &&

          !r.planilla
            .toUpperCase()
            .includes(planilla)

        ) {

          return false;

        }

        // ----------------------------------------------
        // Documento
        // ----------------------------------------------

        if (

          documento &&

          !r.documento
            .toUpperCase()
            .includes(documento)

        ) {

          return false;

        }

        // ----------------------------------------------
        // Nombre
        // ----------------------------------------------

        if (

          nombre &&

          !r.nombre
            .toUpperCase()
            .includes(nombre)

        ) {

          return false;

        }

        // ----------------------------------------------
        // Recibo
        // ----------------------------------------------

        if (

          recibo &&

          !r.recibo
            .toUpperCase()
            .includes(recibo)

        ) {

          return false;

        }

        // ----------------------------------------------
        // Código
        // ----------------------------------------------

        if (

          codigo &&

          !r.codigo
            .toUpperCase()
            .includes(codigo)

        ) {

          return false;

        }

        // ----------------------------------------------
        // Estado
        // ----------------------------------------------

        if (

          estado &&

          r.estado !== estado

        ) {

          return false;

        }

        return true;

      });

    // ==================================================
    // Ordenar
    // ==================================================

    resultado.sort((a, b) => {

      // Las actuaciones SIN PLANILLA
      // siempre al final

      if (
        !a.planilla &&
        b.planilla
      ) {

        return 1;

      }

      if (
        a.planilla &&
        !b.planilla
      ) {

        return -1;

      }

      // Ordenar por planilla

      const planilla =
        a.planilla.localeCompare(

          b.planilla,

          undefined,

          {
            numeric: true,
          }

        );

      if (
        planilla !== 0
      ) {

        return planilla;

      }

      // Ordenar por número de actuación

      return a.numeroActuacion.localeCompare(

        b.numeroActuacion,

        undefined,

        {
          numeric: true,
        }

      );

    });

    // ==================================================
    // Respuesta
    // ==================================================

    return NextResponse.json({

      ok: true,

      anio:
        anioSeleccionado,

      total:
        resultado.length,

      registros:
        resultado,

    });

  }

  catch (error: any) {

    console.error(

      "Error obteniendo vinculadas SGC:",

      error

    );

    return NextResponse.json(

      {

        ok: false,

        error:
          error?.message ||

          "No fue posible obtener las actuaciones vinculadas.",

      },

      {

        status: 500,

      }

    );

  }

}