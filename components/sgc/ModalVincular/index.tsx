"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import {
  ActuacionGestion,
  ActuacionPendiente,
  VincularPlanillaForm,
} from "@/types/GestionConsular";

interface ModalVincularProps {

  open: boolean;

  actuaciones: ActuacionPendiente[];

  onClose: () => void;

  onGuardar: (
    datos: VincularPlanillaForm
  ) => Promise<void>;

}

export default function ModalVincular({

  open,

  actuaciones,

  onClose,

  onGuardar,

}: ModalVincularProps) {

  const [planilla, setPlanilla] = useState("");

  const [fechaPlanilla, setFechaPlanilla] = useState("");

  const [observaciones, setObservaciones] = useState("");

  const [numerosActuacion, setNumerosActuacion] = useState<string[]>([]);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {

    if (!open) return;

    setPlanilla("");

    setFechaPlanilla(

      new Date()

        .toISOString()

        .split("T")[0]

    );

    setObservaciones("");

    setNumerosActuacion(
  actuaciones.map(() => "")
);

    setGuardando(false);

  }, [open, actuaciones]);

  const totalUSD = useMemo(() => {

    return actuaciones.reduce(

      (total, item) =>

        total + Number(item.usd ?? 0),

      0

    );

  }, [actuaciones]);

  const ciudadano = actuaciones[0];

  async function guardar() {

  // 1. Validar planilla
  if (!planilla.trim()) {

    alert(
      "Debe indicar el número de la Planilla."
    );

    return;

  }

  // 2. Validar que todas tengan Actuación Nro
  if (
    numerosActuacion.some(
      n => !n.trim()
    )
  ) {

    alert(
      "Debe indicar el número de todas las actuaciones."
    );

    return;

  }

  // 3. Validar que no existan números repetidos
  const unicos = new Set(
    numerosActuacion.map(
      n => n.trim().toUpperCase()
    )
  );

  if (
    unicos.size !==
    numerosActuacion.length
  ) {

    alert(
      "Existen números de actuación repetidos."
    );

    return;

  }

  // 4. Construir el objeto a enviar
  const actuacionesEnviar: ActuacionGestion[] =
    actuaciones.map(
      (item, index) => ({

        recibo: item.recibo,

        codigo: item.codigo,

        actuacion: item.actuacion,

        numeroActuacion:
          numerosActuacion[index].trim(),

      })
    );

  // 5. Guardar
  try {

    setGuardando(true);

    await onGuardar({

      actuaciones: actuacionesEnviar,

      planilla,

      fechaPlanilla,

      observaciones,

    });

  }
  finally {

    setGuardando(false);

  }

}
console.log("Button =", Button);
console.log("Input =", Input);
  if (!open) {

    return null;

  }

  return (

    <div

      className="

        fixed

        inset-0

        z-50

        flex

        items-center

        justify-center

        bg-black/40

      "

    >

      <div
    className="
        bg-white
        rounded-xl
        shadow-xl
        w-full
        max-w-4xl
        max-h-[90vh]
        overflow-y-auto
        p-6
        space-y-5
    "
>

        <h2

          className="

            text-2xl

            font-semibold

          "

        >

          Vincular Planilla de Gestión Consular

        </h2>

        <div

          className="

            rounded-lg

            border

            bg-gray-50

            p-4

            space-y-2

          "

        >

          <p>

            <strong>

              Actuaciones:

            </strong>{" "}

            {actuaciones.length}

          </p>

          <p>

  <strong>

    Solicitante del recibo:

  </strong>{" "}

  {ciudadano?.nombre || ""}

</p>

<p>

  <strong>

    Documento del solicitante:

  </strong>{" "}

  {ciudadano?.documento || ""}

</p>

          <p>

            <strong>

              Total USD:

            </strong>{" "}

            {totalUSD.toFixed(2)}

          </p>

        </div>

        <div className="space-y-2">

  <label className="text-sm font-medium">
    Actuaciones
  </label>

  <div className="overflow-x-auto">

    <table className="w-full border rounded-lg">

      <thead>

        <tr className="bg-gray-100">

          <th className="p-2 text-left">
  Recibo
</th>

<th className="p-2 text-left">
  Actuación
</th>

<th className="p-2 text-left">
  Titular
</th>

<th className="p-2 text-left">
  Documento
</th>

<th className="p-2 text-left">
  Actuación Nro
</th>

        </tr>

      </thead>

      <tbody>

        {actuaciones.map((item, index) => (

          <tr key={`${item.recibo}-${item.codigo}-${index}`}>

            <td className="p-2">
  {item.recibo}
</td>

<td className="p-2">
  {item.actuacion}
</td>

<td className="p-2">
  {item.titular}
</td>

<td className="p-2">
  {item.documento}
</td>

<td className="p-2">

  <Input
    value={numerosActuacion[index] ?? ""}
    inputMode="numeric"
    onChange={(valor) => {

      const copia = [...numerosActuacion];

      copia[index] =
        valor.replace(/\D/g, "");

      setNumerosActuacion(copia);

    }}

  />

</td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>

        <div className="space-y-2">

          <label

            className="

              text-sm

              font-medium

            "

          >

            Número de Planilla

          </label>

          <Input
  value={planilla}
  onChange={(valor) =>
    setPlanilla(
      valor.replace(/\D/g, "")
    )
  }
  inputMode="numeric"
  placeholder="Número de Planilla"
/>

        </div>

        <div className="space-y-2">

          <label

            className="

              text-sm

              font-medium

            "

          >

            Fecha de la Planilla

          </label>

          <Input

            type="date"

            value={fechaPlanilla}

            onChange={setFechaPlanilla}

          />

        </div>

        <div className="space-y-2">

          <label

            className="

              text-sm

              font-medium

            "

          >

            Observaciones

          </label>

          <textarea

            value={observaciones}

            onChange={(e) =>

              setObservaciones(

                e.target.value

              )

            }

            rows={4}

            className="

              w-full

              rounded-lg

              border

              border-gray-300

              p-3

              resize-none

              focus:outline-none

              focus:ring-2

              focus:ring-blue-500

            "

            placeholder="Observaciones (opcional)..."

          />

        </div>

        <div

          className="

            flex

            justify-end

            gap-3

            pt-2

          "

        >

          <Button

            variant="secondary"

            onClick={onClose}

            disabled={guardando}

          >

            Cancelar

          </Button>

          <Button

            variant="success"

            onClick={guardar}

            disabled={guardando}

          >

            {

              guardando

                ? "Guardando..."

                : "Guardar"

            }

          </Button>

        </div>

      </div>

    </div>

  );

}