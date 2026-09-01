// ======================================================
// API ENTREGA
// Registrar entrega de documento
//
// IMPORTANTE:
// Esta API es exclusiva del módulo /entrega.
//
// NO utiliza registrarEntrega() de
// googleSheetReportes.ts.
//
// La búsqueda se realiza por RECIBO,
// que es la referencia común entre los módulos.
// ======================================================

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    sheets,
    MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import {
    fechaHoraActual,
} from "@/lib/fechas";


// ======================================================
// POST
// ======================================================

export async function POST(
    request: NextRequest
) {

    try {

        const body =
            await request.json();

        const {
            documento,
            usuario,
            fechaEntrega,
            observaciones,
        } = body;


        // ==================================================
        // VALIDACIONES
        // ==================================================

        if (!documento) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Documento no recibido.",
                },
                {
                    status: 400,
                }
            );

        }


        const recibo =
            String(
                documento.recibo ?? ""
            ).trim();


        if (!recibo) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "El documento no tiene número de recibo.",
                },
                {
                    status: 400,
                }
            );

        }


        const usuarioEntrega =
            String(
                usuario ?? ""
            ).trim();


        if (!usuarioEntrega) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Usuario no identificado.",
                },
                {
                    status: 400,
                }
            );

        }


        // ==================================================
        // FECHA DE ENTREGA
        // ==================================================

        const fecha =
            String(
                fechaEntrega ?? ""
            ).trim() ||
            fechaHoraActual();


        const textoObservaciones =
            String(
                observaciones ?? ""
            );


        // ==================================================
        // LEER REPORTES ENTREGADOS
        //
        // A = ID
        // B = CATEGORIA
        // C = TIPO DOCUMENTO
        // D = RECIBO
        // ...
        // J = ENTREGADO
        // K = FECHA ENTREGA
        // L = ENTREGADO POR
        // M = OBSERVACIONES
        // ==================================================

        const response =
            await sheets.spreadsheets.values.get({

                spreadsheetId:
                    MODULO_CAJA_SHEET_ID,

                range:
                    "ReportesEntregados!A:M",

            });


        const rows =
            response.data.values || [];


        // ==================================================
        // BUSCAR POR RECIBO
        //
        // NO utilizamos documento.id.
        // ==================================================

        let fila =
            -1;


        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const reciboFila =
                String(
                    rows[i][3] ?? ""
                ).trim();


            if (
                reciboFila === recibo
            ) {

                fila =
                    i + 1;

                break;

            }

        }


        // ==================================================
        // RECIBO NO ENCONTRADO
        // ==================================================

        if (
            fila === -1
        ) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        `No se encontró el documento asociado al recibo ${recibo}.`,
                },
                {
                    status: 404,
                }
            );

        }


        // ==================================================
        // VERIFICAR SI YA ESTÁ ENTREGADO
        // ==================================================

        const estadoActual =
            String(
                rows[fila - 1][9] ?? ""
            )
                .trim()
                .toUpperCase();


        if (
            estadoActual === "SI"
        ) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        `El documento del recibo ${recibo} ya se encuentra registrado como entregado.`,
                },
                {
                    status: 400,
                }
            );

        }


        // ==================================================
        // ACTUALIZAR ENTREGA
        //
        // J = ENTREGADO
        // K = FECHA ENTREGA
        // L = ENTREGADO POR
        // M = OBSERVACIONES
        // ==================================================

        await sheets.spreadsheets.values.update({

            spreadsheetId:
                MODULO_CAJA_SHEET_ID,

            range:
                `ReportesEntregados!J${fila}:M${fila}`,

            valueInputOption:
                "USER_ENTERED",

            requestBody: {

                values: [[

                    "SI",

                    fecha,

                    usuarioEntrega,

                    textoObservaciones,

                ]],

            },

        });


        // ==================================================
        // RESPUESTA
        // ==================================================

        return NextResponse.json({

            ok: true,

            recibo,

            fechaEntrega:
                fecha,

            usuario:
                usuarioEntrega,

            mensaje:
                "Documento entregado correctamente.",

        });

    }

    catch (error: any) {

        console.error(
            "ERROR REGISTRANDO ENTREGA:",
            error
        );


        return NextResponse.json(

            {

                ok: false,

                error:
                    error?.message ??
                    "No fue posible registrar la entrega.",

            },

            {

                status: 500,

            }

        );

    }

}