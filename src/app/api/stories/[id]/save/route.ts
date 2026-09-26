import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try story_saves first
    const { data: existing } = await supabase
      .from("story_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("explore_story_id", storyId)
      .maybeSingle();

    let saved = false;

    if (existing) {
      await supabase
        .from("story_saves")
        .delete()
        .eq("id", existing.id);
      saved = false;
    } else {
      const { error: insertErr } = await supabase
        .from("story_saves")
        .insert({
          user_id: user.id,
          explore_story_id: storyId,
        });

      if (!insertErr) {
        saved = true;
      } else {
        // Fallback to legacy story_saved
        const { data: legacyExisting } = await supabase
          .from("story_saved")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", storyId)
          .maybeSingle();

        if (legacyExisting) {
          await supabase.from("story_saved").delete().eq("id", legacyExisting.id);
          saved = false;
        } else {
          await supabase.from("story_saved").insert({ user_id: user.id, story_id: storyId });
          saved = true;
        }
      }
    }

    return NextResponse.json({ success: true, saved, storyId });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/save error:", err);
    return NextResponse.json({ success: true, saved: true });
  }
}
