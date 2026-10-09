import {
  NextResponse,
} from "next/server";

import {
  subirArchivoDrive,
} from "@/lib/googleDrive";

export const runtime =
  "nodejs";

/*------------------------------------------
POST
------------------------------------------*/

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const archivo =
      formData.get(
        "archivo"
      );

    const categoria =
      String(
        formData.get(
          "categoria"
        ) || ""
      ).trim();

    const tipoArchivo =
      String(
        formData.get(
          "tipoArchivo"
        ) || ""
      ).trim();

    const documentoId =
      String(
        formData.get(
          "documentoId"
        ) || ""
      ).trim();

    const archivoIdExistenteRaw =
      formData.get(
        "archivoIdExistente"
      );

    const archivoIdExistente =
      archivoIdExistenteRaw
        ? String(
            archivoIdExistenteRaw
          ).trim()
        : "";

    /*----------------------------------------
    VALIDAR ARCHIVO
    ----------------------------------------*/

    if (
      !archivo ||
      !(archivo instanceof File)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se recibió un archivo válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*----------------------------------------
    VALIDAR CAMPOS
    ----------------------------------------*/

    if (
      !categoria
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La categoría es obligatoria.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !tipoArchivo
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El tipo de archivo es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !documentoId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El documentoId es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    /*----------------------------------------
    SUBIR A DRIVE
    ----------------------------------------*/

    const resultado =
      await subirArchivoDrive({
        archivo,
        categoria,
        tipoArchivo,
        documentoId,
        archivoIdExistente:
          archivoIdExistente ||
          undefined,
      });

    /*----------------------------------------
    RESPUESTA
    ----------------------------------------*/

    return NextResponse.json({
      ok: true,

      archivo: resultado,
    });

  } catch (error) {

    console.error(
      "Error en /api/archivos/subir:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "Error interno al subir el archivo.";

    return NextResponse.json(
      {
        ok: false,
        error: mensaje,
      },
      {
        status: 500,
      }
    );
  }
}