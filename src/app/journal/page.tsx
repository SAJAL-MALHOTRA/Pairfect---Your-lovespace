"use client";

import React, { useEffect, useState } from "react";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Lock,
  Heart,
  Loader2,
  Sparkles,
  PenLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JournalHistoryDay {
  date: string;
  prompt: {
    id: string;
    prompt_text: string;
    category?: string;
  } | null;
  userEntry: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  partnerEntry: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  locked: boolean;
}

export default function JournalHistoryPage() {
  const { user, pair, partner, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<JournalHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pair || authLoading) return;

    fetch("/api/journal?history=true")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load journal history");
        return res.json();
      })
      .then((data) => {
        setHistory(data.history || []);
      })
      .catch((err) => {
        setError(err.message || "Could not retrieve journal history");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pair, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Navigation />
        <Loader2 className="w-6 h-6 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt
        title="Daily Journal Archive"
        description="Connect with your partner to unlock and preserve your daily dual-lock entries together."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:pl-36 md:pr-12 py-20 pb-36 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] text-[10px] font-mono font-bold tracking-widest uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dual-Lock Journal Archive</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display italic font-bold text-[var(--text)]">
            Our Sealed &amp; Unsealed Words
          </h1>

          <p className="text-sm text-[var(--text-soft)] max-w-xl leading-relaxed">
            Every day brings one shared question. Neither can peek until both have written — preserving raw, authentic reflection for you two.
          </p>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[var(--burgundy)] animate-spin" />
            <p className="text-xs font-mono text-[var(--text-soft)]">Unsealing archives...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--paper-warm)] p-10 text-center space-y-4 shadow-sm paper-grain">
            <div className="w-12 h-12 rounded-2xl bg-[var(--rose)]/15 text-[var(--burgundy)] flex items-center justify-center mx-auto">
              <PenLine className="w-6 h-6" />
            </div>
            <h3 className="font-display italic text-2xl font-bold text-[var(--text)]">
              Your story starts today
            </h3>
            <p className="text-xs text-[var(--text-soft)] max-w-md mx-auto leading-relaxed">
              You haven't sealed any dual-lock journal entries together yet. Write today's prompt on your dashboard!
            </p>
            <Link href="/dashboard" className="btn-journal inline-block py-2.5 px-6 text-xs font-mono font-bold">
              <span>Write Today's Journal ▷</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((day) => {
              const formattedDate = new Date(day.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--paper-warm)] p-6 sm:p-7 shadow-sm space-y-5 paper-grain relative overflow-hidden"
                >
                  {/* Date & Category */}
                  <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-soft)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--burgundy)]" />
                      <span>{formattedDate}</span>
                    </div>

                    {day.locked ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <Heart className="w-3 h-3 fill-emerald-600" />
                        <span>Unsealed Together</span>
                      </span>
                    )}
                  </div>

                  {/* Prompt */}
                  {day.prompt && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                        Prompt #{day.prompt.category ? `· ${day.prompt.category}` : ""}
                      </p>
                      <h3 className="font-handwriting text-2xl sm:text-3xl text-[var(--text)] leading-snug">
                        {day.prompt.prompt_text}
                      </h3>
                    </div>
                  )}

                  {/* Entries */}
                  {day.locked ? (
                    <div className="p-5 rounded-2xl bg-white/50 border border-[var(--border)] text-center space-y-2">
                      <Lock className="w-5 h-5 text-[var(--burgundy)] mx-auto opacity-70" />
                      <p className="text-xs font-medium text-[var(--text)]">
                        {day.userEntry
                          ? `Your entry is sealed. Waiting for ${partner?.display_name || "partner"} to unseal both!`
                          : `You haven't written your response yet.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* User's response */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-[var(--border)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--burgundy)] bg-[var(--rose)]/15 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        </div>
                        <p className="text-sm font-sans text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                          {day.userEntry?.content}
                        </p>
                      </div>

                      {/* Partner's response */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-[var(--border)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--burgundy)] bg-[var(--rose)]/15 px-2 py-0.5 rounded-full">
                            {partner?.display_name || "Partner"}
                          </span>
                        </div>
                        <p className="text-sm font-sans text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                          {day.partnerEntry?.content}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
