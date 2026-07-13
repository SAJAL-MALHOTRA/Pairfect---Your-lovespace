import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export async function GET() {
  try {
    // 1. Get logged-in user from Supabase cookie session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 2. Fetch the user's Spotify refresh token from DB secrets
    const { data: secretData, error: secretErr } = await adminSupabase
      .from("user_secrets")
      .select("spotify_refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (secretErr || !secretData || !secretData.spotify_refresh_token) {
      return NextResponse.json({ currentlyPlaying: null, recentlyPlayed: [] });
    }

    const refreshToken = secretData.spotify_refresh_token;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Server keys for Spotify not configured" },
        { status: 500 }
      );
    }

    // 3. Request a fresh access token using the refresh token
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      // Self-heal: If token exchange fails (e.g. revoked token), disconnect the user
      console.warn("Spotify refresh token invalid or revoked. Clearing connection state.");
      await adminSupabase.from("user_secrets").delete().eq("user_id", user.id);
      await adminSupabase.from("users").update({ spotify_connected: false }).eq("id", user.id);
      return NextResponse.json({ currentlyPlaying: null, recentlyPlayed: [], error: "revoked" });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ currentlyPlaying: null, recentlyPlayed: [] });
    }

    // 4. Fetch Currently Playing Track
    let currentlyPlaying: Track | null = null;
    try {
      const currentResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (currentResponse.ok && currentResponse.status !== 204) {
        const currentData = await currentResponse.json();
        if (currentData && currentData.item) {
          const trackItem = currentData.item;
          currentlyPlaying = {
            id: trackItem.id,
            name: trackItem.name,
            artist: trackItem.artists.map((a: any) => a.name).join(", "),
            albumArt: trackItem.album?.images?.[0]?.url || "",
          };
        }
      }
    } catch (err) {
      console.error("Failed to load Spotify currently playing track:", err);
    }

    // 5. Fetch Recently Played Tracks
    let recentlyPlayed: Track[] = [];
    try {
      const recentResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=8", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        if (recentData && recentData.items) {
          recentlyPlayed = recentData.items.map((item: any) => {
            const trackItem = item.track;
            return {
              id: trackItem.id,
              name: trackItem.name,
              artist: trackItem.artists.map((a: any) => a.name).join(", "),
              albumArt: trackItem.album?.images?.[0]?.url || "",
            };
          });
        }
      }
    } catch (err) {
      console.error("Failed to load Spotify recently played history:", err);
    }

    // Remove duplicate track IDs from recently played (just to keep feed neat)
    const seen = new Set();
    const uniqueRecentlyPlayed = recentlyPlayed.filter((track) => {
      const duplicate = seen.has(track.id);
      seen.add(track.id);
      return !duplicate;
    });

    return NextResponse.json({
      currentlyPlaying,
      recentlyPlayed: uniqueRecentlyPlayed,
    });
  } catch (err: any) {
    console.error("Unexpected error in /api/spotify/tracks:", err);
    return NextResponse.json({ error: err.message || "unexpected" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
