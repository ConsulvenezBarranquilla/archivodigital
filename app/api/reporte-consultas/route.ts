import { NextRequest, NextResponse } from "next/server";

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

export async function POST(
  req: NextRequest
) {

  try {

    const filtros =
      await req.json();

    const {

      desde,
      hasta,
      recibo,
      documento,
      actuacion,
      tipo,
      estado,

    } = filtros;

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

    const movimientos =
      cajaResponse.data.values || [];

    const detalles =
      detalleResponse.data.values || [];

    const filasCaja =
      movimientos.slice(1);

    const filasDetalle =
      detalles.slice(1);

    const fechaDesde =
      inicioDelDia(desde);

    const fechaHasta =
      finDelDia(hasta);
          const resultado =
      filasCaja.filter((row) => {

        const fecha =
          convertirFecha(row[0]);

        if (
          !fecha ||
          !fechaDesde ||
          !fechaHasta
        ) {

          return false;

        }

        if (
          fecha < fechaDesde ||
          fecha > fechaHasta
        ) {

          return false;

        }

        if (recibo) {

          if (
            (row[1] || "")
              .toString()
              .trim() !==
            recibo.trim()
          ) {

            return false;

          }

        }

        if (documento) {

          const buscado =
            documento
              .trim()
              .toUpperCase();

          const documentoImpreso =
            (row[2] || "")
              .toString()
              .trim()
              .toUpperCase();

          const cedula =
            (row[11] || row[2] || "")
              .toString()
              .trim()
              .toUpperCase();

          const pasaporte =
            (row[12] || "")
              .toString()
              .trim()
              .toUpperCase();

          if (

            documentoImpreso !== buscado &&
            cedula !== buscado &&
            pasaporte !== buscado

          ) {

            return false;

          }

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
                detalle[3] || 0
              );

            if (
              tipo === "Pagas" &&
              monto <= 0
            ) {

              return;

            }

            if (
              tipo === "Gratuitas" &&
              monto > 0
            ) {

              return;

            }

            if (

              actuacion &&
              actuacion !== "Todas" &&
              detalle[2] !== actuacion

            ) {

              return;

            }

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

            const documentoPrincipal =
              obtenerDocumentoPrincipal(

                cedula,
                pasaporte,
                nacionalidad

              );

            registros.push([

  movimiento[0],      // 0 Fecha

  correlativo,        // 1 Recibo

  documentoPrincipal, // 2 Documento

  movimiento[3],      // 3 Nombre

  detalle[2],         // 4 Actuación

  monto,              // 5 USD

  movimiento[10],     // 6 Estado

]);

          }

        );

      });
          const totalUSD =
      registros
        .filter(
          (item) =>
            item[6] ===
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
              r[6] ===
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
              r[6] ===
              "ANULADO"
          )

          .map(
            (r) => r[1]
          )

      );

    const totalAnulados =
      anuladosUnicos.size;

    const actuacionesGeneradas =
      registros.filter(
        (r) =>
          r[6] ===
          "GENERADO"
      );

    registros.sort(
      (a, b) => {

        const fechaA =
          convertirFecha(
            a[0]
          );

        const fechaB =
          convertirFecha(
            b[0]
          );

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

      }
    );

    const resumenActuaciones: any =
      {};

    registros.forEach((row) => {

      const codigo =
        row[4];

      const actuacion =
        row[4];

      const monto =
        Number(
          row[5] || 0
        );

      if (
        !resumenActuaciones[
          codigo
        ]
      ) {

        resumenActuaciones[
          codigo
        ] = {

          nombre:
            actuacion,

          cantidad: 0,

          usd: 0,

        };

      }

      if (
        row[6] ===
        "GENERADO"
      ) {

        resumenActuaciones[
          codigo
        ].cantidad++;

        resumenActuaciones[
          codigo
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