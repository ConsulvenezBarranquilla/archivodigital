"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    ReporteEntregado,
} from "@/types/ReporteEntregado";

interface Props {

    open: boolean;

    usuario: string;

    onClose: () => void;

    onGuardar: (
        documento: ReporteEntregado
    ) => Promise<void>;

}

export default function ModalNuevaConstancia({

    open,

    usuario,

    onClose,

    onGuardar,

}: Props) {

    // ==========================================
    // DATOS DEL TITULAR
    // ==========================================

    const [
        solicitante,
        setSolicitante,
    ] = useState("");

    const [
        documento,
        setDocumento,
    ] = useState("");

    // ==========================================
    // DATOS DE LA CONSTANCIA
    // ==========================================

    const [
        fechaConstancia,
        setFechaConstancia,
    ] = useState("");

    const [
        correlativoConstancia,
        setCorrelativoConstancia,
    ] = useState("");

    const [
        observaciones,
        setObservaciones,
    ] = useState("");

    // ==========================================
    // GUARDANDO
    // ==========================================

    const [
        guardando,
        setGuardando,
    ] = useState(false);

    // ==========================================
    // LIMPIAR FORMULARIO
    // ==========================================

    function limpiarFormulario() {

        setSolicitante("");

        setDocumento("");

        setFechaConstancia("");

        setCorrelativoConstancia("");

        setObservaciones("");

        setGuardando(false);

    }

    // ==========================================
    // CERRAR
    // ==========================================

    function cerrar() {

        if (guardando) {
            return;
        }

        limpiarFormulario();

        onClose();

    }

    // ==========================================
    // CERRAR CON ESC
    // ==========================================

    useEffect(() => {

        if (!open) {
            return;
        }

        function manejarTecla(
            event: KeyboardEvent
        ) {

            if (
                event.key === "Escape"
            ) {

                cerrar();

            }

        }

        window.addEventListener(
            "keydown",
            manejarTecla
        );

        return () => {

            window.removeEventListener(
                "keydown",
                manejarTecla
            );

        };

    }, [
        open,
        guardando,
    ]);

    // ==========================================
    // GUARDAR
    // ==========================================

    async function guardar() {

        const solicitanteLimpio =
            solicitante.trim();

        const documentoLimpio =
            documento.trim();

        const fechaLimpia =
            fechaConstancia.trim();

        const correlativoLimpio =
            correlativoConstancia.trim();

        // --------------------------------------
        // Validaciones
        // --------------------------------------

        if (
            solicitanteLimpio === ""
        ) {

            alert(
                "Debe indicar el nombre del solicitante."
            );

            return;

        }

        if (
            documentoLimpio === ""
        ) {

            alert(
                "Debe indicar el documento de identidad."
            );

            return;

        }

        if (
            fechaLimpia === ""
        ) {

            alert(
                "Debe indicar la fecha de la constancia."
            );

            return;

        }

        if (
            correlativoLimpio === ""
        ) {

            alert(
                "Debe indicar el correlativo de la constancia."
            );

            return;

        }

        // --------------------------------------
        // Construir documento
        // --------------------------------------

        const nuevoDocumento:
            ReporteEntregado = {

            // ----------------------------------
            // ID temporal
            // ----------------------------------

            id:
                `MANUAL-CONSTANCIA-${Date.now()}`,

            // ----------------------------------
            // Categoría
            // ----------------------------------

            categoria:
                "CONSTANCIA_CONSULAR",

            // ----------------------------------
            // Tipo
            // ----------------------------------

            tipoDocumento:
                "CONSTANCIA_CONSULAR",

            // ----------------------------------
// No existe recibo de Caja
// ----------------------------------

recibo: "",

fechaRecibo: "",

            // ----------------------------------
            // No existe planilla de GC
            // ----------------------------------

            planillaGC:
                "",

            // ----------------------------------
            // Datos del titular
            // ----------------------------------

            solicitante:
                solicitanteLimpio,

            documento:
                documentoLimpio,

            // ----------------------------------
            // Estado
            // ----------------------------------

            estado:
                "MANUAL",

            estadoProcesamiento:
                "PROCESADO",

            // ----------------------------------
            // Constancia
            // ----------------------------------

            fechaConstancia:
                fechaLimpia,

            correlativoConstancia:
                correlativoLimpio,

            // ----------------------------------
            // Observaciones
            // ----------------------------------

            observaciones:
                observaciones.trim(),

            // ----------------------------------
            // Entrega
            // ----------------------------------

            entregado:
                false,

            fechaEntrega:
                "",

            entregadoPor:
                "",

        };

        // --------------------------------------
// Enviar al componente padre
// --------------------------------------

setGuardando(true);

try {

    await onGuardar(
        nuevoDocumento
    );

    limpiarFormulario();

}

catch (error) {

    console.error(
        "Error creando constancia manual:",
        error
    );

    alert(
        "No fue posible crear la constancia."
    );

}

finally {

    setGuardando(false);

}
    }

    // ==========================================
    // NO MOSTRAR
    // ==========================================

    if (!open) {

        return null;

    }

    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/40
                px-4
                py-6
            "
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    cerrar();

                }

            }}
        >

            <div
                className="
                    w-full
                    max-w-2xl
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
            >

                {/* ==================================
                    CABECERA
                ================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-200
                        px-6
                        py-4
                    "
                >

                    <div>

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-blue-950
                            "
                        >

                            Nueva Constancia Consular

                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >

                            Registro manual de constancia

                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={cerrar}
                        disabled={guardando}
                        className="
                            rounded-lg
                            px-3
                            py-2
                            text-xl
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                            disabled:cursor-not-allowed
                        "
                        title="Cerrar"
                    >

                        ×

                    </button>

                </div>

                {/* ==================================
                    CONTENIDO
                ================================== */}

                <div
                    className="
                        space-y-5
                        px-6
                        py-6
                    "
                >

                    {/* ==================================
                        AVISO
                    ================================== */}

                    <div
                        className="
                            rounded-xl
                            border
                            border-blue-200
                            bg-blue-50
                            px-4
                            py-3
                            text-sm
                            text-blue-800
                        "
                    >

                        Esta opción permite registrar una
                        constancia que no proviene de
                        Facturación de Caja ni de Gestión
                        Consular.

                    </div>

                    {/* ==================================
                        SOLICITANTE
                    ================================== */}

                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-4
                            md:grid-cols-2
                        "
                    >

                        <div
                            className="
                                space-y-1
                                md:col-span-2
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >

                                Nombre del solicitante
                                <span
                                    className="
                                        ml-1
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                            </label>

                            <input
                                type="text"
                                value={
                                    solicitante
                                }
                                onChange={(event) =>
                                    setSolicitante(
                                        event.target.value
                                    )
                                }
                                placeholder="
                                    Nombre completo
                                "
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-3
                                    py-2
                                    outline-none
                                    transition
                                    focus:border-blue-600
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                        {/* ==================================
                            DOCUMENTO
                        ================================== */}

                        <div
                            className="
                                space-y-1
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >

                                Documento
                                <span
                                    className="
                                        ml-1
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                            </label>

                            <input
                                type="text"
                                value={
                                    documento
                                }
                                onChange={(event) =>
                                    setDocumento(
                                        event.target.value
                                    )
                                }
                                placeholder="
                                    Cédula o pasaporte
                                "
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-3
                                    py-2
                                    uppercase
                                    outline-none
                                    transition
                                    focus:border-blue-600
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                        {/* ==================================
                            FECHA
                        ================================== */}

                        <div
                            className="
                                space-y-1
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >

                                Fecha de la constancia
                                <span
                                    className="
                                        ml-1
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                            </label>

                            <input
                                type="date"
                                value={
                                    fechaConstancia
                                }
                                onChange={(event) =>
                                    setFechaConstancia(
                                        event.target.value
                                    )
                                }
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-3
                                    py-2
                                    outline-none
                                    transition
                                    focus:border-blue-600
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                        {/* ==================================
                            CORRELATIVO
                        ================================== */}

                        <div
                            className="
                                space-y-1
                                md:col-span-2
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >

                                N° de constancia
                                <span
                                    className="
                                        ml-1
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                            </label>

                            <input
                                type="text"
                                value={
                                    correlativoConstancia
                                }
                                onChange={(event) =>
                                    setCorrelativoConstancia(
                                        event.target.value
                                    )
                                }
                                placeholder="
                                    Número o correlativo de la constancia
                                "
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-3
                                    py-2
                                    outline-none
                                    transition
                                    focus:border-blue-600
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                        {/* ==================================
                            OBSERVACIONES
                        ================================== */}

                        <div
                            className="
                                space-y-1
                                md:col-span-2
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >

                                Observaciones

                            </label>

                            <textarea
                                rows={3}
                                value={
                                    observaciones
                                }
                                onChange={(event) =>
                                    setObservaciones(
                                        event.target.value
                                    )
                                }
                                placeholder="
                                    Información adicional...
                                "
                                className="
                                    w-full
                                    resize-none
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-3
                                    py-2
                                    outline-none
                                    transition
                                    focus:border-blue-600
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                    </div>

                    {/* ==================================
                        USUARIO
                    ================================== */}

                    <div
                        className="
                            rounded-lg
                            bg-slate-50
                            px-4
                            py-3
                            text-sm
                            text-slate-600
                        "
                    >

                        Registrado por:

                        <span
                            className="
                                ml-1
                                font-semibold
                                text-slate-800
                            "
                        >

                            {usuario || "Usuario actual"}

                        </span>

                    </div>

                </div>

                {/* ==================================
                    FOOTER
                ================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-end
                        gap-3
                        border-t
                        border-slate-200
                        bg-slate-50
                        px-6
                        py-4
                    "
                >

                    <button
                        type="button"
                        onClick={cerrar}
                        disabled={guardando}
                        className="
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-5
                            py-2
                            text-sm
                            font-semibold
                            text-slate-700
                            transition
                            hover:bg-slate-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        Cancelar

                    </button>

                    <button
                        type="button"
                        onClick={guardar}
                        disabled={guardando}
                        className="
                            rounded-lg
                            bg-blue-700
                            px-5
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        {guardando
                            ? "Guardando..."
                            : "Crear Constancia"
                        }

                    </button>

                </div>

            </div>

        </div>

    );

}