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

    useEffect(() => {

        if (documento) {

            setEditando({

                ...documento,

            });

        }

    }, [documento]);

    if (!editando) {

        return null;

    }

    async function guardar() {

        try {

            setGuardando(true);

            await onGuardar(editando!);

            onClose();

        }

        finally {

            setGuardando(false);

        }

    }

    return (

        <DocumentoDrawer

            open={open}

            title="Editar Documento"

            subtitle={`${editando.categoria} · ${editando.planillaGC}`}

            onClose={onClose}

            onSave={guardar}

            saveLabel="Guardar Cambios"

            saving={guardando}

        >

            <DocumentoForm

                categoria={

                    editando.categoria

                }

                documento={

                    editando

                }

                modo="editar"

                onChange={(cambios)=>

                    setEditando({

                        ...editando,

                        ...cambios,

                    })

                }

            />

        </DocumentoDrawer>

    );

}