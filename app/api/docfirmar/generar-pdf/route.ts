import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";

import {
  PDFDocument,
  rgb,
} from "pdf-lib";

import { obtenerSesion } from "@/lib/auth";

import {
  obtenerDocumentos,
  type ReportesData,
} from "@/lib/reportesEntregados/reportesService";

import {
  obtenerGestionConsular,
  obtenerCaja,
  obtenerReportesEntregados,
  obtenerRegistroConsular,
  actualizarDatosFirmaConstancia,
} from "@/lib/googleSheets";

import {
  obtenerFirmaPorId,
  obtenerFirmasUsuario,
} from "@/lib/firmas";

import {
  obtenerSelloPorId,
} from "@/lib/sellos";

import {
  descargarArchivoDrive,
  subirArchivoDrive,
} from "@/lib/googleDrive";
import { enviarDocumentoFirmadoPorCorreo } from "@/lib/gmail";
import type { ReporteEntregado } from "@/types/ReporteEntregado";
import { descifrarSecretoTOTP, verificarCodigoTOTP } from "@/lib/totp";
import { obtenerSeguridadUsuario } from "@/lib/seguridadUsuarios";

function registrarErrorSeguro(contexto: string, error: unknown) {
  const detalle = error as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
  } | null;

  console.error(contexto, {
    name: typeof detalle?.name === "string" ? detalle.name : undefined,
    code:
      typeof detalle?.code === "string" || typeof detalle?.code === "number"
        ? detalle.code
        : undefined,
    status: typeof detalle?.status === "number" ? detalle.status : undefined,
  });
}


/*------------------------------------------
CONFIGURACIÓN
------------------------------------------*/

const CATEGORIA =
  "CONSTANCIA_REGISTRO";

const ESTADO_PENDIENTE =
  "PENDIENTE_FIRMA";
const ESTADO_FIRMADO_PENDIENTE_ENVIO =
  "FIRMADO_PENDIENTE_ENVIO";

function normalizarDocumento(valor: unknown) {
  return String(valor ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function obtenerCorreoCiudadano(documento: ReporteEntregado) {
  const filas = await obtenerRegistroConsular();
  const clave = normalizarDocumento(documento.documento);
  const ciudadano = filas.slice(1).find((fila: unknown[]) =>
    normalizarDocumento(fila[1]) === clave ||
    normalizarDocumento(fila[14]) === clave
  );

  if (!ciudadano || !String(ciudadano[11] ?? "").trim()) {
    throw new Error("No se encontró un correo registrado para el ciudadano.");
  }

  return {
    correo: String(ciudadano[11]).trim(),
    nombre: [ciudadano[2], ciudadano[3], ciudadano[4], ciudadano[5]]
      .map((valor) => String(valor ?? "").trim())
      .filter(Boolean)
      .join(" "),
  };
}


/*------------------------------------------
FUNCIONES AUXILIARES
------------------------------------------*/

/*
 * Convierte un Buffer a Uint8Array.
 */
function bufferAUint8Array(
  buffer: Buffer
) {
  return new Uint8Array(
    buffer
  );
}


/*
 * Detectar el tipo de imagen
 * de una firma o sello.
 */
function obtenerTipoImagen(
  buffer: Buffer
): "PNG" | "JPG" | null {

  /*
   * PNG
   */
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "PNG";
  }


  /*
   * JPEG
   */
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "JPG";
  }


  return null;
}


/*
 * Inserta una imagen visual
 * dentro de una página PDF.
 */
async function insertarImagen(
  pdf: PDFDocument,
  pagina: ReturnType<
    PDFDocument["addPage"]
  >,
  buffer: Buffer,
  x: number,
  y: number,
  anchoMaximo: number,
  altoMaximo: number
) {

  const tipo =
    obtenerTipoImagen(
      buffer
    );


  if (!tipo) {
    throw new Error(
      "La imagen de firma o sello no está en un formato compatible. Utilice PNG o JPG."
    );
  }


  let imagen;


  if (tipo === "PNG") {

    imagen =
      await pdf.embedPng(
        bufferAUint8Array(
          buffer
        )
      );

  } else {

    imagen =
      await pdf.embedJpg(
        bufferAUint8Array(
          buffer
        )
      );
  }


  const dimensiones =
    imagen.scale(1);


  let ancho =
    dimensiones.width;

  let alto =
    dimensiones.height;


  /*
   * Escalar conservando proporciones.
   */
  const escalaAncho =
    anchoMaximo /
    ancho;

  const escalaAlto =
    altoMaximo /
    alto;

  const escala =
    Math.min(
      escalaAncho,
      escalaAlto,
      1
    );


  ancho *= escala;
  alto *= escala;


  pagina.drawImage(
    imagen,
    {
      x,
      y,
      width: ancho,
      height: alto,
    }
  );


  return {
    width: ancho,
    height: alto,
  };
}


/*------------------------------------------
POST
GENERAR PREVISUALIZACIÓN PDF
------------------------------------------*/

export async function POST(
  request: Request
) {

  try {

    /*--------------------------------------
    SESIÓN
    --------------------------------------*/

    const sesion =
      await obtenerSesion();


    if (!sesion) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión autenticada.",
        },
        {
          status: 401,
        }
      );
    }


    /*--------------------------------------
    SOLO ADMINISTRADORES
    --------------------------------------*/

    if (
      sesion.rol !==
      "admin"
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para firmar documentos.",
        },
        {
          status: 403,
        }
      );
    }


    /*--------------------------------------
    LEER BODY
    --------------------------------------*/

    let body: any;

    try {

      body =
        await request.json();

    } catch {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El cuerpo de la solicitud no es válido.",
        },
        {
          status: 400,
        }
      );
    }


    const documentoId =
      String(
        body?.documentoId ??
        ""
      ).trim();

    const accion = String(body?.accion ?? "previsualizar").trim();


    const idFirma =
      String(
        body?.idFirma ??
        ""
      ).trim();

    const idSello =
      String(
        body?.idSello ??
        ""
      ).trim();


    if (!documentoId) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El documentoId es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }


    if (!['reenviar', 'imprimir'].includes(accion) && !idFirma) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "Debe seleccionar una firma.",
        },
        {
          status: 400,
        }
      );
    }


    if (!['reenviar', 'imprimir'].includes(accion) && !idSello) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "Debe seleccionar un sello institucional.",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    CARGAR INFORMACIÓN DEL SISTEMA
    --------------------------------------*/

    const gestionConsular =
      await obtenerGestionConsular();

    const caja =
      await obtenerCaja();

    const reportes =
      await obtenerReportesEntregados();


    const data:
      ReportesData = {

      gestionConsular,

      caja,

      reportes,

    };


    /*--------------------------------------
    OBTENER DOCUMENTOS
    --------------------------------------*/

    const documentos =
      obtenerDocumentos(
        CATEGORIA,
        data
      );


    /*--------------------------------------
    BUSCAR DOCUMENTO
    --------------------------------------*/

    const documento =
      documentos.find(
        (item) =>
          String(
            item.id
          ).trim() ===
          documentoId
      );


    if (!documento) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró la Constancia de Registro solicitada.",
        },
        {
          status: 404,
        }
      );
    }

    if (accion === "imprimir") {
      if (
        documento.categoria !== CATEGORIA ||
        documento.estadoProcesamiento !== "ENTREGADO" ||
        documento.metodoEntrega !== "CORREO" ||
        !documento.pdfConstanciaFirmada ||
        !documento.tokenValidacion
      ) {
        return NextResponse.json(
          { ok: false, error: "No se encontró el PDF firmado y enviado." },
          { status: 404 }
        );
      }
      const pdfFirmado = await descargarArchivoDrive(documento.pdfConstanciaFirmada);
      return new NextResponse(new Uint8Array(pdfFirmado), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Constancia_Registro_${String(documento.numeroRegistro || documento.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (accion === "reenviar") {
      if (
        documento.categoria !== CATEGORIA ||
        ![ESTADO_FIRMADO_PENDIENTE_ENVIO, "ENTREGADO"].includes(documento.estadoProcesamiento) ||
        !documento.pdfConstanciaFirmada ||
        !documento.tokenValidacion ||
        (documento.estadoProcesamiento === "ENTREGADO" && documento.metodoEntrega !== "CORREO")
      ) {
        return NextResponse.json(
          { ok: false, error: "No hay una constancia firmada pendiente de envío." },
          { status: 409 }
        );
      }

      const destinatario = await obtenerCorreoCiudadano(documento);
      const pdfFirmado = await descargarArchivoDrive(documento.pdfConstanciaFirmada);
      const tokenReenvio = String(documento.tokenValidacion || "").trim();
      if (!tokenReenvio) {
        return NextResponse.json(
          { ok: false, error: "La constancia no tiene un código de validación. Genere nuevamente el PDF firmado." },
          { status: 409 }
        );
      }
      const resultadoCorreo = await enviarDocumentoFirmadoPorCorreo({
        destinatario: destinatario.correo,
        nombre: destinatario.nombre || documento.solicitante,
        numeroRegistro: String(documento.numeroRegistro ?? documento.id),
        urlValidacion: `https://consultaconsulvenezbarranquilla.app/?token=${encodeURIComponent(tokenReenvio)}`,
        pdfBytes: new Uint8Array(pdfFirmado),
      });
      const fechaEnvio = new Date().toISOString();

      await actualizarDatosFirmaConstancia(documento.id, {
        estadoProcesamiento: "ENTREGADO",
        entregado: true,
        fechaEntrega: fechaEnvio,
        entregadoPor: sesion.usuario,
        observaciones: "Constancia firmada enviada por correo electrónico.",
        pdfConstanciaFirmada: documento.pdfConstanciaFirmada,
        metodoEntrega: "CORREO",
        fechaEnvioCorreo: fechaEnvio,
        correoDestino: resultadoCorreo.destinatario,
        usuarioFirma: documento.usuarioFirma || sesion.usuario,
        idCorreoEnviado: resultadoCorreo.messageId || "",
      });

      return NextResponse.json({
        ok: true,
        reenvio: true,
        destinatario: resultadoCorreo.destinatario,
      });
    }


    /*--------------------------------------
    VALIDAR CATEGORÍA
    --------------------------------------*/

    if (
      documento.categoria !==
      CATEGORIA
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El documento seleccionado no corresponde a una Constancia de Registro.",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    VALIDAR ESTADO
    --------------------------------------*/

    if (
      documento.estadoProcesamiento !==
      ESTADO_PENDIENTE
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El documento no se encuentra pendiente de firma.",
          estadoActual:
            documento.estadoProcesamiento ??
            "",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    VALIDAR PDF
    --------------------------------------*/

    const archivoPdfId =
      String(
        documento.pdfConstanciaRegistro ??
        ""
      ).trim();


    if (!archivoPdfId) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "La Constancia de Registro no tiene asociado un PDF en Google Drive.",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    OBTENER FIRMA
    --------------------------------------*/

    const firma =
      await obtenerFirmaPorId(
        idFirma
      );


    if (!firma) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "La firma seleccionada no existe.",
        },
        {
          status: 404,
        }
      );
    }


    /*--------------------------------------
    SEGURIDAD:

    LA FIRMA DEBE PERTENECER
    AL USUARIO AUTENTICADO
    --------------------------------------*/

    if (
      firma.usuario
        .trim()
        .toLowerCase() !==
      sesion.usuario
        .trim()
        .toLowerCase()
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No puede utilizar una firma perteneciente a otro usuario.",
        },
        {
          status: 403,
        }
      );
    }


    /*--------------------------------------
    LA FIRMA DEBE ESTAR ACTIVA
    --------------------------------------*/

    if (
      firma.activo !==
      "SI"
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "La firma seleccionada está inactiva.",
        },
        {
          status: 400,
        }
      );
    }

    if (accion === "firmar-enviar") {
      const codigoTOTP = String(body?.codigoTOTP ?? "").trim();
      if (!/^\d{6}$/.test(codigoTOTP)) {
        return NextResponse.json(
          { ok: false, error: "Ingrese el código vigente de 6 dígitos de Google Authenticator." },
          { status: 400 }
        );
      }

      const seguridad = await obtenerSeguridadUsuario(firma.usuario);
      if (seguridad?.totpConfigurado !== "SI" || !seguridad.totpSecretCifrado) {
        return NextResponse.json(
          { ok: false, error: "Configure Google Authenticator para la cuenta asociada a esta firma desde Usuarios > Authenticator antes de firmar." },
          { status: 409 }
        );
      }

      let codigoValido = false;
      try {
        const secretoTOTP = descifrarSecretoTOTP(seguridad.totpSecretCifrado);
        codigoValido = await verificarCodigoTOTP(secretoTOTP, codigoTOTP);
      } catch (error) {
        registrarErrorSeguro(
          "No fue posible validar el autenticador asociado a la firma.",
          error
        );
        return NextResponse.json(
          { ok: false, error: "No fue posible validar Google Authenticator. Revise la configuración del usuario." },
          { status: 500 }
        );
      }

      if (!codigoValido) {
        return NextResponse.json(
          { ok: false, error: "El código de Google Authenticator es incorrecto o venció." },
          { status: 401 }
        );
      }
    }


    /*--------------------------------------
    DESCARGAR PDF ORIGINAL
    --------------------------------------*/

    const pdfOriginal =
      await descargarArchivoDrive(
        archivoPdfId
      );


    if (
      !pdfOriginal ||
      pdfOriginal.length === 0
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible obtener el PDF original desde Google Drive.",
        },
        {
          status: 500,
        }
      );
    }


    /*--------------------------------------
    CARGAR PDF
    --------------------------------------*/

    const pdf =
      await PDFDocument.load(
        bufferAUint8Array(
          pdfOriginal
        )
      );


    const paginas =
      pdf.getPages();


    if (
      paginas.length === 0
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El PDF original no contiene páginas.",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    OBTENER PRIMERA PÁGINA
    --------------------------------------*/

    const pagina =
      paginas[
        paginas.length - 1
      ];


    const {
      width,
      height,
    } =
      pagina.getSize();

        /*--------------------------------------
    INSERTAR FOTO DE CARNET
    --------------------------------------*/

    const fotoCarnetId =
      String(
        documento.fotoCarnet ?? ""
      ).trim();

    if (fotoCarnetId) {

      try {

        const fotoBuffer =
          await descargarArchivoDrive(
            fotoCarnetId
          );

        if (
          fotoBuffer &&
          fotoBuffer.length > 0
        ) {

          /*
           * La fotografía se coloca
           * en la esquina superior izquierda,
           * respetando el diseño de la
           * Constancia de Registro.
           */

          const fotoAnchoMaximo = 85;

          const fotoAltoMaximo = 105;

          const fotoX = 50;

          const fotoY =
            height -
            fotoAltoMaximo -
            145;

          await insertarImagen(
            pdf,
            pagina,
            fotoBuffer,
            fotoX,
            fotoY,
            fotoAnchoMaximo,
            fotoAltoMaximo
          );

        }

      } catch (
        errorFoto
      ) {

        registrarErrorSeguro(
          "No fue posible insertar la foto de carnet:",
          errorFoto
        );

      }

    }


    /*--------------------------------------
    OBTENER SELLO INSTITUCIONAL
    --------------------------------------*/

    const sello =
      await obtenerSelloPorId(
        idSello
      );


    if (!sello) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El sello institucional seleccionado no existe.",
        },
        {
          status: 404,
        }
      );
    }


    if (sello.activo !== "SI") {

      return NextResponse.json(
        {
          ok: false,
          error:
            "El sello institucional seleccionado está inactivo.",
        },
        {
          status: 400,
        }
      );
    }


    /*--------------------------------------
    DESCARGAR FIRMA
    --------------------------------------*/

    const firmaBuffer =
      await descargarArchivoDrive(
        firma.archivoFirmaDriveId
      );


    if (
      !firmaBuffer ||
      firmaBuffer.length === 0
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible obtener la imagen de la firma desde Google Drive.",
        },
        {
          status: 500,
        }
      );
    }


    /*--------------------------------------
    INSERTAR FIRMA VISUAL
    --------------------------------------*/

    /*
     * Posición inicial:
     * parte inferior derecha.
     *
     * Esta posición es deliberadamente
     * conservadora para esta primera
     * versión.
     */

        const firmaAnchoMaximo =
  Math.min(
    190,
    width * 0.28
  );

const firmaAltoMaximo =
  75;

const selloAnchoMaximo =
  Math.min(
    120,
    width * 0.18
  );

const selloAltoMaximo =
  100;

/*
 * FIRMA Y SELLO
 *
 * Se colocan sobre la zona del
 * funcionario, bastante más arriba
 * y hacia la izquierda.
 */

const firmaX =
  60;

const firmaY =
  125;

const selloX =
  180;

const selloY =
  115;


    await insertarImagen(
      pdf,
      pagina,
      firmaBuffer,
      firmaX,
      firmaY,
      firmaAnchoMaximo,
      firmaAltoMaximo
    );


    /*--------------------------------------
    TEXTO DE FIRMA
    --------------------------------------*/

    const fuente =
      await pdf.embedFont(
        "Helvetica"
      );


    const textoFuncionario =
      sesion.nombre ||
      sesion.usuario;


    pagina.drawText(
      textoFuncionario,
      {
        x:
          firmaX,
        y:
          firmaY - 14,
        size:
          8,
        font:
          fuente,
        color:
          rgb(
            0.15,
            0.15,
            0.15
          ),
      }
    );


    pagina.drawText(
      "Funcionario autorizado",
      {
        x:
          firmaX,
        y:
          firmaY - 25,
        size:
          7,
        font:
          fuente,
        color:
          rgb(
            0.25,
            0.25,
            0.25
          ),
      }
    );


    /*--------------------------------------
    INSERTAR SELLO INSTITUCIONAL
    --------------------------------------*/

    if (
      sello &&
      sello.archivoSelloDriveId
    ) {

      try {

        const selloBuffer =
          await descargarArchivoDrive(
            sello.archivoSelloDriveId
          );


        if (
          selloBuffer &&
          selloBuffer.length > 0
        ) {

          await insertarImagen(
            pdf,
            pagina,
            selloBuffer,
            selloX,
            selloY,
            selloAnchoMaximo,
            selloAltoMaximo
          );
        }

      } catch (
        errorSelloArchivo
      ) {

        registrarErrorSeguro(
          "No fue posible insertar el sello institucional:",
          errorSelloArchivo
        );

      }
    }


    /*--------------------------------------
    TEXTO LEGAL Y VALIDACIÓN
    --------------------------------------*/

    /*
     * Texto informativo/legal de la constancia.
     *
     * Se coloca centrado en la parte inferior
     * de la página, en cursiva y con tamaño
     * reducido para no interferir con el
     * contenido principal del documento.
     */

    const fuenteCursiva =
      await pdf.embedFont(
        "Helvetica-Oblique"
      );

    const numeroRegistroConsular =
      String(
        documento.numeroRegistro ??
          ""
      ).trim();

    if (accion === "firmar-enviar" && !numeroRegistroConsular) {
      return NextResponse.json(
        { ok: false, error: "La constancia no tiene número de registro para generar el QR." },
        { status: 400 }
      );
    }

    const textoLegal =
      "Documento firmado electrónicamente con el mismo valor probatorio que la Ley otorga a los documentos escritos, según Gaceta Oficial N° 37.076, del 13 de diciembre de 2000 de la Ley de Mensajes de Datos y Firmas Electrónicas, artículo N° 4.\n" +
      `Para validar la autenticidad de este documento ingrese este código: ${numeroRegistroConsular} en\n` +
      "https://consultaconsulvenezbarranquilla.app";

    /*
     * Ajustamos las líneas manualmente para
     * conservar una presentación compacta
     * y centrada.
     */

    const lineasTextoLegal = [
      "Documento firmado electrónicamente con el mismo valor probatorio que la Ley otorga a los documentos escritos, según Gaceta Oficial N° 37.076, del",
      "13 de diciembre de 2000 de la Ley de Mensajes de Datos y Firmas Electrónicas, artículo N° 4.",
      `Para validar la autenticidad de este documento ingrese este código: ${numeroRegistroConsular} en`,
      "https://consultaconsulvenezbarranquilla.app",
    ];

    const textoLegalTamano =
      6.5;

    const textoLegalInterlineado =
      8;

    const textoLegalYInicial =
      42;

    for (
      let indice = 0;
      indice < lineasTextoLegal.length;
      indice++
    ) {

      const linea =
        lineasTextoLegal[indice];

      const anchoLinea =
        fuenteCursiva.widthOfTextAtSize(
          linea,
          textoLegalTamano
        );

      const xLinea =
        (width - anchoLinea) / 2;

      pagina.drawText(
        linea,
        {
          x:
            Math.max(
              xLinea,
              24
            ),
          y:
            textoLegalYInicial -
            indice *
              textoLegalInterlineado,
          size:
            textoLegalTamano,
          font:
            fuenteCursiva,
          color:
            rgb(
              0.18,
              0.18,
              0.18
            ),
        }
      );

    }

    const esFirmaFinal = accion === "firmar-enviar";
    const tokenValidacion = esFirmaFinal
      ? randomUUID()
      : "";
    const urlValidacion = esFirmaFinal
      ? `https://consultaconsulvenezbarranquilla.app/?token=${encodeURIComponent(tokenValidacion)}`
      : "";

    if (esFirmaFinal) {
      const qrPng = await QRCode.toBuffer(urlValidacion, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 1,
        width: 240,
      });
      const qrImage = await pdf.embedPng(new Uint8Array(qrPng));
      pagina.drawImage(qrImage, {
        x: width - 88,
        y: 78,
        width: 64,
        height: 64,
      });
      pagina.drawText("Escanee para validar", {
        x: width - 103,
        y: 69,
        size: 5.5,
        font: fuenteCursiva,
        color: rgb(0.18, 0.18, 0.18),
      });
    }

    /*--------------------------------------
    GENERAR IDENTIFICADOR DE PREVISUALIZACIÓN
    --------------------------------------*/

    const referencia =
      `PREVIEW-${documento.id}-${Date.now()}`;


    /*--------------------------------------
    METADATOS PDF
    --------------------------------------*/

    pdf.setTitle(
      "Constancia de Registro Consular"
    );

    pdf.setSubject(
      `Constancia de Registro Consular - ${documento.numeroRegistro ?? ""}`
    );

    pdf.setAuthor(
      "Consulado General de la República Bolivariana de Venezuela en Barranquilla"
    );

    pdf.setCreator(
      "Consulnet Barranquilla"
    );


    /*--------------------------------------
    GUARDAR PDF
    --------------------------------------*/

    const pdfBytes =
      await pdf.save();

    if (esFirmaFinal) {
      const destinatario = await obtenerCorreoCiudadano(documento);
      const archivo = new File(
        [Buffer.from(pdfBytes) as unknown as BlobPart],
        `Constancia_Registro_${documento.numeroRegistro || documento.id}.pdf`,
        { type: "application/pdf" }
      );
      const subida = await subirArchivoDrive({
        archivo,
        categoria: CATEGORIA,
        tipoArchivo: "PDF_FIRMADO",
        documentoId: documento.id,
      });

      await actualizarDatosFirmaConstancia(documento.id, {
        estadoProcesamiento: ESTADO_FIRMADO_PENDIENTE_ENVIO,
        entregado: false,
        pdfConstanciaFirmada: subida.id,
        usuarioFirma: sesion.usuario,
        tokenValidacion,
      });

      const resultadoCorreo = await enviarDocumentoFirmadoPorCorreo({
        destinatario: destinatario.correo,
        nombre: destinatario.nombre || documento.solicitante,
        numeroRegistro: String(documento.numeroRegistro ?? documento.id),
        urlValidacion,
        pdfBytes: new Uint8Array(pdfBytes),
      });
      const fechaEnvio = new Date().toISOString();

      await actualizarDatosFirmaConstancia(documento.id, {
        estadoProcesamiento: "ENTREGADO",
        entregado: true,
        fechaEntrega: fechaEnvio,
        entregadoPor: sesion.usuario,
        observaciones: "Constancia firmada enviada por correo electrónico.",
        pdfConstanciaFirmada: subida.id,
        metodoEntrega: "CORREO",
        fechaEnvioCorreo: fechaEnvio,
        correoDestino: resultadoCorreo.destinatario,
        usuarioFirma: sesion.usuario,
        idCorreoEnviado: resultadoCorreo.messageId || "",
        tokenValidacion,
      });

      return NextResponse.json({
        ok: true,
        destinatario: resultadoCorreo.destinatario,
        messageId: resultadoCorreo.messageId,
      });
    }


    /*--------------------------------------
    RESPUESTA
    --------------------------------------*/

    return new NextResponse(
      Buffer.from(
        pdfBytes
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="constancia-registro-${documento.numeroRegistro || documento.id}.pdf"`,

          "X-Documento-Id":
            documento.id,

          "X-Estado":
            documento.estadoProcesamiento ??
            "",

          "X-Referencia":
            referencia,

          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );


  } catch (error) {

    registrarErrorSeguro(
      "Error POST /api/docfirmar/generar-pdf:",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "No fue posible generar la previsualización del PDF.",
      },
      {
        status: 500,
      }
    );
  }
}
