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
// Estado de procesamiento
// ==========================================
//
// EN_PROCESO
//    El documento todavía necesita información.
//
// PROCESADO
//    El documento está completo y listo para
//    pasar posteriormente al módulo de entrega.
//
// ENTREGADO
//    El documento ya fue entregado al ciudadano.
//
// ==========================================

export type EstadoProcesamiento =
    | "EN_PROCESO"
    | "PROCESADO"
    | "ENTREGADO"
    | "RECHAZADA";

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

    // --------------------------------------
    // Estado interno del procesamiento
    // --------------------------------------

    estadoProcesamiento: EstadoProcesamiento;

    // --------------------------------------
    // Entrega
    // --------------------------------------

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

    // --------------------------------------
    // Titular de Visa distinto del solicitante
    // --------------------------------------

    titularVisa?: string;

    pasaporteTitularVisa?: string;

    // ======================================
    // APOSTILLAS
    // ======================================

    estadoApostilla?: string;

    // --------------------------------------
    // Titular de Apostilla
    // --------------------------------------
    //
    // Para Apostilla NNA corresponde al
    // ciudadano registrado en Caja.
    //
    // --------------------------------------

    titularApostilla?: string;

    // ======================================
    // FE DE VIDA
    // ======================================

    fechaEmisionDocumento?: string;

correlativoDocumento?: string;

// ======================================
// CARTA DE SOLTERÍA
// ======================================

fechaCarta?: string;

correlativoCarta?: string;

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
    fechaRegistroConsular?: string;

    // ======================================
    // CONSTANCIA CONSULAR
    // ======================================

    fechaConstancia?: string;
    correlativoConstancia?: string;

    // ======================================
// PODERES
// ======================================

tipoPoder?: "PODR-E" | "PODR-G";

solicitantesPoder?: {
    nombre: string;
    documento: string;
}[];

apoderadosPoder?: {
    nombre: string;
    documento: string;
}[];

estadoPoder?: "VIGENTE" | "REVOCADO";

    // ======================================
// AUTORIZACIÓN DE VIAJE
// ======================================

origen?: string;

solicitantesAutorizacion?: {
    nombre: string;
    documento: string;
}[];

parentesco?: string;

menor?: string;

pasaporteMenor?: string;

destino?: string;

fechaIda?: string;

fechaRetorno?: string;

acompanante?: string;

pasaporteAcompanante?: string;

modalidad?: string;

    // ======================================
    // AUDITORÍA
    // ======================================

    fechaCreacion?: string;

    usuarioCreacion?: string;

    fechaActualizacion?: string;

    usuarioActualizacion?: string;
}

// ==========================================
// Resultado del servicio
// ==========================================

export interface ReportesEntregadosResultado {

    categoria: CategoriaDocumento;

    total: number;

    pendientes: number;

    procesados: number;

    entregados: number;

    documentos: ReporteEntregado[];
}