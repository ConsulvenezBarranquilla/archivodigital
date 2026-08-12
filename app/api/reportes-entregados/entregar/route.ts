// ======================================================
// API
// Registrar entrega de documento
// ======================================================

import {

    NextRequest,

    NextResponse,

} from "next/server";

import {

    registrarEntrega,

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

            fechaEntrega,

            observaciones,

        }: {

            usuario: string;

            documento: ReporteEntregado;

            fechaEntrega: string;

            observaciones: string;

        } = await request.json();

        if (

            !usuario ||

            !documento ||

            !fechaEntrega

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

        await registrarEntrega(

            usuario,

            documento,

            fechaEntrega,

            observaciones ?? ""

        );

        return NextResponse.json({

            ok: true,

            mensaje:

                "Documento entregado correctamente.",

        });

    }

    catch (error) {

        console.error(

            "Registrar Entrega:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:

                    "No fue posible registrar la entrega.",

            },

            {

                status: 500,

            }

        );

    }

}