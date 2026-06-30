import { NextRequest, NextResponse } from "next/server";

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
        Number(d[3]);

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
        const cedula =
  recibo?.[11] || recibo?.[2] || "";

const pasaporte =
  recibo?.[12] || "";

const nacionalidad =
  recibo?.[13] || "";

const documento =
  obtenerDocumentoPrincipal(
    cedula,
    pasaporte,
    nacionalidad
  );

      return [

  recibo?.[0] || "", // Fecha

  d[0],              // Recibo

  documento,         // Documento a imprimir

  recibo?.[3] || "", // Nombre

  d[1],              // Código

  d[2],              // Actuación

  d[3],              // Monto

  usuario,

  caja,

  "GENERADO",

];

    });

    const totalUSD =
  registros.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(item[6]),
    0
  );
const leyendaCodigos: Record<
  string,
  {
    nombre: string;
    cantidad: number;
  }
> = {};

registros.forEach((r) => {

  const codigo = r[4];

  if (!leyendaCodigos[codigo]) {

    leyendaCodigos[codigo] = {

      nombre: r[5],

      cantidad: 0,

    };

  }

  leyendaCodigos[codigo].cantidad++;

});

const leyendaCodigosOrdenada =

Object.fromEntries(

  Object.entries(
    leyendaCodigos
  ).sort(

    (a, b) =>

      a[0].localeCompare(
        b[0]
      )

  )

);
console.log("==================================");
console.log("ESTOY EN CIERRE-DIARIO NUEVO");
console.dir(
  leyendaCodigosOrdenada,
  { depth: null }
);
console.log("==================================");

    return NextResponse.json({
      ok: true,
      fecha: hoy,
      usuario,
      caja,
      tipo,
      registros,
      totalUSD,
      totalRecibos:
new Set(
  correlativos
).size,
      totalActuaciones:
        registros.length,
        leyendaCodigos:
leyendaCodigosOrdenada,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}