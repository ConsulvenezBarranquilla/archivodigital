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

    // ==========================================
    // Estado
    // ==========================================

    const [

        fechaValija,

        setFechaValija,

    ] = useState("");

    const [

        seleccionados,

        setSeleccionados,

    ] = useState<string[]>([]);

    const [

        busqueda,

        setBusqueda,

    ] = useState("");

    const [

        guardando,

        setGuardando,

    ] = useState(false);

    // ==========================================
    // Reiniciar al abrir
    // ==========================================

    useEffect(() => {

        if (!open) {

            return;

        }

        setFechaValija("");

        setSeleccionados([]);

        setBusqueda("");

    }, [

        open,

        documentos,

    ]);

    // ==========================================
    // Documentos filtrados
    // ==========================================

    const documentosFiltrados =

        useMemo(() => {

            const textoBusqueda =

                busqueda
                    .trim()
                    .toLowerCase();

            if (!textoBusqueda) {

                return documentos;

            }

            return documentos.filter(

                documento => {

                    const titular =

                        (
                            documento
                                .titularPasaporte ??
                            ""
                        )
                            .toLowerCase();

                    const solicitante =

                        (
                            documento
                                .solicitante ??
                            ""
                        )
                            .toLowerCase();

                    const numeroDocumento =

                        (
                            documento
                                .documento ??
                            ""
                        )
                            .toLowerCase();

                    const recibo =

                        (
                            documento
                                .recibo ??
                            ""
                        )
                            .toLowerCase();

                    return (

                        titular.includes(
                            textoBusqueda
                        ) ||

                        solicitante.includes(
                            textoBusqueda
                        ) ||

                        numeroDocumento.includes(
                            textoBusqueda
                        ) ||

                        recibo.includes(
                            textoBusqueda
                        )

                    );

                }

            );

        }, [

            documentos,

            busqueda,

        ]);

    // ==========================================
    // Cantidad seleccionados
    // ==========================================

    const cantidadSeleccionados =

        seleccionados.length;

    // ==========================================
    // Cantidad seleccionados visibles
    // ==========================================

    const seleccionadosVisibles =

        documentosFiltrados.filter(

            documento =>
                seleccionados.includes(
                    documento.id
                )

        ).length;

    // ==========================================
    // Todos los resultados visibles
    // están seleccionados
    // ==========================================

    const todosVisiblesSeleccionados =

        documentosFiltrados.length > 0 &&

        seleccionadosVisibles ===
            documentosFiltrados.length;

    // ==========================================
    // No renderizar si está cerrado
    // ==========================================

    if (!open) {

        return null;

    }

    // ==========================================
    // Seleccionar / deseleccionar
    // ==========================================

    function cambiarSeleccion(

        id: string,

        seleccionado: boolean

    ) {

        if (seleccionado) {

            setSeleccionados(

                actuales => {

                    if (
                        actuales.includes(id)
                    ) {

                        return actuales;

                    }

                    return [

                        ...actuales,

                        id,

                    ];

                }

            );

            return;

        }

        setSeleccionados(

            actuales =>
                actuales.filter(
                    actual =>
                        actual !== id
                )

        );

    }

    // ==========================================
    // Seleccionar todos los visibles
    // ==========================================

    function alternarTodosVisibles() {

        if (
            documentosFiltrados.length === 0
        ) {

            return;

        }

        if (
            todosVisiblesSeleccionados
        ) {

            const idsVisibles =

                new Set(

                    documentosFiltrados.map(
                        documento =>
                            documento.id
                    )

                );

            setSeleccionados(

                actuales =>
                    actuales.filter(
                        id =>
                            !idsVisibles.has(id)
                    )

            );

            return;

        }

        setSeleccionados(

            actuales => {

                const nuevos = [
                    ...actuales,
                ];

                for (

                    const documento of
                    documentosFiltrados

                ) {

                    if (
                        !nuevos.includes(
                            documento.id
                        )
                    ) {

                        nuevos.push(
                            documento.id
                        );

                    }

                }

                return nuevos;

            }

        );

    }

    // ==========================================
    // Obtener tipo
    // ==========================================

    function obtenerTipo(

        documento: ReporteEntregado

    ): string {

        if (

            documento.tipoDocumento ===
            "PASAPORTE_NNA"

        ) {

            return "NNA";

        }

        return "Adulto";

    }

    // ==========================================
    // Obtener representante legal
    // ==========================================

    function obtenerRepresentanteLegal(

        documento: ReporteEntregado

    ): string {

        if (

            documento.tipoDocumento ===
            "PASAPORTE_NNA"

        ) {

            return (

                documento.solicitante ||

                "-"

            );

        }

        return "-";

    }

    // ==========================================
    // Guardar
    // ==========================================

    async function guardar() {

        if (!fechaValija) {

            alert(
                "Debe indicar la fecha de recepción de la valija."
            );

            return;

        }

        const documentosSeleccionados =

            documentos.filter(

                documento =>
                    seleccionados.includes(
                        documento.id
                    )

            );

        if (
            documentosSeleccionados.length === 0
        ) {

            alert(
                "Debe seleccionar al menos un pasaporte."
            );

            return;

        }

        // ======================================
        // Registrar únicamente fechaValija
        // ======================================

        const documentosGuardar =

            documentosSeleccionados.map(

                documento => ({

                    ...documento,

                    fechaValija,

                })

            );

        try {

            setGuardando(true);

            await onGuardar(

                fechaValija,

                documentosGuardar

            );

            onClose();

        }

        catch (error) {

            console.error(

                "Registrar Valija:",

                error

            );

            alert(
                "No fue posible registrar la valija."
            );

        }

        finally {

            setGuardando(false);

        }

    }

    // ==========================================
    // Render
    // ==========================================

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

                {/* ==================================
                    Encabezado
                ================================== */}

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

                        Seleccione los pasaportes recibidos e indique la fecha de la valija.

                    </p>

                </div>

                {/* ==================================
                    Fecha + buscador
                ================================== */}

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
                            grid
                            grid-cols-1
                            md:grid-cols-[auto_1fr]
                            gap-6
                            items-end
                        "

                    >

                        {/* Fecha */}

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

                                value={
                                    fechaValija
                                }

                                onChange={

                                    e =>
                                        setFechaValija(
                                            e.target.value
                                        )

                                }

                                className="
                                    border
                                    border-slate-300
                                    rounded-lg
                                    px-3
                                    py-2
                                    bg-white
                                    focus:border-blue-600
                                    focus:outline-none
                                "

                            />

                        </div>

                        {/* Buscador */}

                        <div>

                            <label

                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    mb-2
                                "

                            >

                                Buscar pasaporte

                            </label>

                            <div

                                className="
                                    relative
                                "

                            >

                                <span

                                    className="
                                        absolute
                                        left-3
                                        top-1/2
                                        -translate-y-1/2
                                        text-slate-400
                                    "

                                >

                                    🔎

                                </span>

                                <input

                                    type="text"

                                    value={
                                        busqueda
                                    }

                                    onChange={

                                        e =>
                                            setBusqueda(
                                                e.target.value
                                            )

                                    }

                                    placeholder="
                                        Nombre, documento o recibo...
                                    "

                                    className="
                                        w-full
                                        border
                                        border-slate-300
                                        rounded-lg
                                        pl-10
                                        pr-10
                                        py-2
                                        bg-white
                                        focus:border-blue-600
                                        focus:outline-none
                                    "

                                />

                                {

                                    busqueda && (

                                        <button

                                            type="button"

                                            onClick={() =>
                                                setBusqueda("")
                                            }

                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                                hover:text-slate-700
                                            "

                                            title="Limpiar búsqueda"

                                        >

                                            ✕

                                        </button>

                                    )

                                }

                            </div>

                        </div>

                    </div>

                    {/* ==================================
                        Información del filtro
                    ================================== */}

                    <div

                        className="
                            mt-4
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-3
                            text-sm
                            text-slate-600
                        "

                    >

                        <span>

                            Mostrando

                            {" "}

                            <strong>

                                {
                                    documentosFiltrados.length
                                }

                            </strong>

                            {" "}

                            de

                            {" "}

                            <strong>

                                {
                                    documentos.length
                                }

                            </strong>

                            {" "}

                            pasaportes

                        </span>

                        <span>

                            Seleccionados:

                            {" "}

                            <strong>

                                {
                                    cantidadSeleccionados
                                }

                            </strong>

                        </span>

                    </div>

                </div>

                {/* ==================================
    Tabla
================================== */}

<div
    className="
        flex-1
        min-h-0
        px-6
        pb-2
        flex
        flex-col
    "
>
    {/* ==================================
        Encabezado fijo
    ================================== */}

    <div
        className="
            flex-none
            bg-slate-100
            border-b
            border-slate-300
            shadow-sm
            z-20
        "
    >
        <table
            className="
                w-full
                text-sm
                border-separate
                border-spacing-0
                table-fixed
            "
        >
            <thead>
                <tr
                    className="
                        bg-slate-100
                        text-slate-700
                    "
                >
                    {/* Selección */}

                    <th
                        className="
                            p-3
                            w-12
                            text-center
                            bg-slate-100
                        "
                    >
                        <input
                            type="checkbox"
                            checked={
                                todosVisiblesSeleccionados
                            }
                            onChange={
                                alternarTodosVisibles
                            }
                            disabled={
                                documentosFiltrados.length ===
                                0
                            }
                            title="Seleccionar todos los visibles"
                        />
                    </th>

                    {/* Titular */}

                    <th
                        className="
                            p-3
                            text-left
                            bg-slate-100
                        "
                    >
                        Titular
                    </th>

                    {/* Tipo */}

                    <th
                        className="
                            p-3
                            text-left
                            bg-slate-100
                            w-[105px]
                        "
                    >
                        Tipo
                    </th>

                    {/* Representante Legal */}

                    <th
                        className="
                            p-3
                            text-left
                            bg-slate-100
                        "
                    >
                        Representante Legal
                    </th>

                    {/* Observaciones */}

                    <th
                        className="
                            p-3
                            text-left
                            bg-slate-100
                        "
                    >
                        Observaciones
                    </th>
                </tr>
            </thead>
        </table>
    </div>

    {/* ==================================
        Cuerpo con scroll
    ================================== */}

    <div
        className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
        "
    >
        <table
            className="
                w-full
                text-sm
                border-separate
                border-spacing-0
                table-fixed
            "
        >
            <tbody>
                {
                    documentosFiltrados.map(

                        documento => {

                            const seleccionado =
                                seleccionados.includes(
                                    documento.id
                                );

                            return (

                                <tr
                                    key={
                                        documento.id
                                    }
                                    className="
                                        hover:bg-slate-50
                                    "
                                >

                                    {/* ==================================
                                        Selección
                                    ================================== */}

                                    <td
                                        className="
                                            px-3
                                            py-3
                                            text-center
                                            border-b
                                            border-slate-200
                                            bg-white
                                            w-12
                                        "
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                seleccionado
                                            }
                                            onChange={
                                                e =>
                                                    cambiarSeleccion(
                                                        documento.id,
                                                        e.target.checked
                                                    )
                                            }
                                        />
                                    </td>

                                    {/* ==================================
                                        Titular
                                    ================================== */}

                                    <td
                                        className="
                                            px-3
                                            py-3
                                            font-medium
                                            text-slate-800
                                            border-b
                                            border-slate-200
                                            bg-white
                                        "
                                    >
                                        {
                                            documento.titularPasaporte ||
                                            documento.solicitante ||
                                            "-"
                                        }
                                    </td>

                                    {/* ==================================
                                        Tipo
                                    ================================== */}

                                    <td
                                        className="
                                            px-3
                                            py-3
                                            border-b
                                            border-slate-200
                                            bg-white
                                            w-[105px]
                                        "
                                    >
                                        <span
                                            className={`
                                                inline-flex
                                                items-center
                                                rounded-full
                                                px-2.5
                                                py-1
                                                text-xs
                                                font-semibold
                                                ${
                                                    documento.tipoDocumento ===
                                                    "PASAPORTE_NNA"

                                                        ? "bg-amber-100 text-amber-700"

                                                        : "bg-blue-100 text-blue-700"
                                                }
                                            `}
                                        >
                                            {
                                                obtenerTipo(
                                                    documento
                                                )
                                            }
                                        </span>
                                    </td>

                                    {/* ==================================
                                        Representante Legal
                                    ================================== */}

                                    <td
                                        className="
                                            px-3
                                            py-3
                                            text-slate-700
                                            border-b
                                            border-slate-200
                                            bg-white
                                        "
                                    >
                                        {
                                            obtenerRepresentanteLegal(
                                                documento
                                            )
                                        }
                                    </td>

                                    {/* ==================================
                                        Observaciones
                                    ================================== */}

                                    <td
                                        className="
                                            px-3
                                            py-3
                                            text-slate-600
                                            border-b
                                            border-slate-200
                                            bg-white
                                        "
                                    >
                                        <div
                                            className="
                                                whitespace-pre-wrap
                                                break-words
                                            "
                                        >
                                            {
                                                documento.observaciones ||
                                                "-"
                                            }
                                        </div>
                                    </td>

                                </tr>

                            );

                        }

                    )
                }
            </tbody>
        </table>

        {/* ==================================
            Sin resultados
        ================================== */}

        {
            documentosFiltrados.length ===
            0 && (

                <div
                    className="
                        py-12
                        text-center
                        text-slate-500
                    "
                >
                    {
                        busqueda

                            ? "No se encontraron pasaportes con ese criterio."

                            : "No hay pasaportes disponibles para registrar."
                    }
                </div>

            )
        }
    </div>
</div>

                {/* ==================================
                    Barra inferior
                ================================== */}

                <div

                    className="
                        border-t
                        bg-slate-50
                        px-8
                        py-5
                        flex
                        flex-col
                        md:flex-row
                        items-center
                        justify-between
                        gap-4
                    "

                >

                    <div

                        className="
                            flex
                            items-center
                            gap-6
                        "

                    >

                        <button

                            type="button"

                            onClick={
                                alternarTodosVisibles
                            }

                            disabled={

                                documentosFiltrados.length ===
                                0

                            }

                            className="
                                text-blue-700
                                hover:text-blue-900
                                font-semibold
                                disabled:opacity-50
                            "

                        >

                            {

                                todosVisiblesSeleccionados

                                    ? "Deseleccionar visibles"

                                    : "Seleccionar visibles"

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

                            {" "}

                            pasaporte(s) seleccionado(s)

                        </span>

                    </div>

                    <div

                        className="
                            flex
                            gap-3
                        "

                    >

                        <button

                            type="button"

                            onClick={
                                onClose
                            }

                            disabled={
                                guardando
                            }

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

                            disabled={

                                guardando ||

                                documentos.length ===
                                0

                            }

                            onClick={
                                guardar
                            }

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

                                    : "Registrar Valija"

                            }

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}