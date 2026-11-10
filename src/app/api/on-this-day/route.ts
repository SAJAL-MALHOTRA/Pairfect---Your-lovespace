import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the user's active pair
    const { data: pair, error: pairErr } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pairErr) throw pairErr;

    if (!pair) {
      return NextResponse.json({ memories: [] });
    }

    // Call the RPC function - today's date is the default in the SQL function
    const { data: memories, error: rpcErr } = await supabase.rpc(
      "get_on_this_day",
      {
        p_pair_id: pair.id,
      }
    );

    if (rpcErr) {
      console.error("on-this-day RPC error:", rpcErr);
      // Don't crash the dashboard - return empty gracefully
      return NextResponse.json({ memories: [] });
    }

    return NextResponse.json(
      { memories: memories || [] },
      {
        headers: {
          // Cache for 1 hour - data only changes once per day
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch (err: any) {
    console.error("GET on-this-day error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load memories" },
      { status: 500 }
    );
  }
}
