import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import fs from "fs";
import path from "path";

type Actuacion = {
  actuacion: string;
  monto: number;
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
};

export async function generarPdfRecibo(
  datos: DatosRecibo
) {

  const pdfDoc =
    await PDFDocument.create();

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

  const page =
    pdfDoc.addPage([612, 792]);

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

console.log(
  "ESTADO PDF:",
  datos.estado
);

  function dibujarRecibo(
  yInicio: number,
  tituloCopia: string
) {

  let y = yInicio;

  const alturaRecibo =
    205 +
    (datos.actuaciones.length * 14);

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
  
page.drawImage(
  logo,
  {
    x: 40,
    y: y - 50,
    width: 60,
    height: 60,
  }
);

    page.drawText(
  "Consulado General de la República",
  {
    x: 110,
    y: yInicio - 12,
    size: 10,
    font,
  }
);

y -= 12;

page.drawText(
  "Bolivariana de Venezuela en Barranquilla",
  {
    x: 110,
    y: yInicio - 25,
    size: 10,
    font,
  }
);
y -= 25;


    page.drawText(
      `RECIBO N° ${datos.correlativo}`,
      {
        x: 390,
    y: yInicio - 15,
    size: 13,
        font,
      }
    );

    y -= 18;

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

    page.drawText(
      `Fecha: ${datos.fecha}`,
      {
        x: 40,
        y,
        size: 10,
        font,
      }
    );

    y -= 15;

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

    page.drawText(
      `${a.actuacion}`,
      {
        x: 50,
        y,
        size: 10,
        font,
      }
    );

    page.drawText(
      `USD ${a.monto}`,
      {
        x: 430,
        y,
        size: 10,
        font,
      }
    );

    y -= 14;

  }
);

    y -= 10;

    page.drawText(
      `TOTAL CANCELADO: USD ${datos.totalUSD}`,
      {
        x: 40,
        y,
        size: 11,
        font,
      }
    );

    y -= 18;

    page.drawText(
      `Usuario Caja: ${datos.usuario}`,
      {
        x: 40,
        y,
        size: 10,
        font,
      }
    );

    page.drawRectangle({
  x: 455,
  y: y + 5,
  width: 70,
  height: 30,
  borderWidth: 1,
  borderColor: rgb(0,0,0),
  color: rgb(1,1,1),
});

page.drawText(
  "SELLO",
  {
    x: 477,
    y: y + 15,
    size: 8,
    font,
  }
);

    
  }
function lineaDeCorte(y: number) {

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
  dibujarRecibo(
    760,
    "Original Usuario"
  );
  lineaDeCorte(530);

  dibujarRecibo(
    505,
    "Copia Caja"
  );
lineaDeCorte(275);
  dibujarRecibo(
    250,
    "Copia Expediente"
  );

  const pdfBytes =
    await pdfDoc.save();

  return pdfBytes;

}