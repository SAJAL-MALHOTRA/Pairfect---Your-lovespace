import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const { disputeId } = await req.json();
    if (!disputeId) {
      return NextResponse.json({ error: "Dispute ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch the dispute
    const { data: dispute, error: disputeErr } = await supabase
      .from("vibe_disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    if (disputeErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // 2. Fetch the arguments
    const { data: args, error: argsErr } = await supabase
      .from("dispute_arguments")
      .select("*")
      .eq("dispute_id", disputeId);

    if (argsErr || !args || args.length < 2) {
      return NextResponse.json({ error: "Both arguments must be submitted to judge" }, { status: 400 });
    }

    // 3. Fetch pair profiles to match A and B names
    const { data: pair } = await supabase
      .from("pairs")
      .select("*")
      .eq("id", dispute.pair_id)
      .single();

    if (!pair) {
      return NextResponse.json({ error: "Pair association not found" }, { status: 404 });
    }

    const { data: userA } = await supabase.from("users").select("display_name").eq("id", pair.user_a_id).single();
    const { data: userB } = await supabase.from("users").select("display_name").eq("id", pair.user_b_id).single();

    const nameA = userA?.display_name || "Partner A";
    const nameB = userB?.display_name || "Partner B";

    const argAObj = args.find((a: any) => a.user_id === pair.user_a_id);
    const argBObj = args.find((a: any) => a.user_id === pair.user_b_id);

    const argA = decrypt(argAObj?.argument_text) || "No argument provided";
    const argB = decrypt(argBObj?.argument_text) || "No argument provided";

    // 4. Construct Prompt
    const prompt = `You are a playful, warm relationship judge for a couples app called Pairfect. 
Two partners have a lighthearted dispute: "${dispute.topic}"

${nameA}'s case: "${argA}"
${nameB}'s case: "${argB}"

Give a fun, warm verdict (2-3 sentences) picking a "winner" — but keep it 
sweet, never mean. End with a playful, harmless "sentence" for the other 
partner (like "must give a foot rub" or "picks the next movie").

Respond in JSON exactly matching this structure: 
{ 
  "winner": "A" or "B", 
  "verdict": "2-3 playful sentences explaining the judgment...", 
  "sentence": "Playful sentence details..." 
}

Provide ONLY the raw JSON output. Do not wrap it in markdown code blocks.`;

    // 5. Invoke Groq API (OpenAI-compatible chat completions)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Groq API key is not configured" }, { status: 500 });
    }

    console.log("[VibeJudge] Sending request to Groq API using model llama-3.3-70b-versatile");
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error (status ${groqResponse.status}): ${errorText}`);
    }

    const completion = await groqResponse.json();
    const textOutput = completion.choices[0].message.content;
    console.log("[VibeJudge] Groq API response received:", textOutput);
    const result = JSON.parse(textOutput);

    const winnerLetter = result.winner; // "A" or "B"
    const winnerUserId = winnerLetter === "B" ? pair.user_b_id : pair.user_a_id;

    // 6. Write Verdict and Update Dispute Status
    const { data: verdict, error: insertErr } = await supabase
      .from("dispute_verdicts")
      .insert({
        dispute_id: disputeId,
        winner_user_id: winnerUserId,
        verdict_text: encrypt(result.verdict),
        playful_sentence: result.sentence
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Update status to judged
    await supabase
      .from("vibe_disputes")
      .update({ status: "judged" })
      .eq("id", disputeId);

    return NextResponse.json({ success: true, verdict });
  } catch (err: any) {
    console.error("Vibe Judge Error:", err);
    return NextResponse.json({ error: err.message || "Failed to judge dispute" }, { status: 500 });
  }
}
