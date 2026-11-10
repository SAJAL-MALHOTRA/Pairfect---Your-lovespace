import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";

const DEMO_PUBLIC_MOMENTS = [
  {
    id: "demo-verdict",
    type: "verdict",
    title: "Court of Petty Lovers: Final Verdict ⚖️",
    description: "Verdict: Incurable Mutual Softness. Sentence: The accused is sentenced to prepare iced lattes in bed and deliver exactly 50 forehead kisses before noon.",
    category: "AI Vibe Judge",
    moment_date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    pettyScore: 9,
    author: "AI Presiding Judge",
  },
  {
    id: "demo-riddle",
    type: "sleuth",
    title: "Master Sleuths: Riddle Night Certificate 🔎",
    description: "Case Closed: The Mystery of the Broken Antique Clock. Perfect deduction score 5/5 with 0 hints requested.",
    category: "Riddle Night",
    moment_date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    author: "Pairfect Detective Bureau",
  },
  {
    id: "demo-gratitude",
    type: "gratitude",
    title: "Gratitude Slip from Partner 💌",
    description: "\"I love the way your eyes crinkle when you laugh at silly memes. Thank you for staying on call until I fell asleep.\"",
    category: "The Gratitude Jar",
    moment_date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    author: "Partner",
  },
  {
    id: "demo-sync",
    type: "sync",
    title: "Soulmate Synchronicity: 94% Compatibility ⚡",
    description: "Both chose: Midnight highway drive with playlists over fancy dinners. In sync across 10 rapid-fire relationship dilemmas.",
    category: "Love Match",
    moment_date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    author: "Love Match Synchronizer",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId") || searchParams.get("share");

    if (!pairId || pairId === "demo") {
      return NextResponse.json({
        pairId: "demo",
        isDemo: true,
        moments: DEMO_PUBLIC_MOMENTS,
        photoStrips: [],
      });
    }

    let supabase;
    try {
      supabase = await createClient();
    } catch {
      supabase = null;
    }

    let activeDb = supabase;
    try {
      const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (!authData?.user) {
        activeDb = createAdminClient();
      }
    } catch {
      activeDb = createAdminClient();
    }

    if (!activeDb) {
      return NextResponse.json({
        pairId,
        isDemo: true,
        moments: DEMO_PUBLIC_MOMENTS,
        photoStrips: [],
      });
    }

    // Query shared moments, photostrips, and gratitude
    const [momentsRes, stripsRes] = await Promise.all([
      activeDb.from("shared_moments").select("*").eq("pair_id", pairId).order("created_at", { ascending: false }),
      activeDb.from("photo_strips").select("*, photo_strip_images(*)").eq("pair_id", pairId).order("created_at", { ascending: false }),
    ]);

    const moments = momentsRes.data || [];
    const photoStrips = stripsRes.data || [];

    // Fall back to demo items if pair has not yet pinned items
    if (moments.length === 0 && photoStrips.length === 0) {
      return NextResponse.json({
        pairId,
        isDemo: true,
        moments: DEMO_PUBLIC_MOMENTS,
        photoStrips: [],
      });
    }

    return NextResponse.json({
      pairId,
      isDemo: false,
      moments,
      photoStrips,
    });
  } catch (err: any) {
    console.error("GET public moments error:", err);
    return NextResponse.json({
      pairId: "demo",
      isDemo: true,
      moments: DEMO_PUBLIC_MOMENTS,
      photoStrips: [],
    });
  }
}
