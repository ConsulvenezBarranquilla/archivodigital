import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { obtenerCaja } from "@/lib/googleSheets";
import { enviarAvisoPasaporteRecibido } from "@/lib/gmail";
import { registrarValija } from "@/lib/reportesEntregados/googleSheetReportes";
import { ReporteEntregado } from "@/types/ReporteEntregado";

export async function POST(request: NextRequest) {
    try {
        const sesion = await obtenerSesion();
        if (!sesion) {
            return NextResponse.json(
                { ok: false, error: "Sesión no válida o expirada." },
                { status: 401 }
            );
        }

        const { fechaValija, documentos }: {
            fechaValija: string;
            documentos: ReporteEntregado[];
        } = await request.json();

        if (!fechaValija) {
            return NextResponse.json(
                { ok: false, error: "Debe indicar la fecha de la valija." },
                { status: 400 }
            );
        }

        if (!Array.isArray(documentos) || documentos.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Debe seleccionar al menos un pasaporte." },
                { status: 400 }
            );
        }

        if (documentos.some((documento) => !documento || documento.categoria !== "PASAPORTES")) {
            return NextResponse.json(
                { ok: false, error: "Solo se pueden registrar pasaportes en una valija." },
                { status: 400 }
            );
        }

        // El correo sale de Caja!E, leído en el servidor, nunca del payload del navegador.
        // Si la lectura auxiliar falla, igual se registra la recepción de la valija.
        let filasCaja: unknown[][] = [];
        try {
            filasCaja = await obtenerCaja();
        } catch {
            console.error("No fue posible consultar los correos de los recibos para la valija.");
        }

        const correoPorRecibo = new Map<string, string>();
        for (const fila of filasCaja.slice(1)) {
            const recibo = String(fila?.[1] ?? "").trim();
            const correo = String(fila?.[4] ?? "").trim();
            if (recibo && correo) correoPorRecibo.set(recibo, correo);
        }

        // Solo el usuario autenticado queda como responsable del registro.
        await registrarValija(sesion.usuario, fechaValija, documentos);

        const pasaportesNotificables = documentos.filter((documento) =>
            documento.tipoDocumento === "PASAPORTE_ADULTO" ||
            documento.tipoDocumento === "PASAPORTE_NNA"
        );
        const destinatarios = new Map<string, string>();
        let pasaportesSinCorreo = 0;

        for (const documento of pasaportesNotificables) {
            const correo = correoPorRecibo.get(String(documento.recibo ?? "").trim());
            if (!correo) {
                pasaportesSinCorreo += 1;
                continue;
            }
            destinatarios.set(correo.toLowerCase(), correo);
        }

        let correosEnviados = 0;
        let correosFallidos = 0;
        const listaDestinatarios = [...destinatarios.values()];

        // Limita a cinco envíos simultáneos para las valijas con varios documentos.
        for (let indice = 0; indice < listaDestinatarios.length; indice += 5) {
            const lote = listaDestinatarios.slice(indice, indice + 5);
            const resultados = await Promise.all(
                lote.map(async (correo) => {
                    try {
                        await enviarAvisoPasaporteRecibido(correo);
                        return true;
                    } catch {
                        return false;
                    }
                })
            );
            correosEnviados += resultados.filter(Boolean).length;
            correosFallidos += resultados.filter((enviado) => !enviado).length;
        }

        return NextResponse.json({
            ok: true,
            mensaje: `Valija registrada. Correos enviados: ${correosEnviados}; pasaportes sin correo: ${pasaportesSinCorreo}; envíos fallidos: ${correosFallidos}.`,
            correosEnviados,
            pasaportesSinCorreo,
            correosFallidos,
        });
    } catch (error) {
        console.error("Registrar Valija:", error);
        return NextResponse.json(
            { ok: false, error: "No fue posible registrar la valija." },
            { status: 500 }
        );
    }
}
