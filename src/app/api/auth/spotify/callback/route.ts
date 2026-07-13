import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = new URL(request.url).origin;
  const settingsUrl = `${baseUrl}/settings`;

  if (error) {
    console.error("Spotify OAuth error:", error);
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${settingsUrl}?error=no_code_provided`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Spotify client ID, secret, or redirect URI missing on server.");
    return NextResponse.redirect(`${settingsUrl}?error=missing_server_keys`);
  }

  try {
    // 1. Get logged-in user from Supabase cookie session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Supabase user session invalid during callback:", authError);
      return NextResponse.redirect(`${settingsUrl}?error=unauthorized`);
    }

    // 2. Exchange authorization code for Spotify refresh & access tokens
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Spotify token exchange failed:", errorText);
      return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const refresh_token = tokenData.refresh_token;

    if (!refresh_token) {
      console.error("Spotify token response missing refresh token:", tokenData);
      return NextResponse.redirect(`${settingsUrl}?error=no_refresh_token`);
    }

    // 3. Write refresh token to user_secrets securely via Admin client
    const adminSupabase = createAdminClient();
    
    const { error: dbSecretError } = await adminSupabase
      .from("user_secrets")
      .upsert({
        user_id: user.id,
        spotify_refresh_token: refresh_token,
      });

    if (dbSecretError) {
      console.error("Failed to store Spotify refresh token in database secrets:", dbSecretError);
      return NextResponse.redirect(`${settingsUrl}?error=secrets_db_write_failed`);
    }

    // 4. Update spotify_connected to true on public users table
    const { error: dbProfileError } = await adminSupabase
      .from("users")
      .update({ spotify_connected: true })
      .eq("id", user.id);

    if (dbProfileError) {
      console.error("Failed to update user profile spotify connection state:", dbProfileError);
      return NextResponse.redirect(`${settingsUrl}?error=profile_db_update_failed`);
    }

    return NextResponse.redirect(`${settingsUrl}?spotify=connected`);
  } catch (err: any) {
    console.error("Spotify callback unexpected error:", err);
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(err.message || "unexpected")}`);
  }
}
