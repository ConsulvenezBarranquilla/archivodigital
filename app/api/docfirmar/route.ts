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

        if (sesion.rol !== "admin") {
            return NextResponse.json(
                { ok: false, error: "No tiene permisos para firmar documentos." },
                { status: 403 }
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

        const documentosFirma =
    documentos
        .filter(
            documento =>
                documento.estadoProcesamiento === "PENDIENTE_FIRMA" ||
                documento.estadoProcesamiento === "FIRMADO_PENDIENTE_ENVIO" ||
                documento.estadoProcesamiento === "ENTREGADO" &&
                documento.categoria === "CONSTANCIA_REGISTRO" &&
                Boolean(String(documento.pdfConstanciaFirmada || "").trim()) &&
                Boolean(String(documento.tokenValidacion || "").trim()) &&
                documento.metodoEntrega === "CORREO"
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

    total: documentosFirma.length,

    documentos: documentosFirma,

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
