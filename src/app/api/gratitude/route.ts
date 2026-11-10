import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId");

    if (!pairId) {
      return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
    }

    let activeDb = supabase;
    if (!user) {
      try {
        activeDb = createAdminClient();
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { data: notes, error: selectErr } = await activeDb
      .from("gratitude_entries")
      .select("*")
      .eq("pair_id", pairId)
      .order("created_at", { ascending: false });

    if (selectErr) throw selectErr;

    // Decrypt content field for each gratitude entry
    const decryptedNotes = (notes || []).map((note: any) => {
      let decryptedContent = note.content;
      if (typeof note.content === "string") {
        try {
          const res = decrypt(note.content);
          decryptedContent = (typeof res === "string" && res.startsWith("enc:")) ? "A note of gratitude shared with love ♡" : res;
        } catch (e) {
          console.error("Failed to decrypt gratitude note content:", e);
          decryptedContent = "A note of gratitude shared with love ♡";
        }
      }
      return { ...note, content: decryptedContent || "A note of gratitude shared with love ♡" };
    });

    return NextResponse.json(decryptedNotes);
  } catch (err: any) {
    console.error("GET gratitude error:", err);
    return NextResponse.json({ error: err.message || "Failed to load gratitude notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { pairId, content, senderName } = body;

    if (!pairId || !content || !content.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let activeDb = supabase;
    let effectiveUserId = user?.id;

    if (!user) {
      try {
        const adminDb = createAdminClient();
        const { data: pairData } = await adminDb
          .from("pairs")
          .select("id, user_a_id, user_b_id")
          .eq("id", pairId)
          .single();

        if (!pairData) {
          return NextResponse.json({ error: "Pair not found" }, { status: 404 });
        }
        activeDb = adminDb;
        effectiveUserId = pairData.user_b_id || pairData.user_a_id;
      } catch (adminErr) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rawText = content.trim();
    // Encrypt the gratitude note content using AES-256-CBC
    const ciphertext = encrypt(rawText);

    const { data: note, error: insertErr } = await activeDb
      .from("gratitude_entries")
      .insert({
        pair_id: pairId,
        user_id: effectiveUserId,
        content: ciphertext,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Fetch pair info for partner notification & activity record
    const { data: pair } = await activeDb
      .from("pairs")
      .select("user_a_id, user_b_id")
      .eq("id", pairId)
      .single();

    if (pair) {
      const partnerId = pair.user_a_id === effectiveUserId ? pair.user_b_id : pair.user_a_id;
      if (partnerId) {
        let senderLabel = senderName;
        if (!senderLabel && user) {
          const { data: senderProfile } = await activeDb
            .from("users")
            .select("display_name")
            .eq("id", user.id)
            .single();
          senderLabel = senderProfile?.display_name || "Your partner";
        }
        senderLabel = senderLabel || "Your partner";

        await activeDb.from("notifications").insert({
          pair_id: pairId,
          recipient_id: partnerId,
          sender_id: effectiveUserId,
          type: "gratitude_note",
          title: `${senderLabel} dropped a gratitude note in your jar 🎁`,
          body: `"${rawText.slice(0, 60)}${rawText.length > 60 ? "..." : ""}"`,
        });
      }
      try {
        await activeDb.rpc("record_pair_activity", { p_pair_id: pairId });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      note: {
        ...note,
        content: rawText, // Return decrypted text to submitting client
      },
    });
  } catch (err: any) {
    console.error("POST gratitude error:", err);
    return NextResponse.json({ error: err.message || "Failed to drop gratitude note" }, { status: 500 });
  }
}
