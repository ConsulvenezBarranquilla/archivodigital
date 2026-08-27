import { MODULOS } from "./modulos";

export interface NavigationChild {
  label: string;
  href?: string;
  disabled?: boolean;
  permiso?: string;
}

export interface NavigationItem {
  label: string;
  href?: string;
  disabled?: boolean;
  permiso?: string; // solo se usa en menús sin hijos
  children?: NavigationChild[];
}

export const navigation: NavigationItem[] = [
  {
    label: "Inicio",
    href: "/admin",
    permiso: MODULOS.ADMIN,
  },

  {
    label: "Recepción",
    children: [
      {
        label: "Ingresos",
        href: "/recepcion",
        permiso: MODULOS.RECEPCION,
      },
      {
        label: "Expediente Único",
        disabled: true,
        permiso: MODULOS.RECEPCION,
      },
    ],
  },

  {
    label: "Módulo Caja",
    children: [
      {
        label: "Caja",
        href: "/caja",
        permiso: MODULOS.CAJA,
      },
      {
        label: "Reportes",
        href: "/admin/reportes",
        permiso: MODULOS.REPORTES,
      },
      {
        label: "Entrega Documentos",
        disabled: true,
        permiso: MODULOS.CAJA,
      },
      {
        label: "Documentos en Proceso",
        href: "/reportesentregados",
        permiso: MODULOS.CAJA,
      },
    ],
  },

  {
    label: "Gestión Consular",
    children: [
      {
        label: "Vincular Planillas",
        href: "/sgc",
        permiso: MODULOS.GESTION_CONSULAR,
      },
      {
        label: "Libro Diario",
        href: "/libro-diario",
        permiso: MODULOS.GESTION_CONSULAR,
      },
    ],
  },

  {
    label: "Consultas",
    children: [
      {
        label: "Estadísticas Caja",
        href: "/consultas",
        permiso: MODULOS.CONSULTAS,
      },
      {
        label: "Estadísticas SGC",
        href: "/estadisticasgc",
        permiso: MODULOS.CONSULTAS,
      },
    ],
  },

  {
    label: "Intranet",
    children: [
      {
        label: "Talento Humano",
        disabled: true,
        permiso: MODULOS.ADMIN,
      },
      {
        label: "Administración",
        disabled: true,
        permiso: MODULOS.ADMIN,
      },
      {
        label: "Bienes Nacionales",
        disabled: true,
        permiso: MODULOS.GESTION_CONSULAR,
      },
      {
        label: "Archivos",
        disabled: true,
        permiso: MODULOS.GESTION_CONSULAR,
      },
      {
        label: "Correspondencia",
        disabled: true,
        permiso: MODULOS.GESTION_CONSULAR,
      },
    ],
  },

  {
    label: "Configuración",
    children: [
      {
        label: "Respaldo",
        href: "/admin/configuracion",
        permiso: MODULOS.CONFIGURACION,
      },
      {
        label: "Usuarios",
        href: "/admin/usuarios",
        permiso: MODULOS.USUARIOS,
      },
    ],
  },
];