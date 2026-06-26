"use client";

import {
  useEffect,
  useState,
} from "react";

export default function RecepcionPage() {

  const [
    usuario,
    setUsuario,
  ] = useState<any>(null);

  const [
    documento,
    setDocumento,
  ] = useState("");

  const [
    ciudadano,
    setCiudadano,
  ] = useState<any>(null);

  const [
  mostrarVisitas,
  setMostrarVisitas,
] = useState(false);

const [
  mostrarTramites,
  setMostrarTramites,
] = useState(false);

  const [
  historialVisitas,
  setHistorialVisitas,
] = useState<any[]>([]);

const [
  historialTramites,
  setHistorialTramites,
] = useState<any[]>([]);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [ciudadanoOriginal, setCiudadanoOriginal] =
  useState<any>(null);

const [hayCambios, setHayCambios] =
  useState(false);

const [guardando, setGuardando] =
  useState(false);

  const [
  tipoVisita,
  setTipoVisita,
] = useState("Trámite");

const [
  estadisticas,
  setEstadisticas,
] = useState<any>(null);

const [
  ultimaActualizacion,
  setUltimaActualizacion,
] = useState("");

const [
  catalogos,
  setCatalogos,
] = useState<any>(null);

const [toast, setToast] =
  useState("");

const [toastColor, setToastColor] =
  useState("green");

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
  user.rol !== "recepcion" &&
  user.rol !== "admin"
) {

  window.location.href = "/";
  return;

}

setUsuario(user);

  setUsuario(user);

  cargarEstadisticas();

  cargarCatalogos();

  const intervalo =
    setInterval(() => {

      cargarEstadisticas();

    }, 60000);

  return () =>
    clearInterval(
      intervalo
    );

}, []);

 async function buscarCiudadano() {

  if (!documento.trim()) {

    setMensaje("Ingrese un documento");
    return;

  }

  setMensaje("Buscando...");

  const response =
    await fetch(
      `/api/registro-consular?documento=${documento}`
    );

  const data =
    await response.json();

  if (!data.encontrado) {

    setCiudadano(null);

    setMensaje(
      "Ciudadano no encontrado"
    );

    return;

  }

  setCiudadano(data);

  setCiudadanoOriginal(data);

  setHayCambios(false);

  await cargarHistorialVisitas(
    data.documento
  );

  await cargarHistorialTramites(
    data.documento
  );

  setMensaje("");

}

function actualizarCampo(
  campo: string,
  valor: any
) {

  const nuevoCiudadano = {

    ...ciudadano,

    [campo]: valor,

  };

  setCiudadano(
    nuevoCiudadano
  );

  setHayCambios(

    JSON.stringify(nuevoCiudadano) !==
    JSON.stringify(ciudadanoOriginal)

  );

}
function mostrarToast(
  mensaje: string,
  color:
    "green" | "red" = "green"
) {

  setToast(mensaje);

  setToastColor(color);

  setTimeout(() => {

    setToast("");

  }, 2500);

}
  function cerrarSesion() {

  if (usuario?.rol === "admin") {

    window.location.href = "/admin";

    return;

  }

  localStorage.removeItem("usuarioCaja");

  window.location.href = "/";

}
  function limpiarCampos() {

  setDocumento("");

  setCiudadano(null);

  setHistorialVisitas([]);

  setHistorialTramites([]);

  setMostrarVisitas(false);

  setMostrarTramites(false);

  setMensaje("");

}
async function cargarCatalogos() {

  const response =
    await fetch(
      "/api/catalogos"
    );

  const data =
    await response.json();

  if (data.ok) {

    setCatalogos(data);

  }

}
  async function cargarHistorialVisitas(
  documento: string
) {

  const response =
    await fetch(
      `/api/historial-visitas?documento=${documento}`
    );

  const data =
    await response.json();

  if (data.ok) {

    setHistorialVisitas(
      data.historial
    );

  }

}
async function cargarHistorialTramites(
  documento: string
) {

  const response =
    await fetch(
      `/api/tramites-ciudadano?documento=${documento}`
    );

  const data =
    await response.json();

  if (data.ok) {

    setHistorialTramites(
      data.tramites
    );

  }

}
async function cargarEstadisticas() {

  const response =
    await fetch(
      "/api/estadisticas-visitas"
    );

  const data =
    await response.json();

  if (data.ok) {
    console.log(
  "ESTADISTICAS RECIBIDAS",
  data
);

    setEstadisticas(
      data
    );
setUltimaActualizacion(
  new Date().toLocaleString(
    "es-CO"
  )
);
  }

}
async function guardarCambios() {

  const faltantes = [];

  if (!ciudadano.primerNombre)
    faltantes.push("Primer Nombre");

  if (!ciudadano.primerApellido)
    faltantes.push("Primer Apellido");

  if (!ciudadano.nacionalidad)
    faltantes.push("Nacionalidad");

  if (!ciudadano.ciudadNacimiento)
    faltantes.push("Ciudad de Nacimiento");

  if (!ciudadano.paisNacimiento)
    faltantes.push("País de Nacimiento");

  if (!ciudadano.estadoCivil)
    faltantes.push("Estado Civil");

  if (!ciudadano.genero)
    faltantes.push("Género");

  if (!ciudadano.correo)
    faltantes.push("Correo");

  if (!ciudadano.telefono)
    faltantes.push("Teléfono");

  if (!ciudadano.fechaNacimiento)
    faltantes.push("Fecha de Nacimiento");

  if (faltantes.length > 0) {

    mostrarToast(

`Debe completar:

${faltantes.join("\n")}`,

"red"

);

    return;

  }

  setGuardando(true);

  try {

    const response =
      await fetch(
        "/api/actualizar-ciudadano",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            ciudadano
          ),
        }
      );

    const data =
      await response.json();

    if (!data.ok) {

      setGuardando(false);

      alert(data.error);

      return;

    }

    setCiudadanoOriginal(
      ciudadano
    );

    setHayCambios(false);

    setGuardando(false);

   mostrarToast(
  "✓ Datos actualizados correctamente",
  "green"
);

  } catch {

    setGuardando(false);

    mostrarToast(
  "Error actualizando ciudadano",
  "red"
);

  }

}
async function registrarVisita() {
    
  try {

    const response =
      await fetch(
        "/api/registrar-visita",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({

            documento:
  ciudadano?.documento,

cedula:
  ciudadano.cedula,

pasaporte:
  ciudadano.pasaporte,

            nombre:
              ciudadano.nombreCompleto,

            tipo:
              tipoVisita,

          }),
        }
      );

    const data =
      await response.json();

      
    if (!data.ok) {
 setGuardando(false);
  mostrarToast(
  data.error,
  "red"
);

  return;

}
const documentoBusqueda =
  ciudadano?.documento;
await cargarHistorialVisitas(
  documentoBusqueda
);

await cargarEstadisticas();


  } catch {

    alert(
      "Error registrando visita"
    );

  }

}
async function eliminarVisita(
  fila: number
) {
const documentoBusqueda =
  ciudadano?.documento;
  const confirmar =
    confirm(
      "¿Desea eliminar esta visita?"
    );

  if (!confirmar) {
    return;
  }

  try {

    const response =
      await fetch(
        "/api/eliminar-visita",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fila,
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

    await cargarHistorialVisitas(
  documentoBusqueda
);

await cargarEstadisticas();

await cargarHistorialTramites(
  documentoBusqueda
);

await cargarEstadisticas();

  } catch {

    alert(
      "Error eliminando visita"
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
{toast && (

<div
  className={`
    fixed
    top-5
    right-5
    z-50
    max-w-md
    px-6
    py-4
    rounded-xl
    shadow-2xl
    text-white
    font-semibold
    whitespace-pre-line

    ${
      toastColor === "green"
        ? "bg-green-600"
        : "bg-red-600"
    }
  `}
>
  {toast}
</div>

)}
          <div className="flex justify-end mb-4">

  {usuario?.rol === "admin" && (

    <button
      onClick={() => {
        window.location.href = "/admin";
      }}
      className="bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 mr-2"
    >
      Panel Adm
    </button>

  )}

  <button
    onClick={cerrarSesion}
    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
  >
    Cerrar Sesión
  </button>

</div>

          <h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">

  Registro Consular

</h1>

{estadisticas && (

  <div className="grid md:grid-cols-4 gap-4 mb-8">

    <div className="bg-blue-50 p-5 rounded-2xl">

  <div className="text-slate-500">
    Visitas Hoy
  </div>

  <div className="text-4xl font-bold text-blue-900">
    {estadisticas.hoyTotal}
  </div>

  <div className="mt-3 text-sm space-y-1">

    <div>
      Trámite:
      <strong>
        {" "}
        {estadisticas.tipos.Trámite.hoy}
      </strong>
    </div>

    <div>
      Información:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Información"
          ].hoy
        }
      </strong>
    </div>

    <div>
      Acompañante:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Acompañante"
          ].hoy
        }
      </strong>
    </div>

    <div>
      Cita Institucional:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Cita Institucional"
          ].hoy
        }
      </strong>
    </div>

  </div>

</div>

    <div className="bg-green-50 p-5 rounded-2xl">

  <div className="text-slate-500">
    Visitas Mes
  </div>

  <div className="text-4xl font-bold text-green-700">
    {estadisticas.mesTotal}
  </div>

  <div className="mt-3 text-sm space-y-1">

    <div>
      Trámite:
      <strong>
        {" "}
        {estadisticas.tipos.Trámite.mes}
      </strong>
    </div>

    <div>
      Información:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Información"
          ].mes
        }
      </strong>
    </div>

    <div>
      Acompañante:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Acompañante"
          ].mes
        }
      </strong>
    </div>

    <div>
      Cita Institucional:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Cita Institucional"
          ].mes
        }
      </strong>
    </div>

  </div>

</div>

   <div className="bg-purple-50 p-5 rounded-2xl">

  <div className="text-slate-500">
    Visitas Año
  </div>

  <div className="text-4xl font-bold text-purple-700">
    {estadisticas.anioTotal}
  </div>

  <div className="mt-3 text-sm space-y-1">

    <div>
      Trámite:
      <strong>
        {" "}
        {estadisticas.tipos.Trámite.anio}
      </strong>
    </div>

    <div>
      Información:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Información"
          ].anio
        }
      </strong>
    </div>

    <div>
      Acompañante:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Acompañante"
          ].anio
        }
      </strong>
    </div>

    <div>
      Cita Institucional:
      <strong>
        {" "}
        {
          estadisticas.tipos[
            "Cita Institucional"
          ].anio
        }
      </strong>
    </div>

  </div>

</div>
<div className="bg-orange-50 p-5 rounded-2xl">

  <div className="text-slate-500">
    Ciudadanos Registrados
  </div>

  <div className="text-4xl font-bold text-orange-700">
    {estadisticas.ciudadanosRegistrados}
  </div>

  <div className="mt-3 text-sm space-y-1">

    <div>
      Venezolanos:
      <strong>
        {" "}
        {estadisticas.venezolanos}
      </strong>
    </div>

    <div>
      Extranjeros:
      <strong>
        {" "}
        {estadisticas.extranjeros}
      </strong>
    </div>

  </div>

</div>
  </div>

)}
{ultimaActualizacion && (

  <div
    className="
      text-xs
      text-slate-500
      text-right
      mb-6
    "
  >

    Última actualización:
    {" "}
    {ultimaActualizacion}

  </div>

)}

<div
  className="
    bg-slate-50
    rounded-2xl
    shadow-md
    p-6
    mt-8
  "
></div>
<p className="text-center text-slate-700 text-lg mb-4">

  Bienvenido{" "}
  <strong>
    {usuario.nombre}
  </strong>

</p>

          <div className="flex justify-center mb-8">

            <div className="flex w-72 h-1 rounded-full overflow-hidden">

              <div className="w-1/3 bg-yellow-400"></div>

              <div className="w-1/3 bg-blue-700"></div>

              <div className="w-1/3 bg-red-600"></div>

            </div>

          </div>

          <div
            className="
              bg-slate-50
              rounded-2xl
              shadow-md
              p-6
              mb-8
            "
          >

            <h2 className="text-2xl font-bold text-blue-950 mb-4">

              Consulta Ciudadana

            </h2>

            <label className="block mb-2 font-medium">
  Cédula o Pasaporte
</label>

            <input
  value={documento}
  onChange={(e) =>
    setDocumento(
      e.target.value
    )
  }
  onKeyDown={(e) => {

    if (e.key === "Enter") {

      buscarCiudadano();

    }

  }}
  className="
    w-full
    border
    rounded-xl
    p-3
  "
/>

            <div className="flex gap-3 mt-4">

  <button
    onClick={
      buscarCiudadano
    }
    className="
      bg-blue-950
      text-white
      px-5
      py-3
      rounded-xl
    "
  >
    🔍 Buscar
  </button>

  <button
  onClick={limpiarCampos}
>
    🧹 Limpiar
  </button>

</div>

            {mensaje && (

              <div
                className="
                  mt-4
                  bg-yellow-50
                  border-l-4
                  border-yellow-500
                  p-4
                  rounded-xl
                "
              >
                {mensaje}
              </div>

            )}

          </div>

          {ciudadano && (

            <div
              className="
                bg-slate-50
                rounded-2xl
                shadow-md
                p-6
              "
            >

              <h2 className="text-2xl font-bold text-blue-950 mb-6">
  Datos del Ciudadano
</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
    <label className="block mb-2 font-medium">
      Fecha Registro
    </label>

    <input
      value={ciudadano.fechaRegistro}
      disabled
      className="
        w-full
        border
        rounded-xl
        p-3
        bg-slate-100
      "
    />
  </div>
  <div>
    <label className="block mb-2 font-medium">
      Cédula
    </label>

    <input
      className="w-full border rounded-xl p-3"
      value={ciudadano.cedula || ""}
      disabled={guardando}
      onChange={(e) =>
        actualizarCampo(
          "cedula",
          e.target.value
        )
      }
    />
  </div>

  <div>
    <label className="block mb-2 font-medium">
      Pasaporte
    </label>

    <input
      className="w-full border rounded-xl p-3"
      value={ciudadano.pasaporte || ""}
      disabled={guardando}
      onChange={(e) =>
        actualizarCampo(
          "pasaporte",
          e.target.value
        )
      }
    />
  </div>
                    <div>

                  <label>
                    Primer Nombre
                  </label>

                  <input

  value={
    ciudadano.primerNombre || ""
  }

  disabled={guardando}

  onChange={(e)=>
    actualizarCampo(
      "primerNombre",
      e.target.value
    )
  }

  className="
    w-full
    border
    rounded-xl
    p-3
  "

/>

                </div>

                <div>

                  <label>
                    Segundo Nombre
                  </label>

                  <input
                    value={
                      ciudadano.segundoNombre || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "segundoNombre",
    e.target.value
  )
}
                    className="
                      w-full
                      border
                      rounded-xl
                      p-3
                    "
                  />

                </div>

                <div>

                  <label>
                    Primer Apellido
                  </label>

                  <input
                    value={
                      ciudadano.primerApellido || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "primerApellido",
    e.target.value
  )
}
                    className="
                      w-full
                      border
                      rounded-xl
                      p-3
                    "
                  />

                </div>

                <div>

                  <label>
                    Segundo Apellido
                  </label>

                  <input
                    value={
                      ciudadano.segundoApellido || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "segundoApellido",
    e.target.value
  )
}
                    className="
                      w-full
                      border
                      rounded-xl
                      p-3
                    "
                  />

                </div>

                <div>

                  <label>
                    Nacionalidad
                  </label>

                  <select
  value={
    ciudadano.nacionalidad || ""
  }
  onChange={(e) =>
  actualizarCampo(
    "nacionalidad",
    e.target.value
  )
}
  className="
    w-full
    border
    rounded-xl
    p-3
  "
>

  {catalogos?.nacionalidades?.map(
    (item: string) => (

      <option
        key={item}
        value={item}
      >

        {item}

      </option>

    )
  )}

</select>

                </div>

                <div>

                  <label className="block mb-2 font-medium">
  Estado Civil
</label>

<select
  value={
    ciudadano.estadoCivil || ""
  }
  onChange={(e) =>
  actualizarCampo(
    "estadoCivil",
    e.target.value
  )
}
  className="
    w-full
    border
    rounded-xl
    p-3
  "
>

  <option value="">
    Seleccione
  </option>

  {catalogos?.estadosCivil?.map(
    (estado: string) => (

      <option
        key={estado}
        value={estado}
      >
        {estado}
      </option>

    )
  )}

</select>

                </div>

                <div>

                  <label>
                    Ciudad Nacimiento
                  </label>

                  <input
                    value={
                      ciudadano.ciudadNacimiento || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "ciudadNacimiento",
    e.target.value
  )
}
                    className="w-full border rounded-xl p-3"
                  />

                </div>

                <div>

                  <label className="block mb-2 font-medium">
  País de Nacimiento
</label>

<select
  value={
    ciudadano.paisNacimiento || ""
  }
  onChange={(e) =>
  actualizarCampo(
    "paisNacimiento",
    e.target.value
  )
}
  className="
    w-full
    border
    rounded-xl
    p-3
  "
>

  <option value="">
    Seleccione
  </option>

  {catalogos?.paises?.map(
    (pais: string) => (

      <option
        key={pais}
        value={pais}
      >
        {pais}
      </option>

    )
  )}

</select>

                </div>

                <div>

                  <label className="block mb-2 font-medium">
  Género
</label>

<select
  value={
    ciudadano.genero || ""
  }
  onChange={(e) =>
  actualizarCampo(
    "genero",
    e.target.value
  )
}
  className="
    w-full
    border
    rounded-xl
    p-3
  "
>

  <option value="">
    Seleccione
  </option>

  {catalogos?.generos?.map(
    (genero: string) => (

      <option
        key={genero}
        value={genero}
      >
        {genero}
      </option>

    )
  )}

</select>

                </div>

                <div>

                  <label>
                    Fecha Nacimiento
                  </label>

                  <input
                    value={
                      ciudadano.fechaNacimiento || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "fechaNacimiento",
    e.target.value
  )
}
                    className="w-full border rounded-xl p-3"
                  />

                </div>
<div>

  <label>Teléfono</label>

                  <input
                    value={
                      ciudadano.telefono || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "telefono",
    e.target.value
  )
}
                    className="w-full border rounded-xl p-3"
                  />

                </div>
                <div className="md:col-span-2">

                  <label>
                    Correo
                  </label>

                  <input
                    value={
                      ciudadano.correo || ""
                    }
                    onChange={(e) =>
  actualizarCampo(
    "correo",
    e.target.value
  )
}
                    className="w-full border rounded-xl p-3"
                  />

                </div>
                              </div>
<div className="mt-6">

  <div className="flex gap-3 mt-6">

  <button
  onClick={guardarCambios}

  disabled={
    !hayCambios ||
    guardando
  }

  className={`
    px-5
    py-3
    rounded-xl
    text-white
    font-semibold
    transition

    ${
      guardando
        ? "bg-blue-400 cursor-not-allowed"
        : hayCambios
        ? "bg-green-700 hover:bg-green-800"
        : "bg-slate-400 cursor-not-allowed"
    }
  `}
>

  {guardando
    ? "⏳ Guardando..."
    : "💾 Guardar Cambios"}

</button>

  <button
    onClick={
      limpiarCampos
    }
    className="
      bg-slate-500
      text-white
      px-5
      py-3
      rounded-xl
    "
  >
    🧹 Limpiar
  </button>

</div>
<hr className="my-8" />

<h2 className="text-2xl font-bold text-blue-950 mb-4">

  Registro de Visita

</h2>

<div className="grid md:grid-cols-2 gap-4">

  <div>

    <label>
      Tipo de Visita
    </label>

    <select
      value={tipoVisita}
      onChange={(e) =>
        setTipoVisita(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        p-3
      "
    >

      <option>
        Trámite
      </option>

      <option>
        Información
      </option>

      <option>
        Acompañante
      </option>

      <option>
        Cita Institucional
      </option>

    </select>

  </div>

</div>

<div className="mt-4">

  <button
    onClick={
      registrarVisita
    }
    className="
      bg-blue-950
      text-white
      px-6
      py-3
      rounded-xl
      hover:bg-blue-900
    "
  >
    ➕ Registrar Visita
  </button>

</div>
{historialVisitas.length > 0 && (

  <div
    className="
      bg-slate-50
      rounded-2xl
      shadow-md
      p-6
      mt-8
    "
  >

    <button
      onClick={() =>
        setMostrarVisitas(
          !mostrarVisitas
        )
      }
      className="
        w-full
        bg-blue-50
        rounded-2xl
        p-4
        text-left
        font-bold
        text-blue-950
        mb-4
      "
    >

      {mostrarVisitas
        ? "▼"
        : "►"} Historial de Visitas
        ({historialVisitas.length})

    </button>

    {mostrarVisitas && (

      <>
        {historialVisitas.map(
          (item, index) => (

            <div
              key={item.fila}
              className="
                bg-white
                rounded-xl
                p-3
                mb-2
                flex
                justify-between
              "
            >

              <span>

                #{index + 1}
{" | "}
{item.fecha}
{" | "}
{item.tipo}

              </span>

              <button
                onClick={() =>
                  eliminarVisita(
                    item.fila
                  )
                }
                className="
                  bg-red-600
                  text-white
                  px-2
                  rounded-lg
                "
              >
                🗑️
              </button>

            </div>

          )
        )}
      </>

    )}

  </div>

)}

   {ciudadano && (

  <div
    className="
      bg-slate-50
      rounded-2xl
      shadow-md
      p-6
      mt-8
    "
  >

  <button
    onClick={() =>
      setMostrarTramites(
        !mostrarTramites
      )
    }
    className="
      w-full
      bg-green-50
      rounded-2xl
      p-4
      text-left
      font-bold
      text-green-800
      mb-4
    "
  >

    {mostrarTramites
      ? "▼"
      : "►"} Historial de Trámites
      ({historialTramites.length})

  </button>

  {mostrarTramites && (

    <>

      {historialTramites.length === 0 && (

        <div
          className="
            bg-yellow-50
            border-l-4
            border-yellow-500
            p-4
            rounded-xl
            mb-4
          "
        >

          No posee trámites registrados.

        </div>

      )}

      {historialTramites.map(
        (
          tramite,
          index
        ) => (

          <div
            key={index}
            className={`
              rounded-xl
              p-5
              mb-4
              ${
                tramite.estado ===
                "ANULADO"
                  ? "bg-red-50 border-l-4 border-red-600"
                  : "bg-white"
              }
            `}
          >

            <div className="flex justify-between mb-3">

              <div>

               <div className="font-bold text-blue-950">

 #{index + 1} · {tramite.correlativo}
<div className="text-xs text-slate-500">
  {tramite.usuario} | {tramite.caja || "Sin Caja"}
</div>

</div>

                <div className="text-sm text-slate-500">

                  {tramite.fecha}

                </div>

              </div>

              <div>

                {tramite.estado ===
                "ANULADO" ? (

                  <span className="text-red-600 font-bold">
                    ❌ ANULADO
                  </span>

                ) : (

                  <span className="text-green-700 font-bold">
                    ✅ GENERADO
                  </span>

                )}

              </div>

            </div>

            {tramite.actuaciones.map(
              (
                act: any,
                i: number
              ) => (

                <div
                  key={i}
                  className="
                    flex
                    justify-between
                    py-1
                  "
                >

                  <span>
                    {act.actuacion}
                  </span>

                  <span>
                    USD {act.monto}
                  </span>

                </div>

              )
            )}

            <div className="mt-3 font-bold text-green-700">

              Total USD {tramite.total}

            </div>

          </div>

        )
      )}

    </>

  )}

</div>
   )}
</div>
</div>
          )}
</div>
</div>
</main>

);
}