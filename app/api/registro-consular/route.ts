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

export async function GET(
  req: NextRequest
) {

  try {
        const documento = req.nextUrl.searchParams
      .get("documento")
      ?.trim() || "";

    if (!documento) {

      return NextResponse.json(

        {

          encontrado: false,

          error:
            "Documento requerido",

        },

        {

          status: 400,

        }

      );

    }

    const buscado =
      normalizar(documento);

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,

        range:
          "Respuestas de formulario 1!A:O",

      });

    const rows =
      response.data.values || [];

            // ===============================
    // Buscar primero por documento
    // ===============================

    let coincidencias =
  rows.filter((row, index) => {

    if (index === 0) {

      return false;

    }

    const cedula =
      normalizar(
        row[1] || ""
      );

    const pasaporte =
      normalizar(
        row[14] || ""
      );

    return (

      cedula === buscado ||

      pasaporte === buscado

    );

  });

if (
  coincidencias.length === 0
) {

  coincidencias =
    rows
      .slice(1)
      .filter((row) => {

        const nombre =
          normalizar(

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

}
        coincidencias.sort((a, b) => {

      const nombreA =
        normalizar(

          [

            a[2],
            a[3],
            a[4],
            a[5],

          ]
            .filter(Boolean)
            .join(" ")

        );

      const nombreB =
        normalizar(

          [

            b[2],
            b[3],
            b[4],
            b[5],

          ]
            .filter(Boolean)
            .join(" ")

        );

      return nombreA.localeCompare(
        nombreB
      );

    });

    if (
      coincidencias.length === 0
    ) {

      return NextResponse.json({

        encontrado: false,

      });

    }

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

            indice:
              rows.indexOf(row),

            documento:
              obtenerDocumentoPrincipal(

                cedula,

                pasaporte,

                nacionalidad

              ),

            cedula,

            pasaporte,

            nombreCompleto:

              [

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

              correo:
  row[11] || "",

  telefono:
  row[12] || "",

          };

        }),

    });
      } catch (error: any) {

    return NextResponse.json(

      {

        encontrado: false,

        error:
          error.message,

      },

      {

        status: 500,

      }

    );

  }

}