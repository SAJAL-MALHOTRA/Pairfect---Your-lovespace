import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasPlusAccess } from "@/lib/entitlements";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, subscription_tier, subscription_status, subscription_expires_at, subscription_order_id, trial_used, trial_ends_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (!pair) {
      return NextResponse.json({ session: null, isPlus: false });
    }

    const isPlus = hasPlusAccess(pair);

    // 2. Fetch active session if any
    const { data: activeSession } = await supabase
      .from("watch_sessions")
      .select("*")
      .eq("pair_id", pair.id)
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      session: activeSession || null,
      isPlus,
      pairId: pair.id,
    });
  } catch (err: any) {
    console.error("GET /api/watch/session error:", err);
    return NextResponse.json({ session: null, error: err.message || "Failed to check session" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedMode = body.mode === "screenshare" ? "screenshare" : "camera";

    // 1. Fetch active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, subscription_tier, subscription_status, subscription_expires_at, subscription_order_id, trial_used, trial_ends_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (!pair) {
      return NextResponse.json({ error: "Active couple connection required" }, { status: 400 });
    }

    // 2. Plus Tier Gating Check
    const isPlus = hasPlusAccess(pair);
    if (!isPlus) {
      return NextResponse.json({
        error: "Watch Together is a Plus feature",
        requiresPlus: true,
      }, { status: 403 });
    }

    // 3. Check for existing active or waiting session for this couple
    const { data: existingSession } = await supabase
      .from("watch_sessions")
      .select("*")
      .eq("pair_id", pair.id)
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If active session exists:
    if (existingSession) {
      // If partner is joining an existing waiting session started by the other partner, make it active
      if (existingSession.status === "waiting" && existingSession.initiator_id !== user.id) {
        const { data: updated } = await supabase
          .from("watch_sessions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSession.id)
          .select()
          .single();

        return NextResponse.json({
          session: updated || existingSession,
          action: "joined",
        });
      }

      return NextResponse.json({
        session: existingSession,
        action: existingSession.initiator_id === user.id ? "resumed" : "joined",
      });
    }

    // 4. Create new session with status: 'waiting'
    const { data: newSession, error: createErr } = await supabase
      .from("watch_sessions")
      .insert({
        pair_id: pair.id,
        initiator_id: user.id,
        status: "waiting",
        mode: requestedMode,
      })
      .select()
      .single();

    if (createErr || !newSession) {
      console.warn("Failed to create watch_sessions in DB, proceeding with memory session fallback:", createErr);
      // Fallback in case SQL migration hasn't been executed on live DB yet
      const fallbackSession = {
        id: `local-${Date.now()}`,
        pair_id: pair.id,
        initiator_id: user.id,
        status: "waiting",
        mode: requestedMode,
        started_at: new Date().toISOString(),
      };
      return NextResponse.json({ session: fallbackSession, action: "started" });
    }

    // 5. Send live invite notification to partner
    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
    if (partnerId) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      const callerName = userProfile?.display_name || "Your partner";
      const callTypeLabel = requestedMode === "screenshare" ? "screen co-stream" : "video call";

      await supabase.from("notifications").insert({
        pair_id: pair.id,
        recipient_id: partnerId,
        sender_id: user.id,
        type: "game_started",
        title: `${callerName} started Watch Together ▷`,
        body: `Join ${callerName} for a 1:1 ${callTypeLabel} now.`,
        metadata: {
          route: "/watch",
          mode: requestedMode,
          sessionId: newSession.id,
        },
      });
    }

    return NextResponse.json({
      session: newSession,
      action: "started",
    });
  } catch (err: any) {
    console.error("POST /api/watch/session error:", err);
    return NextResponse.json({ error: err.message || "Failed to start session" }, { status: 500 });
  }
}
