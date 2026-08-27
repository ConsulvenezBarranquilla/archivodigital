"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";

import ReportesSidebar from "@/components/reportesEntregados/ReportesSidebar";
import ReportesTable from "@/components/reportesEntregados/ReportesTable";

import DataTableToolbar from "@/components/table/DataTableToolbar";

import ModalRegistrarValija from "@/components/reportesEntregados/ModalRegistrarValija";
import ModalNuevaConstancia from "@/components/reportesEntregados/ModalNuevaConstancia";
import ModalEntregarDocumento from "@/components/reportesEntregados/ModalEntregarDocumento";
import DataTableContainer from "@/components/table/DataTableContainer";
import DrawerEditar from "@/components/reportesEntregados/DrawerEditar";

import {
    CategoriaDocumento,
    ReporteEntregado,
} from "@/types/ReporteEntregado";

import {
    obtenerConfiguracionCategoria,
} from "@/lib/reportesEntregados/documentos";

import {
    actualizarDocumento,
} from "@/lib/services/ReportesEntregados";

import {
    obtenerReportesEntregados,
    registrarValija,
    marcarEntregado,
    exportarExcel,
} from "@/lib/services/ReportesEntregados";

export default function ReportesEntregadosPage() {

    // ==========================================
    // CATEGORÍA
    // ==========================================

    const [
        categoria,
        setCategoria,
    ] = useState<CategoriaDocumento>(
        "PASAPORTES"
    );

    // ==========================================
    // AÑO ACTUAL
    // ==========================================

    const anioActual =
        new Date().getFullYear();

    const [
        anio,
        setAnio,
    ] = useState<number>(
        anioActual
    );

    // ==========================================
    // AÑOS DISPONIBLES
    // ==========================================

    const [
        aniosDisponibles,
        setAniosDisponibles,
    ] = useState<number[]>([]);

    const [
        cargandoAnios,
        setCargandoAnios,
    ] = useState(true);

    // ==========================================
    // DOCUMENTO A EDITAR
    // ==========================================

    const [
        documentoEditar,
        setDocumentoEditar,
    ] = useState<ReporteEntregado | null>(
        null
    );

    const [
        drawerEditar,
        setDrawerEditar,
    ] = useState(false);

    // ==========================================
    // BÚSQUEDA
    // ==========================================

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    // ==========================================
    // DOCUMENTOS
    // ==========================================

    const [
        documentos,
        setDocumentos,
    ] = useState<ReporteEntregado[]>([]);

    const [
        cargando,
        setCargando,
    ] = useState(true);

    // ==========================================
    // MODAL VALIJA
    // ==========================================

    const [
        modalValija,
        setModalValija,
    ] = useState(false);

// ==========================================
// MODAL NUEVA CONSTANCIA CONSULAR
// ==========================================

const [
    modalNuevaConstancia,
    setModalNuevaConstancia,
] = useState(false);

    // ==========================================
    // MODAL ENTREGA
    // ==========================================

    const [
        modalEntrega,
        setModalEntrega,
    ] = useState(false);

    const [
        documentoSeleccionado,
        setDocumentoSeleccionado,
    ] = useState<ReporteEntregado | null>(
        null
    );

    // ==========================================
    // USUARIO
    // ==========================================

    const [
        usuario,
        setUsuario,
    ] = useState("");

    // ==========================================
    // CONFIGURACIÓN CATEGORÍA
    // ==========================================

    const configuracion =
        useMemo(

            () =>
                obtenerConfiguracionCategoria(
                    categoria
                ),

            [
                categoria,
            ]

        );

    // ==========================================
    // CARGAR USUARIO
    // ==========================================

    useEffect(() => {

        cargarUsuario();

    }, []);

    // ==========================================
    // CARGAR AÑOS DISPONIBLES
    // ==========================================

    useEffect(() => {

        cargarAnios();

    }, [

        categoria,

    ]);

    // ==========================================
    // CARGAR DOCUMENTOS
    // ==========================================

    useEffect(() => {

        cargarDocumentos();

    }, [

        categoria,

        anio,

    ]);

    // ==========================================
    // USUARIO
    // ==========================================

    function cargarUsuario() {

        if (
            typeof window ===
            "undefined"
        ) {

            return;

        }

        const datos =
            localStorage.getItem(
                "usuarioCaja"
            );

        if (!datos) {

            return;

        }

        try {

            const json =
                JSON.parse(
                    datos
                );

            setUsuario(
                json.usuario ??
                ""
            );

        }

        catch {

            setUsuario(
                datos
            );

        }

    }

    // ==========================================
    // CARGAR AÑOS
    // ==========================================

    async function cargarAnios() {

        try {

            setCargandoAnios(
                true
            );

            const respuesta =
                await fetch(

                    `/api/reportes-entregados/anios?categoria=${encodeURIComponent(
                        categoria
                    )}`

                );

            const data =
                await respuesta.json();

            if (
                data.ok &&
                Array.isArray(
                    data.anios
                )
            ) {

                const anios =
                    data.anios
                        .map(
                            (valor: unknown) =>
                                Number(valor)
                        )
                        .filter(
                            (valor: number) =>
                                Number.isInteger(
                                    valor
                                )
                        )
                        .sort(
                            (
                                a: number,
                                b: number
                            ) =>
                                b - a
                        );

                setAniosDisponibles(
                    anios
                );

                // ==================================
                // Mantener el año seleccionado
                // si todavía existe.
                // ==================================

                if (
                    anios.includes(
                        anio
                    )
                ) {

                    return;

                }

                // ==================================
                // Si no existe el año actual,
                // seleccionar el más reciente.
                // ==================================

                if (
                    anios.length > 0
                ) {

                    setAnio(
                        anios[0]
                    );

                }

                else {

                    // Si todavía no hay registros,
                    // usamos el año actual.

                    setAnio(
                        anioActual
                    );

                }

            }

            else {

                setAniosDisponibles(
                    []
                );

                setAnio(
                    anioActual
                );

            }

        }

        catch (error) {

            console.error(
                "Error cargando años:",
                error
            );

            setAniosDisponibles(
                []
            );

            setAnio(
                anioActual
            );

        }

        finally {

            setCargandoAnios(
                false
            );

        }

    }

    // ==========================================
    // CARGAR DOCUMENTOS
    // ==========================================

    async function cargarDocumentos() {

        try {

            setCargando(
                true
            );

            const respuesta =
                await obtenerReportesEntregados(

                    categoria,

                    anio

                );

            if (
                respuesta.ok
            ) {

                setDocumentos(
                    respuesta.documentos
                );

            }

            else {

                setDocumentos(
                    []
                );

            }

        }

        catch (error) {

            console.error(
                error
            );

            setDocumentos(
                []
            );

        }

        finally {

            setCargando(
                false
            );

        }

    }

    // ==========================================
    // EDITAR DOCUMENTO
    // ==========================================

    function abrirEditar(

        documento: ReporteEntregado

    ) {

        setDocumentoEditar(
            documento
        );

        setDrawerEditar(
            true
        );

    }

    // ==========================================
    // GUARDAR DOCUMENTO
    // ==========================================

    async function guardarDocumento(

        documento: ReporteEntregado

    ) {

        try {

            await actualizarDocumento(

                documento,

                usuario

            );

            setDrawerEditar(
                false
            );

            setDocumentoEditar(
                null
            );

            await cargarDocumentos();

        }

        catch (error) {

            console.error(
                error
            );

            alert(
                "No fue posible guardar el documento."
            );

        }

    }
// ==========================================
// GUARDAR NUEVA CONSTANCIA CONSULAR
// ==========================================

async function guardarNuevaConstancia(

    documento: ReporteEntregado

) {

    try {

        await actualizarDocumento(

            documento,

            usuario

        );

        setModalNuevaConstancia(
            false
        );

        await cargarDocumentos();

    }

    catch (error) {

        console.error(
            "Error guardando constancia consular:",
            error
        );

        alert(
            "No fue posible guardar la constancia consular."
        );

    }

}
    // ==========================================
    // REGISTRAR RECEPCIÓN DE VALIJA
    // ==========================================

    async function guardarValija(

        fechaValija: string,

        documentosSeleccionados:
            ReporteEntregado[]

    ) {

        try {

            await registrarValija({

                usuario,

                fechaValija,

                documentos:
                    documentosSeleccionados,

            });

            setModalValija(
                false
            );

            await cargarDocumentos();

        }

        catch (error) {

            console.error(
                error
            );

            alert(
                "No fue posible registrar la valija."
            );

        }

    }

    // ==========================================
    // REGISTRAR ENTREGA
    // ==========================================

    async function guardarEntrega(

        documento: ReporteEntregado,

        fechaEntrega: string,

        observaciones: string

    ) {

        try {

            await marcarEntregado({

                usuario,

                documento,

                fechaEntrega,

                observaciones,

            });

            setModalEntrega(
                false
            );

            setDocumentoSeleccionado(
                null
            );

            await cargarDocumentos();

        }

        catch (error) {

            console.error(
                error
            );

            alert(
                "No fue posible registrar la entrega."
            );

        }

    }

    // ==========================================
    // EXPORTAR EXCEL
    // ==========================================

    async function descargarExcel() {

        try {

            const archivo =
    await exportarExcel(
        categoria,
        anio
    );

            const url =
                window.URL.createObjectURL(
                    archivo
                );

            const enlace =
                document.createElement(
                    "a"
                );

            enlace.href =
                url;

            enlace.download =
                `${categoria}_${anio}.xlsx`;

            enlace.click();

            window.URL.revokeObjectURL(
                url
            );

        }

        catch (error) {

            console.error(
                error
            );

            alert(
                "No fue posible generar el archivo Excel."
            );

        }

    }

    // ==========================================
    // ABRIR ENTREGA
    // ==========================================

    function abrirEntrega(

        documento: ReporteEntregado

    ) {

        setDocumentoSeleccionado(
            documento
        );

        setModalEntrega(
            true
        );

    }

    // ==========================================
    // CERRAR MODALES
    // ==========================================

    function cerrarModales() {

    setModalValija(
        false
    );

    setModalNuevaConstancia(
        false
    );

    setModalEntrega(
        false
    );

    setDocumentoSeleccionado(
        null
    );

}

    // ==========================================
    // RENDER
    // ==========================================

    return (

        <SistemaLayout

            titulo="Consulnet Barranquilla"

            permiso={
                MODULOS.GESTION_CONSULAR
            }

        >

            <div className="
                flex
                min-w-0
                gap-6
            ">

                {/* =======================================
                    MENÚ LATERAL
                ======================================== */}

                <ReportesSidebar

                    categoria={
                        categoria
                    }

                    onChange={
                        setCategoria
                    }

                />

                {/* =======================================
                    CONTENIDO
                ======================================== */}

                <div className="
                    min-w-0
                    flex-1
                ">

                    <div className="
                        mb-6
                        rounded-2xl
                        bg-white
                        p-6
                        shadow-md
                    ">

                        {/* ==================================
                            CABECERA
                        ================================== */}

                        <div className="
                            mb-5
                            flex
                            flex-col
                            gap-4
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        ">

                            <div>

                                <h2 className="
                                    text-2xl
                                    font-bold
                                    text-blue-950
                                ">

                                    {
                                        configuracion?.nombre ??
                                        ""
                                    }

                                </h2>

                                <p className="
                                    mt-1
                                    text-slate-500
                                ">

                                    Gestión y control
                                    documental

                                </p>

                            </div>

                            {/* ==================================
                                SELECTOR DE AÑO
                            ================================== */}

                            <div className="
                                flex
                                items-center
                                gap-3
                            ">

                                <label className="
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                ">

                                    Año:

                                </label>

                                <select

                                    value={
                                        anio
                                    }

                                    disabled={
                                        cargandoAnios
                                    }

                                    onChange={(event) => {

                                        setAnio(
                                            Number(
                                                event.target.value
                                            )
                                        );

                                    }}

                                    className="
                                        min-w-[130px]
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        px-4
                                        py-2
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                        outline-none
                                        transition
                                        focus:border-blue-600
                                        focus:ring-2
                                        focus:ring-blue-100
                                        disabled:bg-slate-100
                                    "

                                >

                                    {/* ==================================
                                        Año actual siempre disponible
                                    ================================== */}

                                    {!aniosDisponibles.includes(
                                        anioActual
                                    ) && (

                                        <option
                                            value={
                                                anioActual
                                            }
                                        >

                                            {anioActual}

                                        </option>

                                    )}

                                    {

                                        aniosDisponibles.map(

                                            (
                                                anioDisponible
                                            ) => (

                                                <option

                                                    key={
                                                        anioDisponible
                                                    }

                                                    value={
                                                        anioDisponible
                                                    }

                                                >

                                                    {
                                                        anioDisponible
                                                    }

                                                </option>

                                            )

                                        )

                                    }

                                </select>

                            </div>

                        </div>

                        {/* ==================================
                            BARRA DE HERRAMIENTAS
                        ================================== */}

                        <DataTableToolbar

                            busqueda={
                                busqueda
                            }

                            onBusquedaChange={
                                setBusqueda
                            }

                            placeholder="
                                Buscar por nombre,
                                documento, planilla o recibo...
                            "

                        >

                            {/* ==================================
                                EXPORTAR EXCEL
                            ================================== */}

                            {
                                configuracion?.permiteExcel && (

                                    <button

                                        onClick={
                                            descargarExcel
                                        }

                                        className="
                                            rounded-xl
                                            bg-orange-600
                                            px-5
                                            py-2
                                            font-semibold
                                            text-white
                                            hover:bg-orange-700
                                        "

                                    >

                                        📊 Exportar Excel

                                    </button>

                                )
                            }

                            {/* ==================================
                                REGISTRAR VALIJA
                            ================================== */}

                            {
                                configuracion?.permiteValija && (

                                    <button

                                        onClick={() =>
                                            setModalValija(
                                                true
                                            )
                                        }

                                        className="
                                            rounded-xl
                                            bg-blue-700
                                            px-5
                                            py-2
                                            font-semibold
                                            text-white
                                            hover:bg-blue-800
                                        "

                                    >

                                        📦 Registrar Valija

                                    </button>

                                )
                            }
{
    categoria === "CONSTANCIA_CONSULAR" && (

        <button

            type="button"

            onClick={() =>
                setModalNuevaConstancia(
                    true
                )
            }

            className="
                rounded-xl
                bg-blue-700
                px-5
                py-2
                font-semibold
                text-white
                hover:bg-blue-800
            "

        >

            + Nueva Constancia Consular

        </button>

    )
}
                        </DataTableToolbar>

                    </div>

                    {/* ==================================
                        TABLA
                    ================================== */}

                    {

                        cargando ?

                            (

                                <div className="
                                    rounded-2xl
                                    bg-white
                                    p-10
                                    text-center
                                    text-slate-500
                                    shadow-md
                                ">

                                    Cargando documentos...

                                </div>

                            )

                            :

                            (

                                <DataTableContainer>

                                    <ReportesTable

                                        categoria={
                                            categoria
                                        }

                                        busqueda={
                                            busqueda
                                        }

                                        documentos={
                                            documentos
                                        }

                                        onEditar={
                                            abrirEditar
                                        }

                                        onEntregar={
                                            abrirEntrega
                                        }

                                    />

                                </DataTableContainer>

                            )

                    }

                </div>

            </div>

            {/* ==========================================
                MODAL VALIJA
            ========================================== */}

            <ModalRegistrarValija

                open={
                    modalValija
                }

                documentos={

                    documentos.filter(

                        documento =>

                            !documento.fechaValija

                    )

                }

                onClose={
                    cerrarModales
                }

                onGuardar={
                    guardarValija
                }

            />

            {/* ==========================================
                MODAL ENTREGA
            ========================================== */}

            <ModalEntregarDocumento

                open={
                    modalEntrega
                }

                documento={
                    documentoSeleccionado
                }

                usuario={
                    usuario
                }

                onClose={
                    cerrarModales
                }

                onGuardar={
                    guardarEntrega
                }

            />
{/* ==========================================
    MODAL NUEVA CONSTANCIA CONSULAR
========================================== */}

<ModalNuevaConstancia

    open={
        modalNuevaConstancia
    }

    usuario={
        usuario
    }

    onClose={() =>
        setModalNuevaConstancia(
            false
        )
    }

    onGuardar={
        guardarNuevaConstancia
    }

/>
            {/* ==========================================
                DRAWER EDITAR
            ========================================== */}

            <DrawerEditar

                open={
                    drawerEditar
                }

                documento={
                    documentoEditar
                }

                onClose={() => {

                    setDrawerEditar(
                        false
                    );

                    setDocumentoEditar(
                        null
                    );

                }}

                onGuardar={
                    guardarDocumento
                }

            />

        </SistemaLayout>

    );

}