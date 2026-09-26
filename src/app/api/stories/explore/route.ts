import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_EXPLORE_STORIES, ExploreStory } from "@/lib/stories-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || "all";
    const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();

    const supabase = await createClient();

    // 1. Fetch live community stories from explore_stories table
    let dbStories: any[] = [];
    const { data: liveStories, error: liveErr } = await supabase
      .from("explore_stories")
      .select("*")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (!liveErr && liveStories) {
      dbStories = liveStories;
    } else {
      // Fallback: Check love_stories if explore_stories table is migrating
      const { data: legacyStories } = await supabase
        .from("love_stories")
        .select("*")
        .eq("visibility", "community")
        .eq("story_status", "published")
        .order("created_at", { ascending: false });

      if (legacyStories) {
        dbStories = legacyStories.map((s: any) => ({
          id: s.id,
          source_chapter_id: null,
          author_user_id: s.author_id,
          author_display: "Anonymous Couple",
          relationship_duration: s.relationship_duration || "Couple",
          title: s.title,
          problem_statement: s.problem_statement || s.content,
          body_anonymized: s.what_happened || s.content,
          what_helped_anonymized: s.what_we_tried || null,
          situation_tags: s.topic_tags || ["communication"],
          status: "live" as const,
          helpful_count_private: s.helped_count || 0,
          created_at: s.created_at,
        }));
      }
    }

    // 2. Combine with seed stories (deduplicating by ID)
    const dbIds = new Set(dbStories.map((s) => s.id));
    const combinedStories: ExploreStory[] = [
      ...dbStories.map((s) => ({
        id: s.id,
        source_chapter_id: s.source_chapter_id,
        author_user_id: s.author_user_id,
        author_display: s.author_display || "Anonymous Couple",
        relationship_duration: s.relationship_duration || "Couple",
        title: s.title,
        problem_statement: s.problem_statement || s.body_anonymized?.slice(0, 120),
        body_anonymized: s.body_anonymized,
        what_helped_anonymized: s.what_helped_anonymized || null,
        situation_tags: s.situation_tags || ["communication"],
        status: "live" as const,
        helpful_count_private: s.helpful_count_private || 0,
        created_at: s.created_at,
      })),
      ...SEED_EXPLORE_STORIES.filter((s) => !dbIds.has(s.id)),
    ];

    // 3. Filter by situation topic if not "all"
    let filtered = combinedStories;
    if (topic && topic !== "all") {
      filtered = filtered.filter(
        (s) => Array.isArray(s.situation_tags) && s.situation_tags.includes(topic)
      );
    }

    // 4. Filter by keyword search if provided
    if (searchQuery) {
      filtered = filtered.filter((s) => {
        const inTitle = s.title.toLowerCase().includes(searchQuery);
        const inBody = s.body_anonymized.toLowerCase().includes(searchQuery);
        const inTags = s.situation_tags.some((t) => t.toLowerCase().includes(searchQuery));
        const inHelped = s.what_helped_anonymized?.toLowerCase().includes(searchQuery);
        return inTitle || inBody || inTags || inHelped;
      });
    }

    return NextResponse.json({
      stories: filtered,
      totalCount: filtered.length,
      activeTopic: topic,
      searchQuery,
    });
  } catch (err: any) {
    console.error("GET /api/stories/explore error:", err);
    return NextResponse.json({
      stories: SEED_EXPLORE_STORIES,
      totalCount: SEED_EXPLORE_STORIES.length,
      activeTopic: "all",
      searchQuery: "",
    });
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
      title,
      bodyAnonymized,
      whatHelpedAnonymized,
      situationTags,
      relationshipDuration,
    } = body || {};

    if (!title?.trim() || !bodyAnonymized?.trim()) {
      return NextResponse.json(
        { error: "Title and experience description are required." },
        { status: 400 }
      );
    }

    const tags = Array.isArray(situationTags) && situationTags.length > 0
      ? situationTags
      : ["communication"];

    // Direct submission: Enters moderation queue with status 'pending_review'
    const { data: story, error: insertErr } = await supabase
      .from("explore_stories")
      .insert({
        author_user_id: user.id,
        title: title.trim(),
        situation_tags: tags,
        body_anonymized: bodyAnonymized.trim(),
        what_helped_anonymized: whatHelpedAnonymized ? whatHelpedAnonymized.trim() : null,
        relationship_duration: relationshipDuration || "Couple",
        status: "pending_review",
        helpful_count_private: 0,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      story,
      message: "Your experience has been submitted for moderation review before appearing in Explore.",
    });
  } catch (err: any) {
    console.error("POST /api/stories/explore error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit explore story." },
      { status: 500 }
    );
  }
}
