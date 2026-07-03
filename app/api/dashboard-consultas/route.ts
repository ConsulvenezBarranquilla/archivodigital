import { NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

import {
  hoyISO,
} from "@/lib/fechas";

export async function GET() {

  try {

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const visitasResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "BitacoraVisitas!A:G",

      });

    const registroResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,

        range:
          "Respuestas de formulario 1!B:G",

      });
const hoy =
  hoyISO();

const mesActual =
  new Date().getMonth() + 1;

const anioActual =
  new Date().getFullYear();

    const cajaRows =
      cajaResponse.data.values || [];

    const visitasRows =
      visitasResponse.data.values || [];

    const registroRows =
      registroResponse.data.values || [];

       let registrados = 0;
    let venezolanos = 0;
    let extranjeros = 0;

    let usdHoy = 0;
let recibosHoy = 0;
let actuacionesHoy = 0;

let usdMes = 0;
let recibosMes = 0;
let actuacionesMes = 0;

let usdAnio = 0;
let recibosAnio = 0;
let actuacionesAnio = 0;

let visitasHoy = {
  total: 0,
  tramite: 0,
  informacion: 0,
  acompanante: 0,
  institucional: 0,
};

let visitasMes = {
  total: 0,
  tramite: 0,
  informacion: 0,
  acompanante: 0,
  institucional: 0,
};

let visitasAnio = {
  total: 0,
  tramite: 0,
  informacion: 0,
  acompanante: 0,
  institucional: 0,
};

    registroRows
.slice(1)
.forEach((row)=>{

    if(!row[0])
        return;

    registrados++;

    const nacionalidad =
        (row[5] || "")
        .toString()
        .trim()
        .toUpperCase();

    if(
        nacionalidad==="VENEZOLANO"
    ){

        venezolanos++;

    }else{

        extranjeros++;

    }

});
cajaRows
.slice(1)
.forEach((row)=>{

    if(
        row[10] !== "GENERADO"
    ){
        return;
    }

    const fechaTexto =
        row[0] || "";

    if(
        fechaTexto.length < 10
    ){
        return;
    }

    const fechaSolo =
        fechaTexto.substring(0,10);

    const mes =
        Number(
            fechaSolo.substring(5,7)
        );

    const anio =
        Number(
            fechaSolo.substring(0,4)
        );

    const usd =
        Number(row[6] || 0);

    const actuaciones =
        (row[5] || "")
        .split(";")
        .filter(
            (x:string)=>
                x.trim()!==""
        ).length;

    // HOY

    if(
        fechaSolo===hoy
    ){

        usdHoy+=usd;
        recibosHoy++;
        actuacionesHoy+=actuaciones;

    }

    // MES

    if(
        mes===mesActual &&
        anio===anioActual
    ){

        usdMes+=usd;
        recibosMes++;
        actuacionesMes+=actuaciones;

    }

    // AÑO

    if(
        anio===anioActual
    ){

        usdAnio+=usd;
        recibosAnio++;
        actuacionesAnio+=actuaciones;

    }

});
function sumarVisita(
  obj:any,
  tipo:string
){

    obj.total++;

    if(
        tipo==="TRÁMITE" ||
        tipo==="TRAMITE"
    ){

        obj.tramite++;

    }else if(

        tipo==="INFORMACIÓN" ||
        tipo==="INFORMACION"

    ){

        obj.informacion++;

    }else if(

        tipo==="ACOMPAÑANTE"

    ){

        obj.acompanante++;

    }else if(

        tipo==="CITA INSTITUCIONAL"

    ){

        obj.institucional++;

    }

}

visitasRows
.slice(1)
.forEach((row)=>{

    const fechaTexto =
        row[0] || "";

    if(fechaTexto.length < 10){
        return;
    }

    const fechaSolo =
        fechaTexto.substring(0,10);

    const mes =
        Number(
            fechaSolo.substring(5,7)
        );

    const anio =
        Number(
            fechaSolo.substring(0,4)
        );

    const tipo =
        (row[5] || "")
        .toString()
        .trim()
        .toUpperCase();

    if(
        fechaSolo===hoy
    ){

        sumarVisita(
            visitasHoy,
            tipo
        );

    }

    if(
        mes===mesActual &&
        anio===anioActual
    ){

        sumarVisita(
            visitasMes,
            tipo
        );

    }

    if(
        anio===anioActual
    ){

        sumarVisita(
            visitasAnio,
            tipo
        );

    }

});
return NextResponse.json({

    ok:true,

    registroConsular:{

        registrados,
        venezolanos,
        extranjeros,

    },

    usd:{

        hoy:{
            usd:usdHoy,
            recibos:recibosHoy,
            actuaciones:actuacionesHoy,
        },

        mes:{
            usd:usdMes,
            recibos:recibosMes,
            actuaciones:actuacionesMes,
        },

        anio:{
            usd:usdAnio,
            recibos:recibosAnio,
            actuaciones:actuacionesAnio,
        }

    },

    visitas:{

        hoy:visitasHoy,

        mes:visitasMes,

        anio:visitasAnio,

    }

});
} catch (error:any) {

    return NextResponse.json({

        ok:false,

        error:error.message,

    });

}

}
