import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const sessionSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { pairId, envelope } = body;

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

    const storagePath = `${pairId}/vault-envelope.json`;
    const envelopeBuffer = Buffer.from(typeof envelope === "string" ? envelope : JSON.stringify(envelope));

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Vault Envelope API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pairId = searchParams.get("pairId");

    if (!pairId) {
      return NextResponse.json({ success: false, error: "Missing pairId." }, { status: 400 });
    }

    const sessionSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
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

    const storagePath = `${pairId}/vault-envelope.json`;
    const { data, error: downloadErr } = await adminSupabase.storage
      .from("memories")
      .download(storagePath);

    if (downloadErr || !data) {
      return NextResponse.json({ success: true, envelope: null });
    }

    const envelopeText = await data.text();
    return NextResponse.json({ success: true, envelope: envelopeText });
  } catch (err: any) {
    console.error("[Vault Envelope API] GET error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}
