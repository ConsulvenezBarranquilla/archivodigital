import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {
  try {

    const workbook =
      new ExcelJS.Workbook();

    const hojas = [
      "Caja",
      "DetalleCaja",
      "UsuariosCaja",
      "Configuracion",
      "Correlativos",
      "Actuaciones",
    ];

    for (const nombreHoja of hojas) {

      const response =
        await sheets.spreadsheets.values.get({
          spreadsheetId:
            MODULO_CAJA_SHEET_ID,
          range:
            `${nombreHoja}!A:Z`,
        });

      const rows =
        response.data.values || [];

      const worksheet =
        workbook.addWorksheet(
          nombreHoja
        );

      rows.forEach(
        (row) => {

          worksheet.addRow(
            row
          );

        }
      );

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
        `attachment; filename=Backup_Modulo_Caja_${fecha}.xlsx`,
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