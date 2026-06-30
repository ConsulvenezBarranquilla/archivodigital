import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {
      tipo,
      desde,
      hasta,
    } = await req.json();

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "BitacoraVisitas!A:G",

      });

    const filas =
      response.data.values || [];
console.log("===== REPORTE VISITAS =====");

console.log("TIPO:", tipo);

console.log("DESDE:", desde);

console.log("HASTA:", hasta);

console.log("TOTAL FILAS:", filas.length);

console.log("PRIMERAS 5 FECHAS:");

filas.slice(1, 6).forEach((fila, i) => {

  console.log(i + 1, fila[0]);

});
    const hoy = new Intl.DateTimeFormat(
  "sv-SE",
  {
    timeZone: "America/Bogota",
  }
).format(new Date());

const visitasFiltradas = filas.slice(1).filter((fila) => {

  const fechaRegistro =
    (fila[0] || "").substring(0, 10);

  console.log(
    "Fila:",
    fila[0],
    "| FechaRegistro:",
    fechaRegistro,
    "| Hoy:",
    hoy
  );

  if (tipo === "diario") {

    const coincide = fechaRegistro === hoy;

    console.log("Coincide:", coincide);

    return coincide;

  }

  if (tipo === "rango") {

    console.log(
      "Comparando rango:",
      fechaRegistro,
      desde,
      hasta
    );

    return (
      fechaRegistro >= desde &&
      fechaRegistro <= hasta
    );

  }

  return true;

});

  const detalle = visitasFiltradas.map((fila) => {

  const cedula =
    fila[2] || "";

  const pasaporte =
    fila[3] || "";

  const nacionalidad =
    fila[6] || "";

  const fecha = new Date(fila[0]);

  const fechaMostrar =
    fecha.toLocaleString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }
    );

  return {

    fechaISO: fila[0],

    fecha: fechaMostrar,

    documento:
      obtenerDocumentoPrincipal(
        cedula,
        pasaporte,
        nacionalidad
      ),

    nombre:
      fila[4] || "",

    tipo:
      fila[5] || "",

  };

});

console.log("VISITAS FILTRADAS:", visitasFiltradas);

console.log("DETALLE:", detalle);

console.log("TOTAL DETALLE:", detalle.length);

const resumenMap =
  new Map<
    string,
    number
  >();

detalle.forEach((item) => {

  resumenMap.set(

    item.tipo,

    (resumenMap.get(item.tipo) || 0) + 1

  );

});

const resumen =

Array.from(
  resumenMap.entries()
)

.map(

  ([tipo, cantidad]) => ({

    tipo,

    cantidad,

  })

)

.sort(

  (a, b) =>

    b.cantidad - a.cantidad

);

    return NextResponse.json({

  ok: true,

  titulo:

  tipo === "diario"

    ? "REPORTE DIARIO DE VISITAS"

    : `REPORTE DE VISITAS (${desde} al ${hasta})`,

  desde,

  hasta,

  total:

    detalle.length,

  detalle,

  resumen,

});
console.log("VISITAS FILTRADAS:", visitasFiltradas.length);
  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}