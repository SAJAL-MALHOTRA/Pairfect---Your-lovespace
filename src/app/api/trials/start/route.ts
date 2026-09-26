import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startPairTrial } from "@/lib/trials";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    // Find user's active pair
    const { data: pair, error: pairErr } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (pairErr || !pair) {
      return NextResponse.json(
        { error: "You must connect with your partner in a room before starting your 7-day free trial." },
        { status: 400 }
      );
    }

    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
    const result = await startPairTrial(pair.id, pair.user_a_id, partnerId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "7-day Pairfect Plus trial activated for both partners!",
      trialEndsAt: result.trialEndsAt,
    });
  } catch (err: any) {
    console.error("[api/trials/start] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to start trial." }, { status: 500 });
  }
}
