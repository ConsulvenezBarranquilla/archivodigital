import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
  } from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {
      documento,
    } = await req.json();

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "Caja!A:N",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "DetalleCaja!A:D",
      });

    const movimientos =
      cajaResponse.data.values || [];

    const detalles =
      detalleResponse.data.values || [];

    const recibos =
  movimientos
    .slice(1)
    .filter((row) => {

      const buscado =
        documento
          ?.trim()
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

    });

    const historial =
      recibos.map(
        (recibo) => {

          const correlativo =
            recibo[1];

          const actuaciones =
            detalles
              .slice(1)
              .filter(
                (d) =>
                  d[0] ===
                  correlativo
              )
              .map((d) => ({

  codigo:
    d[1],

  actuacion:
    d[2],

  monto:
    d[3],

}));

          const cedula =
  (recibo[11] || recibo[2] || "").toString();

const pasaporte =
  (recibo[12] || "").toString();

const nacionalidad =
  (recibo[13] || "").toString();

const documentoPrincipal =
  obtenerDocumentoPrincipal(
    cedula,
    pasaporte,
    nacionalidad
  );

return {

  fecha:
    recibo[0],

  correlativo,

  documento:
    documentoPrincipal,

  cedula,

  pasaporte,

  nombre:
    recibo[3],

  usuario:
    recibo[7],

  caja:
    recibo[8],

  estado:
    recibo[10],

  actuaciones,

};

        }
      );
historial.sort((a, b) =>

  b.fecha.localeCompare(a.fecha)

);
    return NextResponse.json({
      ok: true,
      total:
        historial.length,
      historial,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}