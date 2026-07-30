"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ui/Button";

import DataTable from "@/components/table/DataTable";
import DataTableToolbar from "@/components/table/DataTableToolbar";

import {

  ActuacionVinculada,
  DesvincularPlanillaForm,

} from "@/types/GestionConsular";

import {

  obtenerColumnasVinculadas,

} from "./columns";

interface VinculadasProps {

  registros: ActuacionVinculada[];

  cargando: boolean;

  onAbrirCiudadano: (

    documento: string

  ) => void;

  onDesvincular: (

    datos: DesvincularPlanillaForm

  ) => Promise<void>;

}

export default function Vinculadas({

  registros,

  cargando,

  onAbrirCiudadano,

  onDesvincular,

}: VinculadasProps) {

  const [

    busqueda,

    setBusqueda,

  ] = useState("");

  const [

    seleccion,

    setSeleccion,

  ] = useState<ActuacionVinculada[]>([]);

  const registrosFiltrados = useMemo(() => {

    if (!busqueda.trim()) {

      return registros;

    }

    const texto =

      busqueda.toLowerCase();

    return registros.filter(

      (item) =>

        item.documento

          .toLowerCase()

          .includes(texto)

        ||

        item.nombre

          .toLowerCase()

          .includes(texto)

        ||

        item.actuacion

          .toLowerCase()

          .includes(texto)

        ||

        item.codigo

          .toLowerCase()

          .includes(texto)

        ||

        item.recibo

          .toLowerCase()

          .includes(texto)

        ||

        item.planilla

          .toLowerCase()

          .includes(texto)

    );

  }, [

    registros,

    busqueda,

  ]);

  const columns = useMemo(

    () =>

      obtenerColumnasVinculadas(

        onAbrirCiudadano

      ),

    [

      onAbrirCiudadano,

    ]

  );
 const getRowKey = (
  row: ActuacionVinculada,
  index: number
) =>
  row.numeroActuacion?.trim()
    ? row.numeroActuacion
    : `LEGACY-${row.recibo}-${row.codigo}-${row.documento}-${index}`;
  const selectedKeys = useMemo(

  () =>

    seleccion.map(item => {

      const index = registrosFiltrados.findIndex(

        r =>

          r === item

      );

      return getRowKey(

        item,

        index

      );

    }),

  [

    seleccion,

    registrosFiltrados,

  ]

);
function obtenerActuacionesDePlanillas(
  planillas: string[]
) {
  return registrosFiltrados.filter((item) =>
    planillas.includes(item.planilla)
  );
}
  async function desvincular() {

  if (seleccion.length === 0) {

    return;

  }

  
    const cantidadPlanillas = new Set(
  seleccion.map(item => item.planilla)
).size;

const confirmar = window.confirm(

  `Se desvincularán ${cantidadPlanillas} planilla(s) que contienen ${seleccion.length} actuación(es).\n\n¿Desea continuar?`

);

 
  if (!confirmar) {

    return;

  }

  for (const item of seleccion) {

    await onDesvincular({

  numeroActuacion:
    item.numeroActuacion,

  observaciones: "",

});

  }

  setSeleccion([]);

}

  return (

    <>

      <DataTableToolbar

        titulo="Actuaciones vinculadas"

        busqueda={busqueda}

        onBusquedaChange={setBusqueda}

        placeholder="Buscar por documento, nombre, actuación, código, recibo o planilla..."

      >

        <Button

          variant="danger"

          disabled={

            seleccion.length === 0 ||

            cargando

          }

          onClick={desvincular}

        >

          Desvincular

        </Button>

      </DataTableToolbar>

      <DataTable

  columns={columns}

  data={registrosFiltrados}

  getRowKey={getRowKey}

  selectable

  selectedKeys={selectedKeys}

  onSelectionChange={(keys) => {

  // Filas que el usuario seleccionó directamente
  const filasMarcadas = registrosFiltrados.filter((item, index) =>
    keys.includes(getRowKey(item, index))
  );

  // Planillas únicas seleccionadas
  const planillas = [
    ...new Set(
      filasMarcadas.map(item => item.planilla)
    ),
  ];

  // Seleccionar todas las actuaciones de esas planillas
  setSeleccion(
    obtenerActuacionesDePlanillas(planillas)
  );

}}
hideCheckbox={(row, index) =>
  index > 0 &&
  registrosFiltrados[index - 1].planilla === row.planilla
}
/>

    </>

  );

}