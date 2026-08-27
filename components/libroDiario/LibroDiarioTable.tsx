"use client";

import DataTable, {
  TableColumn,
} from "@/components/table/DataTable";

import {
  MovimientoLibro,
} from "@/types/LibroDiario";

interface Props {

  movimientos: MovimientoLibro[];

  onDetalleOperacion: (
    movimiento: MovimientoLibro
) => void;

}

export default function LibroDiarioTable({

  movimientos,

  onDetalleOperacion,

}: Props) {

  const columns: TableColumn<MovimientoLibro>[] = [

  {
  field: "fecha",
  title: "Fecha",
  width: "120px",
  align: "center",
  render: (row) => {

    if (
      row.tipoFila === "TOTAL_DIA" ||
      row.tipoFila === "TOTAL_MES"
    ) {
      return "";
    }

    return row.fecha;

  },
},

  {
  field: "referencia",
  title: "Planilla / Comunicación",
  width: "140px",
  align: "center",

  render: (row) => {

    if (!row.referencia) {

      return "";

    }

    if (row.tipoFila !== "MOVIMIENTO") {

      return "";

    }

    return (

      <button

        onClick={() =>

          onDetalleOperacion(row)

        }

        className="

          text-blue-700

          hover:text-blue-900

          hover:underline

          font-medium

        "

      >

        {row.referencia}

      </button>

    );

  },

},

  {
  field: "descripcion",
  title: "Solicitante / Concepto",

  render: (row) => {

    switch (row.tipoFila) {

      case "INICIO_DIA":

        return (

          <span className="font-bold text-blue-900">

            {row.descripcion}

          </span>

        );

      case "TOTAL_DIA":

        return (

          <span className="font-bold">

            {row.descripcion}

          </span>

        );

      case "TOTAL_MES":

    return (

        <span className="font-bold text-white">

            {row.descripcion}

        </span>

    );

      default:

        return row.descripcion;

    }

  },

},
{
  field: "arancel",
  title: "Arancel (USD)",
  width: "140px",
  align: "right",

  render: (row) =>

    row.arancel > 0

      ? (

          <span className="font-semibold">

            {row.arancel.toLocaleString(

              "es-CO",

              {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2,

              }

            )}

          </span>

        )

      : "",

},
 
  {
    field: "debe",
    title: "Débito (USD)",
    width: "140px",
    align: "right",
    render: (row) =>

  row.debe > 0

    ? (

      <span className={

        row.tipoFila !== "MOVIMIENTO"

          ? "font-bold"

          : ""

      }>

        {row.debe.toLocaleString("es-CO", {

          minimumFractionDigits: 2,

        })}

      </span>

    )

    : "",
  },
 {
    field: "haber",
    title: "Crédito (USD)",
    width: "140px",
    align: "right",
    render: (row) =>

  row.haber > 0

    ? (

      <span className={

        row.tipoFila !== "MOVIMIENTO"

          ? "font-bold"

          : ""

      }>

        {row.haber.toLocaleString("es-CO", {

          minimumFractionDigits: 2,

        })}

      </span>

    )

    : "",
  },
  {
    field: "saldo",
    title: "Saldo (USD)",
    width: "140px",
    align: "right",
    render: (row) => (

  <span
  className={
    row.tipoFila === "TOTAL_MES"
      ? "font-bold text-white"
      : row.tipoFila === "MOVIMIENTO"
      ? "font-semibold"
      : "font-bold text-blue-900"
  }
>

    {row.saldo.toLocaleString("es-CO", {

      minimumFractionDigits: 2,

    })}

  </span>

),
  },

];

  return (

      <DataTable

          columns={columns}

          data={movimientos}

          getRowKey={(row, index) => {

  if (row.id) {
    return row.id;
  }

  return `${row.tipoFila}-${row.fecha}-${row.referencia}-${index}`;

}}

          getRowClassName={(row) => {

    // Solo los movimientos manuales
    if (row.origen === "MOVIMIENTO" && row.tipoFila === "MOVIMIENTO") {

        return "bg-[#FFF4F2]";

    }

    switch (row.tipoFila) {

        case "INICIO_DIA":
            return "bg-blue-100";

        case "TOTAL_DIA":
            return "bg-gray-100 font-semibold";

        case "TOTAL_MES":
            return "bg-blue-900 text-white font-bold";

        default:
            return "";

    }

}}

/>

  );

}