"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import {
  Heart, Plus, ArrowLeft, BookOpen, Sparkles, Trash2,
  Image as ImageIcon, Loader2, AlertCircle, Compass, Smile
} from "lucide-react";
import { OpenScrapbook, CelestialSparks } from "@/components/cozy-illustrations";

// Status Badge options for stories
const STATUS_OPTIONS = [
  { id: "closed", label: "Closed the Distance ✈️" },
  { id: "engaged", label: "Engaged / Married 💍" },
  { id: "dating", label: "Dating & Strong 💖" },
  { id: "milestone", label: "Milestone Celebration 🎉" },
];

export default function StoriesPage() {
  const { user, pair, profile, partner, loading } = useAuth();
  const supabase = createClient();

  const [stories, setStories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Form inputs
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [statusBadge, setStatusBadge] = useState(STATUS_OPTIONS[0].label);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  // User profiles list for displaying names
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});

  // ── Helper to open modal for create or edit ──────────────────────
  const openShareModal = () => {
    const myStory = stories.find(s => s.author_id === user?.id);
    if (myStory) {
      const { badge, body } = parseStoryContent(myStory.content);
      setTitle(myStory.title);
      setContent(body);
      setStatusBadge(badge);
      setEditingStoryId(myStory.id);
      setCoverPreview(myStory.resolved_cover || null);
    } else {
      setTitle("");
      setContent("");
      setStatusBadge(STATUS_OPTIONS[0].label);
      setEditingStoryId(null);
      setCoverPreview(null);
    }
    setCoverFile(null);
    setError(null);
    setModalOpen(true);
  };

  // ── Fetch Stories & Profiles ─────────────────────────────────────
  const fetchStories = async () => {
    try {
      // 1. Get stories
      const { data: storyData, error: storyErr } = await supabase
        .from("love_stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (storyErr) throw storyErr;

      // 2. Fetch profiles of authors to map their display names
      const authorIds = Array.from(new Set((storyData || []).map((s: any) => s.author_id)));
      if (authorIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, display_name, avatar_url")
          .in("id", authorIds);

        const newMap: Record<string, any> = {};
        (usersData || []).forEach((u: any) => {
          newMap[u.id] = u;
        });
        setProfilesMap((prev: any) => ({ ...prev, ...newMap }));
      }

      // 3. Resolve cover image URLs
      const resolved = await Promise.all(
        (storyData || []).map(async (story: any) => {
          if (story.cover_image_url) {
            try {
              const { data: urlData } = await supabase.storage
                .from("memories")
                .createSignedUrl(story.cover_image_url, 3600);
              return { ...story, resolved_cover: urlData?.signedUrl };
            } catch {
              return { ...story, resolved_cover: null };
            }
          }
          return story;
        })
      );

      setStories(resolved);
    } catch (e: any) {
      console.error("Error fetching stories:", e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchStories();
    }
  }, [loading]);

  // ── Cover Image Select ──────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // ── Like Increment ──────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent, storyId: string, currentLikes: number) => {
    e.stopPropagation();
    try {
      const updatedLikes = currentLikes + 1;

      // Optimistic update
      setStories((prev: any) => prev.map((s: any) => s.id === storyId ? { ...s, likes: updatedLikes } : s));
      if (selectedStory?.id === storyId) {
        setSelectedStory((prev: any) => prev ? { ...prev, likes: updatedLikes } : null);
      }

      await supabase
        .from("love_stories")
        .update({ likes: updatedLikes })
        .eq("id", storyId);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Share Story Submit ────────────────────────────────────────────
  const handleShareStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !user) return;
    if (!title.trim() || !content.trim()) {
      setError("Please add a title and write your story.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let storagePath: string | null = null;

      // 1. Upload Cover photo if provided
      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop();
        const filename = `stories/${pair.id}/${Date.now()}.${fileExt}`;
        storagePath = filename;

        const { error: uploadError } = await supabase.storage
          .from("memories")
          .upload(filename, coverFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      const decoratedContent = `[${statusBadge}]\n\n${content.trim()}`;

      // 2. Insert or Update to database
      if (editingStoryId) {
        const updateData: any = {
          title: title.trim(),
          content: decoratedContent,
        };
        if (storagePath) {
          updateData.cover_image_url = storagePath;
        }

        const { error: updateError } = await supabase
          .from("love_stories")
          .update(updateData)
          .eq("id", editingStoryId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("love_stories")
          .insert({
            pair_id: pair.id,
            author_id: user.id,
            title: title.trim(),
            content: decoratedContent,
            cover_image_url: storagePath,
            likes: 0,
          });

        if (insertError) throw insertError;
      }

      // Reset Form
      setTitle("");
      setContent("");
      setCoverFile(null);
      setCoverPreview(null);
      setModalOpen(false);
      setEditingStoryId(null);

      // Refresh stories
      await fetchStories();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save story.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Story ──────────────────────────────────────────────────
  const handleDeleteStory = async (storyId: string, coverPath: string | null) => {
    if (!confirm("Are you sure you want to delete your story?")) return;
    try {
      const { error: dbErr } = await supabase
        .from("love_stories")
        .delete()
        .eq("id", storyId);

      if (dbErr) throw dbErr;

      if (coverPath) {
        await supabase.storage.from("memories").remove([coverPath]);
      }

      setStories(prev => prev.filter(s => s.id !== storyId));
      setSelectedStory(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete story.");
    }
  };

  // Extract Status Badge from raw content
  const parseStoryContent = (rawContent: string) => {
    const match = rawContent.match(/^\[(.*?)\]\n\n([\s\S]*)$/);
    if (match) {
      return { badge: match[1], body: match[2] };
    }
    return { badge: "Success Story 💖", body: rawContent };
  };

  if (loading || (fetching && stories.length === 0)) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground">
      {/* Background gradients */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{
        background: "radial-gradient(50rem 35rem at 10% 5%,rgba(244,114,182,0.05) 0%,transparent 60%),radial-gradient(40rem 30rem at 90% 95%,rgba(96,165,250,0.05) 0%,transparent 60%)"
      }} />
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col z-10 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2">
              <Compass className="w-8 h-8 text-primary" />
              <span>Success Stories Board</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Read inspirational milestones of couples, and share your own love journey.
            </p>
          </div>

          <button
            onClick={openShareModal}
            className="inline-flex items-center justify-center space-x-2 py-3 px-5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{stories.some(s => s.author_id === user?.id) ? "Edit Our Story" : "Share Our Story"}</span>
          </button>
        </div>

        {/* ── STORIES GRID ────────────────────────────────────────── */}
        {stories.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-card border border-border/60 p-8 space-y-4">
            <CelestialSparks className="w-28 h-28 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No stories shared yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Be the first couple to share your milestones, date nights, or success story with the community!
            </p>
            <button
              onClick={openShareModal}
              className="mt-2 text-xs text-[#f472b6] font-bold hover:underline cursor-pointer"
            >
              Write story ▷
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stories.map((story: any) => {
              const { badge, body } = parseStoryContent(story.content);
              const authorProfile = profilesMap[story.author_id];
              const authorName = authorProfile?.display_name || "A Partner";

              return (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="flex flex-col bg-card border border-border/60 rounded-card overflow-hidden hover:shadow-md hover:border-[#f472b6]/20 transition-all cursor-pointer group relative"
                >
                  {/* Cover picture */}
                  <div className="aspect-video w-full bg-stone-100 overflow-hidden relative">
                    {story.resolved_cover ? (
                      <img src={story.resolved_cover} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500/5 to-blue-500/5 flex items-center justify-center">
                        <OpenScrapbook className="w-20 h-20" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <span className="absolute top-3 left-3 bg-white/95 dark:bg-black/80 backdrop-blur-sm text-foreground text-[10px] font-mono font-bold px-2.5 py-1 rounded-chip shadow-sm">
                      {badge}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-sans font-black text-lg text-foreground leading-tight tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {body}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-3 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                          {authorProfile?.avatar_url ? (
                            <img src={authorProfile.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold">{authorName.slice(0, 1)}</span>
                          )}
                        </div>
                        <span className="font-bold text-foreground">{authorName}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleLike(e, story.id, story.likes)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 fill-red-500/10 hover:fill-red-500" />
                          <span>{story.likes}</span>
                        </button>
                        <span>{format(new Date(story.created_at), "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STORY READER MODAL ────────────────────────────────────── */}
        {selectedStory && (() => {
          const { badge, body } = parseStoryContent(selectedStory.content);
          const authorProfile = profilesMap[selectedStory.author_id];
          const authorName = authorProfile?.display_name || "A Partner";
          const isMyOwn = selectedStory.author_id === user?.id;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-card border border-border/80 rounded-card w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col">
                {/* Header image */}
                <div className="relative aspect-video w-full bg-stone-100 flex-shrink-0">
                  {selectedStory.resolved_cover ? (
                    <img src={selectedStory.resolved_cover} alt={selectedStory.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500/5 to-blue-500/5 flex items-center justify-center">
                      <OpenScrapbook className="w-24 h-24" />
                    </div>
                  )}
                  {/* Close btn */}
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer font-bold text-sm"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-4 left-4 bg-white/95 dark:bg-black/90 backdrop-blur-sm text-foreground text-[10px] font-mono font-bold px-3 py-1.5 rounded-chip shadow">
                    {badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-6 flex-1">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-sans font-black text-foreground leading-tight tracking-tight">
                      {selectedStory.title}
                    </h2>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent overflow-hidden">
                          {authorProfile?.avatar_url && (
                            <img src={authorProfile.avatar_url} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span>Shared by <strong className="text-foreground">{authorName}</strong></span>
                      </div>
                      <span>{format(new Date(selectedStory.created_at), "MMMM d, yyyy")}</span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {body}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-border/50">
                    <button
                      onClick={(e) => handleLike(e, selectedStory.id, selectedStory.likes)}
                      className="flex items-center gap-2 px-4 py-2 rounded-button bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/15 active:scale-95 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                      <span>{selectedStory.likes} Likes</span>
                    </button>

                    <div className="flex gap-2">
                      {isMyOwn && (
                        <button
                          onClick={() => handleDeleteStory(selectedStory.id, selectedStory.cover_image_url)}
                          className="p-2.5 rounded-button border border-red-200 dark:border-red-950 text-red-500 hover:bg-red-500/5 active:scale-95 transition-all cursor-pointer"
                          title="Delete Story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStory(null)}
                        className="px-5 py-2.5 rounded-button text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-accent transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── SHARE STORY MODAL FORM ────────────────────────────────── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <form
              onSubmit={handleShareStory}
              className="bg-card border border-border/80 rounded-card w-full max-w-lg p-6 sm:p-8 shadow-2xl relative space-y-5"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 text-muted-foreground hover:text-foreground text-xl font-bold cursor-pointer"
              >
                ×
              </button>

              <div className="text-center space-y-1">
                <Sparkles className="w-6 h-6 text-primary mx-auto" />
                <h2 className="text-xl font-sans font-black text-foreground">
                  {editingStoryId ? "Edit Your Success Story" : "Share Your Success Story"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editingStoryId ? "Modify your relationship story or milestones." : "Draft your relationship stories, advice, or milestones."}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-button bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Story Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. How we closed the distance after 3 years ✈️"
                  className="w-full px-4 py-3 border border-border rounded-button bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Status Badge Choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Milestone / Tag</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusBadge(opt.label)}
                      className={`py-2 px-3 rounded-button border text-[11px] font-bold transition-all text-center cursor-pointer
                        ${statusBadge === opt.label
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Picture */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Cover Picture (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 py-2 px-4 border border-dashed border-border rounded-button cursor-pointer hover:bg-accent text-xs font-bold text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <span>Choose Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </label>
                  {coverPreview && (
                    <div className="w-12 h-12 rounded-button overflow-hidden border border-border relative">
                      <img src={coverPreview} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content body */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Write Story</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tell your story... how did you meet? What challenges did you face? How did you celebrate?"
                  className="w-full px-4 py-3 border border-border rounded-button bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {submitting 
                  ? (editingStoryId ? "Saving Changes…" : "Publishing Story…") 
                  : (editingStoryId ? "Save Changes ▷" : "Publish Story ▷")}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
