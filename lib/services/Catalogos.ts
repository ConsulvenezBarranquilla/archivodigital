// ======================================================
// Catálogos
// ======================================================

export interface CatalogosResponse {

  ok: boolean;

  nacionalidades: string[];

  paises: string[];

  estadosCivil: string[];

  generos: string[];

}

export async function obtenerCatalogos():

Promise<CatalogosResponse> {

  const response = await fetch(

    "/api/catalogos",

    {

      cache: "no-store",

    }

  );

  return response.json();

}