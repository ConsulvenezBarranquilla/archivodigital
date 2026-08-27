"use client";

import {
    ReporteEntregado,
} from "@/types/ReporteEntregado";

interface Props {

    categoria: string;

    documento: ReporteEntregado;

    onEditar: (
        documento: ReporteEntregado
    ) => void;

    onRegistrarValija?: (
        documento: ReporteEntregado
    ) => void;

}

export default function AccionesReporte({

    categoria,

    documento,

    onEditar,

    onRegistrarValija,

}: Props) {

    const estado =
        documento.estadoProcesamiento ??
        "EN_PROCESO";

    return (

        <div className="
            flex
            items-center
            justify-center
            gap-2
        ">

            {/* ======================================
                EDITAR
                Disponible siempre
            ====================================== */}

            <button

                type="button"

                onClick={() =>
                    onEditar(documento)
                }

                className="
                    rounded-lg
                    bg-slate-600
                    px-2
                    py-1
                    text-xs
                    text-white
                    hover:bg-slate-700
                "

                title="Editar"

            >

                ✏️

            </button>

            {/* ======================================
                REGISTRAR VALIJA
            ====================================== */}

            {categoria === "PASAPORTES" && (

                <button

                    type="button"

                    onClick={() =>
                        onRegistrarValija?.(
                            documento
                        )
                    }

                    className="
                        rounded-lg
                        bg-blue-600
                        px-2
                        py-1
                        text-xs
                        text-white
                        hover:bg-blue-700
                    "

                    title="Registrar Valija"

                >

                    📦

                </button>

            )}

            {/* ======================================
                EN PROCESO
            ====================================== */}

            {estado === "EN_PROCESO" && (

                <span className="
                    inline-flex
                    items-center
                    rounded-lg
                    border
                    border-gray-300
                    bg-gray-100
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-gray-500
                ">

                    En Proceso

                </span>

            )}

            {/* ======================================
                PROCESADO
            ====================================== */}

            {estado === "PROCESADO" && (
    documento.categoria === "VISA" &&
    String(
        documento.estado ?? ""
    )
        .trim()
        .toUpperCase() === "RECHAZADA"
        ? (
            // ======================================
            // VISA RECHAZADA
            // ======================================

            <span className="
                inline-flex
                items-center
                rounded-lg
                border
                border-red-200
                bg-red-100
                px-3
                py-1
                text-xs
                font-semibold
                text-red-700
            ">
                ✕ Negada
            </span>
        )
        : (
            // ======================================
            // PROCESADO NORMAL
            // ======================================

            <span className="
                inline-flex
                items-center
                rounded-lg
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
        )
)}

            {/* ======================================
                ENTREGADO
            ====================================== */}

            {estado === "ENTREGADO" && (

                <span className="
                    inline-flex
                    items-center
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-100
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-blue-700
                ">

                    ✓ Entregado

                </span>

            )}

        </div>

    );

}