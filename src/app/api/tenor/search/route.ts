import { NextResponse } from "next/server";

export interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
}

// High-quality, warm, relationship-tailored GIF fallbacks
const CURATED_GIFS: GifResult[] = [
  {
    id: "curated-hug-1",
    title: "Warm Hug",
    url: "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
    previewUrl: "https://media.giphy.com/media/od5H3PmEG5EVq/200.gif",
  },
  {
    id: "curated-love-1",
    title: "Heart Eyes",
    url: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/200.gif",
  },
  {
    id: "curated-popcorn-1",
    title: "Eating Popcorn",
    url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif",
    previewUrl: "https://media.giphy.com/media/gl0mkIZOW6Nwc/200.gif",
  },
  {
    id: "curated-cheers-1",
    title: "Cheers & Toast",
    url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif",
    previewUrl: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/200.gif",
  },
  {
    id: "curated-laugh-1",
    title: "Laughing Out Loud",
    url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
    previewUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/200.gif",
  },
  {
    id: "curated-kiss-1",
    title: "Blowing Kisses",
    url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
    previewUrl: "https://media.giphy.com/media/MDJ9IbxxvDUQM/200.gif",
  },
  {
    id: "curated-cry-1",
    title: "Happy Tears",
    url: "https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif",
    previewUrl: "https://media.giphy.com/media/L95W4wv8nnb9K/200.gif",
  },
  {
    id: "curated-cat-cuddle",
    title: "Cute Cuddle",
    url: "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/200.gif",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim() || "love cute";

    const tenorKey = process.env.TENOR_API_KEY || process.env.NEXT_PUBLIC_TENOR_API_KEY;
    const giphyKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY;

    // 1. Try Tenor API v2 if key is configured
    if (tenorKey) {
      try {
        const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
          query
        )}&key=${tenorKey}&client_key=pairfect&limit=16&contentfilter=medium`;
        const res = await fetch(tenorUrl, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const results: GifResult[] = (json.results || []).map((r: any) => ({
            id: r.id,
            title: r.content_description || "GIF",
            url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || "",
            previewUrl: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || "",
            width: r.media_formats?.gif?.dims?.[0] || 200,
            height: r.media_formats?.gif?.dims?.[1] || 150,
          })).filter((g: GifResult) => !!g.url);

          if (results.length > 0) {
            return NextResponse.json({ results });
          }
        }
      } catch (tenorErr) {
        console.warn("Tenor API search failed, falling back to alternatives:", tenorErr);
      }
    }

    // 2. Try Giphy as secondary proxy if Giphy key exists
    if (giphyKey) {
      try {
        const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(
          query
        )}&limit=16&rating=g`;
        const res = await fetch(giphyUrl, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const results: GifResult[] = (json.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "GIF",
            url: item.images?.fixed_height?.url || item.images?.original?.url || "",
            previewUrl: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url || "",
          })).filter((g: GifResult) => !!g.url);

          if (results.length > 0) {
            return NextResponse.json({ results });
          }
        }
      } catch (giphyErr) {
        console.warn("Giphy fallback search failed:", giphyErr);
      }
    }

    // 3. Graceful fallback to curated playful relationship reactions matching search or general
    const filteredCurated = query
      ? CURATED_GIFS.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()))
      : CURATED_GIFS;

    return NextResponse.json({
      results: filteredCurated.length > 0 ? filteredCurated : CURATED_GIFS,
    });
  } catch (err: any) {
    console.error("GET /api/tenor/search error:", err);
    return NextResponse.json({ results: CURATED_GIFS });
  }
}
