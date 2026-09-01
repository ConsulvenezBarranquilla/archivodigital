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

// ======================================================
// Calcular fecha de vencimiento del pasaporte
// ======================================================
//
// Adulto:
//     10 años - 1 día
//
// NNA:
//     5 años - 1 día
//
// ======================================================

function calcularFechaVencimiento(

    fechaEmision: string,

    tipoDocumento: ReporteEntregado["tipoDocumento"]

): string {

    if (!fechaEmision) {

        return "";

    }

    const fecha =
        new Date(
            `${fechaEmision}T00:00:00`
        );

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "";

    }

    const anios =
        tipoDocumento ===
            "PASAPORTE_NNA"
            ? 5
            : 10;

    // Primero agregamos los años.
    fecha.setFullYear(
        fecha.getFullYear() + anios
    );

    // Luego restamos un día.
    fecha.setDate(
        fecha.getDate() - 1
    );

    const year =
        fecha.getFullYear();

    const month =
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            fecha.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

    // ==================================================
    // ¿Es un pasaporte?
    // ==================================================

    const esPasaporte =

        categoria === "PASAPORTES" &&

        (
            documento.tipoDocumento ===
                "PASAPORTE_ADULTO" ||

            documento.tipoDocumento ===
                "PASAPORTE_NNA"
        );
// ==================================================
// ¿Es una VISA NEGADA?
// ==================================================
//
// Una visa negada no requiere número de etiqueta
// ni fecha de vencimiento.
//
// Estos campos permanecen visibles y editables,
// pero dejan de ser obligatorios.
// ==================================================

const esVisaRechazada =
    categoria === "VISA" &&
    String(
        documento.estado ?? ""
    )
        .trim()
        .toUpperCase() === "RECHAZADA";
    // ==================================================
    // Cambio de campo
    // ==================================================

    function cambiarCampo(

        key: string,

        valor: string

    ) {
// ----------------------------------------------
// Tipo de certificado automático
// ----------------------------------------------

if (
    categoria === "CERTIFICADO_USO" &&
    key === "tipoCertificado"
) {

    return;

}
        // ----------------------------------------------
        // Número de pasaporte
        // ----------------------------------------------

        if (
            esPasaporte &&
            key === "numeroPasaporte"
        ) {

            // Solamente números.
            valor =
                valor.replace(
                    /\D/g,
                    ""
                );

            onChange({

                numeroPasaporte:
                    valor,

            });

            return;

        }

        // ----------------------------------------------
        // Fecha de emisión
        // ----------------------------------------------

        if (
            esPasaporte &&
            key === "fechaEmision"
        ) {

            const fechaVencimiento =
                calcularFechaVencimiento(

                    valor,

                    documento.tipoDocumento

                );

            onChange({

                fechaEmision:
                    valor,

                fechaVencimiento:

                    fechaVencimiento ||

                    documento.fechaVencimiento ||

                    "",

            });

            return;

        }
        // ----------------------------------------------
        // N° Etiqueta de VISA
        // ----------------------------------------------

        if (
            categoria === "VISA" &&
            key === "numeroVisa"
        ) {

            // Convertir automáticamente a mayúsculas
            // y permitir solamente letras A-Z y números.

            valor =
                valor
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");

            onChange({

                numeroVisa:
                    valor,

            });

            return;
        }
        // ----------------------------------------------
// Estado de VISA
// ----------------------------------------------

if (
    categoria === "VISA" &&
    key === "estado"
) {

    const estado =
        valor
            .trim()
            .toUpperCase();

    if (
        estado === "RECHAZADA" ||
        estado === "NEGADA"
    ) {

        onChange({
            estado: valor,
            numeroVisa: "",
            fechaVencimiento: "",
        });

        return;

    }

    onChange({
        estado: valor,
    });

    return;
}
        // ----------------------------------------------
        // Cualquier otro campo
        // ----------------------------------------------

        onChange({

            [key]: valor,

        });

    }
// ======================================================
// PODERES
// ======================================================

const esPoder =
    categoria === "PODER";

const esAutorizacionViaje =
    categoria === "AUTORIZACION_VIAJE";

const solicitantesAutorizacion =
    Array.isArray(
        documento.solicitantesAutorizacion
    )
        ? documento.solicitantesAutorizacion.map(
            (solicitante: any) =>
                typeof solicitante === "string"
                    ? {
                        nombre: solicitante,
                        documento: "",
                    }
                    : {
                        nombre:
                            solicitante?.nombre ?? "",
                        documento:
                            solicitante?.documento ?? "",
                    }
        )
        : documento.solicitante
            ? [
                {
                    nombre:
                        documento.solicitante,
                    documento:
                        documento.documento ?? "",
                },
            ]
            : [
                {
                    nombre: "",
                    documento: "",
                },
            ];
    function actualizarSolicitantesAutorizacion(
    valores: {
        nombre: string;
        documento: string;
    }[]
) {
    onChange({
        solicitantesAutorizacion: valores,

        // Compatibilidad con los campos comunes
        solicitante:
            valores[0]?.nombre ?? "",

        documento:
            valores[0]?.documento ?? "",
    });
}

function agregarSolicitanteAutorizacion() {

    if (
        solicitantesAutorizacion.length >= 2
    ) {
        return;
    }

    actualizarSolicitantesAutorizacion([
        ...solicitantesAutorizacion,
        {
            nombre: "",
            documento: "",
        },
    ]);
}

function eliminarSolicitanteAutorizacion(
    indice: number
) {
    if (
        solicitantesAutorizacion.length <= 1
    ) {
        return;
    }

    actualizarSolicitantesAutorizacion(
        solicitantesAutorizacion.filter(
            (_, i) => i !== indice
        )
    );
}

function cambiarSolicitanteAutorizacion(
    indice: number,
    campo:
        | "nombre"
        | "documento",
    valor: string
) {
    const nuevos =
        [...solicitantesAutorizacion];

    nuevos[indice] = {
        ...nuevos[indice],
        [campo]: valor,
    };

    actualizarSolicitantesAutorizacion(
        nuevos
    );
}

const solicitantesPoder =
    Array.isArray(
        documento.solicitantesPoder
    )
        ? documento.solicitantesPoder.map(
            (solicitante: any) =>
                typeof solicitante === "string"
                    ? {
                        nombre: solicitante,
                        documento: "",
                    }
                    : {
                        nombre:
                            solicitante?.nombre ?? "",
                        documento:
                            solicitante?.documento ?? "",
                    }
        )
        : documento.solicitante
            ? [
                {
                    nombre:
                        documento.solicitante,
                    documento:
                        documento.documento ?? "",
                },
            ]
            : [
                {
                    nombre: "",
                    documento: "",
                },
            ];

const apoderadosPoder =
    documento.apoderadosPoder ?? [
        {
            nombre: "",
            documento: "",
        },
    ];

function actualizarSolicitantes(
    valores: {
        nombre: string;
        documento: string;
    }[]
) {
    onChange({
        solicitantesPoder: valores,

        // Compatibilidad con el campo antiguo.
        solicitante:
            valores[0]?.nombre ?? "",

        documento:
            valores[0]?.documento ?? "",
    });
}

function agregarSolicitante() {
    actualizarSolicitantes([
        ...solicitantesPoder,
        {
            nombre: "",
            documento: "",
        },
    ]);
}

function eliminarSolicitante(
    indice: number
) {
    if (
        solicitantesPoder.length <= 1
    ) {
        return;
    }

    actualizarSolicitantes(
        solicitantesPoder.filter(
            (_, i) =>
                i !== indice
        )
    );
}

function cambiarSolicitante(
    indice: number,
    campo:
        | "nombre"
        | "documento",
    valor: string
) {
    const nuevos =
        [...solicitantesPoder];

    nuevos[indice] = {
        ...nuevos[indice],
        [campo]: valor,
    };

    actualizarSolicitantes(
        nuevos
    );
}

function actualizarApoderados(
    valores: {
        nombre: string;
        documento: string;
    }[]
) {

    onChange({
        apoderadosPoder: valores,
    });

}

function agregarApoderado() {

    actualizarApoderados([
        ...apoderadosPoder,

        {
            nombre: "",
            documento: "",
        },
    ]);

}

function eliminarApoderado(
    indice: number
) {

    if (
        apoderadosPoder.length <= 1
    ) {

        return;

    }

    actualizarApoderados(
        apoderadosPoder.filter(
            (_, i) => i !== indice
        )
    );

}

function cambiarApoderado(
    indice: number,
    campo:
        | "nombre"
        | "documento",
    valor: string
) {

    const nuevos =
        [...apoderadosPoder];

    nuevos[indice] = {

        ...nuevos[indice],

        [campo]: valor,

    };

    actualizarApoderados(
        nuevos
    );

}
    return (
    <div className="space-y-5">

        {/* ==========================================
            DOCUMENTO
            Solo editable para CONSTANCIA_CONSULAR
        ========================================== */}

        {categoria === "CONSTANCIA_CONSULAR" &&
            modo === "editar" && (

                <div className="space-y-1">

                    <label
                        className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                        "
                    >
                        Documento

                        <span className="ml-1 text-red-500">
                            *
                        </span>

                    </label>

                    <input
                        type="text"
                        value={documento.documento ?? ""}
                        onChange={e =>
                            cambiarCampo(
                                "documento",
                                e.target.value
                            )
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

                </div>

            )}
{/* ==========================================
    PODER
========================================== */}

{esPoder && (

    <div className="space-y-6">

        {/* ======================================
            TIPO DE PODER
        ====================================== */}

        <div className="space-y-1">

            <label
                className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                "
            >
                Tipo de Poder
            </label>

            <input
                type="text"
                value={
                    documento.tipoPoder ?? ""
                }
                readOnly
                className="
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-slate-100
                    px-3
                    py-2
                    text-slate-600
                    cursor-not-allowed
                "
            />

        </div>


        {/* ======================================
            SOLICITANTES
        ====================================== */}

        <div className="space-y-3">

            <div className="
                flex
                items-center
                justify-between
            ">

                <label
                    className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                    "
                >
                    Solicitantes
                </label>

                <button
                    type="button"
                    onClick={
                        agregarSolicitante
                    }
                    className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-600
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-blue-700
                    "
                >
                    + Agregar
                </button>

            </div>

           {solicitantesPoder.map(
    (
        solicitante,
        indice
    ) => (

        <div
            key={indice}
            className="
                flex
                items-center
                gap-2
            "
        >

            {/* ================================
                NOMBRE DEL SOLICITANTE
            ================================= */}

            <input
                type="text"
                value={
                    solicitante.nombre
                }
                onChange={e =>
                    cambiarSolicitante(
                        indice,
                        "nombre",
                        e.target.value
                    )
                }
                className="
                    flex-1
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    py-2
                    focus:border-blue-600
                    focus:outline-none
                "
                placeholder="Nombre del solicitante"
            />

            {/* ================================
                DOCUMENTO DEL SOLICITANTE
            ================================= */}

            <input
                type="text"
                value={
                    solicitante.documento
                }
                onChange={e =>
                    cambiarSolicitante(
                        indice,
                        "documento",
                        e.target.value
                    )
                }
                className="
                    w-48
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    py-2
                    focus:border-blue-600
                    focus:outline-none
                "
                placeholder="Documento"
            />

            {/* ================================
                ELIMINAR
            ================================= */}

            {solicitantesPoder.length > 1 && (

                <button
                    type="button"
                    onClick={() =>
                        eliminarSolicitante(
                            indice
                        )
                    }
                    className="
                        rounded-full
                        px-3
                        py-2
                        text-red-600
                        hover:bg-red-50
                    "
                    title="Eliminar solicitante"
                >
                    −
                </button>

            )}

        </div>

    )
)}

        </div>


        {/* ======================================
            APODERADOS
        ====================================== */}

        <div className="space-y-3">

            <div className="
                flex
                items-center
                justify-between
            ">

                <label
                    className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                    "
                >
                    Apoderados
                </label>

                <button
                    type="button"
                    onClick={
                        agregarApoderado
                    }
                    className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-600
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-blue-700
                    "
                >
                    + Agregar
                </button>

            </div>


            {apoderadosPoder.map(
                (
                    apoderado,
                    indice
                ) => (

                    <div
                        key={indice}
                        className="
                            rounded-lg
                            border
                            border-slate-200
                            bg-slate-50
                            p-4
                        "
                    >

                        <div className="
                            mb-3
                            flex
                            items-center
                            justify-between
                        ">

                            <span className="
                                text-xs
                                font-semibold
                                text-slate-500
                            ">
                                Apoderado {indice + 1}
                            </span>

                            {apoderadosPoder.length > 1 && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        eliminarApoderado(
                                            indice
                                        )
                                    }
                                    className="
                                        text-sm
                                        font-medium
                                        text-red-600
                                        hover:text-red-700
                                    "
                                >
                                    Eliminar
                                </button>

                            )}

                        </div>


                        <div className="space-y-3">

                            <div>

                                <label className="
                                    mb-1
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                ">
                                    Nombre del Apoderado
                                </label>

                                <input
                                    type="text"
                                    value={
                                        apoderado.nombre
                                    }
                                    onChange={e =>
                                        cambiarApoderado(
                                            indice,
                                            "nombre",
                                            e.target.value
                                        )
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
                                    placeholder="Nombre del apoderado"
                                />

                            </div>


                            <div>

                                <label className="
                                    mb-1
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                ">
                                    Documento del Apoderado
                                </label>

                                <input
                                    type="text"
                                    value={
                                        apoderado.documento
                                    }
                                    onChange={e =>
                                        cambiarApoderado(
                                            indice,
                                            "documento",
                                            e.target.value
                                        )
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
                                    placeholder="Documento"
                                />

                            </div>

                        </div>

                    </div>

                )
            )}

        </div>


        {/* ======================================
            ESTADO
        ====================================== */}

        <div className="space-y-1">

            <label
                className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                "
            >
                Estado
            </label>

            <select
                value={
                    documento.estadoPoder ?? ""
                }
                onChange={e =>
                    onChange({
                        estadoPoder:
                            e.target.value as
                                | "VIGENTE"
                                | "REVOCADO",
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

                <option value="VIGENTE">
                    VIGENTE
                </option>

                <option value="REVOCADO">
                    REVOCADO
                </option>

            </select>

        </div>

    </div>

)}


        {/* ==========================================
            CAMPOS CONFIGURADOS
        ========================================== */}
{/* ==========================================
    AUTORIZACIÓN DE VIAJE
    SOLICITANTES
========================================== */}

{esAutorizacionViaje && (

    <div className="space-y-3">

        <div className="
            flex
            items-center
            justify-between
        ">

            <label className="
                block
                text-sm
                font-medium
                text-slate-700
            ">
                Solicitantes
            </label>

            {solicitantesAutorizacion.length < 2 && (

                <button
                    type="button"
                    onClick={
                        agregarSolicitanteAutorizacion
                    }
                    className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-600
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-blue-700
                    "
                >
                    + Agregar
                </button>

            )}

        </div>

        {solicitantesAutorizacion.map(
            (
                solicitante,
                indice
            ) => (

                <div
                    key={indice}
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    {/* Nombre */}

                    <input
                        type="text"
                        value={
                            solicitante.nombre
                        }
                        onChange={e =>
                            cambiarSolicitanteAutorizacion(
                                indice,
                                "nombre",
                                e.target.value
                            )
                        }
                        className="
                            flex-1
                            rounded-lg
                            border
                            border-slate-300
                            px-3
                            py-2
                            focus:border-blue-600
                            focus:outline-none
                        "
                        placeholder={
                            indice === 0
                                ? "Nombre del solicitante"
                                : "Nombre del segundo solicitante"
                        }
                    />

                    {/* Documento */}

                    <input
                        type="text"
                        value={
                            solicitante.documento
                        }
                        onChange={e =>
                            cambiarSolicitanteAutorizacion(
                                indice,
                                "documento",
                                e.target.value
                            )
                        }
                        className="
                            w-48
                            rounded-lg
                            border
                            border-slate-300
                            px-3
                            py-2
                            focus:border-blue-600
                            focus:outline-none
                        "
                        placeholder="Documento"
                    />

                    {/* Eliminar segundo solicitante */}

                    {solicitantesAutorizacion.length > 1 && (

                        <button
                            type="button"
                            onClick={() =>
                                eliminarSolicitanteAutorizacion(
                                    indice
                                )
                            }
                            className="
                                rounded-full
                                px-3
                                py-2
                                text-red-600
                                hover:bg-red-50
                            "
                            title="Eliminar solicitante"
                        >
                            −
                        </button>

                    )}

                </div>

            )
        )}

    </div>

)}
{/* ==========================================
    TIPO DE DOCUMENTO - APOSTILLA
    Se guarda como OBSERVACIONES (columna M)
========================================== */}

{categoria === "APOSTILLA" &&
    modo === "editar" && (

    <div className="space-y-1">

        <label
            className="
                block
                text-sm
                font-medium
                text-slate-700
            "
        >
            Tipo de Documento
        </label>

        <input
            type="text"
            value={documento.observaciones ?? ""}
            onChange={e =>
                onChange({
                    observaciones:
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
            placeholder="Ej. Titulo de Bachiller, Certificado Titulo en Pergamino..."
        />

    </div>
)}
        {campos.map(campo => {

            const valor =
                (documento as any)[campo.key] ?? "";

            return (

                <div
                    key={campo.key}
                    className="space-y-1"
                >

                    {/* ==================================
                        LABEL
                    ================================== */}

                    <label
                        className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                        "
                    >

                        {campo.label}

                        {(
    campo.requerido &&
    !(
        esVisaRechazada &&
        (
            campo.key === "numeroVisa" ||
            campo.key === "fechaVencimiento"
        )
    )
) && (
    <span
        className="
            ml-1
            text-red-500
        "
    >
        *
    </span>
)}

                    </label>
{esVisaRechazada &&
    categoria === "VISA" &&
    (
        campo.key === "numeroVisa" ||
        campo.key === "fechaVencimiento"
    ) && (
        <p className="mt-1 text-xs text-slate-500">
            No requerido para visas rechazadas.
        </p>
    )}
                    {/* ==================================
                        TIPO CERTIFICADO
                        Solo lectura
                    ================================== */}

                    {categoria === "CERTIFICADO_USO" &&
                        campo.key === "tipoCertificado" && (

                            <input
                                type="text"
                                value={valor}
                                readOnly
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    bg-slate-100
                                    px-3
                                    py-2
                                    text-slate-600
                                    cursor-not-allowed
                                "
                            />

                        )}

                    {/* ==================================
                        INPUT TEXT
                    ================================== */}

                    {campo.type === "text" &&
                        !(
                            categoria === "CERTIFICADO_USO" &&
                            campo.key === "tipoCertificado"
                        ) && (

                            <input
                                type="text"
                                value={valor}
                                inputMode={
                                    esPasaporte &&
                                    campo.key === "numeroPasaporte"
                                        ? "numeric"
                                        : categoria === "VISA" &&
                                            campo.key === "numeroVisa"
                                            ? "text"
                                            : undefined
                                }
                                pattern={
                                    esPasaporte &&
                                    campo.key === "numeroPasaporte"
                                        ? "[0-9]*"
                                        : categoria === "VISA" &&
                                            campo.key === "numeroVisa"
                                            ? "[A-Z0-9]*"
                                            : undefined
                                }
                                onChange={e =>
                                    cambiarCampo(
                                        campo.key,
                                        e.target.value
                                    )
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

                        )}

                    {/* ==================================
                        INPUT DATE
                    ================================== */}

                    {campo.type === "date" && (

                        <input
                            type="date"
                            value={valor}
                            onChange={e =>
                                cambiarCampo(
                                    campo.key,
                                    e.target.value
                                )
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

                    )}

                    {/* ==================================
                        TEXTAREA
                    ================================== */}

                    {campo.type === "textarea" && (

                        <textarea
                            rows={4}
                            value={valor}
                            onChange={e =>
                                cambiarCampo(
                                    campo.key,
                                    e.target.value
                                )
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

                    )}

                    {/* ==================================
                        SELECT
                    ================================== */}

                    {campo.type === "select" && (

                        <select
                            value={valor}
                            onChange={e =>
                                cambiarCampo(
                                    campo.key,
                                    e.target.value
                                )
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

                            {campo.opciones?.map(
                                (opcion) => (

                                    <option
                                        key={opcion}
                                        value={opcion}
                                    >
                                        {opcion}
                                    </option>

                                )
                            )}

                        </select>

                    )}

                    {/* ==================================
                        FECHA VENCIMIENTO PASAPORTE
                    ================================== */}

                    {esPasaporte &&
                        campo.key === "fechaVencimiento" && (

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    text-slate-500
                                "
                            >
                                Calculada automáticamente
                                a partir de la fecha de
                                emisión. Puede modificarla
                                manualmente si es necesario.
                            </p>

                        )}

                </div>

            );

        })}

    </div>
);
}