import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairIdParam = searchParams.get("pairId");

    let pairId = pairIdParam;

    if (!pairId) {
      const { data: pairData } = await supabase
        .from("pairs")
        .select("id, user_a_id, user_b_id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      pairId = pairData?.id || null;
    }

    if (!pairId) {
      return NextResponse.json([]);
    }

    // Try selecting from whispers table using admin client to ensure active pair members can read all whispers
    try {
      const admin = createAdminClient();
      const { data: whispers, error: selectErr } = await admin
        .from("whispers")
        .select("*")
        .eq("pair_id", pairId)
        .order("created_at", { ascending: false });

      if (selectErr) {
        console.warn("Whispers table query warning:", selectErr.message);
        return NextResponse.json([]);
      }

      const sanitized = (whispers || []).map((w: any) => ({
        ...w,
        frequency: typeof w.frequency === "number" && !isNaN(w.frequency) ? w.frequency : parseFloat(String(w.frequency)) || 91.7,
        duration: typeof w.duration === "number" && !isNaN(w.duration) ? w.duration : parseFloat(String(w.duration)) || 0,
      }));

      return NextResponse.json(sanitized);
    } catch {
      return NextResponse.json([]);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load whispers";
    console.error("GET /api/whisper error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pairId,
      frequency = 91.7,
      title = "Sweet Whisper",
      audioData,
      duration = 0,
      moodTag = "romantic",
      senderName = "Partner",
    } = body;

    if (!pairId || !audioData) {
      return NextResponse.json(
        { error: "Pair ID and audio data are required." },
        { status: 400 }
      );
    }

    let finalAudioUrl = audioData;

    // Optional: Upload to Supabase Storage if base64 provided
    if (typeof audioData === "string" && audioData.startsWith("data:audio")) {
      try {
        const admin = createAdminClient();
        const commaIdx = audioData.indexOf(",");
        const base64Content = commaIdx !== -1 ? audioData.slice(commaIdx + 1) : audioData;
        const buffer = Buffer.from(base64Content, "base64");

        if (buffer.length < 200) {
          return NextResponse.json(
            { error: "Audio data is too small or corrupt. Please re-record." },
            { status: 400 }
          );
        }

        // Determine content type and appropriate extension
        let contentType = "audio/webm";
        const mimeMatch = audioData.match(/^data:([^;]+)/);
        if (mimeMatch && mimeMatch[1]) {
          contentType = mimeMatch[1];
        }

        const ext = contentType.includes("mp4") ? "mp4" : contentType.includes("ogg") ? "ogg" : "webm";
        const filePath = `${pairId}/whispers/whisper_${Date.now()}_${user.id.slice(0, 6)}.${ext}`;

        const { data: uploadData, error: uploadErr } = await admin.storage
          .from("memories")
          .upload(filePath, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadErr && uploadData?.path) {
          const { data: signedData } = await admin.storage
            .from("memories")
            .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365); // 1 year

          if (signedData?.signedUrl) {
            finalAudioUrl = signedData.signedUrl;
          }
        } else if (uploadErr) {
          console.warn("Storage upload error:", uploadErr.message);
        }
      } catch (uploadCatch) {
        console.warn("Storage upload fallback to payload:", uploadCatch);
      }
    }

    // Insert into whispers table with admin client
    try {
      const admin = createAdminClient();
      const { data: newWhisper, error: insertErr } = await admin
        .from("whispers")
        .insert({
          pair_id: pairId,
          sender_id: user.id,
          sender_name: senderName,
          frequency: Number(frequency),
          title: title.trim().slice(0, 80),
          audio_url: finalAudioUrl,
          duration: Number(duration) || 0,
          mood_tag: moodTag,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Whispers DB insert error:", insertErr.message);
        return NextResponse.json({ error: "Failed to save whisper: " + insertErr.message }, { status: 500 });
      }

      const sanitizedWhisper = newWhisper ? {
        ...newWhisper,
        frequency: typeof newWhisper.frequency === "number" && !isNaN(newWhisper.frequency) ? newWhisper.frequency : parseFloat(String(newWhisper.frequency)) || 91.7,
        duration: typeof newWhisper.duration === "number" && !isNaN(newWhisper.duration) ? newWhisper.duration : parseFloat(String(newWhisper.duration)) || 0,
      } : null;

      return NextResponse.json({ success: true, whisper: sanitizedWhisper });
    } catch (insertCatch: unknown) {
      const msg = insertCatch instanceof Error ? insertCatch.message : "Failed to broadcast voice note";
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to broadcast whisper";
    console.error("POST /api/whisper error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, listened = true } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Whisper ID is required" }, { status: 400 });
    }

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("whispers")
        .update({ listened_at: listened ? new Date().toISOString() : null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, whisper: data });
    } catch {
      return NextResponse.json({ success: true, id, listened_at: new Date().toISOString() });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update whisper";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Whisper ID is required" }, { status: 400 });
    }

    try {
      const admin = createAdminClient();
      await admin
        .from("whispers")
        .delete()
        .eq("id", id)
        .eq("sender_id", user.id);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete whisper";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
