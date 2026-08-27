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
// Años disponibles
// ======================================================

export interface AniosSGCResponse {

  ok: boolean;

  anios: number[];

  error?: string;

}

export async function obtenerAniosSGC():

Promise<AniosSGCResponse> {

  return request<AniosSGCResponse>(

    "/anios"

  );

}

// ======================================================
// Dashboard
// ======================================================

export async function obtenerEstadisticasSGC(

  anio?: number | string

):

Promise<EstadisticasResponse> {

  const params =
    new URLSearchParams();

  if (

    anio !== undefined &&

    anio !== null &&

    String(anio).trim() !== ""

  ) {

    params.set(

      "anio",

      String(anio)

    );

  }

  const query =
    params.toString();

  return request<EstadisticasResponse>(

    query

      ? `/estadisticas?${query}`

      : "/estadisticas"

  );

}

// ======================================================
// Pendientes
// ======================================================

export async function obtenerPendientesSGC(

  anio?: number | string

):

Promise<PendientesResponse> {

  const params =
    new URLSearchParams();

  if (

    anio !== undefined &&

    anio !== null &&

    String(anio).trim() !== ""

  ) {

    params.set(

      "anio",

      String(anio)

    );

  }

  const query =
    params.toString();

  return request<PendientesResponse>(

    query

      ? `/pendientes?${query}`

      : "/pendientes"

  );

}

// ======================================================
// Vinculadas
// ======================================================

export async function obtenerVinculadasSGC(

  anio?: number | string

):

Promise<VinculadasResponse> {

  const params =
    new URLSearchParams();

  if (

    anio !== undefined &&

    anio !== null &&

    String(anio).trim() !== ""

  ) {

    params.set(

      "anio",

      String(anio)

    );

  }

  const query =
    params.toString();

  return request<VinculadasResponse>(

    query

      ? `/vinculadas?${query}`

      : "/vinculadas"

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

      body: JSON.stringify(

        datos

      ),

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

      body: JSON.stringify(

        datos

      ),

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

      body: JSON.stringify(

        datos

      ),

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

      body: JSON.stringify(

        datos

      ),

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