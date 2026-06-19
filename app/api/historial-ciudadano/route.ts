import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
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
        range: "Caja!A:K",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "DetalleCaja!A:C",
      });

    const movimientos =
      cajaResponse.data.values || [];

    const detalles =
      detalleResponse.data.values || [];

    const recibos =
      movimientos
        .slice(1)
        .filter(
          (row) =>
            row[2] ===
            documento
        );

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
              .map(
                (d) => ({
                  actuacion:
                    d[1],
                  monto:
                    d[2],
                })
              );

          return {
            fecha:
              recibo[0],

            correlativo,

            documento:
              recibo[2],

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