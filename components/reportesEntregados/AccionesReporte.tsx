"use client";

import { ReporteEntregado } from "@/types/ReporteEntregado";

interface Props {

    categoria: string;

    documento: ReporteEntregado;

    onEditar: (

        documento: ReporteEntregado

    ) => void;

    onRegistrarValija?: (

        documento: ReporteEntregado

    ) => void;

    onEntregar?: (

        documento: ReporteEntregado

    ) => void;

}

export default function AccionesReporte({

    categoria,

    documento,

    onEditar,

    onRegistrarValija,

    onEntregar,

}: Props) {

    return (

        <div className="flex justify-center gap-2">

            {/* Editar */}

            <button

                type="button"

                onClick={() =>

                    onEditar(documento)

                }

                className="

                    px-2

                    py-1

                    rounded-lg

                    bg-slate-600

                    hover:bg-slate-700

                    text-white

                    text-xs

                "

                title="Editar"

            >

                ✏️

            </button>

            {/* Registrar Valija */}

            {

                categoria === "PASAPORTES" && (

                    <button

                        type="button"

                        onClick={() =>

                            onRegistrarValija?.(

                                documento

                            )

                        }

                        className="

                            px-2

                            py-1

                            rounded-lg

                            bg-blue-600

                            hover:bg-blue-700

                            text-white

                            text-xs

                        "

                        title="Registrar Valija"

                    >

                        📦

                    </button>

                )

            }

            {/* Entregar */}

            <button

                type="button"

                onClick={() =>

                    onEntregar?.(

                        documento

                    )

                }

                className="

                    px-3

                    py-1

                    rounded-lg

                    bg-emerald-600

                    hover:bg-emerald-700

                    text-white

                    text-xs

                "

                title="Entregar"

            >

                Entregar

            </button>

        </div>

    );

}