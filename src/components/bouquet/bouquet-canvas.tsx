"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RenderFlowerIcon,
  GreeneryBranch,
  RibbonBow,
} from "./flower-illustrations";
import {
  WRAPPING_STYLES,
  RIBBON_STYLES,
  ATMOSPHERE_EFFECTS,
} from "@/lib/bouquet/flowers-data";
import { Sparkles, Heart } from "lucide-react";

interface BouquetCanvasProps {
  flowers: string[];
  wrappingId?: string;
  ribbonId?: string;
  greeneryId?: string;
  atmosphereId?: string;
  toName?: string;
  fromName?: string;
  message?: string;
  isRevealMode?: boolean;
  onUntie?: () => void;
  className?: string;
}

// Organic arrangement coordinates for 3 to 6 flowers
function getFlowerArrangement(count: number) {
  if (count === 3) {
    return [
      { x: 50, y: 22, rot: 0, scale: 1.15, z: 12 },
      { x: 32, y: 34, rot: -16, scale: 1.05, z: 10 },
      { x: 68, y: 34, rot: 16, scale: 1.05, z: 10 },
    ];
  }
  if (count === 4) {
    return [
      { x: 40, y: 24, rot: -8, scale: 1.08, z: 12 },
      { x: 60, y: 24, rot: 8, scale: 1.08, z: 12 },
      { x: 26, y: 36, rot: -20, scale: 1.0, z: 10 },
      { x: 74, y: 36, rot: 20, scale: 1.0, z: 10 },
    ];
  }
  if (count === 5) {
    return [
      { x: 50, y: 18, rot: 0, scale: 1.15, z: 14 },
      { x: 34, y: 28, rot: -15, scale: 1.05, z: 12 },
      { x: 66, y: 28, rot: 15, scale: 1.05, z: 12 },
      { x: 24, y: 40, rot: -24, scale: 0.95, z: 10 },
      { x: 76, y: 40, rot: 24, scale: 0.95, z: 10 },
    ];
  }
  // 6 flowers
  return [
    { x: 36, y: 20, rot: -12, scale: 1.08, z: 14 },
    { x: 50, y: 16, rot: 0, scale: 1.15, z: 15 },
    { x: 64, y: 20, rot: 12, scale: 1.08, z: 14 },
    { x: 24, y: 36, rot: -24, scale: 0.95, z: 11 },
    { x: 50, y: 32, rot: 0, scale: 1.05, z: 12 },
    { x: 76, y: 36, rot: 24, scale: 0.95, z: 11 },
  ];
}

export default function BouquetCanvas({
  flowers,
  wrappingId = "kraft",
  ribbonId = "rose",
  greeneryId = "eucalyptus",
  atmosphereId = "petals",
  toName = "Someone Special",
  fromName = "With Love",
  message = "A handpicked digital bouquet for you.",
  isRevealMode = false,
  onUntie,
  className = "",
}: BouquetCanvasProps) {
  const [isOpened, setIsOpened] = useState(!isRevealMode);
  const [cardFocused, setCardFocused] = useState(false);

  const wrap = WRAPPING_STYLES[wrappingId] || WRAPPING_STYLES.kraft;
  const ribbon = RIBBON_STYLES[ribbonId] || RIBBON_STYLES.rose;

  const validFlowers = flowers.length > 0 ? flowers.slice(0, 6) : ["rose", "peony", "tulip"];
  const arrangement = getFlowerArrangement(validFlowers.length);

  const handleOpenClick = () => {
    setIsOpened(true);
    setCardFocused(true);
    onUntie?.();
  };

  return (
    <div
      className={`relative w-full max-w-[460px] aspect-[4/5] mx-auto select-none overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 ${className}`}
      style={{
        background: "linear-gradient(155deg, #FBF8F3 0%, #F5ECE0 60%, #EFE3D3 100%)",
      }}
    >
      {/* ── Atmosphere Particles ── */}
      {atmosphereId === "petals" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-4 bg-rose-300/80 rounded-full"
              style={{
                borderRadius: "60% 40% 70% 30%",
                left: `${(i * 12 + 6) % 100}%`,
                top: "-10%",
                boxShadow: "0 2px 6px rgba(225,29,72,0.15)",
              }}
              animate={{
                y: ["0%", "1200%"],
                x: [0, (i % 2 === 0 ? 30 : -30), 0],
                rotate: [0, 360],
                opacity: [0, 0.9, 0],
              }}
              transition={{
                duration: 6 + (i % 4),
                repeat: Infinity,
                delay: i * 0.7,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {atmosphereId === "sparkles" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-amber-400"
              style={{
                left: `${(i * 9 + 4) % 94}%`,
                top: `${(i * 14 + 10) % 85}%`,
              }}
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 0.9, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: (i * 0.3) % 2.5,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-400 drop-shadow" />
            </motion.div>
          ))}
        </div>
      )}

      {atmosphereId === "hearts" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-400"
              style={{
                left: `${(i * 13 + 5) % 92}%`,
                bottom: "5%",
              }}
              animate={{
                y: [0, -400],
                opacity: [0, 0.8, 0],
                scale: [0.6, 1.1, 0.8],
              }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-400" />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Background Subtle Vignette ── */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(60,40,30,0.15)_100%)]" />

      {/* ── Back Paper Wrapping Flap ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[84%] h-[68%] z-[4] transition-all duration-500"
        style={{
          background: wrap.bgGradient,
          clipPath: "polygon(0% 18%, 18% 0%, 82% 0%, 100% 18%, 68% 100%, 32% 100%)",
          boxShadow: `0 16px 36px ${wrap.shadowColor}`,
          borderTop: `1px solid ${wrap.borderColor}`,
        }}
      >
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />
      </div>

      {/* ── Greenery Foliage Layer (Behind Flowers) ── */}
      <div className="absolute inset-x-0 bottom-[14%] h-[75%] z-[6] pointer-events-none">
        {/* Left greenery arch */}
        <div className="absolute left-[14%] top-[14%] -rotate-25 origin-bottom opacity-85">
          <GreeneryBranch type={greeneryId} size={170} />
        </div>
        {/* Right greenery arch */}
        <div className="absolute right-[14%] top-[14%] rotate-25 origin-bottom opacity-85">
          <GreeneryBranch type={greeneryId} size={170} flip />
        </div>
        {/* Center backdrop greenery */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[4%] opacity-70">
          <GreeneryBranch type={greeneryId} size={180} />
        </div>
      </div>

      {/* ── Flower Stems Layer ── */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none z-[8]"
        preserveAspectRatio="none"
      >
        {arrangement.map((pos, idx) => (
          <path
            key={idx}
            d={`M${pos.x} ${pos.y + 16} Q50 68 50 82`}
            stroke="#2D6A4F"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        ))}
      </svg>

      {/* ── Arranged Flowers Layer ── */}
      <div className="absolute inset-0 pointer-events-none">
        {validFlowers.map((flowerId, idx) => {
          const pos = arrangement[idx] || { x: 50, y: 30, rot: 0, scale: 1, z: 10 };
          return (
            <motion.div
              key={`${flowerId}-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 filter drop-shadow-md"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: pos.z,
              }}
              initial={isRevealMode ? { scale: 0.6, opacity: 0 } : false}
              animate={{
                scale: pos.scale,
                rotate: pos.rot,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: idx * 0.08,
              }}
            >
              <RenderFlowerIcon flowerId={flowerId} size={120} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Front Paper Wrapping (Sleeve & Folded Lapels) ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[78%] h-[52%] z-[20] transition-all duration-500"
        style={{
          filter: `drop-shadow(0 -6px 16px ${wrap.shadowColor})`,
        }}
      >
        <svg
          viewBox="0 0 400 320"
          className="w-full h-full"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id={`front-wrap-${wrappingId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={wrap.lapelFill} />
              <stop offset="60%" stopColor={wrap.borderColor} />
              <stop offset="100%" stopColor={wrap.lapelFill} />
            </linearGradient>
          </defs>

          {/* Left Lapel Fold */}
          <path
            d="M20 40 Q130 90 200 130 L160 310 Q70 240 20 40 Z"
            fill={`url(#front-wrap-${wrappingId})`}
            stroke={wrap.borderColor}
            strokeWidth="1.5"
            opacity="0.95"
          />

          {/* Right Lapel Fold (overlapping) */}
          <path
            d="M380 40 Q270 90 200 130 L240 310 Q330 240 380 40 Z"
            fill={wrap.lapelFill}
            stroke={wrap.borderColor}
            strokeWidth="1.5"
          />

          {/* Center Cone Body */}
          <path
            d="M90 100 Q200 130 310 100 L240 316 Q200 320 160 316 Z"
            fill={wrap.lapelFill}
            stroke={wrap.borderColor}
            strokeWidth="1.2"
            opacity="0.98"
          />

          {/* Fold crease highlight lines */}
          <path d="M20 40 L200 130" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
          <path d="M380 40 L200 130" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
        </svg>
      </div>

      {/* ── Tucked Personal Card (Interactive) ── */}
      <motion.div
        className="absolute z-[25] cursor-pointer"
        style={{
          right: "10%",
          bottom: "16%",
          width: "56%",
        }}
        animate={
          cardFocused
            ? {
                x: "-38%",
                y: "-50%",
                scale: 1.18,
                rotate: 0,
                zIndex: 40,
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }
            : {
                x: 0,
                y: 0,
                scale: 1,
                rotate: 4,
                zIndex: 25,
                boxShadow: "0 8px 20px rgba(80,60,40,0.18)",
              }
        }
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        onClick={() => setCardFocused(!cardFocused)}
        title={cardFocused ? "Tap to tuck card back into bouquet" : "Tap to focus & read card"}
      >
        <div
          className="p-4 sm:p-5 rounded-2xl border transition-all"
          style={{
            background: "#FFFDF9",
            borderColor: "rgba(180, 140, 100, 0.35)",
            color: "#382923",
          }}
        >
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-1.5 mb-2">
            <span className="font-serif font-bold text-xs sm:text-sm text-rose-900 truncate">
              To: {toName || "My Favorite Person"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">
              ♡ Bouquet
            </span>
          </div>

          <p className="font-script text-sm sm:text-base leading-relaxed line-clamp-4 text-zinc-800 italic">
            &ldquo;{message || "Thinking of you today and sending you these blooms."}&rdquo;
          </p>

          <div className="text-right pt-2 border-t border-rose-100/80 mt-2">
            <span className="font-serif text-[11px] sm:text-xs text-rose-800 font-semibold italic">
              From: {fromName || "Always Yours"}
            </span>
          </div>

          {cardFocused && (
            <p className="text-[9px] font-mono text-center text-zinc-400 pt-1 uppercase tracking-widest">
              Tap to tuck back in
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Tied Ribbon Bow ── */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[8%] z-[30] pointer-events-none filter drop-shadow-md">
        <RibbonBow color={ribbon.color} size={110} />
      </div>

      {/* ── Recipient Interactive Untie Overlay ── */}
      {isRevealMode && !isOpened && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenClick}
            className="px-6 py-4 rounded-full bg-white text-rose-900 font-serif font-bold text-sm sm:text-base shadow-2xl flex items-center gap-2 cursor-pointer border border-rose-200"
          >
            <span>Untie Ribbon & Unwrap Bouquet</span>
            <span className="text-lg">🎀</span>
          </motion.button>
          <p className="text-white/80 font-mono text-xs mt-3">
            Handcrafted for you with love
          </p>
        </motion.div>
      )}
    </div>
  );
}
