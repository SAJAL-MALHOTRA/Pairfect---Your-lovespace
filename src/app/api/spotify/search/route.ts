import { NextResponse } from "next/server";

export interface UnifiedTrackResult {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  spotifyUrl: string;
}

let cachedSpotifyToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyAccessToken(): Promise<{ token: string | null; errorReason?: string }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === "your_spotify_client_id" || clientSecret === "your_spotify_client_secret") {
    const reason = `[Spotify Auth Warning] SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing or set to placeholder in .env.local. Please configure valid Spotify Developer App credentials.`;
    console.warn(reason);
    return { token: null, errorReason: reason };
  }

  if (cachedSpotifyToken && cachedSpotifyToken.expiresAt > Date.now()) {
    return { token: cachedSpotifyToken.token };
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const errBody = await res.text();
      const reason = `[Spotify Auth Failed] HTTP ${res.status} ${res.statusText} - Body: ${errBody}`;
      console.error(reason);
      return { token: null, errorReason: reason };
    }

    const data = await res.json();
    if (data.access_token) {
      cachedSpotifyToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      };
      return { token: data.access_token };
    } else {
      const reason = `[Spotify Auth Failed] No access_token found in response payload`;
      console.error(reason);
      return { token: null, errorReason: reason };
    }
  } catch (e: any) {
    const reason = `[Spotify Auth Exception] ${e.message || e}`;
    console.error(reason);
    return { token: null, errorReason: reason };
  }
}

async function searchFallback(query: string): Promise<UnifiedTrackResult[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results || []).map((item: any) => {
      const trackName = item.trackName || item.collectionName || "Unknown Track";
      const artistName = item.artistName || "Unknown Artist";
      return {
        id: String(item.trackId || Math.random()),
        name: trackName,
        artist: artistName,
        albumArt: (item.artworkUrl100 || item.artworkUrl60 || "").replace("100x100bb", "300x300bb"),
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${trackName} ${artistName}`)}`,
      };
    });
  } catch (e) {
    console.error("[Spotify Search Fallback] iTunes search error:", e);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ success: true, tracks: [] });
    }

    const { token: accessToken, errorReason } = await getSpotifyAccessToken();

    if (accessToken) {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const tracks: UnifiedTrackResult[] = (data.tracks?.items || []).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: (track.artists || []).map((a: any) => a.name).join(", "),
          albumArt: track.album?.images?.[0]?.url || "",
          spotifyUrl: `https://open.spotify.com/track/${track.id}`,
        }));

        return NextResponse.json({ success: true, tracks, source: "spotify" });
      } else {
        const errText = await res.text();
        console.error(`[Spotify API Search Failed] HTTP ${res.status}: ${errText}`);
      }
    }

    // Fallback search mechanism when Spotify API keys are not configured or request fails
    const fallbackTracks = await searchFallback(query);
    return NextResponse.json({
      success: true,
      tracks: fallbackTracks,
      source: "fallback",
      authDiagnostic: errorReason || "Spotify API search request was non-OK",
    });
  } catch (err: any) {
    console.error("[Spotify Search API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to search tracks", tracks: [] }, { status: 500 });
  }
}
