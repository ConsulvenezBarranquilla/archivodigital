"use client";

import {
    useMemo,
    useState,
} from "react";

import DataTable, {
    TableColumn,
} from "@/components/table/DataTable";

import {
    CategoriaDocumento,
    ReporteEntregado,
} from "@/types/ReporteEntregado";

import {
    obtenerColumnas,
} from "@/lib/reportesEntregados/columnas";

interface Props {

    categoria: CategoriaDocumento;

    busqueda: string;

    documentos?: ReporteEntregado[];

    onEditar: (
        documento: ReporteEntregado
    ) => void;

    onEntregar: (
        documento: ReporteEntregado
    ) => void;

    onNuevaConstancia?: () => void;

}

type FiltroProcesamiento =
    | "EN_PROCESO"
    | "PROCESADOS";

export default function ReportesTable({

    categoria,

    busqueda,

    documentos = [],

    onEditar,

    onEntregar,

    onNuevaConstancia,

}: Props) {

    // ==========================================
    // Filtro actual
    // ==========================================

    const [
        filtroProcesamiento,
        setFiltroProcesamiento,
    ] = useState<FiltroProcesamiento>(
        "EN_PROCESO"
    );

    // ==========================================
    // Cantidad de documentos en proceso
    // ==========================================

    const cantidadEnProceso =
        useMemo(() => {

            return documentos.filter(
                documento =>
                    documento.estadoProcesamiento ===
                    "EN_PROCESO"
            ).length;

        }, [documentos]);

    // ==========================================
    // Cantidad de documentos procesados
    // ==========================================

    const cantidadProcesados =
    useMemo(() => {

        return documentos.filter(
            documento =>
                documento.estadoProcesamiento ===
                    "PROCESADO"
                ||
                documento.estadoProcesamiento ===
                    "RECHAZADA"
        ).length;

    }, [documentos]);

    // ==========================================
    // Columnas
    // ==========================================

    const columnas = useMemo(() => {

        const columnasBase =
    obtenerColumnas(categoria);

// ======================================
// AUTORIZACIÓN DE VIAJE
// Mostrar hasta dos solicitantes
// en las columnas G y H
// ======================================

if (categoria === "AUTORIZACION_VIAJE") {

    const indiceSolicitante =
        columnasBase.findIndex(
            columna =>
                columna.field === "solicitante"
        );

    const indiceDocumento =
        columnasBase.findIndex(
            columna =>
                columna.field === "documento"
        );

    if (
        indiceSolicitante !== -1 &&
        indiceDocumento !== -1
    ) {

        columnasBase[indiceSolicitante] = {

            ...columnasBase[indiceSolicitante],

            title: "Solicitante",

            width: "320px",

            whiteSpace: "pre-line",

            render: (row) => {

                if (
                    !Array.isArray(
                        row.solicitantesAutorizacion
                    )
                ) {
                    return row.solicitante || "";
                }

                return row.solicitantesAutorizacion
                    .map(
                        persona =>
                            persona?.nombre || ""
                    )
                    .filter(Boolean)
                    .join("\n");

            },

        };

        columnasBase[indiceDocumento] = {

            ...columnasBase[indiceDocumento],

            title: "Documento",

            width: "170px",

            align: "center",

            whiteSpace: "pre-line",

            render: (row) => {

                if (
                    !Array.isArray(
                        row.solicitantesAutorizacion
                    )
                ) {
                    return row.documento || "";
                }

                return row.solicitantesAutorizacion
                    .map(
                        persona =>
                            persona?.documento || ""
                    )
                    .filter(Boolean)
                    .join("\n");

            },

        };

    }

}
// ======================================
// AUTORIZACIÓN DE VIAJE
// ======================================


        // ======================================
        // Columna Estado / Acciones
        // ======================================

        const columnaEstado:
            TableColumn<ReporteEntregado> = {

            field: "id",

            title: "Estado",

            width: "210px",

            align: "center",

            render: (row) => {

                // ==================================
                // EN PROCESO
                // ==================================

                if (
                    row.estadoProcesamiento ===
                    "EN_PROCESO"
                ) {

                    return (

                        <div className="
                            flex
                            items-center
                            justify-center
                            gap-2
                        ">

                            {/* Editar */}

                            <button

                                type="button"

                                onClick={() =>
                                    onEditar(row)
                                }

                                className="
                                    rounded-lg
                                    border
                                    border-blue-200
                                    bg-blue-50
                                    px-3
                                    py-1.5
                                    text-sm
                                    font-medium
                                    text-blue-700
                                    transition
                                    hover:bg-blue-100
                                "

                                title="Editar documento"

                            >

                                Editar

                            </button>

                            {/* Estado */}

                            <span className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-gray-200
                                bg-gray-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-gray-600
                            ">

                                En Proceso

                            </span>

                        </div>

                    );

                }

                // ==================================
                // PROCESADO
                // ==================================

                if (
                    row.estadoProcesamiento ===
                    "PROCESADO"
                ) {

                    return (

                        <div className="
                            flex
                            items-center
                            justify-center
                            gap-2
                        ">

                            {/* Editar
                                Sigue disponible
                                después de procesar */}

                            <button

                                type="button"

                                onClick={() =>
                                    onEditar(row)
                                }

                                className="
                                    rounded-lg
                                    border
                                    border-blue-200
                                    bg-blue-50
                                    px-3
                                    py-1.5
                                    text-sm
                                    font-medium
                                    text-blue-700
                                    transition
                                    hover:bg-blue-100
                                "

                                title="Editar documento"

                            >

                                Editar

                            </button>

                            {/* Estado */}

                            <span className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-green-200
                                bg-green-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-green-700
                            ">

                                ✓ Procesado

                            </span>

                        </div>

                    );

                }

                // ==================================
                // ENTREGADO
                // ==================================

                if (
                    row.estadoProcesamiento ===
                    "ENTREGADO"
                ) {

                    return (

                        <div className="
                            flex
                            items-center
                            justify-center
                        ">

                            <span className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-blue-200
                                bg-blue-100
                                px-3
                                py-1.5
                                text-sm
                                font-semibold
                                text-blue-700
                            ">

                                ✓ Entregado

                            </span>

                        </div>

                    );

                }
// ==================================
// RECHAZADA / NEGADA
// ==================================

if (
    row.estadoProcesamiento ===
    "RECHAZADA"
) {

    return (
        <div className="
            flex
            items-center
            justify-center
            gap-2
        ">

            {/* Editar */}
            <button
                type="button"
                onClick={() =>
                    onEditar(row)
                }
                className="
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-50
                    px-3
                    py-1.5
                    text-sm
                    font-medium
                    text-blue-700
                    transition
                    hover:bg-blue-100
                "
                title="Editar documento"
            >
                Editar
            </button>

            {/* Estado rechazado */}
            <span className="
                inline-flex
                items-center
                rounded-full
                border
                border-red-200
                bg-red-100
                px-3
                py-1
                text-xs
                font-semibold
                text-red-700
            ">
                ✕ Rechazado
            </span>

        </div>
    );

}
                // ==================================
                // Registros históricos
                // sin estado definido
                // ==================================

                return (

                    <div className="
                        flex
                        items-center
                        justify-center
                        gap-2
                    ">

                        <button

                            type="button"

                            onClick={() =>
                                onEditar(row)
                            }

                            className="
                                rounded-lg
                                border
                                border-blue-200
                                bg-blue-50
                                px-3
                                py-1.5
                                text-sm
                                font-medium
                                text-blue-700
                                transition
                                hover:bg-blue-100
                            "

                            title="Editar documento"

                        >

                            Editar

                        </button>

                        <span className="
                            inline-flex
                            items-center
                            rounded-full
                            border
                            border-gray-200
                            bg-gray-100
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-gray-600
                        ">

                            En Proceso

                        </span>

                    </div>

                );

            },

        };

        return [

            ...columnasBase,

            columnaEstado,

        ];

    }, [

        categoria,

        onEditar,

    ]);
// ==========================================
// ANCHO ESPECIAL PARA PODERES
// ==========================================

const anchoMinimoTabla =
    categoria === "PODER"
        ? 1450
        : undefined;
    // ==========================================
    // Filtrar documentos
    // ==========================================

    const datosFiltrados =
        useMemo(() => {

            // ----------------------------------
            // Filtrar primero por estado
            // ----------------------------------

            let resultado =
                documentos.filter(
                    documento => {

                        // Los documentos entregados
                        // no aparecen en esta página.

                        if (
                            documento.estadoProcesamiento ===
                            "ENTREGADO"
                        ) {

                            return false;

                        }

                        // --------------------------
                        // En proceso
                        // --------------------------

                        if (
                            filtroProcesamiento ===
                            "EN_PROCESO"
                        ) {

                            return (
                                documento.estadoProcesamiento ===
                                "EN_PROCESO"
                            );

                        }

                        // --------------------------
// Procesados
// --------------------------
//
// Incluye:
// - Documentos procesados
// - Documentos rechazados / negados
//
// Ambos ya terminaron su proceso
// y no deben permanecer en
// "En Proceso".

return (
    documento.estadoProcesamiento ===
        "PROCESADO"
    ||
    documento.estadoProcesamiento ===
        "RECHAZADA"
);

                    }
                );

            // ----------------------------------
            // Búsqueda
            // ----------------------------------

            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            if (texto) {

    resultado =
        resultado.filter(
            item => {

                return (

                    item.recibo
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.planillaGC
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.solicitante
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.documento
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.titularPasaporte
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.titularVisa
                        ?.toLowerCase()
                        .includes(texto)

                    ||

                    item.titularApostilla
                        ?.toLowerCase()
                        .includes(texto)

                );

            }
        );

}

            resultado =
                resultado.filter(
                    item => {

                        return (

                            // Recibo

                            item.recibo
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Planilla

                            item.planillaGC
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Solicitante

                            item.solicitante
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Documento

                            item.documento
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Titular Pasaporte

                            item.titularPasaporte
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Titular Visa

                            item.titularVisa
                                ?.toLowerCase()
                                .includes(texto)

                            ||

                            // Titular Apostilla

                            item.titularApostilla
                                ?.toLowerCase()
                                .includes(texto)

                        );

                    }
                );
// ==========================================
// ORDEN ESPECIAL POR PLANILLA GC
// Número de Planilla GC ASCENDENTE
// ==========================================

if (
    categoria === "APOSTILLA" ||
    categoria === "CONSTANCIA_CONSULAR" ||
    categoria === "CERTIFICADO_USO" ||
    categoria === "CARTA_SOLTERIA" ||
    categoria === "FE_VIDA"
) {

    resultado.sort((a, b) => {

        const planillaA =
            String(
                a.planillaGC ?? ""
            ).trim();

        const planillaB =
            String(
                b.planillaGC ?? ""
            ).trim();

        // Sin planilla: al final
        if (!planillaA && !planillaB) {
            return 0;
        }

        if (!planillaA) {
            return 1;
        }

        if (!planillaB) {
            return -1;
        }

        const numeroA =
            parseInt(
                planillaA.replace(/\D/g, ""),
                10
            );

        const numeroB =
            parseInt(
                planillaB.replace(/\D/g, ""),
                10
            );

        // Planillas que no contienen número: al final
        if (Number.isNaN(numeroA)) {
            return 1;
        }

        if (Number.isNaN(numeroB)) {
            return -1;
        }

        return numeroA - numeroB;

    });

}

return resultado;

        }, [

            documentos,

            busqueda,

            filtroProcesamiento,

        ]);

    // ==========================================
    // Render
    // ==========================================

    return (

        <div className="space-y-4">

            {/* ==================================
                TOGGLE
            ================================== */}

            <div className="
                flex
                flex-col
                gap-3
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-3
                shadow-sm
                sm:flex-row
                sm:items-center
                sm:justify-between
            ">

                {/* ==================================
                    Botones del toggle
                ================================== */}

                <div className="
                    flex
                    w-full
                    rounded-xl
                    bg-gray-100
                    p-1
                    sm:w-auto
                ">

                    {/* ==============================
                        EN PROCESO
                    ============================== */}

                    <button

                        type="button"

                        onClick={() =>
                            setFiltroProcesamiento(
                                "EN_PROCESO"
                            )
                        }

                        className={`
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            transition
                            sm:flex-none

                            ${
                                filtroProcesamiento ===
                                "EN_PROCESO"

                                    ? `
                                        bg-white
                                        text-gray-800
                                        shadow-sm
                                      `

                                    : `
                                        text-gray-500
                                        hover:text-gray-800
                                      `
                            }
                        `}

                    >

                        <span>

                            En Proceso

                        </span>

                        <span className="
                            rounded-full
                            bg-gray-200
                            px-2
                            py-0.5
                            text-xs
                            font-bold
                        ">

                            {cantidadEnProceso}

                        </span>

                    </button>

                    {/* ==============================
                        PROCESADOS
                    ============================== */}

                    <button

                        type="button"

                        onClick={() =>
                            setFiltroProcesamiento(
                                "PROCESADOS"
                            )
                        }

                        className={`
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            transition
                            sm:flex-none

                            ${
                                filtroProcesamiento ===
                                "PROCESADOS"

                                    ? `
                                        bg-white
                                        text-green-700
                                        shadow-sm
                                      `

                                    : `
                                        text-gray-500
                                        hover:text-green-700
                                      `
                            }
                        `}

                    >

                        <span>

                            Procesados

                        </span>

                        <span className="
                            rounded-full
                            bg-green-100
                            px-2
                            py-0.5
                            text-xs
                            font-bold
                            text-green-700
                        ">

                            {cantidadProcesados}

                        </span>

                    </button>

                </div>

                {/* ==================================
                    Descripción
                ================================== */}

                <div className="
                    px-2
                    text-sm
                    text-gray-500
                ">

                    {filtroProcesamiento ===
                    "EN_PROCESO"

                        ? (
                            <>
                                Mostrando documentos
                                pendientes de procesamiento.
                            </>
                        )

                        : (
                            <>
                                Mostrando documentos
                                procesados y listos
                                para entrega.
                            </>
                        )

                    }

                </div>

            </div>

            {/* ==================================
    TABLA
================================== */}

<div
    className={
        categoria === "PODER"
            ? "tabla-poderes"
            : ""
    }
>
    <DataTable
        columns={columnas}
        data={datosFiltrados}
        getRowKey={(
            row,
            index
        ) => {

            return (
                row.id ||
                `${row.recibo}-${row.planillaGC}-${row.documento}-${index}`
            );

        }}
    />
</div>

            {/* ==================================
                SIN RESULTADOS
            ================================== */}

            {datosFiltrados.length === 0 && (

                <div className="
                    rounded-xl
                    border
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    px-6
                    py-10
                    text-center
                    text-sm
                    text-gray-500
                ">

                    {filtroProcesamiento ===
                    "EN_PROCESO"

                        ? "No hay documentos en proceso."

                        : "No hay documentos procesados."

                    }

                </div>

            )}

        </div>

    );

}