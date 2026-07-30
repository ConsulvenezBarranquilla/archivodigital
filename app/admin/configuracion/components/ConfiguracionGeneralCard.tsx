interface Props {

  guardarPdfDrive: string;

  setGuardarPdfDrive: (valor: string) => void;

  guardarConfiguracion: () => void;

}

export default function ConfiguracionGeneralCard({

  guardarPdfDrive,

  setGuardarPdfDrive,

  guardarConfiguracion,

}: Props) {

  return (

    <>

      <h2 className="text-2xl font-bold text-blue-950 mb-4 mt-8">

        Configuración General

      </h2>

      <p className="text-slate-600 mb-6">

        Administre las opciones globales del sistema de caja,
        respaldos y almacenamiento de documentos.

      </p>

      <div
        className="
          bg-slate-50
          rounded-2xl
          shadow-md
          p-6
          mb-8
        "
      >

        <label className="block mb-2 font-medium text-slate-700">

          Guardar PDF automáticamente en Google Drive

        </label>

        <select
          value={guardarPdfDrive}
          onChange={(e) =>
            setGuardarPdfDrive(
              e.target.value
            )
          }
          className="
            w-full
            border
            border-slate-300
            rounded-xl
            p-3
          "
        >

          <option value="SI">

            Sí

          </option>

          <option value="NO">

            No

          </option>

        </select>

        <div className="flex gap-3 mt-6">

          <button
            onClick={guardarConfiguracion}
            className="
              bg-green-700
              text-white
              px-5
              py-3
              rounded-xl
              hover:bg-green-800
            "
          >

            💾 Guardar Configuración

          </button>

        </div>

      </div>

    </>

  );

}