// ======================================================
// Servicios del módulo Reportes Entregados
// ======================================================

import {

    CategoriaDocumento,

    ReporteEntregado,

} from "@/types/ReporteEntregado";

const BASE_URL = "/api/reportes-entregados";

// ======================================================
// Tipos de respuesta
// ======================================================

export interface ReportesEntregadosResponse {

    ok: boolean;

    categoria: CategoriaDocumento;

    total: number;

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
// Obtener documentos por categoría
// ======================================================

export async function obtenerReportesEntregados(

    categoria: CategoriaDocumento

): Promise<ReportesEntregadosResponse> {

    return request(

        `?categoria=${encodeURIComponent(

            categoria

        )}`

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
// Actualizar documento
// ======================================================

// ======================================================
// Guardar documento
// ======================================================

export async function actualizarDocumento(

    documento: ReporteEntregado,

    usuario: string

): Promise<void> {

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

    categoria: CategoriaDocumento

): Promise<Blob> {

    const response = await fetch(

        `${BASE_URL}/excel?categoria=${encodeURIComponent(

            categoria

        )}`,

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