"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import {
  Plus, X, Loader2, Heart, Trash2, BookOpen, Compass, Bookmark,
  MessageCircle, Sparkles, ArrowRight, ShieldCheck, Check, Share2,
  Lock, Eye, Tag, HelpCircle, UserCheck, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STORY_TOPICS,
  SEED_EXPLORE_STORIES,
  ExploreStory,
  calculateRelevanceScore
} from "@/lib/stories-data";

export default function StoriesPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // Active view world: 'our' (Our Stories) | 'explore' (Explore Network) | 'saved' (Saved Stories)
  const [activeWorld, setActiveWorld] = useState<"our" | "explore" | "saved">("our");

  // Explore state
  const [activeTopic, setActiveTopic] = useState<string>("all");
  const [exploreStories, setExploreStories] = useState<ExploreStory[]>(SEED_EXPLORE_STORIES);
  const [fetchingExplore, setFetchingExplore] = useState(false);

  // Our Stories state
  const [ourStories, setOurStories] = useState<any[]>([]);
  const [savedStories, setSavedStories] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [fetchingOur, setFetchingOur] = useState(true);

  // Story Reader Modal state
  const [activeStory, setActiveStory] = useState<ExploreStory | null>(null);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const [similarDrawerOpen, setSimilarDrawerOpen] = useState(false);
  const [similarStories, setSimilarStories] = useState<ExploreStory[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [responseSharedExp, setResponseSharedExp] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Writer Modal state
  const [isWriterOpen, setIsWriterOpen] = useState(false);
  const [writeFormat, setWriteFormat] = useState<"guided" | "freeform">("guided");
  const [storyTitle, setStoryTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [quoteExcerpt, setQuoteExcerpt] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [whatMadeDifficult, setWhatMadeDifficult] = useState("");
  const [whatWeTried, setWhatWeTried] = useState("");
  const [whereAreWeNow, setWhereAreWeNow] = useState("");
  const [whatToTellOthers, setWhatToTellOthers] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["communication"]);
  const [relationshipDuration, setRelationshipDuration] = useState("2 years together");
  const [visibility, setVisibility] = useState<"private" | "community">("private");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [savingStory, setSavingStory] = useState(false);

  // 1. Fetch Our Stories & Saved Stories
  const fetchOurStories = async () => {
    try {
      setFetchingOur(true);
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setOurStories(data.stories || []);
        setSavedStories(data.savedStories || []);
        setSavedIds(new Set(data.savedIds || []));
      }
    } catch (e) {
      console.error("Failed to fetch our stories:", e);
    } finally {
      setFetchingOur(false);
    }
  };

  // 2. Fetch Explore Stories by Topic
  const fetchExploreStories = async (topicId: string = activeTopic) => {
    try {
      setFetchingExplore(true);
      const res = await fetch(`/api/stories/explore?topic=${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setExploreStories(data.stories || SEED_EXPLORE_STORIES);
      }
    } catch (e) {
      console.error("Failed to fetch explore stories:", e);
    } finally {
      setFetchingExplore(false);
    }
  };

  useEffect(() => {
    fetchOurStories();
    fetchExploreStories("all");
  }, []);

  useEffect(() => {
    if (activeWorld === "explore") {
      fetchExploreStories(activeTopic);
    }
  }, [activeTopic, activeWorld]);

  // 3. Open Story Reader
  const openStoryReader = async (story: ExploreStory) => {
    setActiveStory(story);
    setSimilarDrawerOpen(false);

    // Fetch story responses
    try {
      const res = await fetch(`/api/stories/${story.id}/responses`);
      if (res.ok) {
        const data = await res.json();
        setResponses(data.responses || []);
      }
    } catch (e) {
      setResponses([]);
    }

    // Prepare similar stories for "I'm going through this"
    const similar = SEED_EXPLORE_STORIES.filter((s) => s.id !== story.id).sort(
      (a, b) =>
        calculateRelevanceScore(b, "all", story.id) - calculateRelevanceScore(a, "all", story.id)
    );
    setSimilarStories(similar.slice(0, 3));
  };

  // 4. Toggle Reaction
  const handleToggleReaction = async (reactionType: string) => {
    if (!activeStory) return;

    setReactions((prev) => ({
      ...prev,
      [reactionType]: !prev[reactionType],
    }));

    // Optimistically update counts on active story
    if (reactionType === "helped_me") activeStory.helped_count += reactions[reactionType] ? -1 : 1;
    if (reactionType === "going_through") activeStory.going_through_count += reactions[reactionType] ? -1 : 1;
    if (reactionType === "relate") activeStory.relate_count += reactions[reactionType] ? -1 : 1;
    if (reactionType === "perspective") activeStory.perspective_count += reactions[reactionType] ? -1 : 1;

    try {
      await fetch(`/api/stories/${activeStory.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });
    } catch (e) {
      console.error("Failed to react:", e);
    }
  };

  // 5. Toggle Private Save / Bookmark
  const handleToggleSave = async (storyId: string) => {
    const isSaved = savedIds.has(storyId);
    const newSaved = new Set(savedIds);
    if (isSaved) newSaved.delete(storyId);
    else newSaved.add(storyId);
    setSavedIds(newSaved);

    try {
      await fetch(`/api/stories/${storyId}/save`, { method: "POST" });
      fetchOurStories();
    } catch (e) {
      console.error("Failed to save story:", e);
    }
  };

  // 6. Post Response / Shared Experience
  const handlePostResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory || !newResponse.trim() || submittingResponse) return;

    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/stories/${activeStory.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newResponse.trim(),
          sharedExperience: responseSharedExp.trim() || null,
          isAnonymous: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponses((prev) => [...prev, data.response]);
        setNewResponse("");
        setResponseSharedExp("");
      }
    } catch (e) {
      console.error("Failed to post response:", e);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // 7. Save / Publish Story
  const handleSaveStory = async (status: "published" | "draft") => {
    if (!storyTitle.trim() || savingStory) return;
    setSavingStory(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: storyTitle,
          problemStatement: writeFormat === "guided" ? problemStatement : null,
          quoteExcerpt: writeFormat === "guided" ? quoteExcerpt : null,
          whatHappened: writeFormat === "guided" ? whatHappened : null,
          whatMadeDifficult: writeFormat === "guided" ? whatMadeDifficult : null,
          whatWeTried: writeFormat === "guided" ? whatWeTried : null,
          whereAreWeNow: writeFormat === "guided" ? whereAreWeNow : null,
          whatToTellOthers: writeFormat === "guided" ? whatToTellOthers : null,
          content: writeFormat === "freeform" ? freeformContent : problemStatement,
          topicTags: selectedTopics,
          relationshipDuration,
          storyStatus: status,
          visibility,
          isAnonymous,
        }),
      });

      if (res.ok) {
        setIsWriterOpen(false);
        resetWriterForm();
        fetchOurStories();
        if (visibility === "community") fetchExploreStories(activeTopic);
      }
    } catch (e) {
      console.error("Failed to save story:", e);
    } finally {
      setSavingStory(false);
    }
  };

  const resetWriterForm = () => {
    setStoryTitle("");
    setProblemStatement("");
    setQuoteExcerpt("");
    setWhatHappened("");
    setWhatMadeDifficult("");
    setWhatWeTried("");
    setWhereAreWeNow("");
    setWhatToTellOthers("");
    setFreeformContent("");
    setSelectedTopics(["communication"]);
    setVisibility("private");
    setIsAnonymous(true);
  };

  const partnerName = partner?.display_name || "partner";

  if (loading || fetchingOur) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center select-none">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-36 select-none" style={{ backgroundColor: "var(--bg)" }}>
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 pt-24 space-y-8">
        
        {/* ─── TOP TWO WORLDS SWITCHER ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <p className="typo-chapter">Living Relationship Archive</p>
            <h1 className="typo-display text-3xl sm:text-4xl text-[var(--text)] mt-0.5">
              Stories & Explore
            </h1>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xs">
            <button
              onClick={() => setActiveWorld("our")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "our"
                  ? "bg-[var(--burgundy)] text-white shadow-sm"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Our Stories</span>
            </button>

            <button
              onClick={() => setActiveWorld("explore")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "explore"
                  ? "bg-[var(--burgundy)] text-white shadow-sm"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveWorld("saved")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "saved"
                  ? "bg-[var(--burgundy)] text-white shadow-sm"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedStories.length})</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            WORLD 1: OUR STORIES (Private Couple Archive)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "our" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Our Story Header Banner */}
            <div className="p-8 rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-crafted-hero paper-grain flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <p className="typo-chapter text-[var(--burgundy)]">OUR STORY</p>
                <h2 className="typo-display text-3xl text-[var(--text)]">
                  Everything you've lived, written down.
                </h2>
                <p className="font-sans text-xs text-[var(--text-soft)]">
                  A quiet, private sanctuary for your chapters, milestones, and shared memory archive.
                </p>
              </div>

              <button
                onClick={() => setIsWriterOpen(true)}
                className="btn-primary py-3 px-6 text-xs font-mono uppercase tracking-widest flex items-center gap-2 rounded-full shadow-md shrink-0 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Write a Chapter</span>
              </button>
            </div>

            {/* Featured Story Collection Card */}
            <div className="p-6 rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-crafted-card paper-grain space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--burgundy)] font-bold">
                  OUR FIRST YEAR · COLLECTION
                </span>
                <span className="text-[10px] font-mono text-[var(--text-soft)]">
                  {ourStories.length} chapters · Updated recently
                </span>
              </div>

              <div>
                <h3 className="typo-display text-2xl text-[var(--text)]">
                  "We didn't know what we were doing."
                </h3>
                <p className="font-sans text-xs text-[var(--text-soft)] mt-1.5 leading-relaxed">
                  A story about our first year together, the fights, the stupid moments, and everything we learned along the way.
                </p>
              </div>
            </div>

            {/* Our Chapters List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="typo-chapter">Our Chapters</p>
                <span className="text-[10px] font-mono text-[var(--text-soft)]">
                  Private to you & {partnerName}
                </span>
              </div>

              {ourStories.length === 0 ? (
                <div className="p-12 text-center rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] space-y-4 paper-grain">
                  <BookOpen className="w-10 h-10 text-[var(--burgundy)] opacity-40 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-display italic text-xl text-[var(--text)]">Your book is empty.</p>
                    <p className="text-xs text-[var(--text-soft)]">
                      Write your first chapter — How you met, your first fight, or the conversation that changed everything.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWriterOpen(true)}
                    className="btn-primary py-2.5 px-6 text-xs font-mono uppercase tracking-wider rounded-full"
                  >
                    + Write First Chapter
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ourStories.map((story, idx) => (
                    <div
                      key={story.id}
                      onClick={() => openStoryReader(story)}
                      className="p-5 rounded-[20px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-xs hover:border-[var(--burgundy)]/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)]">
                            Chapter {idx + 1}
                          </span>
                          {story.visibility === "community" && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)]">
                              Shared to Explore
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-bold text-lg text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors truncate">
                          {story.title}
                        </h4>
                        <p className="text-xs text-[var(--text-soft)] line-clamp-1">
                          {story.problem_statement || story.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-[var(--text-soft)] hidden sm:inline">
                          {story.created_at ? format(new Date(story.created_at), "MMM d") : "Recent"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-soft)] group-hover:text-[var(--burgundy)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            WORLD 2: EXPLORE (Relationship Knowledge Library)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "explore" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Explore Banner */}
            <div className="p-8 rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-crafted-hero paper-grain space-y-3 text-center sm:text-left">
              <p className="typo-chapter text-[var(--burgundy)]">RELATIONSHIP KNOWLEDGE NETWORK</p>
              <h2 className="typo-display text-3xl sm:text-4xl text-[var(--text)]">
                Someone, somewhere, has probably been through it too.
              </h2>
              <p className="font-sans text-xs text-[var(--text-soft)] max-w-xl">
                A living library of real experiences written by people who navigated them. Problem-focused, anonymous-first, with zero popularity traps.
              </p>
            </div>

            {/* "What are you going through?" Topic Filter Pills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="typo-chapter">What are you going through?</p>
                <span className="text-[10px] font-mono text-[var(--text-soft)]">
                  Filter by situation
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setActiveTopic("all")}
                  className={`px-4 py-2 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTopic === "all"
                      ? "bg-[var(--burgundy)] text-white shadow-xs"
                      : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  ✨ All Topics
                </button>

                {STORY_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTopic === topic.id
                        ? "bg-[var(--burgundy)] text-white shadow-xs"
                        : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Problem-First Story Cards Grid */}
            <div className="space-y-5">
              {fetchingExplore ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin mx-auto" />
                </div>
              ) : exploreStories.length === 0 ? (
                <div className="p-12 text-center rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] italic text-xs text-[var(--text-soft)]">
                  No stories found for this topic yet. Be the first to share an experience!
                </div>
              ) : (
                exploreStories.map((story) => {
                  const mainTopic = STORY_TOPICS.find((t) => story.topic_tags?.includes(t.id)) || STORY_TOPICS[0];
                  const isSaved = savedIds.has(story.id);

                  return (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 sm:p-7 rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-crafted-card paper-grain space-y-4 transition-all hover:border-[var(--burgundy)]/30"
                    >
                      {/* Topic Badge & Save Button */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] font-bold">
                          <span>{mainTopic.emoji}</span>
                          <span>{mainTopic.label}</span>
                        </span>

                        <button
                          onClick={() => handleToggleSave(story.id)}
                          className={`p-2 rounded-full border transition-all cursor-pointer ${
                            isSaved
                              ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-xs"
                              : "bg-[var(--card)] border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--burgundy)]"
                          }`}
                          title={isSaved ? "Saved to your bookmarks" : "Save this story"}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Problem Statement & Quote */}
                      <div className="space-y-2 cursor-pointer" onClick={() => openStoryReader(story)}>
                        <h3 className="font-heading font-black text-2xl sm:text-3xl text-[var(--text)] leading-tight hover:text-[var(--burgundy)] transition-colors">
                          {story.title}
                        </h3>
                        <p className="font-quote italic text-sm text-[var(--text-soft)] line-clamp-2 leading-relaxed">
                          "{story.quote_excerpt || story.problem_statement}"
                        </p>
                      </div>

                      {/* "What Helped Us" Highlight Divider */}
                      {story.what_we_tried && (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-1">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                            What helped us:
                          </p>
                          <p className="text-xs font-sans text-[var(--text)] line-clamp-2">
                            {story.what_we_tried}
                          </p>
                        </div>
                      )}

                      {/* Bottom Footer: Meaningful Signals + Anonymous Author Tag + CTA */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-soft)]">
                          <span className="flex items-center gap-1 text-[var(--burgundy)] font-semibold">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{story.helped_count.toLocaleString()} people found this helpful</span>
                          </span>
                          <span>·</span>
                          <span>— {story.author_display}</span>
                        </div>

                        <button
                          onClick={() => openStoryReader(story)}
                          className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--burgundy)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Read Story</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            WORLD 3: SAVED STORIES (Private Bookmarks)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "saved" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="space-y-1">
              <p className="typo-chapter">Private Bookmarks</p>
              <h2 className="typo-display text-3xl text-[var(--text)]">
                Stories you saved for reference.
              </h2>
            </div>

            {savedStories.length === 0 ? (
              <div className="p-12 text-center rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] space-y-3 italic text-xs text-[var(--text-soft)]">
                <Bookmark className="w-8 h-8 opacity-40 mx-auto text-[var(--burgundy)]" />
                <p>You haven't saved any stories yet.</p>
                <p className="not-italic font-mono text-[10px] text-[var(--burgundy)] uppercase font-bold cursor-pointer" onClick={() => setActiveWorld("explore")}>
                  Browse Explore to find stories →
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedStories.map((story) => (
                  <div
                    key={story.id}
                    className="p-5 rounded-[20px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-xs flex items-center justify-between cursor-pointer"
                    onClick={() => openStoryReader(story)}
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)]">Saved Story</p>
                      <h4 className="font-heading font-bold text-lg text-[var(--text)]">{story.title}</h4>
                      <p className="text-xs text-[var(--text-soft)] line-clamp-1">{story.quote_excerpt || story.problem_statement}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(story.id);
                      }}
                      className="p-2 rounded-full text-red-500 hover:bg-red-50"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          JOURNAL-STYLE STORY READER DRAWER
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStory(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Journal Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-2xl z-10 p-6 sm:p-10 space-y-8 paper-grain"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:text-[var(--text)] flex items-center justify-center transition-all hover:scale-105"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Journal Title Header */}
              <div className="space-y-3 border-b border-[var(--border)] pb-6 pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] font-bold">
                    {activeStory.topic_tags?.[0]?.replace("_", " ").toUpperCase() || "RELATIONSHIP STORY"}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-soft)]">
                    {activeStory.relationship_duration}
                  </span>
                </div>

                <h2 className="font-display italic text-3xl sm:text-4xl font-black text-[var(--text)] leading-tight">
                  {activeStory.title}
                </h2>

                <p className="text-xs font-mono text-[var(--text-soft)]">
                  — {activeStory.author_display}
                </p>
              </div>

              {/* Teaser Quote */}
              {activeStory.quote_excerpt && (
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border-l-4 border-[var(--burgundy)] font-quote italic text-base text-[var(--text)] leading-relaxed">
                  "{activeStory.quote_excerpt}"
                </div>
              )}

              {/* Guided Sections */}
              <div className="space-y-6 text-sm font-sans text-[var(--text)] leading-relaxed">
                {activeStory.what_happened && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                      WHAT HAPPENED
                    </p>
                    <p>{activeStory.what_happened}</p>
                  </div>
                )}

                {activeStory.what_made_difficult && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                      WHAT MADE IT DIFFICULT
                    </p>
                    <p>{activeStory.what_made_difficult}</p>
                  </div>
                )}

                {activeStory.what_we_tried && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--paper-mid)] border border-[var(--border)]">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                      WHAT WE TRIED
                    </p>
                    <p className="font-medium text-[var(--text)]">{activeStory.what_we_tried}</p>
                  </div>
                )}

                {activeStory.where_are_we_now && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                      WHERE WE ARE NOW
                    </p>
                    <p>{activeStory.where_are_we_now}</p>
                  </div>
                )}

                {activeStory.what_to_tell_others && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                      WHAT WE'D TELL SOMEONE GOING THROUGH THIS
                    </p>
                    <p className="font-quote italic text-base text-[var(--burgundy)]">
                      "{activeStory.what_to_tell_others}"
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive 5-Reaction Bar + Save */}
              <div className="pt-6 border-t border-[var(--border)] space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] text-center">
                  Was this helpful to you?
                </p>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleReaction("helped_me")}
                    className={`px-3.5 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reactions.helped_me
                        ? "bg-[var(--burgundy)] text-white shadow-xs"
                        : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>♡ This helped me</span>
                    <span className="text-[10px] opacity-75">({activeStory.helped_count})</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction("relate")}
                    className={`px-3.5 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reactions.relate
                        ? "bg-[var(--burgundy)] text-white shadow-xs"
                        : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>🤝 I relate</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction("perspective")}
                    className={`px-3.5 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reactions.perspective
                        ? "bg-[var(--burgundy)] text-white shadow-xs"
                        : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>💡 Gave perspective</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(activeStory.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      savedIds.has(activeStory.id)
                        ? "bg-[var(--burgundy)] text-white shadow-xs"
                        : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>{savedIds.has(activeStory.id) ? "Saved" : "Save Story"}</span>
                  </button>
                </div>
              </div>

              {/* ─── "ARE YOU GOING THROUGH SOMETHING SIMILAR?" TRIGGER ─── */}
              <div className="p-6 rounded-[24px] bg-[var(--bg-secondary)] border border-[var(--border)] text-center space-y-3">
                <p className="font-heading font-bold text-lg text-[var(--text)]">
                  Are you going through something similar?
                </p>
                <p className="text-xs text-[var(--text-soft)]">
                  Tap below to surface stories from couples who have navigated this exact challenge.
                </p>

                <button
                  onClick={() => {
                    handleToggleReaction("going_through");
                    setSimilarDrawerOpen(true);
                  }}
                  className="btn-primary py-3 px-8 text-xs font-mono uppercase tracking-widest rounded-full shadow-md cursor-pointer"
                >
                  I'm Going Through This →
                </button>
              </div>

              {/* Similar Stories Drawer */}
              {similarDrawerOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                    People who have been here before:
                  </p>

                  <div className="space-y-2">
                    {similarStories.map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => openStoryReader(sim)}
                        className="p-4 rounded-2xl bg-[var(--paper-mid)] border border-[var(--border)] cursor-pointer hover:border-[var(--burgundy)]/40 transition-all text-left"
                      >
                        <h4 className="font-heading font-bold text-base text-[var(--text)]">{sim.title}</h4>
                        <p className="text-xs text-[var(--text-soft)] line-clamp-1 mt-0.5">"{sim.quote_excerpt || sim.problem_statement}"</p>
                        <span className="text-[9px] font-mono text-[var(--burgundy)] uppercase tracking-wider block mt-1">Read Story →</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Responses & Shared Experiences Section */}
              <div className="pt-6 border-t border-[var(--border)] space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                  Responses ({responses.length})
                </p>

                <div className="space-y-3">
                  {responses.map((resp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                        <span className="font-bold text-[var(--text)]">{resp.author_display}</span>
                        <span>{resp.created_at ? format(new Date(resp.created_at), "MMM d") : "Recently"}</span>
                      </div>
                      <p className="text-[var(--text)]">{resp.content}</p>
                      {resp.shared_experience && (
                        <div className="p-2.5 rounded-xl bg-[var(--paper-warm)] font-quote italic text-xs text-[var(--burgundy)]">
                          "What helped us: {resp.shared_experience}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit Response Form */}
                <form onSubmit={handlePostResponse} className="space-y-3 pt-2">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Share your response or experience with this story..."
                    className="input-warm text-xs min-h-[70px]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--text-soft)]">
                      Posted anonymously as Pairfect Reader
                    </span>
                    <button
                      type="submit"
                      disabled={!newResponse.trim() || submittingResponse}
                      className="btn-secondary py-2 px-5 text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-40"
                    >
                      {submittingResponse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post Response"}
                    </button>
                  </div>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          STORY CREATOR MODAL (Guided Framework vs Freeform)
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isWriterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWriterOpen(false)} className="absolute inset-0 bg-black/45 backdrop-blur-xs" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-2xl z-10 p-6 sm:p-8 space-y-6 paper-grain"
            >
              <button onClick={() => setIsWriterOpen(false)} className="absolute top-6 right-6 w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] flex items-center justify-center">
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-1 pr-8">
                <p className="typo-chapter text-[var(--burgundy)]">STORY CREATOR</p>
                <h2 className="typo-display text-2xl sm:text-3xl text-[var(--text)]">Tell your story</h2>
              </div>

              {/* Format Toggle: Guided vs Freeform */}
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] w-fit">
                <button
                  type="button"
                  onClick={() => setWriteFormat("guided")}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    writeFormat === "guided" ? "bg-[var(--burgundy)] text-white shadow-xs" : "text-[var(--text-soft)]"
                  }`}
                >
                  Guided Framework (5 Steps)
                </button>
                <button
                  type="button"
                  onClick={() => setWriteFormat("freeform")}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    writeFormat === "freeform" ? "bg-[var(--burgundy)] text-white shadow-xs" : "text-[var(--text-soft)]"
                  }`}
                >
                  Write Freely
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block mb-1">Story Title</label>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="e.g. We stopped talking."
                    className="input-warm text-sm font-heading font-bold"
                  />
                </div>

                {writeFormat === "guided" ? (
                  <>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold block mb-1">1 — What happened?</label>
                      <textarea
                        value={whatHappened}
                        onChange={(e) => setWhatHappened(e.target.value)}
                        placeholder="Tell us what you were going through..."
                        className="input-warm text-xs min-h-[70px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold block mb-1">2 — What made it difficult?</label>
                      <textarea
                        value={whatMadeDifficult}
                        onChange={(e) => setWhatMadeDifficult(e.target.value)}
                        placeholder="What were you struggling with?"
                        className="input-warm text-xs min-h-[70px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold block mb-1">3 — What did you try?</label>
                      <textarea
                        value={whatWeTried}
                        onChange={(e) => setWhatWeTried(e.target.value)}
                        placeholder="What actually helped?"
                        className="input-warm text-xs min-h-[70px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold block mb-1">4 — Where are you now?</label>
                      <textarea
                        value={whereAreWeNow}
                        onChange={(e) => setWhereAreWeNow(e.target.value)}
                        placeholder="Did things change?"
                        className="input-warm text-xs min-h-[70px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold block mb-1">5 — What would you tell someone going through it?</label>
                      <textarea
                        value={whatToTellOthers}
                        onChange={(e) => setWhatToTellOthers(e.target.value)}
                        placeholder="Your advice to someone in the same place..."
                        className="input-warm text-xs min-h-[70px]"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block mb-1">Story Body</label>
                    <textarea
                      value={freeformContent}
                      onChange={(e) => setFreeformContent(e.target.value)}
                      placeholder="Write your story freely..."
                      className="input-warm text-xs min-h-[200px]"
                    />
                  </div>
                )}

                {/* Topic Select */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block mb-1.5">Topic Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STORY_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopics([topic.id])}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-medium transition-all cursor-pointer ${
                          selectedTopics.includes(topic.id)
                            ? "bg-[var(--burgundy)] text-white"
                            : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)]"
                        }`}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & Visibility Options */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
                    PRIVACY & VISIBILITY
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text)]">Destination</p>
                      <p className="text-[10px] text-[var(--text-soft)]">
                        {visibility === "private" ? "Keep private in Our Stories" : "Share with Explore community"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility("private")}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer ${
                          visibility === "private" ? "bg-[var(--burgundy)] text-white" : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)]"
                        }`}
                      >
                        Private
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility("community")}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer ${
                          visibility === "community" ? "bg-[var(--burgundy)] text-white" : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)]"
                        }`}
                      >
                        Explore (Public)
                      </button>
                    </div>
                  </div>

                  {visibility === "community" && (
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text)]">Publish Anonymously</span>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer ${
                          isAnonymous ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {isAnonymous ? "Anonymous ON" : "Profile Shown"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => handleSaveStory("draft")}
                  disabled={savingStory || !storyTitle.trim()}
                  className="btn-secondary py-2.5 px-5 text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStory("published")}
                  disabled={savingStory || !storyTitle.trim()}
                  className="btn-primary py-2.5 px-6 text-xs font-mono uppercase tracking-widest rounded-full cursor-pointer"
                >
                  {savingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Story"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
