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

    const {
      desde,
      hasta,
      documento,
      tipo,
    } = await req.json();

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "BitacoraVisitas!A:G",

      });

    const filas =
      response.data.values || [];

    const fechaDesde =
      inicioDelDia(desde);

    const fechaHasta =
      finDelDia(hasta);

    const resultado =
      filas.slice(1).filter((row) => {

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

        if (documento) {

          const buscado =
            documento
              .trim()
              .toUpperCase();

          const cedula =
            (row[2] || "")
              .toString()
              .trim()
              .toUpperCase();

          const pasaporte =
            (row[3] || "")
              .toString()
              .trim()
              .toUpperCase();

          if (

            cedula !== buscado &&
            pasaporte !== buscado

          ) {

            return false;

          }

        }

        if (

          tipo &&
          tipo !== "Todas" &&
          row[5] !== tipo

        ) {

          return false;

        }

        return true;

      });

    const registros =
      resultado.map((row) => {

        const cedula =
          row[2] || "";

        const pasaporte =
          row[3] || "";

        const nacionalidad =
          row[6] || "";

        const documentoPrincipal =
          obtenerDocumentoPrincipal(

            cedula,
            pasaporte,
            nacionalidad

          );

        return [

  row[0],                // Fecha

  documentoPrincipal,    // Documento

  row[4] || "",          // Nombre

  row[5] || "",          // Tipo

];

      });

    registros.sort((a, b) => {

      const fechaA =
        convertirFecha(a[0]);

      const fechaB =
        convertirFecha(b[0]);

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

    });

    const tramite =
      registros.filter(
        (r) =>
          r[3] === "Trámite"
      ).length;

    const informacion =
      registros.filter(
        (r) =>
          r[3] === "Información"
      ).length;

    const acompanante =
      registros.filter(
        (r) =>
          r[3] === "Acompañante"
      ).length;

    const institucional =
      registros.filter(
        (r) =>
          r[3] ===
          "Cita Institucional"
      ).length;

    return NextResponse.json({

      ok: true,

      registros,

      total:
        registros.length,

      tramite,

      informacion,

      acompanante,

      institucional,

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