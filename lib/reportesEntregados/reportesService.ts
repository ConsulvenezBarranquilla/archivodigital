// ==========================================
// Reportes Entregados
// Servicio Principal
// Consulnet Barranquilla
// ==========================================

import {
    CategoriaDocumento,
    TipoDocumento,
    ReporteEntregado,
    EstadoProcesamiento,
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
        .substring(0, 10);

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
// Convierte una lista de texto
// ==========================================
//
// Admite:
// - JSON: ["A","B"]
// - Texto separado por saltos de línea
// - Texto separado por ;
// - Texto separado por |
// ==========================================

function convertirListaTexto(
    valor: unknown
): string[] {

    const contenido =
        texto(valor);

    if (!contenido) {
        return [];
    }

    // --------------------------------------
    // Intentar JSON
    // --------------------------------------

    if (
        contenido.startsWith("[") &&
        contenido.endsWith("]")
    ) {

        try {

            const resultado =
                JSON.parse(contenido);

            if (
                Array.isArray(resultado)
            ) {

                return resultado
                    .map(item =>
                        texto(item)
                    )
                    .filter(Boolean);

            }

        } catch {
            // Continuar con texto normal
        }

    }

    // --------------------------------------
    // Separadores
    // --------------------------------------

    return contenido
        .split(/\r?\n|;|\|/)
        .map(item =>
            texto(item)
        )
        .filter(Boolean);

}
function convertirPersonasPoder(
    nombres: unknown,
    documentos: unknown
): {
    nombre: string;
    documento: string;
}[] {

    const listaNombres =
        convertirListaTexto(nombres);

    const listaDocumentos =
        convertirListaTexto(documentos);

    const cantidad = Math.max(
        listaNombres.length,
        listaDocumentos.length
    );

    const resultado: {
        nombre: string;
        documento: string;
    }[] = [];

    for (
        let i = 0;
        i < cantidad;
        i++
    ) {

        const nombre =
            texto(listaNombres[i]);

        const documento =
            texto(listaDocumentos[i]);

        if (
            nombre === "" &&
            documento === ""
        ) {
            continue;
        }

        resultado.push({
            nombre,
            documento,
        });

    }

    return resultado;
}
// ==========================================
// Convierte solicitantes de autorización
// ==========================================
//
// G = nombre solicitante
// H = documento solicitante
//
// Permite máximo 2 solicitantes.
//

function convertirSolicitantesAutorizacion(
    nombres: unknown,
    documentos: unknown
): {
    nombre: string;
    documento: string;
}[] {

    const listaNombres =
        convertirListaTexto(nombres);

    const listaDocumentos =
        convertirListaTexto(documentos);

    const cantidad = Math.min(
        Math.max(
            listaNombres.length,
            listaDocumentos.length
        ),
        2
    );

    const resultado: {
        nombre: string;
        documento: string;
    }[] = [];

    for (
        let i = 0;
        i < cantidad;
        i++
    ) {

        const nombre =
            texto(listaNombres[i]);

        const documento =
            texto(listaDocumentos[i]);

        if (
            nombre === "" &&
            documento === ""
        ) {
            continue;
        }

        resultado.push({
            nombre,
            documento,
        });

    }

    return resultado;
}
// ==========================================
// Convierte apoderados
// ==========================================
//
// Formatos soportados:
//
// JSON:
//
// [
//   {
//     "nombre": "Juan Pérez",
//     "documento": "123"
//   }
// ]
//
// También:
//
// Juan Pérez | 123
// María Gómez | 456
//
// o:
//
// Juan Pérez - 123
// María Gómez - 456
//
// ==========================================

function convertirApoderados(
    valor: unknown
): {
    nombre: string;
    documento: string;
}[] {

    const contenido =
        texto(valor);

    if (!contenido) {
        return [];
    }

    // --------------------------------------
    // Intentar JSON
    // --------------------------------------

    if (
        contenido.startsWith("[") &&
        contenido.endsWith("]")
    ) {

        try {

            const resultado =
                JSON.parse(contenido);

            if (
                Array.isArray(resultado)
            ) {

                return resultado
                    .map(item => {

                        if (
                            item &&
                            typeof item === "object"
                        ) {

                            return {
                                nombre:
                                    texto(
                                        item.nombre
                                    ),

                                documento:
                                    texto(
                                        item.documento
                                    ),
                            };

                        }

                        return null;

                    })
                    .filter(
                        (
                            item
                        ): item is {
                            nombre: string;
                            documento: string;
                        } =>
                            item !== null &&
                            (
                                item.nombre !== "" ||
                                item.documento !== ""
                            )
                    );

            }

        } catch {
            // Continuar con texto normal
        }

    }

    // --------------------------------------
    // Separar registros
    // --------------------------------------

    const registros =
        contenido
            .split(/\r?\n|;/)
            .map(item =>
                texto(item)
            )
            .filter(Boolean);

    // --------------------------------------
    // Convertir cada registro
    // --------------------------------------

    return registros
        .map(registro => {

            let partes:
                string[] = [];

            if (
                registro.includes("|")
            ) {

                partes =
                    registro.split("|");

            } else if (
                registro.includes(" - ")
            ) {

                partes =
                    registro.split(" - ");

            } else if (
                registro.includes(":")
            ) {

                partes =
                    registro.split(":");

            }

            if (
                partes.length >= 2
            ) {

                return {
                    nombre:
                        texto(
                            partes[0]
                        ),

                    documento:
                        texto(
                            partes.slice(1).join(
                                " - "
                            )
                        ),
                };

            }

            // Si solamente existe el nombre
            return {
                nombre:
                    texto(registro),

                documento:
                    "",
            };

        })
        .filter(
            apoderado =>
                apoderado.nombre !== "" ||
                apoderado.documento !== ""
        );

}

// ==========================================
// Determinar estado de procesamiento
// ==========================================
//
// IMPORTANTE:
//
// Esta función solamente determina si el
// documento está listo para pasar a la etapa
// de entrega.
//
// NO significa que el documento haya sido
// entregado al ciudadano.
//
// ==========================================

function determinarEstadoProcesamiento(

    documento: ReporteEntregado

): EstadoProcesamiento {

    // --------------------------------------
    // Si ya fue entregado
    // --------------------------------------

    if (
        documento.entregado === true
    ) {

        return "ENTREGADO";

    }

    // --------------------------------------
    // PASAPORTES
    // --------------------------------------

    if (
        documento.categoria ===
        "PASAPORTES"
    ) {

        const completo =

            texto(
                documento.titularPasaporte
            ) !== ""

            &&

            texto(
                documento.numeroPasaporte
            ) !== ""

            &&

            texto(
                documento.fechaValija
            ) !== ""

            &&

            texto(
                documento.fechaEmision
            ) !== ""

            &&

            texto(
                documento.fechaVencimiento
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // VISA
    // --------------------------------------

    if (
        documento.categoria ===
        "VISA"
    ) {

        const estado =
            texto(
                documento.estado
            )
            .toUpperCase();

        // ----------------------------------
        // VISA RECHAZADA / NEGADA
        // ----------------------------------

        if (
            estado === "RECHAZADA" ||
            estado === "NEGADA"
        ) {

            return "RECHAZADA";

        }

        // ----------------------------------
        // VISA APROBADA / PROCESADA
        // ----------------------------------

        const completo =

            texto(
                documento.titularVisa
            ) !== ""

            &&

            texto(
                documento.numeroVisa
            ) !== ""

            &&

            texto(
                documento.fechaVencimiento
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // APOSTILLA
    // --------------------------------------

    if (
        documento.categoria ===
        "APOSTILLA"
    ) {

        const estado =
            texto(
                documento.estadoApostilla ||
                documento.estado
            )
            .toUpperCase();

        // ----------------------------------
        // APOSTILLA RECHAZADA / NEGADA
        // ----------------------------------

        if (
            estado === "RECHAZADA" ||
            estado === "NEGADA"
        ) {

            return "RECHAZADA";

        }

        // ----------------------------------
        // APOSTILLA APROBADA
        // ----------------------------------

        if (
            estado === "APROBADA"
        ) {

            return "PROCESADO";

        }

        // ----------------------------------
        // EN PROCESO
        // ----------------------------------

        return "EN_PROCESO";

    }

    // --------------------------------------
    // FE DE VIDA
    // --------------------------------------

    if (
        documento.categoria ===
        "FE_VIDA"
    ) {

        const completo =

            texto(
                documento.fechaEmisionDocumento
            ) !== ""

            &&

            texto(
                documento.correlativoDocumento
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // CARTA DE SOLTERÍA
    // --------------------------------------

    if (
        documento.categoria ===
        "CARTA_SOLTERIA"
    ) {

        const completo =

            texto(
                documento.fechaCarta
            ) !== ""

            &&

            texto(
                documento.correlativoCarta
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // CERTIFICADOS DE USO
    // --------------------------------------

    if (
        documento.categoria ===
        "CERTIFICADO_USO"
    ) {

        const completo =

            texto(
                documento.fechaRegistro
            ) !== ""

            &&

            texto(
                documento.numeroCertificado
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // CONSTANCIA DE REGISTRO CONSULAR
    // --------------------------------------

    if (
        documento.categoria ===
        "CONSTANCIA_REGISTRO"
    ) {

        const completo =

            texto(
                documento.fechaRegistroConsular
            ) !== ""

            &&

            texto(
                documento.numeroRegistro
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // CONSTANCIA CONSULAR
    // --------------------------------------

    if (
        documento.categoria ===
        "CONSTANCIA_CONSULAR"
    ) {

        const completo =

            texto(
                documento.fechaConstancia
            ) !== ""

            &&

            texto(
                documento.correlativoConstancia
            ) !== "";

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }

    // --------------------------------------
    // PODER
    // --------------------------------------

    if (
        documento.categoria ===
        "PODER"
    ) {

        const tipoPoderValido =

            documento.tipoPoder ===
                "PODR-E"

            ||

            documento.tipoPoder ===
                "PODR-G";

        const tieneSolicitantes =
            Array.isArray(
                documento.solicitantesPoder
            ) &&
            documento.solicitantesPoder.length >
                0;

        const tieneApoderados =
            Array.isArray(
                documento.apoderadosPoder
            ) &&
            documento.apoderadosPoder.length >
                0;

        const completo =

            tipoPoderValido

            &&

            tieneSolicitantes

            &&

            tieneApoderados;

        return completo
            ? "PROCESADO"
            : "EN_PROCESO";

    }
// --------------------------------------
// AUTORIZACIÓN DE VIAJE
// --------------------------------------

if (
    documento.categoria ===
    "AUTORIZACION_VIAJE"
) {

    const tieneSolicitantes =
        Array.isArray(
            documento.solicitantesAutorizacion
        ) &&
        documento
            .solicitantesAutorizacion
            .length > 0;

    const completo =

        tieneSolicitantes

        &&

        texto(
            documento.origen
        ) !== ""

        &&

        texto(
            documento.parentesco
        ) !== ""

        &&

        texto(
            documento.menor
        ) !== ""

        &&

        texto(
            documento.pasaporteMenor
        ) !== ""

        &&

        texto(
            documento.destino
        ) !== ""

        &&

        texto(
            documento.fechaIda
        ) !== ""

        &&

        texto(
            documento.fechaRetorno
        ) !== ""

        &&

        texto(
            documento.modalidad
        ) !== "";

    return completo
        ? "PROCESADO"
        : "EN_PROCESO";

}
    // --------------------------------------
    // Las demás categorías
    // --------------------------------------

    return "EN_PROCESO";

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

    // ======================================
    // DATOS GENERALES
    // ======================================

    // ReportesEntregados!H
    // Documento
    documento.documento =
        texto(reporte[7]);

    // ReportesEntregados!I
    // Estado
    documento.estado =
        texto(reporte[8]);

    // ======================================
    // ENTREGA
    // ======================================

    documento.entregado =
        texto(reporte[9]) === "SI";

    documento.fechaEntrega =
        texto(reporte[10]);

    documento.entregadoPor =
        texto(reporte[11]);

    documento.observaciones =
        texto(reporte[12]);

    // ======================================
    // ESTADO INTERNO
    // ======================================

    // ReportesEntregados!BA
    const estadoGuardado =
        texto(reporte[52]);

    if (
        estadoGuardado !== ""
    ) {

        documento.estadoProcesamiento =
            estadoGuardado as EstadoProcesamiento;

    }

    // ======================================
    // PASAPORTES
    // ======================================

    documento.numeroPasaporte =
        texto(reporte[14]);

    documento.fechaValija =
        texto(reporte[15]);

    documento.fechaEmision =
        texto(reporte[16]);

    documento.fechaVencimiento =
        texto(reporte[17]);

    // ======================================
    // VISAS
    // ======================================

    documento.numeroVisa =
        texto(reporte[18]);

    documento.tipoVisa =
        texto(reporte[19]);

    // --------------------------------------
    // Nacionalidad
    // --------------------------------------

    const nacionalidadGuardada =
        texto(reporte[20]);

    if (
        nacionalidadGuardada !== ""
    ) {

        documento.nacionalidad =
            nacionalidadGuardada;

    }

    documento.vigencia =
        texto(reporte[21]);

    // ======================================
    // APOSTILLA
    // ======================================

    documento.estadoApostilla =
        texto(reporte[22]);

    // ======================================
    // FE DE VIDA
    // ======================================

    documento.fechaEmisionDocumento =
        texto(reporte[23]);

    documento.correlativoDocumento =
        texto(reporte[24]);

    // ======================================
    // CARTA DE SOLTERÍA
    // ======================================

    documento.fechaCarta =
        texto(reporte[25]);

    documento.correlativoCarta =
        texto(reporte[26]);

    // ======================================
    // CERTIFICADO DE USO
    // ======================================

    if (
        documento.categoria ===
        "CERTIFICADO_USO"
    ) {

        documento.tipoCertificado =
            texto(reporte[27]);

        documento.fechaRegistro =
            texto(reporte[28]);

        documento.numeroCertificado =
            texto(reporte[29]);

    }

    // ======================================
    // CONSTANCIA REGISTRO CONSULAR
    // ======================================

    if (
        documento.categoria ===
        "CONSTANCIA_REGISTRO"
    ) {

        documento.numeroRegistro =
            texto(reporte[30]);

        documento.fechaRegistroConsular =
            texto(reporte[31]);

    }

    // ======================================
    // CONSTANCIA CONSULAR
    // ======================================

    documento.fechaConstancia =
        texto(reporte[32]);

    documento.correlativoConstancia =
        texto(reporte[33]);

    // ======================================
// PODER
// ======================================

// --------------------------------------
// Tipo de poder
// ReportesEntregados!AI
// --------------------------------------

const tipoPoder =
    texto(reporte[34]);

if (
    tipoPoder === "PODR-E" ||
    tipoPoder === "PODR-G"
) {

    documento.tipoPoder =
        tipoPoder;

}

// --------------------------------------
// SOLICITANTES
//
// G = nombre solicitante
// H = documento solicitante
// --------------------------------------

const solicitantesPoder =
    convertirPersonasPoder(
        reporte[6],
        reporte[7]
    );

if (
    solicitantesPoder.length > 0
) {

    documento.solicitantesPoder =
        solicitantesPoder;

}

// --------------------------------------
// APODERADOS
//
// AJ = nombre apoderado
// AK = documento apoderado
// --------------------------------------

const apoderadosPoder =
    convertirPersonasPoder(
        reporte[35],
        reporte[36]
    );

if (
    apoderadosPoder.length > 0
) {

    documento.apoderadosPoder =
        apoderadosPoder;

}

// --------------------------------------
// Estado del poder
// AL
// --------------------------------------

const estadoPoder =
    texto(reporte[37])
        .toUpperCase();

if (
    estadoPoder === "VIGENTE" ||
    estadoPoder === "REVOCADO"
) {

    documento.estadoPoder =
        estadoPoder;

}

    // ======================================
// AUTORIZACIÓN DE VIAJE
// ======================================
//
// G = solicitantes
// H = documentos de los solicitantes
//
// AM = Origen
// AN = Parentesco
// AO = Menor
// AP = Pasaporte Menor
// AQ = Destino
// AR = Fecha Ida
// AS = Fecha Retorno
// AT = Acompañante
// AU = Pasaporte Acompañante
// AV = Modalidad
// ======================================

// --------------------------------------
// SOLICITANTES
// ReportesEntregados!G/H
// --------------------------------------

const solicitantesAutorizacion =
    convertirSolicitantesAutorizacion(
        reporte[6],
        reporte[7]
    );

if (
    solicitantesAutorizacion.length > 0
) {

    documento.solicitantesAutorizacion =
        solicitantesAutorizacion;

}

// --------------------------------------
// AM = Origen
// --------------------------------------

documento.origen =
    texto(reporte[38]);

// --------------------------------------
// AN = Parentesco
// --------------------------------------

documento.parentesco =
    texto(reporte[39]);

// --------------------------------------
// AO = Menor
// --------------------------------------

documento.menor =
    texto(reporte[40]);

// --------------------------------------
// AP = Pasaporte Menor
// --------------------------------------

documento.pasaporteMenor =
    texto(reporte[41]);

// --------------------------------------
// AQ = Destino
// --------------------------------------

documento.destino =
    texto(reporte[42]);

// --------------------------------------
// AR = Fecha Ida
// --------------------------------------

documento.fechaIda =
    texto(reporte[43]);

// --------------------------------------
// AS = Fecha Retorno
// --------------------------------------

documento.fechaRetorno =
    texto(reporte[44]);

// --------------------------------------
// AT = Acompañante
// --------------------------------------

documento.acompanante =
    texto(reporte[45]);

// --------------------------------------
// AU = Pasaporte Acompañante
// --------------------------------------

documento.pasaporteAcompanante =
    texto(reporte[46]);

// --------------------------------------
// AV = Modalidad
// --------------------------------------

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

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

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

            const codigoVisa =
                texto(gc[1]);

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const codigoActuacion =
                texto(gc[1])
                    .toUpperCase();

            if (
                codigoActuacion !== "P" &&
                codigoActuacion !== "P-NNA"
            ) {

                return;

            }

            const id =
                texto(gc[11]);

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const esNNA =
                codigoActuacion === "P-NNA";

            const tipoDocumento:
                TipoDocumento =

                esNNA
                    ? "PASAPORTE_NNA"
                    : "PASAPORTE_ADULTO";

            const solicitante =
                texto(recibo[3]);

            const titularPasaporte =

                esNNA
                    ? texto(
                        recibo[14]
                    )
                    : solicitante;

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "PASAPORTES",

                tipoDocumento,

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante,

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

                titularPasaporte,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.titularPasaporte =
                titularPasaporte;

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
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

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

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

            const codigoVisa =
                texto(gc[1]);

            const planilla =
                texto(gc[3]);

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const actuacion =
                texto(gc[2])
                    .toUpperCase();

            if (
                !actuacion.includes(
                    "VISA"
                )
            ) {

                return;

            }

            const id =
                texto(gc[11]);

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const solicitante =
                texto(recibo[3]);

            const nacionalidadSolicitante =
                texto(recibo[13]);

            const titularEspecial =
                texto(recibo[16]);

            const pasaporteEspecial =
                texto(recibo[17]);

            const tieneTitularEspecial =
                titularEspecial !== "";

            const titularVisa =

                tieneTitularEspecial
                    ? titularEspecial
                    : solicitante;

            const pasaporteTitularVisa =

                tieneTitularEspecial
                    ? pasaporteEspecial
                    : "";

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "VISA",

                tipoDocumento:
                    "VISA",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante,

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

                titularVisa,

                pasaporteTitularVisa,

                nacionalidad:
                    nacionalidadSolicitante,

                tipoVisa:
                    codigoVisa,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.titularVisa =
                titularVisa;

            documentoFinal.pasaporteTitularVisa =
                pasaporteTitularVisa;

            documentoFinal.tipoVisa =
                codigoVisa;

            if (
                texto(
                    documentoFinal.nacionalidad
                ) === ""
            ) {

                documentoFinal.nacionalidad =
                    nacionalidadSolicitante;

            }

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

}

// ==========================================
// APOSTILLAS
// ==========================================

function obtenerApostillas(

    data: ReportesData

): ReporteEntregado[] {

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

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
                texto(gc[6])
                    .toUpperCase();

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const actuacion =
                texto(gc[2])
                    .toUpperCase();

            if (
                !actuacion.includes(
                    "APOSTILLA"
                )
            ) {

                return;

            }

            const esNNA =
                actuacion.includes(
                    "NNA"
                );

            const id =
                texto(gc[11]);

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const solicitante =
                texto(recibo[3]);

            const titularApostilla =

                esNNA
                    ? texto(
                        recibo[15]
                    )
                    : solicitante;

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "APOSTILLA",

                tipoDocumento:
                    "APOSTILLA",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante,

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    texto(
                        reporte?.[22]
                    ) || estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

                titularApostilla,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.titularApostilla =
                titularApostilla;

            const estadoApostilla =
                texto(
                    documentoFinal.estadoApostilla
                );

            if (
                estadoApostilla !== ""
            ) {

                documentoFinal.estado =
                    estadoApostilla;

            }

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

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
// FUNCIÓN GENÉRICA
// ==========================================

function obtenerDocumentosPorTipo(

    data: ReportesData,

    categoria: CategoriaDocumento,

    tipoDocumento: TipoDocumento,

    textoBusqueda: string

): ReporteEntregado[] {

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

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
                texto(gc[6])
                    .toUpperCase();

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const actuacion =
                texto(gc[2])
                    .toUpperCase();

            if (
                !actuacion.includes(
                    textoBusqueda
                )
            ) {

                return;

            }

            const codigoActuacion =
                texto(gc[1]);

            const id =
                texto(gc[11]);

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const documento:
                ReporteEntregado = {

                id,

                categoria,

                tipoDocumento,

                tipoCertificado:
                    categoria ===
                    "CERTIFICADO_USO"
                        ? codigoActuacion
                        : undefined,

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante:
                    texto(
                        recibo[3]
                    ),

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            if (
                categoria ===
                "CERTIFICADO_USO"
            ) {

                documentoFinal.tipoCertificado =
                    codigoActuacion;

            }

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
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

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

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

            const codigoActuacion =
                texto(gc[1])
                    .toUpperCase();

            const actuacion =
                texto(gc[2])
                    .toUpperCase();

            const planilla =
                texto(gc[3]);

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            const esRegistroConsular =
                actuacion.includes(
                    "REGISTRO CONSULAR"
                );

            const esVerificacionIdentidad =
                codigoActuacion ===
                "VER-I";

            if (
                !esRegistroConsular &&
                !esVerificacionIdentidad
            ) {

                return;

            }

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const id =
                texto(gc[11]);

            if (!id) {

                return;

            }

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "CONSTANCIA_REGISTRO",

                tipoDocumento:
                    "CONSTANCIA_REGISTRO",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante:
                    texto(
                        recibo[3]
                    ),

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

}

// ==========================================
// CONSTANCIAS CONSULARES
// Código OAC
// ==========================================

function obtenerConstanciasConsulares(

    data: ReportesData

): ReporteEntregado[] {

    const resultado:
        ReporteEntregado[] = [];

    const idsIncluidos =
        new Set<string>();

    const cajaMap =
        new Map<string, any>();

    // ======================================
    // INDEXAR CAJA
    // ======================================

    data.caja
        .slice(1)
        .forEach((fila) => {

            cajaMap.set(
                texto(fila[1]),
                fila
            );

        });

    // ======================================
    // 1. CONSTANCIAS NORMALES
    // ======================================

    data.gestionConsular
        .slice(1)
        .forEach((gc) => {

            const correlativo =
                texto(gc[0]);

            const codigoActuacion =
                texto(gc[1])
                    .toUpperCase();

            const planilla =
                texto(gc[3]);

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            if (
                codigoActuacion !==
                "OAC"
            ) {

                return;

            }

            if (
                estadoGC !==
                "VINCULADO"
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
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            const id =
                texto(gc[11]);

            if (!id) {

                return;

            }

            idsIncluidos.add(id);

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "CONSTANCIA_CONSULAR",

                tipoDocumento:
                    "CONSTANCIA_CONSULAR",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante:
                    texto(
                        recibo[3]
                    ),

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    // ======================================
    // 2. CONSTANCIAS MANUALES
    // ======================================

    data.reportes
        .slice(1)
        .forEach((reporte) => {

            const id =
                texto(reporte[0]);

            if (!id) {

                return;

            }

            if (
                idsIncluidos.has(id)
            ) {

                return;

            }

            const categoria =
                texto(reporte[1])
                    .toUpperCase();

            if (
                categoria !==
                "CONSTANCIA_CONSULAR"
            ) {

                return;

            }

            const estado =
                texto(reporte[8])
                    .toUpperCase();

            if (
                estado !==
                "MANUAL"
            ) {

                return;

            }

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "CONSTANCIA_CONSULAR",

                tipoDocumento:
                    "CONSTANCIA_CONSULAR",

                recibo: "",

                fechaRecibo: "",

                planillaGC: "",

                solicitante:
                    texto(reporte[6]),

                documento:
                    texto(reporte[7]),

                estado,

                estadoProcesamiento:
                    "PROCESADO",

                entregado:
                    texto(reporte[9]) ===
                    "SI",

                fechaEntrega:
                    texto(reporte[10]),

                entregadoPor:
                    texto(reporte[11]),

                observaciones:
                    texto(reporte[12]),

                fechaConstancia:
                    texto(reporte[32]),

                correlativoConstancia:
                    texto(reporte[33]),

            };

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

}

// ==========================================
// PODERES
// ==========================================
//
// Códigos de actuación:
//
// PODR-E = Poder Especial
// PODR-G = Poder General
//
// La identificación se realiza mediante:
//
// GestionConsular!B
//
// NO se utiliza GestionConsular!C para identificar
// los poderes.
//

function obtenerPoderes(

    data: ReportesData

): ReporteEntregado[] {

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

    // ======================================
    // INDEXAR CAJA
    // ======================================

    data.caja
        .slice(1)
        .forEach((fila) => {

            cajaMap.set(
                texto(fila[1]),
                fila
            );

        });

    // ======================================
    // RECORRER GESTIÓN CONSULAR
    // ======================================

    data.gestionConsular
        .slice(1)
        .forEach((gc) => {

            // ----------------------------------
            // Correlativo
            // GestionConsular!A
            // ----------------------------------

            const correlativo =
                texto(gc[0]);

            // ----------------------------------
            // Código de actuación
            // GestionConsular!B
            // ----------------------------------

            const codigoActuacion =
                texto(gc[1])
                    .toUpperCase();

            // ----------------------------------
            // Planilla
            // GestionConsular!D
            // ----------------------------------

            const planilla =
                texto(gc[3]);

            // ----------------------------------
            // Estado Gestión Consular
            // GestionConsular!G
            // ----------------------------------

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            // ==================================
            // SOLO PODERES
            // ==================================

            if (
                codigoActuacion !== "PODR-E" &&
                codigoActuacion !== "PODR-G"
            ) {

                return;

            }

            // ==================================
            // SOLO VINCULADAS
            // ==================================

            if (
                estadoGC !==
                "VINCULADO"
            ) {

                return;

            }

            // ==================================
            // BUSCAR RECIBO EN CAJA
            // ==================================

            const recibo =
                cajaMap.get(
                    correlativo
                );

            if (!recibo) {

                return;

            }

            // ==================================
            // SOLO RECIBOS GENERADOS
            // ==================================

            const estadoCaja =
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !==
                "GENERADO"
            ) {

                return;

            }

            // ==================================
            // ID DE GESTIÓN CONSULAR
            // ==================================

            const id =
                texto(gc[11]);

            if (!id) {

                return;

            }

            // ==================================
            // BUSCAR DATOS GUARDADOS
            // ==================================

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            // ==================================
            // SOLICITANTE AUTOMÁTICO
            // ==================================
            //
            // Caja!D
            //
            // Se utiliza como valor inicial.
            //
            // Si existen múltiples solicitantes
            // guardados en ReportesEntregados!AJ,
            // estos son recuperados por
            // aplicarDatosReporte().
            // ==================================

            const solicitante =
                texto(recibo[3]);

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "PODER",

                tipoDocumento:
                    "PODER",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante,

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

                // ----------------------------------
                // Tipo automático desde Gestión
                // Consular!B
                // ----------------------------------

                tipoPoder:
                    codigoActuacion as
                        "PODR-E" |
                        "PODR-G",

            };

            // ==================================
            // APLICAR DATOS GUARDADOS
            // ==================================

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            // ==================================
            // TIPO DE PODER AUTOMÁTICO
            // ==================================
            //
            // GestionConsular!B prevalece.
            // ==================================

            documentoFinal.tipoPoder =
                codigoActuacion as
                    "PODR-E" |
                    "PODR-G";

            // ==================================
            // SI NO EXISTEN SOLICITANTES
            // GUARDADOS, USAR EL SOLICITANTE
            // DE CAJA
            // ==================================

            if (
                !Array.isArray(
                    documentoFinal.solicitantesPoder
                ) ||
                documentoFinal.solicitantesPoder
                    .length === 0
            ) {

                if (
                    solicitante !== ""
                ) {

                    documentoFinal.solicitantesPoder = [
    {
        nombre: solicitante,
        documento: texto(
            recibo[2]
        ),
    },
];

                }

            }

            // ==================================
            // ESTADO FINAL
            // ==================================

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

}

// ==========================================
// AUTORIZACIONES DE VIAJE
// ==========================================

function obtenerAutorizaciones(

    data: ReportesData

): ReporteEntregado[] {

    const resultado:
        ReporteEntregado[] = [];

    const cajaMap =
        new Map<string, any>();

    // ======================================
    // INDEXAR CAJA
    // ======================================

    data.caja
        .slice(1)
        .forEach((fila) => {

            cajaMap.set(
                texto(fila[1]),
                fila
            );

        });

    // ======================================
    // RECORRER GESTIÓN CONSULAR
    // ======================================

    data.gestionConsular
        .slice(1)
        .forEach((gc) => {

            // ----------------------------------
            // Correlativo
            // GestionConsular!A
            // ----------------------------------

            const correlativo =
                texto(gc[0]);

            // ----------------------------------
            // Planilla
            // GestionConsular!D
            // ----------------------------------

            const planilla =
                texto(gc[3]);

            // ----------------------------------
            // Estado Gestión Consular
            // GestionConsular!G
            // ----------------------------------

            const estadoGC =
                texto(gc[6])
                    .toUpperCase();

            // ==================================
            // SOLO VINCULADAS
            // ==================================

            if (
                estadoGC !== "VINCULADO"
            ) {

                return;

            }

            // ==================================
            // BUSCAR RECIBO EN CAJA
            // ==================================

            const recibo =
                cajaMap.get(
                    correlativo
                );

            if (!recibo) {

                return;

            }

            // ==================================
            // SOLO RECIBOS GENERADOS
            // ==================================

            const estadoCaja =
                texto(recibo[10])
                    .toUpperCase();

            if (
                estadoCaja !== "GENERADO"
            ) {

                return;

            }

            // ==================================
            // ACTUACIÓN
            // GestionConsular!C
            // ==================================

            const actuacion =
                texto(gc[2])
                    .toUpperCase();

            if (
                !actuacion.includes(
                    "AUTORIZACIÓN DE VIAJE"
                ) &&
                !actuacion.includes(
                    "AUTORIZACION DE VIAJE"
                )
            ) {

                return;

            }

            // ==================================
            // ID DE GESTIÓN CONSULAR
            // ==================================

            const id =
                texto(gc[11]);

            if (!id) {

                return;

            }

            // ==================================
            // BUSCAR DATOS GUARDADOS
            // ==================================

            const reporte =
                buscarReporte(
                    id,
                    data.reportes
                );

            // ==================================
            // SOLICITANTE AUTOMÁTICO
            // ==================================
            //
            // Caja!D
            //
            // Se utiliza como valor inicial.
            //
            // Si existen dos solicitantes
            // guardados en ReportesEntregados!G/H,
            // aplicarDatosReporte() los recuperará.
            // ==================================

            const solicitante =
                texto(recibo[3]);

            const documento:
                ReporteEntregado = {

                id,

                categoria:
                    "AUTORIZACION_VIAJE",

                tipoDocumento:
                    "AUTORIZACION_VIAJE",

                recibo:
                    correlativo,

                fechaRecibo:
                    fecha(
                        recibo[0]
                    ),

                planillaGC:
                    planilla,

                solicitante,

                documento:
                    texto(
                        recibo[2]
                    ),

                estado:
                    estadoCaja,

                estadoProcesamiento:
                    "EN_PROCESO",

                entregado:
                    false,

            };

            // ==================================
            // APLICAR DATOS GUARDADOS
            // ==================================

            const documentoFinal =
                aplicarDatosReporte(
                    documento,
                    reporte
                );

            // ==================================
            // SI NO EXISTEN SOLICITANTES
            // GUARDADOS, USAR CAJA
            // ==================================

            if (
                !Array.isArray(
                    documentoFinal.solicitantesAutorizacion
                ) ||
                documentoFinal
                    .solicitantesAutorizacion
                    .length === 0
            ) {

                if (
                    solicitante !== ""
                ) {

                    documentoFinal
                        .solicitantesAutorizacion = [
                            {
                                nombre:
                                    solicitante,

                                documento:
                                    texto(
                                        recibo[2]
                                    ),
                            },
                        ];

                }

            }

            // ==================================
            // ESTADO FINAL
            // ==================================

            documentoFinal.estadoProcesamiento =
                determinarEstadoProcesamiento(
                    documentoFinal
                );

            resultado.push(
                documentoFinal
            );

        });

    return resultado;

}

// ==========================================
// Filtrar datos por año
// ==========================================
//
// La fecha utilizada para determinar el año es:
//
// - Documentos normales:
//     fecha del recibo registrada en Caja!A
//
// - CONSTANCIA_CONSULAR manual:
//     fechaConstancia registrada en
//     ReportesEntregados!AG
//
// data.reportes NO se filtra.
//

function filtrarDataPorAnio(

    data: ReportesData,

    anio?: string | number

): ReportesData {

    if (
        anio === undefined ||
        anio === null ||
        texto(anio) === ""
    ) {

        return data;

    }

    const anioTexto =
        texto(anio);

    return {

        ...data,

        caja:
            data.caja.filter(
                (fila, index) => {

                    if (
                        index === 0
                    ) {

                        return true;

                    }

                    const fechaRecibo =
                        fecha(fila[0]);

                    return (
                        fechaRecibo.substring(0, 4) ===
                        anioTexto
                    );

                }
            ),

    };

}

// ==========================================
// Obtener años disponibles
// ==========================================

export function obtenerAniosDisponibles(

    categoria: CategoriaDocumento,

    data: ReportesData

): number[] {

    const anios =
        new Set<number>();

    const documentos =
        obtenerDocumentos(
            categoria,
            data
        );

    documentos.forEach(
        documento => {

            // ----------------------------------
            // CONSTANCIA CONSULAR MANUAL
            // ----------------------------------

            if (
                categoria ===
                    "CONSTANCIA_CONSULAR" &&
                texto(
                    documento.estado
                ).toUpperCase() ===
                    "MANUAL"
            ) {

                const fechaConstancia =
                    texto(
                        documento.fechaConstancia
                    );

                const anio =
                    Number(
                        fechaConstancia.substring(
                            0,
                            4
                        )
                    );

                if (
                    Number.isInteger(anio) &&
                    anio >= 2000
                ) {

                    anios.add(anio);

                }

                return;

            }

            // ----------------------------------
            // DOCUMENTOS NORMALES
            // ----------------------------------

            const fechaRecibo =
                texto(
                    documento.fechaRecibo
                );

            const anio =
                Number(
                    fechaRecibo.substring(
                        0,
                        4
                    )
                );

            if (
                Number.isInteger(anio) &&
                anio >= 2000
            ) {

                anios.add(anio);

            }

        }
    );

    // ======================================
    // CONSTANCIAS MANUALES
    // ======================================

    if (
        categoria ===
        "CONSTANCIA_CONSULAR"
    ) {

        data.reportes
            .slice(1)
            .forEach(
                reporte => {

                    const categoriaReporte =
                        texto(
                            reporte[1]
                        ).toUpperCase();

                    if (
                        categoriaReporte !==
                        "CONSTANCIA_CONSULAR"
                    ) {

                        return;

                    }

                    const estado =
                        texto(
                            reporte[8]
                        ).toUpperCase();

                    if (
                        estado !==
                        "MANUAL"
                    ) {

                        return;

                    }

                    const fechaConstancia =
                        fecha(
                            reporte[32]
                        );

                    const anio =
                        Number(
                            fechaConstancia.substring(
                                0,
                                4
                            )
                        );

                    if (
                        Number.isInteger(anio) &&
                        anio >= 2000
                    ) {

                        anios.add(anio);

                    }

                }
            );

    }

    // ======================================
    // ORDENAR AÑOS
    // Más reciente primero
    // ======================================

    return Array
        .from(anios)
        .sort(
            (a, b) => b - a
        );

}

// ==========================================
// Punto de entrada del servicio
// ==========================================

export function obtenerDocumentos(

    categoria: CategoriaDocumento,

    data: ReportesData,

    anio?: string | number

): ReporteEntregado[] {

    const dataFiltrada =
        filtrarDataPorAnio(
            data,
            anio
        );

    switch (categoria) {

        case "PASAPORTES":

            return obtenerPasaportes(
                dataFiltrada
            );

        case "VISA":

            return obtenerVisas(
                dataFiltrada
            );

        case "APOSTILLA":

            return obtenerApostillas(
                dataFiltrada
            );

        case "FE_VIDA":

            return obtenerFeVida(
                dataFiltrada
            );

        case "CARTA_SOLTERIA":

            return obtenerCartaSolteria(
                dataFiltrada
            );

        case "CERTIFICADO_USO":

            return obtenerCertificadosUso(
                dataFiltrada
            );

        case "CONSTANCIA_REGISTRO":

            return obtenerConstanciasRegistro(
                dataFiltrada
            );

        case "CONSTANCIA_CONSULAR":

            return obtenerConstanciasConsulares(
                dataFiltrada
            );

        case "PODER":

            return obtenerPoderes(
                dataFiltrada
            );

        case "AUTORIZACION_VIAJE":

            return obtenerAutorizaciones(
                dataFiltrada
            );

        default:

            return [];

    }

}