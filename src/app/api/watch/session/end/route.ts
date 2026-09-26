import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pair } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (!pair) {
      return NextResponse.json({ error: "No active pair found" }, { status: 400 });
    }

    // End any active or waiting session for this couple
    await supabase
      .from("watch_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("pair_id", pair.id)
      .in("status", ["waiting", "active"]);

    return NextResponse.json({ success: true, message: "Session ended" });
  } catch (err: any) {
    console.error("POST /api/watch/session/end error:", err);
    return NextResponse.json({ error: err.message || "Failed to end session" }, { status: 500 });
  }
}
