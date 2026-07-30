interface UsuariosDashboardProps {
  usuarios: any[];
}

export default function UsuariosDashboard({
  usuarios,
}: UsuariosDashboardProps) {

  const total = usuarios.length;

  const activos = usuarios.filter(
    (u) => u.activo === "SI"
  ).length;

  const inactivos = usuarios.filter(
    (u) => u.activo !== "SI"
  ).length;

  const administradores = usuarios.filter(
    (u) => u.rol === "admin"
  ).length;

  return (

    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

      <div className="bg-blue-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">
        <div className="text-slate-500 text-sm">
          Usuarios Totales
        </div>

        <div className="text-3xl font-bold text-blue-950 mt-2">
          {total}
        </div>
      </div>

      <div className="bg-green-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">
        <div className="text-slate-500 text-sm">
          Usuarios Activos
        </div>

        <div className="text-3xl font-bold text-green-700 mt-2">
          {activos}
        </div>
      </div>

      <div className="bg-red-50 rounded-2xl shadow-md p-6 border-l-4 border-red-700">
        <div className="text-slate-500 text-sm">
          Usuarios Inactivos
        </div>

        <div className="text-3xl font-bold text-red-700 mt-2">
          {inactivos}
        </div>
      </div>

      <div className="bg-purple-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-700">
        <div className="text-slate-500 text-sm">
          Administradores
        </div>

        <div className="text-3xl font-bold text-purple-700 mt-2">
          {administradores}
        </div>
      </div>

    </div>

  );

}