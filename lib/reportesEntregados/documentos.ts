// ==========================================
// Reportes Entregados
// Catálogo Maestro de Documentos
// Consulnet Barranquilla
// ==========================================

import {
    CategoriaDocumento,
    TipoDocumento,
} from "@/types/ReporteEntregado";

// ==========================================
// Fuentes de información de los campos
// ==========================================

export type FuenteCampo =
    | "AUTOMATICO"
    | "MANUAL"
    | "CATALOGO";

// ==========================================
// Configuración de un campo del documento
// ==========================================

export interface CampoDocumentoConfig {

    campo: string;

    etiqueta: string;

    requerido: boolean;

    fuente: FuenteCampo;

    /**
     * Catálogo utilizado cuando la fuente
     * es "CATALOGO".
     *
     * Ejemplo:
     * Catalogos!A:A
     */
    catalogo?: string;

}

// ==========================================
// Configuración de cada categoría
// ==========================================

export interface CategoriaDocumentoConfig {

    id: CategoriaDocumento;

    nombre: string;

    icono: string;

    color: string;

    permiteExcel: boolean;

    permiteEntrega: boolean;

    permiteValija: boolean;

}

// ==========================================
// Configuración de cada documento interno
// ==========================================

export interface DocumentoConfig {

    id: TipoDocumento;

    categoria: CategoriaDocumento;

    nombre: string;

    icono: string;

    /**
     * Campos que intervienen en el procesamiento
     * del documento.
     */
    campos: CampoDocumentoConfig[];

}

// ==========================================
// Menú lateral
// ==========================================

export const MENU_DOCUMENTOS: CategoriaDocumentoConfig[] = [

    {

        id: "PASAPORTES",

        nombre: "Pasaportes",

        icono: "🛂",

        color: "blue",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: true,

    },

    {

        id: "VISA",

        nombre: "Visas",

        icono: "🛃",

        color: "emerald",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "APOSTILLA",

        nombre: "Apostillas",

        icono: "📑",

        color: "amber",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "FE_VIDA",

        nombre: "Fe de Vida",

        icono: "❤️",

        color: "rose",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "CARTA_SOLTERIA",

        nombre: "Carta de Soltería",

        icono: "💍",

        color: "pink",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "CERTIFICADO_USO",

        nombre: "Certificados de Uso",

        icono: "🚗",

        color: "orange",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "CONSTANCIA_REGISTRO",

        nombre: "Constancia Registro Consular",

        icono: "🏛️",

        color: "cyan",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "CONSTANCIA_CONSULAR",

        nombre: "Constancia Consular",

        icono: "📄",

        color: "sky",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "PODER",

        nombre: "Poderes",

        icono: "✍️",

        color: "violet",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

    {

        id: "AUTORIZACION_VIAJE",

        nombre: "Autorización de Viaje",

        icono: "👨‍👩‍👧",

        color: "teal",

        permiteExcel: true,

        permiteEntrega: true,

        permiteValija: false,

    },

];

// ==========================================
// Tipos internos del sistema
// ==========================================

export const DOCUMENTOS: DocumentoConfig[] = [

    // ======================================
    // PASAPORTE ADULTO
    // ======================================

    {

        id: "PASAPORTE_ADULTO",

        categoria: "PASAPORTES",

        nombre: "Pasaporte Adulto",

        icono: "🛂",

        campos: [

            {

                campo: "titularPasaporte",

                etiqueta: "Titular del Pasaporte",

                requerido: true,

                fuente: "AUTOMATICO",

            },

            {

                campo: "numeroPasaporte",

                etiqueta: "Número de Pasaporte",

                requerido: true,

                fuente: "MANUAL",

            },
{
    campo: "fechaValija",
    etiqueta: "Fecha de Valija",
    requerido: true,
    fuente: "MANUAL",
},
            {

                campo: "fechaEmision",

                etiqueta: "Fecha de Emisión",

                requerido: true,

                fuente: "MANUAL",

            },

            {

                campo: "fechaVencimiento",

                etiqueta: "Fecha de Vencimiento",

                requerido: true,

                fuente: "MANUAL",

            },

        ],

    },

    // ======================================
    // PASAPORTE NNA
    // ======================================

    {

        id: "PASAPORTE_NNA",

        categoria: "PASAPORTES",

        nombre:
            "Pasaporte Niño, Niña y Adolescente",

        icono: "🛂",

        campos: [

            {

                campo: "titularPasaporte",

                etiqueta: "Titular del Pasaporte",

                requerido: true,

                fuente: "AUTOMATICO",

            },

            {

                campo: "numeroPasaporte",

                etiqueta: "Número de Pasaporte",

                requerido: true,

                fuente: "MANUAL",

            },
{
    campo: "fechaValija",
    etiqueta: "Fecha de Valija",
    requerido: true,
    fuente: "MANUAL",
},
            {

                campo: "fechaEmision",

                etiqueta: "Fecha de Emisión",

                requerido: true,

                fuente: "MANUAL",

            },

            {

                campo: "fechaVencimiento",

                etiqueta: "Fecha de Vencimiento",

                requerido: true,

                fuente: "MANUAL",

            },

        ],

    },

    // ======================================
    // VISA
    // ======================================

    {

        id: "VISA",

        categoria: "VISA",

        nombre: "Visa",

        icono: "🛃",

        campos: [

            {

                campo: "titularVisa",

                etiqueta: "Titular de la Visa",

                requerido: true,

                fuente: "AUTOMATICO",

            },

            {

                campo: "pasaporteTitularVisa",

                etiqueta:
                    "Pasaporte del Titular",

                requerido: true,

                fuente: "AUTOMATICO",

            },

            {

                campo: "numeroVisa",

                etiqueta: "Número de Visa",

                requerido: true,

                fuente: "MANUAL",

            },

            {

                campo: "nacionalidad",

                etiqueta: "Nacionalidad",

                requerido: true,

                fuente: "CATALOGO",

                catalogo: "Catalogos!A:A",

            },

            {

                campo: "vigencia",

                etiqueta: "Vigencia",

                requerido: true,

                fuente: "MANUAL",

            },

        ],

    },

    // ======================================
    // APOSTILLA
    // ======================================

    {

        id: "APOSTILLA",

        categoria: "APOSTILLA",

        nombre: "Apostilla",

        icono: "📑",

        campos: [

            {

                campo: "titularApostilla",

                etiqueta:
                    "Titular de la Apostilla",

                requerido: true,

                fuente: "AUTOMATICO",

            },

            // --------------------------------
            // Estos campos se completarán
            // cuando definamos exactamente
            // qué información debe registrar
            // el usuario para la apostilla.
            // --------------------------------

        ],

    },

    // ======================================
    // FE DE VIDA
    // ======================================

    {

        id: "FE_VIDA",

        categoria: "FE_VIDA",

        nombre: "Fe de Vida",

        icono: "❤️",

        campos: [],

    },

    // ======================================
    // CARTA DE SOLTERÍA
    // ======================================

    {

        id: "CARTA_SOLTERIA",

        categoria: "CARTA_SOLTERIA",

        nombre: "Carta de Soltería",

        icono: "💍",

        campos: [],

    },

    // ======================================
    // CERTIFICADO DE USO
    // ======================================

    {

        id: "CERTIFICADO_USO",

        categoria: "CERTIFICADO_USO",

        nombre: "Certificado de Uso",

        icono: "🚗",

        campos: [],

    },

    // ======================================
    // CONSTANCIA REGISTRO CONSULAR
    // ======================================

    {

        id: "CONSTANCIA_REGISTRO",

        categoria: "CONSTANCIA_REGISTRO",

        nombre:
            "Constancia Registro Consular",

        icono: "🏛️",

        campos: [],

    },

    // ======================================
    // CONSTANCIA CONSULAR
    // ======================================

    {

        id: "CONSTANCIA_CONSULAR",

        categoria: "CONSTANCIA_CONSULAR",

        nombre: "Constancia Consular",

        icono: "📄",

        campos: [],

    },

    // ======================================
    // PODER
    // ======================================

    {

        id: "PODER",

        categoria: "PODER",

        nombre: "Poder",

        icono: "✍️",

        campos: [],

    },

    // ======================================
    // AUTORIZACIÓN DE VIAJE
    // ======================================

    {

        id: "AUTORIZACION_VIAJE",

        categoria: "AUTORIZACION_VIAJE",

        nombre: "Autorización de Viaje",

        icono: "👨‍👩‍👧",

        campos: [],

    },

];

// ==========================================
// Utilidades
// ==========================================

export function obtenerCategoria(

    tipo: TipoDocumento

): CategoriaDocumento {

    return (

        DOCUMENTOS.find(

            documento => documento.id === tipo

        )?.categoria ??

        "PASAPORTES"

    );

}

export function obtenerDocumento(

    tipo: TipoDocumento

): DocumentoConfig | undefined {

    return DOCUMENTOS.find(

        documento => documento.id === tipo

    );

}

export function obtenerConfiguracionCategoria(

    categoria: CategoriaDocumento

): CategoriaDocumentoConfig | undefined {

    return MENU_DOCUMENTOS.find(

        item => item.id === categoria

    );

}

export function obtenerNombreCategoria(

    categoria: CategoriaDocumento

): string {

    return (

        obtenerConfiguracionCategoria(

            categoria

        )?.nombre ??

        ""

    );

}

export function categoriaPermiteValija(

    categoria: CategoriaDocumento

): boolean {

    return (

        obtenerConfiguracionCategoria(

            categoria

        )?.permiteValija ??

        false

    );

}

export function categoriaPermiteEntrega(

    categoria: CategoriaDocumento

): boolean {

    return (

        obtenerConfiguracionCategoria(

            categoria

        )?.permiteEntrega ??

        false

    );

}

export function categoriaPermiteExcel(

    categoria: CategoriaDocumento

): boolean {

    return (

        obtenerConfiguracionCategoria(

            categoria

        )?.permiteExcel ??

        false

    );

}