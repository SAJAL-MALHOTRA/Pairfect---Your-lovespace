"use client";

import React from "react";
import { motion } from "framer-motion";

export type CassettePattern = "gingham" | "clover" | "grid" | "midnight" | "velvet" | "classic";
export type CassetteSticker = "eucalyptus" | "daisy" | "ribbon" | "seal" | "heart";

interface PhysicalCassetteProps {
  pattern?: CassettePattern;
  stickers?: CassetteSticker[];
  noteText?: string;
  tapeTitle?: string;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  showCase?: boolean;
  className?: string;
}

// ── Patterns CSS / SVG Definitions ──────────────────────────────────────────
const PATTERN_STYLES: Record<CassettePattern, { label: string; bg: string; border: string; accent: string }> = {
  gingham: {
    label: "Rose Gingham",
    bg: "bg-[#FDF6F0] dark:bg-[#251A18]",
    border: "border-[#E8D4C8] dark:border-[#3D2824]",
    accent: "#D38CA2",
  },
  clover: {
    label: "Wildflower Clover",
    bg: "bg-[#F6F8F3] dark:bg-[#18201B]",
    border: "border-[#D6E2D8] dark:border-[#243329]",
    accent: "#7AA084",
  },
  grid: {
    label: "Vintage Grid",
    bg: "bg-[#FAF6F0] dark:bg-[#201C18]",
    border: "border-[#E5D9C5] dark:border-[#382E24]",
    accent: "#8E2B45",
  },
  midnight: {
    label: "Midnight Stars",
    bg: "bg-[#18141C] dark:bg-[#100C14]",
    border: "border-[#32263B] dark:border-[#241A2D]",
    accent: "#D4849A",
  },
  velvet: {
    label: "Golden Velvet",
    bg: "bg-[#2A141A] dark:bg-[#1C0A0F]",
    border: "border-[#4A202A] dark:border-[#30121A]",
    accent: "#E5B869",
  },
  classic: {
    label: "Classic Cream",
    bg: "bg-[#FAF5EB] dark:bg-[#1C1510]",
    border: "border-[#E7DED5] dark:border-[#2E2420]",
    accent: "#8E2B45",
  },
};

// ── Sticker Graphic Component ───────────────────────────────────────────────
function StickerGraphic({ sticker, className = "" }: { sticker: CassetteSticker; className?: string }) {
  switch (sticker) {
    case "eucalyptus":
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          {/* Masking tape strip */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#E8DCB8]/80 dark:bg-[#A39470]/60 -rotate-3 rounded-xs shadow-xs z-10" />
          {/* Eucalyptus sprig */}
          <span className="text-2xl select-none filter drop-shadow-sm rotate-12">🌿</span>
        </div>
      );
    case "daisy":
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <span className="text-2xl select-none filter drop-shadow-sm -rotate-6">🌼</span>
        </div>
      );
    case "ribbon":
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <span className="text-2xl select-none filter drop-shadow-sm rotate-6">🎀</span>
        </div>
      );
    case "seal":
      return (
        <div className={`w-8 h-8 rounded-full bg-[var(--burgundy)] border-2 border-[#E5B869] shadow-md flex items-center justify-center text-white text-[10px] font-bold select-none ${className}`}>
          ♥
        </div>
      );
    case "heart":
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <span className="text-2xl select-none filter drop-shadow-sm animate-pulse">💖</span>
        </div>
      );
    default:
      return null;
  }
}

// ── Physical Cassette Component ─────────────────────────────────────────────
export default function PhysicalCassetteTape({
  pattern = "classic",
  stickers = [],
  noteText = "",
  tapeTitle = "My Mixtape",
  isPlaying = false,
  size = "md",
  showCase = true,
  className = "",
}: PhysicalCassetteProps) {
  const pStyle = PATTERN_STYLES[pattern] || PATTERN_STYLES.classic;

  const scaleMap = {
    sm: "scale-75 sm:scale-85",
    md: "scale-100",
    lg: "scale-110 sm:scale-120",
  };

  return (
    <div className={`relative flex flex-col items-center justify-center py-4 select-none ${className}`}>
      <div className={`relative transition-transform duration-300 ${scaleMap[size]}`}>

        {/* ─── SPIRAL NOTEBOOK PAPER INSERT (Top notes card sticking out) ─── */}
        {noteText && (
          <motion.div
            initial={{ opacity: 0, y: 15, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 w-64 p-3 pt-4 rounded-t-xl bg-[#FAF6EE] dark:bg-[#201A16] border border-[#EAE3D5] dark:border-[#382E26] shadow-md z-0 overflow-hidden"
          >
            {/* Spiral binder holes */}
            <div className="absolute top-1.5 left-0 right-0 flex justify-around px-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#3D3028]/20 dark:bg-[#000]/40 border border-[#FFF]/30" />
              ))}
            </div>
            {/* Lined paper texture */}
            <div className="pt-2 text-center">
              <p className="font-handwriting text-xs text-[#4A3B32] dark:text-[#D4C8B8] leading-tight line-clamp-2">
                &ldquo;{noteText}&rdquo;
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── CLEAR ACRYLIC JEWEL CASE BACK (Plastic sleeve) ─── */}
        {showCase && (
          <div className="relative p-2.5 rounded-2xl bg-white/40 dark:bg-black/40 border border-white/80 dark:border-white/20 shadow-xl backdrop-blur-xs z-10">
            {/* Glass reflection gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none z-30" />
            {/* Acrylic hinge tabs */}
            <div className="absolute top-2 left-2 w-3 h-6 rounded-xs bg-white/50 dark:bg-white/10 border border-white/40" />
            <div className="absolute top-2 right-2 w-3 h-6 rounded-xs bg-white/50 dark:bg-white/10 border border-white/40" />

            {/* ─── STICKERS DECAL LAYER ON CASE ─── */}
            {stickers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-40 p-4 flex items-center justify-between">
                {stickers.map((st, idx) => (
                  <motion.div
                    key={st + idx}
                    initial={{ scale: 0, rotate: (idx % 2 === 0 ? -12 : 12) }}
                    animate={{ scale: 1, rotate: (idx % 2 === 0 ? -8 : 8) }}
                    className="transform"
                  >
                    <StickerGraphic sticker={st} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* ─── CASSETTE BODY ─── */}
            <div className={`relative w-72 h-44 rounded-xl ${pStyle.bg} border-2 ${pStyle.border} shadow-md overflow-hidden flex flex-col justify-between p-3 z-20`}>

              {/* Top screws */}
              <div className="flex justify-between items-center px-1 opacity-60">
                <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center"><div className="w-1.5 h-0.5 bg-current" /></div>
                <div className="text-[8px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Side A</div>
                <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center"><div className="w-1.5 h-0.5 bg-current" /></div>
              </div>

              {/* Tape Label Paper Sticker */}
              <div className="relative mx-auto w-full max-w-[240px] p-2 rounded-md bg-[#FAF5EB]/90 dark:bg-[#1A1410]/95 border border-[#E7DED5] dark:border-[#2E2420] shadow-xs text-center">
                <p className="font-handwriting text-base font-bold text-[#3A2E22] dark:text-[#F0E8DC] truncate leading-none">
                  {tapeTitle}
                </p>
                <div className="my-1.5 h-0.5 w-full bg-[#D8CBBA] dark:bg-[#3D3028] opacity-60" />

                {/* ─── TAPE WINDOW & REELS ─── */}
                <div className="relative mx-auto w-44 h-12 rounded-lg bg-[#110D0A] border border-[#3A2E22] flex items-center justify-between px-4 overflow-hidden">
                  {/* Magnetic Tape Ribbon visible inside window */}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-5 bg-[#3B2A1E] opacity-90" />

                  {/* Left Hub / Reel */}
                  <div className="relative w-8 h-8 rounded-full bg-[#ECE4D8] border-2 border-[#7A6A5A] flex items-center justify-center shadow-inner">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <div className="w-6 h-6 rounded-full border border-[#8C7B6B] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#110D0A]" />
                      </div>
                      {/* Teeth spokes */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-[#8C7B6B]" />
                        <div className="w-0.5 h-full bg-[#8C7B6B]" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Tape Progress Meter lines */}
                  <div className="text-[8px] font-mono text-[#7A6A5A] select-none tracking-tighter">
                    I I I I I I I
                  </div>

                  {/* Right Hub / Reel */}
                  <div className="relative w-8 h-8 rounded-full bg-[#ECE4D8] border-2 border-[#7A6A5A] flex items-center justify-center shadow-inner">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <div className="w-6 h-6 rounded-full border border-[#8C7B6B] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#110D0A]" />
                      </div>
                      {/* Teeth spokes */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-[#8C7B6B]" />
                        <div className="w-0.5 h-full bg-[#8C7B6B]" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Bottom screws & Tape Guide Holes */}
              <div className="flex justify-between items-center px-3 opacity-60">
                <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center"><div className="w-1.5 h-0.5 bg-current" /></div>
                <div className="flex gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#110D0A]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#110D0A]" />
                </div>
                <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center"><div className="w-1.5 h-0.5 bg-current" /></div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
