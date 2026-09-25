import {
  NextRequest,
  NextResponse,
} from "next/server";
import { obtenerSesion } from "@/lib/auth";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

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


// ======================================================
// FECHA ACTUAL EN COLOMBIA
// ======================================================

function fechaHoyColombia(): string {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(
    new Date()
  );

}


// ======================================================
// POST
// ======================================================

export async function POST(
  request: NextRequest
) {

  try {

    const body =
  await request.json();

const sesion =
  await obtenerSesion();

if (!sesion) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Sesión no válida o expirada.",
    },
    {
      status: 401,
    }
  );
}

const caja =
  String(
    sesion.caja || ""
  ).trim();

const usuario =
  String(
    sesion.nombre || ""
  ).trim();

const rol =
  String(
    sesion.rol || ""
  ).trim();

const esAdmin =
  rol.toLowerCase() === "admin";

if (!caja) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No se recibió la caja.",
        },
        {
          status: 400,
        }
      );

    }


    const fechaHoy =
      fechaHoyColombia();


    // ==================================================
    // LEER CAJA
    // ==================================================

    const cajaResponse =
      await sheets.spreadsheets.values.get(
        {
          spreadsheetId:
            MODULO_CAJA_SHEET_ID,

          range:
            "Caja!A:P",
        }
      );


    // ==================================================
    // LEER DETALLE CAJA
    // ==================================================

    const detalleResponse =
      await sheets.spreadsheets.values.get(
        {
          spreadsheetId:
            MODULO_CAJA_SHEET_ID,

          range:
            "DetalleCaja!A:F",
        }
      );


    const cajaRows =
      cajaResponse.data.values ||
      [];

    const detalleRows =
      detalleResponse.data.values ||
      [];


    if (
      cajaRows.length <= 1
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "No existen recibos registrados.",
        },
        {
          status: 404,
        }
      );

    }


    // ==================================================
    // CONSTRUIR MAPA DE DETALLES
    // ==================================================

    const detallesPorRecibo =
      new Map<
        string,
        any[]
      >();


    detalleRows
      .slice(1)
      .forEach(
        (row) => {

          const correlativo =
            String(
              row[0] || ""
            ).trim();

          if (!correlativo) {
            return;
          }

          const existentes =
            detallesPorRecibo.get(
              correlativo
            ) || [];

          existentes.push(
            row
          );

          detallesPorRecibo.set(
            correlativo,
            existentes
          );

        }
      );


    // ==================================================
    // RECIBOS DEL DÍA Y DE LA CAJA
    // ==================================================

    const recibos: any[] =
  [];

cajaRows
  .slice(1)
  .forEach(
    (row) => {

      const fecha =
        String(
          row[0] || ""
        ).trim();

      const correlativo =
        String(
          row[1] || ""
        ).trim();

      const estado =
        String(
          row[10] || ""
        )
        .trim()
        .toUpperCase();

      const usuarioFila =
        String(
          row[7] || ""
        ).trim();

      const cajaFila =
        String(
          row[8] || ""
        ).trim();


      // --------------------------------------------
      // SOLO RECIBOS GENERADOS
      // --------------------------------------------

      if (
        estado !==
        "GENERADO"
      ) {
        return;
      }


      // --------------------------------------------
      // SOLO LA CAJA ACTUAL
      // --------------------------------------------

      if (
        cajaFila !==
        caja
      ) {
        return;
      }


      // --------------------------------------------
      // SOLO EL DÍA ACTUAL
      // --------------------------------------------

      if (
        fecha.substring(
          0,
          10
        ) !== fechaHoy
      ) {
        return;
      }


      // --------------------------------------------
      // USUARIO
      //
      // ADMIN:
      // todos los recibos de la caja.
      //
      // USUARIO NORMAL:
      // solamente sus propios recibos.
      // --------------------------------------------

      if (
        !esAdmin &&
        usuarioFila !== usuario
      ) {
        return;
      }


      if (!correlativo) {
        return;
      }


          // --------------------------------------------
          // DOCUMENTO
          // --------------------------------------------

          const cedula =
            String(
              row[11] || ""
            );

          const pasaporte =
            String(
              row[12] || ""
            );

          const nacionalidad =
            String(
              row[13] || ""
            );


          const documento =
            obtenerDocumentoPrincipal(
              cedula,
              pasaporte,
              nacionalidad
            );


          // --------------------------------------------
          // DETALLES
          // --------------------------------------------

          const detalles =
            detallesPorRecibo.get(
              correlativo
            ) || [];


          const actuaciones =
            detalles.map(
              (
                detalle
              ) => {

                return {

                  codigo:
                    String(
                      detalle[1] || ""
                    ).trim(),

                  actuacion:
                    String(
                      detalle[2] || ""
                    ).trim(),

                  monto:
                    Number(
                      detalle[3] || 0
                    ),

                };

              }
            );


          // --------------------------------------------
          // TITULARES ESPECIALES
          // --------------------------------------------

          const titularesTexto =
            String(
              row[14] || ""
            )
              .split(";")
              .map(
                (
                  x: string
                ) =>
                  x.trim()
              )
              .filter(
                (
                  x: string
                ) =>
                  x.length > 0
              );


          const pasaportesVisa =
            String(
              row[15] || ""
            )
              .split(";")
              .map(
                (
                  x: string
                ) =>
                  x.trim()
              )
              .filter(
                (
                  x: string
                ) =>
                  x.length > 0
              );


          recibos.push({

            fecha,

            correlativo,

            documento,

            nombre:
              String(
                row[3] || ""
              ),

            correo:
              String(
                row[4] || ""
              ),

            usuario:
              String(
                row[7] || ""
              ),

            totalUSD:
              Number(
                row[6] || 0
              ),

            actuaciones,

            titularesTexto,

            pasaportesVisa,

          });

        }
      );


    // ==================================================
    // ORDENAR POR HORA DE GENERACIÓN
    // ==================================================

    recibos.sort(
      (
        a,
        b
      ) => {

        return (
          new Date(
            a.fecha
          ).getTime() -
          new Date(
            b.fecha
          ).getTime()
        );

      }
    );


    if (
      recibos.length === 0
    ) {

      return NextResponse.json(
        {
          ok: false,
          error:
            `No existen recibos generados para ${caja} en la fecha ${fechaHoy}.`,
        },
        {
          status: 404,
        }
      );

    }


    // ==================================================
    // CREAR PDF
    // ==================================================

    const pdfDoc =
      await PDFDocument.create();


    // ==================================================
    // LOGO
    // ==================================================

    const logoPath =
      path.join(
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


    // ==================================================
    // FUENTES
    // ==================================================

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


    // ==================================================
    // FUNCIÓN PARA NOMBRE CORTO
    // ==================================================

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

        return partes.join(
          " "
        );

      }


      return `${partes[0]} ${
        partes[
          partes.length - 1
        ]
      }`;

    }


    // ==================================================
    // DIBUJAR RECIBO
    // SOLO COPIA EXPEDIENTE
    // ==================================================

    function dibujarRecibo(
      page: any,
      datos: any,
      yInicio: number
    ) {

      let y =
        yInicio;


      // ----------------------------------------------
      // LOGO
      // ----------------------------------------------

      page.drawImage(
        logo,
        {
          x: 40,
          y:
            y - 50,
          width: 60,
          height: 60,
        }
      );


      // ----------------------------------------------
      // ENCABEZADO
      // ----------------------------------------------

      page.drawText(
        "Consulado General de la República",
        {
          x: 110,
          y:
            yInicio - 12,
          size: 10,
          font,
        }
      );


      page.drawText(
        "Bolivariana de Venezuela en Barranquilla",
        {
          x: 110,
          y:
            yInicio - 25,
          size: 10,
          font,
        }
      );


      // ----------------------------------------------
      // NÚMERO DE RECIBO
      // ----------------------------------------------

      page.drawText(
        `RECIBO N° ${datos.correlativo}`,
        {
          x: 390,
          y:
            yInicio - 15,
          size: 13,
          font,
        }
      );


      y -= 43;


      // ----------------------------------------------
      // COPIA
      // ----------------------------------------------

      page.drawText(
        "Copia Expediente",
        {
          x: 450,
          y,
          size: 10,
          font,
        }
      );


      y -= 10;


      // ----------------------------------------------
      // FECHA
      // ----------------------------------------------

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


      // ----------------------------------------------
      // CIUDADANO
      // ----------------------------------------------

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


      // ----------------------------------------------
      // ACTUACIONES
      // ----------------------------------------------

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


      let indiceTitular =
        0;

      let indiceVisa =
        0;


      datos.actuaciones.forEach(
        (
          actuacion: any
        ) => {

          const descripcion =
            actuacion.actuacion;


          // ------------------------------------------
          // ACTUACIÓN
          // ------------------------------------------

          page.drawText(
            descripcion,
            {
              x: 50,
              y,
              size: 10,
              font,
            }
          );


          // ------------------------------------------
          // TITULAR ESPECIAL
          // ------------------------------------------

          let titular =
            "";


          const codigo =
            String(
              actuacion.codigo ||
              ""
            ).toUpperCase();


          if (
            codigo ===
            "P-NNA"
          ) {

            titular =
              datos.titularesTexto[
                indiceTitular
              ] ||
              "";

            indiceTitular++;

          }

          else if (
            codigo ===
            "A-NNA"
          ) {

            titular =
              datos.titularesTexto[
                indiceTitular
              ] ||
              "";

            indiceTitular++;

          }

          else if (
            descripcion
              .toUpperCase()
              .includes(
                "VISA"
              )
          ) {

            titular =
              datos.titularesTexto[
                indiceTitular
              ] ||
              "";

            indiceTitular++;

            indiceVisa++;

          }


          if (
            titular
          ) {

            const ancho =
              font.widthOfTextAtSize(
                descripcion,
                10
              );


            page.drawText(
              ` (${obtenerNombreCorto(
                titular
              )})`,
              {
                x:
                  50 +
                  ancho,
                y,
                size: 9,
                font:
                  fontOblique,
              }
            );

          }


          // ------------------------------------------
          // MONTO
          // ------------------------------------------

          page.drawText(
            `USD ${actuacion.monto}`,
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


      // ----------------------------------------------
      // TOTAL
      // ----------------------------------------------

      page.drawText(
        `TOTAL CANCELADO: USD ${datos.totalUSD}`,
        {
          x: 40,
          y,
          size: 11,
          font:
            fontBold,
        }
      );


      y -= 18;


      // ----------------------------------------------
      // USUARIO
      // ----------------------------------------------

      page.drawText(
        `Usuario Caja: ${datos.usuario}`,
        {
          x: 40,
          y,
          size: 10,
          font,
        }
      );


      // ----------------------------------------------
      // SELLO
      // ----------------------------------------------

      page.drawRectangle(
        {
          x: 455,
          y:
            y - 3,
          width: 70,
          height: 30,
          borderWidth: 1,
          borderColor:
            rgb(
              0,
              0,
              0
            ),
          color:
            rgb(
              1,
              1,
              1
            ),
        }
      );


      page.drawText(
        "SELLO",
        {
          x: 477,
          y:
            y + 8,
          size: 8,
          font,
        }
      );


      // ----------------------------------------------
      // NOTA LEGAL
      // ----------------------------------------------

      page.drawText(
        "La recepción de requisitos para su trámite no constituye su aprobación. El Arancel Consular no es reembolsable.",
        {
          x: 40,
          y:
            y - 18,
          size: 6.5,
          font:
            fontOblique,
        }
      );

    }


    // ==================================================
    // LÍNEA DE CORTE
    // ==================================================

    function lineaDeCorte(
      page: any,
      y: number
    ) {

      for (
        let x = 20;
        x < 590;
        x += 12
      ) {

        page.drawLine(
          {
            start: {
              x,
              y,
            },
            end: {
              x:
                x + 6,
              y,
            },
            thickness:
              0.7,
          }
        );

      }

    }


    // ==================================================
    // TRES RECIBOS POR PÁGINA
    // ==================================================

    for (
      let i = 0;
      i < recibos.length;
      i++
    ) {

      const posicion =
        i % 3;


      if (
        posicion === 0
      ) {

        pdfDoc.addPage(
          [
            612,
            792,
          ]
        );

      }


      const pages =
        pdfDoc.getPages();


      const page =
        pages[
          pages.length - 1
        ];


      let yInicio =
        760;


      if (
        posicion === 1
      ) {

        yInicio =
          505;

      }

      if (
        posicion === 2
      ) {

        yInicio =
          250;

      }


      dibujarRecibo(
        page,
        recibos[i],
        yInicio
      );


      if (
        posicion === 0 ||
        posicion === 1
      ) {

        lineaDeCorte(
          page,
          posicion === 0
            ? 530
            : 275
        );

      }

    }


    // ==================================================
    // GUARDAR PDF
    // ==================================================

    const pdfBytes =
  await pdfDoc.save();

// Convertimos el Uint8Array de pdf-lib
// a un ArrayBuffer compatible con NextResponse
const pdfBuffer =
  new Uint8Array(pdfBytes).buffer;

return new NextResponse(
  pdfBuffer,
  {
    status: 200,
    headers: {
      "Content-Type":
        "application/pdf",

      "Content-Disposition":
        `attachment; filename="COMPILADO_RECIBOS_${caja}_${fechaHoy}.pdf"`,

      "Cache-Control":
        "no-store",
    },
  }
);

  }

  catch (
    error: any
  ) {

    console.error(
      "Error compilando recibos:",
      error
    );


    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Error generando el compilado de recibos.",
      },
      {
        status: 500,
      }
    );

  }

}