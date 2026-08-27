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

        // ==========================================
        // VALIDACIÓN
        // ==========================================

        if (!usuario) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "No se recibió el usuario.",
                },
                {
                    status: 400,
                }
            );

        }

        if (!fechaValija) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Debe indicar la fecha de la valija.",
                },
                {
                    status: 400,
                }
            );

        }

        if (
            !Array.isArray(documentos) ||
            documentos.length === 0
        ) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Debe seleccionar al menos un pasaporte.",
                },
                {
                    status: 400,
                }
            );

        }

        // ==========================================
        // VALIDAR QUE SEAN PASAPORTES
        // ==========================================

        const documentosValidos =
            documentos.every(
                documento =>
                    documento.categoria ===
                    "PASAPORTES"
            );

        if (!documentosValidos) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Solo se pueden registrar pasaportes en una valija.",
                },
                {
                    status: 400,
                }
            );

        }

        // ==========================================
        // REGISTRAR VALIJA
        // ==========================================
        //
        // IMPORTANTE:
        //
        // Esta operación solamente registra
        // la fecha de llegada de la valija.
        //
        // NO modifica:
        //
        // - Número de pasaporte
        // - Fecha de emisión
        // - Fecha de vencimiento
        // - Estado de procesamiento
        //
        // Esos datos se completarán posteriormente
        // mediante "Editar Documento".
        // ==========================================

        await registrarValija(
            usuario,
            fechaValija,
            documentos
        );

        // ==========================================
        // RESPUESTA
        // ==========================================

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