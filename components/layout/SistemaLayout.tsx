"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Header from "./Header";
import Navigation from "@/components/layout/Navigation";
import { tienePermiso } from "@/lib/permisos";
import { obtenerPaginaInicio } from "@/lib/rutas";

interface SistemaLayoutProps {
  titulo: string;
  permiso: string;
  children: ReactNode;
}

interface UsuarioSistema {
  usuario: string;
  nombre: string;
  rol: string;
  caja?: string;
}

export default function SistemaLayout({
  titulo,
  permiso,
  children,
}: SistemaLayoutProps) {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioSistema | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    let activo = true;

    async function verificarSesion() {
      try {
        const respuesta = await fetch(
          "/api/session",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!respuesta.ok) {
          localStorage.removeItem(
            "usuarioCaja"
          );

          if (activo) {
            router.replace("/ingreso");
          }

          return;
        }

        const data = await respuesta.json();

        if (!data?.autenticado) {
          localStorage.removeItem(
            "usuarioCaja"
          );

          if (activo) {
            router.replace("/ingreso");
          }

          return;
        }

        const usuarioSesion: UsuarioSistema = {
          usuario: String(
            data.usuario ?? ""
          ),

          nombre: String(
            data.nombre ?? ""
          ),

          rol: String(
            data.rol ?? ""
          )
            .trim()
            .toLowerCase(),

          caja:
            data.caja !== undefined &&
            data.caja !== null
              ? String(data.caja).trim()
              : undefined,
        };

        /*
         * La identidad del usuario proviene
         * de la sesión validada por el servidor.
         *
         * Ahora comprobamos autorización:
         * si el rol tiene permiso para este módulo.
         */
        if (
          !tienePermiso(
            usuarioSesion.rol,
            permiso
          )
        ) {
          if (activo) {
            router.replace(
              obtenerPaginaInicio(
                usuarioSesion.rol
              )
            );
          }

          return;
        }

        if (activo) {
          setUsuario(usuarioSesion);
          setCargando(false);
        }
      } catch (error) {
        console.error(
          "Error verificando sesión:",
          error
        );

        localStorage.removeItem(
          "usuarioCaja"
        );

        if (activo) {
          router.replace("/ingreso");
        }
      }
    }

    verificarSesion();

    return () => {
      activo = false;
    };
  }, [router, permiso]);

  async function cerrarSesion() {
    try {
      await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
    } finally {
      /*
       * Durante la migración todavía limpiamos
       * el localStorage antiguo.
       */
      localStorage.removeItem(
        "usuarioCaja"
      );

      router.replace("/ingreso");
    }
  }

  if (
    cargando ||
    !usuario
  ) {
    return null;
  }

  return (
    <main
      className="
        min-h-screen
        bg-slate-200
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          py-6
          px-4
        "
      >
        <div
          className="
            bg-white
            rounded-3xl
            shadow-2xl
            p-8
          "
        >
          <Header
            titulo={titulo}
            nombre={
              usuario.nombre
            }
            onLogout={
              cerrarSesion
            }
          />

          <div className="mb-6">
            <Navigation
              rol={usuario.rol}
            />
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}