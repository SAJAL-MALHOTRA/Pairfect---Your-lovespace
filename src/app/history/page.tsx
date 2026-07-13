"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { moodDetails } from "@/app/dashboard/page";
import { 
  format, subDays, eachDayOfInterval, isSameDay, 
  parseISO, startOfDay 
} from "date-fns";
import { Calendar, History, ArrowRight, User, Heart, MessageSquare, Music } from "lucide-react";

export default function HistoryPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  const fetchLogs = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchLogs();
    }
  }, [pair, loading]);

  // Generate date list for heatmap (last 21 days)
  const heatmapDays = eachDayOfInterval({
    start: subDays(new Date(), 20),
    end: new Date(),
  });

  const getDayLog = (date: Date, userId: string) => {
    return logs.find(
      (log) =>
        log.user_id === userId &&
        isSameDay(new Date(log.created_at), date)
    );
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-brand-rose-200 border-t-brand-rose-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-lavender-50/25 via-background to-background">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-2">
            <History className="w-8 h-8 text-brand-lavender-500" />
            <span>Vibe History</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse through your pair's emotional landscape over time.
          </p>
        </div>

        {/* Dynamic Double-Row Heatmap */}
        <div className="cozy-card p-6 bg-white/40 dark:bg-[#1e1a19]/40 border border-card-border overflow-hidden">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
            Check-in Heatmap (Last 3 Weeks)
          </h2>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[600px] space-y-4">
              
              {/* User Row */}
              <div className="flex items-center space-x-4">
                <span className="w-24 text-xs font-bold text-foreground truncate text-right">
                  You
                </span>
                <div className="flex-1 flex justify-between space-x-2">
                  {heatmapDays.map((day, idx) => {
                    const log = getDayLog(day, user!.id);
                    const moodKey = log?.mood as keyof typeof moodDetails;
                    return (
                      <div
                        key={`user-day-${idx}`}
                        title={`${format(day, "MMM d, yyyy")} - ${
                          log ? moodDetails[moodKey]?.label : "No check-in"
                        }`}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base transition-all hover:scale-105 select-none ${
                          log
                            ? `${moodDetails[moodKey]?.color} border-current/30`
                            : "bg-card-border/10 border-dashed border-card-border"
                        }`}
                      >
                        {log ? moodDetails[moodKey]?.emoji : ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Partner Row */}
              <div className="flex items-center space-x-4">
                <span className="w-24 text-xs font-bold text-foreground truncate text-right">
                  {partner?.display_name || "Partner"}
                </span>
                <div className="flex-1 flex justify-between space-x-2">
                  {heatmapDays.map((day, idx) => {
                    const log = partner ? getDayLog(day, partner.id) : null;
                    const moodKey = log?.mood as keyof typeof moodDetails;
                    return (
                      <div
                        key={`partner-day-${idx}`}
                        title={`${format(day, "MMM d, yyyy")} - ${
                          log ? moodDetails[moodKey]?.label : "No check-in"
                        }`}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base transition-all hover:scale-105 select-none ${
                          log
                            ? `${moodDetails[moodKey]?.color} border-current/30`
                            : "bg-card-border/10 border-dashed border-card-border"
                        }`}
                      >
                        {log ? moodDetails[moodKey]?.emoji : ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Labels */}
              <div className="flex items-center space-x-4">
                <span className="w-24"></span>
                <div className="flex-1 flex justify-between space-x-2 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider px-1">
                  {heatmapDays.map((day, idx) => (
                    <span key={`label-${idx}`} className="w-10 text-center">
                      {format(day, "d")}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Chronological List of Check-ins */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Timeline Feed
          </h2>

          {logs.length === 0 ? (
            <div className="cozy-card p-12 text-center text-muted-foreground border border-dashed border-card-border bg-white/30 dark:bg-transparent">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm font-medium">No check-in logs found yet.</p>
              <p className="text-xs mt-1">Start sharing daily vibes under the Check-in tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const isOwner = log.user_id === user!.id;
                const moodKey = log.mood as keyof typeof moodDetails;
                const creatorName = isOwner 
                  ? profile?.display_name 
                  : (partner?.display_name || "Partner");

                return (
                  <div 
                    key={log.id} 
                    className="cozy-card p-5 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-y-[-2px]"
                  >
                    <div className="flex items-start space-x-4 min-w-0">
                      <span className="text-3xl p-2 rounded-2xl bg-background border border-card-border select-none flex-shrink-0">
                        {moodDetails[moodKey]?.emoji}
                      </span>
                      
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">
                            {creatorName}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isOwner 
                              ? "bg-brand-rose-50 text-brand-rose-600 dark:bg-brand-rose-950/20 dark:text-brand-rose-400"
                              : "bg-brand-peach-50 text-brand-peach-600 dark:bg-brand-peach-950/20 dark:text-brand-peach-400"
                          }`}>
                            {moodDetails[moodKey]?.label} • Intensity {log.mood_intensity}/5
                          </span>
                        </div>

                        {log.note && (
                          <p className="text-sm text-foreground/80 mt-2 italic leading-relaxed">
                            "{log.note}"
                          </p>
                        )}

                        {log.spotify_track_id && (
                          <div className="inline-flex items-center space-x-2 bg-brand-sage-50/20 border border-brand-sage-100/30 p-2 rounded-xl mt-3 max-w-full">
                            <Music className="w-3.5 h-3.5 text-brand-sage-500" />
                            <span className="text-[10px] font-semibold text-foreground truncate max-w-[200px]">
                              {log.spotify_track_name} — {log.spotify_artist_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 border-t border-card-border/50 md:border-none pt-2 md:pt-0">
                      <p className="text-xs text-muted-foreground font-semibold">
                        {format(new Date(log.created_at), "EEEE, MMMM d")}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        Logged at {format(new Date(log.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
