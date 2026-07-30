interface Props {

  generarBackup: () => void;

}

export default function RespaldoCard({

  generarBackup,

}: Props) {

  return (

    <div
      className="
        bg-slate-50
        rounded-2xl
        shadow-md
        p-6
        mb-8
      "
    >

      <h2 className="text-2xl font-bold text-blue-950 mb-4">

        Respaldo del Sistema

      </h2>

      <p className="text-slate-600 mb-6">

        Genere un respaldo completo de la información
        registrada en el sistema consular.

      </p>

      <button
        onClick={generarBackup}
        className="
          bg-blue-950
          text-white
          px-5
          py-3
          rounded-xl
          hover:bg-blue-900
        "
      >

        📥 Generar Respaldo Excel

      </button>

    </div>

  );

}