"use client";

import {
  useEffect,
  useState,
} from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";
import { useCallback, useMemo } from "react";

import DataTable, {
  TableColumn,
} from "@/components/table/DataTable";

import DataTableToolbar from "@/components/table/DataTableToolbar";
import Link from "next/link";

import {
  obtenerPendientesSGC,
} from "@/lib/services/GestionConsular";

import {
  ActuacionPendiente,
} from "@/types/GestionConsular";

interface DocumentoPendienteFirma {
  id: string;
  recibo: string;
  codigoActuacion?: string;
  fechaRecibo: string;
  planillaGC: string;
  solicitante: string;
  documento: string;
  estadoProcesamiento: string;
}

export default function AdminPage() {

 
  const [
    dashboard,
    setDashboard,
  ] = useState<any>(null);

  const [
  mostrarPendientes,
  setMostrarPendientes,
] = useState(false);

const [
  cargandoPendientes,
  setCargandoPendientes,
] = useState(false);

const [
  pendientes,
  setPendientes,
] = useState<ActuacionPendiente[]>([]);

const [
  busquedaPendientes,
  setBusquedaPendientes,
] = useState("");
const [mostrarPendientesFirma, setMostrarPendientesFirma] = useState(false);
const [cargandoPendientesFirma, setCargandoPendientesFirma] = useState(false);
const [pendientesFirma, setPendientesFirma] = useState<DocumentoPendienteFirma[]>([]);
const [busquedaPendientesFirma, setBusquedaPendientesFirma] = useState("");
const [errorPendientesFirma, setErrorPendientesFirma] = useState("");

  const hoy = new Date();
const [
  anioSeleccionado,
  setAnioSeleccionado
] = useState(
  hoy.getFullYear().toString()
);
const [
  mesSeleccionado,
  setMesSeleccionado
] = useState(
  String(
    hoy.getMonth()+1
  ).padStart(2,"0")
);

 useEffect(() => {
  cargarDashboard();
}, [
  anioSeleccionado,
  mesSeleccionado,
]);

useEffect(() => {

  if (!dashboard?.mesesDisponibles?.length)
    return;

  const existe =
    dashboard.mesesDisponibles.some(
      (m: any) =>
        m.value === mesSeleccionado
    );

  if (!existe) {

    setMesSeleccionado(
      dashboard.mesesDisponibles[0].value
    );

  }

}, [
  dashboard?.mesesDisponibles,
]);

  async function cargarDashboard() {

    const response =
  await fetch(
`/api/dashboard-admin?anio=${anioSeleccionado}&mes=${mesSeleccionado}`
);

    const data =
      await response.json();

    if (data.ok) {

      setDashboard(
        data
      );

    }

  }
  const cargarPendientes = useCallback(
  async () => {

    try {

      setCargandoPendientes(true);

      const respuesta =
        await obtenerPendientesSGC();

      if (respuesta.ok) {

        setPendientes(
          respuesta.registros
        );

      }

    } catch (error) {

      console.error(
        "Error cargando pendientes:",
        error
      );

    } finally {

      setCargandoPendientes(false);

    }

  },
  []
);
useEffect(() => {

  cargarPendientes();

}, [
  cargarPendientes,
]);

const cargarPendientesFirma = useCallback(async () => {
  try {
    setCargandoPendientesFirma(true);
    setErrorPendientesFirma("");
    const respuesta = await fetch("/api/docfirmar", {
      cache: "no-store",
      credentials: "include",
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.error || "No fue posible cargar los documentos pendientes de firma.");
    }
    setPendientesFirma(
      (Array.isArray(datos.documentos) ? datos.documentos : []).filter(
        (documento: DocumentoPendienteFirma) => documento.estadoProcesamiento !== "ENTREGADO"
      )
    );
  } catch (error) {
    console.error("Error cargando documentos pendientes de firma:", error);
    setErrorPendientesFirma(error instanceof Error ? error.message : "No fue posible cargar los pendientes de firma.");
  } finally {
    setCargandoPendientesFirma(false);
  }
}, []);

useEffect(() => {
  cargarPendientesFirma();
}, [cargarPendientesFirma]);

 function togglePendientes() {

  setMostrarPendientes(
    !mostrarPendientes
  );

}
const pendientesFirmaFiltrados = useMemo(() => {
  const texto = busquedaPendientesFirma.trim().toLocaleLowerCase();
  if (!texto) return pendientesFirma;
  return pendientesFirma.filter((documento) =>
    [documento.solicitante, documento.documento, documento.recibo,
      documento.codigoActuacion, documento.planillaGC, documento.estadoProcesamiento]
      .some((valor) => String(valor ?? "").toLocaleLowerCase().includes(texto))
  );
}, [pendientesFirma, busquedaPendientesFirma]);

const columnasPendientesFirma: TableColumn<DocumentoPendienteFirma>[] = [
  { field: "codigoActuacion", title: "Actuación", width: "130px" },
  { field: "fechaRecibo", title: "Fecha", width: "120px" },
  { field: "solicitante", title: "Ciudadano", width: "250px" },
  { field: "documento", title: "Documento", width: "150px" },
  { field: "planillaGC", title: "Planilla", width: "110px" },
  {
    field: "estadoProcesamiento",
    title: "Estado",
    width: "200px",
    render: (documento) => (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800"}`}>
        {documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ? "Firma lista; correo pendiente" : "Pendiente de firma"}
      </span>
    ),
  },
  {
    field: "id",
    title: "Acción",
    width: "140px",
    render: () => <Link href="/docfirmar" className="font-semibold text-blue-700 hover:underline">Abrir firma</Link>,
  },
];
const columnasPendientes: TableColumn<ActuacionPendiente>[] = [

  {
    field: "fecha",
    title: "Fecha",
    width: "110px",
  },

  {
    field: "recibo",
    title: "Recibo",
    width: "90px",
  },

  {
    field: "documento",
    title: "Documento",
    width: "140px",
  },

  {
    field: "nombre",
    title: "Ciudadano",
    width: "260px",
  },

  {
    field: "codigo",
    title: "Código",
    width: "90px",
  },

  {
    field: "actuacion",
    title: "Actuación",
  },

  {
    field: "usd",
    title: "USD",
    width: "90px",
    align: "right",
    render: (row) =>
      `$${Number(row.usd).toLocaleString("es-CO")}`,
  },

];
const pendientesFiltrados = useMemo(() => {

  const texto =
    busquedaPendientes
      .trim()
      .toLowerCase();

  if (!texto) {

    return pendientes;

  }

  return pendientes.filter((item) =>

    item.documento
      ?.toLowerCase()
      .includes(texto) ||

    item.nombre
      ?.toLowerCase()
      .includes(texto) ||

    item.actuacion
      ?.toLowerCase()
      .includes(texto) ||

    item.codigo
      ?.toLowerCase()
      .includes(texto) ||

    item.recibo
      ?.toLowerCase()
      .includes(texto)

  );

}, [

  pendientes,

  busquedaPendientes,

]);
  return (
    <SistemaLayout
        titulo="Consulnet Barranquilla"
        permiso={MODULOS.ADMIN}
    >

    <div className="space-y-8">
    

      {dashboard && (

        <>

          <h2 className="text-2xl font-bold text-blue-950 mb-4">
  Resumen del Día
</h2>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-orange-500">

  <p className="text-slate-600 text-sm">
    🪪 Registro Consular
  </p>

  <h2 className="text-3xl font-bold text-orange-700 mt-2">
    {dashboard.ciudadanosRegistrados}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Venezolanos:
    <strong>
      {" "}
      {dashboard.venezolanos}
    </strong>
  </p>

  <p className="text-sm text-slate-600">
    Extranjeros:
    <strong>
      {" "}
      {dashboard.extranjeros}
    </strong>
  </p>

</div>

  <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">
  <p className="text-slate-600 text-sm">
    Recibos Hoy
  </p>

  <h2 className="text-4xl font-bold text-blue-950 mt-2">
    {dashboard.recibosHoy}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Planillas GC Hoy:
    <strong>
      {" "}
      {dashboard.planillasHoy}
    </strong>
  </p>
</div>

  <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-green-600">

  <p className="text-slate-600 text-sm">
    USD Hoy
  </p>

  <h2 className="text-4xl font-bold text-green-700 mt-2">
    ${dashboard.usdHoy.toLocaleString("es-CO")}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Renta Cargada en SGC Hoy:
    <strong>
      {" "}
      ${dashboard.rentaSGCHoy.toLocaleString("es-CO")}
    </strong>
  </p>

</div>

  <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-500">

  <p className="text-slate-600 text-sm">
    👥 Visitas Hoy
  </p>

  <h2 className="text-4xl font-bold text-blue-700 mt-2">
    {dashboard.visitasHoy}
  </h2>

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-green-500">

  <p className="text-slate-600 text-sm">
    📅 Visitas Mes
  </p>

  <h2 className="text-4xl font-bold text-green-700 mt-2">
    {dashboard.visitasMes}
  </h2>

</div>


<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-indigo-600">

  <p className="text-slate-600 text-sm">
    Renta Acumulada Mes
  </p>

  <h2 className="text-3xl font-bold text-indigo-700 mt-2">
    ${dashboard.rentaSGCMes.toLocaleString("es-CO")}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Recaudación en Caja:
    <strong>
      {" "}
      ${dashboard.usdMes.toLocaleString("es-CO")}
    </strong>
  </p>

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-cyan-600">

  <p className="text-slate-600 text-sm">
    Recibos Acumulados Mes
  </p>

  <h2 className="text-3xl font-bold text-cyan-700 mt-2">
    {dashboard.recibosMes}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Planillas Acumuladas Mes:
    <strong>
      {" "}
      {dashboard.planillasMes}
    </strong>
  </p>

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-600">

  <p className="text-slate-600 text-sm">
    Actuaciones Acumuladas Mes
  </p>

  <h2 className="text-3xl font-bold text-purple-700 mt-2">
    {dashboard.actuacionesMes}
  </h2>

  <p className="text-sm text-slate-600 mt-3">
    Actuaciones SGC Mes:
    <strong>
      {" "}
      {dashboard.actuacionesSGCMes}
    </strong>
  </p>

</div>
</div>

          <br />

          <h2 className="text-2xl font-bold text-blue-950 mb-4 mt-8">
  Resumen del día por Caja
</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

  <div className="bg-blue-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">

    <h3 className="text-xl font-bold text-blue-950 mb-4">
      Caja 1
    </h3>

    <p>
      Recibos:
      {" "}
      <strong>
        {dashboard.caja1.recibos}
      </strong>
    </p>

    <p>
      USD:
      {" "}
      <strong>
        ${dashboard.caja1.usd.toLocaleString("es-CO")}
      </strong>
    </p>

  </div>

  <div className="bg-green-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

    <h3 className="text-xl font-bold text-blue-950 mb-4">
      Caja 2
    </h3>

    <p>
      Recibos:
      {" "}
      <strong>
        {dashboard.caja2.recibos.toLocaleString("es-CO")}
      </strong>
    </p>

    <p>
      USD:
      {" "}
      <strong>
        ${dashboard.caja2.usd}
      </strong>
    </p>

  </div>

</div>

<br />
<div className="bg-slate-50 rounded-2xl shadow-md p-6 mt-8">

  <button
    onClick={togglePendientes}
    className="
      w-full
      flex
      items-center
      justify-between
      text-left
      text-2xl
      font-bold
      text-blue-950
      hover:text-blue-700
    "
  >

    <span>

      {mostrarPendientes ? "▼" : "▶"}{" "}

      Pendientes por cargar en Gestión Consular

    </span>

    <span className="text-lg">

      ({dashboard.pendientesGC ?? pendientes.length})

    </span>

  </button>

  {

     mostrarPendientes && (

    <div className="mt-6 space-y-4">

      <DataTableToolbar
        busqueda={busquedaPendientes}
        onBusquedaChange={setBusquedaPendientes}
        placeholder="Buscar ciudadano, documento, actuación o recibo..."
      />

      {

        cargandoPendientes ? (

          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-slate-500">

            Cargando pendientes...

          </div>

        ) : pendientesFiltrados.length === 0 ? (

          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-slate-500">

            No existen actuaciones pendientes de Gestión Consular.

          </div>

        ) : (

          <DataTable
            columns={columnasPendientes}
            data={pendientesFiltrados}
            getRowKey={(row, index) =>
  `${row.recibo}-${row.codigo}-${index}`
}
          />

        )

      }

    </div>

  )
}

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 mt-8">
  <button
    type="button"
    onClick={() => setMostrarPendientesFirma((mostrar) => !mostrar)}
    aria-expanded={mostrarPendientesFirma}
    className="w-full flex items-center justify-between text-left text-2xl font-bold text-blue-950 hover:text-blue-700"
  >
    <span>
      {mostrarPendientesFirma ? "▼" : "▶"}{" "}
      Documentos pendientes por firmar
    </span>
    <span className="text-lg">({pendientesFirma.length})</span>
  </button>

  {mostrarPendientesFirma && (
    <div className="mt-6 space-y-4">
      <DataTableToolbar
        busqueda={busquedaPendientesFirma}
        onBusquedaChange={setBusquedaPendientesFirma}
        placeholder="Buscar ciudadano, documento, actuación o planilla..."
      />
      {cargandoPendientesFirma ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-slate-500">
          Cargando documentos pendientes de firma...
        </div>
      ) : errorPendientesFirma ? (
        <div role="alert" className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center text-red-700">
          {errorPendientesFirma}
        </div>
      ) : pendientesFirmaFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-slate-500">
          No hay documentos pendientes por firmar.
        </div>
      ) : (
        <DataTable
          columns={columnasPendientesFirma}
          data={pendientesFirmaFiltrados}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  )}
</div>

<br />
        <div className="bg-slate-50 rounded-2xl shadow-md p-6 mt-8">  
         <div className="flex items-center justify-between mb-4 w-full">

  <h2 className="text-2xl font-bold text-blue-950">
    Actuaciones Más Utilizadas
  </h2>

  <div className="flex items-center gap-6">

    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        Año:
      </span>

      <select
        value={anioSeleccionado}
        onChange={(e) => setAnioSeleccionado(e.target.value)}
        className="border rounded-lg px-3 py-2"
      >
        {dashboard?.aniosDisponibles?.map((anio: string) => (
          <option key={anio} value={anio}>
            {anio}
          </option>
        ))}
      </select>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        Mes:
      </span>

      <select
        value={mesSeleccionado}
        onChange={(e) => setMesSeleccionado(e.target.value)}
        className="border rounded-lg px-3 py-2"
      >
        {dashboard?.mesesDisponibles?.map((mes: any) => (
          <option key={mes.value} value={mes.value}>
            {mes.label}
          </option>
        ))}
      </select>
    </div>

  </div>
  </div> 
<div className="bg-white rounded-2xl shadow-md overflow-hidden w-full">

  <table className="w-full table-fixed">

    <thead className="bg-blue-950 text-white">

      <tr>

        <th className="p-3 text-left">
          Actuación
        </th>

        <th className="p-3 text-center">
          Cantidad
        </th>

      </tr>

    </thead>

    <tbody>

      {dashboard.topActuaciones.map(
        (
          item: any,
          index: number
        ) => (

          <tr
            key={index}
            className="
              border-b
              hover:bg-slate-50
            "
          >

            <td className="p-3">
              {item.nombre}
            </td>

            <td className="p-3 text-center font-semibold">
              {item.cantidad}
            </td>

          </tr>

        )
      )}

    </tbody>

  </table>

</div>
</div>

<br />
<div className="bg-slate-50 rounded-2xl shadow-md p-6 mt-8">

  <h2 className="text-2xl font-bold text-blue-950 mb-4">
    Últimas Visitas
  </h2>
   
  <div className="bg-white rounded-2xl shadow-md overflow-hidden">

    <table className="w-full">

      <thead className="bg-blue-950 text-white">

        <tr>

          <th className="p-3 text-left">
            Fecha
          </th>

          <th className="p-3 text-left">
            Documento
          </th>

          <th className="p-3 text-left">
            Nombre
          </th>
          

          <th className="p-3 text-left">
            Tipo
          </th>

        </tr>

      </thead>

      <tbody>

        {dashboard.ultimasVisitas.map(
          (
            item: any,
            index: number
          ) => (

            <tr
              key={index}
              className="
                border-b
                hover:bg-slate-50
              "
            >

              <td className="p-3 whitespace-nowrap">
                {item.fecha}
              </td>

              <td className="p-3">
                {item.documento}
              </td>

              <td className="p-3">
                {item.nombre}
              </td>

              <td className="p-3">
                {item.tipo}
              </td>

            </tr>

          )
        )}

      </tbody>

    </table>

  </div>

</div>

<br />
          <div className="bg-slate-50 rounded-2xl shadow-md p-6 mt-8">

  <h2 className="text-2xl font-bold text-blue-950 mb-4">
    Últimos Movimientos
  </h2>

  <table className="w-full">

    <thead className="bg-blue-950 text-white">

      <tr>

        <th className="p-3">
          Recibo
        </th>

        <th className="p-3">
          Nombre
        </th>

        <th className="p-3">
          Actuación
        </th>

        <th className="p-3">
          USD
        </th>

        <th className="p-3">
          Caja
        </th>

        <th className="p-3">
          Estado
        </th>

      </tr>

    </thead>

    <tbody>

      {dashboard.ultimosMovimientos.map(
        (
          item: any,
          index: number
        ) => (

          <tr
            key={index}
            className="
              border-b
              hover:bg-slate-50
            "
          >

            <td className="p-3">
              {item.correlativo}
            </td>

            <td className="p-3">
              {item.nombre}
            </td>

            <td className="p-3 font-semibold text-blue-700">
  {item.codigo}
</td>

            <td className="p-3">
              ${item.usd}
            </td>

            <td className="p-3">
              {item.caja}
            </td>

            <td className="p-3">

              {item.estado ===
              "ANULADO" ? (

                <span className="text-red-600 font-bold">
                  ANULADO
                </span>

              ) : (

                <span className="text-green-700 font-bold">
                  GENERADO
                </span>

              )}

            </td>

          </tr>

        )
      )}

    </tbody>

  </table>

</div>

        </>

      )}
   
  </div>

</SistemaLayout>

  );

}
