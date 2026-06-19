"use client";

import {
  useEffect,
  useState,
} from "react";

export default function HistorialPage() {

  const [documento, setDocumento] =
    useState("");

  const [resultado, setResultado] =
    useState<any>(null);

  useEffect(() => {

  const documentoGuardado =
    localStorage.getItem(
      "documentoHistorial"
    );

  if (
    documentoGuardado
  ) {

    setDocumento(
      documentoGuardado
    );

    localStorage.removeItem(
      "documentoHistorial"
    );

    buscarDocumento(
      documentoGuardado
    );

  }

}, []);

async function buscarDocumento(
  documentoBuscar: string
) {

  const response =
    await fetch(
      "/api/historial-ciudadano",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          documento:
            documentoBuscar,
        }),
      }
    );

  const data =
    await response.json();

  setResultado(
    data
  );

}

async function buscar() {

  await buscarDocumento(
    documento
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

<h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">

  Historial de Ciudadanos

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
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Dashboard
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

      <h2 className="text-2xl font-bold text-blue-950 mb-4 mt-8">
  Búsqueda
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

      <div className="mt-6 flex gap-3">

  <button
    onClick={buscar}
    className="
      bg-blue-950
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-blue-900
    "
  >
    🔍 Buscar
  </button>

  <button
    onClick={() => {

      setDocumento("");

      setResultado(null);

    }}
    className="
      bg-slate-500
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-slate-600
    "
  >
    🧹 Limpiar
  </button>

</div>

</div>
{resultado &&
 resultado.historial?.length === 0 && (

  <div
    className="
      bg-yellow-50
      border-l-4
      border-yellow-500
      p-4
      rounded-xl
      mt-6
    "
  >
    No se encontraron registros para este documento.
  </div>

)}

{resultado?.historial?.length > 0 && (

  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

    <div className="bg-blue-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">

      <div className="text-slate-500 text-sm">
        Documento
      </div>

      <div className="text-2xl font-bold text-blue-950 mt-2">
        {documento}
      </div>

    </div>

    <div className="bg-green-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

      <div className="text-slate-500 text-sm">
        Total Trámites
      </div>

      <div className="text-3xl font-bold text-green-700 mt-2">
        {resultado.total}
      </div>

    </div>

    <div className="bg-purple-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-700">

      <div className="text-slate-500 text-sm">
        Registros
      </div>

      <div className="text-3xl font-bold text-purple-700 mt-2">
        {resultado.historial.length}
      </div>

    </div>

  </div>

)}
      {resultado?.historial?.length > 0 && (

        <div className="mt-8">

          <h2 className="text-2xl font-bold text-blue-950 mb-6">
  Historial Encontrado
</h2>

          {resultado.historial.map(
  (
    item: any,
    index: number
  ) => (

    <div
  key={index}
  className={`
    rounded-2xl
    shadow-md
    p-6
    mb-5
    ${
      item.estado === "ANULADO"
        ? "bg-red-50 border-l-4 border-red-600"
        : "bg-slate-50"
    }
  `}
>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div>

    <p>
      <strong>Fecha:</strong>
      {" "}
      {item.fecha}
    </p>

    <p>
      <strong>Recibo:</strong>
      {" "}
      {item.correlativo}
    </p>

    <p>
      <strong>Nombre:</strong>
      {" "}
      {item.nombre}
    </p>

  </div>

  <div>

    <p>
      <strong>Usuario:</strong>
      {" "}
      {item.usuario}
    </p>

    <p>
      <strong>Caja:</strong>
      {" "}
      {item.caja}
    </p>

    <p>

      <strong>Estado:</strong>
      {" "}

      {item.estado ===
      "ANULADO" ? (

        <span className="text-red-600 font-bold">
          ❌ ANULADO
        </span>

      ) : (

        <span className="text-green-700 font-bold">
          ✅ GENERADO
        </span>

      )}

    </p>

  </div>

</div>

<div className="mt-5">

  <h3 className="font-bold text-blue-950 mb-3">
    Actuaciones
  </h3>

  <div className="space-y-2">

    {item.actuaciones.map(
      (
        act: any,
        i: number
      ) => (

        <div
          key={i}
          className="
            flex
            justify-between
            bg-white
            rounded-xl
            p-3
            border
          "
        >

          <span>
            {act.actuacion}
          </span>

          <span className="font-semibold text-green-700">
            USD {act.monto}
          </span>

        </div>

      )
    )}

  </div>

</div>

 </div>

  )
)}

        </div>

      )}

    </div>

  </div>

</main>
)
}