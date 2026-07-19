"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Heart, Trash2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

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
function HeartNode({ filled }: { filled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <div ref={ref}>
      <motion.svg width="18" height="18" viewBox="0 0 18 18" fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.1 }}
      >
        <path d="M9 15C9 15 2.5 10.5 2.5 6.5C2.5 4.3 4.1 2.5 6.25 2.5C7.4 2.5 8.4 3.2 9 4C9.6 3.2 10.6 2.5 11.75 2.5C13.9 2.5 15.5 4.3 15.5 6.5C15.5 10.5 9 15 9 15Z"
          fill={filled ? "var(--seal-red)" : "none"}
          stroke={filled ? "var(--seal-red)" : "var(--ink-light)"}
          strokeWidth="1.2" />
      </motion.svg>
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
    <div ref={ref} className="relative flex gap-6">
      {/* Rail side */}
      <div className="flex flex-col items-center" style={{ width: "18px", flexShrink: 0, paddingTop: "2px" }}>
        <HeartNode filled={isMe} />
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 pb-14"
        initial={{ opacity: 0, x: 16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-1">
          Chapter {index + 1}
        </p>
        <span className="inline-block text-[8px] font-mono uppercase tracking-widest text-[var(--ink-mid)] bg-[var(--card-bg)] px-2 py-0.5 rounded-full border border-[var(--border-mid)] mb-2">
          {badge}
        </span>

        {/* The title IS the story */}
        <h2 className="font-display italic font-bold text-2xl md:text-3xl text-[var(--ink-dark)] leading-tight mb-1">
          {story.title}
        </h2>

        <p className="font-handwriting text-xs text-[var(--ink-light)] mb-4">
          {authorName} · {dateStr}
        </p>

        {story.resolved_cover && (
          <div className="rounded-2xl overflow-hidden mb-5 border border-[var(--border-mid)]" style={{ maxHeight: "220px" }}>
            <img src={story.resolved_cover} alt={story.title} className="w-full h-full object-cover" style={{ maxHeight: "220px" }} />
          </div>
        )}

        <p className="text-sm text-[var(--ink-mid)] leading-relaxed whitespace-pre-wrap">{body}</p>

        {/* Actions */}
        <div className="flex items-center gap-5 mt-5">
          <motion.button onClick={onLike} whileTap={{ scale: 0.82 }}
            className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--seal-red)] cursor-pointer transition-colors">
            <Heart className="w-3 h-3" /> {story.likes || 0}
          </motion.button>
          {isMe && (
            <button onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-red-500 cursor-pointer transition-colors">
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
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

  const openModal = () => {
    const mine = stories.find(s => s.author_id === user?.id);
    if (mine) {
      const { badge: b, body } = parseContent(mine.content);
      setTitle(mine.title); setContent(body); setBadge(b); setEditingId(mine.id);
      setCoverPreview(mine.resolved_cover || null);
    } else {
      setTitle(""); setContent(""); setBadge(STATUS_OPTIONS[0].label); setEditingId(null); setCoverPreview(null);
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
      if (editingId) {
        const upd: any = { title: title.trim(), content: decorated };
        if (path) upd.cover_image_url = path;
        const { error: e } = await supabase.from("love_stories").update(upd).eq("id", editingId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("love_stories").insert({ pair_id: pair.id, author_id: user.id, title: title.trim(), content: decorated, cover_image_url: path, likes: 0 });
        if (e) throw e;
      }
      setModalOpen(false); setEditingId(null); setTitle(""); setContent(""); setCoverFile(null); setCoverPreview(null);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center py-40">
            <p className="font-display italic text-2xl text-[var(--ink-mid)] mb-3">Your story hasn't begun yet.</p>
            <p className="text-xs text-[var(--ink-light)] font-mono mb-8">Every great love has a first chapter.</p>
            <button onClick={openModal} className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest cursor-pointer">Begin your story</button>
          </motion.div>
        ) : (
          <div className="relative">
            {/* The vertical rail — draws itself from top */}
            <motion.div
              className="absolute top-2 bottom-0 bg-[var(--border-mid)]"
              style={{ left: "8px", width: "1px", transformOrigin: "top", scaleY: 0 }}
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
              className="rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col border overflow-hidden shadow-2xl"
              style={{ background: "var(--background)", borderColor: "var(--border-mid)" }}
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
                        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all ${badge === opt.label ? "bg-[var(--seal-red)] text-white border-[var(--seal-red)]" : "bg-[var(--card-bg)] text-[var(--ink-mid)] border-[var(--border-mid)]"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-2">Cover photo</label>
                  <label className="cursor-pointer block">
                    <div className={`rounded-2xl border border-dashed overflow-hidden flex items-center justify-center transition-colors hover:bg-[var(--paper-warm)] ${coverPreview ? "h-36" : "h-20"}`}
                      style={{ borderColor: "var(--ink-light)", background: "var(--card-bg)" }}>
                      {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-5 h-5 text-[var(--ink-light)]" />
                          <span className="text-[9px] font-mono text-[var(--ink-light)] uppercase tracking-widest">Optional</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (!f) return; setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }} />
                  </label>
                </div>

                {[
                  { label: "Chapter title", val: title, set: setTitle, placeholder: "Name this chapter...", required: true },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-1.5">{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required={f.required}
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)]"
                      style={{ borderColor: "var(--border-mid)", background: "var(--background)" }} />
                  </div>
                ))}

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block mb-1.5">Your story</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write what happened..." rows={5} required
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)] resize-none leading-relaxed"
                    style={{ borderColor: "var(--border-mid)", background: "var(--background)" }} />
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
