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
    const { reason, details } = body || {};

    if (!reason?.trim()) {
      return NextResponse.json({ error: "A report reason is required." }, { status: 400 });
    }

    const { error: insertErr } = await supabase
      .from("story_reports")
      .insert({
        explore_story_id: storyId,
        reporter_user_id: user.id,
        reason: reason.trim(),
        details: details?.trim() || null,
        status: "pending",
      });

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      message: "Thank you. This story has been flagged and submitted to moderation for review.",
    });
  } catch (err: any) {
    console.error("POST /api/stories/[id]/report error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit report." }, { status: 500 });
  }
}
