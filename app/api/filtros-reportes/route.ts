import { NextResponse } from "next/server";

import {
  obtenerActuaciones,
  obtenerUsuariosCaja,
} from "@/lib/googleSheets";

export async function GET() {

  try {

    const actuacionesRows =
      await obtenerActuaciones();

    const usuariosRows =
      await obtenerUsuariosCaja();

    const actuaciones =
  actuacionesRows
    .slice(1)
    .filter(
      (row) => row[1]
    )
    .map(
      (row) => row[1]
    );

    const usuarios =
      usuariosRows
        .slice(1)
        .map(
          (row) => row[2]
        );

    return NextResponse.json({
      ok: true,
      actuaciones,
      usuarios,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}