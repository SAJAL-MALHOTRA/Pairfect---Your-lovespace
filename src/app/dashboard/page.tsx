"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { calculateStreak } from "@/lib/utils/streak";
import Link from "next/link";
import { 
  Heart, Sparkles, Plus, Calendar, Music, 
  ChevronRight, Smile, Flame, Shield, ArrowRight, Pencil
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
  sad: { label: "Sad", emoji: "😢", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/25 border-indigo-100 dark:border-indigo-900/30" },
  anxious: { label: "Anxious", emoji: "🥺", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/25 border-purple-100 dark:border-purple-900/30" },
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
            <article className="relative flex flex-col justify-center overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-accent text-xs font-bold text-foreground">
                  {profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "ME"}
                </span>
                <h2 className="font-sans font-extrabold text-base text-foreground tracking-tight">Your vibe today</h2>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <span className="flex size-16 items-center justify-center rounded-md border border-border bg-muted text-3xl">
                  {"📝"}
                </span>
                <p className="mt-4 max-w-[16rem] text-pretty font-sans text-sm text-foreground/80 leading-relaxed">
                  You haven't logged your vibe today yet. Sharing keeps you connected!
                </p>
                <Link
                  href="/checkin"
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#f472b6] to-[#60a5fa] px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Check-in Now
                </Link>
              </div>
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
