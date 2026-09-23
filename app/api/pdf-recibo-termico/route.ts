import { NextRequest, NextResponse } from "next/server";
import { generarPdfReciboTermico } from "@/lib/generarPdfReciboTermico";

export async function POST(req: NextRequest) {
  try {
    const datos = await req.json();

    const pdf =
      await generarPdfReciboTermico(datos);

    const correlativo =
      String(
        datos.correlativo || ""
      ).replace(/\//g, "-");

    return new Response(
      Buffer.from(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="RECIBO_TERMICO_${correlativo}.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error: any) {

    console.error(
      "Error generando recibo térmico:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "No fue posible generar el recibo térmico.",
      },

      {
        status: 500,
      }
    );
  }
}