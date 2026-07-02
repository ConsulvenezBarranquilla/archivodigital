import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const {

      desde,

      hasta,

    } = await req.json();
    const cajaResponse =
  await sheets.spreadsheets.values.get({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "Caja!A:N",

});

const detalleResponse =
  await sheets.spreadsheets.values.get({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "DetalleCaja!A:D",

});

const visitasResponse =
  await sheets.spreadsheets.values.get({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "BitacoraVisitas!A:G",

});
const cajaRows =
  cajaResponse.data.values || [];

const detalleRows =
  detalleResponse.data.values || [];

const visitasRows =
  visitasResponse.data.values || [];

  const fechaDesde =
  new Date(desde);

const fechaHasta =
  new Date(hasta);

fechaHasta.setHours(
  23,
  59,
  59,
  999
);

const recibosValidos =
  new Set<string>();

const actuaciones: Record<
  string,
  {
    nombre: string;
    cantidad: number;
    usd: number;
  }
> = {};

let totalActuaciones = 0;

let totalUSD = 0;

cajaRows
  .slice(1)
  .forEach((row) => {

    if (row[10] !== "GENERADO") {
      return;
    }

    const fecha =
      convertirFecha(row[0]);

    if (!fecha) {
      return;
    }

    if (
      fecha < fechaDesde ||
      fecha > fechaHasta
    ) {
      return;
    }

    recibosValidos.add(
      row[1]
    );

  });

 detalleRows
  .slice(1)
  .forEach((row) => {

    const correlativo =
      row[0];

    if (
      !recibosValidos.has(
        correlativo
      )
    ) {
      return;
    }

    const codigo =
      row[1];

    const nombre =
      row[2];

    const monto =
      Number(
        row[3] || 0
      );

    if (
      !actuaciones[codigo]
    ) {

      actuaciones[codigo] = {

        nombre,

        cantidad: 0,

        usd: 0,

      };

    }

    actuaciones[codigo].cantidad++;

    actuaciones[codigo].usd += monto;

    totalActuaciones++;

    totalUSD += monto;

  });

const visitas = {

  tramite: 0,

  informacion: 0,

  acompanante: 0,

  institucional: 0,

  total: 0,

};

visitasRows
  .slice(1)
  .forEach((row) => {

    const fecha =
      convertirFecha(
        row[0]
      );

    if (!fecha) {
      return;
    }

    if (
      fecha < fechaDesde ||
      fecha > fechaHasta
    ) {
      return;
    }

    visitas.total++;

    const tipo =
      (row[5] || "")
        .toString()
        .trim()
        .toUpperCase();

    if (
      tipo === "TRÁMITE" ||
      tipo === "TRAMITE"
    ) {

      visitas.tramite++;

    } else if (
      tipo === "INFORMACIÓN" ||
      tipo === "INFORMACION"
    ) {

      visitas.informacion++;

    } else if (
      tipo === "ACOMPAÑANTE"
    ) {

      visitas.acompanante++;

    } else if (
      tipo === "CITA INSTITUCIONAL"
    ) {

      visitas.institucional++;

    }

  });
  function convertirFecha(
  texto: string
){

  if(!texto)
    return null;

  const fecha =
    texto.substring(0,10);

  const partes =
    fecha.split("-");

  if(partes.length===3){

    return new Date(

      Number(partes[0]),

      Number(partes[1])-1,

      Number(partes[2])

    );

  }

  const partes2 =
    fecha.split("/");

  if(partes2.length===3){

    return new Date(

      Number(partes2[2]),

      Number(partes2[1])-1,

      Number(partes2[0])

    );

  }

  return null;

}
console.log("================================");
console.log("ACTUACIONES");
console.dir(actuaciones, {
  depth: null,
});

console.log("VISITAS");
console.dir(visitas, {
  depth: null,
});

console.log("================================");
return NextResponse.json({

  ok: true,

  actuaciones,

  totalActuaciones,

  totalUSD,

  visitas,

});

} catch (error: any) {

  return NextResponse.json({

    ok: false,

    error: error.message,

  });

}
}