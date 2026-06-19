import { NextRequest } from "next/server";
import { Buffer } from "buffer";

import {
  generarPdfRecibo,
} from "@/lib/generarPdfRecibo";

export async function POST(
  req: NextRequest
) {

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