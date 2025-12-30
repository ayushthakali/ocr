import { NextResponse } from "next/server";

export function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, //indentifies app to Google
    redirect_uri: "http://localhost:3000/api/auth/google/callback", //tells Google where to send the user after login
    response_type: "code", //requests an authorization code from Google
    scope: "openid email profile", //what data you want from Google openid → identity, email → useremail, profile → name, picture
    prompt: "consent", //forces consent screen
  });

  const googleAuthURL =
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

  return NextResponse.redirect(googleAuthURL);
}
