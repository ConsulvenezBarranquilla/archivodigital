import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {
      usuario,
      caja,
      tipo,
    } = await req.json();

    const hoy =
      new Date()
        .toLocaleDateString(
          "es-CO"
        );

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

    const recibosDelDia =
      movimientos.filter(
        (row, index) => {

          if (index === 0)
            return false;

          const fecha =
            row[0]
              ?.split(",")[0]
              ?.trim();

          return (
            fecha === hoy &&
            row[7] === usuario &&
            row[8] === caja &&
            row[10] ===
              "GENERADO"
          );

        }
      );

    const correlativos =
      recibosDelDia.map(
        (r) => r[1]
      );

    const registros =
  detalles
    .slice(1)
    .filter((d) =>
      correlativos.includes(
        d[0]
      )
    )
    .filter((d) => {

      const monto =
        Number(d[2]);

      if (
        tipo ===
        "pagas"
      ) {
        return monto > 0;
      }

      if (
        tipo ===
        "gratis"
      ) {
        return monto === 0;
      }

      return true;

    })
    .map((d) => {

      const recibo =
        recibosDelDia.find(
          (r) => r[1] === d[0]
        );

      return [
        d[0],                 // Correlativo
        recibo?.[2] || "",    // Documento
        recibo?.[3] || "",    // Nombre
        d[1],                 // Actuación
        d[2],                 // Monto
      ];

    });

    const totalUSD =
  registros.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(item[4]),
    0
  );

    return NextResponse.json({
      ok: true,
      fecha: hoy,
      usuario,
      caja,
      tipo,
      registros,
      totalUSD,
      totalRecibos:
        correlativos.length,
      totalActuaciones:
        registros.length,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}