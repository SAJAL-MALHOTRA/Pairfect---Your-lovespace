import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const supabase = await createClient();

    // 1. Verify caller has permission to view the parent story
    const { data: story } = await supabase
      .from("love_stories")
      .select("id")
      .eq("id", storyId)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: "Story not found or unauthorized" }, { status: 404 });
    }

    const { data: responses, error } = await supabase
      .from("story_responses")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ responses: responses || [] });
  } catch (err: any) {
    console.error("GET /api/stories/[id]/responses error:", err);
    return NextResponse.json({ responses: [] });
  }
}

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
    const { content, sharedExperience, isAnonymous } = body || {};

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify caller has permission to access the parent story
    const { data: story } = await supabase
      .from("love_stories")
      .select("id")
      .eq("id", storyId)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: "Story not found or unauthorized" }, { status: 404 });
    }

    const authorDisplay = isAnonymous ? "Anonymous Reader" : (user.user_metadata?.display_name || "Pairfect Reader");

    const { data: response, error: insertErr } = await supabase
      .from("story_responses")
      .insert({
        story_id: storyId,
        author_id: user.id,
        author_display: authorDisplay,
        content: content.trim(),
        shared_experience: sharedExperience ? sharedExperience.trim() : null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/responses error:", err);
    return NextResponse.json({ error: err.message || "Failed to post response" }, { status: 500 });
  }
}
