"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { calculateStreak } from "@/lib/utils/streak";
import Link from "next/link";
import { 
  Heart, Sparkles, Plus, Calendar, Music, 
  ChevronRight, Smile, Flame, Shield, ArrowRight, Pencil,
  Loader2, AlertCircle
} from "lucide-react";
import { format, isToday } from "date-fns";
import { StreakBadge } from "@/components/streak-badge";
import { MoodCard, WaitingCard } from "@/components/mood-card";
import { QuickLinks } from "@/components/quick-links";

export const moodDetails = {
  joyful: { label: "Joyful", emoji: "😊", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/25 border-yellow-100 dark:border-yellow-900/30" },
  content: { label: "Content", emoji: "🥰", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/25 border-rose-100 dark:border-rose-900/30" },
  neutral: { label: "Neutral", emoji: "😐", color: "text-slate-600 bg-slate-50 dark:bg-slate-900/25 border-slate-100 dark:border-slate-800/30" },
  tired: { label: "Tired", emoji: "🥱", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/25 border-blue-100 dark:border-blue-900/30" },
  stressed: { label: "Stressed", emoji: "😰", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/25 border-orange-100 dark:border-orange-900/30" },
  sad: { label: "Sad", emoji: "😢", color: "text-sky-600 bg-sky-50 dark:bg-sky-950/25 border-sky-100 dark:border-sky-900/30" },
  anxious: { label: "Anxious", emoji: "🥺", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/25 border-blue-100 dark:border-blue-900/30" },
  excited: { label: "Excited", emoji: "🤪", color: "text-pink-600 bg-pink-50 dark:bg-pink-950/25 border-pink-100 dark:border-pink-900/30" },
  loved: { label: "Loved", emoji: "💖", color: "text-brand-rose-600 bg-brand-rose-50 dark:bg-brand-rose-950/25 border-brand-rose-100 dark:border-brand-rose-900/30" },
  distant: { label: "Distant", emoji: "😶", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/25 border-teal-100 dark:border-teal-900/30" },
};

export default function DashboardPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayUserLog, setTodayUserLog] = useState<any>(null);
  const [todayPartnerLog, setTodayPartnerLog] = useState<any>(null);
  const [userOutfit, setUserOutfit] = useState<any>(null);
  const [partnerOutfit, setPartnerOutfit] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  // Inline Check-in Form States
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState("");
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      setCheckinError("Please select a mood.");
      return;
    }
    if (!pair || !user) return;

    setSubmittingCheckin(true);
    setCheckinError(null);
    try {
      const { error: insertErr } = await supabase
        .from("mood_logs")
        .insert({
          pair_id: pair.id,
          user_id: user.id,
          mood: selectedMood as any,
          mood_intensity: intensity,
          note: note.trim() || null,
        });

      if (insertErr) throw insertErr;
      
      // Clear form states
      setSelectedMood(null);
      setIntensity(3);
      setNote("");

      // Refresh Dashboard data
      await fetchTodayData();
    } catch (err: any) {
      console.error(err);
      setCheckinError(err.message || "Failed to submit check-in.");
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const fetchTodayData = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data: moodLogs, error } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(moodLogs || []);

      // Calculate streak
      const calculatedStreak = calculateStreak(moodLogs || [], pair.user_a_id, pair.user_b_id);
      setStreak(calculatedStreak);

      // Find user and partner's latest log today
      const todayLogs = (moodLogs || []).filter((log: any) => isToday(new Date(log.created_at)));
      
      const userLatest = todayLogs.find((log: any) => log.user_id === user?.id);
      setTodayUserLog(userLatest || null);

      if (partner) {
        const partnerLatest = todayLogs.find((log: any) => log.user_id === partner.id);
        setTodayPartnerLog(partnerLatest || null);
      }

      // Fetch avatar outfits
      const { data: outfits, error: outfitsErr } = await supabase
        .from("avatar_outfits")
        .select("*")
        .in("user_id", [user?.id, partner?.id].filter(Boolean));

      if (!outfitsErr && outfits) {
        const myOutfit = outfits.find((o: any) => o.user_id === user?.id);
        setUserOutfit(myOutfit || null);
        if (partner) {
          const partnerOutfitObj = outfits.find((o: any) => o.user_id === partner.id);
          setPartnerOutfit(partnerOutfitObj || null);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchTodayData();

      // Set up real-time subscription for new mood logs and outfit changes
      const channel = supabase
        .channel(`dashboard-moods-${pair.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "mood_logs",
            filter: `pair_id=eq.${pair.id}`,
          },
          () => {
            fetchTodayData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "avatar_outfits",
          },
          () => {
            fetchTodayData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pair, loading, partner]);

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider animate-pulse">
              Setting up your space...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 md:pb-8">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />

      <Navigation />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6">
        {/* Greeting + streak */}
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          {/* subtle pixel dot-grid texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-3 -top-6 bottom-0 -z-10 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(var(--color-primary) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
              maskImage:
                "linear-gradient(to bottom, black, transparent 85%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black, transparent 85%)",
            }}
          />
          <div>
            <p className="text-[10px] font-mono font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className="mt-2 font-sans text-4xl font-black tracking-tight text-foreground text-balance md:text-5xl">
              Good day, {profile?.display_name || "there"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
              Here&apos;s how you and {partner?.display_name || "your partner"} are feeling today. A little check-in keeps you close.
            </p>
          </div>
          <StreakBadge days={streak} />
        </div>

        {/* Mood cards */}
        <section aria-label="Today's moods" className="mt-8 grid gap-5 md:grid-cols-2">
          {todayUserLog ? (
            <MoodCard 
              mood={{
                name: profile?.display_name || "You",
                initials: profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "SA",
                emoji: moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji || "😊",
                label: moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.label || "Content",
                intensity: todayUserLog.mood_intensity,
                note: todayUserLog.note || "",
                song: todayUserLog.spotify_track_name ? {
                  title: todayUserLog.spotify_track_name,
                  artist: todayUserLog.spotify_artist_name || "Unknown Artist"
                } : null,
                loggedAt: `Logged ${format(new Date(todayUserLog.created_at), "h:mm a")}`
              }} 
              heading="Your vibe today" 
            />
          ) : (
            <article className="relative flex flex-col justify-start overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-accent text-xs font-bold text-foreground">
                  {profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "ME"}
                </span>
                <h2 className="font-sans font-extrabold text-base text-foreground tracking-tight">Your vibe today</h2>
              </div>

              {/* Form body */}
              <form onSubmit={handleCheckinSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                {checkinError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{checkinError}</span>
                  </div>
                )}

                {/* Mood Select grid */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    1. How is your rhythm today?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(moodDetails).slice(0, 5).map(([key, value]) => {
                      const isSelected = selectedMood === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMood(key);
                            setCheckinError(null);
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all active:scale-[0.96] cursor-pointer ${
                            isSelected
                              ? `${value.color} ring-2 ring-primary scale-[1.03] shadow-sm`
                              : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="text-xl mb-1 select-none">{value.emoji}</span>
                          <span className="text-[9px] font-bold truncate w-full px-0.5">{value.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {Object.entries(moodDetails).slice(5, 10).map(([key, value]) => {
                      const isSelected = selectedMood === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMood(key);
                            setCheckinError(null);
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all active:scale-[0.96] cursor-pointer ${
                            isSelected
                              ? `${value.color} ring-2 ring-primary scale-[1.03] shadow-sm`
                              : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="text-xl mb-1 select-none">{value.emoji}</span>
                          <span className="text-[9px] font-bold truncate w-full px-0.5">{value.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intensity range slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    <span>2. Mood Intensity</span>
                    <span className="text-pink-500 font-bold bg-pink-500/10 px-2 py-0.5 rounded-full">
                      Level {intensity}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[8px] text-muted-foreground font-mono uppercase tracking-widest px-1">
                    <span>Low</span>
                    <span>Peak</span>
                  </div>
                </div>

                {/* Short text note */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    <span>3. Log note (optional)</span>
                    <span>{note.length}/100</span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Short check-in details..."
                    className="w-full px-3 py-2 border border-border rounded-xl bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingCheckin || !selectedMood}
                  className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-pink-500/5"
                >
                  {submittingCheckin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Publish Today's Vibe</span>
                </button>
              </form>
            </article>
          )}

          {todayPartnerLog ? (
            <MoodCard 
              mood={{
                name: partner?.display_name || "Partner",
                initials: partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : "PR",
                emoji: moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.emoji || "😊",
                label: moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.label || "Content",
                intensity: todayPartnerLog.mood_intensity,
                note: todayPartnerLog.note || "",
                song: todayPartnerLog.spotify_track_name ? {
                  title: todayPartnerLog.spotify_track_name,
                  artist: todayPartnerLog.spotify_artist_name || "Unknown Artist"
                } : null,
                loggedAt: `Logged ${format(new Date(todayPartnerLog.created_at), "h:mm a")}`
              }} 
              heading={`${partner?.display_name || "Partner"}'s vibe`} 
            />
          ) : (
            <WaitingCard 
              heading={`${partner?.display_name || "Partner"}'s vibe`} 
              name={partner?.display_name || "your partner"} 
              initials={partner?.display_name ? partner.display_name.slice(0, 2).toUpperCase() : "PR"} 
              onNudge={() => alert(`Nudged ${partner?.display_name || "partner"} to check-in!`)}
            />
          )}
        </section>

        {/* Log another mood */}
        {todayUserLog && (
          <div className="mt-6 flex justify-center">
            <Link
              href="/checkin"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#f472b6] to-[#60a5fa] px-6 py-3 text-sm font-bold text-white shadow hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="size-4" aria-hidden="true" />
              Log another mood
            </Link>
          </div>
        )}

        {/* Quick links */}
        <section aria-label="Shortcuts" className="mt-10">
          <QuickLinks />
        </section>

        {/* Small Privacy/Info Badge */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-muted-foreground/60 py-8 border-t border-border/20 mt-12">
          <Shield className="w-3.5 h-3.5" />
          <span>Strict End-to-End Pair Encryption applied under public RLS policies.</span>
        </div>
      </main>
    </div>
  );
}
