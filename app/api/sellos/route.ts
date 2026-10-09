import { NextResponse } from "next/server";
import crypto from "crypto";

import { obtenerSesion } from "@/lib/auth";

import {
  obtenerSelloPorId,
  crearSello,
  actualizarSello,
  eliminarSello,
} from "@/lib/sellos";

import {
  subirSelloDrive,
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
    auth: oauth2Client,
  });

/*------------------------------------------
GET
OBTENER SELLOS
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

    if (
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para administrar sellos.",
        },
        {
          status: 403,
        }
      );
    }

    const { obtenerSellos } =
      await import("@/lib/sellos");

    const sellos =
      await obtenerSellos();

    return NextResponse.json({
      ok: true,
      sellos,
    });

  } catch (error) {

    console.error(
      "Error GET /api/sellos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener los sellos.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
POST
CREAR SELLO INSTITUCIONAL
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

    if (
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para administrar sellos.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const nombreSello =
      formData.get(
        "nombreSello"
      );

    const archivo =
      formData.get(
        "archivo"
      );

    if (
      typeof nombreSello !==
        "string" ||
      !nombreSello.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El nombre del sello es obligatorio.",
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
            "Debe seleccionar una imagen del sello.",
        },
        {
          status: 400,
        }
      );
    }

    const idSello =
      `SELLO-${crypto.randomUUID()}`;

    /*--------------------------------------
    SUBIR A DRIVE
    --------------------------------------*/

    const archivoDrive =
      await subirSelloDrive(
        archivo,
        idSello
      );

    try {

      const sello = {
        idSello,

        nombreSello:
          nombreSello.trim(),

        archivoSello:
          archivoDrive.nombre,

        archivoSelloDriveId:
          archivoDrive.id,

        activo:
          "SI",

        fechaCreacion:
          new Date().toISOString(),
      };

      await crearSello(
        sello
      );

      return NextResponse.json(
        {
          ok: true,
          sello,
        },
        {
          status: 201,
        }
      );

    } catch (errorSheets) {

      try {

        await drive.files.delete({
          fileId:
            archivoDrive.id,
        });

      } catch (errorDrive) {

        console.error(
          "No se pudo eliminar el sello huérfano de Drive:",
          errorDrive
        );
      }

      throw errorSheets;
    }

  } catch (error) {

    console.error(
      "Error POST /api/sellos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear el sello.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
PUT
ACTIVAR / DESACTIVAR SELLO
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
            "No tiene permisos para administrar sellos.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const idSello =
      body?.idSello;

    const activo =
      body?.activo;

    if (
      typeof idSello !==
        "string" ||
      !idSello.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El idSello es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      activo !== "SI" &&
      activo !== "NO"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El estado del sello debe ser SI o NO.",
        },
        {
          status: 400,
        }
      );
    }

    const sello =
      await obtenerSelloPorId(
        idSello
      );

    if (!sello) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró el sello.",
        },
        {
          status: 404,
        }
      );
    }

    const selloActualizado =
      await actualizarSello(
        idSello,
        {
          activo,
        }
      );

    return NextResponse.json({
      ok: true,
      sello:
        selloActualizado,
    });

  } catch (error) {

    console.error(
      "Error PUT /api/sellos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el sello.",
      },
      {
        status: 500,
      }
    );
  }
}

/*------------------------------------------
DELETE
ELIMINAR SELLO
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
            "No tiene permisos para administrar sellos.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const idSello =
      body?.idSello;

    if (
      typeof idSello !==
        "string" ||
      !idSello.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El idSello es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const sello =
      await obtenerSelloPorId(
        idSello
      );

    if (!sello) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró el sello.",
        },
        {
          status: 404,
        }
      );
    }

    await eliminarSello(
      idSello
    );

    if (
      sello.archivoSelloDriveId
    ) {

      try {

        await drive.files.delete({
          fileId:
            sello.archivoSelloDriveId,
        });

      } catch (errorDrive) {

        console.error(
          "El sello fue eliminado de Sheets pero no se pudo eliminar de Drive:",
          errorDrive
        );
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje:
        "Sello eliminado correctamente.",
    });

  } catch (error) {

    console.error(
      "Error DELETE /api/sellos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar el sello.",
      },
      {
        status: 500,
      }
    );
  }
}