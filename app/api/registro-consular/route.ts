import { NextRequest, NextResponse } from "next/server";
import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
  obtenerDocumentoPrincipal,
} from "@/lib/googleSheets";

function normalizar(texto: string) {

  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

}

export async function GET(req: NextRequest) {
  try {
    const documento = req.nextUrl.searchParams
      .get("documento")
      ?.trim()
      .toUpperCase();
const buscado =
  normalizar(documento || "");

const pareceDocumento =
  /^[A-Z]?\d+$/.test(buscado);
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

    let ciudadano: any = null;

if (pareceDocumento) {

  ciudadano = rows.find((row, index) => {

    if (index === 0) {
      return false;
    }

    const cedula =
      (row[1] || "")
        .toString()
        .trim()
        .toUpperCase();

    const pasaporte =
      (row[14] || "")
        .toString()
        .trim()
        .toUpperCase();

    return (
      cedula === buscado ||
      pasaporte === buscado
    );

  });

} else {

  const coincidencias = rows
    .slice(1)
    .filter((row) => {

      const nombre = normalizar(

  [

    row[2],
    row[3],
    row[4],
    row[5],

  ]
    .filter(Boolean)
    .join(" ")

);
const palabras =
  buscado.split(" ");

return palabras.every(

  palabra =>

    nombre.includes(palabra)

);
    });
coincidencias.sort((a, b) => {

  const nombreA = normalizar(
    [
      a[2],
      a[3],
      a[4],
      a[5]
    ]
      .filter(Boolean)
      .join(" ")
  );

  const nombreB = normalizar(
    [
      b[2],
      b[3],
      b[4],
      b[5]
    ]
      .filter(Boolean)
      .join(" ")
  );

  return nombreA.localeCompare(nombreB);

});
  if (coincidencias.length === 0) {

    return NextResponse.json({
      encontrado: false,
    });

  }

  if (coincidencias.length > 1) {

    return NextResponse.json({

      encontrado: true,

      multiple: true,

      coincidencias:

        coincidencias.map((row) => {

          const cedula =
            row[1] || "";

          const pasaporte =
            row[14] || "";

          const nacionalidad =
            row[6] || "";

          return {

            documento:
              obtenerDocumentoPrincipal(
                cedula,
                pasaporte,
                nacionalidad
              ),

            cedula,

            pasaporte,

            nombreCompleto: [

              row[2],
              row[3],
              row[4],
              row[5],

            ]
              .filter(Boolean)
              .join(" "),

            nacionalidad,

            fechaNacimiento:
              row[13] || "",

          };

        }),

    });

  }

  ciudadano = coincidencias[0];

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

  documentoOriginal: documento,

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