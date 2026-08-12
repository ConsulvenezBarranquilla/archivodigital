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

    {

        id: "PASAPORTE_ADULTO",

        categoria: "PASAPORTES",

        nombre: "Pasaporte Adulto",

        icono: "🛂",

    },

    {

        id: "PASAPORTE_NNA",

        categoria: "PASAPORTES",

        nombre: "Pasaporte Niño, Niña y Adolescente",

        icono: "🛂",

    },

    {

        id: "VISA",

        categoria: "VISA",

        nombre: "Visa",

        icono: "🛃",

    },

    {

        id: "APOSTILLA",

        categoria: "APOSTILLA",

        nombre: "Apostilla",

        icono: "📑",

    },

    {

        id: "FE_VIDA",

        categoria: "FE_VIDA",

        nombre: "Fe de Vida",

        icono: "❤️",

    },

    {

        id: "CARTA_SOLTERIA",

        categoria: "CARTA_SOLTERIA",

        nombre: "Carta de Soltería",

        icono: "💍",

    },

    {

        id: "CERTIFICADO_USO",

        categoria: "CERTIFICADO_USO",

        nombre: "Certificado de Uso",

        icono: "🚗",

    },

    {

        id: "CONSTANCIA_REGISTRO",

        categoria: "CONSTANCIA_REGISTRO",

        nombre: "Constancia Registro Consular",

        icono: "🏛️",

    },

    {

        id: "CONSTANCIA_CONSULAR",

        categoria: "CONSTANCIA_CONSULAR",

        nombre: "Constancia Consular",

        icono: "📄",

    },

    {

        id: "PODER",

        categoria: "PODER",

        nombre: "Poder",

        icono: "✍️",

    },

    {

        id: "AUTORIZACION_VIAJE",

        categoria: "AUTORIZACION_VIAJE",

        nombre: "Autorización de Viaje",

        icono: "👨‍👩‍👧",

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