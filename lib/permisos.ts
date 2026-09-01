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
],

  consultas: [
    "consultas",
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