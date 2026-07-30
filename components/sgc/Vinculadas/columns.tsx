import { TableColumn } from "@/components/table/DataTable";

import {

  ActuacionVinculada,

} from "@/types/GestionConsular";

export function obtenerColumnasVinculadas(

  abrirCiudadano: (

    documento: string

  ) => void

): TableColumn<ActuacionVinculada>[] {

  return [
{

      field: "planilla",

      title: "Planilla",

      width: "150px",

      render: (row) =>

        row.planilla || "-",

    },
    {

      field: "fechaPlanilla",

      title: "Fecha Planilla",

      width: "140px",

      render: (row) =>

        row.fechaPlanilla || "-",

    },
    {
  field: "numeroActuacion",
  title: "Nro",
  width: "110px",
  render: (row) => row.numeroActuacion || "-",
},
      
    {

      field: "documento",

      title: "Documento",

      width: "130px",

    },

    {

      field: "nombre",

      title: "Ciudadano",

      width: "260px",

      render: (row) => (

        <button

          className="

            text-blue-600

            hover:text-blue-800

            hover:underline

            font-medium

            transition-colors

          "

          onClick={() =>

            abrirCiudadano(

              row.documento

            )

          }

        >

          {row.nombre}

        </button>

      ),

    },

    {

      field: "actuacion",

      title: "Actuación",

      width: "260px",

    },
      {

      field: "fechaRecibo",

      title: "Fecha Recibo",

      width: "120px",

    }, 
     {

      field: "recibo",

      title: "Recibo",

      width: "110px",

    }, 
    {

      field: "estado",

      title: "Estado",

      width: "140px",

      render: (row) => (

        <span

          className={

            row.estado === "VINCULADO"

              ? "text-green-700 font-semibold"

              : row.estado === "SIN PLANILLA"

              ? "text-orange-700 font-semibold"

              : "text-red-700 font-semibold"

          }

        >

          {row.estado}

        </span>

      ),

    },

    {

      field: "usuario",

      title: "Usuario",

      width: "150px",

    },

    {

      field: "fechaRegistro",

      title: "Fecha Registro",

      width: "170px",

    },

  ];

}