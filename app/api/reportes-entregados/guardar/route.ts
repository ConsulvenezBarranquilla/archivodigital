import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    guardarReporte,
    actualizarPdfConstanciaConsular,
    actualizarCorreoConstanciaConsular,
    actualizarPdfFichaIdentidadSaime,
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

        let pdfConstanciaConsular: File | null = null;

        let fotoCarnet:
            File | null = null;

        let pdfFichaIdentidadSaime: File | null = null;


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

            const pdfConsularRaw = formData.get("pdfConstanciaConsular");
            if (pdfConsularRaw instanceof File) {
                pdfConstanciaConsular = pdfConsularRaw;
            }

            const fichaSaimeRaw = formData.get("pdfFichaIdentidadSaime");
            if (fichaSaimeRaw instanceof File) {
                pdfFichaIdentidadSaime = fichaSaimeRaw;
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

            if (String(documento.codigoActuacion || "").trim().toUpperCase() === "VER-I") {
                if (pdfFichaIdentidadSaime) {
                    if (pdfFichaIdentidadSaime.type !== "application/pdf") {
                        return NextResponse.json({ ok: false, error: "La Ficha de Identidad SAIME debe ser un PDF." }, { status: 400 });
                    }
                    const firmaPdfSaime = Buffer.from(await pdfFichaIdentidadSaime.slice(0, 5).arrayBuffer()).toString("ascii");
                    if (firmaPdfSaime !== "%PDF-") {
                        return NextResponse.json({ ok: false, error: "El archivo de la Ficha de Identidad SAIME no parece un PDF valido." }, { status: 400 });
                    }
                    const resultadoSaime = await subirArchivoDrive({
                        archivo: pdfFichaIdentidadSaime,
                        categoria: "CONSTANCIA_REGISTRO",
                        tipoArchivo: "PDF_FICHA_SAIME",
                        documentoId: String(documento.id),
                        archivoIdExistente: documento.pdfFichaIdentidadSaime || undefined,
                    });
                    documento.pdfFichaIdentidadSaime = resultadoSaime.id;
                }

                if (!documento.pdfConstanciaRegistro || !documento.pdfFichaIdentidadSaime) {
                    return NextResponse.json({ ok: false, error: "Verificacion de Identidad requiere el PDF del Registro Consular y la Ficha de Identidad SAIME." }, { status: 400 });
                }
            }

        }

        if (
            documento.categoria === "CONSTANCIA_CONSULAR" &&
            pdfConstanciaConsular
        ) {
            if (pdfConstanciaConsular.type !== "application/pdf") {
                return NextResponse.json({ ok: false, error: "El archivo de la constancia consular debe ser PDF." }, { status: 400 });
            }

            const firmaPdf = Buffer.from(await pdfConstanciaConsular.slice(0, 5).arrayBuffer()).toString("ascii");
            if (firmaPdf !== "%PDF-") {
                return NextResponse.json({ ok: false, error: "El archivo seleccionado no parece ser un PDF válido." }, { status: 400 });
            }

            const resultadoPdf = await subirArchivoDrive({
                archivo: pdfConstanciaConsular,
                categoria: "CONSTANCIA_CONSULAR",
                tipoArchivo: "PDF_CONSTANCIA",
                documentoId: String(documento.id),
                archivoIdExistente: documento.pdfConstanciaConsular || undefined,
            });

            documento.pdfConstanciaConsular = resultadoPdf.id;
            documento.estadoProcesamiento = "PENDIENTE_FIRMA";
        }

        if (
            documento.categoria === "CONSTANCIA_REGISTRO" &&
            String(documento.codigoActuacion || "").trim().toUpperCase() === "VER-I" &&
            pdfFichaIdentidadSaime &&
            !documento.pdfFichaIdentidadSaime
        ) {
            return NextResponse.json({ ok: false, error: "No se pudo guardar la Ficha de Identidad SAIME." }, { status: 400 });
        }

        if (documento.categoria === "CONSTANCIA_CONSULAR" && documento.correoSolicitante) {
            const correo = String(documento.correoSolicitante).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                return NextResponse.json({ ok: false, error: "El correo electronico del solicitante no es valido." }, { status: 400 });
            }
            documento.correoSolicitante = correo;
        }


        // ==================================================
        // GUARDAR EN GOOGLE SHEETS
        // ==================================================

        await guardarReporte(

            documento,

            usuario

        );

        if (
            documento.categoria === "CONSTANCIA_CONSULAR" &&
            documento.pdfConstanciaConsular
        ) {
            await actualizarPdfConstanciaConsular(
                String(documento.id),
                String(documento.pdfConstanciaConsular)
            );
        }

        if (
            documento.categoria === "CONSTANCIA_REGISTRO" &&
            String(documento.codigoActuacion || "").trim().toUpperCase() === "VER-I" &&
            documento.pdfFichaIdentidadSaime
        ) {
            await actualizarPdfFichaIdentidadSaime(
                String(documento.id),
                String(documento.pdfFichaIdentidadSaime)
            );
        }

        if (
            documento.categoria === "CONSTANCIA_CONSULAR" &&
            typeof documento.correoSolicitante === "string"
        ) {
            await actualizarCorreoConstanciaConsular(
                String(documento.id),
                documento.correoSolicitante
            );
        }


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

                pdfConstanciaConsular:
                    documento.pdfConstanciaConsular
                    ?? null,

                pdfFichaIdentidadSaime:
                    documento.pdfFichaIdentidadSaime
                    ?? null,

                correoSolicitante:
                    documento.correoSolicitante
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
