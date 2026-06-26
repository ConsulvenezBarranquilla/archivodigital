import { NextRequest, NextResponse } from "next/server";

import {
  obtenerCorrelativos,
  actualizarCorrelativo,
  guardarMovimientoCaja,
  guardarDetalleCaja,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {
  try {

    const body =
      await req.json();

    const {
      ciudadano,
      actuaciones,
      totalUSD,
      usuario,
    } = body;

    const documentoImpreso =
  obtenerDocumentoPrincipal(
    ciudadano.cedula,
    ciudadano.pasaporte,
    ciudadano.nacionalidad
  );

    const anio =
      new Date().getFullYear();

    const correlativos =
      await obtenerCorrelativos();

    let fila = -1;
    let ultimo = 0;

    correlativos.forEach(
      (row, index) => {

        if (
          Number(row[0]) === anio
        ) {

          fila = index + 1;

          ultimo =
            Number(row[1]);

        }

      }
    );

    if (fila === -1) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Año no encontrado en Correlativos",
      });

    }

    const nuevo =
      ultimo + 1;

    await actualizarCorrelativo(
      fila,
      nuevo
    );

    const correlativo =
      `${String(nuevo).padStart(
        4,
        "0"
      )}/${anio}`;
      const fecha =
  new Date().toLocaleString(
    "es-VE"
  );

    await guardarMovimientoCaja([
  fecha,
  correlativo,
  documentoImpreso,
  ciudadano.nombreCompleto,
  ciudadano.correo,
  actuaciones
    .map((a:any) => a.actuacion)
    .join("; "),
  totalUSD,
  usuario.nombre,
  usuario.caja,
  "",
  "GENERADO",

  ciudadano.cedula || "",
  ciudadano.pasaporte || "",
]);
console.log(actuaciones);
for (const actuacion of actuaciones) {

  await guardarDetalleCaja([
    correlativo,
    actuacion.codigo,
    actuacion.actuacion,
    actuacion.monto,
  ]);

}
    

return NextResponse.json({
  ok: true,
  correlativo,
  fecha,
  documento: documentoImpreso,
  nombre: ciudadano.nombreCompleto,
  correo: ciudadano.correo,
  usuario: usuario.nombre,
  actuaciones,
  totalUSD,
});

} catch (error: any) {

  return NextResponse.json({
    ok: false,
    error: error.message,
  });

}
}
