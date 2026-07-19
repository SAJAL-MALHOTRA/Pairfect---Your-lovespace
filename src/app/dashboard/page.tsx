"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Loader2, Calendar, Mail, Image as ImageIcon, Gift, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

export const moodDetails = {
  joyful:   { label: "Joyful",   emoji: "😊", color: "text-yellow-600  bg-yellow-50  dark:bg-yellow-950/20  border-yellow-100 dark:border-yellow-900/25" },
  content:  { label: "Content",  emoji: "🥰", color: "text-rose-600    bg-rose-50    dark:bg-rose-950/20    border-rose-100   dark:border-rose-900/25" },
  neutral:  { label: "Neutral",  emoji: "😐", color: "text-slate-600   bg-slate-50   dark:bg-slate-900/20   border-slate-100  dark:border-slate-800/25" },
  tired:    { label: "Tired",    emoji: "🥱", color: "text-blue-600    bg-blue-50    dark:bg-blue-950/20    border-blue-100   dark:border-blue-900/25" },
  stressed: { label: "Stressed", emoji: "😰", color: "text-orange-600  bg-orange-50  dark:bg-orange-950/20  border-orange-100 dark:border-orange-900/25" },
  sad:      { label: "Sad",      emoji: "😢", color: "text-sky-600     bg-sky-50     dark:bg-sky-950/20     border-sky-100    dark:border-sky-900/25" },
  anxious:  { label: "Anxious",  emoji: "🥺", color: "text-blue-500    bg-blue-50    dark:bg-blue-950/20    border-blue-100   dark:border-blue-900/25" },
  excited:  { label: "Excited",  emoji: "🤪", color: "text-pink-600    bg-pink-50    dark:bg-pink-950/20    border-pink-100   dark:border-pink-900/25" },
  loved:    { label: "Loved",    emoji: "💖", color: "text-rose-600    bg-rose-50    dark:bg-rose-950/20    border-rose-100   dark:border-rose-900/25" },
  distant:  { label: "Distant",  emoji: "😶", color: "text-teal-600    bg-teal-50    dark:bg-teal-950/20    border-teal-100   dark:border-teal-900/25" },
};

// ── Dried Botanical Sprig SVG behind envelope ──
function BotanicalFlower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} fill="none" aria-hidden="true">
      <path d="M30 170 Q48 135 55 90 T70 20" stroke="#C4A882" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M42 120 Q30 110 24 102" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      <path d="M50 95 Q65 85 70 78" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      <path d="M58 65 Q45 55 38 48" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      
      <ellipse cx="24" cy="102" rx="4.5" ry="3" transform="rotate(-30 24 102)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="70" cy="78" rx="4.5" ry="3" transform="rotate(30 70 78)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="38" cy="48" rx="4" ry="2.5" transform="rotate(-20 38 48)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="70" cy="20" rx="5" ry="3.5" transform="rotate(15 70 20)" fill="#D4B892" opacity="0.75" />
      
      <path d="M34 145 Q20 135 12 128" stroke="#C4A882" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="12" cy="128" rx="3.5" ry="2" fill="#D4B892" opacity="0.7" />
    </svg>
  );
}

// ── Sparkle Overlay ──
function Sparkle({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="var(--rose)"
      strokeWidth="1.8"
      animate={{ opacity: [0.15, 0.95, 0.15] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
    </motion.svg>
  );
}

// ── Wax Seal Monogram ──
function WaxSeal({ letter = "P" }: { letter?: string }) {
  return (
    <motion.div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: "var(--burgundy)",
        boxShadow: "0 4px 14px rgba(142, 43, 69, 0.35)",
      }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-[50px] h-[50px] rounded-full border border-white/15 flex items-center justify-center">
        <span className="font-heading italic text-2xl text-white/80 font-bold select-none">{letter}</span>
      </div>
    </motion.div>
  );
}

// ── Envelope Component ──
function HomeEnvelope({ partnerName }: { partnerName: string }) {
  const monogram = partnerName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="relative select-none" style={{ width: "380px", height: "260px" }}>
      <BotanicalFlower className="absolute -bottom-10 -left-12 w-28 h-40 opacity-75 z-0 pointer-events-none" />

      <Sparkle className="absolute -top-6 left-12 w-5 h-5 z-10" delay={0} />
      <Sparkle className="absolute bottom-10 -right-6 w-4 h-4 z-10" delay={1.2} />
      <Sparkle className="absolute -bottom-6 left-28 w-4 h-4 z-10" delay={2.4} />

      <div
        className="relative w-full h-full rounded-2xl border overflow-hidden z-10"
        style={{
          backgroundColor: "#F1E3C9",
          borderColor: "var(--border)",
          boxShadow: "0 18px 40px var(--shadow)",
        }}
      >
        <div className="absolute top-4 right-4 opacity-15 pointer-events-none">
          <svg width="60" height="60" viewBox="0 0 64 64" fill="none" stroke="var(--burgundy)" strokeWidth="1.2">
            <circle cx="32" cy="32" r="28" strokeDasharray="3 3" />
            <circle cx="32" cy="32" r="22" />
            <text x="50%" y="42%" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-sans)" letterSpacing="1">KEEPSAKE</text>
            <text x="50%" y="62%" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-sans)" letterSpacing="1">PAIRFECT</text>
          </svg>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 380 260" fill="none">
          <path d="M 0 0 L 190 135 L 380 0" stroke="rgba(142, 43, 69, 0.16)" strokeWidth="1.5" />
          <path d="M 0 260 L 135 125" stroke="rgba(142, 43, 69, 0.12)" strokeWidth="1" />
          <path d="M 380 260 L 245 125" stroke="rgba(142, 43, 69, 0.12)" strokeWidth="1" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center z-20">
          <WaxSeal letter={monogram} />
        </div>
      </div>
    </div>
  );
}

// ── Dynamic SVG Glass Jar Sketch ──
function GlassJarSketch() {
  return (
    <svg viewBox="0 0 100 120" className="w-16 h-20" fill="none" aria-hidden="true">
      <path d="M 30 20 Q 20 20 20 30 L 20 90 Q 20 100 30 100 H 70 Q 80 100 80 90 L 80 30 Q 80 20 70 20 Z" fill="rgba(255, 255, 255, 0.15)" stroke="var(--text-soft)" strokeWidth="1.5" />
      <rect x="35" y="12" width="30" height="8" rx="2" fill="#8C6A48" stroke="var(--text-soft)" strokeWidth="1.2" />
      
      {/* Mini slips inside */}
      <rect x="32" y="75" width="10" height="10" rx="2" fill="#E0B8B8" transform="rotate(15 32 75)" />
      <rect x="48" y="80" width="10" height="10" rx="2" fill="#A8BDB2" transform="rotate(-10 48 80)" />
      <rect x="58" y="72" width="10" height="10" rx="2" fill="#D2C4D8" transform="rotate(25 58 72)" />
      
      {/* Heart tag label */}
      <rect x="38" y="45" width="24" height="20" rx="3" fill="#FAF6EE" stroke="var(--text-soft)" strokeWidth="1" />
      <path d="M 50 51 C 48 47, 44 49, 50 57 C 56 49, 52 47, 50 51 Z" fill="var(--rose)" />
    </svg>
  );
}

// ── Dynamic SVG Cake Sketch ──
function AnniversaryCakeSketch() {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" aria-hidden="true">
      <rect x="15" y="60" width="70" height="24" rx="4" fill="#FAF6EE" stroke="var(--text-soft)" strokeWidth="1.5" />
      <rect x="25" y="40" width="50" height="20" rx="4" fill="#FAF6EE" stroke="var(--text-soft)" strokeWidth="1.5" />
      <rect x="35" y="24" width="30" height="16" rx="4" fill="#FAF6EE" stroke="var(--text-soft)" strokeWidth="1.5" />
      <line x1="50" y1="24" x2="50" y2="12" stroke="var(--text-soft)" strokeWidth="1.5" />
      <path d="M 50 12 C 48 8, 44 10, 50 18 C 56 10, 52 8, 50 12 Z" fill="var(--rose)" />
      <path d="M 15 68 C 25 72, 75 72, 85 68" stroke="var(--rose)" strokeWidth="1" />
      <path d="M 25 46 C 35 50, 65 50, 75 46" stroke="var(--rose)" strokeWidth="1" />
    </svg>
  );
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
  const [anniversaryDaysToGo, setAnniversaryDaysToGo] = useState(77);
  const [anniversaryDateFormatted, setAnniversaryDateFormatted] = useState("September 13, 2026");
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!pair || loading) return;
    (async () => {
      try {
        const [letRes, momRes, gratRes, recentLet, recentMom, recentGrat] = await Promise.all([
          supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("shared_moments").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("gratitude_entries").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("love_letters").select("id, sender_id, sent_at").eq("pair_id", pair.id).order("sent_at", { ascending: false }).limit(2),
          supabase.from("shared_moments").select("id, title, moment_date, created_at").eq("pair_id", pair.id).order("created_at", { ascending: false }).limit(2),
          supabase.from("gratitude_entries").select("id, sender_id, created_at").eq("pair_id", pair.id).order("created_at", { ascending: false }).limit(2),
        ]);

        if (letRes.count !== null) setLettersCount(letRes.count);
        if (momRes.count !== null) setMomentsCount(momRes.count);
        if (gratRes.count !== null) setGratitudeCount(gratRes.count);

        // Calculate partner's latest feeling
        const { data: partnerMood } = await supabase
          .from("mood_logs")
          .select("mood")
          .eq("pair_id", pair.id)
          .eq("user_id", partner?.id || "")
          .order("created_at", { ascending: false })
          .limit(1);

        if (partnerMood && partnerMood.length > 0) {
          setPartnerFeeling(`feeling ${partnerMood[0].mood}`);
        } else {
          setPartnerFeeling("feeling peaceful");
        }

        // Assemble recent activities
        const activities: RecentActivityItem[] = [];
        const partnerName = partner?.display_name || "Partner";

        if (recentLet.data) {
          recentLet.data.forEach((l: any) => {
            const isMe = l.sender_id === user?.id;
            activities.push({
              id: l.id,
              type: "letter",
              text: isMe ? "You wrote a letter" : `${partnerName} sent you a letter`,
              timeStr: "Recently",
              timestamp: new Date(l.sent_at).getTime(),
            });
          });
        }

        if (recentMom.data) {
          recentMom.data.forEach((m: any) => {
            activities.push({
              id: m.id,
              type: "moment",
              text: `Added memory: "${m.title}"`,
              timeStr: "Recently",
              timestamp: new Date(m.created_at).getTime(),
            });
          });
        }

        if (recentGrat.data) {
          recentGrat.data.forEach((g: any) => {
            const isMe = g.sender_id === user?.id;
            activities.push({
              id: g.id,
              type: "gratitude",
              text: isMe ? "You added a gratitude note" : `${partnerName} added a gratitude note`,
              timeStr: "Recently",
              timestamp: new Date(g.created_at).getTime(),
            });
          });
        }

        // Sort by timestamp desc, take top 3
        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 3));

        // Anniversary countdown calculations
        const anniversaryDate = new Date(pair.created_at);
        const today = new Date();
        let nextAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (nextAnniversary.getTime() < today.getTime()) {
          nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
        }
        const diffTime = Math.abs(nextAnniversary.getTime() - today.getTime());
        const daysToGo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setAnniversaryDaysToGo(daysToGo);

        const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
        setAnniversaryDateFormatted(nextAnniversary.toLocaleDateString("en-US", options));

      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    })();
  }, [pair, partner, loading]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  const daysTogether = pair?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pair.created_at).getTime()) / 86400000) + 1)
    : 1;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "Good morning,";
    if (hours >= 12 && hours < 17) return "Good afternoon,";
    if (hours >= 17 && hours < 22) return "Good evening,";
    return "Still awake,";
  };

  const greetingLine = getGreeting();
  const recipientName = partner?.display_name || "partner";

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Navigation />

      {/* Main Container: two-column layout on large screens */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto w-full px-6 py-16 pb-36 pt-24 space-y-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ─── LEFT COLUMN (HERO) ─── */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left space-y-10">
            {/* Header Greeting */}
            <div className="space-y-1">
              <p className="font-handwriting text-lg text-[var(--rose)] italic">
                {greetingLine} <span className="font-sans text-[11px] not-italic ml-0.5">♥</span>
              </p>
              <h2 className="font-heading font-semibold text-[42px] text-[var(--text)] leading-none">
                {profile?.display_name || "Love"}
              </h2>
              <p className="text-[13px] text-[var(--text-soft)] font-mono tracking-wide mt-1">
                {daysTogether} days together ♥
              </p>
            </div>

            {/* Envelope Centerpiece */}
            <div className="flex justify-center w-full lg:justify-start">
              <HomeEnvelope partnerName={recipientName} />
            </div>

            {/* CTA action */}
            <div className="space-y-5 flex flex-col items-center lg:items-start w-full">
              <p className="font-heading text-2xl text-[var(--text)] italic leading-tight">
                A letter is waiting for you.
              </p>
              <Link
                href="/love-letter"
                className="py-3 px-10 text-xs font-mono uppercase tracking-widest text-[#F8F3EE] rounded-full shadow-sm cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--burgundy)",
                  boxShadow: "0 4px 14px rgba(142, 43, 69, 0.22)",
                }}
              >
                Open Letter →
              </Link>
            </div>

            {/* Status Line */}
            <div className="pt-2 border-t border-[var(--border)] w-full lg:w-auto">
              <p className="text-[13px] text-[var(--text-soft)] font-sans tracking-wide">
                <span className="text-[var(--burgundy)] font-semibold">{daysTogether}</span> days together ·{" "}
                <span className="text-[var(--burgundy)] font-semibold">{lettersCount}</span> letters ·{" "}
                {partnerFeeling}
              </p>
            </div>

            {/* Shortcut row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4">
              {[
                { href: "/moments", label: "Memory of the Day", desc: "Rediscover special memories" },
                { href: "/checkin", label: "Tonight's Journal", desc: "Write your thoughts together" },
                { href: "/play", label: "Date Night", desc: "Play something fun together" },
                { href: "/stories", label: "Timeline", desc: "See your journey together" },
              ].map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="p-4 rounded-[20px] border flex flex-col justify-between text-left transition-all hover:translate-y-[-2px] hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="font-heading text-xs font-bold text-[var(--text)] leading-tight">{card.label}</p>
                  <p className="text-[9px] text-[var(--text-soft)] mt-2 leading-relaxed">{card.desc} →</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── RIGHT COLUMN (WIDGETS) ─── */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Widget 1: On This Day */}
            <div
              className="p-6 rounded-[20px] border space-y-4"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
                boxShadow: "0 4px 16px var(--shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-soft)] text-[10px] font-mono uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>On This Day</span>
                </div>
              </div>

              {/* Memory content layout */}
              <div className="flex gap-4 items-center">
                {/* Micro polaroid container */}
                <div
                  className="polaroid p-2 z-10 rotate-[-2deg] flex-shrink-0"
                  style={{ width: "95px", background: "#FFF", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
                >
                  <div className="w-full h-16 bg-[#E5D4B0] rounded-sm overflow-hidden flex items-center justify-center">
                    <span className="text-xl">🌅</span>
                  </div>
                  <p className="font-handwriting text-[6px] text-center text-gray-400 mt-2">Love</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-[var(--rose)] uppercase tracking-wider">2 years ago</p>
                  <p className="font-heading text-sm text-[var(--text)] italic leading-tight">
                    You watched the sunset together.
                  </p>
                  <Link
                    href="/moments"
                    className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-[var(--burgundy)] hover:underline pt-1"
                  >
                    View Memory <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Widget 2: Split Row (Gratitude Jar & Recent Activity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Gratitude Jar Card */}
              <div
                className="p-5 rounded-[20px] border flex flex-col items-center text-center justify-between space-y-3"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  boxShadow: "0 4px 16px var(--shadow)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                  <Gift className="w-3 h-3" />
                  <span>Gratitude Jar</span>
                </div>

                <GlassJarSketch />

                <div>
                  <p className="font-heading text-sm text-[var(--text)] font-semibold">{gratitudeCount} notes inside</p>
                  <Link
                    href="/gratitude-jar"
                    className="text-[9px] font-mono uppercase text-[var(--burgundy)] hover:underline block mt-1"
                  >
                    Open a random note →
                  </Link>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div
                className="p-5 rounded-[20px] border flex flex-col justify-between space-y-3"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  boxShadow: "0 4px 16px var(--shadow)",
                }}
              >
                <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-soft)] border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
                  Recent Activity
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act) => (
                      <div key={act.id} className="text-[10px] text-[var(--text-soft)] flex items-start gap-1.5 leading-tight">
                        <span className="text-[var(--burgundy)]">✦</span>
                        <div>
                          <p className="text-[var(--text)] font-medium">{act.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[9px] font-mono text-[var(--text-soft)] italic">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Widget 3: Upcoming Anniversary */}
            <div
              className="p-6 rounded-[20px] border flex items-center justify-between gap-4"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
                boxShadow: "0 4px 16px var(--shadow)",
              }}
            >
              <div className="flex items-center gap-4">
                <AnniversaryCakeSketch />
                
                <div className="space-y-0.5">
                  <p className="text-[10px] font-mono uppercase text-[var(--text-soft)] tracking-wider">Our Anniversary</p>
                  <h3 className="font-heading text-lg font-bold text-[var(--text)] leading-tight">
                    {anniversaryDaysToGo} days to go
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--rose)]">{anniversaryDateFormatted}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── FULL-WIDTH STATS CARD ROW AT THE BOTTOM ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[var(--border)]">
          {[
            { label: `${daysTogether} Days`, desc: "Together", icon: Calendar },
            { label: `${lettersCount} Letters`, desc: "Sent & Sealed", icon: Mail },
            { label: `${momentsCount} Memories`, desc: "In Scrapbook", icon: ImageIcon },
            { label: `${gratitudeCount} Notes`, desc: "In Gratitude Jar", icon: Gift },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-4 rounded-[20px] border flex items-center gap-3 text-left"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="w-9 h-9 rounded-full bg-[var(--burgundy)]/10 text-[var(--burgundy)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-[var(--text)] leading-tight">{stat.label}</p>
                  <p className="text-[9px] text-[var(--text-soft)] mt-0.5 font-mono uppercase tracking-wider">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </motion.main>
    </div>
  );
}
