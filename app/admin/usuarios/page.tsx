"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ROLES,
  obtenerNombreRol,
} from "@/lib/roles";

import UsuariosDashboard from "./components/UsuariosDashboard";
import NuevoUsuarioCard from "./components/NuevoUsuarioCard";
import EditarUsuarioCard from "./components/EditarUsuarioCard";
import CambiarPasswordCard from "./components/CambiarPasswordCard";
import UsuariosTable from "./components/UsuariosTable";
import SistemaLayout from "@/components/layout/SistemaLayout";
import { MODULOS } from "@/lib/modulos";

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

    <SistemaLayout
        titulo="Administración de Usuarios"
        permiso={MODULOS.USUARIOS}
    >

        <NuevoUsuarioCard
            nuevoUsuario={nuevoUsuario}
            setNuevoUsuario={setNuevoUsuario}
            nuevoPassword={nuevoPassword}
            setNuevoPassword={setNuevoPassword}
            nuevoNombre={nuevoNombre}
            setNuevoNombre={setNuevoNombre}
            nuevoRol={nuevoRol}
            setNuevoRol={setNuevoRol}
            crearUsuario={crearUsuario}
        />

        {usuarioEditar && (

            <EditarUsuarioCard
                usuarioEditar={usuarioEditar}
                nombreEditar={nombreEditar}
                setNombreEditar={setNombreEditar}
                rolEditar={rolEditar}
                setRolEditar={setRolEditar}
                guardarEdicion={guardarEdicion}
                cancelar={() => setUsuarioEditar(null)}
            />

        )}

        {usuarioPassword && (

            <CambiarPasswordCard
                usuarioPassword={usuarioPassword}
                nuevaPassword={nuevaPassword}
                setNuevaPassword={setNuevaPassword}
                guardarPassword={guardarPassword}
                cancelar={() => setUsuarioPassword(null)}
            />

        )}

        <UsuariosDashboard
            usuarios={usuarios}
        />

        <UsuariosTable
            usuarios={usuarios}
            onCambiarEstado={cambiarEstado}
            onEditar={editarUsuario}
            onCambiarPassword={(usuario) => {
                setUsuarioPassword(usuario);
                setNuevaPassword("");
            }}
        />

    </SistemaLayout>

);
}