import { NextRequest, NextResponse } from "next/server";

import {
    sheets,
    MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

import {
    obtenerConfiguracionLibro,
    obtenerMovimientosManuales,
} from "@/lib/services/LibroDiario/libroDiarioService";

import {
    construirLibroDiario,
} from "@/lib/services/LibroDiario/libroDiarioCalculos";

import {
    generarExcelLibroDiario,
} from "@/lib/reportes/excelLibroDiario";

export async function POST(
    req: NextRequest
) {

    try {

        const {

            fechaInicial,

            fechaFinal,
            
        } = await req.json();

        const periodo = fechaInicial.substring(0, 7);

        const configuracion =
            await obtenerConfiguracionLibro();

        const movimientos =
            await obtenerMovimientosManuales();

        const cajaResponse =
            await sheets.spreadsheets.values.get({

                spreadsheetId: MODULO_CAJA_SHEET_ID,

                range: "Caja!A:N",

            });

        const gestionResponse =
            await sheets.spreadsheets.values.get({

                spreadsheetId: MODULO_CAJA_SHEET_ID,

                range: "GestionConsular!A:L",

            });

        const caja =
            cajaResponse.data.values || [];

        const gestion =
            gestionResponse.data.values || [];

        const libro =
    construirLibroDiario(

        periodo,

        configuracion,

        gestion,

        caja,

        movimientos,

        fechaInicial,

        fechaFinal

    );

        const excel =
            await generarExcelLibroDiario(

                libro,

                fechaInicial,

                fechaFinal,
                
            );

        const nombreArchivo =
            `LibroDiario_${fechaInicial}_${fechaFinal}.xlsx`;

        return new NextResponse(excel, {

            headers: {

                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

                "Content-Disposition":
                    `attachment; filename="${nombreArchivo}"`,

            },

        });

    }

    catch (error: any) {

        return NextResponse.json(

            {

                ok: false,

                error: error.message,

            },

            {

                status: 500,

            }

        );

    }

}