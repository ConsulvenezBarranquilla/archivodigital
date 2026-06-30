"use client";

import {
  useEffect,
  useState,
} from "react";

export default function AdminPage() {

  const [
    usuario,
    setUsuario,
  ] = useState<any>(null);

  const [
    dashboard,
    setDashboard,
  ] = useState<any>(null);

  useEffect(() => {

    const data =
      localStorage.getItem(
        "usuarioCaja"
      );

    if (!data) {

      window.location.href =
        "/ingreso";

      return;

    }

    const user =
      JSON.parse(data);

    if (
      user.rol !== "admin"
    ) {

      window.location.href =
        "/caja";

      return;

    }

    setUsuario(user);

    cargarDashboard();

  }, []);

  async function cargarDashboard() {

    const response =
      await fetch(
        "/api/dashboard-admin"
      );

    const data =
      await response.json();

    if (data.ok) {

      setDashboard(
        data
      );

    }

  }

  if (!usuario) {

    return (
      <div>
        Cargando...
      </div>
    );

  }

  return (

    <main className="min-h-screen bg-slate-200">
    <div className="max-w-7xl mx-auto px-4 py-4">

      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
<div className="flex justify-center mb-5">
  <img
    src="/logo.png"
    alt="Logo"
    className="w-24"
  />
</div>
<div className="flex justify-end mb-4">

  <button
    onClick={() => {

      localStorage.removeItem(
        "usuarioCaja"
      );

      window.location.href =
        "/ingreso";

    }}
    className="
      bg-red-600
      text-white
      px-4
      py-2
      rounded-xl
      hover:bg-red-700
    "
  >
    Cerrar Sesión
  </button>

</div>
            
      <h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">
  Panel Administrativo
</h1>

      <p className="text-center text-slate-700 text-lg mb-4">
  Bienvenido{" "}
  <strong>
    {usuario.nombre}
  </strong>
  </p>
  <p className="text-center text-slate-500 mb-6">
  Consulado General de la República Bolivariana
  de Venezuela en Barranquilla

</p>
<div className="flex justify-center mb-8">
  <div className="flex w-72 h-1 rounded-full overflow-hidden">
    <div className="w-1/3 bg-yellow-400"></div>
    <div className="w-1/3 bg-blue-700"></div>
    <div className="w-1/3 bg-red-600"></div>
  </div>
</div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
         <a
    href="/admin"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Inicio
  </a>
<a
  href="/recepcion"
  className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
>
  Recepción
</a>
  <a
    href="/caja"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Caja
  </a>

  <a
    href="/admin/reportes"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Reportes
  </a>

  <a
    href="/admin/usuarios"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Usuarios
  </a>

  <a
    href="/admin/historial"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Historial
  </a>

  <a
    href="/admin/configuracion"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Configuración
  </a>

</div>

      <hr />

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
  </div>

  <div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-green-600">
    <p className="text-slate-600 text-sm">
      USD Hoy
    </p>

    <h2 className="text-4xl font-bold text-green-700 mt-2">
      ${dashboard.usdHoy.toLocaleString("es-CO")}
    </h2>
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
    💰 Recaudación Acumulada Mes
  </p>

  <h2 className="text-3xl font-bold text-indigo-700 mt-2">
    ${dashboard.usdMes.toLocaleString("es-CO")}
  </h2>

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-cyan-600">

  <p className="text-slate-600 text-sm">
    📄 Recibos Acumulados Mes
  </p>

  <h2 className="text-3xl font-bold text-cyan-700 mt-2">
    {dashboard.recibosMes}
  </h2>

</div>

<div className="bg-slate-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-600">

  <p className="text-slate-600 text-sm">
    📋 Actuaciones Acumuladas Mes
  </p>

  <h2 className="text-3xl font-bold text-purple-700 mt-2">
    {dashboard.actuacionesMes}
  </h2>

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

  <h2 className="text-2xl font-bold text-blue-950 mb-4">
    Actuaciones Más Utilizadas
  </h2>

<div className="bg-white rounded-2xl shadow-md overflow-hidden">

  <table className="w-full">

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

    </div>

  </main>

  );

}