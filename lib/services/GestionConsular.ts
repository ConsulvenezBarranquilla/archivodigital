// ======================================================
// Servicios del módulo Gestión Consular
// ======================================================

import {

  ApiResponse,

  CiudadanoResponse,

  EstadisticasResponse,

  PendientesResponse,

  VinculadasResponse,

  VincularPlanillaRequest,

  SinPlanillaRequest,

  DesvincularPlanillaRequest,

  CiudadanoSGC,

} from "@/types/GestionConsular";

const BASE_URL = "/api/sgc";

// ======================================================
// Función genérica
// ======================================================

async function request<T>(

  endpoint: string,

  options?: RequestInit

): Promise<T> {

  const response = await fetch(

    `${BASE_URL}${endpoint}`,

    {

      headers: {

        "Content-Type": "application/json",

      },

      cache: "no-store",

      ...options,

    }

  );

  const json = await response.json();

  if (!response.ok) {

    throw new Error(

      json.error ||

      response.statusText

    );

  }

  return json;

}

// ======================================================
// Dashboard
// ======================================================

export async function obtenerEstadisticasSGC():

Promise<EstadisticasResponse> {

  return request<EstadisticasResponse>(

    "/estadisticas"

  );

}

// ======================================================
// Pendientes
// ======================================================

export async function obtenerPendientesSGC():

Promise<PendientesResponse> {

  return request<PendientesResponse>(

    "/pendientes"

  );

}

// ======================================================
// Vinculadas
// ======================================================

export async function obtenerVinculadasSGC():

Promise<VinculadasResponse> {

  return request<VinculadasResponse>(

    "/vinculadas"

  );

}

// ======================================================
// Vincular actuaciones
// ======================================================

export async function vincularPlanillaSGC(

  datos: VincularPlanillaRequest

): Promise<ApiResponse> {

  return request<ApiResponse>(

    "/vincular",

    {

      method: "POST",

      body: JSON.stringify(datos),

    }

  );

}

// ======================================================
// Registrar actuaciones SIN PLANILLA
// ======================================================

export async function registrarSinPlanillaSGC(

  datos: SinPlanillaRequest

): Promise<ApiResponse> {

  return request<ApiResponse>(

    "/sin-planilla",

    {

      method: "POST",

      body: JSON.stringify(datos),

    }

  );

}

// ======================================================
// Desvincular actuación
// ======================================================

export async function desvincularPlanillaSGC(

  datos: DesvincularPlanillaRequest

): Promise<ApiResponse> {

  return request<ApiResponse>(

    "/desvincular",

    {

      method: "POST",

      body: JSON.stringify(datos),

    }

  );

}
// ======================================================
// Actualizar ciudadano
// ======================================================

export async function actualizarCiudadanoSGC(

  datos: CiudadanoSGC

): Promise<ApiResponse> {

  return request<ApiResponse>(

    "/actualizar-ciudadano",

    {

      method: "POST",

      body: JSON.stringify(datos),

    }

  );

}
// ======================================================
// Buscar ciudadano
// ======================================================

export async function obtenerDetalleCiudadanoSGC(

  documento: string

): Promise<CiudadanoResponse> {

  return request<CiudadanoResponse>(

    `/detalle-ciudadano?documento=${encodeURIComponent(

      documento

    )}`

  );

}