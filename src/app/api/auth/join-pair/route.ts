import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Rate limiting: 5 join attempts per minute per user to prevent brute-forcing 6-character codes
const joinRateLimitMap = new Map<string, number[]>();
const JOIN_WINDOW_MS = 60 * 1000;
const MAX_JOIN_ATTEMPTS = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isJoinRateLimited(userId: string): boolean {
  const now = Date.now();
  const attempts = (joinRateLimitMap.get(userId) || []).filter(
    (t) => now - t < JOIN_WINDOW_MS
  );

  if (attempts.length >= MAX_JOIN_ATTEMPTS) {
    joinRateLimitMap.set(userId, attempts);
    return true;
  }

  attempts.push(now);
  joinRateLimitMap.set(userId, attempts);

  // Periodic cleanup if map grows
  if (joinRateLimitMap.size > 2000) {
    for (const [key, times] of joinRateLimitMap.entries()) {
      const valid = times.filter((t) => now - t < JOIN_WINDOW_MS);
      if (valid.length === 0) joinRateLimitMap.delete(key);
      else joinRateLimitMap.set(key, valid);
    }
  }

  return false;
}

async function resolveAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      try {
        const admin = createAdminClient();
        const { data: { user }, error } = await admin.auth.getUser(token);
        if (!error && user) return user;
      } catch (e) {
        console.warn("[Join Pair API] Bearer token auth error:", e);
      }
    }
  }

  try {
    const sessionSupabase = await createClient();
    const { data: { user } } = await sessionSupabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body.code?.toString().trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: "Please enter an invite code." }, { status: 400 });
    }

    const user = await resolveAuthUser(req);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = user.id;

    // Rate limit check per authenticated user
    if (isJoinRateLimited(userId)) {
      return NextResponse.json(
        { success: false, error: "Too many join attempts. Please wait a minute before trying another invite code." },
        { status: 429 }
      );
    }

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

    if (code === "PAIRFECT2026") {
      return NextResponse.json({
        success: false,
        error: `${code} was the early access beta code, not your partner's invite code! One partner must click "Create a new pair" to generate a 6-character code (e.g. 6VAFPR), and the other partner enters that code here.`,
      }, { status: 400 });
    }

    if (!targetPair) {
      return NextResponse.json({
        success: false,
        error: "Invalid invite code or pair is no longer joinable. Make sure your partner clicked 'Create a new pair' and shared their 6-character code.",
      }, { status: 404 });
    }

    // Check code expiration: pending invite codes expire after 7 days
    if (targetPair.created_at) {
      const codeAge = Date.now() - new Date(targetPair.created_at).getTime();
      if (codeAge > SEVEN_DAYS_MS) {
        return NextResponse.json({
          success: false,
          error: "This invite code has expired (valid for 7 days). Please have your partner cancel it and generate a new code.",
        }, { status: 410 });
      }
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

    // 4. Retrieve vault envelope if available so joining partner automatically receives key
    let vaultEnvelope: string | null = null;
    try {
      const { data: envData } = await adminSupabase.storage
        .from("memories")
        .download(`${targetPair.id}/vault-envelope.json`);
      if (envData) {
        vaultEnvelope = await envData.text();
      }
    } catch (e) {
      console.warn("[Join Pair API] No vault envelope found:", e);
    }

    return NextResponse.json({
      success: true,
      pairId: targetPair.id,
      vaultEnvelope,
      message: "Pair successfully activated!",
    });
  } catch (err: any) {
    console.error("[Join Pair API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error joining pair." }, { status: 500 });
  }
}
