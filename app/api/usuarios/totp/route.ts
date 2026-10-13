import { NextResponse } from "next/server";
import crypto from "crypto";

import { obtenerSesion } from "@/lib/auth";

import {
  generarSecretoTOTP,
  generarURI_TOTP,
  cifrarSecretoTOTP,
  descifrarSecretoTOTP,
  verificarCodigoTOTP,
} from "@/lib/totp";

import {
  obtenerSeguridadUsuario,
  guardarSeguridadUsuario,
  desactivarTOTPUsuario,
} from "@/lib/seguridadUsuarios";

export async function GET() {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autenticado",
        },
        { status: 401 }
      );
    }

    const seguridad = await obtenerSeguridadUsuario(
      sesion.usuario
    );

    return NextResponse.json({
      ok: true,
      configurado:
        seguridad?.totpConfigurado === "SI",
    });
  } catch (error) {
    console.error("Error GET /api/usuarios/totp:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Error consultando configuración TOTP",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autenticado",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const accion = String(body?.accion || "");

    if (accion === "iniciar") {
      const existente = await obtenerSeguridadUsuario(
        sesion.usuario
      );

      if (existente?.totpConfigurado === "SI") {
        return NextResponse.json(
          {
            ok: false,
            error: "El autenticador ya está configurado",
          },
          { status: 400 }
        );
      }

      const secreto = generarSecretoTOTP();

      const uri = generarURI_TOTP(
        sesion.usuario,
        secreto
      );

      const secretoTemporal = cifrarSecretoTOTP(
        secreto
      );

      return NextResponse.json({
        ok: true,
        uri,
        secreto: secreto,
        secretoCifrado: secretoTemporal,
      });
    }

    if (accion === "confirmar") {
      const secreto = String(
        body?.secreto || ""
      ).trim();

      const codigo = String(
        body?.codigo || ""
      ).trim();

      const secretoCifrado = String(
        body?.secretoCifrado || ""
      ).trim();

      if (
        !secreto ||
        !codigo ||
        !secretoCifrado
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Faltan datos para confirmar el autenticador",
          },
          { status: 400 }
        );
      }

      const valido = await verificarCodigoTOTP(
        secreto,
        codigo
      );

      if (!valido) {
        return NextResponse.json(
          {
            ok: false,
            error: "Código de Google Authenticator incorrecto",
          },
          { status: 400 }
        );
      }

      let secretoCifradoValido = false;
      try {
        secretoCifradoValido = descifrarSecretoTOTP(secretoCifrado) === secreto;
      } catch {
        secretoCifradoValido = false;
      }

      if (!secretoCifradoValido) {
        return NextResponse.json(
          {
            ok: false,
            error: "No se pudo confirmar la configuración del autenticador. Iníciela nuevamente.",
          },
          { status: 400 }
        );
      }

      await guardarSeguridadUsuario(
        sesion.usuario,
        secretoCifrado,
        "SI"
      );

      return NextResponse.json({
        ok: true,
        configurado: true,
      });
    }

    if (accion === "desactivar") {
      await desactivarTOTPUsuario(
        sesion.usuario
      );

      return NextResponse.json({
        ok: true,
        configurado: false,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Acción no válida",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error POST /api/usuarios/totp:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Error procesando configuración TOTP",
      },
      { status: 500 }
    );
  }
}
