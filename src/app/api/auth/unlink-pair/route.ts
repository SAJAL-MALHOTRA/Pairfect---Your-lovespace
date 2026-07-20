import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildUnlinkedPairUpdate } from "@/lib/pairs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Try calling the SECURITY DEFINER RPC first (most robust)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("unlink_user_pair");

    if (!rpcErr && rpcData?.success) {
      return NextResponse.json({ success: true, count: rpcData.unlinked_count });
    }

    // 2. Fallback to Admin Client if service key is configured
    let dbClient = supabase;
    try {
      dbClient = createAdminClient();
    } catch {
      // Service key not set, use user client
    }

    const { data: pairsList, error: pairErr } = await dbClient
      .from("pairs")
      .select("id,user_a_id,user_b_id,status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .in("status", ["pending", "active"]);

    if (pairErr) throw pairErr;

    if (!pairsList || pairsList.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const pairData of pairsList) {
      const mutation = buildUnlinkedPairUpdate(pairData, user.id);

      if (mutation.action === "delete") {
        const { error: delErr } = await dbClient.from("pairs").delete().eq("id", pairData.id);
        if (delErr) console.warn("Pair delete warn:", delErr);
      } else {
        const { error: updErr } = await dbClient
          .from("pairs")
          .update(mutation.values)
          .eq("id", pairData.id);
        if (updErr) console.warn("Pair update warn:", updErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Unlink pair error:", err);
    const message = err instanceof Error ? err.message : "Failed to unlink pair";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
