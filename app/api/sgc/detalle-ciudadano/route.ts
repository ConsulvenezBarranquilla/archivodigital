import {
  NextRequest,
  NextResponse,
} from "next/server";

import {

  sheets,

  REGISTRO_CONSULAR_SHEET_ID,

  obtenerDocumentoPrincipal,

} from "@/lib/googleSheets";

export async function GET(

  req: NextRequest

) {

  try {

    const documento =
      req.nextUrl.searchParams
        .get("documento")
        ?.trim()
        .toUpperCase();

    if (!documento) {

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

    let ciudadano: any = null;
        // ===============================
    // Buscar por cédula o pasaporte
    // ===============================

    rows.forEach((row, index) => {

      if (index === 0) {

        return;

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

      if (

        cedula === documento ||

        pasaporte === documento

      ) {

        ciudadano = {

          encontrado: true,

          fechaRegistro:
            row[0] || "",

          documento:
            obtenerDocumentoPrincipal(

              cedula,

              pasaporte,

              row[6] || ""

            ),

          documentoOriginal:
            cedula || pasaporte,

          cedula,

          pasaporte,

          primerNombre:
            row[2] || "",

          segundoNombre:
            row[3] || "",

          primerApellido:
            row[4] || "",

          segundoApellido:
            row[5] || "",

          nacionalidad:
            row[6] || "",

          ciudadNacimiento:
            row[7] || "",

          paisNacimiento:
            row[8] || "",

          estadoCivil:
            row[9] || "",

          genero:
            row[10] || "",

          correo:
            row[11] || "",

          telefono:
            row[12] || "",

          fechaNacimiento:
            row[13] || "",

        };

      }

    });

    if (!ciudadano) {

      return NextResponse.json({

        ok: false,

        encontrado: false,

        error:
          "Ciudadano no encontrado.",

      });

    }
        return NextResponse.json({

  ok: true,

  ...ciudadano,

});

  } catch (error: any) {

    return NextResponse.json(

      {

        ok: false,

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