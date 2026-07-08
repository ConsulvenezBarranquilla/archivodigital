import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sheets,
  REGISTRO_CONSULAR_SHEET_ID,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json();
          if (
      !body.documentoOriginal
    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Documento requerido.",

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

    const buscado =
      body.documentoOriginal
        .toString()
        .trim()
        .toUpperCase();

    const fila =
      rows.findIndex((row, index) => {

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

    if (fila === -1) {

      return NextResponse.json({

        ok: false,

        error:
          "Ciudadano no encontrado.",

      });

    }
     const visitasResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "BitacoraVisitas!A:G",

      });

    const cajaResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "Caja!A:N",

      });

    const visitas =
      visitasResponse.data.values || [];

    const caja =
      cajaResponse.data.values || [];

    const cedula =
  rows[fila][1] || "";

const pasaporte =
  rows[fila][14] || "";

    const tieneVisitas =
  visitas
    .slice(1)
    .some((row) => {

      const cedulaVisita =
        row[2] || "";

      const pasaporteVisita =
        row[3] || "";

      return (

        (

          cedula &&

          cedulaVisita === cedula

        ) ||

        (

          pasaporte &&

          pasaporteVisita === pasaporte

        )

      );

    });

    const tieneTramites =
  caja
    .slice(1)
    .some((row) => {

      const cedulaCaja =
        row[11] || row[2] || "";

      const pasaporteCaja =
        row[12] || "";

      return (

        (

          cedula &&

          cedulaCaja === cedula

        ) ||

        (

          pasaporte &&

          pasaporteCaja === pasaporte

        )

      );

    });

    if (tieneVisitas && tieneTramites) {

  return NextResponse.json({

    ok: false,

    error:
      "No es posible eliminar este ciudadano porque posee visitas y actuaciones consulares registradas.",

  });

}

if (tieneVisitas) {

  return NextResponse.json({

    ok: false,

    error:
      "No es posible eliminar este ciudadano porque posee visitas registradas.",

  });

}

if (tieneTramites) {

  return NextResponse.json({

    ok: false,

    error:
      "No es posible eliminar este ciudadano porque posee actuaciones consulares registradas.",

  });

}
       
    // Crear una copia de todas las filas

    const datos =
  [...rows];

if (
  datos.length <= 1
) {

  return NextResponse.json({

    ok: false,

    error:
      "No existen registros para reconstruir la hoja.",

  });

}

    // Eliminar el ciudadano encontrado

    datos.splice(
      fila,
      1
    );

    // Limpiar únicamente las respuestas,
    // conservando los encabezados

    await sheets.spreadsheets.values.clear({

      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range:
        "Respuestas de formulario 1!A2:O",

    });

    // Escribir nuevamente todas las respuestas
    // sin modificar la fila de encabezados

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        REGISTRO_CONSULAR_SHEET_ID,

      range:
        "Respuestas de formulario 1!A2:O",

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values:

          datos.slice(1),

      },

    });
    console.log(

  "Ciudadano eliminado:",

  body.documentoOriginal,

  "- Total restante:",

  datos.length - 1

);

    return NextResponse.json({

      ok: true,

      eliminado: true,

    });
      } catch (error: any) {

    console.error(
      "Error eliminando ciudadano:",
      error
    );

    return NextResponse.json(

      {

        ok: false,

        error:
          error.message,

      },

      {

        status: 500,

      }

    );

  }

}