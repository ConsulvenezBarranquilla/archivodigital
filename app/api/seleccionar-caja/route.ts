import { NextRequest, NextResponse } from "next/server";
import {
  obtenerSesion,
  actualizarCajaSesion,
} from "@/lib/auth";
import {
  reservarCaja,
  liberarCaja,
} from "@/lib/bloqueo-caja";

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La sesión no es válida o ha expirado.",
        },
        { status: 401 }
      );
    }

    if (
      sesion.rol !== "caja" &&
      sesion.rol !== "admin"
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Este usuario no puede seleccionar una caja.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const caja = String(
      body?.caja ?? ""
    ).trim();

    if (
      caja !== "Caja 1" &&
      caja !== "Caja 2"
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Caja no válida.",
        },
        { status: 400 }
      );
    }

    /*
     * ADMIN:
     *
     * Los administradores no participan en el
     * bloqueo exclusivo de las cajas.
     *
     * Pueden seleccionar Caja 1 o Caja 2 aunque
     * un usuario con rol caja ya esté trabajando
     * en ella.
     */
    if (sesion.rol === "admin") {
      const sesionActualizada =
        await actualizarCajaSesion(caja);

      if (!sesionActualizada) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "No fue posible actualizar la sesión.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        usuario:
          sesionActualizada.usuario,
        nombre:
          sesionActualizada.nombre,
        rol:
          sesionActualizada.rol,
        caja:
          sesionActualizada.caja,
      });
    }

    /*
     * CAJA:
     *
     * Los usuarios con rol caja sí necesitan
     * un sessionId para poder reservar la caja.
     */
    if (!sesion.sessionId) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La sesión no tiene un identificador válido.",
        },
        { status: 401 }
      );
    }

    /*
     * Si el usuario ya tiene reservada la misma
     * caja, no necesitamos crear otro bloqueo.
     */
    if (sesion.caja === caja) {
      return NextResponse.json({
        ok: true,
        usuario: sesion.usuario,
        nombre: sesion.nombre,
        rol: sesion.rol,
        caja,
      });
    }

    /*
     * Intentamos reservar la nueva caja.
     *
     * reservarCaja() utiliza Redis con NX, por lo
     * que solamente un usuario puede conseguir
     * el bloqueo cuando la caja está libre.
     */
    const reserva =
      await reservarCaja(
        caja,
        sesion.sessionId,
        sesion.usuario,
        sesion.nombre
      );

    if (!reserva.disponible) {
      const ocupante =
        reserva.bloqueoExistente;

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            ocupante
              ? `La ${caja} ya está siendo utilizada por ${ocupante.nombre} (usuario: ${ocupante.usuario}).`
              : `La ${caja} no está disponible en este momento.`,
        },
        { status: 409 }
      );
    }

    /*
     * Si el usuario tenía otra caja asignada,
     * la liberamos después de conseguir la nueva.
     *
     * De esta forma, si la nueva caja no está
     * disponible, el usuario conserva su caja actual.
     */
    if (sesion.caja) {
      await liberarCaja(
        sesion.caja,
        sesion.sessionId
      );
    }

    try {
      const sesionActualizada =
        await actualizarCajaSesion(caja);

      if (!sesionActualizada) {
        await liberarCaja(
          caja,
          sesion.sessionId
        );

        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "No fue posible actualizar la sesión.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        usuario:
          sesionActualizada.usuario,
        nombre:
          sesionActualizada.nombre,
        rol:
          sesionActualizada.rol,
        caja:
          sesionActualizada.caja,
      });
    } catch (error) {
      /*
       * Si ocurre un error al actualizar la sesión,
       * liberamos la reserva que acabamos de crear.
       */
      await liberarCaja(
        caja,
        sesion.sessionId
      );

      throw error;
    }
  } catch (error) {
    console.error(
      "Error seleccionando caja:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No fue posible seleccionar la caja.",
      },
      { status: 500 }
    );
  }
}