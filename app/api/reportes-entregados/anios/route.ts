// ==========================================
// API Años disponibles
// Reportes Entregados
// Consulnet Barranquilla
// ==========================================

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    obtenerCaja,
    obtenerGestionConsular,
    obtenerReportesEntregados,
} from "@/lib/googleSheets";

import {
    obtenerAniosDisponibles,
} from "@/lib/reportesEntregados/reportesService";

import {
    CategoriaDocumento,
} from "@/types/ReporteEntregado";

import {
    exigirPermiso,
} from "@/lib/autorizacion";

// ==========================================
// Validación de categoría
// ==========================================

function categoriaValida(

    categoria: string

): categoria is CategoriaDocumento {

    return [

        "PASAPORTES",

        "VISA",

        "APOSTILLA",

        "FE_VIDA",

        "CARTA_SOLTERIA",

        "CERTIFICADO_USO",

        "CONSTANCIA_REGISTRO",

        "CONSTANCIA_CONSULAR",

        "PODER",

        "AUTORIZACION_VIAJE",

    ].includes(categoria);

}

// ==========================================
// GET
// ==========================================

export async function GET(

    request: NextRequest

) {

    const autorizacion =
        await exigirPermiso("reportes");

    if (autorizacion.respuesta) {
        return autorizacion.respuesta;
    }

    try {

        // ======================================
        // CATEGORÍA
        // ======================================

        const categoria =

            request.nextUrl.searchParams.get(
                "categoria"
            );

        if (

            !categoria ||

            !categoriaValida(
                categoria
            )

        ) {

            return NextResponse.json(

                {

                    ok: false,

                    error:
                        "Categoría inválida.",

                },

                {

                    status: 400,

                }

            );

        }

        // ======================================
        // LEER DATOS
        // ======================================

        const [

            gestionConsular,

            caja,

            reportes,

        ] = await Promise.all([

            obtenerGestionConsular(),

            obtenerCaja(),

            obtenerReportesEntregados(),

        ]);

        // ======================================
        // CONSTRUIR DATA
        // ======================================

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        // ======================================
        // OBTENER AÑOS
        // ======================================

        const anios =

            obtenerAniosDisponibles(

                categoria,

                data

            );

        // ======================================
        // RESPUESTA
        // ======================================

        return NextResponse.json({

            ok: true,

            categoria,

            anios,

        });

    }

    catch (error: any) {

        console.error(

            "Error obteniendo años disponibles:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:
                    error?.message ??

                    "No fue posible obtener los años disponibles.",

            },

            {

                status: 500,

            }

        );

    }

}