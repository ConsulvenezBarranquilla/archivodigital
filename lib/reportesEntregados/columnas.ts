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

    return [

        ...columnasComunes(),

        {

            field: "numeroVisa",

            title: "N° Visa",

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

            field: "fechaEmision",

            title: "Fecha Emisión",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaEmision || "",

        },

        {

            field: "correlativo",

            title: "Correlativo",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.correlativo || "",

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

            field: "fechaEmision",

            title: "Fecha Emisión",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.fechaEmision || "",

        },

        {

            field: "correlativo",

            title: "Correlativo",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.correlativo || "",

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

            title: "Fecha Registro",

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

                row.fechaRegistro || "",

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

            field: "correlativo",

            title: "Correlativo",

            width: "150px",

            align: "center",

            render: (row: any) =>

                row.correlativo || "",

        },

    ];

}
// ==========================================
// PODERES
// ==========================================

function columnasPoderes():

TableColumn<ReporteEntregado>[] {

    return [

        ...columnasComunes(),

        {

            field: "tipoPoder",

            title: "Tipo",

            width: "140px",

            align: "center",

            render: (row: any) =>

                row.tipoPoder || "",

        },

        {

            field: "apoderado",

            title: "Apoderado",

            width: "260px",

            render: (row: any) =>

                row.apoderado || "",

        },

        {

            field: "documentoApoderado",

            title: "Documento",

            width: "170px",

            align: "center",

            render: (row: any) =>

                row.documentoApoderado || "",

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

        ...columnasComunes(),

        {

            field: "autoriza",

            title: "Autoriza",

            width: "240px",

            render: (row: any) =>

                row.autoriza || "",

        },

        {

            field: "parentesco",

            title: "Parentesco",

            width: "140px",

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