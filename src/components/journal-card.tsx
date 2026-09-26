"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Heart } from "lucide-react";
import Link from "next/link";

interface Prompt {
  id: string;
  prompt_text: string;
}

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function JournalCard() {
  const { user, partner, pair, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [entries, setEntries] = useState<{ user?: JournalEntry; partner?: JournalEntry; locked: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchJournal = async () => {
    try {
      const res = await fetch("/api/journal");
      if (!res.ok) throw new Error("Failed to load journal");
      const data = await res.json();
      setPrompt(data.prompt);
      setEntries(data.entries);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && pair) {
      fetchJournal();
    }
  }, [user, pair]);

  const handleSubmit = async () => {
    if (!content.trim() || !prompt) return;
    setSubmitting(true);
    setError("");
    
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, prompt_id: prompt.id }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      
      await fetchJournal();
      setContent("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!pair && !loading)) return null;

  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-xl p-6 relative overflow-hidden paper-grain">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Heart size={80} />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">Daily Journal</span>
        <Link href="/journal" className="text-xs text-[var(--burgundy)] hover:underline font-medium">History →</Link>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-pulse w-8 h-8 rounded-full bg-[var(--border)]" />
        </div>
      ) : (
        <>
          {prompt && (
            <div className="mb-6">
              <h3 className="font-handwriting text-2xl md:text-3xl text-[var(--text)] leading-tight mb-2">
                {prompt.prompt_text}
              </h3>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}

          <AnimatePresence mode="wait">
            {!entries ? (
              <motion.div
                key="compose"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4 relative z-10"
              >
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="w-full bg-white/50 border border-[var(--border)] rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/20 resize-none font-medium text-[var(--text)]"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !content.trim()}
                  className="btn-journal w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 transition-all bg-[var(--burgundy)] text-white rounded-xl font-medium"
                >
                  {submitting ? "Sealing..." : "Write & Seal ♡"}
                </button>
              </motion.div>
            ) : entries.locked ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/40 rounded-2xl p-6 border border-[var(--border)] flex flex-col items-center justify-center text-center space-y-3 relative z-10"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[var(--burgundy)]">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="font-medium text-[var(--text)]">Locked until {partner?.display_name || "your partner"} writes theirs</p>
                  <p className="text-sm text-[var(--text-soft)] mt-1 opacity-60">Your entry is safely sealed.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="unlocked"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10"
              >
                <div className="bg-white/60 rounded-2xl p-5 border border-[var(--border)] relative mt-2 md:mt-0 pt-6">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--burgundy)] uppercase absolute -top-2.5 left-4 bg-[var(--paper-warm)] px-2 border border-[var(--border)] rounded-full">You</span>
                  <p className="text-[var(--text)] whitespace-pre-wrap">{entries.user?.content}</p>
                </div>
                <div className="bg-white/60 rounded-2xl p-5 border border-[var(--border)] relative mt-4 md:mt-0 pt-6">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--burgundy)] uppercase absolute -top-2.5 left-4 bg-[var(--paper-warm)] px-2 border border-[var(--border)] rounded-full">{partner?.display_name || "Partner"}</span>
                  <p className="text-[var(--text)] whitespace-pre-wrap">{entries.partner?.content}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
