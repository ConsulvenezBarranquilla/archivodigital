import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json();

    // Debe existir al menos un documento

    if (
      !body.cedula?.trim() &&
      !body.pasaporte?.trim()
    ) {

      return NextResponse.json({
        ok: false,
        error:
          "Debe existir al menos un documento.",
      });

    }

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,

        range:
          "Respuestas de formulario 1!A:O",

      });

    const rows =
      response.data.values || [];

    let fila = -1;

    const buscado =
      body.documento
        ?.trim()
        .toUpperCase();

    rows.forEach(
      (row, index) => {

        if (index === 0) {
          return;
        }

        const cedula =
          row[1]
            ?.toString()
            .trim()
            .toUpperCase();

        const pasaporte =
          row[14]
            ?.toString()
            .trim()
            .toUpperCase();

        if (

          cedula === buscado ||

          pasaporte === buscado

        ) {

          fila =
            index + 1;

        }

      }
    );

    if (fila === -1) {

      return NextResponse.json({

        ok: false,

        error:
          "Ciudadano no encontrado",

      });

    }

    // Validar cédula duplicada

const cedulaNueva =
  body.cedula
    ?.trim()
    .toUpperCase();

const pasaporteNuevo =
  body.pasaporte
    ?.trim()
    .toUpperCase();

for (let i = 1; i < rows.length; i++) {

  // Ignorar el mismo ciudadano

  if (i + 1 === fila) {
    continue;
  }

  const cedulaExistente =
    rows[i][1]
      ?.toString()
      .trim()
      .toUpperCase();

  const pasaporteExistente =
    rows[i][14]
      ?.toString()
      .trim()
      .toUpperCase();

  if (
    cedulaNueva &&
    cedulaNueva === cedulaExistente
  ) {

    return NextResponse.json({

      ok: false,

      error:
        "Ya existe otro ciudadano con esa cédula.",

    });

  }

  if (

    pasaporteNuevo &&

    pasaporteNuevo === pasaporteExistente

  ) {

    return NextResponse.json({

      ok: false,

      error:
        "Ya existe otro ciudadano con ese pasaporte.",

    });

  }

}

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range:
        `Respuestas de formulario 1!B${fila}:O${fila}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values: [[

          body.cedula,

          body.primerNombre,

          body.segundoNombre,

          body.primerApellido,

          body.segundoApellido,

          body.nacionalidad,

          body.ciudadNacimiento,

          body.paisNacimiento,

          body.estadoCivil,

          body.genero,

          body.correo,

          body.telefono,

          body.fechaNacimiento,

          body.pasaporte,

        ]],

      },

    });

    return NextResponse.json({

      ok: true,

    });

  } catch (error: any) {

    return NextResponse.json({

      ok: false,

      error:
        error.message,

    });

  }

}