import { NextResponse } from "next/server";

import {
  obtenerSesion,
  UsuarioSesion,
} from "@/lib/auth";

import { tienePermiso } from "@/lib/permisos";

export async function exigirPermiso(
  permiso: string
): Promise<
  | {
      sesion: UsuarioSesion;
      respuesta: null;
    }
  | {
      sesion: null;
      respuesta: NextResponse;
    }
> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return {
      sesion: null,
      respuesta: NextResponse.json(
        {
          ok: false,
          error: "Sesión no válida o expirada.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  if (!tienePermiso(sesion.rol, permiso)) {
    return {
      sesion: null,
      respuesta: NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para realizar esta operación.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    sesion,
    respuesta: null,
  };
}