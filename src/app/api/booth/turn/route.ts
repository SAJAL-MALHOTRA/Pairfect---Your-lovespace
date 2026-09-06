import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FALLBACK_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * Returns ephemeral ICE/TURN server credentials.
 * 
 * Enforces server-side authentication: Requesting user MUST be an active host or guest
 * in the specified photo booth session before any TURN quota is consumed.
 */
async function resolveUser(req: Request) {
  // Check Authorization Bearer token first
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const admin = createAdminClient();
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (!error && user) return user;
    }
  }

  // Fallback to cookie-based session
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

async function handleTurnRequest(req: Request) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let sessionId = url.searchParams.get("sessionId");

    if (!sessionId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      sessionId = body.sessionId;
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required to mint TURN credentials." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Verify user is active participant in non-expired session
    const { data: session, error: sessionErr } = await admin
      .from("photo_booth_sessions")
      .select("id, host_user_id, guest_user_id, status, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (session.status === "EXPIRED" || (session.expires_at && new Date(session.expires_at) < new Date())) {
      return NextResponse.json({ error: "Session has expired." }, { status: 410 });
    }

    const isAuthorized = session.host_user_id === user.id || session.guest_user_id === user.id;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You are not an authorized member of this booth session." },
        { status: 403 }
      );
    }

    // 2. Fetch Metered TURN credentials if configured
    const meteredDomain = process.env.METERED_DOMAIN?.trim();
    const meteredApiKey = process.env.METERED_SECRET_KEY?.trim();

    if (meteredDomain && meteredApiKey) {
      try {
        const response = await fetch(
          `https://${meteredDomain}/api/v1/turn/credentials?apiKey=${meteredApiKey}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (response.ok) {
          const iceServers = await response.json();
          if (Array.isArray(iceServers) && iceServers.length > 0) {
            return NextResponse.json({
              iceServers,
              provider: "metered",
            });
          }
        } else {
          console.warn("[TURN API] Metered API responded with status:", response.status);
        }
      } catch (turnErr) {
        console.error("[TURN API] Error fetching Metered TURN credentials:", turnErr);
      }
    }

    // 3. Fallback to public STUN servers if TURN is not yet configured in environment
    return NextResponse.json({
      iceServers: FALLBACK_STUN_SERVERS,
      provider: "stun_fallback",
      warning: "Metered TURN credentials not configured in .env.local; using Google STUN fallback.",
    });
  } catch (err: any) {
    console.error("[TURN API] Internal error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleTurnRequest(req);
}

export async function POST(req: Request) {
  return handleTurnRequest(req);
}
