import { NextRequest } from "next/server";
import { Buffer } from "buffer";

import { obtenerSesion } from "@/lib/auth";

import {
  generarPdfRecibo,
} from "@/lib/generarPdfRecibo";

export async function POST(
  req: NextRequest
) {

  const sesion =
    await obtenerSesion();

  if (!sesion) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Sesión no válida o expirada.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }

  const datos =
    await req.json();

  const pdf =
    await generarPdfRecibo(
      datos
    );

  return new Response(
    Buffer.from(pdf),
    {
      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="RECIBO_${datos.correlativo.replace("/", "-")}.pdf"`,
      },
    }
  );

}