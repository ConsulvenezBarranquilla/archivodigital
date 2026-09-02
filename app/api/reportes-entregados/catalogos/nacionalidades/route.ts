import { NextResponse } from "next/server";

import {
    obtenerCatalogoNacionalidades,
} from "@/lib/googleSheets";

export async function GET() {

    try {

        const nacionalidades =
            await obtenerCatalogoNacionalidades();

        return NextResponse.json({
            ok: true,
            nacionalidades,
        });

    }

    catch (error) {

        console.error(
            "Error obteniendo catálogo de nacionalidades:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "No fue posible obtener el catálogo de nacionalidades.",
            },
            {
                status: 500,
            }
        );

    }

}