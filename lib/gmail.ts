import { google } from "googleapis";

const GMAIL_FROM = "info.consulvenez@gmail.com";

function obtenerClienteGmail() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId) {
    throw new Error("Falta GMAIL_CLIENT_ID.");
  }

  if (!clientSecret) {
    throw new Error("Falta GMAIL_CLIENT_SECRET.");
  }

  if (!refreshToken) {
    throw new Error("Falta GMAIL_REFRESH_TOKEN.");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

function convertirBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function enviarReciboPorCorreo({
  destinatario,
  nombre,
  correlativo,
  pdfBytes,
}: {
  destinatario: string;
  nombre: string;
  correlativo: string;
  pdfBytes: Uint8Array;
}) {
  const correo = String(destinatario || "").trim();

  if (!correo) {
    throw new Error(
      "El ciudadano no tiene una dirección de correo electrónico."
    );
  }

  const auth = obtenerClienteGmail();

  const gmail = google.gmail({
    version: "v1",
    auth,
  });

  const asunto =
    `Recibo de pago ${correlativo} - Consulado de Venezuela en Barranquilla`;

  const cuerpo = `
Estimado/a ${nombre},

Adjunto encontrará el recibo correspondiente al pago realizado ante el Consulado General de la República Bolivariana de Venezuela en Barranquilla.

Recibo N°: ${correlativo}

Este correo ha sido generado automáticamente por el sistema de Registro Consular.

Atentamente,

Consulado General de la República Bolivariana de Venezuela en Barranquilla
info.consulvenez@gmail.com
`.trim();

  const pdfBuffer = Buffer.from(pdfBytes);
  const pdfBase64 = pdfBuffer.toString("base64");

  const nombreArchivo =
    `RECIBO_${correlativo.replace(/\//g, "-")}.pdf`;

  const boundary =
    "----=_RegistroConsular_" + Date.now();

  const mensaje = [
    `From: ${GMAIL_FROM}`,
    `To: ${correo}`,
    `Subject: ${asunto}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    cuerpo,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${nombreArchivo}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${nombreArchivo}"`,
    "",
    pdfBase64,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  const raw = convertirBase64Url(
    Buffer.from(mensaje, "utf8")
  );

  const respuesta = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });

  return {
    ok: true,
    messageId: respuesta.data.id || null,
    destinatario: correo,
  };
}