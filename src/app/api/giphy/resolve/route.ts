import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GIPHY API key is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Sticker ID is required" }, { status: 400 });
    }

    const res = await fetch(`https://api.giphy.com/v1/gifs/${id}?api_key=${apiKey}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || data?.meta?.status !== 200) {
      return NextResponse.json({ error: "Failed to resolve sticker" }, { status: res.status || 500 });
    }

    return NextResponse.json({ url: data.data?.images?.fixed_height?.url || null });
  } catch (err: any) {
    console.error("GIPHY resolve error:", err);
    return NextResponse.json({ error: err.message || "Failed to resolve sticker" }, { status: 500 });
  }
}
