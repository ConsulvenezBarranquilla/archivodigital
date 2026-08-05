"use client";

interface LibroDiarioHeaderProps {
  periodo: string;
  saldoInicial: number;

  onPeriodoChange: (periodo: string) => void;

  onNuevoMovimiento: () => void;
  onCerrarDia: () => void;
  onCerrarMes: () => void;

  esAdmin?: boolean;
  onReporteExcel?: () => void;
}

export default function LibroDiarioHeader({

  periodo,

  saldoInicial,

  onPeriodoChange,

  onNuevoMovimiento,

  onCerrarDia,

  onCerrarMes,

  esAdmin = false,

  onReporteExcel,

}: LibroDiarioHeaderProps) {

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">

        <div>

          <h2 className="text-2xl font-bold text-blue-950">

            Libro Diario

          </h2>
          
        </div>

        <div className="flex items-end gap-4 flex-wrap">

          <div>

            <label className="block text-sm font-medium mb-1">

              Período

            </label>

            <input
              type="month"
              value={periodo}
              onChange={(e) =>
                onPeriodoChange(e.target.value)
              }
              className="
                border
                rounded-lg
                px-3
                py-2
              "
            />

          </div>

          <div>

            <label className="block text-sm font-medium mb-1">

              Saldo Inicial

            </label>

            <div className="
              border
              rounded-lg
              px-4
              py-2
              bg-slate-50
              font-bold
              text-green-700
              min-w-[140px]
              text-right
            ">

              ${saldoInicial.toLocaleString("es-CO")}

            </div>

          </div>

        </div>

      </div>

      <div className="flex flex-wrap gap-3 mt-6">

        <button
          onClick={onNuevoMovimiento}
          className="
            bg-blue-700
            hover:bg-blue-800
            text-white
            rounded-xl
            px-5
            py-2
            font-semibold
          "
        >

          + Movimiento

        </button>

        <button
          onClick={onCerrarDia}
          className="
            bg-green-700
            hover:bg-green-800
            text-white
            rounded-xl
            px-5
            py-2
            font-semibold
          "
        >

          Acta Diaria

        </button>

        <button
          onClick={onCerrarMes}
          className="
            bg-indigo-700
            hover:bg-indigo-800
            text-white
            rounded-xl
            px-5
            py-2
            font-semibold
          "
        >

          Acta Mensual

        </button>

        {esAdmin && (

          <button
            onClick={onReporteExcel}
            className="
              bg-emerald-700
hover:bg-emerald-800
              text-white
              rounded-xl
              px-5
              py-2
              font-semibold
            "
          >

            📊 Reporte Excel

          </button>

        )}

      </div>

    </div>

  );

}