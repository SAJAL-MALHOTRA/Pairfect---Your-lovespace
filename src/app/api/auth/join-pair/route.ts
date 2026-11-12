import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Rate limiting: 5 join attempts per minute per user, 10 per minute per IP
const userJoinRateLimitMap = new Map<string, number[]>();
const ipJoinRateLimitMap = new Map<string, number[]>();
const JOIN_WINDOW_MS = 60 * 1000;
const MAX_USER_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 10;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function checkRateLimit(map: Map<string, number[]>, key: string, limit: number): boolean {
  const now = Date.now();
  const attempts = (map.get(key) || []).filter((t) => now - t < JOIN_WINDOW_MS);

  if (attempts.length >= limit) {
    map.set(key, attempts);
    return true;
  }

  attempts.push(now);
  map.set(key, attempts);

  // Periodic cleanup if map grows
  if (map.size > 2000) {
    for (const [k, times] of map.entries()) {
      const valid = times.filter((t) => now - t < JOIN_WINDOW_MS);
      if (valid.length === 0) map.delete(k);
      else map.set(k, valid);
    }
  }

  return false;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown_ip";
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

    const ip = getClientIp(req);
    if (checkRateLimit(ipJoinRateLimitMap, ip, MAX_IP_ATTEMPTS)) {
      return NextResponse.json(
        { success: false, error: "Too many join attempts from this network. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const userId = user.id;

    // Rate limit check per authenticated user
    if (checkRateLimit(userJoinRateLimitMap, userId, MAX_USER_ATTEMPTS)) {
      return NextResponse.json(
        { success: false, error: "Too many join attempts. Please wait a minute before trying another invite code." },
        { status: 429 }
      );
    }

    const adminSupabase = createAdminClient();

    // 0. Idempotent check: if caller is already user_b of an active pair, return transport envelope
    const { data: existingActivePair } = await adminSupabase
      .from("pairs")
      .select("*")
      .eq("user_b_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingActivePair) {
      const resExistingTransport = await (adminSupabase.storage.from("memories") as any)
        .download(`${existingActivePair.id}/transport-envelope.json`, { cacheNonce: Date.now() }, { cache: "no-store" });
      if (resExistingTransport.data && !resExistingTransport.error) {
        const vaultEnvelope = await resExistingTransport.data.text();
        return NextResponse.json(
          {
            success: true,
            pairId: existingActivePair.id,
            vaultEnvelope,
            message: "Retrieved transport envelope for existing active pair.",
          },
          { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
      }
    }

    if (code === "PAIRFECT2026") {
      return NextResponse.json({
        success: false,
        error: "PAIRFECT2026 was the early access beta code, not your partner's invite code! One partner must click 'Create a new pair' to generate an invite, and the other partner enters it here.",
      }, { status: 400 });
    }

    // 1. Look up pending pair by code
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

    // Check code expiration: pending invite codes expire after 48 hours
    const issueTime = targetPair?.invite_issued_at || targetPair?.created_at;
    const isExpired = issueTime ? (Date.now() - new Date(issueTime).getTime() > FORTY_EIGHT_HOURS_MS) : false;

    // 2. Verify proof against pair.invite_verifier
    const LEGACY_TRANSPORT_UNTIL = process.env.LEGACY_TRANSPORT_UNTIL
      ? parseInt(process.env.LEGACY_TRANSPORT_UNTIL, 10)
      : Date.parse("2026-11-20T00:00:00Z");

    const proof = body.proof;
    let isProofValid = false;

    if (targetPair && !isExpired) {
      if (targetPair.invite_verifier) {
        if (proof && typeof proof === "string") {
          try {
            const rawProof = Buffer.from(proof.replace(/-/g, "+").replace(/_/g, "/"), "base64");
            const computedVerifier = crypto
              .createHash("sha256")
              .update(rawProof)
              .digest("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

            const bufComputed = Buffer.from(computedVerifier, "base64url");
            const bufExpected = Buffer.from(targetPair.invite_verifier, "base64url");
            if (bufComputed.length === bufExpected.length && crypto.timingSafeEqual(bufComputed, bufExpected)) {
              isProofValid = true;
            }
          } catch {
            isProofValid = false;
          }
        }
      } else {
        // Pre-v47 legacy pending pair without invite_verifier.
        // Only allow code-only join for pairs whose invite_issued_at is before migration v47 was applied.
        // Newly created pairs post-v47 are strictly required to supply a valid fragment secret proof.
        const V47_CUTOFF_MS = Date.parse("2026-11-12T13:22:22Z");
        const issuedMs = issueTime ? new Date(issueTime).getTime() : 0;
        if (issuedMs > 0 && issuedMs < V47_CUTOFF_MS && Date.now() < LEGACY_TRANSPORT_UNTIL) {
          isProofValid = true;
        }
      }
    }

    if (!targetPair || isExpired || !isProofValid) {
      return NextResponse.json(
        { success: false, error: "invalid_or_expired_invite" },
        { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    // Prevent user from pairing with themselves
    if (targetPair.user_a_id === userId) {
      return NextResponse.json({
        success: false,
        error: "You cannot join your own invite code! Please send this code to your partner to enter on their device.",
      }, { status: 400 });
    }

    // 3. Clean up any unjoined pending pairs created by the joining user
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

    // 4. Retrieve temporary transport envelope if available so joining partner automatically receives key
    let vaultEnvelope: string | null = null;
    try {
      let envData: any = null;
      let pathToDelete: string | null = null;

      // Check transport-envelope.json first
      const resTransport = await (adminSupabase.storage.from("memories") as any)
        .download(`${targetPair.id}/transport-envelope.json`, { cacheNonce: Date.now() }, { cache: "no-store" });
      if (resTransport.data && !resTransport.error) {
        envData = resTransport.data;
        pathToDelete = `${targetPair.id}/transport-envelope.json`;
      } else {
        // Fallback to legacy vault-envelope.json for older pairs
        const resLegacy = await (adminSupabase.storage.from("memories") as any)
          .download(`${targetPair.id}/vault-envelope.json`, { cacheNonce: Date.now() }, { cache: "no-store" });
        if (resLegacy.data && !resLegacy.error) {
          envData = resLegacy.data;
          pathToDelete = `${targetPair.id}/vault-envelope.json`;
        }
      }

      if (envData && pathToDelete) {
        vaultEnvelope = await envData.text();
        // Transport envelope deletion is deferred to POST /api/vault/envelope/ack-join
        // to ensure the joining client successfully unwraps and saves the key to IndexedDB
        // before the server removes the transport blob.
      }
    } catch (e) {
      console.warn("[Join Pair API] No transport envelope found:", e);
    }

    return NextResponse.json(
      {
        success: true,
        pairId: targetPair.id,
        vaultEnvelope,
        message: "Pair successfully activated!",
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    console.error("[Join Pair API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error joining pair." }, { status: 500 });
  }
}
