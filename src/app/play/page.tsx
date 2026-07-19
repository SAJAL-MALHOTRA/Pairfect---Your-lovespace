"use client";

import Navigation from "@/components/navigation";
import Link from "next/link";
import { HelpCircle, Brain, Gamepad2, Scale, Tv, Timer, Gift } from "lucide-react";
import { motion } from "framer-motion";

const GAMES = [
  { href: "/gratitude-jar", title: "Gratitude Jar",     desc: "A living collection of handwritten appreciation.", icon: Gift, tag: "Bonding", accent: "#802030" },
  { href: "/riddle",     title: "Riddle Night",        desc: "Crack mind-bending riddles together.", icon: HelpCircle, tag: "Cooperative",   accent: "#6B4F8A" },
  { href: "/iq-duel",   title: "IQ Duel",              desc: "A friendly intelligence challenge.",   icon: Brain,       tag: "Competitive",   accent: "#2E6E9E" },
  { href: "/quiz",      title: "Vibe Quiz",             desc: "Compare compatibility question by question.", icon: Gamepad2, tag: "Bonding",  accent: "#8A5A3A" },
  { href: "/vibe-judge",title: "Between the Lines",     desc: "Settle disputes with an AI judge.",   icon: Scale,       tag: "AI Judge",     accent: "#2E7A60" },
  { href: "/watch",     title: "Watch Together",        desc: "Sync and watch YouTube in real-time.", icon: Tv,         tag: "Entertainment", accent: "#8B5A3A" },
  { href: "/focus",     title: "Focus Session",         desc: "Work together with Pomodoro timers.", icon: Timer,       tag: "Productivity",  accent: "#5A6E2E" },
];

export default function PlayLobbyPage() {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />
      <main className="max-w-xl mx-auto px-5 py-16 pb-36">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Connection rituals</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">Our Playroom</h1>
          <p className="font-handwriting text-sm text-[var(--ink-mid)] mt-2">Rituals that bring us closer.</p>
        </motion.div>

        {/* THE HERO: the games */}
        <div className="space-y-2.5">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div key={game.href}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}>
                <Link href={game.href} className="block group">
                  <motion.div
                    className="flex items-center gap-5 px-5 py-5 rounded-2xl border"
                    style={{ background: "var(--card-bg)", borderColor: "var(--border-mid)" }}
                    whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(60,40,20,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${game.accent}12`, border: `1px solid ${game.accent}20` }}>
                      <Icon className="w-[19px] h-[19px]" style={{ color: game.accent }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading italic font-bold text-base text-[var(--ink-dark)] leading-tight">{game.title}</p>
                      <p className="text-xs text-[var(--ink-mid)] mt-0.5 leading-relaxed">{game.desc}</p>
                    </div>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] flex-shrink-0 hidden sm:block">{game.tag}</span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
