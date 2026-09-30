import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  
  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inputUrl = searchParams.get("url") || searchParams.get("id");

  if (!inputUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const videoId = extractYouTubeId(inputUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL or ID" }, { status: 400 });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Pairfect-Mixtape-Bot/1.0" },
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        data: {
          videoId,
          title: data.title || "YouTube Track",
          artist: data.author_name || "Unknown Artist",
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        },
      });
    }
  } catch (e) {
    console.error("YouTube oEmbed fetch error:", e);
  }

  // Graceful fallback if oEmbed fails
  return NextResponse.json({
    success: true,
    data: {
      videoId,
      title: "YouTube Song",
      artist: "YouTube Music",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
  });
}
