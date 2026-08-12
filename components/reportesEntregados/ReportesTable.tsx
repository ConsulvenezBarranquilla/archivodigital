"use client";

import {

    useMemo,

} from "react";

import DataTable, {

    TableColumn,

} from "@/components/table/DataTable";

import AccionesReporte from "@/components/reportesEntregados/AccionesReporte";

import {

    CategoriaDocumento,

    ReporteEntregado,

} from "@/types/ReporteEntregado";

import {

    obtenerColumnas,

} from "@/lib/reportesEntregados/columnas";

interface Props {

    categoria: CategoriaDocumento;

    busqueda: string;

    documentos?: ReporteEntregado[];

    onEditar: (
        documento: ReporteEntregado
    ) => void;

    onEntregar: (
        documento: ReporteEntregado
    ) => void;

}

export default function ReportesTable({

    categoria,

    busqueda,

    documentos = [],

    onEditar,

    onEntregar,

}: Props) {

    const columnas = useMemo(() => {

        const columnasBase =

            obtenerColumnas(

                categoria

            );

        const columnaAcciones: TableColumn<ReporteEntregado> = {

            field: "id",

            title: "Acciones",

            width: "180px",

            align: "center",

            render: (row) => (

               <AccionesReporte
    categoria={categoria}
    documento={row}
    onEditar={onEditar}
    onEntregar={onEntregar}
/>

            ),

        };

        return [

            ...columnasBase,

            columnaAcciones,

        ];

    },

    [

        categoria,

        onEditar,
    onEntregar,

    ]);

    const datosFiltrados = useMemo(() => {

        if (

            !busqueda.trim()

        ) {

            return documentos;

        }

        const texto =

            busqueda.toLowerCase();

        return documentos.filter(

            (item) =>

                item.recibo

                    ?.toLowerCase()

                    .includes(texto)

                ||

                item.planillaGC

                    ?.toLowerCase()

                    .includes(texto)

                ||

                item.solicitante

                    ?.toLowerCase()

                    .includes(texto)

                ||

                item.documento

                    ?.toLowerCase()

                    .includes(texto)

        );

    },

    [

        documentos,

        busqueda,

    ]);

    return (

        <DataTable

            columns={

                columnas

            }

            data={

                datosFiltrados

            }

            getRowKey={(row) =>

                row.id

            }

        />

    );

}