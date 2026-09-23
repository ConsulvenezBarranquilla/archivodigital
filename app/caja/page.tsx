"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";
import PopupTitulares from "@/components/caja/PopupTitulares";
import { obtenerCatalogos } from "@/lib/services/Catalogos";

export default function CajaPage() {
  const [usuario, setUsuario] = useState<any>(null);

  const [documento, setDocumento] = useState("");

  const [ciudadano, setCiudadano] =
    useState<any>(null);

    const [
    campoEditando,
    setCampoEditando,
  ] = useState<string | null>(null);

  const [
    valorEdicion,
    setValorEdicion,
  ] = useState("");

  const [
    guardandoEdicion,
    setGuardandoEdicion,
  ] = useState(false);

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

const [
  mostrarOpcionesCierre,
  setMostrarOpcionesCierre,
] = useState(false);

  const [actuaciones, setActuaciones] =
    useState<any[]>([]);

  const [
  busquedaActuacion,
  setBusquedaActuacion,
] = useState("");

const [nacionalidades, setNacionalidades] = useState<string[]>([]);

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

const [
  mostrarOpcionesRecibo,
  setMostrarOpcionesRecibo,
] = useState(false);

const [
  datosReciboGenerado,
  setDatosReciboGenerado,
] = useState<any>(null);

const [
  generandoFormatoRecibo,
  setGenerandoFormatoRecibo,
] = useState(false);

const [
  mostrarPopupTitulares,
  setMostrarPopupTitulares,
] = useState(false);

const [
  titularesEspeciales,
  setTitularesEspeciales,
] = useState<
  {
    tipo: "PASAPORTE" | "APOSTILLA" | "VISA";
    titular: string;
    pasaporte?: string;
    mismaPersona?: boolean;
  }[]
>([]);

const [mostrarCambioCaja, setMostrarCambioCaja] =
    useState(false);

const [cajaDestino, setCajaDestino] =
    useState<number | null>(null);

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

const tienePasaporteNNA =
  actuacionesSeleccionadas.some(
    a => a.codigo === "P-NNA"
  );

const tieneApostillaNNA =
  actuacionesSeleccionadas.some(
    a => a.codigo === "A-NNA"
  );

const tieneVisa =
  actuacionesSeleccionadas.some(
    (a) =>
      a.actuacion
        ?.toUpperCase()
        .includes("VISA")
  );

const cantidadPasaportesAdulto =
  actuacionesSeleccionadas.filter(
    a => a.codigo === "P"
  ).length;

const cantidadPasaportesNNA =
  actuacionesSeleccionadas.filter(
    a => a.codigo === "P-NNA"
  ).length;

const cantidadApostillas =
  actuacionesSeleccionadas.filter(
    a => a.codigo === "A-NNA"
  ).length;

const cantidadVisas =
  actuacionesSeleccionadas.filter(
    a =>
      a.actuacion
        ?.toUpperCase()
        .includes("VISA")
  ).length;

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

    const data = localStorage.getItem("usuarioCaja");

    if (data) {
        const usuarioLocal = JSON.parse(data);
        setUsuario(usuarioLocal);

        fetch(`/api/resumen-caja?caja=${usuarioLocal.caja}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok) setResumenCaja(data);
            });
    }

    fetch("/api/actuaciones")
        .then(res => res.json())
        .then(data => {
            if (data.ok)
                setActuaciones(data.actuaciones);
        });

}, []);

// ======================================================
// Cargar nacionalidades desde Catálogos
// ======================================================

useEffect(() => {

  async function cargarNacionalidades() {

    try {

      const respuesta = await obtenerCatalogos();

      if (respuesta.ok) {

        setNacionalidades(
          respuesta.nacionalidades
        );

      }

    } catch (error) {

      console.error(
        "Error cargando nacionalidades:",
        error
      );

    }

  }

  cargarNacionalidades();

}, []);


  async function buscarCiudadano() {

setMensaje("");
 setMensajeRecibo("");

  setActuacionesSeleccionadas([]);

  setBusquedaActuacion("");

  setMostrarActuaciones(false);
setTitularesEspeciales([]);
    if (!documento.trim()) {
      setMensaje(
        "Ingrese un documento"
      );
      return;
    }

    setMensaje("Buscando...");

    const response = await fetch(
      `/api/detalle-ciudadano-caja?documento=${documento}`
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

  async function guardarEdicionCiudadano() {

    if (
      !ciudadano ||
      !campoEditando
    ) {
      return;
    }

    try {

      setGuardandoEdicion(true);

      const response =
        await fetch(
          "/api/caja/editar-ciudadano-caja",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                documentoOriginal:
                  ciudadano.documentoOriginal,

                campo:
                  campoEditando,

                valor:
                  valorEdicion,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.ok
      ) {

        throw new Error(
          data.error ||
          "No se pudo actualizar el ciudadano."
        );

      }


      /*
      Actualizar inmediatamente
      los datos mostrados en Caja.
      */

      setCiudadano(
        {
          ...ciudadano,

          documento:
            data.documento,

          cedula:
            data.cedula,

          pasaporte:
            data.pasaporte,

          primerNombre:
            data.primerNombre,

          segundoNombre:
            data.segundoNombre,

          primerApellido:
            data.primerApellido,

          segundoApellido:
            data.segundoApellido,

          nombreCompleto:
            data.nombreCompleto,

          nacionalidad:
            data.nacionalidad,

          correo:
            data.correo,

          telefono:
            data.telefono,

          /*
          El documento utilizado para
          futuras ediciones pasa a ser
          el documento principal actual.
          */

          documentoOriginal:
            data.documento,
        }
      );


      /*
      Si cambió el documento principal,
      actualizar también el buscador.
      */

      if (
        data.documento
      ) {

        setDocumento(
          data.documento
        );

      }


      setCampoEditando(
        null
      );

      setValorEdicion(
        ""
      );

      setMensaje(
        ""
      );

    }
    catch (
      error: any
    ) {

      setMensaje(
        error?.message ||
        "No se pudo actualizar el ciudadano."
      );

    }
    finally {

      setGuardandoEdicion(
        false
      );

    }

  }


  function iniciarEdicionCiudadano(
    campo: string,
    valor: any
  ) {

    setCampoEditando(
      campo
    );

    setValorEdicion(
      String(
        valor ?? ""
      )
    );

    setMensaje(
      ""
    );

  }


  function cancelarEdicionCiudadano() {

    setCampoEditando(
      null
    );

    setValorEdicion(
      ""
    );

  }

function cambiarCaja(nuevaCaja: number) {

    const nuevoUsuario = {
    ...usuario,
    caja: `Caja ${nuevaCaja}`,
};

    setUsuario(nuevoUsuario);

    localStorage.setItem(
        "usuarioCaja",
        JSON.stringify(nuevoUsuario)
    );

    fetch(`/api/resumen-caja?caja=Caja ${nuevaCaja}`)
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            setResumenCaja(data);
        }
    });
}
  function solicitarCambioCaja(nuevaCaja: number) {

    if (nuevaCaja === usuario.caja) return;

    const hayFormularioAbierto =
    ciudadano !== null ||
    actuacionesSeleccionadas.length > 0 ||
    documento.trim().length > 0;

    if (hayFormularioAbierto) {

        setCajaDestino(nuevaCaja);
        setMostrarCambioCaja(true);
        return;
    }

    cambiarCaja(nuevaCaja);
}
function confirmarCambioCaja() {

    if (cajaDestino == null) return;

    limpiarFormulario();

    cambiarCaja(cajaDestino);

    setCajaDestino(null);

    setMostrarCambioCaja(false);
}
function cancelarCambioCaja() {

    setCajaDestino(null);

    setMostrarCambioCaja(false);
}
  function limpiarFormulario() {

  setDocumento("");

  setCiudadano(null);

  setMensaje("");

  setMensajeRecibo("");

  setBusquedaActuacion("");

  setActuacionesSeleccionadas([]);

  setMostrarActuaciones(false);

  setTitularesEspeciales([]);

}
function agregarActuacion(item: any) {

  setMensajeRecibo("");

  // ======================================================
  // MÁXIMO 5 ACTUACIONES POR RECIBO
  // ======================================================

  if (
    actuacionesSeleccionadas.length >= 5
  ) {

    setMensajeRecibo(
      "Un recibo puede contener un máximo de 5 actuaciones. Para registrar más actuaciones debe generar otro recibo."
    );

    setMostrarActuaciones(false);

    return;
  }

  // ======================================================
  // AGREGAR ACTUACIÓN
  // ======================================================

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
    setMensajeRecibo("Generando recibo...");

    const response = await fetch(
      "/api/generar-recibo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ciudadano,
          actuaciones: actuacionesSeleccionadas,
          totalUSD,
          usuario,
          titularesEspeciales,
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      setMensajeRecibo(
        data.mensaje ||
          data.error ||
          "No fue posible generar el recibo."
      );

      return;
    }

    // ======================================================
    // EL RECIBO YA FUE REGISTRADO
    // ======================================================

    setDatosReciboGenerado(data);

    setMensajeRecibo(
      `Recibo registrado correctamente. Correlativo: ${data.correlativo}`
    );

    // ======================================================
    // PREGUNTAR FORMATO DE IMPRESIÓN
    // ======================================================

    setMostrarOpcionesRecibo(true);

  } catch (error) {

    console.error(
      "ERROR GENERANDO RECIBO:",
      error
    );

    setMensajeRecibo(
      "Error generando recibo."
    );
  }
}

// ======================================================
// GENERAR PDF SEGÚN FORMATO SELECCIONADO
// ======================================================

async function generarPdfFormatoRecibo(
  tipo: "tradicional" | "termico"
) {

  if (!datosReciboGenerado) {
    return;
  }

  try {

    setGenerandoFormatoRecibo(true);

    setMostrarOpcionesRecibo(false);

    const endpoint =
      tipo === "tradicional"
        ? "/api/pdf-recibo"
        : "/api/pdf-recibo-termico";

    const pdfResponse =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            datosReciboGenerado
          ),
        }
      );

    if (!pdfResponse.ok) {

      let mensajeError =
        "Ocurrió un error generando el PDF.";

      try {

        const error =
          await pdfResponse.json();

        mensajeError =
          error.error ||
          mensajeError;

      } catch {}

      setMensajeRecibo(
        `El recibo fue registrado, pero ${mensajeError}`
      );

      return;
    }

    // ====================================================
    // DESCARGAR PDF
    // ====================================================

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
      tipo === "tradicional"
        ? `RECIBO_${datosReciboGenerado.correlativo.replace(
            "/",
            "-"
          )}.pdf`
        : `RECIBO_TERMICO_${datosReciboGenerado.correlativo.replace(
            "/",
            "-"
          )}.pdf`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();

    window.URL.revokeObjectURL(
      url
    );

    // ====================================================
    // LIMPIAR FORMULARIO
    // ====================================================

    setCiudadano(null);

    setDocumento("");

    setBusquedaActuacion("");

    setActuacionesSeleccionadas([]);

    setMostrarActuaciones(false);

    setTitularesEspeciales([]);

    setDatosReciboGenerado(null);

    setMensaje("");

    // ====================================================
    // MENSAJE SOBRE EL CORREO
    // ====================================================

    if (
      datosReciboGenerado.correoEnviado === true
    ) {

      setMensajeRecibo(
        `✅ Recibo generado correctamente. Correlativo: ${datosReciboGenerado.correlativo}. El Original Usuario fue enviado al correo del ciudadano.`
      );

    } else if (
      datosReciboGenerado.correoNoAplica === true
    ) {

      setMensajeRecibo(
        `✅ Recibo generado correctamente. Correlativo: ${datosReciboGenerado.correlativo}.`
      );

    } else {

      setMensajeRecibo(
        `⚠️ Recibo generado correctamente. Correlativo: ${datosReciboGenerado.correlativo}. NO se pudo enviar el Original Usuario al correo del ciudadano. ${
          datosReciboGenerado.errorCorreo ||
          "Verifique el correo registrado."
        }`
      );

    }

    // ====================================================
    // ACTUALIZAR RESUMEN DE CAJA
    // ====================================================

    fetch(
      `/api/resumen-caja?caja=${usuario.caja}`
    )
      .then((res) => res.json())
      .then((dataResumen) => {

        if (dataResumen.ok) {

          setResumenCaja(
            dataResumen
          );

        }

      });

  } catch (error) {

    console.error(
      "ERROR GENERANDO PDF:",
      error
    );

    setMensajeRecibo(
      "El recibo fue registrado, pero ocurrió un error generando el PDF."
    );

  } finally {

    setGenerandoFormatoRecibo(
      false
    );

  }
}

async function confirmarGeneracion() {

  setMostrarConfirmacion(
    false
  );

  await generarRecibo();

}
function seleccionarTipoImpresionCierre() {

  setMostrarOpcionesCierre(true);

}

async function generarCompiladoRecibos() {

  try {

    setMostrarOpcionesCierre(false);

    setGenerandoCierre(true);

    const response =
      await fetch(
        "/api/caja/compilar-recibos-caja",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
  caja: usuario.caja,
  usuario: usuario.nombre,
  rol: usuario.rol,
}),
        }
      );

    if (!response.ok) {

      let mensaje =
        "Error generando compilado de recibos.";

      try {

        const error =
          await response.json();

        mensaje =
          error.error ||
          mensaje;

      } catch {}

      alert(mensaje);

      return;

    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      `COMPILADO_RECIBOS_${usuario.caja}_${new Date()
        .toISOString()
        .substring(0, 10)}.pdf`;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();

    window.URL.revokeObjectURL(
      url
    );

  } catch (error) {

    console.error(
      "Error generando compilado:",
      error
    );

    alert(
      "Error generando compilado de recibos."
    );

  } finally {

    setGenerandoCierre(
      false
    );

  }

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
  rol:
    usuario.rol,
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
    {mostrarCambioCaja && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">

        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">
                Cambiar Caja
            </h2>

            <p className="text-slate-600 mb-6">
                Va a cambiar a la <strong>CAJA #{cajaDestino}</strong>.
                <br /><br />
                El ciudadano cargado y las actuaciones seleccionadas se eliminarán.
            </p>

            <div className="flex justify-end gap-3">

                <button
                    onClick={cancelarCambioCaja}
                    className="px-5 py-2 rounded-lg border"
                >
                    Cancelar
                </button>

                <button
                    onClick={confirmarCambioCaja}
                    className="px-5 py-2 rounded-lg bg-amber-600 text-white"
                >
                    Cambiar
                </button>

            </div>

        </div>

    </div>
)}
<PopupTitulares
    abierto={mostrarPopupTitulares}

    ciudadano={ciudadano}

    cantidadPasaportesAdulto={cantidadPasaportesAdulto}

    cantidadPasaportesNNA={cantidadPasaportesNNA}

    cantidadApostillas={cantidadApostillas}

    cantidadVisas={cantidadVisas}

    datosIniciales={titularesEspeciales}

    onCancelar={() =>
        setMostrarPopupTitulares(false)
    }

    onAceptar={(datos) => {

        setTitularesEspeciales(datos);

        setMostrarPopupTitulares(false);

        setMostrarConfirmacion(true);

    }}
/>
{mostrarOpcionesCierre && (

  <div
    className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      z-[200]
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
          text-center
          mb-3
        "
      >
        Seleccionar PDF
      </h2>

      <p
        className="
          text-center
          text-slate-600
          mb-6
        "
      >
        ¿Qué documento desea generar?
      </p>

      <div className="flex flex-col gap-3">

        <button
          type="button"
          onClick={() => {

            setMostrarOpcionesCierre(false);

            generarCierreDiario();

          }}
          className="
            w-full
            bg-red-700
            hover:bg-red-800
            text-white
            font-bold
            px-5
            py-4
            rounded-2xl
          "
        >
          Cierre Diario PDF
        </button>

        <button
          type="button"
          onClick={
            generarCompiladoRecibos
          }
          className="
            w-full
            bg-blue-700
            hover:bg-blue-800
            text-white
            font-bold
            px-5
            py-4
            rounded-2xl
          "
        >
          Compilado de Recibos
        </button>

        <button
          type="button"
          onClick={() =>
            setMostrarOpcionesCierre(false)
          }
          className="
            w-full
            bg-slate-200
            hover:bg-slate-300
            text-slate-700
            font-semibold
            px-5
            py-3
            rounded-2xl
          "
        >
          Cancelar
        </button>

      </div>

    </div>

  </div>

)}
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
 {mostrarOpcionesRecibo && (

  <div
    className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      z-[100]
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
          text-center
          mb-3
        "
      >
        Seleccionar Recibo
      </h2>

      <p
        className="
          text-center
          text-slate-600
          mb-6
        "
      >
        Seleccione el formato en el que desea generar el recibo.
      </p>

      <div className="flex flex-col gap-4">

        {/* ==================================================
            RECIBO TRADICIONAL
        ================================================== */}

        <button
          type="button"
          disabled={generandoFormatoRecibo}
          onClick={() =>
            generarPdfFormatoRecibo(
              "tradicional"
            )
          }
          className="
            w-full
            bg-blue-700
            hover:bg-blue-800
            disabled:opacity-50
            text-white
            font-bold
            px-5
            py-5
            rounded-2xl
            transition
          "
        >

          <div className="text-xl">
            🧾 Recibo tradicional
          </div>

          <div
            className="
              text-sm
              font-normal
              mt-1
              opacity-90
            "
          >
            3 copias
          </div>

        </button>


        {/* ==================================================
            RECIBO TÉRMICO
        ================================================== */}

        <button
          type="button"
          disabled={generandoFormatoRecibo}
          onClick={() =>
            generarPdfFormatoRecibo(
              "termico"
            )
          }
          className="
            w-full
            bg-slate-900
            hover:bg-black
            disabled:opacity-50
            text-white
            font-bold
            px-5
            py-5
            rounded-2xl
            transition
          "
        >

          <div className="text-xl">
            🖨️ Recibo individual
          </div>

          <div
            className="
              text-sm
              font-normal
              mt-1
              opacity-90
            "
          >
            Impresora térmica · 80 × 60 mm
          </div>

        </button>

      </div>

    </div>

  </div>

)}
    <SistemaLayout
    titulo="Caja"
    permiso={MODULOS.CAJA}
>

<div className="space-y-8">

      {usuario && (
  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl shadow-sm p-5 flex items-center justify-between">

    <div>
      <p className="text-sm text-slate-500">
        Caja asignada
      </p>

      <h2 className="text-3xl font-bold text-amber-700">
        {usuario.caja}
      </h2>

      <p className="text-sm text-slate-600 mt-1">
        Operador: <strong>{usuario.nombre}</strong>
      </p>
      {usuario?.rol === "admin" && (

    <div className="flex justify-center gap-4 mt-6">

        <button
            onClick={() => solicitarCambioCaja(1)}
            disabled={usuario.caja === "Caja 1"}
            className={`px-6 py-3 rounded-2xl font-bold transition
                ${
                    usuario.caja === 1
                        ? "bg-blue-700 text-white opacity-60 cursor-not-allowed"
                        : "bg-slate-200 hover:bg-blue-100"
                }`}
        >
            🟦 Caja 1
        </button>

        <button
            onClick={() => solicitarCambioCaja(2)}
            disabled={usuario.caja === "Caja 2"}
            className={`px-6 py-3 rounded-2xl font-bold transition
                ${
                    usuario.caja === "Caja 2"
                        ? "bg-green-700 text-white opacity-60 cursor-not-allowed"
                        : "bg-slate-200 hover:bg-green-100"
                }`}
        >
            🟩 Caja 2
        </button>

    </div>

)}
    </div>

    <div className="text-5xl">
      💰
    </div>

  </div>
)}
{usuario && (
  <div
    className={`
      fixed
      bottom-6
      right-6
      z-50
      px-6
      py-4
      rounded-2xl
      shadow-2xl
      text-white
      font-extrabold
      text-xl
      select-none
      transition-all
      ${
        usuario.caja === "Caja 1"
          ? "bg-blue-700"
          : "bg-green-700"
      }
    `}
  >
    {usuario.caja}
  </div>
)}

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
    {ciudadano.nombreCompleto || "-"}
  </div>

</div>
  {/* ==========================================
      CÉDULA
  =========================================== */}

  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Cédula
    </div>

    {campoEditando === "cedula" ? (

      <div className="flex gap-2 mt-1">

        <input
          type="text"
          value={valorEdicion}
          onChange={(e) =>
            setValorEdicion(
              e.target.value
            )
          }
          className="
            flex-1
            border
            rounded-lg
            px-3
            py-2
            font-semibold
            text-blue-950
          "
          autoFocus
        />

        <button
          type="button"
          onClick={
            guardarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-green-600
            text-white
            font-bold
          "
        >
          ✓
        </button>

        <button
          type="button"
          onClick={
            cancelarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-red-500
            text-white
            font-bold
          "
        >
          ✕
        </button>

      </div>

    ) : (

      <div className="flex items-center gap-2">

        <div className="font-semibold text-blue-950">
          {ciudadano.cedula || "-"}
        </div>

        <button
          type="button"
          onClick={() =>
            iniciarEdicionCiudadano(
              "cedula",
              ciudadano.cedula
            )
          }
          className="
            text-blue-600
            hover:text-blue-800
            text-sm
          "
          title="Editar cédula"
        >
          ✏️
        </button>

      </div>

    )}

  </div>


  {/* ==========================================
      PASAPORTE
  =========================================== */}

  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Pasaporte
    </div>

    {campoEditando === "pasaporte" ? (

      <div className="flex gap-2 mt-1">

        <input
          type="text"
          value={valorEdicion}
          onChange={(e) =>
            setValorEdicion(
              e.target.value
            )
          }
          className="
            flex-1
            border
            rounded-lg
            px-3
            py-2
            font-semibold
            text-blue-950
          "
          autoFocus
        />

        <button
          type="button"
          onClick={
            guardarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-green-600
            text-white
            font-bold
          "
        >
          ✓
        </button>

        <button
          type="button"
          onClick={
            cancelarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-red-500
            text-white
            font-bold
          "
        >
          ✕
        </button>

      </div>

    ) : (

      <div className="flex items-center gap-2">

        <div className="font-semibold text-blue-950">
          {ciudadano.pasaporte || "-"}
        </div>

        <button
          type="button"
          onClick={() =>
            iniciarEdicionCiudadano(
              "pasaporte",
              ciudadano.pasaporte
            )
          }
          className="
            text-blue-600
            hover:text-blue-800
            text-sm
          "
          title="Editar pasaporte"
        >
          ✏️
        </button>

      </div>

    )}

  </div>

 
  {/* ==========================================
      DOCUMENTO PRINCIPAL
      NO EDITABLE
  =========================================== */}

  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Documento principal para el Recibo
    </div>

    <div className="font-semibold text-blue-950">
      {ciudadano?.documento || "-"}
    </div>

  </div>


  {/* ==========================================
      CORREO
  =========================================== */}

  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Correo
    </div>

    {campoEditando === "correo" ? (

      <div className="flex gap-2 mt-1">

        <input
          type="email"
          value={valorEdicion}
          onChange={(e) =>
            setValorEdicion(
              e.target.value
            )
          }
          className="
            flex-1
            border
            rounded-lg
            px-3
            py-2
            font-semibold
            text-blue-950
          "
          autoFocus
        />

        <button
          type="button"
          onClick={
            guardarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-green-600
            text-white
            font-bold
          "
        >
          ✓
        </button>

        <button
          type="button"
          onClick={
            cancelarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-red-500
            text-white
            font-bold
          "
        >
          ✕
        </button>

      </div>

    ) : (

      <div className="flex items-center gap-2">

        <div className="font-semibold text-blue-950">
          {ciudadano.correo || "-"}
        </div>

        <button
          type="button"
          onClick={() =>
            iniciarEdicionCiudadano(
              "correo",
              ciudadano.correo
            )
          }
          className="
            text-blue-600
            hover:text-blue-800
            text-sm
          "
          title="Editar correo"
        >
          ✏️
        </button>

      </div>

    )}

  </div>


  {/* ==========================================
      TELÉFONO
  =========================================== */}

  <div className="bg-slate-50 rounded-xl p-3">

    <div className="text-sm text-slate-500">
      Teléfono
    </div>

    {campoEditando === "telefono" ? (

      <div className="flex gap-2 mt-1">

        <input
          type="text"
          value={valorEdicion}
          onChange={(e) =>
            setValorEdicion(
              e.target.value
            )
          }
          className="
            flex-1
            border
            rounded-lg
            px-3
            py-2
            font-semibold
            text-blue-950
          "
          autoFocus
        />

        <button
          type="button"
          onClick={
            guardarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-green-600
            text-white
            font-bold
          "
        >
          ✓
        </button>

        <button
          type="button"
          onClick={
            cancelarEdicionCiudadano
          }
          disabled={
            guardandoEdicion
          }
          className="
            px-3
            rounded-lg
            bg-red-500
            text-white
            font-bold
          "
        >
          ✕
        </button>

      </div>

    ) : (

      <div className="flex items-center gap-2">

        <div className="font-semibold text-blue-950">
          {ciudadano.telefono || "-"}
        </div>

        <button
          type="button"
          onClick={() =>
            iniciarEdicionCiudadano(
              "telefono",
              ciudadano.telefono
            )
          }
          className="
            text-blue-600
            hover:text-blue-800
            text-sm
          "
          title="Editar teléfono"
        >
          ✏️
        </button>

      </div>

    )}

  </div>


  {/* NACIONALIDAD */}
<div className="bg-slate-50 rounded-xl p-3">
  <div className="text-sm text-slate-500">Nacionalidad</div>

  {campoEditando === "nacionalidad" ? (
    <div className="flex gap-2 mt-1">
      <select
        value={valorEdicion}
        onChange={(e) => setValorEdicion(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-2 font-semibold text-blue-950 bg-white"
        autoFocus
      >
        <option value="">Seleccione una nacionalidad</option>

        {nacionalidades.map((nacionalidad) => (
          <option key={nacionalidad} value={nacionalidad}>
            {nacionalidad}
          </option>
        ))}
      </select>

      <button
        onClick={guardarEdicionCiudadano}
        disabled={guardandoEdicion}
        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        title="Guardar"
      >
        ✓
      </button>

      <button
        onClick={cancelarEdicionCiudadano}
        disabled={guardandoEdicion}
        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        title="Cancelar"
      >
        ✕
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <div className="font-semibold text-blue-950">
        {ciudadano.nacionalidad || "-"}
      </div>

      <button
        onClick={() =>
          iniciarEdicionCiudadano(
            "nacionalidad",
            ciudadano.nacionalidad
          )
        }
        className="text-blue-600 hover:text-blue-800"
        title="Editar nacionalidad"
      >
        ✏️
      </button>
    </div>
  )}
</div>   {/* cierre Nacionalidad */}

</div>   {/* cierre grid de Datos del Ciudadano */}
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
  placeholder={
    actuacionesSeleccionadas.length >= 5
      ? "Máximo de 5 actuaciones alcanzado"
      : "Seleccione actuación..."
  }
  value={busquedaActuacion}
  disabled={
    actuacionesSeleccionadas.length >= 5
  }
  onFocus={() => {
    if (
      actuacionesSeleccionadas.length < 5
    ) {
      setMostrarActuaciones(true);
    }
  }}
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
  onClick={() => {

    if (

    cantidadPasaportesAdulto > 0 ||

    tienePasaporteNNA ||

    tieneApostillaNNA ||

    tieneVisa

) {

    setMostrarPopupTitulares(true);

    return;

}

    setMostrarConfirmacion(true);

}}
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
      seleccionarTipoImpresionCierre
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
</div>

</SistemaLayout>
  </>
  );
}