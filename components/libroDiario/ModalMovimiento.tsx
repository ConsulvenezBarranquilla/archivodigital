"use client";

import { useState, useEffect } from "react";
import { hoyISO } from "@/lib/fechas";

interface ModalMovimientoProps {

  open: boolean;

  onClose: () => void;

  onGuardado: () => void;

}

export default function ModalMovimiento({

  open,

  onClose,

  onGuardado,

}: ModalMovimientoProps) {

  const [fecha, setFecha] = useState("");

  const [tipoMovimiento, setTipoMovimiento] =
useState("AUTORIZACION_USO_RECURSOS_RENTA_CONSULAR");

  const [referencia, setReferencia] = useState("");

  const [concepto, setConcepto] = useState("");

  const [monto, setMonto] = useState("");

  const [guardando, setGuardando] =
useState(false);

  useEffect(() => {

    if (!open) return;

    const hoy = hoyISO();

    setFecha(hoy);

    setTipoMovimiento(
  "AUTORIZACION_USO_RECURSOS_RENTA_CONSULAR"
);

    setReferencia("");

    setConcepto("");

    setMonto("");

  }, [open]);

  if (!open) {

    return null;

  }

  async function guardar() {

  if (guardando) {
    return;
  }

  setGuardando(true);

  try {

    if (!fecha) {
      alert("Debe indicar la fecha.");
      return;
    }

    if (!referencia.trim()) {
      alert("Debe indicar el número de comunicación.");
      return;
    }

    if (!concepto.trim()) {
      alert("Debe indicar el concepto.");
      return;
    }

    if (Number(monto) <= 0) {
      alert("El monto debe ser mayor a cero.");
      return;
    }

    const response = await fetch(

      "/api/libro-diario/movimientos",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          fecha,

          tipoMovimiento,

          referencia,

          concepto,

          monto: Number(

  monto

    .replace(/\./g, "")

    .replace(",", ".")

),

        }),

      }

    );

    const data = await response.json();

    if (!data.ok) {

      alert(data.error);

      return;

    }

    onGuardado();

  } catch (error) {

    alert("Ocurrió un error al registrar el movimiento.");

    console.error(error);

  } finally {

    setGuardando(false);

  }

}
function formatearMonto() {

  if (!monto.trim()) {

    return;

  }

  const numero = Number(

    monto
      .replace(/\./g, "")
      .replace(",", ".")

  );

  if (isNaN(numero)) {

    setMonto("");

    return;

  }

  const formateado =
    numero.toLocaleString(

      "es-CO",

      {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

      }

    );

  setMonto(formateado);

}
  return (

    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">

        <h2 className="text-2xl font-bold text-blue-950 mb-6">

          Registrar Movimiento

        </h2>

        <div className="space-y-4">

          <div>

            <label className="block mb-1 font-medium">

              Fecha

            </label>

            <input

              type="date"

              value={fecha}

              onChange={(e)=>setFecha(e.target.value)}

              className="w-full border rounded-lg px-3 py-2"

            />

          </div>

          <div>

            <label className="block mb-1 font-medium">

              Tipo de Movimiento

            </label>

            <select

              value={tipoMovimiento}

              onChange={(e)=>setTipoMovimiento(e.target.value)}

              className="w-full border rounded-lg px-3 py-2"

            >

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

          <div>

            <label className="block mb-1 font-medium">

              Número de Comunicación

            </label>

            <input

              value={referencia}

              onChange={(e)=>setReferencia(e.target.value)}

              className="w-full border rounded-lg px-3 py-2"

            />

          </div>

          <div>

            <label className="block mb-1 font-medium">

              Concepto

            </label>

            <textarea

              value={concepto}

              onChange={(e)=>setConcepto(e.target.value)}

              rows={3}

              className="w-full border rounded-lg px-3 py-2"

            />

          </div>

          <div>

            <label className="block mb-1 font-medium">

              Monto USD (usar , como separador de decimales)

            </label>

            <input

  type="text"

  inputMode="decimal"

  value={monto}

  onChange={(e) => {

    let valor = e.target.value;

    valor = valor.replace(

      /[^0-9.,]/g,

      ""

    );

    const partes = valor.split(",");

    if (partes.length > 2) {

      return;

    }

    if (

      partes[1] &&

      partes[1].length > 2

    ) {

      partes[1] = partes[1].substring(0, 2);

    }

    setMonto(

      partes.join(",")

    );

  }}

  onBlur={formatearMonto}

  className="w-full border rounded-lg px-3 py-2"

/>

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button

  onClick={onClose}

  disabled={guardando}

  className="px-5 py-2 rounded-lg border disabled:opacity-50"

>

  Cancelar

</button>

          <button

  onClick={guardar}

  disabled={guardando}

  className={`

    px-5

    py-2

    rounded-lg

    text-white

    ${

      guardando

        ? "bg-gray-400 cursor-not-allowed"

        : "bg-blue-900 hover:bg-blue-800"

    }

  `}

>

  {

    guardando

      ? "Guardando..."

      : "Guardar"

  }

</button>

        </div>

      </div>

    </div>

  );

}