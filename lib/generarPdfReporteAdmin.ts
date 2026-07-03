import {
  PDFDocument,
  StandardFonts,
  PDFImage,
  rgb,
} from "pdf-lib";

import fs from "fs";
import path from "path";

type Registro = [

   string, // Fecha
  string, // Recibo
  string, // Documento
  string, // Nombre
  string, // Código
  string, // Actuación
  string, // USD
  string, // Usuario
  string, // Caja
  string  // Estado

];

type DatosReporteAdmin = {

  registros: Registro[];

  totalUSD: number;

  totalRecibos: number;

  totalActuaciones: number;

  totalAnulados: number;

  leyendaCodigos: Record<
    string,
    {
      nombre: string;
      cantidad: number;
    }
  >;

};

export async function generarPdfReporteAdmin(
  datos: DatosReporteAdmin
) {

  const pdfDoc =
    await PDFDocument.create();

  let page =
    pdfDoc.addPage([612,792]);

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );
    let logo: PDFImage | undefined;
      try {

    const logoPath = path.join(
      process.cwd(),
      "public",
      "logo.png"
    );

    const logoBytes =
      fs.readFileSync(
        logoPath
      );
    
logo = await pdfDoc.embedPng(logoBytes);
  } catch {}

  
  let y = 565;
function dibujarLogo() {

  if (!logo) return;

  page.drawImage(logo, {
    x: 40,
    y: 715,
    width: 55,
    height: 55,
  });

}
 
function dibujarEncabezadoPagina() {

  dibujarLogo();

  page.drawText(
    "CONSULADO GENERAL DE LA REPÚBLICA",
    {
      x:110,
      y:750,
      size:12,
      font:bold,
    }
  );

  page.drawText(
    "BOLIVARIANA DE VENEZUELA EN BARRANQUILLA",
    {
      x:110,
      y:735,
      size:12,
      font:bold,
    }
  );

  page.drawText(
    "REPORTE ADMINISTRATIVO",
    {
      x:180,
      y:690,
      size:16,
      font:bold,
    }
  );

}
  function dibujarEncabezadoTabla() {

    page.drawLine({

      start:{
        x:40,
        y,
      },

      end:{
        x:570,
        y,
      },

      thickness:1,

    });

    y -= 25;

    page.drawText(
      "Fecha",
      {
        x:40,
        y,
        size:8,
        font:bold,
      }
    );

    page.drawText(
      "Recibo",
      {
        x:105,
        y,
        size:8,
        font:bold,
      }
    );

    page.drawText(
      "Documento",
      {
        x:170,
        y,
        size:8,
        font:bold,
      }
    );

    page.drawText(
      "Nombre",
      {
        x:240,
        y,
        size:8,
        font:bold,
      }
    );

    page.drawText(
      "Código",
      {
        x:415,
        y,
        size:8,
        font:bold,
      }
    );

    page.drawText(
      "USD",
      {
        x:505,
        y,
        size:8,
        font:bold,
      }
    );

    y -= 25;

  }
dibujarEncabezadoPagina();
  dibujarEncabezadoTabla();
  function dividirTexto(
  texto: string,
  longitud: number
) {

  if (texto.length <= longitud) {

    return [texto];

  }

  const palabras =
    texto.split(" ");

  let linea1 = "";
  let linea2 = "";

  palabras.forEach((palabra) => {

    if (

      (linea1 + " " + palabra)
        .trim()
        .length <= longitud

    ) {

      linea1 =
        (linea1 + " " + palabra)
          .trim();

    } else {

      linea2 =
        (linea2 + " " + palabra)
          .trim();

    }

  });

  return [
    linea1,
    linea2,
  ];

}

for (const item of datos.registros) {
const anulado =
  item[9] === "ANULADO";

  if (y < 60) {

    page =
      pdfDoc.addPage([612,792]);

    y = 740;
    dibujarEncabezadoPagina();

y = 565;

dibujarEncabezadoTabla();

          }

  page.drawText(
    item[0].substring(0,10),
    {
      x:40,
      y,
      size:7,
      font,
    }
  );

  page.drawText(
    item[1],
    {
      x:105,
      y,
      size:7,
      font,
    }
  );

  page.drawText(
    item[2],
    {
      x:170,
      y,
      size:7,
      font,
    }
  );

  const nombre =
    dividirTexto(
      item[3],
      30
    );

  page.drawText(
    nombre[0],
    {
      x:240,
      y,
      size:7,
      font,
    }
  );

  if (nombre[1]) {

    page.drawText(
      nombre[1],
      {
        x:240,
        y:y-8,
        size:7,
        font,
      }
    );

  }

  page.drawText(
    item[4],
    {
      x:420,
      y,
      size:7,
      font:bold,
    }
  );

  page.drawText(
    String(item[6]),
    {
      x:530,
      y,
      size:7,
      font,
    }
  );
if (anulado) {

  page.drawText(
    "ANULADO",
    {
      x: 545,
      y,
      size: 7,
      font: bold,
      color: rgb(0.85, 0, 0),
    }
  );

}
  y -= 18;

}
  y -= 15;

  page.drawLine({
    start:{
      x:40,
      y,
    },
    end:{
      x:570,
      y,
    },
    thickness:1,
  });

  y -= 30;

  page.drawText(
    `Total Recibos: ${datos.totalRecibos}`,
    {
      x:40,
      y,
      size:11,
      font:bold,
    }
  );

  y -= 20;

  page.drawText(
    `Total Actuaciones: ${datos.totalActuaciones}`,
    {
      x:40,
      y,
      size:11,
      font:bold,
    }
  );

  y -= 20;

  page.drawText(
    `Total Anulados: ${datos.totalAnulados}`,
    {
      x:40,
      y,
      size:11,
      font:bold,
    }
  );

  y -= 20;

  page.drawText(
    `Total USD: ${datos.totalUSD}`,
    {
      x:40,
      y,
      size:12,
      font:bold,
    }
  );

  y -= 35;

  const imprimirTituloLeyenda = () => {

    page.drawText(
      "RESUMEN DE ACTUACIONES",
      {
        x:40,
        y,
        size:11,
        font:bold,
      }
    );

    y -= 20;

    page.drawText(
      "Código",
      {
        x:50,
        y,
        size:9,
        font:bold,
      }
    );

    page.drawText(
      "Actuación",
      {
        x:120,
        y,
        size:9,
        font:bold,
      }
    );

    page.drawText(
      "Cantidad",
      {
        x:500,
        y,
        size:9,
        font:bold,
      }
    );

    y -= 10;

    page.drawLine({
      start:{
        x:45,
        y,
      },
      end:{
        x:565,
        y,
      },
      thickness:0.8,
    });

    y -= 12;

  };

  if (y < 220) {

    page = pdfDoc.addPage([612,792]);

dibujarEncabezadoPagina();

y = 640;

    page.drawText(
      "ANEXO - RESUMEN DE ACTUACIONES",
      {
        x:40,
        y,
        size:13,
        font:bold,
      }
    );

    y -= 30;

  } else {

    imprimirTituloLeyenda();

  }
if (!datos.leyendaCodigos) {

  throw new Error(
    "No se recibió leyendaCodigos."
  );

}
  Object.entries(datos.leyendaCodigos)

    .sort(
      (a,b)=>
        a[0].localeCompare(b[0])
    )

    .forEach(([codigo,item])=>{

      if (y < 60) {

        page =
          pdfDoc.addPage([612,792]);

        y = 740;
        dibujarEncabezadoPagina();

y = 640;

        page.drawText(
          "ANEXO - RESUMEN DE ACTUACIONES",
          {
            x:40,
            y,
            size:13,
            font:bold,
          }
        );

        y -= 30;

        page.drawText(
          "Código",
          {
            x:50,
            y,
            size:9,
            font:bold,
          }
        );

        page.drawText(
          "Actuación",
          {
            x:120,
            y,
            size:9,
            font:bold,
          }
        );

        page.drawText(
          "Cantidad",
          {
            x:500,
            y,
            size:9,
            font:bold,
          }
        );

        y -= 10;

        page.drawLine({
          start:{
            x:45,
            y,
          },
          end:{
            x:565,
            y,
          },
          thickness:0.8,
        });

        y -= 12;

      }

      page.drawText(
        codigo,
        {
          x:50,
          y,
          size:9,
          font:bold,
        }
      );

      page.drawText(
        item.nombre,
        {
          x:120,
          y,
          size:9,
          font,
        }
      );

      page.drawText(
        String(item.cantidad),
        {
          x:505,
          y,
          size:9,
          font:bold,
        }
      );

      page.drawLine({
        start:{
          x:45,
          y:y-4,
        },
        end:{
          x:565,
          y:y-4,
        },
        thickness:0.3,
      });

      y -= 15;

    });

  page.drawLine({
    start:{
      x:40,
      y:40,
    },
    end:{
      x:570,
      y:40,
    },
    thickness:1,
  });

  page.drawLine({
    start:{
      x:160,
      y:95,
    },
    end:{
      x:470,
      y:95,
    },
    thickness:1,
  });

  page.drawText(
    "Administrador de Misión",
    {
      x:255,
      y:75,
      size:10,
      font,
    }
  );

  page.drawText(
    "Consulado General de Venezuela en Barranquilla",
    {
      x:195,
      y:60,
      size:10,
      font,
    }
  );

  page.drawText(
    "Documento generado por el Sistema de Caja Consular",
    {
      x:190,
      y:22,
      size:9,
      font,
    }
  );

  const bytes =
  await pdfDoc.save();

console.log(
  "Tamaño PDF:",
  bytes.length
);

return bytes;
}