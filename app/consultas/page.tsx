"use client";

import {
  useEffect,
  useState,
} from "react";

export default function ConsultasPage() {

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

    const rol =
      user.rol
        ?.toString()
        .trim()
        .toLowerCase();

    if (

      rol !== "admin" &&

      rol !== "consulta" &&

      rol !== "analista"

    ) {

      window.location.href =
        "/ingreso";

      return;

    }

    setUsuario(user);

    cargarDashboard();

  }, []);

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

  if (!usuario) {

    return <div>Cargando...</div>;

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

<h1 className="text-4xl font-bold text-center text-blue-950">

Centro de Consultas

</h1>

<p className="text-center text-slate-700 mt-3">

Consulado General de la República
Bolivariana de Venezuela
en Barranquilla

</p>

<div className="flex justify-center my-8">

<div className="flex w-72 h-1 rounded-full overflow-hidden">

<div className="w-1/3 bg-yellow-400"></div>

<div className="w-1/3 bg-blue-700"></div>

<div className="w-1/3 bg-red-600"></div>

</div>

</div>

<div className="flex justify-end mb-6">

<button

onClick={() => {

localStorage.removeItem(
"usuarioCaja"
);

window.location.href =
"/ingreso";

}}

className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"

>

Cerrar Sesión

</button>

</div>

{/* Aquí colocaremos las tarjetas */}

</div>

</div>

</main>

  );

}