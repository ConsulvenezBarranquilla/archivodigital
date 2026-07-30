import { ROLES } from "@/lib/roles";

interface NuevoUsuarioCardProps {
  nuevoUsuario: string;
  setNuevoUsuario: (valor: string) => void;

  nuevoPassword: string;
  setNuevoPassword: (valor: string) => void;

  nuevoNombre: string;
  setNuevoNombre: (valor: string) => void;

  nuevoRol: string;
  setNuevoRol: (valor: string) => void;

  crearUsuario: () => void;
}

export default function NuevoUsuarioCard({
  nuevoUsuario,
  setNuevoUsuario,
  nuevoPassword,
  setNuevoPassword,
  nuevoNombre,
  setNuevoNombre,
  nuevoRol,
  setNuevoRol,
  crearUsuario,
}: NuevoUsuarioCardProps) {

  return (

    <div className="bg-slate-50 rounded-2xl shadow-md p-6 mb-8">

      <h2 className="text-2xl font-bold text-blue-950 mb-6">
        Nuevo Usuario
      </h2>

      <input
        placeholder="Usuario"
        value={nuevoUsuario}
        onChange={(e) =>
          setNuevoUsuario(e.target.value)
        }
        className="w-full border border-slate-300 rounded-xl p-3"
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Contraseña"
        value={nuevoPassword}
        onChange={(e) =>
          setNuevoPassword(e.target.value)
        }
        className="w-full border border-slate-300 rounded-xl p-3"
      />

      <br />
      <br />

      <input
        placeholder="Nombre Completo"
        value={nuevoNombre}
        onChange={(e) =>
          setNuevoNombre(e.target.value)
        }
        className="w-full border border-slate-300 rounded-xl p-3"
      />

      <br />
      <br />

      <select
        value={nuevoRol}
        onChange={(e) =>
          setNuevoRol(e.target.value)
        }
        className="w-full border border-slate-300 rounded-xl p-3"
      >

        {ROLES.map((rol) => (

          <option
            key={rol.value}
            value={rol.value}
          >
            {rol.label}
          </option>

        ))}

      </select>

      <br />
      <br />

      <button
        onClick={crearUsuario}
        className="bg-green-700 text-white px-5 py-3 rounded-xl hover:bg-green-800"
      >
        ➕ Crear Usuario
      </button>

    </div>

  );

}