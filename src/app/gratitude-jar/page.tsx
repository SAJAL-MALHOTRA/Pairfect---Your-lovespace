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
  const { user, pair, partner, loading } = useAuth();
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
      const { data, error: err } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (err) throw err;
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
      const { data, error: insertErr } = await supabase
        .from("gratitude_entries")
        .insert({
          pair_id: pair.id,
          user_id: user.id,
          content: message.trim(),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Animate the paper folding & falling
      setDroppedId(data.id);
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
      
      // Draw random note
      setTimeout(() => {
        setDrawing(false);
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        setActiveNote(randomNote);
      }, 700);
    }, 850);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Discard this appreciation note?")) return;
    try {
      await supabase.from("gratitude_entries").delete().eq("id", id);
      fetchNotes();
      if (activeNote?.id === id) setActiveNote(null);
    } catch {}
  };

  // Distinct Years list helper
  const getYears = () => {
    const years = new Set(notes.map(n => new Date(n.created_at).getFullYear().toString()));
    return Array.from(years).sort().reverse();
  };

  // Apply filters in archive
  const filteredNotes = notes.filter(n => {
    const matchesAuthor =
      filterAuthor === "all" ||
      (filterAuthor === "me" && n.user_id === user?.id) ||
      (filterAuthor === "partner" && n.user_id !== user?.id);
    const matchesYear =
      filterYear === "all" ||
      new Date(n.created_at).getFullYear().toString() === filterYear;
    return matchesAuthor && matchesYear;
  });

  if (loading || (fetching && notes.length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh]" style={{ background: "var(--background)" }}>
      <Navigation />

      {/* Warm ambient shelf light glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-30 dark:opacity-20">
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: "480px", height: "480px",
          background: "radial-gradient(circle, rgba(239,206,174,0.15) 0%, transparent 70%)",
        }} />
      </div>

      <main className="max-w-xl mx-auto px-5 py-12 pb-36 space-y-12 flex flex-col items-center">
        
        {/* Signature Ritual Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="flex justify-center"
        >
          <GratitudeJarRitual className="w-44 h-44 rounded-3xl" />
        </motion.div>

        {/* Title */}
        <div className="text-center space-y-1">
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Appreciation Room</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">The Gratitude Jar</h1>
          <p className="font-handwriting text-sm text-[var(--ink-mid)]">Collect love, one small moment at a time.</p>
        </div>

        {/* THE HERO: The physical jar sitting on a wooden shelf */}
        <div className="flex flex-col items-center select-none pt-4">
          <motion.div
            className="relative"
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
              className="w-48 h-72 rounded-t-[48px] rounded-b-[28px] border-[3px] border-white/20 dark:border-white/5 relative cursor-pointer overflow-hidden flex flex-col justify-end p-4 shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
              style={{
                background: "rgba(253, 250, 244, 0.08)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: "inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.15), 0 24px 48px rgba(60,40,20,0.1)",
              }}
            >
              {/* Textured Cork Lid */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-md border-b-2 shadow-inner z-20 flex flex-col justify-between py-1"
                style={{
                  background: "linear-gradient(135deg, #A88663 0%, #8C6A48 100%)",
                  borderColor: "#60472E",
                }}
              >
                <div className="w-20 h-[1px] bg-white/10 mx-auto rounded" />
                <div className="w-16 h-0.5 bg-black/10 mx-auto rounded-full" />
              </div>

              {/* Shine line reflections */}
              <div className="absolute top-8 left-10 w-1 h-52 bg-white/15 rounded-full blur-[0.5px] pointer-events-none z-10" />
              <div className="absolute top-12 right-6 w-0.5 h-36 bg-white/8 rounded-full blur-[0.5px] pointer-events-none z-10" />

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
          <div className="w-60 h-3.5 bg-gradient-to-b from-[#A06D44] to-[#7B4D25] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-t border-[#C08F60]/30 relative -mt-1.5 z-0 flex flex-col justify-end">
            <div className="w-full h-0.5 bg-black/15" />
          </div>

          {/* Primary Action */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleDrawNote}
              disabled={notes.length === 0 || shaking || drawing}
              className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
            >
              {shaking ? "Shaking..." : drawing ? "Drawing..." : "Draw a Note ✦"}
            </button>
            <button
              onClick={() => setArchiveOpen(true)}
              className="btn-secondary py-3 px-5 text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        </div>

        {/* Drawn Active Note (unfolded handwritten letter style) */}
        <AnimatePresence mode="wait">
          {activeNote && (
            <motion.div
              key={activeNote.id}
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full paper-grain relative rounded-3xl p-8"
              style={{
                background: "linear-gradient(180deg,#FFFDF7 0%,#FBF6EB 100%)",
                border: "1px solid var(--border-warm)",
                boxShadow: "0 24px 64px -12px rgba(60,40,20,0.16), 0 2px 8px rgba(60,40,20,0.06)",
              }}
            >
              {/* Torn washi tape fold */}
              <div className="absolute top-0 right-10 w-12 h-4 pointer-events-none opacity-85" style={{ background: "var(--washi-warm)", transform: "rotate(-1.5deg)" }} />

              <div className="space-y-5">
                <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] border-b border-[var(--border-mid)] pb-2.5">
                  <span>Appreciation note</span>
                  <span>From: {activeNote.user_id === user?.id ? "You" : (partner?.display_name || "Partner")}</span>
                </div>
                
                {/* Handwritten content */}
                <p className="font-handwriting text-xl text-[var(--ink-dark)] leading-relaxed whitespace-pre-wrap py-2">
                  "{activeNote.content}"
                </p>

                <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border-mid)] text-[9px] font-mono text-[var(--ink-light)]">
                  <span>{format(new Date(activeNote.created_at), "MMMM d, yyyy")}</span>
                  <button
                    onClick={() => setActiveNote(null)}
                    className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-dark)] hover:text-[var(--seal-red)] cursor-pointer"
                  >
                    Fold & Return
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Effortless drop note slip */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form
            onSubmit={handleDropNote}
            className="paper-grain relative rounded-3xl border p-6 space-y-4"
            style={{ background: "var(--card-bg)", borderColor: "var(--border-mid)" }}
          >
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">Write a keepsake</p>
              <h2 className="font-display italic text-lg font-bold text-[var(--ink-dark)]">Appreciation Slip</h2>
            </div>

            <textarea
              required
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Thank you for..."
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)] resize-none leading-relaxed"
              style={{
                fontFamily: "var(--font-handwriting), cursive",
                borderColor: "var(--border-mid)",
                background: "var(--background)",
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fold & Drop 💌"}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Keepsake Archive overlay drawer */}
      <AnimatePresence>
        {archiveOpen && (
          <motion.div
            key="archive-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setArchiveOpen(false)}
          >
            <motion.div
              key="archive-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="w-full max-w-lg rounded-t-[32px] max-h-[85vh] flex flex-col border-t overflow-hidden shadow-2xl z-50"
              style={{ background: "var(--background)", borderColor: "var(--border-mid)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border-mid)" }}>
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[var(--ink-dark)]" />
                  <p className="font-display italic text-lg font-bold text-[var(--ink-dark)]">Keepsake Archive</p>
                </div>
                <button
                  onClick={() => setArchiveOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--ink-mid)] hover:bg-[var(--paper-mid)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters header */}
              <div className="px-5 py-4 border-b space-y-3 flex-shrink-0 bg-[var(--paper-warm)]/40" style={{ borderColor: "var(--border-mid)" }}>
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  {/* Author selector */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)]">By partner</span>
                    <div className="flex gap-1">
                      {["all", "me", "partner"].map((auth) => (
                        <button
                          key={auth}
                          onClick={() => setFilterAuthor(auth as any)}
                          className={`text-[9px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                            filterAuthor === auth
                              ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                              : "bg-[var(--card-bg)] text-[var(--ink-mid)] border-[var(--border-mid)]"
                          }`}
                        >
                          {auth === "partner" ? (partner?.display_name || "Partner") : auth}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year selector */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)]">Year</span>
                    <div className="flex gap-1">
                      {["all", ...getYears()].map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setFilterYear(yr)}
                          className={`text-[9px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                            filterYear === yr
                              ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                              : "bg-[var(--card-bg)] text-[var(--ink-mid)] border-[var(--border-mid)]"
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Timeline List */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3">
                {filteredNotes.map((note) => {
                  const isAuthor = note.user_id === user?.id;
                  const authorName = isAuthor ? "You" : (partner?.display_name || "Partner");
                  const relTime = (() => {
                    try { return formatDistanceToNow(new Date(note.created_at), { addSuffix: true }); }
                    catch { return ""; }
                  })();

                  return (
                    <div
                      key={note.id}
                      className="bg-[var(--card-bg)] border border-[var(--border-mid)] rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between gap-3 transition-colors hover:bg-[var(--paper-warm)]"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1 font-handwriting" style={{ color: "var(--ink-dark)" }}>
                          "{note.content}"
                        </p>
                        {isAuthor && (
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-[var(--ink-light)] hover:text-red-500 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[var(--ink-light)] font-mono mt-1 pt-1.5 border-t border-[var(--border-mid)]/40">
                        <span>By: <span className="font-bold text-[var(--ink-dark)]">{authorName}</span></span>
                        <span>{relTime}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredNotes.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border-mid)] bg-[var(--card-bg)]/40">
                    <p className="text-xs text-[var(--ink-light)]">No appreciation slips match your filters.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
