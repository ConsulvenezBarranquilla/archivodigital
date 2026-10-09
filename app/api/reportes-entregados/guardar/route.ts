import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    guardarReporte,
} from "@/lib/googleSheets";

import {
    subirArchivoDrive,
} from "@/lib/googleDrive";


export const runtime =
    "nodejs";


export async function POST(
    request: NextRequest
) {

    try {

        // ==================================================
        // VARIABLES
        // ==================================================

        let documento: any = null;

        let usuario = "";

        let pdfConstancia:
            File | null = null;

        let fotoCarnet:
            File | null = null;


        // ==================================================
        // DETECTAR TIPO DE PETICIÓN
        // ==================================================

        const contentType =
            request.headers.get(
                "content-type"
            ) ?? "";


        // ==================================================
        // PETICIÓN MULTIPART / FORMDATA
        // ==================================================

        if (
            contentType.includes(
                "multipart/form-data"
            )
        ) {

            const formData =
                await request.formData();


            // ----------------------------------------------
            // DOCUMENTO
            // ----------------------------------------------

            const documentoRaw =
                formData.get(
                    "documento"
                );


            if (
                typeof documentoRaw !==
                "string"
            ) {

                return NextResponse.json(

                    {
                        ok: false,

                        error:
                            "Documento inválido.",
                    },

                    {
                        status: 400,
                    }

                );

            }


            try {

                documento =
                    JSON.parse(
                        documentoRaw
                    );

            }

            catch {

                return NextResponse.json(

                    {
                        ok: false,

                        error:
                            "El documento no tiene un formato válido.",
                    },

                    {
                        status: 400,
                    }

                );

            }


            // ----------------------------------------------
            // USUARIO
            // ----------------------------------------------

            const usuarioRaw =
                formData.get(
                    "usuario"
                );


            if (
                typeof usuarioRaw ===
                "string"
            ) {

                usuario =
                    usuarioRaw;

            }


            // ----------------------------------------------
            // PDF CONSTANCIA
            // ----------------------------------------------

            const pdfRaw =
                formData.get(
                    "pdfConstancia"
                );


            if (
                pdfRaw instanceof File
            ) {

                pdfConstancia =
                    pdfRaw;

            }


            // ----------------------------------------------
            // FOTO CARNET
            // ----------------------------------------------

            const fotoRaw =
                formData.get(
                    "fotoCarnet"
                );


            if (
                fotoRaw instanceof File
            ) {

                fotoCarnet =
                    fotoRaw;

            }

        }


        // ==================================================
        // PETICIÓN JSON TRADICIONAL
        // ==================================================

        else {

            const body =
                await request.json();


            documento =
                body.documento;


            usuario =
                body.usuario ??
                "";

        }


        // ==================================================
        // VALIDAR DOCUMENTO
        // ==================================================

        if (
            !documento?.id
        ) {

            return NextResponse.json(

                {
                    ok: false,

                    error:
                        "Documento inválido.",
                },

                {
                    status: 400,
                }

            );

        }


        // ==================================================
        // CONSTANCIA DE REGISTRO
        // ==================================================

        if (
            documento.categoria ===
            "CONSTANCIA_REGISTRO"
        ) {


            // ==================================================
            // SUBIR PDF A GOOGLE DRIVE
            // Solo si el usuario seleccionó un PDF nuevo
            // ==================================================

            if (
                pdfConstancia
            ) {

                const resultadoPdf =
                    await subirArchivoDrive({

                        archivo:
                            pdfConstancia,

                        categoria:
                            "CONSTANCIA_REGISTRO",

                        tipoArchivo:
                            "PDF_CONSTANCIA",

                        documentoId:
                            String(
                                documento.id
                            ),

                        archivoIdExistente:
                            documento.pdfConstanciaRegistro
                            || undefined,

                    });


                // ==================================================
                // GUARDAR ID DEL PDF
                // ==================================================

                documento.pdfConstanciaRegistro =
                    resultadoPdf.id;

            }


            // ==================================================
            // SUBIR FOTO CARNET A GOOGLE DRIVE
            // Solo si el usuario seleccionó una foto nueva
            // ==================================================

            if (
                fotoCarnet
            ) {

                const resultadoFoto =
                    await subirArchivoDrive({

                        archivo:
                            fotoCarnet,

                        categoria:
                            "CONSTANCIA_REGISTRO",

                        tipoArchivo:
                            "FOTO_CARNET",

                        documentoId:
                            String(
                                documento.id
                            ),

                        archivoIdExistente:
                            documento.fotoCarnet
                            || undefined,

                    });


                // ==================================================
                // GUARDAR ID DE LA FOTO
                // ==================================================

                documento.fotoCarnet =
                    resultadoFoto.id;

            }


            // ==================================================
            // ESTADO DE PROCESAMIENTO
            // ==================================================

            documento.estadoProcesamiento =
                "PENDIENTE_FIRMA";

        }


        // ==================================================
        // GUARDAR EN GOOGLE SHEETS
        // ==================================================

        await guardarReporte(

            documento,

            usuario

        );


        // ==================================================
        // RESPUESTA
        // ==================================================

        return NextResponse.json({

            ok: true,

            documento: {

                id:
                    documento.id,

                estadoProcesamiento:
                    documento.estadoProcesamiento
                    ?? null,

                pdfConstanciaRegistro:
                    documento.pdfConstanciaRegistro
                    ?? null,

                fotoCarnet:
                    documento.fotoCarnet
                    ?? null,

            },

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
                    error instanceof Error
                        ? error.message
                        : "No fue posible guardar el documento.",

            },

            {

                status: 500,

            }

        );

    }

}