import { NextResponse } from "next/server";

import {
  sheets,
  MODULO_CAJA_SHEET_ID,
  REGISTRO_CONSULAR_SHEET_ID,
} from "@/lib/googleSheets";

import {
  hoyISO,
} from "@/lib/fechas";

import { obtenerSesion } from "@/lib/auth";

export async function GET(req: Request) {

  try {

    // ============================================
    // VALIDAR SESIÓN
    // ============================================

    const sesion =
      await obtenerSesion();

    if (!sesion) {

      return NextResponse.json(
        {
          ok: false,
          error:
            "Sesión no válida o expirada.",
        },
        {
          status: 401,
        }
      );

    }

    const cajaResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "Caja!A:M",
      });

    const detalleResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "DetalleCaja!A:D",
      });

    const gestionResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "GestionConsular!A:L",
      });

    const gestionRows =
      gestionResponse.data.values || [];

    const usuariosResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "UsuariosCaja!A:F",
      });

    const visitasResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          MODULO_CAJA_SHEET_ID,
        range:
          "BitacoraVisitas!A:G",
      });

    const registroResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId:
          REGISTRO_CONSULAR_SHEET_ID,
        range:
          "Respuestas de formulario 1!B:G",
      });

    const cajaRows =
      cajaResponse.data.values || [];

    const detalleRows =
      detalleResponse.data.values || [];

    const usuariosRows =
      usuariosResponse.data.values || [];

    const visitasRows =
      visitasResponse.data.values || [];

    const registroRows =
      registroResponse.data.values || [];

    const hoy =
      hoyISO();

    const url =
      new URL(req.url);

    const anioFiltro =
      url.searchParams.get("anio");

    const mesFiltro =
      url.searchParams.get("mes");

    const aniosDisponibles =
      new Set<string>();

    const mesesDisponibles =
      new Map<string, string>();

    const nombresMeses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const mesActual =
      new Date().getMonth() + 1;

    const anioActual =
      new Date().getFullYear();

    let recibosHoy = 0;
    let usdHoy = 0;
    let anuladosHoy = 0;

    let recibosMes = 0;
    let usdMes = 0;
    let anuladosMes = 0;
    let actuacionesMes = 0;

    let planillasHoy = 0;
    let planillasMes = 0;

    let actuacionesSGCHoy = 0;
    let actuacionesSGCMes = 0;

    let rentaSGCHoy = 0;
    let rentaSGCMes = 0;

    const planillasHoySet =
      new Set<string>();

    const planillasMesSet =
      new Set<string>();

    const recibosRentaHoy =
      new Set<string>();

    const recibosRentaMes =
      new Set<string>();

    let visitasHoy = 0;

    let visitasMes = 0;

    let visitasAcumuladas = 0;

    let ciudadanosRegistrados = 0;

    let venezolanos = 0;

    let extranjeros = 0;

    const ultimasVisitas: any[] = [];

    let caja1Recibos = 0;
    let caja1Usd = 0;

    let caja2Recibos = 0;
    let caja2Usd = 0;

    const ultimosMovimientos: any[] =
      [];

    cajaRows
      .slice(1)
      .forEach((row) => {

        const fecha =
          row[0] || "";

        const totalUsd =
          Number(
            row[6] || 0
          );

        const caja =
          row[8] || "";

        const estado =
          row[10] || "";

        const fechaSolo =
          fecha.substring(0, 10);

        const anio =
          Number(
            fechaSolo.substring(0, 4)
          );

        const mes =
          Number(
            fechaSolo.substring(5, 7)
          );

        if (
          fechaSolo === hoy
        ) {

          if (
            estado ===
            "ANULADO"
          ) {

            anuladosHoy++;

          }

          if (
            estado ===
            "GENERADO"
          ) {

            recibosHoy++;

            usdHoy +=
              totalUsd;

            if (
              caja ===
              "Caja 1"
            ) {

              caja1Recibos++;

              caja1Usd +=
                totalUsd;

            }

            if (
              caja ===
              "Caja 2"
            ) {

              caja2Recibos++;

              caja2Usd +=
                totalUsd;

            }

          }

        }

        if (
          mes === mesActual &&
          anio === anioActual
        ) {

          if (
            estado === "ANULADO"
          ) {

            anuladosMes++;

          }

          if (
            estado === "GENERADO"
          ) {

            recibosMes++;

            usdMes +=
              totalUsd;

            const actuacionesTexto =
              row[5] || "";

            actuacionesMes +=
              actuacionesTexto
                .split(";")
                .filter(
                  (x: string) =>
                    x.trim() !== ""
                ).length;

          }

        }

        const correlativo =
          row[1] || "";

        const primerDetalle =
          detalleRows
            .slice(1)
            .find(
              (d) =>
                d[0] === correlativo
            );

        const codigoActuacion =
          primerDetalle?.[1] || "";

        ultimosMovimientos.push({

          correlativo,

          nombre:
            row[3] || "",

          codigo:
            codigoActuacion,

          usd:
            totalUsd,

          caja,

          estado,

        });

      });

    gestionRows
      .slice(1)
      .forEach((row) => {

        const correlativo =
          row[0] || "";

        const planilla =
          row[3] || "";

        const fechaPlanilla =
          row[4] || "";

        const estado =
          (row[6] || "")
            .toString()
            .trim()
            .toUpperCase();

        if (
          estado !== "VINCULADO" ||
          !planilla
        ) {

          return;

        }

        const fechaSolo =
          fechaPlanilla.substring(0, 10);

        const anio =
          Number(
            fechaSolo.substring(0, 4)
          );

        const mes =
          Number(
            fechaSolo.substring(5, 7)
          );

        const caja =
          cajaRows
            .slice(1)
            .find(
              r => r[1] === correlativo
            );

        const usd =
          Number(
            caja?.[6] || 0
          );

        // Hoy
        if (
          fechaSolo === hoy
        ) {

          actuacionesSGCHoy++;

          if (
            !recibosRentaHoy.has(
              correlativo
            )
          ) {

            recibosRentaHoy.add(
              correlativo
            );

            rentaSGCHoy +=
              usd;

          }

          planillasHoySet.add(
            planilla
          );

        }

        // Mes actual
        if (
          mes === mesActual &&
          anio === anioActual
        ) {

          actuacionesSGCMes++;

          if (
            !recibosRentaMes.has(
              correlativo
            )
          ) {

            recibosRentaMes.add(
              correlativo
            );

            rentaSGCMes +=
              usd;

          }

          planillasMesSet.add(
            planilla
          );

        }

      });

    planillasHoy =
      planillasHoySet.size;

    planillasMes =
      planillasMesSet.size;

    const actuacionesMap =
      new Map<string, number>();

    detalleRows
      .slice(1)
      .forEach((detalle) => {

        const correlativo =
          detalle[0] || "";

        const recibo =
          cajaRows
            .slice(1)
            .find(
              r => r[1] === correlativo
            );

        if (!recibo)
          return;

        // No contabilizar actuaciones
        // de recibos anulados
        const estado =
          (recibo[10] || "")
            .toString()
            .trim()
            .toUpperCase();

        if (
          estado !== "GENERADO"
        ) {

          return;

        }

        const fecha =
          recibo[0] || "";

        const fechaSolo =
          fecha.substring(0, 10);

        const anio =
          fechaSolo.substring(0, 4);

        const mes =
          fechaSolo.substring(5, 7);

        aniosDisponibles.add(
          anio
        );

        if (
          !anioFiltro ||
          anio === anioFiltro
        ) {

          mesesDisponibles.set(
            mes,
            nombresMeses[
              Number(mes) - 1
            ]
          );

        }

        if (
          anioFiltro &&
          anio !== anioFiltro
        ) {

          return;

        }

        if (
          mesFiltro &&
          mes !== mesFiltro
        ) {

          return;

        }

        const actuacion =
          detalle[2] || "";

        if (!actuacion)
          return;

        actuacionesMap.set(
          actuacion,
          (
            actuacionesMap.get(
              actuacion
            ) || 0
          ) + 1
        );

      });

    const topActuaciones =
      Array.from(
        actuacionesMap.entries()
      )
        .map(
          ([nombre, cantidad]) => ({
            nombre,
            cantidad,
          })
        )
        .sort(
          (a, b) =>
            b.cantidad -
            a.cantidad
        )
        .slice(
          0,
          10
        );

    const anios =
      Array.from(
        aniosDisponibles
      )
        .sort(
          (a, b) =>
            b.localeCompare(a)
        );

    const meses =
      Array.from(
        mesesDisponibles.entries()
      )
        .sort(
          (a, b) =>
            b[0].localeCompare(
              a[0]
            )
        )
        .map(
          ([value, label]) => ({

            value,

            label,

          })
        );

    visitasRows
      .slice(1)
      .forEach((row) => {

        const fechaTexto =
          row[0] || "";

        if (!fechaTexto)
          return;

        const fechaSolo =
          fechaTexto.substring(0, 10);

        const mesVisita =
          Number(
            fechaSolo.substring(
              5,
              7
            )
          );

        const anioVisita =
          Number(
            fechaSolo.substring(
              0,
              4
            )
          );

        visitasAcumuladas++;

        if (
          fechaSolo ===
          hoy
        ) {

          visitasHoy++;

        }

        if (

          mesVisita ===
            mesActual &&

          anioVisita ===
            anioActual

        ) {

          visitasMes++;

        }

        ultimasVisitas.push({

          fecha:
            fechaTexto,

          documento:
            row[1] || "",

          nombre:
            row[4] || "",

          tipo:
            row[5] || "",

        });

      });

    ultimasVisitas.reverse();

    registroRows
      .slice(1)
      .forEach((row) => {

        const documento =
          row[0];

        if (!documento)
          return;

        ciudadanosRegistrados++;

        const nacionalidad =
          (
            row[5] || ""
          )
            .toString()
            .trim()
            .toUpperCase();

        if (
          nacionalidad ===
          "VENEZOLANO"
        ) {

          venezolanos++;

        } else {

          extranjeros++;

        }

      });

    const usuariosActivos =
      usuariosRows
        .slice(1)
        .filter(
          (row) =>
            row[4] ===
            "SI"
        ).length;

    ultimosMovimientos.reverse();

    return NextResponse.json({

      ok: true,

      recibosHoy,

      usdHoy,

      caja1: {

        recibos:
          caja1Recibos,

        usd:
          caja1Usd,

      },

      caja2: {

        recibos:
          caja2Recibos,

        usd:
          caja2Usd,

      },

      recibosMes,

      usdMes,

      rentaSGCHoy,

      rentaSGCMes,

      planillasHoy,

      planillasMes,

      actuacionesSGCHoy,

      actuacionesSGCMes,

      anuladosMes,

      actuacionesMes,

      topActuaciones,

      aniosDisponibles:
        anios,

      mesesDisponibles:
        meses,

      visitasHoy,

      visitasMes,

      visitasAcumuladas,

      ciudadanosRegistrados,

      venezolanos,

      extranjeros,

      ultimosMovimientos:
        ultimosMovimientos.slice(
          0,
          10
        ),

      ultimasVisitas:
        ultimasVisitas.slice(
          0,
          10
        ),

    });

  } catch (
    error: any
  ) {

    console.error(
      "Error generando dashboard:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          "No fue posible obtener los datos del dashboard.",
      },
      {
        status: 500,
      }
    );

  }

}