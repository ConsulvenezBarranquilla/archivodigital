import { NextRequest } from "next/server";

import {
  generarExcelReporteVisitas,
} from "@/lib/generarExcelReporteVisitas";

export async function POST(
  req: NextRequest
) {

  try {

    const datos =
      await req.json();

    const excel =
      await generarExcelReporteVisitas(
        datos
      );

    return new Response(
      excel,
      {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            'attachment; filename="ReporteVisitas.xlsx"',
        },
      }
    );

  } catch (error: any) {

    return Response.json({
      ok: false,
      error: error.message,
    });

  }

}