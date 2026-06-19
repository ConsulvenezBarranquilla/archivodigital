import { NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {

  try {

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "Caja!A:K",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "DetalleCaja!A:C",
      });

    const usuariosResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "UsuariosCaja!A:F",
      });

    const cajaRows =
      cajaResponse.data.values || [];

    const detalleRows =
      detalleResponse.data.values || [];

    const usuariosRows =
      usuariosResponse.data.values || [];

    const hoy =
      new Date()
        .toLocaleDateString(
          "es-CO"
        );

    const mesActual =
      new Date().getMonth() + 1;

    const anioActual =
      new Date().getFullYear();

    let recibosHoy = 0;
    let usdHoy = 0;
    let anuladosHoy = 0;

    let recibosMes = 0;
    let usdMes = 0;
    let anuladosMes = 0;
    let actuacionesMes = 0;

    let caja1Recibos = 0;
    let caja1Usd = 0;

    let caja2Recibos = 0;
    let caja2Usd = 0;

    const ultimosMovimientos: any[] =
      [];

    cajaRows
      .slice(1)
      .forEach((row) => {

        const fecha =
          row[0] || "";

        const totalUsd =
          Number(
            row[6] || 0
          );

        const caja =
          row[8] || "";

        const estado =
          row[10] || "";

        const fechaSolo =
          fecha.split(",")[0];

        const partes =
          fechaSolo.split("/");

        let dia = 0;
        let mes = 0;
        let anio = 0;

        if (
          partes.length === 3
        ) {

          dia =
            Number(partes[0]);

          mes =
            Number(partes[1]);

          anio =
            Number(partes[2]);

        }

        if (
          fechaSolo === hoy
        ) {

          recibosHoy++;

          if (
            estado ===
            "ANULADO"
          ) {

            anuladosHoy++;

          }

          if (
            estado ===
            "GENERADO"
          ) {

            usdHoy +=
              totalUsd;

          }

          if (
            caja ===
            "Caja 1"
          ) {

            caja1Recibos++;

            if (
              estado ===
              "GENERADO"
            ) {

              caja1Usd +=
                totalUsd;

            }

          }

          if (
            caja ===
            "Caja 2"
          ) {

            caja2Recibos++;

            if (
              estado ===
              "GENERADO"
            ) {

              caja2Usd +=
                totalUsd;

            }

          }

        }

        if (
          mes ===
            mesActual &&
          anio ===
            anioActual
        ) {

          recibosMes++;

          if (
            estado ===
            "ANULADO"
          ) {

            anuladosMes++;

          }

          if (
  estado ===
  "GENERADO"
) {

  usdMes +=
    totalUsd;

  const actuacionesTexto =
    row[5] || "";

  actuacionesMes +=
    actuacionesTexto
      .split(",")
      .filter(
  (x: string) =>
    x.trim() !== ""
).length;

}

        }

        ultimosMovimientos.push({

          correlativo:
            row[1] || "",

          nombre:
            row[3] || "",

          usd:
            totalUsd,

          caja,

          estado,

        });

      });

    const actuacionesMap =
      new Map();

    detalleRows
      .slice(1)
      .forEach((row) => {

        const actuacion =
          row[1] || "";

        if (
          !actuacion
        ) return;

        actuacionesMap.set(

          actuacion,

          (
            actuacionesMap.get(
              actuacion
            ) || 0
          ) + 1

        );

      });

    const topActuaciones =
      Array.from(
        actuacionesMap.entries()
      )
        .map(
          (
            [nombre,
             cantidad]
          ) => ({

            nombre,

            cantidad,

          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.cantidad -
            a.cantidad
        )
        .slice(0, 10);

    const usuariosActivos =
      usuariosRows
        .slice(1)
        .filter(
          (row) =>
            row[4] ===
            "SI"
        ).length;

    ultimosMovimientos.reverse();

    return NextResponse.json({

      ok: true,

      recibosHoy,

      usdHoy,

      anuladosHoy,

      usuariosActivos,

      caja1: {

        recibos:
          caja1Recibos,

        usd:
          caja1Usd,

      },

      caja2: {

        recibos:
          caja2Recibos,

        usd:
          caja2Usd,

      },

      recibosMes,

      usdMes,

      anuladosMes,
      actuacionesMes,

      topActuaciones,

      ultimosMovimientos:
        ultimosMovimientos.slice(
          0,
          10
        ),

    });

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}