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
  limpiandoSesiones,
  setLimpiandoSesiones,
] = useState(false);

const [
  mostrarNuevoUsuario,
  setMostrarNuevoUsuario,
] = useState(false);

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

  useEffect(() => {
    cargarUsuarios();
  }, []);
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

async function cerrarSesionesYLiberarCajas() {

  const confirmar =
    window.confirm(
      "ADVERTENCIA:\n\n" +
      "Esta acción cerrará la sesión de TODOS los usuarios actualmente conectados y liberará Caja 1 y Caja 2.\n\n" +
      "Debe utilizarse únicamente para solucionar cierres de sesión o bloqueos de caja huérfanos.\n\n" +
      "¿Desea continuar?"
    );

  if (!confirmar) {
    return;
  }

  setLimpiandoSesiones(true);

  try {

    const response =
      await fetch(
        "/api/admin/liberar-caja",
        {
          method: "POST",
          credentials: "include",
        }
      );

    const data =
      await response.json();

    if (!response.ok || !data.ok) {

      alert(
        data.mensaje ||
        "No fue posible realizar la limpieza."
      );

      return;

    }

    const cajas =
      data.cajasLiberadas &&
      data.cajasLiberadas.length > 0
        ? data.cajasLiberadas.join(", ")
        : "Ninguna";

    alert(
      "Limpieza administrativa completada.\n\n" +
      "Sesiones cerradas: " +
      data.sesionesCerradas +
      "\n" +
      "Cajas liberadas: " +
      cajas
    );

  } catch {

    alert(
      "No fue posible comunicarse con el servidor."
    );

  } finally {

    setLimpiandoSesiones(false);

  }

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

        <div
    style={{
        width: "100%",
        marginBottom: "22px",
    }}
>

    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: mostrarNuevoUsuario
                ? "14px"
                : "22px",
        }}
    >

        <div
            style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#172554",
            }}
        >
            Acciones administrativas
        </div>

        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
            }}
        >

            <button
                type="button"
                onClick={() =>
                    setMostrarNuevoUsuario(
                        !mostrarNuevoUsuario
                    )
                }
                style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                        mostrarNuevoUsuario
                            ? "#64748b"
                            : "#008c45",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                {mostrarNuevoUsuario
                    ? "Ocultar Nuevo Usuario"
                    : "＋ Nuevo Usuario"}
            </button>

            <button
                type="button"
                onClick={
                    cerrarSesionesYLiberarCajas
                }
                disabled={
                    limpiandoSesiones
                }
                style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border:
                        "1px solid #dc2626",
                    background:
                        limpiandoSesiones
                            ? "#9ca3af"
                            : "#dc2626",
                    color: "white",
                    fontWeight: 600,
                    cursor:
                        limpiandoSesiones
                            ? "not-allowed"
                            : "pointer",
                }}
            >
                {limpiandoSesiones
                    ? "Cerrando sesiones..."
                    : "⚠ Cerrar sesiones y liberar cajas"}
            </button>

        </div>

    </div>

    {mostrarNuevoUsuario && (

        <div
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
            }}
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

        </div>

    )}

</div>

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