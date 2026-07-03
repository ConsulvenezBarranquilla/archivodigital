"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

export default function CajaPage() {
  const [usuario, setUsuario] = useState<any>(null);

  const [documento, setDocumento] = useState("");

  const [ciudadano, setCiudadano] =
    useState<any>(null);

  const [mensaje, setMensaje] =
    useState("");
  
const [
  mensajeRecibo,
  setMensajeRecibo,
] = useState("");

const [
  tipoCierre,
  setTipoCierre,
] = useState("todas");

const [
  generandoCierre,
  setGenerandoCierre,
] = useState(false);

  const [actuaciones, setActuaciones] =
    useState<any[]>([]);

  const [
  busquedaActuacion,
  setBusquedaActuacion,
] = useState("");

const [
  mostrarActuaciones,
  setMostrarActuaciones,
] = useState(false);

const [
  resumenCaja,
  setResumenCaja,
] = useState<any>(null);

const [
  mostrarConfirmacion,
  setMostrarConfirmacion,
] = useState(false);

const actuacionesRef =
  useRef<HTMLDivElement>(null);

const [
  actuacionesSeleccionadas,
  setActuacionesSeleccionadas,
] = useState<any[]>([]);

const totalUSD =
  actuacionesSeleccionadas.reduce(
    (total, item) =>
      total + Number(item.monto),
    0
  );

  const actuacionesFiltradas =
    actuaciones.filter((item) =>
      item.actuacion
        ?.toLowerCase()
        .includes(
          busquedaActuacion.toLowerCase()
        )
    );
useEffect(() => {

  function handleClickOutside(
    event: MouseEvent
  ) {

    if (
      actuacionesRef.current &&
      !actuacionesRef.current.contains(
        event.target as Node
      )
    ) {

      setMostrarActuaciones(
        false
      );

    }

  }

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {

    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );

  };

}, []);
  useEffect(() => {
    const data =
  localStorage.getItem("usuarioCaja");

if (!data) {
  window.location.href =
    "/ingreso";
  return;
}

const usuarioLocal =
  JSON.parse(data);


setUsuario(usuarioLocal);
fetch(
  `/api/resumen-caja?caja=${usuarioLocal.caja}`
)
  .then((res) => res.json())
  .then((data) => {

    if (data.ok) {

      setResumenCaja(data);

    }

  });

    fetch("/api/actuaciones")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setActuaciones(
            data.actuaciones
          );
        }
      });
  }, []);

  async function buscarCiudadano() {

setMensaje("");
 setMensajeRecibo("");

  setActuacionesSeleccionadas([]);

  setBusquedaActuacion("");

  setMostrarActuaciones(false);

    if (!documento.trim()) {
      setMensaje(
        "Ingrese un documento"
      );
      return;
    }

    setMensaje("Buscando...");

    const response = await fetch(
      `/api/registro-consular?documento=${documento}`
    );

    const data = await response.json();

    if (!data.encontrado) {
      setCiudadano(null);
      setMensaje(
        "Ciudadano no encontrado"
      );
      return;
    }

    setCiudadano(data);
    setMensaje("");
  }

  if (!usuario) {
    return <div>Cargando...</div>;
  }
function limpiarFormulario() {

  setDocumento("");

  setCiudadano(null);

  setMensaje("");

  setMensajeRecibo("");

  setBusquedaActuacion("");

  setActuacionesSeleccionadas([]);

  setMostrarActuaciones(false);

}
function agregarActuacion(item: any) {

  setMensajeRecibo("");

  
  setActuacionesSeleccionadas([
  ...actuacionesSeleccionadas,
  {
    ...item,
    id:
      Date.now() +
      Math.random(),
  },
]);

  setBusquedaActuacion("");

  setMostrarActuaciones(false);
}

function eliminarActuacion(
  id: number
) {

   setMensajeRecibo("");

  setActuacionesSeleccionadas(
  actuacionesSeleccionadas.filter(
    (a: any) =>
      a.id !== id
  )
);

}

async function generarRecibo() {

  try {

    setMensajeRecibo(
      "Generando recibo..."
    );
    

    const response =
          await fetch(
        "/api/generar-recibo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ciudadano,
            actuaciones:
              actuacionesSeleccionadas,
            totalUSD,
            usuario,
          }),
        }
      );

    const data =
      await response.json();

    if (!data.ok) {

      setMensajeRecibo(
        data.mensaje ||
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
          body: JSON.stringify(data),
        }
      );
setCiudadano(null);

setDocumento("");

setBusquedaActuacion("");

setActuacionesSeleccionadas([]);

setMostrarActuaciones(false);
    if (!pdfResponse.ok) {

      setMensajeRecibo(
        "Error generando PDF"
      );

      return;

    }

    const blob =
      await pdfResponse.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      `RECIBO_${data.correlativo.replace("/", "-")}.pdf`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();

    window.URL.revokeObjectURL(
      url
    );
setMensaje("");
    setMensajeRecibo(
      `Recibo generado correctamente. Correlativo: ${data.correlativo}`
      
    );
    setBusquedaActuacion("");

setMostrarActuaciones(false);

setActuacionesSeleccionadas([]);
fetch(
  `/api/resumen-caja?caja=${usuario.caja}`
)
  .then((res) => res.json())
  .then((data) => {

    if (data.ok) {

      setResumenCaja(data);

    }

  });
  } catch (error) {

    setMensajeRecibo(
      "Error generando recibo"
    );

  }

}
async function confirmarGeneracion() {

  setMostrarConfirmacion(
    false
  );

  await generarRecibo();

}

async function generarCierreDiario() {

  try {

    setGenerandoCierre(true);

    const responseDatos =
      await fetch(
        "/api/cierre-diario",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            usuario:
              usuario.nombre,
            caja:
              usuario.caja,
            tipo:
              tipoCierre,
          }),
        }
      );

    const datos =
      await responseDatos.json();

    if (!datos.ok) {

      alert(
        datos.error ||
        "Error generando cierre"
      );

      return;

    }

    const responsePdf =
      await fetch(
        "/api/pdf-cierre",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            datos
          ),
        }
      );

    if (!responsePdf.ok) {

      alert(
        "Error generando PDF"
      );

      return;

    }

    const blob =
      await responsePdf.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      `CIERRE_${usuario.caja}_${datos.fecha.replaceAll("/", "-")}.pdf`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();

    window.URL.revokeObjectURL(
      url
    );

  } catch (error) {

    alert(
      "Error generando cierre"
    );

  } finally {

    setGenerandoCierre(
      false
    );

  }

}
 
  return (
    <>
    {mostrarConfirmacion && (

  <div
    className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      z-50
    "
  >

    <div
      className="
        bg-white
        rounded-3xl
        shadow-2xl
        p-8
        w-full
        max-w-md
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          text-blue-950
          mb-4
          text-center
        "
      >
        Confirmar Recibo
      </h2>

      <p className="text-center text-slate-600 mb-6">
        Está a punto de generar un recibo por:
      </p>

      <div
        className="
          bg-green-50
          rounded-2xl
          p-5
          text-center
          mb-4
        "
      >

        <div className="text-slate-500">
          Total a Cobrar
        </div>

        <div
          className="
            text-5xl
            font-bold
            text-green-700
          "
        >
          USD {totalUSD.toFixed(2)}
        </div>

      </div>

      <div
        className="
          text-center
          text-slate-600
          mb-6
        "
      >
        Actuaciones:
        {" "}
        <strong>
          {
            actuacionesSeleccionadas.length
          }
        </strong>
      </div>

      <div
        className="
          flex
          gap-3
        "
      >

        <button
          onClick={() =>
            setMostrarConfirmacion(
              false
            )
          }
          className="
            flex-1
            bg-red-600
            hover:bg-red-700
            text-white
            rounded-2xl
            py-3
            font-bold
          "
        >
          Cancelar
        </button>

        <button
          onClick={
            confirmarGeneracion
          }
          className="
            flex-1
            bg-green-700
            hover:bg-green-800
            text-white
            rounded-2xl
            py-3
            font-bold
          "
        >
          Confirmar
        </button>

      </div>

    </div>

  </div>

)}
  {usuario && (

  <div
  className="
    bg-blue-950
    text-white
    rounded-2xl
    p-4
    mb-5
    flex
    justify-between
    items-center
    shadow-md
  "
>

    <div>

      <strong>
        Usuario:
      </strong>

      {" "}

      {usuario.nombre}

      {" | "}

      <strong>
        Rol:
      </strong>

      {" "}

      {usuario.rol}

      {" | "}

      <strong>
        Caja Activa:
      </strong>

      {" "}

      <span className="font-bold text-yellow-300">
  {usuario.caja}
</span>

    </div>
{usuario?.rol ===
  "admin" && (

  <button
    onClick={() =>
      window.location.href =
        "/admin"
    }
    style={{
      cursor:
        "pointer",
      marginRight:
        "10px",
    }}
  >
    Panel Admin
  </button>

)}
    <button
      onClick={() => {

        localStorage.removeItem(
          "usuarioCaja"
        );

        window.location.href =
          "/ingreso";

      }}
      style={{
        cursor:
          "pointer",
      }}
    >
      Cerrar Sesión
    </button>

  </div>

)}
    <main
      style={{
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1>Módulo de Caja</h1>

      <hr />

      <h2 className="text-2xl font-bold text-blue-950 mb-4">
  Buscar Ciudadano
</h2>

<div className="bg-white rounded-2xl shadow-md p-6">

  <input
    type="text"
    className="
      border
      border-slate-300
      rounded-2xl
      p-3
      w-80
    "
    placeholder="Cédula o Pasaporte"
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
  />

  <button
    onClick={buscarCiudadano}
    className="
      ml-3
      bg-blue-950
      text-white
      px-5
      py-3
      rounded-2xl
      hover:bg-blue-900
      cursor-pointer
    "
  >
    Buscar
  </button>
<button
  onClick={limpiarFormulario}
  className="
    ml-3
    bg-slate-600
    text-white
    px-5
    py-3
    rounded-2xl
    hover:bg-slate-700
    cursor-pointer
  "
>
  Limpiar
</button>
</div>

      <p>{mensaje}</p>

      {ciudadano && (
        <div
  className="
    mt-5
    bg-white
    rounded-2xl
    shadow-md
    p-6
  "
>
            
          <h3 className="text-xl font-bold text-blue-950 mb-4">
  Datos del Ciudadano
</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

  <div className="bg-slate-50 rounded-xl p-3">
    <div className="text-sm text-slate-500">
      Nombre
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano.nombreCompleto}
    </div>
  </div>

  <div className="bg-slate-50 rounded-xl p-3">

  <div className="text-sm text-slate-500">
    Cédula
  </div>

  <div className="font-semibold text-blue-950">
    {ciudadano.cedula}
  </div>

</div>

{ciudadano.pasaporte && (
  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Pasaporte
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano.pasaporte}
    </div>

  </div>
)}
<div className="bg-slate-50 rounded-xl p-3">

  <div className="text-sm text-slate-500">
    Documento principal para el Recibo
  </div>

  <div className="font-semibold text-blue-950">
    {ciudadano?.documento}
  </div>

</div>
  <div className="bg-slate-50 rounded-xl p-3">
    <div className="text-sm text-slate-500">
      Correo
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano.correo}
    </div>
  </div>

  <div className="bg-slate-50 rounded-xl p-3">
    <div className="text-sm text-slate-500">
      Teléfono
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano.telefono}
    </div>
  </div>

  <div className="bg-slate-50 rounded-xl p-3">
    <div className="text-sm text-slate-500">
      Nacionalidad
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano.nacionalidad}
    </div>
  </div>

</div>


          <hr />

<h3>
  Actuaciones Consulares
</h3>

<div
  ref={actuacionesRef}
  style={{
    position: "relative",
    width: "600px",
  }}
>

  <input
    type="text"
    placeholder="Seleccione actuación..."
    value={busquedaActuacion}
    onFocus={() =>
      setMostrarActuaciones(true)
    }
    onChange={(e) => {
      setMensajeRecibo("");
      setBusquedaActuacion(
        e.target.value
      );

      setMostrarActuaciones(true);
    }}
    style={{
      width: "100%",
      padding: "10px",
    }}
  />

  {mostrarActuaciones && (

    <div
  className="
    absolute
    w-full
    bg-white
    rounded-2xl
    shadow-xl
    border
    border-slate-200
    max-h-80
    overflow-y-auto
    z-50
    mt-2
  "
>

      {actuacionesFiltradas.map(
        (item) => (

          <div
  key={item.codigo}
  onClick={() =>
    agregarActuacion(item)
  }
  className="
    p-4
    cursor-pointer
    hover:bg-blue-50
    border-b
    border-slate-100
    transition
  "
>
            <div className="font-semibold text-blue-950">
  {item.actuacion}
</div>

<div className="text-sm text-slate-500">
  Código: {item.codigo}
</div>

<div className="font-bold text-green-700 mt-1">
  USD {item.monto}
</div>
          </div>

        )
      )}

    </div>

  )}

</div>

<br />

<h3>
  Actuaciones Seleccionadas
</h3>

{actuacionesSeleccionadas.length === 0 && (

  <div
  className="
    bg-slate-50
    rounded-2xl
    p-4
    text-slate-500
    text-center
  "
>
  No hay actuaciones seleccionadas
</div>

)}

{actuacionesSeleccionadas.map(
  (item) => (

    <div
      key={item.id}
      className="
        bg-slate-50
        rounded-2xl
        shadow-sm
        p-4
        mb-3
        flex
        justify-between
        items-center
        border-l-4
        border-blue-700
      "
    >

      <div>

        <div className="font-semibold text-blue-950">
          {item.actuacion}
        </div>

        <div className="text-slate-600 text-sm">
          Código: {item.codigo}
        </div>

      </div>

      <div className="flex items-center gap-3">

        <span className="font-bold text-green-700">
          USD {item.monto}
        </span>

        <button
          onClick={() =>
  eliminarActuacion(
    item.id
  )
}
          className="
            bg-red-600
            text-white
            px-3
            py-1
            rounded-xl
            hover:bg-red-700
            cursor-pointer
          "
        >
          ✕
        </button>

      </div>

    </div>

  )
)}

<hr />

<div
  className="
    bg-green-50
    border-l-4
    border-green-600
    rounded-2xl
    p-6
    mt-5
  "
>

  <p className="text-slate-600">
    Total a Cobrar
  </p>

  <h2 className="text-5xl font-bold text-green-700">

    USD {totalUSD.toFixed(2)}

  </h2>

</div>

{actuacionesSeleccionadas.length > 0 && (

  <div>


    <button
  onClick={() =>
  setMostrarConfirmacion(true)
}
  className="
    bg-green-700
    hover:bg-green-800
    text-white
    font-bold
    text-lg
    px-6
    py-4
    rounded-2xl
    cursor-pointer
  "
>
      Generar Recibo
    </button>

    {mensajeRecibo && (

      <p
        style={{
          marginTop: "15px",
          fontWeight: "bold",
        }}
      >
        {mensajeRecibo}
      </p>

    )}

  </div>

)}

        </div>
      )}
<hr
  style={{
    marginTop: "40px",
  }}
/>
{resumenCaja && (

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

    <div className="bg-blue-50 border-l-4 border-blue-700 rounded-2xl p-5">

      <p className="text-slate-600 text-sm">
        Recibos Hoy
      </p>

      <h2 className="text-3xl font-bold text-blue-950">
        {resumenCaja.recibosHoy}
      </h2>

    </div>

    <div className="bg-green-50 border-l-4 border-green-600 rounded-2xl p-5">

      <p className="text-slate-600 text-sm">
        USD Hoy
      </p>

      <h2 className="text-3xl font-bold text-green-700">
        ${resumenCaja.usdHoy}
      </h2>

    </div>

    <div className="bg-purple-50 border-l-4 border-purple-600 rounded-2xl p-5">

      <p className="text-slate-600 text-sm">
        Actuaciones Hoy
      </p>

      <h2 className="text-3xl font-bold text-purple-700">
        {resumenCaja.actuacionesHoy}
      </h2>

    </div>

  </div>

)}
<h2 className="text-2xl font-bold text-blue-950 mt-10 mb-4">
  Cierre Diario
</h2>
<div
  className="
    bg-white
    rounded-3xl
    shadow-md
    p-6
    border
    border-slate-200
  "
>

 <div className="grid grid-cols-3 gap-4">

  <div
    onClick={() =>
      setTipoCierre("todas")
    }
    className={`
      p-4
      rounded-2xl
      cursor-pointer
      border
      text-center
      min-h-[90px]
      flex
      flex-col
      justify-center
      ${
        tipoCierre === "todas"
          ? "bg-blue-50 border-blue-700"
          : "border-slate-200"
      }
    `}
  >
    <div className="font-semibold">
      Todas
    </div>

    <div className="text-sm text-slate-500">
      Pagas y gratuitas
    </div>
  </div>

  <div
    onClick={() =>
      setTipoCierre("pagas")
    }
    className={`
      p-4
      rounded-2xl
      cursor-pointer
      border
      text-center
      min-h-[90px]
      flex
      flex-col
      justify-center
      ${
        tipoCierre === "pagas"
          ? "bg-green-50 border-green-700"
          : "border-slate-200"
      }
    `}
  >
    <div className="font-semibold">
      Pagas
    </div>

    <div className="text-sm text-slate-500">
      Solo con monto
    </div>
  </div>

  <div
    onClick={() =>
      setTipoCierre("gratis")
    }
    className={`
      p-4
      rounded-2xl
      cursor-pointer
      border
      text-center
      min-h-[90px]
      flex
      flex-col
      justify-center
      ${
        tipoCierre === "gratis"
          ? "bg-purple-50 border-purple-700"
          : "border-slate-200"
      }
    `}
  >
    <div className="font-semibold">
      Gratuitas
    </div>

    <div className="text-sm text-slate-500">
      Sin pago
    </div>
  </div>

</div>

<div className="flex justify-center mt-6">

  <button
    onClick={
      generarCierreDiario
    }
    disabled={
      generandoCierre
    }
    className="
      bg-red-700
      hover:bg-red-800
      text-white
      font-bold
      px-8
      py-4
      rounded-2xl
      disabled:opacity-50
    "
  >
    {
      generandoCierre
        ? "Generando PDF..."
        : "Generar Cierre Diario PDF"
    }
  </button>

</div>
</div>

    </main>
  </>
  );
}