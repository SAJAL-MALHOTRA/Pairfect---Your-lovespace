"use client";

import React from "react";
import { motion } from "framer-motion";
import { CASSETTE_PATTERNS, CassettePatternConfig } from "./cassette-patterns";

interface CassetteShellProps {
  patternId?: string;
  tapeTitle?: string;
  recipientName?: string;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PatternBackground({ patternType }: { patternType: CassettePatternConfig["patternType"] }) {
  switch (patternType) {
    case "clover":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-clover" width="32" height="32" patternUnits="userSpaceOnUse">
              {/* 4 leaf clover sprig */}
              <g transform="translate(16, 16) scale(0.65)" fill="#44754E" opacity="0.8">
                <circle cx="-5" cy="-5" r="4.5" />
                <circle cx="5" cy="-5" r="4.5" />
                <circle cx="-5" cy="5" r="4.5" />
                <circle cx="5" cy="5" r="4.5" />
                <path d="M0,0 Q-2,10 6,14" stroke="#44754E" strokeWidth="1.8" fill="none" />
              </g>
              {/* small petal accents */}
              <circle cx="4" cy="4" r="1.5" fill="#5F8E68" opacity="0.4" />
              <circle cx="28" cy="28" r="1.5" fill="#5F8E68" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-clover)" />
        </svg>
      );

    case "yellow-plaid":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-yellow-plaid" width="28" height="28" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill="#FFFCEB" />
              <rect x="0" y="0" width="28" height="6" fill="#FCE788" opacity="0.65" />
              <rect x="0" y="0" width="6" height="28" fill="#FCE788" opacity="0.65" />
              <line x1="0" y1="18" x2="28" y2="18" stroke="#E6BF42" strokeWidth="1.2" opacity="0.7" />
              <line x1="18" y1="0" x2="18" y2="28" stroke="#E6BF42" strokeWidth="1.2" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-yellow-plaid)" />
        </svg>
      );

    case "gingham-red":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-gingham-red" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill="#FFFFFF" />
              <rect x="0" y="0" width="12" height="12" fill="#FFAEC0" opacity="0.45" />
              <rect x="12" y="12" width="12" height="12" fill="#FFAEC0" opacity="0.45" />
              <rect x="12" y="0" width="12" height="12" fill="#FF8BA5" opacity="0.65" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-gingham-red)" />
        </svg>
      );

    case "blue-floral":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-blue-floral" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#E8F2FA" />
              {/* Daisy */}
              <g transform="translate(15, 15)">
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <ellipse key={deg} rx="2" ry="5" transform={`rotate(${deg}) translate(0, -4)`} fill="#FFFFFF" opacity="0.95" />
                ))}
                <circle cx="0" cy="0" r="2.2" fill="#F4D368" />
              </g>
              <circle cx="4" cy="4" r="1.2" fill="#90BFE5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-blue-floral)" />
        </svg>
      );

    case "dark-star":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-dark-star" width="28" height="28" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill="#2E1F18" />
              {/* 4-point retro star */}
              <path
                d="M14,6 Q14,14 6,14 Q14,14 14,22 Q14,14 22,14 Q14,14 14,6 Z"
                fill="#E8BA7B"
                opacity="0.8"
              />
              <circle cx="3" cy="3" r="1" fill="#DDB06C" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-dark-star)" />
        </svg>
      );

    case "espresso-floral":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-espresso-floral" width="34" height="34" patternUnits="userSpaceOnUse">
              <rect width="34" height="34" fill="#3D271D" />
              <g fill="#D6B89E" opacity="0.6">
                <circle cx="17" cy="17" r="4" />
                <path d="M17,9 C15,13 19,13 17,9 Z" />
                <path d="M25,17 C21,15 21,19 25,17 Z" />
                <path d="M17,25 C15,21 19,21 17,25 Z" />
                <path d="M9,17 C13,15 13,19 9,17 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-espresso-floral)" />
        </svg>
      );

    case "beige-botanical":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-beige-botanical" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#F5EFE6" />
              <g stroke="#7D6250" strokeWidth="1.2" fill="none" opacity="0.65">
                <path d="M8,26 Q16,18 24,10" />
                <circle cx="14" cy="19" r="2" fill="#7D6250" />
                <circle cx="19" cy="14" r="2" fill="#7D6250" />
                <circle cx="24" cy="10" r="2" fill="#7D6250" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-beige-botanical)" />
        </svg>
      );

    case "brown-gingham":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-75" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-brown-gingham" width="22" height="22" patternUnits="userSpaceOnUse">
              <rect width="22" height="22" fill="#FAF6F0" />
              <rect x="0" y="0" width="11" height="11" fill="#C5B09E" opacity="0.5" />
              <rect x="11" y="11" width="11" height="11" fill="#C5B09E" opacity="0.5" />
              <rect x="11" y="0" width="11" height="11" fill="#99806E" opacity="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-brown-gingham)" />
        </svg>
      );

    case "pastel-stripes":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-pastel-stripes" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="6" height="24" fill="#FCECE2" />
              <rect x="6" y="0" width="6" height="24" fill="#F9DFD2" />
              <rect x="12" y="0" width="6" height="24" fill="#E6EEF3" />
              <rect x="18" y="0" width="6" height="24" fill="#FFF8EE" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-pastel-stripes)" />
        </svg>
      );

    case "cream-windowpane":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-75" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-cream-windowpane" width="22" height="22" patternUnits="userSpaceOnUse">
              <rect width="22" height="22" fill="#FAF5EB" />
              <line x1="0" y1="0" x2="22" y2="0" stroke="#C9B8A3" strokeWidth="1" opacity="0.75" />
              <line x1="0" y1="0" x2="0" y2="22" stroke="#C9B8A3" strokeWidth="1" opacity="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-cream-windowpane)" />
        </svg>
      );

    case "pearl-dotted":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-pearl-dotted" width="18" height="18" patternUnits="userSpaceOnUse">
              <rect width="18" height="18" fill="#FCFAF6" />
              <circle cx="9" cy="9" r="1.8" fill="#8C7A6D" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-pearl-dotted)" />
        </svg>
      );

    case "powder-slate":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-powder-slate" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#E2E9EC" />
              <circle cx="10" cy="10" r="1.6" fill="#758B93" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-powder-slate)" />
        </svg>
      );

    case "forest-stars":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-forest-stars" width="26" height="26" patternUnits="userSpaceOnUse">
              <rect width="26" height="26" fill="#243428" />
              <polygon points="13,7 14.5,11.5 19,13 14.5,14.5 13,19 11.5,14.5 7,13 11.5,11.5" fill="#D3E5D8" opacity="0.8" />
              <circle cx="4" cy="4" r="1" fill="#A8C8B1" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-forest-stars)" />
        </svg>
      );

    case "sage-leaf":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-sage-leaf" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#DEE7E1" />
              <g fill="#4F715C" opacity="0.65">
                <ellipse cx="15" cy="11" rx="2.5" ry="5.5" transform="rotate(-25, 15, 11)" />
                <ellipse cx="15" cy="19" rx="2.5" ry="5.5" transform="rotate(25, 15, 19)" />
                <circle cx="15" cy="15" r="1.5" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-sage-leaf)" />
        </svg>
      );

    case "olive-checker":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-olive-checker" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#EFF2E1" />
              <rect x="0" y="0" width="10" height="10" fill="#9DAA73" opacity="0.65" />
              <rect x="10" y="10" width="10" height="10" fill="#9DAA73" opacity="0.65" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-olive-checker)" />
        </svg>
      );

    case "mint-bouquet":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-mint-bouquet" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#EDF5EF" />
              <circle cx="15" cy="15" r="3.5" fill="#E8879A" opacity="0.8" />
              <circle cx="12" cy="14" r="2.2" fill="#528362" opacity="0.6" />
              <circle cx="18" cy="16" r="2.2" fill="#528362" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-mint-bouquet)" />
        </svg>
      );

    case "cream-heart":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-cream-heart" width="26" height="26" patternUnits="userSpaceOnUse">
              <rect width="26" height="26" fill="#FDF8F5" />
              <path
                d="M13,11 C11.5,8 8,8.5 8,11.5 C8,14.5 13,18 13,18 C13,18 18,14.5 18,11.5 C18,8.5 14.5,8 13,11 Z"
                fill="#C64761"
                opacity="0.75"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-cream-heart)" />
        </svg>
      );

    case "hunter-tartan":
      return (
        <svg className="absolute inset-0 w-full h-full opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat-hunter-tartan" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill="#E1EBE5" />
              <rect x="0" y="0" width="24" height="5" fill="#7FA790" opacity="0.45" />
              <rect x="0" y="0" width="5" height="24" fill="#7FA790" opacity="0.45" />
              <line x1="0" y1="16" x2="24" y2="16" stroke="#486D58" strokeWidth="1.2" opacity="0.7" />
              <line x1="16" y1="0" x2="16" y2="24" stroke="#486D58" strokeWidth="1.2" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat-hunter-tartan)" />
        </svg>
      );

    default:
      return null;
  }
}

export function CassetteShell({
  patternId = "clover",
  tapeTitle = "Mixtape for you",
  recipientName = "for you",
  isPlaying = false,
  size = "md",
  className = "",
}: CassetteShellProps) {
  const pattern = CASSETTE_PATTERNS.find((p) => p.id === patternId) || CASSETTE_PATTERNS[0];

  const scaleMap = {
    sm: "scale-75 sm:scale-85 origin-center",
    md: "scale-90 sm:scale-100 origin-center",
    lg: "scale-100 sm:scale-110 origin-center",
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className={`transition-transform duration-300 ${scaleMap[size]}`}>
        {/* ─── AUTHENTIC CASSETTE SHELL ─── */}
        <div className="relative w-[340px] sm:w-[380px] h-[215px] sm:h-[240px] rounded-2xl bg-gradient-to-b from-[#FAF8F5] via-[#EFECE6] to-[#E3DFD7] border-[3px] border-[#D4CFC6] shadow-[0_16px_36px_rgba(40,30,20,0.22),_0_2px_4px_rgba(0,0,0,0.06),_inset_0_2px_3px_rgba(255,255,255,0.9)] p-3 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Outer Shell Ridge / Bevel */}
          <div className="absolute inset-1 rounded-xl border border-white/60 pointer-events-none" />

          {/* 4 Corner Screws */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-[#D8D4CC] border border-[#B0AAA0] flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-0.5 bg-[#8C8478] transform rotate-45" />
          </div>
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-[#D8D4CC] border border-[#B0AAA0] flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-0.5 bg-[#8C8478] transform -rotate-12" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-[#D8D4CC] border border-[#B0AAA0] flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-0.5 bg-[#8C8478] transform rotate-30" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-[#D8D4CC] border border-[#B0AAA0] flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-0.5 bg-[#8C8478] transform -rotate-60" />
          </div>

          {/* Top Edge Indicator */}
          <div className="flex items-center justify-between px-6 pt-1 text-[9px] font-mono tracking-widest uppercase text-stone-500 font-bold z-10">
            <span>A</span>
            <span className="text-[8px] tracking-widest opacity-70">IEC I / TYPE I · NORMAL BIAS</span>
            <span>NR [ ]</span>
          </div>

          {/* ─── CUSTOMIZABLE PATTERN INLAY LABEL ─── */}
          <div
            className="relative mx-auto w-[92%] h-[142px] sm:h-[158px] rounded-xl border-2 shadow-inner overflow-hidden flex flex-col justify-between p-2.5 z-10 transition-all duration-300"
            style={{
              backgroundColor: pattern.labelBg,
              borderColor: pattern.labelBorder,
            }}
          >
            {/* SVG Pattern Layer */}
            <PatternBackground patternType={pattern.patternType} />

            {/* Top Label Header: handwritten tape title */}
            <div className="relative z-10 flex items-center justify-between px-2 pt-0.5 border-b border-black/10 pb-1">
              <span className="font-script text-base sm:text-lg font-bold truncate max-w-[200px]" style={{ color: pattern.textColor }}>
                {tapeTitle || "Mixtape for you"}
              </span>
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/10 text-stone-800">
                {recipientName ? `To: ${recipientName}` : "SIDE A"}
              </span>
            </div>

            {/* ─── CENTRAL TAPE WINDOW & ROTATING SPOOLS ─── */}
            <div className="relative mx-auto my-auto w-[82%] h-[56px] sm:h-[64px] rounded-xl bg-gradient-to-b from-[#1C1815] to-[#0D0B0A] border-2 border-stone-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-between px-5 overflow-hidden z-10">
              
              {/* Magnetic Tape Ribbon inside window */}
              <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-6 bg-[#3B281B] opacity-95 border-y border-[#503724]" />

              {/* Left Spool Reel */}
              <div className="relative w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-[#EAE5DC] border-2 border-[#807262] flex items-center justify-center shadow-md">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  <div className="w-7 h-7 rounded-full border border-[#9A8B7A] flex items-center justify-center bg-[#E5DFD4]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#181310] shadow-inner" />
                  </div>
                  {/* Spool gear teeth */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => (
                    <div
                      key={deg}
                      className="absolute w-1 h-2 bg-[#746656] rounded-xs"
                      style={{
                        transform: `rotate(${deg}deg) translateY(-8px)`,
                      }}
                    />
                  ))}
                </motion.div>
              </div>

              {/* Central Window Ruler / Tape gauge */}
              <div className="flex flex-col items-center justify-center opacity-65 text-[7px] font-mono text-stone-400 select-none">
                <div className="flex gap-1 tracking-tighter">
                  <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
                </div>
                <span className="text-[6px] tracking-wider text-amber-200/80">60 MIN</span>
              </div>

              {/* Right Spool Reel */}
              <div className="relative w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-[#EAE5DC] border-2 border-[#807262] flex items-center justify-center shadow-md">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  <div className="w-7 h-7 rounded-full border border-[#9A8B7A] flex items-center justify-center bg-[#E5DFD4]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#181310] shadow-inner" />
                  </div>
                  {/* Spool gear teeth */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => (
                    <div
                      key={deg}
                      className="absolute w-1 h-2 bg-[#746656] rounded-xs"
                      style={{
                        transform: `rotate(${deg}deg) translateY(-8px)`,
                      }}
                    />
                  ))}
                </motion.div>
              </div>

            </div>

            {/* Bottom Label Subtitle */}
            <div className="relative z-10 flex items-center justify-between px-2 text-[8px] font-mono font-medium text-black/50">
              <span>STEREO CASSETTE</span>
              <span className="italic">Compact Cassette</span>
            </div>
          </div>

          {/* ─── BOTTOM CASSETTE TRAPEZOID & ROLLER HEAD ─── */}
          <div className="relative mx-auto w-[65%] h-[24px] rounded-b-xl bg-[#D6D0C5] border-t-2 border-[#BEB7A8] flex items-center justify-around px-4 shadow-inner z-10">
            {/* Guide Hole Left */}
            <div className="w-3 h-3 rounded-full bg-[#201A16] border border-[#9A9386]" />
            {/* Pressure Pad / Tape Head Cutout */}
            <div className="w-10 h-2 bg-[#524135] rounded-xs shadow-inner" />
            {/* Guide Hole Right */}
            <div className="w-3 h-3 rounded-full bg-[#201A16] border border-[#9A9386]" />
          </div>

        </div>
      </div>
    </div>
  );
}

export default CassetteShell;
