import { NextResponse } from "next/server";

const CURATED_PLAYLISTS = [
  { id: "37i9dQZF1DX4sWSpwq3LiO", mood: "Cozy", label: "Cozy Coffee" },
  { id: "37i9dQZF1DXcBWIGoYBM5M", mood: "Cozy", label: "Morning Motivation" },
  { id: "37i9dQZF1DX4E3UdUs7fUx", mood: "Romantic", label: "Romantic Evening" },
  { id: "37i9dQZF1DWSJHnPb1f0X3", mood: "Romantic", label: "Love Songs" },
  { id: "37i9dQZF1DWZeKCadgRdKQ", mood: "Focus", label: "Deep Focus" },
  { id: "37i9dQZF1DX8NTLI2TtZa6", mood: "Focus", label: "Brain Food" },
  { id: "37i9dQZF1DX9uKNf5jGX6m", mood: "Chill", label: "Chill Vibes" },
];

// Simple in-memory cache
let cachedPlaylists: any[] | null = null;
let cacheTime = 0;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error("Failed to authenticate with Spotify");
  }

  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  const now = Date.now();
  // Cache for 1 hour (3,600,000 milliseconds)
  if (cachedPlaylists && now - cacheTime < 3600000) {
    return NextResponse.json({ playlists: cachedPlaylists });
  }

  try {
    const token = await getSpotifyToken();
    const playlists = [];

    for (const item of CURATED_PLAYLISTS) {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${item.id}?fields=name,description,images,external_urls,tracks.total`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch Spotify playlist: ${item.id}`);
        continue;
      }

      const data = await res.json();
      playlists.push({
        id: item.id,
        name: item.label,
        description: data.description || "",
        imageUrl: data.images?.[0]?.url || "",
        spotifyUrl: data.external_urls?.spotify || `https://open.spotify.com/playlist/${item.id}`,
        trackCount: data.tracks?.total || 0,
        mood: item.mood,
      });
    }

    if (playlists.length === 0) {
      throw new Error("No playlists could be resolved from Spotify API");
    }

    cachedPlaylists = playlists;
    cacheTime = now;

    return NextResponse.json({ playlists });
  } catch (error: any) {
    console.error("Spotify API error in route:", error);
    // Return empty playlists and an error code to let client render fallback content
    return NextResponse.json({
      error: error.message || "Spotify API unavailable",
      playlists: [],
    });
  }
}
