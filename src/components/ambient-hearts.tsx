"use client";

import React, { useMemo } from "react";

/**
 * AmbientHearts — Global floating hearts ambient background layer.
 * 
 * Renders soft, blurred heart shapes scattered across the viewport that
 * drift gently upward with horizontal sway and an opacity breathing effect.
 * 
 * Applied app-wide via layout.tsx. Fully CSS-animated (no JS timers),
 * respects prefers-reduced-motion, and uses pointer-events: none so it
 * never blocks interaction.
 */

interface HeartConfig {
  id: number;
  size: number;
  left: string;
  startY: number;
  blur: number;
  opacity: number;
  duration: number;
  delay: number;
  color: "rose" | "burgundy";
}

const HEART_COUNT = 14;

function generateHearts(): HeartConfig[] {
  // Deterministic seed — we want the same layout every render to avoid
  // hydration mismatches between server and client.
  const hearts: HeartConfig[] = [
    { id: 0,  size: 18, left: "5%",  startY: 95, blur: 5, opacity: 0.10, duration: 22, delay: 0,    color: "rose" },
    { id: 1,  size: 14, left: "15%", startY: 80, blur: 6, opacity: 0.08, duration: 18, delay: 3,    color: "burgundy" },
    { id: 2,  size: 22, left: "25%", startY: 90, blur: 4, opacity: 0.12, duration: 25, delay: 7,    color: "rose" },
    { id: 3,  size: 10, left: "35%", startY: 70, blur: 7, opacity: 0.09, duration: 20, delay: 1,    color: "burgundy" },
    { id: 4,  size: 16, left: "45%", startY: 85, blur: 5, opacity: 0.11, duration: 23, delay: 5,    color: "rose" },
    { id: 5,  size: 12, left: "55%", startY: 75, blur: 6, opacity: 0.08, duration: 19, delay: 9,    color: "burgundy" },
    { id: 6,  size: 20, left: "65%", startY: 95, blur: 4, opacity: 0.13, duration: 24, delay: 2,    color: "rose" },
    { id: 7,  size: 11, left: "75%", startY: 80, blur: 7, opacity: 0.09, duration: 17, delay: 6,    color: "burgundy" },
    { id: 8,  size: 15, left: "85%", startY: 90, blur: 5, opacity: 0.10, duration: 21, delay: 4,    color: "rose" },
    { id: 9,  size: 13, left: "92%", startY: 70, blur: 6, opacity: 0.08, duration: 16, delay: 8,    color: "burgundy" },
    { id: 10, size: 24, left: "10%", startY: 60, blur: 3, opacity: 0.14, duration: 25, delay: 11,   color: "rose" },
    { id: 11, size: 9,  left: "40%", startY: 55, blur: 8, opacity: 0.07, duration: 15, delay: 13,   color: "burgundy" },
    { id: 12, size: 17, left: "70%", startY: 65, blur: 5, opacity: 0.11, duration: 22, delay: 10,   color: "rose" },
    { id: 13, size: 11, left: "50%", startY: 50, blur: 7, opacity: 0.09, duration: 18, delay: 14,   color: "burgundy" },
  ];
  return hearts;
}

export default function AmbientHearts() {
  const hearts = useMemo(() => generateHearts(), []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute"
          style={{
            left: h.left,
            top: `${h.startY}vh`,
            width: `${h.size}px`,
            opacity: h.opacity,
            willChange: "transform, opacity",
            animation: `drift-heart-up ${h.duration}s linear ${h.delay}s infinite, heart-breathe ${h.duration * 0.6}s ease-in-out ${h.delay}s infinite`,
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path
              d="M 50 86 C 25 63, 6 43, 6 27 C 6 12, 23 5, 50 31 C 77 5, 94 12, 94 27 C 94 43, 75 63, 50 86 Z"
              fill={h.color === "rose" ? "var(--rose)" : "var(--burgundy)"}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
