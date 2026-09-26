"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Check, Flame, RotateCw } from "lucide-react";

interface RitualQuestion {
  id: string;
  game: string;
  question: string;
  optionA: { id: "a"; text: string; emoji: string };
  optionB: { id: "b"; text: string; emoji: string };
  partnerChoice: "a" | "b";
  matchMessage: string;
}

const RITUALS: RitualQuestion[] = [
  {
    id: "wyr",
    game: "Would You Rather · Date Night",
    question: "If we had an unplanned long weekend together starting right now:",
    optionA: {
      id: "a",
      text: "Zero phones in a secluded wooden cabin with hot cocoa",
      emoji: "🌲",
    },
    optionB: {
      id: "b",
      text: "Lost in a bustling foreign night market until 4 AM",
      emoji: "🏮",
    },
    partnerChoice: "a",
    matchMessage: "100% In Sync! Both choosing the cozy cabin escape.",
  },
  {
    id: "spark",
    game: "Daily Spark · Quick Sync",
    question: "Which little memory of ours always makes you smile first?",
    optionA: {
      id: "a",
      text: "Getting completely drenched running across the bridge",
      emoji: "🌧️",
    },
    optionB: {
      id: "b",
      text: "The burned dinner we ended up laughing about on the floor",
      emoji: "🍕",
    },
    partnerChoice: "b",
    matchMessage: "Alex chose the burned dinner! You both treasure the messy moments.",
  },
];

export default function InteractiveRitualsDemo() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userChoice, setUserChoice] = useState<"a" | "b" | null>(null);
  const [revealed, setRevealed] = useState(false);

  const current = RITUALS[currentIdx];

  const handleSelect = (choice: "a" | "b") => {
    if (userChoice) return;
    setUserChoice(choice);
    setTimeout(() => {
      setRevealed(true);
    }, 450);
  };

  const handleNext = () => {
    setUserChoice(null);
    setRevealed(false);
    setCurrentIdx((prev) => (prev + 1) % RITUALS.length);
  };

  const isMatch = userChoice === current.partnerChoice;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Interactive Card */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-9 shadow-xl overflow-hidden select-none min-h-[440px] flex flex-col justify-between"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        {/* Game Badge */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#FAF5EC] text-[#8E2B45]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold">
              {current.game}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6E5D57]">
            <Flame className="w-3 h-3 text-[#8E2B45] fill-current" />
            <span>Streak +1</span>
          </div>
        </div>

        {/* Question Heading */}
        <div className="py-4 text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#9E8C85]">
            Pick your instinct:
          </span>
          <h3 className="font-display italic text-xl sm:text-2xl font-bold text-[#2C1E1A] leading-snug max-w-md mx-auto">
            &ldquo;{current.question}&rdquo;
          </h3>
        </div>

        {/* Interactive Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
          {[current.optionA, current.optionB].map((opt) => {
            const isUserPick = userChoice === opt.id;
            const isPartnerPick = revealed && current.partnerChoice === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                  isUserPick
                    ? "bg-white border-[#8E2B45] shadow-md ring-2 ring-[#8E2B45]/20 scale-[1.02]"
                    : "bg-[#FCF9F5] border-[#E8DFD5] hover:border-[#8E2B45]/50 hover:bg-white"
                }`}
              >
                <div className="text-2xl mb-2">{opt.emoji}</div>
                <p className="text-xs font-semibold text-[#2C1E1A] leading-relaxed">
                  {opt.text}
                </p>

                {/* Badges for partner reveal */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {isUserPick && (
                    <span className="px-2 py-0.5 rounded-full bg-[#8E2B45] text-white font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Your choice
                    </span>
                  )}
                  {isPartnerPick && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current text-emerald-600" /> Alex&apos;s choice
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Match Result Banner & Next Button */}
        <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-xs">
          <div>
            {revealed ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-mono font-bold text-[#8E2B45] flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{current.matchMessage}</span>
              </motion.div>
            ) : (
              <span className="text-[11px] text-[#9E8C85] font-mono">
                Tap an option to lock in your answer
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD5] text-[11px] font-mono text-[#6E5D57] hover:text-[#2C1E1A] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <RotateCw className="w-3 h-3" />
            <span>Next Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}
