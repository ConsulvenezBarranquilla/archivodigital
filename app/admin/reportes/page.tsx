"use client";

import { useEffect, useState } from "react";

export default function ReportesPage() {

  const [usuario, setUsuario] =
    useState<any>(null);

  const [periodo, setPeriodo] =
    useState("dia");

  const [recibo, setRecibo] =
  useState("");

  const [documento, setDocumento] =
    useState("");

  const [actuacion, setActuacion] =
    useState("Todas");

  const [caja, setCaja] =
    useState("Todas");

  const [usuarioFiltro, setUsuarioFiltro] =
    useState("Todos");

  const [tipo, setTipo] =
    useState("Todas");

  const [estado, setEstado] =
    useState("Todos");

    const [mes, setMes] =
  useState(
    new Date()
      .getMonth() + 1
  );

const [anio, setAnio] =
  useState(
    new Date()
      .getFullYear()
  );

const [desde, setDesde] =
  useState("");

const [hasta, setHasta] =
  useState("");

  const [
  dashboard,
  setDashboard,
] = useState<any>(null);
 
  const [resultado, setResultado] =
    useState<any>(null);

    const [
  actuacionesDisponibles,
  setActuacionesDisponibles,
] = useState<string[]>([]);

const [
  usuariosDisponibles,
  setUsuariosDisponibles,
] = useState<string[]>([]);

  useEffect(() => {

    fetch(
  "/api/dashboard-reportes"
)
  .then((res) => res.json())
  .then((data) => {

    if (data.ok) {

      setDashboard(data);

    }

  });

  const data =
    localStorage.getItem(
      "usuarioCaja"
    );

  if (!data) {

    window.location.href =
      "/";

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

    fetch(
  "/api/filtros-reportes"
)
  .then(
    (r) => r.json()
  )
  .then(
    (data) => {

      if (
        data.ok
      ) {

        setActuacionesDisponibles(
          data.actuaciones
        );

        setUsuariosDisponibles(
          data.usuarios
        );

      }

    }
  );

  }, []);

async function anularRecibo(
  correlativo: string
) {

  const confirmar =
    confirm(
      `¿Anular recibo ${correlativo}?`
    );

  if (!confirmar) {
    return;
  }

  try {

    const response =
      await fetch(
        "/api/anular-recibo-admin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              correlativo,
            }),
        }
      );

    const data =
      await response.json();

    if (!data.ok) {

      alert(
        data.error
      );

      return;

    }

    alert(
      "Recibo anulado correctamente"
    );

    vistaPrevia();

  } catch {

    alert(
      "Error anulando recibo"
  );

}
}

async function vistaPrevia() {

  const response =
    await fetch(
      "/api/reporte-admin",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
  periodo,
  mes,
  anio,
  desde,
  hasta,
  recibo,
  documento,
  actuacion,
  caja,
  usuario:
    usuarioFiltro,
  tipo,
  estado,
}),
      }
    );

  const data =
    await response.json();

  setResultado(
    data
  );

}
if (!usuario) {

     
  return (
    <div>
      Cargando...
    </div>
  );

}
function limpiarFiltros() {

  setPeriodo(
    "dia"
  );

  setDocumento(
    ""
  );

setRecibo(
    ""
  );

  setActuacion(
    "Todas"
  );

  setCaja(
    "Todas"
  );

  setUsuarioFiltro(
    "Todos"
  );

  setTipo(
    "Todas"
  );

  setEstado(
    "Todos"
  );

  setResultado(
    null
  );

  setMes(
  new Date()
    .getMonth() + 1
);

setAnio(
  new Date()
    .getFullYear()
);

setDesde("");

setHasta("");

}
function cambiarPeriodo(
  nuevoPeriodo: string
) {

  setPeriodo(
    nuevoPeriodo
  );

  setResultado(
    null
  );

}
async function generarPdf() {

  if (
    !resultado
  ) {

    alert(
      "Primero genere una Vista Previa"
    );

    return;

  }

  const response =
    await fetch(
      "/api/pdf-reporte-admin",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
            resultado
          ),
      }
    );

  if (
  !response.ok
) {

  const error =
    await response.text();

  console.log(
    error
  );

  alert(
    error
  );

  return;

}

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(
      blob
    );

  const enlace =
    document.createElement(
      "a"
    );

  enlace.href = url;

  enlace.download =
    "ReporteAdministrativo.pdf";

  document.body.appendChild(
    enlace
  );

  enlace.click();

  enlace.remove();

  window.URL.revokeObjectURL(
    url
  );

}
async function reimprimirRecibo(
  correlativo: string
) {

  try {

    const response =
      await fetch(
        "/api/reimprimir-recibo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            correlativo,
          }),
        }
      );

    const data =
      await response.json();

    if (!data.ok) {

      alert(
        data.error
      );

      return;

    }

    const pdfResponse =
      await fetch(
        "/api/pdf-recibo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            data
          ),
        }
      );

    const blob =
      await pdfResponse.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `RECIBO_${correlativo}.pdf`;

    document.body.appendChild(
      a
    );

    a.click();

    a.remove();

  } catch {

    alert(
      "Error reimprimiendo recibo"
    );

  }

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

<h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">

  Reportes Administrativos

</h1>

<p className="text-center text-slate-700 text-lg mb-4">

  Consulado General de la República
  Bolivariana de Venezuela
  en Barranquilla

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
  className="bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800"
>
  🏠 Inicio
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
{dashboard && (

  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

    <div className="bg-blue-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">

      <div className="text-slate-500 text-sm">
        HOY
      </div>

      <div className="text-3xl font-bold text-blue-950 mt-2">
        ${dashboard.hoy.usd}
      </div>

      <div className="text-slate-600 mt-2">
        {dashboard.hoy.recibos} recibos
      </div>

      <div className="text-slate-600">
        {dashboard.hoy.actuaciones} actuaciones
      </div>

    </div>

    <div className="bg-green-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

      <div className="text-slate-500 text-sm">
        MES
      </div>

      <div className="text-3xl font-bold text-green-700 mt-2">
        ${dashboard.mes.usd}
      </div>

      <div className="text-slate-600 mt-2">
        {dashboard.mes.recibos} recibos
      </div>

      <div className="text-slate-600">
        {dashboard.mes.actuaciones} actuaciones
      </div>

    </div>

    <div className="bg-purple-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-700">

      <div className="text-slate-500 text-sm">
        AÑO
      </div>

      <div className="text-3xl font-bold text-purple-700 mt-2">
        ${dashboard.anio.usd}
      </div>

      <div className="text-slate-600 mt-2">
        {dashboard.anio.recibos} recibos
      </div>

      <div className="text-slate-600">
        {dashboard.anio.actuaciones} actuaciones
      </div>

    </div>

  </div>

)}
    <hr />

    <h2 className="text-2xl font-bold text-blue-950 mb-4 mt-8">
  Período
</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  <div
    onClick={() =>
  cambiarPeriodo(
    "dia"
  )
}
    className={`
      p-4
      rounded-2xl
      border
      cursor-pointer
      text-center
      ${
        periodo === "dia"
          ? "bg-blue-50 border-blue-700"
          : "border-slate-300"
      }
    `}
  >
    <div className="font-bold text-blue-950">
      Día
    </div>


<div className="text-sm text-slate-500">
  Fecha actual
</div>


  </div>

  <div
    onClick={() =>
  cambiarPeriodo(
    "mes"
  )
}
    className={`
      p-4
      rounded-2xl
      border
      cursor-pointer
      text-center
      ${
        periodo === "mes"
          ? "bg-green-50 border-green-700"
          : "border-slate-300"
      }
    `}
  >
    <div className="font-bold text-green-700">
      Mes
    </div>


<div className="text-sm text-slate-500">
  Mes específico
</div>


  </div>

  <div
   onClick={() =>
  cambiarPeriodo(
    "rango"
  )
}
    className={`
      p-4
      rounded-2xl
      border
      cursor-pointer
      text-center
      ${
        periodo === "rango"
          ? "bg-purple-50 border-purple-700"
          : "border-slate-300"
      }
    `}
  >
    <div className="font-bold text-purple-700">
      Rango
    </div>


<div className="text-sm text-slate-500">
  Fechas personalizadas
</div>


  </div>

</div>

{periodo === "mes" && (

  <div className="bg-slate-50 rounded-2xl p-5 mb-6">


<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div>

    <label className="font-medium">
      Mes
    </label>

    <select
      value={mes}
      onChange={(e) =>
        setMes(
          Number(
            e.target.value
          )
        )
      }
      className="
        w-full
        border
        border-slate-300
        rounded-xl
        p-3
        mt-2
      "
    >
      <option value={1}>Enero</option>
      <option value={2}>Febrero</option>
      <option value={3}>Marzo</option>
      <option value={4}>Abril</option>
      <option value={5}>Mayo</option>
      <option value={6}>Junio</option>
      <option value={7}>Julio</option>
      <option value={8}>Agosto</option>
      <option value={9}>Septiembre</option>
      <option value={10}>Octubre</option>
      <option value={11}>Noviembre</option>
      <option value={12}>Diciembre</option>
    </select>

  </div>

  <div>

    <label className="font-medium">
      Año
    </label>

    <input
      type="number"
      value={anio}
      onChange={(e) =>
        setAnio(
          Number(
            e.target.value
          )
        )
      }
      className="
        w-full
        border
        border-slate-300
        rounded-xl
        p-3
        mt-2
      "
    />

  </div>

</div>


  </div>

)}

{periodo === "rango" && (

  <div className="bg-slate-50 rounded-2xl p-5 mb-6">


<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div>

    <label className="font-medium">
      Desde
    </label>

    <input
      type="date"
      value={desde}
      onChange={(e) =>
        setDesde(
          e.target.value
        )
      }
      className="
        w-full
        border
        border-slate-300
        rounded-xl
        p-3
        mt-2
      "
    />

  </div>

  <div>

    <label className="font-medium">
      Hasta
    </label>

    <input
      type="date"
      value={hasta}
      onChange={(e) =>
        setHasta(
          e.target.value
        )
      }
      className="
        w-full
        border
        border-slate-300
        rounded-xl
        p-3
        mt-2
      "
    />

  </div>

</div>
```

  </div>

)}


    <hr />

    <div>
<h2 className="text-2xl font-bold text-blue-950 mb-4">
  Filtros de Búsqueda
</h2>

<div
  className="
    bg-slate-50
    rounded-2xl
    shadow-md
    p-6
    mb-8
  "
>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>

  <label className="block mb-2 font-medium text-slate-700">
    Documento
  </label>

  <input
    value={documento}
    onChange={(e) =>
      setDocumento(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  />

</div>
<br />

<div>

  <label className="block mb-2 font-medium text-slate-700">
    Recibo
  </label>

  <input
    value={recibo}
    onChange={(e) =>
      setRecibo(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  />

</div>

<div>

  <label className="block mb-2 font-medium text-slate-700">
    Actuación
  </label>

  <select
    value={actuacion}
    onChange={(e) =>
      setActuacion(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  >

    <option value="">
      Todas
    </option>

    {actuacionesDisponibles.map(
  (item, index) => (

    <option
      key={`${item}-${index}`}
      value={item}
    >
      {item}
    </option>

  )
)}

  </select>

</div>
  
<div>

  <label className="block mb-2 font-medium text-slate-700">
    Estado
  </label>

  <select
    value={estado}
    onChange={(e) =>
      setEstado(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  >

    <option value="">
      Todos
    </option>

    <option value="GENERADO">
      Generado
    </option>

    <option value="ANULADO">
      Anulado
    </option>

  </select>

</div>

<div>

  <label className="block mb-2 font-medium text-slate-700">
    Usuario
  </label>

  <select
    value={usuarioFiltro}
    onChange={(e) =>
      setUsuarioFiltro(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  >

    <option value="">
      Todos
    </option>

    {usuariosDisponibles.map(
  (u, index) => (

    <option
      key={`${u}-${index}`}
      value={u}
    >
      {u}
    </option>

  )
)}

  </select>

</div>

<div>

  <label className="block mb-2 font-medium text-slate-700">
    Tipo
  </label>

  <select
    value={tipo}
    onChange={(e) =>
      setTipo(
        e.target.value
      )
    }
    className="
      w-full
      border
      border-slate-300
      rounded-xl
      p-3
    "
  >

    <option value="">
      Todas
    </option>

    <option value="Pagas">
      Pagas
    </option>

    <option value="Gratuitas">
      Gratuitas
    </option>

  </select>

</div>
</div>
      
    </div>

    <div className="flex flex-wrap gap-3 mt-6">

  <button
    onClick={vistaPrevia}
    className="
      bg-blue-950
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-blue-900
    "
  >
    Vista Previa
  </button>

  <button
    onClick={generarPdf}
    className="
      bg-green-700
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-green-800
    "
  >
    Generar PDF
  </button>

  <button
    onClick={limpiarFiltros}
    className="
      bg-slate-500
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-slate-600
    "
  >
    Limpiar
  </button>

</div>
</div> 
{resultado && (

  <div
    style={{
      marginTop: "30px",
    }}
  >

    <h2 className="text-2xl font-bold text-blue-950 mb-4">
  Resumen
</h2>
<div className="bg-blue-50 border-l-4 border-blue-700 rounded-2xl p-5 mb-6">

  <div className="font-bold text-blue-950 text-lg">
    Consulta Realizada
  </div>

  <div className="mt-3 text-slate-700">

    <div>
      Período: {periodo}
    </div>

    <div>
      Caja: {caja}
    </div>

    <div>
      Usuario: {usuarioFiltro || "Todos"}
    </div>

    <div>
      Actuación: {actuacion}
    </div>

    <div>
      Estado: {estado}
    </div>

  </div>

</div>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

  <div className="bg-blue-50 rounded-2xl p-5 border-l-4 border-blue-700">

    <div className="text-slate-500 text-sm">
      RECIBOS
    </div>

    <div className="text-3xl font-bold text-blue-950">
      {resultado.totalRecibos}
    </div>

  </div>

  <div className="bg-green-50 rounded-2xl p-5 border-l-4 border-green-700">

    <div className="text-slate-500 text-sm">
      ACTUACIONES
    </div>

    <div className="text-3xl font-bold text-green-700">
      {resultado.totalActuaciones}
    </div>

  </div>

  <div className="bg-emerald-50 rounded-2xl p-5 border-l-4 border-emerald-700">

    <div className="text-slate-500 text-sm">
      USD
    </div>

    <div className="text-3xl font-bold text-emerald-700">
      ${resultado.totalUSD}
    </div>

  </div>

  <div className="bg-red-50 rounded-2xl p-5 border-l-4 border-red-700">

    <div className="text-slate-500 text-sm">
      ANULADOS
    </div>

    <div className="text-3xl font-bold text-red-700">
      {resultado.totalAnulados}
    </div>

  </div>

  <div className="bg-slate-50 rounded-2xl p-5 border-l-4 border-slate-700">

    <div className="text-slate-500 text-sm">
      MOSTRADOS
    </div>

    <div className="text-3xl font-bold text-slate-700">
      {resultado.registros?.length || 0}
    </div>

  </div>

</div>

{resultado.resumenActuaciones && (

  <div className="bg-white rounded-2xl shadow-md p-6 mb-6 mt-6">

    <h3 className="text-xl font-bold text-blue-950 mb-4">
      Resumen por Actuación
    </h3>

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-2">
              Actuación
            </th>

            <th className="text-center py-2">
              Cantidad
            </th>

            <th className="text-right py-2">
              USD
            </th>

          </tr>

        </thead>

        <tbody>

          {Object.entries(
            resultado.resumenActuaciones
          ).map(
            ([nombre, datos]: any) => (

              <tr
                key={nombre}
                className="border-b"
              >

                <td className="py-2">
                  {nombre}
                </td>

                <td className="text-center">
                  {datos.cantidad}
                </td>

                <td className="text-right">
                  USD {datos.usd}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  </div>

)}

    {resultado.registros?.length === 0 && (

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        No se encontraron registros.
      </div>
      
    )}
 
    {resultado.registros?.length > 0 && (

      <div
        style={{
          marginTop: "30px",
          overflowX: "auto",
        }}

        >

        <h2 className="text-2xl font-bold text-blue-950 mb-4">
  Registros Encontrados
</h2>

        <table className="w-full text-sm">

          <thead>

  <tr className="bg-blue-950 text-white">

    <th className="p-3">
      Fecha
    </th>

    <th className="p-3">
      Recibo
    </th>

    <th className="p-3">
      Documento
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
      Usuario
    </th>

    <th className="p-3">
      Caja
    </th>

    <th className="p-3">
      Estado
    </th>

    <th className="p-3">
      Historial
    </th>

    <th className="p-3">
      Acción
    </th>

  </tr>

</thead>

          <tbody>

            {resultado.registros.map(
              (
                row: any,
                index: number
              ) => (

                <tr
  key={`${row[1]}-${row[4]}-${index}`}
  className="
    border-b
    hover:bg-slate-50
  "
>

  <td>{row[0]}</td>
  <td>{row[1]}</td>
  <td>{row[2]}</td>
  <td>{row[3]}</td>
  <td>{row[4]}</td>
  <td>{row[5]}</td>
  <td>{row[6]}</td>
  <td>{row[7]}</td>

  <td>

    <span
      className={
        row[8] === "ANULADO"
          ? "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"
          : "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"
      }
    >
      {row[8] === "ANULADO"
        ? "ANULADO"
        : "GENERADO"}
    </span>

  </td>

  <td>

    <button
      onClick={() => {
        localStorage.setItem(
          "documentoHistorial",
          row[2]
        );

        window.location.href =
          "/admin/historial";
      }}
    >
      👤 Historial
    </button>

  </td>

  <td>

  <button
    onClick={() =>
      reimprimirRecibo(
        row[1]
      )
    }
  >
    🖨 Reimprimir
  </button>

  {row[8] === "ANULADO" ? (

    <button
      disabled
      className="
        bg-slate-300
        text-slate-500
        px-3
        py-1
        rounded
        cursor-not-allowed
      "
    >
      ❌ Anulado
    </button>

  ) : (

    <button
      onClick={() =>
        anularRecibo(
          row[1]
        )
      }
      className="
        bg-red-600
        text-white
        px-3
        py-1
        rounded
      "
    >
      ❌ Anular
    </button>

  )}

</td>

</tr>
             

              )
            )}

          </tbody>

        </table>

      </div>
      

    )}

    </div>
    

)}</div>
</div>

</main>

);

}

