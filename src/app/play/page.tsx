"use client";

import { useState } from "react";
import Navigation from "@/components/navigation";
import Link from "next/link";
import {
  HelpCircle,
  Brain,
  Gamepad2,
  Scale,
  Tv,
  Timer,
  Gift,
  Sparkles,
  Camera,
  Heart,
  Flame,
  ArrowRight,
  Bookmark,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayfulMoments } from "@/components/cozy-illustrations";

interface GameItem {
  id: string;
  href: string;
  title: string;
  desc: string;
  category: "bonding" | "ai" | "competitive" | "coop";
  badge?: string;
  badgeType?: "most-played" | "new" | "ai" | "free";
  icon: any;
  playersInfo: string;
  accent: string;
}

const GAMES: GameItem[] = [
  {
    id: "quiz",
    href: "/quiz",
    title: "Know Me Quiz",
    desc: "Lock in privately, reveal together, score your compatibility — 17 packs from cute to spicy.",
    category: "bonding",
    badge: "MOST PLAYED",
    badgeType: "most-played",
    icon: HelpCircle,
    playersInfo: "2 Players · 17 Packs",
    accent: "var(--burgundy)",
  },
  {
    id: "vibe-judge",
    href: "/vibe-judge",
    title: "Between the Lines",
    desc: "Argue your case or present evidence — an AI judge evaluates both arguments and crowns a fair winner.",
    category: "ai",
    badge: "AI POWERED",
    badgeType: "ai",
    icon: Scale,
    playersInfo: "2 Players · AI Judge",
    accent: "#2E7A60",
  },
  {
    id: "gratitude-jar",
    href: "/gratitude-jar",
    title: "Gratitude Jar",
    desc: "A living collection of handwritten appreciation notes to surprise your partner every day.",
    category: "bonding",
    badge: "DAILY RITUAL",
    badgeType: "new",
    icon: Gift,
    playersInfo: "2 Players · Daily",
    accent: "#9E4B38",
  },
  {
    id: "riddle",
    href: "/riddle",
    title: "Riddle Night",
    desc: "Crack mind-bending riddles together. Team up to decipher clues before time runs out.",
    category: "coop",
    badge: "CO-OP",
    badgeType: "new",
    icon: Brain,
    playersInfo: "Co-op · Unlimited",
    accent: "#6B4F8A",
  },
  {
    id: "iq-duel",
    href: "/iq-duel",
    title: "IQ Duel",
    desc: "A friendly intelligence challenge. Test memory, speed, and logic in quick 1-on-1 rounds.",
    category: "competitive",
    badge: "VERSUS",
    badgeType: "most-played",
    icon: Gamepad2,
    playersInfo: "1-on-1 · 5 Min",
    accent: "#2E6E9E",
  },
  {
    id: "watch",
    href: "/watch",
    title: "Watch Together",
    desc: "Sync and watch YouTube videos in real-time with synchronized playback and live reactions.",
    category: "bonding",
    badge: "REALTIME",
    badgeType: "free",
    icon: Tv,
    playersInfo: "Live Sync · Free",
    accent: "#8B5A3A",
  },
  {
    id: "focus",
    href: "/focus",
    title: "Focus Session",
    desc: "Work or study side-by-side with synchronized Pomodoro timers and cozy ambient audio.",
    category: "coop",
    badge: "PRODUCTIVITY",
    badgeType: "free",
    icon: Timer,
    playersInfo: "Shared Timer · Ambient",
    accent: "#5A6E2E",
  },
  {
    id: "moments",
    href: "/moments",
    title: "Memory Scrapbook",
    desc: "Curate your photo polaroids, romantic milestones, and pookie emoji memories in one place.",
    category: "bonding",
    badge: "SCRAPBOOK",
    badgeType: "new",
    icon: Bookmark,
    playersInfo: "Timeline · Unlimited",
    accent: "#A24B68",
  },
  {
    id: "love-letter",
    href: "/love-letter",
    title: "Love Letter Studio",
    desc: "Compose sealed wax-stamped love letters with GIPHY stickers, romantic prompts, and surprise delivery.",
    category: "bonding",
    badge: "ROMANTIC",
    badgeType: "most-played",
    icon: Heart,
    playersInfo: "Sealed · Wax Stamp",
    accent: "var(--burgundy)",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Activities", icon: Sparkles },
  { id: "bonding", label: "💖 Bonding", icon: Heart },
  { id: "ai", label: "🤖 AI Powered", icon: Scale },
  { id: "competitive", label: "⚡ Competitive", icon: Flame },
  { id: "coop", label: "🤝 Co-op", icon: Users },
];

export default function PlayLobbyPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredGames = GAMES.filter((game) => {
    if (activeTab === "all") return true;
    return game.category === activeTab;
  });

  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-16 pb-36 pt-24 space-y-10">
        
        {/* ─── HERO HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[var(--border)]"
        >
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-[var(--burgundy)] text-[10px] font-mono uppercase tracking-widest font-semibold">
              <Sparkles className="w-3 h-3" /> Connection Rituals & Games
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-[var(--text)] leading-tight">
              Our Playroom
            </h1>
            <p className="font-handwriting text-lg text-[var(--rose)] italic">
              Activities, quizzes, and games designed to bring us closer every day.
            </p>
          </div>

          <div className="flex-shrink-0">
            <PlayfulMoments className="w-36 h-36 rounded-2xl shadow-sm border border-[var(--border)]" />
          </div>
        </motion.div>

        {/* ─── FEATURED SPOTLIGHT BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 sm:p-8 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[var(--rose)]/10 blur-3xl pointer-events-none" />

          <div className="flex items-start gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-[var(--rose)]/20 border border-[var(--rose)]/40 text-[var(--burgundy)] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--burgundy)] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  SPOTLIGHT FEATURE
                </span>
                <span className="text-[10px] font-mono text-[var(--text-soft)] uppercase tracking-wider">
                  Always Free
                </span>
              </div>
              <h3 className="font-heading font-bold text-2xl text-[var(--text)] leading-tight">
                Online Photo Booth
              </h3>
              <p className="text-xs font-sans text-[var(--text-soft)] leading-relaxed">
                Take your own 4-frame photo strip, customize it with vintage filters & stickers, and save your memories.
              </p>
            </div>
          </div>

          <Link
            href="/quiz"
            className="w-full md:w-auto py-3 px-7 rounded-xl font-mono text-xs uppercase font-bold tracking-widest text-white bg-[var(--burgundy)] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap z-10"
          >
            Start Playroom <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* ─── CATEGORY FILTER TABS ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-sm"
                    : "bg-[var(--bg-secondary)] text-[var(--text-soft)] border-[var(--border)] hover:border-[var(--rose)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── 3-COLUMN RICH GAMES GRID ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredGames.map((game, i) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={game.href} className="block group h-full">
                    <div
                      className="p-6 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col justify-between h-full shadow-sm transition-all duration-300 group-hover:translate-y-[-3px] group-hover:shadow-md group-hover:border-[var(--rose)]/50 relative overflow-hidden"
                    >
                      {/* Top Bar: Icon + Badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            background: `${game.accent}15`,
                            border: `1px solid ${game.accent}30`,
                          }}
                        >
                          <Icon className="w-6 h-6" style={{ color: game.accent }} strokeWidth={1.9} />
                        </div>

                        {game.badge && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              game.badgeType === "most-played"
                                ? "bg-[var(--rose)]/20 text-[var(--burgundy)] border border-[var(--rose)]/40"
                                : game.badgeType === "ai"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-[var(--border)] text-[var(--text-soft)]"
                            }`}
                          >
                            {game.badge}
                          </span>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="space-y-2 flex-1">
                        <h3 className="font-heading font-bold text-xl text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors leading-tight">
                          {game.title}
                        </h3>
                        <p className="text-xs font-sans text-[var(--text-soft)] leading-relaxed line-clamp-3">
                          {game.desc}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 mt-5 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                        <span>{game.playersInfo}</span>
                        <span className="text-[var(--burgundy)] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Play <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
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

