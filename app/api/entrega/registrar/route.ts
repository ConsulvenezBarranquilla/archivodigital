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
// La búsqueda se realiza por ID del documento.
// El RECIBO se utiliza únicamente como información
// complementaria.
// ======================================================

import {
    NextRequest,
    NextResponse,
} from "next/server";

import { obtenerSesion } from "@/lib/auth";

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


        // ==================================================
        // SESIÓN
        // ==================================================

        const sesion =
            await obtenerSesion();

        if (!sesion) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Sesión no válida o expirada.",
                },
                {
                    status: 401,
                }
            );

        }


        const {
            documento,
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


        const idDocumento =
            String(
                documento.id ?? ""
            ).trim();


        if (!idDocumento) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "El documento no tiene ID.",
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


        // ==================================================
        // USUARIO DESDE LA SESIÓN
        // ==================================================

        const usuarioEntrega =
            String(
                sesion.nombre || ""
            ).trim();


        if (!usuarioEntrega) {

            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Usuario no identificado.",
                },
                {
                    status: 401,
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
        // BUSCAR POR ID
        // ==================================================

        let fila =
            -1;


        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const idFila =
                String(
                    rows[i][0] ?? ""
                ).trim();


            if (
                idFila === idDocumento
            ) {

                fila =
                    i + 1;

                break;

            }

        }


        // ==================================================
        // DOCUMENTO NO ENCONTRADO
        // ==================================================

        if (
            fila === -1
        ) {

            const referencia =
                recibo
                    ? `ID ${idDocumento}, recibo ${recibo}`
                    : `ID ${idDocumento}`;


            return NextResponse.json(
                {
                    ok: false,
                    error:
                        `No se encontró el documento asociado a ${referencia}.`,
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

            const referencia =
                recibo
                    ? `del recibo ${recibo}`
                    : `con ID ${idDocumento}`;


            return NextResponse.json(
                {
                    ok: false,
                    error:
                        `El documento ${referencia} ya se encuentra registrado como entregado.`,
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

            id:
                idDocumento,

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