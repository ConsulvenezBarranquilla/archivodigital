"use client";

import { useEffect, useState } from "react";

import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";
import LibroDiarioHeader from "@/components/libroDiario/LibroDiarioHeader";
import LibroDiarioTable from "@/components/libroDiario/LibroDiarioTable";
import ModalMovimiento from "@/components/libroDiario/ModalMovimiento";
import ModalDetalleOperacion from "@/components/libroDiario/ModalDetalleOperacion";
import ModalReporteExcel from "@/components/libroDiario/ModalReporteExcel";
import {
    LibroDiarioResultado,
    MovimientoLibro,
} from "@/types/LibroDiario";

export default function LibroDiarioPage() {

  const [libro, setLibro] =
  useState<LibroDiarioResultado | null>(null);

const [cargando, setCargando] =
  useState(true);

const [mostrarModal, setMostrarModal] =
  useState(false);


const [mostrarDetalle, setMostrarDetalle] =
  useState(false);

const [

  movimientoDetalle,

  setMovimientoDetalle

] = useState<MovimientoLibro | null>(null);

const [

    mostrarReporteExcel,

    setMostrarReporteExcel

] = useState(false);

const [periodo, setPeriodo] = useState(() => {

  const hoy = new Date();

  return `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}`;

});

  useEffect(() => {

    cargarLibro();

}, [periodo]);

  async function cargarLibro() {

  setCargando(true);

  const response =
    await fetch(
      `/api/libro-diario?periodo=${periodo}`
    );

  const data =
    await response.json();

  if (data.ok) {

    setLibro(data.libro);

  }

  setCargando(false);

}

  return (

    <SistemaLayout
      titulo="Consulnet Barranquilla"
      permiso={MODULOS.GESTION_CONSULAR}
    >

      <div className="space-y-6">
        
        {

          cargando ?

            (

              <div>

                Cargando...

              </div>

            )

            :

            (

             <>
  <LibroDiarioHeader

    periodo={periodo}

    saldoInicial={
      libro?.saldoInicial ?? 0
    }

    onPeriodoChange={setPeriodo}

    onNuevoMovimiento={() => {

  setMostrarModal(true);

}}

    onCerrarDia={() => {

      // Próximo sprint

    }}

    onCerrarMes={() => {

      // Próximo sprint

    }}

    esAdmin={true}

    onReporteExcel={() => {

      setMostrarReporteExcel(true);

    }}

  />

  <LibroDiarioTable

    movimientos={

        libro?.movimientos ?? []

    }

    onDetalleOperacion={(movimiento)=>{

    console.log("CLICK", movimiento);

    setMovimientoDetalle(movimiento);

    setMostrarDetalle(true);

}}

        
/>
<ModalMovimiento

  open={mostrarModal}

  onClose={() => {

    setMostrarModal(false);

  }}

  onGuardado={async () => {

    setMostrarModal(false);

    await cargarLibro();

  }}

/>
<ModalDetalleOperacion

    open={mostrarDetalle}

    movimiento={movimientoDetalle}

    onClose={() => {

        setMostrarDetalle(false);

        setMovimientoDetalle(null);

    }}

/>
<ModalReporteExcel
    open={mostrarReporteExcel}
    onClose={() => setMostrarReporteExcel(false)}
    onGenerar={async (

    fechaInicial,

    fechaFinal

) => {

    const response = await fetch(

        "/api/libro-diario/reporte",

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

            },

            body: JSON.stringify({

                fechaInicial,

                fechaFinal,
                
            }),

        }

    );

    if (!response.ok) {

        alert("No fue posible generar el reporte.");

        return;

    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =

        `LibroDiario_${fechaInicial}_${fechaFinal}.xlsx`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

    setMostrarReporteExcel(false);

}}
/>
</>

            )

        }

      </div>

    </SistemaLayout>

  );

}