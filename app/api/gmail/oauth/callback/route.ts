import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return new NextResponse(
        `Autorización cancelada o rechazada: ${error}`,
        { status: 400 }
      );
    }

    if (!code) {
      return new NextResponse(
        "No se recibió el código de autorización.",
        { status: 400 }
      );
    }

    const redirectUri =
      "https://consultaconsulvenezbarranquilla.app/api/gmail/oauth/callback";

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return new NextResponse(
        `
        <html>
          <body>
            <h2>No se recibió refresh_token</h2>
            <p>Google no devolvió un refresh_token.</p>
            <p>Debemos volver a autorizar la aplicación.</p>
          </body>
        </html>
        `,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    console.log("GMAIL OAUTH AUTORIZADO CORRECTAMENTE");

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Gmail autorizado</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h2>Autorización de Gmail completada correctamente</h2>

          <p>
            Se obtuvo correctamente el <strong>refresh_token</strong>.
          </p>

          <p>
            <strong>IMPORTANTE:</strong> no envíes este token por WhatsApp,
            correo ni ChatGPT.
          </p>

          <p>
            Cópialo directamente a las variables de entorno de Vercel.
          </p>

          <textarea
            style="
              width: 100%;
              max-width: 900px;
              height: 120px;
              font-family: monospace;
              font-size: 14px;
            "
            readonly
          >${tokens.refresh_token}</textarea>

          <p style="margin-top: 25px;">
            Cuando lo hayas colocado en Vercel, podemos continuar con
            la integración automática del envío de recibos.
          </p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("ERROR CALLBACK OAUTH GMAIL:", error);

    return new NextResponse(
      `Error completando autorización: ${
        error?.message || "Error desconocido"
      }`,
      { status: 500 }
    );
  }
}