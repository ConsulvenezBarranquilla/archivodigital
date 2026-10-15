import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerGestionConsular,
  obtenerReportesEntregados,
  } from "@/lib/googleSheets";
import { obtenerDocumentos } from "@/lib/reportesEntregados/reportesService";
import { obtenerSeguimientoDocumentalTramite } from "@/lib/progresoTramite";

export async function GET(
  req: NextRequest
) {

  try {

    const documento =
      req.nextUrl.searchParams.get(
        "documento"
      );

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

    const [gestionConsular, reportes] = await Promise.all([
      obtenerGestionConsular(),
      obtenerReportesEntregados(),
    ]);

    const cajaRows =
  cajaResponse.data.values || [];

const detalleRows =
  detalleResponse.data.values || [];

const documentosSeguimiento = ([
  "PASAPORTES", "VISA", "APOSTILLA", "FE_VIDA", "CARTA_SOLTERIA",
  "CERTIFICADO_USO", "CONSTANCIA_REGISTRO", "CONSTANCIA_CONSULAR",
  "PODER", "AUTORIZACION_VIAJE",
] as const).flatMap((categoria) => obtenerDocumentos(categoria, {
  caja: cajaRows,
  gestionConsular,
  reportes,
}));

const tramites =
  cajaRows
    .slice(1)
    .filter((row) => {

  const buscado =
    documento
      ?.toString()
      .trim()
      .toUpperCase();

  return (

    row[2]
      ?.toString()
      .trim()
      .toUpperCase() === buscado ||

    row[11]
      ?.toString()
      .trim()
      .toUpperCase() === buscado ||

    row[12]
      ?.toString()
      .trim()
      .toUpperCase() === buscado

  );

})
    .map((row) => {

      const correlativo =
        row[1];

      const actuaciones =
        detalleRows
          .slice(1)
          .filter(
            (d) =>
              d[0] ===
              correlativo
          )
          .map((d) => ({
  codigo: d[1],
  actuacion: d[2],
  monto: d[3],
}));

      return {

        fecha:
          row[0],

        correlativo,

        nombre:
          row[3],

        correo:
          row[4],

        total:
          row[6],

        usuario:
          row[7],

        caja:
          row[8],

        estado:
          row[10] ||
          "GENERADO",

        documentos: obtenerSeguimientoDocumentalTramite(
          documentosSeguimiento,
          String(correlativo ?? ""),
          String(row[10] || "GENERADO").trim().toUpperCase() === "ANULADO"
        ),

        actuaciones,

      };

    });


        return NextResponse.json({
      ok: true,
      tramites,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}
