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

        editableEn: "editar",
    },

    {
    key: "fechaValija",
    label: "Fecha Valija",
    type: "date",
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

    {
        key: "fechaVencimiento",

        label: "Fecha Vencimiento",

        type: "date",

        requerido: true,

        editableEn: "editar",
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

            label: "N° Etiqueta",

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
        key: "correlativoDocumento",

        label: "Correlativo",

        type: "text",

        requerido: true,

        editableEn: "editar",

    },

    {
        key: "fechaEmisionDocumento",

        label: "Fecha Emisión",

        type: "date",

        requerido: true,

        editableEn: "editar",

    },

],

    CARTA_SOLTERIA: [

    {
        key: "correlativoCarta",

        label: "Correlativo",

        type: "text",

        requerido: true,

        editableEn: "editar",

    },

    {
        key: "fechaCarta",

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
        key: "fechaRegistro",

        label: "Fecha Certificado",

        type: "date",

        requerido: true,

    },

    {
        key: "numeroCertificado",

        label: "N° Certificado",

        type: "text",

        requerido: true,

    },

],

    CONSTANCIA_REGISTRO: [

    {
        key: "fechaRegistroConsular",

        label: "Fecha Registro Consular",

        type: "date",

        requerido: true,

        editableEn: "editar",

    },

    {
        key: "numeroRegistro",

        label: "N° Registro",

        type: "text",

        requerido: true,

        editableEn: "editar",

    },

],

    CONSTANCIA_CONSULAR: [

    {
        key: "fechaConstancia",

        label: "Fecha Constancia",

        type: "date",

        requerido: true,

        editableEn: "editar",

    },

    {
        key: "correlativoConstancia",

        label: "Correlativo Constancia",

        type: "text",

        requerido: true,

        editableEn: "editar",

    },

],

    PODER: [

    {
        key: "observaciones",
        label: "Observaciones",
        type: "textarea",
        editableEn: "editar",
    },

],

    AUTORIZACION_VIAJE: [

    {
        key: "origen",

        label: "Origen",

        type: "text",

        requerido: true,
    },

    {
        key: "parentesco",

        label: "Parentesco",

        type: "select",

        opciones: [
            "Madre",
            "Padre",
            "Ambos Padres",
            "Representante Legal",
        ],

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

        type: "select",

        opciones: [
            "Terrestre",
            "Aereo",
            "Fluvial",
        ],
    },

],
}