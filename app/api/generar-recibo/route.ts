import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

import {
  obtenerCorrelativos,
  actualizarCorrelativo,
  guardarMovimientoCaja,
  guardarDetalleCaja,
  obtenerDocumentoPrincipal,
  obtenerActuaciones,
} from "@/lib/googleSheets";
import { buscarVisitaReciente, sincronizarTurnosAnalista } from "@/lib/turnero";

import { generarPdfRecibo } from "@/lib/generarPdfRecibo";
import { enviarReciboPorCorreo } from "@/lib/gmail";

import {
  fechaHoraActual,
  anioActual,
} from "@/lib/fechas";

type ActuacionRecibo = Record<string, unknown> & {
  codigo: string;
  actuacion: string;
  monto: number;
};

export async function POST(
  req: NextRequest
) {

  try {

    const body =
  await req.json();

const {
  ciudadano,
  actuaciones,
  totalUSD,
  titularesEspeciales,
} = body;

// ======================================================
// SESIÓN REAL DEL SERVIDOR
// ======================================================

const sesion = await obtenerSesion();

if (!sesion) {
  return NextResponse.json(
    {
      ok: false,
      mensaje: "Sesión no válida o expirada.",
    },
    {
      status: 401,
    }
  );
}

if (!tienePermiso(sesion.rol, "caja")) {
  return NextResponse.json(
    { ok: false, mensaje: "No tiene permiso para generar recibos de Caja." },
    { status: 403 }
  );
}

// El usuario real viene de la sesión,
// no de los datos enviados por el navegador.

const usuario = {
  usuario: sesion.usuario,
  nombre: sesion.nombre,
  rol: sesion.rol,
  caja: sesion.caja,
};

    // ======================================================
    // VALIDACIONES
    // ======================================================

    if (
      !Array.isArray(actuaciones) ||
      actuaciones.length === 0
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Debe existir al menos una actuación para generar el recibo.",
      });

    }

    // ======================================================
    // MÁXIMO 5 ACTUACIONES POR RECIBO
    // ======================================================

    if (
      actuaciones.length > 5
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Un recibo puede contener un máximo de 5 actuaciones.",
      });

    }

    if (!ciudadano) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "No se recibió la información del ciudadano.",
      });

    }

    const actuacionesRecibo = (actuaciones as unknown[]).map((entrada): ActuacionRecibo => {
      if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
        throw new Error("Una de las actuaciones no tiene un formato válido.");
      }
      const item = entrada as Record<string, unknown>;
      const codigo = String(item.codigo || "").trim();
      const actuacion = String(item.actuacion || "").trim();
      const monto = Number(item.monto);
      if (!codigo || !actuacion || !Number.isFinite(monto)) {
        throw new Error("Faltan el código, el nombre o el monto de una actuación.");
      }
      return { ...item, codigo, actuacion, monto };
    });
    
    console.log(
      "CIUDADANO RECIBIDO:"
    );

    console.dir(
      ciudadano,
      {
        depth: null,
      }
    );

    // ======================================================
    // DOCUMENTO PRINCIPAL
    // ======================================================

    const documentoImpreso =
      obtenerDocumentoPrincipal(
        ciudadano.cedula,
        ciudadano.pasaporte,
        ciudadano.nacionalidad
      );

    // ======================================================
    // AÑO
    // ======================================================

    const anio =
      anioActual();

    // ======================================================
    // OBTENER CORRELATIVO
    // ======================================================

    const correlativos =
      await obtenerCorrelativos();

    let fila = -1;
    let ultimo = 0;

    correlativos.forEach(
      (row, index) => {

        if (
          Number(row[0]) === anio
        ) {

          fila =
            index + 1;

          ultimo =
            Number(row[1]);

        }

      }
    );

    if (
      fila === -1
    ) {

      return NextResponse.json({
        ok: false,
        mensaje:
          "Año no encontrado en Correlativos",
      });

    }

    // ======================================================
    // NUEVO CORRELATIVO
    // ======================================================

    const nuevo =
      ultimo + 1;

    await actualizarCorrelativo(
      fila,
      nuevo
    );

    const correlativo =
      `${String(nuevo).padStart(
        4,
        "0"
      )}/${anio}`;

    // ======================================================
    // FECHA
    // ======================================================

    const fecha =
      fechaHoraActual();

    // ======================================================
    // TITULARES ESPECIALES
    // ======================================================
    //
    // Caja:
    // O = Titular Pasaporte NNA
    // P = Titular Apostilla NNA
    // Q = Titular Visa
    // R = Pasaporte Titular Visa
    // S = Observaciones
    // ======================================================

    let titularPasaporte = "";
    let titularApostilla = "";
    let titularVisa = "";
    let pasaporteVisa = "";
    let observaciones = "";

    if (
      Array.isArray(titularesEspeciales)
    ) {

      const listaPasaporte: string[] = [];
      const listaApostilla: string[] = [];
      const listaVisa: string[] = [];
      const listaPasaporteVisa: string[] = [];
      const listaObservaciones: string[] = [];

      for (
        const item of titularesEspeciales
      ) {

        const tipo =
          (item.tipo || "")
            .toString()
            .trim()
            .toUpperCase();

        const titular =
          (item.titular || "")
            .toString()
            .trim();

        const pasaporte =
          (item.pasaporte || "")
            .toString()
            .trim();

        const observacion =
          (item.observacion || "")
            .toString()
            .trim();

        // -----------------------------------------------
        // PASAPORTE NNA
        // -----------------------------------------------

        if (
          tipo === "PASAPORTE" &&
          titular
        ) {

          listaPasaporte.push(
            titular
          );

        }

        // -----------------------------------------------
        // APOSTILLA NNA
        // -----------------------------------------------

        if (
          tipo === "APOSTILLA" &&
          titular
        ) {

          listaApostilla.push(
            titular
          );

        }

        // -----------------------------------------------
        // VISA
        // -----------------------------------------------

        if (
          tipo === "VISA"
        ) {

          if (titular) {

            listaVisa.push(
              titular
            );

          }

          if (pasaporte) {

            listaPasaporteVisa.push(
              pasaporte
            );

          }

        }

        // -----------------------------------------------
        // OBSERVACIONES
        // -----------------------------------------------

        if (
          observacion
        ) {

          listaObservaciones.push(
            observacion
          );

        }

      }

      titularPasaporte =
        listaPasaporte.join("; ");

      titularApostilla =
        listaApostilla.join("; ");

      titularVisa =
        listaVisa.join("; ");

      pasaporteVisa =
        listaPasaporteVisa.join("; ");

      observaciones =
        listaObservaciones.join("; ");

    }

    console.log(
      "NACIONALIDAD A GUARDAR:",
      ciudadano.nacionalidad
    );

    // ======================================================
    // GUARDAR MOVIMIENTO DE CAJA
    // ======================================================

    await guardarMovimientoCaja([

      fecha,

      correlativo,

      documentoImpreso,

      ciudadano.nombreCompleto,

      ciudadano.correo,

      actuacionesRecibo
        .map(
          (a) =>
            a.actuacion
        )
        .join("; "),

      totalUSD,

      usuario.nombre,

      usuario.caja,

      "",

      "GENERADO",

      ciudadano.cedula || "",

      ciudadano.pasaporte || "",

      ciudadano.nacionalidad || "",

      titularPasaporte,

      titularApostilla,

      titularVisa,

      pasaporteVisa,

      observaciones,

    ]);

    // ======================================================
    // GUARDAR DETALLE DE CADA ACTUACIÓN
    // ======================================================

    console.log(
      "ACTUACIONES RECIBIDAS:",
      actuacionesRecibo
    );

    for (
      const actuacion of actuaciones
    ) {

      await guardarDetalleCaja([

        correlativo,

        actuacion.codigo,

        actuacion.actuacion,

        actuacion.monto,

      ]);

    }

    // La factura y todos sus detalles ya quedaron persistidos. Solo el
    // catálogo leído en servidor determina qué actuaciones pasan a Analistas.
    let turnosAnalista: string[] = [];
    let transferenciaTurnosPendiente = false;
    let errorTransferenciaTurnos = "";
    try {
      const [catalogoActuacionesRaw, visitaId] = await Promise.all([
        obtenerActuaciones(),
        buscarVisitaReciente(documentoImpreso, fecha),
      ]);
      const catalogoActuaciones: unknown[][] = catalogoActuacionesRaw;
      const paresCatalogo = catalogoActuaciones.slice(1)
        .filter((row: unknown[]) => String(row[3] || "").trim().toUpperCase() === "SI")
        .map((row: unknown[]) => [String(row[0] || "").trim(), String(row[1] || "").trim()] as [string, string]);
      const catalogo = new Map<string, string>(paresCatalogo);
      const candidatas = actuacionesRecibo.flatMap((actuacion, indice) => {
        const codigo = String(actuacion.codigo || "").trim();
        const nombre = catalogo.get(codigo);
        return nombre ? [{ codigo, nombre, indice }] : [];
      });
      const creados = await sincronizarTurnosAnalista({
        correlativo, nombre: String(ciudadano.nombreCompleto || ""), documento: String(documentoImpreso || ""),
        fecha, usuario: sesion.usuario, actuaciones: candidatas, visitaId,
      });
      turnosAnalista = creados.map((turno) => turno.id);
    } catch (errorTurnos) {
      transferenciaTurnosPendiente = true;
      errorTransferenciaTurnos = errorTurnos instanceof Error ? errorTurnos.message : "No se pudo completar la transferencia de atenciones.";
      console.error("RECIBO GUARDADO; transferencia a Analistas pendiente de recuperación:", errorTurnos);
    }

    // ======================================================
// ENVIAR RECIBO POR CORREO
// ======================================================
//
// REGLA ESPECIAL:
// La actuación CONST-RC-E (Constancia de Registro
// Consular Exenta) NO se envía por correo.
//
// Si el recibo contiene CONST-RC-E junto con otras
// actuaciones, tampoco se envía el correo.
//
// El resto de actuaciones sí se envían normalmente.
// ======================================================

let correoEnviado = false;
let errorCorreo = "";
let correoNoAplica = false;

// ------------------------------------------------------
// VERIFICAR SI EL RECIBO CONTIENE CONST-RC-E
// ------------------------------------------------------

const contieneConstanciaExenta =
  actuacionesRecibo.some(
    (actuacion) =>
      String(
        actuacion.codigo || ""
      )
        .trim()
        .toUpperCase() ===
      "CONST-RC-E"
  );

// ------------------------------------------------------
// SI CONTIENE CONST-RC-E, NO ENVIAR CORREO
// ------------------------------------------------------

if (
  contieneConstanciaExenta
) {

  correoNoAplica = true;

  console.log(
    "CORREO NO ENVIADO: el recibo contiene la actuación CONST-RC-E."
  );

} else {

  // ----------------------------------------------------
  // ENVÍO NORMAL POR CORREO
  // ----------------------------------------------------

  try {

    const correo =
      String(
        ciudadano.correo || ""
      ).trim();

    if (
      correo
    ) {

      const datosRecibo = {

        correlativo,

        fecha,

        documento:
          documentoImpreso,

        nombre:
          ciudadano.nombreCompleto,

        correo,

        usuario:
          usuario.nombre,

        actuaciones: actuacionesRecibo,

        totalUSD,

        titularesEspeciales,

      };

      // --------------------------------------------------
      // GENERAR PDF SOLO ORIGINAL USUARIO
      // --------------------------------------------------

      const pdfOriginal =
        await generarPdfRecibo({

          ...datosRecibo,

          soloOriginal: true,

        });

      // --------------------------------------------------
      // ENVIAR POR GMAIL
      // --------------------------------------------------

      await enviarReciboPorCorreo({

        destinatario:
          correo,

        nombre:
          ciudadano.nombreCompleto,

        correlativo,

        pdfBytes:
          pdfOriginal,

      });

      correoEnviado =
        true;

      console.log(
        "RECIBO ENVIADO POR CORREO:",
        correo
      );

    } else {

      errorCorreo =
        "El ciudadano no tiene correo electrónico registrado.";

      console.log(
        errorCorreo
      );

    }

  } catch (
    error: unknown
  ) {

    console.error(
      "ERROR ENVIANDO RECIBO POR CORREO:",
      error
    );

    errorCorreo = error instanceof Error
      ? error.message
      : "No fue posible enviar el recibo por correo electrónico.";

  }

}

    // ======================================================
    // RESPUESTA
    // ======================================================

    return NextResponse.json({

      ok: true,

      correlativo,

      fecha,

      documento:
        documentoImpreso,

      nombre:
        ciudadano.nombreCompleto,

      correo:
        ciudadano.correo,

      usuario:
        usuario.nombre,

      actuaciones: actuacionesRecibo,

      totalUSD,

      titularesEspeciales,

      correoEnviado,

      errorCorreo,

      correoNoAplica,

      totalTurnosAnalista: turnosAnalista.length,
      transferenciaTurnosPendiente,
      errorTransferenciaTurnos,

    });

  }

  catch (
    error: unknown
  ) {

    console.error(
      "ERROR GENERANDO RECIBO:",
      error
    );

    return NextResponse.json(

      {
        ok: false,

        error: error instanceof Error ? error.message : "No fue posible generar el recibo.",
      },

      {
        status: 500,
      }

    );

  }

}
