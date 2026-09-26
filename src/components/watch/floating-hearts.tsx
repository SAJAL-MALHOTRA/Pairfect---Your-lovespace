"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FloatingHeartItem {
  id: string;
  senderName: string;
  x: number; // percentage across screen 10-90
  scale: number;
  color: "rose" | "burgundy";
}

interface FloatingHeartsLayerProps {
  hearts: FloatingHeartItem[];
}

export function FloatingHeartsLayer({ hearts }: FloatingHeartsLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 80, scale: 0.4, rotate: 0 }}
            animate={{
              opacity: [0, 0.95, 0.9, 0],
              y: -420,
              scale: [0.4, h.scale, h.scale * 1.1, h.scale * 0.9],
              x: [0, (h.id.charCodeAt(0) % 2 === 0 ? 24 : -24), (h.id.charCodeAt(0) % 2 === 0 ? -12 : 12)],
              rotate: [0, (h.id.charCodeAt(0) % 2 === 0 ? 12 : -12)],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.2, ease: "easeOut" }}
            style={{ left: `${h.x}%`, bottom: "24px" }}
            className="absolute flex flex-col items-center gap-1 select-none"
          >
            {/* Pairfect Brand Ambient Heart SVG */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 filter drop-shadow-[0_4px_12px_rgba(232,82,125,0.4)]">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <path
                  d="M 50 86 C 25 63, 6 43, 6 27 C 6 12, 23 5, 50 31 C 77 5, 94 12, 94 27 C 94 43, 75 63, 50 86 Z"
                  fill={h.color === "rose" ? "#FFB3C6" : "#E8527D"}
                />
              </svg>
            </div>

            {/* Sender identity badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs font-semibold whitespace-nowrap">
              {h.senderName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
