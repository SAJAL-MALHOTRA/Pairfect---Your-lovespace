"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Camera, HelpCircle, Heart, Brain, MessageSquare,
  Scale, Tv, Gift, Mail, Timer, Music, BookOpen,
  Sparkles, ArrowRight, Check
} from "lucide-react";
import { motion } from "framer-motion";

interface RealExperienceItem {
  id: string;
  title: string;
  badge?: string;
  badgeType?: "most-played" | "new" | "ai" | "free" | "coop" | "ritual";
  desc: string;
  href: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
}

/* ─── ONLY 100% Real, Functional, Tested Pairfect Experiences ─── */
const REAL_EXPERIENCES: RealExperienceItem[] = [
  {
    id: "love-match",
    title: "Love Match",
    badge: "NEW",
    badgeType: "new",
    desc: "Answer the same questions at the same instant — then discover just how in sync you really are.",
    href: "/play/love-match",
    icon: Heart,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    accentBorder: "hover:border-purple-300",
  },
  {
    id: "know-me-quiz",
    title: "Know Me Quiz",
    badge: "★ MOST PLAYED",
    badgeType: "most-played",
    desc: "Lock in your answers privately, reveal them together, and see how well you really know each other — 14 question packs.",
    href: "/quiz",
    icon: HelpCircle,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    accentBorder: "hover:border-pink-300",
  },
  {
    id: "iq-duel",
    title: "IQ Duel",
    badge: "VERSUS",
    badgeType: "free",
    desc: "A fast-paced brain challenge for two. Test memory, speed, and logic in quick 1-on-1 rounds.",
    href: "/iq-duel",
    icon: Brain,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    accentBorder: "hover:border-blue-300",
  },
  {
    id: "couples-debate",
    title: "Couples Debate",
    badge: "AI JUDGE",
    badgeType: "ai",
    desc: "Pick a playful topic, plead your case on camera or text, and let the AI judge deliver a fair verdict.",
    href: "/vibe-judge",
    icon: Scale,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accentBorder: "hover:border-emerald-300",
  },
  {
    id: "riddle-night",
    title: "Riddle Night",
    badge: "CO-OP",
    badgeType: "coop",
    desc: "Team up against the clock. Crack mind-bending logic puzzles and team riddles together.",
    href: "/riddle",
    icon: HelpCircle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accentBorder: "hover:border-amber-300",
  },
  {
    id: "watch-together",
    title: "Watch Together",
    badge: "REALTIME",
    badgeType: "free",
    desc: "Synchronize YouTube videos in real-time with live floating emoji reactions and cinema tab sharing.",
    href: "/watch",
    icon: Tv,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    accentBorder: "hover:border-indigo-300",
  },
  {
    id: "gratitude-jar",
    title: "Gratitude Jar",
    badge: "DAILY RITUAL",
    badgeType: "ritual",
    desc: "Drop folded handwritten notes into a shared jar. Open and read them together on rainy days.",
    href: "/gratitude-jar",
    icon: Gift,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-300",
  },
  {
    id: "love-letters",
    title: "Love Letters",
    badge: "ENCRYPTED",
    badgeType: "ritual",
    desc: "Write letters sealed with digital wax. Schedule them to unseal together on future anniversaries.",
    href: "/love-letter",
    icon: Mail,
    iconBg: "bg-red-50",
    iconColor: "text-[var(--burgundy)]",
    accentBorder: "hover:border-[var(--burgundy)]/40",
  },
  {
    id: "focus-session",
    title: "Focus Session",
    badge: "CO-OP",
    badgeType: "coop",
    desc: "Work or study side-by-side with synchronized Pomodoro timers and cozy ambient soundscapes.",
    href: "/focus",
    icon: Timer,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    accentBorder: "hover:border-teal-300",
  },
  {
    id: "spotify-mixtape",
    title: "Handmade Mixtape",
    badge: "SPOTIFY",
    badgeType: "free",
    desc: "Design a physical vintage cassette tape with custom shells and stickers, and curate your shared soundtrack.",
    href: "/mixtape",
    icon: Music,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accentBorder: "hover:border-emerald-300",
  },
  {
    id: "stories-archive",
    title: "Stories & Archive",
    badge: "STORIES",
    badgeType: "ritual",
    desc: "Explore living relationship stories, community wisdom, and write your shared milestones.",
    href: "/stories",
    icon: BookOpen,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    accentBorder: "hover:border-violet-300",
  },
];

export default function GamesHubPage() {
  const { user, partner, profile } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const partnerName = partner?.display_name || "Partner";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors paper-grain">
      <Navigation />

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        
        {/* ── HEADER / INTRO BANNER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              PAIRFECT PLAYROOM
            </span>
            <h1 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)]">
              Things we can do <span className="text-[var(--burgundy)]">together.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-[var(--text)]">
                Playing with {partnerName}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            FEATURED EXPERIENCE CARD (TOP HORIZONTAL - EXACT FROM REF)
            ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 paper-grain"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-[var(--text)]">
                  Online Photobooth
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                  ALWAYS FREE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed max-w-2xl">
                The realtime 4-frame photo booth for two — a shared countdown fires the shot on both screens at once, so every frame holds both of you.
              </p>
            </div>
          </div>

          <Link
            href="/photo-booth"
            className="shrink-0 text-xs font-mono font-bold text-[var(--text)] hover:text-[var(--burgundy)] inline-flex items-center gap-1.5 group transition-colors px-4 py-2 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)]/40"
          >
            <span>Open the booth ▷</span>
          </Link>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════
            ALL GAMES & ACTIVITIES SECTION DIVIDER
            ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 pt-4">
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase whitespace-nowrap">
            ALL GAMES &amp; ACTIVITIES
          </span>
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
        </div>

        {/* ══════════════════════════════════════════════════════════
            3-COLUMN EXPERIENCE CARDS GRID (ALL REAL, WORKING EXPERIENCES)
            ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REAL_EXPERIENCES.map((exp, idx) => {
            const Icon = exp.icon;
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <Link
                  href={exp.href}
                  onMouseEnter={() => setHoveredCard(exp.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs transition-all flex flex-col justify-between text-left space-y-4 h-full min-h-[170px] group ${exp.accentBorder} hover:shadow-md hover:translate-y-[-2px]`}
                >
                  <div className="space-y-3">
                    {/* Category-Specific Icon Container */}
                    <div className={`w-9 h-9 rounded-xl ${exp.iconBg} border border-[var(--border)] flex items-center justify-center ${exp.iconColor} transition-transform group-hover:scale-110 duration-200 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Title + Pill Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors">
                        {exp.title}
                      </h3>
                      {exp.badge && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider border ${
                          exp.badgeType === "most-played"
                            ? "bg-pink-50 text-pink-600 border-pink-200"
                            : exp.badgeType === "new"
                            ? "bg-purple-50 text-purple-600 border-purple-200"
                            : exp.badgeType === "ai"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : exp.badgeType === "coop"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : exp.badgeType === "ritual"
                            ? "bg-rose-50 text-[var(--burgundy)] border-rose-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {exp.badge}
                        </span>
                      )}
                    </div>

                    {/* Short Emotional Description */}
                    <p className="text-xs text-[var(--text-soft)] leading-relaxed font-sans">
                      {exp.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
