import { NextResponse } from "next/server";
import crypto from "crypto";

import { obtenerSesion } from "@/lib/auth";

import {
  obtenerFirmasUsuario,
  obtenerFirmaPorId,
  crearFirma,
  actualizarFirma,
  eliminarFirma,
} from "@/lib/firmas";

import {
  subirFirmaDrive,
} from "@/lib/googleDrive";

import { google } from "googleapis";

/*------------------------------------------
CONFIGURACIÓN GOOGLE DRIVE
------------------------------------------*/

const GOOGLE_DRIVE_CLIENT_ID =
  process.env.GOOGLE_DRIVE_CLIENT_ID || "";

const GOOGLE_DRIVE_CLIENT_SECRET =
  process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";

const GOOGLE_DRIVE_REFRESH_TOKEN =
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";

/*------------------------------------------
AUTENTICACIÓN GOOGLE DRIVE
------------------------------------------*/

const oauth2Client =
  new google.auth.OAuth2(
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET
  );

oauth2Client.setCredentials({
  refresh_token:
    GOOGLE_DRIVE_REFRESH_TOKEN,
});

const drive =
  google.drive({
    version: "v3",
    auth:
      oauth2Client,
  });

/*------------------------------------------
GET
OBTENER FIRMAS DEL USUARIO AUTENTICADO
------------------------------------------*/

export async function GET() {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión autenticada.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * IMPORTANTE:
     * El usuario se obtiene exclusivamente
     * de la sesión del servidor.
     */

    const usuario =
      sesion.usuario;

    const firmas =
      await obtenerFirmasUsuario(
        usuario
      );

    return NextResponse.json({
      ok: true,
      firmas,
    });

  } catch (error) {
    console.error(
      "Error GET /api/firmas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener las firmas.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
POST
CREAR FIRMA VISUAL
------------------------------------------*/

export async function POST(
  request: Request
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión autenticada.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Por ahora la administración de firmas
     * está restringida a administradores.
     */

    if (
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para administrar firmas.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const nombreFirma =
      formData.get(
        "nombreFirma"
      );

    const archivo =
      formData.get(
        "archivo"
      );

    if (
      typeof nombreFirma !==
      "string" ||
      !nombreFirma.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El nombre de la firma es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !(archivo instanceof File)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Debe seleccionar una imagen de firma.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * El ID se genera en el servidor.
     */

    const idFirma =
      `FIR-${crypto.randomUUID()}`;

    /*
     * La firma pertenece SIEMPRE
     * al usuario autenticado.
     */

    const usuario =
      sesion.usuario;

    /*--------------------------------------
    SUBIR IMAGEN A DRIVE
    --------------------------------------*/

    const archivoDrive =
      await subirFirmaDrive(
        archivo,
        usuario,
        idFirma
      );

    try {

      /*------------------------------------
      GUARDAR REGISTRO EN SHEETS
      ------------------------------------*/

      const firma = {
        idFirma,

        usuario,

        nombreFirma:
          nombreFirma.trim(),

        archivoFirma:
          archivoDrive.nombre,

        archivoFirmaDriveId:
          archivoDrive.id,

        activo:
          "SI",

        fechaCreacion:
          new Date().toISOString(),
      };

      await crearFirma(
        firma
      );

      return NextResponse.json(
        {
          ok: true,
          firma,
        },
        {
          status: 201,
        }
      );

    } catch (errorSheets) {

      /*
       * Si Drive funcionó pero Sheets falló,
       * intentamos eliminar el archivo para
       * evitar archivos huérfanos.
       */

      try {
        await drive.files.delete({
          fileId:
            archivoDrive.id,
        });
      } catch (errorDrive) {
        console.error(
          "No se pudo eliminar la firma huérfana de Drive:",
          errorDrive
        );
      }

      throw errorSheets;
    }

  } catch (error) {
    console.error(
      "Error POST /api/firmas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear la firma.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
PUT
ACTIVAR / DESACTIVAR FIRMA
------------------------------------------*/

export async function PUT(
  request: Request
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión autenticada.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para administrar firmas.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const idFirma =
      body?.idFirma;

    const activo =
      body?.activo;

    if (
      typeof idFirma !==
      "string" ||
      !idFirma.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El idFirma es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      activo !==
        "SI" &&
      activo !==
        "NO"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El estado de la firma debe ser SI o NO.",
        },
        {
          status: 400,
        }
      );
    }

    /*--------------------------------------
    BUSCAR FIRMA
    --------------------------------------*/

    const firma =
      await obtenerFirmaPorId(
        idFirma
      );

    if (!firma) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró la firma.",
        },
        {
          status: 404,
        }
      );
    }

    /*--------------------------------------
    VERIFICAR PROPIETARIO
    --------------------------------------*/

    if (
      firma.usuario
        .trim()
        .toLowerCase() !==
      sesion.usuario
        .trim()
        .toLowerCase()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No puede modificar una firma perteneciente a otro usuario.",
        },
        {
          status: 403,
        }
      );
    }

    const firmaActualizada =
      await actualizarFirma(
        idFirma,
        {
          activo,
        }
      );

    return NextResponse.json({
      ok: true,
      firma:
        firmaActualizada,
    });

  } catch (error) {
    console.error(
      "Error PUT /api/firmas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la firma.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
DELETE
ELIMINAR FIRMA
------------------------------------------*/

export async function DELETE(
  request: Request
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión autenticada.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para administrar firmas.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const idFirma =
      body?.idFirma;

    if (
      typeof idFirma !==
      "string" ||
      !idFirma.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El idFirma es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    /*--------------------------------------
    BUSCAR FIRMA
    --------------------------------------*/

    const firma =
      await obtenerFirmaPorId(
        idFirma
      );

    if (!firma) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró la firma.",
        },
        {
          status: 404,
        }
      );
    }

    /*--------------------------------------
    VERIFICAR PROPIETARIO
    --------------------------------------*/

    if (
      firma.usuario
        .trim()
        .toLowerCase() !==
      sesion.usuario
        .trim()
        .toLowerCase()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No puede eliminar una firma perteneciente a otro usuario.",
        },
        {
          status: 403,
        }
      );
    }

    /*--------------------------------------
    ELIMINAR DE SHEETS
    --------------------------------------*/

    await eliminarFirma(
      idFirma
    );

    /*--------------------------------------
    ELIMINAR DE DRIVE
    --------------------------------------*/

    if (
      firma.archivoFirmaDriveId
    ) {
      try {
        await drive.files.delete({
          fileId:
            firma.archivoFirmaDriveId,
        });
      } catch (errorDrive) {
        console.error(
          "La firma fue eliminada de Sheets pero no se pudo eliminar de Drive:",
          errorDrive
        );
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje:
        "Firma eliminada correctamente.",
    });

  } catch (error) {
    console.error(
      "Error DELETE /api/firmas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar la firma.",
      },
      {
        status: 500,
      }
    );
  }
}