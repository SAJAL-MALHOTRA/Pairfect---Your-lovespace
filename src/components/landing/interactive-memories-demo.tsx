"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Heart, Plus, Calendar, Tag } from "lucide-react";

interface MemorySnap {
  id: string;
  title: string;
  caption: string;
  date: string;
  location: string;
  emoji: string;
  gradient: string;
  rotate: number;
}

const MEMORIES: MemorySnap[] = [
  {
    id: "diner",
    title: "Seaside 24h Diner",
    caption: "3:42 AM when neither of us could sleep, sharing blueberry pancakes.",
    date: "Aug 12, 2026",
    location: "Old Pier Diner",
    emoji: "🥞",
    gradient: "from-[#4A2835] via-[#8E2B45] to-[#E5989B]",
    rotate: -3.5,
  },
  {
    id: "rain",
    title: "Caught in July Rain",
    caption: "One broken umbrella, completely soaked, laughing all the way to the metro.",
    date: "Jul 24, 2026",
    location: "CP Metro Station",
    emoji: "🌧️",
    gradient: "from-[#2A3B4C] via-[#4A6670] to-[#98B4B8]",
    rotate: 2.8,
  },
  {
    id: "kitchen",
    title: "First Sunday in Our Place",
    caption: "Unpacked boxes everywhere, morning sunlight, listening to jazz on the floor.",
    date: "Sep 03, 2026",
    location: "Our Apartment",
    emoji: "☕",
    gradient: "from-[#5C3D2E] via-[#8B5A2B] to-[#D4A373]",
    rotate: -2.0,
  },
];

export default function InteractiveMemoriesDemo() {
  const [selectedMemory, setSelectedMemory] = useState<MemorySnap>(MEMORIES[0]);
  const [isDeveloping, setIsDeveloping] = useState(false);

  const handlePickMemory = (mem: MemorySnap) => {
    if (selectedMemory.id === mem.id) return;
    setIsDeveloping(true);
    setSelectedMemory(mem);
    setTimeout(() => {
      setIsDeveloping(false);
    }, 450);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Scrapbook Canvas Area */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-10 shadow-xl overflow-hidden select-none min-h-[480px] flex flex-col items-center justify-between"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
          backgroundImage:
            "radial-gradient(#E8DFD5 0.75px, transparent 0.75px), radial-gradient(#E8DFD5 0.75px, #FAF6F0 0.75px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
      >
        {/* Subtle Scrapbook Top Ribbon */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#9E8C85] border-b border-[#E8DFD5] pb-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#8E2B45]">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Living Scrapbook Archive</span>
          </div>
          <span>47 moments preserved</span>
        </div>

        {/* Centerpiece: Physical Developing Polaroid */}
        <div className="my-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMemory.id}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ transform: `rotate(${selectedMemory.rotate}deg)` }}
              className="polaroid relative rounded-sm transition-transform hover:scale-105 cursor-pointer"
            >
              {/* Washi tape pin */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-5 rounded-2xs pointer-events-none z-20"
                style={{
                  background: "rgba(142, 43, 69, 0.22)",
                  transform: "rotate(1.5deg)",
                }}
              />

              {/* Photo Area with developing film effect */}
              <div className="w-64 sm:w-72 h-64 sm:h-72 rounded-xs overflow-hidden relative shadow-inner">
                <div
                  className={`w-full h-full bg-gradient-to-tr ${selectedMemory.gradient} flex flex-col items-center justify-center p-6 text-white text-center transition-all duration-700 ${
                    isDeveloping ? "filter blur-sm brightness-150" : "filter blur-0"
                  }`}
                >
                  <span className="text-4xl mb-2">{selectedMemory.emoji}</span>
                  <h4 className="font-display italic text-xl font-bold text-white/95">
                    {selectedMemory.title}
                  </h4>
                  <p className="text-[11px] font-mono text-white/80 mt-1">
                    {selectedMemory.location}
                  </p>

                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
                </div>

                {/* Film developing shimmer */}
                {isDeveloping && (
                  <motion.div
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 bg-[#FAF6F0] pointer-events-none"
                  />
                )}
              </div>

              {/* Handwritten Caption at bottom of Polaroid */}
              <div className="pt-3.5 pb-1 px-1 text-center font-handwriting text-base sm:text-lg text-[#2C1E1A] leading-snug">
                &ldquo;{selectedMemory.caption}&rdquo;
              </div>

              {/* Date stamp */}
              <div className="text-right text-[10px] font-mono text-[#9E8C85] pt-1">
                {selectedMemory.date}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Memory Selector Tabs (Choose between moments) */}
        <div className="w-full space-y-2">
          <span className="block text-center text-[10px] font-mono uppercase tracking-widest text-[#9E8C85]">
            Choose a memory to inspect:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {MEMORIES.map((m) => {
              const isSelected = m.id === selectedMemory.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handlePickMemory(m)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#8E2B45] shadow-xs ring-1 ring-[#8E2B45]/20"
                      : "bg-[#FAF5EC]/70 border-[#E8DFD5] hover:bg-white text-[#6E5D57]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{m.emoji}</span>
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-[#8E2B45]" : "text-[#2C1E1A]"
                      }`}
                    >
                      {m.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9E8C85] block truncate mt-0.5">
                    {m.date}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
