"use client";

import { useEffect, useRef, useState } from "react";

export type ElementoFirma = "firma" | "sello" | "qr" | "legal";

export interface UbicacionFirma {
  pagina: number;
  x: number;
  y: number;
}

export type PosicionesFirma = Record<ElementoFirma, UbicacionFirma | null>;

interface Props {
  url: string;
  iniciales: PosicionesFirma;
  incluirTextoLegal?: boolean;
  onCancelar: () => void;
  onConfirmar: (posiciones: PosicionesFirma) => void;
}

interface PdfDocument {
  numPages: number;
  getPage: (page: number) => Promise<any>;
}

interface PdfLoadingTask {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
}

const nombres: Record<ElementoFirma, string> = {
  firma: "Firma",
  sello: "Sello",
  qr: "QR de validación",
  legal: "Mensaje legal",
};

function PaginaPdf({
  documento,
  numero,
  posiciones,
  elementoActivo,
  incluirTextoLegal,
  onElegir,
}: {
  documento: PdfDocument;
  numero: number;
  posiciones: PosicionesFirma;
  elementoActivo: ElementoFirma;
  incluirTextoLegal: boolean;
  onElegir: (pagina: number, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const marcoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    let renderTask: { cancel: () => void } | undefined;

    async function renderizar() {
      const pagina = await documento.getPage(numero);
      if (cancelado || !canvasRef.current || !marcoRef.current) return;
      const anchoDisponible = Math.max(320, marcoRef.current.clientWidth - 28);
      const viewportBase = pagina.getViewport({ scale: 1 });
      const escala = Math.min(1.25, anchoDisponible / viewportBase.width);
      const viewport = pagina.getViewport({ scale: escala });
      const canvas = canvasRef.current;
      const contexto = canvas.getContext("2d");
      if (!contexto) return;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = pagina.render({ canvas, canvasContext: contexto, viewport });
      await (renderTask as any).promise;
    }

    void renderizar().catch((error) => {
      if (!cancelado) console.error("No se pudo dibujar una página del PDF:", error);
    });

    return () => {
      cancelado = true;
      renderTask?.cancel();
    };
  }, [documento, numero]);

  function elegir(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    onElegir(numero - 1, x, y);
  }

  return (
    <div ref={marcoRef} className="rounded-xl border border-slate-300 bg-slate-200 p-3">
      <div className="mb-2 text-sm font-bold text-slate-700">Página {numero}</div>
      <div
        className="relative mx-auto w-fit max-w-full cursor-crosshair overflow-hidden bg-white shadow-lg"
        onClick={elegir}
        aria-label={`Página ${numero}. Haz clic para ubicar ${nombres[elementoActivo]}.`}
      >
        <canvas ref={canvasRef} className="block max-w-full" />
        {(Object.keys(nombres) as ElementoFirma[]).filter((tipo) => tipo !== "legal" || incluirTextoLegal).map((tipo) => {
          const ubicacion = posiciones[tipo];
          if (!ubicacion || ubicacion.pagina !== numero - 1) return null;
          return (
            <div
              key={tipo}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-2 py-1 text-xs font-bold shadow ${tipo === "firma" ? "border-blue-700 bg-blue-100/90 text-blue-900" : tipo === "sello" ? "border-violet-700 bg-violet-100/90 text-violet-900" : "border-emerald-700 bg-emerald-100/90 text-emerald-900"}`}
              style={{ left: `${ubicacion.x * 100}%`, top: `${ubicacion.y * 100}%` }}
            >
              {nombres[tipo]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PdfColocacionEditor({ url, iniciales, onCancelar, onConfirmar, incluirTextoLegal = false }: Props) {
  const [documento, setDocumento] = useState<PdfDocument | null>(null);
  const [posiciones, setPosiciones] = useState<PosicionesFirma>(iniciales);
  const [elementoActivo, setElementoActivo] = useState<ElementoFirma>("firma");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    let tarea: PdfLoadingTask | null = null;
    setDocumento(null);
    setCargando(true);
    setError("");

    async function cargar() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (cancelado) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        tarea = pdfjs.getDocument({ url }) as unknown as PdfLoadingTask;
        const pdf = await tarea.promise;
        if (!cancelado) setDocumento(pdf);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof Error ? cause.message : "No se pudo abrir el PDF.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();
    return () => {
      cancelado = true;
      if (tarea) void tarea.destroy().catch(() => undefined);
    };
  }, [url]);

  function elegirUbicacion(pagina: number, x: number, y: number) {
    setPosiciones((anteriores) => ({ ...anteriores, [elementoActivo]: { pagina, x, y } }));
    const siguiente = elementoActivo === "firma" ? "sello" : elementoActivo === "sello" ? "qr" : elementoActivo === "qr" && incluirTextoLegal ? "legal" : "qr";
    setElementoActivo(siguiente);
  }

  const elementos = (Object.keys(nombres) as ElementoFirma[]).filter((tipo) => tipo !== "legal" || incluirTextoLegal);
  const faltantes = elementos.filter((tipo) => !posiciones[tipo]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-2 sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-ubicaciones" className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="titulo-ubicaciones" className="text-xl font-bold text-blue-950">Ubicar firma, sello y QR</h2>
              <p className="mt-1 text-sm text-slate-600">Elige un elemento y haz clic sobre la página donde debe aparecer. Puedes ubicar cada uno en una página diferente.</p>
            </div>
            <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100" aria-label="Cerrar">×</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {elementos.map((tipo) => (
              <button key={tipo} type="button" onClick={() => setElementoActivo(tipo)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${elementoActivo === tipo ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
                {nombres[tipo]}{posiciones[tipo] ? ` · página ${posiciones[tipo]!.pagina + 1}` : " · pendiente"}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4">
          {cargando && <p className="p-8 text-center text-slate-600">Cargando páginas del PDF…</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
          {documento && Array.from({ length: documento.numPages }, (_, indice) => (
            <div key={indice} className="mx-auto mb-5 max-w-4xl">
              <PaginaPdf documento={documento} numero={indice + 1} posiciones={posiciones} elementoActivo={elementoActivo} incluirTextoLegal={incluirTextoLegal} onElegir={elegirUbicacion} />
            </div>
          ))}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <p className="text-sm text-slate-600">{faltantes.length ? `Falta ubicar: ${faltantes.map((tipo) => nombres[tipo]).join(", ")}.` : "Las tres ubicaciones están listas. Puedes hacer clic en otro elemento para corregir su posición."}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancelar} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" onClick={() => onConfirmar(posiciones)} disabled={faltantes.length > 0 || cargando || Boolean(error)} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Usar estas ubicaciones</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
