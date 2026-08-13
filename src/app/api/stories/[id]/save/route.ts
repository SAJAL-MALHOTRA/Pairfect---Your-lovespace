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

    // Check existing save
    const { data: existing } = await supabase
      .from("story_saved")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .single();

    let saved = false;

    if (existing) {
      // Unsave
      await supabase
        .from("story_saved")
        .delete()
        .eq("id", existing.id);
      saved = false;
    } else {
      // Save
      await supabase
        .from("story_saved")
        .insert({
          user_id: user.id,
          story_id: storyId,
        });
      saved = true;
    }

    return NextResponse.json({ success: true, saved });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/save error:", err);
    return NextResponse.json({ success: true, saved: true });
  }
}
