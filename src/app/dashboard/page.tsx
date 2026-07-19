"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { calculateStreak } from "@/lib/utils/streak";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday } from "date-fns";

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

// ── Time-of-day ambient system ──────────────────────────────────────────────
function getTimeAmbience() {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return { label: "Good morning,",  bg: "rgba(255, 235, 190, 0.22)", accent: "rgba(245, 200, 120, 0.15)" };
  if (h >= 9  && h < 12) return { label: "Good morning,",  bg: "rgba(255, 220, 160, 0.16)", accent: "rgba(240, 180, 90, 0.12)" };
  if (h >= 12 && h < 17) return { label: "Good afternoon,", bg: "rgba(255, 210, 180, 0.14)", accent: "rgba(230, 160, 120, 0.1)" };
  if (h >= 17 && h < 20) return { label: "Good evening,",  bg: "rgba(220, 140, 120, 0.16)", accent: "rgba(180, 80, 80, 0.1)" };
  return { label: "Still awake,",  bg: "rgba(100, 80, 140, 0.14)", accent: "rgba(80, 60, 120, 0.1)" };
}

// ── The dried botanical sprig ───────────────────────────────────────────────
function BotanicalSprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 150" className={className} fill="none" aria-hidden>
      <path d="M45 148 C45 118 43 88 46 62 C48 44 45 24 43 6" stroke="#C4A882" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M45 122 C35 112 24 109 16 100" stroke="#C4A882" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M45 98  C34 90 24 86 15 76"  stroke="#C4A882" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M45 74  C34 66 25 62 17 53"  stroke="#C4A882" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M45 112 C55 102 66 99 74 90" stroke="#C4A882" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M45 88  C56 80 66 76 75 66"  stroke="#C4A882" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M45 64  C56 56 66 52 74 43"  stroke="#C4A882" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="16" cy="100" r="2.4" fill="#C4A882" opacity="0.72" />
      <circle cx="15" cy="76"  r="2"   fill="#C4A882" opacity="0.66" />
      <circle cx="17" cy="53"  r="1.8" fill="#C4A882" opacity="0.6" />
      <circle cx="24" cy="109" r="1.6" fill="#D4B892" opacity="0.58" />
      <circle cx="74" cy="90"  r="2.4" fill="#C4A882" opacity="0.72" />
      <circle cx="75" cy="66"  r="2"   fill="#C4A882" opacity="0.66" />
      <circle cx="74" cy="43"  r="1.8" fill="#C4A882" opacity="0.6" />
      <circle cx="66" cy="99"  r="1.6" fill="#D4B892" opacity="0.58" />
      <circle cx="43" cy="6"   r="2.8" fill="#C4A882" opacity="0.76" />
      <circle cx="37" cy="1"   r="1.8" fill="#D4B892" opacity="0.64" />
      <circle cx="49" cy="0"   r="1.8" fill="#C4A882" opacity="0.64" />
      <circle cx="43" cy="-4"  r="1.4" fill="#C4A882" opacity="0.52" />
    </svg>
  );
}

// ── The wax seal ────────────────────────────────────────────────────────────
function WaxSeal({ size = 64 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 56 56"
      aria-hidden
      animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 4px 12px rgba(128,32,48,0.35))", "drop-shadow(0 6px 22px rgba(128,32,48,0.52))", "drop-shadow(0 4px 12px rgba(128,32,48,0.35))"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <circle cx="28" cy="28" r="26" fill="var(--seal-red)" />
      <circle cx="28" cy="28" r="21.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      {/* Stylized P monogram */}
      <path d="M22 20 L22 36 M22 20 L28 20 C31.3 20 33 21.6 33 24 C33 26.4 31.3 28 28 28 L22 28" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

// ── The physical envelope — the HERO ───────────────────────────────────────
function EnvelopeHero({ hasUnread, toName }: { hasUnread: boolean; toName: string }) {
  return (
    <motion.div
      className="relative select-none"
      style={{ width: "clamp(280px, 80vw, 400px)" }}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      {/* Botanical — overlapping the top-right corner of the envelope */}
      <BotanicalSprig className="absolute -top-12 -right-4 w-16 h-24 opacity-80 z-20 pointer-events-none rotate-[10deg]" />

      {/* The envelope body */}
      <motion.div
        className="relative rounded-2xl overflow-hidden paper-grain"
        style={{
          background: "linear-gradient(160deg, #F8EED8 0%, #EDE0C4 55%, #E5D4B0 100%)",
          boxShadow: "0 32px 80px -12px rgba(60,38,18,0.28), 0 4px 16px rgba(60,38,18,0.12), 0 1px 0 rgba(255,255,255,0.5) inset",
          aspectRatio: "1.42 / 1",
        }}
        whileHover={{ y: -4, boxShadow: "0 40px 100px -12px rgba(60,38,18,0.32), 0 6px 20px rgba(60,38,18,0.14), 0 1px 0 rgba(255,255,255,0.5) inset" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Envelope fold SVG */}
        <svg viewBox="0 0 400 282" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" fill="none">
          {/* Top flap */}
          <path d="M0,0 L200,130 L400,0" fill="rgba(200,175,135,0.18)" stroke="rgba(170,140,95,0.3)" strokeWidth="1.2" />
          {/* Bottom folds */}
          <path d="M0,282 L130,155" stroke="rgba(170,140,95,0.22)" strokeWidth="1" />
          <path d="M400,282 L270,155" stroke="rgba(170,140,95,0.22)" strokeWidth="1" />
        </svg>

        {/* Unread pulse indicator */}
        {hasUnread && (
          <motion.div
            className="absolute top-3 right-3 z-10 w-2.5 h-2.5 rounded-full bg-[#802030]"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* The wax seal — the emotional center */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <WaxSeal size={68} />
        </div>

        {/* Recipient address — handwritten */}
        <div className="absolute bottom-5 left-5 z-10 space-y-0.5">
          <p className="text-[8px] font-mono uppercase tracking-widest text-[#9A876A]">To</p>
          <p className="font-handwriting text-base text-[#4A3A28] font-semibold leading-tight">{toName}</p>
        </div>

        {/* Postage mark suggestion — decorative, top-right */}
        <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded border border-[#C4A882]/50 flex items-center justify-center opacity-40">
          <div className="text-[7px] font-mono text-[#9A876A] text-center leading-tight">PAIR<br/>FECT</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const [streak, setStreak]         = useState(0);
  const [lettersCount, setLettersCount] = useState(0);
  const [momentsCount, setMomentsCount] = useState(0);
  const [hasUnread, setHasUnread]   = useState(false);
  const [fetching, setFetching]     = useState(true);
  const supabase = createClient();
  const ambience = getTimeAmbience();

  useEffect(() => {
    if (!pair || loading) return;
    (async () => {
      try {
        const [moodRes, letRes, momRes] = await Promise.all([
          supabase.from("mood_logs").select("*").eq("pair_id", pair.id).limit(120),
          supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
          supabase.from("shared_moments").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
        ]);

        if (moodRes.data) setStreak(calculateStreak(moodRes.data, pair.user_a_id, pair.user_b_id));
        if (letRes.count !== null) setLettersCount(letRes.count);
        if (momRes.count !== null) setMomentsCount(momRes.count);

        // Check for unread letters
        const { data: letters } = await supabase
          .from("love_letters")
          .select("sender_id, is_opened")
          .eq("pair_id", pair.id)
          .order("sent_at", { ascending: false })
          .limit(10);

        const unread = (letters || []).some((l: any) => l.sender_id !== user?.id && !l.is_opened);
        setHasUnread(unread);
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    })();
  }, [pair, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Navigation />
        <WaxSeal size={40} />
      </div>
    );
  }

  const daysTogether = pair?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pair.created_at).getTime()) / 86400000) + 1)
    : 1;

  const headline = hasUnread
    ? "A letter is waiting for you."
    : "What happened between us today?";

  const ctaLabel = hasUnread ? "Unseal Letter" : "Write a Keepsake";
  const ctaHref  = hasUnread ? "/love-letter"  : "/love-letter?write=true";

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center overflow-hidden" style={{ background: "var(--background)" }}>
      {/* ── Ambient atmosphere — shifts with time of day ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 20% 15%, ${ambience.bg} 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 85%, ${ambience.accent} 0%, transparent 55%)`,
        }} />
      </div>

      {/* ── Ambient dust motes ── */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none fixed rounded-full"
          style={{
            width: `${2 + (i % 2)}px`,
            height: `${2 + (i % 2)}px`,
            left: `${18 + i * 14}%`,
            bottom: `${15 + (i % 3) * 18}%`,
            background: "#C4A882",
          }}
          animate={{ y: [-60, -160], opacity: [0, 0.5, 0] }}
          transition={{ duration: 8 + i * 2, delay: i * 1.5, repeat: Infinity, ease: "linear" }}
        />
      ))}

      <Navigation />

      {/* ── Main content — everything in service of the envelope ── */}
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 text-center space-y-10 pb-28 pt-16">

        {/* Greeting — barely there, sets context */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.05 }}
          className="space-y-0.5"
        >
          <p className="font-handwriting text-base text-[var(--ink-mid)]">
            {ambience.label} {profile?.display_name || "love"} ♡
          </p>
        </motion.div>

        {/* ── THE HERO ── */}
        <Link href={ctaHref} aria-label={ctaLabel} className="block cursor-pointer">
          <EnvelopeHero hasUnread={hasUnread} toName={partner?.display_name || "My Love"} />
        </Link>

        {/* Headline — reads the emotional state */}
        <motion.div
          className="space-y-3 max-w-xs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        >
          <h1 className="font-display italic font-black text-3xl md:text-[2.4rem] text-[var(--ink-dark)] leading-[1.15] tracking-tight">
            {headline}
          </h1>
        </motion.div>

        {/* The single CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Link
            href={ctaHref}
            className="btn-primary px-10 py-3.5 text-[10px] tracking-widest uppercase"
          >
            {ctaLabel}
          </Link>
        </motion.div>

        {/* Three quiet stats — subordinate, never competing */}
        <motion.div
          className="flex items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          {[
            { value: daysTogether, label: "Days" },
            { value: lettersCount, label: "Letters" },
            { value: momentsCount, label: "Memories" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-5 bg-[var(--border-mid)]" />}
              <div className="text-center">
                <p className="font-display font-black text-2xl text-[var(--ink-dark)]">{stat.value}</p>
                <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
