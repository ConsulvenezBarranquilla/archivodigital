import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import { importarLoteVerificacionesIdentidad, listarCasosConsularesSoloLectura } from "@/lib/casosConsulares";
import { claveDocumentoIdentidad, leerImportacionVerificacionIdentidad } from "@/lib/verificacionIdentidadImport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EstadoImportacion = {
  siguienteIndice: number;
  totalValidas: number;
  filasImportadas: number;
  filasOmitidas: number;
  personasNuevas: number;
  usuario: string;
  completada: boolean;
  erroresRevision: number;
  actualizadaEl: string;
};

function redisImportacion() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Falta configurar Redis para registrar el progreso de importación.");
  return new Redis({ url, token });
}

export async function POST(request: NextRequest) {
  const acceso = await exigirPermiso(MODULOS.CASOS);
  if (acceso.respuesta) return acceso.respuesta;
  if (acceso.sesion.rol !== "admin") return NextResponse.json({ ok: false, error: "Solo un administrador puede importar el histórico." }, { status: 403 });

  let redis: Redis | null = null;
  let llaveBloqueo = "";
  let tokenBloqueo = "";
  try {
    const form = await request.formData();
    const archivo = form.get("archivo");
    const accion = String(form.get("accion") ?? "");
    if (!(archivo instanceof File) || !archivo.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ ok: false, error: "Selecciona el archivo histórico en formato .xlsx." }, { status: 400 });
    }
    if (archivo.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "El archivo supera el límite de 5 MB." }, { status: 413 });
    if (accion !== "validar" && accion !== "importar") return NextResponse.json({ ok: false, error: "Indica si deseas validar o importar el archivo." }, { status: 400 });

    const lectura = await leerImportacionVerificacionIdentidad(Buffer.from(await archivo.arrayBuffer()));
    if (accion === "validar") {
      const casos = await listarCasosConsularesSoloLectura();
      const documentosExistentes = new Set(casos
        .filter((caso) => caso.categoria === "Verificación de Identidad")
        .map((caso) => claveDocumentoIdentidad(caso.datos.cedula ?? caso.datos.numeroDocumento)).filter(Boolean));
      const gruposPersonas = new Set(lectura.filasValidas.map((registro) => {
        const documento = claveDocumentoIdentidad(registro.numeroDocumento);
        return documento ? `DOC:${documento}` : `SIN-DOC:${registro.idImportacion}`;
      }));
      const docsConCoincidencia = new Set(lectura.filasValidas
        .map((registro) => claveDocumentoIdentidad(registro.numeroDocumento))
        .filter((documento) => documento && documentosExistentes.has(documento)));
      return NextResponse.json({ ok: true, etapa: "validacion", hashArchivo: lectura.hashArchivo,
        resumenHojas: lectura.resumenHojas, filasValidas: lectura.filasValidas.length,
        filasRevision: lectura.errores.length, errores: lectura.errores,
        fechasVaciadas: lectura.fechasVaciadas,
        personasEnArchivo: gruposPersonas.size, coincidenciasExistentes: docsConCoincidencia.size,
        posiblesDuplicadosExactos: lectura.duplicadosExactosPosibles,
        aviso: "Las filas idénticas posibles se conservan; no se eliminan automáticamente." });
    }

    if (form.get("confirmar") !== "si") return NextResponse.json({ ok: false, error: "Confirma expresamente la importación después de revisar la simulación." }, { status: 400 });
    redis = redisImportacion();
    const hash = lectura.hashArchivo;
    llaveBloqueo = `registro-consular:casos:verificacion-import:lock:${hash}`;
    tokenBloqueo = crypto.randomUUID();
    const tomado = await redis.set(llaveBloqueo, tokenBloqueo, { nx: true, ex: 120 });
    if (!tomado) return NextResponse.json({ ok: false, error: "Esta importación ya se está procesando. Intenta de nuevo en unos segundos." }, { status: 409 });

    const llaveEstado = `registro-consular:casos:verificacion-import:job:${hash}`;
    const estado = await redis.get<EstadoImportacion>(llaveEstado) ?? {
      siguienteIndice: 0, totalValidas: lectura.filasValidas.length, filasImportadas: 0,
      filasOmitidas: 0, personasNuevas: 0, usuario: acceso.sesion.usuario,
      completada: false, erroresRevision: lectura.errores.length, actualizadaEl: new Date().toISOString(),
    };
    if (estado.totalValidas !== lectura.filasValidas.length) return NextResponse.json({ ok: false, error: "El estado guardado no coincide con el archivo seleccionado." }, { status: 409 });
    if (estado.completada) return NextResponse.json({ ok: true, etapa: "importacion", completa: true, hashArchivo: hash, estado });

    const lote = lectura.filasValidas.slice(estado.siguienteIndice, estado.siguienteIndice + 50);
    if (lote.length) {
      const resultado = await importarLoteVerificacionesIdentidad(lote, acceso.sesion.usuario);
      estado.filasImportadas += resultado.importadas;
      estado.filasOmitidas += resultado.omitidas;
      estado.personasNuevas += resultado.personasNuevas;
      estado.siguienteIndice += lote.length;
    }
    estado.completada = estado.siguienteIndice >= lectura.filasValidas.length;
    estado.actualizadaEl = new Date().toISOString();
    await redis.set(llaveEstado, estado, { ex: 60 * 60 * 24 * 45 });
    return NextResponse.json({ ok: true, etapa: "importacion", completa: estado.completada,
      hashArchivo: hash, estado, errores: lectura.errores });
  } catch (error) {
    console.error("Error en importación del histórico de identidad:", error instanceof Error ? error.message : "Error desconocido.");
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No fue posible procesar la importación." }, { status: 500 });
  } finally {
    if (redis && llaveBloqueo && tokenBloqueo) {
      try {
        await redis.eval('if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end', [llaveBloqueo], [tokenBloqueo]);
      } catch { /* El TTL libera el bloqueo si Redis no responde durante la limpieza. */ }
    }
  }
}
