"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Loader2, Plus, X, Trash2, Heart, Sparkles, Filter, Archive, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GratitudeJarRitual } from "@/components/cozy-illustrations";

// Natural colors for paper slips
const SLIP_COLORS = [
  "bg-[#FDF3F5] dark:bg-rose-950/30 border-[#F5C2C9] dark:border-rose-900/40",
  "bg-[#F5F8F6] dark:bg-emerald-950/30 border-[#C9DEC3] dark:border-emerald-900/40",
  "bg-[#FFFDF3] dark:bg-amber-950/30 border-[#F4E3B1] dark:border-amber-900/40",
  "bg-[#F5FAFD] dark:bg-sky-950/30 border-[#C4E1F6] dark:border-sky-900/40",
  "bg-[#FAF7F2] dark:bg-stone-900/50 border-[#E8DDCD] dark:border-stone-800/60",
];

// Helper to determine the physical coordinate stacks for slips inside the jar
function getSlipLayout(i: number, total: number) {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const baseBottom = 16 + row * 10;
  const baseLeft = 20 + col * 16 + (row % 2 === 0 ? 3 : -3);
  
  // Deterministic noise based on index
  const seedX = Math.sin(i * 12.9898) * 43758.5453;
  const seedY = Math.cos(i * 78.233) * 43758.5453;
  const seedR = Math.sin(i * 45.123) * 43758.5453;
  
  const noiseX = (seedX - Math.floor(seedX)) * 8 - 4;
  const noiseY = (seedY - Math.floor(seedY)) * 5 - 2.5;
  const noiseR = (seedR - Math.floor(seedR)) * 40 - 20;

  return {
    bottom: `${Math.max(10, baseBottom + noiseY)}px`,
    left: `${Math.max(10, Math.min(85, baseLeft + noiseX))}%`,
    rotate: `${noiseR}deg`,
  };
}

export default function GratitudeJarPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [notes, setNotes] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Archive Drawer & Filters state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState<"all" | "me" | "partner">("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Animation triggers
  const [shaking, setShaking] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!pair) return;
    try {
      const res = await fetch(`/api/gratitude?pairId=${pair.id}`);
      if (!res.ok) throw new Error("Failed to load gratitude notes");
      const data = await res.json();
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchNotes();
      const ch = supabase.channel(`gratitude-jar-V3-${pair.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "gratitude_entries", filter: `pair_id=eq.${pair.id}` }, fetchNotes)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [loading, pair]);

  const handleDropNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !pair || !user || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/gratitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pair.id,
          content: message.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to drop note");

      // Animate the paper folding & falling
      if (result.note?.id) {
        setDroppedId(result.note.id);
      }
      setMessage("");
      
      // Soft wobble timing
      setTimeout(() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }, 550);

      await fetchNotes();
      setTimeout(() => setDroppedId(null), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to drop note.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrawNote = () => {
    if (notes.length === 0 || shaking || drawing) return;
    setShaking(true);
    setActiveNote(null);
    
    setTimeout(() => {
      setShaking(false);
      setDrawing(true);
      setTimeout(() => {
        setDrawing(false);
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        setActiveNote(randomNote);
      }, 700);
    }, 800);
  };

  const filteredNotes = notes.filter((n) => {
    if (filterAuthor === "me" && n.user_id !== user?.id) return false;
    if (filterAuthor === "partner" && n.user_id === user?.id) return false;
    if (filterYear !== "all") {
      const year = new Date(n.created_at).getFullYear().toString();
      if (year !== filterYear) return false;
    }
    return true;
  });

  const availableYears = Array.from(
    new Set(notes.map((n) => new Date(n.created_at).getFullYear().toString()))
  ).sort().reverse();

  if (loading || fetching) {
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

      {/* Warm ambient shelf light glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-30 dark:opacity-20">
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: "480px", height: "480px",
          background: "radial-gradient(circle, rgba(239,206,174,0.15) 0%, transparent 70%)",
        }} />
      </div>

      <main className="max-w-5xl mx-auto px-5 py-12 pb-36">
        
        {/* Header & Ritual Banner */}
        <div className="flex flex-col items-center text-center space-y-2 mb-10">
          <GratitudeJarRitual className="w-32 h-32 rounded-2xl shadow-sm" />
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Appreciation Room</p>
            <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">The Gratitude Jar</h1>
            <p className="font-handwriting text-sm text-[var(--ink-mid)] mt-1">Collect love, one small moment at a time.</p>
          </div>
        </div>

        {/* SIDE-BY-SIDE GRID LAYOUT (Zero Empty Space) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: The Jar + Draw Note Actions */}
          <div className="lg:col-span-6 flex flex-col items-center select-none bg-[var(--bg-secondary)] border border-[var(--border-mid)] rounded-3xl p-6 shadow-sm paper-grain">
            <motion.div
              className="relative my-4"
              animate={shaking ? {
                x: [0, -10, 8, -8, 6, -6, 4, -4, 2, 0],
                y: [0, 2, -2, 2, -2, 1, -1, 0],
                rotate: [0, -4, 3, -3, 2, -2, 1, 0],
              } : drawing ? {
                y: [0, -25, 0],
                scale: [1, 1.02, 1],
              } : {}}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              onClick={handleDrawNote}
            >
              {/* The Glass Jar Container */}
              <div
                className="w-52 h-76 rounded-t-[48px] rounded-b-[28px] border-[3px] border-white/20 dark:border-white/5 relative cursor-pointer overflow-hidden flex flex-col justify-end p-4 shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
                style={{
                  background: "rgba(253, 250, 244, 0.08)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow: "inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.15), 0 24px 48px rgba(60,40,20,0.1)",
                }}
              >
                {/* Textured Cork Lid */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 rounded-md border-b-2 shadow-inner z-20 flex flex-col justify-between py-1"
                  style={{
                    background: "linear-gradient(135deg, #A88663 0%, #8C6A48 100%)",
                    borderColor: "#60472E",
                  }}
                >
                  <div className="w-24 h-[1px] bg-white/10 mx-auto rounded" />
                  <div className="w-20 h-0.5 bg-black/10 mx-auto rounded-full" />
                </div>

                {/* Shine line reflections */}
                <div className="absolute top-8 left-10 w-1 h-56 bg-white/15 rounded-full blur-[0.5px] pointer-events-none z-10" />
                <div className="absolute top-12 right-6 w-0.5 h-40 bg-white/8 rounded-full blur-[0.5px] pointer-events-none z-10" />

                {/* Hanging label tag */}
                <div className="absolute top-10 left-5 w-8 h-12 bg-[var(--paper-warm)] border border-[var(--border)] shadow-[0_2px_4px_rgba(0,0,0,0.04)] rounded-sm origin-top rotate-[14deg] z-10 flex flex-col items-center justify-center p-0.5 pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)]/20 mb-1 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-[var(--seal-red)] rounded-full" />
                  </div>
                  <span className="text-[6px] font-mono font-bold text-[var(--ink-light)] leading-none">MEMOIRES</span>
                </div>

                {/* Accumulating slips inside the jar */}
                <div className="relative flex-1 w-full mt-8 flex flex-wrap items-end justify-center p-2">
                  {notes.slice(0, 32).map((_, i) => {
                    const layout = getSlipLayout(i, notes.length);
                    const color = SLIP_COLORS[i % SLIP_COLORS.length];
                    return (
                      <motion.div
                        key={i}
                        className={`absolute w-4 h-4 rounded-sm border shadow-sm ${color}`}
                        style={{
                          bottom: layout.bottom,
                          left: layout.left,
                          transform: `rotate(${layout.rotate})`,
                          transformOrigin: "center center",
                        }}
                        animate={shaking ? {
                          y: [0, -30, 0],
                          x: [0, i % 2 === 0 ? 10 : -10, 0],
                          rotate: [layout.rotate, `${parseFloat(layout.rotate) + 90}deg`, layout.rotate],
                        } : {}}
                        transition={{ duration: 0.8, delay: i * 0.015 }}
                      />
                    );
                  })}

                  {notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                      <p className="text-[9px] font-mono text-[var(--ink-light)] uppercase tracking-wider">Empty</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dropped note folding & flight animation */}
              <AnimatePresence>
                {droppedId && (
                  <motion.div
                    initial={{ y: -180, x: 80, scale: 1.6, rotate: 0, opacity: 1 }}
                    animate={{ y: 80, x: 0, scale: 0.25, rotate: 360, opacity: [1, 1, 0.8] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeIn" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm bg-rose-100 border border-rose-300 shadow z-30"
                  />
                )}
              </AnimatePresence>

              {/* Drawn note flight animation */}
              <AnimatePresence>
                {drawing && (
                  <motion.div
                    initial={{ y: 120, x: 0, scale: 0.25, rotate: 0, opacity: 0.8 }}
                    animate={{ y: -100, x: 0, scale: 1.8, rotate: -360, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm bg-amber-100 border border-amber-300 shadow z-30"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Wooden Shelf */}
            <div className="w-64 h-3.5 bg-gradient-to-b from-[#A06D44] to-[#7B4D25] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-t border-[#C08F60]/30 relative -mt-1.5 z-0 flex flex-col justify-end">
              <div className="w-full h-0.5 bg-black/15" />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full">
              <button
                onClick={handleDrawNote}
                disabled={notes.length === 0 || shaking || drawing}
                className="btn-primary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
              >
                {shaking || drawing ? "Unfolding..." : "Pick a random memory ✨"}
              </button>

              <button
                onClick={() => setArchiveOpen(true)}
                className="btn-secondary py-2.5 px-5 text-[10px] uppercase tracking-widest cursor-pointer inline-flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" /> Read All ({notes.length})
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Write Note Form + Drawn Active Note */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Drawn Active Note (unfolded handwritten letter style) */}
            <AnimatePresence mode="wait">
              {activeNote && (
                <motion.div
                  key={activeNote.id}
                  initial={{ scale: 0.94, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 12 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className="w-full paper-grain material-note relative rounded-3xl p-6"
                  style={{
                    background: "linear-gradient(180deg,#FFFDF7 0%,#FBF6EB 100%)",
                    border: "1px solid var(--border-warm)",
                    boxShadow: "0 16px 48px -12px rgba(60,40,20,0.16)",
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-[#5C4D3C] border-b border-[#D8C8B4] pb-2 font-semibold">
                      <span>Appreciation note</span>
                      <span>From: {activeNote.user_id === user?.id ? "You" : (partner?.display_name || "Partner")}</span>
                    </div>
                    
                    <p className="font-handwriting text-xl text-[#2A2016] leading-relaxed whitespace-pre-wrap py-2 font-bold">
                      "{activeNote.content}"
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-[#D8C8B4] text-[10px] font-mono text-[#5C4D3C] font-semibold">
                      <span>{format(new Date(activeNote.created_at), "MMMM d, yyyy")}</span>
                      <button
                        onClick={() => setActiveNote(null)}
                        className="text-[10px] font-mono uppercase tracking-widest text-[#2A2016] hover:text-[var(--seal-red)] cursor-pointer font-bold border-b border-[#2A2016]/30 pb-0.5"
                      >
                        Fold & Return
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Effortless Drop Note Slip Form (Directly beside jar) */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <form
                onSubmit={handleDropNote}
                className="paper-grain relative rounded-3xl border p-6 space-y-4 shadow-sm"
                style={{ background: "var(--card-bg)", borderColor: "var(--border-mid)" }}
              >
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">Write a keepsake</p>
                  <h2 className="font-display italic text-xl font-bold text-[var(--ink-dark)]">Drop a Note into the Jar</h2>
                </div>

                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What are you grateful for today? Write a sweet note to drop in your jar..."
                  className="input-warm w-full resize-none"
                  style={{
                    fontFamily: "var(--font-handwriting), cursive",
                    borderColor: "var(--border-mid)",
                    background: "var(--bg)",
                    color: "var(--ink-dark)",
                  }}
                />

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fold & Drop into Jar 💌"}
                </button>
              </form>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Archive Drawer Slide-over */}
      <AnimatePresence>
        {archiveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="w-full max-w-md bg-[var(--bg)] h-full shadow-2xl flex flex-col border-l border-[var(--border-mid)] overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--border-mid)] flex items-center justify-between">
                <div>
                  <h2 className="font-display italic text-xl font-bold text-[var(--ink-dark)]">Jar Archive</h2>
                  <p className="text-xs text-[var(--ink-mid)] font-mono">All your saved slips of love</p>
                </div>
                <button
                  onClick={() => setArchiveOpen(false)}
                  className="p-2 rounded-xl text-[var(--ink-mid)] hover:bg-black/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 bg-[var(--muted)] border-b border-[var(--border-mid)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-light)]">Author:</span>
                  <select
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value as any)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-mid)] rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="all">Everyone</option>
                    <option value="me">Only Me</option>
                    <option value="partner">Only Partner</option>
                  </select>
                </div>

                {availableYears.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-light)]">Year:</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-mid)] rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                    >
                      <option value="all">All Time</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Note Slips List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 text-[var(--ink-light)] space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs font-mono">No notes match your filters.</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isMine = note.user_id === user?.id;
                    return (
                      <div
                        key={note.id}
                        className="paper-grain material-note p-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-secondary)] space-y-2 relative"
                      >
                        <div className="flex items-center justify-between text-[8px] font-mono text-[var(--ink-light)] uppercase tracking-wider">
                          <span>{isMine ? "You" : (partner?.display_name || "Partner")}</span>
                          <span>{format(new Date(note.created_at), "MMM d, yyyy")}</span>
                        </div>
                        <p className="font-handwriting text-base text-[var(--ink-dark)] leading-relaxed">
                          "{note.content}"
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
