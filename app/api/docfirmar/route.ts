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

        if (sesion.rol !== "admin" && sesion.rol !== "analista") {
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

        const documentos = [
            ...obtenerDocumentos("CONSTANCIA_REGISTRO", data),
            ...obtenerDocumentos("CONSTANCIA_CONSULAR", data),
        ];

        const documentosFirma =
    documentos
        .filter(
            (documento) => {
                const pdfOriginal = documento.categoria === "CONSTANCIA_CONSULAR"
                    ? documento.pdfConstanciaConsular
                    : documento.pdfConstanciaRegistro;
                const esVerificacionIdentidad =
                    documento.categoria === "CONSTANCIA_REGISTRO" &&
                    String(documento.codigoActuacion || "").trim().toUpperCase() === "VER-I";
                const tieneFuente = Boolean(String(pdfOriginal || "").trim()) &&
                    (!esVerificacionIdentidad || Boolean(String(documento.pdfFichaIdentidadSaime || "").trim()));
                const pendiente = ["PENDIENTE_FIRMA", "FIRMADO_PENDIENTE_ENVIO"].includes(documento.estadoProcesamiento);
                const enviado = documento.estadoProcesamiento === "ENTREGADO" &&
                    Boolean(String(documento.pdfConstanciaFirmada || "").trim()) &&
                    Boolean(String(documento.tokenValidacion || "").trim()) &&
                    documento.metodoEntrega === "CORREO";
                return (tieneFuente && pendiente) || enviado;
            }
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

                fechaRecibo: documento.categoria === "CONSTANCIA_CONSULAR"
                    ? String(documento.fechaConstancia || "")
                    : documento.fechaRecibo,

                codigoActuacion:
                    String(
                        gestion?.[1] ?? ""
                    )
                        .trim()
                        .toUpperCase(),

            };

        });

        const documentosVisibles = sesion.rol === "analista"
            ? documentosFirma.filter(documento =>
                documento.estadoProcesamiento === "ENTREGADO" &&
                Boolean(String(documento.pdfConstanciaFirmada || "").trim()) &&
                Boolean(String(documento.tokenValidacion || "").trim()) &&
                documento.metodoEntrega === "CORREO"
            )
            : documentosFirma;

return NextResponse.json({

    ok: true,

    total: documentosVisibles.length,

    rol: sesion.rol,

    documentos: documentosVisibles,

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
