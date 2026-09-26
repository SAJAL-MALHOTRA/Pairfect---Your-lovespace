import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch active pair for current user
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    let chapters: any[] = [];
    if (pair) {
      // Attempt to fetch from new story_chapters table
      const { data: dbChapters, error: chaptersErr } = await supabase
        .from("story_chapters")
        .select("*")
        .eq("couple_id", pair.id)
        .order("chapter_date", { ascending: false });

      if (!chaptersErr && dbChapters) {
        chapters = dbChapters;
      } else {
        // Fallback to legacy love_stories if story_chapters table is not yet applied
        const { data: legacyStories } = await supabase
          .from("love_stories")
          .select("*")
          .eq("pair_id", pair.id)
          .order("created_at", { ascending: false });

        chapters = (legacyStories || []).map((s: any) => ({
          id: s.id,
          couple_id: s.pair_id,
          author_user_id: s.author_id,
          author_voice: s.author_id === user.id ? "me" : "partner",
          title: s.title,
          body: s.problem_statement || s.content,
          mood_tag: "milestone",
          what_helped: s.what_we_tried,
          photos: [],
          chapter_date: s.created_at ? s.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          is_shared_to_explore: s.visibility === "community",
          explore_status: s.visibility === "community" ? "live" : null,
          created_at: s.created_at,
          updated_at: s.created_at,
        }));
      }
    }

    // 2. Fetch user's saved explore stories from story_saves
    let savedStories: any[] = [];
    let savedIds: string[] = [];

    const { data: saves, error: savesErr } = await supabase
      .from("story_saves")
      .select("explore_story_id, explore_stories (*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!savesErr && saves) {
      savedIds = saves.map((s: any) => s.explore_story_id);
      savedStories = saves.map((s: any) => s.explore_stories).filter(Boolean);
    } else {
      // Legacy fallback
      const { data: legacySaved } = await supabase
        .from("story_saved")
        .select("story_id, love_stories (*)")
        .eq("user_id", user.id);

      if (legacySaved) {
        savedIds = legacySaved.map((s: any) => s.story_id);
        savedStories = legacySaved.map((s: any) => s.love_stories).filter(Boolean);
      }
    }

    // 3. Fetch user's private helpful marks
    let helpfulIds: string[] = [];
    const { data: helpfulData } = await supabase
      .from("story_helpful")
      .select("explore_story_id")
      .eq("user_id", user.id);

    if (helpfulData) {
      helpfulIds = helpfulData.map((h: any) => h.explore_story_id);
    }

    return NextResponse.json({
      chapters,
      savedStories,
      savedIds,
      helpfulIds,
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
      body: chapterBody,
      chapterDate,
      moodTag,
      authorVoice,
      whatHelped,
      photos,
      isSharedToExplore,
      exploreSituationTags,
      exploreBodyAnonymized,
      exploreWhatHelpedAnonymized,
      relationshipDuration,
    } = body || {};

    if (!title?.trim() || !chapterBody?.trim()) {
      return NextResponse.json({ error: "Title and chapter body are required." }, { status: 400 });
    }

    // Fetch active pair
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (!pair) {
      return NextResponse.json({ error: "No active couple pairing found." }, { status: 400 });
    }

    const validVoice = ["me", "partner", "joint"].includes(authorVoice) ? authorVoice : "me";
    const validMood = ["milestone", "fight", "funny", "turning_point", "habit", "intimacy"].includes(moodTag)
      ? moodTag
      : "milestone";

    // 1. Insert or update private story_chapters record
    let chapter = null;
    const chapterPayload = {
      couple_id: pair.id,
      author_user_id: user.id,
      author_voice: validVoice,
      title: title.trim(),
      body: chapterBody.trim(),
      mood_tag: validMood,
      what_helped: whatHelped ? whatHelped.trim() : null,
      photos: Array.isArray(photos) ? photos : [],
      chapter_date: chapterDate || new Date().toISOString().split("T")[0],
      is_shared_to_explore: !!isSharedToExplore,
      explore_status: isSharedToExplore ? "pending_review" : null,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { data: updated, error: updateErr } = await supabase
        .from("story_chapters")
        .update(chapterPayload)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      chapter = updated;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("story_chapters")
        .insert({
          ...chapterPayload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createErr) throw createErr;
      chapter = created;
    }

    // 2. Private-to-Public Pipeline: If shared to Explore, package anonymized submission
    let exploreStory = null;
    if (isSharedToExplore && chapter) {
      const anonymizedText = (exploreBodyAnonymized || chapterBody).trim();
      const anonymizedTakeaway = (exploreWhatHelpedAnonymized || whatHelped || "").trim();
      const tags = Array.isArray(exploreSituationTags) && exploreSituationTags.length > 0
        ? exploreSituationTags
        : ["communication"];

      const { data: expCreated, error: expErr } = await supabase
        .from("explore_stories")
        .insert({
          source_chapter_id: chapter.id,
          author_user_id: user.id,
          title: title.trim(),
          situation_tags: tags,
          body_anonymized: anonymizedText,
          what_helped_anonymized: anonymizedTakeaway || null,
          relationship_duration: relationshipDuration || "Couple",
          status: "pending_review", // Always routed through moderation queue! Never auto-published.
          helpful_count_private: 0,
        })
        .select()
        .single();

      if (!expErr) {
        exploreStory = expCreated;
      }
    }

    return NextResponse.json({
      success: true,
      chapter,
      exploreStory,
    });
  } catch (err: any) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json({ error: err.message || "Failed to save chapter." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("id");

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    const { error: delErr } = await supabase
      .from("story_chapters")
      .delete()
      .eq("id", chapterId);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/stories error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete chapter" }, { status: 500 });
  }
}
