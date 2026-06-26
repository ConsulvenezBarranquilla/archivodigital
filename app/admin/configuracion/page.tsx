"use client";

import {
  useEffect,
  useState,
} from "react";

export default function ConfiguracionPage() {

  const [
    guardarPdfDrive,
    setGuardarPdfDrive,
  ] = useState("NO");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  useEffect(() => {

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

    cargarConfiguracion();

  }, []);

  async function cargarConfiguracion() {

    try {

      const response =
        await fetch(
          "/api/configuracion"
        );

      const data =
        await response.json();

      if (data.ok) {

        setGuardarPdfDrive(
          data.configuracion
            ?.GUARDAR_PDF_DRIVE ||
            "NO"
        );

      }

    } catch {

      alert(
        "Error cargando configuración"
      );

    } finally {

      setCargando(
        false
      );

    }

  }

  async function generarBackup() {

  const response =
    await fetch(
      "/api/backup-excel"
    );

  const blob =
    await response.blob();

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
    "Backup_Modulo_Caja.xlsx";

  document.body.appendChild(
    a
  );

  a.click();

  a.remove();

}
  async function guardarConfiguracion() {

    try {

      const response =
        await fetch(
          "/api/configuracion",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              guardarPdfDrive,
            }),
          }
        );

      const data =
        await response.json();

      if (!data.ok) {

        alert(
          data.error ||
            "Error guardando"
        );

        return;

      }

      alert(
        "Configuración guardada correctamente"
      );

    } catch {

      alert(
        "Error guardando configuración"
      );

    }

  }

  if (cargando) {

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

<h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">

  Configuración del Sistema

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

      <h2 className="text-2xl font-bold text-blue-950 mb-4 mt-8">
  Configuración General
</h2>
<p className="text-slate-600 mb-6">
  Administre las opciones globales del sistema de caja,
  respaldos y almacenamiento de documentos.
</p>
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
    Guardar PDF automáticamente en Google Drive
  </label>

      <select
  value={guardarPdfDrive}
  onChange={(e) =>
    setGuardarPdfDrive(
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

        <option value="SI">
  Sí
</option>

<option value="NO">
  No
</option>

      </select>

      <br />
      <br />

      <div className="flex gap-3 mt-6">

  <button
    onClick={
      guardarConfiguracion
    }
    className="
      bg-green-700
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-green-800
    "
  >
    💾 Guardar Configuración
  </button>

  <button
    onClick={generarBackup}
    className="
      bg-blue-950
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-blue-900
    "
  >
    📥 Generar Respaldo Excel
  </button>

</div>
</div> {/* Configuración General */}

</div> {/* Tarjeta blanca principal */}

</div> {/* max-w-7xl */}

</main>
    
  );

}