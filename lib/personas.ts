// ======================================================
// Utilidades de ciudadanos / personas
// ======================================================

import { CiudadanoSGC } from "@/types/GestionConsular";

/*------------------------------------------
 NOMBRE COMPLETO
------------------------------------------*/

export function obtenerNombreCompleto(

  ciudadano: Pick<
    CiudadanoSGC,
    | "primerNombre"
    | "segundoNombre"
    | "primerApellido"
    | "segundoApellido"
  >

): string {

  return [

    ciudadano.primerNombre,

    ciudadano.segundoNombre,

    ciudadano.primerApellido,

    ciudadano.segundoApellido,

  ]

    .map((valor) =>

      (valor || "").trim()

    )

    .filter(

      (valor) => valor.length > 0

    )

    .join(" ");

}

/*------------------------------------------
 DOCUMENTO A MOSTRAR
------------------------------------------*/

export function obtenerDocumentoMostrar(

  ciudadano: Pick<
    CiudadanoSGC,
    "documento" |
    "cedula" |
    "pasaporte"
  >

): string {

  if (

    ciudadano.documento?.trim()

  ) {

    return ciudadano.documento.trim();

  }

  if (

    ciudadano.cedula?.trim()

  ) {

    return ciudadano.cedula.trim();

  }

  if (

    ciudadano.pasaporte?.trim()

  ) {

    return ciudadano.pasaporte.trim();

  }

  return "";

}

/*------------------------------------------
 INICIALES
------------------------------------------*/

export function obtenerIniciales(

  ciudadano: Pick<
    CiudadanoSGC,
    | "primerNombre"
    | "primerApellido"
  >

): string {

  return [

    ciudadano.primerNombre?.[0],

    ciudadano.primerApellido?.[0],

  ]

    .filter(Boolean)

    .join("")

    .toUpperCase();

}