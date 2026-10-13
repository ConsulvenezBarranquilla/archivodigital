import { NextResponse } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";

export async function GET() {

  try {

    if (process.env.NODE_ENV !== "development") {
      return new NextResponse("Este flujo OAuth solo está disponible en desarrollo local.", {
        status: 403,
      });
    }

    const clientId =
      process.env.GOOGLE_DRIVE_CLIENT_ID;

    if (!clientId) {

      return new NextResponse(
        "Falta GOOGLE_DRIVE_CLIENT_ID en las variables de entorno.",
        {
          status: 500,
        }
      );

    }

    const redirectUri =
  "http://localhost:3000/api/drive/oauth/callback";

    const oauth2Client =
      new google.auth.OAuth2(
        clientId,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        redirectUri
      );

    const state =
      crypto.randomBytes(32).toString("hex");

    const authorizationUrl =
      oauth2Client.generateAuthUrl({

        access_type: "offline",

        scope: [
  "https://www.googleapis.com/auth/drive.file",
],

        include_granted_scopes: true,

        prompt: "consent",

        state,

        login_hint:
          "info.consulvenez@gmail.com",

      });

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set("drive_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/api/drive/oauth/callback",
      maxAge: 600,
    });

    return response;

  } catch (error: any) {

    console.error("ERROR INICIANDO OAUTH DRIVE");

    return new NextResponse(
      "Error iniciando autorización de Google Drive.",
      {
        status: 500,
      }
    );

  }

}
