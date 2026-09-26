"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, RotateCcw, Check, Lock, Send } from "lucide-react";

export default function InteractiveLetterDemo() {
  const [phase, setPhase] = useState<"sealed" | "opening" | "open">("sealed");
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const handleCrackSeal = () => {
    if (phase !== "sealed") return;
    setPhase("opening");
    setTimeout(() => {
      setPhase("open");
    }, 700);
  };

  const handleReset = () => {
    setPhase("sealed");
    setSelectedReaction(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Interactive Frame */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-10 shadow-xl overflow-hidden min-h-[460px] flex flex-col justify-center items-center select-none"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        <AnimatePresence mode="wait">
          {/* PHASE 1: UNOPENED PHYSICAL ENVELOPE */}
          {phase === "sealed" && (
            <motion.div
              key="envelope-sealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md flex flex-col items-center space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#9E8C85]">
                  Incoming Parchment
                </span>
                <p className="text-xs text-[#6E5D57]">Tap the burgundy wax seal to break and open</p>
              </div>

              {/* Physical Envelope Card */}
              <div
                onClick={handleCrackSeal}
                className="relative w-full rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] border border-[#E4D8CB] paper-grain shadow-lg"
                style={{
                  background: "linear-gradient(160deg, #F8EED8, #EDE0C4)",
                  aspectRatio: "1.45 / 1",
                  boxShadow: "0 20px 50px rgba(60, 38, 18, 0.18)",
                }}
              >
                {/* Envelope Fold lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
                  <path
                    d="M 0 0 L 50% 60% L 100% 0"
                    stroke="rgba(196,168,130,0.35)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 0 100% L 40% 50%"
                    stroke="rgba(196,168,130,0.25)"
                    strokeWidth="1"
                  />
                  <path
                    d="M 100% 100% L 60% 50%"
                    stroke="rgba(196,168,130,0.25)"
                    strokeWidth="1"
                  />
                </svg>

                {/* To Address */}
                <div className="absolute top-5 left-6 z-10 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#9E8C85]">
                    To
                  </span>
                  <p className="font-handwriting text-xl font-bold text-[#2C1E1A]">Mia</p>
                </div>

                {/* Center Wax Seal */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-xl relative"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, #A83250 0%, #8E2B45 60%, #63192C 100%)",
                      boxShadow: "0 8px 24px rgba(142, 43, 69, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white/90 fill-white/80" />
                    </div>

                    {/* Subtle pulse ring */}
                    <span className="absolute -inset-1 rounded-full border border-[#8E2B45]/40 animate-ping pointer-events-none" />
                  </motion.div>
                </div>

                {/* From Address */}
                <div className="absolute bottom-5 right-6 z-10 text-right space-y-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#9E8C85]">
                    From
                  </span>
                  <p className="font-handwriting text-lg font-bold text-[#2C1E1A]">Alex</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs text-[#8E2B45] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Click the wax seal</span>
              </span>
            </motion.div>
          )}

          {/* PHASE 2: UNSEALING TRANSITION */}
          {phase === "opening" && (
            <motion.div
              key="envelope-opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-3 py-16"
            >
              <div className="w-12 h-12 rounded-full border border-[#E8DFD5] flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-[#8E2B45]"
                />
              </div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#6E5D57]">
                Unsealing handwritten letter...
              </p>
            </motion.div>
          )}

          {/* PHASE 3: OPEN LETTER REVEAL */}
          {phase === "open" && (
            <motion.div
              key="letter-open"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg space-y-4"
            >
              {/* The Paper Itself */}
              <div
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E4D8CB] paper-grain shadow-lg space-y-4"
                style={{
                  background: "linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%)",
                  backgroundImage:
                    "linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%), linear-gradient(transparent calc(30px - 1px), rgba(196,168,130,0.22) calc(30px - 1px), rgba(196,168,130,0.22) 30px, transparent 30px)",
                  backgroundSize: "100%, 100% 30px",
                  boxShadow: "0 16px 48px -8px rgba(60, 40, 20, 0.14)",
                }}
              >
                {/* Washi tape strip */}
                <div
                  className="absolute -top-3 right-8 w-20 h-6 pointer-events-none rounded-2xs"
                  style={{
                    background: "rgba(211, 140, 162, 0.3)",
                    transform: "rotate(-2deg)",
                  }}
                />

                <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-[10px] font-mono text-[#9E8C85]">
                  <span>Sealed July 18, 2026 · 11:24 PM</span>
                  <span className="flex items-center gap-1 text-[#8E2B45] font-semibold">
                    <Lock className="w-3 h-3" />
                    Encrypted for Two
                  </span>
                </div>

                {/* Letter Body */}
                <div className="space-y-3 font-handwriting text-lg sm:text-xl text-[#2C1E1A] leading-relaxed pt-1">
                  <p className="font-bold">My love,</p>
                  <p>
                    Some days I just look at you across the breakfast counter and wonder how I got so
                    lucky.
                  </p>
                  <p>
                    When you fell asleep on my shoulder on the train yesterday, I realized that home
                    isn&apos;t an address anymore. It&apos;s wherever you decide to lean your head.
                  </p>
                  <p className="text-right pt-2 font-bold">— Yours always, Alex ♡</p>
                </div>

                {/* Reaction stamps bar */}
                <div className="pt-3 border-t border-[#E8DFD5] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {[
                      { id: "cherish", label: "♡ Cherish", icon: "❤️" },
                      { id: "cry", label: "🥺 Teary", icon: "🥺" },
                      { id: "reply", label: "💌 Reply", icon: "✍️" },
                    ].map((stamp) => (
                      <button
                        key={stamp.id}
                        onClick={() => setSelectedReaction(stamp.label)}
                        className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                          selectedReaction === stamp.label
                            ? "bg-[#8E2B45] text-white shadow-xs"
                            : "bg-white border border-[#E8DFD5] text-[#6E5D57] hover:border-[#8E2B45]"
                        }`}
                      >
                        {stamp.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-[11px] font-mono text-[#9E8C85] hover:text-[#2C1E1A] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Fold & Seal</span>
                  </button>
                </div>

                {selectedReaction && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-rose-50 text-[11px] text-[#8E2B45] font-mono flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Stamped &ldquo;{selectedReaction}&rdquo; into the permanent relationship archive.</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
