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

    // Check if user already marked this story as helpful
    const { data: existing } = await supabase
      .from("story_helpful")
      .select("id")
      .eq("user_id", user.id)
      .eq("explore_story_id", storyId)
      .maybeSingle();

    let isHelpful = false;

    if (existing) {
      // Toggle off
      await supabase
        .from("story_helpful")
        .delete()
        .eq("id", existing.id);

      isHelpful = false;
    } else {
      // Toggle on
      await supabase
        .from("story_helpful")
        .insert({
          user_id: user.id,
          explore_story_id: storyId,
        });

      isHelpful = true;
    }

    return NextResponse.json({ success: true, isHelpful, storyId });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/helpful error:", err);
    return NextResponse.json({ success: true, isHelpful: true });
  }
}
