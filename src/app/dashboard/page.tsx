"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Loader2, Calendar, Mail, Image as ImageIcon, Gift, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PairfectPortrait } from "@/components/cozy-illustrations";

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
          backgroundColor: "var(--paper-mid)",
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
      <rect x="35" y="12" width="30" height="8" rx="2" fill="var(--text-soft)" stroke="var(--text-soft)" strokeWidth="1.2" />
      
      {/* Mini slips inside */}
      <rect x="32" y="75" width="10" height="10" rx="2" fill="#E0B8B8" transform="rotate(15 32 75)" />
      <rect x="48" y="80" width="10" height="10" rx="2" fill="#A8BDB2" transform="rotate(-10 48 80)" />
      <rect x="58" y="72" width="10" height="10" rx="2" fill="#D2C4D8" transform="rotate(25 58 72)" />
      
      {/* Heart tag label */}
      <rect x="38" y="45" width="24" height="20" rx="3" fill="var(--card)" stroke="var(--text-soft)" strokeWidth="1" />
      <path d="M 50 51 C 48 47, 44 49, 50 57 C 56 49, 52 47, 50 51 Z" fill="var(--rose)" />
    </svg>
  );
}

// ── Dynamic SVG Cake Sketch ──
function AnniversaryCakeSketch() {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" aria-hidden="true">
      <rect x="15" y="60" width="70" height="24" rx="4" fill="var(--card)" stroke="var(--text-soft)" strokeWidth="1.5" />
      <rect x="25" y="40" width="50" height="20" rx="4" fill="var(--card)" stroke="var(--text-soft)" strokeWidth="1.5" />
      <rect x="35" y="24" width="30" height="16" rx="4" fill="var(--card)" stroke="var(--text-soft)" strokeWidth="1.5" />
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
  const [anniversaryDaysToGo, setAnniversaryDaysToGo] = useState(0);
  const [anniversaryDateFormatted, setAnniversaryDateFormatted] = useState("");
  const [anniversaryNotSet, setAnniversaryNotSet] = useState(false);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  // prefers-reduced-motion hook (declared before early returns)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Tab active/inactive state to pause animations when tab is backgrounded
  const [tabActive, setTabActive] = useState(true);
  useEffect(() => {
    const handleVisibility = () => setTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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

        // Sort by timestamp desc, take top 3
        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 3));

        // Anniversary countdown — use started_dating_date, NOT pair.created_at
        if (pair.started_dating_date) {
          const anniversaryDate = new Date(pair.started_dating_date);
          if (!isNaN(anniversaryDate.getTime())) {
            const today = new Date();
            let nextAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
            if (nextAnniversary.getTime() <= today.getTime()) {
              nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
            }
            const diffTime = Math.abs(nextAnniversary.getTime() - today.getTime());
            const daysToGo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setAnniversaryDaysToGo(daysToGo);
            const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
            setAnniversaryDateFormatted(nextAnniversary.toLocaleDateString("en-US", options));
            setAnniversaryNotSet(false);
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

  // Faint, large, heavily blurred background glass blobs (opacity < 5% for deep depth)
  const glassBlobs = [
    { left: "10%", top: "20%", size: 380, color: "rgba(255, 200, 215, 0.02)", dx: [-25, 25, -25], dy: [-15, 15, -15], duration: 40 },
    { left: "75%", top: "55%", size: 340, color: "rgba(235, 215, 255, 0.02)", dx: [20, -20, 20], dy: [-20, 20, -20], duration: 45 },
    { left: "80%", top: "10%", size: 450, color: "rgba(255, 235, 200, 0.015)", dx: [-15, 15, -15], dy: [15, -15, 15], duration: 50 },
  ];

  // Translucent glass hearts with custom colors, blur levels (depth, in pixels), opacities, and shimmer delays
  const glassHearts = [
    // Foregrounds (Sharp, bright, highest glow)
    { size: 72, left: "81%", top: "12%", color: "#FFD3E2", blur: 0, glow: 0.28, duration: 32, delay: 0, dx: [-18, 18, -18], dy: [-12, 12, -12], rot: [0, 8, 0], shimmerDelay: 1, shimmerInterval: 9 },
    { size: 60, left: "11%", top: "72%", color: "#FFE8E2", blur: 0, glow: 0.28, duration: 38, delay: 2, dx: [-15, 15, -15], dy: [-18, 18, -18], rot: [0, -12, 0], shimmerDelay: 4, shimmerInterval: 12 },
    { size: 42, left: "91%", top: "45%", color: "#EEDAF5", blur: 1, glow: 0.22, duration: 28, delay: 1, dx: [-12, 12, -12], dy: [-10, 10, -10], rot: [0, 15, 0], shimmerDelay: 3, shimmerInterval: 11 },
    
    // Middleground (Slight blur)
    { size: 26, left: "84%", top: "26%", color: "#FFF0EB", blur: 2, glow: 0.18, duration: 24, delay: 3, dx: [-10, 10, -10], dy: [-8, 8, -8], rot: [0, -6, 0], shimmerDelay: 0.5, shimmerInterval: 10 },
    { size: 22, left: "21%", top: "14%", color: "#FFD6E8", blur: 2.5, glow: 0.18, duration: 30, delay: 1.5, dx: [-15, 15, -15], dy: [-12, 12, -12], rot: [0, 10, 0], shimmerDelay: 2.5, shimmerInterval: 13 },
    { size: 24, left: "75%", top: "79%", color: "#E6F5FA", blur: 2.5, glow: 0.18, duration: 35, delay: 4, dx: [-20, 20, -20], dy: [-15, 15, -15], rot: [0, -10, 0], shimmerDelay: 5, shimmerInterval: 14 },
    { size: 28, left: "6%", top: "43%", color: "#FFF9F5", blur: 2, glow: 0.18, duration: 27, delay: 2.5, dx: [-14, 14, -14], dy: [-10, 10, -10], rot: [0, 8, 0], shimmerDelay: 3.5, shimmerInterval: 11.5 },
    { size: 20, left: "88%", top: "83%", color: "#FFDFE6", blur: 2.5, glow: 0.18, duration: 29, delay: 0.8, dx: [-12, 12, -12], dy: [-14, 14, -14], rot: [0, -8, 0], shimmerDelay: 1.8, shimmerInterval: 10.5 },

    // Background (Heavy blur, very faint, some almost disappear)
    { size: 14, left: "9%", top: "18%", color: "#FFDEEB", blur: 4, glow: 0.12, duration: 22, delay: 5, dx: [-8, 8, -8], dy: [-6, 6, -6], rot: [0, 5, 0], shimmerDelay: 6, shimmerInterval: 14 },
    { size: 12, left: "78%", top: "30%", color: "#F0FAFF", blur: 5, glow: 0.10, duration: 31, delay: 2, dx: [-12, 12, -12], dy: [-10, 10, -10], rot: [0, -5, 0], shimmerDelay: 0, shimmerInterval: 16 },
    { size: 10, left: "27%", top: "83%", color: "#FFF6FA", blur: 5, glow: 0.08, duration: 34, delay: 3.2, dx: [-10, 10, -10], dy: [-12, 12, -12], rot: [0, 12, 0], shimmerDelay: 4.5, shimmerInterval: 13.5 },
    { size: 8, left: "67%", top: "15%", color: "#FFEAE6", blur: 6, glow: 0.06, duration: 26, delay: 1.2, dx: [-6, 6, -6], dy: [-8, 8, -8], rot: [0, -15, 0], shimmerDelay: 2, shimmerInterval: 11.5 },
    { size: 12, left: "3%", top: "27%", color: "#FFF0F5", blur: 5, glow: 0.08, duration: 33, delay: 0.5, dx: [-15, 15, -15], dy: [-15, 15, -15], rot: [0, 4, 0], shimmerDelay: 1.2, shimmerInterval: 12 },
    { size: 14, left: "93%", top: "19%", color: "#FFDCE6", blur: 4, glow: 0.10, duration: 36, delay: 4.5, dx: [-18, 18, -18], dy: [-12, 12, -12], rot: [0, -4, 0], shimmerDelay: 5.2, shimmerInterval: 15 },
  ];

  // Sparkles (tiny 2-4px dots and faint 4-point stars)
  const sparkles = [
    { type: "dot", size: 3, left: "18%", top: "16%" },
    { type: "star", size: 8, left: "84%", top: "34%" },
    { type: "dot", size: 4, left: "4%", top: "67%" },
    { type: "star", size: 10, left: "89%", top: "77%" },
    { type: "dot", size: 2, left: "14%", top: "87%" },
    { type: "star", size: 7, left: "76%", top: "7%" },
    { type: "dot", size: 3, left: "33%", top: "89%" },
    { type: "star", size: 9, left: "64%", top: "11%" },
  ];

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center overflow-x-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* ─── AMBIENT BACKGROUND PARTICLES ─── */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden select-none" 
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {/* 1. Large Blurred Background Glass Blobs */}
        {glassBlobs.map((blob, idx) => {
          const blobAnim: any = reducedMotion || !tabActive
            ? {}
            : {
                x: blob.dx,
                y: blob.dy,
              };

          return (
            <motion.div
              key={`blob-${idx}`}
              className="absolute rounded-full pointer-events-none select-none"
              style={{
                left: blob.left,
                top: blob.top,
                width: `${blob.size}px`,
                height: `${blob.size}px`,
                background: blob.color,
                filter: "blur(110px)",
                opacity: 0.55,
              }}
              animate={blobAnim}
              transition={{
                duration: blob.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* 2. Glass Hearts */}
        {glassHearts.map((p, idx) => {
          const animationProps: any = reducedMotion || !tabActive
            ? {
                animate: { opacity: p.glow * 0.4 },
                transition: { duration: 1 }
              }
            : {
                animate: {
                  x: p.dx,
                  y: p.dy,
                  rotate: p.rot,
                  opacity: [p.glow * 0.3, p.glow * 0.9, p.glow * 0.3],
                },
                transition: {
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              };

          return (
            <motion.div
              key={`heart-${idx}`}
              className="absolute select-none pointer-events-none"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                // Soft glow bloom + Gaussian blur combined to avoid Tailwind config dependencies
                filter: p.blur > 0
                  ? `blur(${p.blur}px) drop-shadow(0 4px 12px rgba(255, 220, 230, ${p.glow * 0.7}))`
                  : `drop-shadow(0 4px 12px rgba(255, 220, 230, ${p.glow * 0.7}))`,
                zIndex: p.size > 50 ? 2 : 1,
              }}
              {...animationProps}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <defs>
                  {/* Glass texture gradient */}
                  <radialGradient id={`glassGrad-${idx}`} cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                    <stop offset="50%" stopColor={p.color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#D38CA2" stopOpacity="0.08" />
                  </radialGradient>
                  {/* Glass edge stroke gradient */}
                  <linearGradient id={`edgeGrad-${idx}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                    <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor={p.color} stopOpacity="0.45" />
                  </linearGradient>
                  {/* Specular sunlight shimmer sweep gradient */}
                  <linearGradient id={`shimmerGrad-${idx}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Soft background shape shadow/bloom blur */}
                <path
                  d="M 50 86 C 25 63, 6 43, 6 27 C 6 12, 23 5, 50 31 C 77 5, 94 12, 94 27 C 94 43, 75 63, 50 86 Z"
                  fill="rgba(255, 200, 215, 0.06)"
                  filter="blur(3px)"
                />

                {/* Main Glass Heart Body */}
                <path
                  d="M 50 84 C 25 61, 8 41, 8 26 C 8 11, 25 4, 50 29 C 75 4, 92 11, 92 26 C 92 41, 75 61, 50 84 Z"
                  fill={`url(#glassGrad-${idx})`}
                  stroke={`url(#edgeGrad-${idx})`}
                  strokeWidth="1.2"
                />

                {/* Specular Inner Refraction highlight */}
                <path
                  d="M 50 76 C 31 57, 15 39, 15 26 C 15 15, 27 10, 50 31"
                  stroke="#FFFFFF"
                  strokeOpacity="0.35"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />

                {/* Top Left Glass Curved highlight */}
                <path
                  d="M 24 23 C 28 15, 38 13, 47 23"
                  stroke="#FFFFFF"
                  strokeOpacity="0.65"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Specular Shine catch: sweeps across the surface dynamically */}
                <g style={{ mixBlendMode: "overlay" }}>
                  <rect
                    className="shimmer-active"
                    x="-20"
                    y="-20"
                    width="15"
                    height="120"
                    fill={`url(#shimmerGrad-${idx})`}
                    style={{
                      animationDelay: `${p.shimmerDelay}s`,
                      animationDuration: `${p.shimmerInterval}s`,
                    }}
                  />
                </g>
              </svg>
            </motion.div>
          );
        })}

        {/* 3. Sparkles */}
        {sparkles.map((sp, idx) => {
          const sparkleAnim: any = reducedMotion || !tabActive
            ? { opacity: 0.05 }
            : {
                opacity: [0.03, 0.18, 0.03],
                scale: [0.9, 1.15, 0.9],
              };

          return (
            <motion.div
              key={`sparkle-${idx}`}
              className="absolute pointer-events-none select-none text-[var(--rose)]"
              style={{
                left: sp.left,
                top: sp.top,
                width: `${sp.size}px`,
                height: `${sp.size}px`,
                opacity: 0.05,
              }}
              animate={sparkleAnim}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: idx * 0.7,
              }}
            >
              {sp.type === "star" ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4z" />
                </svg>
              ) : (
                <div className="w-full h-full rounded-full bg-current" />
              )}
            </motion.div>
          );
        })}
      </div>

      <Navigation />

      {/* Main Container: stacked layered zIndex above background particles */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-6xl mx-auto w-full px-6 py-16 pb-36 pt-24 space-y-12"
        style={{ zIndex: 10 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ─── LEFT COLUMN (HERO) ─── */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left space-y-10">
            {/* Header Greeting & Us Portrait */}
            <div className="flex flex-row items-center justify-between w-full pb-4 border-b border-[var(--border)] gap-6">
              <div className="space-y-1 text-left">
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
              <Link href="/profile" className="flex-shrink-0 transition-transform hover:scale-[1.03] active:scale-[0.97]" title="Customize Us / Profile">
                <PairfectPortrait className="w-24 h-24 rounded-2xl shadow-sm border border-[var(--border)]" />
              </Link>
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
                className="py-3 px-10 text-xs font-mono uppercase tracking-widest text-white rounded-full shadow-sm cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
            <Link
              href="/moments"
              className="block p-6 rounded-[20px] border space-y-4 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md"
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
                  style={{ width: "95px", boxShadow: "0 4px 10px var(--shadow)" }}
                >
                  <div className="w-full h-16 bg-[var(--paper-deep)] rounded-sm overflow-hidden flex items-center justify-center">
                    <span className="text-xl">🌅</span>
                  </div>
                  <p className="font-handwriting text-[6px] text-center text-[var(--text-soft)] mt-2">Love</p>
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
            </Link>

            {/* Widget 2: Split Row (Gratitude Jar & Recent Activity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Gratitude Jar Card */}
              <Link
                href="/gratitude-jar"
                className="p-5 rounded-[20px] border flex flex-col items-center text-center justify-between space-y-3 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md"
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
              </Link>

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
                      <Link
                        key={act.id}
                        href={act.type === "letter" ? "/love-letter" : act.type === "moment" ? "/moments" : "/gratitude-jar"}
                        className="text-[10px] text-[var(--text-soft)] flex items-start gap-1.5 leading-tight hover:text-[var(--burgundy)] transition-colors cursor-pointer"
                      >
                        <span className="text-[var(--burgundy)]">✦</span>
                        <div>
                          <p className="text-[var(--text)] font-medium group-hover:text-[var(--burgundy)]">{act.text}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-[9px] font-mono text-[var(--text-soft)] italic">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Widget 3: Upcoming Anniversary */}
            <Link
              href="/settings"
              className="block p-6 rounded-[20px] border flex items-center justify-between gap-4 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md"
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
                  {anniversaryNotSet ? (
                    <p className="text-sm font-heading text-[var(--burgundy)] font-medium">Add your anniversary date →</p>
                  ) : (
                    <>
                      <h3 className="font-heading text-lg font-bold text-[var(--text)] leading-tight">
                        {anniversaryDaysToGo} days to go
                      </h3>
                      <p className="text-[10px] font-mono text-[var(--rose)]">{anniversaryDateFormatted}</p>
                    </>
                  )}
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* ─── FULL-WIDTH STATS CARD ROW AT THE BOTTOM ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[var(--border)]">
          {[
            { label: `${daysTogether} Days`, desc: "Together", icon: Calendar, href: "/checkin" },
            { label: `${lettersCount} Letters`, desc: "Sent & Sealed", icon: Mail, href: "/love-letter" },
            { label: `${momentsCount} Memories`, desc: "In Scrapbook", icon: ImageIcon, href: "/moments" },
            { label: `${gratitudeCount} Notes`, desc: "In Gratitude Jar", icon: Gift, href: "/gratitude-jar" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="p-4 rounded-[20px] border flex items-center gap-3 text-left cursor-pointer transition-all hover:translate-y-[-1px] hover:shadow-sm"
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
              </Link>
            );
          })}
        </div>

      </motion.main>
    </div>
  );
}
