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

const RANGO_REPORTES =

    "A:BA";

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

    ESTADO_APOSTILLA: 22,

    CORRELATIVO: 23,

    TIPO_CERTIFICADO: 24,

    FECHA_REGISTRO: 25,

    NUMERO_CERTIFICADO: 26,

    NUMERO_REGISTRO: 27,

    FECHA_CONSTANCIA: 28,

    TIPO_PODER: 29,

    APODERADO: 30,

    DOCUMENTO_APODERADO: 31,

    ESTADO_PODER: 32,

    AUTORIZA: 33,

    PARENTESCO: 34,

    MENOR: 35,

    PASAPORTE_MENOR: 36,

    DESTINO: 37,

    FECHA_IDA: 38,

    FECHA_RETORNO: 39,

    ACOMPANANTE: 40,

    PASAPORTE_ACOMPANANTE: 41,

    MODALIDAD: 42,

    FECHA_CREACION: 43,

    USUARIO_CREACION: 44,

    FECHA_ACTUALIZACION: 45,

    USUARIO_ACTUALIZACION: 46,

} as const;

// ======================================================
// Leer hoja completa
// ======================================================

async function leerReportes()

: Promise<any[][]> {

    const response =

        await sheets.spreadsheets.values.get({

            spreadsheetId:

                MODULO_CAJA_SHEET_ID,

            range:

                `${HOJA_REPORTES_ENTREGADOS}!${RANGO_REPORTES}`,

        });

    return (

        response.data.values ??

        []

    );

}

// ======================================================
// Fecha/Hora actual
// ======================================================

function ahora()

: string {

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

            filas[i][COLUMNAS.ID] ===

            id

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

    for (

        let i = 1;

        i < filas.length;

        i++

    ) {

        const row =

            filas[i];

        if (

            row[COLUMNAS.ID] !==

            id

        ) {

            continue;

        }

        return {

            id:

                row[COLUMNAS.ID] ?? "",

            categoria:

                row[COLUMNAS.CATEGORIA],

            tipoDocumento:

                row[COLUMNAS.TIPO_DOCUMENTO],

            recibo:

                row[COLUMNAS.RECIBO] ?? "",

            fechaRecibo:

                row[COLUMNAS.FECHA_RECIBO] ?? "",

            planillaGC:

                row[COLUMNAS.PLANILLA_GC] ?? "",

            solicitante:

                row[COLUMNAS.SOLICITANTE] ?? "",

            documento:

                row[COLUMNAS.DOCUMENTO] ?? "",

            estado:

                row[COLUMNAS.ESTADO] ?? "",

            entregado:

                row[COLUMNAS.ENTREGADO] ===

                "SI",

            fechaEntrega:

                row[COLUMNAS.FECHA_ENTREGA] ?? "",

            entregadoPor:

                row[COLUMNAS.ENTREGADO_POR] ?? "",

            observaciones:

                row[COLUMNAS.OBSERVACIONES] ?? "",

            titularPasaporte:

                row[COLUMNAS.TITULAR_PASAPORTE] ?? "",

            numeroPasaporte:

                row[COLUMNAS.NUMERO_PASAPORTE] ?? "",

            fechaValija:

                row[COLUMNAS.FECHA_VALIJA] ?? "",

            fechaEmision:

                row[COLUMNAS.FECHA_EMISION] ?? "",

            fechaVencimiento:

                row[COLUMNAS.FECHA_VENCIMIENTO] ?? "",

            numeroVisa:

                row[COLUMNAS.NUMERO_VISA] ?? "",

            tipoVisa:

                row[COLUMNAS.TIPO_VISA] ?? "",

            nacionalidad:

                row[COLUMNAS.NACIONALIDAD] ?? "",

            vigencia:

                row[COLUMNAS.VIGENCIA] ?? "",

            estadoApostilla:

                row[COLUMNAS.ESTADO_APOSTILLA] ?? "",

            correlativo:

                row[COLUMNAS.CORRELATIVO] ?? "",

            tipoCertificado:

                row[COLUMNAS.TIPO_CERTIFICADO] ?? "",

            fechaRegistro:

                row[COLUMNAS.FECHA_REGISTRO] ?? "",

            numeroCertificado:

                row[COLUMNAS.NUMERO_CERTIFICADO] ?? "",

            numeroRegistro:

                row[COLUMNAS.NUMERO_REGISTRO] ?? "",

            fechaConstancia:

                row[COLUMNAS.FECHA_CONSTANCIA] ?? "",

            tipoPoder:

                row[COLUMNAS.TIPO_PODER] ?? "",

            apoderado:

                row[COLUMNAS.APODERADO] ?? "",

            documentoApoderado:

                row[COLUMNAS.DOCUMENTO_APODERADO] ?? "",

            estadoPoder:

                row[COLUMNAS.ESTADO_PODER] ?? "",

            autoriza:

                row[COLUMNAS.AUTORIZA] ?? "",

            parentesco:

                row[COLUMNAS.PARENTESCO] ?? "",

            menor:

                row[COLUMNAS.MENOR] ?? "",

            pasaporteMenor:

                row[COLUMNAS.PASAPORTE_MENOR] ?? "",

            destino:

                row[COLUMNAS.DESTINO] ?? "",

            fechaIda:

                row[COLUMNAS.FECHA_IDA] ?? "",

            fechaRetorno:

                row[COLUMNAS.FECHA_RETORNO] ?? "",

            acompanante:

                row[COLUMNAS.ACOMPANANTE] ?? "",

            pasaporteAcompanante:

                row[COLUMNAS.PASAPORTE_ACOMPANANTE] ?? "",

            modalidad:

                row[COLUMNAS.MODALIDAD] ?? "",

        };

    }

    return null;

}

// ======================================================
// Crear fila vacía
// ======================================================

function crearFilaVacia()

: string[] {

    return new Array(

        Object.keys(

            COLUMNAS

        ).length

    ).fill("");

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
// Actualizar una fila completa
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
// Actualizar un reporte existente
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

    datos[COLUMNAS.ID] =

        reporte.id;

    datos[COLUMNAS.CATEGORIA] =

        reporte.categoria;

    datos[COLUMNAS.TIPO_DOCUMENTO] =

        reporte.tipoDocumento ?? "";

    datos[COLUMNAS.RECIBO] =

        reporte.recibo;

    datos[COLUMNAS.FECHA_RECIBO] =

        reporte.fechaRecibo;

    datos[COLUMNAS.PLANILLA_GC] =

        reporte.planillaGC;

    datos[COLUMNAS.SOLICITANTE] =

        reporte.solicitante;

    datos[COLUMNAS.DOCUMENTO] =

        reporte.documento;

    datos[COLUMNAS.ESTADO] =

        reporte.estado;

    datos[COLUMNAS.ENTREGADO] =

        reporte.entregado

            ? "SI"

            : "NO";

    datos[COLUMNAS.FECHA_ENTREGA] =

        reporte.fechaEntrega ?? "";

    datos[COLUMNAS.ENTREGADO_POR] =

        reporte.entregadoPor ?? "";

    datos[COLUMNAS.OBSERVACIONES] =

        reporte.observaciones ?? "";

    datos[COLUMNAS.TITULAR_PASAPORTE] =

        reporte.titularPasaporte ?? "";

    datos[COLUMNAS.NUMERO_PASAPORTE] =

        reporte.numeroPasaporte ?? "";

    datos[COLUMNAS.FECHA_VALIJA] =

        reporte.fechaValija ?? "";

    datos[COLUMNAS.FECHA_EMISION] =

        reporte.fechaEmision ?? "";

    datos[COLUMNAS.FECHA_VENCIMIENTO] =

        reporte.fechaVencimiento ?? "";

    datos[COLUMNAS.NUMERO_VISA] =

        reporte.numeroVisa ?? "";

    datos[COLUMNAS.TIPO_VISA] =

        reporte.tipoVisa ?? "";

    datos[COLUMNAS.NACIONALIDAD] =

        reporte.nacionalidad ?? "";

    datos[COLUMNAS.VIGENCIA] =

        reporte.vigencia ?? "";

    datos[COLUMNAS.ESTADO_APOSTILLA] =

        reporte.estadoApostilla ?? "";

    datos[COLUMNAS.CORRELATIVO] =

        reporte.correlativo ?? "";

    datos[COLUMNAS.TIPO_CERTIFICADO] =

        reporte.tipoCertificado ?? "";

    datos[COLUMNAS.FECHA_REGISTRO] =

        reporte.fechaRegistro ?? "";

    datos[COLUMNAS.NUMERO_CERTIFICADO] =

        reporte.numeroCertificado ?? "";

    datos[COLUMNAS.NUMERO_REGISTRO] =

        reporte.numeroRegistro ?? "";

    datos[COLUMNAS.FECHA_CONSTANCIA] =

        reporte.fechaConstancia ?? "";

    datos[COLUMNAS.TIPO_PODER] =

        reporte.tipoPoder ?? "";

    datos[COLUMNAS.APODERADO] =

        reporte.apoderado ?? "";

    datos[COLUMNAS.DOCUMENTO_APODERADO] =

        reporte.documentoApoderado ?? "";

    datos[COLUMNAS.ESTADO_PODER] =

        reporte.estadoPoder ?? "";

    datos[COLUMNAS.AUTORIZA] =

        reporte.autoriza ?? "";

    datos[COLUMNAS.PARENTESCO] =

        reporte.parentesco ?? "";

    datos[COLUMNAS.MENOR] =

        reporte.menor ?? "";

    datos[COLUMNAS.PASAPORTE_MENOR] =

        reporte.pasaporteMenor ?? "";

    datos[COLUMNAS.DESTINO] =

        reporte.destino ?? "";

    datos[COLUMNAS.FECHA_IDA] =

        reporte.fechaIda ?? "";

    datos[COLUMNAS.FECHA_RETORNO] =

        reporte.fechaRetorno ?? "";

    datos[COLUMNAS.ACOMPANANTE] =

        reporte.acompanante ?? "";

    datos[COLUMNAS.PASAPORTE_ACOMPANANTE] =

        reporte.pasaporteAcompanante ?? "";

    datos[COLUMNAS.MODALIDAD] =

        reporte.modalidad ?? "";

    datos[COLUMNAS.FECHA_ACTUALIZACION] =

        ahora();

    datos[COLUMNAS.USUARIO_ACTUALIZACION] =

        usuario;

    await actualizarFila(

        fila,

        datos

    );

}
// ======================================================
// Registrar recepción de valija
// ======================================================

export async function registrarValija(

    usuario: string,

    fechaValija: string,

    documentos: ReporteEntregado[]

): Promise<void> {

    for (

        const documento of documentos

    ) {

        const reporte =

            await obtenerReportePorId(

                documento.id

            );

        if (

            !reporte

        ) {

            throw new Error(

                `No existe el reporte ${documento.id}.`

            );

        }

        reporte.fechaValija =

            fechaValija;

        reporte.numeroPasaporte =

            documento.numeroPasaporte;

        reporte.fechaEmision =

            documento.fechaEmision;

        reporte.fechaVencimiento =

            documento.fechaVencimiento;

        await actualizarReporte(

            reporte,

            usuario

        );

    }

}
// ======================================================
// Registrar entrega de documento
// ======================================================

export async function registrarEntrega(

    usuario: string,

    documento: ReporteEntregado,

    fechaEntrega: string,

    observaciones: string

): Promise<void> {

    const reporte =

        await obtenerReportePorId(

            documento.id

        );

    if (

        !reporte

    ) {

        throw new Error(

            `No existe el reporte ${documento.id}.`

        );

    }

    reporte.entregado =

        true;

    reporte.fechaEntrega =

        fechaEntrega;

    reporte.entregadoPor =

        usuario;

    reporte.observaciones =

        observaciones;

    await actualizarReporte(

        reporte,

        usuario

    );

}
// ======================================================
// Actualizar datos de un documento
// ======================================================

export async function actualizarDocumento(

    usuario: string,

    documento: ReporteEntregado

): Promise<void> {

    const reporte =

        await obtenerReportePorId(

            documento.id

        );

    if (

        !reporte

    ) {

        throw new Error(

            `No existe el reporte ${documento.id}.`

        );

    }

    // =====================================
    // Datos comunes
    // =====================================

    reporte.estado =

        documento.estado;

    reporte.observaciones =

        documento.observaciones;

    // =====================================
    // Pasaportes
    // =====================================

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

    // =====================================
    // Visas
    // =====================================

    reporte.numeroVisa =

        documento.numeroVisa;

    reporte.tipoVisa =

        documento.tipoVisa;

    reporte.nacionalidad =

        documento.nacionalidad;

    reporte.vigencia =

        documento.vigencia;

    // =====================================
    // Apostillas
    // =====================================

    reporte.estadoApostilla =

        documento.estadoApostilla;

    // =====================================
    // Fe de Vida / Carta de Soltería
    // =====================================

    reporte.correlativo =

        documento.correlativo;

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

    reporte.apoderado =

        documento.apoderado;

    reporte.documentoApoderado =

        documento.documentoApoderado;

    reporte.estadoPoder =

        documento.estadoPoder;

    // =====================================
    // Autorizaciones
    // =====================================

    reporte.autoriza =

        documento.autoriza;

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

    await actualizarReporte(

        reporte,

        usuario

    );

}