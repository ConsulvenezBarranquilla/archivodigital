import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  formatoFechaHoraRecibo,
} from "@/lib/fechas";

import fs from "fs";
import path from "path";

type Actuacion = {
  actuacion: string;
  monto: number;
};

type TitularEspecial = {
  tipo: "PASAPORTE" | "APOSTILLA" | "VISA";
  titular: string;
  pasaporte?: string;
  mismaPersona?: boolean;
  esNNA?: boolean;
  tieneObservacion?: boolean;
  observacion?: string;
};

type DatosRecibo = {
  correlativo: string;
  fecha: string;
  documento: string;
  nombre: string;
  correo: string;
  usuario: string;
  actuaciones: Actuacion[];
  totalUSD: number;
  estado?: string;

  titularesEspeciales?: TitularEspecial[];

  soloOriginal?: boolean;
};

export async function generarPdfRecibo(
  datos: DatosRecibo
) {

  const pdfDoc =
    await PDFDocument.create();

  // ======================================================
  // LOGO
  // ======================================================

  const logoPath = path.join(
    process.cwd(),
    "public",
    "logo.png"
  );

  const logoBytes =
    fs.readFileSync(
      logoPath
    );

  const logo =
    await pdfDoc.embedPng(
      logoBytes
    );

  // ======================================================
  // FUENTES
  // ======================================================

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const fontBold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const fontOblique =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaOblique
    );

  // ======================================================
  // PÁGINA CARTA
  // ======================================================

  const page =
    pdfDoc.addPage([
      612,
      792,
    ]);

  // ======================================================
  // FUNCIÓN PARA OBTENER PRIMER NOMBRE + PRIMER APELLIDO
  // ======================================================

  function obtenerNombreCorto(
    nombreCompleto: string
  ): string {

    const partes =
      nombreCompleto
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
      partes.length <= 2
    ) {

      return partes.join(" ");

    }

    // Para nombres completos:
    // Primer nombre + último apellido

    return `${partes[0]} ${partes[partes.length - 1]}`;

  }

  // ======================================================
// BUSCAR TITULAR ESPECIAL PARA UNA ACTUACIÓN
// ======================================================

function obtenerTitularParaActuacion(
  actuacion: string,
  indices: {
    pasaporteNNA: number;
    apostillaNNA: number;
    visa: number;
  }
): string | null {

  const texto =
    actuacion
      .toUpperCase()
      .trim();

  const titulares =
    datos.titularesEspeciales || [];

  // ====================================================
  // PASAPORTE NNA
  // ====================================================

  if (
    texto.includes("PASAPORTE") &&
    texto.includes("NNA")
  ) {

    const titularesPasaporteNNA =
      titulares.filter(
        (t) =>
          t.tipo === "PASAPORTE" &&
          t.esNNA === true &&
          t.titular?.trim()
      );

    const titular =
      titularesPasaporteNNA[
        indices.pasaporteNNA
      ];

    indices.pasaporteNNA++;

    if (titular?.titular) {

      const nombre =
  titular.titular.trim();

if (
  nombre.toUpperCase() !==
  datos.nombre
    .trim()
    .toUpperCase()
) {

  return nombre;

}

    }

    return null;
  }


  // ====================================================
  // APOSTILLA NNA
  // ====================================================

  if (
    texto.includes("APOSTILLA") &&
    texto.includes("NNA")
  ) {

    const titularesApostillaNNA =
      titulares.filter(
        (t) =>
          t.tipo === "APOSTILLA" &&
          t.titular?.trim()
      );

    const titular =
      titularesApostillaNNA[
        indices.apostillaNNA
      ];

    indices.apostillaNNA++;

    if (titular?.titular) {

      const nombre =
  titular.titular.trim();

if (
  nombre.toUpperCase() !==
  datos.nombre
    .trim()
    .toUpperCase()
) {

  return nombre;

}

    }

    return null;
  }


  // ====================================================
  // VISA
  //
  // No depende de NNA.
  // El popup determina si existe otro titular.
  // ====================================================

  if (
    texto.includes("VISA")
  ) {

    const titularesVisa =
      titulares.filter(
        (t) =>
          t.tipo === "VISA" &&
          t.titular?.trim()
      );

    const titular =
      titularesVisa[
        indices.visa
      ];

    indices.visa++;

    if (titular?.titular) {

      // Si el popup indicó que es la misma persona,
      // no mostramos titular adicional.

      if (
        titular.mismaPersona === true
      ) {

        return null;

      }

      const nombre =
  titular.titular.trim();

if (
  nombre.toUpperCase() !==
  datos.nombre
    .trim()
    .toUpperCase()
) {

  return nombre;

}

    }

    return null;
  }


  // ====================================================
  // CUALQUIER OTRA ACTUACIÓN
  // ====================================================

  return null;

}

  // ======================================================
  // DIBUJAR RECIBO
  // ======================================================

  function dibujarRecibo(
    yInicio: number,
    tituloCopia: string
  ) {

    // Cada copia debe recorrer los titulares especiales
    // desde el principio. Así el mismo titular aparece
    // en Original Usuario, Copia Caja y Copia Expediente.
    const indicesTitulares = {
      pasaporteNNA: 0,
      apostillaNNA: 0,
      visa: 0,
    };

    let y =
      yInicio;

    // ----------------------------------------------------
    // MARCA DE ANULADO
    // ----------------------------------------------------

    if (
      datos.estado ===
      "ANULADO"
    ) {

      page.drawText(
        "ANULADO",
        {
          x: 140,
          y: yInicio - 120,
          size: 55,
          font,
          color: rgb(
            0.8,
            0.8,
            0.8
          ),
          rotate: {
            type: "degrees",
            angle: 45,
          } as any,
          opacity: 0.35,
        }
      );

    }

    // ----------------------------------------------------
    // LOGO
    // ----------------------------------------------------

    page.drawImage(
      logo,
      {
        x: 40,
        y: y - 50,
        width: 60,
        height: 60,
      }
    );

    // ----------------------------------------------------
    // ENCABEZADO
    // ----------------------------------------------------

    page.drawText(
      "Consulado General de la República",
      {
        x: 110,
        y: yInicio - 12,
        size: 10,
        font,
      }
    );

    page.drawText(
      "Bolivariana de Venezuela en Barranquilla",
      {
        x: 110,
        y: yInicio - 25,
        size: 10,
        font,
      }
    );

    // ----------------------------------------------------
    // NÚMERO DE RECIBO
    // ----------------------------------------------------

    page.drawText(
      `RECIBO N° ${datos.correlativo}`,
      {
        x: 390,
        y: yInicio - 15,
        size: 13,
        font,
      }
    );

    y -= 43;

    // ----------------------------------------------------
    // TIPO DE COPIA
    // ----------------------------------------------------

    page.drawText(
      tituloCopia,
      {
        x: 450,
        y,
        size: 10,
        font,
      }
    );

    y -= 10;

    // ----------------------------------------------------
    // FECHA
    // ----------------------------------------------------

    page.drawText(
      `Fecha: ${formatoFechaHoraRecibo(
        datos.fecha
      )}`,
      {
        x: 40,
        y,
        size: 10,
        font,
      }
    );

    y -= 15;

    // ====================================================
    // SOLICITANTE DEL RECIBO
    // ====================================================
    //
    // IMPORTANTE:
    // Aquí SIEMPRE se mantiene el solicitante original.
    // Nunca se reemplaza por el titular especial.
    // ====================================================

    page.drawText(
      `Doc: ${datos.documento} | ${datos.nombre} | ${datos.correo}`,
      {
        x: 40,
        y,
        size: 10,
        font,
      }
    );

    y -= 25;

    // ----------------------------------------------------
    // ACTUACIONES
    // ----------------------------------------------------

    page.drawText(
      "Actuaciones:",
      {
        x: 40,
        y,
        size: 9,
        font,
      }
    );

    y -= 15;

    datos.actuaciones.forEach(
      (a) => {

        const titular =
          obtenerTitularParaActuacion(
            a.actuacion,
            indicesTitulares
          );

        const descripcion =
          a.actuacion;

        // ----------------------------------------------
        // ACTUACIÓN
        // ----------------------------------------------

        page.drawText(
          descripcion,
          {
            x: 50,
            y,
            size: 10,
            font,
          }
        );

        // ----------------------------------------------
        // TITULAR ESPECIAL
        // ----------------------------------------------
        //
        // Se coloca inmediatamente después
        // de la actuación y en cursiva.
        //
        // Ejemplo:
        //
        // Pasaporte NNA (Nicole Freer)
        //
        // ----------------------------------------------

        if (
          titular
        ) {

          const anchoActuacion =
            font.widthOfTextAtSize(
              descripcion,
              10
            );

          page.drawText(
            ` (${titular})`,
            {
              x:
                50 +
                anchoActuacion,
              y,
              size: 9,
              font: fontOblique,
            }
          );

        }

        // ----------------------------------------------
        // MONTO
        // ----------------------------------------------

        page.drawText(
          `USD ${a.monto}`,
          {
            x: 475,
            y,
            size: 10,
            font,
          }
        );

        y -= 14;

      }
    );

    y -= 10;

    // ====================================================
    // TOTAL
    // ====================================================

    page.drawText(
      `TOTAL CANCELADO: USD ${datos.totalUSD}`,
      {
        x: 40,
        y,
        size: 11,
        font: fontBold,
      }
    );

    y -= 18;

    // ====================================================
    // USUARIO CAJA
    // ====================================================

    page.drawText(
      `Usuario Caja: ${datos.usuario}`,
      {
        x: 40,
        y,
        size: 10,
        font,
      }
    );

    // ====================================================
    // SELLO
    // ====================================================

    page.drawRectangle({
      x: 455,
      y: y - 3,
      width: 70,
      height: 30,
      borderWidth: 1,
      borderColor:
        rgb(0, 0, 0),
      color:
        rgb(1, 1, 1),
    });

    page.drawText(
      "SELLO",
      {
        x: 477,
        y: y + 8,
        size: 8,
        font,
      }
    );

    // ====================================================
// NOTA LEGAL
// ====================================================

const notaY =
  y - 18;

page.drawText(
  "La recepción de requisitos para su trámite no constituye su aprobación. El Arancel Consular no es reembolsable.",
  {
    x: 40,
    y: notaY,
    size: 6.5,
    font: fontOblique,
  }
);

  }

  // ======================================================
  // LÍNEA DE CORTE
  // ======================================================

  function lineaDeCorte(
    y: number
  ) {

    for (
      let x = 20;
      x < 590;
      x += 12
    ) {

      page.drawLine({
        start: {
          x,
          y,
        },
        end: {
          x: x + 6,
          y,
        },
        thickness: 0.7,
      });

    }

  }

    // ======================================================
  // COPIAS DEL RECIBO
  // ======================================================

  if (datos.soloOriginal) {

    // Para correo electrónico:
    // solamente Original Usuario.

    dibujarRecibo(
      760,
      "Original Usuario"
    );

  } else {

    // Funcionamiento normal:
    // las tres copias.

    dibujarRecibo(
      760,
      "Original Usuario"
    );

    lineaDeCorte(
      530
    );

    dibujarRecibo(
      505,
      "Copia Caja"
    );

    lineaDeCorte(
      275
    );

    dibujarRecibo(
      250,
      "Copia Expediente"
    );

  }

  // ======================================================
  // GENERAR PDF
  // ======================================================

  const pdfBytes =
    await pdfDoc.save();

  return pdfBytes;
}