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

  const [

    usuario,

    setUsuario,

  ] = useState<UsuarioSistema | null>(null);

  const [

    cargando,

    setCargando,

  ] = useState(true);

  useEffect(() => {

    const datos =

      localStorage.getItem(

        "usuarioCaja"

      );

    if (!datos) {

      router.replace(

        "/ingreso"

      );

      return;

    }

    try {

      const u = JSON.parse(datos);

if (!tienePermiso(u.rol, permiso)) {

    router.replace(
      obtenerPaginaInicio(u.rol)
    );

    return;

}

setUsuario(u);

    }

    catch {

      localStorage.removeItem(

        "usuarioCaja"

      );

      router.replace(

        "/ingreso"

      );

      return;

    }

    setCargando(false);

  }, [

    router,
    permiso,

  ]);

  function cerrarSesion() {

  localStorage.removeItem("usuarioCaja");

  router.replace("/ingreso");

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
            onLogout={cerrarSesion}

            
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