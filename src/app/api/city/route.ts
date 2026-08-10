import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findCity } from "@/lib/city-catalog";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("city")
      .eq("id", user.id)
      .single();

    if (profileErr) throw profileErr;

    return NextResponse.json({ city: profile?.city || null });
  } catch (err: any) {
    console.error("GET /api/city error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch city" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, country, timezone } = body || {};

    if (!name || !country) {
      return NextResponse.json({ error: "City name and country are required" }, { status: 400 });
    }

    // Determine timezone (default to Asia/Kolkata if missing)
    let finalTimezone = timezone || "Asia/Kolkata";
    const catalogEntry = findCity(name, country);
    if (catalogEntry) {
      finalTimezone = catalogEntry.timezone;
    }

    // Store ONLY name, country, timezone. NO coordinates!
    const cityData = {
      name: String(name).trim(),
      country: String(country).trim(),
      timezone: String(finalTimezone).trim(),
    };

    const { error: updateErr } = await supabase
      .from("users")
      .update({ city: cityData })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, city: cityData });
  } catch (err: any) {
    console.error("POST /api/city error:", err);
    return NextResponse.json({ error: err.message || "Failed to save city" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update({ city: null })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, city: null });
  } catch (err: any) {
    console.error("DELETE /api/city error:", err);
    return NextResponse.json({ error: err.message || "Failed to clear city" }, { status: 500 });
  }
}
