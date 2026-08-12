// ==========================================
// Libro Diario - Motor de Cálculo
// Consulnet Barranquilla
// ==========================================
import {
  MovimientoLibro,
  LibroDiarioResultado,
} from "@/types/LibroDiario";
import { convertirNumero } from "@/lib/utils/numeros";
import {
  convertirFecha,
  inicioDelDia,
  finDelDia,
  periodoFecha,
  formatoFechaLibro,
  formatoMesLibro,
} from "@/lib/fechas";


// ==========================================
// Obtiene el saldo inicial del período
// ==========================================

export function obtenerSaldoInicial(

  periodo: string,

  configuracion: any[]

): number {

  const registro = configuracion.find(

    (fila) => fila[0] === periodo

  );

  if (!registro) {

    return 0;

  }

  const saldo = String(registro[1] ?? "")
    .replace(/\./g, "")
    .replace(",", ".");

return Number(saldo) || 0;

}

// ==========================================
// Construye los movimientos HABER
// (Planillas Vinculadas)
// ==========================================

export function construirHaberes(

  periodo: string,
  
  caja: any[],

  detalleCaja: any[],

  fechaInicial?: string,

  fechaFinal?: string

): MovimientoLibro[] {

  
  const movimientos: MovimientoLibro[] = [];

const planillas = new Map<
    string,
    {
        fecha: string;
        descripcion: string;
        total: number;
    }
>();

  const cajaMap = new Map<string, any>();

  caja.slice(1).forEach((fila) => {

    const correlativo =
      (fila[1] || "").toString().trim();

    cajaMap.set(correlativo, fila);

  });
      
 // ==========================================
// Construir planillas desde DetalleCaja
// ==========================================

detalleCaja
    .slice(1)
    .forEach((detalle) => {

        const correlativo =
            String(detalle[0] ?? "").trim();

        const monto =
            convertirNumero(detalle[3]);

        const numeroActuacion =
            String(detalle[4] ?? "").trim();

        const planilla =
            String(detalle[5] ?? "").trim();

        const estadoGC =
            String(detalle[6] ?? "")
                .trim()
                .toUpperCase();

        // Solo actuaciones vigentes
        if (estadoGC !== "VINCULADO") {

            return;

        }

        if (monto <= 0) {

            return;

        }

        const fechaPlanilla =
            String(detalle[7] ?? "").trim();

        if (!fechaPlanilla) {

            return;

        }

        // ------------------------------------------
        // Filtrar por rango de fechas
        // ------------------------------------------

        if (fechaInicial && fechaFinal) {

            const fecha =
                convertirFecha(fechaPlanilla);

            if (!fecha) {

                return;

            }

            const inicio =
                inicioDelDia(fechaInicial);

            const fin =
                finDelDia(fechaFinal);

            if (

                !inicio ||

                !fin ||

                fecha < inicio ||

                fecha > fin

            ) {

                return;

            }

        }

        else {

            if (

                periodoFecha(fechaPlanilla) !== periodo

            ) {

                return;

            }

        }

        const recibo =
            cajaMap.get(correlativo);

        if (!recibo) {

            return;

        }

        const estadoRecibo =
            String(recibo[10] ?? "")
                .trim()
                .toUpperCase();

        if (estadoRecibo !== "GENERADO") {

            return;

        }

        // ------------------------------------------
        // Agrupar por planilla
        // ------------------------------------------

        const existente =
            planillas.get(planilla);

        if (existente) {

            existente.total += monto;

        }

        else {

            planillas.set(planilla, {

                fecha:
                    fechaPlanilla.substring(0, 10),

                descripcion:
                    String(recibo[3] ?? ""),

                total: monto,

            });

        }

    });

// ==========================================
// Convertir el Map en movimientos
// ==========================================

planillas.forEach((datos, planilla) => {

    movimientos.push({

        id: planilla,

        tipoFila: "MOVIMIENTO",

        fecha: datos.fecha,

        referencia: planilla,

        descripcion: datos.descripcion,

        arancel: datos.total,

        haber: datos.total,

        debe: 0,

        saldo: 0,

        origen: "PLANILLA",

        editable: false,

    });

});

return movimientos;
}
// ==========================================
// Construye los movimientos DEBE
// (Retiros, reintegros, etc.)
// ==========================================

export function construirDebe(

  periodo: string,

  movimientos: any[],

  fechaInicial?: string,

  fechaFinal?: string

): MovimientoLibro[] {

  return movimientos

    .slice(1)

    .filter((fila) => {

    const fecha =
        String(fila[0] ?? "").substring(0, 10);

    if (fechaInicial && fechaFinal) {

        return (
            fecha >= fechaInicial &&
            fecha <= fechaFinal
        );

    }

    return fecha.startsWith(periodo);

})

    .map((fila, index) => {

      const fecha =
        (fila[0] || "").toString();

      const tipoMovimiento =
        (fila[1] || "").toString();

      const referencia =
        (fila[2] || "").toString();

      const concepto =
        (fila[3] || "").toString();

      const monto = convertirNumero(fila[4]);

      const esReintegro =
        tipoMovimiento
          .trim()
          .toUpperCase() === "REINTEGRO";

      return {

    id:`MOV-${index}`,

    tipoFila:"MOVIMIENTO",

        fecha,

        referencia,

        descripcion: concepto,

        arancel:
  0,

        haber: esReintegro ? monto : 0,

        debe: esReintegro ? 0 : monto,

        saldo: 0,

        origen: "MOVIMIENTO",

        tipoMovimiento,

        editable: true,

      };

    });

}

// ==========================================
// Orden cronológico del libro
// ==========================================

export function ordenarMovimientos(
  movimientos: MovimientoLibro[]
): MovimientoLibro[] {

  return movimientos.sort((a, b) => {

    // Fecha
    if (a.fecha !== b.fecha) {

      return a.fecha.localeCompare(b.fecha);

    }

    // Primero todas las planillas
    if (a.origen !== b.origen) {

      if (a.origen === "PLANILLA") return -1;

      if (b.origen === "PLANILLA") return 1;

    }

    // Después ordenar por referencia
    return a.referencia.localeCompare(

      b.referencia,

      undefined,

      {

        numeric: true,

      }

    );

  });

}
// ==========================================
// Calcula el saldo acumulado
// ==========================================

export function calcularSaldo(

  movimientos: MovimientoLibro[],

  saldoInicial: number

): LibroDiarioResultado {

  let saldo = saldoInicial;

  let totalHaberes = 0;

  let totalDebe = 0;

  const resultado =

    movimientos.map((movimiento) => {

      totalHaberes += movimiento.haber;

      totalDebe += movimiento.debe;

      saldo += movimiento.haber;

      saldo -= movimiento.debe;

      return {

        ...movimiento,

        saldo,

      };

    });

  return {

    saldoInicial,

    totalHaberes,

    totalDebe,

    saldoFinal: saldo,

    movimientos: resultado,

  };

}
// ==========================================
// Genera los bloques contables del libro
// ==========================================

// ==========================================
// Genera los bloques contables del libro
// ==========================================

export function generarBloquesDiarios(

  periodo: string,
  libro: LibroDiarioResultado

): LibroDiarioResultado {

  const grupos = new Map<string, MovimientoLibro[]>();

  // Agrupar movimientos por fecha
  libro.movimientos.forEach((movimiento) => {

    const fecha = movimiento.fecha;

    if (!grupos.has(fecha)) {

      grupos.set(fecha, []);

    }

    grupos.get(fecha)!.push(movimiento);

  });
  
  const movimientos: MovimientoLibro[] = [];

let saldoInicialDia = libro.saldoInicial;

Array.from(grupos.entries())
  .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
  .forEach(([fecha, lista]) => {

    // Encabezado del día
    movimientos.push({

      id: `INICIO-${fecha}`,

      tipoFila: "INICIO_DIA",

      fecha,

      referencia: "",

      descripcion: `SALDO INICIAL DEL DÍA ${formatoFechaLibro(fecha)}`,

      arancel: 0,
      
      haber: 0,

      debe: 0,

      saldo: saldoInicialDia,

      origen: "MOVIMIENTO",

      editable: false,

    });

    // Movimientos del día
movimientos.push(...lista);

// Calcular totales del día
const totalHaberes = lista.reduce(

  (total, mov) => total + mov.haber,

  0

);

const totalDebe = lista.reduce(

  (total, mov) => total + mov.debe,

  0

);

const totalArancel = lista.reduce(

    (total, mov) => total + mov.arancel,

    0

);

const ultimo = lista[lista.length - 1];

const saldoFinalDia = ultimo
  ? ultimo.saldo
  : saldoInicialDia;

// Insertar TOTAL DEL DÍA
movimientos.push({

  id: `TOTAL-${fecha}`,

  tipoFila: "TOTAL_DIA",

  fecha: "",

  referencia: "",

  descripcion: `TOTAL DÍA ${formatoFechaLibro(fecha)}`,

  arancel: totalArancel,
  
  haber: totalHaberes,

  debe: totalDebe,

  saldo: saldoFinalDia,

  origen: "MOVIMIENTO",

  editable: false,

});

// El siguiente día inicia con este saldo
saldoInicialDia = saldoFinalDia;

  });
movimientos.push({

  id: `TOTAL-MES`,

  tipoFila: "TOTAL_MES",

  fecha: "",

  referencia: "",

  descripcion: `TOTAL MES ${formatoMesLibro(periodo)}`,

  arancel: libro.movimientos.reduce(

    (total, mov) => total + mov.arancel,

    0

),
  
  haber: libro.totalHaberes,

  debe: libro.totalDebe,

  saldo: libro.saldoFinal,

  origen: "MOVIMIENTO",

  editable: false,

});
  return {

    ...libro,

    movimientos,

  };

}
// ==========================================
// Construye el Libro Diario completo
// ==========================================
function siguientePeriodo(periodo: string): string {

    const [anio, mes] = periodo.split("-").map(Number);

    const fecha = new Date(anio, mes - 1, 1);

    fecha.setMonth(fecha.getMonth() + 1);

    return `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
    ).padStart(2, "0")}`;

}

function compararPeriodos(a: string, b: string) {

    return a.localeCompare(b);

}
export function construirLibroDiario(

  periodo: string,

  configuracion: any[],

  gestionConsular: any[],
    
  caja: any[],

detalleCaja: any[],

  movimientos: any[],

  fechaInicial?: string,

  fechaFinal?: string

): LibroDiarioResultado {

  // ==========================================
  // Primer período configurado
  // ==========================================

  const periodos = configuracion
    .slice(1)
    .map((fila) => String(fila[0]))
    .filter(Boolean)
    .sort();

  if (periodos.length === 0) {

    throw new Error(
      "No existe un saldo inicial configurado en la hoja LibroDiario."
    );

  }


  let periodoActual = periodos[0];

  let saldoActual = obtenerSaldoInicial(

    periodoActual,

    configuracion

  );

  let ultimoLibro: LibroDiarioResultado | null = null;

  // ==========================================
  // Recorre todos los meses hasta el solicitado
  // ==========================================

  while (periodoActual <= periodo) {

    const haberes = construirHaberes(

  periodoActual,

  caja,

  detalleCaja,

  periodoActual === periodo
    ? fechaInicial
    : undefined,

  periodoActual === periodo
    ? fechaFinal
    : undefined

);

    const debe = construirDebe(

      periodoActual,

      movimientos,

      periodoActual === periodo
        ? fechaInicial
        : undefined,

      periodoActual === periodo
        ? fechaFinal
        : undefined

    );

    const libro = ordenarMovimientos([

      ...haberes,

      ...debe,

    ]);

    const libroConSaldo = calcularSaldo(

      libro,

      saldoActual

    );

    ultimoLibro = generarBloquesDiarios(

      periodoActual,

      libroConSaldo

    );

    // El saldo inicial del siguiente mes
    // será el saldo final del mes actual

    saldoActual = ultimoLibro.saldoFinal;

    // Avanzar un mes

    const [anio, mes] = periodoActual
      .split("-")
      .map(Number);

    const fecha = new Date(
      anio,
      mes - 1,
      1
    );

    fecha.setMonth(
      fecha.getMonth() + 1
    );

    periodoActual =
      `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

  }

  return ultimoLibro!;

}
