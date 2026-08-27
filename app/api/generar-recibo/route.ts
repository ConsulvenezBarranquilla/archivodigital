import { NextRequest, NextResponse } from "next/server";

import {
  obtenerCorrelativos,
  actualizarCorrelativo,
  guardarMovimientoCaja,
  guardarDetalleCaja,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

import {
  fechaHoraActual,
  anioActual,
} from "@/lib/fechas";

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json();

    const {
      ciudadano,
      actuaciones,
      totalUSD,
      usuario,
      titularesEspeciales,
    } = body;

    // ======================================================
    // VALIDACIONES
    // ======================================================

    if (
      !Array.isArray(actuaciones) ||
      actuaciones.length === 0
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Debe existir al menos una actuación para generar el recibo.",
      });

    }

    // ======================================================
    // MÁXIMO 5 ACTUACIONES POR RECIBO
    // ======================================================

    if (
      actuaciones.length > 5
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Un recibo puede contener un máximo de 5 actuaciones.",
      });

    }

    if (!ciudadano) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "No se recibió la información del ciudadano.",
      });

    }

    if (!usuario) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "No se recibió la información del usuario de Caja.",
      });

    }

    console.log(
      "CIUDADANO RECIBIDO:"
    );

    console.dir(
      ciudadano,
      {
        depth: null,
      }
    );

    // ======================================================
    // DOCUMENTO PRINCIPAL
    // ======================================================

    const documentoImpreso =
      obtenerDocumentoPrincipal(
        ciudadano.cedula,
        ciudadano.pasaporte,
        ciudadano.nacionalidad
      );

    // ======================================================
    // AÑO
    // ======================================================

    const anio =
      anioActual();

    // ======================================================
    // OBTENER CORRELATIVO
    // ======================================================

    const correlativos =
      await obtenerCorrelativos();

    let fila = -1;
    let ultimo = 0;

    correlativos.forEach(
      (row, index) => {

        if (
          Number(row[0]) === anio
        ) {

          fila =
            index + 1;

          ultimo =
            Number(row[1]);

        }

      }
    );

    if (
      fila === -1
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Año no encontrado en Correlativos",
      });

    }

    // ======================================================
    // NUEVO CORRELATIVO
    // ======================================================

    const nuevo =
      ultimo + 1;

    await actualizarCorrelativo(
      fila,
      nuevo
    );

    const correlativo =
      `${String(nuevo).padStart(
        4,
        "0"
      )}/${anio}`;

    // ======================================================
    // FECHA
    // ======================================================

    const fecha =
      fechaHoraActual();

   // ======================================================
// TITULARES ESPECIALES
// ======================================================
//
// Caja:
// O = Titular Pasaporte NNA
// P = Titular Apostilla NNA
// Q = Titular Visa
// R = Pasaporte Titular Visa
// S = Observaciones
// ======================================================

let titularPasaporte = "";
let titularApostilla = "";
let titularVisa = "";
let pasaporteVisa = "";
let observaciones = "";

if (
  Array.isArray(titularesEspeciales)
) {

  const listaPasaporte: string[] = [];
  const listaApostilla: string[] = [];
  const listaVisa: string[] = [];
  const listaPasaporteVisa: string[] = [];
  const listaObservaciones: string[] = [];

  for (
    const item of titularesEspeciales
  ) {

    const tipo =
      (item.tipo || "")
        .toString()
        .trim()
        .toUpperCase();

    const titular =
      (item.titular || "")
        .toString()
        .trim();

    const pasaporte =
      (item.pasaporte || "")
        .toString()
        .trim();

    const observacion =
      (item.observacion || "")
        .toString()
        .trim();


    // -----------------------------------------------
    // PASAPORTE NNA
    // -----------------------------------------------

    if (
      tipo === "PASAPORTE" &&
      titular
    ) {

      listaPasaporte.push(
        titular
      );

    }


    // -----------------------------------------------
    // APOSTILLA NNA
    // -----------------------------------------------

    if (
      tipo === "APOSTILLA" &&
      titular
    ) {

      listaApostilla.push(
        titular
      );

    }


    // -----------------------------------------------
    // VISA
    // -----------------------------------------------

    if (
      tipo === "VISA"
    ) {

      if (titular) {

        listaVisa.push(
          titular
        );

      }

      if (pasaporte) {

        listaPasaporteVisa.push(
          pasaporte
        );

      }

    }


    // -----------------------------------------------
    // OBSERVACIONES
    // -----------------------------------------------

    if (
      observacion
    ) {

      listaObservaciones.push(
        observacion
      );

    }

  }


  titularPasaporte =
    listaPasaporte.join("; ");

  titularApostilla =
    listaApostilla.join("; ");

  titularVisa =
    listaVisa.join("; ");

  pasaporteVisa =
    listaPasaporteVisa.join("; ");

  observaciones =
    listaObservaciones.join("; ");

}

    console.log(
      "NACIONALIDAD A GUARDAR:",
      ciudadano.nacionalidad
    );

    // ======================================================
    // GUARDAR MOVIMIENTO DE CAJA
    // ======================================================

    await guardarMovimientoCaja([

      fecha,

      correlativo,

      documentoImpreso,

      ciudadano.nombreCompleto,

      ciudadano.correo,

      actuaciones
        .map(
          (a: any) =>
            a.actuacion
        )
        .join("; "),

      totalUSD,

      usuario.nombre,

      usuario.caja,

      "",

      "GENERADO",

      ciudadano.cedula || "",

      ciudadano.pasaporte || "",

      ciudadano.nacionalidad || "",

      titularPasaporte,

titularApostilla,

titularVisa,

pasaporteVisa,

observaciones,

    ]);

    // ======================================================
    // GUARDAR DETALLE DE CADA ACTUACIÓN
    // ======================================================

    console.log(
      "ACTUACIONES RECIBIDAS:",
      actuaciones
    );

    for (
      const actuacion of actuaciones
    ) {

      await guardarDetalleCaja([

        correlativo,

        actuacion.codigo,

        actuacion.actuacion,

        actuacion.monto,

      ]);

    }

    // ======================================================
    // RESPUESTA
    // ======================================================

    return NextResponse.json({

      ok: true,

      correlativo,

      fecha,

      documento:
        documentoImpreso,

      nombre:
        ciudadano.nombreCompleto,

      correo:
        ciudadano.correo,

      usuario:
        usuario.nombre,

      actuaciones,

      totalUSD,

      titularesEspeciales,

    });

  }

  catch (
    error: any
  ) {

    console.error(
      "ERROR GENERANDO RECIBO:",
      error
    );

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