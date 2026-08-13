import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_EXPLORE_STORIES, calculateRelevanceScore, ExploreStory } from "@/lib/stories-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || "all";
    const similarTo = searchParams.get("similarTo") || "";

    const supabase = await createClient();

    // 1. Fetch public community stories from database
    const { data: dbStories, error } = await supabase
      .from("love_stories")
      .select("*")
      .eq("visibility", "community")
      .eq("story_status", "published")
      .order("created_at", { ascending: false });

    // Map DB stories to ExploreStory format if any exist
    const mappedDbStories: ExploreStory[] = (dbStories || []).map((s: any) => ({
      id: s.id,
      pair_id: s.pair_id,
      author_id: s.author_id,
      author_display: s.author_display || (s.is_anonymous ? "Anonymous Couple" : "Pairfect Couple"),
      is_anonymous: s.is_anonymous ?? true,
      relationship_duration: s.relationship_duration || "Couple",
      title: s.title,
      problem_statement: s.problem_statement || s.content,
      quote_excerpt: s.quote_excerpt || s.content?.slice(0, 120),
      what_happened: s.what_happened || s.content,
      what_made_difficult: s.what_made_difficult || "",
      what_we_tried: s.what_we_tried || "",
      where_are_we_now: s.where_are_we_now || "",
      what_to_tell_others: s.what_to_tell_others || "",
      topic_tags: s.topic_tags || ["communication"],
      helped_count: s.helped_count || 0,
      relate_count: s.relate_count || 0,
      perspective_count: s.perspective_count || 0,
      going_through_count: s.going_through_count || 0,
      created_at: s.created_at,
      story_status: "published",
      visibility: "community",
    }));

    // 2. Combine database stories with seed stories, deduplicating by ID
    const dbIds = new Set(mappedDbStories.map((s) => s.id));
    const combinedStories: ExploreStory[] = [
      ...mappedDbStories,
      ...SEED_EXPLORE_STORIES.filter((s) => !dbIds.has(s.id)),
    ];

    // 3. Filter by topic if requested
    let filtered = combinedStories;
    if (topic && topic !== "all") {
      filtered = combinedStories.filter((s) => s.topic_tags && s.topic_tags.includes(topic));
    }

    // 4. Calculate multi-factor relevance score (NOT purely popularity)
    const scoredStories = filtered.map((s) => ({
      ...s,
      relevanceScore: calculateRelevanceScore(s, topic, similarTo),
    }));

    // Sort by relevance score descending
    scoredStories.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      stories: scoredStories,
      totalCount: scoredStories.length,
      activeTopic: topic,
    });
  } catch (err: any) {
    console.error("GET /api/stories/explore error:", err);
    // Fallback to seed stories on error
    return NextResponse.json({
      stories: SEED_EXPLORE_STORIES,
      totalCount: SEED_EXPLORE_STORIES.length,
      activeTopic: "all",
    });
  }
}
