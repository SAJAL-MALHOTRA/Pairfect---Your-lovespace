"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Camera, HelpCircle, Heart, Brain, MessageSquare,
  Scale, Flower2, Gift, Mail, Timer, Music, BookOpen,
  Sparkles, ArrowRight, Check, Disc, Radio, Clock, UserCheck, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type MoodCategory = "all" | "quick" | "romantic" | "debate" | "coop";

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
  moods: MoodCategory[];
  timeEstimate: string;
  soloPlayable: boolean;
}

const REAL_EXPERIENCES: RealExperienceItem[] = [
  {
    id: "love-match",
    title: "Love Match",
    badge: "NEW",
    badgeType: "new",
    desc: "Answer the same questions at the exact same instant, then see if your answers match in real time.",
    href: "/play/love-match",
    icon: Heart,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    accentBorder: "hover:border-purple-300",
    moods: ["quick", "debate"],
    timeEstimate: "3 min",
    soloPlayable: true,
  },
  {
    id: "roulette",
    title: "Pairfect Roulette",
    badge: "DATE DECIDER",
    badgeType: "new",
    desc: "Can't decide what to eat, watch, or do tonight? Spin the wheel and let fate settle it playfully.",
    href: "/roulette",
    icon: Disc,
    iconBg: "bg-rose-50",
    iconColor: "text-[var(--burgundy)]",
    accentBorder: "hover:border-rose-300",
    moods: ["quick", "coop"],
    timeEstimate: "1 min",
    soloPlayable: true,
  },
  {
    id: "photo-booth",
    title: "Online Photobooth",
    badge: "ALWAYS FREE",
    badgeType: "free",
    desc: "Realtime 4-frame photo strip for two: synchronized countdown snaps on both phones simultaneously.",
    href: "/photo-booth",
    icon: Camera,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-300",
    moods: ["quick", "romantic", "coop"],
    timeEstimate: "2 min",
    soloPlayable: true,
  },
  {
    id: "know-me-quiz",
    title: "Know Me Quiz",
    badge: "★ MOST PLAYED",
    badgeType: "most-played",
    desc: "Lock in answers privately, flip them simultaneously, and see who truly knows the other best.",
    href: "/quiz",
    icon: HelpCircle,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    accentBorder: "hover:border-pink-300",
    moods: ["quick", "debate"],
    timeEstimate: "5 min",
    soloPlayable: false,
  },
  {
    id: "iq-duel",
    title: "IQ Duel",
    badge: "VERSUS",
    badgeType: "free",
    desc: "A fast-paced brain duel for two. Test memory, reflex speed, and logic in quick head-to-head rounds.",
    href: "/iq-duel",
    icon: Brain,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    accentBorder: "hover:border-blue-300",
    moods: ["quick", "debate"],
    timeEstimate: "3 min",
    soloPlayable: false,
  },
  {
    id: "couples-debate",
    title: "Between the Lines",
    badge: "AI JUDGE",
    badgeType: "ai",
    desc: "Pick a playful debate topic, state your case, and let our objective AI referee deliver the verdict.",
    href: "/vibe-judge",
    icon: Scale,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accentBorder: "hover:border-emerald-300",
    moods: ["debate"],
    timeEstimate: "5-10 min",
    soloPlayable: false,
  },
  {
    id: "riddle-night",
    title: "Riddle Night",
    badge: "CO-OP",
    badgeType: "coop",
    desc: "Team up against the clock. Crack mind-bending lateral thinking puzzles and logic riddles together.",
    href: "/riddle",
    icon: Sparkles,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accentBorder: "hover:border-amber-300",
    moods: ["coop", "debate"],
    timeEstimate: "5 min",
    soloPlayable: true,
  },
  {
    id: "digital-bouquet",
    title: "Digital Bouquets",
    badge: "KEEPSAKE",
    badgeType: "new",
    desc: "Pick botanical stems, customize wrapping paper and ribbon, and write a keepsake note for your partner.",
    href: "/bouquet",
    icon: Flower2,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-300",
    moods: ["romantic"],
    timeEstimate: "3 min",
    soloPlayable: true,
  },
  {
    id: "gratitude-jar",
    title: "Gratitude Jar",
    badge: "DAILY RITUAL",
    badgeType: "ritual",
    desc: "Drop folded handwritten origami slips into your shared jar. Open and read notes together on rainy days.",
    href: "/gratitude-jar",
    icon: Gift,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-300",
    moods: ["romantic", "coop"],
    timeEstimate: "2 min",
    soloPlayable: true,
  },
  {
    id: "love-letters",
    title: "Love Letters",
    badge: "WAX SEALED",
    badgeType: "ritual",
    desc: "Compose stationary notes sealed with 3D wax. Unseal them immediately or schedule for future dates.",
    href: "/love-letter",
    icon: Mail,
    iconBg: "bg-red-50",
    iconColor: "text-[var(--burgundy)]",
    accentBorder: "hover:border-[var(--burgundy)]/40",
    moods: ["romantic"],
    timeEstimate: "5-10 min",
    soloPlayable: true,
  },
  {
    id: "whisper-radio",
    title: "Whisper Radio",
    badge: "VOICE NOTES",
    badgeType: "ritual",
    desc: "Broadcast audio notes on your private FM channel. Tune the vintage radio dial to hear your partner.",
    href: "/whisper",
    icon: Radio,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    accentBorder: "hover:border-teal-300",
    moods: ["romantic", "coop"],
    timeEstimate: "Flexible",
    soloPlayable: true,
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
    moods: ["coop"],
    timeEstimate: "25 min",
    soloPlayable: true,
  },
  {
    id: "spotify-mixtape",
    title: "Handmade Mixtape",
    badge: "SPOTIFY",
    badgeType: "free",
    desc: "Design a vintage cassette shell with personalized labels and curate your shared relationship soundtrack.",
    href: "/mixtape",
    icon: Music,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accentBorder: "hover:border-emerald-300",
    moods: ["romantic", "coop"],
    timeEstimate: "10 min",
    soloPlayable: true,
  },
  {
    id: "stories-archive",
    title: "Stories & Archive",
    badge: "STORIES",
    badgeType: "ritual",
    desc: "Explore living relationship journals, community insights, and document your shared history.",
    href: "/stories",
    icon: BookOpen,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    accentBorder: "hover:border-violet-300",
    moods: ["romantic", "debate"],
    timeEstimate: "Flexible",
    soloPlayable: true,
  },
];

const MOOD_FILTERS: { key: MoodCategory; label: string; icon: string }[] = [
  { key: "all", label: "All Activities", icon: "✨" },
  { key: "quick", label: "Quick & Playful", icon: "⚡" },
  { key: "romantic", label: "Deep & Romantic", icon: "💌" },
  { key: "debate", label: "Quizzes & Debates", icon: "💬" },
  { key: "coop", label: "Chill & Co-op", icon: "☕" },
];

export default function GamesHubPage() {
  const { user, partner, profile } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodCategory>("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const partnerName = partner?.display_name || "Partner";

  const filteredExperiences = selectedMood === "all"
    ? REAL_EXPERIENCES
    : REAL_EXPERIENCES.filter((exp) => exp.moods.includes(selectedMood));

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors paper-grain">
      <Navigation />

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        
        {/* Header Intro Banner */}
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

        {/* Featured Date Night Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Featured Card 1: Photobooth */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="p-6 rounded-3xl bg-white border border-[var(--border)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 paper-grain"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-sans font-bold text-[var(--text)]">
                    Online Photobooth
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                    ALWAYS FREE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Realtime 4-frame countdown strip. Snaps both phones at once so you are sharp in every shot.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60">
              <span className="text-[10px] font-mono text-[var(--text-soft)] flex items-center gap-1">
                <Clock className="w-3 h-3" /> 2 min session
              </span>
              <Link
                href="/photo-booth"
                className="text-xs font-mono font-bold text-[var(--text)] hover:text-[var(--burgundy)] inline-flex items-center gap-1 group transition-colors px-3 py-1.5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)]/40 cursor-pointer"
              >
                <span>Open booth ▷</span>
              </Link>
            </div>
          </motion.div>

          {/* Featured Card 2: Date Decider Roulette */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="p-6 rounded-3xl bg-white border border-[var(--border)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 paper-grain"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <Disc className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-sans font-bold text-[var(--text)]">
                    Roll a Date Night
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[var(--burgundy)] border border-rose-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                    DECIDER
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Dinner, Activity, Treat, Entertainment. Spin the wheel to decide tonight&apos;s date with zero back-and-forth.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60">
              <span className="text-[10px] font-mono text-[var(--text-soft)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Settle plans instantly
              </span>
              <Link
                href="/roulette"
                className="text-xs font-mono font-bold text-[var(--text)] hover:text-[var(--burgundy)] inline-flex items-center gap-1 group transition-colors px-3 py-1.5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)]/40 cursor-pointer"
              >
                <span>Spin the wheel ▷</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Interactive Mood Filter Bar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              FILTER BY MOOD
            </span>
            <span className="text-xs font-mono text-[var(--text-soft)]">
              {filteredExperiences.length} {filteredExperiences.length === 1 ? "activity" : "activities"}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MOOD_FILTERS.map((f) => {
              const count = f.key === "all"
                ? REAL_EXPERIENCES.length
                : REAL_EXPERIENCES.filter((exp) => exp.moods.includes(f.key)).length;
              const isSelected = selectedMood === f.key;

              return (
                <button
                  key={f.key}
                  onClick={() => setSelectedMood(f.key)}
                  className={`px-3.5 py-2 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--burgundy)] text-white font-bold shadow-xs border border-[var(--burgundy)]"
                      : "bg-white border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--rose)]"
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-[var(--paper-warm)] text-[var(--text-soft)]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Experience Grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredExperiences.map((exp) => {
              const Icon = exp.icon;
              return (
                <motion.div
                  layout
                  key={exp.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <Link
                    href={exp.href}
                    onMouseEnter={() => setHoveredCard(exp.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs transition-all flex flex-col justify-between text-left space-y-4 h-full min-h-[195px] group ${exp.accentBorder} hover:shadow-md hover:translate-y-[-2px] paper-grain`}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Icon + Badges */}
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl ${exp.iconBg} border border-[var(--border)] flex items-center justify-center ${exp.iconColor} transition-transform group-hover:scale-110 duration-200 shadow-xs`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
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
                      </div>

                      {/* Title */}
                      <h3 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors">
                        {exp.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-soft)] leading-relaxed font-sans line-clamp-2">
                        {exp.desc}
                      </p>
                    </div>

                    {/* Bottom Metadata & Launch Cue */}
                    <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exp.timeEstimate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {exp.soloPlayable ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Solo or 2P
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 text-rose-500" /> 2-Player
                            </>
                          )}
                        </span>
                      </div>

                      <span className="text-[var(--burgundy)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Play ▷
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}
