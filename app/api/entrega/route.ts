import {
    NextResponse,
} from "next/server";

import {
    obtenerCaja,
    obtenerGestionConsular,
    obtenerReportesEntregados,
    sheets,
    MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import {
    obtenerDocumentos,
} from "@/lib/reportesEntregados/reportesService";

import {
    CategoriaDocumento,
    ReporteEntregado,
} from "@/types/ReporteEntregado";

// ======================================================
// Categorías disponibles para entrega
// ======================================================

const CATEGORIAS: CategoriaDocumento[] = [

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

];

// ======================================================
// Tipo interno para el estado de entrega
// ======================================================

interface EstadoEntrega {

    recibo: string;

    entregado: boolean;

    fechaEntrega: string;

    entregadoPor: string;

    observaciones: string;

    fila: number;

}

// ======================================================
// GET
//
// Exclusivo del módulo /entrega.
//
// IMPORTANTE:
//
// La construcción del documento continúa utilizando
// obtenerDocumentos(), pero el ESTADO DE ENTREGA se
// recupera directamente de ReportesEntregados.
//
// Esto permite que:
// - la entrega persista al salir y volver a entrar
// - no dependamos de registrarEntrega()
// - no modifiquemos reportesentregados
// - no modifiquemos reportesService
// - no modifiquemos googleSheetReportes
//
// La búsqueda de persistencia utiliza RECIBO,
// que es también la referencia utilizada por
// /api/entrega/registrar.
// ======================================================

export async function GET() {

    try {

        // ==================================================
        // Leer las hojas
        // ==================================================

        const [

            gestionConsular,

            caja,

            reportes,

        ] = await Promise.all([

            obtenerGestionConsular(),

            obtenerCaja(),

            obtenerReportesEntregados(),

        ]);

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        // ==================================================
        // Construir documentos
        // ==================================================

        const documentos:
            ReporteEntregado[] = [];

        for (
            const categoria
            of CATEGORIAS
        ) {

            const documentosCategoria =
                obtenerDocumentos(
                    categoria,
                    data
                );

            documentos.push(
                ...documentosCategoria
            );

        }

        // ==================================================
        // DOCUMENTOS PROCESADOS
        //
        // No filtramos por entregado.
        //
        // Un documento entregado debe seguir apareciendo
        // en /entrega.
        // ==================================================

       const procesados =
    documentos.filter(

        documento =>

            documento.estadoProcesamiento ===
                "PROCESADO" ||

            documento.estadoProcesamiento ===
                "ENTREGADO"

    );

        // ==================================================
        // LEER DIRECTAMENTE ReportesEntregados
        //
        // A = ID
        // D = RECIBO
        // J = ENTREGADO
        // K = FECHA_ENTREGA
        // L = ENTREGADO_POR
        // M = OBSERVACIONES
        // BA = ESTADO_PROCESAMIENTO
        // ==================================================

        const response =
            await sheets.spreadsheets.values.get({

                spreadsheetId:
                    MODULO_CAJA_SHEET_ID,

                range:
                    "ReportesEntregados!A:BA",

            });

        const rows =
            response.data.values || [];

        // ==================================================
        // CREAR MAPA POR RECIBO
        //
        // Un mismo recibo puede tener varias filas.
        //
        // Por eso el valor del mapa es un ARRAY y no
        // un único registro.
        // ==================================================

        const reportesPorRecibo =
            new Map<
                string,
                EstadoEntrega[]
            >();

        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const row =
                rows[i];

            // ----------------------------------------------
            // RECIBO
            // D = índice 3
            // ----------------------------------------------

            const recibo =
                String(
                    row[3] ?? ""
                ).trim();

            if (!recibo) {
                continue;
            }

            // ----------------------------------------------
            // ESTADO ENTREGA
            // J = índice 9
            // ----------------------------------------------

            const entregado =
                String(
                    row[9] ?? ""
                )
                    .trim()
                    .toUpperCase() === "SI";

            // ----------------------------------------------
            // FECHA ENTREGA
            // K = índice 10
            // ----------------------------------------------

            const fechaEntrega =
                String(
                    row[10] ?? ""
                ).trim();

            // ----------------------------------------------
            // ENTREGADO POR
            // L = índice 11
            // ----------------------------------------------

            const entregadoPor =
                String(
                    row[11] ?? ""
                ).trim();

            // ----------------------------------------------
            // OBSERVACIONES
            // M = índice 12
            // ----------------------------------------------

            const observaciones =
                String(
                    row[12] ?? ""
                );

            const estado: EstadoEntrega = {

                recibo,

                entregado,

                fechaEntrega,

                entregadoPor,

                observaciones,

                fila:
                    i + 1,

            };

            const existentes =
                reportesPorRecibo.get(
                    recibo
                );

            if (existentes) {

                existentes.push(
                    estado
                );

            } else {

                reportesPorRecibo.set(
                    recibo,
                    [estado]
                );

            }

        }

        // ==================================================
        // SINCRONIZAR ESTADO
        //
        // Para cada documento buscamos primero por RECIBO.
        //
        // Si existen varias filas con el mismo recibo,
        // intentamos primero utilizar el ID de la fila para
        // mejorar la correspondencia.
        //
        // Si no hay coincidencia por ID, utilizamos las filas
        // del recibo en orden.
        // ==================================================

        const documentosEntrega:
            ReporteEntregado[] =
            procesados.map(

                documento => {

                    const recibo =
                        String(
                            documento.recibo ?? ""
                        ).trim();

                    if (!recibo) {

                        return documento;

                    }

                    const candidatos =
                        reportesPorRecibo.get(
                            recibo
                        );

                    if (
                        !candidatos ||
                        candidatos.length === 0
                    ) {

                        return documento;

                    }

                    // ------------------------------------------
                    // Intentar primero coincidencia por ID
                    // ------------------------------------------

                    const idDocumento =
                        String(
                            documento.id ?? ""
                        ).trim();

                    const indicePorId =
                        candidatos.findIndex(

                            reporte => {

                                const fila =
                                    rows[
                                        reporte.fila - 1
                                    ];

                                const idFila =
                                    String(
                                        fila?.[0] ?? ""
                                    ).trim();

                                return (
                                    idDocumento !== "" &&
                                    idFila === idDocumento
                                );

                            }

                        );

                    let reporte:
                        EstadoEntrega | undefined;

                    if (
                        indicePorId >= 0
                    ) {

                        reporte =
                            candidatos[
                                indicePorId
                            ];

                    } else {

                        // --------------------------------------
                        // Sin coincidencia por ID.
                        //
                        // Utilizamos la primera fila disponible
                        // para ese recibo.
                        // --------------------------------------

                        reporte =
                            candidatos[0];

                    }

                    if (!reporte) {

                        return documento;

                    }

                    return {

                        ...documento,

                        entregado:
                            reporte.entregado,

                        fechaEntrega:
                            reporte.fechaEntrega,

                        entregadoPor:
                            reporte.entregadoPor,

                        observaciones:
                            reporte.observaciones,

                    };

                }

            );

        // ==================================================
        // CONTADORES
        // ==================================================

        const pendientes =
            documentosEntrega.filter(

                documento =>

                    documento.entregado !== true

            ).length;

        const entregados =
            documentosEntrega.filter(

                documento =>

                    documento.entregado === true

            ).length;

        // ==================================================
        // RESPUESTA
        // ==================================================

        return NextResponse.json({

            ok: true,

            total:
                documentosEntrega.length,

            pendientes,

            entregados,

            documentos:
                documentosEntrega,

        });

    }

    catch (error: any) {

        console.error(

            "Error obteniendo documentos para entrega:",

            error

        );

        return NextResponse.json(

            {

                ok: false,

                error:
                    error?.message ??
                    "No fue posible obtener los documentos para entrega.",

            },

            {

                status: 500,

            }

        );

    }

}