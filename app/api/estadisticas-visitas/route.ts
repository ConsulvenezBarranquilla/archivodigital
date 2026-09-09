import {
  NextResponse,
} from "next/server";

import {
  leerHoja,
  leerHojaRegistro,
} from "@/lib/googleSheets";

import {
  convertirFecha,
  hoyISO,
} from "@/lib/fechas";

export async function GET() {

  try {

    const rows =
  await leerHoja(
    "BitacoraVisitas",
    "A:F",
  );

const registroRows =
  await leerHojaRegistro(
    "Respuestas de formulario 1!B:G",
  );

    const hoy =
  hoyISO();

const mes =
  Number(
    hoy.substring(5,7)
  ) - 1;

const anio =
  Number(
    hoy.substring(0,4)
  );

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
  convertirFecha(
    fechaTexto
  );

if (!fecha)
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

        const fechaFila =
  fechaTexto.substring(
    0,
    10
  );

if (
  fechaFila === hoy
) {

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