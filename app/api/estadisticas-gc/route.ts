import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  leerHoja,
  HOJA_CAJA,
} from "@/lib/googleSheets";

import {
  convertirFecha,
  inicioDelDia,
  finDelDia,
  hoyISO,
} from "@/lib/fechas";

/*=========================================
GET
=========================================*/

export async function GET(
  req: NextRequest
) {

  const { searchParams } =
    new URL(req.url);

  const action =
    searchParams.get("action");

  try {

    switch (action) {

      case "dashboard":

        return await obtenerDashboard();

      default:

        return NextResponse.json({

          ok: false,

          error:
            "Acción no válida.",

        });

    }

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}

/*=========================================
POST
=========================================*/

export async function POST(
  req: NextRequest
) {

  const { searchParams } =
    new URL(req.url);

  const action =
    searchParams.get("action");

  try {

    switch (action) {

      case "resumen-actuaciones":

        return await obtenerResumenActuaciones(
          req
        );

      case "reporte-planillas":

        return await obtenerReportePlanillas(
          req
        );

      default:

        return NextResponse.json({

          ok: false,

          error:
            "Acción no válida.",

        });

    }

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}

/*=========================================
FUNCIONES AUXILIARES
=========================================*/

async function leerGestionConsular() {

  return await leerHoja(
    "GestionConsular",
    "A:K"
  );

}

async function leerCaja() {

  return await leerHoja(
    HOJA_CAJA,
    "A:N"
  );

}

async function leerVisitas() {

  return await leerHoja(
    "BitacoraVisitas",
    "A:G"
  );

}

function crearMapaColumnas(
  encabezados: any[]
) {

  const mapa: Record<
    string,
    number
  > = {};

  encabezados.forEach(

    (
      nombre,
      indice
    ) => {

      mapa[
        String(nombre).trim()
      ] = indice;

    }

  );

  return mapa;

}

function valorColumna(

  fila: any[],

  mapa: Record<
    string,
    number
  >,

  columna: string

) {

  const indice =
    mapa[columna];

  if (
    indice === undefined
  ) {

    return "";

  }

  return fila[indice] || "";

}

function crearIndiceCaja(
  cajaRows: any[],
  columnasCaja: Record<string, number>
) {

  const indice =
    new Map<
      string,
      any[]
    >();

  cajaRows
    .slice(1)
    .forEach((row) => {

      const correlativo =
        valorColumna(
          row,
          columnasCaja,
          "Correlativo"
        );

      if (!correlativo)
        return;

      indice.set(
        correlativo,
        row
      );

    });

  return indice;

}

function fechaHoy() {

  return hoyISO();

}

function inicioMes() {

  const hoy =
    hoyISO();

  return `${hoy.substring(0,7)}-01`;

}

function inicioAnio() {

  return `${hoyISO().substring(0,4)}-01-01`;

}

/*=========================================
DASHBOARD
=========================================*/

async function obtenerDashboard() {

  const gestionRows =
    await leerGestionConsular();

  const cajaRows =
    await leerCaja();

  if (
    gestionRows.length <= 1 ||
    cajaRows.length <= 1
  ) {

    return NextResponse.json({

      ok: true,

      hoy: {
        usd: 0,
        actuaciones: 0,
        planillas: 0,
      },

      mes: {
        usd: 0,
        actuaciones: 0,
        planillas: 0,
      },

      anio: {
        usd: 0,
        actuaciones: 0,
        planillas: 0,
      },

    });

  }

  const columnasGC =
    crearMapaColumnas(
      gestionRows[0]
    );

  const columnasCaja =
    crearMapaColumnas(
      cajaRows[0]
    );

  const indiceCaja =
    crearIndiceCaja(
      cajaRows,
      columnasCaja
    );

  const dashboard = {

    hoy: {

      usd: 0,

      actuaciones: 0,

      planillas:
        new Set<string>(),

      correlativos:
        new Set<string>(),

    },

    mes: {

      usd: 0,

      actuaciones: 0,

      planillas:
        new Set<string>(),

      correlativos:
        new Set<string>(),

    },

    anio: {

      usd: 0,

      actuaciones: 0,

      planillas:
        new Set<string>(),

      correlativos:
        new Set<string>(),

    },

  };

  const hoy =
    hoyISO();

  const inicioHoy =
    inicioDelDia(hoy)!;

  const finHoy =
    finDelDia(hoy)!;

  const inicioMesFecha =
    inicioDelDia(
      inicioMes()
    )!;

  const inicioAnioFecha =
    inicioDelDia(
      inicioAnio()
    )!;

  const finAhora =
    finDelDia(hoy)!;

  gestionRows
    .slice(1)
    .forEach((row) => {

      const estado =
        valorColumna(
          row,
          columnasGC,
          "Estado"
        )
          .toString()
          .trim()
          .toUpperCase();

      if (
        estado !==
        "VINCULADO"
      ) {

        return;

      }

      const fecha =
        convertirFecha(

          valorColumna(

            row,

            columnasGC,

            "FechaPlanilla"

          )

        );

      if (!fecha) {

        return;

      }

      const correlativo =
        valorColumna(

          row,

          columnasGC,

          "Correlativo"

        );

      const planilla =
        valorColumna(

          row,

          columnasGC,

          "PlanillaGC"

        );

      const filaCaja =
        indiceCaja.get(
          correlativo
        );

      if (!filaCaja) {

        return;

      }

      const estadoCaja =
        valorColumna(

          filaCaja,

          columnasCaja,

          "Estado"

        )
          .toString()
          .trim()
          .toUpperCase();

      if (
        estadoCaja !==
        "GENERADO"
      ) {

        return;

      }

      const usd =
        Number(

          valorColumna(

            filaCaja,

            columnasCaja,

            "TotalUsd"

          ) || 0

        );

      if (
        fecha >= inicioHoy &&
        fecha <= finHoy
      ) {

        dashboard.hoy.actuaciones++;

        dashboard.hoy.planillas.add(
          planilla
        );

        if (
          !dashboard.hoy.correlativos.has(
            correlativo
          )
        ) {

          dashboard.hoy.usd +=
            usd;

          dashboard.hoy.correlativos.add(
            correlativo
          );

        }

      }

      if (
        fecha >= inicioMesFecha &&
        fecha <= finAhora
      ) {

        dashboard.mes.actuaciones++;

        dashboard.mes.planillas.add(
          planilla
        );

        if (
          !dashboard.mes.correlativos.has(
            correlativo
          )
        ) {

          dashboard.mes.usd +=
            usd;

          dashboard.mes.correlativos.add(
            correlativo
          );

        }

      }

      if (
        fecha >= inicioAnioFecha &&
        fecha <= finAhora
      ) {

        dashboard.anio.actuaciones++;

        dashboard.anio.planillas.add(
          planilla
        );

        if (
          !dashboard.anio.correlativos.has(
            correlativo
          )
        ) {

          dashboard.anio.usd +=
            usd;

          dashboard.anio.correlativos.add(
            correlativo
          );

        }

      }

    });

  return NextResponse.json({

    ok: true,

    hoy: {

      usd:
        dashboard.hoy.usd,

      actuaciones:
        dashboard.hoy.actuaciones,

      planillas:
        dashboard.hoy.planillas
          .size,

    },

    mes: {

      usd:
        dashboard.mes.usd,

      actuaciones:
        dashboard.mes.actuaciones,

      planillas:
        dashboard.mes.planillas
          .size,

    },

    anio: {

      usd:
        dashboard.anio.usd,

      actuaciones:
        dashboard.anio.actuaciones,

      planillas:
        dashboard.anio.planillas
          .size,

    },

  });

}

/*=========================================
RESUMEN ACTUACIONES
=========================================*/

async function obtenerResumenActuaciones(
  req: NextRequest
) {

  const {
    desde,
    hasta,
  } = await req.json();

  const gestionRows =
    await leerGestionConsular();

  const cajaRows =
    await leerCaja();

  const visitasRows =
    await leerVisitas();

  const columnasGC =
    crearMapaColumnas(
      gestionRows[0]
    );

  const columnasCaja =
    crearMapaColumnas(
      cajaRows[0]
    );

  const indiceCaja =
    crearIndiceCaja(
      cajaRows,
      columnasCaja
    );

  const fechaDesde =
    inicioDelDia(desde);

  const fechaHasta =
    finDelDia(hasta);

  if (
    !fechaDesde ||
    !fechaHasta
  ) {

    return NextResponse.json({

      ok:false,

      error:"Fechas inválidas",

    });

  }

  const actuaciones: Record<
    string,
    {
      codigo:string;
      nombre:string;
      cantidad:number;
      usd:number;
      correlativos:Set<string>;
    }
  > = {};

  gestionRows
    .slice(1)
    .forEach((row)=>{

      const estado =
        valorColumna(
          row,
          columnasGC,
          "Estado"
        )
        .toString()
        .trim()
        .toUpperCase();

      if(
        estado!=="VINCULADO"
      ){
        return;
      }

      const fecha =
        convertirFecha(
          valorColumna(
            row,
            columnasGC,
            "FechaPlanilla"
          )
        );

      if(!fecha){
        return;
      }

      if(
        fecha<fechaDesde ||
        fecha>fechaHasta
      ){
        return;
      }

      const codigo =
        valorColumna(
          row,
          columnasGC,
          "Codigo Actuacion"
        );

      const nombre =
        valorColumna(
          row,
          columnasGC,
          "Actuacion"
        );

      const correlativo =
        valorColumna(
          row,
          columnasGC,
          "Correlativo"
        );

      if(
        !actuaciones[codigo]
      ){

        actuaciones[codigo]={

          codigo,

          nombre,

          cantidad:0,

          usd:0,

          correlativos:new Set(),

        };

      }

      actuaciones[codigo]
        .cantidad++;

      const filaCaja =
        indiceCaja.get(
          correlativo
        );

      if(!filaCaja){
        return;
      }

      const estadoCaja =
        valorColumna(
          filaCaja,
          columnasCaja,
          "Estado"
        )
        .toString()
        .trim()
        .toUpperCase();

      if(
        estadoCaja!=="GENERADO"
      ){
        return;
      }

      if(
        !actuaciones[codigo]
          .correlativos
          .has(correlativo)
      ){

        actuaciones[codigo]
          .usd += Number(

            valorColumna(

              filaCaja,

              columnasCaja,

              "TotalUsd"

            ) || 0

          );

        actuaciones[codigo]
          .correlativos
          .add(correlativo);

      }

    });

  const visitas={

    tramite:0,

    informacion:0,

    acompanante:0,

    institucional:0,

    total:0,

  };

  visitasRows
    .slice(1)
    .forEach((row)=>{

      const fecha=
        convertirFecha(
          row[0]
        );

      if(!fecha){
        return;
      }

      if(
        fecha<fechaDesde ||
        fecha>fechaHasta
      ){
        return;
      }

      visitas.total++;

      const tipo=
        (row[5]||"")
        .toString()
        .trim()
        .toUpperCase();

      if(
        tipo==="TRÁMITE" ||
        tipo==="TRAMITE"
      ){

        visitas.tramite++;

      }

      else if(

        tipo==="INFORMACIÓN" ||

        tipo==="INFORMACION"

      ){

        visitas.informacion++;

      }

      else if(
        tipo==="ACOMPAÑANTE"
      ){

        visitas.acompanante++;

      }

      else if(
        tipo==="CITA INSTITUCIONAL"
      ){

        visitas.institucional++;

      }

    });

  const resumen=
    Object.values(
      actuaciones
    ).map((item)=>({

      codigo:item.codigo,

      nombre:item.nombre,

      cantidad:item.cantidad,

      usd:item.usd,

    }));

  return NextResponse.json({

    ok:true,

    actuaciones:resumen,

    visitas,

  });

}

/*=========================================
REPORTE PLANILLAS
=========================================*/

async function obtenerReportePlanillas(
  req: NextRequest
) {

  const {
    desde,
    hasta,
  } = await req.json();

  const gestionRows =
    await leerGestionConsular();

  const cajaRows =
    await leerCaja();

  const columnasGC =
    crearMapaColumnas(
      gestionRows[0]
    );

  const columnasCaja =
    crearMapaColumnas(
      cajaRows[0]
    );

  const indiceCaja =
    crearIndiceCaja(
      cajaRows,
      columnasCaja
    );

  const fechaDesde =
    inicioDelDia(desde);

  const fechaHasta =
    finDelDia(hasta);

  if (
    !fechaDesde ||
    !fechaHasta
  ) {

    return NextResponse.json({

      ok:false,

      error:"Fechas inválidas",

    });

  }

  const planillas: Record<
    string,
    {
      fecha:string;
      planilla:string;
      nombre:string;
      usd:number;
      actuaciones:string[];
      correlativo:string;
    }
  > = {};

  gestionRows
    .slice(1)
    .forEach((row)=>{

      const estado =
        valorColumna(
          row,
          columnasGC,
          "Estado"
        )
        .toString()
        .trim()
        .toUpperCase();

      if(
        estado!=="VINCULADO"
      ){
        return;
      }

      const fecha =
        convertirFecha(
          valorColumna(
            row,
            columnasGC,
            "FechaPlanilla"
          )
        );

      if(!fecha){
        return;
      }

      if(
        fecha<fechaDesde ||
        fecha>fechaHasta
      ){
        return;
      }

      const numeroPlanilla =
        valorColumna(
          row,
          columnasGC,
          "PlanillaGC"
        );

      const correlativo =
        valorColumna(
          row,
          columnasGC,
          "Correlativo"
        );

      const actuacion =
        valorColumna(
          row,
          columnasGC,
          "Actuacion"
        );

      const filaCaja =
        indiceCaja.get(
          correlativo
        );

      if(!filaCaja){
        return;
      }

      const estadoCaja =
        valorColumna(
          filaCaja,
          columnasCaja,
          "Estado"
        )
        .toString()
        .trim()
        .toUpperCase();

      if(
        estadoCaja!=="GENERADO"
      ){
        return;
      }

      if(
        !planillas[
          numeroPlanilla
        ]
      ){

        planillas[
          numeroPlanilla
        ]={

          fecha:
            valorColumna(
              row,
              columnasGC,
              "FechaPlanilla"
            ),

          planilla:
            numeroPlanilla,

          nombre:
            valorColumna(
              filaCaja,
              columnasCaja,
              "Nombre"
            ),

          usd:0,

          actuaciones:[],

          correlativo,

        };

      }

      if(

        !planillas[
          numeroPlanilla
        ]
        .actuaciones
        .includes(
          actuacion
        )

      ){

        planillas[
          numeroPlanilla
        ]
        .actuaciones
        .push(
          actuacion
        );

      }

    });

  Object.values(
    planillas
  ).forEach((item)=>{

    const filaCaja =
      indiceCaja.get(
        item.correlativo
      );

    if(!filaCaja){
      return;
    }

    item.usd =
      Number(

        valorColumna(

          filaCaja,

          columnasCaja,

          "TotalUsd"

        ) || 0

      );

  });

  const reporte =
    Object.values(
      planillas
    )
    .sort((a,b)=>{

      const fa =
        convertirFecha(
          a.fecha
        )?.getTime() || 0;

      const fb =
        convertirFecha(
          b.fecha
        )?.getTime() || 0;

      return fb-fa;

    })
    .map((item)=>({

      fecha:item.fecha,

      planilla:item.planilla,

      nombre:item.nombre,

      actuaciones:
        item.actuaciones.join(
          " | "
        ),

      usd:item.usd,

    }));

  return NextResponse.json({

    ok:true,

    planillas:reporte,

  });

}