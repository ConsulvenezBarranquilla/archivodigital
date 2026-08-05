// ==========================================
// Libro Diario
// Tipos del módulo
// ==========================================

export interface RegistroLibroDiario {

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

export interface MovimientoManual {

  id: string;

  fecha: string;

  tipoMovimiento: string;

  referencia: string;

  concepto: string;

  monto: number;

}
export type TipoFilaLibro =

  | "INICIO_MES"

  | "INICIO_DIA"

  | "MOVIMIENTO"

  | "TOTAL_DIA"

  | "TOTAL_MES";

export interface MovimientoLibro {

  id: string;

  tipoFila: TipoFilaLibro;

  fecha: string;

  referencia: string;

  descripcion: string;

  haber: number;

  debe: number;

  saldo: number;

  origen: "PLANILLA" | "MOVIMIENTO";

  tipoMovimiento?: string;

  editable: boolean;

}

export interface LibroDiarioResultado {

  saldoInicial: number;

  totalHaberes: number;

  totalDebe: number;

  saldoFinal: number;

  movimientos: MovimientoLibro[];

}
export interface DetalleActuacion {

  codigo: string;

  actuacion: string;

}

export interface DetalleOperacion {

  referencia: string;

  correlativo: string;

  fecha: string;

  ciudadano: string;

  documento: string;

  nacionalidad: string;

  correo: string;

  estado: string;

  total: number;

  actuaciones: DetalleActuacion[];

}