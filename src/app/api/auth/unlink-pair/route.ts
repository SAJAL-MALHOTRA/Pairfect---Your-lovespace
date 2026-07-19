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

    const adminSupabase = createAdminClient();

    const { data: pairData, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("id,user_a_id,user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .in("status", ["pending", "active"])
      .maybeSingle();

    if (pairErr) throw pairErr;

    if (!pairData) {
      return NextResponse.json({ success: true });
    }

    const mutation = buildUnlinkedPairUpdate(pairData, user.id);

    if (mutation.action === "delete") {
      const { error: delErr } = await adminSupabase.from("pairs").delete().eq("id", pairData.id);
      if (delErr) throw delErr;
    } else {
      const { error: updErr } = await adminSupabase
        .from("pairs")
        .update(mutation.values)
        .eq("id", pairData.id);
      if (updErr) throw updErr;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Unlink pair error:", err);
    const message = err instanceof Error ? err.message : "Failed to unlink pair";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
