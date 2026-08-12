// ==========================================
// API Reportes Entregados
// Consulnet Barranquilla
// ==========================================

import { NextRequest, NextResponse } from "next/server";

import {

    obtenerCaja,

    obtenerGestionConsular,

    obtenerReportesEntregados,

} from "@/lib/googleSheets";

import {

    obtenerDocumentos,

} from "@/lib/reportesEntregados/reportesService";

import {

    CategoriaDocumento,

} from "@/types/ReporteEntregado";

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

    try {

        // --------------------------------------
        // Categoría
        // --------------------------------------

        const categoria =

            request.nextUrl.searchParams.get(

                "categoria"

            );

        if (

            !categoria ||

            !categoriaValida(categoria)

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

        // --------------------------------------
        // Lectura de hojas
        // --------------------------------------

        const [

            gestionConsular,

            caja,

            reportes,

        ] = await Promise.all([

            obtenerGestionConsular(),

            obtenerCaja(),

            obtenerReportesEntregados(),

        ]);

        // --------------------------------------
        // Construcción del objeto
        // --------------------------------------

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        // --------------------------------------
        // Servicio
        // --------------------------------------

        const documentos =

            obtenerDocumentos(

                categoria,

                data

            );

if (documentos.length > 0) {
    
}


        // --------------------------------------
        // Respuesta
        // --------------------------------------

        return NextResponse.json({

            ok: true,

            categoria,

            total: documentos.length,

            documentos,

        });

    }

    catch (error) {

        console.error(

            "Error Reportes Entregados:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:

                    "No fue posible obtener los Reportes Entregados.",

            },

            {

                status: 500,

            }

        );

    }

}