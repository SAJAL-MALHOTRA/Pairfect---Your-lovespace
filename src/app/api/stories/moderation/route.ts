import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch pending explore stories
    const { data: pendingStories, error: pendingErr } = await supabase
      .from("explore_stories")
      .select("*")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });

    // 2. Fetch pending reports
    const { data: reports, error: reportsErr } = await supabase
      .from("story_reports")
      .select("*, explore_stories (*)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      pendingStories: pendingStories || [],
      reports: reports || [],
    });
  } catch (err: any) {
    console.error("GET /api/stories/moderation error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch moderation queue" }, { status: 500 });
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
    const { action, storyId, reportId, status } = body || {};

    if (action === "review_story") {
      if (!storyId || !["live", "rejected"].includes(status)) {
        return NextResponse.json({ error: "Invalid review parameters" }, { status: 400 });
      }

      // Update explore story
      const { data: updatedStory, error: storyErr } = await supabase
        .from("explore_stories")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", storyId)
        .select()
        .single();

      if (storyErr) throw storyErr;

      // Also update linked chapter if exists
      if (updatedStory?.source_chapter_id) {
        await supabase
          .from("story_chapters")
          .update({ explore_status: status })
          .eq("id", updatedStory.source_chapter_id);
      }

      return NextResponse.json({ success: true, story: updatedStory });
    }

    if (action === "review_report") {
      if (!reportId || !["resolved", "dismissed"].includes(status)) {
        return NextResponse.json({ error: "Invalid report parameters" }, { status: 400 });
      }

      const { data: updatedReport, error: repErr } = await supabase
        .from("story_reports")
        .update({ status })
        .eq("id", reportId)
        .select()
        .single();

      if (repErr) throw repErr;

      return NextResponse.json({ success: true, report: updatedReport });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/stories/moderation error:", err);
    return NextResponse.json({ error: err.message || "Failed to process moderation action" }, { status: 500 });
  }
}
