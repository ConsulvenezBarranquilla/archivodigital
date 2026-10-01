import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Consulado General de la República Bolivariana de Venezuela en Barranquilla <no-reply@consultaconsulvenezbarranquilla.app>";

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

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Falta RESEND_API_KEY.");
  }

  const asunto =
    `Recibo de pago ${correlativo} - Consulado de Venezuela en Barranquilla`;

  const cuerpo = `
Estimado/a ${nombre},

Adjunto encontrará el recibo correspondiente al pago realizado ante el Consulado General de la República Bolivariana de Venezuela en Barranquilla.

Recibo N°: ${correlativo}

Este correo ha sido generado automáticamente por el sistema de Registro Consular.

Por favor, no responda a este correo.

Puede verificar el estado o autenticidad de su documento mediante el siguiente enlace:

https://consultaconsulvenezbarranquilla.app

Atentamente,

Consulado General de la República Bolivariana de Venezuela en Barranquilla
`.trim();

  const pdfBuffer = Buffer.from(pdfBytes);

  const nombreArchivo =
    `RECIBO_${correlativo.replace(/\//g, "-")}.pdf`;

  const respuesta = await resend.emails.send({
    from: RESEND_FROM,
    to: [correo],
    subject: asunto,
    text: cuerpo,
    attachments: [
      {
        filename: nombreArchivo,
        content: pdfBuffer,
      },
    ],
  });

  if (respuesta.error) {
    console.error(
      "Error enviando correo con Resend:",
      respuesta.error
    );

    throw new Error(
      respuesta.error.message ||
        "No fue posible enviar el correo."
    );
  }

  console.log(
    "Correo enviado correctamente con Resend:",
    {
      messageId: respuesta.data?.id,
      destinatario: correo,
      correlativo,
    }
  );

  return {
    ok: true,
    messageId: respuesta.data?.id || null,
    destinatario: correo,
  };
}