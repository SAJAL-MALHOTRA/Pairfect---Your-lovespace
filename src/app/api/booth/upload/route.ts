import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, shotNumber, imageData } = body;

    if (!sessionId || shotNumber === undefined || !imageData) {
      return NextResponse.json(
        { error: "sessionId, shotNumber, and imageData are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch and verify session membership
    const { data: session, error: sessionErr } = await admin
      .from("photo_booth_sessions")
      .select("id, pair_id, host_user_id, guest_user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Booth session not found." }, { status: 404 });
    }

    const isMember = session.host_user_id === user.id || session.guest_user_id === user.id;
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized for this session." }, { status: 403 });
    }

    let finalImageUrl = imageData;

    // 2. Upload to Supabase Storage
    // Addendum 5: When pair_id is null, fall back to unpaired/{session_id}/
    try {
      const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Content, "base64");

      const folderPrefix = session.pair_id
        ? `${session.pair_id}/booth/${session.id}`
        : `unpaired/${session.id}/booth`;

      const fileName = `shot_${shotNumber}_${user.id}_${Date.now()}.jpg`;
      const filePath = `${folderPrefix}/${fileName}`;

      const { data: uploadData, error: uploadErr } = await admin.storage
        .from("memories")
        .upload(filePath, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadErr && uploadData?.path) {
        // The memories bucket is private - use signed URLs instead of public URLs
        const { data: signedUrlData, error: signedUrlErr } = await admin.storage
          .from("memories")
          .createSignedUrl(uploadData.path, 60 * 60 * 24 * 7); // 7 days

        if (!signedUrlErr && signedUrlData?.signedUrl) {
          finalImageUrl = signedUrlData.signedUrl;
        } else {
          // Fallback: try public URL (works if bucket is made public later)
          const { data: publicUrlData } = admin.storage
            .from("memories")
            .getPublicUrl(uploadData.path);
          if (publicUrlData?.publicUrl) {
            finalImageUrl = publicUrlData.publicUrl;
          }
        }
      } else if (uploadErr) {
        console.warn("[Booth Upload] Storage bucket upload warning (using data URL fallback):", uploadErr.message);
      }
    } catch (storageErr) {
      console.warn("[Booth Upload] Storage upload exception (using data URL fallback):", storageErr);
    }

    // 3. Save shot record to photo_booth_shots
    const { data: shotRecord, error: insertErr } = await admin
      .from("photo_booth_shots")
      .insert({
        session_id: session.id,
        shot_number: Number(shotNumber),
        user_id: user.id,
        image_url: finalImageUrl,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.warn("[Booth Upload] photo_booth_shots insert warning:", insertErr.message);
    }

    return NextResponse.json({
      success: true,
      shot: shotRecord || {
        session_id: session.id,
        shot_number: shotNumber,
        user_id: user.id,
        image_url: finalImageUrl,
      },
      imageUrl: finalImageUrl,
    });
  } catch (err: any) {
    console.error("[Booth Upload] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
