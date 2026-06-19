console.log(
  "ROUTE USUARIOS ADMIN CARGADA"
);

import { NextRequest, NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET() {

  try {

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "UsuariosCaja!A:F",
      });

    const rows =
      response.data.values || [];

    const usuarios =
      rows
        .slice(1)
        .map((row) => ({

          usuario:
            row[0] || "",

          nombre:
            row[2] || "",

          rol:
            row[3] || "",

          activo:
            row[4] || "NO",

          caja:
            row[5] || "",

        }));

    return NextResponse.json({
      ok: true,
      usuarios,
    });

  } catch (error: any) {

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}

export async function POST(
  req: NextRequest
) {

  try {

    const {
      usuario,
      passwordHash,
      nombre,
      rol,
    } = await req.json();

    const usuarioNormalizado =
      usuario
        .trim()
        .toLowerCase();

    if (
      !usuarioNormalizado ||
      !passwordHash?.trim() ||
      !nombre?.trim() ||
      !rol?.trim()
    ) {

      return NextResponse.json({
        ok: false,
        error:
          "Todos los campos son obligatorios",
      });

    }
const usuariosResponse =
  await sheets.spreadsheets.values.get({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,
    range:
      "UsuariosCaja!A:A",
  });

const usuariosExistentes =
  usuariosResponse.data.values || [];

const existe =
  usuariosExistentes.some(
    (row, index) =>
      index > 0 &&
      row[0]?.toLowerCase() ===
        usuarioNormalizado
  );

if (existe) {

  return NextResponse.json({
    ok: false,
    error:
      "El usuario ya existe",
  });

}
    await sheets.spreadsheets.values.append({
      spreadsheetId:
        MODULO_CAJA_SHEET_ID,

      range:
        "UsuariosCaja!A:F",

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [[
          usuarioNormalizado,
          passwordHash,
          nombre,
          rol,
          "SI",
          "",
        ]],
      },
    });

    return NextResponse.json({
      ok: true,
    });

  } catch (error: any) {

    console.error(
      "ERROR CREANDO USUARIO",
      error
    );

    return NextResponse.json({
      ok: false,
      error:
        error.message,
    });

  }

}
export async function PUT(
  req: NextRequest
) {

  try {

    const body =
  await req.json();

const {
  usuario,
  activo,
  nombre,
  rol,
  } = body;

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,

        range:
          "UsuariosCaja!A:F",
      });

    const rows =
      response.data.values || [];

    let fila = -1;

    rows.forEach(
      (
        row,
        index
      ) => {

        if (
          index > 0 &&
          row[0] === usuario
        ) {

          fila =
            index + 1;

        }

      }
    );

    if (
      fila === -1
    ) {

      return NextResponse.json({
        ok: false,
        error:
          "Usuario no encontrado",
      });

    }

    if (
  activo === "NO"
) {

  const adminsActivos =
    rows.filter(
      (
        row,
        index
      ) => {

        if (index === 0)
          return false;

        return (
          row[3] === "admin" &&
          row[4] === "SI"
        );

      }
    );

  const usuarioActual =
    rows.find(
      (
        row,
        index
      ) => {

        if (index === 0)
          return false;

        return (
          row[0] === usuario
        );

      }
    );

  if (
    usuarioActual &&
    usuarioActual[3] === "admin" &&
    adminsActivos.length === 1
  ) {

    return NextResponse.json({
      ok: false,
      error:
        "No puede desactivar el último administrador",
    });

  }

}
    if (
  activo !== undefined
) {

  await sheets.spreadsheets.values.update({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `UsuariosCaja!E${fila}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [[
        activo,
      ]],
    },
  });

} else {

  await sheets.spreadsheets.values.update({
    spreadsheetId:
      MODULO_CAJA_SHEET_ID,

    range:
      `UsuariosCaja!C${fila}:F${fila}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [[
        nombre,
        rol,
        "SI",
        "",
      ]],
    },
  });

}

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

