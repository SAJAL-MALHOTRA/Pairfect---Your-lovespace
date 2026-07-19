"use client";

import Navigation from "@/components/navigation";
import Link from "next/link";
import { 
  HelpCircle, Brain, Gamepad2, Scale, Tv, Timer 
} from "lucide-react";

export default function PlayLobbyPage() {
  const gamesList = [
    {
      href: "/riddle",
      title: "Riddle Night",
      desc: "Crack mind-bending riddles together with live timers.",
      icon: HelpCircle,
      tag: "Cooperative"
    },
    {
      href: "/iq-duel",
      title: "IQ Duel",
      desc: "Challenge each other in a friendly IQ test check.",
      icon: Brain,
      tag: "Competitive"
    },
    {
      href: "/quiz",
      title: "Vibe Quiz",
      desc: "Answer customized quiz packs and compare compatibility.",
      icon: Gamepad2,
      tag: "Bonding"
    },
    {
      href: "/vibe-judge",
      title: "Between the Lines",
      desc: "Settle relationship disputes playfully using Gemini AI.",
      icon: Scale,
      tag: "AI Judge"
    },
    {
      href: "/watch",
      title: "Watch Together",
      desc: "Sync and watch YouTube videos together in real-time.",
      icon: Tv,
      tag: "Entertainment"
    },
    {
      href: "/focus",
      title: "Focus Session",
      desc: "Work or study together with synchronized Pomodoro timers.",
      icon: Timer,
      tag: "Productivity"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-start space-y-12 animate-fade-in select-none">
        
        {/* Page Header */}
        <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
            Connection rituals
          </span>
          <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mt-1">
            Our Playroom
          </h1>
          <p className="text-xs text-[#7C7267] mt-1">
            Spend meaningful digital time together with interactive duels and synchronized rituals.
          </p>
        </div>

        {/* Spacious Flat Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {gamesList.map((game) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.href}
                href={game.href}
                className="group rounded-2xl border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] p-6 hover:scale-[1.01] hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer"
              >
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FCFBF9] dark:bg-[#1C1713]/40 text-[#802030] dark:text-rose-400">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
                      {game.tag}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-heading italic text-lg font-bold text-[#2E2A25] dark:text-[#E8E2D5] group-hover:text-[#802030] transition-colors leading-tight">
                      {game.title}
                    </h3>
                    <p className="text-xs text-[#7C7267] leading-relaxed line-clamp-2">
                      {game.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end text-[10px] font-mono font-bold text-[#8A7B6E] uppercase group-hover:underline pt-2">
                  <span>Enter ▷</span>
                </div>
              </Link>
            );
          })}
        </div>

      </main>
    </div>
  );
}
