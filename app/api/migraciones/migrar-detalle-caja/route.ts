import { NextResponse } from "next/server";

import {
    sheets,
    MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {
    return NextResponse.json({
        ok: true,
        mensaje: "Endpoint de migración disponible. Use POST para ejecutar la migración."
    });
}


export async function POST() {

    try {

        const gestionResponse =
            await sheets.spreadsheets.values.get({

                spreadsheetId: MODULO_CAJA_SHEET_ID,

                range: "GestionConsular!A:L",

            });

        const detalleResponse =
            await sheets.spreadsheets.values.get({

                spreadsheetId: MODULO_CAJA_SHEET_ID,

                range: "DetalleCaja!A:H",

            });

        const gestion =
            gestionResponse.data.values || [];

        const detalle =
            detalleResponse.data.values || [];

        //----------------------------------------------------
        // Agrupar Gestión Consular
        //----------------------------------------------------

        //----------------------------------------------------
// Obtener la última versión de cada actuación
//----------------------------------------------------

const ultimaVersion =
    new Map<string, any>();

for (let i = 1; i < gestion.length; i++) {

    const fila = gestion[i];

    const llave =

        `${fila[0]}|${fila[1]}|${fila[11]}`;

    // Siempre reemplaza la anterior.
    // Al finalizar queda la última versión.

    ultimaVersion.set(

        llave,

        fila

    );

}
//----------------------------------------------------
// Agrupar solamente las versiones vigentes
//----------------------------------------------------

const gruposGestion =
    new Map<string, any[]>();

ultimaVersion.forEach((fila) => {

    const estado =

        String(fila[6] ?? "")
            .trim()
            .toUpperCase();

    // Las desvinculadas no cuentan

    if (estado === "DESVINCULADO") {

        return;

    }

    const llave =

        `${fila[0]}|${fila[1]}`;

    if (!gruposGestion.has(llave)) {

        gruposGestion.set(llave, []);

    }

    gruposGestion.get(llave)!.push(fila);

});    
        //----------------------------------------------------
        // Agrupar DetalleCaja
        //----------------------------------------------------

        const gruposDetalle =
            new Map<string, number[]>();

        for (let i = 1; i < detalle.length; i++) {

            const fila = detalle[i];

            const llave =
                `${fila[0]}|${fila[1]}`;

            if (!gruposDetalle.has(llave)) {

                gruposDetalle.set(llave, []);

            }

            gruposDetalle.get(llave)!.push(i);

        }

        //----------------------------------------------------
        // Emparejar
        //----------------------------------------------------

        let actualizados = 0;
        let noEncontrados = 0;
        const diferencias: any[] = [];

        gruposGestion.forEach((listaGC, llave) => {

            const listaDetalle =
                gruposDetalle.get(llave);

            if (!listaDetalle) {

                noEncontrados += listaGC.length;

                return;

            }

            if (listaGC.length !== listaDetalle.length) {

    diferencias.push({

        llave,

        gestion: listaGC.length,

        detalle: listaDetalle.length,

        correlativo: llave.split("|")[0],

        codigo: llave.split("|")[1],

    });

}

            const cantidad =
                Math.min(
                    listaGC.length,
                    listaDetalle.length
                );

            for (let i = 0; i < cantidad; i++) {

                const gc =
                    listaGC[i];

                const filaDetalle =
                    detalle[
                        listaDetalle[i]
                    ];

                filaDetalle[4] =
                    gc[11] ?? "";      // Nº actuación

                filaDetalle[5] =
                    gc[3] ?? "";       // Planilla

                filaDetalle[6] =
                    gc[6] ?? "";       // Estado

                filaDetalle[7] =
    gc[4] ?? "";   // Fecha de la planilla

                actualizados++;

            }

        });

        //----------------------------------------------------
        // Guardar hoja
        //----------------------------------------------------

        await sheets.spreadsheets.values.update({

            spreadsheetId:
                MODULO_CAJA_SHEET_ID,

            range:
                `DetalleCaja!A2:H${detalle.length}`,

            valueInputOption:
                "USER_ENTERED",

            requestBody: {

                values:
                    detalle.slice(1),

            },

        });

        return NextResponse.json({

    ok: true,

    gestion: gestion.length - 1,

    detalle: detalle.length - 1,

    actualizados,

    noEncontrados,

    diferencias,

});

    }

    catch (error: any) {

        return NextResponse.json({

            ok: false,

            error: error.message,

        });

    }

}