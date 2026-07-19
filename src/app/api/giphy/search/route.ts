import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const apiKey =
      process.env.GIPHY_API_KEY ||
      process.env.NEXT_PUBLIC_GIPHY_API_KEY ||
      "Z2X54qQsJJrza9DF89AzBkEIHyXqsMhN";
    if (!apiKey) {
      return NextResponse.json({ error: "GIPHY API key is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "cat happy";
    const url = `https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || data?.meta?.status !== 200) {
      return NextResponse.json(
        { error: data?.meta?.msg || "Failed to load GIPHY stickers" },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({ data: data.data || [] });
  } catch (err: any) {
    console.error("GIPHY search error:", err);
    return NextResponse.json({ error: err.message || "Failed to load GIPHY stickers" }, { status: 500 });
  }
}
