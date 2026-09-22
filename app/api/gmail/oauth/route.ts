import { NextResponse } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";

export async function GET() {

  try {

    const clientId =
      process.env.GMAIL_CLIENT_ID;

    if (!clientId) {

      return new NextResponse(
        "Falta GMAIL_CLIENT_ID en las variables de entorno.",
        {
          status: 500,
        }
      );

    }

    const redirectUri =
      "https://consultaconsulvenezbarranquilla.app/api/gmail/oauth/callback";

    const oauth2Client =
      new google.auth.OAuth2(
        clientId,
        process.env.GMAIL_CLIENT_SECRET,
        redirectUri
      );

    const state =
      crypto.randomBytes(32).toString("hex");

    const authorizationUrl =
      oauth2Client.generateAuthUrl({

        access_type: "offline",

        scope: [
          "https://www.googleapis.com/auth/gmail.send",
        ],

        include_granted_scopes: true,

        prompt: "consent",

        state,

        login_hint:
          "info.consulvenez@gmail.com",

      });

    return NextResponse.redirect(
      authorizationUrl
    );

  } catch (error: any) {

    console.error(
      "ERROR INICIANDO OAUTH GMAIL:",
      error
    );

    return new NextResponse(
      "Error iniciando autorización de Gmail.",
      {
        status: 500,
      }
    );

  }

}