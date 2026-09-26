"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import {
  Plus, X, Loader2, Bookmark, BookOpen, Compass, Search,
  ShieldCheck, Check, ArrowRight, Flag, Calendar,
  Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight,
  User, Users, HeartHandshake, Eye, CheckCircle2, AlertCircle,
  HelpCircle, Trash2, Edit3, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STORY_TOPICS,
  SEED_EXPLORE_STORIES,
  WRITING_PROMPTS,
  MOOD_TAGS,
  MoodTag,
  StoryChapter,
  ExploreStory,
  WritingPrompt,
} from "@/lib/stories-data";

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function safeFormatDate(val?: any, style: "short" | "full" = "full"): string {
  if (!val) return "Recent";
  try {
    const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
    if (!(d instanceof Date) || isNaN(d.getTime())) return "Recent";
    if (style === "short") {
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${h12}:${minutes} ${ampm}`;
    }
    return `${FULL_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return "Recent";
  }
}

export default function StoriesPage() {
  const { user, profile, pair, partner, loading } = useAuth();

  // Active view world: 'our' (Our Stories) | 'explore' (Explore) | 'saved' (Saved)
  const [activeWorld, setActiveWorld] = useState<"our" | "explore" | "saved">("our");

  // ─── Our Stories State ───
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [fetchingChapters, setFetchingChapters] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Editor form inputs
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDate, setChapterDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [authorVoice, setAuthorVoice] = useState<"me" | "partner" | "joint">("me");
  const [moodTag, setMoodTag] = useState<MoodTag>("milestone");
  const [chapterBody, setChapterBody] = useState("");
  const [hasWhatHelped, setHasWhatHelped] = useState(false);
  const [whatHelped, setWhatHelped] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);

  // Private-to-Public Pipeline Toggle & Review
  const [isSharedToExplore, setIsSharedToExplore] = useState(false);
  const [exploreSituationTags, setExploreSituationTags] = useState<string[]>(["communication"]);
  const [exploreBodyAnonymized, setExploreBodyAnonymized] = useState("");
  const [exploreWhatHelpedAnonymized, setExploreWhatHelpedAnonymized] = useState("");

  // ─── Explore State ───
  const [exploreStories, setExploreStories] = useState<ExploreStory[]>(SEED_EXPLORE_STORIES);
  const [activeTopic, setActiveTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingExplore, setFetchingExplore] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  // Direct Submit to Explore
  const [isDirectSubmitOpen, setIsDirectSubmitOpen] = useState(false);
  const [directTitle, setDirectTitle] = useState("");
  const [directBody, setDirectBody] = useState("");
  const [directWhatHelped, setDirectWhatHelped] = useState("");
  const [directTags, setDirectTags] = useState<string[]>(["communication"]);
  const [directDuration, setDirectDuration] = useState("2 years together");
  const [submittingDirect, setSubmittingDirect] = useState(false);
  const [directSubmitNotice, setDirectSubmitNotice] = useState<string | null>(null);

  // Reader Modal State
  const [activeStory, setActiveStory] = useState<ExploreStory | null>(null);

  // Saved & Helpful State
  const [savedStories, setSavedStories] = useState<ExploreStory[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set());
  const [savedFilterTopic, setSavedFilterTopic] = useState<string>("all");

  // Report Modal State
  const [reportingStory, setReportingStory] = useState<ExploreStory | null>(null);
  const [reportReason, setReportReason] = useState("Identifying personal info");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportNotice, setReportNotice] = useState<string | null>(null);

  // Moderation Queue State
  const [isModOpen, setIsModOpen] = useState(false);
  const [modPendingStories, setModPendingStories] = useState<any[]>([]);
  const [modReports, setModReports] = useState<any[]>([]);
  const [loadingMod, setLoadingMod] = useState(false);

  // Chip scroll container ref for horizontal scrolling
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  // Partner display name resolution
  const partnerName = partner?.display_name || (pair ? "Partner" : null);

  // ─── 1. Data Fetching ───
  const fetchOurChapters = async () => {
    try {
      setFetchingChapters(true);
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
        setSavedStories(data.savedStories || []);
        setSavedIds(new Set(data.savedIds || []));
        setHelpfulIds(new Set(data.helpfulIds || []));
      }
    } catch (e) {
      console.error("Failed to fetch chapters:", e);
    } finally {
      setFetchingChapters(false);
    }
  };

  const fetchExploreFeed = async (topic: string = activeTopic, q: string = searchQuery) => {
    try {
      setFetchingExplore(true);
      const params = new URLSearchParams();
      if (topic && topic !== "all") params.append("topic", topic);
      if (q.trim()) params.append("q", q.trim());

      const res = await fetch(`/api/stories/explore?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExploreStories(data.stories || SEED_EXPLORE_STORIES);
      }
    } catch (e) {
      console.error("Failed to fetch explore feed:", e);
      setExploreStories(SEED_EXPLORE_STORIES);
    } finally {
      setFetchingExplore(false);
    }
  };

  useEffect(() => {
    fetchOurChapters();
    fetchExploreFeed("all", "");
  }, []);

  // Debounced search on explore query
  useEffect(() => {
    if (activeWorld !== "explore") return;
    const timer = setTimeout(() => {
      fetchExploreFeed(activeTopic, searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTopic, activeWorld]);

  // ─── 2. Chapter Editor Handlers ───
  const openNewChapterEditor = (prompt?: WritingPrompt) => {
    setEditingChapterId(null);
    if (prompt) {
      setChapterTitle(prompt.title);
      setMoodTag(prompt.defaultTag as MoodTag);
      setChapterBody(`\n\nPrompt Guide:\n• ${prompt.starterQuestions}`);
    } else {
      setChapterTitle("");
      setMoodTag("milestone");
      setChapterBody("");
    }
    setChapterDate(new Date().toISOString().split("T")[0]);
    setAuthorVoice("me");
    setHasWhatHelped(false);
    setWhatHelped("");
    setPhotos([]);
    setIsSharedToExplore(false);
    setExploreSituationTags(["communication"]);
    setExploreBodyAnonymized("");
    setExploreWhatHelpedAnonymized("");
    setIsEditorOpen(true);
  };

  const openEditChapter = (ch: StoryChapter) => {
    setEditingChapterId(ch.id);
    setChapterTitle(ch.title);
    setChapterDate(ch.chapter_date || new Date().toISOString().split("T")[0]);
    setAuthorVoice(ch.author_voice || "me");
    setMoodTag(ch.mood_tag || "milestone");
    setChapterBody(ch.body);
    setHasWhatHelped(!!ch.what_helped);
    setWhatHelped(ch.what_helped || "");
    setPhotos(ch.photos || []);
    setIsSharedToExplore(ch.is_shared_to_explore || false);
    setExploreSituationTags(["communication"]);
    setExploreBodyAnonymized(ch.body);
    setExploreWhatHelpedAnonymized(ch.what_helped || "");
    setIsEditorOpen(true);
  };

  // Auto-anonymize when toggle turned ON
  const handleToggleShareToExplore = (checked: boolean) => {
    setIsSharedToExplore(checked);
    if (checked) {
      let anonymized = chapterBody;
      const myName = profile?.display_name || user?.user_metadata?.display_name;
      if (myName) {
        anonymized = anonymized.replace(new RegExp(myName, "gi"), "me");
      }
      if (partnerName) {
        anonymized = anonymized.replace(new RegExp(partnerName, "gi"), "my partner");
      }
      setExploreBodyAnonymized(anonymized);
      setExploreWhatHelpedAnonymized(whatHelped);
    }
  };

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim() || !chapterBody.trim() || savingChapter) return;
    setSavingChapter(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChapterId,
          title: chapterTitle.trim(),
          body: chapterBody.trim(),
          chapterDate,
          moodTag,
          authorVoice,
          whatHelped: hasWhatHelped ? whatHelped.trim() : null,
          photos,
          isSharedToExplore,
          exploreSituationTags,
          exploreBodyAnonymized: isSharedToExplore ? exploreBodyAnonymized.trim() : null,
          exploreWhatHelpedAnonymized: isSharedToExplore ? exploreWhatHelpedAnonymized.trim() : null,
        }),
      });

      if (res.ok) {
        setIsEditorOpen(false);
        fetchOurChapters();
      }
    } catch (e) {
      console.error("Failed to save chapter:", e);
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter from your story?")) return;
    try {
      const res = await fetch(`/api/stories?id=${chapterId}`, { method: "DELETE" });
      if (res.ok) {
        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      }
    } catch (e) {
      console.error("Failed to delete chapter:", e);
    }
  };

  // ─── 3. Explore & Saved Handlers ───
  const handleToggleSave = async (storyId: string) => {
    const isSaved = savedIds.has(storyId);
    const newSaved = new Set(savedIds);
    if (isSaved) newSaved.delete(storyId);
    else newSaved.add(storyId);
    setSavedIds(newSaved);

    try {
      await fetch(`/api/stories/${storyId}/save`, { method: "POST" });
      fetchOurChapters();
    } catch (e) {
      console.error("Failed to toggle bookmark:", e);
    }
  };

  const handleToggleHelpful = async (storyId: string) => {
    const isHelpful = helpfulIds.has(storyId);
    const newHelpful = new Set(helpfulIds);
    if (isHelpful) newHelpful.delete(storyId);
    else newHelpful.add(storyId);
    setHelpfulIds(newHelpful);

    try {
      await fetch(`/api/stories/${storyId}/helpful`, { method: "POST" });
    } catch (e) {
      console.error("Failed to toggle helpful mark:", e);
    }
  };

  // Direct submit to explore
  const handleDirectSubmit = async () => {
    if (!directTitle.trim() || !directBody.trim() || submittingDirect) return;
    setSubmittingDirect(true);
    setDirectSubmitNotice(null);

    try {
      const res = await fetch("/api/stories/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: directTitle.trim(),
          bodyAnonymized: directBody.trim(),
          whatHelpedAnonymized: directWhatHelped.trim() || null,
          situationTags: directTags,
          relationshipDuration: directDuration,
        }),
      });

      if (res.ok) {
        setDirectSubmitNotice("Your experience was submitted to moderation review. It will appear in Explore once verified.");
        setTimeout(() => {
          setIsDirectSubmitOpen(false);
          setDirectTitle("");
          setDirectBody("");
          setDirectWhatHelped("");
          setDirectSubmitNotice(null);
        }, 2200);
      }
    } catch (e) {
      console.error("Failed to submit direct experience:", e);
    } finally {
      setSubmittingDirect(false);
    }
  };

  // Report handler
  const handleOpenReport = (story: ExploreStory) => {
    setReportingStory(story);
    setReportReason("Identifying personal info");
    setReportDetails("");
    setReportNotice(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingStory || submittingReport) return;
    setSubmittingReport(true);

    try {
      const res = await fetch(`/api/stories/${reportingStory.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });

      if (res.ok) {
        setReportNotice("Thank you. This story was flagged for moderation review.");
        setTimeout(() => {
          setReportingStory(null);
          setReportNotice(null);
        }, 1800);
      }
    } catch (e) {
      console.error("Failed to submit report:", e);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Moderation Queue Fetcher
  const openModerationQueue = async () => {
    setIsModOpen(true);
    setLoadingMod(true);
    try {
      const res = await fetch("/api/stories/moderation");
      if (res.ok) {
        const data = await res.json();
        setModPendingStories(data.pendingStories || []);
        setModReports(data.reports || []);
      }
    } catch (e) {
      console.error("Failed to fetch moderation queue:", e);
    } finally {
      setLoadingMod(false);
    }
  };

  const handleModReviewStory = async (storyId: string, status: "live" | "rejected") => {
    try {
      await fetch("/api/stories/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review_story", storyId, status }),
      });
      setModPendingStories((prev) => prev.filter((s) => s.id !== storyId));
      fetchExploreFeed();
    } catch (e) {
      console.error("Failed to review story:", e);
    }
  };

  const handleModReviewReport = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      await fetch("/api/stories/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review_report", reportId, status }),
      });
      setModReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error("Failed to review report:", e);
    }
  };

  // Scroll chips helper
  const scrollChips = (dir: "left" | "right") => {
    if (chipsScrollRef.current) {
      const scrollAmt = dir === "left" ? -200 : 200;
      chipsScrollRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  // Filter saved stories by topic
  const filteredSavedStories = savedFilterTopic === "all"
    ? savedStories
    : savedStories.filter((s) => Array.isArray(s?.situation_tags) && s.situation_tags.includes(savedFilterTopic));

  // Loading Screen
  if (loading || fetchingChapters) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center select-none">
        <Navigation />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#E8527D] animate-spin" />
          <p className="font-mono text-xs text-[#7A4B5D] uppercase tracking-wider">
            Loading couple chapters...
          </p>
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt
        title="Stories & Explore"
        description="Write chapters of your story together, reflect on lessons learned, and explore real advice from couples who navigated the same hurdles."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="relative min-h-screen pb-36 text-[#3D2432] bg-[#FAF7F2] selection:bg-[#E8527D] selection:text-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        
        {/* ─── TOP SECTION: WORLD NAVIGATION ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-[#FFD9E3]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F4] border border-[#FFD9E3] text-[#802030] text-[10px] font-mono font-bold tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3 h-3 text-[#E8527D]" />
              <span>Stories &amp; Experiences</span>
            </div>
            <h1 className="font-display italic font-bold text-3xl sm:text-4xl text-[#3D2432] mt-1 tracking-tight">
              Stories &amp; Explore
            </h1>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/90 border border-[#FFD9E3] shadow-xs">
            <button
              onClick={() => setActiveWorld("our")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "our"
                  ? "bg-[#E8527D] text-white shadow-xs"
                  : "text-[#7A4B5D] hover:text-[#3D2432]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Our Story</span>
            </button>

            <button
              onClick={() => setActiveWorld("explore")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "explore"
                  ? "bg-[#E8527D] text-white shadow-xs"
                  : "text-[#7A4B5D] hover:text-[#3D2432]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveWorld("saved")}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorld === "saved"
                  ? "bg-[#E8527D] text-white shadow-xs"
                  : "text-[#7A4B5D] hover:text-[#3D2432]"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedStories.length})</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: OUR STORIES (Private Couple Journal)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "our" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Journal Header Banner */}
            <div className="p-6 sm:p-8 rounded-[28px] border border-[#FFD9E3] bg-white/90 shadow-[0_8px_32px_rgba(232,82,125,0.06)] paper-grain relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#E8527D]">
                  {partnerName ? `You & ${partnerName}` : "Your Couple Space"}
                </span>
                <h2 className="font-display italic font-bold text-2xl sm:text-3xl text-[#3D2432]">
                  Your Shared Chapter Journal
                </h2>
                <p className="text-xs text-[#7A4B5D] max-w-xl leading-relaxed">
                  Record moments, milestones, lessons, and turning points. Private to both of you, with the option to share an anonymous takeaway to Explore.
                </p>
              </div>

              <button
                onClick={() => openNewChapterEditor()}
                className="btn-journal py-3 px-6 text-xs font-mono font-bold tracking-wider uppercase shrink-0 whitespace-nowrap shadow-sm hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write Chapter</span>
              </button>
            </div>

            {/* Chapters Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display italic font-bold text-xl text-[#3D2432]">
                    Our Chapters
                  </h3>
                  <p className="text-[10px] font-mono text-[#7A4B5D] uppercase tracking-wider mt-0.5">
                    {partnerName
                      ? `Private to you & ${partnerName}`
                      : pair
                      ? "Private to your couple space"
                      : "Private couple journal"}
                  </p>
                </div>

                {chapters.length > 0 && (
                  <span className="text-xs font-mono text-[#7A4B5D] bg-white px-3 py-1 rounded-full border border-[#FFD9E3]">
                    {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"} recorded
                  </span>
                )}
              </div>

              {/* EMPTY STATE: Blank-page writing prompt starters */}
              {chapters.length === 0 ? (
                <div className="p-8 sm:p-10 rounded-[28px] border border-[#FFD9E3] bg-white/95 paper-grain relative space-y-6">
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center mx-auto shadow-xs">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="font-display italic font-bold text-2xl text-[#3D2432]">
                      Your first chapter is blank.
                    </h4>
                    <p className="text-xs text-[#7A4B5D] leading-relaxed">
                      Begin your story by choosing a memory prompt below, or write freely about whatever is on your mind.
                    </p>
                  </div>

                  {/* Prompt Starters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                    {WRITING_PROMPTS.map((prompt) => (
                      <div
                        key={prompt.id}
                        onClick={() => openNewChapterEditor(prompt)}
                        className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#FFD9E3] hover:border-[#E8527D] hover:bg-white hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{prompt.emoji}</span>
                          <span className="font-display italic font-bold text-sm text-[#3D2432] group-hover:text-[#E8527D] transition-colors">
                            {prompt.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A4B5D] leading-relaxed line-clamp-2">
                          {prompt.tagline}
                        </p>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8527D] pt-1 flex items-center gap-1">
                          <span>Start this prompt</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => openNewChapterEditor()}
                      className="btn-journal py-2.5 px-6 text-xs font-mono font-bold tracking-wider uppercase"
                    >
                      + Write Freely Without a Prompt
                    </button>
                  </div>
                </div>
              ) : (
                /* TIMELINE VIEW of Chapters */
                <div className="relative pl-6 sm:pl-8 ml-3 sm:ml-4 border-l-2 border-[#FFD9E3] space-y-8">
                  {chapters.map((ch, idx) => {
                    const tagInfo = MOOD_TAGS[ch.mood_tag] || MOOD_TAGS.milestone;
                    const isMyVoice = ch.author_user_id === user?.id;
                    const voiceLabel = ch.author_voice === "joint"
                      ? "Joint Entry"
                      : isMyVoice
                      ? "Written by you"
                      : `Written by ${partnerName || "Partner"}`;

                    return (
                      <div key={ch.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 rounded-full bg-white border-2 border-[#E8527D] shadow-xs flex items-center justify-center text-xs">
                          <span>{tagInfo.emoji}</span>
                        </div>

                        {/* Chapter Card */}
                        <div className="p-5 sm:p-6 rounded-[24px] border border-[#FFD9E3] bg-white/95 hover:border-[#E8527D]/40 hover:shadow-[0_8px_24px_rgba(232,82,125,0.06)] transition-all paper-grain space-y-3.5">
                          {/* Top Row: Date, Voice, Mood, Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FFD9E3]/60 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[#3D2432] flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#E8527D]" />
                                <span>{safeFormatDate(ch.chapter_date, "full")}</span>
                              </span>
                              <span className="text-[#FFD9E3]">•</span>
                              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3]/70 font-semibold">
                                {voiceLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className="text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: tagInfo.bg, color: tagInfo.color }}
                              >
                                {tagInfo.label}
                              </span>

                              {ch.is_shared_to_explore && (
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                  ch.explore_status === "live"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {ch.explore_status === "live" ? "Live in Explore" : "Explore: In Review"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title & Body */}
                          <div className="space-y-2">
                            <h4 className="font-display italic font-bold text-xl text-[#3D2432]">
                              {ch.title}
                            </h4>
                            <p className="text-xs text-[#3D2432] leading-relaxed whitespace-pre-line">
                              {ch.body}
                            </p>
                          </div>

                          {/* "What Helped Us" Takeaway Section if present */}
                          {ch.what_helped && (
                            <div className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#FFD9E3] space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-[#E8527D] block">
                                What helped us:
                              </span>
                              <p className="text-xs text-[#7A4B5D] leading-relaxed">
                                {ch.what_helped}
                              </p>
                            </div>
                          )}

                          {/* Photos if present */}
                          {Array.isArray(ch.photos) && ch.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {ch.photos.map((url, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={url}
                                  alt="Chapter attachment"
                                  className="w-16 h-16 object-cover rounded-xl border border-[#FFD9E3]"
                                />
                              ))}
                            </div>
                          )}

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#FFD9E3]/60 text-xs font-mono text-[#7A4B5D]">
                            <span className="text-[10px]">
                              Chapter #{chapters.length - idx}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditChapter(ch)}
                                className="hover:text-[#E8527D] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(ch.id)}
                                className="hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: EXPLORE (Anonymous Community Knowledge)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "explore" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Explore Banner with Direct Submission CTA */}
            <div className="p-6 sm:p-8 rounded-[28px] border border-[#FFD9E3] bg-white/90 shadow-[0_8px_32px_rgba(232,82,125,0.06)] paper-grain relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#E8527D]">
                  COMMUNITY KNOWLEDGE
                </span>
                <h2 className="font-display italic font-bold text-2xl sm:text-3xl text-[#3D2432]">
                  Real Experiences from Other Couples
                </h2>
                <p className="text-xs text-[#7A4B5D] max-w-xl leading-relaxed">
                  Problem-focused, anonymous-first experiences from couples who navigated the same hurdles. Zero popularity traps, likes, or comment feeds.
                </p>
              </div>

              <button
                onClick={() => setIsDirectSubmitOpen(true)}
                className="btn-journal py-3 px-6 text-xs font-mono font-bold tracking-wider uppercase shrink-0 whitespace-nowrap shadow-sm hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Share Experience</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#7A4B5D] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, hurdles, or solutions (e.g. 'long distance', 'money', 'chores')..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#FFD9E3] text-sm text-[#3D2432] placeholder:text-[#B392A0] focus:outline-none focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Non-Overflowing Topic Filter Chips with Fade & Scroll Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A4B5D]">
                  Situation Topic
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAllTopics((v) => !v)}
                    className="text-[10px] font-mono font-bold text-[#E8527D] hover:underline cursor-pointer"
                  >
                    {showAllTopics ? "Single Row" : "Show All Topics (+)"}
                  </button>
                  <div className="hidden sm:flex items-center gap-1 text-[#7A4B5D]">
                    <button
                      onClick={() => scrollChips("left")}
                      className="p-1 rounded-full hover:bg-white border border-transparent hover:border-[#FFD9E3] cursor-pointer"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => scrollChips("right")}
                      className="p-1 rounded-full hover:bg-white border border-transparent hover:border-[#FFD9E3] cursor-pointer"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chips container (Scrollable single-row or Wrapped multi-row) */}
              <div
                ref={chipsScrollRef}
                className={`transition-all py-1.5 px-1 no-scrollbar ${
                  showAllTopics
                    ? "flex flex-wrap gap-2"
                    : "flex items-center gap-2 overflow-x-auto"
                }`}
              >
                <button
                  onClick={() => setActiveTopic("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    activeTopic === "all"
                      ? "bg-[#E8527D] text-white shadow-xs"
                      : "bg-white border border-[#FFD9E3] text-[#7A4B5D] hover:border-[#E8527D]/40 hover:text-[#3D2432]"
                  }`}
                >
                  ✨ All Topics
                </button>

                {STORY_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      activeTopic === topic.id
                        ? "bg-[#E8527D] text-white shadow-xs font-bold"
                        : "bg-white border border-[#FFD9E3] text-[#7A4B5D] hover:border-[#E8527D]/40 hover:text-[#3D2432]"
                    }`}
                  >
                    <span>{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Explore Feed Cards */}
            <div className="space-y-4">
              {fetchingExplore ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#E8527D] animate-spin mx-auto" />
                </div>
              ) : exploreStories.length === 0 ? (
                <div className="p-10 text-center rounded-[24px] border border-[#FFD9E3] bg-white/95 space-y-3">
                  <p className="font-display italic text-lg text-[#3D2432]">
                    No stories found matching your filter.
                  </p>
                  <p className="text-xs text-[#7A4B5D]">
                    Try another topic keyword or share your couple's experience to help others.
                  </p>
                  <button
                    onClick={() => { setActiveTopic("all"); setSearchQuery(""); }}
                    className="btn-journal-ghost py-2 px-5 text-xs font-mono"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                exploreStories.map((story) => {
                  const isSaved = Boolean(savedIds?.has?.(story.id));
                  const isHelpful = Boolean(helpfulIds?.has?.(story.id));
                  const mainTopic = STORY_TOPICS.find((t) => Array.isArray(story?.situation_tags) && story.situation_tags.includes(t.id)) || STORY_TOPICS[0];

                  return (
                    <div
                      key={story.id}
                      className="p-6 rounded-[24px] border border-[#FFD9E3] bg-white/95 shadow-xs hover:border-[#E8527D]/40 hover:shadow-[0_6px_20px_rgba(232,82,125,0.05)] transition-all paper-grain space-y-4"
                    >
                      {/* Card Header: Topic Badge + Actions (Save, Report) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3] font-bold">
                            <span>{mainTopic.emoji}</span>
                            <span>{mainTopic.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#7A4B5D]">
                            — {story.author_display || "Anonymous Couple"} · {story.relationship_duration}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleSave(story.id)}
                            className={`p-2 rounded-full border transition-all cursor-pointer ${
                              isSaved
                                ? "bg-[#E8527D] text-white border-[#E8527D] shadow-xs"
                                : "bg-white border-[#FFD9E3] text-[#7A4B5D] hover:text-[#E8527D]"
                            }`}
                            title={isSaved ? "Saved to your bookmarks" : "Save this story"}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleOpenReport(story)}
                            className="p-2 rounded-full border border-transparent hover:border-[#FFD9E3] text-[#7A4B5D] hover:text-rose-600 transition-colors cursor-pointer"
                            title="Report or flag story"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Preview */}
                      <div className="space-y-1.5 cursor-pointer" onClick={() => setActiveStory(story)}>
                        <h4 className="font-display italic font-bold text-xl sm:text-2xl text-[#3D2432] hover:text-[#E8527D] transition-colors">
                          {story.title}
                        </h4>
                        <p className="text-xs text-[#3D2432] leading-relaxed line-clamp-3">
                          {story.body_anonymized || story.problem_statement || (story as any).content || ""}
                        </p>
                      </div>

                      {/* "What Helped Us" prominent takeaway box */}
                      {story.what_helped_anonymized && (
                        <div className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#FFD9E3] space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-[#E8527D] block">
                            What helped them:
                          </span>
                          <p className="text-xs text-[#7A4B5D] leading-relaxed line-clamp-2">
                            {story.what_helped_anonymized}
                          </p>
                        </div>
                      )}

                      {/* Bottom Footer: Private Helpful Toggle + Full Reader Link */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#FFD9E3]/60">
                        {/* ZERO POPULARITY TRAP: Private helpful signal only! No public likes counter */}
                        <button
                          onClick={() => handleToggleHelpful(story.id)}
                          className={`text-xs font-mono flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                            isHelpful
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-[#7A4B5D] border-[#FFD9E3] hover:border-[#E8527D]/40"
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isHelpful ? "text-emerald-600" : "text-stone-400"}`} />
                          <span>{isHelpful ? "Marked as helpful (private)" : "Helpful to me"}</span>
                        </button>

                        <button
                          onClick={() => setActiveStory(story)}
                          className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8527D] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Read Full Story</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: SAVED STORIES (Private Bookmarks)
           ═══════════════════════════════════════════════════════════════ */}
        {activeWorld === "saved" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FFD9E3] pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#E8527D]">
                  PRIVATE BOOKMARKS
                </span>
                <h2 className="font-display italic font-bold text-2xl text-[#3D2432]">
                  Stories You Saved for Reference
                </h2>
              </div>

              {savedStories.length > 0 && (
                <span className="text-xs font-mono text-[#7A4B5D] bg-white px-3 py-1 rounded-full border border-[#FFD9E3]">
                  {savedStories.length} bookmarked
                </span>
              )}
            </div>

            {savedStories.length === 0 ? (
              <div className="p-10 rounded-[28px] border border-[#FFD9E3] bg-white/95 text-center space-y-3">
                <Bookmark className="w-10 h-10 text-[#E8527D] opacity-40 mx-auto" />
                <h4 className="font-display italic font-bold text-xl text-[#3D2432]">
                  No saved stories yet.
                </h4>
                <p className="text-xs text-[#7A4B5D] max-w-sm mx-auto">
                  When browsing Explore, tap the bookmark icon on stories that offer advice you want to return to later.
                </p>
                <button
                  onClick={() => setActiveWorld("explore")}
                  className="btn-journal py-2 px-5 text-xs font-mono font-bold tracking-wider uppercase"
                >
                  Browse Explore Feed ▷
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Topic filter for saved stories */}
                {savedStories.length > 3 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSavedFilterTopic("all")}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 cursor-pointer ${
                        savedFilterTopic === "all"
                          ? "bg-[#E8527D] text-white"
                          : "bg-white border border-[#FFD9E3] text-[#7A4B5D]"
                      }`}
                    >
                      All ({savedStories.length})
                    </button>
                    {STORY_TOPICS.map((top) => {
                      const count = savedStories.filter((s) => s.situation_tags?.includes(top.id)).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={top.id}
                          onClick={() => setSavedFilterTopic(top.id)}
                          className={`px-3 py-1 rounded-full text-xs font-mono shrink-0 cursor-pointer flex items-center gap-1 ${
                            savedFilterTopic === top.id
                              ? "bg-[#E8527D] text-white font-bold"
                              : "bg-white border border-[#FFD9E3] text-[#7A4B5D]"
                          }`}
                        >
                          <span>{top.emoji}</span>
                          <span>{top.label} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Saved Stories List */}
                <div className="space-y-3">
                  {filteredSavedStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-5 rounded-[20px] border border-[#FFD9E3] bg-white/95 shadow-xs flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => setActiveStory(story)}>
                        <h4 className="font-display italic font-bold text-lg text-[#3D2432] hover:text-[#E8527D] transition-colors">
                          {story.title}
                        </h4>
                        <p className="text-xs text-[#7A4B5D] line-clamp-2">
                          {story.body_anonymized}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveStory(story)}
                          className="btn-journal-ghost py-1.5 px-3 text-[10px] font-mono uppercase tracking-wider"
                        >
                          Read
                        </button>
                        <button
                          onClick={() => handleToggleSave(story.id)}
                          className="p-2 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-rose-600 cursor-pointer"
                          title="Remove bookmark"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current text-[#E8527D]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── MODERATION QUEUE ACCESS BAR (Bottom) ─── */}
        <div className="pt-6 border-t border-[#FFD9E3]/60 flex items-center justify-between text-xs font-mono text-[#7A4B5D]">
          <span>Pairfect Stories &amp; Explore Network</span>
          <button
            onClick={openModerationQueue}
            className="inline-flex items-center gap-1.5 hover:text-[#E8527D] transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#E8527D]" />
            <span>Moderation Queue</span>
          </button>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: OUR STORIES CHAPTER EDITOR (With Pipeline Toggle)
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white border border-[#FFD9E3] shadow-2xl p-6 sm:p-8 space-y-6 paper-grain relative"
            >
              <div className="flex items-center justify-between border-b border-[#FFD9E3] pb-4">
                <div>
                  <h3 className="font-display italic font-bold text-2xl text-[#3D2432]">
                    {editingChapterId ? "Edit Chapter" : "Write a New Chapter"}
                  </h3>
                  <p className="text-xs text-[#7A4B5D] mt-0.5">
                    {partnerName ? `Recording a memory for you & ${partnerName}` : "Your private couple journal"}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1.5">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. The Night We Rebuilt Trust, Our 1st Anniversary..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] focus:bg-white focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 outline-none"
                  />
                </div>

                {/* Date & Voice Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1.5">
                      Chapter Date
                    </label>
                    <input
                      type="date"
                      value={chapterDate}
                      onChange={(e) => setChapterDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] focus:bg-white focus:border-[#E8527D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1.5">
                      Whose Voice Is Speaking?
                    </label>
                    <select
                      value={authorVoice}
                      onChange={(e) => setAuthorVoice(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] focus:bg-white focus:border-[#E8527D] outline-none"
                    >
                      <option value="me">Written by me</option>
                      <option value="partner">Written by {partnerName || "Partner"}</option>
                      <option value="joint">Joint entry (both of us)</option>
                    </select>
                  </div>
                </div>

                {/* Mood Tag Selector */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1.5">
                    Mood / Tag
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(MOOD_TAGS) as MoodTag[]).map((t) => {
                      const tagObj = MOOD_TAGS[t];
                      const isSel = moodTag === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMoodTag(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? "bg-[#E8527D] text-white shadow-xs font-bold"
                              : "bg-[#FFF9FB] border border-[#FFD9E3] text-[#7A4B5D]"
                          }`}
                        >
                          <span>{tagObj.emoji}</span>
                          <span>{tagObj.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chapter Body */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1.5">
                    Chapter Content *
                  </label>
                  <textarea
                    rows={6}
                    value={chapterBody}
                    onChange={(e) => setChapterBody(e.target.value)}
                    placeholder="Write freely about what happened, what was unsaid, and what you learned together..."
                    className="w-full px-4 py-3 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] focus:bg-white focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 outline-none leading-relaxed"
                  />
                </div>

                {/* "What Helped Us" Checkbox & Expandable Field */}
                <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#FFD9E3] space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasWhatHelped}
                      onChange={(e) => setHasWhatHelped(e.target.checked)}
                      className="rounded border-[#FFD9E3] text-[#E8527D] focus:ring-[#E8527D] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#3D2432]">
                      Include a "What Helped Us" takeaway (if this describes overcoming something)
                    </span>
                  </label>

                  {hasWhatHelped && (
                    <div>
                      <textarea
                        rows={2}
                        value={whatHelped}
                        onChange={(e) => setWhatHelped(e.target.value)}
                        placeholder="What specific rule, habit, boundary, or conversation helped you both resolve this?"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFD9E3] bg-white text-xs text-[#3D2432] focus:border-[#E8527D] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Optional Photo Attachment */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider">
                    Photos (Optional URLs)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#FFD9E3] text-xs bg-[#FFF9FB] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPhotoUrl.trim()) {
                          setPhotos((prev) => [...prev, newPhotoUrl.trim()]);
                          setNewPhotoUrl("");
                        }
                      }}
                      className="btn-journal-ghost py-2 px-3 text-xs"
                    >
                      + Add
                    </button>
                  </div>
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {photos.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="attached" className="w-14 h-14 object-cover rounded-xl border border-[#FFD9E3]" />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── THE PIPELINE: Anonymize and Share to Explore Toggle ─── */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF5F8] to-[#FFF9F5] border border-[#FFD9E3] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSharedToExplore}
                        onChange={(e) => handleToggleShareToExplore(e.target.checked)}
                        className="rounded border-[#FFD9E3] text-[#E8527D] focus:ring-[#E8527D] w-4 h-4 cursor-pointer mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#3D2432] block">
                          Share an anonymized version to Explore
                        </span>
                        <span className="text-[11px] text-[#7A4B5D] block mt-0.5">
                          Help other couples navigating similar situations. Names and identifying markers are stripped.
                        </span>
                      </div>
                    </label>

                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-[#802030] border border-rose-200 uppercase font-bold shrink-0">
                      MODERATED
                    </span>
                  </div>

                  {isSharedToExplore && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3.5 pt-2 border-t border-[#FFD9E3]/70">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                          Select Relevant Situation Topic Tags
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {STORY_TOPICS.map((top) => {
                            const isSelected = exploreSituationTags.includes(top.id);
                            return (
                              <button
                                key={top.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setExploreSituationTags((prev) => prev.filter((t) => t !== top.id));
                                  } else {
                                    setExploreSituationTags((prev) => [...prev, top.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#E8527D] text-white font-bold"
                                    : "bg-white border border-[#FFD9E3] text-[#7A4B5D]"
                                }`}
                              >
                                {top.emoji} {top.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                          Review Anonymized Text (Verify no private details remain)
                        </label>
                        <textarea
                          rows={4}
                          value={exploreBodyAnonymized}
                          onChange={(e) => setExploreBodyAnonymized(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFD9E3] bg-white text-xs text-[#3D2432] focus:border-[#E8527D] outline-none"
                        />
                      </div>

                      {hasWhatHelped && (
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                            Anonymized "What Helped Us" Takeaway
                          </label>
                          <textarea
                            rows={2}
                            value={exploreWhatHelpedAnonymized}
                            onChange={(e) => setExploreWhatHelpedAnonymized(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-[#FFD9E3] bg-white text-xs text-[#3D2432] focus:border-[#E8527D] outline-none"
                          />
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Moderation Queue:</strong> This story will be reviewed by moderation before appearing in Explore — never auto-published.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FFD9E3]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="btn-journal-ghost py-2.5 px-5 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChapter}
                  disabled={savingChapter || !chapterTitle.trim() || !chapterBody.trim()}
                  className="btn-journal py-2.5 px-7 text-xs font-mono font-bold tracking-wider uppercase disabled:opacity-50"
                >
                  {savingChapter ? "Saving Chapter..." : editingChapterId ? "Update Chapter ▷" : "Save Chapter ▷"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: DIRECT SUBMISSION TO EXPLORE
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isDirectSubmitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white border border-[#FFD9E3] shadow-2xl p-6 sm:p-8 space-y-5 paper-grain relative"
            >
              <div className="flex items-center justify-between border-b border-[#FFD9E3] pb-4">
                <div>
                  <h3 className="font-display italic font-bold text-2xl text-[#3D2432]">
                    Share an Experience to Explore
                  </h3>
                  <p className="text-xs text-[#7A4B5D] mt-0.5">
                    Anonymous, problem-focused advice for couples facing the same situation.
                  </p>
                </div>
                <button
                  onClick={() => setIsDirectSubmitOpen(false)}
                  className="p-2 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {directSubmitNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{directSubmitNotice}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                    Situation Title *
                  </label>
                  <input
                    type="text"
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    placeholder="e.g. 8000 miles and the same Friday fight..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                    Relationship Duration / Type
                  </label>
                  <input
                    type="text"
                    value={directDuration}
                    onChange={(e) => setDirectDuration(e.target.value)}
                    placeholder="e.g. 3 years together, 18 months long distance..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                    Select Situation Topic Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STORY_TOPICS.map((top) => {
                      const isSelected = directTags.includes(top.id);
                      return (
                        <button
                          key={top.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) setDirectTags((prev) => prev.filter((t) => t !== top.id));
                            else setDirectTags((prev) => [...prev, top.id]);
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#E8527D] text-white font-bold"
                              : "bg-white border border-[#FFD9E3] text-[#7A4B5D]"
                          }`}
                        >
                          {top.emoji} {top.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                    What Happened &amp; What Made It Difficult *
                  </label>
                  <textarea
                    rows={4}
                    value={directBody}
                    onChange={(e) => setDirectBody(e.target.value)}
                    placeholder="Describe the situation anonymously without names or identifying details..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                    What Helped You Both Navigate or Settle It?
                  </label>
                  <textarea
                    rows={3}
                    value={directWhatHelped}
                    onChange={(e) => setDirectWhatHelped(e.target.value)}
                    placeholder="What specific rule, agreement, habit, or boundary helped you turn the corner?"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-sm text-[#3D2432] outline-none leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Moderation Guarantee:</strong> Direct submissions are reviewed by human moderation to ensure anonymity before going live.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FFD9E3]">
                <button
                  type="button"
                  onClick={() => setIsDirectSubmitOpen(false)}
                  className="btn-journal-ghost py-2.5 px-5 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDirectSubmit}
                  disabled={submittingDirect || !directTitle.trim() || !directBody.trim()}
                  className="btn-journal py-2.5 px-6 text-xs font-mono font-bold tracking-wider uppercase disabled:opacity-50"
                >
                  {submittingDirect ? "Submitting..." : "Submit for Moderation ▷"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: FULL STORY DETAIL READER
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white border border-[#FFD9E3] shadow-2xl p-6 sm:p-8 space-y-6 paper-grain relative"
            >
              <div className="flex items-start justify-between border-b border-[#FFD9E3] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3] font-bold uppercase tracking-wider">
                      {activeStory.author_display || "Anonymous Couple"}
                    </span>
                    <span className="text-xs font-mono text-[#7A4B5D]">
                      {activeStory.relationship_duration}
                    </span>
                  </div>
                  <h3 className="font-display italic font-bold text-2xl sm:text-3xl text-[#3D2432] pt-1">
                    {activeStory.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveStory(null)}
                  className="p-2 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Story Body */}
              <div className="space-y-4 text-sm text-[#3D2432] leading-relaxed">
                <p className="whitespace-pre-line">
                  {activeStory.body_anonymized}
                </p>

                {activeStory.what_helped_anonymized && (
                  <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#FFD9E3] space-y-2">
                    <span className="text-xs font-mono font-bold text-[#E8527D] uppercase tracking-wider block">
                      What Helped Us Through It:
                    </span>
                    <p className="text-xs text-[#3D2432] leading-relaxed">
                      {activeStory.what_helped_anonymized}
                    </p>
                  </div>
                )}
              </div>

              {/* Reader Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[#FFD9E3]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleHelpful(activeStory.id)}
                    className={`text-xs font-mono px-4 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      Boolean(helpfulIds?.has?.(activeStory.id))
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                        : "bg-white text-[#7A4B5D] border-[#FFD9E3] hover:border-[#E8527D]/40"
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${Boolean(helpfulIds?.has?.(activeStory.id)) ? "text-emerald-600" : "text-stone-400"}`} />
                    <span>{Boolean(helpfulIds?.has?.(activeStory.id)) ? "Marked helpful (private)" : "Helpful to me"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleSave(activeStory.id)}
                    className={`text-xs font-mono px-4 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      Boolean(savedIds?.has?.(activeStory.id))
                        ? "bg-[#E8527D] text-white border-[#E8527D]"
                        : "bg-white text-[#7A4B5D] border-[#FFD9E3] hover:border-[#E8527D]/40"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>{Boolean(savedIds?.has?.(activeStory.id)) ? "Saved" : "Save Story"}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleOpenReport(activeStory)}
                  className="text-xs font-mono text-[#7A4B5D] hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 4: REPORT STORY MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {reportingStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-[28px] bg-white border border-[#FFD9E3] shadow-2xl p-6 space-y-4 paper-grain relative"
            >
              <div className="flex items-center justify-between border-b border-[#FFD9E3] pb-3">
                <div className="flex items-center gap-2 text-[#802030]">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h4 className="font-display italic font-bold text-lg text-[#3D2432]">
                    Report Story
                  </h4>
                </div>
                <button
                  onClick={() => setReportingStory(null)}
                  className="p-1 rounded-full text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportNotice ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs">
                  {reportNotice}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-xs text-[#3D2432] outline-none"
                    >
                      <option value="Identifying personal info">Contains identifying personal information</option>
                      <option value="Inappropriate or offensive">Inappropriate, abusive, or offensive content</option>
                      <option value="Spam or promotional">Spam or commercial advertising</option>
                      <option value="Other">Other concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#7A4B5D] uppercase tracking-wider mb-1">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Help our moderation team understand the context..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-xs text-[#3D2432] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportingStory(null)}
                      className="btn-journal-ghost py-2 px-4 text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReport}
                      disabled={submittingReport}
                      className="btn-journal py-2 px-5 text-xs font-mono font-bold uppercase tracking-wider"
                    >
                      {submittingReport ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 5: MODERATION QUEUE (Admin View)
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-[32px] bg-white border border-[#FFD9E3] shadow-2xl p-6 sm:p-8 space-y-6 paper-grain relative"
            >
              <div className="flex items-center justify-between border-b border-[#FFD9E3] pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-[#E8527D]" />
                  <div>
                    <h3 className="font-display italic font-bold text-2xl text-[#3D2432]">
                      Moderation Queue
                    </h3>
                    <p className="text-xs text-[#7A4B5D]">
                      Review community submissions and reports before they become public.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModOpen(false)}
                  className="p-2 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-[#3D2432] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingMod ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#E8527D] animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Stories Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#3D2432]">
                        Submissions Waiting for Review ({modPendingStories.length})
                      </h4>
                    </div>

                    {modPendingStories.length === 0 ? (
                      <p className="text-xs text-[#7A4B5D] italic p-4 rounded-xl bg-[#FFF9FB] border border-[#FFD9E3]">
                        No pending stories in review queue. All clear!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {modPendingStories.map((story) => (
                          <div
                            key={story.id}
                            className="p-4 rounded-2xl border border-[#FFD9E3] bg-[#FFF9FB] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-display italic font-bold text-lg text-[#3D2432]">
                                {story.title}
                              </h5>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                Pending
                              </span>
                            </div>

                            <p className="text-xs text-[#3D2432] leading-relaxed">
                              {story.body_anonymized}
                            </p>

                            {story.what_helped_anonymized && (
                              <p className="text-xs text-[#7A4B5D] bg-white p-2.5 rounded-xl border border-[#FFD9E3]">
                                <strong>What Helped:</strong> {story.what_helped_anonymized}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FFD9E3]/60">
                              <button
                                onClick={() => handleModReviewStory(story.id, "rejected")}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-mono font-bold cursor-pointer"
                              >
                                Reject ✕
                              </button>
                              <button
                                onClick={() => handleModReviewStory(story.id, "live")}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer shadow-xs"
                              >
                                Approve &amp; Make Live ✓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Reports Section */}
                  <div className="space-y-3 pt-3 border-t border-[#FFD9E3]">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#3D2432]">
                      Reported Content Flags ({modReports.length})
                    </h4>

                    {modReports.length === 0 ? (
                      <p className="text-xs text-[#7A4B5D] italic p-4 rounded-xl bg-[#FFF9FB] border border-[#FFD9E3]">
                        No active reports filed.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {modReports.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-rose-800">
                                Reason: {rep.reason}
                              </span>
                              <span className="text-stone-500">
                                {safeFormatDate(rep.created_at, "short")}
                              </span>
                            </div>

                            {rep.details && (
                              <p className="text-xs text-[#3D2432] italic">
                                "{rep.details}"
                              </p>
                            )}

                            {rep.explore_stories && (
                              <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-rose-100">
                                <strong>Reported Story:</strong> {rep.explore_stories.title}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleModReviewReport(rep.id, "dismissed")}
                                className="px-3 py-1 rounded-xl bg-white border border-stone-200 text-xs font-mono text-stone-700 cursor-pointer"
                              >
                                Dismiss Flag
                              </button>
                              <button
                                onClick={() => handleModReviewReport(rep.id, "resolved")}
                                className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-mono font-bold cursor-pointer"
                              >
                                Resolve &amp; Hide
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
