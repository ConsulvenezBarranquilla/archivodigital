import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import {
  MovimientoManual,
  DetalleOperacion,
  DetalleActuacion,
} from "@/types/LibroDiario";

export interface LibroDiarioConfig {
  periodo: string;
  saldoInicial: number;
  libroDiarioCerrado: boolean;
  fechaCierreDiario: string;
  actaDiaria: string;
  libroMensualCerrado: boolean;
  fechaCierreMensual: string;
  actaCierreMensual: string;
  saldoFinal: number;
}

// ======================================================
// Registrar movimiento manual
// ======================================================

export async function registrarMovimientoLibro(
  movimiento: MovimientoManual
) {

  const id =
    movimiento.id?.trim() ||
    crypto.randomUUID();

  await sheets.spreadsheets.values.append({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "LibroDiarioMovimientos!A:F",

    valueInputOption:
      "USER_ENTERED",

    requestBody: {

      values: [[

        movimiento.fecha,

        movimiento.tipoMovimiento,

        movimiento.referencia,

        movimiento.concepto,

        movimiento.monto,

        id,

      ]],

    },

  });

  return id;

}

// ======================================================
// Obtener configuración del Libro Diario
// ======================================================

export async function obtenerConfiguracionLibro() {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "LibroDiario!A:I",

    });

  return (
    response.data.values ||
    []
  );

}

// ======================================================
// Obtener movimientos manuales
//
// Compatible con registros antiguos A:E.
// Si F está vacío, el movimiento sigue siendo válido.
// ======================================================

export async function obtenerMovimientosManuales(): Promise<
  MovimientoManual[]
> {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "LibroDiarioMovimientos!A:F",

    });

  const filas =
    response.data.values || [];

  return filas
    .slice(1)
    .map((fila) => {

      return {

        id:
          (fila[5] || "")
            .toString()
            .trim(),

        fecha:
          (fila[0] || "")
            .toString()
            .trim(),

        tipoMovimiento:
          (fila[1] || "")
            .toString()
            .trim(),

        referencia:
          (fila[2] || "")
            .toString()
            .trim(),

        concepto:
          (fila[3] || "")
            .toString()
            .trim(),

        monto: (() => {

  const valor =
    (fila[4] ?? "")
      .toString()
      .trim();

  if (!valor) {
    return 0;
  }

  // Si Google Sheets devuelve un número directamente
  if (!isNaN(Number(valor))) {
    return Number(valor);
  }

  // Formato latino: 1.234,56
  const normalizado =
    valor
      .replace(/\./g, "")
      .replace(",", ".");

  const numero =
    Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : 0;

})(),

      };

    });

}

// ======================================================
// Obtener un movimiento manual por ID
//
// IMPORTANTE:
// Los movimientos antiguos sin ID no pueden localizarse
// mediante esta función.
// ======================================================

export async function obtenerMovimientoManualPorId(
  id: string
): Promise<MovimientoManual | null> {

  const idBuscado =
    id.trim();

  if (!idBuscado) {

    return null;

  }

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "LibroDiarioMovimientos!A:F",

    });

  const filas =
    response.data.values || [];

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {

    const fila =
      filas[i];

    const idFila =
      (fila[5] || "")
        .toString()
        .trim();

    if (
      idFila !== idBuscado
    ) {

      continue;

    }

    return {

      id:
        idFila,

      fecha:
        (fila[0] || "")
          .toString()
          .trim(),

      tipoMovimiento:
        (fila[1] || "")
          .toString()
          .trim(),

      referencia:
        (fila[2] || "")
          .toString()
          .trim(),

      concepto:
        (fila[3] || "")
          .toString()
          .trim(),

      monto:
        Number(
          fila[4] || 0
        ),

    };

  }

  return null;

}

// ======================================================
// Actualizar movimiento manual
//
// SOLO permite actualizar movimientos que ya tengan ID.
// Los movimientos históricos sin ID quedan protegidos.
// ======================================================

export async function actualizarMovimientoManual(

  id: string,

  movimiento: MovimientoManual

) {

  const idBuscado =
    id.trim();

  if (!idBuscado) {

    throw new Error(
      "ID del movimiento requerido."
    );

  }

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "LibroDiarioMovimientos!A:F",

    });

  const filas =
    response.data.values || [];

  let numeroFila =
    -1;

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {

    const idFila =
      (filas[i][5] || "")
        .toString()
        .trim();

    if (
      idFila === idBuscado
    ) {

      numeroFila =
        i + 1;

      break;

    }

  }

  if (
    numeroFila === -1
  ) {

    throw new Error(
      "Movimiento manual no encontrado o pertenece a un registro histórico sin ID."
    );

  }

  await sheets.spreadsheets.values.update({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `LibroDiarioMovimientos!A${numeroFila}:F${numeroFila}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {

      values: [[

        movimiento.fecha,

        movimiento.tipoMovimiento,

        movimiento.referencia,

        movimiento.concepto,

        movimiento.monto,

        idBuscado,

      ]],

    },

  });

}

// ======================================================
// Eliminar movimiento manual
//
// SOLO permite eliminar movimientos que ya tengan ID.
// ======================================================

export async function eliminarMovimientoManual(
  id: string
) {

  const idBuscado =
    id.trim();

  if (!idBuscado) {

    throw new Error(
      "ID del movimiento requerido."
    );

  }

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "LibroDiarioMovimientos!A:F",

    });

  const filas =
    response.data.values || [];

  let numeroFila =
    -1;

  for (
    let i = 1;
    i < filas.length;
    i++
  ) {

    const idFila =
      (filas[i][5] || "")
        .toString()
        .trim();

    if (
      idFila === idBuscado
    ) {

      numeroFila =
        i + 1;

      break;

    }

  }

  if (
    numeroFila === -1
  ) {

    throw new Error(
      "Movimiento manual no encontrado o pertenece a un registro histórico sin ID."
    );

  }

  const spreadsheet =
    await sheets.spreadsheets.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

    });

  const hoja =
    spreadsheet.data.sheets?.find(

      (sheet) =>
        sheet.properties?.title ===
        "LibroDiarioMovimientos"

    );

  const sheetId =
    hoja?.properties?.sheetId;

  if (
    sheetId === undefined ||
    sheetId === null
  ) {

    throw new Error(
      "No se encontró la hoja LibroDiarioMovimientos."
    );

  }

  await sheets.spreadsheets.batchUpdate({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    requestBody: {

      requests: [

        {

          deleteDimension: {

            range: {

              sheetId,

              dimension:
                "ROWS",

              startIndex:
                numeroFila - 1,

              endIndex:
                numeroFila,

            },

          },

        },

      ],

    },

  });

}

// ======================================================
// Auditoría del Libro Diario
// ======================================================

export async function obtenerAuditoriaLibro() {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "AuditoriaLibroDiario!A:E",

    });

  return (
    response.data.values ||
    []
  );

}

// ======================================================
// Obtiene el detalle de una operación
// Gestión Consular
//
// ESTA FUNCIÓN NO SE MODIFICA EN SU LÓGICA.
// ======================================================

export async function obtenerDetalleOperacion(

  referencia: string

): Promise<DetalleOperacion | null> {

  const gestionResponse =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "GestionConsular!A:M",

    });

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
        "DetalleCaja!A:H",

    });

  const gestion =
    gestionResponse.data.values ?? [];

  const caja =
    cajaResponse.data.values ?? [];

  const detalleCaja =
    detalleResponse.data.values ?? [];

  const detalleMap =
    new Map<string, any>();

  detalleCaja
    .slice(1)
    .forEach((fila) => {

      detalleMap.set(

        String(
          fila[4] ?? ""
        ).trim(),

        fila

      );

    });

  const filasGestion =
    gestion
      .slice(1)
      .filter(

        (fila) =>

          String(
            fila[3] ?? ""
          ).trim() ===
          String(
            referencia
          ).trim()

      );

  if (
    filasGestion.length === 0
  ) {

    return null;

  }

  // ======================================
  // SOLO CONSERVAR LA ÚLTIMA VERSIÓN
  // DE CADA ACTUACIÓN
  // ======================================

  const ultimaVersion =
    new Map<string, any>();

  filasGestion.forEach((fila) => {

    const llave =
      String(
        fila[11] ?? ""
      ).trim();

    ultimaVersion.set(
      llave,
      fila
    );

  });

  const filasVigentes =
    Array.from(
      ultimaVersion.values()
    );

  const filasVinculadas =
    filasVigentes.filter(

      (fila) =>

        String(
          fila[6] ?? ""
        )
          .trim()
          .toUpperCase() ===
        "VINCULADO"

    );

  if (
    filasVinculadas.length === 0
  ) {

    return null;

  }

  // ======================================

  const correlativo =
    filasVinculadas[0][0];

  const recibo =
    caja
      .slice(1)
      .find(

        (fila) =>

          String(
            fila[1] ?? ""
          ).trim() ===
          String(
            correlativo
          ).trim()

      );

  const actuaciones:
    DetalleActuacion[] = [];

  let total = 0;

  filasVinculadas.forEach((gc) => {

    const numeroActuacion =
      String(
        gc[11] ?? ""
      ).trim();

    const detalle =
      detalleMap.get(
        numeroActuacion
      );

    const monto =
      Number(
        detalle?.[3] ?? 0
      );

    total += monto;

    actuaciones.push({

      codigo:
        gc[1] || "",

      actuacion:
        gc[2] || "",

      monto,

    });

  });

  return {

    referencia,

    correlativo,

    fecha:
      filasVinculadas[0][4] ||
      "",

    ciudadano:
      recibo?.[3] ||
      "",

    documento:
      recibo?.[11] ||
      recibo?.[12] ||
      "",

    nacionalidad:
      recibo?.[13] ||
      "",

    correo:
      recibo?.[4] ||
      "",

    estado:
      filasVinculadas[0][6] ||
      "",

    total,

    actuaciones,

  };

}