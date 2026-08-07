"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Heart, Trash2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { TimelineStory } from "@/components/cozy-illustrations";

const STATUS_OPTIONS = [
  { id: "dating",    label: "Dating & Strong 💖" },
  { id: "milestone", label: "Milestone 🎉" },
  { id: "closed",    label: "Closed the Distance ✈️" },
  { id: "engaged",   label: "Engaged / Married 💍" },
];

function parseContent(raw: string) {
  const m = raw.match(/^\[(.*?)\]\n\n([\s\S]*)$/);
  return m ? { badge: m[1], body: m[2] } : { badge: "Our Story 💖", body: raw };
}

// ── Heart node that appears when scrolled into view ─────────────────────────
function HeartNode({ filled, index }: { filled: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <div ref={ref}>
      <motion.div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.1 + index * 0.05 }}
        style={{
          background: filled
            ? "linear-gradient(135deg, #FF6B95 0%, #E8527D 100%)"
            : "var(--bg)",
          border: filled ? "2px solid rgba(232, 82, 125, 0.3)" : "2px solid var(--border-mid)",
          boxShadow: filled
            ? "0 4px 12px rgba(232, 82, 125, 0.25)"
            : "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Heart className={`w-3.5 h-3.5 ${filled ? "text-white fill-white" : "text-[var(--ink-light)]"}`} />
      </motion.div>
    </div>
  );
}

// ── A single chapter block ──────────────────────────────────────────────────
function Chapter({ story, index, isMe, authorName, onDelete, onLike, profilesMap }: {
  story: any; index: number; isMe: boolean;
  authorName: string; onDelete: () => void; onLike: () => void;
  profilesMap: Record<string, any>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { badge, body } = parseContent(story.content);
  const dateStr = (() => { try { return format(new Date(story.created_at), "MMMM d, yyyy"); } catch { return story.created_at; } })();

  return (
    <div ref={ref} className="relative flex gap-5">
      {/* Rail side — node + connector */}
      <div className="flex flex-col items-center" style={{ width: "32px", flexShrink: 0 }}>
        <HeartNode filled={isMe} index={index} />
      </div>

      {/* Content card */}
      <motion.div
        className="flex-1 pb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.05 }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--card-bg, var(--paper-warm))",
            border: "1px solid var(--border-warm)",
            boxShadow: "0 4px 20px -4px rgba(60,40,20,0.08), 0 1px 3px rgba(60,40,20,0.04)",
          }}
        >
          {/* Cover image */}
          {story.resolved_cover && (
            <div className="relative" style={{ maxHeight: "200px", overflow: "hidden" }}>
              <img src={story.resolved_cover} alt={story.title} className="w-full h-full object-cover" style={{ maxHeight: "200px" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.15) 100%)" }} />
            </div>
          )}

          {/* Card body */}
          <div className="p-5 space-y-3">
            {/* Top meta row */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.15em] text-[var(--ink-light)]">
                Chapter {index + 1}
              </span>
              <span
                className="text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,107,149,0.1) 0%, rgba(232,82,125,0.08) 100%)",
                  color: "var(--seal-red)",
                  border: "1px solid rgba(232,82,125,0.15)",
                }}
              >
                {badge}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display italic font-bold text-xl md:text-2xl text-[var(--ink-dark)] leading-tight">
              {story.title}
            </h2>

            {/* Author & date */}
            <p className="font-handwriting text-xs text-[var(--ink-light)]">
              {authorName} · {dateStr}
            </p>

            {/* Body text */}
            <p className="text-sm text-[var(--ink-mid)] leading-[1.8] whitespace-pre-wrap">{body}</p>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: "1px solid var(--border-mid)" }}>
              <motion.button onClick={onLike} whileTap={{ scale: 0.85 }}
                className="inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--seal-red)] cursor-pointer transition-colors py-1">
                <Heart className="w-3.5 h-3.5" /> {story.likes || 0}
              </motion.button>
              {isMe && (
                <button onClick={onDelete}
                  className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-red-500 cursor-pointer transition-colors py-1">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function StoriesPage() {
  const { user, pair, profile, partner } = useAuth();
  const supabase = createClient();
  const [stories, setStories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [badge, setBadge] = useState(STATUS_OPTIONS[0].label);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const railRef = useRef<HTMLDivElement>(null);

  const fetchStories = async () => {
    try {
      const { data: sd } = await supabase.from("love_stories").select("*").order("created_at", { ascending: true });
      const ids = Array.from(new Set((sd || []).map((s: any) => s.author_id)));
      if (ids.length) {
        const { data: ud } = await supabase.from("users").select("id,display_name,avatar_url").in("id", ids);
        const m: Record<string, any> = {};
        (ud || []).forEach((u: any) => { m[u.id] = u; });
        setProfilesMap(prev => ({ ...prev, ...m }));
      }
      const resolved = await Promise.all((sd || []).map(async (s: any) => {
        if (s.cover_image_url) {
          try { const { data } = await supabase.storage.from("memories").createSignedUrl(s.cover_image_url, 3600); return { ...s, resolved_cover: data?.signedUrl }; }
          catch { return { ...s, resolved_cover: null }; }
        }
        return s;
      }));
      setStories(resolved);
    } catch {} finally { setFetching(false); }
  };

  useEffect(() => { fetchStories(); }, []);

  const [chapterDate, setChapterDate] = useState<string>("");

  const openModal = () => {
    const mine = stories.find(s => s.author_id === user?.id);
    if (mine) {
      const { badge: b, body } = parseContent(mine.content);
      setTitle(mine.title); setContent(body); setBadge(b); setEditingId(mine.id);
      setCoverPreview(mine.resolved_cover || null);
      if (mine.created_at) {
        try { setChapterDate(new Date(mine.created_at).toISOString().split("T")[0]); } catch {}
      }
    } else {
      setTitle(""); setContent(""); setBadge(STATUS_OPTIONS[0].label); setEditingId(null); setCoverPreview(null);
      setChapterDate(new Date().toISOString().split("T")[0]);
    }
    setCoverFile(null); setError(null); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !user || !title.trim() || !content.trim()) { setError("Please add a title and story."); return; }
    setSubmitting(true); setError(null);
    try {
      let path: string | null = null;
      if (coverFile) {
        const filename = `stories/${pair.id}/${Date.now()}.${coverFile.name.split(".").pop()}`;
        path = filename;
        const { error: upErr } = await supabase.storage.from("memories").upload(filename, coverFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
      }
      const decorated = `[${badge}]\n\n${content.trim()}`;
      const payloadDate = chapterDate ? new Date(chapterDate).toISOString() : new Date().toISOString();

      if (editingId) {
        const upd: any = { title: title.trim(), content: decorated, created_at: payloadDate };
        if (path) upd.cover_image_url = path;
        const { error: e } = await supabase.from("love_stories").update(upd).eq("id", editingId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("love_stories").insert({ pair_id: pair.id, author_id: user.id, title: title.trim(), content: decorated, cover_image_url: path, likes: 0, created_at: payloadDate });
        if (e) throw e;
      }
      setModalOpen(false); setEditingId(null); setTitle(""); setContent(""); setCoverFile(null); setCoverPreview(null); setChapterDate("");
      await fetchStories();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, cover: string | null) => {
    if (!confirm("Remove this chapter?")) return;
    await supabase.from("love_stories").delete().eq("id", id);
    if (cover) await supabase.storage.from("memories").remove([cover]);
    setStories(prev => prev.filter(s => s.id !== id));
  };

  const handleLike = async (id: string, current: number) => {
    const next = current + 1;
    setStories(prev => prev.map(s => s.id === id ? { ...s, likes: next } : s));
    await supabase.from("love_stories").update({ likes: next }).eq("id", id);
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <Navigation />

      <main className="max-w-xl mx-auto px-5 py-16 pb-36">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Your story, together</p>
            <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">Timeline</h1>
          </div>
          <button onClick={openModal} className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer">
            {stories.find(s => s.author_id === user?.id) ? "Edit" : "Add"}
          </button>
        </motion.div>

        {stories.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-center py-16 flex flex-col items-center gap-5">
            <TimelineStory className="w-48 h-48 rounded-3xl" />
            <div>
              <p className="font-display italic text-2xl text-[var(--ink-mid)] mb-3">Your story hasn't begun yet.</p>
              <p className="text-xs text-[var(--ink-light)] font-mono mb-8">Every great love has a first chapter.</p>
              <button onClick={openModal} className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest cursor-pointer">Begin your story</button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Header illustration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <TimelineStory className="w-40 h-40 rounded-3xl" />
            </motion.div>

            <div className="relative">
            {/* The vertical rail — draws itself from top */}
            <motion.div
              className="absolute bg-gradient-to-b from-[var(--seal-red)] via-[var(--border-mid)] to-transparent"
              style={{ left: "15px", top: "16px", bottom: "0", width: "2px", transformOrigin: "top", scaleY: 0, borderRadius: "1px" }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />

            {/* Chapters */}
            {stories.map((story, i) => (
              <Chapter
                key={story.id}
                story={story}
                index={i}
                isMe={story.author_id === user?.id}
                authorName={profilesMap[story.author_id]?.display_name || (story.author_id === user?.id ? profile?.display_name : partner?.display_name) || "Someone"}
                profilesMap={profilesMap}
                onDelete={() => handleDelete(story.id, story.cover_image_url)}
                onLike={() => handleLike(story.id, story.likes || 0)}
              />
            ))}
          </div>
          </div>
        )}
      </main>

      {/* Write/Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div key="story-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col border overflow-hidden shadow-2xl paper-grain"
              style={{ background: "var(--bg)", borderColor: "var(--border-mid)" }}
            >
              <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border-mid)" }}>
                <p className="font-display italic text-lg font-bold text-[var(--ink-dark)]">{editingId ? "Update Chapter" : "New Chapter"}</p>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-[var(--ink-mid)] hover:bg-[var(--muted)] cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Badge */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-2">Moment type</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.id} type="button" onClick={() => setBadge(opt.label)}
                        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all ${badge === opt.label ? "bg-[var(--seal-red)] text-white border-[var(--seal-red)]" : "bg-[var(--bg-secondary)] text-[var(--ink-mid)] border-[var(--border-mid)]"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>



                {[
                  { label: "Chapter title", val: title, set: setTitle, placeholder: "Name this chapter...", required: true },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-1.5">{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required={f.required}
                      className="input-warm w-full"
                      style={{ borderColor: "var(--border-mid)", background: "var(--bg)" }} />
                  </div>
                ))}

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-1.5">Date of Chapter</label>
                  <input
                    type="date"
                    value={chapterDate}
                    onChange={e => setChapterDate(e.target.value)}
                    className="input-warm w-full font-mono"
                    style={{ borderColor: "var(--border-mid)", background: "var(--bg)" }}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-1.5">Your story</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write what happened..." rows={5} required
                    className="input-warm w-full resize-none"
                    style={{ borderColor: "var(--border-mid)", background: "var(--bg)" }} />
                </div>

                {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2">{error}</p>}

                <button type="submit" disabled={submitting || !title.trim() || !content.trim()}
                  className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Add to Timeline"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
