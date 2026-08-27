import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

export interface ActuacionPendiente {
  fecha: string;
  recibo: string;
  documento: string;
  nombre: string;
  titular: string;
  codigo: string;
  actuacion: string;
  usd: number;
}

export async function obtenerPendientesGC(): Promise<ActuacionPendiente[]> {

  const cajaResponse =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "Caja!A:S",
    });

  const detalleResponse =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "DetalleCaja!A:F",
    });

  const gestionResponse =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "GestionConsular!A:K",
    });

  const filasCaja =
    (cajaResponse.data.values || []).slice(1);

  const filasDetalle =
    (detalleResponse.data.values || []).slice(1);

  const filasGestion =
    (gestionResponse.data.values || []).slice(1);

  const actuacionesProcesadas =
    new Map<string, string>();

  filasGestion.forEach((row) => {

    const correlativo =
      (row[0] || "").toString().trim();

    const codigo =
      (row[1] || "").toString().trim();

    const estado =
      (row[6] || "")
        .toString()
        .trim()
        .toUpperCase();

    if (
      estado === "VINCULADO" ||
      estado === "SIN PLANILLA"
    ) {

      actuacionesProcesadas.set(
        `${correlativo}|${codigo}`,
        estado
      );

    }

  });

  const registros: ActuacionPendiente[] = [];

  filasCaja.forEach((movimiento) => {

    if (
      (movimiento[10] || "") !== "GENERADO"
    ) return;

    const correlativo = movimiento[1];

    filasDetalle
      .filter(d => d[0] === correlativo)
      .forEach((detalle) => {

        const codigo = detalle[1] || "";

        if (
          actuacionesProcesadas.has(
            `${correlativo}|${codigo}`
          )
        ) return;

        const documento =
  obtenerDocumentoPrincipal(
    movimiento[11] || movimiento[2] || "",
    movimiento[12] || "",
    movimiento[13] || ""
  );

let nombreMostrar =
  movimiento[3] || "";

let documentoMostrar =
  documento;

// Solo las VISAS muestran el titular del documento

if (
  (detalle[2] || "")
    .toUpperCase()
    .includes("VISA")
) {

  const titularVisa =
    (movimiento[16] || "")
      .toString()
      .trim();

  const pasaporteVisa =
    (movimiento[17] || "")
      .toString()
      .trim();

  if (titularVisa) {

    nombreMostrar =
      titularVisa;

  }

  if (pasaporteVisa) {

    documentoMostrar =
      pasaporteVisa;

  }

}

registros.push({

  fecha: movimiento[0],

  recibo: correlativo,

  documento: documentoMostrar,

  nombre: nombreMostrar,

  titular: nombreMostrar,

  codigo,

  actuacion: detalle[2] || "",

  usd: Number(detalle[3] || 0),

});

      });

  });

  registros.sort((a, b) =>
    new Date(b.fecha).getTime() -
    new Date(a.fecha).getTime()
  );

  return registros;

}