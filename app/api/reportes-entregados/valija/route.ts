// ======================================================
// API
// Registrar recepción de valija
// ======================================================

import {

    NextRequest,

    NextResponse,

} from "next/server";

import {

    registrarValija,

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

            fechaValija,

            documentos,

        }: {

            usuario: string;

            fechaValija: string;

            documentos: ReporteEntregado[];

        } = await request.json();

        if (

            !usuario ||

            !fechaValija ||

            !Array.isArray(

                documentos

            )

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

        await registrarValija(

            usuario,

            fechaValija,

            documentos

        );

        return NextResponse.json({

            ok: true,

            mensaje:

                "Valija registrada correctamente.",

        });

    }

    catch (error) {

        console.error(

            "Registrar Valija:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:

                    "No fue posible registrar la valija.",

            },

            {

                status: 500,

            }

        );

    }

}