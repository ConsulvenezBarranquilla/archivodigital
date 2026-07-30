interface CambiarPasswordCardProps {

  usuarioPassword: any;

  nuevaPassword: string;
  setNuevaPassword: (valor: string) => void;

  guardarPassword: () => void;

  cancelar: () => void;

}

export default function CambiarPasswordCard({

  usuarioPassword,

  nuevaPassword,
  setNuevaPassword,

  guardarPassword,

  cancelar,

}: CambiarPasswordCardProps) {

  return (

    <div className="bg-slate-50 rounded-2xl shadow-md p-6 mb-8">

      <h2 className="text-2xl font-bold text-blue-950 mb-6">
        🔑 Cambiar Contraseña
      </h2>

      <p className="text-slate-600 mb-4">

        Usuario:

        <strong>
          {" "}
          {usuarioPassword.usuario}
        </strong>

      </p>

      <input
        type="password"
        value={nuevaPassword}
        onChange={(e)=>
          setNuevaPassword(
            e.target.value
          )
        }
        className="w-full border border-slate-300 rounded-xl p-3"
      />

      <div className="flex gap-3 mt-6">

        <button
          onClick={guardarPassword}
          className="bg-purple-700 text-white px-5 py-3 rounded-xl hover:bg-purple-800"
        >
          🔑 Actualizar
        </button>

        <button
          onClick={cancelar}
          className="bg-slate-500 text-white px-5 py-3 rounded-xl hover:bg-slate-600"
        >
          Cancelar
        </button>

      </div>

    </div>

  );

}