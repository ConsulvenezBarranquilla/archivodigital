import ExcelJS from "exceljs";

import {
    LibroDiarioResultado,
} from "@/types/LibroDiario";

export async function generarExcelLibroDiario(

    libro: LibroDiarioResultado,

    fechaInicial: string,

    fechaFinal: string,
    
) {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Consulnet Barranquilla";

    workbook.created = new Date();

    const sheet = workbook.addWorksheet(

        "Libro Diario"

    );
    sheet.views = [

    {

        state: "frozen",

        ySplit: 9,

    },

];

sheet.pageSetup = {

    orientation: "landscape",

    paperSize: 9,

    fitToPage: true,

    fitToWidth: 1,

};

sheet.properties.defaultRowHeight = 22;
sheet.mergeCells("A1:G1");

sheet.getCell("A1").value =
    "REPÚBLICA BOLIVARIANA DE VENEZUELA";

sheet.mergeCells("A2:G2");

sheet.getCell("A2").value =
    "CONSULADO GENERAL DE LA REPÚBLICA BOLIVARIANA DE VENEZUELA EN BARRANQUILLA";

sheet.mergeCells("A3:G3");

sheet.getCell("A3").value =
    "LIBRO DIARIO DE RENTA CONSULAR";

sheet.mergeCells("A5:G5");

sheet.getCell("A5").value =
    `Período: ${fechaInicial} al ${fechaFinal}`;

    for (let fila = 1; fila <= 6; fila++) {

    const cell = sheet.getCell(`A${fila}`);

    cell.font = {

        bold: true,

        size: fila === 3 ? 16 : 12,

        color: {

            argb: "FFFFFFFF",

        },

    };

    cell.alignment = {

        horizontal: "center",

    };

    cell.fill = {

        type: "pattern",

        pattern: "solid",

        fgColor: {

            argb: "1E3A8A",

        },

    };

}
sheet.mergeCells("A7:G7");

sheet.getCell("A7").value =
    `Generado: ${new Date().toLocaleString("es-CO")}`;
const filaEncabezado = 9;

sheet.columns = [

    { width: 14 }, // Fecha

    { width: 20 }, // Planilla / Comunicación

    { width: 45 }, // Solicitante / Concepto

    { width: 16 }, // Arancel

    { width: 16 }, // Débito

    { width: 16 }, // Crédito

    { width: 16 }, // Saldo

];

sheet.getRow(filaEncabezado).values = [

    "Fecha",

    "Planilla / Comunicación",

    "Solicitante / Concepto",

    "Arancel (USD)",

    "Débito (USD)",

    "Crédito (USD)",

    "Saldo (USD)",

];
const encabezado = sheet.getRow(filaEncabezado);

encabezado.height = 25;

encabezado.eachCell((cell) => {

    cell.font = {

        bold: true,

        color: {

            argb: "FFFFFFFF",

        },

    };

    cell.fill = {

        type: "pattern",

        pattern: "solid",

        fgColor: {

            argb: "1E3A8A",

        },

    };

    cell.alignment = {

        horizontal: "center",

        vertical: "middle",

    };

    cell.border = {

        top: { style: "thin" },

        left: { style: "thin" },

        bottom: { style: "thin" },

        right: { style: "thin" },

    };

});
let fila = filaEncabezado + 1;

for (const movimiento of libro.movimientos) {

    const row = sheet.getRow(fila);

    row.values = [

        movimiento.fecha,

        movimiento.referencia,

        movimiento.descripcion,

        movimiento.arancel || "",

        movimiento.debe || "",

        movimiento.haber || "",

        movimiento.saldo,

    ];
for (const columna of [4, 5, 6, 7]) {

    row.getCell(columna).numFmt =
    '#,##0.00_);[Red](#,##0.00)';

    row.getCell(columna).alignment = {

        horizontal: "right",

    };

}

// ==========================================
// Estilos según el tipo de fila
// ==========================================

let colorFondo = "FFFFFFFF";
let colorTexto = "FF000000";
let negrita = false;

// ==========================================
// Color para movimientos manuales
// ==========================================

if (

    movimiento.tipoFila === "MOVIMIENTO" &&

    movimiento.origen === "MOVIMIENTO"

) {

    colorFondo = "FFFFF4F2";

}

// ==========================================
// Colores de filas especiales
// ==========================================

switch (movimiento.tipoFila) {

    case "INICIO_DIA":

        colorFondo = "FFDCEEFF";
        negrita = true;
        break;

    case "TOTAL_DIA":

        colorFondo = "FFF2F2F2";
        negrita = true;
        break;

    case "TOTAL_MES":

        colorFondo = "FF1E3A8A";
        colorTexto = "FFFFFFFF";
        negrita = true;
        break;

}

row.eachCell((cell) => {

    cell.font = {

        bold: negrita,

        color: {

            argb: colorTexto,

        },

    };

    cell.fill = {

        type: "pattern",

        pattern: "solid",

        fgColor: {

            argb: colorFondo,

        },

    };

    cell.border = {

        top: { style: "thin" },

        left: { style: "thin" },

        bottom: { style: "thin" },

        right: { style: "thin" },

    };

});

row.getCell(1).alignment = {

    horizontal: "center",

};

row.getCell(2).alignment = {

    horizontal: "center",

};
 fila++;

}
sheet.autoFilter = {

    from: {

        row: filaEncabezado,

        column: 1,

    },

    to: {

        row: filaEncabezado,

        column: 7,

    },

};
   
    const buffer = await workbook.xlsx.writeBuffer();

return Buffer.from(buffer);
}