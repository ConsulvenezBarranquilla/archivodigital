"use client";

import {
  useEffect,
  useState,
} from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";
import DataTable, {
  TableColumn,
} from "@/components/table/DataTable";

import DataTableToolbar from "@/components/table/DataTableToolbar";

export default function EstadisticasGCPage() {

  const [
    dashboard,
    setDashboard,
  ] = useState<any>(null);

  const [
  mostrarResumen,
  setMostrarResumen,
] = useState(false);

const [
  fechaDesde,
  setFechaDesde,
] = useState("");

const [
  fechaHasta,
  setFechaHasta,
] = useState("");

const [
  resumen,
  setResumen,
] = useState<any>(null);

const [
  cargandoResumen,
  setCargandoResumen,
] = useState(false);

const [
  mostrarReportePlanillas,
  setMostrarReportePlanillas,
] = useState(false);

const [
  reportePlanillas,
  setReportePlanillas,
] = useState<any>(null);

const [
  busquedaPlanillas,
  setBusquedaPlanillas,
] = useState("");

const [
  cargandoPlanillas,
  setCargandoPlanillas,
] = useState(false);

const [
  planillasDesde,
  setPlanillasDesde,
] = useState("");

const [
  planillasHasta,
  setPlanillasHasta,
] = useState("");


const columnasPlanillas: TableColumn<any>[] = [

  {
    field: "fecha",
    title: "Fecha",
    width: "110px",
  },

  {
    field: "planilla",
    title: "Planilla",
    width: "140px",
  },

  {
    field: "nombre",
    title: "Ciudadano",
    width: "260px",
  },

  {
    field: "actuaciones",
    title: "Actuaciones",
  },

  {
    field: "usd",
    title: "USD",
    width: "120px",
    align: "right",
    render: (row) => (
      <>${Number(row.usd).toLocaleString("es-CO")}</>
    ),
  },

];

const datosPlanillas =
  reportePlanillas?.planillas
    ?.map((item: any) => ({
      fecha: item.fecha,
      planilla: item.planilla,
      nombre: item.nombre,
      actuaciones: item.actuaciones,
      usd: item.usd,
    }))
    .filter((fila: any) => {

      const texto =
        JSON.stringify(fila)
          .toLowerCase();

      return texto.includes(
        busquedaPlanillas.toLowerCase()
      );

    }) ?? [];

  useEffect(() => {
    cargarDashboard();
}, []);
async function consultarResumen() {

  if (!fechaDesde || !fechaHasta) {

    alert(
      "Seleccione ambas fechas."
    );

    return;

  }

  setCargandoResumen(true);

  try {

    const response =
      await fetch(
        "/api/estadisticas-gc?action=resumen-actuaciones",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

          },

          body: JSON.stringify({

            desde: fechaDesde,

            hasta: fechaHasta,

          }),

        }
      );

    const data =
      await response.json();

    if (data.ok) {

      setResumen(data);

    } else {

      alert(data.error);

    }

  } finally {

    setCargandoResumen(false);

  }

}
async function consultarReportePlanillas() {

  if (!planillasDesde || !planillasHasta) {

    alert(
      "Seleccione ambas fechas."
    );

    return;

  }

  setCargandoPlanillas(true);

  try {

    const response =
      await fetch(
        "/api/estadisticas-gc?action=reporte-planillas",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

          },

          body: JSON.stringify({

    desde: planillasDesde,

    hasta: planillasHasta,

}),

        }
      );

    const data =
      await response.json();

    if (data.ok) {

      setReportePlanillas(data);

    } else {

      alert(data.error);

    }

  } catch {

    alert(
      "No fue posible consultar el reporte."
    );

  } finally {

    setCargandoPlanillas(false);

  }

}

async function cargarDashboard() {

  const response =
    await fetch(
      "/api/estadisticas-gc?action=dashboard"
    );

  const data =
    await response.json();

  if (data.ok) {

    setDashboard(data);

  }

}
const totalCantidad =
  resumen?.actuaciones?.reduce(
    (s: number, item: any) =>
      s + Number(item.cantidad || 0),
    0
  ) || 0;

const totalUsd =
  resumen?.actuaciones?.reduce(
    (s: number, item: any) =>
      s + Number(item.usd || 0),
    0
  ) || 0;
return (

<SistemaLayout
    titulo="Estadísticas Gestión Consular"
    permiso={MODULOS.REPORTES}
>

<div className="space-y-8">

{dashboard && (

<>

{/* ============================
      RENTA GESTIÓN CONSULAR
============================ */}

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

  <TarjetaRenta
    titulo="Renta Hoy"
    datos={dashboard.hoy}
  />

  <TarjetaRenta
    titulo="Renta Mes"
    datos={dashboard.mes}
  />

  <TarjetaRenta
    titulo="Renta Año"
    datos={dashboard.anio}
  />

</div>
{/* ============================
      MÓDULOS
============================ */}

<div className="mt-12 space-y-6">

  <div

    className="
      bg-white
      rounded-2xl
      shadow-lg
      border-l-4
      border-blue-700
      p-6
      cursor-pointer
      hover:bg-slate-50
      transition
    "

    onClick={() => {

    setMostrarResumen(true);

}}

  >

    <h2 className="text-2xl font-bold text-blue-950">

      📊 Resumen de Actuaciones cargadas en SGC y Visitas

    </h2>

    <p className="text-slate-600 mt-2">

      Consulte estadísticas consolidadas por rango de fechas.

    </p>

  </div>

  <div

    className="
      bg-white
      rounded-2xl
      shadow-lg
      border-l-4
      border-green-700
      p-6
      cursor-pointer
      hover:bg-slate-50
      transition
    "

    onClick={() => {

  setMostrarReportePlanillas(true);

}}

  >

    <h2 className="text-2xl font-bold text-green-700">

      📄 Reporte de Planillas

    </h2>

    <p className="text-slate-600 mt-2">

      Consulte todas las planillas de Gestión Consular por rango de fechas.

    </p>

  </div>

 
</div>

</>

)}




{mostrarResumen && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8">

<h2 className="text-3xl font-bold text-blue-950 mb-6">

Resumen de Actuaciones cargadas en SGC y Visitas

</h2>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label>

Fecha Desde

</label>

<input

type="date"

value={fechaDesde}

onChange={(e)=>

setFechaDesde(
e.target.value
)

}

className="w-full border rounded-xl p-3"

/>

</div>

<div>

<label>

Fecha Hasta

</label>

<input

type="date"

value={fechaHasta}

onChange={(e)=>

setFechaHasta(
e.target.value
)

}

className="w-full border rounded-xl p-3"

/>

</div>

</div>

<div className="mt-6 flex gap-3">

<button

onClick={consultarResumen}

className="bg-blue-950 text-white px-5 py-3 rounded-xl"

>

Consultar

</button>

<button

onClick={()=>{

setMostrarResumen(false);

setResumen(null);

}}

className="bg-red-600 text-white px-5 py-3 rounded-xl"

>

Cerrar

</button>

</div>

{cargandoResumen && (

<p className="mt-6">

Consultando...

</p>

)}

{resumen && (

<div className="mt-8 space-y-8">

<h3 className="text-2xl font-bold text-blue-950">

Resumen de Actuaciones

</h3>

<div className="overflow-x-auto">

<table className="min-w-full border border-slate-300">

<thead className="bg-slate-100">

<tr>

<th className="border p-2">

Código

</th>

<th className="border p-2">

Actuación

</th>

<th className="border p-2 text-center">

Cantidad

</th>

<th className="border p-2 text-end">

USD

</th>

</tr>

</thead>

<tbody>

{
  resumen.actuaciones
    ?.map((item: any) => (

      <tr key={item.codigo}>

        <td className="border p-2 font-semibold">
          {item.codigo}
        </td>

        <td className="border p-2">
          {item.nombre}
        </td>

        <td className="border p-2 text-center">
          {item.cantidad}
        </td>

        <td className="border p-2 text-end">
          ${Number(item.usd).toLocaleString("es-CO")}
        </td>

      </tr>

    ))
}

</tbody>

<tfoot>

  <tr className="bg-slate-100 font-bold">

    <td
      className="border p-2"
      colSpan={2}
    >
      TOTAL
    </td>

    <td className="border p-2 text-center">

      {totalCantidad}

    </td>

    <td className="border p-2 text-end">

      $
      {totalUsd.toLocaleString(
        "es-CO"
      )}

    </td>

  </tr>

</tfoot>

</table>

</div>


<hr/>

<h3 className="text-2xl font-bold text-blue-950">

Resumen de Visitas

</h3>

<div className="overflow-x-auto">

<table className="min-w-full border border-slate-300">

<thead className="bg-slate-100">

<tr>

<th className="border p-2">

Tipo

</th>

<th className="border p-2">

Total

</th>

</tr>

</thead>

<tbody>

<tr>

<td className="border p-2">

Trámite

</td>

<td className="border p-2 text-center">

{resumen.visitas.tramite}

</td>

</tr>

<tr>

<td className="border p-2">

Información

</td>

<td className="border p-2 text-center">

{resumen.visitas.informacion}

</td>

</tr>

<tr>

<td className="border p-2">

Acompañante

</td>

<td className="border p-2 text-center">

{resumen.visitas.acompanante}

</td>

</tr>

<tr>

<td className="border p-2">

Cita Institucional

</td>

<td className="border p-2 text-center">

{resumen.visitas.institucional}

</td>

</tr>

<tr className="bg-slate-100 font-bold">

<td className="border p-2">

TOTAL

</td>

<td className="border p-2 text-center">

{resumen.visitas.total}

</td>

</tr>

</tbody>

</table>

</div>

</div>

)}
</div>   {/* cierra bg-white */}

</div>)}   {/* cierra fondo oscuro */}

       {/* cierra mostrarResumen */}
{mostrarReportePlanillas && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8">

<h2 className="text-3xl font-bold text-blue-950 mb-6">

Reporte de Planillas

</h2>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label>Fecha Desde</label>

<input
type="date"
value={planillasDesde}
onChange={(e)=>setPlanillasDesde(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Fecha Hasta</label>

<input
type="date"
value={planillasHasta}
onChange={(e)=>setPlanillasHasta(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>
</div>

<div className="flex gap-3 mt-6">

<button

onClick={
  consultarReportePlanillas
}

className="bg-blue-950 text-white px-5 py-3 rounded-xl"

>

Consultar

</button>

<button

onClick={()=>{

                                    setMostrarReportePlanillas(false);
setReportePlanillas(null);

}}

className="bg-red-600 text-white px-5 py-3 rounded-xl"

>

Cerrar

</button>

</div>
{cargandoPlanillas && (

<p className="mt-6">

Consultando...

</p>

)}
{reportePlanillas && (

  <>

<div className="mt-8">


<DataTableToolbar
    titulo="Planillas encontradas"
    busqueda={busquedaPlanillas}
    onBusquedaChange={setBusquedaPlanillas}
    placeholder="Buscar por planilla, ciudadano o actuación..."
/>

<DataTable
    columns={columnasPlanillas}
    data={datosPlanillas}
    getRowKey={(row) => row.planilla}
/>


</div>  
{datosPlanillas.length === 0 && (

  <div className="text-center py-8 text-slate-500">

      No existen planillas para el rango de fechas seleccionado.

  </div>

)} 
</>

)}

</div>

</div>

)}

</div>

</SistemaLayout>

);

}
function TarjetaRenta({

  titulo,

  datos,

}: any) {

  return (

    <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

      <p className="text-slate-600">

        {titulo}

      </p>

      <h2 className="text-4xl font-bold text-green-700 mt-3">

        ${Number(datos.usd).toLocaleString("es-CO")}

      </h2>

      <div className="mt-5 space-y-2 text-sm">

        <p>

          📋 Actuaciones{" "}

          <strong>

            {datos.actuaciones}

          </strong>

        </p>

        <p>

          📄 Planillas{" "}

          <strong>

            {datos.planillas}

          </strong>

        </p>

      </div>

    </div>

  );

}
