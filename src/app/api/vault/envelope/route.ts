import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        console.warn("[Vault Envelope API] Bearer token auth error:", e);
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

    const body = await req.json();
    const { pairId, envelope, type } = body;

    if (!pairId || !envelope) {
      return NextResponse.json({ success: false, error: "Missing pairId or envelope payload." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify user is member of this pair
    const { data: pair, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .eq("id", pairId)
      .single();

    if (pairErr || !pair) {
      return NextResponse.json({ success: false, error: "Pair not found." }, { status: 404 });
    }

    if (pair.user_a_id !== user.id && pair.user_b_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden. Not a member of this pair." }, { status: 403 });
    }

    let envelopeObj: any = null;
    try {
      envelopeObj = typeof envelope === "string" ? JSON.parse(envelope) : envelope;
    } catch {}

    const isRecovery =
      type === "recovery" ||
      envelopeObj?.type === "bip39_recovery_envelope" ||
      envelopeObj?.v === 2;

    const envelopeBuffer = Buffer.from(typeof envelope === "string" ? envelope : JSON.stringify(envelope));

    // Validate transport envelope requirements
    if (!isRecovery) {
      if (envelopeBuffer.byteLength > 1024) {
        return NextResponse.json(
          { success: false, error: "Transport envelope exceeds 1 KB size limit." },
          { status: 400 }
        );
      }

      const LEGACY_TRANSPORT_UNTIL = process.env.LEGACY_TRANSPORT_UNTIL
        ? parseInt(process.env.LEGACY_TRANSPORT_UNTIL, 10)
        : (Date.now() + 48 * 60 * 60 * 1000);

      const isValidB64Url = (s: any) => typeof s === "string" && s.length > 0 && /^[A-Za-z0-9_-]+$/.test(s);

      if (envelopeObj?.v === 3) {
        if (
          envelopeObj.type !== "transport" ||
          envelopeObj.alg !== "AES-256-GCM" ||
          !envelopeObj.kdf ||
          envelopeObj.kdf.name !== "HKDF-SHA-256" ||
          !isValidB64Url(envelopeObj.kdf.salt) ||
          !isValidB64Url(envelopeObj.iv) ||
          !isValidB64Url(envelopeObj.ct)
        ) {
          return NextResponse.json(
            { success: false, error: "Invalid v3 transport envelope payload structure." },
            { status: 400 }
          );
        }
      } else if (envelopeObj?.v === 1 || !envelopeObj?.v) {
        if (Date.now() >= LEGACY_TRANSPORT_UNTIL) {
          return NextResponse.json(
            { success: false, error: "Legacy v1 transport envelopes are deprecated and no longer accepted." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: "Unsupported transport envelope version." },
          { status: 400 }
        );
      }
    }

    const filename = isRecovery ? "recovery-envelope.json" : "transport-envelope.json";
    const storagePath = `${pairId}/${filename}`;

    const { error: uploadErr } = await adminSupabase.storage
      .from("memories")
      .upload(storagePath, envelopeBuffer, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[Vault Envelope API] Upload error:", uploadErr);
      return NextResponse.json({ success: false, error: "Failed to persist vault envelope." }, { status: 500 });
    }

    if (isRecovery) {
      // Clean up legacy pre-v46 envelope once a 128-bit recovery envelope is established.
      // For active pairs where both partners already joined, transport envelope is also safely removed.
      // For pending pairs, transport envelope must remain until partner B joins and acknowledges.
      const filesToRemove = [`${pairId}/vault-envelope.json`];
      if (pair.status === "active") {
        filesToRemove.push(`${pairId}/transport-envelope.json`);
      }
      await adminSupabase.storage
        .from("memories")
        .remove(filesToRemove);
    }

    return NextResponse.json(
      { success: true, type: isRecovery ? "recovery" : "transport" },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    console.error("[Vault Envelope API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pairId = searchParams.get("pairId");
    const requestedType = searchParams.get("type"); // "recovery" | "transport" | null

    if (!pairId) {
      return NextResponse.json({ success: false, error: "Missing pairId." }, { status: 400 });
    }

    const user = await resolveAuthUser(req);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Verify membership
    const { data: pair, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("id, user_a_id, user_b_id")
      .eq("id", pairId)
      .single();

    if (pairErr || !pair) {
      return NextResponse.json({ success: false, error: "Pair not found." }, { status: 404 });
    }

    if (pair.user_a_id !== user.id && pair.user_b_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    let storagePath = `${pairId}/recovery-envelope.json`;
    if (requestedType === "transport") {
      storagePath = `${pairId}/transport-envelope.json`;
    }

    let downloadResult = await (adminSupabase.storage
      .from("memories") as any)
      .download(storagePath, { cacheNonce: Date.now() }, { cache: "no-store" });

    // Fallbacks if not found at specific path
    if (downloadResult.error || !downloadResult.data) {
      if (!requestedType || requestedType === "recovery") {
        const fallbackPaths = [`${pairId}/transport-envelope.json`, `${pairId}/vault-envelope.json`];
        for (const p of fallbackPaths) {
          const fb = await (adminSupabase.storage
            .from("memories") as any)
            .download(p, { cacheNonce: Date.now() }, { cache: "no-store" });
          if (fb.data && !fb.error) {
            downloadResult = fb;
            break;
          }
        }
      } else if (requestedType === "transport") {
        const fb = await (adminSupabase.storage
          .from("memories") as any)
          .download(`${pairId}/vault-envelope.json`, { cacheNonce: Date.now() }, { cache: "no-store" });
        if (fb.data && !fb.error) {
          downloadResult = fb;
        }
      }
    }

    if (downloadResult.error || !downloadResult.data) {
      return NextResponse.json(
        { success: true, envelope: null },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const envelopeText = await downloadResult.data.text();
    return NextResponse.json(
      { success: true, envelope: envelopeText },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    console.error("[Vault Envelope API] GET error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pairId = searchParams.get("pairId");
    const requestedType = searchParams.get("type"); // "recovery" | "transport" | "all"

    if (!pairId) {
      return NextResponse.json({ success: false, error: "Missing pairId." }, { status: 400 });
    }

    const user = await resolveAuthUser(req);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Verify membership
    const { data: pair, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("id, user_a_id, user_b_id")
      .eq("id", pairId)
      .single();

    if (pairErr || !pair) {
      return NextResponse.json({ success: false, error: "Pair not found." }, { status: 404 });
    }

    if (pair.user_a_id !== user.id && pair.user_b_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    let pathsToRemove: string[] = [];
    if (requestedType === "transport") {
      pathsToRemove = [`${pairId}/transport-envelope.json`];
    } else {
      // Purge all envelope types (recovery, legacy, and transport) to leave zero envelope artifacts on server
      pathsToRemove = [
        `${pairId}/recovery-envelope.json`,
        `${pairId}/vault-envelope.json`,
        `${pairId}/transport-envelope.json`,
      ];
    }

    const { data: removeData, error: removeErr } = await adminSupabase.storage
      .from("memories")
      .remove(pathsToRemove);

    if (removeErr) {
      console.error("[Vault Envelope API] Storage delete error:", removeErr);
      return NextResponse.json({ success: false, error: removeErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Vault envelope purged from server storage. Device-only mode active.",
      deleted: removeData,
    });
  } catch (err: any) {
    console.error("[Vault Envelope API] DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}
