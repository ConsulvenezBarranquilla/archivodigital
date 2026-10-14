import { Rol } from "./roles";

export const PERMISOS = {

  admin: [
    "admin",
    "recepcion",
    "caja",
    "sgc",
    "consultas",
    "usuarios",
    "configuracion",
    "reportes",
    "expediente-ciudadano",
    "docfirmar",
  ],

  caja: [
    "caja",
  ],

  recepcion: [
    "recepcion",
  ],

  analista: [
  "sgc",
  "consultas",
  "expediente-ciudadano",
  "docfirmar",
],

  consultas: [
    "consultas",
    "expediente-ciudadano",
  ],

} as const;

export function tienePermiso(
  rol: string,
  permiso: string
): boolean {

  const permisos =
    PERMISOS[
      rol as keyof typeof PERMISOS
    ];

  if (!permisos) {
    return false;
  }

  return permisos.includes(
    permiso as never
  );

}
