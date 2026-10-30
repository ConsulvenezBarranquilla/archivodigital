import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  leerHoja,
} from "@/lib/googleSheets";

import {
  exigirPermiso,
} from "@/lib/autorizacion";

export async function GET(
  req: NextRequest
) {

  try {

    const autorizacion =
      await exigirPermiso("recepcion");

    if (autorizacion.respuesta) {
      return autorizacion.respuesta;
    }

    const documento =
      req.nextUrl.searchParams.get(
        "documento"
      );

    const rows =
      await leerHoja(
        "BitacoraVisitas",
        "A:F"
      );

      
    const buscado =
      documento
        ?.trim()
        .toUpperCase();

    const historial =
  rows
    .slice(1)
    .map((row, index) => ({

  fila: index + 2,

  fecha: row[0] || "",

  documento: row[1] || "",

  cedula: row[2] || "",

  pasaporte: row[3] || "",

  nombre: row[4] || "",

  tipo: row[5] || "",

}))
    .filter((item) => {

  return (

    item.documento
      .trim()
      .toUpperCase() === buscado ||

    item.cedula
      .trim()
      .toUpperCase() === buscado ||

    item.pasaporte
      .trim()
      .toUpperCase() === buscado

  );

})
historial.sort((a, b) =>
  b.fecha.localeCompare(a.fecha)
);
return NextResponse.json({
  ok: true,
  historial,
});

} catch (error: any) {

  return NextResponse.json({
    ok: false,
    error: error.message,
  });

}

}