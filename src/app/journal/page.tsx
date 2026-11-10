"use client";

import React, { useEffect, useState } from "react";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { CoupleBeansMascot } from "@/components/couple-mascot";
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Navigation />
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
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

  const partnerName = partner?.display_name || "Partner";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-36 space-y-8">
        {/* Hero Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 washi-tape-coral text-stone-900 font-mono text-xs uppercase tracking-widest px-3 py-1 font-bold border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <BookOpen className="w-3.5 h-3.5 text-stone-900" />
                <span>Our Living Archive · Dual-Lock Journal</span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Our Sealed &amp; Unsealed Words
              </h1>
              <p className="text-sm font-sans text-stone-600 max-w-lg leading-relaxed">
                Every day brings one shared question. Neither can peek until both have written: preserving raw, authentic reflection for you two.
              </p>
            </div>

            <div className="p-2 bg-stone-50 rounded-2xl border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] shrink-0 self-start sm:self-center">
              <CoupleBeansMascot className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            <p className="text-xs font-mono font-bold text-stone-600">Unsealing archives...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-100 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] text-rose-900 text-xs font-mono">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border-2 border-stone-800 bg-white p-10 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] text-rose-600 flex items-center justify-center mx-auto">
              <PenLine className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-2xl text-stone-900">
              Your story starts today
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed font-sans">
              You haven&apos;t sealed any dual-lock journal entries together yet. Write today&apos;s prompt on your dashboard!
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all"
            >
              <span>Write Today&apos;s Journal ▷</span>
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
                <div
                  key={day.date}
                  className="rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-7 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-5 relative overflow-hidden"
                >
                  {/* Date & Category */}
                  <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-600 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>{formattedDate}</span>
                    </div>

                    {day.locked ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-900 bg-amber-200 border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] px-2.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-900 bg-emerald-200 border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] px-2.5 py-0.5 rounded-full">
                        <Heart className="w-3 h-3 fill-emerald-700 text-emerald-700" />
                        <span>Unsealed Together</span>
                      </span>
                    )}
                  </div>

                  {/* Prompt */}
                  {day.prompt && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">
                        Daily Prompt {day.prompt.category ? `· ${day.prompt.category}` : ""}
                      </p>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-stone-900 leading-snug">
                        {day.prompt.prompt_text}
                      </h3>
                    </div>
                  )}

                  {/* Entries */}
                  {day.locked ? (
                    <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-2">
                      <Lock className="w-5 h-5 text-stone-700 mx-auto" />
                      <p className="text-xs font-bold text-stone-800 font-sans">
                        {day.userEntry
                          ? `Your entry is sealed. Waiting for ${partnerName} to unseal both!`
                          : `You haven't written your response yet.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* User's response */}
                      <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900 bg-rose-200 border border-stone-800 px-2 py-0.5 rounded-md">
                            You
                          </span>
                        </div>
                        <p className="text-sm font-sans text-stone-800 leading-relaxed whitespace-pre-wrap">
                          {day.userEntry?.content}
                        </p>
                      </div>

                      {/* Partner's response */}
                      <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900 bg-amber-200 border border-stone-800 px-2 py-0.5 rounded-md">
                            {partnerName}
                          </span>
                        </div>
                        <p className="text-sm font-sans text-stone-800 leading-relaxed whitespace-pre-wrap">
                          {day.partnerEntry?.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="pt-6 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-800 hover:text-stone-900 bg-white px-4 py-2 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            ← Back to Love Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
