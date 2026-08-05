"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Loader2, Calendar, Mail, Image as ImageIcon, Gift, ArrowRight, Heart, Send, Sparkles, PenTool, Music, Moon, Sun, Coffee, Sunset, Camera, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PairfectPortrait } from "@/components/cozy-illustrations";
import PushOptInBanner from "@/components/push-opt-in-banner";

export const moodDetails = {
  joyful:   { label: "Joyful",   emoji: "😊", color: "text-yellow-600  bg-yellow-50  border-yellow-100" },
  content:  { label: "Content",  emoji: "🥰", color: "text-rose-600    bg-rose-50    border-rose-100" },
  neutral:  { label: "Neutral",  emoji: "😐", color: "text-slate-600   bg-slate-50   border-slate-100" },
  tired:    { label: "Tired",    emoji: "🥱", color: "text-blue-600    bg-blue-50    border-blue-100" },
  stressed: { label: "Stressed", emoji: "😰", color: "text-orange-600  bg-orange-50  border-orange-100" },
  sad:      { label: "Sad",      emoji: "😢", color: "text-sky-600     bg-sky-50     border-sky-100" },
  anxious:  { label: "Anxious",  emoji: "🥺", color: "text-blue-500    bg-blue-50    border-blue-100" },
  excited:  { label: "Excited",  emoji: "🤪", color: "text-pink-600    bg-pink-50    border-pink-100" },
  loved:    { label: "Loved",    emoji: "💖", color: "text-rose-600    bg-rose-50    border-rose-100" },
  distant:  { label: "Distant",  emoji: "😶", color: "text-teal-600    bg-teal-50    border-teal-100" },
};

/* ── Milestone Calculator ── */
const MILESTONES = [
  { days: 7, label: "1 Week" },
  { days: 14, label: "2 Weeks" },
  { days: 30, label: "1 Month" },
  { days: 50, label: "50 Days" },
  { days: 100, label: "100 Days" },
  { days: 180, label: "6 Months" },
  { days: 200, label: "200 Days" },
  { days: 365, label: "1 Year" },
  { days: 500, label: "500 Days" },
  { days: 730, label: "2 Years" },
  { days: 1000, label: "1,000 Days" },
];

function getUpcomingMilestone(currentDays: number) {
  const next = MILESTONES.find((m) => m.days > currentDays) || {
    days: currentDays + 100,
    label: `${currentDays + 100} Days`,
  };
  const daysToGo = next.days - currentDays;
  const percent = Math.min(100, Math.max(5, Math.round((currentDays / next.days) * 100)));
  return { next, daysToGo, percent };
}

/* ── Live Countdown Timer Component ── */
function LiveCountdownTimer({ targetDateISO }: { targetDateISO?: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calculate() {
      if (!targetDateISO) return;
      const targetDate = new Date(targetDateISO);
      if (isNaN(targetDate.getTime())) return;

      const today = new Date();
      let nextAnniv = new Date(today.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      if (nextAnniv.getTime() <= today.getTime()) {
        nextAnniv.setFullYear(nextAnniv.getFullYear() + 1);
      }

      const diffMs = nextAnniv.getTime() - today.getTime();
      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateISO]);

  return (
    <div className="grid grid-cols-4 gap-2.5 text-center select-none w-full max-w-[320px]">
      {[
        { val: timeLeft.days, label: "Days" },
        { val: timeLeft.hours, label: "Hours" },
        { val: timeLeft.minutes, label: "Mins" },
        { val: timeLeft.seconds, label: "Secs" },
      ].map((seg) => (
        <div
          key={seg.label}
          className="bg-white border border-[#FFD0DD] rounded-2xl py-2.5 px-2 flex flex-col items-center justify-center shadow-xs"
        >
          <span className="font-display italic font-bold text-2xl text-[#3D2432] tabular-nums leading-none">
            {String(seg.val).padStart(2, "0")}
          </span>
          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#7A4B5D] mt-1">
            {seg.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function getExcerpt(text: any, maxLen = 75): string {
  if (!text) return "";
  let raw = "";
  if (typeof text === "string") raw = text;
  else if (Array.isArray(text)) {
    const textObj = text.find((item: any) => item && item.type === "text" && item.value);
    if (textObj && textObj.value) raw = String(textObj.value);
    else raw = text.map((b: any) => (typeof b === "string" ? b : b?.value || "")).join(" ");
  } else if (typeof text === "object") {
    raw = text.content || text.text || "";
  }

  if (!raw || raw.startsWith("enc:")) {
    return "A handwritten letter for you ♡";
  }
  return raw.slice(0, maxLen);
}

interface RecentActivityItem {
  id: string;
  type: "letter" | "gratitude" | "moment";
  text: string;
  timeStr: string;
  timestamp: number;
}

export default function DashboardPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const [lettersCount, setLettersCount] = useState(0);
  const [momentsCount, setMomentsCount] = useState(0);
  const [gratitudeCount, setGratitudeCount] = useState(0);
  const [partnerFeeling, setPartnerFeeling] = useState("feeling peaceful");
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [anniversaryDaysToGo, setAnniversaryDaysToGo] = useState(0);
  const [anniversaryDateFormatted, setAnniversaryDateFormatted] = useState("");
  const [anniversaryNotSet, setAnniversaryNotSet] = useState(false);
  const [latestLetter, setLatestLetter] = useState<any>(null);
  const [latestMoment, setLatestMoment] = useState<any>(null);
  const [latestGratitude, setLatestGratitude] = useState<any>(null);
  const [mixtapeCount, setMixtapeCount] = useState(0);
  const [latestMixtape, setLatestMixtape] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!pair || loading) return;
    (async () => {
      try {
        const [letRes, momRes, gratRes, recentLet, recentMom, recentGrat, mixRes, recentMix] = await Promise.all([
          supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("shared_moments").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("gratitude_entries").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("love_letters").select("id, sender_id, sent_at, content").eq("pair_id", pair.id).order("sent_at", { ascending: false }).limit(2),
          supabase.from("shared_moments").select("id, title, photo_url, moment_date, created_at").eq("pair_id", pair.id).order("created_at", { ascending: false }).limit(2),
          supabase.from("gratitude_entries").select("id, sender_id, content, created_at").eq("pair_id", pair.id).order("created_at", { ascending: false }).limit(2),
          supabase.from("mixtapes").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("mixtapes").select("id, title, cover_theme, created_at").eq("pair_id", pair.id).order("created_at", { ascending: false }).limit(1),
        ]);

        if (letRes.count !== null) setLettersCount(letRes.count);
        if (momRes.count !== null) setMomentsCount(momRes.count);
        if (gratRes.count !== null) setGratitudeCount(gratRes.count);

        if (recentLet.data && recentLet.data.length > 0) setLatestLetter(recentLet.data[0]);
        if (recentMom.data && recentMom.data.length > 0) setLatestMoment(recentMom.data[0]);
        if (recentGrat.data && recentGrat.data.length > 0) setLatestGratitude(recentGrat.data[0]);
        if (mixRes.count !== null) setMixtapeCount(mixRes.count);
        if (recentMix.data && recentMix.data.length > 0) setLatestMixtape(recentMix.data[0]);

        const partnerName = partner?.display_name || "Partner";

        const activities: RecentActivityItem[] = [];
        if (recentLet.data) {
          recentLet.data.forEach((l: any) => {
            const isMe = l.sender_id === user?.id;
            const t = l.sent_at ? new Date(l.sent_at).getTime() : 0;
            activities.push({
              id: l.id,
              type: "letter",
              text: isMe ? "You wrote a letter" : `${partnerName} sent you a letter`,
              timeStr: "Recently",
              timestamp: isNaN(t) ? 0 : t,
            });
          });
        }

        if (recentMom.data) {
          recentMom.data.forEach((m: any) => {
            const t = m.created_at ? new Date(m.created_at).getTime() : 0;
            activities.push({
              id: m.id,
              type: "moment",
              text: `Added memory: "${m.title}"`,
              timeStr: "Recently",
              timestamp: isNaN(t) ? 0 : t,
            });
          });
        }

        if (recentGrat.data) {
          recentGrat.data.forEach((g: any) => {
            const isMe = g.sender_id === user?.id;
            const t = g.created_at ? new Date(g.created_at).getTime() : 0;
            activities.push({
              id: g.id,
              type: "gratitude",
              text: isMe ? "You added a gratitude note" : `${partnerName} added a gratitude note`,
              timeStr: "Recently",
              timestamp: isNaN(t) ? 0 : t,
            });
          });
        }

        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 3));

        const anniversaryDateISO = pair.started_dating_date || pair.created_at;
        if (anniversaryDateISO) {
          const startDate = new Date(anniversaryDateISO);
          if (!isNaN(startDate.getTime())) {
            const today = new Date();
            let nextAnniversary = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
            if (nextAnniversary.getTime() <= today.getTime()) {
              nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
            }
            const diffTime = Math.abs(nextAnniversary.getTime() - today.getTime());
            const daysToGo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setAnniversaryDaysToGo(daysToGo);

            const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
            setAnniversaryDateFormatted(startDate.toLocaleDateString("en-US", options));
            setAnniversaryNotSet(false);
          } else {
            setAnniversaryNotSet(true);
          }
        } else {
          setAnniversaryNotSet(true);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    })();
  }, [pair, partner, loading]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9FA]">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[#8C2C3D] animate-spin" />
      </div>
    );
  }

  const anniversaryStart = pair?.started_dating_date || pair?.created_at;
  const daysTogether = anniversaryStart
    ? Math.max(1, Math.floor((Date.now() - new Date(anniversaryStart).getTime()) / 86400000) + 1)
    : 1;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "Good morning";
    if (hours >= 12 && hours < 17) return "Good afternoon";
    if (hours >= 17 && hours < 22) return "Good evening";
    return "Still awake";
  };

  const getRitualPrompt = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 10) return { text: "Start the day with a small note of gratitude.", icon: Coffee, href: "/gratitude-jar", label: "Write a note" };
    if (hours >= 10 && hours < 14) return { text: "Thinking of each other? Send a wax-sealed letter.", icon: Sun, href: "/love-letter", label: "Write a letter" };
    if (hours >= 14 && hours < 18) return { text: "Take a moment — play a game or take a photostrip together.", icon: Sunset, href: "/play", label: "Play together" };
    if (hours >= 18 && hours < 22) return { text: "Tonight — write them a wax-sealed goodnight letter.", icon: Moon, href: "/love-letter", label: "Write tonight" };
    return { text: "Can't sleep? Leave a note in the jar for tomorrow.", icon: Moon, href: "/gratitude-jar", label: "Leave a note" };
  };

  const ritual = getRitualPrompt();
  const RitualIcon = ritual.icon;

  const greetingLine = getGreeting();
  const partnerName = partner?.display_name || "your partner";

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center overflow-x-hidden bg-[#FFF9FA]">
      
      <Navigation />

      {/* ══════════════════════════════════════════════════
          MAIN DASHBOARD CONTAINER (Organized as Chapters)
          ══════════════════════════════════════════════════ */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-6xl mx-auto w-full px-6 pt-24 pb-36 space-y-12 z-10"
      >
        <PushOptInBanner />

        {/* ─── CHAPTER I: NARRATIVE HERO GREETING ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#FFD0DD]">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#7A4B5D] uppercase">
              {greetingLine} ❤️
            </span>
            <h1 className="text-4xl sm:text-5xl font-display italic font-black text-[#3D2432]">
              {profile?.display_name || "Love"} &amp; {partner?.display_name || "Partner"}
            </h1>
            <p className="font-sans text-sm text-[#7A4B5D] flex items-center gap-2">
              <span className="font-bold text-[#8C2C3D]">{daysTogether} days</span> of choosing each other ♡
            </p>
          </div>

          <Link href="/profile" className="flex-shrink-0 transition-transform hover:scale-[1.03]" title="View Portrait & Profile">
            <PairfectPortrait className="w-24 h-24 rounded-2xl shadow-sm border border-[#FFD0DD]" />
          </Link>
        </div>

        {/* ─── CHAPTER II: THE HERO WAX-SEALED LETTER & QUICK RITUALS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* HERO CARD: Floating Wax-Sealed Envelope (The Centerpiece) */}
          <div className="lg:col-span-7 relative group">
            <div
              className="p-8 rounded-[28px] bg-[#FFF8FA] border-2 border-[#FFD0DD] shadow-xl space-y-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl paper-grain relative overflow-hidden flex flex-col justify-between h-full"
            >
              {/* Envelope Decorative Flap Cutout */}
              <div className="absolute top-0 inset-x-0 h-12 bg-[#FFEEF3] border-b border-[#FFD0DD] [clip-path:polygon(0_0,50%_100%,100%_0)]" />

              <div className="pt-8 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#8C2C3D] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  AES-256 ENCRYPTED LETTER
                </span>
                <span className="text-[10px] font-mono font-bold text-[#8C2C3D]">
                  CHAPTER I
                </span>
              </div>

              {/* Embossed Crimson Wax Seal Button */}
              <div className="flex items-center gap-5 my-2">
                <div className="w-16 h-16 rounded-full bg-[#8C2C3D] text-white flex items-center justify-center text-2xl shadow-lg border-2 border-white font-serif font-black shrink-0">
                  ⚜️
                </div>
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-display italic font-bold text-[#3D2432]">
                    {latestLetter ? "A letter arrived for you ♡" : "Write a wax-sealed letter"}
                  </h2>
                  <p className="text-xs text-[#7A4B5D] font-quote italic line-clamp-2">
                    {latestLetter ? `"${getExcerpt(latestLetter.content)}"` : "Sealed with digital wax. Unseal together on future dates."}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#FFD0DD]">
                <span className="text-[10px] font-mono text-[#7A4B5D]">
                  {latestLetter?.sent_at ? `Sent ${new Date(latestLetter.sent_at).toLocaleDateString()}` : "Ready to write"}
                </span>
                <Link
                  href="/love-letter"
                  className="btn-journal py-3 px-8 text-[11px]"
                >
                  Open Letter ▷
                </Link>
              </div>

            </div>
          </div>

          {/* SECONDARY CARD: Gratitude Jar & Recent Memory */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            
            {/* Gratitude Jar Showcase */}
            <Link
              href="/gratitude-jar"
              className="p-6 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 transition-transform hover:-translate-y-1 hover:shadow-lg paper-grain block text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🫙</span>
                  <h3 className="font-display italic font-bold text-lg text-[#3D2432]">Gratitude Jar</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-bold">
                  {gratitudeCount} NOTES INSIDE
                </span>
              </div>

              <p className="text-xs text-[#7A4B5D] leading-relaxed">
                {latestGratitude
                  ? `Latest note: "${getExcerpt(latestGratitude.content)}"`
                  : "Drop folded appreciation notes into a shared glass jar to read together."}
              </p>

              <span className="text-[10px] font-mono font-bold text-emerald-600 hover:underline block">
                Open a random note ▷
              </span>
            </Link>

            {/* 4-Frame Photobooth Strip Showcase */}
            <Link
              href="/photo-booth"
              className="p-6 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 transition-transform hover:-translate-y-1 hover:shadow-lg paper-grain block text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  <h3 className="font-display italic font-bold text-lg text-[#3D2432]">Photobooth Strip</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[9px] font-mono font-bold">
                  ALWAYS FREE
                </span>
              </div>

              <p className="text-xs text-[#7A4B5D] leading-relaxed">
                Take a 4-frame strip right from your browser, customize with stickers, and save to your shared wall.
              </p>

              <span className="text-[10px] font-mono font-bold text-purple-600 hover:underline block">
                Open photobooth ▷
              </span>
            </Link>

          </div>

        </div>

        {/* ─── CHAPTER III: ANNIVERSARY COUNTDOWN & MILESTONES ─── */}
        <div className="p-8 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-6 paper-grain text-left">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#FFD0DD] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8C2C3D] text-white flex items-center justify-center text-lg shadow-sm">
                ❤️
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A4B5D]">
                  CHAPTER III · MILESTONES
                </span>
                <h3 className="text-2xl font-display italic font-bold text-[#3D2432]">
                  {anniversaryNotSet ? "Set Your Anniversary Date" : "First Anniversary Countdown"}
                </h3>
              </div>
            </div>

            <Link
              href="/calendar"
              className="btn-journal-ghost py-2 px-4 text-[10px]"
            >
              View all special dates ▷
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {anniversaryNotSet ? (
              <Link
                href="/settings"
                className="btn-journal py-3 px-6 text-[10px]"
              >
                Set Anniversary Date in Settings ▷
              </Link>
            ) : (
              <>
                <LiveCountdownTimer targetDateISO={pair?.started_dating_date} />
                
                <div className="text-right space-y-1">
                  <p className="font-quote italic text-sm text-[#8C2C3D] font-bold">
                    &quot;A whole year of choosing each other.&quot;
                  </p>
                  <p className="text-xs font-mono text-[#7A4B5D]">
                    {anniversaryDateFormatted} · {anniversaryDaysToGo} days left
                  </p>
                </div>
              </>
            )}
          </div>

        </div>

        {/* ─── CHAPTER IV: SOUNDTRACK & DAILY RITUAL ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mixtape Cassette Card */}
          <Link
            href="/mixtape"
            className="p-6 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 transition-transform hover:-translate-y-1 paper-grain text-left block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-[#8C2C3D]" />
                <h3 className="font-display italic font-bold text-lg text-[#3D2432]">Mixtape Studio</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FFEEF3] text-[#8C2C3D] text-[9px] font-mono font-bold">
                {mixtapeCount} Tapes
              </span>
            </div>

            <p className="text-xs text-[#7A4B5D] leading-relaxed">
              {latestMixtape ? `Soundtrack: "${latestMixtape.title}"` : "Create a shared cassette playlist for your date nights."}
            </p>

            <span className="text-[10px] font-mono font-bold text-[#8C2C3D] hover:underline block">
              Open mixtape studio ▷
            </span>
          </Link>

          {/* Time-Aware Ritual Prompt */}
          <Link
            href={ritual.href}
            className="p-6 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md flex items-center gap-5 transition-transform hover:-translate-y-1 paper-grain text-left block"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FFEEF3] border border-[#FFD0DD] flex items-center justify-center text-[#8C2C3D] shrink-0">
              <RitualIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider">TONIGHT&apos;S RITUAL</span>
              <p className="text-xs font-bold text-[#3D2432]">{ritual.text}</p>
              <span className="text-[10px] font-mono font-bold text-[#8C2C3D] hover:underline block">
                {ritual.label} ▷
              </span>
            </div>
          </Link>

        </div>

      </motion.main>
    </div>
  );
}
