import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId");

    if (!pairId) {
      return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
    }

    // Run queries in parallel to fetch latest activity logs and active sessions
    const [
      loveLetterRes,
      photoboothRes,
      gratitudeRes,
      quizHistoryRes,
      riddleSessionRes,
      disputeVerdictRes,
      activeRiddleRes,
      activeDisputeRes
    ] = await Promise.all([
      // 1. Last love letter
      supabase
        .from("love_letters")
        .select("*")
        .eq("pair_id", pairId)
        .order("sent_at", { ascending: false })
        .limit(1),

      // 2. Last photobooth session
      supabase
        .from("photobooth_strips")
        .select("*, photobooth_sessions!inner(pair_id)")
        .eq("photobooth_sessions.pair_id", pairId)
        .order("created_at", { ascending: false })
        .limit(1),

      // 3. Last gratitude entry
      supabase
        .from("gratitude_entries")
        .select("*")
        .eq("pair_id", pairId)
        .order("created_at", { ascending: false })
        .limit(1),

      // 4. Last quiz history
      supabase
        .from("quiz_history")
        .select("*")
        .eq("pair_id", pairId)
        .order("completed_at", { ascending: false })
        .limit(1),

      // 5. Last completed riddle session
      supabase
        .from("riddle_sessions")
        .select("*, riddles(*)")
        .eq("pair_id", pairId)
        .eq("status", "revealed")
        .order("started_at", { ascending: false })
        .limit(1),

      // 6. Last dispute verdict
      supabase
        .from("dispute_verdicts")
        .select("*, vibe_disputes!inner(pair_id)")
        .eq("vibe_disputes.pair_id", pairId)
        .order("created_at", { ascending: false })
        .limit(1),

      // 7. Active riddle session (for Continue Together)
      supabase
        .from("riddle_sessions")
        .select("*, riddles(*)")
        .eq("pair_id", pairId)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1),

      // 8. Active dispute session (for Continue Together)
      supabase
        .from("vibe_disputes")
        .select("*")
        .eq("pair_id", pairId)
        .neq("status", "judged")
        .order("created_at", { ascending: false })
        .limit(1)
    ]);

    // Decrypt the last love letter if it exists
    let lastLoveLetter = loveLetterRes.data?.[0] || null;
    if (lastLoveLetter) {
      let decryptedContent = lastLoveLetter.content;
      if (typeof lastLoveLetter.content === "string") {
        try {
          const decryptedStr = decrypt(lastLoveLetter.content);
          if (typeof decryptedStr === "string" && (decryptedStr.startsWith("[") || decryptedStr.startsWith("{"))) {
            decryptedContent = JSON.parse(decryptedStr);
          } else {
            decryptedContent = [{ type: "text", value: "A handwritten letter for you ♡" }];
          }
        } catch (e) {
          console.error("Failed to decrypt summary letter content:", e);
          decryptedContent = [{ type: "text", value: "A handwritten letter for you ♡" }];
        }
      }
      lastLoveLetter = { ...lastLoveLetter, content: decryptedContent };
    }

    // Decrypt the last gratitude entry if it exists
    let lastGratitude = gratitudeRes.data?.[0] || null;
    if (lastGratitude && typeof lastGratitude.content === "string") {
      try {
        const res = decrypt(lastGratitude.content);
        const cleanContent = (typeof res === "string" && res.startsWith("enc:")) ? "A note of gratitude shared with love ♡" : res;
        lastGratitude = { ...lastGratitude, content: cleanContent };
      } catch (e) {
        console.error("Failed to decrypt summary gratitude content:", e);
        lastGratitude = { ...lastGratitude, content: "A note of gratitude shared with love ♡" };
      }
    }

    return NextResponse.json({
      lastLoveLetter,
      lastPhotobooth: photoboothRes.data?.[0] || null,
      lastGratitude,
      lastQuizHistory: quizHistoryRes.data?.[0] || null,
      lastCompletedRiddle: riddleSessionRes.data?.[0] || null,
      lastDisputeVerdict: disputeVerdictRes.data?.[0] || null,
      activeRiddle: activeRiddleRes.data?.[0] || null,
      activeDispute: activeDisputeRes.data?.[0] || null
    });
  } catch (err: any) {
    console.error("GET dashboard-summary error:", err);
    return NextResponse.json({ error: err.message || "Failed to load summary details" }, { status: 500 });
  }
}
