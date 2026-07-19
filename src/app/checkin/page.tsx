"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { moodDetails } from "@/app/dashboard/page";
import { Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dried flower — bottom-right corner of the page
function PageFlower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} fill="none" aria-hidden>
      <path d="M24 70 C24 54 23 38 25 24 C26 15 24 6 23 0" stroke="#D4B892" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 58 C18 52 11 50 7 44" stroke="#D4B892" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 44 C17 38 11 35 6 29" stroke="#D4B892" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 52 C30 46 37 44 41 38" stroke="#D4B892" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 38 C31 32 37 29 42 23" stroke="#D4B892" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7"  cy="44" r="1.8" fill="#D4B892" opacity="0.7" />
      <circle cx="6"  cy="29" r="1.6" fill="#D4B892" opacity="0.64" />
      <circle cx="41" cy="38" r="1.8" fill="#D4B892" opacity="0.7" />
      <circle cx="42" cy="23" r="1.6" fill="#D4B892" opacity="0.64" />
      <circle cx="23" cy="0"  r="2.2" fill="#D4B892" opacity="0.75" />
    </svg>
  );
}

export default function CheckinPage() {
  const { user, pair, loading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Nav hides when writing
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(isFocused ? "navigation-hide" : "navigation-show"));
  }, [isFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) { setError("Choose how you're feeling first."); return; }
    if (!pair)          { setError("You're not paired yet."); return; }
    setSubmitting(true); setError(null);
    try {
      const { error: insertErr } = await supabase.from("mood_logs").insert({
        pair_id: pair.id, user_id: user!.id,
        mood: selectedMood as any,
        mood_intensity: intensity,
        note: note.trim() || null,
      });
      if (insertErr) throw insertErr;
      window.dispatchEvent(new CustomEvent("navigation-show"));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log today's check-in.");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />

      <main className="max-w-xl mx-auto px-5 py-16 pb-36">
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Date stamp — Caveat, barely there */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <p className="font-handwriting text-base text-[var(--ink-light)]">{today}</p>
          </motion.div>

          {/* Page title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display italic text-3xl font-black text-[var(--ink-dark)]"
          >
            How is your heart today?
          </motion.h1>

          {/* Mood pills — small, subordinate strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-3">Your feeling</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(moodDetails).map(([key, val]) => {
                const sel = selectedMood === key;
                return (
                  <motion.button
                    key={key} type="button"
                    onClick={() => setSelectedMood(key)}
                    whileTap={{ scale: 0.92 }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all duration-150 ${
                      sel
                        ? "bg-[var(--seal-red)] text-white border-[var(--seal-red)] shadow-sm"
                        : "bg-[var(--card-bg)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-mid)]"
                    }`}
                  >
                    <span>{val.emoji}</span>
                    <span>{val.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Intensity — appears only after mood is selected */}
          <AnimatePresence>
            {selectedMood && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-3">Intensity</p>
                <div className="flex items-center gap-4">
                  <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
                    className="flex-1 accent-[var(--seal-red)] h-1 cursor-pointer" />
                  <span className="font-display font-black text-2xl text-[var(--ink-dark)] w-6 text-center tabular-nums">{intensity}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE HERO — the blank page */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-3">Your note</p>
            <motion.div
              className="relative rounded-3xl overflow-hidden"
              animate={{
                borderColor: isFocused ? "rgba(196,168,130,0.8)" : "rgba(229,217,197,1)",
                boxShadow: isFocused
                  ? "0 12px 48px rgba(60,40,20,0.1),0 2px 8px rgba(60,40,20,0.06)"
                  : "0 4px 20px rgba(60,40,20,0.06)",
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: isFocused
                  ? "linear-gradient(180deg,#FFFDF5 0%,#FBF6EA 100%)"
                  : "linear-gradient(180deg,#FAF6EE 0%,#F5EDD8 100%)",
                border: "1px solid var(--border-warm)",
                backgroundImage: isFocused
                  ? "linear-gradient(180deg,#FFFDF5 0%,#FBF6EA 100%),linear-gradient(transparent calc(32px - 1px),rgba(196,168,130,0.24) calc(32px - 1px),rgba(196,168,130,0.24) 32px,transparent 32px)"
                  : "linear-gradient(180deg,#FAF6EE 0%,#F5EDD8 100%),linear-gradient(transparent calc(32px - 1px),rgba(196,168,130,0.18) calc(32px - 1px),rgba(196,168,130,0.18) 32px,transparent 32px)",
                backgroundSize: "100%,100% 32px",
              }}
            >
              <PageFlower className="absolute bottom-3 right-4 w-8 h-12 opacity-35 pointer-events-none" />
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="What's on your mind?"
                rows={9}
                className="w-full bg-transparent px-7 pt-6 pb-16 text-base placeholder-[#C4B89A] focus:outline-none resize-none"
                style={{ lineHeight: "32px", fontFamily: "var(--font-handwriting),cursive", color: "var(--ink-dark)" }}
              />
            </motion.div>
          </motion.div>



          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={submitting || !selectedMood}
            className="btn-primary w-full py-4 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Seal this entry"}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
