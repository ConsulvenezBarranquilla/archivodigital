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
    "casos",
    "atencion",
  ],

  caja: [
    "caja",
    "recepcion",
    "expediente-ciudadano",
  ],

  recepcion: [
    "recepcion",
  ],

  analista: [
  "sgc",
  "consultas",
  "expediente-ciudadano",
  "docfirmar",
  "casos",
  "atencion",
],

  consultas: [
    "consultas",
    "expediente-ciudadano",
    "casos",
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
