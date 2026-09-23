import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import fs from "fs";
import path from "path";

// ======================================================
// TIPOS
// ======================================================

type Actuacion = {
  actuacion: string;
  abreviacion?: string;
  monto: number;
};

type DatosReciboTermico = {
  correlativo: string;
  fecha: string;
  documento: string;
  nombre: string;
  actuaciones: Actuacion[];
  totalUSD: number;
  correo?: string;
  correoEnviado?: boolean;
  correoNoAplica?: boolean;
};

// ======================================================
// CONSTANTES
// ======================================================

const ANCHO_MM = 80;

const MM_A_PUNTOS = 72 / 25.4;

const ANCHO_PAGINA =
  ANCHO_MM * MM_A_PUNTOS;

// Altura mínima del recibo.
// El sistema aumentará la altura automáticamente.
const ALTO_MINIMO_MM = 42;

const ALTO_MINIMO_PUNTOS =
  ALTO_MINIMO_MM * MM_A_PUNTOS;

// Márgenes
const MARGEN_X = 10;
const MARGEN_SUPERIOR = 7;
const MARGEN_INFERIOR = 7;

// ======================================================
// GENERADOR
// ======================================================

export async function generarPdfReciboTermico(
  datos: DatosReciboTermico
): Promise<Uint8Array> {

  // ====================================================
  // FUENTES Y DOCUMENTO
  // ====================================================

  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const fontBold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  // ====================================================
  // LOGO
  // ====================================================

  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo.png"
    );

  if (
    !fs.existsSync(logoPath)
  ) {
    throw new Error(
      "No se encontró el logo en /public/logo.png"
    );
  }

  const logoBytes =
    fs.readFileSync(
      logoPath
    );

  const logo =
    await pdfDoc.embedPng(
      logoBytes
    );

  // ====================================================
  // COLOR
  // ====================================================

  const negro =
    rgb(
      0,
      0,
      0
    );

  // ====================================================
  // FUNCIONES AUXILIARES
  // ====================================================

  function textoSeguro(
    valor: unknown
  ): string {

    return String(
      valor ?? ""
    ).trim();

  }

  function formatearMonto(
    monto: number
  ): string {

    return Number(
      monto || 0
    ).toFixed(2);

  }

  function formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {
      return "";
    }

    const fechaObjeto =
      new Date(
        fecha
      );

    if (
      Number.isNaN(
        fechaObjeto.getTime()
      )
    ) {
      return fecha;
    }

    return new Intl.DateTimeFormat(
      "es-CO",
      {
        timeZone:
          "America/Bogota",

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    ).format(
      fechaObjeto
    );
  }

  function ajustarTexto(
    texto: string,
    maxCaracteres: number
  ): string {

    const limpio =
      textoSeguro(
        texto
      );

    if (
      limpio.length <=
      maxCaracteres
    ) {
      return limpio;
    }

    return (
      limpio.substring(
        0,
        maxCaracteres - 3
      ) + "..."
    );
  }

  function dividirTexto(
    texto: string,
    maxCaracteres: number
  ): string[] {

    const limpio =
      textoSeguro(
        texto
      );

    if (!limpio) {
      return [""];
    }

    const palabras =
      limpio.split(/\s+/);

    const lineas: string[] = [];

    let actual = "";

    for (
      const palabra of palabras
    ) {

      const prueba =
        actual
          ? `${actual} ${palabra}`
          : palabra;

      if (
        prueba.length <=
        maxCaracteres
      ) {

        actual = prueba;

      } else {

        if (actual) {
          lineas.push(
            actual
          );
        }

        actual = palabra;
      }
    }

    if (actual) {
      lineas.push(
        actual
      );
    }

    return lineas;
  }

  function anchoTexto(
    texto: string,
    size: number,
    bold = false
  ): number {

    const fuente =
      bold
        ? fontBold
        : font;

    return fuente.widthOfTextAtSize(
      texto,
      size
    );
  }

  function dibujarTextoCentrado(
    page: any,
    texto: string,
    y: number,
    size: number,
    bold = false
  ) {

    const fuente =
      bold
        ? fontBold
        : font;

    const ancho =
      fuente.widthOfTextAtSize(
        texto,
        size
      );

    page.drawText(
      texto,
      {
        x:
          (
            ANCHO_PAGINA -
            ancho
          ) / 2,

        y,

        size,

        font:
          fuente,

        color:
          negro,
      }
    );
  }

  // ====================================================
  // PREPARAR DATOS
  // ====================================================

  const nombre =
    ajustarTexto(
      datos.nombre,
      34
    );

  const documento =
    ajustarTexto(
      datos.documento,
      24
    );

  const fecha =
    formatearFecha(
      datos.fecha
    );

  const actuaciones =
    datos.actuaciones || [];

  // ====================================================
  // CALCULAR ALTURA REAL
  // ====================================================

  /*
   * Todas las medidas aquí están en puntos PDF.
   *
   * La página crecerá solamente cuando sea necesario.
   */

  const anchoMaxLogo =
    38;

  const altoMaxLogo =
    20;

  const escalaLogo =
    Math.min(
      anchoMaxLogo /
        logo.width,

      altoMaxLogo /
        logo.height
    );

  const anchoLogo =
    logo.width *
    escalaLogo;

  const altoLogo =
    logo.height *
    escalaLogo;

  let alturaNecesaria =
    MARGEN_SUPERIOR;

  // Logo
  alturaNecesaria +=
    altoLogo + 4;

  // RECIBO
  alturaNecesaria +=
    9 + 9;

  // Correlativo
  alturaNecesaria +=
    9 + 5;

  // Línea
  alturaNecesaria +=
    5;

  // Nombre
  alturaNecesaria +=
    8;

  // Documento
  alturaNecesaria +=
    8;

  // Fecha
  alturaNecesaria +=
    8;

  // Línea
  alturaNecesaria +=
    5;

  // Encabezado actuaciones
  alturaNecesaria +=
    8;

  // Actuaciones
  for (
    const actuacion
    of actuaciones
  ) {

    const descripcion =
      textoSeguro(
        actuacion.abreviacion ||
        actuacion.actuacion
      );

    const lineas =
      dividirTexto(
        descripcion,
        27
      );

    alturaNecesaria +=
      Math.max(
        8,
        lineas.length * 7
      );
  }

  // Línea antes del total
  alturaNecesaria +=
    5;

  // Total
  alturaNecesaria +=
    11;

  // Pie
  alturaNecesaria +=
    7;

  alturaNecesaria +=
    7;

  // URL
  alturaNecesaria +=
    7;

  // Teléfono
  alturaNecesaria +=
    7;

  // Mensaje correo
  if (
    datos.correoEnviado === true &&
    textoSeguro(datos.correo)
  ) {

    const lineasCorreo =
      dividirTexto(
        `Una copia digital del recibo ${textoSeguro(
          datos.correlativo
        )} ha sido enviado a su correo: ${textoSeguro(
          datos.correo
        )}`,
        34
      );

    alturaNecesaria +=
      4;

    alturaNecesaria +=
      lineasCorreo.length *
      6;
  }

  alturaNecesaria +=
    MARGEN_INFERIOR;

  const ALTO_PAGINA =
    Math.max(
      ALTO_MINIMO_PUNTOS,
      alturaNecesaria
    );

  // ====================================================
  // CREAR PÁGINA CON ALTURA DINÁMICA
  // ====================================================

  const page =
    pdfDoc.addPage([
      ANCHO_PAGINA,
      ALTO_PAGINA,
    ]);

  // ====================================================
  // POSICIÓN VERTICAL
  // ====================================================

  let y =
    ALTO_PAGINA -
    MARGEN_SUPERIOR;

  // ====================================================
  // LOGO
  // ====================================================

  page.drawImage(
    logo,
    {
      x:
        (
          ANCHO_PAGINA -
          anchoLogo
        ) / 2,

      y:
        y -
        altoLogo,

      width:
        anchoLogo,

      height:
        altoLogo,
    }
  );

  y -=
    altoLogo + 4;

  // ====================================================
  // RECIBO
  // ====================================================

  dibujarTextoCentrado(
    page,
    "RECIBO",
    y,
    8.5,
    true
  );

  y -= 10;

  // ====================================================
  // CORRELATIVO
  // ====================================================

  dibujarTextoCentrado(
    page,
    `Nº ${textoSeguro(
      datos.correlativo
    )}`,
    y,
    7.5,
    true
  );

  y -= 7;

  // ====================================================
  // LÍNEA
  // ====================================================

  page.drawLine({
    start: {
      x:
        MARGEN_X,
      y,
    },

    end: {
      x:
        ANCHO_PAGINA -
        MARGEN_X,
      y,
    },

    thickness:
      0.5,

    color:
      negro,
  });

  y -= 7;

  // ====================================================
  // DATOS DEL CIUDADANO
  // ====================================================

  page.drawText(
    "NOMBRE:",
    {
      x:
        MARGEN_X,

      y,

      size:
        6.2,

      font:
        fontBold,

      color:
        negro,
    }
  );

  page.drawText(
    ` ${nombre}`,
    {
      x:
        MARGEN_X + 28,

      y,

      size:
        6.2,

      font,

      color:
        negro,
    }
  );

  y -= 8;

  // ----------------------------------------------------
  // DOCUMENTO
  // ----------------------------------------------------

  page.drawText(
    "DOCUMENTO:",
    {
      x:
        MARGEN_X,

      y,

      size:
        6.2,

      font:
        fontBold,

      color:
        negro,
    }
  );

  page.drawText(
    ` ${documento}`,
    {
      x:
        MARGEN_X + 42,

      y,

      size:
        6.2,

      font,

      color:
        negro,
    }
  );

  y -= 8;

  // ----------------------------------------------------
  // FECHA
  // ----------------------------------------------------

  page.drawText(
    "FECHA:",
    {
      x:
        MARGEN_X,

      y,

      size:
        6.2,

      font:
        fontBold,

      color:
        negro,
    }
  );

  page.drawText(
    fecha,
    {
      x:
        MARGEN_X + 28,

      y,

      size:
        6.2,

      font,

      color:
        negro,
    }
  );

  y -= 7;

  // ====================================================
  // LÍNEA
  // ====================================================

  page.drawLine({
    start: {
      x:
        MARGEN_X,
      y,
    },

    end: {
      x:
        ANCHO_PAGINA -
        MARGEN_X,
      y,
    },

    thickness:
      0.5,

    color:
      negro,
  });

  y -= 7;

  // ====================================================
  // ACTUACIONES
  // ====================================================

  page.drawText(
    "ACTUACION",
    {
      x:
        MARGEN_X,

      y,

      size:
        6.2,

      font:
        fontBold,

      color:
        negro,
    }
  );

  const textoValor =
    "VALOR";

  page.drawText(
    textoValor,
    {
      x:
        ANCHO_PAGINA -
        MARGEN_X -
        anchoTexto(
          textoValor,
          6.2,
          true
        ),

      y,

      size:
        6.2,

      font:
        fontBold,

      color:
        negro,
    }
  );

  y -= 8;

  // ====================================================
  // DETALLE DE ACTUACIONES
  // ====================================================

  for (
    const actuacion
    of actuaciones
  ) {

    const descripcion =
      textoSeguro(
        actuacion.abreviacion ||
        actuacion.actuacion
      );

    const lineas =
      dividirTexto(
        descripcion,
        27
      );

    const monto =
      `$${formatearMonto(
        actuacion.monto
      )}`;

    const anchoMonto =
      anchoTexto(
        monto,
        6
      );

    for (
      let i = 0;
      i < lineas.length;
      i++
    ) {

      page.drawText(
        lineas[i],
        {
          x:
            MARGEN_X,

          y,

          size:
            6,

          font,

          color:
            negro,
        }
      );

      if (i === 0) {

        page.drawText(
          monto,
          {
            x:
              ANCHO_PAGINA -
              MARGEN_X -
              anchoMonto,

            y,

            size:
              6,

            font,

            color:
              negro,
          }
        );
      }

      y -= 6.5;
    }

    y -= 1;
  }

  // ====================================================
  // TOTAL
  // ====================================================

  page.drawLine({
    start: {
      x:
        MARGEN_X,
      y,
    },

    end: {
      x:
        ANCHO_PAGINA -
        MARGEN_X,
      y,
    },

    thickness:
      0.5,

    color:
      negro,
  });

  y -= 9;

  const textoTotal =
    "TOTAL USD:";

  const valorTotal =
    `$${formatearMonto(
      datos.totalUSD
    )}`;

  page.drawText(
    textoTotal,
    {
      x:
        MARGEN_X,

      y,

      size:
        7.5,

      font:
        fontBold,

      color:
        negro,
    }
  );

  const anchoTotal =
    anchoTexto(
      valorTotal,
      7.5,
      true
    );

  page.drawText(
    valorTotal,
    {
      x:
        ANCHO_PAGINA -
        MARGEN_X -
        anchoTotal,

      y,

      size:
        7.5,

      font:
        fontBold,

      color:
        negro,
    }
  );

  // ====================================================
  // PIE
  // ====================================================

  y -= 10;

  dibujarTextoCentrado(
    page,
    "Https://barranquilla.consulado.gob.ve",
    y,
    5.2,
    false
  );

  y -= 7;

  dibujarTextoCentrado(
    page,
    "+573011506119",
    y,
    5.2,
    false
  );

  // ====================================================
  // MENSAJE DE CORREO
  // ====================================================

  if (
    datos.correoEnviado === true &&
    textoSeguro(datos.correo)
  ) {

    y -= 7;

    const mensajeCorreo =
      `Una copia digital del recibo ${textoSeguro(
        datos.correlativo
      )} ha sido enviado a su correo: ${textoSeguro(
        datos.correo
      )}`;

    const lineasCorreo =
      dividirTexto(
        mensajeCorreo,
        34
      );

    for (
      const linea
      of lineasCorreo
    ) {

      dibujarTextoCentrado(
        page,
        linea,
        y,
        5,
        false
      );

      y -= 6;
    }
  }

  // ====================================================
  // GUARDAR PDF
  // ====================================================

  const pdfBytes =
    await pdfDoc.save();

  return pdfBytes;
}