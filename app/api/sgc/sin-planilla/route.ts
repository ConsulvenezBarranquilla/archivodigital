import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  fechaHoraActual,
} from "@/lib/fechas";
import {

  sheets,

  MODULO_CAJA_SHEET_ID,

} from "@/lib/googleSheets";

export async function POST(

  req: NextRequest

) {

  try {

    const {

      actuaciones,

      usuario,

      observaciones,

    } = await req.json();

    if (

      !actuaciones ||

      actuaciones.length === 0

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "No existen actuaciones para registrar.",

      });

    }

    if (

      !usuario?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Usuario no identificado.",

      });

    }

    const ahora = fechaHoraActual();
            // ===============================
    // Verificar actuaciones ya registradas
    // ===============================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:K",

      });

    const registrosGestion =
      gestionResponse.data.values || [];

    const filasGestion =
      registrosGestion.slice(1);

    const nuevasFilas: any[] = [];

    for (const actuacion of actuaciones) {

      const correlativo =
        (actuacion.recibo || "")
          .toString()
          .trim();

      const codigo =
        (actuacion.codigo || "")
          .toString()
          .trim();

      const existente =
        filasGestion.find((row) => {

          return (

            (row[0] || "") === correlativo &&

            (row[1] || "") === codigo &&

            (

              row[6] === "VINCULADO" ||

              row[6] === "SIN PLANILLA"

            )

          );

        });

      if (existente) {

        return NextResponse.json({

          ok: false,

          error:
            `La actuación ${codigo} del recibo ${correlativo} ya fue registrada.`,

        });

      }

      nuevasFilas.push([

        correlativo,

        codigo,

        actuacion.actuacion || "",

        "",

        "",

        usuario,

        "SIN PLANILLA",

        ahora,

        "",

        "",

        observaciones || "",

      ]);

    }
        // ===============================
    // Registrar actuaciones
    // ===============================

    await sheets.spreadsheets.values.append({

      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "GestionConsular!A:K",

      valueInputOption:
        "USER_ENTERED",

      insertDataOption:
        "INSERT_ROWS",

      requestBody: {

        values:
          nuevasFilas,

      },

    });

    return NextResponse.json({

      ok: true,

      cantidad:
        nuevasFilas.length,

      mensaje:
        `${nuevasFilas.length} actuación(es) registrada(s) como SIN PLANILLA.`,

    });

  } catch (error: any) {

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