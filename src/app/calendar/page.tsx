"use client";

import React from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Calendar as CalendarIcon, Heart, Sparkles, Clock, ArrowRight, Gift, Edit3 } from "lucide-react";

export default function CalendarPage() {
  const { pair, partner } = useAuth();
  const startedDate = pair?.started_dating_date ? new Date(pair.started_dating_date) : null;
  const partnerName = partner?.display_name || "Partner";

  const daysTogether = pair?.started_dating_date
    ? Math.max(1, Math.floor((Date.now() - new Date(pair.started_dating_date).getTime()) / 86400000) + 1)
    : 1;

  const milestones = [
    { days: 7, label: "1 Week Together" },
    { days: 30, label: "1 Month Together" },
    { days: 100, label: "100 Days Together" },
    { days: 180, label: "6 Months Together" },
    { days: 365, label: "1 Year Anniversary" },
    { days: 500, label: "500 Days Together" },
    { days: 730, label: "2 Years Anniversary" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] relative">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-16 pb-36 pt-24 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[var(--rose)] text-xs font-mono uppercase tracking-widest">
              <CalendarIcon className="w-4 h-4" />
              <span>Relationship Calendar</span>
            </div>
            <h1 className="font-heading font-semibold text-3xl md:text-4xl text-[var(--text)] mt-1">
              Important Dates & Milestones
            </h1>
            <p className="text-xs text-[var(--text-soft)] font-mono mt-1">
              Celebrating every milestone with {partnerName} ♥
            </p>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-[var(--burgundy)] bg-[var(--rose)]/15 border border-[var(--rose)]/30 transition-all hover:bg-[var(--rose)]/25 w-fit"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Anniversary Date
          </Link>
        </div>

        {/* Hero Card: Anniversary */}
        <div className="p-8 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] paper-grain border border-[var(--border)] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--rose)] font-semibold flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-current" /> Anniversary Summary
            </span>
            <span className="text-xs font-mono text-[var(--text-soft)]">
              {daysTogether} Days Together
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-xs font-mono uppercase text-[var(--text-soft)]">Official Anniversary Date</p>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-[var(--text)] mt-1">
                {startedDate ? startedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not Set Yet"}
              </h2>
              <p className="text-xs text-[var(--text-soft)] mt-2 leading-relaxed">
                {startedDate
                  ? `Your story officially began on ${startedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                  : "Set your anniversary date in settings to unlock live countdowns and milestone tracking."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--burgundy)] font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Next Milestone
              </div>
              {(() => {
                const nextM = milestones.find((m) => m.days > daysTogether) || { days: daysTogether + 100, label: `${daysTogether + 100} Days` };
                const daysLeft = nextM.days - daysTogether;
                const percent = Math.min(100, Math.round((daysTogether / nextM.days) * 100));
                return (
                  <div>
                    <p className="font-heading text-lg font-bold text-[var(--text)]">{nextM.label} in {daysLeft} days</p>
                    <div className="w-full h-2.5 rounded-full bg-[var(--border)] overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-[var(--burgundy)] transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-soft)] text-right mt-1">{percent}% completed</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Milestone Timeline List */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-xl text-[var(--text)]">Upcoming & Past Milestones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const isPassed = daysTogether >= m.days;
              const daysLeft = m.days - daysTogether;
              return (
                <div
                  key={m.days}
                  className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    isPassed
                      ? "bg-[var(--bg-secondary)] border-[var(--border)] opacity-80"
                      : "bg-[var(--bg-secondary)] border-[var(--rose)]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPassed ? "bg-emerald-500/15 text-emerald-600" : "bg-[var(--rose)]/20 text-[var(--burgundy)]"
                    }`}>
                      {isPassed ? "✓" : "♥"}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-[var(--text)]">{m.label}</p>
                      <p className="text-[10px] font-mono text-[var(--text-soft)]">
                        {isPassed ? "Achieved!" : `${daysLeft} days to go`}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[var(--text-soft)]">
                    Day {m.days}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Back Link */}
        <div className="pt-6 text-center">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[var(--burgundy)] hover:underline">
            ← Back to Love Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
