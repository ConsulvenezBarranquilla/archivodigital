import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obtenerMovimientoManualPorId,
  actualizarMovimientoManual,
  eliminarMovimientoManual,
} from "@/lib/services/LibroDiario/libroDiarioService";

interface Params {

  params: Promise<{
    id: string;
  }>;

}

// ======================================================
// OBTENER MOVIMIENTO MANUAL
// ======================================================

export async function GET(

  request: NextRequest,

  { params }: Params

) {

  try {

    const { id } =
      await params;

    if (!id?.trim()) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "ID del movimiento requerido.",
        },

        {
          status: 400,
        }

      );

    }

    const movimiento =
      await obtenerMovimientoManualPorId(
        id
      );

    if (!movimiento) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "Movimiento manual no encontrado.",
        },

        {
          status: 404,
        }

      );

    }

    return NextResponse.json({

      ok: true,

      movimiento,

    });

  }

  catch (error: any) {

    console.error(
      "Error obteniendo movimiento manual:",
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

// ======================================================
// EDITAR MOVIMIENTO MANUAL
// ======================================================

export async function PUT(

  request: NextRequest,

  { params }: Params

) {

  try {

    const { id } =
      await params;

    if (!id?.trim()) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "ID del movimiento requerido.",
        },

        {
          status: 400,
        }

      );

    }

    const body =
      await request.json();

    const {

      fecha,

      tipoMovimiento,

      referencia,

      concepto,

      monto,

    } = body;

    // ==================================================
    // VALIDAR FECHA
    // ==================================================

    if (!fecha) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "La fecha es obligatoria.",
        },

        {
          status: 400,
        }

      );

    }

    // ==================================================
    // VALIDAR TIPO DE MOVIMIENTO
    // ==================================================

    if (
      !tipoMovimiento ||
      !tipoMovimiento
        .toString()
        .trim()
    ) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "El tipo de movimiento es obligatorio.",
        },

        {
          status: 400,
        }

      );

    }

    // ==================================================
    // VALIDAR CONCEPTO
    // ==================================================

    if (
      !concepto ||
      !concepto
        .toString()
        .trim()
    ) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "El concepto es obligatorio.",
        },

        {
          status: 400,
        }

      );

    }

    // ==================================================
    // VALIDAR MONTO
    // ==================================================

    const montoNumerico =
      Number(monto);

    if (
      !Number.isFinite(
        montoNumerico
      ) ||
      montoNumerico <= 0
    ) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "El monto debe ser mayor que cero.",
        },

        {
          status: 400,
        }

      );

    }

    // ==================================================
    // COMPROBAR QUE EXISTE
    // ==================================================

    const movimiento =
      await obtenerMovimientoManualPorId(
        id
      );

    if (!movimiento) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "Movimiento manual no encontrado. Los movimientos históricos sin ID no pueden editarse todavía.",
        },

        {
          status: 404,
        }

      );

    }

    // ==================================================
    // ACTUALIZAR
    // ==================================================

    await actualizarMovimientoManual(

      id,

      {

        id,

        fecha:
          fecha
            .toString()
            .trim(),

        tipoMovimiento:
          tipoMovimiento
            .toString()
            .trim(),

        referencia:
          (referencia ?? "")
            .toString()
            .trim(),

        concepto:
          concepto
            .toString()
            .trim(),

        monto:
          montoNumerico,

      }

    );

    return NextResponse.json({

      ok: true,

      mensaje:
        "Movimiento manual actualizado correctamente.",

    });

  }

  catch (error: any) {

    console.error(
      "Error actualizando movimiento manual:",
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

// ======================================================
// ELIMINAR MOVIMIENTO MANUAL
// ======================================================

export async function DELETE(

  request: NextRequest,

  { params }: Params

) {

  try {

    const { id } =
      await params;

    if (!id?.trim()) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "ID del movimiento requerido.",
        },

        {
          status: 400,
        }

      );

    }

    // ==================================================
    // COMPROBAR QUE EXISTE
    // ==================================================

    const movimiento =
      await obtenerMovimientoManualPorId(
        id
      );

    if (!movimiento) {

      return NextResponse.json(

        {
          ok: false,
          error:
            "Movimiento manual no encontrado. Los movimientos históricos sin ID no pueden eliminarse todavía.",
        },

        {
          status: 404,
        }

      );

    }

    // ==================================================
    // ELIMINAR
    // ==================================================

    await eliminarMovimientoManual(
      id
    );

    return NextResponse.json({

      ok: true,

      mensaje:
        "Movimiento manual eliminado correctamente.",

    });

  }

  catch (error: any) {

    console.error(
      "Error eliminando movimiento manual:",
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