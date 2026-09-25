"use client";

import { useState } from "react";
import { obtenerPaginaInicio } from "@/lib/rutas";

export default function IngresoPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [
  mostrarSelectorCaja,
  setMostrarSelectorCaja,
] = useState(false);

const [
  usuarioLogin,
  setUsuarioLogin,
] = useState<any>(null);

const [
  cajaSeleccionada,
  setCajaSeleccionada,
] = useState("Caja 1");

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();

    setMensaje("Validando...");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario,
        password,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
  setMensaje(data.mensaje);
  return;
}

const rol = data.rol?.toString().trim().toLowerCase();

if (
  rol === "recepcion" ||
  rol === "consultas" ||
  rol === "analista"
) {

  localStorage.setItem(
    "usuarioCaja",
    JSON.stringify(data)
  );

  window.location.href =
    obtenerPaginaInicio(rol);

  return;
}
setUsuarioLogin(data);

if (
  data.rol
    ?.toString()
    .trim()
    .toLowerCase() === "admin" ||

  data.rol
    ?.toString()
    .trim()
    .toLowerCase() === "caja"
) {

  setMostrarSelectorCaja(true);

} else {

  setMostrarSelectorCaja(false);

}

setMensaje("");

return;


  }
async function continuarCaja() {

  setMensaje("Verificando disponibilidad de la caja...");

  try {

    const response = await fetch(
      "/api/seleccionar-caja",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caja:
            cajaSeleccionada,
        }),
      }
    );

    const data =
      await response.json();

    if (!data.ok) {

      setMensaje(
        data.mensaje ||
        "La caja no está disponible."
      );

      return;
    }

    localStorage.setItem(
      "usuarioCaja",
      JSON.stringify({
        ...usuarioLogin,
        caja:
          cajaSeleccionada,
      })
    );

    window.location.href =
      obtenerPaginaInicio(
        usuarioLogin.rol
      );

  } catch (error) {

    console.error(
      "Error seleccionando caja:",
      error
    );

    setMensaje(
      "No fue posible verificar la disponibilidad de la caja."
    );
  }
}
  return (
    <main className="min-h-screen bg-slate-200">

  <div className="max-w-xl mx-auto px-4 py-8">

    <div className="bg-white rounded-3xl shadow-2xl p-8">

<div className="flex justify-center mb-5">

  <img
    src="/logo.png"
    alt="Logo"
    className="w-24"
  />

</div>

      <h1 className="text-3xl font-bold text-center text-blue-950 mb-3">

  Ingreso al Intranet Barranquilla

</h1>
<p className="text-center text-slate-700 mb-4">

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
{mostrarSelectorCaja && (

  <div>

    <h2>
  Bienvenido {usuarioLogin?.nombre}
</h2>

<p>
  Seleccione la caja de trabajo
</p>

    <select
  value={cajaSeleccionada}
  onChange={(e) =>
    setCajaSeleccionada(
      e.target.value
    )
  }
  className="
    w-full
    border
    border-slate-300
    rounded-2xl
    p-4
  "
>

      <option value="Caja 1">
        Caja 1
      </option>

      <option value="Caja 2">
        Caja 2
      </option>

    </select>

    <br />
    <br />

    <button
  onClick={continuarCaja}
  className="
    w-full
    bg-blue-950
    hover:bg-blue-900
    text-white
    font-bold
    text-lg
    rounded-2xl
    p-4
    cursor-pointer
  "
>
      Continuar
    </button>

    <hr />

  </div>

)}
      {!mostrarSelectorCaja && (

  <form onSubmit={ingresar}>

    <div>
      <label>Usuario</label>
      <br />
      <input
  value={usuario}
  onChange={(e) =>
    setUsuario(e.target.value)
  }
  className="
    w-full
    border
    border-slate-300
    rounded-2xl
    p-4
  "
/>
    </div>

    <br />

    <div>
      <label>Contraseña</label>
      <br />
      <input
  type="password"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }
  className="
    w-full
    border
    border-slate-300
    rounded-2xl
    p-4
  "
/>
    </div>

    <br />

    <button
  type="submit"
  className="
    w-full
    bg-blue-950
    hover:bg-blue-900
    text-white
    font-bold
    text-lg
    rounded-2xl
    p-4
    cursor-pointer
  "
>
  Ingresar
</button>

  </form>
)}
      <p>{mensaje}</p>
      </div>

  </div>
    </main>
  );
}
