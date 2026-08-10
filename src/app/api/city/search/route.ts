import { NextResponse } from "next/server";
import { searchCities } from "@/lib/city-catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 1. Search local city catalog first
    const localResults = searchCities(query);

    // If local results are sufficient, return them directly
    if (localResults.length >= 5) {
      return NextResponse.json({ results: localResults });
    }

    // 2. Fetch from Open-Meteo Geocoding API for broader international search
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`,
        { next: { revalidate: 86400 } } // Cache for 24 hours
      );

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const rawResults = geoData.results || [];

        // Map and SANITIZE — strip all coordinates, latitude, longitude!
        const externalResults = rawResults.map((r: any) => ({
          name: r.name,
          country: r.country || "International",
          timezone: r.timezone || "Asia/Kolkata",
        }));

        // Combine local and external results, deduplicating by city+country
        const combined = [...localResults];
        const seen = new Set(localResults.map((c) => `${c.name.toLowerCase()}-${c.country.toLowerCase()}`));

        for (const ext of externalResults) {
          const key = `${ext.name.toLowerCase()}-${ext.country.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(ext);
          }
        }

        return NextResponse.json({ results: combined.slice(0, 10) });
      }
    } catch (fetchErr) {
      console.warn("Open-Meteo geocoding search failed, returning local results:", fetchErr);
    }

    // Fallback to local results
    return NextResponse.json({ results: localResults });
  } catch (err: any) {
    console.error("GET /api/city/search error:", err);
    return NextResponse.json({ error: err.message || "Failed to search cities" }, { status: 500 });
  }
}
