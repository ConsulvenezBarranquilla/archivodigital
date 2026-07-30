"use client";

import { useCallback, useEffect, useState } from "react";

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

  const [

    cargando,

    setCargando,

  ] = useState(true);

  const [

    tab,

    setTab,

  ] = useState("pendientes");

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

  const [

    pendientes,

    setPendientes,

  ] = useState<ActuacionPendiente[]>([]);

  const [

    vinculadas,

    setVinculadas,

  ] = useState<ActuacionVinculada[]>([]);

  const [

  ciudadano,

  setCiudadano,

] = useState<CiudadanoSGC | null>(null);

const [

  modalCiudadano,

  setModalCiudadano,

] = useState(false);

  function obtenerUsuarioActual(): string {

  if (typeof window === "undefined") {

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
      JSON.parse(datos);

    return (
      usuario.usuario || ""
    );

  }

  catch {

    return datos;

  }

}
  const cargarTodo = useCallback(

    async () => {

      try {

        setCargando(true);

        const [

          dashboard,

          pendientesResp,

          vinculadasResp,

        ] = await Promise.all([

          obtenerEstadisticasSGC(),

          obtenerPendientesSGC(),

          obtenerVinculadasSGC(),

        ]);

        if (dashboard.ok) {

          setEstadisticas(

            dashboard

          );

        }

        if (pendientesResp.ok) {

          setPendientes(

            pendientesResp.registros

          );

        }

        if (vinculadasResp.ok) {

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

        setCargando(false);

      }

    },

    []

  );

  useEffect(() => {

    cargarTodo();

  }, [

    cargarTodo,

  ]);
 

  async function guardarPlanilla(

  datos: VincularPlanillaForm

) {

  const request: VincularPlanillaRequest = {

    ...datos,

    usuario: obtenerUsuarioActual(),

  };

  const respuesta =

    await vincularPlanillaSGC(

      request

    );

  if (!respuesta.ok) {

    alert(

      respuesta.error ||

      respuesta.mensaje

    );

    return;

  }

  await cargarTodo();

}
async function registrarSinPlanilla(

  datos: SinPlanillaForm

) {

  const request: SinPlanillaRequest = {

    ...datos,

    usuario: obtenerUsuarioActual(),

  };

  const respuesta =

    await registrarSinPlanillaSGC(

      request

    );

  if (!respuesta.ok) {

    alert(

      respuesta.error ||

      respuesta.mensaje

    );

    return;

  }

  await cargarTodo();

}

  async function desvincular(

  datos: DesvincularPlanillaForm

) {

  const request: DesvincularPlanillaRequest = {

    ...datos,

    usuario: obtenerUsuarioActual(),

  };

  const respuesta =

    await desvincularPlanillaSGC(

      request

    );

  if (!respuesta.ok) {

    alert(

      respuesta.error ||

      respuesta.mensaje

    );

    return;

  }

  await cargarTodo();

}

  async function abrirCiudadano(

  documento: string

) {

  try {

    const respuesta =

      await obtenerDetalleCiudadanoSGC(

        documento

      );

    if (!respuesta.ok) {

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

    console.error(error);

    alert(

      "Error consultando el ciudadano."

    );

  }

}

  const tabs = [

    {

      id: "pendientes",

      label: `Pendientes (${estadisticas.pendientes})`,

    },

    {

      id: "vinculadas",

      label: `Vinculadas (${estadisticas.vinculadas})`,

    },

  ];

  return (

<SistemaLayout

    titulo="Vincular Planillas Gestión Consular"
    permiso={MODULOS.GESTION_CONSULAR}
    
>

      <Dashboard

        estadisticas={

          estadisticas

        }

      />

      <Tabs

    tabs={tabs}

    value={tab}

    onChange={setTab}

/>

      {

        tab ===

        "pendientes" && (

         <Pendientes
  registros={pendientes}
  cargando={cargando}
  onGuardar={guardarPlanilla}
  onRegistrarSinPlanilla={registrarSinPlanilla}
  onAbrirCiudadano={abrirCiudadano}
/>

        )

      }

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
<ModalDetalleCiudadano

  open={modalCiudadano}

  ciudadano={ciudadano}

  onActualizar={cargarTodo}

  onClose={() => {

    setModalCiudadano(false);

    setCiudadano(null);

  }}

/>
    </SistemaLayout>

  );

}