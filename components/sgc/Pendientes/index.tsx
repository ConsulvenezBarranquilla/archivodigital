"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ui/Button";

import DataTable from "@/components/table/DataTable";
import DataTableToolbar from "@/components/table/DataTableToolbar";

import ModalVincular from "@/components/sgc/ModalVincular";

import { obtenerColumnasPendientes } from "./columns";

import {

  ActuacionGestion,

  ActuacionPendiente,

  SinPlanillaForm,

  VincularPlanillaForm,

} from "@/types/GestionConsular";

interface PendientesProps {

  registros: ActuacionPendiente[];

  cargando: boolean;

  onGuardar: (

    datos: VincularPlanillaForm

  ) => Promise<void>;

  onRegistrarSinPlanilla: (

    datos: SinPlanillaForm

  ) => Promise<void>;

  onAbrirCiudadano: (

    documento: string

  ) => void;

}

export default function Pendientes({

  registros,

  cargando,

  onGuardar,

  onRegistrarSinPlanilla,

  onAbrirCiudadano,

}: PendientesProps) {

  const [

    busqueda,

    setBusqueda,

  ] = useState("");

  const [

    seleccion,

    setSeleccion,

  ] = useState<ActuacionPendiente[]>([]);

const [
  selectedKeys,
  setSelectedKeys,
] = useState<string[]>([]);

const documentoSeleccionado = useMemo(() => {
  if (seleccion.length === 0) {
    return null;
  }

  return seleccion[0].documento;
}, [seleccion]);

  const [

    modalAbierto,

    setModalAbierto,

  ] = useState(false);

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

    );

  }, [

    registros,

    busqueda,

  ]);
const registrosMostrados = useMemo(() => {

  if (!documentoSeleccionado) {
    return registrosFiltrados;
  }

  return registrosFiltrados.map(item => ({
    ...item,
    bloqueado:
      item.documento !== documentoSeleccionado
  }));

}, [
  registrosFiltrados,
  documentoSeleccionado
]);
  const columns = useMemo(

    () =>

      obtenerColumnasPendientes(

        onAbrirCiudadano

      ),

    [

      onAbrirCiudadano,

    ]

  );

  const getRowKey = (
  row: ActuacionPendiente,
  index: number
) =>
  `${row.recibo}-${row.codigo}-${row.documento}-${index}`;


  async function guardar(

    datos: VincularPlanillaForm

  ) {

    await onGuardar(

      datos

    );

    setModalAbierto(false);

    setSeleccion([]);
    setSelectedKeys([]);

  }

  async function registrarSinPlanilla() {

  if (seleccion.length === 0) {

    return;

  }

  const confirmar = window.confirm(

    "¿Registrar las actuaciones seleccionadas como SIN PLANILLA?"

  );

  if (!confirmar) {

    return;

  }

  const actuaciones: ActuacionGestion[] =

    seleccion.map(item => ({

      recibo: item.recibo,

      codigo: item.codigo,

      actuacion: item.actuacion,

      numeroActuacion: "",

    }));

  try {

    await onRegistrarSinPlanilla({

      actuaciones,

      observaciones: "",

    });

    setSeleccion([]);
    setSelectedKeys([]);

  }

  catch (error) {

    console.error(error);

  }

}   // ← ESTA LLAVE FALTABA
  

console.log("DataTable:", DataTable);


console.log("ModalVincular:", ModalVincular);
  return (
  <>
    <DataTableToolbar
      titulo="Actuaciones pendientes"
      busqueda={busqueda}
      onBusquedaChange={setBusqueda}
      placeholder="Buscar por documento, nombre, actuación, código o recibo..."
    >
      <div
        className="
          flex
          gap-2
        "
      >
        <Button
          variant="primary"
          disabled={
            seleccion.length === 0 ||
            cargando
          }
          onClick={() =>
            setModalAbierto(true)
          }
        >
          Vincular Planilla
        </Button>

        <Button
          variant="secondary"
          disabled={
            seleccion.length === 0 ||
            cargando
          }
          onClick={
            registrarSinPlanilla
          }
        >
          Registrar SIN PLANILLA
        </Button>
      </div>
    </DataTableToolbar>

   <DataTable
  columns={columns}
  data={registrosMostrados}
  getRowKey={getRowKey}
  selectable
  selectedKeys={selectedKeys}
  isRowSelectable={(row) => {

  if (!documentoSeleccionado) {
    return true;
  }

  return row.documento === documentoSeleccionado;

}}
  onSelectionChange={(keys) => {

  setSelectedKeys(keys);

  setSeleccion(

    registrosFiltrados.filter(

      (item, index) =>

        keys.includes(

          getRowKey(item, index)

        )

    )

  );

}}
/>

    <ModalVincular
      open={modalAbierto}
      actuaciones={seleccion}
      onClose={() =>
        setModalAbierto(false)
      }
      onGuardar={guardar}
    />
  </>
);

}

