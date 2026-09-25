import {
    NextResponse,
} from "next/server";

import { obtenerSesion } from "@/lib/auth";

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

    id: string;

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
//
// - la entrega persista al salir y volver a entrar
// - no dependamos de registrarEntrega()
// - no modifiquemos reportesentregados
// - no modifiquemos reportesService
// - no modifiquemos googleSheetReportes
//
// La correspondencia principal utiliza el ID del documento.
// El RECIBO queda como respaldo cuando no existe
// coincidencia por ID.
// ======================================================

export async function GET() {

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
        // CREAR MAPA POR ID
        //
        // El ID es la identificación única del documento.
        //
        // Esto permite:
        //
        // - entregar varios documentos del mismo recibo
        // - entregar documentos sin recibo
        // - evitar que una fila de un mismo recibo se
        //   confunda con otra
        // ==================================================

        const reportesPorId =
            new Map<
                string,
                EstadoEntrega
            >();

        // ==================================================
        // CREAR MAPA POR RECIBO COMO RESPALDO
        //
        // Un mismo recibo puede tener varias filas.
        //
        // Este mapa solamente se utilizará cuando no
        // exista coincidencia por ID.
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
            // ID
            // A = índice 0
            // ----------------------------------------------

            const id =
                String(
                    row[0] ?? ""
                ).trim();

            // ----------------------------------------------
            // RECIBO
            // D = índice 3
            // ----------------------------------------------

            const recibo =
                String(
                    row[3] ?? ""
                ).trim();

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

                id,

                recibo,

                entregado,

                fechaEntrega,

                entregadoPor,

                observaciones,

                fila:
                    i + 1,

            };

            // ----------------------------------------------
            // MAPA PRINCIPAL POR ID
            //
            // Solo registramos IDs no vacíos.
            // ----------------------------------------------

            if (id) {

                reportesPorId.set(
                    id,
                    estado
                );

            }

            // ----------------------------------------------
            // MAPA SECUNDARIO POR RECIBO
            //
            // Solo registramos recibos no vacíos.
            // ----------------------------------------------

            if (recibo) {

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

        }

        // ==================================================
        // SINCRONIZAR ESTADO
        //
        // La correspondencia principal se hace por ID.
        //
        // Esto es importante porque:
        //
        // - un recibo puede tener varios documentos
        // - una Constancia Consular manual puede no tener
        //   recibo
        //
        // Por lo tanto NO debemos utilizar el recibo como
        // identificador principal.
        //
        // Si por alguna razón un documento no tiene ID
        // coincidente, utilizamos el recibo únicamente como
        // respaldo cuando existe una sola fila para ese
        // recibo.
        // ==================================================

        const documentosEntrega:
            ReporteEntregado[] =
            procesados.map(

                documento => {

                    // ------------------------------------------
                    // ID DEL DOCUMENTO
                    // ------------------------------------------

                    const idDocumento =
                        String(
                            documento.id ?? ""
                        ).trim();

                    // ------------------------------------------
                    // PRIMERA OPCIÓN:
                    // Coincidencia exacta por ID.
                    //
                    // Funciona también para documentos sin
                    // número de recibo.
                    // ------------------------------------------

                    let reporte:
                        EstadoEntrega | undefined;

                    if (idDocumento) {

                        reporte =
                            reportesPorId.get(
                                idDocumento
                            );

                    }

                    // ------------------------------------------
                    // SEGUNDA OPCIÓN:
                    // Utilizar RECIBO solamente como respaldo.
                    //
                    // IMPORTANTE:
                    // Si hay varias filas con el mismo recibo,
                    // NO elegimos arbitrariamente la primera.
                    //
                    // De esa manera evitamos volver a presentar
                    // el problema de documentos diferentes del
                    // mismo recibo.
                    // ------------------------------------------

                    if (!reporte) {

                        const recibo =
                            String(
                                documento.recibo ?? ""
                            ).trim();

                        if (recibo) {

                            const candidatos =
                                reportesPorRecibo.get(
                                    recibo
                                );

                            if (
                                candidatos &&
                                candidatos.length === 1
                            ) {

                                reporte =
                                    candidatos[0];

                            }

                        }

                    }

                    // ------------------------------------------
                    // Si no encontramos una fila correspondiente,
                    // conservamos el documento tal como viene.
                    // ------------------------------------------

                    if (!reporte) {

                        return documento;

                    }

                    // ------------------------------------------
                    // Aplicar estado de entrega
                    // ------------------------------------------

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