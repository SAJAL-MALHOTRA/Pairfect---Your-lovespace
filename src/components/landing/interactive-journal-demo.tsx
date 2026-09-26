"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Check, Sparkles, BookOpen, RotateCcw } from "lucide-react";

interface JournalPrompt {
  id: string;
  prompt: string;
  author: string;
  text: string;
  date: string;
}

const PROMPTS: JournalPrompt[] = [
  {
    id: "pancakes",
    prompt: "What made today feel like us?",
    author: "Alex",
    text: "You made pancakes that looked like amoebas, but we ate every single bite on the living room floor listening to that Japanese jazz record while the rain tapped on the window glass.",
    date: "Wednesday, Sep 16",
  },
  {
    id: "silence",
    prompt: "A quiet moment together this week that you loved:",
    author: "Mia",
    text: "Sitting next to each other reading on Sunday afternoon without speaking for two hours, just resting our feet together under the knitted blanket.",
    date: "Sunday, Sep 20",
  },
];

export default function InteractiveJournalDemo() {
  const [activePrompt, setActivePrompt] = useState<JournalPrompt>(PROMPTS[0]);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Typewriter effect
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    setIsSaved(false);

    let idx = 0;
    const fullText = activePrompt.text;
    const interval = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setIsSaved(true);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [activePrompt]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Ruled Paper Journal Container */}
      <div
        className="relative rounded-[32px] border border-[#E4D8CB] bg-[#FFFDF8] p-6 sm:p-9 shadow-xl overflow-hidden select-none min-h-[460px] flex flex-col justify-between"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%), linear-gradient(transparent calc(32px - 1px), rgba(180, 150, 130, 0.22) calc(32px - 1px), rgba(180, 150, 130, 0.22) 32px, transparent 32px)",
          backgroundSize: "100%, 100% 32px",
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        {/* Washi tape on upper right corner */}
        <div
          className="absolute -top-3 right-8 w-20 h-6 pointer-events-none rounded-2xs"
          style={{
            background: "rgba(142, 43, 69, 0.18)",
            transform: "rotate(-2deg)",
          }}
        />

        {/* Top Header metadata */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FAF5EC] text-[#8E2B45]">
              <PenTool className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E8C85] font-semibold">
              Daily Living Journal · {activePrompt.date}
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#8E2B45] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 font-bold">
            Private Ruled Stationery
          </span>
        </div>

        {/* Prompt Card banner */}
        <div className="my-3 p-3.5 rounded-2xl bg-[#FAF5EC]/90 border border-[#E4D8CB] flex items-start gap-2.5">
          <span className="text-base mt-0.5">💭</span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E8C85] block">
              Today&apos;s Couple Prompt
            </span>
            <p className="font-display italic text-sm sm:text-base font-bold text-[#2C1E1A]">
              &ldquo;{activePrompt.prompt}&rdquo;
            </p>
          </div>
        </div>

        {/* Writing Body with natural ruled line height */}
        <div className="flex-1 py-2">
          <div
            className="font-handwriting text-lg sm:text-xl text-[#2C1E1A] leading-[32px] tracking-wide"
            style={{ minHeight: "128px" }}
          >
            <span>{displayedText}</span>
            {isTyping && (
              <span className="inline-block w-2 h-5 bg-[#8E2B45] ml-1 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Bottom Status & Prompt Toggle */}
        <div className="pt-3 border-t border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePrompt(p)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono transition-colors cursor-pointer ${
                  activePrompt.id === p.id
                    ? "bg-[#8E2B45] text-white shadow-2xs"
                    : "bg-[#FAF5EC] text-[#6E5D57] hover:bg-stone-200/60"
                }`}
              >
                {p.author}&apos;s entry
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#6E5D57] font-mono">
            {isSaved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Preserved in Relationship Archive
              </span>
            ) : (
              <span className="text-[#9E8C85] italic">Writing quietly...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
