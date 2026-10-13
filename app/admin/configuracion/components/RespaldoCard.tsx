interface Props {
  generarBackup: () => void | Promise<void>;
  guardando: boolean;
  mensaje: string;
}

export default function RespaldoCard({ generarBackup, guardando, mensaje }: Props) {
  return (
    <div className="mb-8 rounded-2xl bg-slate-50 p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-blue-950">
        Respaldo del Sistema
      </h2>
      <p className="mb-4 text-slate-600">
        Guarda en la carpeta Respaldos de Google Drive dos archivos Excel
        completos, uno por cada libro, con todas sus pestañas.
      </p>
      <p className="mb-6 text-sm text-slate-600">
        El respaldo automÃ¡tico corre a diario, programado para la 1:00 a. m.
        de Barranquilla. En el plan actual de Vercel puede ejecutarse en cualquier
        momento de esa hora.
      </p>
      <button
        type="button"
        onClick={generarBackup}
        disabled={guardando}
        className="rounded-xl bg-blue-950 px-5 py-3 text-white hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"
      >
        {guardando ? "Guardando respaldos..." : "Guardar respaldo ahora en Drive"}
      </button>
      {mensaje && (
        <p
          role="status"
          className={`mt-4 rounded-xl p-3 text-sm ${mensaje.startsWith("Respaldo guardado") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}
