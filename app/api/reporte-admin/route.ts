import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

function convertirFecha(
  fechaTexto: string
) {

  const fecha =
    fechaTexto
      ?.split(",")[0]
      ?.trim();

  const partes =
    fecha.split("/");

  if (partes.length !== 3) {
    return null;
  }

  return new Date(
    Number(partes[2]),
    Number(partes[1]) - 1,
    Number(partes[0])
  );

}

export async function POST(
  req: NextRequest
) {

  try {

    const filtros =
      await req.json();

    const {
      periodo,
      mes,
      anio,
      desde,
      hasta,
      recibo,
      documento,
      actuacion,
      caja,
      usuario,
      tipo,
      estado,
    } = filtros;

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

    const filasCaja =
      movimientos.slice(1);

    const filasDetalle =
      detalles.slice(1);

    let resultado =
      filasCaja.filter((row) => {

        const fecha =
          convertirFecha(row[0]);

        if (!fecha) {
          return false;
        }

        // DIA ACTUAL
        if (
          periodo === "dia"
        ) {

          const hoy =
            new Date();

          if (
            fecha.toDateString() !==
            hoy.toDateString()
          ) {
            return false;
          }

        }

        // MES
        if (
          periodo === "mes"
        ) {

          if (
            fecha.getMonth() + 1 !== Number(mes)
          ) {
            return false;
          }

          if (
            fecha.getFullYear() !== Number(anio)
          ) {
            return false;
          }

        }

        // RANGO
        if (
          periodo === "rango"
        ) {

          const fechaDesde =
            new Date(desde);

          const fechaHasta =
            new Date(hasta);

          if (
            fecha < fechaDesde ||
            fecha > fechaHasta
          ) {
            return false;
          }

        }

if (
  recibo &&
  row[1] !==
    recibo
) {
  return false;
}

        if (
          documento &&
          row[2] !== documento
        ) {
          return false;
        }

        if (
  caja &&
  caja !== "Todas" &&
  row[8] !== caja
) {
  return false;
}

        if (
  usuario &&
  usuario !== "Todos" &&
  row[7] !== usuario
) {
  return false;
}

        if (
  estado &&
  estado !== "Todos" &&
  row[10] !== estado
) {
  return false;
}

        return true;

      });

    let registros: any[] = [];

    resultado.forEach(
      (movimiento) => {

        const correlativo =
          movimiento[1];

        const detallesRecibo =
          filasDetalle.filter(
            (d) =>
              d[0] === correlativo
          );

        detallesRecibo.forEach(
          (detalle) => {

            const monto =
              Number(
                detalle[2]
              );

            if (
              tipo === "Pagas" &&
              monto <= 0
            ) {
              return;
            }

            if (
              tipo ===
                "Gratuitas" &&
              monto > 0
            ) {
              return;
            }

            if (
      actuacion &&
      actuacion !== "Todas" &&
      detalle[1] !== actuacion
    ) {
      return;
    }

            registros.push([
              movimiento[0], // fecha
              correlativo,
              movimiento[2], // documento
              movimiento[3], // nombre
              detalle[1],    // actuacion
              detalle[2],    // monto
              movimiento[7], // usuario
              movimiento[8], // caja
              movimiento[10] // estado
            ]);

          }
        );

      }
    );

    const totalUSD =
  registros
    .filter(
      (item) =>
        item[8] ===
        "GENERADO"
    )
    .reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item[5]
        ),
      0
    );

    
const recibosGenerados =
  new Set(
    registros
      .filter(
        (r) =>
          r[8] ===
          "GENERADO"
      )
      .map(
        (r) => r[1]
      )
  );

const anuladosUnicos =
  new Set(
    registros
      .filter(
        (r) =>
          r[8] ===
          "ANULADO"
      )
      .map(
        (r) => r[1]
      )
  );

const totalAnulados =
  anuladosUnicos.size;
registros.sort(
  (a, b) => {

    const fechaA =
      convertirFecha(a[0]);

    const fechaB =
      convertirFecha(b[0]);

    if (!fechaA || !fechaB) {
      return 0;
    }

    return (
      fechaB.getTime() -
      fechaA.getTime()
    );

  }
);
const actuacionesGeneradas =
  registros.filter(
    (r) =>
      r[8] ===
      "GENERADO"
  );
const resumenActuaciones: any = {};

registros.forEach((row: any) => {

  const actuacion = row[4];

  const monto =
    Number(row[5] || 0);

  if (
    !resumenActuaciones[
      actuacion
    ]
  ) {

    resumenActuaciones[
      actuacion
    ] = {

      cantidad: 0,

      usd: 0,

    };

  }

  if (
  row[8] ===
  "GENERADO"
) {

  resumenActuaciones[
    actuacion
  ].cantidad++;

  resumenActuaciones[
    actuacion
  ].usd += monto;

}

});    
return NextResponse.json({
      ok: true,
      registros,
      totalUSD,
      totalRecibos:
        recibosGenerados.size,
      totalActuaciones:
        actuacionesGeneradas.length,
      totalAnulados,
      resumenActuaciones,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}