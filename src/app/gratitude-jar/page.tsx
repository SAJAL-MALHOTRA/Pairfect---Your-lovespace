"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Plus, X, Trash2, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Color palette for folded paper slips inside the jar
const SLIP_COLORS = [
  "bg-rose-200 dark:bg-rose-900/40",
  "bg-pink-200 dark:bg-pink-900/40",
  "bg-amber-200 dark:bg-amber-900/40",
  "bg-red-200 dark:bg-red-900/40",
  "bg-orange-200 dark:bg-orange-900/40",
];

export default function GratitudeJarPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [notes, setNotes] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);

  const fetchNotes = async (currentLimit = limit) => {
    if (!pair) return;
    try {
      const { data, error: err } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(currentLimit + 1);

      if (err) throw err;

      if (data && data.length > currentLimit) {
        setHasMore(true);
        setNotes(data.slice(0, currentLimit));
      } else {
        setHasMore(false);
        setNotes(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchNotes(limit);
      const ch = supabase.channel(`gratitude-${pair.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "gratitude_entries", filter: `pair_id=eq.${pair.id}` }, () => fetchNotes(limit))
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [loading, pair, limit]);

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

      // Animate the drop
      setDroppedId(data.id);
      setMessage("");
      await fetchNotes(limit);
      setTimeout(() => setDroppedId(null), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to drop note into the jar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShake = () => {
    if (notes.length === 0 || shaking) return;
    setShaking(true);
    setActiveNote(null);
    setTimeout(() => {
      setShaking(false);
      const partnerNotes = notes.filter(n => n.user_id !== user?.id);
      const pool = partnerNotes.length > 0 ? partnerNotes : notes;
      const selected = pool[Math.floor(Math.random() * pool.length)];
      setActiveNote(selected);
    }, 900);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Discard this appreciation note?")) return;
    try {
      await supabase.from("gratitude_entries").delete().eq("id", id);
      fetchNotes(limit);
      if (activeNote?.id === id) setActiveNote(null);
    } catch {}
  };

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

      {/* Decorative ambient background glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-30 dark:opacity-20">
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle 500px at 50% 15%, rgba(244,114,182,0.06) 0%, transparent 80%)",
        }} />
      </div>

      <main className="max-w-xl mx-auto px-5 py-16 pb-36 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-1.5">
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Appreciation Ritual</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">Our Gratitude Jar</h1>
          <p className="font-handwriting text-sm text-[var(--ink-mid)]">Small moments of quiet appreciation.</p>
        </div>

        {/* THE HERO: The interactive glass jar */}
        <div className="flex flex-col items-center space-y-6">
          <motion.div
            className="relative"
            animate={shaking ? {
              x: [0, -10, 10, -10, 10, -8, 8, -5, 5, 0],
              y: [0, 4, -4, 4, -4, 3, -3, 2, -2, 0],
              rotate: [0, -4, 4, -4, 4, -3, 3, -2, 2, 0],
            } : {}}
            transition={{ duration: 0.85, ease: "easeInOut" }}
            onClick={handleShake}
          >
            {/* The physical jar shape */}
            <div
              className="w-48 h-72 rounded-t-[44px] rounded-b-[24px] border-[3px] border-white/25 dark:border-white/10 relative cursor-pointer select-none overflow-hidden flex flex-col justify-end p-4 transition-transform duration-350 hover:scale-[1.02] active:scale-98"
              style={{
                background: "rgba(253, 250, 244, 0.12)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "inset 0 10px 24px rgba(255,255,255,0.18), inset 0 -10px 24px rgba(60,40,20,0.15), 0 20px 48px rgba(60,40,20,0.12)",
              }}
            >
              {/* Lid */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gradient-to-r from-amber-700 to-amber-800 rounded-lg shadow-md border-b border-amber-900/60 z-20 flex items-center justify-center">
                <div className="w-16 h-[2px] bg-amber-500/20 rounded" />
              </div>

              {/* hanging tag */}
              <div className="absolute top-10 left-6 w-9 h-12 bg-[#FAF5EB] border border-[#DDD0B8] shadow-sm rounded-sm origin-top rotate-[14deg] z-10 flex flex-col items-center justify-center p-1 font-mono text-[7px] font-bold text-[#8A7B6E]">
                <div className="w-1 h-1 bg-[#802030] rounded-full mb-1" />
                <span>SWEET</span>
                <span>NOTES</span>
              </div>

              {/* Folded notes inside the jar */}
              <div className="relative flex-1 w-full mt-8 flex flex-wrap gap-2.5 items-end justify-center p-3">
                {notes.map((_, i) => {
                  const col = SLIP_COLORS[i % SLIP_COLORS.length];
                  return (
                    <motion.div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-sm border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${col}`}
                      animate={shaking ? {
                        y: [0, -40, 0],
                        x: [0, (i % 2 === 0 ? 20 : -20), 0],
                        rotate: [0, 180, 360],
                      } : {}}
                      transition={{ duration: 0.8, delay: i * 0.02 }}
                    />
                  );
                })}

                {notes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <p className="text-[9px] font-mono text-[var(--ink-light)] uppercase tracking-wider">Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reflection shine line */}
            <div className="absolute top-8 left-10 w-1.5 h-48 bg-white/20 rounded-full blur-[1px] pointer-events-none" />

            {/* Dropped note flying into the jar animation */}
            <AnimatePresence>
              {droppedId && (
                <motion.div
                  initial={{ y: -160, x: 80, scale: 1.5, rotate: 0 }}
                  animate={{ y: 80, x: 0, scale: 0.2, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeIn" }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm bg-rose-200 border shadow z-30"
                />
              )}
            </AnimatePresence>
          </motion.div>

          <button
            onClick={handleShake}
            disabled={notes.length === 0 || shaking}
            className="btn-primary py-3 px-8 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
          >
            {shaking ? "Shaking..." : "Shake to read"}
          </button>
        </div>

        {/* Active Note (unfolded paper slip) */}
        <AnimatePresence mode="wait">
          {activeNote && (
            <motion.div
              key={activeNote.id}
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="paper-grain relative rounded-3xl p-8"
              style={{
                background: "linear-gradient(180deg,#FFFDF5 0%,#FBF6EA 100%)",
                border: "1px solid var(--border-warm)",
                boxShadow: "0 16px 48px -8px rgba(60,40,20,0.14), 0 2px 8px rgba(60,40,20,0.06)",
              }}
            >
              {/* Torn slip details */}
              <div className="absolute top-0 right-8 w-12 h-4 pointer-events-none" style={{ background: "var(--washi-warm)", transform: "rotate(-2deg)" }} />

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">
                  <span>Appreciation note</span>
                  <span>From: {activeNote.user_id === user?.id ? "You" : (partner?.display_name || "Partner")}</span>
                </div>
                <p className="font-handwriting text-lg text-[var(--ink-dark)] leading-relaxed whitespace-pre-wrap">
                  "{activeNote.content}"
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveNote(null)}
                    className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--ink-dark)] cursor-pointer"
                  >
                    Fold & Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop a Note Form — formatted as a small message slip */}
        <motion.div
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
              <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">Drop a message</p>
              <h2 className="font-display italic text-lg font-bold text-[var(--ink-dark)]">Appreciation Slip</h2>
            </div>

            <textarea
              required
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What are you grateful for about your partner today?"
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fold and Drop 💌"}
            </button>
          </form>
        </motion.div>

        {/* Appreciation timeline history */}
        <div className="space-y-4 pt-4">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">History</p>
          <div className="space-y-3">
            {notes.map((note) => {
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1" style={{ color: "var(--ink-dark)" }}>
                      {note.content}
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
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-light)] font-mono mt-1">
                    <span>By: <span className="font-bold text-[var(--ink-dark)]">{authorName}</span></span>
                    <span>{relTime}</span>
                  </div>
                </div>
              );
            })}

            {notes.length === 0 && (
              <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--border-mid)]">
                <p className="text-xs text-[var(--ink-light)]">Timeline is empty.</p>
              </div>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setLimit(prev => prev + 15)}
                className="btn-secondary text-[10px] uppercase tracking-widest py-2 px-5 font-bold cursor-pointer"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
