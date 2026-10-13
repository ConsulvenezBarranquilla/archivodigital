"use client";

import {
    createPortal,
} from "react-dom";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import SistemaLayout from "@/components/layout/SistemaLayout";

import {
    MODULOS,
} from "@/lib/modulos";

interface FirmaUsuario {

    idFirma: string;

    nombreFirma: string;

    activo: string;

}

interface SelloInstitucional {

    idSello: string;

    nombreSello: string;

    activo: string;

}

interface Documento {

    id: string;

    categoria: string;

    tipoDocumento: string;

    recibo: string;

    codigoActuacion?: string;

    fechaRecibo: string;

    fechaEntrega?: string;

    planillaGC: string;

    solicitante: string;

    documento: string;

    estadoProcesamiento: string;

    pdfConstanciaRegistro?: string;

    pdfConstanciaFirmada?: string;

    usuarioFirma?: string;

    fotoCarnet?: string;

    correoDestino?: string;

}

function anioDeFecha(fecha: string | undefined): number | null {
    const valor = String(fecha ?? "").trim();
    const iso = valor.match(/^(\d{4})[-/]/);
    if (iso) return Number(iso[1]);
    const diaMesAnio = valor.match(/^\d{1,2}[/-]\d{1,2}[/-](\d{4})/);
    if (diaMesAnio) return Number(diaMesAnio[1]);
    const parsed = new Date(valor);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

export default function DocFirmarPage() {

    const [
        documentos,
        setDocumentos,
    ] = useState<Documento[]>([]);

    const [
        cargando,
        setCargando,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        documentoSeleccionado,
        setDocumentoSeleccionado,
    ] = useState<Documento | null>(null);

    const [
        firmas,
        setFirmas,
    ] = useState<FirmaUsuario[]>([]);

    const [
        sellos,
        setSellos,
    ] = useState<SelloInstitucional[]>([]);

    const [
        idFirmaSeleccionada,
        setIdFirmaSeleccionada,
    ] = useState("");

    const [
        idSelloSeleccionado,
        setIdSelloSeleccionado,
    ] = useState("");

    const [
        generandoPrevisualizacion,
        setGenerandoPrevisualizacion,
    ] = useState(false);

    const [
        errorPrevisualizacion,
        setErrorPrevisualizacion,
    ] = useState("");

    const [
        pdfPrevisualizacionUrl,
        setPdfPrevisualizacionUrl,
    ] = useState("");
    const [previsualizacionLista, setPrevisualizacionLista] = useState(false);
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);
    const [solicitandoTotp, setSolicitandoTotp] = useState(false);
    const [codigoTotp, setCodigoTotp] = useState("");
    const [correoEnviado, setCorreoEnviado] = useState("");
    const [vistaLista, setVistaLista] = useState<"PENDIENTES" | "FIRMADOS">("PENDIENTES");
    const [accionDocumentoId, setAccionDocumentoId] = useState("");
    const [anioFiltro, setAnioFiltro] = useState(String(new Date().getFullYear()));
    const aniosDisponibles = Array.from(new Set([new Date().getFullYear(), ...documentos
        .map(documento => anioDeFecha(documento.fechaRecibo))
        .filter((anio): anio is number => anio !== null)])).sort((a, b) => b - a);
    const ventanaPrevisualizacionRef =
        useRef<Window | null>(null);

// ==================================================
    // CARGAR FIRMAS Y SELLOS
    // ==================================================

    async function cargarFirmasYSellos() {

        try {

            const [
                responseFirmas,
                responseSellos,
            ] = await Promise.all([

                fetch(
                    "/api/firmas",
                    {
                        cache: "no-store",
                        credentials: "include",
                    }
                ),

                fetch(
                    "/api/sellos",
                    {
                        cache: "no-store",
                        credentials: "include",
                    }
                ),

            ]);

            const dataFirmas =
                await responseFirmas.json();

            const dataSellos =
                await responseSellos.json();

            if (
                !responseFirmas.ok ||
                !dataFirmas.ok
            ) {
                throw new Error(
                    dataFirmas.error ||
                    "No fue posible cargar las firmas autorizadas."
                );
            }

            if (
                !responseSellos.ok ||
                !dataSellos.ok
            ) {
                throw new Error(
                    dataSellos.error ||
                    "No fue posible cargar los sellos institucionales."
                );
            }

            const firmasActivas =
                Array.isArray(dataFirmas.firmas)
                    ? dataFirmas.firmas.filter(
                        (item: FirmaUsuario) =>
                            item.activo === "SI"
                    )
                    : [];

            const sellosActivos =
                Array.isArray(dataSellos.sellos)
                    ? dataSellos.sellos.filter(
                        (item: SelloInstitucional) =>
                            item.activo === "SI"
                    )
                    : [];

            setFirmas(firmasActivas);
            setSellos(sellosActivos);

            setIdFirmaSeleccionada(
                firmasActivas[0]?.idFirma || ""
            );

            setIdSelloSeleccionado(
                sellosActivos[0]?.idSello || ""
            );

        }

        catch (err: any) {

            console.error(
                "Error cargando firmas y sellos:",
                err
            );

            throw err;

        }

    }

    // ==================================================
    // CARGAR DOCUMENTOS
    // ==================================================

    async function cargarDocumentos() {

        try {

            setCargando(true);

            setError("");

            const response =
                await fetch(
                    "/api/docfirmar",
                    {
                        cache: "no-store",
                        credentials: "include",
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
                    "No fue posible cargar los documentos."
                );

            }

            setDocumentos(
                Array.isArray(
                    data.documentos
                )
                    ? data.documentos
                    : []
            );

        }

        catch (err: any) {

            console.error(
                "Error cargando DocFirmar:",
                err
            );

            setError(
                err?.message ||
                "No fue posible cargar los documentos pendientes."
            );

            setDocumentos([]);

        }

        finally {

            setCargando(false);

        }

    }

    useEffect(() => {

        cargarDocumentos();

        cargarFirmasYSellos()
            .catch((err: any) => {

                setError(
                    err?.message ||
                    "No fue posible cargar las firmas y sellos."
                );

            });

    }, []);

    useEffect(() => {

        return () => {

            if (pdfPrevisualizacionUrl) {
                URL.revokeObjectURL(
                    pdfPrevisualizacionUrl
                );
            }

        };

    }, [pdfPrevisualizacionUrl]);

    function abrirDocumento(
        documento: Documento
    ) {

        setDocumentoSeleccionado(documento);

        setErrorPrevisualizacion("");

        if (pdfPrevisualizacionUrl) {
            URL.revokeObjectURL(
                pdfPrevisualizacionUrl
            );
        }

        setPdfPrevisualizacionUrl("");
        setPrevisualizacionLista(false);

        setIdFirmaSeleccionada(
            firmas[0]?.idFirma || ""
        );

        setIdSelloSeleccionado(
            sellos[0]?.idSello || ""
        );

    }

    function cerrarDocumento() {

        if (pdfPrevisualizacionUrl) {
            URL.revokeObjectURL(
                pdfPrevisualizacionUrl
            );
        }

        setPdfPrevisualizacionUrl("");
        setPrevisualizacionLista(false);
        setErrorPrevisualizacion("");
        setDocumentoSeleccionado(null);
        setSolicitandoTotp(false);
        setCodigoTotp("");

    }

    async function generarPrevisualizacion() {

        if (!documentoSeleccionado) {
            return;
        }

        if (!idFirmaSeleccionada) {
            setErrorPrevisualizacion(
                "Debe seleccionar una firma autorizada."
            );
            return;
        }

        if (!idSelloSeleccionado) {
            setErrorPrevisualizacion(
                "Debe seleccionar un sello institucional."
            );
            return;
        }

        /*
         * Abrimos la pestaña inmediatamente, antes del await,
         * para evitar que el navegador bloquee el popup.
         */
        const ventanaPrevisualizacion =
            window.open(
                "",
                "_blank"
            );

        if (!ventanaPrevisualizacion) {
            setErrorPrevisualizacion(
                "El navegador bloqueó la nueva pestaña. Permita ventanas emergentes para este sitio e inténtelo nuevamente."
            );
            return;
        }

        ventanaPrevisualizacionRef.current =
            ventanaPrevisualizacion;

        ventanaPrevisualizacion.document.title =
            "Previsualización — Constancia de Registro";

        ventanaPrevisualizacion.document.body.innerHTML = `
            <div style="
                margin:0;
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#e2e8f0;
                font-family:Arial,sans-serif;
                color:#334155;
            ">
                <div style="
                    text-align:center;
                    padding:32px;
                ">
                    <div style="
                        font-size:18px;
                        font-weight:600;
                        margin-bottom:8px;
                    ">
                        Generando previsualización...
                    </div>
                    <div style="
                        font-size:14px;
                        color:#64748b;
                    ">
                        Espere un momento.
                    </div>
                </div>
            </div>
        `;

        try {

            setGenerandoPrevisualizacion(true);
            setErrorPrevisualizacion("");

            const response =
                await fetch(
                    "/api/docfirmar/generar-pdf",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            documentoId:
                                documentoSeleccionado.id,
                            idFirma:
                                idFirmaSeleccionada,
                            idSello:
                                idSelloSeleccionado,
                        }),
                    }
                );

            if (!response.ok) {

                let mensaje =
                    "No fue posible generar la previsualización.";

                try {

                    const data =
                        await response.json();

                    mensaje =
                        data?.error ||
                        mensaje;

                }
                catch {
                    // La respuesta puede no ser JSON.
                }

                throw new Error(mensaje);

            }

            const blob =
                await response.blob();

            if (!blob || blob.size === 0) {

                throw new Error(
                    "La previsualización generada está vacía."
                );

            }

            if (pdfPrevisualizacionUrl) {
                URL.revokeObjectURL(
                    pdfPrevisualizacionUrl
                );
            }

            const url =
                URL.createObjectURL(blob);

            setPdfPrevisualizacionUrl(url);
            setPrevisualizacionLista(true);

            /*
             * El PDF se abre directamente en la nueva pestaña.
             * Ya no utilizamos una segunda modal ni un iframe.
             */
            ventanaPrevisualizacion.location.href =
                url;

        }
        catch (err: any) {

            console.error(
                "Error generando previsualización:",
                err
            );

            try {
                ventanaPrevisualizacion.close();
            }
            catch {
                // La pestaña puede haber sido cerrada por el usuario.
            }

            ventanaPrevisualizacionRef.current =
                null;

            setErrorPrevisualizacion(
                err?.message ||
                "No fue posible generar la previsualización."
            );

        }
        finally {

            setGenerandoPrevisualizacion(false);

        }

    }

    async function firmarYEnviar(codigoTOTP = "") {
        if (!documentoSeleccionado) return;

        const reintentar =
            documentoSeleccionado.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO";

        if (!reintentar && !previsualizacionLista) {
            setErrorPrevisualizacion("Primero genere y revise la previsualización.");
            return;
        }

        if (!reintentar && !codigoTOTP) {
            setSolicitandoTotp(true);
            setErrorPrevisualizacion("");
            return;
        }

        if (!reintentar && !/^\d{6}$/.test(codigoTOTP)) {
            setErrorPrevisualizacion("Ingrese el código vigente de 6 dígitos de Google Authenticator.");
            return;
        }

        setEnviandoCorreo(true);
        setErrorPrevisualizacion("");

        try {
            const response = await fetch("/api/docfirmar/generar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    accion: reintentar ? "reenviar" : "firmar-enviar",
                    documentoId: documentoSeleccionado.id,
                    idFirma: idFirmaSeleccionada,
                    idSello: idSelloSeleccionado,
                    ...(reintentar ? {} : { codigoTOTP }),
                }),
            });

            const resultado = await response.json();
            if (!response.ok || !resultado.ok) {
                throw new Error(resultado.error || "No fue posible completar el envío.");
            }

            setCorreoEnviado(String(resultado.destinatario || ""));
            setSolicitandoTotp(false);
            setCodigoTotp("");
            cerrarDocumento();
            await cargarDocumentos();
        } catch (error: unknown) {
            setErrorPrevisualizacion(error instanceof Error ? error.message : "No fue posible enviar la constancia.");
            await cargarDocumentos();
        } finally {
            setEnviandoCorreo(false);
        }
    }

    async function abrirPdfFirmado(documento: Documento) {
        setAccionDocumentoId(documento.id);
        try {
            const response = await fetch("/api/docfirmar/generar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ accion: "imprimir", documentoId: documento.id }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "No fue posible abrir el PDF firmado.");
            }
            const url = URL.createObjectURL(await response.blob());
            const ventana = window.open(url, "_blank");
            if (!ventana) {
                URL.revokeObjectURL(url);
                throw new Error("El navegador bloqueó la ventana del PDF. Permita ventanas emergentes e inténtelo nuevamente.");
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            setErrorPrevisualizacion(error instanceof Error ? error.message : "No fue posible abrir el PDF firmado.");
        } finally {
            setAccionDocumentoId("");
        }
    }

    async function reenviarPdfFirmado(documento: Documento) {
        setAccionDocumentoId(documento.id);
        try {
            const response = await fetch("/api/docfirmar/generar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ accion: "reenviar", documentoId: documento.id }),
            });
            const resultado = await response.json();
            if (!response.ok || !resultado.ok) throw new Error(resultado.error || "No fue posible reenviar la constancia.");
            setCorreoEnviado(String(resultado.destinatario || documento.correoDestino || ""));
            await cargarDocumentos();
        } catch (error) {
            setError(error instanceof Error ? error.message : "No fue posible reenviar la constancia.");
        } finally {
            setAccionDocumentoId("");
        }
    }

    // ==================================================
    // RENDER
    // ==================================================

    return (

        <SistemaLayout
            titulo="Consulnet Barranquilla"
            permiso={MODULOS.ADMIN}
        >

            <div className="space-y-6">

                {correoEnviado && (
                    <div
                        role="status"
                        className="fixed bottom-6 right-6 z-[120] w-[min(92vw,440px)] rounded-2xl border border-emerald-200 bg-white p-5 shadow-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700" aria-hidden="true">
                                ✓
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-bold text-slate-900">Constancia enviada</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    El documento firmado fue enviado por correo a <strong className="break-all text-slate-800">{correoEnviado}</strong>.
                                </p>
                                <p className="mt-2 text-xs text-slate-500">El estado del documento se actualizó a “Entregado”.</p>
                            </div>
                            <button type="button" onClick={() => setCorreoEnviado("")} aria-label="Cerrar confirmación" className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
                        </div>
                    </div>
                )}

                {/* ==========================================
                    CABECERA DEL MÓDULO
                =========================================== */}

                <div
                    className="
                        bg-white
                        rounded-2xl
                        shadow-md
                        border-l-4
                        border-blue-700
                        p-6
                    "
                >

                    <div
                        className="
                            flex
                            flex-col
                            md:flex-row
                            md:items-center
                            md:justify-between
                            gap-4
                        "
                    >

                        <div>

                            <h2
                                className="
                                    text-2xl
                                    font-bold
                                    text-blue-950
                                "
                            >
                                {vistaLista === "PENDIENTES" ? "✍ Documentos para Firma" : "Documentos Firmados"}
                            </h2>

                            <p
                                className="
                                    mt-2
                                    text-slate-600
                                "
                            >
                                {vistaLista === "PENDIENTES"
                                    ? "Revise, firme y envíe las constancias pendientes."
                                    : "Consulte, imprima o reenvíe constancias firmadas."}
                            </p>

                        </div>

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                className="
                                    px-4
                                    py-3
                                    rounded-xl
                                    bg-amber-50
                                    border
                                    border-amber-200
                                    text-amber-800
                                    text-sm
                                    font-semibold
                                    whitespace-nowrap
                                "
                            >
                                {vistaLista === "PENDIENTES"
                                    ? documentos.filter(d => d.estadoProcesamiento !== "ENTREGADO" && anioDeFecha(d.fechaRecibo) === Number(anioFiltro)).length
                                    : documentos.filter(d => d.estadoProcesamiento === "ENTREGADO" && anioDeFecha(d.fechaRecibo) === Number(anioFiltro)).length}{" "}
                                {vistaLista === "PENDIENTES" ? "pendientes" : "firmados"}
                            </div>

                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                Año
                                <select value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)} disabled={cargando} className="min-w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100">
                                    {(aniosDisponibles.length ? aniosDisponibles : [new Date().getFullYear()]).map(anio => <option key={anio} value={anio}>{anio}</option>)}
                                </select>
                            </label>

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
                                    py-3
                                    rounded-xl
                                    border
                                    border-slate-300
                                    bg-white
                                    text-slate-700
                                    font-semibold
                                    hover:bg-slate-50
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                    transition
                                "
                            >
                                ↻ Actualizar
                            </button>

                        </div>

                    </div>

                </div>

                {/* ==========================================
                    ERROR
                =========================================== */}

                {error && (

                    <div
                        className="
                            bg-red-50
                            border
                            border-red-200
                            rounded-2xl
                            p-4
                            text-red-700
                        "
                    >

                        <div
                            className="
                                font-semibold
                            "
                        >
                            No fue posible cargar los documentos
                        </div>

                        <div
                            className="
                                text-sm
                                mt-1
                            "
                        >
                            {error}
                        </div>

                    </div>

                )}

                {/* ==========================================
                    CONTENIDO
                =========================================== */}

                <div className="flex gap-2 border-b border-slate-200 px-2">
                    <button type="button" onClick={() => setVistaLista("PENDIENTES")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${vistaLista === "PENDIENTES" ? "border-blue-700 text-blue-800" : "border-transparent text-slate-500"}`}>Pendientes de firma</button>
                    <button type="button" onClick={() => setVistaLista("FIRMADOS")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${vistaLista === "FIRMADOS" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500"}`}>Firmados y enviados</button>
                </div>

                <div
                    className="
                        bg-white
                        rounded-2xl
                        shadow-md
                        overflow-hidden
                    "
                >

                    {cargando ? (

                        <div
                            className="
                                p-12
                                text-center
                                text-slate-500
                            "
                        >

                            <div
                                className="
                                    text-3xl
                                    mb-3
                                "
                            >
                                ⏳
                            </div>

                            <div
                                className="
                                    font-medium
                                "
                            >
                                Cargando documentos pendientes de firma...
                            </div>

                        </div>

                    ) : documentos.filter(d => (vistaLista === "FIRMADOS" ? d.estadoProcesamiento === "ENTREGADO" : d.estadoProcesamiento !== "ENTREGADO") && anioDeFecha(d.fechaRecibo) === Number(anioFiltro)).length === 0 ? (

                        <div
                            className="
                                p-12
                                text-center
                                text-slate-500
                            "
                        >

                            <div
                                className="
                                    text-4xl
                                    mb-3
                                "
                            >
                                ✓
                            </div>

                            <div
                                className="
                                    text-lg
                                    font-semibold
                                    text-slate-700
                                "
                            >
                                {vistaLista === "PENDIENTES" ? "No hay documentos pendientes de firma" : "No hay documentos firmados y enviados"}
                            </div>

                            <div
                                className="
                                    text-sm
                                    mt-2
                                "
                            >
                                Los Documentos que
                                requieran firma aparecerán aquí.
                            </div>

                        </div>

                    ) : (

                        <div
                            className="
                                overflow-x-auto
                            "
                        >

                            <table
                                className="
                                    w-full
                                    border-collapse
                                "
                            >

                                <thead>

                                    <tr
                                        className="
                                            bg-slate-100
                                            border-b
                                            border-slate-200
                                        "
                                    >

                                        <th className="
    px-4
    py-3
    text-left
    text-xs
    font-semibold
    uppercase
    tracking-wide
">

    Actuación

</th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-left
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Fecha
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-left
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Ciudadano
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-left
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Documento
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-left
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Planilla
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-center
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Estado
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-center
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                            "
                                        >
                                            Acción
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {documentos.filter(d => (vistaLista === "FIRMADOS" ? d.estadoProcesamiento === "ENTREGADO" : d.estadoProcesamiento !== "ENTREGADO") && anioDeFecha(d.fechaRecibo) === Number(anioFiltro)).map(
                                        documento => (

                                            <tr
                                                key={
                                                    documento.id
                                                }
                                                className="
                                                    border-b
                                                    border-slate-100
                                                    hover:bg-slate-50
                                                    transition
                                                "
                                            >

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-bold
                                                        text-blue-950
                                                    "
                                                >
                                                    {
                                                        documento.codigoActuacion || "—"
                                                    }
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-slate-600
                                                        whitespace-nowrap
                                                    "
                                                >
                                                    {
                                                        documento.fechaRecibo
                                                    }
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-slate-700
                                                    "
                                                >
                                                    {
                                                        documento.solicitante
                                                    }
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-slate-700
                                                        font-medium
                                                    "
                                                >
                                                    {
                                                        documento.documento
                                                    }
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-slate-600
                                                    "
                                                >
                                                    {
                                                        documento.planillaGC ||
                                                        "—"
                                                    }
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-center
                                                    "
                                                >

                                                    <span
                                                        className={`
                                                            inline-flex
                                                            items-center
                                                            px-3
                                                            py-1.5
                                                            rounded-full
                                                            ${documento.estadoProcesamiento === "ENTREGADO" ? "bg-emerald-100 text-emerald-800" : documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800"}
                                                            text-xs
                                                            font-bold
                                                            whitespace-nowrap
                                                        `}
                                                    >
                                                        {documento.estadoProcesamiento === "ENTREGADO" ? "Enviado por correo" : documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ? "Firma lista; correo pendiente" : "⚠ Pendiente de Firma"}
                                                    </span>

                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-center
                                                    "
                                                >

                                                    {vistaLista === "FIRMADOS" ? (
                                                        <div className="flex flex-wrap justify-center gap-2">
                                                            <button type="button" disabled={accionDocumentoId === documento.id} onClick={() => abrirPdfFirmado(documento)} className="rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{accionDocumentoId === documento.id ? "Abriendo…" : "Imprimir PDF"}</button>
                                                            <button type="button" disabled={accionDocumentoId === documento.id} onClick={() => reenviarPdfFirmado(documento)} className="rounded-xl bg-violet-600 px-3 py-2 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">Reenviar correo</button>
                                                        </div>
                                                    ) : <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirDocumento(
                                                                documento
                                                            )
                                                        }
                                                        className="
                                                            px-4
                                                            py-2
                                                            rounded-xl
                                                            bg-blue-600
                                                            hover:bg-blue-700
                                                            text-white
                                                            font-semibold
                                                            transition
                                                            whitespace-nowrap
                                                        "
                                                    >
                                                        {documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ? "Reintentar envío" : "👁 Revisar"}
                                                    </button>}

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* ==================================================
                MODAL DE REVISIÓN

                Se monta mediante createPortal directamente
                sobre document.body para evitar que SistemaLayout
                limite el position: fixed del modal.
            =================================================== */}

            {documentoSeleccionado &&
                typeof document !== "undefined" &&
                createPortal(

                    <div
    className="
        fixed
        inset-0
        z-[9999]
        bg-black/60
        flex
        items-start
        justify-center
        p-4
        overflow-hidden
    "
>

                        <div
    className="
        w-full
        max-w-4xl
        h-auto
        max-h-[calc(100vh-32px)]
        mt-0
        bg-white
        rounded-2xl
        shadow-2xl
        overflow-hidden
        flex
        flex-col
    "
>

                            {/* ======================================
                                CABECERA MODAL
                            ======================================= */}

                            <div
                                className="
                                    shrink-0
                                    px-6
                                    py-4
                                    border-b
                                    border-slate-200
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
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
                                        Revisar Constancia de Registro
                                    </h2>

                                    <div
                                        className="
                                            mt-1
                                            text-sm
                                            text-slate-500
                                        "
                                    >
                                        Registro:{" "}
                                        <span
                                            className="
                                                font-semibold
                                                text-slate-700
                                            "
                                        >
                                            {
                                                documentoSeleccionado.recibo
                                            }
                                        </span>
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        cerrarDocumento
                                    }
                                    className="
                                        shrink-0
                                        w-9
                                        h-9
                                        rounded-full
                                        flex
                                        items-center
                                        justify-center
                                        text-slate-500
                                        hover:bg-slate-100
                                        hover:text-slate-700
                                        text-2xl
                                        transition
                                    "
                                    aria-label="Cerrar"
                                >
                                    ×
                                </button>

                            </div>

                            {/* ======================================
                                CONTENIDO MODAL
                            ======================================= */}

                            <div
    className="
        flex-1
        min-h-0
        overflow-y-auto
        p-5
        bg-slate-50
    "
>

                                <div
    className="
        flex
        flex-col
        gap-4
        w-full
        min-h-0
    "
>

                                    {/* ==================================
                                        INFORMACIÓN
                                    =================================== */}

                                    <div
    className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-slate-200
        p-4
        w-full
        max-w-3xl
        mx-auto
        shrink-0
        overflow-visible
    "
>

                                        <div
                                            className="
                                                text-sm
                                                font-semibold
                                                text-blue-700
                                                mb-1
                                            "
                                        >
                                            Datos del documento
                                        </div>

                                        <h3
                                            className="
                                                text-lg
                                                font-bold
                                                text-blue-950
                                                mb-3
                                            "
                                        >
                                            Constancia de Registro
                                        </h3>

                                        <div
                                            className="
                                                space-y-2
                                            "
                                        >

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Registro
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        font-bold
                                                        text-slate-800
                                                    "
                                                >
                                                    {
                                                        documentoSeleccionado.recibo
                                                    }
                                                </div>

                                            </div>

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Fecha
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        text-slate-700
                                                    "
                                                >
                                                    {
                                                        documentoSeleccionado.fechaRecibo
                                                    }
                                                </div>

                                            </div>

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Ciudadano
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        font-semibold
                                                        text-slate-800
                                                    "
                                                >
                                                    {
                                                        documentoSeleccionado.solicitante
                                                    }
                                                </div>

                                            </div>

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Documento
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        text-slate-700
                                                    "
                                                >
                                                    {
                                                        documentoSeleccionado.documento
                                                    }
                                                </div>

                                            </div>

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Planilla
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        text-slate-700
                                                    "
                                                >
                                                    {
                                                        documentoSeleccionado.planillaGC ||
                                                        "—"
                                                    }
                                                </div>

                                            </div>

                                        </div>

                                        <div
                                            className="
                                                mt-2
        space-y-2
                                            "
                                        >

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Firma autorizada
                                                </div>

                                                <select
                                                    value={idFirmaSeleccionada}
                                                    onChange={(event) => {
                                                        setIdFirmaSeleccionada(
                                                            event.target.value
                                                        );
                                                        setPrevisualizacionLista(false);
                                                    }}
                                                    disabled={
                                                        generandoPrevisualizacion ||
                                                        firmas.length === 0
                                                    }
                                                    className="
                                                        mt-1
                                                        w-full
                                                        rounded-xl
                                                        border
                                                        border-slate-300
                                                        bg-white
                                                        px-3
                                                        py-2.5
                                                        text-sm
                                                        text-slate-700
                                                        outline-none
                                                        focus:border-blue-500
                                                        focus:ring-2
                                                        focus:ring-blue-100
                                                        disabled:bg-slate-100
                                                    "
                                                >
                                                    {firmas.length === 0 ? (
                                                        <option value="">
                                                            No hay firmas activas
                                                        </option>
                                                    ) : (
                                                        firmas.map((firma) => (
                                                            <option
                                                                key={firma.idFirma}
                                                                value={firma.idFirma}
                                                            >
                                                                {firma.nombreFirma}
                                                            </option>
                                                        ))
                                                    )}
                                                </select>

                                            </div>

                                            <div>

                                                <div
                                                    className="
                                                        text-xs
                                                        uppercase
                                                        tracking-wide
                                                        text-slate-400
                                                        font-semibold
                                                    "
                                                >
                                                    Sello institucional
                                                </div>

                                                <select
                                                    value={idSelloSeleccionado}
                                                    onChange={(event) => {
                                                        setIdSelloSeleccionado(
                                                            event.target.value
                                                        );
                                                        setPrevisualizacionLista(false);
                                                    }}
                                                    disabled={
                                                        generandoPrevisualizacion ||
                                                        sellos.length === 0
                                                    }
                                                    className="
                                                        mt-1
                                                        w-full
                                                        rounded-xl
                                                        border
                                                        border-slate-300
                                                        bg-white
                                                        px-3
                                                        py-2.5
                                                        text-sm
                                                        text-slate-700
                                                        outline-none
                                                        focus:border-blue-500
                                                        focus:ring-2
                                                        focus:ring-blue-100
                                                        disabled:bg-slate-100
                                                    "
                                                >
                                                    {sellos.length === 0 ? (
                                                        <option value="">
                                                            No hay sellos activos
                                                        </option>
                                                    ) : (
                                                        sellos.map((sello) => (
                                                            <option
                                                                key={sello.idSello}
                                                                value={sello.idSello}
                                                            >
                                                                {sello.nombreSello}
                                                            </option>
                                                        ))
                                                    )}
                                                </select>

                                            </div>

                                        </div>

                                        {errorPrevisualizacion && (

                                            <div
                                                className="
                                                    mt-4
                                                    p-3
                                                    rounded-xl
                                                    bg-red-50
                                                    border
                                                    border-red-200
                                                    text-red-700
                                                    text-sm
                                                "
                                            >
                                                {errorPrevisualizacion}
                                            </div>

                                        )}

                                        <div
                                            className="
                                                mt-3
                                                p-3
                                                rounded-xl
                                                bg-amber-50
                                                border
                                                border-amber-200
                                            "
                                        >

                                            <div
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-amber-800
                                                "
                                            >
                                                ⚠ Pendiente de Firma
                                            </div>

                                            <div
                                                className="
                                                    mt-1
                                                    text-xs
                                                    text-amber-700
                                                "
                                            >
                                                Este documento debe ser
                                                revisado y autorizado antes
                                                de generar la versión
                                                definitiva.
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* ======================================
                                PIE MODAL
                            ======================================= */}

                            <div
                                className="
                                    shrink-0
                                    px-6
                                    py-4
                                    border-t
                                    border-slate-200
                                    bg-white
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    Seleccione firma y sello para generar la previsualización.
                                </div>

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-3
                                    "
                                >

                                    <button
                                        type="button"
                                        onClick={
                                            generarPrevisualizacion
                                        }
                                        disabled={
                                            generandoPrevisualizacion ||
                                            documentoSeleccionado.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ||
                                            !idFirmaSeleccionada ||
                                            !idSelloSeleccionado
                                        }
                                        className="
                                            px-5
                                            py-2.5
                                            rounded-xl
                                            bg-blue-600
                                            text-white
                                            font-semibold
                                            hover:bg-blue-700
                                            disabled:opacity-50
                                            disabled:cursor-not-allowed
                                            transition
                                        "
                                    >
                                        {generandoPrevisualizacion
                                            ? "⏳ Generando..."
                                            : "✍ Generar previsualización"}
                                    </button>

                                    {documentoSeleccionado.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" && (
                                        <button
                                            type="button"
                                            onClick={() => firmarYEnviar()}
                                            disabled={enviandoCorreo || generandoPrevisualizacion}
                                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                                        >
                                            {enviandoCorreo
                                                ? "Enviando..."
                                                : "Reintentar envío"}
                                        </button>
                                    )}

                                    {previsualizacionLista && documentoSeleccionado.estadoProcesamiento !== "FIRMADO_PENDIENTE_ENVIO" && !solicitandoTotp && (
                                        <button type="button" onClick={() => firmarYEnviar()} disabled={enviandoCorreo || generandoPrevisualizacion} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                                            Firmar y enviar por correo
                                        </button>
                                    )}

                                    {solicitandoTotp && (
                                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <label htmlFor="codigo-totp-firma" className="text-sm font-semibold text-slate-700">Código de Google Authenticator</label>
                                            <input id="codigo-totp-firma" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigoTotp} onChange={event => setCodigoTotp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:ring-2 focus:ring-amber-400" />
                                            <button type="button" onClick={() => firmarYEnviar(codigoTotp)} disabled={codigoTotp.length !== 6 || enviandoCorreo} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{enviandoCorreo ? "Validando…" : "Confirmar firma"}</button>
                                            <button type="button" onClick={() => { setSolicitandoTotp(false); setCodigoTotp(""); }} disabled={enviandoCorreo} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Cancelar</button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={
                                            cerrarDocumento
                                        }
                                    className="
                                        px-5
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        text-slate-700
                                        font-semibold
                                        hover:bg-slate-50
                                        transition
                                    "
                                >
                                    Cerrar
                                </button>

                            </div>

                        </div>

                    </div>
</div>, 
                    document.body

                )
            }

            

        </SistemaLayout>

    );

}
