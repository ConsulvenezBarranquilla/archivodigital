// ======================================================
// Reportes Entregados
// Acceso a Google Sheets
// Consulnet Barranquilla
// ======================================================

import {
    sheets,
    MODULO_CAJA_SHEET_ID,
    HOJA_REPORTES_ENTREGADOS,
} from "@/lib/googleSheets";

import {
    ReporteEntregado,
} from "@/types/ReporteEntregado";

// ======================================================
// Configuración
// ======================================================

const RANGO_REPORTES = "A:BA";

// ======================================================
// Índices de columnas
// ======================================================

export const COLUMNAS = {

    ID: 0,

    CATEGORIA: 1,

    TIPO_DOCUMENTO: 2,

    RECIBO: 3,

    FECHA_RECIBO: 4,

    PLANILLA_GC: 5,

    SOLICITANTE: 6,

    DOCUMENTO: 7,

    ESTADO: 8,

    ENTREGADO: 9,

    FECHA_ENTREGA: 10,

    ENTREGADO_POR: 11,

    OBSERVACIONES: 12,

    TITULAR_PASAPORTE: 13,

    NUMERO_PASAPORTE: 14,

    FECHA_VALIJA: 15,

    FECHA_EMISION: 16,

    FECHA_VENCIMIENTO: 17,

    NUMERO_VISA: 18,

    TIPO_VISA: 19,

    NACIONALIDAD: 20,

        VIGENCIA: 21,

    // ==========================================
    // Apostilla
    // ==========================================

    ESTADO_APOSTILLA: 22,

    // ==========================================
    // Fe de Vida
    // X
    // ==========================================

    FECHA_EMISION_DOCUMENTO: 23,

    CORRELATIVO_DOCUMENTO: 24,

    // ==========================================
    // Carta de Soltería
    // Z
    // ==========================================

    FECHA_CARTA: 25,

    CORRELATIVO_CARTA: 26,

    // ==========================================
    // Certificados
    // ==========================================

    TIPO_CERTIFICADO: 27,

    FECHA_REGISTRO: 28,

    NUMERO_CERTIFICADO: 29,

    NUMERO_REGISTRO: 30,

    FECHA_REGISTRO_CONSULAR: 31,

    // ==========================================
    // Constancia Consular
    // ==========================================

    FECHA_CONSTANCIA: 32,

    CORRELATIVO_CONSTANCIA: 33,

    // ==========================================
    // Poderes
    // ==========================================

    TIPO_PODER: 34,

    APODERADO: 35,

    DOCUMENTO_APODERADO: 36,

    ESTADO_PODER: 37,

    // ==========================================
    // Autorización de viaje
    // ==========================================

    AUTORIZA: 38,

    PARENTESCO: 39,

    MENOR: 40,

    PASAPORTE_MENOR: 41,

    DESTINO: 42,

    FECHA_IDA: 43,

    FECHA_RETORNO: 44,

    ACOMPANANTE: 45,

    PASAPORTE_ACOMPANANTE: 46,

    MODALIDAD: 47,

    // ==========================================
    // Auditoría
    // ==========================================

    FECHA_CREACION: 48,

    USUARIO_CREACION: 49,

    FECHA_ACTUALIZACION: 50,

    USUARIO_ACTUALIZACION: 51,
   
    // ==================================================
    // BA
    // Estado interno de procesamiento
    // ==================================================

    ESTADO_PROCESAMIENTO: 52,

} as const;

// ======================================================
// Convertir datos históricos de PODER desde Google Sheets
// al modelo actual de ReporteEntregado
// ======================================================

function obtenerApoderadosPoder(
    row: any[]
): {
    nombre: string;
    documento: string;
}[] {

    const nombre =
        String(
            row[
                COLUMNAS.APODERADO
            ] ?? ""
        ).trim();

    const documento =
        String(
            row[
                COLUMNAS.DOCUMENTO_APODERADO
            ] ?? ""
        ).trim();

    if (
        !nombre &&
        !documento
    ) {
        return [];
    }

    return [
        {
            nombre,
            documento,
        },
    ];
}
// ======================================================
// Estado por defecto
// ======================================================

const ESTADO_PROCESAMIENTO_DEFAULT =
    "EN_PROCESO";

// ======================================================
// Leer reportes
// ======================================================

async function leerReportes(): Promise<any[][]> {

    const response =
        await sheets.spreadsheets.values.get({

            spreadsheetId:
                MODULO_CAJA_SHEET_ID,

            range:
                `${HOJA_REPORTES_ENTREGADOS}!${RANGO_REPORTES}`,

        });

    return (
        response.data.values ?? []
    );

}

// ======================================================
// Fecha / hora actual
// ======================================================

function ahora(): string {

    return new Date()
        .toISOString();

}

// ======================================================
// Buscar fila por ID
// ======================================================

export async function buscarFilaPorId(

    id: string

): Promise<number> {

    const filas =
        await leerReportes();

    for (

        let i = 1;

        i < filas.length;

        i++

    ) {

        if (

            String(
                filas[i][COLUMNAS.ID] ??
                ""
            ).trim() ===

            String(id).trim()

        ) {

            return i + 1;

        }

    }

    return -1;

}

// ======================================================
// Buscar fila por recibo
// ======================================================
//
// El recibo es la referencia común entre:
// Caja → Gestión Consular → Reportes Entregados.
//
// ======================================================

export async function buscarFilaPorRecibo(

    recibo: string

): Promise<number> {

    const filas =
        await leerReportes();

    const reciboBuscado =
        String(
            recibo ?? ""
        ).trim();

    if (!reciboBuscado) {

        return -1;

    }

    for (

        let i = 1;

        i < filas.length;

        i++

    ) {

        const reciboFila =
            String(
                filas[i][
                    COLUMNAS.RECIBO
                ] ?? ""
            ).trim();

        if (
            reciboFila ===
            reciboBuscado
        ) {

            return i + 1;

        }

    }

    return -1;

}

// ======================================================
// Obtener reporte por ID
// ======================================================

export async function obtenerReportePorId(

    id: string

): Promise<ReporteEntregado | null> {

    const filas =
        await leerReportes();

    const idBuscado =
        String(
            id ?? ""
        ).trim();

    for (

        let i = 1;

        i < filas.length;

        i++

    ) {

        const row =
            filas[i];

        const idFila =
            String(
                row[
                    COLUMNAS.ID
                ] ?? ""
            ).trim();

        if (
            idFila !==
            idBuscado
        ) {

            continue;

        }

        return {

            id:
                row[
                    COLUMNAS.ID
                ] ?? "",

            categoria:
                row[
                    COLUMNAS.CATEGORIA
                ],

            tipoDocumento:
                row[
                    COLUMNAS.TIPO_DOCUMENTO
                ],

            recibo:
                row[
                    COLUMNAS.RECIBO
                ] ?? "",

            fechaRecibo:
                row[
                    COLUMNAS.FECHA_RECIBO
                ] ?? "",

            planillaGC:
                row[
                    COLUMNAS.PLANILLA_GC
                ] ?? "",

            solicitante:
                row[
                    COLUMNAS.SOLICITANTE
                ] ?? "",

            documento:
                row[
                    COLUMNAS.DOCUMENTO
                ] ?? "",

            estado:
                row[
                    COLUMNAS.ESTADO
                ] ?? "",

            entregado:
                row[
                    COLUMNAS.ENTREGADO
                ] === "SI",

            fechaEntrega:
                row[
                    COLUMNAS.FECHA_ENTREGA
                ] ?? "",

            entregadoPor:
                row[
                    COLUMNAS.ENTREGADO_POR
                ] ?? "",

            observaciones:
                row[
                    COLUMNAS.OBSERVACIONES
                ] ?? "",

            // ==========================================
            // Estado de procesamiento
            // ==========================================

            estadoProcesamiento:

                row[
                    COLUMNAS
                        .ESTADO_PROCESAMIENTO
                ]?.toString().trim() ||

                ESTADO_PROCESAMIENTO_DEFAULT,

            // ==========================================
            // Pasaportes
            // ==========================================

            titularPasaporte:
                row[
                    COLUMNAS
                        .TITULAR_PASAPORTE
                ] ?? "",

            numeroPasaporte:
                row[
                    COLUMNAS
                        .NUMERO_PASAPORTE
                ] ?? "",

            fechaValija:
                row[
                    COLUMNAS
                        .FECHA_VALIJA
                ] ?? "",

            fechaEmision:
                row[
                    COLUMNAS
                        .FECHA_EMISION
                ] ?? "",

            fechaVencimiento:
                row[
                    COLUMNAS
                        .FECHA_VENCIMIENTO
                ] ?? "",

            // ==========================================
            // Visas
            // ==========================================

            numeroVisa:
                row[
                    COLUMNAS
                        .NUMERO_VISA
                ] ?? "",

            tipoVisa:
                row[
                    COLUMNAS
                        .TIPO_VISA
                ] ?? "",

            nacionalidad:
                row[
                    COLUMNAS
                        .NACIONALIDAD
                ] ?? "",

            vigencia:
                row[
                    COLUMNAS
                        .VIGENCIA
                ] ?? "",

            // ==========================================
            // Apostilla
            // ==========================================

            estadoApostilla:
                row[
                    COLUMNAS
                        .ESTADO_APOSTILLA
                ] ?? "",

            // ==========================================
// Fe de Vida
// ==========================================

fechaEmisionDocumento:
    row[
        COLUMNAS.FECHA_EMISION_DOCUMENTO
    ] ?? "",

correlativoDocumento:
    row[
        COLUMNAS.CORRELATIVO_DOCUMENTO
    ] ?? "",

// ==========================================
// Carta de Soltería
// ==========================================

fechaCarta:
    row[
        COLUMNAS.FECHA_CARTA
    ] ?? "",

correlativoCarta:
    row[
        COLUMNAS.CORRELATIVO_CARTA
    ] ?? "",

            // ==========================================
            // Certificados
            // ==========================================

            tipoCertificado:
                row[
                    COLUMNAS
                        .TIPO_CERTIFICADO
                ] ?? "",

            fechaRegistro:
                row[
                    COLUMNAS
                        .FECHA_REGISTRO
                ] ?? "",

            numeroCertificado:
                row[
                    COLUMNAS
                        .NUMERO_CERTIFICADO
                ] ?? "",

            // ==========================================
// Registro Consular
// ==========================================

numeroRegistro:
    row[
        COLUMNAS
            .NUMERO_REGISTRO
    ] ?? "",

fechaRegistroConsular:
    row[
        COLUMNAS
            .FECHA_REGISTRO
    ] ?? "",

            // ==========================================
            // Constancia Consular
            // ==========================================

            fechaConstancia:
                row[
                    COLUMNAS
                        .FECHA_CONSTANCIA
                ] ?? "",

            // ==========================================
            // Poderes
            // ==========================================

            tipoPoder:
    row[
        COLUMNAS
            .TIPO_PODER
    ] ?? "",

apoderadosPoder:
    obtenerApoderadosPoder(
        row
    ),

estadoPoder:
    row[
        COLUMNAS
            .ESTADO_PODER
    ] ?? "",

            // ==========================================
            // Autorización de viaje
            // ==========================================

            origen:
                row[
                    COLUMNAS
                        .AUTORIZA
                ] ?? "",

            parentesco:
                row[
                    COLUMNAS
                        .PARENTESCO
                ] ?? "",

            menor:
                row[
                    COLUMNAS
                        .MENOR
                ] ?? "",

            pasaporteMenor:
                row[
                    COLUMNAS
                        .PASAPORTE_MENOR
                ] ?? "",

            destino:
                row[
                    COLUMNAS
                        .DESTINO
                ] ?? "",

            fechaIda:
                row[
                    COLUMNAS
                        .FECHA_IDA
                ] ?? "",

            fechaRetorno:
                row[
                    COLUMNAS
                        .FECHA_RETORNO
                ] ?? "",

            acompanante:
                row[
                    COLUMNAS
                        .ACOMPANANTE
                ] ?? "",

            pasaporteAcompanante:
                row[
                    COLUMNAS
                        .PASAPORTE_ACOMPANANTE
                ] ?? "",

            modalidad:
                row[
                    COLUMNAS
                        .MODALIDAD
                ] ?? "",

        };

    }

    return null;

}

// ======================================================
// Obtener reporte por recibo
// ======================================================
//
// Se utiliza especialmente para Registrar Valija.
//
// El ID que viene de Gestión Consular no necesariamente
// coincide con el ID de ReportesEntregados.
//
// El recibo sí constituye la referencia común.
//
// ======================================================

export async function obtenerReportePorRecibo(

    recibo: string

): Promise<ReporteEntregado | null> {

    const filas =
        await leerReportes();

    const reciboBuscado =
        String(
            recibo ?? ""
        ).trim();

    if (!reciboBuscado) {

        return null;

    }

    for (

        let i = 1;

        i < filas.length;

        i++

    ) {

        const row =
            filas[i];

        const reciboFila =
            String(
                row[
                    COLUMNAS.RECIBO
                ] ?? ""
            ).trim();

        if (
            reciboFila !==
            reciboBuscado
        ) {

            continue;

        }

        return {

            id:
                row[
                    COLUMNAS.ID
                ] ?? "",

            categoria:
                row[
                    COLUMNAS.CATEGORIA
                ],

            tipoDocumento:
                row[
                    COLUMNAS.TIPO_DOCUMENTO
                ],

            recibo:
                row[
                    COLUMNAS.RECIBO
                ] ?? "",

            fechaRecibo:
                row[
                    COLUMNAS.FECHA_RECIBO
                ] ?? "",

            planillaGC:
                row[
                    COLUMNAS.PLANILLA_GC
                ] ?? "",

            solicitante:
                row[
                    COLUMNAS.SOLICITANTE
                ] ?? "",

            documento:
                row[
                    COLUMNAS.DOCUMENTO
                ] ?? "",

            estado:
                row[
                    COLUMNAS.ESTADO
                ] ?? "",

            entregado:
                row[
                    COLUMNAS.ENTREGADO
                ] === "SI",

            fechaEntrega:
                row[
                    COLUMNAS.FECHA_ENTREGA
                ] ?? "",

            entregadoPor:
                row[
                    COLUMNAS.ENTREGADO_POR
                ] ?? "",

            observaciones:
                row[
                    COLUMNAS.OBSERVACIONES
                ] ?? "",

            estadoProcesamiento:

                row[
                    COLUMNAS
                        .ESTADO_PROCESAMIENTO
                ]?.toString().trim() ||

                ESTADO_PROCESAMIENTO_DEFAULT,

            titularPasaporte:
                row[
                    COLUMNAS
                        .TITULAR_PASAPORTE
                ] ?? "",

            numeroPasaporte:
                row[
                    COLUMNAS
                        .NUMERO_PASAPORTE
                ] ?? "",

            fechaValija:
                row[
                    COLUMNAS
                        .FECHA_VALIJA
                ] ?? "",

            fechaEmision:
                row[
                    COLUMNAS
                        .FECHA_EMISION
                ] ?? "",

            fechaVencimiento:
                row[
                    COLUMNAS
                        .FECHA_VENCIMIENTO
                ] ?? "",

            numeroVisa:
                row[
                    COLUMNAS
                        .NUMERO_VISA
                ] ?? "",

            tipoVisa:
                row[
                    COLUMNAS
                        .TIPO_VISA
                ] ?? "",

            nacionalidad:
                row[
                    COLUMNAS
                        .NACIONALIDAD
                ] ?? "",

            vigencia:
                row[
                    COLUMNAS
                        .VIGENCIA
                ] ?? "",

            estadoApostilla:
                row[
                    COLUMNAS
                        .ESTADO_APOSTILLA
                ] ?? "",

            fechaEmisionDocumento:
    row[
        COLUMNAS.FECHA_EMISION_DOCUMENTO
    ] ?? "",

correlativoDocumento:
    row[
        COLUMNAS.CORRELATIVO_DOCUMENTO
    ] ?? "",

// ==========================================
// Carta de Soltería
// ==========================================

fechaCarta:
    row[
        COLUMNAS.FECHA_CARTA
    ] ?? "",

correlativoCarta:
    row[
        COLUMNAS.CORRELATIVO_CARTA
    ] ?? "",

            tipoCertificado:
                row[
                    COLUMNAS
                        .TIPO_CERTIFICADO
                ] ?? "",

            fechaRegistro:
                row[
                    COLUMNAS
                        .FECHA_REGISTRO
                ] ?? "",

            numeroCertificado:
                row[
                    COLUMNAS
                        .NUMERO_CERTIFICADO
                ] ?? "",

            numeroRegistro:
                row[
                    COLUMNAS
                        .NUMERO_REGISTRO
                ] ?? "",

            fechaConstancia:
                row[
                    COLUMNAS
                        .FECHA_CONSTANCIA
                ] ?? "",

            tipoPoder:
    row[
        COLUMNAS
            .TIPO_PODER
    ] ?? "",

apoderadosPoder:
    obtenerApoderadosPoder(
        row
    ),

estadoPoder:
    row[
        COLUMNAS
            .ESTADO_PODER
    ] ?? "",

            origen:
                row[
                    COLUMNAS
                        .AUTORIZA
                ] ?? "",

            parentesco:
                row[
                    COLUMNAS
                        .PARENTESCO
                ] ?? "",

            menor:
                row[
                    COLUMNAS
                        .MENOR
                ] ?? "",

            pasaporteMenor:
                row[
                    COLUMNAS
                        .PASAPORTE_MENOR
                ] ?? "",

            destino:
                row[
                    COLUMNAS
                        .DESTINO
                ] ?? "",

            fechaIda:
                row[
                    COLUMNAS
                        .FECHA_IDA
                ] ?? "",

            fechaRetorno:
                row[
                    COLUMNAS
                        .FECHA_RETORNO
                ] ?? "",

            acompanante:
                row[
                    COLUMNAS
                        .ACOMPANANTE
                ] ?? "",

            pasaporteAcompanante:
                row[
                    COLUMNAS
                        .PASAPORTE_ACOMPANANTE
                ] ?? "",

            modalidad:
                row[
                    COLUMNAS
                        .MODALIDAD
                ] ?? "",

        };

    }

    return null;

}
// ======================================================
// Validar N° Etiqueta de VISA
// ======================================================

async function validarNumeroVisa(

    numeroVisa: string,

    idActual?: string

): Promise<void> {

    const numeroNormalizado =
        String(numeroVisa ?? "")
            .trim()
            .toUpperCase();

    if (!numeroNormalizado) {

        throw new Error(
            "El N° Etiqueta es obligatorio."
        );

    }

    if (
        !/^[A-Z0-9]+$/.test(
            numeroNormalizado
        )
    ) {

        throw new Error(
            "El N° Etiqueta solamente puede contener letras mayúsculas y números."
        );

    }

    const filas =
        await leerReportes();

    for (
        let i = 1;
        i < filas.length;
        i++
    ) {

        const row =
            filas[i];

        const categoria =
            String(
                row[
                    COLUMNAS.CATEGORIA
                ] ?? ""
            )
                .trim()
                .toUpperCase();

        if (
            categoria !== "VISA"
        ) {

            continue;

        }

        const etiquetaExistente =
            String(
                row[
                    COLUMNAS.NUMERO_VISA
                ] ?? ""
            )
                .trim()
                .toUpperCase();

        if (
            etiquetaExistente !==
            numeroNormalizado
        ) {

            continue;

        }

        const idExistente =
            String(
                row[
                    COLUMNAS.ID
                ] ?? ""
            )
                .trim();

        // Si estamos editando el mismo documento,
        // permitimos conservar su propia etiqueta.

        if (
            idActual &&
            idExistente ===
                String(idActual).trim()
        ) {

            continue;

        }

        throw new Error(
            `El N° Etiqueta ${numeroNormalizado} ya está registrado.`
        );

    }

}
// ======================================================
// Crear fila vacía
// ======================================================

function crearFilaVacia(): string[] {

    return new Array(53)
        .fill("");

}

// ======================================================
// Agregar nuevo reporte
// ======================================================

export async function crearReporte(

    fila: string[]

): Promise<void> {

    await sheets.spreadsheets.values.append({

        spreadsheetId:
            MODULO_CAJA_SHEET_ID,

        range:
            `${HOJA_REPORTES_ENTREGADOS}!A:BA`,

        valueInputOption:
            "USER_ENTERED",

        requestBody: {

            values: [
                fila,
            ],

        },

    });

}

// ======================================================
// Actualizar fila completa
// ======================================================

export async function actualizarFila(

    numeroFila: number,

    fila: any[]

): Promise<void> {

    await sheets.spreadsheets.values.update({

        spreadsheetId:
            MODULO_CAJA_SHEET_ID,

        range:
            `${HOJA_REPORTES_ENTREGADOS}!A${numeroFila}:BA${numeroFila}`,

        valueInputOption:
            "USER_ENTERED",

        requestBody: {

            values: [
                fila,
            ],

        },

    });

}

// ======================================================
// Determinar estado de procesamiento
// ======================================================
//
// La valija NO determina el estado.
//
// La valija solamente registra la fecha
// en que llegó físicamente el pasaporte.
//
// ======================================================

function determinarEstadoProcesamiento(

    documento: ReporteEntregado

): "EN_PROCESO" | "PROCESADO" {

    switch (
        documento.tipoDocumento
    ) {

        // ==========================================
        // PASAPORTE ADULTO / NNA
        // ==========================================

        case "PASAPORTE_ADULTO":

        case "PASAPORTE_NNA":

            if (

                documento.titularPasaporte
                    ?.trim() &&

                documento.numeroPasaporte
                    ?.trim() &&

                documento.fechaValija
                    ?.trim() &&

                documento.fechaEmision
                    ?.trim() &&

                documento.fechaVencimiento
                    ?.trim()

            ) {

                return "PROCESADO";

            }

            return "EN_PROCESO";


        // ==========================================
        // VISA
        // ==========================================

        case "VISA":

            if (

                documento.estado
                    ?.trim()
                    .toUpperCase() ===
                    "APROBADA" &&

                documento.numeroVisa
                    ?.trim() &&

                documento.fechaVencimiento
                    ?.trim()

            ) {

                return "PROCESADO";

            }

            return "EN_PROCESO";


        // ==========================================
        // APOSTILLA
        // ==========================================

        case "APOSTILLA":

            if (

                documento.estadoApostilla
                    ?.trim()
                    .toUpperCase() ===
                    "APROBADA"

            ) {

                return "PROCESADO";

            }

            return "EN_PROCESO";

// ==========================================
// FE DE VIDA
// ==========================================

case "FE_VIDA":

    if (

        documento.fechaEmisionDocumento
            ?.trim() &&

        documento.correlativoDocumento
            ?.trim()

    ) {

        return "PROCESADO";

    }

    return "EN_PROCESO";


// ==========================================
// CARTA DE SOLTERÍA
// ==========================================

case "CARTA_SOLTERIA":

    if (

        documento.fechaCarta
            ?.trim() &&

        documento.correlativoCarta
            ?.trim()

    ) {

        return "PROCESADO";

    }

    return "EN_PROCESO";
        // ==========================================
        // RESTO
        // ==========================================

        default:

            return (

                documento.estadoProcesamiento ??

                ESTADO_PROCESAMIENTO_DEFAULT

            ) as
                "EN_PROCESO" |
                "PROCESADO";

    }

}

// ======================================================
// Actualizar reporte existente
// ======================================================

export async function actualizarReporte(

    reporte: ReporteEntregado,

    usuario: string

): Promise<void> {

    const fila =
        await buscarFilaPorId(
            reporte.id
        );

    if (
        fila === -1
    ) {

        throw new Error(
            "No se encontró el reporte."
        );

    }

    const datos =
        crearFilaVacia();

    // ==========================================
    // Identificación
    // ==========================================

    datos[
        COLUMNAS.ID
    ] =
        reporte.id;

    datos[
        COLUMNAS.CATEGORIA
    ] =
        reporte.categoria;

    datos[
        COLUMNAS.TIPO_DOCUMENTO
    ] =
        reporte.tipoDocumento ?? "";

    // ==========================================
    // Datos comunes
    // ==========================================

    datos[
        COLUMNAS.RECIBO
    ] =
        reporte.recibo;

    datos[
        COLUMNAS.FECHA_RECIBO
    ] =
        reporte.fechaRecibo;

    datos[
        COLUMNAS.PLANILLA_GC
    ] =
        reporte.planillaGC;

    datos[
        COLUMNAS.SOLICITANTE
    ] =
        reporte.solicitante;

    datos[
        COLUMNAS.DOCUMENTO
    ] =
        reporte.documento;

    datos[
        COLUMNAS.ESTADO
    ] =
        reporte.estado;

    datos[
        COLUMNAS.ENTREGADO
    ] =
        reporte.entregado
            ? "SI"
            : "NO";

    datos[
        COLUMNAS.FECHA_ENTREGA
    ] =
        reporte.fechaEntrega ?? "";

    datos[
        COLUMNAS.ENTREGADO_POR
    ] =
        reporte.entregadoPor ?? "";

    datos[
        COLUMNAS.OBSERVACIONES
    ] =
        reporte.observaciones ?? "";

    // ==========================================
    // Estado de procesamiento
    // ==========================================

    datos[
        COLUMNAS.ESTADO_PROCESAMIENTO
    ] =

        reporte.estadoProcesamiento ??

        ESTADO_PROCESAMIENTO_DEFAULT;

    // ==========================================
    // Pasaportes
    // ==========================================

    datos[
        COLUMNAS.TITULAR_PASAPORTE
    ] =
        reporte.titularPasaporte ?? "";

    datos[
        COLUMNAS.NUMERO_PASAPORTE
    ] =
        reporte.numeroPasaporte ?? "";

    datos[
        COLUMNAS.FECHA_VALIJA
    ] =
        reporte.fechaValija ?? "";

    datos[
        COLUMNAS.FECHA_EMISION
    ] =
        reporte.fechaEmision ?? "";

    datos[
        COLUMNAS.FECHA_VENCIMIENTO
    ] =
        reporte.fechaVencimiento ?? "";

    // ==========================================
    // Visas
    // ==========================================

    datos[
        COLUMNAS.NUMERO_VISA
    ] =
        reporte.numeroVisa ?? "";

    datos[
        COLUMNAS.TIPO_VISA
    ] =
        reporte.tipoVisa ?? "";

    datos[
        COLUMNAS.NACIONALIDAD
    ] =
        reporte.nacionalidad ?? "";

    datos[
        COLUMNAS.VIGENCIA
    ] =
        reporte.vigencia ?? "";

    // ==========================================
    // Apostilla
    // ==========================================

    datos[
        COLUMNAS.ESTADO_APOSTILLA
    ] =
        reporte.estadoApostilla ?? "";

  // ==========================================
// Fe de Vida
// ==========================================

datos[
    COLUMNAS.FECHA_EMISION_DOCUMENTO
] =
    reporte.fechaEmisionDocumento ?? "";

datos[
    COLUMNAS.CORRELATIVO_DOCUMENTO
] =
    reporte.correlativoDocumento ?? "";


// ==========================================
// Carta de Soltería
// ==========================================

datos[
    COLUMNAS.FECHA_CARTA
] =
    reporte.fechaCarta ?? "";

datos[
    COLUMNAS.CORRELATIVO_CARTA
] =
    reporte.correlativoCarta ?? "";

    // ==========================================
    // Certificados
    // ==========================================

    datos[
        COLUMNAS.TIPO_CERTIFICADO
    ] =
        reporte.tipoCertificado ?? "";

    datos[
        COLUMNAS.FECHA_REGISTRO
    ] =
        reporte.fechaRegistro ?? "";

    datos[
        COLUMNAS.NUMERO_CERTIFICADO
    ] =
        reporte.numeroCertificado ?? "";

    // ==========================================
    // Registro Consular
    // ==========================================

    datos[
        COLUMNAS.NUMERO_REGISTRO
    ] =
        reporte.numeroRegistro ?? "";

    // ==========================================
    // Constancia Consular
    // ==========================================

    datos[
        COLUMNAS.FECHA_CONSTANCIA
    ] =
        reporte.fechaConstancia ?? "";

    // ==========================================
// Poderes
// ==========================================

datos[
    COLUMNAS.TIPO_PODER
] =
    reporte.tipoPoder ?? "";

const primerApoderado =
    reporte.apoderadosPoder?.[0];

datos[
    COLUMNAS.APODERADO
] =
    primerApoderado?.nombre ?? "";

datos[
    COLUMNAS.DOCUMENTO_APODERADO
] =
    primerApoderado?.documento ?? "";

datos[
    COLUMNAS.ESTADO_PODER
] =
    reporte.estadoPoder ?? "";

    // ==========================================
    // Autorización de viaje
    // ==========================================

    datos[
        COLUMNAS.AUTORIZA
    ] =
        reporte.origen ?? ""

    datos[
        COLUMNAS.PARENTESCO
    ] =
        reporte.parentesco ?? "";

    datos[
        COLUMNAS.MENOR
    ] =
        reporte.menor ?? "";

    datos[
        COLUMNAS.PASAPORTE_MENOR
    ] =
        reporte.pasaporteMenor ?? "";

    datos[
        COLUMNAS.DESTINO
    ] =
        reporte.destino ?? "";

    datos[
        COLUMNAS.FECHA_IDA
    ] =
        reporte.fechaIda ?? "";

    datos[
        COLUMNAS.FECHA_RETORNO
    ] =
        reporte.fechaRetorno ?? "";

    datos[
        COLUMNAS.ACOMPANANTE
    ] =
        reporte.acompanante ?? "";

    datos[
        COLUMNAS.PASAPORTE_ACOMPANANTE
    ] =
        reporte.pasaporteAcompanante ?? "";

    datos[
        COLUMNAS.MODALIDAD
    ] =
        reporte.modalidad ?? "";

    // ==========================================
    // Auditoría
    // ==========================================

    datos[
        COLUMNAS.FECHA_CREACION
    ] =
        reporte.fechaCreacion ?? "";

    datos[
        COLUMNAS.USUARIO_CREACION
    ] =
        reporte.usuarioCreacion ?? "";

    datos[
        COLUMNAS.FECHA_ACTUALIZACION
    ] =
        ahora();

    datos[
        COLUMNAS.USUARIO_ACTUALIZACION
    ] =
        usuario;

    // ==========================================
    // Guardar
    // ==========================================

    await actualizarFila(
        fila,
        datos
    );

}
// ======================================================
// Normalizar recibo
// ======================================================

function normalizarRecibo(
    valor: unknown
): string {

    return String(valor ?? "")
        .trim()
        .replace(/\s+/g, "");

}
// ======================================================
// Registrar recepción de valija
// ======================================================
//
// La valija solamente registra la fecha de llegada
// física del pasaporte.
//
// Si el reporte todavía NO existe en
// ReportesEntregados, se crea el registro base.
//
// NO se requieren todavía:
//
//     numeroPasaporte
//     fechaEmision
//     fechaVencimiento
//
// El documento queda EN_PROCESO.
//
// Posteriormente, desde "Actualizar Documento",
// se completan los datos físicos del pasaporte.
//
// ======================================================

export async function registrarValija(

    usuario: string,

    fechaValija: string,

    documentos: ReporteEntregado[]

): Promise<void> {

    if (!usuario?.trim()) {

        throw new Error(
            "El usuario es obligatorio."
        );

    }

    if (!fechaValija?.trim()) {

        throw new Error(
            "La fecha de valija es obligatoria."
        );

    }

    if (
        !Array.isArray(documentos) ||
        documentos.length === 0
    ) {

        throw new Error(
            "No se seleccionaron pasaportes."
        );

    }

    // ==================================================
    // Procesar cada pasaporte seleccionado
    // ==================================================

    for (
        const documento of documentos
    ) {

        if (!documento?.id) {

            throw new Error(
                "Uno de los pasaportes seleccionados no tiene un ID válido."
            );

        }

        // ==================================================
        // Buscar el reporte por ID
        //
        // ID = GestionConsular!L
        // ID = ReportesEntregados!A
        // ==================================================

        const reporteExistente =
            await obtenerReportePorId(
                String(documento.id)
            );

        // ==================================================
        // CASO 1
        // El reporte ya existe
        // ==================================================

        if (reporteExistente) {

            // ----------------------------------------------
            // Solo modificar fecha de valija
            // ----------------------------------------------

            reporteExistente.fechaValija =
                fechaValija;

            // ----------------------------------------------
            // NO modificar:
            //
            // numeroPasaporte
            // fechaEmision
            // fechaVencimiento
            // estadoProcesamiento
            // ----------------------------------------------

            await actualizarReporte(

                reporteExistente,

                usuario

            );

            continue;

        }

        // ==================================================
        // CASO 2
        // El reporte todavía NO existe
        //
        // Crear registro inicial
        // ==================================================

        const fila =
            crearFilaVacia();

        // ==================================================
        // Identificación
        // ==================================================

        fila[
            COLUMNAS.ID
        ] =
            String(
                documento.id
            );

        fila[
            COLUMNAS.CATEGORIA
        ] =
            "PASAPORTES";

        fila[
            COLUMNAS.TIPO_DOCUMENTO
        ] =
            documento.tipoDocumento ||
            "PASAPORTE_ADULTO";

        // ==================================================
        // Datos comunes
        // ==================================================

        fila[
            COLUMNAS.RECIBO
        ] =
            documento.recibo ?? "";

        fila[
            COLUMNAS.FECHA_RECIBO
        ] =
            documento.fechaRecibo ?? "";

        fila[
            COLUMNAS.PLANILLA_GC
        ] =
            documento.planillaGC ?? "";

        fila[
            COLUMNAS.SOLICITANTE
        ] =
            documento.solicitante ?? "";

        fila[
            COLUMNAS.DOCUMENTO
        ] =
            documento.documento ?? "";

        fila[
            COLUMNAS.ESTADO
        ] =
            documento.estado ?? "";

        // ==================================================
        // Entrega
        // ==================================================

        fila[
            COLUMNAS.ENTREGADO
        ] =
            documento.entregado
                ? "SI"
                : "NO";

        fila[
            COLUMNAS.FECHA_ENTREGA
        ] =
            documento.fechaEntrega ?? "";

        fila[
            COLUMNAS.ENTREGADO_POR
        ] =
            documento.entregadoPor ?? "";

        // ==================================================
        // Observaciones
        // ==================================================

        fila[
            COLUMNAS.OBSERVACIONES
        ] =
            documento.observaciones ?? "";

        // ==================================================
        // Pasaporte
        // ==================================================

        fila[
            COLUMNAS.TITULAR_PASAPORTE
        ] =
            documento.titularPasaporte ?? "";

        // ----------------------------------------------
        // Estos datos todavía NO se conocen
        // ----------------------------------------------

        fila[
            COLUMNAS.NUMERO_PASAPORTE
        ] =
            "";

        fila[
            COLUMNAS.FECHA_VALIJA
        ] =
            fechaValija;

        fila[
            COLUMNAS.FECHA_EMISION
        ] =
            "";

        fila[
            COLUMNAS.FECHA_VENCIMIENTO
        ] =
            "";

        // ==================================================
        // Estado de procesamiento
        // ==================================================
        //
        // La llegada de la valija NO significa
        // que el pasaporte esté procesado.
        //
        // ==================================================

        fila[
            COLUMNAS.ESTADO_PROCESAMIENTO
        ] =
            ESTADO_PROCESAMIENTO_DEFAULT;

        // ==================================================
        // Auditoría
        // ==================================================

        const fechaActual =
            ahora();

        fila[
            COLUMNAS.FECHA_CREACION
        ] =
            fechaActual;

        fila[
            COLUMNAS.USUARIO_CREACION
        ] =
            usuario;

        fila[
            COLUMNAS.FECHA_ACTUALIZACION
        ] =
            fechaActual;

        fila[
            COLUMNAS.USUARIO_ACTUALIZACION
        ] =
            usuario;

        // ==================================================
        // Crear reporte
        // ==================================================

        await crearReporte(
            fila
        );

    }

}

// ======================================================
// Actualizar documento desde Editar
// ======================================================

export async function actualizarDocumento(
    usuario: string,
    documento: ReporteEntregado
): Promise<void> {

    // =====================================
    // Obtener reporte original
    // =====================================

    const reporte =
        await obtenerReportePorId(
            documento.id
        );

    if (!reporte) {

        throw new Error(
            `No existe el reporte ${documento.id}.`
        );

    }

    // =====================================
    // VISA
    // =====================================

    if (
        documento.categoria === "VISA"
    ) {

        const numeroEtiqueta =
            String(
                documento.numeroVisa ?? ""
            )
                .trim()
                .toUpperCase();

        // -------------------------------
        // Validar N° Etiqueta
        // -------------------------------

        await validarNumeroVisa(
            numeroEtiqueta,
            documento.id
        );

        documento.numeroVisa =
            numeroEtiqueta;

        // -------------------------------
        // Copiar datos VISA
        // -------------------------------

        reporte.estado =
            String(
                documento.estado ?? ""
            ).trim().toUpperCase();

        reporte.numeroVisa =
            numeroEtiqueta;

        reporte.fechaVencimiento =
            documento.fechaVencimiento ?? "";

        reporte.tipoVisa =
            documento.tipoVisa;

        reporte.nacionalidad =
            documento.nacionalidad;

        reporte.vigencia =
            documento.vigencia;

    }

    // =====================================
    // APOSTILLA
    // =====================================

    else if (
        documento.categoria === "APOSTILLA"
    ) {

        const estadoApostilla =
            String(
                documento.estado ?? ""
            )
                .trim()
                .toUpperCase();

        // -------------------------------
        // El formulario usa "estado"
        // -------------------------------

        reporte.estado =
            estadoApostilla;

        // -------------------------------
        // Google Sheets utiliza
        // estadoApostilla
        // -------------------------------

        reporte.estadoApostilla =
            estadoApostilla;

    }

    // =====================================
    // PASAPORTES
    // =====================================

    else {

        reporte.estado =
            documento.estado;

        reporte.titularPasaporte =
            documento.titularPasaporte;

        reporte.numeroPasaporte =
            documento.numeroPasaporte;

        reporte.fechaValija =
            documento.fechaValija;

        reporte.fechaEmision =
            documento.fechaEmision;

        reporte.fechaVencimiento =
            documento.fechaVencimiento;

    }

    // =====================================
    // Datos comunes
    // =====================================

    reporte.observaciones =
        documento.observaciones;

   // =====================================
// FE DE VIDA
// =====================================

reporte.fechaEmisionDocumento =
    documento.fechaEmisionDocumento;

reporte.correlativoDocumento =
    documento.correlativoDocumento;


// =====================================
// CARTA DE SOLTERÍA
// =====================================

reporte.fechaCarta =
    documento.fechaCarta;

reporte.correlativoCarta =
    documento.correlativoCarta;

    // =====================================
    // Certificados
    // =====================================

    reporte.tipoCertificado =
        documento.tipoCertificado;

    reporte.fechaRegistro =
        documento.fechaRegistro;

    reporte.numeroCertificado =
        documento.numeroCertificado;

    // =====================================
// Registro Consular
// =====================================

reporte.numeroRegistro =
    documento.numeroRegistro;

reporte.fechaRegistroConsular =
    documento.fechaRegistroConsular;

    // =====================================
    // Constancia Consular
    // =====================================

    reporte.fechaConstancia =
        documento.fechaConstancia;

    // =====================================
// Poderes
// =====================================

reporte.tipoPoder =
    documento.tipoPoder;

reporte.apoderadosPoder =
    documento.apoderadosPoder;

reporte.estadoPoder =
    documento.estadoPoder;

    // =====================================
    // Autorización de viaje
    // =====================================

    reporte.origen =
    documento.origen;

    reporte.parentesco =
        documento.parentesco;

    reporte.menor =
        documento.menor;

    reporte.pasaporteMenor =
        documento.pasaporteMenor;

    reporte.destino =
        documento.destino;

    reporte.fechaIda =
        documento.fechaIda;

    reporte.fechaRetorno =
        documento.fechaRetorno;

    reporte.acompanante =
        documento.acompanante;

    reporte.pasaporteAcompanante =
        documento.pasaporteAcompanante;

    reporte.modalidad =
        documento.modalidad;

    // =====================================
    // Determinar estado de procesamiento
    // =====================================

    reporte.estadoProcesamiento =
        determinarEstadoProcesamiento(
            reporte
        );

    // =====================================
    // Guardar
    // =====================================

    await actualizarReporte(
        reporte,
        usuario
    );

}
// ======================================================
// Registrar entrega de documento
// ======================================================
//
// Marca el documento como entregado y registra:
//
// - Fecha de entrega
// - Usuario que realizó la entrega
// - Observaciones
//
// Conserva todos los demás datos del reporte.
//
// ======================================================

export async function registrarEntrega(
    usuario: string,
    documento: ReporteEntregado,
    fechaEntrega: string,
    observaciones: string
): Promise<void> {

    if (!usuario?.trim()) {
        throw new Error(
            "El usuario es obligatorio."
        );
    }

    if (!documento?.id) {
        throw new Error(
            "El documento es obligatorio."
        );
    }

    if (!fechaEntrega?.trim()) {
        throw new Error(
            "La fecha de entrega es obligatoria."
        );
    }

    // ==========================================
    // Buscar reporte existente
    // ==========================================

    const reporte =
        await obtenerReportePorId(
            String(documento.id)
        );

    if (!reporte) {
        throw new Error(
            `No existe el reporte ${documento.id}.`
        );
    }

    // ==========================================
    // Registrar entrega
    // ==========================================

    reporte.entregado = true;

    reporte.fechaEntrega =
        fechaEntrega;

    reporte.entregadoPor =
        usuario;

    reporte.observaciones =
        observaciones ?? "";

    // ==========================================
    // Guardar
    // ==========================================

    await actualizarReporte(
        reporte,
        usuario
    );
}