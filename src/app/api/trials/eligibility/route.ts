import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTrialEligibility } from "@/lib/trials";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ eligible: false, reason: "Please sign in to check trial eligibility." }, { status: 401 });
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
        { eligible: false, reason: "Connect with your partner in a room to activate your 7-day free trial." },
        { status: 200 }
      );
    }

    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
    const result = await checkTrialEligibility(pair.id, pair.user_a_id, partnerId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/trials/eligibility] Error:", err);
    return NextResponse.json({ eligible: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
