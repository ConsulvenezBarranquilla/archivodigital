// ==========================================
// Reportes Entregados
// Servicio Principal
// Consulnet Barranquilla
// ==========================================

import {

    CategoriaDocumento,

    TipoDocumento,
    
    ReporteEntregado,

} from "@/types/ReporteEntregado";

// ==========================================
// Datos recibidos desde la API
// ==========================================

export interface ReportesData {

    gestionConsular: any[];

    caja: any[];

    reportes: any[];

}

// ==========================================
// Convierte un valor a texto seguro
// ==========================================

function texto(

    valor: unknown

): string {

    return String(

        valor ?? ""

    ).trim();

}

// ==========================================
// Convierte un valor a fecha ISO
// ==========================================

function fecha(

    valor: unknown

): string {

    return texto(valor)

        .substring(0,10);

}

// ==========================================
// Busca un registro existente
// ==========================================

function buscarReporte(
    id: string,
    reportes: any[]
) {

    return reportes.find(

        fila =>

            texto(fila[0]) === id

    );

}
// ==========================================
// Copiar datos de ReportesEntregados
// ==========================================

function aplicarDatosReporte(

    documento: ReporteEntregado,

    reporte?: any[]

): ReporteEntregado {

    if (!reporte) {

        return documento;

    }

    documento.entregado =
        texto(reporte[9]) === "SI";

    documento.fechaEntrega =
        texto(reporte[10]);

    documento.entregadoPor =
        texto(reporte[11]);

    documento.observaciones =
        texto(reporte[12]);

    documento.titularPasaporte =
        texto(reporte[13]);

    documento.numeroPasaporte =
        texto(reporte[14]);

    documento.fechaValija =
        texto(reporte[15]);

    documento.fechaEmision =
        texto(reporte[16]);

    documento.fechaVencimiento =
        texto(reporte[17]);

    documento.numeroVisa =
        texto(reporte[18]);

    documento.tipoVisa =
        texto(reporte[19]);

    documento.nacionalidad =
        texto(reporte[20]);

    documento.vigencia =
    texto(reporte[21]);

    documento.estadoApostilla =
        texto(reporte[22]);

    documento.fechaEmision =
    texto(reporte[23]);

documento.correlativo =
    texto(reporte[24]);

    documento.fechaEmision =
    texto(reporte[25]);

documento.correlativo =
    texto(reporte[26]);

    documento.tipoCertificado =
        texto(reporte[27]);

    documento.fechaRegistro =
        texto(reporte[28]);

    documento.numeroCertificado =
        texto(reporte[29]);

    documento.numeroRegistro =
        texto(reporte[30]);

    documento.fechaRegistro =
    texto(reporte[31]);

    documento.fechaConstancia =
        texto(reporte[32]);

    documento.correlativo =
    texto(reporte[33]);

    documento.tipoPoder =
        texto(reporte[34]);

    documento.apoderado =
        texto(reporte[35]);

    documento.documentoApoderado =
        texto(reporte[36]);

    documento.estadoPoder =
        texto(reporte[37]);

    documento.autoriza =
        texto(reporte[38]);

    documento.parentesco =
        texto(reporte[39]);

    documento.menor =
        texto(reporte[40]);

    documento.pasaporteMenor =
        texto(reporte[41]);

    documento.destino =
        texto(reporte[42]);

    documento.fechaIda =
        texto(reporte[43]);

    documento.fechaRetorno =
        texto(reporte[44]);

    documento.acompanante =
        texto(reporte[45]);

    documento.pasaporteAcompanante =
        texto(reporte[46]);

    documento.modalidad =
        texto(reporte[47]);

    return documento;

}
// ==========================================
// PASAPORTES
// ==========================================

function obtenerPasaportes(

    data: ReportesData

): ReporteEntregado[] {

    const resultado: ReporteEntregado[] = [];

    const cajaMap = new Map<string, any>();

    // --------------------------------------
    // Indexar Caja por correlativo
    // --------------------------------------

    data.caja
        .slice(1)
        .forEach((fila) => {

            cajaMap.set(

                texto(fila[1]),

                fila

            );

        });

    // --------------------------------------
    // Recorrer Gestión Consular
    // --------------------------------------

    data.gestionConsular
        .slice(1)
        .forEach((gc) => {

            const correlativo =

                texto(gc[0]);

            const planilla =

                texto(gc[3]);

            const estadoGC =

                texto(gc[6])

                    .toUpperCase();

            // Solo vinculadas

            if (

                estadoGC !== "VINCULADO"

            ) {

                return;

            }

            const recibo =

                cajaMap.get(

                    correlativo

                );

            if (!recibo) {

                return;

            }

            // Solo recibos generados

            const estadoCaja =

                texto(recibo[10])

                    .toUpperCase();

            if (

                estadoCaja !== "GENERADO"

            ) {

                return;

            }

            // ----------------------------------
            // Buscar actuación
            // ----------------------------------

            const actuacion =
    texto(gc[2]).toUpperCase();

if (

    !actuacion.includes(

        "PASAPORTE"

    )

) {

    return;

}

            // ----------------------------------
            // Buscar datos ya registrados
            // ----------------------------------

            const id = texto(gc[11]);

const reporte = buscarReporte(
    id,
    data.reportes
);
if (reporte) {

    console.log("REPORTE ENCONTRADO");

    console.table(reporte);

}
            // ----------------------------------
            // Tipo de documento
            // ----------------------------------

            const tipoDocumento =

                actuacion.includes("NNA")

                    ? "PASAPORTE_NNA"

                    : "PASAPORTE_ADULTO";

            // ----------------------------------
            // Construcción del registro
            // ----------------------------------

            const documento: ReporteEntregado = {

    id,

    categoria: "PASAPORTES",

    tipoDocumento,

    recibo: correlativo,

    fechaRecibo: fecha(recibo[0]),

    planillaGC: planilla,

    solicitante: texto(recibo[3]),

    documento: texto(recibo[2]),

    estado: estadoCaja,

    entregado: false,

};

resultado.push(

    aplicarDatosReporte(

        documento,

        reporte

    )

);

        });

    return resultado;

}
// ==========================================
// VISAS
// ==========================================

function obtenerVisas(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "VISA",

        "VISA",
"VISA"
    );

}

// ==========================================
// APOSTILLAS
// ==========================================

function obtenerApostillas(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "APOSTILLA",

        "APOSTILLA",

        "APOSTILLA"

    );

}

// ==========================================
// FE DE VIDA
// ==========================================

function obtenerFeVida(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "FE_VIDA",

        "FE_VIDA",

        "FE DE VIDA"

    );

}

// ==========================================
// CARTA DE SOLTERÍA
// ==========================================

function obtenerCartaSolteria(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "CARTA_SOLTERIA",

        "CARTA_SOLTERIA",

        "CARTA DE SOLTER"

    );

}

// ==========================================
// Función genérica
// ==========================================

function obtenerDocumentosPorTipo(

    data: ReportesData,

    categoria: CategoriaDocumento,

    tipoDocumento: TipoDocumento,

    textoBusqueda: string

): ReporteEntregado[] {

    const resultado: ReporteEntregado[] = [];

    const cajaMap = new Map<string, any>();

    data.caja
        .slice(1)
        .forEach((fila) => {

            cajaMap.set(

                texto(fila[1]),

                fila

            );

        });

    data.gestionConsular
        .slice(1)
        .forEach((gc) => {

            const correlativo =

                texto(gc[0]);

            const planilla =

                texto(gc[3]);

            const estadoGC =

                texto(gc[6]).toUpperCase();

            if (

                estadoGC !== "VINCULADO"

            ) {

                return;

            }

            const recibo =

                cajaMap.get(

                    correlativo

                );

            if (!recibo) {

                return;

            }

            const estadoCaja =

                texto(recibo[10]).toUpperCase();

            if (

                estadoCaja !== "GENERADO"

            ) {

                return;

            }

            const actuacion =
    texto(gc[2]).toUpperCase();

if (

    !actuacion.includes(

        textoBusqueda

    )

) {

    return;

}

            const id = texto(gc[11]);

const reporte = buscarReporte(
    id,
    data.reportes
);

            const documento: ReporteEntregado = {

    id,

    categoria,

    tipoDocumento,

    recibo: correlativo,

    fechaRecibo: fecha(recibo[0]),

    planillaGC: planilla,

    solicitante: texto(recibo[3]),

    documento: texto(recibo[2]),

    estado: estadoCaja,

    entregado: false,

};

resultado.push(

    aplicarDatosReporte(

        documento,

        reporte

    )

);

        });

    return resultado;

}
// ==========================================
// CERTIFICADOS DE USO
// ==========================================

function obtenerCertificadosUso(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "CERTIFICADO_USO",

        "CERTIFICADO_USO",

        "CERTIFICADO"

    );

}

// ==========================================
// CONSTANCIA REGISTRO CONSULAR
// ==========================================

function obtenerConstanciasRegistro(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "CONSTANCIA_REGISTRO",

        "CONSTANCIA_REGISTRO",

        "REGISTRO CONSULAR"

    );

}

// ==========================================
// CONSTANCIA CONSULAR
// ==========================================

function obtenerConstanciasConsulares(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "CONSTANCIA_CONSULAR",

        "CONSTANCIA_CONSULAR",

        "CONSTANCIA CONSULAR"

    );

}

// ==========================================
// PODERES
// ==========================================

function obtenerPoderes(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "PODER",

        "PODER",

        "PODER"

    );

}

// ==========================================
// AUTORIZACIONES DE VIAJE
// ==========================================

function obtenerAutorizaciones(

    data: ReportesData

): ReporteEntregado[] {

    return obtenerDocumentosPorTipo(

        data,

        "AUTORIZACION_VIAJE",

        "AUTORIZACION_VIAJE",

        "AUTORIZACIÓN DE VIAJE"

    );

}
// ==========================================
// Punto de entrada del servicio
// ==========================================

export function obtenerDocumentos(

    categoria: CategoriaDocumento,

    data: ReportesData

): ReporteEntregado[] {

    switch (categoria) {

        case "PASAPORTES":

            return obtenerPasaportes(

                data

            );

        case "VISA":

            return obtenerVisas(

                data

            );

        case "APOSTILLA":

            return obtenerApostillas(

                data

            );

        case "FE_VIDA":

            return obtenerFeVida(

                data

            );

        case "CARTA_SOLTERIA":

            return obtenerCartaSolteria(

                data

            );

        case "CERTIFICADO_USO":

            return obtenerCertificadosUso(

                data

            );

        case "CONSTANCIA_REGISTRO":

            return obtenerConstanciasRegistro(

                data

            );

        case "CONSTANCIA_CONSULAR":

            return obtenerConstanciasConsulares(

                data

            );

        case "PODER":

            return obtenerPoderes(

                data

            );

        case "AUTORIZACION_VIAJE":

            return obtenerAutorizaciones(

                data

            );

        default:

            return [];

    }

}