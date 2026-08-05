"use client";

import { useEffect, useState } from "react";

import {
  DetalleOperacion,
  MovimientoLibro,
} from "@/types/LibroDiario";

interface Props {

  movimiento: MovimientoLibro;

  onClose: () => void;

}

export default function DetallePlanilla({

  movimiento,

  onClose,

}: Props) {

  const [detalle, setDetalle] =
    useState<DetalleOperacion | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {

    async function cargarDetalle() {

  setCargando(true);

  try {

    console.log(
      "Consultando referencia:",
      movimiento.referencia
    );

    const response = await fetch(

      `/api/libro-diario/detalle/${encodeURIComponent(
        movimiento.referencia
      )}`

    );

    const data = await response.json();

    console.log(
      "Respuesta API:",
      data
    );

    if (data.ok) {

      setDetalle(data.detalle);

    }

  } catch (error) {

    console.error(error);

  } finally {

    setCargando(false);

  }

}

    cargarDetalle();

  }, [movimiento.referencia]);

  return (

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold text-blue-950">

          Detalle de la Planilla

        </h2>

        <button

          onClick={onClose}

          className="text-gray-500 hover:text-black"

        >

          ✕

        </button>

      </div>

      {

        cargando ? (

          <div>

            Cargando...

          </div>

        ) : !detalle ? (

          <div>

            No se encontró la operación.

          </div>

        ) : (

          <div className="space-y-6">

            <div className="grid grid-cols-2 gap-4">

              <div>

                <strong>Planilla:</strong>{" "}

                {detalle.referencia}

              </div>

              <div>

                <strong>Fecha:</strong>{" "}

                {detalle.fecha}

              </div>

              <div>

                <strong>Ciudadano:</strong>{" "}

                {detalle.ciudadano}

              </div>

              <div>

                <strong>Documento:</strong>{" "}

                {detalle.documento}

              </div>

              <div>

                <strong>Correo:</strong>{" "}

                {detalle.correo}

              </div>

              <div>

                <strong>Estado:</strong>{" "}

                {detalle.estado}

              </div>

            </div>

            <hr />

            <table className="w-full border-collapse">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-2">

                    Código

                  </th>

                  <th className="text-left py-2">

                    Actuación

                  </th>

                </tr>

              </thead>

              <tbody>

                {

                  detalle.actuaciones.map(

                    (actuacion, index) => (

                      <tr

                        key={index}

                        className="border-b"

                      >

                        <td className="py-2">

                          {actuacion.codigo}

                        </td>

                        <td className="py-2">

                          {actuacion.actuacion}

                        </td>

                      </tr>

                    )

                  )

                }

              </tbody>

            </table>

            <hr />

            <div className="text-right text-xl font-bold">

              Total USD{" "}

              {detalle.total.toLocaleString(

                "es-CO",

                {

                  minimumFractionDigits: 2,

                }

              )}

            </div>

          </div>

        )

      }

    </div>

  </div>

);
}