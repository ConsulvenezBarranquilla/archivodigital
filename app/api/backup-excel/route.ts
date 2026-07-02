import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {
  try {

    const workbook =
      new ExcelJS.Workbook();

    const hojas = [

  // MODULO CAJA
  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "Caja",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "DetalleCaja",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "UsuariosCaja",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "Configuracion",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "Correlativos",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "Actuaciones",
  },

  {
    spreadsheetId: MODULO_CAJA_SHEET_ID,
    nombre: "BitacoraVisitas",
  },

  // REGISTRO CONSULAR

  {
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    nombre: "Respuestas de formulario 1",
  },

  {
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    nombre: "Catalogos",
  },

  {
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    nombre: "HistorialRegistro",
  },

  {
    spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
    nombre: "Duplicados",
  },

];

    for (const hoja of hojas) {

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        hoja.spreadsheetId,

      range:
        `${hoja.nombre}!A:ZZ`,

    });

  const rows =
    response.data.values || [];

  const worksheet =
    workbook.addWorksheet(
      hoja.nombre
    );

  rows.forEach((row) => {

    worksheet.addRow(row);

  });

}
      
    const fecha =
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

const buffer =
  await workbook.xlsx.writeBuffer();

const fileBuffer =
  Buffer.from(
    buffer as ArrayBuffer
  );

return new NextResponse(
  fileBuffer,
  {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition":
        `attachment; filename=Backup_Sistema_Consular_${fecha}.xlsx`,
    },
  }
);
    
  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }
}