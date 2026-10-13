// ==========================================
// API Reportes Entregados
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
// Obtener documentos por categoría y año
// ==========================================

export async function GET(

    request: NextRequest

) {

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
        // AÑO
        // ======================================

        const anioParametro =

            request.nextUrl.searchParams.get(
                "anio"
            );

        let anio: number | undefined;

        if (
            anioParametro !== null &&
            anioParametro.trim() !== ""
        ) {

            const anioNumerico =
                Number(anioParametro);

            if (
                !Number.isInteger(
                    anioNumerico
                ) ||
                anioNumerico < 2000 ||
                anioNumerico > 2100
            ) {

                return NextResponse.json(

                    {

                        ok: false,

                        error:
                            "El año seleccionado no es válido.",

                    },

                    {

                        status: 400,

                    }

                );

            }

            anio =
                anioNumerico;

        }

        // ======================================
        // LECTURA DE LAS HOJAS
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
        // DATOS PARA EL SERVICIO
        // ======================================

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        // ======================================
        // CONSTRUIR DOCUMENTOS
        //
        // El año se filtra dentro del servicio,
        // antes de devolver los documentos.
        // ======================================

        const documentos =

            obtenerDocumentos(

                categoria,

                data,

                anio

            );

        // ======================================
        // ESTADÍSTICAS
        // ======================================

        const pendientes =

            documentos.filter(

                documento =>

                    documento.estadoProcesamiento ===
                    "EN_PROCESO"

            ).length;

        const procesados =

            documentos.filter(

                documento =>

                    documento.estadoProcesamiento ===
                    "PROCESADO"
                    ||
                    documento.estadoProcesamiento === "RECHAZADA"
                    ||
                    (categoria === "CONSTANCIA_REGISTRO" &&
                        documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO")

            ).length;

        const entregados =

            documentos.filter(

                documento =>

                    documento.estadoProcesamiento ===
                    "ENTREGADO"

            ).length;

        // ======================================
        // RESPUESTA
        // ======================================

        return NextResponse.json({

            ok: true,

            categoria,

            anio:
                anio ?? null,

            total:
                documentos.length,

            pendientes,

            procesados,

            entregados,

            documentos,

        });

    }

    catch (error: any) {

        console.error(

            "Error Reportes Entregados:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:
                    error?.message ??

                    "No fue posible obtener los Reportes Entregados.",

            },

            {

                status: 500,

            }

        );

    }

}
