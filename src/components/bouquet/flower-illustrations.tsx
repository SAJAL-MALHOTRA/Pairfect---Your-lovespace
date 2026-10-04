"use client";

import React from "react";
import { getFlowerById } from "@/lib/bouquet/flowers-data";

interface RenderFlowerIconProps {
  flowerId: string;
  size?: number;
  className?: string;
  isMono?: boolean;
}

export function RenderFlowerIcon({
  flowerId,
  size = 64,
  className = "",
  isMono = false,
}: RenderFlowerIconProps) {
  const flower = getFlowerById(flowerId);
  const src = isMono ? flower.monoImage : flower.image;

  return (
    <img
      src={src}
      alt={flower.name}
      width={size}
      height={size}
      className={`object-contain select-none pointer-events-none transition-transform ${className}`}
      loading="lazy"
      onError={(e) => {
        // Fallback to rose if image fails to load
        (e.currentTarget as HTMLImageElement).src = "/bouquet/color/flowers/rose.png";
      }}
    />
  );
}

// Ribbon Bow Vector Accent
export function RibbonBow({
  color = "#D97706",
  size = 90,
  className = "",
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 100 72"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`ribbon-glow-${color.replace("#", "")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>
      </defs>

      {/* Hanging ribbon tails */}
      <path
        d="M44 38 Q30 52 22 68"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M56 38 Q70 52 78 68"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Left bow loop */}
      <path
        d="M50 32 C30 14 12 20 16 34 C20 44 38 38 50 34 Z"
        fill={color}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1.2"
      />

      {/* Right bow loop */}
      <path
        d="M50 32 C70 14 88 20 84 34 C80 44 62 38 50 34 Z"
        fill={color}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1.2"
      />

      {/* Center knot */}
      <circle cx="50" cy="34" r="8" fill={`url(#ribbon-glow-${color.replace("#", "")})`} stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />
    </svg>
  );
}
