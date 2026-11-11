import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
        console.warn("[Ack Join API] Bearer token auth error:", e);
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
    const { pairId } = body;

    if (!pairId) {
      return NextResponse.json({ success: false, error: "Missing pairId." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify user is a member of this active pair
    const { data: pair, error: pairErr } = await adminSupabase
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .eq("id", pairId)
      .single();

    if (pairErr || !pair) {
      return NextResponse.json({ success: false, error: "Pair not found." }, { status: 404 });
    }

    if (pair.user_a_id !== user.id && pair.user_b_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    // Purge the temporary transport envelope now that client has confirmed receipt and local save
    const pathsToRemove = [
      `${pairId}/transport-envelope.json`,
      `${pairId}/vault-envelope.json`,
    ];

    const { data: removeData, error: removeErr } = await adminSupabase.storage
      .from("memories")
      .remove(pathsToRemove);

    if (removeErr) {
      console.warn("[Ack Join API] Storage delete warning:", removeErr);
    }

    return NextResponse.json({
      success: true,
      message: "Transport envelope purged after client key receipt confirmation.",
      deleted: removeData,
    });
  } catch (err: any) {
    console.error("[Ack Join API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error." }, { status: 500 });
  }
}
