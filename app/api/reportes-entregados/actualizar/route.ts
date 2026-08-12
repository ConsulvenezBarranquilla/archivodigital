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

export async function POST(

    request: NextRequest

) {

    try {

        const {

            usuario,

            documento,

        }: {

            usuario: string;

            documento: ReporteEntregado;

        } = await request.json();

        if (

            !usuario ||

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