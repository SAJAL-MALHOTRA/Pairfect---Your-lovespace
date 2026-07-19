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
  Loader2, AlertCircle, Gift, HelpCircle, Brain, Gamepad2, 
  Scale, Camera, Compass, Tv, Timer, BookOpen
} from "lucide-react";
import { format, isToday } from "date-fns";
import { StreakBadge } from "@/components/streak-badge";
import { MoodCard, WaitingCard } from "@/components/mood-card";

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

function ActivityCard({ href, Icon, title, desc, preview }: { href: string; Icon: any; title: string; desc: string; preview?: string | null }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-card border border-border bg-card p-4 shadow-sm hover:bg-muted/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-button border border-border bg-accent text-primary transition-colors group-hover:bg-primary/10">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="block font-sans text-sm font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {title}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </div>
        <span className="block text-xs text-muted-foreground/80 mt-0.5 leading-normal font-medium">
          {desc}
        </span>
        {preview && (
          <span className="block mt-2 text-[11px] font-semibold text-primary bg-primary/5 dark:bg-primary/10 border border-primary/10 py-1 px-2.5 rounded-chip truncate">
            {preview}
          </span>
        )}
      </div>
    </Link>
  );
}

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

  // Tier 1 custom state variables
  const [lastLetterExcerpt, setLastLetterExcerpt] = useState<string | null>(null);
  const [photoboothInfo, setPhotoboothInfo] = useState<{ date: string; count: number } | null>(null);
  const [heroBgImage, setHeroBgImage] = useState<string | null>(null);
  const [momentsCount, setMomentsCount] = useState<number>(0);
  const [lettersCount, setLettersCount] = useState<number>(0);
  const [moodMatchPct, setMoodMatchPct] = useState<number | null>(null);
  const [moodMatchDays, setMoodMatchDays] = useState<number>(0);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [letterDraft, setLetterDraft] = useState<any>(null);

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

      // 5. Fetch Photobooth info
      const { data: strips, error: stripsErr } = await supabase
        .from("photobooth_strips")
        .select("*, photobooth_sessions(pair_id)")
        .eq("photobooth_sessions.pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (!stripsErr && strips) {
        setPhotoboothInfo(
          strips.length > 0
            ? {
                date: format(new Date(strips[0].created_at), "MMM d, yyyy"),
                count: strips.length * 4
              }
            : null
        );
      }

      // 6. Fetch last Love Letter excerpt
      try {
        const letterRes = await fetch(`/api/love-letters?pairId=${pair.id}`);
        if (letterRes.ok) {
          const letters = await letterRes.json();
          if (letters && letters.length > 0) {
            const lastLetter = letters[0];
            let text = "";
            const blocks = Array.isArray(lastLetter.content)
              ? lastLetter.content
              : typeof lastLetter.content === "string"
                ? JSON.parse(lastLetter.content)
                : [];
            
            const firstText = blocks.find((b: any) => b.type === "text" && b.value);
            if (firstText) {
              text = firstText.value;
            } else {
              text = "Sent a letter";
            }
            const excerpt = text.length > 50 ? text.slice(0, 50) + "..." : text;
            setLastLetterExcerpt(excerpt);
          } else {
            setLastLetterExcerpt(null);
          }
        }
      } catch (err) {
        console.error("Error fetching last letter excerpt:", err);
      }

      // 7. Fetch Blurred Background Image from shared moments
      try {
        const { data: recentMoments, error: recentErr } = await supabase
          .from("shared_moments")
          .select("photo_url")
          .eq("pair_id", pair.id)
          .not("photo_url", "is", null)
          .order("moment_date", { ascending: false })
          .limit(1);

        if (!recentErr && recentMoments && recentMoments.length > 0) {
          const { data: urlData, error: urlErr } = await supabase.storage
            .from("memories")
            .createSignedUrl(recentMoments[0].photo_url, 3600);
          
          if (!urlErr && urlData?.signedUrl) {
            setHeroBgImage(urlData.signedUrl);
          } else {
            setHeroBgImage(null);
          }
        } else {
          setHeroBgImage(null);
        }
      } catch (err) {
        console.error("Error fetching recent moment for blurred bg:", err);
      }

      // 8. Mood Match % Calculation
      const logsByDate: { [dateStr: string]: { userMood?: string; partnerMood?: string } } = {};
      safeMoodLogs.forEach((log: any) => {
        const dateStr = format(new Date(log.created_at), "yyyy-MM-dd");
        if (!logsByDate[dateStr]) {
          logsByDate[dateStr] = {};
        }
        if (log.user_id === user?.id) {
          logsByDate[dateStr].userMood = log.mood;
        } else if (partner && log.user_id === partner.id) {
          logsByDate[dateStr].partnerMood = log.mood;
        }
      });

      let totalSharedDays = 0;
      let similarDays = 0;
      Object.values(logsByDate).forEach((day: any) => {
        if (day.userMood && day.partnerMood) {
          totalSharedDays++;
          const groupA = moodGroups[day.userMood as keyof typeof moodGroups];
          const groupB = moodGroups[day.partnerMood as keyof typeof moodGroups];
          if (groupA && groupB && groupA === groupB) {
            similarDays++;
          }
        }
      });

      setMoodMatchDays(totalSharedDays);
      if (totalSharedDays >= 3) {
        setMoodMatchPct(Math.round((similarDays / totalSharedDays) * 100));
      } else {
        setMoodMatchPct(null);
      }

      // 9. Fetch Today Activity Timeline
      const localTodayStart = new Date();
      localTodayStart.setHours(0, 0, 0, 0);
      const todayISO = localTodayStart.toISOString();

      // Today's mood logs (already fetched in moodLogs)
      const todayMoods = safeMoodLogs.filter((log: any) => new Date(log.created_at) >= localTodayStart);

      // Fetch gratitude entries created today
      const { data: todayGratitude } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("pair_id", pair.id)
        .gte("created_at", todayISO);

      // Fetch moments created today
      const { data: todayMoments } = await supabase
        .from("shared_moments")
        .select("*")
        .eq("pair_id", pair.id)
        .gte("created_at", todayISO);

      // Fetch love letters created today
      const { data: todayLetters } = await supabase
        .from("love_letters")
        .select("*")
        .eq("pair_id", pair.id)
        .gte("sent_at", todayISO);

      // Fetch photobooth strips created today
      const { data: todayStrips } = await supabase
        .from("photobooth_strips")
        .select("*, photobooth_sessions(pair_id)")
        .eq("photobooth_sessions.pair_id", pair.id)
        .gte("created_at", todayISO);

      const timelineEvents: any[] = [];

      // Format Moods:
      todayMoods.forEach((log: any) => {
        const authorName = log.user_id === user?.id ? "You" : partner?.display_name || "Partner";
        const moodText = moodDetails[log.mood as keyof typeof moodDetails]?.label || "Content";
        const emoji = moodDetails[log.mood as keyof typeof moodDetails]?.emoji || "😊";
        timelineEvents.push({
          id: `mood-${log.id}`,
          type: "mood",
          time: new Date(log.created_at),
          title: authorName,
          content: `logged a ${emoji} ${moodText} vibe${log.note ? `: "${log.note}"` : ""}`,
          icon: Smile,
          color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
        });
      });

      // Format Gratitude:
      if (todayGratitude) {
        todayGratitude.forEach((entry: any) => {
          const authorName = entry.user_id === user?.id ? "You" : partner?.display_name || "Partner";
          timelineEvents.push({
            id: `gratitude-${entry.id}`,
            type: "gratitude",
            time: new Date(entry.created_at),
            title: authorName,
            content: `shared a gratitude note: "${entry.content}"`,
            icon: Gift,
            color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
          });
        });
      }

      // Format Moments:
      if (todayMoments) {
        todayMoments.forEach((mom: any) => {
          const authorName = mom.created_by === user?.id ? "You" : partner?.display_name || "Partner";
          timelineEvents.push({
            id: `moment-${mom.id}`,
            type: "moment",
            time: new Date(mom.created_at),
            title: authorName,
            content: `shared a new memory: "${mom.title}"`,
            icon: BookOpen,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          });
        });
      }

      // Format Letters:
      if (todayLetters) {
        todayLetters.forEach((lettr: any) => {
          const authorName = lettr.sender_id === user?.id ? "You" : partner?.display_name || "Partner";
          timelineEvents.push({
            id: `letter-${lettr.id}`,
            type: "letter",
            time: new Date(lettr.sent_at),
            title: authorName,
            content: `sent a wax-sealed love letter 💌`,
            icon: Heart,
            color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          });
        });
      }

      // Format Strips:
      if (todayStrips) {
        todayStrips.forEach((strip: any) => {
          timelineEvents.push({
            id: `strip-${strip.id}`,
            type: "strip",
            time: new Date(strip.created_at),
            title: "Photobooth",
            content: `created a new photo strip${strip.caption ? `: "${strip.caption}"` : ""} 📸`,
            icon: Camera,
            color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          });
        });
      }

      // Sort timeline chronologically descending
      timelineEvents.sort((a, b) => b.time.getTime() - a.time.getTime());
      setTimeline(timelineEvents);

      // 10. Fetch dashboard-summary batched data
      try {
        const summaryRes = await fetch(`/api/dashboard-summary?pairId=${pair.id}`);
        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          setSummaryData(summaryJson);
        }
      } catch (err) {
        console.error("Error loading dashboard summary API:", err);
      }

      // 11. Check localStorage for letter drafts
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

  const isDateToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    return isToday(new Date(dateStr));
  };

  const storyItems: any[] = [];

  if (summaryData) {
    // 1. Love Letter
    if (summaryData.lastLoveLetter && isDateToday(summaryData.lastLoveLetter.sent_at)) {
      const letter = summaryData.lastLoveLetter;
      let text = "";
      const blocks = Array.isArray(letter.content) ? letter.content : [];
      const firstText = blocks.find((b: any) => b.type === "text" && b.value);
      if (firstText) {
        text = firstText.value;
      } else {
        text = "Sent a letter";
      }
      const excerpt = text.length > 80 ? text.slice(0, 80) + "..." : text;
      storyItems.push({
        id: `story-letter-${letter.id}`,
        icon: "💌",
        text: `${letter.sender_id === user?.id ? "You" : letter.sender_name || "Partner"} wrote a letter today — "${excerpt}"`,
        link: "/love-letter",
        time: new Date(letter.sent_at)
      });
    }

    // 2. Mood Check-in
    if (todayUserLog || todayPartnerLog) {
      const latestTime = new Date(
        Math.max(
          todayUserLog ? new Date(todayUserLog.created_at).getTime() : 0,
          todayPartnerLog ? new Date(todayPartnerLog.created_at).getTime() : 0
        )
      );
      let checkinText = "";
      if (todayUserLog && todayPartnerLog) {
        const userEmoji = moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji || "😊";
        const partnerEmoji = moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.emoji || "😊";
        checkinText = `${userEmoji} You and ${partnerEmoji} ${partner?.display_name || "Partner"} checked in today at ${format(latestTime, "h:mm a")}`;
      } else if (todayUserLog) {
        const userEmoji = moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji || "😊";
        checkinText = `${userEmoji} You checked in today at ${format(latestTime, "h:mm a")}`;
      } else if (todayPartnerLog) {
        const partnerEmoji = moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.emoji || "😊";
        checkinText = `${partnerEmoji} ${partner?.display_name || "Partner"} checked in today at ${format(latestTime, "h:mm a")}`;
      }
      storyItems.push({
        id: "story-mood",
        icon: "😊",
        text: checkinText,
        link: "/checkin",
        time: latestTime
      });
    }

    // 3. Photobooth
    if (summaryData.lastPhotobooth && isDateToday(summaryData.lastPhotobooth.created_at)) {
      const strip = summaryData.lastPhotobooth;
      storyItems.push({
        id: `story-booth-${strip.id}`,
        icon: "📸",
        text: `Added to memories today — new photobooth strip`,
        link: "/avatars",
        time: new Date(strip.created_at)
      });
    }

    // 4. Gratitude
    if (summaryData.lastGratitude && isDateToday(summaryData.lastGratitude.created_at)) {
      const entry = summaryData.lastGratitude;
      const author = entry.user_id === user?.id ? "You" : partner?.display_name || "Partner";
      const excerpt = entry.content.length > 80 ? entry.content.slice(0, 80) + "..." : entry.content;
      storyItems.push({
        id: `story-gratitude-${entry.id}`,
        icon: "🙏",
        text: `${author} is grateful for... "${excerpt}"`,
        link: "/gratitude-jar",
        time: new Date(entry.created_at)
      });
    }

    // 5. Quiz/Game Results
    if (summaryData.lastQuizHistory && isDateToday(summaryData.lastQuizHistory.completed_at)) {
      const qh = summaryData.lastQuizHistory;
      storyItems.push({
        id: `story-quiz-${qh.id}`,
        icon: "🎮",
        text: `Completed Vibe Quiz pack "${qh.pack_id.replace(/-/g, " ")}" • Score: ${qh.score_correct}/${qh.score_total}`,
        link: "/quiz",
        time: new Date(qh.completed_at)
      });
    }

    if (summaryData.lastCompletedRiddle && isDateToday(summaryData.lastCompletedRiddle.started_at)) {
      const r = summaryData.lastCompletedRiddle;
      storyItems.push({
        id: `story-riddle-${r.id}`,
        icon: "🧩",
        text: `Solved Riddle: "${r.riddles?.question || "Riddle Night"}"`,
        link: "/riddle",
        time: new Date(r.started_at)
      });
    }

    if (summaryData.lastDisputeVerdict && isDateToday(summaryData.lastDisputeVerdict.created_at)) {
      const v = summaryData.lastDisputeVerdict;
      storyItems.push({
        id: `story-verdict-${v.id}`,
        icon: "⚖️",
        text: `Between the Lines verdict published: "${v.verdict_text.slice(0, 80)}..."`,
        link: "/vibe-judge",
        time: new Date(v.created_at)
      });
    }
  }

  // Sort story items newest first
  storyItems.sort((a, b) => b.time.getTime() - a.time.getTime());

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

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6 space-y-8">
        {/* Hero Identity Section */}
        {pair && (
          <section className="card-hero relative p-6 md:p-10 flex flex-col items-center justify-center text-center overflow-hidden border border-transparent shadow-md select-none bg-card">
            {/* Blurred photo background */}
            {heroBgImage ? (
              <div 
                className="absolute inset-0 -z-10 scale-105 opacity-20 dark:opacity-30 transition-all duration-700 pointer-events-none"
                style={{
                  backgroundImage: `url(${heroBgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(24px)",
                }}
              />
            ) : (
              // Fallback clean gradient accent
              <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/5 to-secondary/5 opacity-50 pointer-events-none" />
            )}
            
            {/* Streak Badge floating top right */}
            {streak > 0 && (
              <div className="absolute top-4 right-4">
                <StreakBadge days={streak} />
              </div>
            )}
            
            {/* Heart and Names */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-2.5 gap-1.5 text-3xl md:text-5xl font-black tracking-tight text-foreground text-center">
              <span>{profile?.display_name || "You"}</span>
              <span className="text-brand-rose-500 animate-pulse drop-shadow-sm select-none sm:scale-100 scale-75">❤️</span>
              <span>{partner?.display_name || "Partner"}</span>
            </div>
            
            {/* Sub-header: Together info */}
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>Together since {format(new Date(pair.created_at), "MMMM d, yyyy")}</span>
              <span className="text-border">•</span>
              <span className="font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {pair?.created_at ? Math.max(1, Math.floor((new Date().getTime() - new Date(pair.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1} {pair?.created_at && Math.max(1, Math.floor((new Date().getTime() - new Date(pair.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1) === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Rotating Month Subtitle */}
            <p className="mt-2 text-xs md:text-sm font-medium italic text-muted-foreground/90">
              "{monthSubtitles[new Date().getMonth()]}"
            </p>

            {/* Current mood indicators */}
            <div className="mt-5 flex items-center justify-center gap-3 text-xs md:text-sm font-semibold bg-muted/40 py-2 px-5 rounded-chip border border-border/20 shadow-sm">
              {todayUserLog || todayPartnerLog ? (
                <div className="flex items-center gap-2.5">
                  {todayUserLog && (
                    <span className="flex items-center gap-1">
                      <span>{moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji || "😊"}</span>
                      <span className="text-foreground">{profile?.display_name || "You"}</span>
                    </span>
                  )}
                  {todayUserLog && todayPartnerLog && <span className="text-muted-foreground/50">•</span>}
                  {todayPartnerLog && (
                    <span className="flex items-center gap-1">
                      <span>{moodDetails[todayPartnerLog.mood as keyof typeof moodDetails]?.emoji || "😊"}</span>
                      <span className="text-foreground">{partner?.display_name || "Partner"}</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-primary" />
                  <span>No check-ins yet today. Share your vibe below!</span>
                </span>
              )}
            </div>
          </section>
        )}

        {/* Today's Story Section */}
        {pair && (
          <section className="space-y-4">
            <h3 className="font-sans font-black text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-rose-500 animate-pulse" /> Today&apos;s Story
            </h3>
            {storyItems.length > 0 ? (
              <div className="grid gap-3">
                {storyItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="group relative flex items-center justify-between p-4 rounded-button border border-border bg-card hover:bg-muted/30 transition-all shadow-sm active:scale-[0.99] overflow-hidden"
                  >
                    {/* Left side accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />
                    <div className="flex items-center gap-3 pl-2 min-w-0">
                      <span className="text-xl select-none">{item.icon}</span>
                      <span className="text-xs font-semibold text-foreground leading-relaxed truncate group-hover:text-primary transition-colors">
                        {item.text}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 border border-dashed border-border/60 rounded-card bg-muted/10">
                <p className="text-sm font-semibold text-muted-foreground">
                  Today&apos;s a blank page.
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Start with a mood check-in, write a gratitude note, or send a love letter! 🐾
                </p>
              </div>
            )}
          </section>
        )}

        {/* Continue Together Pinned Cards */}
        {pair && (letterDraft || summaryData?.activeRiddle || summaryData?.activeDispute) && (
          <section className="space-y-4">
            <h4 className="font-sans font-black text-xs text-foreground uppercase tracking-wider select-none opacity-80">
              Continue Together
            </h4>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {/* Love Letter Draft */}
              {letterDraft && (
                <div className="relative p-4 rounded-card border border-border bg-card flex flex-col justify-between hover:border-primary/45 transition-all shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-brand-rose-500 tracking-wider">Love Letter Draft</span>
                    <h5 className="text-xs font-extrabold text-foreground truncate">
                      📝 Continue letter to {letterDraft.recipientName || "your partner"}
                    </h5>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/love-letter"
                      className="btn-primary py-1.5 px-4 text-xs font-bold rounded-button inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Active Riddle Session */}
              {summaryData?.activeRiddle && (
                <div className="relative p-4 rounded-card border border-border bg-card flex flex-col justify-between hover:border-primary/45 transition-all shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-500 tracking-wider">Active Riddle</span>
                    <h5 className="text-xs font-extrabold text-foreground truncate">
                      🧩 riddle #{summaryData.activeRiddle.riddle_id.slice(0, 8).toUpperCase()}
                    </h5>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/riddle"
                      className="btn-primary py-1.5 px-4 text-xs font-bold rounded-button inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Solve Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Active Dispute Session */}
              {summaryData?.activeDispute && (
                <div className="relative p-4 rounded-card border border-border bg-card flex flex-col justify-between hover:border-primary/45 transition-all shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-blue-500 tracking-wider">Between the Lines</span>
                    <h5 className="text-xs font-extrabold text-foreground truncate">
                      ⚖️ dispute: &quot;{summaryData.activeDispute.topic}&quot;
                    </h5>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/vibe-judge"
                      className="btn-primary py-1.5 px-4 text-xs font-bold rounded-button inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Submit Argument</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Relationship Stats Row (Responsive Audit: compresses to 2x2 grid on mobile) */}
        {pair && (
          <section className="grid grid-cols-2 gap-3 md:flex md:flex-row md:items-center md:justify-between md:gap-4 py-2 px-2 bg-transparent select-none">
            {/* Stat: Days Together */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 px-4 bg-card border border-border/50 rounded-chip text-center shadow-sm hover:scale-[1.01] transition-transform">
              <span className="text-xl md:text-2xl font-black text-foreground">
                {pair?.created_at ? Math.max(1, Math.floor((new Date().getTime() - new Date(pair.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1}
              </span>
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mt-0.5">Days Together</span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-muted-foreground/15 shrink-0" />
            
            {/* Stat: Shared Memories */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 px-4 bg-card border border-border/50 rounded-chip text-center shadow-sm hover:scale-[1.01] transition-transform">
              <span className="text-xl md:text-2xl font-black text-foreground">{momentsCount}</span>
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mt-0.5">Memories</span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-muted-foreground/15 shrink-0" />
            
            {/* Stat: Letters */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 px-4 bg-card border border-border/50 rounded-chip text-center shadow-sm hover:scale-[1.01] transition-transform">
              <span className="text-xl md:text-2xl font-black text-foreground">{lettersCount}</span>
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mt-0.5">Letters</span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-muted-foreground/15 shrink-0" />
            
            {/* Stat: Mood Match */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 px-4 bg-card border border-border/50 rounded-chip text-center shadow-sm hover:scale-[1.01] transition-transform relative group">
              <span className="text-xl md:text-2xl font-black text-foreground">
                {moodMatchPct !== null ? `${moodMatchPct}%` : "—"}
              </span>
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mt-0.5">
                {moodMatchPct !== null ? "Mood Match" : "Early Days"}
              </span>
              
              {/* Tooltip explaining threshold */}
              {moodMatchPct === null && (
                <span className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md text-center leading-normal shadow-lg z-20">
                  Check in together for at least 3 days to see your emotional match percentage.
                </span>
              )}
            </div>
          </section>
        )}

        {/* Asymmetric Columns Grid */}
        <div className="grid gap-8 md:grid-cols-12">
          {/* Left Column (2/3 width on desktop): Daily check-in cards & Today timeline feed */}
          <div className="md:col-span-7 lg:col-span-8 space-y-8">
            {/* Mood cards */}
            <section aria-label="Today's moods" className="grid gap-5 sm:grid-cols-2">
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
                <article className="relative flex flex-col justify-start overflow-hidden rounded-card border border-border bg-card p-6 shadow-sm md:p-7 space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-button border border-border bg-accent text-xs font-bold text-foreground">
                      {profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "ME"}
                    </span>
                    <h2 className="font-sans font-extrabold text-base text-foreground tracking-tight">Your vibe today</h2>
                  </div>

                  {/* Form body */}
                  <form onSubmit={handleCheckinSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                    {checkinError && (
                      <div className="p-3 rounded-button bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
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
                              className={`flex flex-col items-center justify-center py-2.5 rounded-button border text-center transition-all active:scale-[0.96] cursor-pointer ${
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
                              className={`flex flex-col items-center justify-center py-2.5 rounded-button border text-center transition-all active:scale-[0.96] cursor-pointer ${
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
                        className="w-full h-1.5 bg-border rounded-chip appearance-none cursor-pointer accent-primary"
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
                        className="w-full px-3 py-2 border border-border rounded-button bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={submittingCheckin || !selectedMood}
                      className="w-full btn-primary mt-3 py-2.5"
                    >
                      {submittingCheckin ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
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

            {/* Log another mood button */}
            {todayUserLog && (
              <div className="flex justify-center">
                <Link
                  href="/checkin"
                  className="inline-flex items-center gap-2 btn-primary px-6 py-3 text-sm shadow-sm"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Log another mood</span>
                </Link>
              </div>
            )}

            {/* Today Feed Timeline */}
            <section className="relative flex flex-col justify-start overflow-hidden rounded-card border border-border bg-card p-6 shadow-sm md:p-8 space-y-6">
              <h3 className="font-sans font-black text-lg text-foreground flex items-center gap-2 tracking-tight">
                <Flame className="w-5 h-5 text-brand-rose-500 animate-pulse" /> Today in Our Space
              </h3>
              
              {timeline.length > 0 ? (
                <div className="relative border-l-2 border-border/80 pl-6 ml-3 space-y-6">
                  {timeline.map((item) => (
                    <div key={item.id} className="relative group animate-fade-in">
                      {/* Timeline Circular Icon Node */}
                      <span className={`absolute -left-[37px] top-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-xs font-bold ${item.color}`}>
                        <item.icon className="w-3.5 h-3.5" />
                      </span>
                      {/* Event Details Card */}
                      <div className="bg-muted/10 hover:bg-muted/30 border border-border/20 p-3 rounded-button shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                          <span>{item.title}</span>
                          <span className="text-muted-foreground/60 font-medium font-mono text-[10px]">
                            {format(item.time, "h:mm a")}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-card bg-muted/10">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nothing logged yet today.
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Log your vibe, share a gratitude note, or create a memory to start today's feed!
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1/3 width on desktop): Categorized Shortcuts stacked vertically */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            {/* Connect Category */}
            <section className="space-y-3 bg-muted/5 p-4 rounded-card border border-border/25">
              <div>
                <h3 className="font-sans font-black text-sm text-foreground flex items-center gap-2">
                  <span className="text-brand-rose-500">❤️</span> Connect
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  Strengthen your bond.
                </p>
              </div>
              <div className="grid gap-2">
                <ActivityCard 
                  href="/checkin" 
                  Icon={Smile} 
                  title="Mood Check-in" 
                  desc="Log your emotional state and check in with your partner."
                  preview={todayUserLog ? `Logged today: ${moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.emoji} ${moodDetails[todayUserLog.mood as keyof typeof moodDetails]?.label}` : "Not logged yet today. Tap to check in!"}
                />
                <ActivityCard 
                  href="/love-letter" 
                  Icon={Heart} 
                  title="Love Letter" 
                  desc="Write custom wax-sealed letters with cute cat GIFs."
                  preview={lastLetterExcerpt ? `Last letter: "${lastLetterExcerpt}"` : null}
                />
                <ActivityCard 
                  href="/gratitude-jar" 
                  Icon={Gift} 
                  title="Today I'm grateful for..." 
                  desc="Share little things you appreciate about each other."
                />
              </div>
            </section>

            {/* Play Category */}
            <section className="space-y-3 bg-muted/5 p-4 rounded-card border border-border/25">
              <div>
                <h3 className="font-sans font-black text-sm text-foreground flex items-center gap-2">
                  <span className="text-amber-500">🎮</span> Play
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  Have fun together.
                </p>
              </div>
              <div className="grid gap-2">
                <ActivityCard 
                  href="/riddle" 
                  Icon={HelpCircle} 
                  title="Riddle Night" 
                  desc="Crack mind-bending riddles together with live timers."
                />
                <ActivityCard 
                  href="/iq-duel" 
                  Icon={Brain} 
                  title="IQ Duel" 
                  desc="Challenge each other in a friendly IQ check."
                />
                <ActivityCard 
                  href="/quiz" 
                  Icon={Gamepad2} 
                  title="Vibe Quiz" 
                  desc="Answer relationship quiz packs and compare answers."
                />
                <ActivityCard 
                  href="/vibe-judge" 
                  Icon={Scale} 
                  title="Between the Lines" 
                  desc="Settle relationship disputes playfully using Gemini AI."
                />
              </div>
            </section>

            {/* Memories Category */}
            <section className="space-y-3 bg-muted/5 p-4 rounded-card border border-border/25">
              <div>
                <h3 className="font-sans font-black text-sm text-foreground flex items-center gap-2">
                  <span className="text-emerald-500">📸</span> Memories
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  Relive moments together.
                </p>
              </div>
              <div className="grid gap-2">
                <ActivityCard 
                  href="/avatars" 
                  Icon={Camera} 
                  title="Photobooth" 
                  desc="Take sequential photos, apply filters, and design strips."
                  preview={photoboothInfo ? `Last memory: ${photoboothInfo.date}, ${photoboothInfo.count} photos added` : null}
                />
                <ActivityCard 
                  href="/moments" 
                  Icon={BookOpen} 
                  title="Our Memories" 
                  desc="Save anniversaries, memories, and photos scrapbook."
                />
                <ActivityCard 
                  href="/stories" 
                  Icon={Compass} 
                  title="Our Chapters" 
                  desc="Document major relationship milestones and timelines."
                />
              </div>
            </section>

            {/* Together Category */}
            <section className="space-y-3 bg-muted/5 p-4 rounded-card border border-border/25">
              <div>
                <h3 className="font-sans font-black text-sm text-foreground flex items-center gap-2">
                  <span className="text-indigo-500">🌙</span> Together
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  Share your time.
                </p>
              </div>
              <div className="grid gap-2">
                <ActivityCard 
                  href="/watch" 
                  Icon={Tv} 
                  title="Watch Together" 
                  desc="Sync and watch YouTube videos together in real-time."
                />
                <ActivityCard 
                  href="/focus" 
                  Icon={Timer} 
                  title="Focus Session" 
                  desc="Work or study together with synchronized Pomodoro timers."
                />
              </div>
            </section>
          </div>
        </div>

        {/* Small Privacy/Info Badge */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-muted-foreground/60 pt-8 border-t border-border/20">
          <Shield className="w-3.5 h-3.5" />
          <span>Strict End-to-End Pair Encryption applied under public RLS policies.</span>
        </div>
      </main>
    </div>
  );
}
