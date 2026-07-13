import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Spotify client ID or redirect URI not configured in server variables." },
      { status: 500 }
    );
  }

  const scope = "user-read-currently-playing user-read-recently-played";
  const state = Math.random().toString(36).substring(7); // simple state generation

  const spotifyAuthUrl = new URL("https://accounts.spotify.com/authorize");
  spotifyAuthUrl.searchParams.append("client_id", clientId);
  spotifyAuthUrl.searchParams.append("response_type", "code");
  spotifyAuthUrl.searchParams.append("redirect_uri", redirectUri);
  spotifyAuthUrl.searchParams.append("scope", scope);
  spotifyAuthUrl.searchParams.append("state", state);

  return NextResponse.redirect(spotifyAuthUrl.toString());
}
