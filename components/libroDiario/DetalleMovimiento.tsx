"use client";

import {

  MovimientoLibro,

} from "@/types/LibroDiario";

interface Props {

  movimiento: MovimientoLibro;

  onClose: () => void;

}

export default function DetalleMovimiento({

  movimiento,

  onClose,

}: Props) {

  const tiposMovimiento: Record<string, string> = {

    AUTORIZACION_USO_RECURSOS_RENTA_CONSULAR:
        "Autorización de Uso de Recursos de Renta Consular",

    INSTRUCCION_FINANCIERA:
        "Instrucción Financiera",

    OTROS:
        "Otros",

};

const tipo = movimiento.tipoMovimiento ?? "";

const tipoMovimientoTexto =

  tiposMovimiento[tipo] ??

  tipo.replace(/_/g, " ");

  return (

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold text-blue-950">

          Detalle del Movimiento

        </h2>

        <button

          onClick={onClose}

          className="text-gray-500 hover:text-black"

        >

          ✕

        </button>

      </div>

      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <strong>Fecha:</strong>{" "}

            {movimiento.fecha}

          </div>

          <div>

    <strong>Tipo de Movimiento:</strong>

    <div className="mt-1 break-words">

        {tipoMovimientoTexto}

    </div>

</div>

          <div>

            <strong>Referencia:</strong>{" "}

            {movimiento.referencia}

          </div>

          <div>

            <strong>Monto:</strong>{" "}

            {(movimiento.haber || movimiento.debe).toLocaleString(

              "es-CO",

              {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2,

              }

            )}{" "}USD

          </div>

        </div>

        <hr />

        <div>

          <strong>Concepto</strong>

          <div

            className="

              mt-2

              rounded-lg

              border

              border-gray-200

              bg-gray-50

              p-4

              whitespace-pre-wrap

            "

          >

            {movimiento.descripcion}

          </div>

        </div>

        <hr />

        <div className="flex justify-end">

          <button

            onClick={onClose}

            className="

              px-5

              py-2

              rounded-lg

              bg-blue-900

              text-white

              hover:bg-blue-800

            "

          >

            Cerrar

          </button>

        </div>

      </div>

    </div>

  </div>

);
}