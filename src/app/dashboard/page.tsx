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
import dynamic from "next/dynamic";

const MiniAvatarScene = dynamic(() => import("@/components/avatar-scene").then(m => m.MiniAvatarScene), { ssr: false });

const defaultOutfit = {
  top_style: "tshirt",
  top_color: "#e7e5e4",
  bottom_style: "pants",
  bottom_color: "#78716c",
  shoes_style: "sneakers",
  shoes_color: "#1c1917"
};

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
            <div className="w-12 h-12 rounded-full border-4 border-brand-rose-200 border-t-brand-rose-500 animate-spin"></div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Setting up your cozy space...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-rose-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        
        {/* Streak & Greeting Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Good day, {profile?.display_name}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here is how you and {partner?.display_name || "your partner"} are vibrating today.
            </p>
          </div>

          <div className="inline-flex items-center space-x-3 px-5 py-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-950/20 self-start md:self-auto">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-bounce" />
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold tracking-wide uppercase">
                Active Streak
              </p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {streak} {streak === 1 ? "day" : "days"} checked-in!
              </p>
            </div>
          </div>
        </div>

        {/* Mood Check-in Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* User's Card */}
          <div className="cozy-card p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden transition-all hover:shadow-xl hover:shadow-brand-rose-100/20">
            <div>
              <div className="flex items-center justify-between border-b border-card-border pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-14 h-14 rounded-full border border-card-border bg-[#faf8f6] shadow-inner overflow-hidden flex-shrink-0">
                    <MiniAvatarScene 
                      outfit={userOutfit || defaultOutfit} 
                      skinColor="#f5cac3"
                    />
                    <Link 
                      href="/avatars" 
                      className="absolute -bottom-1 -right-1 p-1 bg-brand-rose-500 hover:bg-brand-rose-600 border border-white text-white rounded-full transition-transform active:scale-90"
                      title="Edit Avatar"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-wide text-muted-foreground uppercase block">
                      Your Vibe Today
                    </span>
                    {todayUserLog && (
                      <span className="text-[10px] text-muted-foreground font-medium block sm:hidden">
                        {format(new Date(todayUserLog.created_at), "h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
                {todayUserLog && (
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    Logged at {format(new Date(todayUserLog.created_at), "h:mm a")}
                  </span>
                )}
              </div>

              {todayUserLog ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl select-none">
                      {moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-xl text-foreground">
                        {moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.label}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < todayUserLog.mood_intensity
                                ? "bg-brand-rose-500"
                                : "bg-card-border"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider ml-1">
                          Intensity {todayUserLog.mood_intensity}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {todayUserLog.note && (
                    <p className="text-sm italic text-foreground/90 bg-card-border/20 rounded-2xl p-4 leading-relaxed">
                      "{todayUserLog.note}"
                    </p>
                  )}

                  {todayUserLog.spotify_track_id && (
                    <div className="flex items-center space-x-3 bg-brand-sage-50/30 border border-brand-sage-100/50 dark:bg-emerald-950/10 dark:border-emerald-950/20 p-3 rounded-2xl">
                      <Music className="w-5 h-5 text-brand-sage-500 animate-spin-slow" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {todayUserLog.spotify_track_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {todayUserLog.spotify_artist_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-6 py-6 text-center">
                  <Smile className="w-10 h-10 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    You haven't logged your mood today yet.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-card-border pt-4">
              <Link
                href="/checkin"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-rose-500 hover:bg-brand-rose-600 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{todayUserLog ? "Log Another Mood" : "Check-in Your Mood"}</span>
              </Link>
            </div>
          </div>

          {/* Partner's Card */}
          <div className="cozy-card p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden transition-all hover:shadow-xl hover:shadow-brand-peach-100/20">
            <div>
              <div className="flex items-center justify-between border-b border-card-border pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-14 h-14 rounded-full border border-card-border bg-[#faf8f6] shadow-inner overflow-hidden flex-shrink-0">
                    <MiniAvatarScene 
                      outfit={partnerOutfit || defaultOutfit} 
                      skinColor="#eddcd2"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-wide text-muted-foreground uppercase block">
                      {partner?.display_name || "Partner"}'s Vibe
                    </span>
                    {todayPartnerLog && (
                      <span className="text-[10px] text-muted-foreground font-medium block sm:hidden">
                        {format(new Date(todayPartnerLog.created_at), "h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
                {todayPartnerLog && (
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    Logged at {format(new Date(todayPartnerLog.created_at), "h:mm a")}
                  </span>
                )}
              </div>

              {todayPartnerLog ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl select-none">
                      {moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.emoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-xl text-foreground">
                        {moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.label}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < todayPartnerLog.mood_intensity
                                ? "bg-brand-peach-500"
                                : "bg-card-border"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider ml-1">
                          Intensity {todayPartnerLog.mood_intensity}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {todayPartnerLog.note && (
                    <p className="text-sm italic text-foreground/90 bg-card-border/20 rounded-2xl p-4 leading-relaxed">
                      "{todayPartnerLog.note}"
                    </p>
                  )}

                  {todayPartnerLog.spotify_track_id && (
                    <div className="flex items-center space-x-3 bg-brand-sage-50/30 border border-brand-sage-100/50 dark:bg-emerald-950/10 dark:border-emerald-950/20 p-3 rounded-2xl">
                      <Music className="w-5 h-5 text-brand-sage-500 animate-spin-slow" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {todayPartnerLog.spotify_track_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {todayPartnerLog.spotify_artist_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-6 py-6 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center mb-2 text-muted-foreground/60 text-lg font-bold">
                    ?
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Waiting for {partner?.display_name || "your partner"} to check in today.
                  </p>
                </div>
              )}
            </div>

            {/* Quick action helper card linking to moments or history */}
            <div className="mt-6 border-t border-card-border pt-4 text-center">
              <p className="text-xs text-muted-foreground italic">
                {todayPartnerLog
                  ? `${partner?.display_name || "Your partner"} logged their status!`
                  : "Nudge them to share their vibe."}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/recap"
            className="flex items-center justify-between p-5 rounded-2xl border border-card-border bg-white/40 dark:bg-[#1e1a19]/40 hover:bg-brand-rose-50/20 dark:hover:bg-brand-rose-950/10 group active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-rose-100 dark:bg-brand-rose-950/30 text-brand-rose-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 fill-brand-rose-400 stroke-brand-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Weekly Recaps
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View Gemini vibe trend summaries.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-rose-500 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/moments"
            className="flex items-center justify-between p-5 rounded-2xl border border-card-border bg-white/40 dark:bg-[#1e1a19]/40 hover:bg-brand-peach-50/20 dark:hover:bg-brand-peach-950/10 group active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-peach-100 dark:bg-brand-peach-950/30 text-brand-peach-500 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-brand-peach-300 stroke-brand-peach-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Shared Scrapbook
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Log anniversaries and memories.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-peach-500 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Small Privacy/Info Badge */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-muted-foreground/60 py-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Strict End-to-End Pair Encryption applied under public RLS policies.</span>
        </div>
      </main>
    </div>
  );
}
