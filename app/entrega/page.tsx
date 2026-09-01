"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import SistemaLayout from "@/components/layout/SistemaLayout";

import DataTable, {
    TableColumn,
} from "@/components/table/DataTable";

import {
    CategoriaDocumento,
    ReporteEntregado,
} from "@/types/ReporteEntregado";

import {
    MODULOS,
} from "@/lib/modulos";

// ======================================================
// Respuesta API
// ======================================================

interface EntregaResponse {

    ok: boolean;

    total: number;

    pendientes?: number;

    entregados?: number;

    documentos: ReporteEntregado[];

    error?: string;

}

// ======================================================
// Modo de búsqueda
// ======================================================

type ModoBusqueda =
    | "NOMBRE"
    | "DOCUMENTO";

// ======================================================
// Categorías
// ======================================================

const ETIQUETAS_CATEGORIA:
    Record<CategoriaDocumento, string> = {

    PASAPORTES:
        "Pasaportes",

    VISA:
        "Visas",

    APOSTILLA:
        "Apostillas",

    FE_VIDA:
        "Fe de Vida",

    CARTA_SOLTERIA:
        "Carta de Soltería",

    CERTIFICADO_USO:
        "Certificado de Uso",

    CONSTANCIA_REGISTRO:
        "Constancia de Registro",

    CONSTANCIA_CONSULAR:
        "Constancia Consular",

    PODER:
        "Poderes",

    AUTORIZACION_VIAJE:
        "Autorización de Viaje",

};

// ======================================================
// Página
// ======================================================

export default function EntregaPage() {

    // ==================================================
    // DOCUMENTOS
    // ==================================================

    const [
        documentos,
        setDocumentos,
    ] = useState<ReporteEntregado[]>([]);

    const [
        cargando,
        setCargando,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    // ==================================================
    // MODO DE BÚSQUEDA
    // ==================================================

    const [
        modoBusqueda,
        setModoBusqueda,
    ] = useState<ModoBusqueda | null>(
        null
    );

    // ==================================================
    // BÚSQUEDA PRINCIPAL
    //
    // NOMBRE:
    //   búsqueda por nombre
    //
    // DOCUMENTO:
    //   búsqueda por documento de identidad
    // ==================================================

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    // ==================================================
    // FILTRO POR NOMBRE
    //
    // Se utiliza solamente en modo DOCUMENTO.
    // ==================================================

    const [
        filtroNombre,
        setFiltroNombre,
    ] = useState("");

    // ==================================================
    // FILTRO POR CATEGORÍA
    // ==================================================

    const [
        categoria,
        setCategoria,
    ] = useState<
        CategoriaDocumento | "TODOS"
    >("TODOS");

    // ==================================================
    // ENTREGA
    // ==================================================

    const [
        confirmando,
        setConfirmando,
    ] = useState<ReporteEntregado | null>(
        null
    );

    const [
        entregandoId,
        setEntregandoId,
    ] = useState<string | null>(
        null
    );

    // ==================================================
    // USUARIO
    // ==================================================

    const [
        usuario,
        setUsuario,
    ] = useState("");

    // ==================================================
    // OBTENER USUARIO
    // ==================================================

    useEffect(() => {

        try {

            const usuarioGuardado =
                localStorage.getItem(
                    "usuarioCaja"
                );

            if (!usuarioGuardado) {
                return;
            }

            try {

                const datos =
                    JSON.parse(
                        usuarioGuardado
                    );

                setUsuario(
                    datos?.nombre ??
                    usuarioGuardado
                );

            }

            catch {

                setUsuario(
                    usuarioGuardado
                );

            }

        }

        catch (error) {

            console.error(
                "No fue posible obtener el usuario:",
                error
            );

        }

    }, []);

    // ==================================================
    // CARGAR DOCUMENTOS
    // ==================================================

    async function cargarDocumentos() {

        try {

            setCargando(true);

            setError("");

            const response =
                await fetch(
                    "/api/entrega",
                    {
                        cache:
                            "no-store",
                    }
                );

            const data:
                EntregaResponse =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {

                throw new Error(
                    data.error ||
                    "No fue posible cargar los documentos."
                );

            }

            setDocumentos(
                data.documentos || []
            );

        }

        catch (error: any) {

            console.error(
                "Error cargando documentos:",
                error
            );

            setError(
                error?.message ||
                "No fue posible cargar los documentos."
            );

            setDocumentos([]);

        }

        finally {

            setCargando(false);

        }

    }

    useEffect(() => {

        cargarDocumentos();

    }, []);

    // ==================================================
    // OBTENER VALORES DE BÚSQUEDA
    // ==================================================

    function valoresBusqueda(
        documento: ReporteEntregado
    ): string[] {

        const valores: string[] = [

            documento.solicitante ?? "",

            documento.documento ?? "",

            documento.titularPasaporte ?? "",

            documento.numeroPasaporte ?? "",

            documento.titularVisa ?? "",

            documento.pasaporteTitularVisa ?? "",

            documento.titularApostilla ?? "",

            documento.menor ?? "",

            documento.pasaporteMenor ?? "",

            documento.acompanante ?? "",

            documento.pasaporteAcompanante ?? "",

        ];

        // ==================================================
        // PODERES
        // ==================================================

        if (
            Array.isArray(
                documento.solicitantesPoder
            )
        ) {

            documento.solicitantesPoder.forEach(
                item => {

                    valores.push(
                        item.nombre ?? "",
                        item.documento ?? ""
                    );

                }
            );

        }

        if (
            Array.isArray(
                documento.apoderadosPoder
            )
        ) {

            documento.apoderadosPoder.forEach(
                item => {

                    valores.push(
                        item.nombre ?? "",
                        item.documento ?? ""
                    );

                }
            );

        }

        // ==================================================
        // AUTORIZACIÓN DE VIAJE
        // ==================================================

        if (
            Array.isArray(
                documento.solicitantesAutorizacion
            )
        ) {

            documento.solicitantesAutorizacion.forEach(
                item => {

                    valores.push(
                        item.nombre ?? "",
                        item.documento ?? ""
                    );

                }
            );

        }

        return valores
            .filter(Boolean)
            .map(
                valor =>
                    String(valor)
                        .trim()
                        .toLowerCase()
            );

    }

    // ==================================================
    // OBTENER TITULAR PARA MOSTRAR
    // ==================================================

    function obtenerTitular(
        documento: ReporteEntregado
    ): string {

        // ----------------------------------------------
        // Pasaportes
        // ----------------------------------------------

        if (
            documento.categoria ===
            "PASAPORTES"
        ) {

            return (
                documento.titularPasaporte ||
                documento.solicitante ||
                "-"
            );

        }

        // ----------------------------------------------
        // Apostillas
        // ----------------------------------------------

        if (
            documento.categoria ===
            "APOSTILLA"
        ) {

            return (
                documento.titularApostilla ||
                documento.solicitante ||
                "-"
            );

        }

        // ----------------------------------------------
        // Visa
        // ----------------------------------------------

        if (
            documento.categoria ===
            "VISA"
        ) {

            return (
                documento.titularVisa ||
                documento.solicitante ||
                "-"
            );

        }

        // ----------------------------------------------
        // Autorización de viaje
        // ----------------------------------------------

        if (
            documento.categoria ===
            "AUTORIZACION_VIAJE"
        ) {

            return (
                documento.menor ||
                documento.solicitante ||
                "-"
            );

        }

        // ----------------------------------------------
        // Resto
        // ----------------------------------------------

        return (
            documento.solicitante ||
            "-"
        );

    }

    // ==================================================
    // FILTRAR DOCUMENTOS
    // ==================================================

    const documentosVisibles =
        useMemo(() => {

            // ==================================================
            // No se ha seleccionado búsqueda
            // ==================================================

            if (!modoBusqueda) {

                return [];

            }

            let resultado =
                [...documentos];

            // ==================================================
            // BUSCAR POR NOMBRE
            //
            // En este modo:
            // - el usuario busca una persona
            // - se muestran TODOS sus documentos
            // - pendientes y entregados
            //
            // Esto permite que al entregar un documento
            // permanezca visible y cambie a verde.
            // ==================================================

            if (
                modoBusqueda ===
                "NOMBRE"
            ) {

                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();

                if (!texto) {

                    return [];

                }

                resultado =
                    resultado.filter(
                        documento =>

                            valoresBusqueda(
                                documento
                            ).some(
                                valor =>
                                    valor.includes(
                                        texto
                                    )
                            )
                    );

                return resultado;

            }

            // ==================================================
            // BUSCAR POR DOCUMENTO
            //
            // Se muestra la tabla general.
            // ==================================================

            // ----------------------------------------------
            // Categoría
            // ----------------------------------------------

            if (
                categoria !==
                "TODOS"
            ) {

                resultado =
                    resultado.filter(
                        documento =>

                            documento.categoria ===
                            categoria
                    );

            }

            // ----------------------------------------------
            // Filtro por nombre
            // ----------------------------------------------

            const textoNombre =
                filtroNombre
                    .trim()
                    .toLowerCase();

            if (
                textoNombre
            ) {

                resultado =
                    resultado.filter(
                        documento =>

                            valoresBusqueda(
                                documento
                            ).some(
                                valor =>
                                    valor.includes(
                                        textoNombre
                                    )
                            )
                    );

            }

            // ----------------------------------------------
            // Documento de identidad
            // ----------------------------------------------

            const textoDocumento =
                busqueda
                    .trim()
                    .toLowerCase();

            if (
                textoDocumento
            ) {

                resultado =
                    resultado.filter(
                        documento =>

                            valoresBusqueda(
                                documento
                            ).some(
                                valor =>
                                    valor.includes(
                                        textoDocumento
                                    )
                            )
                    );

            }

            return resultado;

        }, [

            documentos,

            modoBusqueda,

            busqueda,

            filtroNombre,

            categoria,

        ]);

    // ==================================================
    // CONTADORES
    //
    // Se calculan sobre documentosVisibles.
    // ==================================================

    const totalPendientes =
        useMemo(() => {

            return documentosVisibles.filter(

                documento =>

                    documento.entregado !== true

            ).length;

        }, [

            documentosVisibles,

        ]);

    const totalEntregados =
        useMemo(() => {

            return documentosVisibles.filter(

                documento =>

                    documento.entregado === true

            ).length;

        }, [

            documentosVisibles,

        ]);

    // ==================================================
    // SELECCIONAR MODO
    // ==================================================

    function seleccionarModo(
        modo: ModoBusqueda
    ) {

        setModoBusqueda(
            modo
        );

        setBusqueda("");

        setFiltroNombre("");

        setCategoria(
            "TODOS"
        );

    }

    // ==================================================
    // VOLVER A SELECCIÓN
    // ==================================================

    function volverSeleccionBusqueda() {

        setModoBusqueda(
            null
        );

        setBusqueda("");

        setFiltroNombre("");

        setCategoria(
            "TODOS"
        );

    }

    // ==================================================
    // CONFIRMAR ENTREGA
    // ==================================================

    async function confirmarEntrega() {

        if (!confirmando) {

            return;

        }

        if (!usuario) {

            alert(
                "No fue posible identificar el usuario que realiza la entrega."
            );

            return;

        }

        try {

            setEntregandoId(
                confirmando.id
            );

            const fechaEntrega =
                new Date()
                    .toISOString()
                    .substring(
                        0,
                        10
                    );

            // ==================================================
            // REGISTRAR EXCLUSIVAMENTE EN LA API DE ENTREGA
            //
            // IMPORTANTE:
            // No utilizamos marcarEntregado() del servicio
            // ReportesEntregados.
            //
            // Esto mantiene completamente independiente
            // la página reportesentregados/page.tsx.
            // ==================================================

            const response =
                await fetch(
                    "/api/entrega/registrar",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({

                                usuario,

                                documento:
                                    confirmando,

                                fechaEntrega,

                                observaciones:
                                    confirmando.observaciones ??
                                    "",

                            }),

                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {

                throw new Error(
                    data.error ||
                    "No fue posible registrar la entrega."
                );

            }

            // ==================================================
            // ACTUALIZAR EL ESTADO LOCAL
            //
            // NO eliminamos la fila.
            // ==================================================

            setDocumentos(
                documentosActuales =>

                    documentosActuales.map(
                        documento => {

                            if (
                                documento.id !==
                                confirmando.id
                            ) {

                                return documento;

                            }

                            return {

                                ...documento,

                                entregado:
                                    true,

                                fechaEntrega,

                                entregadoPor:
                                    usuario,

                            };

                        }
                    )

            );

            setConfirmando(
                null
            );

        }

        catch (error: any) {

            console.error(
                "Error registrando entrega:",
                error
            );

            alert(
                error?.message ||
                "No fue posible registrar la entrega."
            );

        }

        finally {

            setEntregandoId(
                null
            );

        }

    }

    // ==================================================
    // COLUMNAS
    // ==================================================

    const columnas:
        TableColumn<ReporteEntregado>[] =
        [

            // ------------------------------------------
            // CATEGORÍA
            // ------------------------------------------

            {

                field:
                    "categoria",

                title:
                    "Tipo de documento",

                render:
                    documento =>

                        ETIQUETAS_CATEGORIA[
                            documento.categoria
                        ] ??
                        documento.categoria,

            },

            // ------------------------------------------
            // TITULAR
            // ------------------------------------------

            {

                field:
                    "solicitante",

                title:
                    "Titular",

                render:
                    documento =>

                        obtenerTitular(
                            documento
                        ),

            },

            // ------------------------------------------
            // DOCUMENTO
            // ------------------------------------------

            {

                field:
                    "documento",

                title:
                    "Documento",

                render:
                    documento =>

                        documento.documento ||
                        "-",

            },

            // ------------------------------------------
            // RECIBO
            // ------------------------------------------

            {

                field:
                    "recibo",

                title:
                    "Recibo",

                render:
                    documento =>

                        documento.recibo ||
                        "-",

            },

            // ------------------------------------------
            // PLANILLA
            // ------------------------------------------

            {

                field:
                    "planillaGC",

                title:
                    "Planilla GC",

                render:
                    documento =>

                        documento.planillaGC ||
                        "-",

            },

            // ------------------------------------------
            // OBSERVACIONES
            // ------------------------------------------

            {

                field:
                    "observaciones",

                title:
                    "Observaciones",

                whiteSpace:
                    "pre-line",

                render:
                    documento =>

                        documento.observaciones ||
                        "-",

            },

            // ------------------------------------------
            // ESTADO
            // ------------------------------------------

            {

                field:
                    "estadoProcesamiento",

                title:
                    "Estado",

                align:
                    "center",

                render:
                    documento => {

                        const procesando =
                            entregandoId ===
                            documento.id;

                        // ==================================
                        // ENTREGADO
                        // ==================================

                        if (
                            documento.entregado
                        ) {

                            return (

                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        px-4
                                        py-2
                                        rounded-xl
                                        bg-emerald-600
                                        text-white
                                        font-semibold
                                        whitespace-nowrap
                                    "
                                >

                                    Entregado

                                </span>

                            );

                        }

                        // ==================================
                        // PENDIENTE
                        // ==================================

                        return (

                            <button

                                type="button"

                                disabled={
                                    procesando
                                }

                                onClick={() =>
                                    setConfirmando(
                                        documento
                                    )
                                }

                                className={`
                                    px-4
                                    py-2
                                    rounded-xl
                                    font-semibold
                                    text-white
                                    whitespace-nowrap
                                    transition
                                    ${
                                        procesando
                                            ? "bg-slate-400"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }
                                `}

                            >

                                {
                                    procesando

                                        ? "Procesando..."

                                        : "Pendiente por entrega"

                                }

                            </button>

                        );

                    },

            },

        ];

    // ==================================================
    // RENDER
    // ==================================================

    return (

        <SistemaLayout

            titulo="
                Entrega de documentos
            "

            permiso={
                MODULOS.CAJA
            }

        >

            <div className="
                space-y-6
            ">

                {/* ======================================
                    ENCABEZADO
                ======================================= */}

                <div>

                    <h1 className="
                        text-2xl
                        font-bold
                        text-blue-950
                    ">

                        Entrega de documentos

                    </h1>

                    <p className="
                        mt-1
                        text-slate-500
                    ">

                        Consulte y registre la entrega
                        de documentos procesados.

                    </p>

                </div>

                {/* ======================================
                    SELECCIÓN INICIAL
                ======================================= */}

                {
                    !modoBusqueda && (

                        <div className="
                            bg-white
                            border
                            rounded-2xl
                            shadow-sm
                            p-6
                        ">

                            <h2 className="
                                text-lg
                                font-semibold
                                text-slate-800
                            ">

                                Buscar documentos

                            </h2>

                            <p className="
                                mt-1
                                text-sm
                                text-slate-500
                            ">

                                Seleccione cómo desea localizar
                                los documentos del ciudadano.

                            </p>

                            <div className="
                                mt-5
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-4
                            ">

                                {/* ==========================
                                    POR NOMBRE
                                =========================== */}

                                <button

                                    type="button"

                                    onClick={() =>
                                        seleccionarModo(
                                            "NOMBRE"
                                        )
                                    }

                                    className="
                                        rounded-2xl
                                        border
                                        border-blue-200
                                        bg-blue-50
                                        px-6
                                        py-6
                                        text-left
                                        hover:bg-blue-100
                                        transition
                                    "

                                >

                                    <div className="
                                        text-lg
                                        font-semibold
                                        text-blue-900
                                    ">

                                        Buscar por nombre

                                    </div>

                                    <div className="
                                        mt-2
                                        text-sm
                                        text-slate-600
                                    ">

                                        Encuentre todos los documentos
                                        asociados al ciudadano.

                                    </div>

                                </button>

                                {/* ==========================
                                    POR DOCUMENTO
                                =========================== */}

                                <button

                                    type="button"

                                    onClick={() =>
                                        seleccionarModo(
                                            "DOCUMENTO"
                                        )
                                    }

                                    className="
                                        rounded-2xl
                                        border
                                        border-slate-300
                                        bg-slate-50
                                        px-6
                                        py-6
                                        text-left
                                        hover:bg-slate-100
                                        transition
                                    "

                                >

                                    <div className="
                                        text-lg
                                        font-semibold
                                        text-slate-800
                                    ">

                                        Buscar por documento

                                    </div>

                                    <div className="
                                        mt-2
                                        text-sm
                                        text-slate-600
                                    ">

                                        Consulte la tabla y filtre
                                        por documento, nombre o tipo.

                                    </div>

                                </button>

                            </div>

                        </div>

                    )
                }

                {/* ======================================
                    MODO NOMBRE
                ======================================= */}

                {
                    modoBusqueda ===
                    "NOMBRE" && (

                        <div className="
                            bg-white
                            border
                            rounded-2xl
                            shadow-sm
                            p-5
                        ">

                            <div className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                md:justify-between
                                gap-4
                            ">

                                <div>

                                    <h2 className="
                                        text-lg
                                        font-semibold
                                        text-slate-800
                                    ">

                                        Buscar por nombre

                                    </h2>

                                    <p className="
                                        text-sm
                                        text-slate-500
                                    ">

                                        Se mostrarán los documentos
                                        pendientes y entregados
                                        asociados al ciudadano.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={
                                        volverSeleccionBusqueda
                                    }

                                    className="
                                        px-4
                                        py-2
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        hover:bg-slate-50
                                    "

                                >

                                    Cambiar búsqueda

                                </button>

                            </div>

                            <div className="
                                mt-5
                            ">

                                <input

                                    type="text"

                                    autoFocus

                                    value={
                                        busqueda
                                    }

                                    onChange={e =>
                                        setBusqueda(
                                            e.target.value
                                        )
                                    }

                                    placeholder="
                                        Escriba el nombre del ciudadano
                                    "

                                    className="
                                        w-full
                                        border
                                        border-slate-300
                                        rounded-xl
                                        px-4
                                        py-3
                                        outline-none
                                        focus:ring-2
                                        focus:ring-blue-500
                                    "

                                />

                            </div>

                        </div>

                    )
                }

                {/* ======================================
                    MODO DOCUMENTO
                ======================================= */}

                {
                    modoBusqueda ===
                    "DOCUMENTO" && (

                        <div className="
                            bg-white
                            border
                            rounded-2xl
                            shadow-sm
                            p-5
                        ">

                            <div className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                md:justify-between
                                gap-4
                            ">

                                <div>

                                    <h2 className="
                                        text-lg
                                        font-semibold
                                        text-slate-800
                                    ">

                                        Buscar por documento

                                    </h2>

                                    <p className="
                                        text-sm
                                        text-slate-500
                                    ">

                                        Consulte los documentos
                                        procesados.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={
                                        volverSeleccionBusqueda
                                    }

                                    className="
                                        px-4
                                        py-2
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        hover:bg-slate-50
                                    "

                                >

                                    Cambiar búsqueda

                                </button>

                            </div>

                            <div className="
                                mt-5
                                grid
                                grid-cols-1
                                md:grid-cols-3
                                gap-4
                            ">

                                {/* ==========================
                                    DOCUMENTO
                                =========================== */}

                                <div>

                                    <label className="
                                        block
                                        text-sm
                                        font-semibold
                                        mb-2
                                    ">

                                        Documento de identidad

                                    </label>

                                    <input

                                        type="text"

                                        value={
                                            busqueda
                                        }

                                        onChange={e =>
                                            setBusqueda(
                                                e.target.value
                                            )
                                        }

                                        placeholder="
                                            Cédula o pasaporte
                                        "

                                        className="
                                            w-full
                                            border
                                            border-slate-300
                                            rounded-xl
                                            px-4
                                            py-3
                                            outline-none
                                            focus:ring-2
                                            focus:ring-blue-500
                                        "

                                    />

                                </div>

                                {/* ==========================
                                    NOMBRE
                                =========================== */}

                                <div>

                                    <label className="
                                        block
                                        text-sm
                                        font-semibold
                                        mb-2
                                    ">

                                        Nombre

                                    </label>

                                    <input

                                        type="text"

                                        value={
                                            filtroNombre
                                        }

                                        onChange={e =>
                                            setFiltroNombre(
                                                e.target.value
                                            )
                                        }

                                        placeholder="
                                            Filtrar por nombre
                                        "

                                        className="
                                            w-full
                                            border
                                            border-slate-300
                                            rounded-xl
                                            px-4
                                            py-3
                                            outline-none
                                            focus:ring-2
                                            focus:ring-blue-500
                                        "

                                    />

                                </div>

                                {/* ==========================
                                    CATEGORÍA
                                =========================== */}

                                <div>

                                    <label className="
                                        block
                                        text-sm
                                        font-semibold
                                        mb-2
                                    ">

                                        Tipo de documento

                                    </label>

                                    <select

                                        value={
                                            categoria
                                        }

                                        onChange={e =>
                                            setCategoria(
                                                e.target.value as
                                                CategoriaDocumento |
                                                "TODOS"
                                            )
                                        }

                                        className="
                                            w-full
                                            border
                                            border-slate-300
                                            rounded-xl
                                            px-4
                                            py-3
                                            bg-white
                                            outline-none
                                            focus:ring-2
                                            focus:ring-blue-500
                                        "

                                    >

                                        <option value="TODOS">

                                            Todos

                                        </option>

                                        {
                                            (
                                                Object.keys(
                                                    ETIQUETAS_CATEGORIA
                                                ) as
                                                CategoriaDocumento[]
                                            ).map(
                                                item => (

                                                    <option
                                                        key={item}
                                                        value={item}
                                                    >

                                                        {
                                                            ETIQUETAS_CATEGORIA[
                                                                item
                                                            ]
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>

                            </div>

                        </div>

                    )
                }

                {/* ======================================
                    CONTADORES
                ======================================= */}

                {
                    modoBusqueda && (

                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-4
                        ">

                            {/* ==========================
                                PENDIENTES
                            =========================== */}

                            <div className="
                                bg-white
                                border
                                rounded-2xl
                                shadow-sm
                                p-5
                            ">

                                <div className="
                                    text-sm
                                    text-slate-500
                                ">

                                    Documentos pendientes por entregar

                                </div>

                                <div className="
                                    mt-1
                                    text-3xl
                                    font-bold
                                    text-blue-700
                                ">

                                    {
                                        totalPendientes
                                    }

                                </div>

                            </div>

                            {/* ==========================
                                ENTREGADOS
                            =========================== */}

                            <div className="
                                bg-white
                                border
                                rounded-2xl
                                shadow-sm
                                p-5
                            ">

                                <div className="
                                    text-sm
                                    text-slate-500
                                ">

                                    Documentos entregados

                                </div>

                                <div className="
                                    mt-1
                                    text-3xl
                                    font-bold
                                    text-emerald-600
                                ">

                                    {
                                        totalEntregados
                                    }

                                </div>

                            </div>

                        </div>

                    )
                }

                {/* ======================================
                    RESULTADO
                ======================================= */}

                {
                    modoBusqueda && (

                        <div className="
                            flex
                            items-center
                            justify-between
                            gap-4
                        ">

                            <div className="
                                text-sm
                                text-slate-600
                            ">

                                {
                                    documentosVisibles.length
                                }

                                {" "}

                                {
                                    documentosVisibles.length === 1
                                        ? "documento encontrado"
                                        : "documentos encontrados"
                                }

                            </div>

                            <button

                                type="button"

                                onClick={
                                    cargarDocumentos
                                }

                                disabled={
                                    cargando
                                }

                                className="
                                    px-4
                                    py-2
                                    rounded-xl
                                    border
                                    border-slate-300
                                    bg-white
                                    hover:bg-slate-50
                                    disabled:opacity-50
                                "

                            >

                                Actualizar

                            </button>

                        </div>

                    )
                }

                {/* ======================================
                    ERROR
                ======================================= */}

                {
                    error && (

                        <div className="
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            text-red-700
                            px-4
                            py-3
                        ">

                            {error}

                        </div>

                    )
                }

                {/* ======================================
                    TABLA
                ======================================= */}

                {
                    modoBusqueda && (

                        <div className="
                            bg-white
                            rounded-2xl
                            border
                            shadow-sm
                            overflow-hidden
                        ">

                            {
                                cargando

                                    ? (

                                        <div className="
                                            p-10
                                            text-center
                                            text-slate-500
                                        ">

                                            Cargando documentos...

                                        </div>

                                    )

                                    : (

                                        <DataTable

                                            columns={
                                                columnas
                                            }

                                            data={
                                                documentosVisibles
                                            }

                                            getRowKey={(
                                                row
                                            ) =>
                                                row.id
                                            }

                                        />

                                    )

                            }

                        </div>

                    )
                }

            </div>

            {/* ==========================================
                POPUP DE CONFIRMACIÓN
            =========================================== */}

            {
                confirmando && (

                    <div className="
                        fixed
                        inset-0
                        z-50
                        bg-black/40
                        flex
                        items-center
                        justify-center
                        p-6
                    ">

                        <div className="
                            bg-white
                            rounded-2xl
                            shadow-2xl
                            w-full
                            max-w-md
                            p-7
                        ">

                            <h2 className="
                                text-xl
                                font-bold
                                text-blue-950
                            ">

                                Confirmar entrega

                            </h2>

                            <p className="
                                mt-4
                                text-slate-700
                                leading-relaxed
                            ">

                                ¿Está seguro de entregar
                                el documento al ciudadano{" "}

                                <strong>

                                    {
                                        obtenerTitular(
                                            confirmando
                                        )
                                    }

                                </strong>

                                ?

                            </p>

                            <div className="
                                mt-7
                                flex
                                justify-end
                                gap-3
                            ">

                                <button

                                    type="button"

                                    disabled={
                                        entregandoId !== null
                                    }

                                    onClick={() =>
                                        setConfirmando(
                                            null
                                        )
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
                                        entregandoId !== null
                                    }

                                    onClick={
                                        confirmarEntrega
                                    }

                                    className="
                                        px-5
                                        py-2
                                        rounded-xl
                                        bg-emerald-600
                                        hover:bg-emerald-700
                                        text-white
                                        font-semibold
                                        disabled:opacity-50
                                    "

                                >

                                    {
                                        entregandoId !== null

                                            ? "Registrando..."

                                            : "Confirmar entrega"
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </SistemaLayout>

    );

}