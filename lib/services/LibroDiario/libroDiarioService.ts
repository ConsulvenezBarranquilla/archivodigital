import { sheets, MODULO_CAJA_SHEET_ID } from "@/lib/googleSheets";
import {
  fechaHoraActual,
} from "@/lib/fechas";

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

// ==========================================
// Registrar movimiento manual
// ==========================================

export async function registrarMovimientoLibro(

  movimiento: MovimientoManual

) {

  await sheets.spreadsheets.values.append({

    spreadsheetId: MODULO_CAJA_SHEET_ID,

    range: "LibroDiarioMovimientos!A:E",

    valueInputOption: "USER_ENTERED",

    requestBody: {

      values: [[

        movimiento.fecha,

        movimiento.tipoMovimiento,

        movimiento.referencia,

        movimiento.concepto,

        movimiento.monto,

      ]],

    },

  });

}

export async function obtenerConfiguracionLibro() {
  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "LibroDiario!A:I",
    });

  return response.data.values || [];
}

export async function obtenerMovimientosManuales() {
  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "LibroDiarioMovimientos!A:E",
    });

  return response.data.values || [];
}

export async function obtenerAuditoriaLibro() {
  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId: MODULO_CAJA_SHEET_ID,
      range: "AuditoriaLibroDiario!A:E",
    });

  return response.data.values || [];
}
// ==========================================
// Obtiene el detalle de una operación
// ==========================================

export async function obtenerDetalleOperacion(

  referencia: string

): Promise<DetalleOperacion | null> {

  const gestionResponse =
    await sheets.spreadsheets.values.get({

      spreadsheetId: MODULO_CAJA_SHEET_ID,

      range: "GestionConsular!A:M",

    });

  const cajaResponse =
    await sheets.spreadsheets.values.get({

      spreadsheetId: MODULO_CAJA_SHEET_ID,

      range: "Caja!A:N",

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

const detalleMap = new Map<string, any>();

detalleCaja.slice(1).forEach((fila) => {

    detalleMap.set(

        String(fila[4] ?? "").trim(),

        fila

    );

});

  const filasGestion =
    gestion.slice(1).filter(

        (fila) =>

            String(fila[3] ?? "").trim() ===
            String(referencia).trim()

    );

if (filasGestion.length === 0) {

    return null;

}

// ======================================
// SOLO CONSERVAR LA ÚLTIMA VERSIÓN
// DE CADA ACTUACIÓN
// ======================================

const ultimaVersion = new Map<string, any>();

filasGestion.forEach((fila) => {

    const llave =
        String(fila[11] ?? "").trim();

    ultimaVersion.set(llave, fila);

});

const filasVigentes =
    Array.from(ultimaVersion.values());

    const filasVinculadas =

    filasVigentes.filter(

        (fila) =>

            String(fila[6] ?? "")
                .trim()
                .toUpperCase() === "VINCULADO"

    );
if (filasVinculadas.length === 0) {

    return null;

}
// ======================================

  const correlativo =
    filasVinculadas[0][0];

  const recibo =
    caja.slice(1).find(

        (fila) =>

            String(fila[1] ?? "").trim() ===
            String(correlativo).trim()

    );

  const actuaciones: DetalleActuacion[] = [];

let total = 0;

filasVinculadas.forEach((gc) => {

    const numeroActuacion =
        String(gc[11] ?? "").trim();

    const detalle =
    detalleMap.get(numeroActuacion);

    const monto =
        Number(detalle?.[3] ?? 0);

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

    fecha: filasVinculadas[0][4] || "",

    ciudadano: recibo?.[3] || "",

    documento:
      recibo?.[11] ||

      recibo?.[12] ||

      "",

    nacionalidad:
      recibo?.[13] || "",

    correo:
      recibo?.[4] || "",

    estado:
      filasVinculadas[0][6] || "",

    total,

    actuaciones,

  };

}