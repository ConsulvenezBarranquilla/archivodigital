import {

    CategoriaDocumento,

} from "@/types/ReporteEntregado";

export type TipoCampo =

    | "text"

    | "date"

    | "textarea"

    | "select";

export interface CampoDocumento {

    key: string;

    label: string;

    type: TipoCampo;

    requerido?: boolean;

    opciones?: string[];

    editableEn?:
        | "editar"
        | "valija"
        | "entrega";

}

export const CONFIG_CAMPOS:

Record<

CategoriaDocumento,

CampoDocumento[]

> = {

    PASAPORTES: [

        {

            key: "titularPasaporte",

            label: "Titular",

            type: "text",

            requerido: true,

            editableEn: "editar",

        },

        {

            key: "observaciones",

            label: "Observaciones",

            type: "textarea",

            editableEn: "editar",

        },

        {

            key: "numeroPasaporte",

            label: "Número de Pasaporte",

            type: "text",

            requerido: true,

            editableEn: "valija",

        },

        {

            key: "fechaValija",

            label: "Fecha Valija",

            type: "date",

            editableEn: "valija",

        },

        {

            key: "fechaEmision",

            label: "Fecha Emisión",

            type: "date",

            requerido: true,

            editableEn: "valija",

        },

        {

            key: "fechaVencimiento",

            label: "Fecha Vencimiento",

            type: "date",

            requerido: true,

            editableEn: "valija",

        },

    ],

    VISA: [

        {

            key: "estado",

            label: "Estado",

            type: "select",

            opciones: [

                "EN PROCESO",

                "APROBADA",

                "RECHAZADA",

            ],

            requerido: true,

            editableEn: "editar",

        },

        {

            key: "numeroVisa",

            label: "Número Visa",

            type: "text",

            requerido: true,

            editableEn: "editar",

        },

        {

            key: "fechaVencimiento",

            label: "Fecha Vencimiento",

            type: "date",

            requerido: true,

            editableEn: "editar",

        },

    ],

    APOSTILLA: [

        {

            key: "estado",

            label: "Estado",

            type: "select",

            opciones: [

                "EN PROCESO",

                "APROBADA",

                "RECHAZADA",

            ],

            requerido: true,

            editableEn: "editar",

        },

    ],

    FE_VIDA: [

        {

            key: "correlativo",

            label: "Correlativo",

            type: "text",

            requerido: true,

            editableEn: "editar",

        },

        {

            key: "fechaEmision",

            label: "Fecha Emisión",

            type: "date",

            requerido: true,

            editableEn: "editar",

        },

    ],

    CARTA_SOLTERIA: [

        {

            key: "correlativo",

            label: "Correlativo",

            type: "text",

            requerido: true,

            editableEn: "editar",

        },

        {

            key: "fechaEmision",

            label: "Fecha Emisión",

            type: "date",

            requerido: true,

            editableEn: "editar",

        },

    ],

    CERTIFICADO_USO: [

        {

            key: "tipoCertificado",

            label: "Tipo Certificado",

            type: "text",

            requerido: true,

        },

        {

            key: "numeroCertificado",

            label: "Número Certificado",

            type: "text",

            requerido: true,

        },

        {

            key: "fechaRegistro",

            label: "Fecha Registro",

            type: "date",

            requerido: true,

        },

    ],

    CONSTANCIA_REGISTRO: [

        {

            key: "numeroRegistro",

            label: "Número Registro",

            type: "text",

            requerido: true,

        },

        {

            key: "fechaRegistro",

            label: "Fecha Registro",

            type: "date",

            requerido: true,

        },

    ],

    CONSTANCIA_CONSULAR: [

        {

            key: "correlativo",

            label: "Correlativo",

            type: "text",

            requerido: true,

        },

        {

            key: "fechaConstancia",

            label: "Fecha Constancia",

            type: "date",

            requerido: true,

        },

    ],

    PODER: [

        {

            key: "tipoPoder",

            label: "Tipo Poder",

            type: "text",

            requerido: true,

        },

        {

            key: "apoderado",

            label: "Apoderado",

            type: "text",

            requerido: true,

        },

        {

            key: "documentoApoderado",

            label: "Documento Apoderado",

            type: "text",

            requerido: true,

        },

        {

            key: "estadoPoder",

            label: "Estado",

            type: "text",

            requerido: true,

        },

        {

            key: "observaciones",

            label: "Observaciones",

            type: "textarea",

        },

    ],

    AUTORIZACION_VIAJE: [

        {

            key: "autoriza",

            label: "Autoriza",

            type: "text",

            requerido: true,

        },

        {

            key: "parentesco",

            label: "Parentesco",

            type: "text",

            requerido: true,

        },

        {

            key: "menor",

            label: "Menor",

            type: "text",

            requerido: true,

        },

        {

            key: "pasaporteMenor",

            label: "Pasaporte Menor",

            type: "text",

        },

        {

            key: "destino",

            label: "Destino",

            type: "text",

        },

        {

            key: "fechaIda",

            label: "Fecha Ida",

            type: "date",

        },

        {

            key: "fechaRetorno",

            label: "Fecha Retorno",

            type: "date",

        },

        {

            key: "acompanante",

            label: "Acompañante",

            type: "text",

        },

        {

            key: "pasaporteAcompanante",

            label: "Pasaporte Acompañante",

            type: "text",

        },

        {

            key: "modalidad",

            label: "Modalidad",

            type: "text",

        },

    ],

};