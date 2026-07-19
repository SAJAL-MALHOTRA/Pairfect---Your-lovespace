"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, X, Trash2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LookingAtPhotos } from "@/components/cozy-illustrations";

// 24+ Pookie & Heart Emojis for Memory Thumbnails
const POOKIE_EMOJIS = [
  "💖", "🥰", "💘", "💝", "💗", "💓", "💞", "💕",
  "💌", "🧸", "🌹", "✨", "👩‍❤️‍👨", "🌅", "🍰", "🍷",
  "🕯️", "💍", "🥐", "☕", "🎡", "🏖️", "🚗", "🌌",
  "🎀", "🐣", "🍓", "📸", "💐", "⭐"
];

// Each photo gets a deterministic-random rotation and washi tape color
const ROTATIONS = [-1.8, 2.4, -0.6, 1.8, -2.6, 0.8, -1.4, 2.1, -0.4, 1.6];
const WASHI = [
  "rgba(196,164,130,0.42)", "rgba(176,120,120,0.38)", "rgba(110,150,130,0.36)",
  "rgba(130,128,172,0.36)", "rgba(190,158,98,0.40)", "rgba(152,130,110,0.38)",
];

interface Moment {
  id: string;
  title: string;
  description?: string;
  moment_date: string;
  photo_url?: string;
}

// ── Individual Polaroid photograph ──────────────────────────────────────────
function Polaroid({ moment, index, onOpen }: { moment: Moment; index: number; onOpen: () => void }) {
  const rot = ROTATIONS[index % ROTATIONS.length];
  const washi = WASHI[index % WASHI.length];

  const isImageUrl = moment.photo_url && (moment.photo_url.startsWith("http") || moment.photo_url.startsWith("/") || moment.photo_url.startsWith("data:"));
  const src = isImageUrl
    ? moment.photo_url!.startsWith("http") ? moment.photo_url! : `/api/photo-proxy?url=${encodeURIComponent(moment.photo_url!)}`
    : null;

  const displayEmoji = !isImageUrl ? (moment.photo_url?.replace("emoji:", "") || "🌅") : null;

  const dateStr = (() => { try { return format(parseISO(moment.moment_date), "MMM d, ''yy"); } catch { return ""; } })();

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ rotate: rot, transformOrigin: "center center" } as any}
      initial={{ opacity: 0, y: 30, rotate: rot, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      whileHover={{ rotate: 0, scale: 1.06, y: -6, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
    >
      {/* Washi tape */}
      <div className="absolute -top-3 left-1/2 pointer-events-none z-10" style={{ transform: `translateX(-50%) rotate(${rot * -0.6}deg)`, width: "48px", height: "18px", background: washi }} />

      {/* The polaroid frame */}
      <div className="polaroid" style={{ width: "clamp(130px, 20vw, 200px)" }}>
        <div className="bg-[var(--border-mid)] overflow-hidden flex items-center justify-center" style={{ aspectRatio: "1 / 1" }}>
          {src ? (
            <img src={src} alt={moment.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--paper-mid)]">
              <span className="text-4xl select-none">{displayEmoji}</span>
            </div>
          )}
        </div>
        <div className="pt-3 pb-0.5">
          <p className="font-handwriting text-sm text-[#3A2E22] dark:text-[#D4C8B8] leading-tight truncate">{moment.title}</p>
          <p className="font-handwriting text-[10px] text-[var(--ink-light)] mt-0.5">{dateStr}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Full-screen lightbox ─────────────────────────────────────────────────────
function Lightbox({ moment, index, total, onClose, onPrev, onNext, onDelete }: {
  moment: Moment; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void; onDelete: (id: string) => void;
}) {
  const isImageUrl = moment.photo_url && (moment.photo_url.startsWith("http") || moment.photo_url.startsWith("/") || moment.photo_url.startsWith("data:"));
  const src = isImageUrl
    ? moment.photo_url!.startsWith("http") ? moment.photo_url! : `/api/photo-proxy?url=${encodeURIComponent(moment.photo_url!)}`
    : null;
  const displayEmoji = !isImageUrl ? (moment.photo_url?.replace("emoji:", "") || "🌅") : null;

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") onPrev(); if (e.key === "ArrowRight") onNext(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const dateStr = (() => { try { return format(parseISO(moment.moment_date), "MMMM d, yyyy"); } catch { return ""; } })();

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.92,   opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="polaroid mx-auto" style={{ maxWidth: "360px" }}>
          {src ? (
            <img src={src} alt={moment.title} className="w-full object-cover" style={{ maxHeight: "55vh" }} />
          ) : (
            <div className="w-full h-52 flex items-center justify-center bg-[var(--paper-mid)]">
              <span className="text-6xl select-none">{displayEmoji}</span>
            </div>
          )}
          <div className="pt-4 pb-1 space-y-1">
            <p className="font-handwriting text-xl text-[#2E2A25]">{moment.title}</p>
            <p className="font-handwriting text-xs text-[var(--ink-mid)]">{dateStr}</p>
            {moment.description && <p className="text-xs text-[var(--ink-mid)] leading-relaxed mt-1">{moment.description}</p>}
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/50 hover:text-white cursor-pointer p-2 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Prev / Next */}
        {index > 0 && (
          <button onClick={onPrev} className="absolute left-0 top-1/3 -translate-x-14 text-white/50 hover:text-white cursor-pointer p-2 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {index < total - 1 && (
          <button onClick={onNext} className="absolute right-0 top-1/3 translate-x-14 text-white/50 hover:text-white cursor-pointer p-2 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Delete */}
        <div className="text-center mt-4">
          <button onClick={() => onDelete(moment.id)}
            className="text-[9px] font-mono uppercase tracking-widest text-red-400/50 hover:text-red-400 cursor-pointer transition-colors inline-flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" /> Remove memory
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function MomentsPage() {
  const { user, pair } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lightbox, setLightbox]   = useState<{ m: Moment; i: number } | null>(null);
  const [addOpen, setAddOpen]     = useState(false);
  const supabase = createClient();

  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [momentDate, setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [selectedEmoji, setEmoji] = useState("💖");
  const [saving, setSaving]       = useState(false);

  const fetchMoments = async () => {
    if (!pair) return;
    try {
      const { data, error: err } = await supabase.from("shared_moments").select("*").eq("pair_id", pair.id).order("moment_date", { ascending: false });
      if (err) throw err;
      setMoments(data || []);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => {
    if (pair) {
      fetchMoments();
      const ch = supabase.channel(`moments-${pair.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "shared_moments", filter: `pair_id=eq.${pair.id}` }, fetchMoments)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [pair]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !user || !title.trim()) return;
    setSaving(true); setError(null);
    try {
      const { error: insErr } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        moment_date: momentDate,
        photo_url: selectedEmoji,
      });
      if (insErr) throw insErr;
      setTitle(""); setDesc(""); setEmoji("💖"); setDate(new Date().toISOString().split("T")[0]);
      setAddOpen(false); fetchMoments();
    } catch (err: any) { setError(err.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this memory?")) return;
    await supabase.from("shared_moments").delete().eq("id", id);
    setLightbox(null); fetchMoments();
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

      <main className="px-4 sm:px-6 lg:px-8 py-16 pb-36 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Our scrapbook</p>
            <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">Memories</h1>
          </div>
          <motion.button onClick={() => setAddOpen(true)} whileTap={{ scale: 0.95 }}
            className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </motion.button>
        </motion.div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3 mb-8">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* THE HERO: the photographs — organic scattered collage */}
        {moments.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="text-center py-16 flex flex-col items-center gap-5">
            <LookingAtPhotos className="w-48 h-48 rounded-3xl" />
            <div>
              <p className="font-display italic text-2xl text-[var(--ink-mid)] mb-3">Your scrapbook is waiting.</p>
              <p className="text-xs text-[var(--ink-light)] font-mono mb-6">Every moment deserves a place here.</p>
              <button onClick={() => setAddOpen(true)} className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest cursor-pointer">
                Add your first memory
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Header illustration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <LookingAtPhotos className="w-44 h-44 rounded-3xl" />
            </motion.div>

            <div className="flex flex-wrap gap-6 md:gap-8 justify-center md:justify-start items-start pt-4">
            {moments.map((m, i) => (
              <Polaroid key={m.id} moment={m} index={i} onOpen={() => setLightbox({ m, i })} />
            ))}
          </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            moment={lightbox.m}
            index={lightbox.i}
            total={moments.length}
            onClose={() => setLightbox(null)}
            onPrev={() => lightbox.i > 0 && setLightbox({ m: moments[lightbox.i - 1], i: lightbox.i - 1 })}
            onNext={() => lightbox.i < moments.length - 1 && setLightbox({ m: moments[lightbox.i + 1], i: lightbox.i + 1 })}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* Add memory sheet */}
      <AnimatePresence>
        {addOpen && (
          <motion.div key="add-sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="rounded-3xl max-w-md w-full border overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
              style={{ background: "var(--background)", borderColor: "var(--border-mid)" }}
            >
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-mid)" }}>
                <p className="font-display italic text-lg font-bold text-[var(--ink-dark)]">New Memory</p>
                <button onClick={() => setAddOpen(false)} className="p-1.5 rounded-lg text-[var(--ink-mid)] hover:bg-[var(--muted)] cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleAdd} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Polaroid Live Preview Box */}
                <div className="relative rounded-2xl border overflow-hidden flex flex-col items-center justify-center shadow-inner"
                  style={{ borderColor: "var(--border-mid)", background: "var(--paper-warm)", height: "140px" }}>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-5xl select-none animate-bounce">{selectedEmoji}</span>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mt-1">Thumbnail Preview</p>
                  </div>
                </div>

                {/* 20+ Pookie & Heart Emojis Selector Grid */}
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">
                    Choose Thumbnail Emoji ({POOKIE_EMOJIS.length} Pookie Options)
                  </label>
                  <div className="grid grid-cols-6 gap-2 p-2 rounded-2xl border bg-[var(--card-bg)] max-h-36 overflow-y-auto"
                    style={{ borderColor: "var(--border-mid)" }}>
                    {POOKIE_EMOJIS.map((emoji) => {
                      const isSelected = selectedEmoji === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEmoji(emoji)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[var(--rose)]/20 border-2 border-[var(--burgundy)] scale-110 shadow-xs"
                              : "hover:bg-[var(--muted)] hover:scale-105"
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {[
                  { label: "Title", val: title, set: setTitle, placeholder: "e.g. Our First Date 💕" },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)]"
                      style={{ borderColor: "var(--border-mid)", background: "var(--background)" }} />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Date</label>
                  <input type="date" value={momentDate} onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)]"
                    style={{ borderColor: "var(--border-mid)", background: "var(--background)" }} />
                </div>

                {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2">{error}</p>}

                <button type="submit" disabled={saving || !title.trim()}
                  className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40 flex items-center justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Memory"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

