import { TableColumn } from "@/components/table/DataTable";

import {

  ActuacionPendiente,

} from "@/types/GestionConsular";

export function obtenerColumnasPendientes(

  abrirCiudadano: (

    documento: string

  ) => void

): TableColumn<ActuacionPendiente>[] {

  return [

    {

      field: "fecha",

      title: "Fecha",

      width: "120px",

    },

    {

      field: "recibo",

      title: "Recibo",

      width: "110px",

    },

    {

      field: "documento",

      title: "Documento",

      width: "130px",

    },

    {

      field: "nombre",

      title: "Ciudadano",

      width: "280px",

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

      width: "280px",

    },

    {

      field: "codigo",

      title: "Código",

      width: "120px",

    },

    {

      field: "usd",

      title: "USD",

      width: "90px",

      align: "right",

      render: (row) => (

        <span>

          {Number(

            row.usd

          ).toFixed(2)}

        </span>

      ),

    },

  ];

}