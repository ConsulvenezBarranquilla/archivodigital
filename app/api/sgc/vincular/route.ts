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

      planilla,

      fechaPlanilla,

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
          "No existen actuaciones para vincular.",

      });

    }

    if (

      !planilla?.trim()

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar el número de Planilla de Gestión Consular.",

      });

    }
if (

  !/^\d+$/.test(
    planilla.trim()
  )

) {

  return NextResponse.json({

    ok: false,

    error:
      "El número de planilla debe contener únicamente números.",

  });

}
    if (

      !fechaPlanilla

    ) {

      return NextResponse.json({

        ok: false,

        error:
          "Debe indicar la fecha de la Planilla.",

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
    // Verificar actuaciones ya vinculadas
    // ===============================

    const gestionResponse =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "GestionConsular!A:L",

      });

    const registrosGestion =
      gestionResponse.data.values || [];
const detalleResponse =
  await sheets.spreadsheets.values.get({

    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      "DetalleCaja!A:H",

  });

const detalleCaja =
  detalleResponse.data.values || [];
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

      const numeroActuacion =
  (actuacion.numeroActuacion || "")
    .toString()
    .trim();

if (!numeroActuacion) {

    return NextResponse.json({

        ok: false,

        error:
            `Debe indicar el número de la actuación para ${codigo}.`,

    });

}

if (!/^\d+$/.test(numeroActuacion)) {

    return NextResponse.json({

        ok: false,

        error:
            `El número de actuación debe contener únicamente números.`,

    });

}

      const existente =
  filasGestion.find((row) => {

    return (

      (row[11] || "")
        .toString()
        .trim() === numeroActuacion &&

      (row[6] || "")
        .toString()
        .trim() !== "DESVINCULADO"

    );

  });

      if (existente) {

        return NextResponse.json({

          ok: false,

          error:
            `La actuación ${numeroActuacion} del recibo ${correlativo} ya se encuentra vinculada.`,

        });

      }

      nuevasFilas.push([

        correlativo,

        codigo,

        actuacion.actuacion || "",

        planilla,

        fechaPlanilla,

        usuario,

        "VINCULADO",

        ahora,

        "",

        "",

        observaciones || "",

        numeroActuacion,

      ]);

    }
    // ===============================
// Registrar actuaciones
// ===============================

await sheets.spreadsheets.values.append({

    spreadsheetId:
        MODULO_CAJA_SHEET_ID,

    range:
        "GestionConsular!A:L",

    valueInputOption:
        "USER_ENTERED",

    insertDataOption:
        "INSERT_ROWS",

    requestBody: {

        values:
            nuevasFilas,

    },

});

// ===============================
// Actualizar DetalleCaja
// ===============================

const filasDetalle = detalleCaja.map((fila) => [...fila]);

for (const actuacion of actuaciones) {

    const correlativo =
        String(actuacion.recibo ?? "").trim();

    const codigo =
        String(actuacion.codigo ?? "").trim();

    const numeroActuacion =
        String(actuacion.numeroActuacion ?? "").trim();

    for (let i = 1; i < filasDetalle.length; i++) {

        const fila = filasDetalle[i];

        if (

            String(fila[0] ?? "").trim() === correlativo &&
            String(fila[1] ?? "").trim() === codigo &&
            !String(fila[4] ?? "").trim()

        ) {

            fila[4] = numeroActuacion;   // E
fila[5] = planilla;          // F
fila[6] = "VINCULADO";       // G
fila[7] = fechaPlanilla;     // H

            break;

        }

    }

}

await sheets.spreadsheets.values.update({

    spreadsheetId:
        MODULO_CAJA_SHEET_ID,

    range:
        `DetalleCaja!A2:H${filasDetalle.length}`,

    valueInputOption:
        "USER_ENTERED",

    requestBody: {

        values: filasDetalle.slice(1),

    },

});

return NextResponse.json({

    ok: true,

    cantidad:
        nuevasFilas.length,

    mensaje:
        `${nuevasFilas.length} actuación(es) vinculada(s) correctamente.`,

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