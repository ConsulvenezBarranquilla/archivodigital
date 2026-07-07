import { NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

import {
  hoyISO,
} from "@/lib/fechas";

export async function GET() {

  try {

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "Caja!A:M",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "DetalleCaja!A:D",
      });

    const usuariosResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "UsuariosCaja!A:F",
      });

      const visitasResponse =
  await sheets.spreadsheets.values.get({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,
    range:
      "BitacoraVisitas!A:G",
  });

const registroResponse =
  await sheets.spreadsheets.values.get({
    spreadsheetId:
      REGISTRO_CONSULAR_SHEET_ID,
    range:
      "Respuestas de formulario 1!B:G",
  });

    const cajaRows =
      cajaResponse.data.values || [];

    const detalleRows =
      detalleResponse.data.values || [];

    const usuariosRows =
      usuariosResponse.data.values || [];

      const visitasRows =
  visitasResponse.data.values || [];

const registroRows =
  registroResponse.data.values || [];

    const hoy = hoyISO();

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

    let visitasHoy = 0;

let visitasMes = 0;

let visitasAcumuladas = 0;

let ciudadanosRegistrados = 0;

let venezolanos = 0;

let extranjeros = 0;

const ultimasVisitas: any[] = [];

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
  fecha.substring(0, 10);

const anio =
  Number(
    fechaSolo.substring(0, 4)
  );

const mes =
  Number(
    fechaSolo.substring(5, 7)
  );


        if (
  fechaSolo === hoy
) {

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

    recibosHoy++;

    usdHoy +=
      totalUsd;

    if (
      caja ===
      "Caja 1"
    ) {

      caja1Recibos++;

      caja1Usd +=
        totalUsd;

    }

    if (
      caja ===
      "Caja 2"
    ) {

      caja2Recibos++;

      caja2Usd +=
        totalUsd;

    }

  }

}

        if (
  mes === mesActual &&
  anio === anioActual
) {

  if (
    estado === "ANULADO"
  ) {

    anuladosMes++;

  }

  if (
    estado === "GENERADO"
  ) {

    recibosMes++;

    usdMes += totalUsd;

    const actuacionesTexto =
      row[5] || "";

    actuacionesMes +=
      actuacionesTexto
        .split(";")
        .filter(
          (x: string) =>
            x.trim() !== ""
        ).length;

  }

}
const correlativo =
  row[1] || "";

const primerDetalle =
  detalleRows
    .slice(1)
    .find(
      (d) =>
        d[0] === correlativo
    );

const codigoActuacion =
  primerDetalle?.[1] || "";
        ultimosMovimientos.push({

  correlativo,

  nombre:
    row[3] || "",

  codigo:
    codigoActuacion,

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
          row[2] || "";

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
visitasRows
  .slice(1)
  .forEach((row) => {

    const fechaTexto =
      row[0] || "";

    if (!fechaTexto)
      return;

    const fechaSolo =
      fechaTexto.substring(0, 10);

        const mesVisita =
      Number(
        fechaSolo.substring(
          5,
          7
        )
      );

    const anioVisita =
      Number(
        fechaSolo.substring(
          0,
          4
        )
      );

    visitasAcumuladas++;

    if (
      fechaSolo ===
      hoy
    ) {

      visitasHoy++;

    }

    if (

      mesVisita ===
        mesActual &&

      anioVisita ===
        anioActual

    ) {

      visitasMes++;

    }

    ultimasVisitas.push({

      fecha:
        fechaTexto,

      documento:
        row[1] || "",

      nombre:
        row[4] || "",

      tipo:
        row[5] || "",

    });

  });

ultimasVisitas.reverse();
registroRows
  .slice(1)
  .forEach((row) => {

    const documento =
      row[0];

    if (!documento)
      return;

    ciudadanosRegistrados++;

    const nacionalidad =
      (
        row[5] || ""
      )
        .toString()
        .trim()
        .toUpperCase();

    if (
      nacionalidad ===
      "VENEZOLANO"
    ) {

      venezolanos++;

    } else {

      extranjeros++;

    }

  });
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

      visitasHoy,
visitasMes,
visitasAcumuladas,

ciudadanosRegistrados,
venezolanos,
extranjeros,

ultimosMovimientos:
  ultimosMovimientos.slice(
    0,
    10
  ),

ultimasVisitas:
  ultimasVisitas.slice(
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