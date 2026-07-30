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

export default function ConsultasPage() {

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
  mostrarReporteRecibos,
  setMostrarReporteRecibos,
] = useState(false);

const [
  reporteRecibos,
  setReporteRecibos,
] = useState<any>(null);

const [
  busquedaRecibos,
  setBusquedaRecibos,
] = useState("");

const [
  cargandoReporte,
  setCargandoReporte,
] = useState(false);

const [
  reporteDesde,
  setReporteDesde,
] = useState("");

const [
  reporteHasta,
  setReporteHasta,
] = useState("");

const [
  reporteDocumento,
  setReporteDocumento,
] = useState("");

const [
  reporteEstado,
  setReporteEstado,
] = useState("Todos");

const [
  reporteTipo,
  setReporteTipo,
] = useState("Todas");

const [
  mostrarReporteVisitas,
  setMostrarReporteVisitas,
] = useState(false);

const [
  reporteVisitas,
  setReporteVisitas,
] = useState<any>(null);

const [
  busquedaVisitas,
  setBusquedaVisitas,
] = useState("");

const [
  cargandoVisitas,
  setCargandoVisitas,
] = useState(false);

const [
  visitasDesde,
  setVisitasDesde,
] = useState("");

const [
  visitasHasta,
  setVisitasHasta,
] = useState("");

const [
  visitasDocumento,
  setVisitasDocumento,
] = useState("");

const [
  visitasTipo,
  setVisitasTipo,
] = useState("Todas");

const columnasRecibos: TableColumn<any>[] = [
  {
    field: "fecha",
    title: "Fecha",
    width: "105px",
    render: (row) => {

      const [fecha, hora] =
        String(row.fecha).split(" ");

      return (
        <div className="flex flex-col leading-tight">
          <span className="font-medium">
            {fecha}
          </span>

          <span className="text-xs text-slate-400">
            {hora}
          </span>
        </div>
      );
    },
  },
  {
    field: "recibo",
    title: "Recibo",
    width: "130px",
    align: "center",
  },
  {
    field: "documento",
    title: "Documento",
    width: "150px",
  },
  {
    field: "nombre",
    title: "Ciudadano",
    width: "280px",
  },
  {
    field: "actuacion",
    title: "Actuación",
  },
  {
    field: "usd",
    title: "USD",
    align: "right",
    width: "120px",
  },
  {
    field: "estado",
    title: "Estado",
    align: "center",
    width: "120px",
    render: (row) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          row.estado === "ANULADO"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {row.estado}
      </span>
    ),
  },
];
const columnasVisitas: TableColumn<any>[] = [
  {
    field: "fecha",
    title: "Fecha",
    width: "105px",
    render: (row) => {

      const [fecha, hora] =
        String(row.fecha).split(" ");

      return (
        <div className="flex flex-col leading-tight">
          <span className="font-medium">
            {fecha}
          </span>

          <span className="text-xs text-slate-400">
            {hora}
          </span>
        </div>
      );
    },
  },
  {
    field: "documento",
    title: "Documento",
    width: "150px",
  },
  {
    field: "ciudadano",
    title: "Ciudadano",
    width: "300px",
  },
  {
    field: "tipo",
    title: "Tipo",
    width: "170px",
    align: "center",
    render: (row) => {

      const colores: Record<string,string> = {
        "Trámite": "bg-blue-100 text-blue-700",
        "Información": "bg-green-100 text-green-700",
        "Acompañante": "bg-amber-100 text-amber-700",
        "Cita Institucional": "bg-purple-100 text-purple-700",
      };

      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            colores[row.tipo] ??
            "bg-slate-100 text-slate-700"
          }`}
        >
          {row.tipo}
        </span>
      );

    },
  },
];
const datosRecibos =
  reporteRecibos?.registros
    ?.map((item: any) => ({
      fecha: item[0],
      recibo: item[1],
      documento: item[2],
      nombre: item[3],
      actuacion: item[4],
      usd: item[5],
      estado: item[6],
    }))
    .filter((fila: any) => {

      const texto =
        JSON.stringify(fila).toLowerCase();

      return texto.includes(
        busquedaRecibos.toLowerCase()
      );

    }) ?? [];
const datosVisitas =
  reporteVisitas?.registros
    ?.map((item: any) => ({
      fecha: item[0],
      documento: item[1],
      ciudadano: item[2],
      tipo: item[3],
    }))
    .filter((fila: any) => {

      const texto =
        JSON.stringify(fila).toLowerCase();

      return texto.includes(
        busquedaVisitas.toLowerCase()
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
        "/api/resumen-actuaciones",
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
async function consultarReporteRecibos() {

  if (!reporteDesde || !reporteHasta) {

    alert(
      "Seleccione ambas fechas."
    );

    return;

  }

  setCargandoReporte(true);

  try {

    const response =
      await fetch(
        "/api/reporte-consultas",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

          },

          body: JSON.stringify({

            desde: reporteDesde,

            hasta: reporteHasta,

            documento: reporteDocumento,

            estado: reporteEstado,

            tipo: reporteTipo,

          }),

        }
      );

    const data =
      await response.json();
console.log(data);
    if (data.ok) {

      setReporteRecibos(data);

    } else {

      alert(data.error);

    }

  } catch {

    alert(
      "No fue posible consultar el reporte."
    );

  } finally {

    setCargandoReporte(false);

  }

}
async function consultarReporteVisitas() {

  if (!visitasDesde || !visitasHasta) {

    alert(
      "Seleccione ambas fechas."
    );

    return;

  }

  setCargandoVisitas(true);

  try {

    const response =
      await fetch(
        "/api/reporte-visitas",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

          },

          body: JSON.stringify({

            desde: visitasDesde,

            hasta: visitasHasta,

            documento: visitasDocumento,

            tipo: visitasTipo,

          }),

        }
      );

    const data =
      await response.json();

    if (data.ok) {

      setReporteVisitas(data);

    } else {

      alert(data.error);

    }

  } catch {

    alert(
      "No fue posible consultar las visitas."
    );

  } finally {

    setCargandoVisitas(false);

  }

}
  async function cargarDashboard() {

    const response =
      await fetch(
        "/api/dashboard-consultas"
      );

    const data =
      await response.json();

    if (data.ok) {

      setDashboard(data);

    }

  }

  
  return (

<SistemaLayout
    titulo="Centro de Consultas - Caja"
    permiso={MODULOS.CONSULTAS}
>

<div className="space-y-8">

{dashboard && (

<>
{/* ============================
    REGISTRO CONSULAR
============================ */}

<div className="flex justify-center mb-8">

  <div className="bg-slate-50 rounded-2xl shadow-md p-8 border-l-4 border-red-600 w-full max-w-md">

    <p className="text-slate-600 text-center">

      Registro Consular

    </p>

    <h2 className="text-5xl font-bold text-red-700 text-center mt-3">

      {dashboard.registroConsular.registrados}

    </h2>

    <div className="mt-5 text-center space-y-1">

      <div className="mt-5 space-y-3">

  <div className="flex items-center justify-center gap-2">

  <img
    src="/bandera-venezuela.png"
    alt="Venezuela"
    className="w-6 h-6 rounded-sm"
  />

  <span>Venezolanos:</span>

  <strong>

    {dashboard.registroConsular.venezolanos}

  </strong>

</div>

  <div className="flex items-center justify-center gap-2">

    <span className="text-xl">
      🌎
    </span>

    <span>
      Extranjeros:
    </span>

    <strong>
      {dashboard.registroConsular.extranjeros}
    </strong>

  </div>

</div>

    </div>

  </div>

</div>

{/* ============================
      USD Y VISITAS
============================ */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  {/* USD */}

  <div className="space-y-5">

    <TarjetaUSD

      titulo="USD Hoy"

      datos={dashboard.usd.hoy}

    />

    <TarjetaUSD

      titulo="USD Mes"

      datos={dashboard.usd.mes}

    />

    <TarjetaUSD

      titulo="USD Año"

      datos={dashboard.usd.anio}

    />

  </div>

  {/* VISITAS */}

  <div className="space-y-5">

    <TarjetaVisitas

      titulo="Visitas Hoy"

      datos={dashboard.visitas.hoy}

    />

    <TarjetaVisitas

      titulo="Visitas Mes"

      datos={dashboard.visitas.mes}

    />

    <TarjetaVisitas

      titulo="Visitas Año"

      datos={dashboard.visitas.anio}

    />

  </div>

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

      📊 Resumen de Actuaciones y Visitas

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

  setMostrarReporteRecibos(true);

}}

  >

    <h2 className="text-2xl font-bold text-green-700">

      📄 Reporte de Recibos

    </h2>

    <p className="text-slate-600 mt-2">

      Consulte todos los recibos emitidos por rango de fechas.

    </p>

  </div>

  <div

    className="
      bg-white
      rounded-2xl
      shadow-lg
      border-l-4
      border-red-600
      p-6
      cursor-pointer
      hover:bg-slate-50
      transition
    "

    onClick={() => {

  setMostrarReporteVisitas(true);

}}

  >

    <h2 className="text-2xl font-bold text-red-700">

      👥 Reporte de Visitas

    </h2>

    <p className="text-slate-600 mt-2">

      Consulte la bitácora de visitas registradas en Recepción.

    </p>

  </div>

</div>

</>

)}




{mostrarResumen && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8">

<h2 className="text-3xl font-bold text-blue-950 mb-6">

Resumen de Actuaciones y Visitas

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

Object.entries(

resumen.actuaciones

)

.sort(

(a:any,b:any)=>

a[0].localeCompare(

b[0]

)

)

.map(

([codigo,item]:any)=>(

<tr key={codigo}>

<td className="border p-2 font-semibold">

{codigo}

</td>

<td className="border p-2">

{item.nombre}

</td>

<td className="border p-2 text-center">

{item.cantidad}

</td>

<td className="border p-2 text-end">

${item.usd.toLocaleString("es-CO")}

</td>

</tr>

)

)

}

</tbody>

</table>

</div>

<div className="bg-slate-50 rounded-2xl p-5">

<p>

<strong>

Total actuaciones:

</strong>

{" "}

{resumen.totalActuaciones}

</p>

<p className="mt-2">

<strong>

Total USD:

</strong>

{" "}

${resumen.totalUSD.toLocaleString("es-CO")}

</p>

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
{mostrarReporteRecibos && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8">

<h2 className="text-3xl font-bold text-blue-950 mb-6">

Reporte de Recibos

</h2>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label>Fecha Desde</label>

<input
type="date"
value={reporteDesde}
onChange={(e)=>setReporteDesde(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Fecha Hasta</label>

<input
type="date"
value={reporteHasta}
onChange={(e)=>setReporteHasta(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div className="md:col-span-2">

<label>Documento (Cédula o Pasaporte)</label>

<input
value={reporteDocumento}
onChange={(e)=>setReporteDocumento(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Estado</label>

<select
value={reporteEstado}
onChange={(e)=>setReporteEstado(e.target.value)}
className="w-full border rounded-xl p-3"
>

<option>Todos</option>
<option>GENERADO</option>
<option>ANULADO</option>

</select>

</div>

<div>

<label>Tipo</label>

<select
value={reporteTipo}
onChange={(e)=>setReporteTipo(e.target.value)}
className="w-full border rounded-xl p-3"
>

<option>Todas</option>
<option>Pagas</option>
<option>Gratuitas</option>

</select>

</div>

</div>

<div className="flex gap-3 mt-6">

<button

onClick={
  consultarReporteRecibos
}

className="bg-blue-950 text-white px-5 py-3 rounded-xl"

>

Consultar

</button>

<button

onClick={()=>{

setMostrarReporteRecibos(false);
setReporteRecibos(null);

}}

className="bg-red-600 text-white px-5 py-3 rounded-xl"

>

Cerrar

</button>

</div>
{cargandoReporte && (

<p className="mt-6">

Consultando...

</p>

)}
{reporteRecibos && (

  <>

<div className="mt-8">


<DataTableToolbar
    titulo="Resultados"
    busqueda={busquedaRecibos}
    onBusquedaChange={setBusquedaRecibos}
    placeholder="Buscar por recibo, documento, ciudadano, actuación..."
/>

<DataTable
    columns={columnasRecibos}
    data={datosRecibos}
    getRowKey={(row) => row.recibo}
/>

<div className="grid grid-cols-4 gap-4 mt-6">

  <div className="bg-slate-100 rounded-xl p-4">

    <p>Recibos</p>

    <h2 className="text-2xl font-bold">
      {reporteRecibos.totalRecibos}
    </h2>

  </div>

  <div className="bg-slate-100 rounded-xl p-4">

    <p>Actuaciones</p>

    <h2 className="text-2xl font-bold">
      {reporteRecibos.totalActuaciones}
    </h2>

  </div>

  <div className="bg-slate-100 rounded-xl p-4">

    <p>Anulados</p>

    <h2 className="text-2xl font-bold text-red-600">
      {reporteRecibos.totalAnulados}
    </h2>

  </div>

  <div className="bg-slate-100 rounded-xl p-4">

    <p>Total USD</p>

    <h2 className="text-2xl font-bold text-green-700">
      ${reporteRecibos.totalUSD.toLocaleString("es-CO")}
    </h2>

  </div>

</div>
</div>   
</>

)}

</div>

</div>

)}

{mostrarReporteVisitas && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8">

<h2 className="text-3xl font-bold text-blue-950 mb-6">

Reporte de Visitas

</h2>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label>Fecha Desde</label>

<input
type="date"
value={visitasDesde}
onChange={(e)=>setVisitasDesde(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Fecha Hasta</label>

<input
type="date"
value={visitasHasta}
onChange={(e)=>setVisitasHasta(e.target.value)}
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Documento</label>

<input
value={visitasDocumento}
onChange={(e)=>setVisitasDocumento(e.target.value)}
placeholder="Cédula o Pasaporte"
className="w-full border rounded-xl p-3"
/>

</div>

<div>

<label>Tipo de Visita</label>

<select
value={visitasTipo}
onChange={(e)=>setVisitasTipo(e.target.value)}
className="w-full border rounded-xl p-3"
>

<option>Todas</option>
<option>Trámite</option>
<option>Información</option>
<option>Acompañante</option>
<option>Cita Institucional</option>

</select>

</div>

</div>

<div className="flex gap-3 mt-6">

<button

onClick={consultarReporteVisitas}

className="bg-blue-950 text-white px-5 py-3 rounded-xl"

>

Consultar

</button>

<button

onClick={()=>{

setMostrarReporteVisitas(false);

setReporteVisitas(null);

}}

className="bg-red-600 text-white px-5 py-3 rounded-xl"

>

Cerrar

</button>

</div>

{cargandoVisitas && (

<p className="mt-6">

Consultando...

</p>

)}

{reporteVisitas && (

<>

<div className="grid grid-cols-5 gap-4 mt-8">

<div className="bg-slate-100 rounded-xl p-4">

<p>Total</p>

<h2 className="text-2xl font-bold">

{reporteVisitas.total}

</h2>

</div>

<div className="bg-slate-100 rounded-xl p-4">

<p>Trámite</p>

<h2 className="text-2xl font-bold">

{reporteVisitas.tramite}

</h2>

</div>

<div className="bg-slate-100 rounded-xl p-4">

<p>Información</p>

<h2 className="text-2xl font-bold">

{reporteVisitas.informacion}

</h2>

</div>

<div className="bg-slate-100 rounded-xl p-4">

<p>Acompañante</p>

<h2 className="text-2xl font-bold">

{reporteVisitas.acompanante}

</h2>

</div>

<div className="bg-slate-100 rounded-xl p-4">

<p>Institucional</p>

<h2 className="text-2xl font-bold">

{reporteVisitas.institucional}

</h2>

</div>

</div>

<DataTableToolbar
    titulo="Detalle de Visitas"
    busqueda={busquedaVisitas}
    onBusquedaChange={setBusquedaVisitas}
    placeholder="Buscar por documento, ciudadano o tipo..."
/>

<DataTable
    columns={columnasVisitas}
    data={datosVisitas}
    getRowKey={(row, index) =>
        `${row.documento}-${index}`
    }
/>

</>

)}

</div>

</div>

)}
</div>

</SistemaLayout>

);

}

function TarjetaUSD({

  titulo,

  datos,

}: any) {

  return (

    <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

      <p className="text-slate-600">

        {titulo}

      </p>

      <h2 className="text-4xl font-bold text-green-700 mt-3">

        $

        {datos.usd.toLocaleString("es-CO")}

      </h2>

      <div className="mt-5 space-y-2">

        <p>

          📄 Recibos{" "}

          <strong>

            {datos.recibos}

          </strong>

        </p>

        <p>

          📋 Actuaciones{" "}

          <strong>

            {datos.actuaciones}

          </strong>

        </p>

      </div>

    </div>

  );

}

function TarjetaVisitas({

  titulo,

  datos,

}: any) {

  return (

    <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">

      <p className="text-slate-600">

        {titulo}

      </p>

      <h2 className="text-4xl font-bold text-blue-700 mt-3">

        {datos.total}

      </h2>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-5 text-sm">

        <div>

          Trámite{" "}

          <strong>

            {datos.tramite}

          </strong>

        </div>

        <div>

          Información{" "}

          <strong>

            {datos.informacion}

          </strong>

        </div>

        <div>

          Acompañante{" "}

          <strong>

            {datos.acompanante}

          </strong>

        </div>

        <div>

          Institucional{" "}

          <strong>

            {datos.institucional}

          </strong>

        </div>

      </div>

    </div>

  );

}