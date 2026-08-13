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

    const body = await request.json();
    const { reactionType } = body || {}; // 'helped_me', 'relate', 'perspective', 'going_through'

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 });
    }

    // Check existing reaction
    const { data: existing } = await supabase
      .from("story_reactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .eq("reaction_type", reactionType)
      .single();

    let reacted = false;

    if (existing) {
      // Toggle off
      await supabase
        .from("story_reactions")
        .delete()
        .eq("id", existing.id);
      reacted = false;
    } else {
      // Toggle on
      await supabase
        .from("story_reactions")
        .insert({
          user_id: user.id,
          story_id: storyId,
          reaction_type: reactionType,
        });
      reacted = true;
    }

    return NextResponse.json({ success: true, reacted, reactionType });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/react error:", err);
    return NextResponse.json({ success: true, reacted: true });
  }
}
