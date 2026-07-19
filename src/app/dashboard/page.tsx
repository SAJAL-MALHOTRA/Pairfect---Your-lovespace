"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { WaxSealStamp } from "@/components/cozy-illustrations";
import { calculateStreak } from "@/lib/utils/streak";
import Link from "next/link";
import { 
  Heart, Sparkles, Plus, Calendar, Music, 
  ChevronRight, Smile, Flame, Shield, ArrowRight, Pencil,
  Loader2, AlertCircle, Gift, HelpCircle, Brain, Gamepad2, 
  Scale, Camera, Compass, Tv, Timer, BookOpen
} from "lucide-react";
import { format, isToday } from "date-fns";

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

const moodGroups = {
  joyful: "positive",
  content: "positive",
  excited: "positive",
  loved: "positive",
  neutral: "neutral",
  tired: "neutral",
  stressed: "negative",
  sad: "negative",
  anxious: "negative",
  distant: "negative"
};

const monthSubtitles = [
  "New year, still choosing each other.",
  "Love looks like us.",
  "Growing together.",
  "Spring forward together.",
  "In full bloom.",
  "Summer's just begun.",
  "Making memories together.",
  "Still strong.",
  "Falling for you again.",
  "Pumpkin spice and partnership.",
  "Grateful for us.",
  "Cozy season for two."
];

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

  // Custom summary & stats variables
  const [lastLetterExcerpt, setLastLetterExcerpt] = useState<string | null>(null);
  const [photoboothInfo, setPhotoboothInfo] = useState<{ date: string; count: number } | null>(null);
  const [heroBgImage, setHeroBgImage] = useState<string | null>(null);
  const [momentsCount, setMomentsCount] = useState<number>(0);
  const [lettersCount, setLettersCount] = useState<number>(0);
  const [moodMatchPct, setMoodMatchPct] = useState<number | null>(null);
  const [moodMatchDays, setMoodMatchDays] = useState<number>(0);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [letterDraft, setLetterDraft] = useState<any>(null);

  const fetchTodayData = async () => {
    if (!pair) return;
    try {
      // 1. Fetch Mood Logs
      const { data: moodLogs, error } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const safeMoodLogs = moodLogs || [];
      setLogs(safeMoodLogs);

      // Calculate streak
      const calculatedStreak = calculateStreak(safeMoodLogs, pair.user_a_id, pair.user_b_id);
      setStreak(calculatedStreak);

      // Find user and partner's latest log today
      const todayLogs = safeMoodLogs.filter((log: any) => isToday(new Date(log.created_at)));
      
      const userLatest = todayLogs.find((log: any) => log.user_id === user?.id);
      setTodayUserLog(userLatest || null);

      if (partner) {
        const partnerLatest = todayLogs.find((log: any) => log.user_id === partner.id);
        setTodayPartnerLog(partnerLatest || null);
      }

      // 2. Fetch avatar outfits
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

      // 3. Fetch Moments (Memories) Count
      const { count: momCount, error: momCountErr } = await supabase
        .from("shared_moments")
        .select("id", { count: "exact", head: true })
        .eq("pair_id", pair.id);

      if (!momCountErr && momCount !== null) {
        setMomentsCount(momCount);
      }

      // 4. Fetch Love Letters Count
      const { count: letCount, error: letCountErr } = await supabase
        .from("love_letters")
        .select("id", { count: "exact", head: true })
        .eq("pair_id", pair.id);

      if (!letCountErr && letCount !== null) {
        setLettersCount(letCount);
      }

      // 5. Fetch dashboard-summary batched data
      try {
        const summaryRes = await fetch(`/api/dashboard-summary?pairId=${pair.id}`);
        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          setSummaryData(summaryJson);
        }
      } catch (err) {
        console.error("Error loading dashboard summary API:", err);
      }

      // 6. Check localStorage for letter drafts
      if (typeof window !== "undefined") {
        try {
          const draftKey = `pairfect-love-letter-draft-${pair.id}`;
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            setLetterDraft(JSON.parse(savedDraft));
          } else {
            setLetterDraft(null);
          }
        } catch (err) {
          console.error("Error reading letter draft:", err);
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

      // Set up real-time subscription for mood logs and outfit changes
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
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
              Entering your space...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Cozy Redesign Calculations ──
  const daysTogether = pair?.created_at
    ? Math.max(1, Math.floor((new Date().getTime() - new Date(pair.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const lastLetter = summaryData?.lastLoveLetter;
  const hasUnreadLetter = lastLetter && lastLetter.sender_id !== user?.id;
  
  let letterExcerpt = "Some days I just look at you and wonder how I got so lucky.";
  if (lastLetter) {
    const blocks = Array.isArray(lastLetter.content) ? lastLetter.content : [];
    const firstText = blocks.find((b: any) => b.type === "text" && b.value);
    if (firstText) {
      letterExcerpt = firstText.value.length > 70 
        ? firstText.value.slice(0, 70) + "..." 
        : firstText.value;
    }
  }

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 max-w-3xl mx-auto w-full text-center space-y-12 select-none">
        
        {/* Editorial Greeting Block */}
        <div className="space-y-4 animate-fade-in">
          <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest uppercase text-[#8A7B6E] dark:text-[#A28468] block">
            Good evening, {profile?.display_name || "Love"}
          </span>
          <h1 className="font-display text-4xl md:text-6xl italic font-black tracking-tight text-[#2E2A25] dark:text-[#E8E2D5] leading-tight">
            {hasUnreadLetter ? "A letter is waiting for you." : "Write a keepsake today."}
          </h1>
          <p className="font-quote text-lg md:text-xl text-[#8A7B6E] dark:text-[#A28468] max-w-xl mx-auto leading-relaxed pt-2">
            {hasUnreadLetter 
              ? `"${letterExcerpt}"` 
              : `"${monthSubtitles[new Date().getMonth()]}"`}
          </p>
        </div>

        {/* Tactile Envelope link */}
        <div className="animate-fade-in delay-200">
          <Link
            href={hasUnreadLetter ? "/love-letter" : "/love-letter?write=true"}
            className="relative block w-80 h-52 bg-[#FAF6EE] dark:bg-[#28221D] border border-[#EAE3D5] dark:border-[#3E352E] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-98 group cursor-pointer"
          >
            {/* Minimal line drawing details */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <svg viewBox="0 0 320 208" className="w-full h-full stroke-[#EAE3D5] dark:stroke-[#3E352E] fill-none stroke-1">
                <path d="M 0,0 L 160,104 L 320,0" />
                <path d="M 0,208 L 110,120" />
                <path d="M 320,208 L 210,120" />
              </svg>
            </div>

            {/* To Label */}
            <div className="absolute top-6 left-6 text-left z-10">
              <span className="text-[9px] font-mono text-[#8A7B6E] dark:text-[#A28468] uppercase tracking-wider block">
                To:
              </span>
              <span className="font-heading italic text-sm text-[#2E2A25] dark:text-[#E8E2D5] font-bold">
                {profile?.display_name || "My Love"}
              </span>
            </div>

            {/* Flat Wax Seal in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-300 group-hover:scale-105">
              <WaxSealStamp className="w-14 h-14 drop-shadow-sm" />
            </div>

            {/* From Label */}
            <div className="absolute bottom-6 right-6 text-right z-10">
              <span className="text-[9px] font-mono text-[#8A7B6E] dark:text-[#A28468] uppercase tracking-wider block">
                From:
              </span>
              <span className="font-heading italic text-xs text-[#8A7B6E] dark:text-[#A28468]">
                {partner?.display_name || "Your Partner"}
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="animate-fade-in delay-300">
          <Link
            href={hasUnreadLetter ? "/love-letter" : "/love-letter?write=true"}
            className="btn-primary py-3 px-10 text-xs tracking-wider uppercase font-bold cursor-pointer"
          >
            {hasUnreadLetter ? "Unseal Letter" : "Write a Letter"}
          </Link>
        </div>

        {/* Spacing and subtle stats details */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#8A7B6E] dark:text-[#A28468] pt-4 select-none">
          <span>{daysTogether} days together</span>
          <span>•</span>
          <span>{lettersCount} letters</span>
          <span>•</span>
          <span>{momentsCount} memories</span>
        </div>

      </main>
    </div>
  );
}
