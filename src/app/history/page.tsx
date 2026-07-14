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
          <div className="w-8 h-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        <div>
          <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-primary" />
            <span>Vibe History</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse through your pair's emotional landscape over time.
          </p>
        </div>

        {/* Dynamic Double-Row Heatmap */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm overflow-hidden">
          <h2 className="text-xs font-mono font-bold text-gray-400 mb-4 uppercase tracking-widest">
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
                        className={`w-10 h-10 rounded-md border flex items-center justify-center text-base transition-all hover:scale-105 select-none ${
                          log
                            ? `${moodDetails[moodKey]?.color} border-current/30`
                            : "bg-muted/30 border-dashed border-border"
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
                        className={`w-10 h-10 rounded-md border flex items-center justify-center text-base transition-all hover:scale-105 select-none ${
                          log
                            ? `${moodDetails[moodKey]?.color} border-current/30`
                            : "bg-muted/30 border-dashed border-border"
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
                <div className="flex-1 flex justify-between space-x-2 text-[9px] text-muted-foreground/60 font-mono font-bold uppercase tracking-wider px-1">
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
          <h2 className="text-lg font-sans font-black text-foreground tracking-tight">
            Timeline Feed
          </h2>

          {logs.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/45" />
              <p className="text-sm font-bold font-sans">No check-in logs found yet.</p>
              <p className="text-xs text-gray-400 mt-1">Start sharing daily vibes under the Check-in tab.</p>
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
                    className="rounded-lg border border-border bg-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-300 dark:hover:border-white/20"
                  >
                    <div className="flex items-start space-x-4 min-w-0">
                      <span className="text-3xl p-2 rounded border border-border bg-muted select-none flex-shrink-0">
                        {moodDetails[moodKey]?.emoji}
                      </span>
                      
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-extrabold text-sm text-foreground">
                            {creatorName}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isOwner 
                              ? "bg-pink-500/10 text-pink-500 border-pink-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          }`}>
                            {moodDetails[moodKey]?.label} • Intensity {log.mood_intensity}/5
                          </span>
                        </div>

                        {log.note && (
                          <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                            "{log.note}"
                          </p>
                        )}

                        {log.spotify_track_id && (
                          <div className="inline-flex items-center space-x-2 bg-muted/40 border border-border p-2 rounded mt-3 max-w-full">
                            <Music className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[200px]">
                              {log.spotify_track_name} — {log.spotify_artist_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 border-t border-border/50 md:border-none pt-2 md:pt-0">
                      <p className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
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
