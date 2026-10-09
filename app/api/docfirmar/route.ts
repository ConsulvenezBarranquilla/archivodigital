import { NextResponse } from "next/server";

import { obtenerSesion } from "@/lib/auth";

import {
    obtenerCaja,
    obtenerGestionConsular,
    obtenerReportesEntregados,
} from "@/lib/googleSheets";

import {
    obtenerDocumentos,
} from "@/lib/reportesEntregados/reportesService";

export async function GET() {

    try {

        const sesion =
            await obtenerSesion();

        if (!sesion) {

            return NextResponse.json(
                {
                    ok: false,
                    error: "No autenticado.",
                },
                {
                    status: 401,
                }
            );

        }

        const [
            gestionConsular,
            caja,
            reportes,
        ] = await Promise.all([

            obtenerGestionConsular(),

            obtenerCaja(),

            obtenerReportesEntregados(),

        ]);

        const data = {

            gestionConsular,

            caja,

            reportes,

        };

        const documentos =
            obtenerDocumentos(
                "CONSTANCIA_REGISTRO",
                data
            );

        const pendientes =
    documentos
        .filter(
            documento =>
                documento.estadoProcesamiento ===
                "PENDIENTE_FIRMA"
        )
        .map(documento => {

            const gestion =
                gestionConsular
                    .slice(1)
                    .find(
                        fila =>
                            String(
                                fila[11] ?? ""
                            ).trim() ===
                            String(
                                documento.id ?? ""
                            ).trim()
                    );

            return {

                ...documento,

                codigoActuacion:
                    String(
                        gestion?.[1] ?? ""
                    )
                        .trim()
                        .toUpperCase(),

            };

        });

return NextResponse.json({

    ok: true,

    total: pendientes.length,

    documentos: pendientes,

});

    }

    catch (error) {

        console.error(
            "Error GET /api/docfirmar:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "No fue posible obtener los documentos pendientes de firma.",
            },
            {
                status: 500,
            }
        );

    }

}