import { Resend } from "resend";
import { readFile } from "node:fs/promises";
import path from "node:path";

const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Consulado General de la República Bolivariana de Venezuela en Barranquilla <no-reply@consultaconsulvenezbarranquilla.app>";

// Evita que los datos variables se interpreten como HTML.
function escaparHtml(valor: string): string {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Falta RESEND_API_KEY.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const nombreSeguro = escaparHtml(nombre);
  const correlativoSeguro = escaparHtml(correlativo);

  const asunto =
    `Recibo de pago ${correlativo} - Consulado de Venezuela en Barranquilla`;

  // =====================================================
  // VERSIÓN TEXTO PLANO
  // =====================================================

  const cuerpoTexto = `
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

  // =====================================================
  // VERSIÓN HTML INSTITUCIONAL
  // =====================================================

  const cuerpoHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin:0;
  padding:30px 12px;
  background-color:#f3f5f7;
  font-family:Arial,Helvetica,sans-serif;
  color:#263238;
">

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="max-width:620px;margin:0 auto;"
  >
    <tr>
      <td>

        <!-- ENCABEZADO INSTITUCIONAL -->

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            background-color:#ffffff;
            border-radius:8px;
            overflow:hidden;
            border:1px solid #e5e7eb;
          "
        >

          <tr>
            <td style="
              height:5px;
              background-color:#cfaa46;
              font-size:0;
            ">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="
              padding:30px 25px 15px;
            ">

              <img
                src="cid:logo-consulado"
                alt="Logo del Consulado General de Venezuela"
                width="105"
                style="
                  display:block;
                  max-width:105px;
                  height:auto;
                  border:0;
                  margin:0 auto 18px;
                "
              />

              <div style="
                font-size:17px;
                font-weight:bold;
                color:#19385a;
                line-height:1.5;
                text-align:center;
              ">
                Consulado General de la República<br>
                Bolivariana de Venezuela<br>
                en Barranquilla
              </div>

              <div style="
                width:65px;
                height:2px;
                background-color:#cfaa46;
                margin:22px auto 0;
              "></div>

            </td>
          </tr>

          <!-- CUERPO DEL MENSAJE -->

          <tr>
            <td style="
              padding:15px 35px 35px;
              font-size:14px;
              line-height:1.8;
            ">

              <p>
                Estimado/a <strong>${nombreSeguro}</strong>:
              </p>

              <p>
                Adjunto encontrará el recibo correspondiente
                al pago realizado ante el Consulado General
                de la República Bolivariana de Venezuela
                en Barranquilla.
              </p>

              <!-- IDENTIFICACIÓN DEL RECIBO -->

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background-color:#f5f7fa;
                  border-left:3px solid #19385a;
                  margin:25px 0;
                "
              >
                <tr>
                  <td style="padding:15px 20px;">

                    <span style="
                      font-size:12px;
                      color:#64748b;
                    ">
                      NÚMERO DE RECIBO
                    </span>

                    <br>

                    <strong style="
                      font-size:19px;
                      color:#19385a;
                    ">
                      ${correlativoSeguro}
                    </strong>

                  </td>
                </tr>
              </table>

              <p>
                Este correo ha sido generado automáticamente
                por el sistema de Registro Consular.
              </p>

              <p style="color:#64748b;">
                Por favor, no responda a este correo.
              </p>

              <!-- VERIFICACIÓN -->

              <p>
                Puede verificar el estado o autenticidad
                de su documento mediante el siguiente enlace:
              </p>

              <p style="
                text-align:center;
                margin:25px 0;
              ">
                <a
                  href="https://consultaconsulvenezbarranquilla.app"
                  style="
                    display:inline-block;
                    background-color:#19385a;
                    color:#ffffff;
                    text-decoration:none;
                    padding:13px 22px;
                    border-radius:5px;
                    font-size:13px;
                    font-weight:bold;
                  "
                >
                  Consultar documento
                </a>
              </p>

              <p style="
                text-align:center;
                font-size:12px;
                overflow-wrap:anywhere;
              ">
                <a
                  href="https://consultaconsulvenezbarranquilla.app"
                  style="color:#19385a;"
                >
                  https://consultaconsulvenezbarranquilla.app
                </a>
              </p>

              <!-- DESPEDIDA -->

              <p style="margin-top:30px;">
                Atentamente,
              </p>

              <p style="
                color:#19385a;
                font-weight:bold;
                line-height:1.6;
              ">
                Consulado General de la República<br>
                Bolivariana de Venezuela en Barranquilla
              </p>

            </td>
          </tr>

          <!-- PIE DE PÁGINA -->

          <tr>
            <td style="
              background-color:#f5f7fa;
              border-top:1px solid #e5e7eb;
              padding:20px;
              text-align:center;
              font-size:11px;
              line-height:1.7;
              color:#64748b;
            ">

              Comunicación automática del sistema
              de Registro Consular.

              <br>

              Consulado General de la República
              Bolivariana de Venezuela en Barranquilla.

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  // =====================================================
  // PREPARAR PDF
  // =====================================================

  const pdfBuffer = Buffer.from(pdfBytes);

  const nombreArchivo =
    `RECIBO_${correlativo.replace(/\//g, "-")}.pdf`;

  // =====================================================
  // CARGAR LOGO DESDE PUBLIC
  // =====================================================

  const rutaLogo = path.join(
    process.cwd(),
    "public",
    "logo.png"
  );

  const logoBuffer = await readFile(rutaLogo);

  // =====================================================
  // ENVIAR POR RESEND
  // =====================================================

  const respuesta = await resend.emails.send({
    from: RESEND_FROM,

    to: [correo],

    subject: asunto,

    text: cuerpoTexto,

    html: cuerpoHtml,

    attachments: [
      {
        filename: nombreArchivo,
        content: pdfBuffer,
      },
      {
        filename: "logo.png",
        content: logoBuffer,
        contentId: "logo-consulado",
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