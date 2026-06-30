import ExcelJS from "exceljs";

type Detalle = {
  fechaISO?: string;
  fecha: string;
  documento: string;
  nombre: string;
  tipo: string;
};

type Resumen = {
  tipo: string;
  cantidad: number;
};

type DatosReporte = {
  titulo: string;
  desde?: string;
  hasta?: string;
  total: number;
  detalle: Detalle[];
  resumen: Resumen[];
};

export async function generarExcelReporteVisitas(
  datos: DatosReporte
) {

  const workbook = new ExcelJS.Workbook();

  workbook.creator =
    "Sistema de Caja Consular";

  workbook.created =
    new Date();

  //-------------------------------------------------------
  // HOJA DETALLE
  //-------------------------------------------------------

  const detalle =
    workbook.addWorksheet(
      "Detalle"
    );

  detalle.mergeCells("A1:E1");

  detalle.getCell("A1").value =
    "CONSULADO GENERAL DE LA REPÚBLICA BOLIVARIANA DE VENEZUELA EN BARRANQUILLA";

  detalle.getCell("A1").font = {
    bold: true,
    size: 14,
  };

  detalle.getCell("A1").alignment = {
    horizontal: "center",
  };

  detalle.mergeCells("A2:E2");

  detalle.getCell("A2").value =
    datos.titulo;

  detalle.getCell("A2").font = {
    bold: true,
    size: 12,
  };

  detalle.getCell("A2").alignment = {
    horizontal: "center",
  };

  let fila = 4;

  detalle.getCell(`A${fila}`).value =
    "Fecha de generación";

  detalle.getCell(`B${fila}`).value =
    new Date().toLocaleString(
      "es-CO"
    );

  fila++;

  if (datos.desde) {

    detalle.getCell(`A${fila}`).value =
      "Desde";

    detalle.getCell(`B${fila}`).value =
      datos.desde;

    fila++;

  }

  if (datos.hasta) {

    detalle.getCell(`A${fila}`).value =
      "Hasta";

    detalle.getCell(`B${fila}`).value =
      datos.hasta;

    fila++;

  }

  detalle.getCell(`A${fila}`).value =
    "Total de visitas";

  detalle.getCell(`B${fila}`).value =
    datos.total;

  fila += 2;

  const encabezado =
    fila;

  detalle.addRow([
    "#",
    "Fecha y Hora",
    "Documento",
    "Nombre Completo",
    "Tipo de Visita",
  ]);

  const filaEncabezado =
    detalle.getRow(
      encabezado + 1
    );

  filaEncabezado.font = {
    bold: true,
  };

  filaEncabezado.alignment = {
    horizontal: "center",
  };

  filaEncabezado.eachCell(
    (cell) => {

      cell.border = {

        top: {
          style: "thin",
        },

        left: {
          style: "thin",
        },

        bottom: {
          style: "thin",
        },

        right: {
          style: "thin",
        },

      };

    }
  );

  datos.detalle.forEach(
    (
      visita,
      index
    ) => {

      const row =
        detalle.addRow([

          index + 1,

          visita.fecha,

          visita.documento,

          visita.nombre,

          visita.tipo,

        ]);

      row.eachCell(
        (cell) => {

          cell.border = {

            top: {
              style: "thin",
            },

            left: {
              style: "thin",
            },

            bottom: {
              style: "thin",
            },

            right: {
              style: "thin",
            },

          };

        }
      );

    }
  );

  detalle.addRow([]);

  const totalRow =
    detalle.addRow([
      "",
      "",
      "",
      "TOTAL",
      datos.total,
    ]);

  totalRow.font = {
    bold: true,
  };

  detalle.columns = [

  { width: 6 },   // #
  { width: 22 },  // Fecha
  { width: 16 },  // Documento
  { width: 34 },  // Nombre
  { width: 22 },  // Tipo

];

  detalle.autoFilter = {
    from: {
      row:
        encabezado + 1,
      column: 1,
    },
    to: {
      row:
        encabezado + 1,
      column: 5,
    },
  };

  //-------------------------------------------------------
  // HOJA RESUMEN
  //-------------------------------------------------------

  const resumen =
    workbook.addWorksheet(
      "Resumen"
    );

  resumen.mergeCells(
    "A1:B1"
  );

  resumen.getCell("A1").value =
    "RESUMEN DE VISITAS";

  resumen.getCell("A1").font = {
    bold: true,
    size: 14,
  };

  resumen.getCell("A1").alignment = {
    horizontal: "center",
  };

  resumen.addRow([]);

  resumen.addRow([
    "Tipo de Visita",
    "Cantidad",
  ]);

  const filaResumen =
    resumen.getRow(3);

  filaResumen.font = {
    bold: true,
  };

  filaResumen.alignment = {
    horizontal: "center",
  };

  filaResumen.eachCell(
    (cell) => {

      cell.border = {

        top: {
          style: "thin",
        },

        left: {
          style: "thin",
        },

        bottom: {
          style: "thin",
        },

        right: {
          style: "thin",
        },

      };

    }
  );

  datos.resumen.forEach(
    (item) => {

      const row =
        resumen.addRow([

          item.tipo,

          item.cantidad,

        ]);

      row.eachCell(
        (cell) => {

          cell.border = {

            top: {
              style: "thin",
            },

            left: {
              style: "thin",
            },

            bottom: {
              style: "thin",
            },

            right: {
              style: "thin",
            },

          };

        }
      );

    }
  );

  resumen.addRow([]);

  const filaTotal =
    resumen.addRow([

      "TOTAL",

      datos.total,

    ]);

  filaTotal.font = {
    bold: true,
  };

  resumen.columns = [

  { width: 30 },  // Tipo
  { width: 12 },  // Cantidad

];

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(
    buffer
  );

}