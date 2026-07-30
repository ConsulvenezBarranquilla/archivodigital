import { obtenerNombreRol } from "@/lib/roles";

interface UsuariosTableProps {
  usuarios: any[];

  onCambiarEstado: (
    usuario: string,
    activo: string
  ) => void;

  onEditar: (usuario: any) => void;

  onCambiarPassword: (usuario: any) => void;
}

export default function UsuariosTable({

  usuarios,

  onCambiarEstado,

  onEditar,

  onCambiarPassword,

}: UsuariosTableProps) {

  return (

    <div className="bg-white rounded-2xl shadow-md overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-blue-950 text-white">

          <tr>

            <th className="p-4 text-left font-semibold">
              Usuario
            </th>

            <th className="p-4 text-left font-semibold">
              Nombre
            </th>

            <th className="p-4 text-left font-semibold">
              Rol
            </th>

            <th className="p-4 text-left font-semibold">
              Activo
            </th>

            <th>
              Acción
            </th>

            <th>
              Editar
            </th>

            <th>
              Contraseña
            </th>

          </tr>

        </thead>

        <tbody>

          {usuarios.map((item, index) => (

            <tr
              key={index}
              className="border-b hover:bg-slate-50"
            >

              <td className="p-3">
                {item.usuario}
              </td>

              <td className="p-3">
                {item.nombre}
              </td>

              <td className="p-3">
                {obtenerNombreRol(item.rol)}
              </td>

              <td>

                {item.activo === "SI" ? (

                  <span className="text-green-700 font-bold">
                    ACTIVO
                  </span>

                ) : (

                  <span className="text-red-600 font-bold">
                    INACTIVO
                  </span>

                )}

              </td>

              <td>

                {item.activo === "SI" ? (

                  <button
                    onClick={() =>
                      onCambiarEstado(
                        item.usuario,
                        "NO"
                      )
                    }
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                  >
                    🔴 Desactivar
                  </button>

                ) : (

                  <button
                    onClick={() =>
                      onCambiarEstado(
                        item.usuario,
                        "SI"
                      )
                    }
                    className="bg-green-700 text-white px-3 py-2 rounded-lg hover:bg-green-800"
                  >
                    🟢 Activar
                  </button>

                )}

              </td>

              <td>

                <button
                  onClick={() =>
                    onEditar(item)
                  }
                  className="bg-blue-700 text-white px-3 py-2 rounded-lg hover:bg-blue-800"
                >
                  ✏️ Editar
                </button>

              </td>

              <td>

                <button
                  onClick={() =>
                    onCambiarPassword(item)
                  }
                  className="bg-purple-700 text-white px-3 py-2 rounded-lg hover:bg-purple-800"
                >
                  🔑 Clave
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}