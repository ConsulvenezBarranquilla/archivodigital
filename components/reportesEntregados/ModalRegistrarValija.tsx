"use client";

import {

    useEffect,

    useMemo,

    useState,

} from "react";

import {

    ReporteEntregado,

} from "@/types/ReporteEntregado";

interface Props {

    open: boolean;

    documentos: ReporteEntregado[];

    onClose: () => void;

    onGuardar: (

        fechaValija: string,

        documentos: ReporteEntregado[]

    ) => Promise<void>;

}

export default function ModalRegistrarValija({

    open,

    documentos,

    onClose,

    onGuardar,

}: Props) {

    const [

        fechaValija,

        setFechaValija,

    ] = useState("");

    const [

        seleccionados,

        setSeleccionados,

    ] = useState<string[]>([]);

    const [

        registros,

        setRegistros,

    ] = useState<ReporteEntregado[]>([]);

    const [

        guardando,

        setGuardando,

    ] = useState(false);

    useEffect(() => {

        if (!open) {

            return;

        }

        setFechaValija("");

        setSeleccionados([]);

        setRegistros(

            documentos.map(

                item => ({

                    ...item,

                })

            )

        );

    },

    [

        open,

        documentos,

    ]);

    const cantidadSeleccionados =

        useMemo(

            () =>

                seleccionados.length,

            [

                seleccionados,

            ]

        );

    if (!open) {

        return null;

    }

    return (

        <div

            className="

                fixed

                inset-0

                z-50

                bg-black/40

                flex

                items-center

                justify-center

                p-6

            "

        >

            <div

                className="

                    bg-white

                    rounded-2xl

                    shadow-2xl

                    w-full

                    max-w-7xl

                    max-h-[90vh]

                    flex

                    flex-col

                "

            >
                            <div

                    className="

                        px-8

                        py-6

                        border-b

                    "

                >

                    <h2

                        className="

                            text-2xl

                            font-bold

                            text-blue-950

                        "

                    >

                        Registrar recepción de valija

                    </h2>

                    <p

                        className="

                            text-slate-500

                            mt-1

                        "

                    >

                        Seleccione los pasaportes recibidos e ingrese la información de cada documento.

                    </p>

                </div>
                                <div

                    className="

                        px-8

                        py-5

                        border-b

                        bg-slate-50

                    "

                >

                    <div

                        className="

                            flex

                            items-center

                            gap-6

                        "

                    >

                        <div>

                            <label

                                className="

                                    block

                                    text-sm

                                    font-semibold

                                    mb-2

                                "

                            >

                                Fecha de recepción

                            </label>

                            <input

                                type="date"

                                value={fechaValija}

                                onChange={

                                    e =>

                                        setFechaValija(

                                            e.target.value

                                        )

                                }

                                className="

                                    border

                                    rounded-lg

                                    px-3

                                    py-2

                                "

                            />

                        </div>

                        <div

                            className="

                                text-sm

                                text-slate-600

                                mt-7

                            "

                        >

                            Pasaportes seleccionados:

                            <strong>

                                {" "}

                                {

                                    cantidadSeleccionados

                                }

                            </strong>

                        </div>

                    </div>

                </div>

                {/* =======================================
                    Tabla de Pasaportes
                ======================================== */}

                <div

                    className="

                        flex-1

                        overflow-auto

                        p-6

                    "

                >

                    <table

                        className="

                            w-full

                            text-sm

                            border-collapse

                        "

                    >

                        <thead>

                            <tr

                                className="

                                    bg-slate-100

                                    text-slate-700

                                "

                            >

                                <th className="p-3 w-12">

                                    ✓

                                </th>

                                <th className="p-3 text-left">

                                    Ciudadano

                                </th>

                                <th className="p-3 text-left">

                                    Documento

                                </th>

                                <th className="p-3 text-left">

                                    Observaciones

                                </th>

                                <th className="p-3 text-left">

                                    Nº Pasaporte

                                </th>

                                <th className="p-3">

                                    Emisión

                                </th>

                                <th className="p-3">

                                    Vencimiento

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                registros.map(

                                    (

                                        item,

                                        index

                                    ) => {

                                        const seleccionado =

                                            seleccionados.includes(

                                                item.id

                                            );

                                        return (

                                            <tr

                                                key={

                                                    item.id

                                                }

                                                className="

                                                    border-b

                                                    hover:bg-slate-50

                                                "

                                            >

                                                {/* =======================
                                                    Checkbox
                                                ======================== */}

                                                <td

                                                    className="

                                                        text-center

                                                    "

                                                >

                                                    <input

                                                        type="checkbox"

                                                        checked={

                                                            seleccionado

                                                        }

                                                        onChange={

                                                            (

                                                                e

                                                            ) => {

                                                                if (

                                                                    e.target.checked

                                                                ) {

                                                                    setSeleccionados(

                                                                        [

                                                                            ...seleccionados,

                                                                            item.id,

                                                                        ]

                                                                    );

                                                                }

                                                                else {

                                                                    setSeleccionados(

                                                                        seleccionados.filter(

                                                                            (

                                                                                id

                                                                            ) =>

                                                                                id !==

                                                                                item.id

                                                                        )

                                                                    );

                                                                }

                                                            }

                                                        }

                                                    />

                                                </td>

                                                {/* =======================
                                                    Ciudadano
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                    "

                                                >

                                                    {

                                                        item.solicitante

                                                    }

                                                </td>

                                                {/* =======================
                                                    Documento
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                        whitespace-nowrap

                                                    "

                                                >

                                                    {

                                                        item.documento

                                                    }

                                                </td>

                                                {/* =======================
                                                    Observaciones
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                        text-slate-600

                                                    "

                                                >

                                                    {

                                                        item.observaciones ||

                                                        "-"

                                                    }

                                                </td>
                                                                                                {/* =======================
                                                    Número Pasaporte
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                    "

                                                >

                                                    <input

                                                        type="text"

                                                        disabled={

                                                            !seleccionado

                                                        }

                                                        value={

                                                            item.numeroPasaporte ??

                                                            ""

                                                        }

                                                        onChange={

                                                            (

                                                                e

                                                            ) => {

                                                                const copia = [

                                                                    ...registros,

                                                                ];

                                                                copia[

                                                                    index

                                                                ] = {

                                                                    ...item,

                                                                    numeroPasaporte:

                                                                        e.target.value,

                                                                };

                                                                setRegistros(

                                                                    copia

                                                                );

                                                            }

                                                        }

                                                        className="

                                                            w-40

                                                            border

                                                            rounded-lg

                                                            px-2

                                                            py-1

                                                            disabled:bg-slate-100

                                                        "

                                                    />

                                                </td>

                                                {/* =======================
                                                    Fecha emisión
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                    "

                                                >

                                                    <input

                                                        type="date"

                                                        disabled={

                                                            !seleccionado

                                                        }

                                                        value={

                                                            item.fechaEmision ??

                                                            ""

                                                        }

                                                        onChange={

                                                            (

                                                                e

                                                            ) => {

                                                                const copia = [

                                                                    ...registros,

                                                                ];

                                                                copia[

                                                                    index

                                                                ] = {

                                                                    ...item,

                                                                    fechaEmision:

                                                                        e.target.value,

                                                                };

                                                                setRegistros(

                                                                    copia

                                                                );

                                                            }

                                                        }

                                                        className="

                                                            border

                                                            rounded-lg

                                                            px-2

                                                            py-1

                                                            disabled:bg-slate-100

                                                        "

                                                    />

                                                </td>

                                                {/* =======================
                                                    Fecha vencimiento
                                                ======================== */}

                                                <td

                                                    className="

                                                        px-3

                                                        py-2

                                                    "

                                                >

                                                    <input

                                                        type="date"

                                                        disabled={

                                                            !seleccionado

                                                        }

                                                        value={

                                                            item.fechaVencimiento ??

                                                            ""

                                                        }

                                                        onChange={

                                                            (

                                                                e

                                                            ) => {

                                                                const copia = [

                                                                    ...registros,

                                                                ];

                                                                copia[

                                                                    index

                                                                ] = {

                                                                    ...item,

                                                                    fechaVencimiento:

                                                                        e.target.value,

                                                                };

                                                                setRegistros(

                                                                    copia

                                                                );

                                                            }

                                                        }

                                                        className="

                                                            border

                                                            rounded-lg

                                                            px-2

                                                            py-1

                                                            disabled:bg-slate-100

                                                        "

                                                    />

                                                </td>

                                            </tr>

                                        );

                                    }

                                )

                            }

                        </tbody>

                    </table>

                </div>
                                {/* =======================================
                    Barra inferior
                ======================================== */}

                <div

                    className="

                        border-t

                        bg-slate-50

                        px-8

                        py-5

                        flex

                        items-center

                        justify-between

                    "

                >

                    {/* ===========================
                        Lado izquierdo
                    ============================ */}

                    <div

                        className="

                            flex

                            items-center

                            gap-6

                        "

                    >

                        <button

                            type="button"

                            onClick={() => {

                                if (

                                    seleccionados.length ===

                                    registros.length

                                ) {

                                    setSeleccionados([]);

                                }

                                else {

                                    setSeleccionados(

                                        registros.map(

                                            r => r.id

                                        )

                                    );

                                }

                            }}

                            className="

                                text-blue-700

                                hover:text-blue-900

                                font-semibold

                            "

                        >

                            {

                                seleccionados.length ===

                                registros.length

                                    ? "Deseleccionar todos"

                                    : "Seleccionar todos"

                            }

                        </button>

                        <span

                            className="

                                text-sm

                                text-slate-600

                            "

                        >

                            {

                                cantidadSeleccionados

                            }

                            {" "}pasaporte(s) seleccionado(s)

                        </span>

                    </div>

                    {/* ===========================
                        Botones
                    ============================ */}

                    <div

                        className="

                            flex

                            gap-3

                        "

                    >

                        <button

                            type="button"

                            onClick={onClose}

                            disabled={guardando}

                            className="

                                px-5

                                py-2

                                rounded-xl

                                border

                                border-slate-300

                                hover:bg-slate-100

                                disabled:opacity-50

                            "

                        >

                            Cancelar

                        </button>

                        <button

                            type="button"

                            disabled={guardando}

                            onClick={async () => {

                                if (

                                    !fechaValija

                                ) {

                                    alert(

                                        "Debe indicar la fecha de recepción de la valija."

                                    );

                                    return;

                                }

                                const seleccionadosGuardar =

                                    registros.filter(

                                        r =>

                                            seleccionados.includes(

                                                r.id

                                            )

                                    );

                                if (

                                    seleccionadosGuardar.length === 0

                                ) {

                                    alert(

                                        "Debe seleccionar al menos un pasaporte."

                                    );

                                    return;

                                }

                                for (

                                    const documento of

                                    seleccionadosGuardar

                                ) {

                                    if (

                                        !documento.numeroPasaporte?.trim()

                                    ) {

                                        alert(

                                            `Debe indicar el número de pasaporte de ${documento.solicitante}.`

                                        );

                                        return;

                                    }

                                    if (

                                        !documento.fechaEmision

                                    ) {

                                        alert(

                                            `Debe indicar la fecha de emisión de ${documento.solicitante}.`

                                        );

                                        return;

                                    }

                                    if (

                                        !documento.fechaVencimiento

                                    ) {

                                        alert(

                                            `Debe indicar la fecha de vencimiento de ${documento.solicitante}.`

                                        );

                                        return;

                                    }

                                    documento.fechaValija =

                                        fechaValija;

                                }

                                try {

                                    setGuardando(

                                        true

                                    );

                                    await onGuardar(

                                        fechaValija,

                                        seleccionadosGuardar

                                    );

                                    onClose();

                                }

                                catch (error) {

                                    console.error(

                                        error

                                    );

                                    alert(

                                        "No fue posible registrar la valija."

                                    );

                                }

                                finally {

                                    setGuardando(

                                        false

                                    );

                                }

                            }}

                            className="

                                bg-blue-700

                                hover:bg-blue-800

                                text-white

                                rounded-xl

                                px-6

                                py-2

                                font-semibold

                                disabled:opacity-50

                            "

                        >

                            {

                                guardando

                                    ? "Guardando..."

                                    : "Guardar"

                            }

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}