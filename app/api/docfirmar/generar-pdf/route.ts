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

const CATEGORIA_REGISTRO =
  "CONSTANCIA_REGISTRO";
const CATEGORIA_CONSULAR = "CONSTANCIA_CONSULAR";
const CATEGORIAS_FIRMA = [CATEGORIA_REGISTRO, CATEGORIA_CONSULAR];

const ESTADO_PENDIENTE =
  "PENDIENTE_FIRMA";
const ESTADO_FIRMADO_PENDIENTE_ENVIO =
  "FIRMADO_PENDIENTE_ENVIO";

class ErrorPdfVerificacion extends Error {}

function normalizarDocumento(valor: unknown) {
  return String(valor ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function obtenerCorreoCiudadano(documento: ReporteEntregado, preferirDestinoGuardado = false) {
  const correoPrioritario = preferirDestinoGuardado
    ? documento.correoSolicitante || documento.correoDestino
    : documento.correoSolicitante;
  if (correoPrioritario && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoPrioritario.trim())) {
    return {
      correo: correoPrioritario.trim(),
      nombre: documento.solicitante,
    };
  }

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

async function cargarPdfFuenteFirma(documento: ReporteEntregado, archivoPrincipalId: string, anexarFichaSaime: boolean) {
  const pdfPrincipal = await descargarArchivoDrive(archivoPrincipalId);
  if (!anexarFichaSaime) return { bytes: pdfPrincipal, paginaFichaSaime: null as number | null };

  const fichaSaimeId = String(documento.pdfFichaIdentidadSaime || "").trim();
  if (!fichaSaimeId) {
    throw new Error("Verificacion de Identidad requiere el PDF de la Ficha SAIME.");
  }

  const pdfSaime = await descargarArchivoDrive(fichaSaimeId);
  const combinado = await PDFDocument.create();
  const principal = await PDFDocument.load(new Uint8Array(pdfPrincipal));
  const ficha = await PDFDocument.load(new Uint8Array(pdfSaime));
  if (principal.getPageCount() !== 1 || ficha.getPageCount() !== 1) {
    throw new ErrorPdfVerificacion("Para VER-I, el PDF de Registro Consular y la Ficha SAIME deben tener una página cada uno.");
  }
  const paginaFichaSaime = principal.getPageCount();

  for (const fuente of [principal, ficha]) {
    const paginas = await combinado.copyPages(fuente, fuente.getPageIndices());
    paginas.forEach((pagina) => combinado.addPage(pagina));
  }

  return { bytes: Buffer.from(await combinado.save()), paginaFichaSaime };
}

async function prepararPrimeraPaginaVerificacion(
  pdf: PDFDocument,
  documento: ReporteEntregado,
  firmaBuffer: Buffer,
  selloBuffer: Buffer,
  nombreFuncionario: string,
) {
  const primeraPagina = pdf.getPages()[0];
  if (!primeraPagina) throw new Error("El PDF de Verificación de Identidad no tiene página de Registro Consular.");

  const fotoId = String(documento.fotoCarnet || "").trim();
  if (!fotoId) throw new Error("La Verificación de Identidad no tiene una foto de carnet asociada.");
  const fotoBuffer = await descargarArchivoDrive(fotoId);
  const { width, height } = primeraPagina.getSize();

  await insertarImagen(pdf, primeraPagina, fotoBuffer, 50, height - 105 - 145, 85, 105);
  await insertarImagen(pdf, primeraPagina, firmaBuffer, 60, 125, Math.min(190, width * 0.28), 75);
  await insertarImagen(pdf, primeraPagina, selloBuffer, 180, 115, Math.min(120, width * 0.18), 100);

  const fuente = await pdf.embedFont("Helvetica");
  primeraPagina.drawText(nombreFuncionario, {
    x: 60,
    y: 111,
    size: 8,
    font: fuente,
    color: rgb(0.15, 0.15, 0.15),
  });
  primeraPagina.drawText("Funcionario autorizado", {
    x: 60,
    y: 100,
    size: 7,
    font: fuente,
    color: rgb(0.25, 0.25, 0.25),
  });
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

    if (sesion.rol !== "admin" && sesion.rol !== "analista") {

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

    if (sesion.rol === "analista" && !["imprimir", "reenviar"].includes(accion)) {
      return NextResponse.json(
        { ok: false, error: "El rol analista solo puede imprimir o reenviar documentos firmados." },
        { status: 403 }
      );
    }


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

    const posicionesFirma = body?.posicionesFirma;
    const ubicacionValida = (valor: any) =>
      Number.isInteger(valor?.pagina) &&
      Number.isFinite(valor?.x) && valor.x >= 0 && valor.x <= 1 &&
      Number.isFinite(valor?.y) && valor.y >= 0 && valor.y <= 1;


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


    if (!['previsualizar', 'firmar-enviar', 'reenviar', 'imprimir', 'revertir', 'original'].includes(accion)) {
      return NextResponse.json({ ok: false, error: "La acción solicitada no es válida." }, { status: 400 });
    }

    if (!['reenviar', 'imprimir', 'revertir', 'original'].includes(accion) && !idFirma) {

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


    if (!['reenviar', 'imprimir', 'revertir', 'original'].includes(accion) && !idSello) {

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

    const documentos = CATEGORIAS_FIRMA.flatMap((categoria) =>
      obtenerDocumentos(categoria as "CONSTANCIA_REGISTRO" | "CONSTANCIA_CONSULAR", data)
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

    const esRegistro = documento.categoria === CATEGORIA_REGISTRO;
    const esConsular = documento.categoria === CATEGORIA_CONSULAR;
    const esVerificacionIdentidad =
      esRegistro && String(documento.codigoActuacion || "").trim().toUpperCase() === "VER-I";
    const requiereUbicaciones = esConsular || esVerificacionIdentidad;
    if (!esRegistro && !esConsular) {
      return NextResponse.json({ ok: false, error: "El documento no pertenece a una categoría firmable." }, { status: 400 });
    }

    if (sesion.rol === "analista" && (
      documento.estadoProcesamiento !== "ENTREGADO" ||
      documento.metodoEntrega !== "CORREO" ||
      !String(documento.pdfConstanciaFirmada || "").trim() ||
      !String(documento.tokenValidacion || "").trim()
    )) {
      return NextResponse.json(
        { ok: false, error: "El documento no está firmado y enviado por correo." },
        { status: 403 }
      );
    }

    const archivoPdfOriginalId = String(
      esConsular ? documento.pdfConstanciaConsular ?? "" : documento.pdfConstanciaRegistro ?? ""
    ).trim();

    if (accion === "original") {
      if (!requiereUbicaciones || !archivoPdfOriginalId) {
        return NextResponse.json({ ok: false, error: "No se encontró el PDF original de la Constancia Consular." }, { status: 404 });
      }
      const fuentePdf = await cargarPdfFuenteFirma(documento, archivoPdfOriginalId, esVerificacionIdentidad);
      let bytesOriginal = fuentePdf.bytes;
      if (esVerificacionIdentidad) {
        const firmaSeleccionada = await obtenerFirmaPorId(idFirma);
        const selloSeleccionado = await obtenerSelloPorId(idSello);
        if (!firmaSeleccionada || !selloSeleccionado) {
          return NextResponse.json({ ok: false, error: "Seleccione una firma y un sello institucional válidos." }, { status: 400 });
        }
        if (firmaSeleccionada.usuario.trim().toLowerCase() !== sesion.usuario.trim().toLowerCase()) {
          return NextResponse.json({ ok: false, error: "No puede utilizar una firma perteneciente a otro usuario." }, { status: 403 });
        }
        if (firmaSeleccionada.activo !== "SI" || selloSeleccionado.activo !== "SI") {
          return NextResponse.json({ ok: false, error: "La firma o el sello seleccionado está inactivo." }, { status: 400 });
        }
        const pdfBase = await PDFDocument.load(new Uint8Array(bytesOriginal));
        const firmaBase = await descargarArchivoDrive(firmaSeleccionada.archivoFirmaDriveId);
        const selloBase = await descargarArchivoDrive(selloSeleccionado.archivoSelloDriveId);
        await prepararPrimeraPaginaVerificacion(
          pdfBase,
          documento,
          firmaBase,
          selloBase,
          sesion.nombre || sesion.usuario,
        );
        bytesOriginal = Buffer.from(await pdfBase.save());
      }
      return new NextResponse(new Uint8Array(bytesOriginal), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${esVerificacionIdentidad ? "verificacion-identidad" : "constancia-consular"}-original.pdf"`,
          "Cache-Control": "no-store",
          ...(fuentePdf.paginaFichaSaime === null ? {} : { "X-Verificacion-Saime-Page": String(fuentePdf.paginaFichaSaime) }),
        },
      });
    }

    if (
      requiereUbicaciones &&
      ["previsualizar", "firmar-enviar"].includes(accion) &&
      ![posicionesFirma?.firma, posicionesFirma?.sello, posicionesFirma?.qr, ...(esConsular ? [posicionesFirma?.legal] : [])].every(ubicacionValida)
    ) {
      return NextResponse.json(
        { ok: false, error: "Debe indicar en qué página y posición van la firma, el sello y el QR." },
        { status: 400 }
      );
    }

    if (accion === "revertir") {
      if (
        !CATEGORIAS_FIRMA.includes(documento.categoria) ||
        documento.estadoProcesamiento !== "ENTREGADO" ||
        documento.metodoEntrega !== "CORREO" ||
        !documento.pdfConstanciaFirmada ||
        !documento.tokenValidacion
      ) {
        return NextResponse.json(
          { ok: false, error: "Solo se puede revertir una constancia firmada y enviada por correo." },
          { status: 409 }
        );
      }

      await actualizarDatosFirmaConstancia(documento.id, {
        estadoProcesamiento: ESTADO_PENDIENTE,
        entregado: false,
        fechaEntrega: "",
        entregadoPor: "",
        observaciones: "Firma revertida para corregir y generar un nuevo documento.",
        pdfConstanciaFirmada: "",
        metodoEntrega: "",
        fechaEnvioCorreo: "",
        correoDestino: "",
        usuarioFirma: "",
        idCorreoEnviado: "",
        tokenValidacion: "",
      });

      return NextResponse.json({
        ok: true,
        mensaje: "Firma revertida. El documento volvió a Pendiente por Firma.",
      });
    }

    if (accion === "imprimir") {
      if (
        !CATEGORIAS_FIRMA.includes(documento.categoria) ||
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
          "Content-Disposition": `inline; filename="Constancia_${String(documento.correlativoConstancia || documento.numeroRegistro || documento.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (accion === "reenviar") {
      if (
        !CATEGORIAS_FIRMA.includes(documento.categoria) ||
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

      const destinatario = await obtenerCorreoCiudadano(documento, true);
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
        numeroRegistro: String(documento.correlativoConstancia || documento.numeroRegistro || documento.id),
        tipoDocumento: esConsular ? "Constancia Consular" : "Constancia de Registro Consular",
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

    const archivoPdfId = archivoPdfOriginalId;


    if (!archivoPdfId) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "La constancia no tiene asociado su PDF original en Google Drive.",
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

    const fuentePdf =
      await cargarPdfFuenteFirma(documento, archivoPdfId, esVerificacionIdentidad);

    const pdfOriginal = fuentePdf.bytes;


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

    const ubicacionesVerificacion = [posicionesFirma.firma, posicionesFirma.sello, posicionesFirma.qr] as { pagina: number; x: number; y: number }[];
    if (esVerificacionIdentidad && ubicacionesVerificacion.some((ubicacion) => ubicacion.pagina !== fuentePdf.paginaFichaSaime)) {
      return NextResponse.json({ ok: false, error: "En VER-I, firma, sello y QR deben ubicarse en la primera página de la Ficha SAIME." }, { status: 400 });
    }

    if (requiereUbicaciones && [posicionesFirma.firma, posicionesFirma.sello, posicionesFirma.qr].some((ubicacion: any) => ubicacion.pagina >= paginas.length)) {
      return NextResponse.json({ ok: false, error: "Una ubicación seleccionada apunta a una página que no existe en el PDF." }, { status: 400 });
    }


    /*--------------------------------------
    OBTENER PRIMERA PÁGINA
    --------------------------------------*/

    const pagina =
      paginas[
        paginas.length - 1
      ];


      const { width } = pagina.getSize();

        /*--------------------------------------
    INSERTAR FOTO DE CARNET
    --------------------------------------*/

    const fotoCarnetId =
      String(
        documento.fotoCarnet ?? ""
      ).trim();

    if (esRegistro && !esVerificacionIdentidad && fotoCarnetId) {

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

          const paginaFoto = pagina;
          const { height: altoPaginaFoto } = paginaFoto.getSize();
          const fotoAltoMaximo = 105;
          const fotoX = 50;
          const fotoY = altoPaginaFoto - fotoAltoMaximo - 145;

          await insertarImagen(
            pdf,
            paginaFoto,
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


    if (esRegistro && !requiereUbicaciones) {
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
    }


    /*--------------------------------------
    INSERTAR SELLO INSTITUCIONAL
    --------------------------------------*/

    if (
      !requiereUbicaciones &&
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

    const esFirmaFinal = accion === "firmar-enviar";
    const tokenValidacion = esFirmaFinal
      ? randomUUID()
      : requiereUbicaciones && accion === "previsualizar"
        ? `PREVIEW-${randomUUID()}`
        : "";
    const urlValidacion = tokenValidacion
      ? `https://consultaconsulvenezbarranquilla.app/?token=${encodeURIComponent(tokenValidacion)}`
      : "";
    const numeroCorrelativoConsular = String(documento.correlativoConstancia || documento.numeroRegistro || "").trim();
    const lineasMensajeLegalConsular = [
      "Documento firmado electrónicamente con el mismo valor probatorio que la Ley otorga a los documentos escritos, según Gaceta Oficial N° 37.076, del",
      "13 de diciembre de 2000 de la Ley de Mensajes de Datos y Firmas Electrónicas, artículo N° 4.",
      `Para validar la autenticidad de este documento ingrese este código: ${numeroCorrelativoConsular} en`,
      "https://consultaconsulvenezbarranquilla.app",
    ];

    if (requiereUbicaciones) {
      const selloBuffer = await descargarArchivoDrive(sello.archivoSelloDriveId);
      if (esVerificacionIdentidad) {
        await prepararPrimeraPaginaVerificacion(
          pdf,
          documento,
          firmaBuffer,
          selloBuffer,
          sesion.nombre || sesion.usuario,
        );
      }
      const qrPng = await QRCode.toBuffer(urlValidacion || "https://consultaconsulvenezbarranquilla.app", {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 1,
        width: 240,
      });
      const qrImage = await pdf.embedPng(new Uint8Array(qrPng));
      const fuenteFirma = await pdf.embedFont("Helvetica");

      const insertarEnUbicacion = async (
        tipo: "firma" | "sello" | "qr",
        imagen: Buffer | Awaited<ReturnType<typeof pdf.embedPng>>,
        anchoMaximo: number,
        altoMaximo: number
      ) => {
        const ubicacion = posicionesFirma[tipo];
        const paginaDestino = paginas[ubicacion.pagina];
        const caja = paginaDestino.getCropBox();
        const anchoPagina = caja.width;
        const altoPagina = caja.height;
        const rotacion = ((paginaDestino.getRotation().angle % 360) + 360) % 360;
        const xVisual = ubicacion.x;
        const yVisual = ubicacion.y;
        let centroX = caja.x + xVisual * anchoPagina;
        let centroY = caja.y + (1 - yVisual) * altoPagina;
        if (rotacion === 90) {
          centroX = caja.x + (1 - yVisual) * anchoPagina;
          centroY = caja.y + xVisual * altoPagina;
        } else if (rotacion === 180) {
          centroX = caja.x + (1 - xVisual) * anchoPagina;
          centroY = caja.y + yVisual * altoPagina;
        } else if (rotacion === 270) {
          centroX = caja.x + yVisual * anchoPagina;
          centroY = caja.y + (1 - xVisual) * altoPagina;
        }

        if (tipo === "qr") {
          const lado = 64;
          paginaDestino.drawImage(qrImage, {
            x: Math.max(caja.x, Math.min(caja.x + anchoPagina - lado, centroX - lado / 2)),
            y: Math.max(caja.y, Math.min(caja.y + altoPagina - lado, centroY - lado / 2)),
            width: lado,
            height: lado,
          });
          paginaDestino.drawText("Escanee para validar", {
            x: Math.max(caja.x, Math.min(caja.x + anchoPagina - 120, centroX - 48)),
            y: Math.max(caja.y + 4, centroY - 42),
            size: 6,
            font: fuenteCursiva,
            color: rgb(0.18, 0.18, 0.18),
          });
          return;
        }

        const x = Math.max(caja.x, Math.min(caja.x + anchoPagina - anchoMaximo, centroX - anchoMaximo / 2));
        const y = Math.max(caja.y, Math.min(caja.y + altoPagina - altoMaximo, centroY - altoMaximo / 2));
        await insertarImagen(pdf, paginaDestino, imagen as Buffer, x, y, anchoMaximo, altoMaximo);
        if (tipo === "firma") {
          paginaDestino.drawText(sesion.nombre || sesion.usuario, {
            x,
            y: Math.max(2, y - 12),
            size: 7,
            font: fuenteFirma,
            color: rgb(0.15, 0.15, 0.15),
          });
        }
      };

      await insertarEnUbicacion("firma", firmaBuffer, 190, 75);
      await insertarEnUbicacion("sello", selloBuffer, 120, 100);
      if (accion === "previsualizar" || esFirmaFinal) {
        await insertarEnUbicacion("qr", qrImage, 64, 64);
      }

      if (esConsular && (accion === "previsualizar" || esFirmaFinal)) {
        const ubicacion = posicionesFirma.legal;
        const paginaLegal = paginas[ubicacion.pagina];
        const cajaLegal = paginaLegal.getCropBox();
        const anchoLegal = cajaLegal.width;
        const altoLegal = cajaLegal.height;
        const giroLegal = ((paginaLegal.getRotation().angle % 360) + 360) % 360;
        let centroX = cajaLegal.x + ubicacion.x * anchoLegal;
        let centroY = cajaLegal.y + (1 - ubicacion.y) * altoLegal;
        if (giroLegal === 90) {
          centroX = cajaLegal.x + (1 - ubicacion.y) * anchoLegal;
          centroY = cajaLegal.y + ubicacion.x * altoLegal;
        } else if (giroLegal === 180) {
          centroX = cajaLegal.x + (1 - ubicacion.x) * anchoLegal;
          centroY = cajaLegal.y + ubicacion.y * altoLegal;
        } else if (giroLegal === 270) {
          centroX = cajaLegal.x + ubicacion.y * anchoLegal;
          centroY = cajaLegal.y + (1 - ubicacion.x) * altoLegal;
        }
        const tamanoLegal = 6.5;
        const interlineadoLegal = 8;
        lineasMensajeLegalConsular.forEach((linea, indice) => {
          const anchoLinea = fuenteCursiva.widthOfTextAtSize(linea, tamanoLegal);
          paginaLegal.drawText(linea, {
            x: Math.max(cajaLegal.x + 4, Math.min(cajaLegal.x + anchoLegal - anchoLinea - 4, centroX - anchoLinea / 2)),
            y: Math.max(cajaLegal.y + 4, Math.min(cajaLegal.y + altoLegal - 8, centroY + ((lineasMensajeLegalConsular.length - 1) * interlineadoLegal) / 2 - indice * interlineadoLegal)),
            size: tamanoLegal,
            font: fuenteCursiva,
            color: rgb(0.18, 0.18, 0.18),
          });
        });
      }
    }

    const numeroRegistroConsular =
      String(
        documento.numeroRegistro ??
          ""
      ).trim();

    if (esRegistro && !esVerificacionIdentidad && esFirmaFinal && !numeroRegistroConsular) {
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

    if (esRegistro && !esVerificacionIdentidad) for (
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

    if (esRegistro && !esVerificacionIdentidad && esFirmaFinal) {
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

    const nombreTipoDocumento = esConsular
      ? "Constancia Consular"
      : esVerificacionIdentidad
        ? "Verificacion de Identidad"
        : "Constancia de Registro Consular";
    const numeroDocumentoConstancia = String(
      documento.correlativoConstancia || documento.numeroRegistro || (esVerificacionIdentidad ? documento.recibo : "") || documento.id
    );

    pdf.setTitle(nombreTipoDocumento);

    pdf.setSubject(
      `${nombreTipoDocumento} - ${numeroDocumentoConstancia}`
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
        `${esConsular ? "Constancia_Consular" : esVerificacionIdentidad ? "Verificacion_Identidad" : "Constancia_Registro"}_${numeroDocumentoConstancia}.pdf`,
        { type: "application/pdf" }
      );
      const subida = await subirArchivoDrive({
        archivo,
        categoria: documento.categoria,
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
        numeroRegistro: numeroDocumentoConstancia,
        tipoDocumento: nombreTipoDocumento,
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
            `inline; filename="constancia-${esConsular ? "consular" : "registro"}-${numeroDocumentoConstancia.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,

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
        status: error instanceof ErrorPdfVerificacion ? 400 : 500,
      }
    );
  }
}
