export interface RolSistema {
  value: string;
  label: string;
}

export const ROLES: RolSistema[] = [
  {
    value: "admin",
    label: "Administrador",
  },
  {
    value: "caja",
    label: "Operador de Caja",
  },
  {
    value: "recepcion",
    label: "Recepción",
  },
  {
    value: "analista",
    label: "Analista",
  },
  {
    value: "consultas",
    label: "Consultas",
  },
];

export function obtenerNombreRol(valor: string): string {
  const rol = ROLES.find(r => r.value === valor);
  return rol ? rol.label : valor;
}
export type Rol =
  | "admin"
  | "caja"
  | "recepcion"
  | "analista"
  | "consultas";