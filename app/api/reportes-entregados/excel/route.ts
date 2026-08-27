// ======================================================
// API
// Exportar Reportes Entregados a Excel
// Consulnet Barranquilla
// ======================================================

import {
    NextRequest,
    NextResponse,
} from "next/server";

import ExcelJS from "exceljs";

import {
    obtenerGestionConsular,
    obtenerCaja,
    obtenerReportesEntregados,
} from "@/lib/googleSheets";

import {
    obtenerDocumentos,
} from "@/lib/reportesEntregados/reportesService";

import {
    CategoriaDocumento,
} from "@/types/ReporteEntregado";

// ======================================================
// Categorías válidas
// ======================================================

function categoriaValida(

    categoria: string

): categoria is CategoriaDocumento {

    return [

        "PASAPORTES",

        "VISA",

        "APOSTILLA",

        "FE_VIDA",

        "CARTA_SOLTERIA",

        "CERTIFICADO_USO",

        "CONSTANCIA_REGISTRO",

        "CONSTANCIA_CONSULAR",

        "PODER",

        "AUTORIZACION_VIAJE",

    ].includes(categoria);

}

// ======================================================
// Convertir valor a texto
// ======================================================

function texto(

    valor: unknown

): string {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return String(valor);

}

// ======================================================
// GET
// ======================================================

export async function GET(

    request: NextRequest

) {

    try {

        // ==========================================
        // Categoría
        // ==========================================

        const categoria =

            request.nextUrl.searchParams.get(
                "categoria"
            );

        if (

            !categoria ||

            !categoriaValida(
                categoria
            )

        ) {

            return NextResponse.json(

                {

                    ok: false,

                    error:
                        "Categoría inválida.",

                },

                {
                    status: 400,
                }

            );

        }

        // ==========================================
        // Año opcional
        // ==========================================

        const anio =
            request.nextUrl.searchParams.get(
                "anio"
            );

        // ==========================================
        // Leer hojas
        // ==========================================

        const [

            gestionConsular,

            caja,

            reportes,

        ] = await Promise.all([

            obtenerGestionConsular(),

            obtenerCaja(),

            obtenerReportesEntregados(),

        ]);

        // ==========================================
        // Construir datos
        // ==========================================

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        // ==========================================
        // Obtener documentos
        // ==========================================

        const documentos =

            obtenerDocumentos(

                categoria,

                data,

                anio || undefined

            );

        // ==========================================
        // Crear Workbook
        // ==========================================

        const workbook =
            new ExcelJS.Workbook();

        workbook.creator =
            "Consulnet Barranquilla";

        workbook.lastModifiedBy =
            "Consulnet Barranquilla";

        workbook.created =
            new Date();

        workbook.modified =
            new Date();

        // ==========================================
        // Hoja
        // ==========================================

        const worksheet =
            workbook.addWorksheet(
                categoria
            );

        // ==========================================
        // Columnas
        // ==========================================

        worksheet.columns = [

            {
                header: "ID",
                key: "id",
                width: 15,
            },

            {
                header: "Categoría",
                key: "categoria",
                width: 22,
            },

            {
                header: "Tipo Documento",
                key: "tipoDocumento",
                width: 25,
            },

            {
                header: "Recibo",
                key: "recibo",
                width: 18,
            },

            {
                header: "Fecha Recibo",
                key: "fechaRecibo",
                width: 18,
            },

            {
                header: "Planilla GC",
                key: "planillaGC",
                width: 18,
            },

            {
                header: "Solicitante",
                key: "solicitante",
                width: 35,
            },

            {
                header: "Documento",
                key: "documento",
                width: 35,
            },

            {
                header: "Estado",
                key: "estado",
                width: 20,
            },

            {
                header: "Estado Procesamiento",
                key: "estadoProcesamiento",
                width: 25,
            },

            {
                header: "Entregado",
                key: "entregado",
                width: 15,
            },

            {
                header: "Fecha Entrega",
                key: "fechaEntrega",
                width: 18,
            },

            {
                header: "Entregado Por",
                key: "entregadoPor",
                width: 25,
            },

            {
                header: "Observaciones",
                key: "observaciones",
                width: 40,
            },

            // ======================================
            // Pasaportes
            // ======================================

            {
                header: "Titular Pasaporte",
                key: "titularPasaporte",
                width: 35,
            },

            {
                header: "Número Pasaporte",
                key: "numeroPasaporte",
                width: 22,
            },

            {
                header: "Fecha Valija",
                key: "fechaValija",
                width: 18,
            },

            {
                header: "Fecha Emisión",
                key: "fechaEmision",
                width: 18,
            },

            {
                header: "Fecha Vencimiento",
                key: "fechaVencimiento",
                width: 20,
            },

            // ======================================
            // Visa
            // ======================================

            {
                header: "Número Visa",
                key: "numeroVisa",
                width: 20,
            },

            {
                header: "Tipo Visa",
                key: "tipoVisa",
                width: 20,
            },

            {
                header: "Nacionalidad",
                key: "nacionalidad",
                width: 20,
            },

            {
                header: "Vigencia",
                key: "vigencia",
                width: 18,
            },

            // ======================================
            // Apostilla
            // ======================================

            {
                header: "Estado Apostilla",
                key: "estadoApostilla",
                width: 22,
            },

            // ======================================
            // Generales
            // ======================================

            {
    header: "Fecha Emisión Fe de Vida",
    key: "fechaEmisionDocumento",
    width: 22,
},

{
    header: "Correlativo Fe de Vida",
    key: "correlativoDocumento",
    width: 22,
},

{
    header: "Fecha Carta de Soltería",
    key: "fechaCarta",
    width: 24,
},

{
    header: "Correlativo Carta de Soltería",
    key: "correlativoCarta",
    width: 28,
},

            {
                header: "Tipo Certificado",
                key: "tipoCertificado",
                width: 25,
            },

            {
                header: "Número Certificado",
                key: "numeroCertificado",
                width: 22,
            },

            {
                header: "Número Registro",
                key: "numeroRegistro",
                width: 22,
            },

            {
                header: "Fecha Certificado",
                key: "fechaRegistro",
                width: 18,
            },

            {
                header: "Fecha Constancia",
                key: "fechaConstancia",
                width: 20,
            },

            // ======================================
            // Poder
            // ======================================

            {
                header: "Tipo Poder",
                key: "tipoPoder",
                width: 25,
            },

            {
                header: "Apoderado",
                key: "apoderado",
                width: 30,
            },

            {
                header: "Documento Apoderado",
                key: "documentoApoderado",
                width: 25,
            },

            {
                header: "Estado Poder",
                key: "estadoPoder",
                width: 20,
            },

            // ======================================
            // Autorización de viaje
            // ======================================

            {
                header: "Autoriza",
                key: "autoriza",
                width: 30,
            },

            {
                header: "Parentesco",
                key: "parentesco",
                width: 20,
            },

            {
                header: "Menor",
                key: "menor",
                width: 30,
            },

            {
                header: "Pasaporte Menor",
                key: "pasaporteMenor",
                width: 22,
            },

            {
                header: "Destino",
                key: "destino",
                width: 25,
            },

            {
                header: "Fecha Ida",
                key: "fechaIda",
                width: 18,
            },

            {
                header: "Fecha Retorno",
                key: "fechaRetorno",
                width: 20,
            },

            {
                header: "Acompañante",
                key: "acompanante",
                width: 30,
            },

            {
                header: "Pasaporte Acompañante",
                key: "pasaporteAcompanante",
                width: 25,
            },

            {
                header: "Modalidad",
                key: "modalidad",
                width: 20,
            },

        ];

        // ==========================================
        // Agregar documentos
        // ==========================================

        for (

            const documento of documentos

        ) {

            worksheet.addRow({

                id:
                    texto(
                        documento.id
                    ),

                categoria:
                    texto(
                        documento.categoria
                    ),

                tipoDocumento:
                    texto(
                        documento.tipoDocumento
                    ),

                recibo:
                    texto(
                        documento.recibo
                    ),

                fechaRecibo:
                    texto(
                        documento.fechaRecibo
                    ),

                planillaGC:
                    texto(
                        documento.planillaGC
                    ),

                solicitante:
                    texto(
                        documento.solicitante
                    ),

                documento:
                    texto(
                        documento.documento
                    ),

                estado:
                    texto(
                        documento.estado
                    ),

                estadoProcesamiento:
                    texto(
                        documento.estadoProcesamiento
                    ),

                entregado:
                    documento.entregado
                        ? "SI"
                        : "NO",

                fechaEntrega:
                    texto(
                        documento.fechaEntrega
                    ),

                entregadoPor:
                    texto(
                        documento.entregadoPor
                    ),

                observaciones:
                    texto(
                        documento.observaciones
                    ),

                titularPasaporte:
                    texto(
                        documento.titularPasaporte
                    ),

                numeroPasaporte:
                    texto(
                        documento.numeroPasaporte
                    ),

                fechaValija:
                    texto(
                        documento.fechaValija
                    ),

                fechaEmision:
                    texto(
                        documento.fechaEmision
                    ),

                fechaVencimiento:
                    texto(
                        documento.fechaVencimiento
                    ),

                numeroVisa:
                    texto(
                        documento.numeroVisa
                    ),

                tipoVisa:
                    texto(
                        documento.tipoVisa
                    ),

                nacionalidad:
                    texto(
                        documento.nacionalidad
                    ),

                vigencia:
                    texto(
                        documento.vigencia
                    ),

                estadoApostilla:
                    texto(
                        documento.estadoApostilla
                    ),

                fechaEmisionDocumento:
    texto(
        documento.fechaEmisionDocumento
    ),

correlativoDocumento:
    texto(
        documento.correlativoDocumento
    ),

fechaCarta:
    texto(
        documento.fechaCarta
    ),

correlativoCarta:
    texto(
        documento.correlativoCarta
    ),

                tipoCertificado:
                    texto(
                        documento.tipoCertificado
                    ),

                numeroCertificado:
                    texto(
                        documento.numeroCertificado
                    ),

                numeroRegistro:
                    texto(
                        documento.numeroRegistro
                    ),

                fechaRegistro:
                    texto(
                        documento.fechaRegistro
                    ),

                fechaConstancia:
                    texto(
                        documento.fechaConstancia
                    ),

                tipoPoder:
                    texto(
                        documento.tipoPoder
                    ),

                apoderado:
    texto(
        documento.apoderadosPoder?.[0]?.nombre
    ),

documentoApoderado:
    texto(
        documento.apoderadosPoder?.[0]?.documento
    ),

                estadoPoder:
                    texto(
                        documento.estadoPoder
                    ),

                autoriza:
                    texto(
                        documento.origen
                    ),

                parentesco:
                    texto(
                        documento.parentesco
                    ),

                menor:
                    texto(
                        documento.menor
                    ),

                pasaporteMenor:
                    texto(
                        documento.pasaporteMenor
                    ),

                destino:
                    texto(
                        documento.destino
                    ),

                fechaIda:
                    texto(
                        documento.fechaIda
                    ),

                fechaRetorno:
                    texto(
                        documento.fechaRetorno
                    ),

                acompanante:
                    texto(
                        documento.acompanante
                    ),

                pasaporteAcompanante:
                    texto(
                        documento.pasaporteAcompanante
                    ),

                modalidad:
                    texto(
                        documento.modalidad
                    ),

            });

        }

        // ==========================================
        // Formato del encabezado
        // ==========================================

        const encabezado =
            worksheet.getRow(1);

        encabezado.font = {

            bold: true,

            color: {
                argb: "FFFFFFFF",
            },

        };

        encabezado.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {
                argb: "FF1E3A8A",
            },

        };

        encabezado.alignment = {

            vertical: "middle",

            horizontal: "center",

            wrapText: true,

        };

        encabezado.height = 28;

        // ==========================================
        // Congelar encabezado
        // ==========================================

        worksheet.views = [

            {
                state: "frozen",

                ySplit: 1,

            },

        ];

        // ==========================================
        // Autofiltro
        // ==========================================

        worksheet.autoFilter = {

            from: {
                row: 1,
                column: 1,
            },

            to: {
                row:
                    Math.max(
                        1,
                        documentos.length + 1
                    ),

                column:
                    worksheet.columnCount,

            },

        };

        // ==========================================
        // Alineación
        // ==========================================

        worksheet.eachRow(

            (
                row,
                rowNumber
            ) => {

                if (
                    rowNumber === 1
                ) {

                    return;

                }

                row.alignment = {

                    vertical: "top",

                    wrapText: true,

                };

            }

        );

        // ==========================================
        // Generar archivo
        // ==========================================

        const buffer =
            await workbook.xlsx.writeBuffer();

        const nombreArchivo =

            anio

                ? `Reporte_${categoria}_${anio}.xlsx`

                : `Reporte_${categoria}.xlsx`;

        return new NextResponse(

            buffer as BodyInit,

            {

                status: 200,

                headers: {

                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

                    "Content-Disposition":
                        `attachment; filename="${nombreArchivo}"`,

                    "Cache-Control":
                        "no-store",

                },

            }

        );

    }

    catch (error: any) {

        console.error(

            "Error generando Excel Reportes Entregados:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:
                    error?.message ??
                    "No fue posible generar el archivo Excel.",

            },

            {

                status: 500,

            }

        );

    }

}