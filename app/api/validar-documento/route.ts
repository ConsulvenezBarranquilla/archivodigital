import { NextRequest, NextResponse } from "next/server";

import {
    validarDocumento,
    TipoValidacion,
} from "@/lib/validacionDocumentos";

// ==========================================
// POST
// ==========================================

export async function POST(
    request: NextRequest
) {
    try {

        // ======================================
        // LEER BODY
        // ======================================

        const body =
            await request.json();

        const tipo =
            body?.tipo as TipoValidacion;

        const codigo =
            String(
                body?.codigo ?? ""
            ).trim();

        // ======================================
        // VALIDAR DATOS
        // ======================================

        if (!tipo) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Debe indicar el tipo de documento.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!codigo) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Debe indicar el número del documento.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================
        // VALIDAR DOCUMENTO
        // ======================================

        const resultado =
            await validarDocumento(
                tipo,
                codigo
            );

        // ======================================
        // RESPUESTA
        // ======================================

        return NextResponse.json(
            {
                ok: true,
                ...resultado,
            },
            {
                status: 200,
            }
        );

    } catch (error) {

        console.error(
            "Error validando documento:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "No fue posible validar el documento en este momento.",
            },
            {
                status: 500,
            }
        );
    }
}