"use client";

import {
  useState,
} from "react";

import {
  MovimientoLibro,
} from "@/types/LibroDiario";

interface Props {

  movimiento: MovimientoLibro;

  onClose: () => void;

  onActualizado?: () => void | Promise<void>;

}

export default function DetalleMovimiento({

  movimiento,

  onClose,

  onActualizado,

}: Props) {

  const tiposMovimiento: Record<string, string> = {

    AUTORIZACION_USO_RECURSOS_RENTA_CONSULAR:
      "Autorización de Uso de Recursos de Renta Consular",

    INSTRUCCION_FINANCIERA:
      "Instrucción Financiera",

    OTROS:
      "Otros",

  };

  const tipo =
    movimiento.tipoMovimiento ?? "";

  const tipoMovimientoTexto =
    tiposMovimiento[tipo] ??
    tipo.replace(/_/g, " ");

  // ======================================================
  // ESTADOS
  // ======================================================

  const [editando, setEditando] =
    useState(false);

  const [eliminando, setEliminando] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [fecha, setFecha] =
    useState(movimiento.fecha);

  const [tipoMovimiento, setTipoMovimiento] =
    useState(tipo);

  const [referencia, setReferencia] =
    useState(movimiento.referencia);

  const [concepto, setConcepto] =
    useState(movimiento.descripcion);

  const [monto, setMonto] =
    useState(
      String(
        movimiento.haber ||
        movimiento.debe ||
        movimiento.arancel ||
        0
      )
    );

  // ======================================================
  // MOVIMIENTO ANTIGUO
  // ======================================================

  const puedeEditar =
    movimiento.origen === "MOVIMIENTO" &&
    Boolean(
      movimiento.id &&
      movimiento.id.trim()
    ) &&
    movimiento.editable !== false;

  // ======================================================
  // EDITAR
  // ======================================================

  async function guardarCambios() {

    if (!movimiento.id) {

      setError(
        "Este movimiento no tiene ID y no puede ser editado."
      );

      return;

    }

    setGuardando(true);

    setError("");

    setMensaje("");

    try {

      const response =
        await fetch(

          `/api/libro-diario/movimientos/${encodeURIComponent(
            movimiento.id
          )}`,

          {

            method: "PUT",

            headers: {

              "Content-Type":
                "application/json",

            },

            body: JSON.stringify({

              fecha,

              tipoMovimiento,

              referencia,

              concepto,

              monto:

                Number(
                  monto
                ),

            }),

          }

        );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {

        throw new Error(

          data.error ||
          data.mensaje ||
          "No fue posible actualizar el movimiento."

        );

      }

      setMensaje(
        "Movimiento actualizado correctamente."
      );

      setEditando(false);

      if (onActualizado) {

        await onActualizado();

      }

    }

    catch (err: any) {

      setError(
        err.message ||
        "Error actualizando el movimiento."
      );

    }

    finally {

      setGuardando(false);

    }

  }

  // ======================================================
  // ELIMINAR
  // ======================================================

  async function eliminarMovimiento() {

    if (!movimiento.id) {

      setError(
        "Este movimiento no tiene ID y no puede ser eliminado."
      );

      return;

    }

    setGuardando(true);

    setError("");

    setMensaje("");

    try {

      const response =
        await fetch(

          `/api/libro-diario/movimientos/${encodeURIComponent(
            movimiento.id
          )}`,

          {

            method: "DELETE",

          }

        );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {

        throw new Error(

          data.error ||
          data.mensaje ||
          "No fue posible eliminar el movimiento."

        );

      }

      setMensaje(
        "Movimiento eliminado correctamente."
      );

      setEliminando(false);

      if (onActualizado) {

        await onActualizado();

      }

    }

    catch (err: any) {

      setError(

        err.message ||
        "Error eliminando el movimiento."

      );

    }

    finally {

      setGuardando(false);

    }

  }

  // ======================================================
  // CANCELAR EDICIÓN
  // ======================================================

  function cancelarEdicion() {

    setFecha(
      movimiento.fecha
    );

    setTipoMovimiento(
      movimiento.tipoMovimiento ?? ""
    );

    setReferencia(
      movimiento.referencia
    );

    setConcepto(
      movimiento.descripcion
    );

    setMonto(

      String(

        movimiento.haber ||
        movimiento.debe ||
        movimiento.arancel ||
        0

      )

    );

    setError("");

    setMensaje("");

    setEditando(false);

  }

  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">

        {/* ==================================================
            ENCABEZADO
        ================================================== */}

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold text-blue-950">

            {editando
              ? "Editar Movimiento"
              : "Detalle del Movimiento"}

          </h2>

          <button

            onClick={onClose}

            disabled={guardando}

            className="text-gray-500 hover:text-black text-xl"

          >

            ✕

          </button>

        </div>

        {/* ==================================================
            MENSAJES
        ================================================== */}

        {error && (

          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}

        {mensaje && (

          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            {mensaje}

          </div>

        )}

        {/* ==================================================
            EDICIÓN
        ================================================== */}

        {editando ? (

          <div className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* FECHA */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1">

                  Fecha

                </label>

                <input

                  type="date"

                  value={fecha}

                  onChange={(e) =>
                    setFecha(
                      e.target.value
                    )
                  }

                  className="w-full rounded-lg border border-gray-300 px-3 py-2"

                />

              </div>

              {/* TIPO */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1">

                  Tipo de Movimiento

                </label>

                <select

                  value={tipoMovimiento}

                  onChange={(e) =>
                    setTipoMovimiento(
                      e.target.value
                    )
                  }

                  className="w-full rounded-lg border border-gray-300 px-3 py-2"

                >

                  <option value="">

                    Seleccione...

                  </option>

                  <option value="AUTORIZACION_USO_RECURSOS_RENTA_CONSULAR">

                    Autorización de Uso de Recursos de Renta Consular

                  </option>

                  <option value="INSTRUCCION_FINANCIERA">

                    Instrucción Financiera

                  </option>

                  <option value="OTROS">

                    Otros

                  </option>

                </select>

              </div>

              {/* REFERENCIA */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1">

                  Referencia

                </label>

                <input

                  type="text"

                  value={referencia}

                  onChange={(e) =>
                    setReferencia(
                      e.target.value
                    )
                  }

                  className="w-full rounded-lg border border-gray-300 px-3 py-2"

                />

              </div>

              {/* MONTO */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-1">

                  Monto USD

                </label>

                <input

                  type="number"

                  min="0"

                  step="0.01"

                  value={monto}

                  onChange={(e) =>
                    setMonto(
                      e.target.value
                    )
                  }

                  className="w-full rounded-lg border border-gray-300 px-3 py-2"

                />

              </div>

            </div>

            {/* CONCEPTO */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-1">

                Concepto

              </label>

              <textarea

                value={concepto}

                onChange={(e) =>
                  setConcepto(
                    e.target.value
                  )
                }

                rows={4}

                className="w-full rounded-lg border border-gray-300 px-3 py-2 resize-none"

              />

            </div>

            {/* BOTONES */}

            <div className="flex justify-end gap-3 pt-3">

              <button

                type="button"

                onClick={cancelarEdicion}

                disabled={guardando}

                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"

              >

                Cancelar

              </button>

              <button

                type="button"

                onClick={guardarCambios}

                disabled={guardando}

                className="px-5 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"

              >

                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}

              </button>

            </div>

          </div>

        ) : (

          /* =================================================
             DETALLE
          ================================================= */

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

                {(

                  movimiento.haber ||

                  movimiento.debe ||

                  movimiento.arancel ||

                  0

                ).toLocaleString(

                  "es-CO",

                  {

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2,

                  }

                )}{" "}

                USD

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

            {/* =================================================
                MOVIMIENTO HISTÓRICO SIN ID
            ================================================= */}

            {!puedeEditar && (

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">

                Este movimiento corresponde a un registro histórico
                anterior a la implementación del ID y solo puede
                consultarse.

              </div>

            )}

            {/* =================================================
                CONFIRMACIÓN DE ELIMINACIÓN
            ================================================= */}

            {eliminando && (

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                <div className="font-semibold text-red-800 mb-2">

                  ¿Eliminar este movimiento?

                </div>

                <p className="text-sm text-red-700 mb-4">

                  Esta acción eliminará el movimiento manual del
                  Libro Diario. Esta operación no afecta ninguna
                  actuación consular ni ninguna planilla.

                </p>

                <div className="flex justify-end gap-3">

                  <button

                    type="button"

                    onClick={() =>
                      setEliminando(false)
                    }

                    disabled={guardando}

                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white"

                  >

                    Cancelar

                  </button>

                  <button

                    type="button"

                    onClick={
                      eliminarMovimiento
                    }

                    disabled={guardando}

                    className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"

                  >

                    {guardando
                      ? "Eliminando..."
                      : "Sí, eliminar"}

                  </button>

                </div>

              </div>

            )}

            {/* =================================================
                BOTONES
            ================================================= */}

            {!eliminando && (

              <div className="flex justify-between items-center">

                <div>

                  {puedeEditar && (

                    <div className="flex gap-3">

                      <button

                        type="button"

                        onClick={() =>
                          setEditando(true)
                        }

                        className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"

                      >

                        ✏️ Editar

                      </button>

                      <button

                        type="button"

                        onClick={() =>
                          setEliminando(true)
                        }

                        className="px-5 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800"

                      >

                        🗑️ Eliminar

                      </button>

                    </div>

                  )}

                </div>

                <button

                  onClick={onClose}

                  disabled={guardando}

                  className="px-5 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800"

                >

                  Cerrar

                </button>

              </div>

            )}

          </div>

        )}

      </div>

    </div>

  );

}