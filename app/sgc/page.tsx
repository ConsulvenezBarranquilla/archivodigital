"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Dashboard from "@/components/sgc/Dashboard";
import Pendientes from "@/components/sgc/Pendientes";
import Vinculadas from "@/components/sgc/Vinculadas";

import ModalDetalleCiudadano from "@/components/sgc/ModalDetalleCiudadano";

import Tabs from "@/components/ui/Tabs";

import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";

import {
  obtenerEstadisticasSGC,
  obtenerPendientesSGC,
  obtenerVinculadasSGC,
  obtenerAniosSGC,
  vincularPlanillaSGC,
  registrarSinPlanillaSGC,
  desvincularPlanillaSGC,
  obtenerDetalleCiudadanoSGC,
} from "@/lib/services/GestionConsular";

import {
  ActuacionPendiente,
  ActuacionVinculada,
  EstadisticasSGC,
  VincularPlanillaForm,
  VincularPlanillaRequest,
  SinPlanillaForm,
  SinPlanillaRequest,
  DesvincularPlanillaForm,
  DesvincularPlanillaRequest,
  CiudadanoSGC,
} from "@/types/GestionConsular";

export default function SistemaGestionConsular() {

  // ======================================================
  // CARGANDO
  // ======================================================

  const [
    cargando,
    setCargando,
  ] = useState(true);

  // ======================================================
  // AÑO
  // ======================================================

  const anioActual =
    new Date().getFullYear();

  const [
    anio,
    setAnio,
  ] = useState<number>(
    anioActual
  );

  const [
    aniosDisponibles,
    setAniosDisponibles,
  ] = useState<number[]>([]);

  const [
    cargandoAnios,
    setCargandoAnios,
  ] = useState(true);

  // ======================================================
  // TAB
  // ======================================================

  const [
    tab,
    setTab,
  ] = useState(
    "pendientes"
  );

  // ======================================================
  // ESTADÍSTICAS
  // ======================================================

  const [
    estadisticas,
    setEstadisticas,
  ] = useState<EstadisticasSGC>({

    ok: true,

    totalActuaciones: 0,

    pendientes: 0,

    vinculadas: 0,

    planillas: 0,

    expedientes: 0,

    sinPlanilla: 0,

  });

  // ======================================================
  // PENDIENTES
  // ======================================================

  const [
    pendientes,
    setPendientes,
  ] = useState<
    ActuacionPendiente[]
  >([]);

  // ======================================================
  // VINCULADAS
  // ======================================================

  const [
    vinculadas,
    setVinculadas,
  ] = useState<
    ActuacionVinculada[]
  >([]);

  // ======================================================
  // CIUDADANO
  // ======================================================

  const [
    ciudadano,
    setCiudadano,
  ] = useState<
    CiudadanoSGC | null
  >(null);

  const [
    modalCiudadano,
    setModalCiudadano,
  ] = useState(false);

  // ======================================================
  // USUARIO ACTUAL
  // ======================================================

  function obtenerUsuarioActual(): string {

    if (
      typeof window ===
      "undefined"
    ) {

      return "";

    }

    const datos =
      localStorage.getItem(
        "usuarioCaja"
      );

    if (!datos) {

      return "";

    }

    try {

      const usuario =
        JSON.parse(
          datos
        );

      return (
        usuario.usuario ||
        ""
      );

    }

    catch {

      return datos;

    }

  }

  // ======================================================
  // CARGAR AÑOS
  // ======================================================

  useEffect(() => {

    async function cargarAnios() {

      try {

        setCargandoAnios(
          true
        );

        const respuesta =
          await obtenerAniosSGC();

        if (
          respuesta.ok &&
          respuesta.anios.length > 0
        ) {

          setAniosDisponibles(
            respuesta.anios
          );

          // ------------------------------------------
          // Si existe el año actual, utilizarlo.
          // De lo contrario utilizar el más reciente.
          // ------------------------------------------

          if (
            respuesta.anios.includes(
              anioActual
            )
          ) {

            setAnio(
              anioActual
            );

          }

          else {

            setAnio(
              respuesta.anios[0]
            );

          }

        }

      }

      catch (error) {

        console.error(

          "Error cargando años SGC:",

          error

        );

        // ------------------------------------------
        // Si falla la consulta, mantenemos
        // el año actual.
        // ------------------------------------------

        setAniosDisponibles([
          anioActual,
        ]);

        setAnio(
          anioActual
        );

      }

      finally {

        setCargandoAnios(
          false
        );

      }

    }

    cargarAnios();

  }, [
    anioActual,
  ]);

  // ======================================================
  // CARGAR TODO
  // ======================================================

  const cargarTodo =
    useCallback(

      async () => {

        try {

          setCargando(
            true
          );

          const [

            dashboard,

            pendientesResp,

            vinculadasResp,

          ] = await Promise.all([

            obtenerEstadisticasSGC(
              anio
            ),

            obtenerPendientesSGC(
              anio
            ),

            obtenerVinculadasSGC(
              anio
            ),

          ]);

          // --------------------------------------------
          // Dashboard
          // --------------------------------------------

          if (
            dashboard.ok
          ) {

            setEstadisticas(
              dashboard
            );

          }

          // --------------------------------------------
          // Pendientes
          // --------------------------------------------

          if (
            pendientesResp.ok
          ) {

            setPendientes(
              pendientesResp.registros
            );

          }

          // --------------------------------------------
          // Vinculadas
          // --------------------------------------------

          if (
            vinculadasResp.ok
          ) {

            setVinculadas(
              vinculadasResp.registros
            );

          }

        }

        catch (error) {

          console.error(

            "Error cargando SGC:",

            error

          );

        }

        finally {

          setCargando(
            false
          );

        }

      },

      [
        anio,
      ]

    );

  // ======================================================
  // RECARGAR AL CAMBIAR AÑO
  // ======================================================

  useEffect(() => {

    if (
      cargandoAnios
    ) {

      return;

    }

    cargarTodo();

  }, [

    cargarTodo,

    cargandoAnios,

  ]);

  // ======================================================
  // GUARDAR PLANILLA
  // ======================================================

  async function guardarPlanilla(

    datos: VincularPlanillaForm

  ) {

    const request:
      VincularPlanillaRequest = {

      ...datos,

      usuario:
        obtenerUsuarioActual(),

    };

    const respuesta =
      await vincularPlanillaSGC(
        request
      );

    if (
      !respuesta.ok
    ) {

      alert(

        respuesta.error ||

        respuesta.mensaje

      );

      return;

    }

    await cargarTodo();

  }

  // ======================================================
  // SIN PLANILLA
  // ======================================================

  async function registrarSinPlanilla(

    datos: SinPlanillaForm

  ) {

    const request:
      SinPlanillaRequest = {

      ...datos,

      usuario:
        obtenerUsuarioActual(),

    };

    const respuesta =
      await registrarSinPlanillaSGC(
        request
      );

    if (
      !respuesta.ok
    ) {

      alert(

        respuesta.error ||

        respuesta.mensaje

      );

      return;

    }

    await cargarTodo();

  }

  // ======================================================
  // DESVINCULAR
  // ======================================================

  async function desvincular(

    datos: DesvincularPlanillaForm

  ) {

    const request:
      DesvincularPlanillaRequest = {

      ...datos,

      usuario:
        obtenerUsuarioActual(),

    };

    const respuesta =
      await desvincularPlanillaSGC(
        request
      );

    if (
      !respuesta.ok
    ) {

      alert(

        respuesta.error ||

        respuesta.mensaje

      );

      return;

    }

    await cargarTodo();

  }

  // ======================================================
  // ABRIR CIUDADANO
  // ======================================================

  async function abrirCiudadano(

    documento: string

  ) {

    try {

      const respuesta =
        await obtenerDetalleCiudadanoSGC(
          documento
        );

      if (
        !respuesta.ok
      ) {

        alert(

          respuesta.error ||

          "No fue posible obtener la información del ciudadano."

        );

        return;

      }

      setCiudadano(
        respuesta
      );

      setModalCiudadano(
        true
      );

    }

    catch (error) {

      console.error(
        error
      );

      alert(
        "Error consultando el ciudadano."
      );

    }

  }

  // ======================================================
  // TABS
  // ======================================================

  const tabs = [

    {

      id:
        "pendientes",

      label:
        `Pendientes (${estadisticas.pendientes})`,

    },

    {

      id:
        "vinculadas",

      label:
        `Vinculadas (${estadisticas.vinculadas})`,

    },

  ];

  // ======================================================
  // RENDER
  // ======================================================

  return (

    <SistemaLayout

      titulo=
        "Vincular Planillas Gestión Consular"

      permiso=
        {MODULOS.GESTION_CONSULAR}

    >

      {/* ==================================================
          SELECTOR DE AÑO
      ================================================== */}

      <div
        className="
          flex
          items-end
          justify-between
          mb-5
        "
      >

        <div>

          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              mb-1
            "
          >

            Año

          </label>

          <select

            value={
              anio
            }

            onChange={
              e =>
                setAnio(
                  Number(
                    e.target.value
                  )
                )
            }

            disabled={
              cargandoAnios
            }

            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2
              text-sm
              font-medium
              text-slate-700
              shadow-sm
              focus:border-blue-600
              focus:outline-none
              focus:ring-1
              focus:ring-blue-600
            "
          >

            {
              aniosDisponibles.map(
                año => (

                  <option
                    key={año}
                    value={año}
                  >

                    {año}

                  </option>

                )
              )
            }

          </select>

        </div>

      </div>

      {/* ==================================================
          DASHBOARD
      ================================================== */}

      <Dashboard

        estadisticas={
          estadisticas
        }

      />

      {/* ==================================================
          TABS
      ================================================== */}

      <Tabs

        tabs={
          tabs
        }

        value={
          tab
        }

        onChange={
          setTab
        }

      />

      {/* ==================================================
          PENDIENTES
      ================================================== */}

      {
        tab ===
        "pendientes" && (

          <Pendientes

            registros={
              pendientes
            }

            cargando={
              cargando
            }

            onGuardar={
              guardarPlanilla
            }

            onRegistrarSinPlanilla={
              registrarSinPlanilla
            }

            onAbrirCiudadano={
              abrirCiudadano
            }

          />

        )
      }

      {/* ==================================================
          VINCULADAS
      ================================================== */}

      {
        tab ===
        "vinculadas" && (

          <Vinculadas

            registros={
              vinculadas
            }

            cargando={
              cargando
            }

            onAbrirCiudadano={
              abrirCiudadano
            }

            onDesvincular={
              desvincular
            }

          />

        )
      }

      {/* ==================================================
          MODAL CIUDADANO
      ================================================== */}

      <ModalDetalleCiudadano

        open={
          modalCiudadano
        }

        ciudadano={
          ciudadano
        }

        onActualizar={
          cargarTodo
        }

        onClose={() => {

          setModalCiudadano(
            false
          );

          setCiudadano(
            null
          );

        }}

      />

    </SistemaLayout>

  );

}