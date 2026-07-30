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

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

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
        // ===============================
    // Construir listado de actuaciones
    // vinculadas
    // ===============================
    // ===============================
    // Índice rápido de recibos
    // ===============================

    const cajaMap =
      new Map<string, any>();

    filasCaja.forEach((caja) => {

      const correlativo =
        (caja[1] || "")
          .toString()
          .trim();

      cajaMap.set(

        correlativo,

        caja

      );

    });
    filasGestion.forEach((gc) => {

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
          // No mostrar actuaciones históricas desvinculadas.
// Permanecen en Google Sheets para auditoría.
if (estadoGC === "DESVINCULADO") {
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

            const recibo =
        cajaMap.get(
          correlativo
        );

      if (!recibo) {

        return;

      }

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

      registros.push({

        fechaRecibo:
          recibo[0] || "",

        recibo:
          correlativo,

        documento,

        cedula,

        pasaporte,

        nombre:
          recibo[3] || "",

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
        const resultado =
      registros.filter((r) => {

        if (

          planilla &&

          !r.planilla
            .toUpperCase()
            .includes(planilla)

        ) return false;

        if (

          documento &&

          !r.documento
            .toUpperCase()
            .includes(documento)

        ) return false;

        if (

          nombre &&

          !r.nombre
            .toUpperCase()
            .includes(nombre)

        ) return false;

        if (

          recibo &&

          !r.recibo
            .toUpperCase()
            .includes(recibo)

        ) return false;

        if (

          codigo &&

          !r.codigo
            .toUpperCase()
            .includes(codigo)

        ) return false;

        if (

          estado &&

          r.estado !== estado

        ) return false;

        return true;

      });

    resultado.sort((a, b) => {

  // Las actuaciones SIN PLANILLA siempre al final
  if (!a.planilla && b.planilla) return 1;
  if (a.planilla && !b.planilla) return -1;

  const planilla = a.planilla.localeCompare(
    b.planilla,
    undefined,
    { numeric: true }
  );

  if (planilla !== 0) {
    return planilla;
  }

  return a.numeroActuacion.localeCompare(
    b.numeroActuacion,
    undefined,
    { numeric: true }
  );

});

    return NextResponse.json({

      ok: true,

      total:
        resultado.length,

      registros:
        resultado,

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