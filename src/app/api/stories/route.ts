import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // 'all', 'drafts', 'saved'

    // Fetch active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (!pair) {
      return NextResponse.json({ stories: [], savedStories: [] });
    }

    // 1. Fetch private couple stories for this pair
    let query = supabase
      .from("love_stories")
      .select("*")
      .eq("pair_id", pair.id)
      .order("created_at", { ascending: false });

    if (filter === "drafts") {
      query = query.eq("story_status", "draft");
    }

    const { data: stories, error: storiesErr } = await query;
    if (storiesErr) throw storiesErr;

    // 2. Fetch user's saved stories
    const { data: savedEntries } = await supabase
      .from("story_saved")
      .select("story_id")
      .eq("user_id", user.id);

    const savedIds = (savedEntries || []).map((s: any) => s.story_id);
    let savedStories: any[] = [];

    if (savedIds.length > 0) {
      const { data: savedData } = await supabase
        .from("love_stories")
        .select("*")
        .in("id", savedIds);
      savedStories = savedData || [];
    }

    return NextResponse.json({
      stories: stories || [],
      savedStories: savedStories || [],
      savedIds,
    });
  } catch (err: any) {
    console.error("GET /api/stories error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch stories" }, { status: 500 });
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
      id,
      title,
      content,
      problemStatement,
      quoteExcerpt,
      whatHappened,
      whatMadeDifficult,
      whatWeTried,
      whereAreWeNow,
      whatToTellOthers,
      topicTags,
      relationshipDuration,
      storyStatus, // 'draft' | 'published'
      visibility, // 'private' | 'community'
      isAnonymous,
      coverImageUrl,
    } = body || {};

    if (!title || (!content && !problemStatement)) {
      return NextResponse.json({ error: "Title and content/problem statement are required" }, { status: 400 });
    }

    // Get active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single();

    if (!pair) {
      return NextResponse.json({ error: "No active pair relationship found" }, { status: 400 });
    }

    // Author display text formatting
    const authorDisplay = isAnonymous
      ? `Anonymous Couple · ${relationshipDuration || "Couple"}`
      : `Pairfect Couple · ${relationshipDuration || "Couple"}`;

    const storyPayload = {
      pair_id: pair.id,
      author_id: user.id,
      title: title.trim(),
      content: content ? content.trim() : (problemStatement || title),
      problem_statement: problemStatement ? problemStatement.trim() : null,
      quote_excerpt: quoteExcerpt ? quoteExcerpt.trim() : null,
      what_happened: whatHappened ? whatHappened.trim() : null,
      what_made_difficult: whatMadeDifficult ? whatMadeDifficult.trim() : null,
      what_we_tried: whatWeTried ? whatWeTried.trim() : null,
      where_are_we_now: whereAreWeNow ? whereAreWeNow.trim() : null,
      what_to_tell_others: whatToTellOthers ? whatToTellOthers.trim() : null,
      topic_tags: Array.isArray(topicTags) ? topicTags : [],
      relationship_duration: relationshipDuration || "2 years together",
      story_status: storyStatus || "published",
      visibility: visibility || "private",
      is_anonymous: isAnonymous !== undefined ? isAnonymous : true,
      author_display: authorDisplay,
      cover_image_url: coverImageUrl || null,
    };

    let resultData = null;

    if (id) {
      // Update existing
      const { data: updated, error: updateErr } = await supabase
        .from("love_stories")
        .update(storyPayload)
        .eq("id", id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      resultData = updated;
    } else {
      // Insert new
      const { data: inserted, error: insertErr } = await supabase
        .from("love_stories")
        .insert(storyPayload)
        .select()
        .single();
      if (insertErr) throw insertErr;
      resultData = inserted;
    }

    return NextResponse.json({ success: true, story: resultData });
  } catch (err: any) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json({ error: err.message || "Failed to save story" }, { status: 500 });
  }
}
