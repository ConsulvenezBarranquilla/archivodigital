export interface DocumentoSeguimientoTramite {
  recibo?: string;
  categoria?: string;
  tipoDocumento?: string;
  codigoActuacion?: string;
  estadoProcesamiento?: string;
  entregado?: boolean;
  metodoEntrega?: string;
}

export interface EstadoDocumentoTramite {
  nombre: string;
  estado: string;
}

const ORDEN_ESTADOS: Record<string, number> = {
  "En Proceso": 1,
  Procesado: 2,
  Entregado: 3,
  "Entregado por correo": 3,
  Rechazado: 3,
};

export function obtenerEstadoDocumentoTramite(documento: DocumentoSeguimientoTramite): string | null {
  const estadoProcesamiento = String(documento.estadoProcesamiento ?? "").trim().toUpperCase();
  const metodoEntrega = String(documento.metodoEntrega ?? "").trim().toUpperCase();

  if (estadoProcesamiento === "RECHAZADA") return "Rechazado";
  if (documento.entregado === true && metodoEntrega === "CORREO") return "Entregado por correo";
  if (documento.entregado === true || estadoProcesamiento === "ENTREGADO") return "Entregado";
  if (estadoProcesamiento === "PROCESADO" || estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO") return "Procesado";
  if (["EN_PROCESO", "PENDIENTE_FIRMA"].includes(estadoProcesamiento)) return "En Proceso";
  return null;
}

export function obtenerSeguimientoDocumentalTramite(
  documentos: DocumentoSeguimientoTramite[],
  recibo: string,
  reciboAnulado: boolean
): EstadoDocumentoTramite[] {
  if (reciboAnulado) return [];
  const reciboNormalizado = recibo.trim().toUpperCase();
  return documentos
    .filter((documento) => String(documento.recibo ?? "").trim().toUpperCase() === reciboNormalizado)
    .flatMap((documento) => {
      const estado = obtenerEstadoDocumentoTramite(documento);
      if (!estado) return [];
      return [{
        nombre: String(documento.codigoActuacion || documento.tipoDocumento || documento.categoria || "Documento").trim(),
        estado,
      }];
    })
    .sort((a, b) => (ORDEN_ESTADOS[a.estado] ?? 99) - (ORDEN_ESTADOS[b.estado] ?? 99));
}
