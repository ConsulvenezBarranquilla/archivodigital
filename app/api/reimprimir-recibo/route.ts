import {
  NextRequest,
  NextResponse,
} from "next/server";

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
      correlativo,
    } = await req.json();

    // ======================================================
    // VALIDAR CORRELATIVO
    // ======================================================

    if (!correlativo?.trim()) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar el número de recibo.",

      });

    }

    // ======================================================
    // LEER CAJA
    //
    // A:S
    //
    // O = Titular Pasaporte
    // P = Titular Apostilla
    // Q = Titular Visa
    // R = Pasaporte Titular Visa
    // S = Observación
    // ======================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:S",

      });

    // ======================================================
    // LEER DETALLE
    // ======================================================

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

    // ======================================================
    // BUSCAR RECIBO
    // ======================================================

    const recibo =
      movimientos
        .slice(1)
        .find(

          (row) =>

            String(row[1] || "")
              .trim() ===
            String(correlativo)
              .trim()

        );

    if (!recibo) {

      return NextResponse.json({

        ok: false,

        error:
          "Recibo no encontrado",

      });

    }

    // ======================================================
    // DATOS DEL CIUDADANO / SOLICITANTE
    //
    // Estos son SIEMPRE los datos principales
    // que aparecen en la parte superior del recibo.
    // ======================================================

    const cedula =
      recibo[11] ||
      recibo[2] ||
      "";

    const pasaporte =
      recibo[12] ||
      "";

    const nacionalidad =
      recibo[13] ||
      "";

    const documento =
      obtenerDocumentoPrincipal(

        cedula,

        pasaporte,

        nacionalidad

      );

    const nombre =
      recibo[3] || "";

    // ======================================================
    // TITULARES ESPECIALES
    //
    // O = Titular Pasaporte
    // P = Titular Apostilla
    // Q = Titular Visa
    // R = Pasaporte titular Visa
    // S = Observaciones
    //
    // Los valores están almacenados separados por ";"
    // ======================================================

    const titularesPasaporte =
      (recibo[14] || "")
        .toString()
        .split(";")
        .map(
          (t: string) =>
            t.trim()
        )
        .filter(
          (t: string) =>
            t.length > 0
        );

    const titularesApostilla =
      (recibo[15] || "")
        .toString()
        .split(";")
        .map(
          (t: string) =>
            t.trim()
        )
        .filter(
          (t: string) =>
            t.length > 0
        );

    const titularesVisa =
      (recibo[16] || "")
        .toString()
        .split(";")
        .map(
          (t: string) =>
            t.trim()
        )
        .filter(
          (t: string) =>
            t.length > 0
        );

    const pasaportesVisa =
      (recibo[17] || "")
        .toString()
        .split(";")
        .map(
          (t: string) =>
            t.trim()
        )
        .filter(
          (t: string) =>
            t.length > 0
        );

    const observaciones =
      (recibo[18] || "")
        .toString()
        .split(";")
        .map(
          (t: string) =>
            t.trim()
        )
        .filter(
          (t: string) =>
            t.length > 0
        );

    // ======================================================
    // ACTUACIONES
    // ======================================================

    const actuaciones =
      detalles
        .slice(1)
        .filter(

          (d) =>

            String(d[0] || "")
              .trim() ===
            String(correlativo)
              .trim()

        )
        .map((d) => ({

          codigo:
            d[1] || "",

          actuacion:
            d[2] || "",

          monto:
            Number(d[3] || 0),

        }));

    // ======================================================
    // RECONSTRUIR TITULARES ESPECIALES
    //
    // El orden debe corresponder exactamente al orden
    // de las actuaciones del recibo.
    // ======================================================

    let indicePasaporte = 0;

    let indiceApostilla = 0;

    let indiceVisa = 0;

    let indicePasaporteVisa = 0;

    let indiceObservacion = 0;

    const titularesEspeciales =
      actuaciones.map(

        (actuacion) => {

          const texto =
            actuacion.actuacion
              .toUpperCase();

          let tipo:
            | "PASAPORTE"
            | "APOSTILLA"
            | "VISA"
            | undefined;

          let titular = "";

          let pasaporteTitular =
            "";

          let observacion =
            "";

          // ==================================================
          // VISA
          //
          // En VISA no se verifica NNA.
          // Si existe un titular especial almacenado,
          // se utiliza.
          // ==================================================

          if (
            texto.includes("VISA")
          ) {

            tipo = "VISA";

            titular =
              titularesVisa[
                indiceVisa
              ] || "";

            pasaporteTitular =
              pasaportesVisa[
                indicePasaporteVisa
              ] || "";

            if (
              titular
            ) {

              indiceVisa++;

            }

            if (
              pasaporteTitular
            ) {

              indicePasaporteVisa++;

            }

          }

          // ==================================================
          // APOSTILLA NNA
          //
          // SOLO se utiliza si la actuación es APOSTILLA NNA.
          // ==================================================

          else if (

            texto.includes(
              "APOSTILLA"
            ) &&

            texto.includes(
              "NNA"
            )

          ) {

            tipo = "APOSTILLA";

            titular =
              titularesApostilla[
                indiceApostilla
              ] || "";

            if (
              titular
            ) {

              indiceApostilla++;

            }

          }

          // ==================================================
          // PASAPORTE NNA
          //
          // SOLO se utiliza si la actuación es PASAPORTE NNA.
          // ==================================================

          else if (

            texto.includes(
              "PASAPORTE"
            ) &&

            texto.includes(
              "NNA"
            )

          ) {

            tipo = "PASAPORTE";

            titular =
              titularesPasaporte[
                indicePasaporte
              ] || "";

            if (
              titular
            ) {

              indicePasaporte++;

            }

          }

          // ==================================================
          // OBSERVACIÓN
          // ==================================================

          if (
            observaciones[
              indiceObservacion
            ]
          ) {

            observacion =
              observaciones[
                indiceObservacion
              ];

            indiceObservacion++;

          }

          return {

            tipo:
              tipo || "PASAPORTE",

            titular,

            pasaporte:
              pasaporteTitular ||
              undefined,

            mismaPersona:
              !titular,

            esNNA:
              texto.includes(
                "NNA"
              ),

            tieneObservacion:
              !!observacion,

            observacion:
              observacion ||
              undefined,

          };

        }

      );

    // ======================================================
    // RESPUESTA
    // ======================================================

    return NextResponse.json({

      ok: true,

      correlativo,

      fecha:
        recibo[0] || "",

      documento,

      cedula,

      pasaporte,

      nacionalidad,

      nombre,

      correo:
        recibo[4] || "",

      usuario:
        recibo[7] || "",

      estado:
        recibo[10] || "",

      caja:
        recibo[8] || "",

      actuaciones,

      totalUSD:
        Number(
          recibo[6] || 0
        ),

      titularesEspeciales,

    });

  }

  catch (error: any) {

    console.error(
      "ERROR REIMPRIMIENDO RECIBO:",
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