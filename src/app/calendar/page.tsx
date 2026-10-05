"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  Heart,
  Sparkles,
  Clock,
  ArrowRight,
  Gift,
  Edit3,
  Plus,
  Trash2,
  X,
  Loader2,
  Bookmark,
} from "lucide-react";

interface CustomEvent {
  id: string;
  pair_id: string;
  created_by: string;
  title: string;
  description: string | null;
  moment_date: string;
  created_at: string;
}

const PRESET_TITLES = [
  "First Date",
  "Partner's Birthday",
  "First Kiss",
  "First Trip Together",
  "Moved In Together",
  "Got Engaged",
  "Our Special Song Day",
];

function getEventTiming(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return { days: 0, status: "today" as const, label: "Today!" };
  const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / 86400000);

  if (diffDays === 0) {
    return { days: 0, status: "today" as const, label: "Today! 🎉" };
  } else if (diffDays > 0) {
    return {
      days: diffDays,
      status: "upcoming" as const,
      label: `In ${diffDays} day${diffDays === 1 ? "" : "s"}`,
    };
  } else {
    const abs = Math.abs(diffDays);
    return {
      days: abs,
      status: "past" as const,
      label: `${abs} day${abs === 1 ? "" : "s"} ago`,
    };
  }
}

function formatEventDate(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const { pair, partner, user } = useAuth();
  const supabase = createClient();

  const startedDate = pair?.started_dating_date
    ? new Date(pair.started_dating_date)
    : null;
  const partnerName = partner?.display_name || "Partner";

  const daysTogether = pair?.started_dating_date
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(pair.started_dating_date).getTime()) / 86400000) + 1
      )
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

  // Custom Events State
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!pair?.id) {
      setLoadingEvents(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("shared_moments")
        .select("*")
        .eq("pair_id", pair.id)
        .order("moment_date", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
      } else {
        setCustomEvents(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, [pair?.id, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair?.id || !user?.id) {
      setFormError("Please log in with an active pair to add dates.");
      return;
    }
    if (!newTitle.trim()) {
      setFormError("Please give this date a title.");
      return;
    }
    if (!newDate) {
      setFormError("Please select a date.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const { data, error } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          created_by: user.id,
          title: newTitle.trim(),
          moment_date: newDate,
          description: newNote.trim() || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setCustomEvents((prev) => [...prev, data]);
      }

      setIsModalOpen(false);
      setNewTitle("");
      setNewDate("");
      setNewNote("");
    } catch (err: any) {
      setFormError(err.message || "Failed to add date. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this date?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("shared_moments")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
      setCustomEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to remove event. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

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

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-white bg-[var(--burgundy)] hover:bg-[var(--burgundy)]/90 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Important Date
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-[var(--burgundy)] bg-[var(--rose)]/15 border border-[var(--rose)]/30 transition-all hover:bg-[var(--rose)]/25 w-fit"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Anniversary Date
            </Link>
          </div>
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
                {startedDate
                  ? startedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not Set Yet"}
              </h2>
              <p className="text-xs text-[var(--text-soft)] mt-2 leading-relaxed">
                {startedDate
                  ? `Your story officially began on ${startedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}.`
                  : "Set your anniversary date in settings to unlock live countdowns and milestone tracking."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--burgundy)] font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Next Milestone
              </div>
              {(() => {
                const nextM =
                  milestones.find((m) => m.days > daysTogether) || {
                    days: daysTogether + 100,
                    label: `${daysTogether + 100} Days`,
                  };
                const daysLeft = nextM.days - daysTogether;
                const percent = Math.min(
                  100,
                  Math.round((daysTogether / nextM.days) * 100)
                );
                return (
                  <div>
                    <p className="font-heading text-lg font-bold text-[var(--text)]">
                      {nextM.label} in {daysLeft} days
                    </p>
                    <div className="w-full h-2.5 rounded-full bg-[var(--border)] overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-[var(--burgundy)] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-soft)] text-right mt-1">
                      {percent}% completed
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Custom Important Event Dates Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-xl text-[var(--text)]">
                Our Important Dates
              </h3>
              <p className="text-xs text-[var(--text-soft)] font-mono mt-0.5">
                Birthdays, first dates, trips, and couple milestones
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--burgundy)] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Date
            </button>
          </div>

          {loadingEvents ? (
            <div className="p-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-mono text-[var(--text-soft)] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--burgundy)]" /> Loading dates...
            </div>
          ) : customEvents.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/50 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-heading font-medium text-[var(--text)]">
                No custom dates added yet
              </p>
              <p className="text-xs text-[var(--text-soft)] max-w-sm mx-auto">
                Add your first date, partner&apos;s birthday, vacations, or any milestone you want to remember together.
              </p>
              <button
                onClick={() => {
                  setFormError("");
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-white bg-[var(--burgundy)] hover:bg-[var(--burgundy)]/90 transition-all cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customEvents.map((ev) => {
                const timing = getEventTiming(ev.moment_date);
                const isDeleting = deletingId === ev.id;
                return (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--rose)]/40 transition-all flex flex-col justify-between gap-3 shadow-2xs group relative"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                            timing.status === "today"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              : timing.status === "upcoming"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-[var(--border)] text-[var(--text-soft)]"
                          }`}
                        >
                          {timing.label}
                        </span>

                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          disabled={isDeleting}
                          title="Delete date"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--text-soft)] hover:text-rose-600 rounded cursor-pointer"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <h4 className="font-heading font-bold text-base text-[var(--text)]">
                        {ev.title}
                      </h4>

                      <p className="text-xs font-mono text-[var(--burgundy)] font-medium">
                        {formatEventDate(ev.moment_date)}
                      </p>

                      {ev.description && (
                        <p className="text-xs text-[var(--text-soft)] pt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestone Timeline List */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-xl text-[var(--text)]">
            Anniversary Milestones
          </h3>
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
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPassed
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-[var(--rose)]/20 text-[var(--burgundy)]"
                      }`}
                    >
                      {isPassed ? "✓" : "♥"}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-[var(--text)]">
                        {m.label}
                      </p>
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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[var(--burgundy)] hover:underline"
          >
            ← Back to Love Dashboard
          </Link>
        </div>
      </main>

      {/* Add Important Date Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-[var(--bg)] border border-[var(--border)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[var(--burgundy)]" />
                <h3 className="font-heading font-bold text-lg text-[var(--text)]">
                  Add Important Date
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-soft)] hover:text-[var(--text)] p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {/* Preset suggestion chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-[var(--text-soft)]">
                  Suggestions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TITLES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTitle(preset)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        newTitle === preset
                          ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)]"
                          : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text)] hover:border-[var(--rose)]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-[var(--text-soft)]">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Date, Her Birthday..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-sm focus:outline-hidden focus:border-[var(--burgundy)]"
                />
              </div>

              {/* Date input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-[var(--text-soft)]">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-sm focus:outline-hidden focus:border-[var(--burgundy)]"
                />
              </div>

              {/* Note / Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-[var(--text-soft)]">
                  Memory Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. At the rooftop cafe where we talked until 2 AM"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-sm focus:outline-hidden focus:border-[var(--burgundy)] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono uppercase text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-white bg-[var(--burgundy)] hover:bg-[var(--burgundy)]/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Date"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
