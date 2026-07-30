"use client";

interface DataTableEmptyProps {

  columnas: number;

  mensaje?: string;

}

export default function DataTableEmpty({

  columnas,

  mensaje = "No existen registros.",

}: DataTableEmptyProps) {

  return (

    <tr>

      <td

        colSpan={columnas}

        className="

          py-10

          text-center

          text-gray-500

        "

      >

        {mensaje}

      </td>

    </tr>

  );

}