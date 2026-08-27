"use client";

import { useEffect, useState } from "react";

import DocumentoDrawer from "./DocumentoDrawer";
import DocumentoForm from "./DocumentoForm";

import {
    ReporteEntregado,
} from "@/types/ReporteEntregado";

interface Props {

    open: boolean;

    documento: ReporteEntregado | null;

    onClose: () => void;

    onGuardar: (
        documento: ReporteEntregado
    ) => Promise<void>;

}

export default function DrawerEditar({

    open,

    documento,

    onClose,

    onGuardar,

}: Props) {

    const [
        editando,
        setEditando,
    ] = useState<ReporteEntregado | null>(null);

    const [
        guardando,
        setGuardando,
    ] = useState(false);

    const [
        errorValidacion,
        setErrorValidacion,
    ] = useState("");

    // ======================================================
    // Cargar documento
    // ======================================================

    useEffect(() => {

        if (!documento) {

            setEditando(null);

            return;

        }

        setEditando({

            ...documento,

        });

        setErrorValidacion("");

    }, [documento]);

    // ======================================================
    // Validación
    // ======================================================

    function validarDocumento(
        documento: ReporteEntregado
    ): string | null {

// ==================================================
// VISA
// ==================================================

if (
    documento.categoria ===
    "VISA"
) {

    const estado =
        (
            documento.estado
            ?? ""
        ).trim().toUpperCase();

    // ----------------------------------------------
    // El estado siempre es obligatorio
    // ----------------------------------------------

    if (!estado) {

        return (
            "Debe seleccionar el estado de la visa."
        );

    }

    // ----------------------------------------------
    // VISA NEGADA
    //
    // Una visa rechazada/negada NO requiere:
    // - N° Etiqueta
    // - Fecha de Vencimiento
    // ----------------------------------------------

    if (
        estado === "RECHAZADA" ||
        estado === "NEGADA"
    ) {

        return null;

    }

    // ----------------------------------------------
    // VISA EN PROCESO / APROBADA
    //
    // Requiere etiqueta y vencimiento.
    // ----------------------------------------------

    const numeroVisa =
        (
            documento.numeroVisa
            ?? ""
        ).trim();

    const fechaVencimiento =
        (
            documento.fechaVencimiento
            ?? ""
        ).trim();

    const faltantes: string[] = [];

    if (!numeroVisa) {

        faltantes.push(
            "N° Etiqueta"
        );

    }

    if (!fechaVencimiento) {

        faltantes.push(
            "Fecha de Vencimiento"
        );

    }

    if (
        faltantes.length > 0
    ) {

        return (
            "Debe completar los siguientes campos: " +
            faltantes.join(", ") +
            "."
        );

    }

    return null;

}

        // ==================================================
        // PASAPORTES
        // ==================================================

        if (
            documento.categoria !==
            "PASAPORTES"
        ) {

            return null;

        }

        const titular =
            (
                documento.titularPasaporte
                ?? ""
            ).trim();

        const numeroPasaporte =
            (
                documento.numeroPasaporte
                ?? ""
            ).trim();

        const fechaValija =
            (
                documento.fechaValija
                ?? ""
            ).trim();

        const fechaEmision =
            (
                documento.fechaEmision
                ?? ""
            ).trim();

        const fechaVencimiento =
            (
                documento.fechaVencimiento
                ?? ""
            ).trim();

        const faltantes: string[] = [];

        // ==================================================
        // Campos obligatorios
        // ==================================================

        if (!titular) {

            faltantes.push(
                "Titular"
            );

        }

        if (!numeroPasaporte) {

            faltantes.push(
                "Número de Pasaporte"
            );

        }

        if (!fechaValija) {

            faltantes.push(
                "Fecha de Valija"
            );

        }

        if (!fechaEmision) {

            faltantes.push(
                "Fecha de Emisión"
            );

        }

        if (!fechaVencimiento) {

            faltantes.push(
                "Fecha de Vencimiento"
            );

        }

        // ==================================================
        // Mostrar campos faltantes
        // ==================================================

        if (
            faltantes.length > 0
        ) {

            return (
                "Debe completar los siguientes campos: " +
                faltantes.join(", ") +
                "."
            );

        }

        // ==================================================
        // Número de pasaporte
        // ==================================================

        if (
            !/^\d+$/.test(
                numeroPasaporte
            )
        ) {

            return (
                "El número de pasaporte debe contener únicamente números."
            );

        }

        return null;

    }

    // ======================================================
    // Guardar
    // ======================================================

    async function guardar() {

        // --------------------------------------------------
        // Obtener una referencia local no nula
        // --------------------------------------------------

        const documentoActual =
            editando;

        if (!documentoActual) {

            return;

        }

        // --------------------------------------------------
        // Validar
        // --------------------------------------------------

        const error =
            validarDocumento(
                documentoActual
            );

        if (error) {

            setErrorValidacion(
                error
            );

            return;

        }

        try {

            setErrorValidacion("");

            setGuardando(true);

            await onGuardar(
                documentoActual
            );

            onClose();

        }

        catch (error) {

            console.error(
                "Error guardando documento:",
                error
            );

            setErrorValidacion(

                error instanceof Error

                    ? error.message

                    : "No fue posible guardar el documento."

            );

        }

        finally {

            setGuardando(false);

        }

    }

    // ======================================================
    // No hay documento
    // ======================================================

    if (!editando) {

        return null;

    }

    // ======================================================
    // Render
    // ======================================================

    return (

        <DocumentoDrawer

            open={open}

            title="Editar Documento"

            subtitle={
                `${editando.categoria} · ${editando.planillaGC}`
            }

            onClose={() => {

                setErrorValidacion("");

                onClose();

            }}

            onSave={guardar}

            saveLabel="Guardar Cambios"

            saving={guardando}

        >

            {/* ==========================================
                ERROR DE VALIDACIÓN
            ========================================== */}

            {

                errorValidacion && (

                    <div
                        className="
                            mb-5
                            rounded-lg
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-sm
                            text-red-700
                        "
                    >

                        <div
                            className="
                                mb-1
                                font-semibold
                            "
                        >

                            No se puede guardar

                        </div>

                        <div>

                            {errorValidacion}

                        </div>

                    </div>

                )

            }

            {/* ==========================================
                FORMULARIO
            ========================================== */}

            <DocumentoForm

                categoria={
                    editando.categoria
                }

                documento={
                    editando
                }

                modo="editar"

                onChange={(
                    cambios
                ) => {

                    setErrorValidacion("");

                    setEditando({

                        ...editando,

                        ...cambios,

                    });

                }}

            />

        </DocumentoDrawer>

    );

}