// ==========================================
// Reportes Entregados
// Tipos del módulo
// Consulnet Barranquilla
// ==========================================

// ==========================================
// Categorías del menú
// ==========================================

export type CategoriaDocumento =

    | "PASAPORTES"
    | "VISA"
    | "APOSTILLA"
    | "FE_VIDA"
    | "CARTA_SOLTERIA"
    | "CERTIFICADO_USO"
    | "CONSTANCIA_REGISTRO"
    | "CONSTANCIA_CONSULAR"
    | "PODER"
    | "AUTORIZACION_VIAJE";

// ==========================================
// Tipos internos de documentos
// ==========================================

export type TipoDocumento =

    | "PASAPORTE_ADULTO"
    | "PASAPORTE_NNA"
    | "VISA"
    | "APOSTILLA"
    | "FE_VIDA"
    | "CARTA_SOLTERIA"
    | "CERTIFICADO_USO"
    | "CONSTANCIA_REGISTRO"
    | "CONSTANCIA_CONSULAR"
    | "PODER"
    | "AUTORIZACION_VIAJE";

// ==========================================
// Registro principal
// ==========================================

export interface ReporteEntregado {

    // --------------------------------------
    // Identificación
    // --------------------------------------

    id: string;

    categoria: CategoriaDocumento;

    tipoDocumento: TipoDocumento;

    // --------------------------------------
    // Datos comunes
    // --------------------------------------

    recibo: string;

    fechaRecibo: string;

    planillaGC: string;

    solicitante: string;

    documento: string;

    estado: string;

    entregado: boolean;

    fechaEntrega?: string;

    entregadoPor?: string;

    observaciones?: string;

    // ======================================
    // PASAPORTES
    // ======================================

    titularPasaporte?: string;

    numeroPasaporte?: string;

    fechaValija?: string;

    fechaEmision?: string;

    fechaVencimiento?: string;

    // ======================================
    // VISAS
    // ======================================

    numeroVisa?: string;

    tipoVisa?: string;

    nacionalidad?: string;

    vigencia?: string;

    // ======================================
    // APOSTILLAS
    // ======================================

    estadoApostilla?: string;

    // ======================================
    // FE DE VIDA
    // ======================================

    correlativo?: string;

    // ======================================
    // CERTIFICADOS DE USO
    // ======================================

    tipoCertificado?: string;

    fechaRegistro?: string;

    numeroCertificado?: string;

    // ======================================
    // CONSTANCIA REGISTRO CONSULAR
    // ======================================

    numeroRegistro?: string;

    // ======================================
    // CONSTANCIA CONSULAR
    // ======================================

    fechaConstancia?: string;

    // ======================================
    // PODERES
    // ======================================

    tipoPoder?: string;

    apoderado?: string;

    documentoApoderado?: string;

    estadoPoder?: string;

    // ======================================
    // AUTORIZACIÓN DE VIAJE
    // ======================================

    autoriza?: string;

    parentesco?: string;

    menor?: string;

    pasaporteMenor?: string;

    destino?: string;

    fechaIda?: string;

    fechaRetorno?: string;

    acompanante?: string;

    pasaporteAcompanante?: string;

    modalidad?: string;

}

// ==========================================
// Resultado del servicio
// ==========================================

export interface ReportesEntregadosResultado {

    categoria: CategoriaDocumento;

    total: number;

    pendientes: number;

    entregados: number;

    documentos: ReporteEntregado[];

}