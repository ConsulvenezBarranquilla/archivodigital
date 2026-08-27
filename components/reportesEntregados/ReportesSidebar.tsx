"use client";

import {
    CategoriaDocumento,
} from "@/types/ReporteEntregado";

import {
    MENU_DOCUMENTOS,
} from "@/lib/reportesEntregados/documentos";

interface Props {

    categoria?: CategoriaDocumento;

    onChange: (

        categoria: CategoriaDocumento

    ) => void;

}

export default function ReportesSidebar({

    categoria,

    onChange,

}: Props) {
const categoriaSeleccionada =

        categoria ??

        "PASAPORTES";
    return (

        <aside
            className="
                w-72
                bg-white
                rounded-2xl
                shadow-md
                overflow-hidden
                h-fit
            "
        >

            <div
                className="
                    px-6
                    py-5
                    border-b
                    border-slate-200
                "
            >

                <h2
                    className="
                        text-lg
                        font-bold
                        text-blue-900
                    "
                >

                    Categoría

                </h2>

                <p
                    className="
                        text-sm
                        text-slate-500
                        mt-1
                    "
                >

                    Documentos Consulares

                </p>

            </div>

            <nav
                className="
                    py-2
                "
            >

                {

                    MENU_DOCUMENTOS.map(

                        (item) => {

                            const seleccionado =

                                item.id === categoriaSeleccionada;

                            return (

                                <button

                                    key={item.id}

                                    onClick={() =>

                                        onChange(item.id)

                                    }

                                    className={`
                                        group
                                        relative
                                        flex
                                        items-center
                                        w-full
                                        px-6
                                        py-3
                                        transition-all
                                        duration-200
                                        text-left

                                        ${
                                            seleccionado

                                                ? "bg-blue-50"

                                                : "hover:bg-slate-50"
                                        }
                                    `}

                                >

                                    {

                                        seleccionado && (

                                            <div
                                                className="
                                                    absolute
                                                    left-0
                                                    top-0
                                                    bottom-0
                                                    w-1.5
                                                    bg-blue-700
                                                    rounded-r-full
                                                "
                                            />

                                        )

                                    }

                                    <span
                                        className="
                                            text-xl
                                            w-8
                                            flex
                                            justify-center
                                        "
                                    >

                                        {item.icono}

                                    </span>

                                    <span
                                        className={`
                                            font-medium
                                            ml-3
                                            transition-colors

                                            ${
                                                seleccionado

                                                    ? "text-blue-900"

                                                    : "text-slate-700 group-hover:text-blue-800"
                                            }
                                        `}
                                    >

                                        {item.nombre}

                                    </span>

                                </button>

                            );

                        }

                    )

                }

            </nav>

        </aside>

    );

}