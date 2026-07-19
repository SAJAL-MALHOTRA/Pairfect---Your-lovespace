"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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

// ── The Dried Botanical Sprig behind the envelope ──
function BotanicalFlower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} fill="none" aria-hidden="true">
      {/* Delicate organic stems with oval seeds */}
      <path d="M30 170 Q48 135 55 90 T70 20" stroke="#C4A882" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M42 120 Q30 110 24 102" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      <path d="M50 95 Q65 85 70 78" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      <path d="M58 65 Q45 55 38 48" stroke="#C4A882" strokeWidth="1.0" strokeLinecap="round" />
      
      {/* Dried seed oval heads */}
      <ellipse cx="24" cy="102" rx="4.5" ry="3" transform="rotate(-30 24 102)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="70" cy="78" rx="4.5" ry="3" transform="rotate(30 70 78)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="38" cy="48" rx="4" ry="2.5" transform="rotate(-20 38 48)" fill="#D4B892" opacity="0.75" />
      <ellipse cx="70" cy="20" rx="5" ry="3.5" transform="rotate(15 70 20)" fill="#D4B892" opacity="0.75" />
      
      {/* Side sprig */}
      <path d="M34 145 Q20 135 12 128" stroke="#C4A882" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="12" cy="128" rx="3.5" ry="2" fill="#D4B892" opacity="0.7" />
    </svg>
  );
}

// ── Sparkle overlay component ──
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

// ── Wax Seal on the envelope fold ──
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
      {/* Inner texture rim */}
      <div className="w-[50px] h-[50px] rounded-full border border-white/15 flex items-center justify-center">
        <span className="font-heading italic text-2xl text-white/80 font-bold select-none">{letter}</span>
      </div>
    </motion.div>
  );
}

// ── Clean envelope illustration component ──
function HomeEnvelope({ partnerName }: { partnerName: string }) {
  const monogram = partnerName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="relative select-none" style={{ width: "380px", height: "260px" }}>
      {/* Dried flower branch behind the envelope, bleeding from bottom-left */}
      <BotanicalFlower className="absolute -bottom-10 -left-12 w-28 h-40 opacity-75 z-0 pointer-events-none" />

      {/* Sparkles around envelope */}
      <Sparkle className="absolute -top-6 left-12 w-5 h-5 z-10" delay={0} />
      <Sparkle className="absolute bottom-10 -right-6 w-4 h-4 z-10" delay={1.2} />
      <Sparkle className="absolute -bottom-6 left-28 w-4 h-4 z-10" delay={2.4} />

      {/* The physical envelope body */}
      <div
        className="relative w-full h-full rounded-2xl border overflow-hidden z-10"
        style={{
          backgroundColor: "#F1E3C9",
          borderColor: "var(--border)",
          boxShadow: "0 18px 40px var(--shadow)",
        }}
      >
        {/* Postmark stamp in the top-right corner */}
        <div className="absolute top-4 right-4 opacity-15 pointer-events-none">
          <svg width="60" height="60" viewBox="0 0 64 64" fill="none" stroke="var(--burgundy)" strokeWidth="1.2">
            <circle cx="32" cy="32" r="28" strokeDasharray="3 3" />
            <circle cx="32" cy="32" r="22" />
            <text x="50%" y="42%" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-sans)" letterSpacing="1">KEEPSAKE</text>
            <text x="50%" y="62%" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-sans)" letterSpacing="1">PAIRFECT</text>
          </svg>
        </div>

        {/* Seams/folds */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 380 260" fill="none">
          {/* Top flap seams */}
          <path d="M 0 0 L 190 135 L 380 0" stroke="rgba(142, 43, 69, 0.16)" strokeWidth="1.5" />
          {/* Bottom folds */}
          <path d="M 0 260 L 135 125" stroke="rgba(142, 43, 69, 0.12)" strokeWidth="1" />
          <path d="M 380 260 L 245 125" stroke="rgba(142, 43, 69, 0.12)" strokeWidth="1" />
        </svg>

        {/* Wax seal on the seam */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <WaxSeal letter={monogram} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const [lettersCount, setLettersCount] = useState(0);
  const [partnerFeeling, setPartnerFeeling] = useState("feeling peaceful");
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!pair || loading) return;
    (async () => {
      try {
        // Query database statistics
        const [letRes, moodRes] = await Promise.all([
          supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase
            .from("mood_logs")
            .select("mood")
            .eq("pair_id", pair.id)
            .eq("user_id", partner?.id || "")
            .order("created_at", { ascending: false })
            .limit(1)
        ]);

        if (letRes.count !== null) setLettersCount(letRes.count);
        if (moodRes.data && moodRes.data.length > 0) {
          setPartnerFeeling(`feeling ${moodRes.data[0].mood}`);
        } else {
          setPartnerFeeling("feeling peaceful");
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

  // Calculate days together
  const daysTogether = pair?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pair.created_at).getTime()) / 86400000) + 1)
    : 1;

  // Determine time of day greeting
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
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-x-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Navigation />

      {/* Gentle fade-in container */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center flex-1 w-full max-w-lg px-6 text-center space-y-12 pb-32 pt-24"
      >
        {/* Greetings */}
        <div className="space-y-1">
          <p className="font-handwriting text-base text-[var(--rose)] italic">
            {greetingLine} <span className="font-sans text-[11px] not-italic ml-0.5">♥</span>
          </p>
          <h2 className="font-heading font-semibold text-[36px] text-[var(--text)] leading-tight">
            {profile?.display_name || "Love"}
          </h2>
          <p className="text-[13px] text-[var(--text-soft)] font-mono tracking-wide">
            {daysTogether} days together ♥
          </p>
        </div>

        {/* Center envelope illustration wrapper */}
        <div className="flex justify-center py-4">
          <HomeEnvelope partnerName={recipientName} />
        </div>

        {/* Caption & Actions */}
        <div className="space-y-6 flex flex-col items-center w-full">
          <p className="font-heading text-xl text-[var(--text)] italic leading-tight">
            A letter is waiting for you.
          </p>

          <Link
            href="/love-letter"
            className="py-3 px-8 text-xs font-mono uppercase tracking-widest text-[#F8F3EE] rounded-full shadow-sm cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: "var(--burgundy)",
              boxShadow: "0 4px 12px rgba(142, 43, 69, 0.22)",
            }}
          >
            Open Letter →
          </Link>

          {/* Status Line */}
          <div className="pt-2">
            <p className="text-[13px] text-[var(--text-soft)] font-sans tracking-wide">
              <span className="text-[var(--burgundy)] font-semibold">{daysTogether}</span> days together ·{" "}
              <span className="text-[var(--burgundy)] font-semibold">{lettersCount}</span> letters ·{" "}
              {partnerFeeling}
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
