export const CATEGORIAS_CASO = [
  "NNA",
  "Personas Privadas de Libertad",
  "Verificación de Identidad",
  "Fallecidos",
  "Repatriaciones",
  "Casos Especiales",
  "Registro Civil",
] as const;

export type CategoriaCaso = (typeof CATEGORIAS_CASO)[number];
export type EventoCaso = { fecha: string; descripcion: string; usuario: string };
export type VerificacionIdentidad = {
  id: string;
  nombreCompleto?: string;
  fechaComunicacion: string;
  fechaOriginal?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  sexo: string;
  delito: string;
  organismoSolicitante: string;
  resultadoIdentidad: string;
  observacion: string;
  numeroComunicacion: string;
  registroDactiloscopico: string;
  usuario: string;
  idImportacion?: string;
  hojaOrigen?: string;
  filaOrigen?: number;
  valoresOrigen?: string[];
};
export type EstadoCaso = "Abierto" | "Finalizado" | "Eliminado";
export type PendienteRegistroCivil = {
  recibo: string;
  codigoActuacion: "INSER-N" | "REG-REC" | "REG-MAT" | "REG-DEF";
  actuacion: string;
  tipoRegistroCivil: "Nacimiento" | "Reconocimiento" | "Matrimonio" | "Defunción";
  fecha: string;
  presentante: string;
  documentoPresentante: string;
};

export interface CasoConsular {
  id: string;
  correlativo: string;
  categoria: CategoriaCaso;
  nombre: string;
  tipo: string;
  fecha: string;
  creadoPor: string;
  creadoEl: string;
  actualizadoPor: string;
  actualizadoEl: string;
  estado: EstadoCaso;
  reciboCaja?: string;
  codigoActuacion?: string;
  datos: Record<string, unknown>;
}
