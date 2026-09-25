import { NextRequest, NextResponse } from "next/server";

import { obtenerSesion } from "@/lib/auth";

import {
    sheets,
    REGISTRO_CONSULAR_SHEET_ID,
    MODULO_CAJA_SHEET_ID,
    leerHojaRegistro,
    leerHoja,
} from "@/lib/googleSheets";


/*------------------------------------------
NORMALIZAR
------------------------------------------*/

function normalizar(
    valor: any
): string {

    return String(
        valor ?? ""
    )
        .trim()
        .toUpperCase();

}


/*------------------------------------------
DOCUMENTO PRINCIPAL
------------------------------------------*/

function obtenerDocumentoPrincipalCaja(
    cedula: string,
    pasaporte: string,
    nacionalidad: string
): string {

    const nacionalidadNormalizada =
        normalizar(
            nacionalidad
        );

    const cedulaNormalizada =
        normalizar(
            cedula
        );

    const pasaporteNormalizado =
        normalizar(
            pasaporte
        );


    /*
    VENEZOLANOS
    La cédula es el documento principal.
    */

    if (
        nacionalidadNormalizada ===
            "VENEZOLANA" ||
        nacionalidadNormalizada ===
            "VENEZOLANO"
    ) {

        return (
            cedulaNormalizada ||
            pasaporteNormalizado ||
            ""
        );

    }


    /*
    EXTRANJEROS
    El pasaporte es el documento principal
    cuando existe.
    */

    return (
        pasaporteNormalizado ||
        cedulaNormalizada ||
        ""
    );

}


/*------------------------------------------
CAMPOS PERMITIDOS
------------------------------------------*/

const CAMPOS_PERMITIDOS = [
    "cedula",
    "pasaporte",
    "primerNombre",
    "segundoNombre",
    "primerApellido",
    "segundoApellido",
    "nacionalidad",
    "correo",
    "telefono",
];


/*------------------------------------------
POST
------------------------------------------*/

export async function POST(
    request: NextRequest
) {

    try {

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

        const body =
            await request.json();

        const documentoOriginal =
            normalizar(
                body.documentoOriginal
            );

        const campo =
            String(
                body.campo ?? ""
            )
                .trim();

        let valor =
            String(
                body.valor ?? ""
            )
                .trim();


        /*------------------------------------------
        VALIDAR DOCUMENTO ORIGINAL
        ------------------------------------------*/

        if (
            !documentoOriginal
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "Debe indicar el documento original del ciudadano.",
                },
                {
                    status: 400,
                }
            );

        }


        /*------------------------------------------
        VALIDAR CAMPO
        ------------------------------------------*/

        if (
            !CAMPOS_PERMITIDOS.includes(
                campo
            )
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "El campo indicado no puede ser editado.",
                },
                {
                    status: 400,
                }
            );

        }


        /*------------------------------------------
        NORMALIZAR DOCUMENTOS
        ------------------------------------------*/

        if (
            campo === "cedula" ||
            campo === "pasaporte"
        ) {

            valor =
                normalizar(
                    valor
                );

        }


        /*------------------------------------------
        LEER REGISTRO CONSULAR
        ------------------------------------------*/

        const filas =
            await leerHojaRegistro(
                "Respuestas de formulario 1!A:O"
            );


        if (
            !filas ||
            filas.length < 2
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "No existen registros consulares.",
                },
                {
                    status: 404,
                }
            );

        }


        /*------------------------------------------
        BUSCAR CIUDADANO
        ------------------------------------------*/

        let indiceFila =
            -1;


        for (
            let i = 1;
            i < filas.length;
            i++
        ) {

            const row =
                filas[i] || [];


            const cedulaFila =
                normalizar(
                    row[1]
                );

            const pasaporteFila =
                normalizar(
                    row[14]
                );


            if (
                cedulaFila ===
                    documentoOriginal ||
                pasaporteFila ===
                    documentoOriginal
            ) {

                indiceFila =
                    i;

                break;

            }

        }


        if (
            indiceFila ===
            -1
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "No se encontró el ciudadano.",
                },
                {
                    status: 404,
                }
            );

        }


        /*------------------------------------------
        COPIAR FILA ACTUAL
        ------------------------------------------*/

        const filaActual =
            [
                ...(filas[indiceFila] || [])
            ];


        /*
        A:O = 15 columnas
        */

        while (
            filaActual.length <
            15
        ) {

            filaActual.push("");

        }


        /*------------------------------------------
        DATOS ACTUALES
        ------------------------------------------*/

        let cedula =
            normalizar(
                filaActual[1]
            );

        let primerNombre =
            String(
                filaActual[2] ??
                ""
            ).trim();

        let segundoNombre =
            String(
                filaActual[3] ??
                ""
            ).trim();

        let primerApellido =
            String(
                filaActual[4] ??
                ""
            ).trim();

        let segundoApellido =
            String(
                filaActual[5] ??
                ""
            ).trim();

        let nacionalidad =
            String(
                filaActual[6] ??
                ""
            ).trim();

        let correo =
            String(
                filaActual[11] ??
                ""
            ).trim();

        let telefono =
            String(
                filaActual[12] ??
                ""
            ).trim();

        let pasaporte =
            normalizar(
                filaActual[14]
            );


        /*------------------------------------------
        DOCUMENTOS ANTERIORES
        ------------------------------------------*/

        const cedulaAnterior =
            normalizar(
                filaActual[1]
            );

        const pasaporteAnterior =
            normalizar(
                filaActual[14]
            );


        /*------------------------------------------
        APLICAR CAMBIO
        ------------------------------------------*/

        switch (
            campo
        ) {

            case "cedula":

                cedula =
                    valor;

                break;


            case "pasaporte":

                pasaporte =
                    valor;

                break;


            case "primerNombre":

                primerNombre =
                    valor;

                break;


            case "segundoNombre":

                segundoNombre =
                    valor;

                break;


            case "primerApellido":

                primerApellido =
                    valor;

                break;


            case "segundoApellido":

                segundoApellido =
                    valor;

                break;


            case "nacionalidad":

                nacionalidad =
                    valor;

                break;


            case "correo":

                correo =
                    valor;

                break;


            case "telefono":

                telefono =
                    valor;

                break;

        }


        /*------------------------------------------
        DEBE EXISTIR AL MENOS UN DOCUMENTO
        ------------------------------------------*/

        if (
            !cedula &&
            !pasaporte
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "El ciudadano debe conservar al menos un documento.",
                },
                {
                    status: 400,
                }
            );

        }


        /*------------------------------------------
        VALIDAR CÉDULA
        ------------------------------------------*/

        if (
            cedula &&
            !/^\d+$/.test(
                cedula
            )
        ) {

            return NextResponse.json(
                {
                    ok: false,

                    error:
                        "La cédula debe contener únicamente números.",
                },
                {
                    status: 400,
                }
            );

        }


        /*------------------------------------------
        VALIDAR CÉDULA DUPLICADA
        ------------------------------------------*/

        if (
            cedula
        ) {

            for (
                let i = 1;
                i < filas.length;
                i++
            ) {

                if (
                    i ===
                    indiceFila
                ) {

                    continue;

                }


                const cedulaExistente =
                    normalizar(
                        filas[i]?.[1]
                    );


                if (
                    cedulaExistente ===
                    cedula
                ) {

                    return NextResponse.json(
                        {
                            ok: false,

                            error:
                                `La cédula ${cedula} ya está registrada.`,
                        },
                        {
                            status: 400,
                        }
                    );

                }

            }

        }


        /*------------------------------------------
        VALIDAR PASAPORTE DUPLICADO
        ------------------------------------------*/

        if (
            pasaporte
        ) {

            for (
                let i = 1;
                i < filas.length;
                i++
            ) {

                if (
                    i ===
                    indiceFila
                ) {

                    continue;

                }


                const pasaporteExistente =
                    normalizar(
                        filas[i]?.[14]
                    );


                if (
                    pasaporteExistente ===
                    pasaporte
                ) {

                    return NextResponse.json(
                        {
                            ok: false,

                            error:
                                `El pasaporte ${pasaporte} ya está registrado.`,
                        },
                        {
                            status: 400,
                        }
                    );

                }

            }

        }


        /*------------------------------------------
        ACTUALIZAR FILA REGISTRO CONSULAR
        ------------------------------------------*/

        /*
        B = Cédula
        C = Primer Nombre
        D = Segundo Nombre
        E = Primer Apellido
        F = Segundo Apellido
        G = Nacionalidad
        L = Correo
        M = Teléfono
        O = Pasaporte

        A, H, I, J, K y N
        se conservan exactamente
        como estaban.
        */

        filaActual[1] =
            cedula;

        filaActual[2] =
            primerNombre;

        filaActual[3] =
            segundoNombre;

        filaActual[4] =
            primerApellido;

        filaActual[5] =
            segundoApellido;

        filaActual[6] =
            nacionalidad;

        filaActual[11] =
            correo;

        filaActual[12] =
            telefono;

        filaActual[14] =
            pasaporte;


        const numeroFilaRegistro =
            indiceFila + 1;


        /*------------------------------------------
        ESCRIBIR REGISTRO CONSULAR
        ------------------------------------------*/

        await sheets.spreadsheets.values.update(
            {
                spreadsheetId:
                    REGISTRO_CONSULAR_SHEET_ID,

                range:
                    `Respuestas de formulario 1!A${numeroFilaRegistro}:O${numeroFilaRegistro}`,

                valueInputOption:
                    "USER_ENTERED",

                requestBody:
                    {
                        values:
                            [
                                filaActual,
                            ],
                    },
            }
        );


        /*------------------------------------------
        CALCULAR DOCUMENTO PRINCIPAL
        ------------------------------------------*/

        const documentoPrincipal =
            obtenerDocumentoPrincipalCaja(
                cedula,
                pasaporte,
                nacionalidad
            );


        /*------------------------------------------
        LEER CAJA
        ------------------------------------------*/

        const filasCaja =
            await leerHoja(
                "Caja",
                "A:N"
            );


        /*------------------------------------------
        DOCUMENTOS QUE IDENTIFICAN
        AL CIUDADANO EN CAJA
        ------------------------------------------*/

        const documentosAnteriores =
            new Set(
                [
                    documentoOriginal,
                    cedulaAnterior,
                    pasaporteAnterior,
                ].filter(
                    Boolean
                )
            );


        let filasCajaActualizadas =
            0;


        /*------------------------------------------
        ACTUALIZAR CAJA
        ------------------------------------------*/

        if (
            filasCaja &&
            filasCaja.length > 1
        ) {

            for (
                let i = 1;
                i < filasCaja.length;
                i++
            ) {

                const row =
                    [
                        ...(filasCaja[i] || [])
                    ];


                while (
                    row.length <
                    14
                ) {

                    row.push("");

                }


                /*
                C = Documento principal
                L = Cédula
                M = Pasaporte
                */

                const documentoCaja =
                    normalizar(
                        row[2]
                    );

                const cedulaCaja =
                    normalizar(
                        row[11]
                    );

                const pasaporteCaja =
                    normalizar(
                        row[12]
                    );


                const corresponde =
                    documentosAnteriores.has(
                        documentoCaja
                    ) ||
                    documentosAnteriores.has(
                        cedulaCaja
                    ) ||
                    documentosAnteriores.has(
                        pasaporteCaja
                    );


                if (
                    !corresponde
                ) {

                    continue;

                }


                /*------------------------------------------
                C = DOCUMENTO PRINCIPAL
                ------------------------------------------*/

                row[2] =
                    documentoPrincipal;


                /*------------------------------------------
                D = NOMBRE COMPLETO
                ------------------------------------------*/

                const nombreCompleto =
                    [
                        primerNombre,
                        segundoNombre,
                        primerApellido,
                        segundoApellido,
                    ]
                        .filter(
                            Boolean
                        )
                        .join(" ")
                        .trim();


                row[3] =
                    nombreCompleto;


                /*------------------------------------------
                E = CORREO
                ------------------------------------------*/

                row[4] =
                    correo;


                /*
                F:K
                SE CONSERVAN
                */


                /*------------------------------------------
                L = CÉDULA
                ------------------------------------------*/

                row[11] =
                    cedula;


                /*------------------------------------------
                M = PASAPORTE
                ------------------------------------------*/

                row[12] =
                    pasaporte;


                /*------------------------------------------
                N = NACIONALIDAD
                ------------------------------------------*/

                row[13] =
                    nacionalidad;


                const numeroFilaCaja =
                    i + 1;


                /*------------------------------------------
                ACTUALIZAR FILA CAJA
                ------------------------------------------*/

                await sheets.spreadsheets.values.update(
                    {
                        spreadsheetId:
                            MODULO_CAJA_SHEET_ID,

                        range:
                            `Caja!A${numeroFilaCaja}:N${numeroFilaCaja}`,

                        valueInputOption:
                            "USER_ENTERED",

                        requestBody:
                            {
                                values:
                                    [
                                        row,
                                    ],
                            },
                    }
                );


                filasCajaActualizadas++;

            }

        }


        /*------------------------------------------
        NOMBRE COMPLETO
        ------------------------------------------*/

        const nombreCompleto =
            [
                primerNombre,
                segundoNombre,
                primerApellido,
                segundoApellido,
            ]
                .filter(
                    Boolean
                )
                .join(" ")
                .trim();


        /*------------------------------------------
        RESPUESTA
        ------------------------------------------*/

        return NextResponse.json(
            {
                ok: true,

                mensaje:
                    "Ciudadano actualizado correctamente.",

                campo,

                documentoOriginal,

                documento:
                    documentoPrincipal,

                cedula,

                pasaporte,

                primerNombre,

                segundoNombre,

                primerApellido,

                segundoApellido,

                nombreCompleto,

                nacionalidad,

                correo,

                telefono,

                filasCajaActualizadas,
            }
        );

    }
    catch (
        error: any
    ) {

        console.error(
            "Error editar-ciudadano-caja:",
            error
        );


        return NextResponse.json(
            {
                ok: false,

                error:
                    error?.message ||
                    "Error interno al actualizar el ciudadano.",
            },
            {
                status: 500,
            }
        );

    }

}