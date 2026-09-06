import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidBetaCode } from "@/lib/beta";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body.code?.toString().trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: "Please enter an invite code." }, { status: 400 });
    }

    // Route handlers are public endpoints, so derive identity exclusively from
    // the authenticated Supabase session rather than from request data.
    const sessionSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = user.id;
    const adminSupabase = createAdminClient();

    // 1. Find pending pair by invite code using Admin client
    const { data: targetPair, error: fetchErr } = await adminSupabase
      .from("pairs")
      .select("*")
      .eq("invite_code", code)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchErr) {
      console.error("[Join Pair API] Fetch pair error:", fetchErr);
      return NextResponse.json({ success: false, error: "Database error checking invite code." }, { status: 500 });
    }

    if (isValidBetaCode(code)) {
      return NextResponse.json({
        success: false,
        error: `${code} is your app Beta Access Code, not your partner's invite code! One partner must click "Create a new pair" to generate a 6-character code (e.g. A1B2C3), and the other partner enters that code here.`,
      }, { status: 400 });
    }

    if (!targetPair) {
      return NextResponse.json({
        success: false,
        error: "Invalid invite code or pair is no longer joinable. Make sure your partner clicked 'Create a new pair' and shared their 6-character code.",
      }, { status: 404 });
    }

    // Prevent user from pairing with themselves
    if (targetPair.user_a_id === userId) {
      return NextResponse.json({
        success: false,
        error: "You cannot join your own invite code! Please send this code to your partner to enter on their device.",
      }, { status: 400 });
    }

    // 2. Clean up any unjoined pending pairs created by the joining user
    await adminSupabase
      .from("pairs")
      .delete()
      .eq("user_a_id", userId)
      .is("user_b_id", null)
      .eq("status", "pending");

    // 3. Activate the target pair
    const today = new Date().toISOString().split("T")[0];
    const { error: updateErr } = await adminSupabase
      .from("pairs")
      .update({
        user_b_id: userId,
        status: "active",
        started_dating_date: targetPair.started_dating_date || today,
      })
      .eq("id", targetPair.id);

    if (updateErr) {
      console.error("[Join Pair API] Update pair error:", updateErr);
      return NextResponse.json({ success: false, error: "Failed to update pair status." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pairId: targetPair.id,
      message: "Pair successfully activated!",
    });
  } catch (err: any) {
    console.error("[Join Pair API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error joining pair." }, { status: 500 });
  }
}
