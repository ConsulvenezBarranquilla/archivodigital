// ==========================================
// VALIDACIÓN PÚBLICA DE DOCUMENTOS
// Consulnet Barranquilla
// ==========================================

import {
    obtenerCaja,
    obtenerGestionConsular,
    obtenerReportesEntregados,
} from "@/lib/googleSheets";

// ==========================================
// TIPOS
// ==========================================

export type TipoValidacion =
    | "enseres"
    | "solteria"
    | "registro"
    | "constancia"
    | "fevida"
    | "pasaporte"
    | "poder"
    | "autorizacion";

export interface ResultadoValidacion {
    encontrado: boolean;
    datos?: Record<string, string>;
    mensaje?: string;
}

// ==========================================
// TIPOS HISTÓRICOS
// ==========================================
//
// Estas son las hojas que todavía contienen
// documentos anteriores a la implementación
// del sistema nuevo.
//
// Poder y Autorización utilizan la misma
// hoja histórica: "notarial".
// ==========================================

type TipoValidacionHistorica =
    | "enseres"
    | "solteria"
    | "registro"
    | "constancia"
    | "notarial";

// ==========================================
// HOJAS HISTÓRICAS
// ==========================================
//
// Se mantienen provisionalmente para registros
// anteriores a la implementación del sistema.
//
// IMPORTANTE:
//
// Estas URLs solamente se consultan desde el
// servidor, nunca desde app/page.tsx.
// ==========================================

const HOJAS_HISTORICAS: Record<
    TipoValidacionHistorica,
    string
> = {
    enseres:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSK5nMNWj_CoeVR7-HmNKlsjlckfs1Y6JR1eAbEzJEXn8B9CXmZZqrbbp9nu6BgmTZe-xPJ6gN2nNA/pub?output=csv",

    solteria:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTaH26wNEDdp8aPxopHOjGzP26jjq-smL2MeaDfQFiZ-LOiQpnH-UEPl5iuk5y4Ut7kKaza1jS7jLuv/pub?output=csv",

    registro:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vToHq90AEjPQXsOs3sxTmT3DK7ZtRKJh6uNv0L1ungd-lFAj4TS5l_Z3oRxT5usExlDQXmrdYpLp1fm/pub?output=csv",

    constancia:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8uKGMH_Nfwkkl3uRQQegzLs5xygoIctgFjsu004akpinfBdfo9Thczw6lCPttcwcYz9wyUE-mdlEM/pub?output=csv",

    notarial:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvUgpdQIdHzI09BDg5m0sBgKZKckGxtqx2N__sKvDmMxIRzANZ_fS7SFj3hsK6keulj4-3UMD_GUYK/pub?output=csv",
};

// ==========================================
// UTILIDADES
// ==========================================

function texto(valor: unknown): string {
    return String(valor ?? "").trim();
}

function capitalizarNombre(valor: unknown): string {
    return texto(valor)
        .toLowerCase()
        .replace(
            /(^|[\s\-'])(\p{L})/gu,
            (_, separador, letra) =>
                `${separador}${letra.toUpperCase()}`
        );
}

function convertirTipoCertificado(valor: unknown): string {
    const codigo =
        texto(valor).toUpperCase();

    if (codigo === "CERT-V") {
        return "Vehículo";
    }

    if (codigo === "CERT-E") {
        return "Enseres";
    }

    if (codigo === "CERT-VE") {
        return "Vehículo y Enseres";
    }

    return texto(valor);
}

function convertirTipoPoder(valor: unknown): string {
    const codigo =
        texto(valor).toUpperCase();

    if (codigo === "PODR-E") {
        return "Poder Especial";
    }

    if (codigo === "PODR-G") {
        return "Poder General";
    }

    return texto(valor);
}

function formatearNombresResultado(
    datos: Record<string, string>
): Record<string, string> {
    const resultado = { ...datos };

    Object.keys(resultado).forEach(clave => {
        const claveNormalizada = normalizar(clave);

        if (
            claveNormalizada.includes("nombre") ||
            claveNormalizada.includes("solicitante") ||
            claveNormalizada.includes("apoderado") ||
            claveNormalizada.includes("titular") ||
            claveNormalizada === "menor"
        ) {
            resultado[clave] =
                capitalizarNombre(resultado[clave]);
        }
    });

    return resultado;
}

function normalizar(valor: unknown): string {
    return texto(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// ==========================================
// FECHA Y HORA DE VALIDACIÓN
// ==========================================

export function obtenerFechaHoraValidacion(): string {
    const ahora = new Date();

    return ahora.toLocaleString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// ==========================================
// PARSER CSV
// ==========================================
//
// No utilizamos split(",") simple porque algunos
// campos pueden contener comas dentro de comillas.
// ==========================================

function parsearCSV(textoCSV: string): string[][] {
    const filas: string[][] = [];

    let fila: string[] = [];
    let campo = "";
    let dentroComillas = false;

    for (let i = 0; i < textoCSV.length; i++) {
        const caracter = textoCSV[i];
        const siguiente = textoCSV[i + 1];

        if (caracter === '"') {
            if (
                dentroComillas &&
                siguiente === '"'
            ) {
                campo += '"';
                i++;
            } else {
                dentroComillas = !dentroComillas;
            }

            continue;
        }

        if (
            caracter === "," &&
            !dentroComillas
        ) {
            fila.push(campo.trim());
            campo = "";
            continue;
        }

        if (
            (
                caracter === "\n" ||
                caracter === "\r"
            ) &&
            !dentroComillas
        ) {
            if (
                caracter === "\r" &&
                siguiente === "\n"
            ) {
                i++;
            }

            fila.push(campo.trim());
            campo = "";

            if (
                fila.some(
                    valor => valor !== ""
                )
            ) {
                filas.push(fila);
            }

            fila = [];

            continue;
        }

        campo += caracter;
    }

    fila.push(campo.trim());

    if (
        fila.some(
            valor => valor !== ""
        )
    ) {
        filas.push(fila);
    }

    return filas;
}

// ==========================================
// CONSULTAR HOJA HISTÓRICA
// ==========================================

async function consultarHojaHistorica(
    tipo: TipoValidacionHistorica,
    codigo: string
): Promise<Record<string, string> | null> {

    const url =
        HOJAS_HISTORICAS[tipo];

    if (!url) {
        return null;
    }

    const response = await fetch(
        url,
        {
            method: "GET",
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error(
            "No fue posible consultar la base histórica."
        );
    }

    const contenido =
        await response.text();

    const filas =
        parsearCSV(contenido);

    if (filas.length < 2) {
        return null;
    }

    const encabezados =
        filas[0];

    const codigoNormalizado =
        normalizar(codigo);

    const encontrado =
        filas.find(
            (fila, index) => {

                if (index === 0) {
                    return false;
                }

                return (
                    normalizar(fila[0]) ===
                    codigoNormalizado
                );
            }
        );

    if (!encontrado) {
        return null;
    }

    const resultado:
        Record<string, string> = {};

    encabezados.forEach(
        (encabezado, index) => {

            const clave =
                texto(encabezado)
                    .replace(/^,+|,+$/g, "")
                    .trim();

            if (!clave) {
                return;
            }

            resultado[clave] =
                texto(
                    encontrado[index]
                );
        }
    );

    return resultado;
}

// ==========================================
// BUSCAR REPORTES
// ==========================================

function buscarReporte(
    id: string,
    reportes: any[]
): any[] | undefined {

    return reportes.find(
        fila =>
            texto(fila[0]) ===
            texto(id)
    );
}

// ==========================================
// PASAPORTES
// ==========================================
//
// Estados:
//
// 1. Existe planilla en Gestión Consular,
//    pero no existe información procesada:
//    → trámite en proceso.
//
// 2. Existe registro procesado en
//    ReportesEntregados y no entregado:
//    → disponible para retiro.
//
// 3. Existe registro entregado:
//    → mostrar fecha de entrega.
//
// ==========================================

async function validarPasaporte(
    codigo: string
): Promise<ResultadoValidacion> {

    const [
        gestionConsular,
        caja,
        reportesEntregados,
    ] = await Promise.all([
        obtenerGestionConsular(),
        obtenerCaja(),
        obtenerReportesEntregados(),
    ]);

    const codigoNormalizado =
        normalizar(codigo);

    const cajaMap =
        new Map<string, any[]>();

    caja
        .slice(1)
        .forEach((fila: any[]) => {
            cajaMap.set(
                texto(fila[1]),
                fila
            );
        });

    let registroGC: any[] | undefined;
    let reporte: any[] | undefined;

    // ======================================
    // Buscar PASAPORTE
    // ======================================
    //
    // P:
    //   se busca por CÉDULA del solicitante.
    //
    // P-NNA:
    //   se busca por NOMBRE COMPLETO del
    //   titular NNA almacenado en Caja!O.
    //
    // Se conserva la misma relación utilizada
    // por el módulo de ReportesEntregados:
    //
    // GestionConsular!A = correlativo
    // GestionConsular!B = código actuación
    // GestionConsular!G = estado
    // GestionConsular!L = ID
    // Caja!B = correlativo
    // Caja!C = documento
    // Caja!D = solicitante
    // Caja!O = titulares NNA
    // ======================================

    const contadorNNA =
        new Map<string, number>();

    for (
        const gc of gestionConsular.slice(1)
    ) {

        const correlativo =
            texto(gc[0]);

        const codigoActuacion =
            texto(gc[1])
                .toUpperCase();

        if (
            codigoActuacion !== "P" &&
            codigoActuacion !== "P-NNA"
        ) {
            continue;
        }

        const estadoGC =
            texto(gc[6])
                .toUpperCase();

        if (
            estadoGC !== "VINCULADO"
        ) {
            continue;
        }

        const recibo =
            cajaMap.get(
                correlativo
            );

        if (!recibo) {
            continue;
        }

        const estadoCaja =
            texto(recibo[10])
                .toUpperCase();

        if (
            estadoCaja !== "GENERADO"
        ) {
            continue;
        }

        const esNNA =
            codigoActuacion === "P-NNA";

        let coincide = false;

        // ----------------------------------
        // PASAPORTE ADULTO
        // ----------------------------------
        //
        // Caja!C contiene la cédula/documento
        // del solicitante.
        // ----------------------------------

        if (!esNNA) {

            const cedula =
                texto(recibo[2]);

            coincide =
                normalizar(cedula) ===
                codigoNormalizado;
        }

        // ----------------------------------
        // PASAPORTE NNA
        // ----------------------------------
        //
        // Caja!O puede contener una lista de
        // titulares NNA.
        //
        // Cuando un mismo recibo tiene varios
        // P-NNA, cada actuación corresponde
        // al titular que ocupa su posición.
        // ----------------------------------

        if (esNNA) {

            const contenido =
                texto(recibo[14]);

            let titularesNNA: string[] = [];

            if (
                contenido.startsWith("[") &&
                contenido.endsWith("]")
            ) {
                try {

                    const resultado =
                        JSON.parse(
                            contenido
                        );

                    if (
                        Array.isArray(
                            resultado
                        )
                    ) {
                        titularesNNA =
                            resultado
                                .map(item =>
                                    texto(item)
                                )
                                .filter(Boolean);
                    }

                } catch {
                    // Continuar con separadores normales.
                }
            }

            if (
                titularesNNA.length === 0 &&
                contenido
            ) {
                titularesNNA =
                    contenido
                        .split(
                            /\r?\n|;|\|/
                        )
                        .map(item =>
                            texto(item)
                        )
                        .filter(Boolean);
            }

            const posicionActual =
                contadorNNA.get(
                    correlativo
                ) ?? 0;

            const titularNNA =
                texto(
                    titularesNNA[
                        posicionActual
                    ]
                );

            coincide =
                titularNNA !== "" &&
                normalizar(titularNNA) ===
                    codigoNormalizado;

            contadorNNA.set(
                correlativo,
                posicionActual + 1
            );
        }

        if (!coincide) {
            continue;
        }

        registroGC = gc;

        const id =
            texto(gc[11]);

        reporte =
            buscarReporte(
                id,
                reportesEntregados
            );

        break;
    }

    // --------------------------------------
    // Si no existe el trámite
    // --------------------------------------

    if (!registroGC) {
        return {
            encontrado: false,
        };
    }

    // --------------------------------------
    // Si existe ReportesEntregados
    // --------------------------------------

    if (reporte) {

        const entregado =
            texto(reporte[9])
                .toUpperCase() === "SI";

        const fechaEntrega =
            texto(reporte[10]);

        const titular =
            texto(reporte[13]);

        const numeroPasaporte =
            texto(reporte[14]);

        const fechaValija =
            texto(reporte[15]);

        const fechaEmision =
            texto(reporte[16]);

        const fechaVencimiento =
            texto(reporte[17]);

        // ----------------------------------
        // ENTREGADO
        // ----------------------------------

        if (
            entregado &&
            fechaEntrega !== ""
        ) {
            return {
                encontrado: true,

                mensaje:
                    `Pasaporte entregado al ciudadano en fecha ${fechaEntrega}.`,
            };
        }

        // ----------------------------------
        // PROCESADO PERO NO ENTREGADO
        // ----------------------------------

        const procesado =
            titular !== "" &&
            numeroPasaporte !== "" &&
            fechaValija !== "" &&
            fechaEmision !== "" &&
            fechaVencimiento !== "";

        if (procesado) {
            return {
                encontrado: true,

                mensaje:
                    "Estimado Usuario su pasaporte se encuentra en nuestras oficinas. Puede retirar de lunes a viernes de 8:30am a 3:30pm corrido sin previa cita",
            };
        }
    }

    // --------------------------------------
    // EN PROCESO
    // --------------------------------------

    const planilla =
        texto(registroGC[3]);

    if (
        planilla !== ""
    ) {
        return {
            encontrado: true,

            mensaje:
                "Estimado Usuario, su tramite aun se encuentra en proceso en las Oficinas Centrales de SAIME Caracas. Puede revisar el estatus del mismo a través de su usuario en www.saime.gob.ve. Una vez sea recibido su pasaporte le estaremos notificando a través de su correo electronico registrado",
        };
    }

    return {
        encontrado: true,

        mensaje:
            "Estimado Usuario, su tramite aun se encuentra en proceso en las Oficinas Centrales de SAIME Caracas. Puede revisar el estatus del mismo a través de su usuario en www.saime.gob.ve. Una vez sea recibido su pasaporte le estaremos notificando a través de su correo electronico registrado",
    };
}

// ==========================================
// DOCUMENTOS DEL SISTEMA NUEVO
// ==========================================

async function validarDocumentoNuevo(
    tipo: TipoValidacion,
    codigo: string
): Promise<Record<string, string> | null> {

    const [
        gestionConsular,
        reportesEntregados,
    ] = await Promise.all([
        obtenerGestionConsular(),
        obtenerReportesEntregados(),
    ]);

    const codigoNormalizado =
        normalizar(codigo);

    const reportes =
        reportesEntregados.slice(1);

    let documentoEncontradoNoEntregado = false;

    // --------------------------------------
    // PASAPORTE
    // --------------------------------------
    //
    // Se procesa mediante validarPasaporte().
    // --------------------------------------

    if (tipo === "pasaporte") {
        return null;
    }

    // --------------------------------------
    // RECORRER GESTIÓN CONSULAR
    // --------------------------------------

    for (
        const gc of gestionConsular.slice(1)
    ) {

        const correlativo =
            texto(gc[0]);

        const codigoActuacion =
            texto(gc[1])
                .toUpperCase();

        const actuacion =
            texto(gc[2])
                .toUpperCase();

        const planilla =
            texto(gc[3]);

        const id =
            texto(gc[11]);

        if (!id) {
            continue;
        }

        const reporte =
            buscarReporte(
                id,
                reportes
            );

        // ----------------------------------
        // Determinar categoría
        // ----------------------------------

        let categoria:
            | "CARTA_SOLTERIA"
            | "CERTIFICADO_USO"
            | "CONSTANCIA_REGISTRO"
            | "CONSTANCIA_CONSULAR"
            | "FE_VIDA"
            | "PODER"
            | "AUTORIZACION_VIAJE"
            | null = null;

        // ----------------------------------
        // CARTA DE SOLTERÍA
        // ----------------------------------

        if (
            tipo === "solteria" &&
            (
                codigoActuacion.includes(
                    "SOLTERIA"
                ) ||
                actuacion.includes(
                    "SOLTER"
                )
            )
        ) {
            categoria =
                "CARTA_SOLTERIA";
        }

        // ----------------------------------
        // CERTIFICADO DE USO
        // ----------------------------------

        if (
            tipo === "enseres" &&
            (
                codigoActuacion.includes(
                    "CERT"
                ) ||
                actuacion.includes(
                    "CERTIFICADO DE USO"
                ) ||
                actuacion.includes(
                    "CERTIFICADO USO"
                )
            )
        ) {
            categoria =
                "CERTIFICADO_USO";
        }

        // ----------------------------------
        // REGISTRO CONSULAR
        // ----------------------------------

        if (
            tipo === "registro" &&
            (
                codigoActuacion.includes(
                    "REGISTRO"
                ) ||
                actuacion.includes(
                    "REGISTRO CONSULAR"
                )
            )
        ) {
            categoria =
                "CONSTANCIA_REGISTRO";
        }

        // ----------------------------------
        // CONSTANCIA CONSULAR
        // ----------------------------------

        if (
            tipo === "constancia" &&
            actuacion.includes(
                "CONSTANCIA"
            )
        ) {
            categoria =
                "CONSTANCIA_CONSULAR";
        }

        // ----------------------------------
        // FE DE VIDA
        // ----------------------------------

        if (
            tipo === "fevida" &&
            actuacion.includes(
                "FE DE VIDA"
            )
        ) {
            categoria =
                "FE_VIDA";
        }

        // ----------------------------------
        // PODER
        // ----------------------------------
        //
        // El tipo de actuación identifica
        // que se trata de un poder.
        //
        // IMPORTANTE:
        // Para validar públicamente el documento
        // utilizamos la PLANILLA DE GESTIÓN
        // CONSULAR (gc[3]).
        // --------------------------------------

        if (
            tipo === "poder" &&
            (
                actuacion.includes(
                    "PODER"
                ) ||
                codigoActuacion ===
                    "PODR-E" ||
                codigoActuacion ===
                    "PODR-G"
            )
        ) {
            categoria = "PODER";
        }

        // ----------------------------------
        // AUTORIZACIÓN DE VIAJE
        // ----------------------------------
        //
        // Por ahora el correlativo público será
        // el número de actuación (gc[0]).
        // --------------------------------------

        if (
            tipo === "autorizacion" &&
            (
                actuacion.includes(
                    "AUTORIZACIÓN DE VIAJE"
                ) ||
                actuacion.includes(
                    "AUTORIZACION DE VIAJE"
                )
            )
        ) {
            categoria =
                "AUTORIZACION_VIAJE";
        }

        if (!categoria) {
            continue;
        }

        // ----------------------------------
        // Datos generales del reporte
        // ----------------------------------

        const documento =
            texto(
                reporte?.[7]
            );

        const solicitante =
            texto(
                reporte?.[6]
            );

        // ==================================
        // FE DE VIDA
        // ==================================

        if (
            categoria ===
            "FE_VIDA"
        ) {

            // ReportesEntregados:
            // [23] Fecha emisión documento
            // [24] Correlativo documento

            const numero =
                texto(
                    reporte?.[24]
                );

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número Fe de Vida":
                    numero,

                "Nombre Usuario":
                    capitalizarNombre(solicitante),

                "Cédula":
                    documento,

                "Fecha Emisión":
                    texto(
                        reporte?.[23]
                    ),
            };
        }

        // ==================================
        // CARTA DE SOLTERÍA
        // ==================================

        if (
            categoria ===
            "CARTA_SOLTERIA"
        ) {

            const numero =
                texto(
                    reporte?.[26]
                );

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número Carta":
                    numero,

                "Nombre Usuario":
                    capitalizarNombre(solicitante),

                "Cédula":
                    documento,

                "Fecha Carta":
                    texto(
                        reporte?.[25]
                    ),
            };
        }

        // ==================================
        // CERTIFICADO DE USO
        // ==================================

        if (
            categoria ===
            "CERTIFICADO_USO"
        ) {

            const numero =
                texto(
                    reporte?.[29]
                );

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número Certificado":
                    numero,

                "Nombre Usuario":
                    capitalizarNombre(solicitante),

                "Fecha emisión":
                    texto(
                        reporte?.[28]
                    ),

                "Tipo de Certificado":
                    convertirTipoCertificado(
                        codigoActuacion
                    ),

                "Número Planilla Consular":
                    planilla,
            };
        }

        // ==================================
        // REGISTRO CONSULAR
        // ==================================

        if (
            categoria ===
            "CONSTANCIA_REGISTRO"
        ) {

            const numero =
                texto(
                    reporte?.[30]
                );

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número Registro":
                    numero,

                "Nombre Usuario":
                    capitalizarNombre(solicitante),

                "Cédula":
                    documento,

                "Fecha Emisión":
                    texto(
                        reporte?.[31]
                    ),
            };
        }

        // ==================================
        // CONSTANCIA CONSULAR
        // ==================================

        if (
            categoria ===
            "CONSTANCIA_CONSULAR"
        ) {

            const numero =
                texto(
                    reporte?.[33]
                );

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número":
                    numero,

                "Nombre Usuario":
                    capitalizarNombre(solicitante),

                "Cédula":
                    documento,

                "Fecha Constancia":
                    texto(
                        reporte?.[32]
                    ),
            };
        }

        // ==================================
        // PODER
        // ==================================

        if (
            categoria ===
            "PODER"
        ) {

            // ==================================
            // IMPORTANTE:
            //
            // Para Poder la validación pública
            // se hace por PLANILLA DE GESTIÓN
            // CONSULAR, no por gc[0].
            // ==================================

            const numero =
                texto(reporte?.[5]);

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            const tipoPoder =
                convertirTipoPoder(
                    codigoActuacion
                );

            const solicitantes =
                texto(
                    reporte?.[6]
                );

            const documentosSolicitantes =
                texto(
                    reporte?.[7]
                );

            const apoderados =
                texto(
                    reporte?.[35]
                );

            const documentosApoderados =
                texto(
                    reporte?.[36]
                );

            return {
                "Número Planilla Consular":
                    numero,

                "Solicitante":
                    capitalizarNombre(solicitantes),

                "Documento":
                    documentosSolicitantes,

                "Tipo de Poder":
                    tipoPoder,

                "Apoderado":
                    capitalizarNombre(apoderados),

                "Documento Apoderado":
                    documentosApoderados,

                "Estado":
                    texto(
                        reporte?.[37]
                    ),
            };
        }

        // ==================================
        // AUTORIZACIÓN DE VIAJE
        // ==================================

        if (
            categoria ===
            "AUTORIZACION_VIAJE"
        ) {

            // ==================================
            // Por ahora el correlativo de
            // validación será el número de
            // actuación de Gestión Consular.
            // ==================================

            const numero =
                texto(reporte?.[5]);

            if (
                normalizar(numero) !==
                codigoNormalizado
            ) {
                continue;
            }

            if (
                !reporte ||
                texto(reporte[9])
                    .toUpperCase() !== "SI"
            ) {
                documentoEncontradoNoEntregado = true;
                continue;
            }

            return {
                "Número Actuación":
                    numero,

                "Solicitante":
                    capitalizarNombre(
                        reporte?.[6]
                    ),

                "Documento":
                    texto(
                        reporte?.[7]
                    ),

                "Origen":
                    texto(
                        reporte?.[38]
                    ),

                "Parentesco":
                    texto(
                        reporte?.[39]
                    ),

                "Menor":
                    capitalizarNombre(
                        reporte?.[40]
                    ),

                "Pasaporte del Menor":
                    texto(
                        reporte?.[41]
                    ),

                "Destino":
                    texto(
                        reporte?.[42]
                    ),

                "Fecha de Ida":
                    texto(
                        reporte?.[43]
                    ),

                "Fecha de Retorno":
                    texto(
                        reporte?.[44]
                    ),

                "Acompañante":
                    texto(
                        reporte?.[45]
                    ),

                "Pasaporte del Acompañante":
                    texto(
                        reporte?.[46]
                    ),

                "Modalidad":
                    texto(
                        reporte?.[47]
                    ),
            };
        }
    }

    if (
        documentoEncontradoNoEntregado
    ) {
        return {
            "__NO_ENTREGADO__":
                "El documento aún no ha sido entregado.",
        };
    }

    return null;
}

// ==========================================
// VALIDAR DOCUMENTO HISTÓRICO
// ==========================================

async function validarDocumentoHistorico(
    tipo: TipoValidacion,
    codigo: string
): Promise<ResultadoValidacion> {

    let tipoHistorico:
        TipoValidacionHistorica | null =
        null;

    // --------------------------------------
    // Documentos que mantienen la misma hoja
    // --------------------------------------

    if (
        tipo === "enseres" ||
        tipo === "solteria" ||
        tipo === "registro" ||
        tipo === "constancia"
    ) {
        tipoHistorico = tipo;
    }

    // --------------------------------------
    // Poder y Autorización
    //
    // Históricamente estaban dentro de la
    // hoja "notarial".
    // --------------------------------------

    if (
        tipo === "poder" ||
        tipo === "autorizacion"
    ) {
        tipoHistorico = "notarial";
    }

    // --------------------------------------
    // Fe de Vida no tiene hoja histórica
    // configurada en esta etapa.
    // --------------------------------------

    if (!tipoHistorico) {
        return {
            encontrado: false,
        };
    }

    const datos =
        await consultarHojaHistorica(
            tipoHistorico,
            codigo
        );

    if (!datos) {
        return {
            encontrado: false,
        };
    }

    return {
        encontrado: true,
        datos: formatearNombresResultado(datos),
    };
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

export async function validarDocumento(
    tipoDocumento: TipoValidacion,
    codigo: string
): Promise<ResultadoValidacion> {

    const codigoLimpio =
        texto(codigo);

    if (
        !tipoDocumento ||
        !codigoLimpio
    ) {
        return {
            encontrado: false,
        };
    }

    // ======================================
    // PASAPORTE
    // ======================================

    if (
        tipoDocumento ===
        "pasaporte"
    ) {
        return validarPasaporte(
            codigoLimpio
        );
    }

    // ======================================
    // PRIMERO: SISTEMA NUEVO
    // ======================================

    const datosNuevos =
        await validarDocumentoNuevo(
            tipoDocumento,
            codigoLimpio
        );

    if (datosNuevos) {

        if (
            datosNuevos.__NO_ENTREGADO__
        ) {
            return {
                encontrado: true,
                mensaje:
                    datosNuevos.__NO_ENTREGADO__,
            };
        }

        return {
            encontrado: true,
            datos: datosNuevos,
        };
    }

    // ======================================
    // SEGUNDO: HISTÓRICO
    // ======================================

    return validarDocumentoHistorico(
        tipoDocumento,
        codigoLimpio
    );
}