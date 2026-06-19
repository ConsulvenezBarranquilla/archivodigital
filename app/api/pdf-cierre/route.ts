import { NextRequest } from "next/server";

import { generarPdfCierre }
  from "@/lib/generarPdfCierre";

export async function POST(
  req: NextRequest
) {

  try {

    const datos =
      await req.json();

    const pdfBytes =
      await generarPdfCierre(
        datos
      );

    return new Response(
      Buffer.from(pdfBytes),
      {
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="cierre-${Date.now()}.pdf"`,
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