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

    const [

        categoria,

        setCategoria,

    ] = useState<CategoriaDocumento>(

        "PASAPORTES"

    );
const [

    documentoEditar,

    setDocumentoEditar,

] = useState<ReporteEntregado | null>(null);

const [

    drawerEditar,

    setDrawerEditar,

] = useState(false);
    const [

        busqueda,

        setBusqueda,

    ] = useState("");

    const [

        documentos,

        setDocumentos,

    ] = useState<ReporteEntregado[]>([]);

    const [

        cargando,

        setCargando,

    ] = useState(true);

    const [

        modalValija,

        setModalValija,

    ] = useState(false);

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

    const [

        usuario,

        setUsuario,

    ] = useState("");

    const configuracion = useMemo(

        () =>

            obtenerConfiguracionCategoria(

                categoria

            ),

        [

            categoria,

        ]

    );

    useEffect(() => {

        cargarUsuario();

    },

    []);

    useEffect(() => {

        cargarDocumentos();

    },

    [

        categoria,

    ]);

    function cargarUsuario() {

        if (

            typeof window === "undefined"

        ) {

            return;

        }

        const datos =

            localStorage.getItem(

                "usuarioCaja"

            );

        if (

            !datos

        ) {

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
function abrirEditar(

    documento: ReporteEntregado

) {

    setDocumentoEditar(

        documento

    );

    setDrawerEditar(true);

}
    async function cargarDocumentos() {

        try {

            setCargando(

                true

            );

            const respuesta =

                await obtenerReportesEntregados(

                    categoria

                );

            if (

                respuesta.ok

            ) {
 
                setDocumentos(

                    respuesta.documentos

                );

            }

            else {

                setDocumentos([]);

            }

        }

        catch (

            error

        ) {

            console.error(

                error

            );

            setDocumentos([]);

        }

        finally {

            setCargando(

                false

            );

        }

    }
        // ==========================================
    // Registrar recepción de valija
    // ==========================================

    async function guardarValija(

        fechaValija: string,

        documentosSeleccionados: ReporteEntregado[]

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
    // Registrar entrega
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
async function guardarDocumento(
    documento: ReporteEntregado
) {

    try {

        await actualizarDocumento(

            documento,

            usuario

        );

        setDrawerEditar(false);

        setDocumentoEditar(null);

        await cargarDocumentos();

    }

    catch (error) {

        console.error(error);

        alert(

            "No fue posible guardar el documento."

        );

    }

}
    // ==========================================
    // Exportar Excel
    // ==========================================

    async function descargarExcel() {

        try {

            const archivo =

                await exportarExcel(

                    categoria

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

                `${categoria}.xlsx`;

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
    // Abrir modal de entrega
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
    // Cerrar modales
    // ==========================================

    function cerrarModales() {

        setModalValija(

            false

        );

        setModalEntrega(

            false

        );

        setDocumentoSeleccionado(

            null

        );

    }
        return (

        <SistemaLayout

            titulo="Consulnet Barranquilla"

            permiso={MODULOS.GESTION_CONSULAR}

        >

            <div className="flex gap-6 min-w-0">

                {/* =======================================
                    Menú lateral
                ======================================== */}

                <ReportesSidebar

                    categoria={categoria}

                    onChange={setCategoria}

                />

                {/* =======================================
                    Contenido
                ======================================== */}

                <div className="flex-1 min-w-0">

                    <div

                        className="

                            bg-white

                            rounded-2xl

                            shadow-md

                            p-6

                            mb-6

                        "

                    >

                        <div className="mb-5">

                            <h2

                                className="

                                    text-2xl

                                    font-bold

                                    text-blue-950

                                "

                            >

                                {

                                    configuracion?.nombre ??

                                    ""

                                }

                            </h2>

                            <p

                                className="

                                    text-slate-500

                                    mt-1

                                "

                            >

                                Gestión y control documental

                            </p>

                        </div>

                        <DataTableToolbar

                            busqueda={busqueda}

                            onBusquedaChange={

                                setBusqueda

                            }

                            placeholder="Buscar por nombre, documento, planilla o recibo..."

                        >

                            {

                                configuracion?.permiteExcel && (

                                    <button

                                        onClick={

                                            descargarExcel

                                        }

                                        className="

                                            bg-orange-600

                                            hover:bg-orange-700

                                            text-white

                                            rounded-xl

                                            px-5

                                            py-2

                                            font-semibold

                                        "

                                    >

                                        📊 Exportar Excel

                                    </button>

                                )

                            }

                            {

                                configuracion?.permiteValija && (

                                    <button

                                        onClick={() =>

                                            setModalValija(

                                                true

                                            )

                                        }

                                        className="

                                            bg-blue-700

                                            hover:bg-blue-800

                                            text-white

                                            rounded-xl

                                            px-5

                                            py-2

                                            font-semibold

                                        "

                                    >

                                        📦 Registrar Valija

                                    </button>

                                )

                            }

                        </DataTableToolbar>

                    </div>

                    {

                        cargando ? (

                            <div

                                className="

                                    bg-white

                                    rounded-2xl

                                    shadow-md

                                    p-10

                                    text-center

                                    text-slate-500

                                "

                            >

                                Cargando documentos...

                            </div>

                        ) : (

                            <DataTableContainer>

   <ReportesTable
    categoria={categoria}
    busqueda={busqueda}
    documentos={documentos}
    onEditar={abrirEditar}
    onEntregar={abrirEntrega}
/>

</DataTableContainer>

                        )

                    }

                </div>

            </div>

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

            <ModalEntregarDocumento

    open={modalEntrega}

    documento={documentoSeleccionado}

    usuario={usuario}

    onClose={cerrarModales}

    onGuardar={guardarEntrega}

/>
<DrawerEditar

    open={drawerEditar}

    documento={documentoEditar}

    onClose={() => {

        setDrawerEditar(false);

        setDocumentoEditar(null);

    }}

    onGuardar={guardarDocumento}

/>
        </SistemaLayout>

    );

}
