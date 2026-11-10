"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { CoupleBeansMascot } from "@/components/couple-mascot";
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
  ChevronRight,
  PartyPopper,
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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 relative">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-32 space-y-8">
        {/* Hero Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 washi-tape-coral text-stone-900 font-mono text-xs uppercase tracking-widest px-3 py-1 font-bold border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <CalendarIcon className="w-3.5 h-3.5 text-stone-900" />
                <span>Shared Calendar · Milestone Tracker</span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Important Dates & Milestones
              </h1>
              <p className="text-sm font-sans text-stone-600 max-w-lg leading-relaxed">
                Celebrating every milestone, memory, and upcoming date with {partnerName} ♥
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end gap-3 shrink-0">
              <div className="p-2 bg-stone-50 rounded-2xl border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                <CoupleBeansMascot className="w-16 h-16" />
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                <button
                  onClick={() => {
                    setFormError("");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Important Date
                </button>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-stone-800 bg-white hover:bg-stone-50 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Anniversary
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Card: Anniversary & Milestone Progress */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-100 pb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-900 font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 border border-stone-800 flex items-center justify-center text-rose-600">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </span>
              Anniversary Summary
            </span>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-100 text-stone-900 rounded-full border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              {daysTogether} Days Together
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase font-bold tracking-wider text-stone-500">Official Anniversary Date</p>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
                {startedDate
                  ? startedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not Set Yet"}
              </h2>
              <p className="text-xs text-stone-600 font-sans leading-relaxed">
                {startedDate
                  ? `Your story officially began on ${startedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}. Live love counter updates every midnight.`
                  : "Set your anniversary date in settings to unlock live countdowns and milestone tracking."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-900 font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" /> Next Big Milestone
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
                  <div className="space-y-2">
                    <p className="font-heading text-lg font-bold text-stone-900">
                      {nextM.label} in {daysLeft} days
                    </p>
                    <div className="w-full h-3 rounded-full bg-stone-200 border border-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-600 font-medium">
                      <span>Day {daysTogether}</span>
                      <span>{percent}% completed</span>
                      <span>Day {nextM.days}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Custom Important Event Dates Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-xl text-stone-900">
                Our Important Dates
              </h3>
              <p className="text-xs text-stone-600 font-mono mt-0.5">
                Birthdays, first dates, trips, and couple milestones
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-900 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Date
            </button>
          </div>

          {loadingEvents ? (
            <div className="p-10 rounded-2xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] flex items-center justify-center text-xs font-mono text-stone-600 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> Loading dates...
            </div>
          ) : customEvents.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl border-2 border-dashed border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] text-rose-600 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-heading font-bold text-stone-900">
                  No custom dates added yet
                </p>
                <p className="text-xs text-stone-600 max-w-sm mx-auto font-sans leading-relaxed">
                  Add your first date, partner&apos;s birthday, vacations, or any milestone you want to remember together.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormError("");
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer"
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
                    className="p-5 rounded-2xl border-2 border-stone-800 bg-white shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] hover:shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] transition-all flex flex-col justify-between gap-3 group relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] ${
                            timing.status === "today"
                              ? "bg-amber-300 text-stone-900"
                              : timing.status === "upcoming"
                              ? "bg-emerald-300 text-stone-900"
                              : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {timing.label}
                        </span>

                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          disabled={isDeleting}
                          title="Delete date"
                          className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-stone-800 cursor-pointer"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <h4 className="font-heading font-black text-lg text-stone-900 leading-snug">
                        {ev.title}
                      </h4>

                      <p className="text-xs font-mono text-rose-600 font-bold">
                        {formatEventDate(ev.moment_date)}
                      </p>

                      {ev.description && (
                        <p className="text-xs text-stone-600 pt-1 font-sans leading-relaxed border-t border-stone-100">
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
          <div>
            <h3 className="font-heading font-black text-xl text-stone-900">
              Anniversary Milestones
            </h3>
            <p className="text-xs text-stone-600 font-mono mt-0.5">
              Standard relationship milestones and badges unlocked together
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const isPassed = daysTogether >= m.days;
              const daysLeft = m.days - daysTogether;
              return (
                <div
                  key={m.days}
                  className={`p-5 rounded-2xl border-2 border-stone-800 flex items-center justify-between transition-all ${
                    isPassed
                      ? "bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] opacity-90"
                      : "bg-white shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border-2 border-stone-800 flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] ${
                        isPassed
                          ? "bg-emerald-300 text-stone-900"
                          : "bg-rose-200 text-stone-900"
                      }`}
                    >
                      {isPassed ? "✓" : "♥"}
                    </div>
                    <div>
                      <p className="font-heading font-black text-sm text-stone-900">
                        {m.label}
                      </p>
                      <p className="text-[11px] font-mono text-stone-600 font-medium">
                        {isPassed ? "Achieved together!" : `${daysLeft} days to go`}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] text-stone-800">
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
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-800 hover:text-stone-900 bg-white px-4 py-2 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            ← Back to Love Dashboard
          </Link>
        </div>
      </main>

      {/* Add Important Date Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-[#FAF9F6] border-2 border-stone-800 p-6 sm:p-7 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] flex items-center justify-center text-rose-600">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-xl text-stone-900">
                  Add Important Date
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-800 bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-100 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] text-rose-800 text-xs font-mono font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {/* Preset suggestion chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
                  Quick Suggestions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TITLES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTitle(preset)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-stone-800 transition-all cursor-pointer ${
                        newTitle === preset
                          ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                          : "bg-white text-stone-800 hover:bg-stone-100 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Date, Her Birthday..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-800 bg-white text-stone-900 text-sm focus:outline-hidden focus:shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] font-sans"
                />
              </div>

              {/* Date input */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-800 bg-white text-stone-900 text-sm focus:outline-hidden focus:shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] font-mono"
                />
              </div>

              {/* Note / Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Memory Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. At the rooftop cafe where we talked until 2 AM"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-800 bg-white text-stone-900 text-sm focus:outline-hidden focus:shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] font-sans resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
