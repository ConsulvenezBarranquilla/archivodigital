import { NextRequest, NextResponse } from "next/server";

import { guardarReporte } from "@/lib/googleSheets";

export async function POST(
    request: NextRequest
) {

    try {

        const body = await request.json();

        const {
            documento,
            usuario,
        } = body;

        if (!documento?.id) {

            return NextResponse.json(
                {
                    ok: false,
                    error: "Documento inválido.",
                },
                {
                    status: 400,
                }
            );

        }

        await guardarReporte(
            documento,
            usuario
        );

        return NextResponse.json({
            ok: true,
        });

    }

    catch (error) {

        console.error(
            "Error guardando reporte:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "No fue posible guardar el documento.",
            },
            {
                status: 500,
            }
        );

    }

}