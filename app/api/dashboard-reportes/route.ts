import { NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  } from "@/lib/googleSheets";

export async function GET() {

  try {

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range: "Caja!A:M",
      });

    const rows =
      response.data.values || [];

    const hoy =
      new Date();

    const diaActual =
      hoy.getDate();

    const mesActual =
      hoy.getMonth() + 1;

    const anioActual =
      hoy.getFullYear();

    let recibosHoy = 0;
    let usdHoy = 0;
    let actuacionesHoy = 0;

    let recibosMes = 0;
    let usdMes = 0;
    let actuacionesMes = 0;

    let recibosAnio = 0;
    let usdAnio = 0;
    let actuacionesAnio = 0;

    rows.slice(1).forEach(
      (row) => {
        
        const fechaTexto =
          row[0] || "";

        const estado =
          row[10] || "";

        if (
          estado !==
          "GENERADO"
        ) {
          return;
        }

        const soloFecha =
  fechaTexto
    .split(",")[0]
    .trim();
    const partes =
  soloFecha.split("/");

if (partes.length !== 3) {
  return;
}

const dia =
  Number(partes[0]);

const mes =
  Number(partes[1]);

const anio =
  Number(partes[2]);
        

        const totalUsd =
          Number(
            row[6] || 0
          );

        const cantidadActuaciones =
          (row[5] || "")
            .split(";")
            .filter(
              (x: string) =>
                x.trim() !== ""
            )
            .length;

        // HOY

        if (
          dia === diaActual &&
          mes === mesActual &&
          anio === anioActual
        ) {

          recibosHoy++;

          usdHoy +=
            totalUsd;

          actuacionesHoy +=
            cantidadActuaciones;

        }

        // MES

        if (
          mes === mesActual &&
          anio === anioActual
        ) {

          recibosMes++;

          usdMes +=
            totalUsd;

          actuacionesMes +=
            cantidadActuaciones;

        }

        // AÑO

        if (
          anio === anioActual
        ) {

          recibosAnio++;

          usdAnio +=
            totalUsd;

          actuacionesAnio +=
            cantidadActuaciones;

        }

      }
    );

    return NextResponse.json({

      ok: true,

      hoy: {

        usd:
          usdHoy,

        recibos:
          recibosHoy,

        actuaciones:
          actuacionesHoy,

      },

      mes: {

        usd:
          usdMes,

        recibos:
          recibosMes,

        actuaciones:
          actuacionesMes,

      },

      anio: {

        usd:
          usdAnio,

        recibos:
          recibosAnio,

        actuaciones:
          actuacionesAnio,

      },

    });

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}