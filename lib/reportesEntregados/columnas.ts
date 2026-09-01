// ==========================================
// Reportes Entregados
// Definición de Columnas
// Consulnet Barranquilla
// ==========================================

import {

    TableColumn,

} from "@/components/table/DataTable";

import {

    CategoriaDocumento,

    ReporteEntregado,

} from "@/types/ReporteEntregado";

// ==========================================
// Columnas comunes
// ==========================================

function columnasComunes():

TableColumn<ReporteEntregado>[] {

    return [

        {

            field: "recibo",

            title: "Recibo",

            width: "120px",

            align: "center",

        },

        {

            field: "fechaRecibo",

            title: "Fecha",

            width: "120px",

            align: "center",

        },

        {

            field: "planillaGC",

            title: "Planilla GC",

            width: "140px",

            align: "center",

        },

        {

            field: "solicitante",

            title: "Solicitante",

            width: "260px",

        },

        {

            field: "documento",

            title: "Documento",

            width: "150px",

            align: "center",

        },

    ];

}
// ==========================================
// PASAPORTES
// ==========================================

function columnasPasaportes():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "tipoDocumento",

            title: "Tipo",

            width: "140px",

            align: "center",

            render: (row) =>

                row.tipoDocumento ===

                "PASAPORTE_ADULTO"

                    ? "Adulto"

                    : "NNA",

        },

        {

            field: "titularPasaporte",

            title: "Titular",

            width: "250px",

            render: (row: any) =>

                row.titularPasaporte || "",

        },

        {

            field: "numeroPasaporte",

            title: "N° Pasaporte",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.numeroPasaporte || "",

        },

        {

            field: "fechaValija",

            title: "Fecha Valija",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.fechaValija || "",

        },

        {

            field: "fechaEmision",

            title: "Fecha Emisión",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.fechaEmision || "",

        },

        {

            field: "fechaVencimiento",

            title: "Fecha Vencimiento",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaVencimiento || "",

        },

        {

            field: "observaciones",

            title: "Observaciones",

            width: "320px",

            render: (row) =>

                row.observaciones || "",

        },

    ];

}
// ==========================================
// VISAS
// ==========================================

function columnasVisas():
    TableColumn<ReporteEntregado>[] {

    const columnas = columnasComunes();

    const columnaSolicitante = columnas.find(
        (columna) => columna.field === "solicitante"
    );

    if (columnaSolicitante) {
        columnaSolicitante.render = (row) =>
            row.titularVisa || row.solicitante || "";
    }

    return [

        ...columnas,

        {
            field: "numeroVisa",
            title: "N° Etiqueta",
            width: "150px",
            align: "center",
            render: (row: any) =>
                row.numeroVisa || "",
        },

        {

            field: "tipoVisa",

            title: "Tipo",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.tipoVisa || "",

        },

        {

            field: "nacionalidad",

            title: "Nacionalidad",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.nacionalidad || "",

        },

        {

            field: "vigencia",

            title: "Vigencia",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.vigencia || "",

        },

    ];

}

// ==========================================
// APOSTILLAS
// ==========================================

function columnasApostillas():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "estadoApostilla",

            title: "Estado",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.estadoApostilla || "",

        },

    ];

}

// ==========================================
// FE DE VIDA
// ==========================================

function columnasFeVida():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {
    field: "fechaEmisionDocumento",

    title: "Fecha Emisión",

    width: "150px",

    align: "center",

    render: (row: any) =>
        row.fechaEmisionDocumento || "",
},

{
    field: "correlativoDocumento",

    title: "Correlativo",

    width: "150px",

    align: "center",

    render: (row: any) =>
        row.correlativoDocumento || "",
},

    ];

}

// ==========================================
// CARTA DE SOLTERÍA
// ==========================================

function columnasCartaSolteria():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "fechaCarta",

            title: "Fecha Emisión",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaCarta || "",

        },

        {

            field: "correlativoCarta",

            title: "Correlativo",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.correlativoCarta || "",

        },

    ];

}
// ==========================================
// CERTIFICADOS DE USO
// ==========================================

function columnasCertificadoUso():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "tipoCertificado",

            title: "Tipo",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.tipoCertificado || "",

        },

        {

            field: "fechaRegistro",

            title: "Fecha Certificado",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaRegistro || "",

        },

        {

            field: "numeroCertificado",

            title: "N° Certificado",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.numeroCertificado || "",

        },

    ];

}

// ==========================================
// CONSTANCIA REGISTRO CONSULAR
// ==========================================

function columnasConstanciaRegistro():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "fechaRegistro",

            title: "Fecha Registro",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaRegistroConsular || "",

        },

        {

            field: "numeroRegistro",

            title: "N° Registro",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.numeroRegistro || "",

        },

    ];

}

// ==========================================
// CONSTANCIA CONSULAR
// ==========================================

function columnasConstanciaConsular():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {
            field: "fechaConstancia",
            title: "Fecha Constancia",
            width: "170px",
            align: "center",
            render: (row: any) =>
                row.fechaConstancia || "",
        },

        {
            field: "correlativoConstancia",
            title: "N° Constancia",
            width: "170px",
            align: "center",
            render: (row: any) =>
                row.correlativoConstancia || "",
        },

    ];

}
// ==========================================
// PODERES
// ==========================================

function columnasPoderes(): TableColumn<ReporteEntregado>[] {
    return [
        {
            field: "recibo",
            title: "Recibo",
            width: "100px",
            align: "center",
        },

        {
            field: "fechaRecibo",
            title: "Fecha",
            width: "100px",
            align: "center",
        },

        {
            field: "planillaGC",
            title: "Planilla GC",
            width: "100px",
            align: "center",
        },

        {
    field: "solicitantesPoder",
    key: "poderSolicitantes",
    title: "Solicitante",
    width: "220px",
    whiteSpace: "pre-line",
    render: (row: any) => {
        if (!Array.isArray(row.solicitantesPoder)) {
            return "";
        }

        return row.solicitantesPoder
            .map(
                (persona: any) =>
                    persona?.nombre || ""
            )
            .join("\n");
    },
},

       {
    field: "solicitantesPoder",
    key: "poderSolicitantesDocumento",
    title: "C.I / PAS Solicitante",
    width: "100px",
    align: "center",
    whiteSpace: "pre-line",
    render: (row: any) => {
        if (!Array.isArray(row.solicitantesPoder)) {
            return "";
        }

        return row.solicitantesPoder
            .map(
                (persona: any) =>
                    persona?.documento || ""
            )
            .join("\n");
    },
},

        {
    field: "apoderadosPoder",
    key: "poderApoderados",
    title: "Apoderado",
    width: "240px",
    whiteSpace: "pre-line",
    render: (row: any) => {
        if (!Array.isArray(row.apoderadosPoder)) {
            return "";
        }

        return row.apoderadosPoder
            .map(
                (persona: any) =>
                    persona?.nombre || ""
            )
            .join("\n");
    },
},

        {
    field: "apoderadosPoder",
    key: "poderApoderadosDocumento",
    title: "C.I / PAS Apoderado",
    width: "100px",
    align: "center",
    whiteSpace: "pre-line",
    render: (row: any) => {
        if (!Array.isArray(row.apoderadosPoder)) {
            return "";
        }

        return row.apoderadosPoder
            .map(
                (persona: any) =>
                    persona?.documento || ""
            )
            .join("\n");
    },
},

        {
            field: "estadoPoder",
            title: "Estado",
            width: "140px",
            align: "center",
            render: (row: any) =>
                row.estadoPoder || "",
        },
    ];
}

// ==========================================
// AUTORIZACIÓN DE VIAJE
// ==========================================

function columnasAutorizacionViaje():

TableColumn<ReporteEntregado>[] {

    return [

    {
        field: "recibo",
        title: "Recibo",
        width: "100px",
        align: "center",
    },

    {
        field: "fechaRecibo",
        title: "Fecha",
        width: "100px",
        align: "center",
    },

    {
        field: "planillaGC",
        title: "Planilla GC",
        width: "100px",
        align: "center",
    },

    {
        field: "solicitantesAutorizacion",
        key: "autorizacionSolicitantes",
        title: "Solicitante",
        width: "220px",
        whiteSpace: "pre-line",
        render: (row: any) => {

            if (
                !Array.isArray(
                    row.solicitantesAutorizacion
                )
            ) {
                return "";
            }

            return row.solicitantesAutorizacion
                .map(
                    (persona: any) =>
                        persona?.nombre || ""
                )
                .join("\n");
        },
    },

    {
        field: "solicitantesAutorizacion",
        key: "autorizacionSolicitantesDocumento",
        title: "C.I / PAS Solicitante",
        width: "100px",
        align: "center",
        whiteSpace: "pre-line",
        render: (row: any) => {

            if (
                !Array.isArray(
                    row.solicitantesAutorizacion
                )
            ) {
                return "";
            }

            return row.solicitantesAutorizacion
                .map(
                    (persona: any) =>
                        persona?.documento || ""
                )
                .join("\n");
        },
    },

    {
        field: "origen",
        title: "Origen",
        width: "240px",
        render: (row: any) =>
            row.origen || "",
    },

        {
            field: "parentesco",
            title: "Parentesco",
            width: "160px",
            align: "center",
            render: (row: any) =>
                row.parentesco || "",
        },

        {

            field: "menor",

            title: "Menor",

            width: "240px",

            render: (row: any) =>

                row.menor || "",

        },

        {

            field: "pasaporteMenor",

            title: "Pasaporte",

            width: "160px",

            align: "center",

            render: (row: any) =>

                row.pasaporteMenor || "",

        },

        {

            field: "destino",

            title: "Destino",

            width: "200px",

            render: (row: any) =>

                row.destino || "",

        },

        {

            field: "fechaIda",

            title: "Fecha Ida",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.fechaIda || "",

        },

        {

            field: "fechaRetorno",

            title: "Fecha Retorno",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.fechaRetorno || "",

        },

        {

            field: "acompanante",

            title: "Acompañante",

            width: "240px",

            render: (row: any) =>

                row.acompanante || "",

        },

        {

            field: "pasaporteAcompanante",

            title: "Pasaporte",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.pasaporteAcompanante || "",

        },

        {

            field: "modalidad",

            title: "Modalidad",

            width: "220px",

            align: "center",

            render: (row: any) =>

                row.modalidad || "",

        },

    ];

}

// ==========================================
// OBTENER COLUMNAS
// ==========================================

export function obtenerColumnas(

    categoria: CategoriaDocumento,

    onEntregar?: (

        documento: ReporteEntregado

    ) => void,

    onRegistrarValija?: (

        documento: ReporteEntregado

    ) => void,

): TableColumn<ReporteEntregado>[] {

    let columnas: TableColumn<ReporteEntregado>[];

    switch (categoria) {

        case "PASAPORTES":

            columnas = columnasPasaportes();

            break;

        case "VISA":

            columnas = columnasVisas();

            break;

        case "APOSTILLA":

            columnas = columnasApostillas();

            break;

        case "FE_VIDA":

            columnas = columnasFeVida();

            break;

        case "CARTA_SOLTERIA":

            columnas = columnasCartaSolteria();

            break;

        case "CERTIFICADO_USO":

            columnas = columnasCertificadoUso();

            break;

        case "CONSTANCIA_REGISTRO":

            columnas = columnasConstanciaRegistro();

            break;

        case "CONSTANCIA_CONSULAR":

            columnas = columnasConstanciaConsular();

            break;

        case "PODER":

            columnas = columnasPoderes();

            break;

        case "AUTORIZACION_VIAJE":

            columnas = columnasAutorizacionViaje();

            break;

        default:

            columnas = columnasPasaportes();

    }

    return columnas;

}