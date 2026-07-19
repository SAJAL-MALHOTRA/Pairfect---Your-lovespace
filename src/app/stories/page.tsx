"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import { Plus, ArrowLeft, Trash2, Image as ImageIcon, Loader2, AlertCircle, Compass, Heart } from "lucide-react";

const STATUS_OPTIONS = [
  { id: "dating", label: "Dating & Strong 💖" },
  { id: "milestone", label: "Milestone Celebration 🎉" },
  { id: "closed", label: "Closed the Distance ✈️" },
  { id: "engaged", label: "Engaged / Married 💍" },
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});

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

  const fetchStories = async () => {
    try {
      const { data: storyData, error: storyErr } = await supabase
        .from("love_stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (storyErr) throw storyErr;

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleLike = async (e: React.MouseEvent, storyId: string, currentLikes: number) => {
    e.stopPropagation();
    try {
      const updatedLikes = currentLikes + 1;
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

      setTitle("");
      setContent("");
      setCoverFile(null);
      setCoverPreview(null);
      setModalOpen(false);
      setEditingStoryId(null);

      await fetchStories();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save story.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const parseStoryContent = (rawContent: string) => {
    const match = rawContent.match(/^\[(.*?)\]\n\n([\s\S]*)$/);
    if (match) {
      return { badge: match[1], body: match[2] };
    }
    return { badge: "Success Story 💖", body: rawContent };
  };

  if (loading || (fetching && stories.length === 0)) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      <Navigation />

      <main className="max-w-3xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col z-10 space-y-12 select-none">
        
        {/* Header Section */}
        <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
              Milestones
            </span>
            <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mt-1">
              Our Chapters
            </h1>
            <p className="text-xs text-[#7C7267] mt-1">
              A chronological ledger of our shared relationship timeline.
            </p>
          </div>

          <button
            onClick={openShareModal}
            className="btn-primary py-2.5 px-6 text-xs uppercase font-bold tracking-wider cursor-pointer"
          >
            {stories.some(s => s.author_id === user?.id) ? "Edit Story" : "Share Story"}
          </button>
        </div>

        {/* Chapters timeline stream */}
        {stories.length === 0 ? (
          <div className="text-center py-24 bg-[#FAF6EE] dark:bg-[#28221D] rounded-2xl border border-dashed border-[#EAE3D5] dark:border-[#3E352E] text-sm text-[#7C7267] italic">
            No story chapters documented yet. Be the first to share a milestone.
          </div>
        ) : (
          <div className="space-y-20 pt-4">
            {stories.map((story: any) => {
              const { badge, body } = parseStoryContent(story.content);
              const authorProfile = profilesMap[story.author_id];
              const authorName = authorProfile?.display_name || "A Partner";

              return (
                <article
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="space-y-6 text-left cursor-pointer group animate-fade-in max-w-2xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase tracking-widest">
                        {badge}
                      </span>
                      <span className="text-[10px] font-mono text-[#8A7B6E]">
                        {format(new Date(story.created_at), "MMMM d, yyyy")}
                      </span>
                    </div>

                    <h2 className="font-display text-3xl font-bold italic text-[#2E2A25] dark:text-[#E8E2D5] tracking-tight group-hover:text-[#802030] transition-colors leading-tight">
                      {story.title}
                    </h2>
                    
                    <p className="font-heading italic text-xs text-[#8A7B6E]">
                      Chapter penned by {authorName}
                    </p>
                  </div>

                  {story.resolved_cover && (
                    <div className="rounded-2xl overflow-hidden border border-[#EAE3D5] dark:border-[#3E352E] max-h-80 w-full shadow-sm">
                      <img
                        src={story.resolved_cover}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                      />
                    </div>
                  )}

                  <p className="text-sm text-[#2E2A25] dark:text-[#E8E2D5] leading-relaxed line-clamp-4 font-sans">
                    {body}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D5]/40 text-[10px] font-mono text-[#8A7B6E]">
                    <button
                      onClick={(e) => handleLike(e, story.id, story.likes)}
                      className="flex items-center gap-1 hover:text-[#802030] transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-[#802030]/10 hover:fill-[#802030]" />
                      <span>{story.likes} Likes</span>
                    </button>
                    
                    <span className="uppercase tracking-widest group-hover:underline">Read chapter →</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* STORY DETAIL POPUP WRAPPER */}
        {selectedStory && (() => {
          const { badge, body } = parseStoryContent(selectedStory.content);
          const authorProfile = profilesMap[selectedStory.author_id];
          const authorName = authorProfile?.display_name || "A Partner";
          const isMyOwn = selectedStory.author_id === user?.id;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#FCFBF9] dark:bg-[#1C1713] border border-[#EAE3D5] dark:border-[#3E352E] rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/85 transition-all cursor-pointer font-bold text-sm z-10"
                >
                  ×
                </button>

                {selectedStory.resolved_cover && (
                  <div className="relative aspect-video w-full overflow-hidden flex-shrink-0">
                    <img src={selectedStory.resolved_cover} alt={selectedStory.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6 md:p-8 space-y-6 flex-1 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#8A7B6E] uppercase">
                      <span>{badge}</span>
                      <span>{format(new Date(selectedStory.created_at), "MMMM d, yyyy")}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] leading-tight">
                      {selectedStory.title}
                    </h2>
                    
                    <p className="font-heading italic text-xs text-[#8A7B6E]">
                      Penned by {authorName}
                    </p>
                  </div>

                  <p className="text-sm text-[#2E2A25] dark:text-[#E8E2D5] leading-relaxed whitespace-pre-wrap font-sans">
                    {body}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-[#EAE3D5]/40">
                    <button
                      onClick={(e) => handleLike(e, selectedStory.id, selectedStory.likes)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950/20 text-[#802030] text-xs font-bold hover:bg-red-100 transition-all"
                    >
                      <Heart className="w-3.5 h-3.5 fill-[#802030]" />
                      <span>{selectedStory.likes} Likes</span>
                    </button>

                    <div className="flex gap-2">
                      {isMyOwn && (
                        <button
                          onClick={() => handleDeleteStory(selectedStory.id, selectedStory.cover_image_url)}
                          className="p-2 border border-red-200 hover:bg-red-50 rounded-xl text-[#802030] cursor-pointer"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStory(null)}
                        className="btn-secondary py-2 px-5 text-xs uppercase font-bold tracking-wider cursor-pointer"
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

        {/* COMPOSE FORM MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <form
              onSubmit={handleShareStory}
              className="bg-[#FCFBF9] dark:bg-[#1C1713] border border-[#EAE3D5] dark:border-[#3E352E] rounded-3xl w-full max-w-md p-6 relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-[#8A7B6E] hover:text-[#2E2A25] text-xl font-bold cursor-pointer"
              >
                ×
              </button>

              <div className="text-center space-y-1">
                <Compass className="w-6 h-6 text-[#802030] mx-auto" />
                <h2 className="text-xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5]">
                  Document Chapter
                </h2>
                <p className="text-xs text-[#8A7B6E]">
                  Add a milestone or memory page to our shared relationship ledger.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-[#8A7B6E] uppercase block">Chapter Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. The day we moved in together 🔑"
                  className="w-full px-3.5 py-2.5 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-sm focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-[#8A7B6E] uppercase block">Chapter Tag</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusBadge(opt.label)}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer
                        ${statusBadge === opt.label
                          ? "border-[#802030] bg-rose-50/20 text-[#802030]"
                          : "border-[#EAE3D5] dark:border-[#3E352E] bg-transparent text-[#7C7267] hover:border-[#8A7B6E]"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-[#8A7B6E] uppercase block">Illustration Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 py-2 px-4 border border-dashed border-[#EAE3D5] dark:border-[#3E352E] rounded-xl cursor-pointer hover:bg-[#FAF6EE] text-xs font-bold text-[#8A7B6E]">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Cover</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </label>
                  {coverPreview && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#EAE3D5] dark:border-[#3E352E] relative">
                      <img src={coverPreview} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[9px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-[#8A7B6E] uppercase block">Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Record what happened, how it felt, and what this step means..."
                  className="w-full px-3.5 py-2.5 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-sm focus:outline-none resize-none text-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3"
              >
                {submitting ? "Saving Chapter…" : "Publish Chapter"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
