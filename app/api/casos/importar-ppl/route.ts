import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { exigirPermiso } from "@/lib/autorizacion";
import { MODULOS } from "@/lib/modulos";
import { importarLoteCasosPpl, listarCasosConsularesSoloLectura } from "@/lib/casosConsulares";
import { leerImportacionPpl } from "@/lib/pplImport";
import { claveDocumentoIdentidad } from "@/lib/verificacionIdentidadImport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EstadoPplImportacion = {
  siguienteIndice: number;
  totalValidas: number;
  importados: number;
  actualizados: number;
  omitidos: number;
  usuario: string;
  completada: boolean;
  errores: Array<{ hoja: string; fila: number; error: string }>;
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
  if (acceso.sesion.rol !== "admin") return NextResponse.json({ ok: false, error: "Solo un administrador puede importar el listado PPL." }, { status: 403 });

  let redis: Redis | null = null;
  let llaveBloqueo = "";
  let tokenBloqueo = "";
  try {
    const form = await request.formData();
    const archivo = form.get("archivo");
    const accion = String(form.get("accion") ?? "");
    if (!(archivo instanceof File) || !archivo.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ ok: false, error: "Selecciona el archivo PPL en formato .xlsx." }, { status: 400 });
    }
    if (archivo.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "El archivo supera el límite de 5 MB." }, { status: 413 });
    if (accion !== "validar" && accion !== "importar") return NextResponse.json({ ok: false, error: "Indica si deseas validar o importar el archivo." }, { status: 400 });

    const lectura = await leerImportacionPpl(Buffer.from(await archivo.arrayBuffer()));
    if (accion === "validar") {
      const casos = (await listarCasosConsularesSoloLectura()).filter((caso) => caso.categoria === "Personas Privadas de Libertad");
      const porDocumento = new Map<string, typeof casos>();
      const porNui = new Map<string, typeof casos>();
      for (const caso of casos) {
        const documento = claveDocumentoIdentidad(caso.datos.cedula);
        const nui = claveDocumentoIdentidad(caso.datos.nui);
        if (documento) porDocumento.set(documento, [...(porDocumento.get(documento) ?? []), caso]);
        if (nui) porNui.set(nui, [...(porNui.get(nui) ?? []), caso]);
      }
      let posiblesActualizaciones = 0;
      let personasNuevas = 0;
      const conflictos: Array<{ hoja: string; fila: number; error: string }> = [];
      for (const registro of lectura.filasValidas) {
        const documento = claveDocumentoIdentidad(registro.cedula);
        const nui = claveDocumentoIdentidad(registro.nui);
        const porDoc = documento ? porDocumento.get(documento) ?? [] : [];
        const porNuiEncontrado = nui ? porNui.get(nui) ?? [] : [];
        const coincidencias = new Set([...porDoc, ...porNuiEncontrado].map((caso) => caso.id));
        if (porDoc.length > 1 || porNuiEncontrado.length > 1 || coincidencias.size > 1) {
          conflictos.push({ hoja: registro.hoja, fila: registro.fila, error: "Los identificadores coinciden con más de un caso PPL; requiere revisión manual." });
        } else if (coincidencias.size) posiblesActualizaciones += 1;
        else personasNuevas += 1;
      }
      const filasRevision = [...lectura.errores, ...lectura.duplicados, ...conflictos];
      return NextResponse.json({ ok: true, etapa: "validacion", hashArchivo: lectura.hashArchivo,
        resumenHojas: lectura.resumenHojas, filasValidas: lectura.filasValidas.length,
        filasRevision: filasRevision.length, filasDuplicadas: lectura.duplicados.length,
        personasNuevas, posiblesActualizaciones, errores: [...lectura.errores, ...lectura.duplicados, ...conflictos],
        aviso: "Las coincidencias se calculan por C.I.V. y NUI; nunca se agrupan personas por nombre." });
    }

    if (form.get("confirmar") !== "si") return NextResponse.json({ ok: false, error: "Confirma expresamente la importación después de revisar la simulación." }, { status: 400 });
    redis = redisImportacion();
    const hash = lectura.hashArchivo;
    llaveBloqueo = `registro-consular:casos:ppl-import:lock:${hash}`;
    tokenBloqueo = crypto.randomUUID();
    const tomado = await redis.set(llaveBloqueo, tokenBloqueo, { nx: true, ex: 120 });
    if (!tomado) return NextResponse.json({ ok: false, error: "Esta importación ya se está procesando. Intenta de nuevo en unos segundos." }, { status: 409 });

    const llaveEstado = `registro-consular:casos:ppl-import:job:${hash}`;
    const estado = await redis.get<EstadoPplImportacion>(llaveEstado) ?? {
      siguienteIndice: 0, totalValidas: lectura.filasValidas.length, importados: 0, actualizados: 0,
      omitidos: 0, usuario: acceso.sesion.usuario, completada: false,
      errores: [...lectura.errores, ...lectura.duplicados], actualizadaEl: new Date().toISOString(),
    };
    if (estado.totalValidas !== lectura.filasValidas.length) return NextResponse.json({ ok: false, error: "El estado guardado no coincide con el archivo seleccionado." }, { status: 409 });
    if (estado.completada) return NextResponse.json({ ok: true, etapa: "importacion", completa: true, estado });

    const lote = lectura.filasValidas.slice(estado.siguienteIndice, estado.siguienteIndice + 25);
    if (lote.length) {
      const resultado = await importarLoteCasosPpl(lote, acceso.sesion.usuario);
      estado.importados += resultado.importados;
      estado.actualizados += resultado.actualizados;
      estado.omitidos += resultado.omitidos;
      estado.errores.push(...resultado.errores);
      estado.siguienteIndice += lote.length;
    }
    estado.completada = estado.siguienteIndice >= lectura.filasValidas.length;
    estado.actualizadaEl = new Date().toISOString();
    await redis.set(llaveEstado, estado, { ex: 60 * 60 * 24 * 45 });
    return NextResponse.json({ ok: true, etapa: "importacion", completa: estado.completada, estado });
  } catch (error) {
    console.error("Error en importación PPL:", error instanceof Error ? error.message : "Error desconocido.");
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No fue posible procesar la importación." }, { status: 500 });
  } finally {
    if (redis && llaveBloqueo && tokenBloqueo) {
      try {
        await redis.eval('if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end', [llaveBloqueo], [tokenBloqueo]);
      } catch { /* El TTL libera el bloqueo si Redis no responde durante la limpieza. */ }
    }
  }
}
