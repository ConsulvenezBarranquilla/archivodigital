import {
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {

  try {

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "BitacoraVisitas!A:F",
      });
const registroResponse =
  await sheets.spreadsheets.values.get({
    spreadsheetId:
      REGISTRO_CONSULAR_SHEET_ID,
    range:
      "Respuestas de formulario 1!B:G",
  });

const registroRows =
  registroResponse.data.values || [];

    const rows =
      response.data.values || [];

    const hoy =
      new Date();

    const dia =
      hoy.toLocaleDateString(
        "es-CO"
      );

    const mes =
      hoy.getMonth();

    const anio =
      hoy.getFullYear();

    let hoyTotal = 0;
    let mesTotal = 0;
    let anioTotal = 0;

    const tipos = {

      "Trámite": {
        hoy: 0,
        mes: 0,
        anio: 0,
      },

      "Información": {
        hoy: 0,
        mes: 0,
        anio: 0,
      },

      "Acompañante": {
        hoy: 0,
        mes: 0,
        anio: 0,
      },

      "Cita Institucional": {
        hoy: 0,
        mes: 0,
        anio: 0,
      },

    };

    rows
      .slice(1)
      .forEach((row) => {

        const fechaTexto =
  row[0];

const tipo =
  row[5];

if (!fechaTexto)
  return;

const fecha =
  new Date(fechaTexto);

if (isNaN(fecha.getTime()))
  return;

        if (
          fecha.getFullYear() ===
          anio
        ) {

          anioTotal++;

          if (
            tipos[
              tipo as keyof typeof tipos
            ]
          ) {

            tipos[
              tipo as keyof typeof tipos
            ].anio++;

          }

        }

        if (
          fecha.getFullYear() ===
            anio &&
          fecha.getMonth() ===
            mes
        ) {

          mesTotal++;

          if (
            tipos[
              tipo as keyof typeof tipos
            ]
          ) {

            tipos[
              tipo as keyof typeof tipos
            ].mes++;

          }

        }

        const hoyColombia =
  new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone:
        "America/Bogota",
    }
  ).format(new Date());

const fechaFila =
  new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone:
        "America/Bogota",
    }
  ).format(fecha);

if (fechaFila === hoyColombia) {

          hoyTotal++;

          if (
            tipos[
              tipo as keyof typeof tipos
            ]
          ) {

            tipos[
              tipo as keyof typeof tipos
            ].hoy++;

          }

        }

      });
let ciudadanosRegistrados = 0;

let venezolanos = 0;

let extranjeros = 0;

registroRows
  .slice(1)
  .forEach((row) => {

    const documento =
      row[0];

    const nacionalidad =
      row[5]
        ?.toString()
        .trim()
        .toUpperCase();

    if (!documento) {
      return;
    }

    ciudadanosRegistrados++;

    if (!nacionalidad) {
  return;
}

if (nacionalidad === "VENEZOLANO") {

  venezolanos++;

} else {

  extranjeros++;

}

  });
    return NextResponse.json({
      ok: true,

      hoyTotal,

      mesTotal,

      anioTotal,

      tipos,

      ciudadanosRegistrados,

  venezolanos,

  extranjeros,

    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}