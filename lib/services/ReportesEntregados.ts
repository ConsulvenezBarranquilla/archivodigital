// ======================================================
// Servicios del módulo Reportes Entregados
// ======================================================

import {

    CategoriaDocumento,

    ReporteEntregado,

} from "@/types/ReporteEntregado";

import ModalNuevaConstancia from "@/components/reportesEntregados/ModalNuevaConstancia";

const BASE_URL = "/api/reportes-entregados";



// ======================================================
// Tipos de archivos
// ======================================================

export interface ArchivosConstancia {

    pdfConstancia?: File | null;

    fotoCarnet?: File | null;

}



// ======================================================
// Tipos de respuesta
// ======================================================

export interface ReportesEntregadosResponse {

    ok: boolean;

    categoria: CategoriaDocumento;

    anio?: number | null;

    total: number;

    pendientes?: number;

    procesados?: number;

    entregados?: number;

    documentos: ReporteEntregado[];

    error?: string;

}

// ======================================================
// Función genérica
// ======================================================

async function request<T>(

    endpoint: string,

    options?: RequestInit

): Promise<T> {

    const response = await fetch(

        `${BASE_URL}${endpoint}`,

        {

            headers: {

                "Content-Type": "application/json",

            },

            cache: "no-store",

            ...options,

        }

    );

    const json = await response.json();

    if (!response.ok) {

        throw new Error(

            json.error ||

            response.statusText

        );

    }

    return json;

}

// ======================================================
// Obtener documentos por categoría y año
// ======================================================

export async function obtenerReportesEntregados(

    categoria: CategoriaDocumento,

    anio?: number

): Promise<ReportesEntregadosResponse> {

    const parametros =

        new URLSearchParams();

    parametros.set(

        "categoria",

        categoria

    );

    if (
        anio !== undefined &&
        Number.isInteger(anio)
    ) {

        parametros.set(

            "anio",

            String(anio)

        );

    }

    return request(

        `?${parametros.toString()}`

    );

}

// ======================================================
// Registrar recepción de valija
// ======================================================

export async function registrarValija(

    datos: any

): Promise<any> {

    return request(

        "/valija",

        {

            method: "POST",

            body: JSON.stringify(

                datos

            ),

        }

    );

}

// ======================================================
// Marcar documento entregado
// ======================================================

export async function marcarEntregado(

    datos: any

): Promise<any> {

    return request(

        "/entregar",

        {

            method: "POST",

            body: JSON.stringify(

                datos

            ),

        }

    );

}

// ======================================================
// Guardar documento
// ======================================================

export async function actualizarDocumento(

    documento: ReporteEntregado,

    usuario: string,

    archivos?: ArchivosConstancia

): Promise<void> {


    // ==================================================
    // Si hay archivos, usamos FormData
    // ==================================================

    const tienePdf =
        archivos?.pdfConstancia instanceof File;

    const tieneFoto =
        archivos?.fotoCarnet instanceof File;


    if (
        tienePdf ||
        tieneFoto
    ) {

        const formData =
            new FormData();


        // ----------------------------------------------
        // Documento
        // ----------------------------------------------

        formData.append(

            "documento",

            JSON.stringify(
                documento
            )

        );


        // ----------------------------------------------
        // Usuario
        // ----------------------------------------------

        formData.append(

            "usuario",

            usuario

        );


        // ----------------------------------------------
        // PDF de la constancia
        // ----------------------------------------------

        if (
            tienePdf &&
            archivos?.pdfConstancia
        ) {

            formData.append(

                "pdfConstancia",

                archivos.pdfConstancia

            );

        }


        // ----------------------------------------------
        // Foto del carnet
        // ----------------------------------------------

        if (
            tieneFoto &&
            archivos?.fotoCarnet
        ) {

            formData.append(

                "fotoCarnet",

                archivos.fotoCarnet

            );

        }


        const response =
            await fetch(

                `${BASE_URL}/guardar`,

                {

                    method: "POST",

                    body: formData,

                    cache: "no-store",

                }

            );


        const json =
            await response.json();


        if (!response.ok) {

            throw new Error(

                json.error ||

                response.statusText

            );

        }


        return;

    }


    // ==================================================
    // Sin archivos:
    // conservar el comportamiento actual
    // ==================================================

    await request(

        "/guardar",

        {

            method: "POST",

            body: JSON.stringify({

                documento,

                usuario,

            }),

        }

    );

}

// ======================================================
// Exportar Excel
// ======================================================

export async function exportarExcel(

    categoria: CategoriaDocumento,

    anio?: number | string

): Promise<Blob> {

    const params =
        new URLSearchParams();

    params.set(
        "categoria",
        categoria
    );

    if (
        anio !== undefined &&
        anio !== null &&
        String(anio).trim() !== ""
    ) {

        params.set(
            "anio",
            String(anio)
        );

    }

    const response =
        await fetch(

            `${BASE_URL}/excel?${params.toString()}`,

            {
                cache: "no-store",
            }

        );

    if (!response.ok) {

        throw new Error(
            "No fue posible generar el archivo Excel."
        );

    }

    return await response.blob();

}

export async function obtenerNacionalidades(): Promise<string[]> {

    const response = await fetch(
        `${BASE_URL}/catalogos/nacionalidades`,
        {
            method: "GET",
            cache: "no-store",
        }
    );

    const data = await response.json();

    if (!response.ok || !data?.ok) {

        throw new Error(
            data?.error ??
            "No fue posible obtener las nacionalidades."
        );

    }

    return Array.isArray(data.nacionalidades)
        ? data.nacionalidades
        : [];

}