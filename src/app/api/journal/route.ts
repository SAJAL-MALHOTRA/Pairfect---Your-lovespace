import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pairData } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (!pairData) {
      return NextResponse.json({ error: "No active pair found" }, { status: 400 });
    }

    const pairId = pairData.id;
    const partnerId = pairData.user_a_id === user.id ? pairData.user_b_id : pairData.user_a_id;

    // Deterministically pick today's prompt
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const { count, error: countErr } = await supabase
      .from("journal_prompts")
      .select("*", { count: "exact", head: true });
    
    if (countErr) throw countErr;
    const totalPrompts = count || 1;
    const promptIndex = dayOfYear % totalPrompts;

    const { data: prompts, error: promptErr } = await supabase
      .from("journal_prompts")
      .select("*")
      .order("created_at", { ascending: true })
      .range(promptIndex, promptIndex)
      .limit(1);

    if (promptErr) throw promptErr;
    const prompt = prompts?.[0];

    // Fetch both entries for today
    const todayStr = now.toISOString().split("T")[0];
    const { data: entries, error: entriesErr } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("pair_id", pairId)
      .eq("prompt_date", todayStr);

    if (entriesErr) throw entriesErr;

    const userEntry = entries?.find((e: any) => e.user_id === user.id);
    const partnerEntry = entries?.find((e: any) => e.user_id === partnerId);

    let responseData: any = { prompt };

    if (userEntry && partnerEntry) {
      responseData.entries = {
        user: userEntry,
        partner: partnerEntry,
        locked: false
      };
    } else if (userEntry && !partnerEntry) {
      responseData.entries = {
        user: userEntry,
        locked: true
      };
    } else {
      responseData.entries = null;
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("GET journal error:", err);
    return NextResponse.json({ error: err.message || "Failed to load journal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, prompt_id } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: pairData } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (!pairData) {
      return NextResponse.json({ error: "No active pair found" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const { data: entry, error: insertErr } = await supabase
      .from("journal_entries")
      .insert({
        pair_id: pairData.id,
        user_id: user.id,
        prompt_id,
        prompt_date: todayStr,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    console.error("POST journal error:", err);
    return NextResponse.json({ error: err.message || "Failed to save journal entry" }, { status: 500 });
  }
}
