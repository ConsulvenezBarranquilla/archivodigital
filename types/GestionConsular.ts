// ======================================================
// Tipos del módulo Sistema de Gestión Consular (SGC)
// ======================================================

export interface EstadisticasSGC {

  ok: boolean;

  totalActuaciones: number;

  pendientes: number;

  vinculadas: number;

  planillas: number;

  expedientes: number;

  sinPlanilla: number;

}

// ======================================================
// Actuaciones pendientes
// ======================================================

export interface ActuacionPendiente {

  fecha: string;

  recibo: string;

  documento: string;

  nombre: string;

  codigo: string;

  actuacion: string;

  usd: number;

}

// ======================================================
// Actuaciones vinculadas
// ======================================================

export interface ActuacionVinculada {

  fechaRecibo: string;

  recibo: string;

  documento: string;

  cedula: string;

  pasaporte: string;

  nombre: string;

  codigo: string;

  actuacion: string;

  planilla: string;

  fechaPlanilla: string;
  
  estado: string;

  usuario: string;

  fechaRegistro: string;

  fechaDesvinculacion: string;

  usuarioDesvinculacion: string;

  observaciones: string;

  numeroActuacion: string;

}

// ======================================================
// Ciudadano
// ======================================================

export interface CiudadanoSGC {

  encontrado: boolean;

  fechaRegistro: string;

  documento: string;

  documentoOriginal: string;

  cedula: string;

  pasaporte: string;

  primerNombre: string;

  segundoNombre: string;

  primerApellido: string;

  segundoApellido: string;

  nacionalidad: string;

  ciudadNacimiento: string;

  paisNacimiento: string;

  estadoCivil: string;

  genero: string;

  correo: string;

  telefono: string;

  fechaNacimiento: string;

}

// ======================================================
// Actuación utilizada para registrar
// una vinculación o SIN PLANILLA
// ======================================================

export interface ActuacionGestion {

  recibo: string;

  codigo: string;

  actuacion: string;

  numeroActuacion: string;

}
// ======================================================
// Formularios del Frontend
// ======================================================

export interface VincularPlanillaForm {

  actuaciones: ActuacionGestion[];

  planilla: string;

  fechaPlanilla: string;

  observaciones: string;
 

}

export interface SinPlanillaForm {

  actuaciones: ActuacionGestion[];

  observaciones: string;

}

export interface DesvincularPlanillaForm {

  numeroActuacion: string;

  observaciones: string;

}
// ======================================================
// Requests
// ======================================================

export interface VincularPlanillaRequest {

  actuaciones: ActuacionGestion[];

  planilla: string;

  fechaPlanilla: string;

  usuario: string;

  observaciones: string;

}

export interface SinPlanillaRequest {

  actuaciones: ActuacionGestion[];

  usuario: string;

  observaciones: string;

}

export interface DesvincularPlanillaRequest {

  numeroActuacion: string;

  usuario: string;

  observaciones: string;

}

// ======================================================
// Respuestas
// ======================================================

export interface ApiResponse {

  ok: boolean;

  mensaje?: string;

  error?: string;

  cantidad?: number;

}

// ======================================================
// Dashboard
// ======================================================

export interface EstadisticasResponse

  extends EstadisticasSGC {}

// ======================================================
// Pendientes
// ======================================================

export interface PendientesResponse {

  ok: boolean;

  total: number;

  registros: ActuacionPendiente[];

}

// ======================================================
// Vinculadas
// ======================================================

export interface VinculadasResponse {

  ok: boolean;

  total: number;

  registros: ActuacionVinculada[];

}

// ======================================================
// Ciudadano
// ======================================================

export interface CiudadanoResponse

  extends CiudadanoSGC {

  ok: boolean;

  error?: string;

}