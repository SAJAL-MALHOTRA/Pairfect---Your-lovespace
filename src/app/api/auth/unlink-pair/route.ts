import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbClient = supabase;
    try {
      dbClient = createAdminClient();
    } catch {
      // Service key not set, use user client
    }

    const { data: pairsList, error: pairErr } = await dbClient
      .from("pairs")
      .select("id,user_a_id,user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .in("status", ["pending", "active"]);

    if (pairErr) throw pairErr;

    if (!pairsList || pairsList.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const p of pairsList) {
      // 1. Try calling the SECURITY DEFINER RPC first
      const { data: rpcData, error: rpcErr } = await supabase.rpc("unlink_and_delete_pair", { p_pair_id: p.id });

      if (rpcErr || !rpcData?.success) {
        // Fallback: Delete storage objects then pair row
        await dbClient.from("pairs").delete().eq("id", p.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Unlink pair error:", err);
    const message = err instanceof Error ? err.message : "Failed to unlink pair";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
