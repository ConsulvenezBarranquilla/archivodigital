import fs from "node:fs";
import path from "node:path";

let logoCache: Buffer | undefined;

/** Returns the print-sized logo, loaded once per warm serverless instance. */
export function obtenerLogoRecibo(): Buffer {
  if (!logoCache) {
    logoCache = fs.readFileSync(path.join(process.cwd(), "public", "logo-recibo.png"));
  }
  return logoCache;
}
