import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createClient as createClientJS } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";

function safeDecrypt(text?: string | null): string {
  if (!text) return "";
  try {
    return decrypt(text);
  } catch (e) {
    return text.replace(/^enc:/, "");
  }
}

function getSupabaseClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceKey) {
      return createAdminClient();
    }
  } catch (e) {
    // fallback
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClientJS(url, key);
}

export async function POST(req: Request) {
  try {
    const userClient = await createClient();
    const { data: { user }, error: authErr } = await userClient.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { disputeId } = body;
    console.log("[VibeJudge API] Received judging request for disputeId:", disputeId);

    if (!disputeId) {
      return NextResponse.json({ error: "Dispute ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch the dispute
    const { data: dispute, error: disputeErr } = await supabase
      .from("vibe_disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    if (disputeErr || !dispute) {
      console.error("[VibeJudge API] Dispute not found:", disputeErr);
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status === "judged") {
      const { data: existingVerd } = await supabase
        .from("dispute_verdicts")
        .select("*")
        .eq("dispute_id", disputeId)
        .maybeSingle();

      if (existingVerd) {
        return NextResponse.json({ success: true, verdict: existingVerd });
      }
    }

    // 2. Fetch pair profiles to match A and B names & verify authorization
    const { data: pair } = await supabase
      .from("pairs")
      .select("*")
      .eq("id", dispute.pair_id)
      .single();

    if (!pair) {
      return NextResponse.json({ error: "Pair association not found" }, { status: 404 });
    }

    if (user.id !== pair.user_a_id && user.id !== pair.user_b_id) {
      return NextResponse.json({ error: "Forbidden: You do not belong to this pair" }, { status: 403 });
    }

    // 3. Fetch the arguments
    const { data: args, error: argsErr } = await supabase
      .from("dispute_arguments")
      .select("*")
      .eq("dispute_id", disputeId);

    if (argsErr || !args || args.length < 2) {
      console.warn("[VibeJudge API] Incomplete arguments for disputeId:", disputeId, "count:", args?.length);
      return NextResponse.json({ error: "Both arguments must be submitted to judge" }, { status: 400 });
    }

    const { data: userA } = await supabase.from("users").select("display_name").eq("id", pair.user_a_id).single();
    const { data: userB } = await supabase.from("users").select("display_name").eq("id", pair.user_b_id).single();

    const nameA = userA?.display_name || "Partner A";
    const nameB = userB?.display_name || "Partner B";

    const argAObj = args.find((a: any) => a.user_id === pair.user_a_id);
    const argBObj = args.find((a: any) => a.user_id === pair.user_b_id);

    const argA = safeDecrypt(argAObj?.argument_text) || "No argument provided";
    const argB = safeDecrypt(argBObj?.argument_text) || "No argument provided";

    console.log("[VibeJudge API] Topic:", dispute.topic);
    console.log(`[VibeJudge API] ${nameA}: "${argA}"`);
    console.log(`[VibeJudge API] ${nameB}: "${argB}"`);

    let verdictObj: { winner: "A" | "B"; verdict: string; sentence: string } | null = null;

    // 4. Try Groq API call if key is available
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const prompt = `You are a playful, warm relationship judge for a couples app called Pairfect. 
Two partners have a lighthearted dispute: "${dispute.topic}"

${nameA}'s case: "${argA}"
${nameB}'s case: "${argB}"

Give a fun, warm verdict (2-3 sentences) picking a "winner" (A for ${nameA}, B for ${nameB}) — keep it sweet and playful.
End with a playful, harmless "sentence" for the loser (e.g. "must bring morning coffee", "picks next movie").

Respond in JSON format with exact keys:
{
  "winner": "A" or "B",
  "verdict": "2-3 playful sentences...",
  "sentence": "Playful sentence details..."
}`;

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });

        if (groqResponse.ok) {
          const completion = await groqResponse.json();
          const textOutput = completion.choices[0]?.message?.content;
          if (textOutput) {
            verdictObj = JSON.parse(textOutput);
            console.log("[VibeJudge API] Groq AI Verdict Success:", verdictObj);
          }
        } else {
          console.warn("[VibeJudge API] Groq returned status:", groqResponse.status, await groqResponse.text());
        }
      } catch (aiErr) {
        console.error("[VibeJudge API] Groq fetch failed, using fallback:", aiErr);
      }
    }

    // 5. Intelligent Fallback Verdict Generator if AI API fails or is unconfigured
    if (!verdictObj) {
      const pickA = argA.length >= argB.length;
      const winnerLetter = pickA ? "A" : "B";
      const winnerName = pickA ? nameA : nameB;
      const loserName = pickA ? nameB : nameA;

      const fallbackSentences = [
        `must bring ${winnerName} coffee in bed tomorrow morning ☕`,
        `gives ${winnerName} a 5-minute shoulder massage 💆‍♂️`,
        `must let ${winnerName} pick the movie tonight 🎬`,
        `owes ${winnerName} an extra warm hug & ice cream 🍦`,
      ];

      const sentence = fallbackSentences[Math.floor(Math.random() * fallbackSentences.length)];

      verdictObj = {
        winner: winnerLetter as "A" | "B",
        verdict: `After careful court deliberation, ${winnerName}'s passionate case for "${dispute.topic}" was convincing! Both partners brought great points, but ${winnerName} takes this round with undeniable logic and charm.`,
        sentence: `${loserName} ${sentence}.`,
      };
      console.log("[VibeJudge API] Generated fallback verdict:", verdictObj);
    }

    const winnerUserId = verdictObj.winner === "B" ? pair.user_b_id : pair.user_a_id;

    // 6. Write Verdict and Update Dispute Status
    const { data: verdict, error: insertErr } = await supabase
      .from("dispute_verdicts")
      .insert({
        dispute_id: disputeId,
        winner_user_id: winnerUserId,
        verdict_text: verdictObj.verdict,
        playful_sentence: verdictObj.sentence,
      })
      .select()
      .single();

    if (insertErr) {
      // If verdict already exists due to concurrent request, fetch existing
      const { data: existingVerd } = await supabase
        .from("dispute_verdicts")
        .select("*")
        .eq("dispute_id", disputeId)
        .single();

      if (existingVerd) {
        return NextResponse.json({ success: true, verdict: existingVerd });
      }
      throw insertErr;
    }

    // Update status to judged
    await supabase
      .from("vibe_disputes")
      .update({ status: "judged" })
      .eq("id", disputeId);

    return NextResponse.json({ success: true, verdict });
  } catch (err: any) {
    console.error("[VibeJudge API] Fatal Error:", err);
    return NextResponse.json({ error: err.message || "Failed to judge dispute" }, { status: 500 });
  }
}
