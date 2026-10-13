import JSZip from "jszip";
import { drive as driveSheets, MODULO_CAJA_SHEET_ID, REGISTRO_CONSULAR_SHEET_ID } from "@/lib/googleSheets";
import { subirRespaldoDrive } from "@/lib/googleDrive";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ARCHIVOS_A_RESPALDAR = [
  { id: MODULO_CAJA_SHEET_ID, nombre: "Modulo_de_caja" },
  { id: REGISTRO_CONSULAR_SHEET_ID, nombre: "registro_consular" },
] as const;

export async function crearRespaldosGoogleSheets(incluirCopiaLocal = false) {
  if (ARCHIVOS_A_RESPALDAR.some((archivo) => !archivo.id)) {
    throw new Error("Falta configurar el ID de una de las hojas de cálculo a respaldar.");
  }

  const marcaTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const exportaciones = await Promise.all(
    ARCHIVOS_A_RESPALDAR.map(async (archivo) => {
      const exportacion = await driveSheets.files.export(
      {
        fileId: archivo.id,
        mimeType: MIME_XLSX,
      },
      { responseType: "arraybuffer" }
      );
      return {
        nombre: archivo.nombre,
        contenido: Buffer.from(exportacion.data as ArrayBuffer),
      };
    })
  );

  const respaldos = await Promise.all(
    exportaciones.map(({ nombre, contenido }) =>
      subirRespaldoDrive(
        `Backup_${nombre}_${marcaTiempo}.xlsx`,
        contenido
      )
    )
  );

  return {
    respaldos,
    ...(incluirCopiaLocal
      ? {
          contenidoZip: await crearZip(exportaciones, marcaTiempo),
          nombreZip: `Backup_Sistema_Consular_${marcaTiempo}.zip`,
        }
      : {}),
  };
}

async function crearZip(
  archivos: Array<{ nombre: string; contenido: Buffer }>,
  marcaTiempo: string
) {
  const zip = new JSZip();
  for (const archivo of archivos) {
    zip.file(`Backup_${archivo.nombre}_${marcaTiempo}.xlsx`, archivo.contenido);
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
