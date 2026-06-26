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

  string, // Código

  string, // Actuación

  string, // Monto

  string, // Usuario

  string, // Caja

  string  // Estado

];

type DatosCierre = {
  fecha: string;
  usuario: string;
  caja: string;
  tipo: string;
  registros: Registro[];
  totalUSD: number;
  totalRecibos: number;
  totalActuaciones: number;

  leyendaCodigos: Record<
    string,
    string
  >;

};

export async function generarPdfCierre(
  datos: DatosCierre
) {
console.log(
    "DATOS RECIBIDOS EN EL PDF:"
  );
  console.dir(datos, { depth: null });
  const pdfDoc =
    await PDFDocument.create();

  let page =
  pdfDoc.addPage([612, 792]);

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    const tipoTexto =
  datos.tipo === "pagas"
    ? "Solo actuaciones pagas"
    : datos.tipo === "gratis"
    ? "Solo actuaciones sin pago"
    : "Todas las actuaciones";

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
    "CIERRE DIARIO DE CAJA",
    {
      x: 180,
      y: 690,
      size: 16,
      font: bold,
    }
  );

  page.drawText(
    `Fecha: ${datos.fecha}`,
    {
      x: 40,
      y: 650,
      size: 11,
      font,
    }
  );

  page.drawText(
    `Usuario: ${datos.usuario}`,
    {
      x: 40,
      y: 630,
      size: 11,
      font,
    }
  );

  page.drawText(
    `Caja: ${datos.caja}`,
    {
      x: 40,
      y: 610,
      size: 11,
      font,
    }
  );

  page.drawText(
    `Tipo: ${tipoTexto}`,
    {
      x: 40,
      y: 590,
      size: 11,
      font,
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

  page.drawText(
  "Recibo",
  {
    x: 40,
    y: 540,
    size: 10,
    font: bold,
  }
);

page.drawText(
  "Documento",
  {
    x: 105,
    y: 540,
    size: 10,
    font: bold,
  }
);

page.drawText(
  "Nombre",
  {
    x: 190,
    y: 540,
    size: 10,
    font: bold,
  }
);

page.drawText(
  "Actuación",
  {
    x: 380,
    y: 540,
    size: 10,
    font: bold,
  }
);

page.drawText(
  "USD",
  {
    x: 530,
    y: 540,
    size: 10,
    font: bold,
  }
);

  let y = 515;

  datos.registros.forEach(
  (item) => {

    page.drawText(
      item[1],
      {
        x: 40,
        y,
        size: 9,
        font,
      }
    );

    page.drawText(
      item[2],
      {
        x: 105,
        y,
        size: 9,
        font,
      }
    );

    page.drawText(
      item[3].substring(0, 30),
      {
        x: 190,
        y,
        size: 9,
        font,
      }
    );

    page.drawText(
  String(item[4]),
  {
    x: 380,
    y,
    size: 9,
    font,
  }
);

    page.drawText(
  String(item[6]),
  {
    x: 530,
    y,
    size: 9,
    font,
  }
);

    y -= 18;

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
    `Total USD: ${datos.totalUSD}`,
    {
      x: 40,
      y,
      size: 12,
      font: bold,
    }
  );
  y -= 35;

const imprimirTituloLeyenda = () => {

  page.drawText(
    "LEYENDA DE CÓDIGOS",
    {
      x: 40,
      y,
      size: 11,
      font: bold,
    }
  );

  y -= 20;

};

if (y < 170) {

  page = pdfDoc.addPage([612, 792]);

  y = 740;

  page.drawText(
    "CIERRE DIARIO DE CAJA",
    {
      x: 180,
      y,
      size: 16,
      font: bold,
    }
  );

  y -= 35;

  page.drawText(
    "ANEXO - LEYENDA DE CÓDIGOS",
    {
      x: 40,
      y,
      size: 13,
      font: bold,
    }
  );

  y -= 30;

} else {

  imprimirTituloLeyenda();

}

Object.entries(
  datos.leyendaCodigos
).forEach(

  ([codigo, nombre]) => {

    if (y < 60) {

      page = pdfDoc.addPage([612, 792]);

      y = 740;

      page.drawText(
        "ANEXO - LEYENDA DE CÓDIGOS",
        {
          x: 40,
          y,
          size: 13,
          font: bold,
        }
      );

      y -= 30;

    }

    page.drawText(

      `${codigo}  -  ${nombre}`,

      {
        x: 50,
        y,
        size: 9,
        font,
      }

    );

    y -= 15;

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
  datos.usuario,
  {
    x: 220,
    y: 75,
    size: 10,
    font,
  }
);

page.drawText(
  datos.caja,
  {
    x: 260,
    y: 60,
    size: 10,
    font,
  }
);
page.drawText(
  "Documento generado por el Sistema de Caja Consular",
  {
    x: 140,
    y: 22,
    size: 9,
    font,
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

console.log("PDF TERMINADO");  
return await pdfDoc.save();

}