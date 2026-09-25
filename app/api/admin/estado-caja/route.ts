import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    exigirPermiso,
} from "@/lib/autorizacion";

import {
    obtenerBloqueoCaja,
} from "@/lib/bloqueo-caja";


export async function GET(
    request: NextRequest
) {

    const autorizacion =
        await exigirPermiso("admin");

    if (autorizacion.respuesta) {
        return autorizacion.respuesta;
    }

    try {

        const caja =
            request.nextUrl.searchParams.get(
                "caja"
            );

        if (
            caja !== "Caja 1" &&
            caja !== "Caja 2"
        ) {

            return NextResponse.json(
                {
                    ok: false,
                    mensaje:
                        "Caja no válida.",
                },
                {
                    status: 400,
                }
            );

        }

        const bloqueo =
            await obtenerBloqueoCaja(
                caja
            );

        return NextResponse.json({
            ok: true,
            caja,
            bloqueo,
        });

    } catch (error) {

        console.error(
            "Error consultando estado de caja:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                mensaje:
                    "No fue posible consultar el estado de la caja.",
            },
            {
                status: 500,
            }
        );
    }
}