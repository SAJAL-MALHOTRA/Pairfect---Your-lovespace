import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomPrompt, BoothStatus } from "@/lib/booth/types";

export const dynamic = "force-dynamic";

async function resolveUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const admin = createAdminClient();
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (!error && user) return user;
    }
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, action, customPrompt, leadTimeMs = 1000 } = body;

    if (!sessionId || !action) {
      return NextResponse.json({ error: "sessionId and action are required." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: session, error: fetchErr } = await admin
      .from("photo_booth_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (fetchErr || !session) {
      return NextResponse.json({ error: "Booth session not found." }, { status: 404 });
    }

    // Verify requesting user is member of this session
    const isMember = session.host_user_id === user.id || session.guest_user_id === user.id;
    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this session." }, { status: 403 });
    }

    const updates: Partial<Record<string, any>> = {};

    switch (action) {
      case "ready":
        updates.status = "READY";
        break;

      case "countdown":
        updates.status = "COUNTDOWN";
        break;

      case "capture": {
        // Compute absolute future timestamp to compensate for network relay
        const captureInstant = new Date(Date.now() + Math.max(500, leadTimeMs)).toISOString();
        updates.status = "CAPTURE";
        updates.capture_at = captureInstant;
        break;
      }

      case "preview":
        updates.status = "PREVIEW";
        updates.capture_at = null;
        break;

      case "next_shot": {
        const nextShotNumber = (session.current_shot || 0) + 1;
        if (nextShotNumber >= (session.total_shots || 4)) {
          updates.status = "FINISHED";
          updates.completed_at = new Date().toISOString();
        } else {
          updates.current_shot = nextShotNumber;
          updates.status = "READY";
          updates.capture_at = null;
          // Addendum 1: Custom prompt or random fallback
          updates.current_prompt = customPrompt?.trim() || getRandomPrompt(session.current_prompt);
        }
        break;
      }

      case "finish":
        updates.status = "FINISHED";
        updates.completed_at = new Date().toISOString();
        break;

      case "expire":
        updates.status = "EXPIRED";
        updates.expires_at = new Date(Date.now() - 1000).toISOString();
        break;

      case "restart":
        updates.status = "READY";
        updates.current_shot = 0;
        updates.capture_at = null;
        updates.current_prompt = customPrompt?.trim() || getRandomPrompt();
        break;

      default:
        return NextResponse.json({ error: `Unsupported state transition '${action}'` }, { status: 400 });
    }

    const { data: updatedSession, error: updateErr } = await admin
      .from("photo_booth_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("*")
      .single();

    if (updateErr) {
      console.error("[Booth State API] Update error:", updateErr);
      return NextResponse.json({ error: "Failed to update booth state." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (err: any) {
    console.error("[Booth State API] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
