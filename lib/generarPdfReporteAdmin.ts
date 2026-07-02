import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

import fs from "fs";
import path from "path";

type Registro = [
  string, // Fecha
  string, // Recibo
  string, // Documento
  string, // Nombre
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
};

export async function generarPdfReporteAdmin(
  datos: DatosReporteAdmin
) {

  const pdfDoc =
    await PDFDocument.create();

  const page =
    pdfDoc.addPage([612, 792]);

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

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

    const logo =
      await pdfDoc.embedPng(
        logoBytes
      );

    page.drawImage(
      logo,
      {
        x: 40,
        y: 715,
        width: 55,
        height: 55,
      }
    );

  } catch {}

  page.drawText(
    "CONSULADO GENERAL DE LA REPÚBLICA",
    {
      x: 110,
      y: 750,
      size: 12,
      font: bold,
    }
  );

  page.drawText(
    "BOLIVARIANA DE VENEZUELA EN BARRANQUILLA",
    {
      x: 110,
      y: 735,
      size: 12,
      font: bold,
    }
  );

  page.drawText(
    "REPORTE ADMINISTRATIVO",
    {
      x: 180,
      y: 690,
      size: 16,
      font: bold,
    }
  );
        
  page.drawLine({
    start: {
      x: 40,
      y: 565,
    },
    end: {
      x: 570,
      y: 565,
    },
    thickness: 1,
  });

  page.drawText("Fecha", {
  x: 40,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("Recibo", {
  x: 105,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("Documento", {
  x: 170,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("Nombre", {
  x: 240,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("Actuación", {
  x: 390,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("USD", {
  x: 515,
  y: 540,
  size: 8,
  font: bold,
});

page.drawText("Estado", {
  x: 550,
  y: 540,
  size: 8,
  font: bold,
});

  let y = 515;
function dividirTexto(
  texto: string,
  longitud: number
) {

  if (
    texto.length <= longitud
  ) {

    return [texto];

  }

  const palabras =
    texto.split(" ");

  let linea1 = "";
  let linea2 = "";

  palabras.forEach(
    (palabra) => {

      if (
        (
          linea1 +
          " " +
          palabra
        ).trim().length <=
        longitud
      ) {

        linea1 =
          (
            linea1 +
            " " +
            palabra
          ).trim();

      } else {

        linea2 =
          (
            linea2 +
            " " +
            palabra
          ).trim();

      }

    }
  );

  return [
    linea1,
    linea2,
  ];

}
  datos.registros.forEach(
  (item) => {

    page.drawText(
  item[0].substring(0, 10),
  {
    x: 40,
    y,
    size: 7,
    font,
  }
);

page.drawText(
  item[1],
  {
    x: 105,
    y,
    size: 7,
    font,
  }
);

page.drawText(
  item[2],
  {
    x: 170,
    y,
    size: 7,
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
    x: 240,
    y,
    size: 7,
    font,
  }
);

if (nombre[1]) {

  page.drawText(
    nombre[1],
    {
      x: 240,
      y: y - 8,
      size: 7,
      font,
    }
  );

}

const actuacion =
  dividirTexto(
    item[4],
    32
  );

page.drawText(
  actuacion[0],
  {
    x: 390,
    y,
    size: 7,
    font,
  }
);

if (
  actuacion[1]
) {

  page.drawText(
    actuacion[1],
    {
      x: 390,
      y: y - 8,
      size: 7,
      font,
    }
  );

}

page.drawText(
  item[5],
  {
    x: 520,
    y,
    size: 7,
    font,
  }
);

page.drawText(
  item[8],
  {
    x: 560,
    y,
    size: 7,
    font,
  }
);

    y -= 28;

  }
);

  y -= 20;

  page.drawLine({
    start: {
      x: 40,
      y,
    },
    end: {
      x: 570,
      y,
    },
    thickness: 1,
  });

  y -= 30;

  page.drawText(
    `Total Recibos: ${datos.totalRecibos}`,
    {
      x: 40,
      y,
      size: 11,
      font: bold,
    }
  );

  y -= 20;

  page.drawText(
    `Total Actuaciones: ${datos.totalActuaciones}`,
    {
      x: 40,
      y,
      size: 11,
      font: bold,
    }
  );

  y -= 20;

page.drawText(
  `Total Anulados: ${datos.totalAnulados}`,
  {
    x: 40,
    y,
    size: 11,
    font: bold,
  }
);
  y -= 20;

  page.drawText(
    `Total USD: ${datos.totalUSD}`,
    {
      x: 40,
      y,
      size: 12,
      font: bold,
    }
  );
page.drawLine({
  start: {
    x: 40,
    y: 40,
  },
  end: {
    x: 570,
    y: 40,
  },
  thickness: 1,
});
page.drawLine({
  start: { x: 180, y: 95 },
  end: { x: 430, y: 95 },
  thickness: 1,
});

page.drawText(
"Administrador de Misión",
  {
    x: 255,
    y: 75,
    size: 10,
    font,
  }
);

page.drawText(
  "Consulado General de Venezuela en Barranquilla",
  {
    x: 195,
    y: 60,
    size: 10,
    font,
  }
);
page.drawText(
  "Documento generado por el Sistema de Caja Consular",
  {
    x: 190,
    y: 22,
    size: 9,
    font,
  }
);
page.drawLine({
  start: {
    x: 160,
    y: 95,
  },
  end: {
    x: 470,
    y: 95,
  },
  thickness: 1,
});

  return await pdfDoc.save();

}