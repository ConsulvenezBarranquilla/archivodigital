// ======================================================
// API
// Actualizar documento
// ======================================================

import {

    NextRequest,

    NextResponse,

} from "next/server";

import {

    actualizarDocumento,

} from "@/lib/reportesEntregados/googleSheetReportes";

import {

    ReporteEntregado,

} from "@/types/ReporteEntregado";

import {

    exigirPermiso,

} from "@/lib/autorizacion";

export async function POST(

    request: NextRequest

) {

    const autorizacion =
        await exigirPermiso("reportes");

    if (autorizacion.respuesta) {
        return autorizacion.respuesta;
    }

    try {

        const {

            documento,

        }: {

            documento: ReporteEntregado;

        } = await request.json();

        if (

            !documento

        ) {

            return NextResponse.json(

                {

                    ok: false,

                    error:

                        "Datos incompletos.",

                },

                {

                    status: 400,

                }

            );

        }

        const usuario =
            autorizacion.sesion.usuario;

        await actualizarDocumento(

            usuario,

            documento

        );

        return NextResponse.json({

            ok: true,

            mensaje:

                "Documento actualizado correctamente.",

        });

    }

    catch (error) {

        console.error(

            "Actualizar Documento:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:

                    "No fue posible actualizar el documento.",

            },

            {

                status: 500,

            }

        );

    }

}