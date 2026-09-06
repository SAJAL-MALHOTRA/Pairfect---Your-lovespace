import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomPrompt } from "@/lib/booth/types";

export const dynamic = "force-dynamic";

function generateBoothCode(length = 4): string {
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 chars without 0/O/1/I
  let code = "";
  const randomValues = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < length; i++) {
    code += charset[randomValues[i] % charset.length];
  }
  return code;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const sessionId = searchParams.get("id")?.trim();

    if (!code && !sessionId) {
      return NextResponse.json({ error: "Provide code or id parameter" }, { status: 400 });
    }

    const admin = createAdminClient();
    let query = admin.from("photo_booth_sessions").select("*");

    if (code) {
      query = query.eq("booth_code", code);
    } else if (sessionId) {
      query = query.eq("id", sessionId);
    }

    const { data: session, error } = await query.maybeSingle();

    if (error) {
      console.error("[Booth API] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: "Booth session not found" }, { status: 404 });
    }

    // Also fetch any shots taken for this session
    const { data: shots } = await admin
      .from("photo_booth_shots")
      .select("*")
      .eq("session_id", session.id)
      .order("shot_number", { ascending: true });

    return NextResponse.json({ session, shots: shots || [] });
  } catch (err: any) {
    console.error("[Booth API] GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch session" }, { status: 500 });
  }
}

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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";
    const admin = createAdminClient();

    // ──────────────────────────────────────────
    // ACTION: JOIN SESSION
    // ──────────────────────────────────────────
    if (action === "join") {
      const inputCode = body.code?.toString().trim().toUpperCase();
      if (!inputCode) {
        return NextResponse.json({ error: "Please provide a booth code." }, { status: 400 });
      }

      // Fetch pending session
      const { data: targetSession, error: fetchErr } = await admin
        .from("photo_booth_sessions")
        .select("*")
        .eq("booth_code", inputCode)
        .neq("status", "EXPIRED")
        .maybeSingle();

      if (fetchErr || !targetSession) {
        return NextResponse.json(
          { error: "Invalid booth code or the session has ended." },
          { status: 404 }
        );
      }

      // If user is host returning to their own booth
      if (targetSession.host_user_id === user.id) {
        return NextResponse.json({
          session: targetSession,
          isHost: true,
          message: "Rejoined your booth session as host.",
        });
      }

      // If session is already full with another guest
      if (
        targetSession.guest_user_id &&
        targetSession.guest_user_id !== user.id &&
        targetSession.status !== "WAITING"
      ) {
        return NextResponse.json(
          { error: "This booth session is already full." },
          { status: 409 }
        );
      }

      // Join as guest and advance to PARTNER_JOINED
      const { data: updatedSession, error: updateErr } = await admin
        .from("photo_booth_sessions")
        .update({
          guest_user_id: user.id,
          status: targetSession.status === "WAITING" ? "PARTNER_JOINED" : targetSession.status,
        })
        .eq("id", targetSession.id)
        .select("*")
        .single();

      if (updateErr) {
        console.error("[Booth API] Join update error:", updateErr);
        return NextResponse.json({ error: "Failed to join session." }, { status: 500 });
      }

      return NextResponse.json({
        session: updatedSession,
        isHost: false,
        message: "Successfully joined booth session!",
      });
    }

    // ──────────────────────────────────────────
    // ACTION: CREATE SESSION (With Retry on Collision)
    // ──────────────────────────────────────────
    if (action === "create") {
      const { layoutStyle = "strip_4", perspective = "SIDE_BY_SIDE", totalShots = 4, customPrompt } = body;

      // Find user's active pair if available
      const { data: pairData } = await admin
        .from("pairs")
        .select("id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      const pairId = pairData?.id || null;
      const initialPrompt = customPrompt?.trim() || getRandomPrompt();

      let createdSession = null;
      let lastInsertError: any = null;
      const maxRetries = 5;

      // Retry loop to handle any unique code collision
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const candidateCode = generateBoothCode(4);

        const { data: inserted, error: insertErr } = await admin
          .from("photo_booth_sessions")
          .insert({
            pair_id: pairId,
            host_user_id: user.id,
            booth_code: candidateCode,
            status: "WAITING",
            current_shot: 0,
            total_shots: Number(totalShots) || 4,
            current_prompt: initialPrompt,
            layout_style: layoutStyle,
            perspective: perspective,
          })
          .select("*")
          .single();

        if (!insertErr && inserted) {
          createdSession = inserted;
          break;
        }

        // If duplicate code constraint hit, loop will generate a fresh code
        lastInsertError = insertErr;
        console.warn(`[Booth API] Code collision on '${candidateCode}', retrying (${attempt + 1}/${maxRetries})...`);
      }

      if (!createdSession) {
        console.error("[Booth API] Failed to create session after retries:", lastInsertError);
        return NextResponse.json(
          { error: "Could not allocate a unique booth code. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        session: createdSession,
        boothCode: createdSession.booth_code,
        isHost: true,
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("[Booth API] POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
