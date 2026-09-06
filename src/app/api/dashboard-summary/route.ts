import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user's active pair
    const { data: pair, error: pairErr } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (pairErr || !pair) {
      return NextResponse.json(
        {
          counts: { letters: 0, moments: 0, gratitude: 0, mixtapes: 0 },
          recentLetters: [],
          recentMoments: [],
          recentGratitude: [],
          latestMixtape: null,
          partnerMood: null,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        }
      );
    }

    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;

    // Fetch all summary metrics concurrently on server
    const [
      letCountRes,
      momCountRes,
      gratCountRes,
      mixCountRes,
      recentLetRes,
      recentMomRes,
      recentGratRes,
      latestMixRes,
      partnerMoodRes,
    ] = await Promise.all([
      supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
      supabase.from("shared_moments").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
      supabase.from("gratitude_entries").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
      supabase.from("mixtapes").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
      supabase
        .from("love_letters")
        .select("id, sender_id, sent_at, content")
        .eq("pair_id", pair.id)
        .order("sent_at", { ascending: false })
        .limit(2),
      supabase
        .from("shared_moments")
        .select("id, title, photo_url, moment_date, created_at")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(2),
      supabase
        .from("gratitude_entries")
        .select("id, user_id, content, created_at")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(2),
      supabase
        .from("mixtapes")
        .select("id, title, cover_theme, created_at")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(1),
      partnerId
        ? supabase
            .from("mood_logs")
            .select("mood, created_at")
            .eq("pair_id", pair.id)
            .eq("user_id", partnerId)
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
    ]);

    return NextResponse.json(
      {
        counts: {
          letters: letCountRes.count || 0,
          moments: momCountRes.count || 0,
          gratitude: gratCountRes.count || 0,
          mixtapes: mixCountRes.count || 0,
        },
        recentLetters: recentLetRes.data || [],
        recentMoments: recentMomRes.data || [],
        recentGratitude: recentGratRes.data || [],
        latestMixtape: latestMixRes.data && latestMixRes.data.length > 0 ? latestMixRes.data[0] : null,
        partnerMood: partnerMoodRes.data && partnerMoodRes.data.length > 0 ? partnerMoodRes.data[0].mood : null,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    console.error("[Dashboard Summary Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
