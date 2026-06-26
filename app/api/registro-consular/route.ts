import { NextRequest, NextResponse } from "next/server";
import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    const documento = req.nextUrl.searchParams
      .get("documento")
      ?.trim()
      .toUpperCase();

    if (!documento) {
      return NextResponse.json(
        {
          encontrado: false,
          error: "Documento requerido",
        },
        { status: 400 }
      );
    }

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId: REGISTRO_CONSULAR_SHEET_ID,
        range: "Respuestas de formulario 1!A:O",
      });

    const rows = response.data.values || [];

    let ciudadano = rows.find((row, index) => {

  if (index === 0) return false;

  return (
    row[1]
      ?.toString()
      .trim()
      .toUpperCase() === documento
  );

});

if (!ciudadano) {

  ciudadano = rows.find((row, index) => {

    if (index === 0) return false;

    return (
      row[14]
        ?.toString()
        .trim()
        .toUpperCase() === documento
    );

  });

}

    if (!ciudadano) {
      return NextResponse.json({
        encontrado: false,
      });
    }

    const nombreCompleto = [
      ciudadano[2],
      ciudadano[3],
      ciudadano[4],
      ciudadano[5],
    ]
      .filter(Boolean)
      .join(" ");

      const cedula =
  ciudadano[1] || "";

const pasaporte =
  ciudadano[14] || "";

const nacionalidad =
  ciudadano[6] || "";

const documentoPrincipal =
  obtenerDocumentoPrincipal(
    cedula,
    pasaporte,
    nacionalidad
  );

    return NextResponse.json({
      encontrado: true,

  fechaRegistro: ciudadano[0],

  documento: documentoPrincipal,

  cedula,

  pasaporte,

  primerNombre: ciudadano[2],
  segundoNombre: ciudadano[3],

  primerApellido: ciudadano[4],
  segundoApellido: ciudadano[5],

  nombreCompleto,

  nacionalidad,

  ciudadNacimiento: ciudadano[7],
  paisNacimiento: ciudadano[8],

  estadoCivil: ciudadano[9],
  genero: ciudadano[10],

  correo: ciudadano[11],
  telefono: ciudadano[12],

  fechaNacimiento: ciudadano[13],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        encontrado: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}