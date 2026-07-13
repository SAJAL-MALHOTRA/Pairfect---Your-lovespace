"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format, parseISO } from "date-fns";
import { Sparkles, Calendar, Plus, RefreshCw, AlertCircle, TrendingUp, HelpCircle } from "lucide-react";

const trendBadges = {
  improving: { label: "Improving", style: "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-900/50" },
  stable: { label: "Stable", style: "bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-800/50" },
  declining: { label: "Declining", style: "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-900/50" },
  mixed: { label: "Mixed", style: "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200 dark:border-purple-900/50" },
};

export default function RecapPage() {
  const { pair, loading } = useAuth();
  const [recaps, setRecaps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRecaps = async () => {
    if (!pair) return;
    setFetching(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("vibe_summaries")
        .select("*")
        .eq("pair_id", pair.id)
        .order("generated_at", { ascending: false });

      if (fetchErr) throw fetchErr;
      setRecaps(data || []);
    } catch (err) {
      console.error("Error loading vibe summaries:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchRecaps();
    }
  }, [pair, loading]);

  const handleGenerateRecap = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/recap", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate weekly recap.");
      }

      // Add new recap to list
      setRecaps((prev) => [data.recap, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to trigger AI compilation.");
    } finally {
      setGenerating(false);
    }
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
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-rose-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-brand-rose-500 fill-brand-rose-300 stroke-brand-rose-500" />
              <span>Weekly Recaps</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated emotional summaries of your relationship trending rhythm.
            </p>
          </div>

          <button
            onClick={handleGenerateRecap}
            disabled={generating}
            className="inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-xl border border-transparent shadow-sm text-sm font-semibold text-white bg-brand-rose-500 hover:bg-brand-rose-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all self-start sm:self-auto"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Recap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Generate Recap</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recaps List */}
        <div className="space-y-6">
          {recaps.length === 0 ? (
            <div className="cozy-card p-12 text-center text-muted-foreground border border-dashed border-card-border bg-white/30 dark:bg-transparent">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
              <p className="text-sm font-medium">No vibe summaries generated yet.</p>
              <p className="text-xs mt-1">
                Once both you and your partner log check-ins, click "Generate Recap" to compile an AI narrative summary.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recaps.map((recap) => {
                const trendKey = (recap.mood_trend || "stable") as keyof typeof trendBadges;
                const trendDetail = trendBadges[trendKey] || trendBadges.stable;

                return (
                  <div 
                    key={recap.id} 
                    className="cozy-card p-6 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border space-y-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-card-border/50 pb-3">
                      <div className="flex items-center space-x-2 text-sm font-bold text-foreground">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(parseISO(recap.period_start), "MMM d")} â€” {format(parseISO(recap.period_end), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Trend:
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${trendDetail.style}`}>
                          {trendDetail.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-foreground/90 leading-relaxed text-sm italic">
                      "{recap.summary_text}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 border-t border-card-border/30 pt-3">
                      <span>Generated by Pairfect AI</span>
                      <span>{format(new Date(recap.generated_at), "h:mm a, MMM d")}</span>
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
