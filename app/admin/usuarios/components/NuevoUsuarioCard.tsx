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

    <div className="w-full bg-slate-50 rounded-2xl shadow-md p-6 mb-8">

      <h2 className="text-2xl font-bold text-blue-950 mb-6">
        Nuevo Usuario
      </h2>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-4
          gap-5
          items-end
        "
      >

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Usuario
          </label>

          <input
            placeholder="Usuario"
            value={nuevoUsuario}
            onChange={(e) =>
              setNuevoUsuario(e.target.value)
            }
            className="w-full border border-slate-300 rounded-xl p-3"
          />

        </div>

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contraseña
          </label>

          <input
            type="password"
            placeholder="Contraseña"
            value={nuevoPassword}
            onChange={(e) =>
              setNuevoPassword(e.target.value)
            }
            className="w-full border border-slate-300 rounded-xl p-3"
          />

        </div>

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nombre Completo
          </label>

          <input
            placeholder="Nombre Completo"
            value={nuevoNombre}
            onChange={(e) =>
              setNuevoNombre(e.target.value)
            }
            className="w-full border border-slate-300 rounded-xl p-3"
          />

        </div>

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Rol
          </label>

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

        </div>

      </div>

      <div className="mt-6 flex justify-end">

        <button
          onClick={crearUsuario}
          className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800"
        >
          ➕ Crear Usuario
        </button>

      </div>

    </div>

  );

}