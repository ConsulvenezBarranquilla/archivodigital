import { NextRequest } from "next/server";

import { generarPdfReporteAdmin }
  from "@/lib/generarPdfReporteAdmin";

import { exigirPermiso }
  from "@/lib/autorizacion";

export async function POST(
  req: NextRequest
) {

  const autorizacion =
    await exigirPermiso("admin");

  if (autorizacion.respuesta) {
    return autorizacion.respuesta;
  }

  try {

    const datos =
      await req.json();

    const pdfBytes =
      await generarPdfReporteAdmin(
        datos
      );

    return new Response(
      Buffer.from(pdfBytes),
      {
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="reporte-admin-${Date.now()}.pdf"`,
        },
      }
    );

  } catch (error: any) {

    return Response.json({
      ok: false,
      error:
        error.message,
    });

  }

}