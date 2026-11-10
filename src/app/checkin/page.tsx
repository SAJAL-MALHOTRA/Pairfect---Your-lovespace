"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import {
  Loader2,
  Heart,
  ArrowLeft,
  Smile,
  Sparkles,
  Calendar,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const MOODS = [
  { key: "joyful", emoji: "😊", label: "Joyful" },
  { key: "content", emoji: "🥰", label: "Content" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "tired", emoji: "🥱", label: "Tired" },
  { key: "stressed", emoji: "😰", label: "Stressed" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "anxious", emoji: "🥺", label: "Anxious" },
  { key: "excited", emoji: "🤪", label: "Excited" },
  { key: "loved", emoji: "💖", label: "Loved" },
  { key: "distant", emoji: "😶", label: "Distant" },
];

export default function CheckinPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [partnerLatest, setPartnerLatest] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const partnerName = partner?.display_name || "Partner";

  const fetchLogs = async () => {
    if (!pair || !user) return;
    setFetching(true);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("pair_id", pair.id)
        .gte("created_at", fourteenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (data) {
        setRecentLogs(data.filter((log: any) => log.user_id === user.id));

        const partnerLogs = data.filter((log: any) => log.user_id !== user.id);
        if (partnerLogs.length > 0) {
          setPartnerLatest(partnerLogs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pair, user, supabase]);

  const handleSubmit = async () => {
    if (!selectedMood || !pair || !user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("mood_logs").insert({
        pair_id: pair.id,
        user_id: user.id,
        mood: selectedMood,
        mood_intensity: intensity,
        note: note.trim() || null,
      });

      if (!error) {
        setSubmitted(true);
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Navigation />
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!pair) {
    return <UnpairedPrompt title="Daily Mood Check-in" />;
  }

  const todayStr = new Date().toDateString();
  const todaysLogs = recentLogs.filter(
    (l) => new Date(l.created_at).toDateString() === todayStr
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col pb-24">
      <Navigation />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-20 sm:pt-24 space-y-8">
        {/* Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 washi-tape-coral text-stone-900 font-mono text-xs uppercase tracking-widest px-3 py-1 font-bold border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <Smile className="w-3.5 h-3.5 text-stone-900" />
                <span>Daily Check-in · Emotional Sanctuary</span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                How are you feeling today?
              </h1>
              <p className="text-sm font-sans text-stone-600 leading-relaxed max-w-md">
                Share your heart with {partnerName}. One honest check-in each day keeps you both emotionally close.
              </p>
            </div>

            <div className="p-2 bg-stone-50 rounded-2xl border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] shrink-0 self-start sm:self-center">
              <CoupleBeansMascot className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Check-in Interactive Board */}
        <div className="rounded-3xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] p-6 sm:p-8 relative overflow-hidden">
          {!submitted ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Step 1: Pick your current mood
                </p>
                {/* Mood Grid */}
                <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMood(m.key)}
                        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer border-2 border-stone-800 ${
                          isSelected
                            ? "bg-amber-200 scale-105 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
                            : "bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px]"
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mb-1">{m.emoji}</span>
                        <span className="text-[11px] font-heading font-bold text-stone-900 tracking-tight">
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Slider & Note */}
              {selectedMood && (
                <div className="space-y-5 pt-4 border-t-2 border-stone-100 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">
                      <span>Intensity: Barely Felt (1)</span>
                      <span>Deeply Overwhelming (5)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between px-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full border border-stone-800 ${
                            i <= intensity ? "bg-rose-500" : "bg-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
                      Step 2: Add a personal note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={280}
                      placeholder="What is bringing you this feeling right now? Share details for your partner..."
                      className="w-full bg-stone-50 border-2 border-stone-800 rounded-2xl p-4 text-sm font-sans resize-none focus:outline-hidden focus:shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-all h-28 text-stone-900"
                    />
                    <div className="text-[11px] font-mono text-stone-500 text-right">
                      {note.length}/280
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Logging Mood...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Log My Mood for {partnerName}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-2xl border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] flex items-center justify-center text-4xl">
                {MOODS.find((m) => m.key === selectedMood)?.emoji}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-heading font-black text-stone-900">
                  Mood Logged!
                </h3>
                <p className="text-xs text-stone-600 font-sans">
                  Thanks for checking in today. {partnerName} can now see how you are doing.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-stone-800 bg-white hover:bg-stone-50 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setSelectedMood(null);
                    setNote("");
                    setIntensity(3);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer"
                >
                  Log Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My Today's History */}
            <div className="rounded-2xl border-2 border-stone-800 bg-white p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  My Today
                </h3>
                <span className="text-[10px] font-mono text-stone-500">
                  {todaysLogs.length} logged
                </span>
              </div>
              {fetching ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                </div>
              ) : todaysLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {todaysLogs.map((log) => {
                    const mood = MOODS.find((m) => m.key === log.mood);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)]"
                      >
                        <span className="text-2xl">{mood?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-heading font-bold text-sm text-stone-900">
                              {mood?.label}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {new Date(log.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {log.note && (
                            <p className="text-xs text-stone-600 truncate mt-0.5 font-sans">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-500 text-center py-4 font-sans">
                  No check-ins yet today.
                </p>
              )}
            </div>

            {/* Partner Latest */}
            <div className="rounded-2xl border-2 border-stone-800 bg-white p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  {partnerName}&apos;s Latest
                </h3>
                <span className="text-[10px] font-mono text-rose-600 font-bold">
                  {partnerLatest ? "Active" : "Awaiting"}
                </span>
              </div>
              {fetching ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                </div>
              ) : partnerLatest ? (
                <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)]">
                  <span className="text-3xl">
                    {MOODS.find((m) => m.key === partnerLatest.mood)?.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-black text-sm text-stone-900">
                      {MOODS.find((m) => m.key === partnerLatest.mood)?.label}
                    </div>
                    <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                      {new Date(partnerLatest.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {partnerLatest.note && (
                      <p className="text-xs text-stone-700 mt-2 bg-white p-2.5 rounded-lg border border-stone-300 font-sans leading-relaxed">
                        &quot;{partnerLatest.note}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 text-center py-4 font-sans">
                  No recent check-ins from {partnerName}.
                </p>
              )}
            </div>
          </div>

          {/* 14 Day Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 px-1">
              Last 14 Days Check-in History
            </h3>
            <div className="space-y-3">
              {fetching ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                </div>
              ) : recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  const mood = MOODS.find((m) => m.key === log.mood);
                  return (
                    <div
                      key={log.id}
                      className="bg-white p-4 rounded-2xl flex items-start gap-4 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                    >
                      <div className="text-2xl mt-0.5">{mood?.emoji}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-heading font-bold text-sm text-stone-900">
                            {mood?.label}
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {new Date(log.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {/* Intensity visualization */}
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full border border-stone-800 ${
                                i <= log.mood_intensity
                                  ? "bg-rose-500"
                                  : "bg-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                        {log.note && (
                          <p className="text-xs font-sans text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                            {log.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-stone-500 text-center py-8 font-sans bg-white rounded-2xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  No check-ins in the last 14 days.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
