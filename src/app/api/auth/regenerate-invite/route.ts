import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Rate limit: 5 regenerations per hour per user
const regenerateRateLimitMap = new Map<string, number[]>();
const REGENERATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_REGENERATE_PER_HOUR = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (regenerateRateLimitMap.get(userId) || []).filter(
    (t) => now - t < REGENERATE_WINDOW_MS
  );
  if (timestamps.length >= MAX_REGENERATE_PER_HOUR) {
    regenerateRateLimitMap.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  regenerateRateLimitMap.set(userId, timestamps);
  return false;
}

function generateLookupCode(length = 6): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // exclude 0/O, 1/I/L
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(0, chars.length)];
  }
  return result;
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
        console.warn("[Regenerate Invite API] Bearer auth error:", e);
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
    const user = await resolveAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    if (checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: "Too many invite regenerations. Maximum 5 per hour." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { pairId, verifier, envelope } = body;

    if (!pairId || !verifier || !envelope) {
      return NextResponse.json(
        { success: false, error: "Missing pairId, verifier, or envelope." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch pair and verify user is user_a
    const { data: pair, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("*")
      .eq("id", pairId)
      .single();

    if (pairErr || !pair) {
      return NextResponse.json({ success: false, error: "Pair not found." }, { status: 404 });
    }

    if (pair.user_a_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only the pair creator (Partner A) can regenerate invites." },
        { status: 403 }
      );
    }

    // 2. Allowed only when pair is pending OR active with transport envelope unacked
    if (pair.status === "active") {
      const resTransport = await (adminSupabase.storage.from("memories") as any)
        .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() }, { cache: "no-store" });
      if (resTransport.error || !resTransport.data) {
        return NextResponse.json(
          { success: false, error: "Invite already acknowledged and finalized by partner. Cannot regenerate." },
          { status: 400 }
        );
      }
    } else if (pair.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Cannot regenerate invite for this pair status." },
        { status: 400 }
      );
    }

    // 3. Validate envelope (must be v3 and size < 1KB)
    const envObj = typeof envelope === "string" ? JSON.parse(envelope) : envelope;
    if (envObj.v !== 3 || envObj.type !== "transport") {
      return NextResponse.json(
        { success: false, error: "Expected v=3 transport envelope." },
        { status: 400 }
      );
    }

    const envelopeBuffer = Buffer.from(typeof envelope === "string" ? envelope : JSON.stringify(envelope));
    if (envelopeBuffer.byteLength > 1024) {
      return NextResponse.json(
        { success: false, error: "Transport envelope exceeds 1 KB size limit." },
        { status: 400 }
      );
    }

    // 4. Generate fresh 6-character code
    let newCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateLookupCode(6);
      const { data: existing } = await adminSupabase
        .from("pairs")
        .select("id")
        .eq("invite_code", candidate)
        .eq("status", "pending")
        .maybeSingle();
      if (!existing) {
        newCode = candidate;
        break;
      }
    }
    if (!newCode) newCode = generateLookupCode(6);

    // 5. Update pair columns under service_role
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      invite_code: newCode,
      invite_verifier: verifier,
      invite_issued_at: nowIso,
    };

    let { error: updateErr } = await adminSupabase
      .from("pairs")
      .update(updatePayload)
      .eq("id", pairId);

    // Graceful backward compatibility if migration v47 columns have not yet been created in DB
    if (updateErr && updateErr.message?.includes("column of 'pairs' in the schema cache")) {
      const fallbackRes = await adminSupabase
        .from("pairs")
        .update({ invite_code: newCode })
        .eq("id", pairId);
      updateErr = fallbackRes.error;
    }

    if (updateErr) {
      console.error("[Regenerate Invite API] Update error:", updateErr);
      return NextResponse.json({ success: false, error: updateErr.message || "Failed to update pair invite." }, { status: 500 });
    }

    // 6. Overwrite transport-envelope.json in storage
    const { error: uploadErr } = await adminSupabase.storage
      .from("memories")
      .upload(`${pairId}/transport-envelope.json`, envelopeBuffer, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[Regenerate Invite API] Upload error:", uploadErr);
      return NextResponse.json({ success: false, error: "Failed to persist new transport envelope." }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        code: newCode,
        message: "Invite code successfully regenerated.",
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    console.error("[Regenerate Invite API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}
