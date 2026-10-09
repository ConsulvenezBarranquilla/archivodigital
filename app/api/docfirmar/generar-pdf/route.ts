import { NextResponse } from "next/server";

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
} from "@/lib/googleDrive";


/*------------------------------------------
CONFIGURACIÓN
------------------------------------------*/

const CATEGORIA =
  "CONSTANCIA_REGISTRO";

const ESTADO_PENDIENTE =
  "PENDIENTE_FIRMA";


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


    if (!idFirma) {

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


    if (!idSello) {

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

        console.error(
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

        console.error(
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

    console.error(
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