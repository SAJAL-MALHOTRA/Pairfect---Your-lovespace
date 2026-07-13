import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subDays, format } from "date-fns";

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user's active pair
    const { data: pair, error: pairError } = await supabase
      .from("pairs")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (pairError || !pair) {
      return NextResponse.json(
        { error: "Active pair not found. Please complete onboarding first." },
        { status: 400 }
      );
    }

    // Fetch user profiles to include names in prompt
    const { data: userA } = await supabase.from("users").select("display_name").eq("id", pair.user_a_id).single();
    const { data: userB } = await supabase.from("users").select("display_name").eq("id", pair.user_b_id).single();
    const nameA = userA?.display_name || "Partner A";
    const nameB = userB?.display_name || "Partner B";

    // 3. Fetch mood logs from the last 7 days
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    const { data: logs, error: logsError } = await supabase
      .from("mood_logs")
      .select("*")
      .eq("pair_id", pair.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: "No mood logs logged in the past 7 days. Try checking in before generating a summary!" },
        { status: 400 }
      );
    }

    // 4. Construct prompt for Gemini
    let promptLogsText = "";
    logs.forEach((log: any) => {
      const creatorName = log.user_id === pair.user_a_id ? nameA : nameB;
      const dateFormatted = format(new Date(log.created_at), "yyyy-MM-dd HH:mm");
      promptLogsText += `[${dateFormatted}] ${creatorName}: mood=${log.mood}, intensity=${log.mood_intensity}/5, note="${log.note || ""}"\n`;
    });

    const prompt = `You are Valence, an AI relationship companion. You are summarizing a week of relationship mood check-ins for two partners, ${nameA} and ${nameB}.
Here is their chronological check-in data from the past 7 days:
${promptLogsText}

Write a short (3-5 sentence), warm, cozy, casual, and non-clinical summary of how the week felt for this couple.
Mention any notable dips or highs if the data supports it, such as shared good moods or supportive logs when one partner was tired/stressed.
Do not diagnose, offer therapy, or give relationship advice.
End by classifying the overall emotional trend as exactly one of: improving, stable, declining, mixed.

Return a JSON object exactly matching this structure:
{
  "summary": "A warm narrative recap paragraph...",
  "trend": "improving" | "stable" | "declining" | "mixed"
}

Provide ONLY the raw JSON output. Do not wrap it in markdown code blocks.`;

    // 5. Invoke Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY env variable is not set up." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await model.generateContent(prompt);
    const textOutput = response.response.text();
    
    // 6. Parse result
    const result = JSON.parse(textOutput);
    if (!result.summary || !result.trend) {
      throw new Error("Invalid response format from Gemini model.");
    }

    // 7. Write to vibe_summaries securely via Admin client
    const adminSupabase = createAdminClient();
    const periodStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const periodEnd = format(new Date(), "yyyy-MM-dd");

    const { data: recap, error: insertError } = await adminSupabase
      .from("vibe_summaries")
      .insert({
        pair_id: pair.id,
        period_start: periodStart,
        period_end: periodEnd,
        summary_text: result.summary,
        mood_trend: result.trend.toLowerCase() as any,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, recap });
  } catch (err: any) {
    console.error("Recap Generation Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process weekly vibe summary." },
      { status: 500 }
    );
  }
}
