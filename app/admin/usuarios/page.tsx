"use client";

import {
  useEffect,
  useState,
} from "react";

export default function UsuariosPage() {
const [nuevoUsuario,
  setNuevoUsuario] =
  useState("");

const [nuevoPassword,
  setNuevoPassword] =
  useState("");

const [nuevoNombre,
  setNuevoNombre] =
  useState("");

const [nuevoRol,
  setNuevoRol] =
  useState("caja");

const [
  usuarioPassword,
  setUsuarioPassword,
] = useState<any>(null);

const [
  nuevaPassword,
  setNuevaPassword,
] = useState("");

  const [
    usuarios,
    setUsuarios,
  ] = useState<any[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
  usuarioEditar,
  setUsuarioEditar,
] = useState<any>(null);

const [
  nombreEditar,
  setNombreEditar,
] = useState("");

const [
  rolEditar,
  setRolEditar,
] = useState("caja");

  useEffect(() => {

    const data =
      localStorage.getItem(
        "usuarioCaja"
      );

    if (!data) {

      window.location.href =
        "/";

      return;

    }

    const user =
      JSON.parse(data);

    if (
      user.rol !== "admin"
    ) {

      window.location.href =
        "/caja";

      return;

    }

    cargarUsuarios();

  }, []);

  async function cargarUsuarios() {

    try {

      const response =
        await fetch(
          "/api/usuarios-admin"
        );

      const data =
        await response.json();

      if (data.ok) {

        setUsuarios(
          data.usuarios
        );

      }

    } catch {

      alert(
        "Error cargando usuarios"
      );

    } finally {

      setCargando(
        false
      );

    }

  }
async function cambiarEstado(
  usuario: string,
  activo: string
) {

  const response =
    await fetch(
      "/api/usuarios-admin",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          usuario,

          activo,

        }),

      }
    );

  const data =
    await response.json();

  if (!data.ok) {

    alert(
      data.error
    );

    return;

  }

  cargarUsuarios();

}
function editarUsuario(
  usuario: any
) {

  setUsuarioEditar(
    usuario
  );

  setNombreEditar(
    usuario.nombre
  );

  setRolEditar(
    usuario.rol
  );
  
}
async function guardarPassword() {

  const response =
    await fetch(
      "/api/usuarios-admin/password",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          usuario:
            usuarioPassword.usuario,

          password:
            nuevaPassword,

        }),

      }
    );

  const data =
    await response.json();

  if (!data.ok) {

    alert(
      data.error
    );

    return;

  }

  alert(
    "Contraseña actualizada"
  );

  setUsuarioPassword(
    null
  );

}  
async function crearUsuario() {
if (
  !nuevoUsuario.trim() ||
  !nuevoPassword.trim() ||
  !nuevoNombre.trim() ||
  !nuevoRol.trim()
) {

  alert(
    "Debe completar todos los campos."
  );

  return;

}
    const response =
      await fetch(
        "/api/usuarios-admin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({

            usuario:
              nuevoUsuario,

            passwordHash:
              nuevoPassword,

            nombre:
              nuevoNombre,

            rol:
              nuevoRol,
            
          }),
        }
      );

    const data =
      await response.json();

    if (!data.ok) {

      alert(
        data.error
      );

      return;

    }

    alert(
      "Usuario creado"
    );
    setNuevoUsuario("");
setNuevoPassword("");
setNuevoNombre("");
setNuevoRol("caja");

    cargarUsuarios();

  }

    if (cargando) {

    return (
      <div>
        Cargando...
      </div>
    );

  }

  return (

    <main className="min-h-screen bg-slate-200">

<div className="max-w-7xl mx-auto px-4 py-4">

<div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">

<div className="flex justify-center mb-5">

  <img
    src="/logo.png"
    alt="Logo"
    className="w-24"
  />

</div>

<h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">

  Administración de Usuarios

</h1>

<p className="text-center text-slate-700 text-lg mb-4">

  Consulado General de la República
  Bolivariana de Venezuela
  en Barranquilla

</p>

<div className="flex justify-center mb-8">

  <div className="flex w-72 h-1 rounded-full overflow-hidden">

    <div className="w-1/3 bg-yellow-400"></div>

    <div className="w-1/3 bg-blue-700"></div>

    <div className="w-1/3 bg-red-600"></div>

  </div>

</div>

<div className="flex flex-wrap justify-center gap-3 mb-8">

  <a
    href="/admin"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Inicio
  </a>
<a
  href="/recepcion"
  className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
>
  Recepción
</a>
  <a
    href="/caja"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Caja
  </a>

  <a
    href="/admin/reportes"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Reportes
  </a>

  <a
    href="/admin/usuarios"
    className="bg-green-700 text-white px-4 py-2 rounded-xl"
  >
    Usuarios
  </a>

  <a
    href="/admin/historial"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Historial
  </a>

  <a
    href="/admin/configuracion"
    className="bg-blue-950 text-white px-4 py-2 rounded-xl hover:bg-blue-900"
  >
    Configuración
  </a>

</div>
<div className="bg-slate-50 rounded-2xl shadow-md p-6 mb-8">

<h2 className="text-2xl font-bold text-blue-950 mb-6">

  Nuevo Usuario

</h2>

<input
  placeholder="Usuario"
  value={nuevoUsuario}
  onChange={(e) =>
    setNuevoUsuario(
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
/>

<br />
<br />

<input
  type="password"
  placeholder="Contraseña"
  value={nuevoPassword}
  onChange={(e) =>
    setNuevoPassword(
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
/>

<br />
<br />

<input
  placeholder="Nombre Completo"
  value={nuevoNombre}
  onChange={(e) =>
    setNuevoNombre(
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
/>

<br />
<br />

<select
  value={nuevoRol}
  onChange={(e) =>
    setNuevoRol(
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

  <option value="admin">
    Administrador
  </option>

  <option value="caja">
    Operador de Caja
  </option>

  <option value="recepcion">
  Recepción
</option>

</select>

<br />
<br />


<button
  onClick={crearUsuario}
  className="
    bg-green-700
    text-white
    px-5
    py-3
    rounded-xl
    hover:bg-green-800
  "
>
  ➕ Crear Usuario
</button>

<hr />
{usuarioEditar && (

  <div
    className="
      bg-slate-50
      rounded-2xl
      shadow-md
      p-6
      mt-8
    "
  >

    <h2 className="text-2xl font-bold text-blue-950 mb-6">
      ✏️ Editar Usuario
    </h2>

    <p>

      Usuario:

      {" "}

      <strong>
        {
          usuarioEditar.usuario
        }
      </strong>

    </p>

    <input
  value={nombreEditar}
  onChange={(e) =>
    setNombreEditar(
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
/>

    <br />
    <br />

    <select
  value={rolEditar}
  onChange={(e) =>
    setRolEditar(
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

      <option value="admin">
        admin
      </option>

      <option value="caja">
        caja
      </option>

    </select>

    <br />
    <br />

    
   <div className="flex gap-3 mt-6">

  <button
    onClick={
      guardarEdicion
    }
    className="
      bg-green-700
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-green-800
    "
  >
    💾 Guardar
  </button>

  <button
    onClick={() =>
      setUsuarioEditar(
        null
      )
    }
    className="
      bg-slate-500
      text-white
      px-5
      py-3
      rounded-xl
      hover:bg-slate-600
    "
  >
    Cancelar
  </button>

</div>

  </div>

)}
{usuarioPassword && (

  <div
    className="
      bg-slate-50
      rounded-2xl
      shadow-md
      p-6
      mt-8
    "
  >

    <h2 className="text-2xl font-bold text-blue-950 mb-6">
      🔑 Cambiar Contraseña
    </h2>
<p className="text-slate-600 mb-4">
  Usuario:
  <strong>
    {" "}
    {usuarioPassword?.usuario}
  </strong>
</p>
    <input
      type="password"
      value={nuevaPassword}
      onChange={(e) =>
        setNuevaPassword(
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
    />

    <div className="flex gap-3 mt-6">

      <button
        onClick={
          guardarPassword
        }
        className="
          bg-purple-700
          text-white
          px-5
          py-3
          rounded-xl
          hover:bg-purple-800
        "
      >
        🔑 Actualizar
      </button>

      <button
        onClick={() =>
          setUsuarioPassword(
            null
          )
        }
        className="
          bg-slate-500
          text-white
          px-5
          py-3
          rounded-xl
          hover:bg-slate-600
        "
      >
        Cancelar
      </button>

    </div>

  </div>

)}
<div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

  <div className="bg-blue-50 rounded-2xl shadow-md p-6 border-l-4 border-blue-700">

    <div className="text-slate-500 text-sm">
      Usuarios Totales
    </div>

    <div className="text-3xl font-bold text-blue-950 mt-2">
      {usuarios.length}
    </div>

  </div>

  <div className="bg-green-50 rounded-2xl shadow-md p-6 border-l-4 border-green-700">

    <div className="text-slate-500 text-sm">
      Usuarios Activos
    </div>

    <div className="text-3xl font-bold text-green-700 mt-2">
      {
        usuarios.filter(
          u =>
            u.activo === "SI"
        ).length
      }
    </div>

  </div>

  <div className="bg-red-50 rounded-2xl shadow-md p-6 border-l-4 border-red-700">

    <div className="text-slate-500 text-sm">
      Usuarios Inactivos
    </div>

    <div className="text-3xl font-bold text-red-700 mt-2">
      {
        usuarios.filter(
          u =>
            u.activo !== "SI"
        ).length
      }
    </div>

  </div>

  <div className="bg-purple-50 rounded-2xl shadow-md p-6 border-l-4 border-purple-700">

    <div className="text-slate-500 text-sm">
      Administradores
    </div>

    <div className="text-3xl font-bold text-purple-700 mt-2">
      {
        usuarios.filter(
          u =>
            u.rol === "admin"
        ).length
      }
    </div>

  </div>

</div>
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

          {usuarios.map(
            (
              item,
              index
            ) => (

              <tr
  key={index}
  className="
    border-b
    hover:bg-slate-50
  "
>

                <td className="p-3">
  {item.usuario}
</td>

                <td className="p-3">
  {item.nombre}
</td>

                <td className="p-3">
  {item.rol}
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
      cambiarEstado(
        item.usuario,
        "NO"
      )
    }
    className="
      bg-red-600
      text-white
      px-3
      py-2
      rounded-lg
      hover:bg-red-700
    "
  >
    🔴 Desactivar
  </button>

) : (

  <button
    onClick={() =>
      cambiarEstado(
        item.usuario,
        "SI"
      )
    }
    className="
      bg-green-700
      text-white
      px-3
      py-2
      rounded-lg
      hover:bg-green-800
    "
  >
    🟢 Activar
  </button>

)}

</td>

<td>

  <button
  onClick={() =>
    editarUsuario(item)
  }
  className="
    bg-blue-700
    text-white
    px-3
    py-2
    rounded-lg
    hover:bg-blue-800
  "
>
  ✏️ Editar
</button>

</td>

<td>

  <button
  onClick={() => {

    setUsuarioPassword(
      item
    );

    setNuevaPassword(
      ""
    );

  }}
  className="
    bg-purple-700
    text-white
    px-3
    py-2
    rounded-lg
    hover:bg-purple-800
  "
>
  🔑 Clave
</button>

</td>

              </tr>

            )
          )}

        </tbody>

      </table>

</div> {/* tabla */}

</div> {/* tarjeta nuevo usuario */}

</div> {/* contenedor blanco */}

</div> {/* max-w */}

</main>

  );
async function guardarEdicion() {

  const response =
    await fetch(
      "/api/usuarios-admin",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          usuario:
            usuarioEditar.usuario,

          nombre:
            nombreEditar,

          rol:
            rolEditar,
          
        }),

      }
    );

  const data =
    await response.json();

  if (!data.ok) {

    alert(
      data.error
    );

    return;

  }

  alert(
    "Usuario actualizado"
  );

  setUsuarioEditar(
    null
  );

  cargarUsuarios();

}
}