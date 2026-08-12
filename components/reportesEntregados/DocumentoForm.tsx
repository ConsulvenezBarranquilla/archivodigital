"use client";

import {

    CategoriaDocumento,

    ReporteEntregado,

} from "@/types/ReporteEntregado";

import {

    CONFIG_CAMPOS,

} from "@/lib/reportesEntregados/configCampos";

interface Props {

    categoria: CategoriaDocumento;

    documento: ReporteEntregado;

    onChange: (

        cambios: Partial<ReporteEntregado>

    ) => void;

    modo:

        | "editar"

        | "valija"

        | "entrega";

}

export default function DocumentoForm({

    categoria,

    documento,

    onChange,

    modo,

}: Props) {

    const campos =

        CONFIG_CAMPOS[categoria].filter(

            campo =>

                !campo.editableEn ||

                campo.editableEn === modo

        );

    return (

        <div className="space-y-5">

            {

                campos.map(campo => {

                    const valor =

                        (documento as any)[campo.key] ?? "";

                    return (

                        <div

                            key={campo.key}

                            className="space-y-1"

                        >

                            <label

                                className="block text-sm font-medium text-slate-700"

                            >

                                {campo.label}

                                {

                                    campo.requerido && (

                                        <span className="text-red-500 ml-1">

                                            *

                                        </span>

                                    )

                                }

                            </label>

                            {

                                campo.type === "text" && (

                                    <input

                                        type="text"

                                        value={valor}

                                        onChange={e =>

                                            onChange({

                                                [campo.key]:

                                                    e.target.value,

                                            })

                                        }

                                        className="

                                            w-full

                                            rounded-lg

                                            border

                                            border-slate-300

                                            px-3

                                            py-2

                                            focus:border-blue-600

                                            focus:outline-none

                                        "

                                    />

                                )

                            }

                            {

                                campo.type === "date" && (

                                    <input

                                        type="date"

                                        value={valor}

                                        onChange={e =>

                                            onChange({

                                                [campo.key]:

                                                    e.target.value,

                                            })

                                        }

                                        className="

                                            w-full

                                            rounded-lg

                                            border

                                            border-slate-300

                                            px-3

                                            py-2

                                            focus:border-blue-600

                                            focus:outline-none

                                        "

                                    />

                                )

                            }

                            {

                                campo.type === "textarea" && (

                                    <textarea

                                        rows={4}

                                        value={valor}

                                        onChange={e =>

                                            onChange({

                                                [campo.key]:

                                                    e.target.value,

                                            })

                                        }

                                        className="

                                            w-full

                                            rounded-lg

                                            border

                                            border-slate-300

                                            px-3

                                            py-2

                                            focus:border-blue-600

                                            focus:outline-none

                                        "

                                    />

                                )

                            }

                            {

                                campo.type === "select" && (

                                    <select

                                        value={valor}

                                        onChange={e =>

                                            onChange({

                                                [campo.key]:

                                                    e.target.value,

                                            })

                                        }

                                        className="

                                            w-full

                                            rounded-lg

                                            border

                                            border-slate-300

                                            px-3

                                            py-2

                                            focus:border-blue-600

                                            focus:outline-none

                                        "

                                    >

                                        <option value="">

                                            Seleccione...

                                        </option>

                                        {

                                            campo.opciones?.map(

                                                opcion => (

                                                    <option

                                                        key={opcion}

                                                        value={opcion}

                                                    >

                                                        {opcion}

                                                    </option>

                                                )

                                            )

                                        }

                                    </select>

                                )

                            }

                        </div>

                    );

                })

            }

        </div>

    );

}