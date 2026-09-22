import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(
  request: NextRequest
) {

  try {

    const { searchParams } =
      new URL(request.url);

    const code =
      searchParams.get("code");

    const error =
      searchParams.get("error");

    if (error) {

      return new NextResponse(
        `Autorización cancelada o rechazada: ${error}`,
        {
          status: 400,
        }
      );

    }

    if (!code) {

      return new NextResponse(
        "No se recibió el código de autorización.",
        {
          status: 400,
        }
      );

    }

    const redirectUri =
      "https://consultaconsulvenezbarranquilla.app/api/gmail/oauth/callback";

    const oauth2Client =
      new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        redirectUri
      );

    const { tokens } =
      await oauth2Client.getToken(
        code
      );

    if (!tokens.refresh_token) {

      return new NextResponse(
        "Google no devolvió refresh_token. Debemos volver a autorizar la aplicación.",
        {
          status: 500,
        }
      );

    }

    /*
     * TEMPORALMENTE NO MOSTRAMOS EL TOKEN.
     *
     * En el siguiente paso lo almacenaremos
     * de forma segura en Vercel.
     */

    return new NextResponse(
      "Autorización de Gmail completada correctamente. No cierres todavía esta configuración.",
      {
        status: 200,
      }
    );

  } catch (error: any) {

    console.error(
      "ERROR CALLBACK OAUTH GMAIL:",
      error
    );

    return new NextResponse(
      `Error completando autorización: ${
        error?.message ||
        "Error desconocido"
      }`,
      {
        status: 500,
      }
    );

  }

}