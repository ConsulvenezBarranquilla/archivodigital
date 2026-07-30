// lib/rutas.ts

export function obtenerPaginaInicio(rol: string): string {

  switch (rol) {

    case "admin":
      return "/admin";

    case "caja":
      return "/caja";

    case "recepcion":
      return "/recepcion";

    case "consultas":
      return "/consultas";

    case "analista":
      return "/sgc";

    default:
      return "/ingreso";

  }

}