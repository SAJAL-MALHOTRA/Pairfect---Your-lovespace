import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client using Service Role key to bypass client RLS for pair joining
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body.code?.toString().trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: "Please enter an invite code." }, { status: 400 });
    }

    // Get auth token from request header
    const authHeader = req.headers.get("Authorization");
    const adminSupabase = getAdminClient();

    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await adminSupabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId && body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

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

    if (!targetPair) {
      return NextResponse.json({
        success: false,
        error: "Invalid invite code or pair is no longer joinable.",
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
