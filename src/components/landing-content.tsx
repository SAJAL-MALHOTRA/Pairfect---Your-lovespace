"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera, Heart, ChevronRight, ChevronLeft,
  ArrowRight, Lock, Shield, Zap, Play, Pause, Flame,
  Mail, Clock, Download, Star, HelpCircle, X,
  Smartphone, Brain, Disc, Archive,
  Tv, Sparkles, RotateCw, Mic, Send, Radio, Flower2,
  Users, Plane, Globe, Laptop, User,
  RefreshCw, Compass, Music, CloudSun, Scale, Palette,
  Sun, Snowflake, MessageSquare, Sparkle, Check
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform
} from "framer-motion";
import { CoupleBeansMascot, HeartBeansAirplaneMascot } from "@/components/couple-mascot";

/* Audio Sound Effects Engine */
function playTactileSound(
  type: "tap" | "paper" | "click" | "pop" | "shutter" | "spin" | "chime" = "tap",
  enabled: boolean = true
) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "shutter") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === "tap" || type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "paper") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "spin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "chime") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignore audio restrictions
  }
}

/* ════════════════════════════════════════════════════════════════════════
   HERO LIVE PARTNER CURSOR COMPONENT WITH EXPANDING HEART RIPPLES
   ════════════════════════════════════════════════════════════════════════ */
interface HeroLiveCursorProps {
  name: string;
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  initialPos: { x: number; y: number };
  pathX: number[];
  pathY: number[];
  duration: number;
  className?: string;
}

function HeroLiveCursor({
  name,
  label,
  color,
  textColor,
  bgColor,
  borderColor,
  initialPos,
  pathX,
  pathY,
  duration,
  className = "",
}: HeroLiveCursorProps) {
  return (
    <motion.div
      initial={initialPos}
      animate={{
        x: pathX,
        y: pathY,
        rotate: [-3, 4, -2, 3, -3],
      }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "easeInOut",
      }}
      className={`absolute z-30 pointer-events-auto hidden sm:flex items-start gap-1 select-none cursor-pointer ${className}`}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => playTactileSound("pop")}
    >
      {/* Pointer tip with expanding heart ripple waves */}
      <div className="relative">
        {/* Expanding Heart Ripple 1 */}
        <motion.div
          className="absolute -top-3.5 -left-3.5 pointer-events-none"
          initial={{ scale: 0.35, opacity: 0.9 }}
          animate={{ scale: [0.35, 1.8, 2.8], opacity: [0.9, 0.45, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ fill: color, color }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>

        {/* Expanding Heart Ripple 2 */}
        <motion.div
          className="absolute -top-3.5 -left-3.5 pointer-events-none"
          initial={{ scale: 0.35, opacity: 0.9 }}
          animate={{ scale: [0.35, 1.8, 2.8], opacity: [0.9, 0.45, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 1.1, ease: "easeOut" }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ fill: color, color }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>

        {/* Custom SVG arrow cursor */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 drop-shadow-md -rotate-12 relative z-10"
          style={{ fill: color }}
        >
          <path
            d="M3 3l7 18 3.5-7.5L21 10z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Partner label pill with live green status dot */}
      <div
        className={`px-2.5 py-1 rounded-full shadow-md border flex items-center gap-1.5 backdrop-blur-xs ${bgColor} ${borderColor}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className={`text-[10px] font-mono font-bold ${textColor}`}>
          {name}
        </span>
        <span className="text-[9px] font-mono text-stone-400">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   1. HERO RETRO 3D PHOTOBOOTH KIOSK & MECHANICAL DISPENSER
   ════════════════════════════════════════════════════════════════════════ */
function HeroPhotoboothDispenser() {
  const [ejectKey, setEjectKey] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const photos = [
    { src: "/booth/couple-heart.jpg", alt: "Heart hands photobooth pose" },
    { src: "/booth/couple-peace.jpg", alt: "Playful peace sign selfie" },
    { src: "/booth/couple-cozy.jpg", alt: "Golden hour cozy couple portrait" },
    { src: "/booth/couple-reunion.jpg", alt: "Airport reunion hug" },
  ];

  const triggerEject = () => {
    setIsFlashing(true);
    playTactileSound("shutter");
    setTimeout(() => {
      setIsFlashing(false);
      playTactileSound("paper");
    }, 240);
    setEjectKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* 3D Vintage Camera Kiosk Dispenser */}
      <div
        onClick={triggerEject}
        className="w-48 sm:w-52 bg-[#FFFDF9] rounded-3xl border-2 border-stone-200 shadow-xl p-3 relative z-20 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-102 active:scale-98"
        title="Click camera to snap and re-print strip!"
      >
        {/* Top ambient lights */}
        <div className="w-full flex items-center justify-between px-1.5 mb-1.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-amber-300" />
          </div>
          <span className="text-[9px] font-mono font-bold text-stone-400 tracking-wider uppercase">
            STUDIO 4-CUT
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>

        {/* Central Camera Lens with Shutter Flash Burst */}
        <div className="w-16 h-16 rounded-full bg-stone-900 border-3 border-stone-300 shadow-inner flex items-center justify-center relative my-0.5 overflow-hidden">
          <div className="w-11 h-11 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-950/80 border border-blue-400/40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40 blur-[1px] -translate-x-0.5 -translate-y-0.5" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />

          {/* Camera Flash Burst Animation */}
          <AnimatePresence>
            {isFlashing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1.8 }}
                exit={{ opacity: 0, scale: 2.2 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0 bg-white rounded-full z-30 pointer-events-none shadow-[0_0_40px_rgba(255,255,255,1)]"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Interactive shutter hint pill */}
        <div className="mt-1 px-2 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[8px] font-mono font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
          <Camera className="w-2.5 h-2.5 text-rose-500" />
          <span>Snap &amp; Print</span>
        </div>

        {/* Printer Dispenser Slot */}
        <div className="w-full mt-2 pt-1.5 border-t border-stone-200 flex flex-col items-center">
          <div className="w-36 h-2 bg-stone-900 rounded-full shadow-inner flex items-center justify-center">
            <div className="w-28 h-0.5 bg-black rounded-full" />
          </div>
        </div>
      </div>

      {/* Emerging 4-Cut Vertical Photo Strip with Mechanical Spring Physics */}
      <motion.div
        key={ejectKey}
        initial={{ y: -160, opacity: 0, scaleY: 0.35 }}
        animate={{ y: 0, opacity: 1, scaleY: 1 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 24,
          mass: 0.85,
        }}
        className="w-40 sm:w-44 bg-white p-2 rounded-b-xl shadow-2xl border-x-2 border-b-2 border-stone-200 relative z-10 -mt-2 space-y-1.5 select-none overflow-hidden"
      >
        {/* Subtle Sweeping Diagonal Gloss Sheen */}
        <motion.div
          key={`sheen-${ejectKey}`}
          initial={{ x: "-120%", y: "-120%" }}
          animate={{ x: "220%", y: "220%" }}
          transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/80 to-transparent pointer-events-none z-30"
        />

        {/* Subtle resting pendulum sway */}
        <motion.div
          animate={{ rotate: [-0.6, 0.6, -0.6] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="space-y-1.5"
        >
          {photos.map((p, idx) => (
            <div
              key={idx}
              className="relative h-13 sm:h-14 rounded-md overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                className="object-cover grayscale contrast-110"
                sizes="180px"
                priority={idx === 0}
              />
              <div className="absolute top-0.5 left-1 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[7px] font-bold">
                0{idx + 1}
              </div>
            </div>
          ))}

          <div className="pt-0.5 text-center border-t border-stone-100 flex items-center justify-between px-1">
            <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest">
              pairfect.site
            </span>
            <span className="text-[8px] font-mono text-rose-500 font-bold">
              ♡ for two
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   2. HERO REALISTIC 3D EARTH GLOBE WITH COORDINATE GRIDS & FLIGHT ARC
   ════════════════════════════════════════════════════════════════════════ */
function HeroGlobeGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 320, damping: 28 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[480px] mx-auto flex items-center justify-center py-6 select-none"
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full flex items-center justify-center"
      >
        {/* Atmospheric Glow Aura Behind Sphere */}
        <div className="absolute w-88 h-88 rounded-full bg-gradient-to-tr from-sky-400/30 via-rose-300/25 to-purple-400/20 blur-3xl pointer-events-none" />

        {/* 3D Realistic Earth Globe Sphere */}
        <div
          style={{ transform: "translateZ(20px)" }}
          className="relative w-76 h-76 sm:w-84 sm:h-84 rounded-full overflow-hidden border-4 border-white/80 shadow-[0_25px_60px_-10px_rgba(20,60,140,0.45)] flex items-center justify-center bg-[radial-gradient(circle_at_35%_28%,#38BDF8_0%,#2563EB_35%,#1E3A8A_65%,#0B132B_100%)]"
        >
          {/* SVG Map Texture with Accurate Continents and Blue Coordinate Grid */}
          <svg viewBox="0 0 400 400" className="w-full h-full object-cover">
            <defs>
              {/* Landmass Shading Gradient */}
              <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="60%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>

              {/* Highland / Mountain Texture Gradient */}
              <linearGradient id="highlandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>

              {/* Glowing Flight Arc Gradient */}
              <linearGradient id="flightArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FF5E8E" />
              </linearGradient>
            </defs>

            {/* Blue Latitude & Longitude Coordinate Grid Lines (Planetary Grids) */}
            <g stroke="#93C5FD" opacity="0.32" strokeDasharray="3 3">
              {/* Equator */}
              <line x1="20" y1="200" x2="380" y2="200" strokeWidth="1.2" opacity="0.5" />
              {/* Latitude 30N & 30S */}
              <path d="M 44 140 Q 200 165 356 140" fill="none" strokeWidth="1" />
              <path d="M 44 260 Q 200 235 356 260" fill="none" strokeWidth="1" />
              {/* Latitude 60N & 60S */}
              <path d="M 110 85 Q 200 105 290 85" fill="none" strokeWidth="0.8" />
              <path d="M 110 315 Q 200 295 290 315" fill="none" strokeWidth="0.8" />
              {/* Meridians (Curved Longitude Ellipses) */}
              <ellipse cx="200" cy="200" rx="60" ry="176" fill="none" strokeWidth="1" />
              <ellipse cx="200" cy="200" rx="120" ry="176" fill="none" strokeWidth="1" />
              <line x1="200" y1="24" x2="200" y2="376" strokeWidth="1.2" opacity="0.5" />
            </g>

            {/* Continents & Landmasses */}
            <g fill="url(#landGrad)" opacity="0.94">
              {/* North America (Alaska, Canada, USA, Mexico, Baja) */}
              <path d="M 40 85 C 55 65 90 55 125 70 C 145 80 155 105 145 130 C 135 150 115 165 85 160 C 65 155 45 135 40 105 Z" />
              <path d="M 125 100 C 150 105 165 125 155 145 C 145 160 120 170 100 165 C 105 145 115 125 125 100 Z" fill="url(#highlandGrad)" />
              {/* Central America & Caribbean */}
              <path d="M 85 160 C 95 175 105 190 115 200 C 110 205 100 195 90 180 Z" />

              {/* South America */}
              <path d="M 110 205 C 135 205 155 225 145 260 C 135 290 115 320 95 330 C 85 325 85 285 95 250 C 100 230 95 215 110 205 Z" />

              {/* Eurasia / Europe & Asia */}
              <path d="M 195 95 C 220 75 270 70 310 90 C 340 105 365 140 350 180 C 335 210 295 230 255 220 C 230 215 210 195 200 165 C 190 135 185 115 195 95 Z" />
              {/* Scandinavian & Siberian Highlands */}
              <path d="M 235 90 C 265 85 295 100 285 125 C 270 145 245 135 235 115 Z" fill="url(#highlandGrad)" />

              {/* Africa */}
              <path d="M 190 165 C 220 160 240 180 235 215 C 230 255 205 290 185 295 C 170 290 165 250 170 215 C 175 190 175 175 190 165 Z" />

              {/* India & Southeast Asia Peninsulas */}
              <path d="M 260 180 C 275 195 285 220 275 235 C 265 235 255 210 250 195 Z" />

              {/* Indonesia & Archipelago Islands */}
              <ellipse cx="270" cy="245" rx="14" ry="5" />
              <ellipse cx="295" cy="255" rx="12" ry="4" />
              <ellipse cx="320" cy="265" rx="10" ry="5" />
              <circle cx="250" cy="240" r="5" />

              {/* Australia */}
              <path d="M 295 285 C 330 280 350 300 345 330 C 330 350 300 350 285 335 C 275 315 280 295 295 285 Z" />

              {/* Japan Archipelago */}
              <path d="M 345 140 Q 355 160 340 175" stroke="url(#landGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Slowly Rotating Translucent Cloud Formations */}
            <g opacity="0.35" fill="#FFFFFF">
              <path d="M 70 110 C 90 95 130 95 150 115 C 130 125 90 125 70 110 Z" />
              <path d="M 220 130 C 250 115 300 120 330 140 C 300 150 250 145 220 130 Z" />
              <path d="M 120 240 C 150 230 190 235 210 250 C 180 260 140 255 120 240 Z" />
              <path d="M 260 210 C 285 200 320 205 340 220 C 315 230 280 225 260 210 Z" />
            </g>

            {/* Glowing Parabolic Flight Trajectory Arc (Jakarta to Calgary) */}
            <path
              d="M 270 245 Q 185 80 100 125"
              fill="none"
              stroke="url(#flightArcGrad)"
              strokeWidth="3"
              strokeDasharray="6 6"
              className="opacity-95"
            />

            {/* City Ping Marker: Jakarta (Cyan/Green Pulse) */}
            <circle cx="270" cy="245" r="4.5" fill="#34D399" />
            <circle cx="270" cy="245" r="8" fill="none" stroke="#34D399" strokeWidth="1.5" className="animate-ping" />

            {/* City Ping Marker: Calgary (Rose/Pink Pulse) */}
            <circle cx="100" cy="125" r="4.5" fill="#FF5E8E" />
            <circle cx="100" cy="125" r="8" fill="none" stroke="#FF5E8E" strokeWidth="1.5" className="animate-ping" />
          </svg>

          {/* Spherical Inner Edge Shadow & Ambient Reflection Sheen */}
          <div className="absolute inset-0 rounded-full shadow-[inset_-16px_-16px_40px_rgba(0,0,0,0.65),inset_16px_16px_35px_rgba(255,255,255,0.35)] pointer-events-none" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none" />
        </div>

        {/* Mascot Soaring Along Flight Path */}
        <div
          style={{ transform: "translateZ(45px)" }}
          className="absolute -top-10 sm:-top-12 z-25 pointer-events-none hidden sm:block"
        >
          <HeartBeansAirplaneMascot className="w-24 h-16 drop-shadow-md" />
        </div>

        {/* Avatar Pin 1: Jakarta Partner (Bottom Left) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ transform: "translateZ(55px)" }}
          className="absolute bottom-2 left-0 sm:-left-4 z-30 flex flex-col items-center group cursor-pointer"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-xl overflow-hidden bg-rose-100">
            <Image
              src="/booth/couple-peace.jpg"
              alt="You"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="mt-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center gap-1.5 text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono font-bold text-stone-900">Jakarta</span>
            <span className="text-[10px] font-mono text-stone-500">ID</span>
          </div>
        </motion.div>

        {/* Avatar Pin 2: Calgary Partner (Top Right) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ transform: "translateZ(55px)" }}
          className="absolute top-2 right-0 sm:-right-4 z-30 flex flex-col items-center group cursor-pointer"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-xl overflow-hidden bg-sky-100">
            <Image
              src="/booth/couple-heart.jpg"
              alt="Partner"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="mt-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center gap-1.5 text-center">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-mono font-bold text-stone-900">Calgary</span>
            <span className="text-[10px] font-mono text-stone-500">CA</span>
          </div>
        </motion.div>

        {/* Centered Photobooth Camera & 4-Cut Strip Hanging Down */}
        <div style={{ transform: "translateZ(65px)" }} className="absolute top-4 z-20">
          <HeroPhotoboothDispenser />
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   3. CURATED ACTIVITIES CAROUSEL SECTION (10 GENUINE PAIRFECT FEATURES)
   ════════════════════════════════════════════════════════════════════════ */
interface ActivityCardData {
  id: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  description: string;
  screenContent: React.ReactNode;
}

/* Cute Floating Player Cursor with Name Pill */
function CuteCursor({
  name,
  color = "pink",
  className = "",
}: {
  name: string;
  color?: "pink" | "blue";
  className?: string;
}) {
  const isPink = color === "pink";
  const arrowColor = isPink ? "#FF5E8E" : "#4F86F7";
  const badgeBorder = isPink ? "border-[#FF5E8E]" : "border-[#4F86F7]";
  const textColor = isPink ? "text-[#FF5E8E]" : "text-[#4F86F7]";

  return (
    <div className={`inline-flex items-center gap-0.5 select-none pointer-events-none drop-shadow-sm ${className}`}>
      <svg width="13" height="16" viewBox="0 0 13 16" fill="none" className="shrink-0 drop-shadow-xs">
        <path
          d="M1 1L11.5 8.5L6 9.5L3 15L1 1Z"
          fill={arrowColor}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-white border shadow-xs ${badgeBorder} ${textColor}`}>
        {name}
      </span>
    </div>
  );
}

function ActivitiesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  const activities: ActivityCardData[] = [
    // 1. How Well Do You Know Me? (Love Match)
    {
      id: "love-match",
      badge: "HOW WELL DO YOU KNOW ME?",
      badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
      title: "How Well Do You Know Me?",
      description: "Answer intimate couple prompts simultaneously. Compare your real thoughts with your partner's guess and celebrate every match.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-white text-stone-900 font-sans text-xs select-none relative overflow-hidden">
          {/* Top Score Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 font-bold flex items-center gap-1.5 shadow-2xs">
              <span>You</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF5E8E] text-white flex items-center justify-center text-[8px] font-black">
                0
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#4F86F7] text-white flex items-center justify-center text-[8px] font-black">
                1
              </span>
              <span>Partner</span>
            </span>
          </div>

          <div className="my-auto space-y-2 text-center">
            <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
              ROUND 1 OF 6
            </p>
            <h4 className="font-heading font-black text-xs text-stone-900 leading-snug px-1">
              What&apos;s something small of yours she wishes she had with her?
            </h4>

            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-black shadow-xs">
                ✓ Matched!
              </span>
            </div>

            {/* Answer Cards */}
            <div className="space-y-2 pt-1 text-left">
              <div className="p-2.5 rounded-xl border-2 border-pink-300 bg-white shadow-2xs relative">
                <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                  HER REAL ANSWER
                </span>
                <p className="font-heading font-black text-xs text-stone-900">
                  your grey hoodie
                </p>
                <CuteCursor name="You" color="pink" className="absolute -bottom-2.5 left-6 z-10" />
              </div>

              <div className="p-2.5 rounded-xl border-2 border-sky-300 bg-white shadow-2xs relative">
                <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                  PARTNER&apos;S GUESS
                </span>
                <p className="font-sans font-medium text-xs text-stone-800">
                  my grey hoodie (she stole it anyway)
                </p>
                <CuteCursor name="Partner" color="blue" className="absolute -bottom-2.5 right-6 z-10" />
              </div>
            </div>

            <div className="pt-1.5 flex items-center justify-between text-[9px] font-mono text-stone-500 px-1">
              <span>💕 1 point of 1 so far</span>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-stone-900 text-white font-mono font-bold text-[9px] shadow-xs hover:bg-stone-800"
              >
                next ▷
              </button>
            </div>
          </div>

          {/* Emoji Reaction Bar */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-around text-base">
            {["😂", "😍", "🥺", "😡", "😭", "🔥"].map((emoji, i) => (
              <span key={i} className="hover:scale-125 transition-transform cursor-pointer">
                {emoji}
              </span>
            ))}
          </div>
        </div>
      ),
    },

    // 2. Virtual Studio Photobooth
    {
      id: "virtual-photobooth",
      badge: "SYNCHRONIZED PHOTOBOOTH",
      badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
      title: "Virtual Studio Photobooth",
      description: "One countdown takes the photo on both your phones, framing your shots in authentic studio 4-cut filmstrips.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-stone-950 text-white font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> STUDIO 4-CUT
            </span>
            <span className="font-bold text-stone-300">Shot 3 of 4</span>
          </div>

          {/* Split Screen Synchronized Live Viewfinder */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 my-auto flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
              {/* You (Jakarta) */}
              <div className="relative rounded-xl overflow-hidden bg-stone-800">
                <Image
                  src="/booth/couple-peace.jpg"
                  alt="You (Jakarta)"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[9px] font-mono text-rose-300 font-bold border border-white/10">
                  Jakarta (You)
                </span>
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[8px] font-mono font-bold text-white uppercase tracking-wider">
                  Live
                </span>
                <CuteCursor name="You" color="pink" className="absolute top-6 left-2 z-10" />
              </div>
              {/* Partner (Calgary) */}
              <div className="relative rounded-xl overflow-hidden bg-stone-800">
                <Image
                  src="/booth/couple-cozy.jpg"
                  alt="Partner (Calgary)"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[9px] font-mono text-sky-300 font-bold border border-white/10">
                  Calgary (Partner)
                </span>
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[8px] font-mono font-bold text-white uppercase tracking-wider">
                  Live
                </span>
                <CuteCursor name="Partner" color="blue" className="absolute top-6 right-2 z-10" />
              </div>
            </div>

            {/* Pulsing Countdown Overlay */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-black/75 backdrop-blur-xs border-2 border-rose-400 flex items-center justify-center font-mono font-black text-2xl text-rose-400 animate-pulse shadow-lg">
              3
            </div>
          </div>

          {/* Filter & Cursors */}
          <div className="space-y-1.5 pt-1 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold">
                  You ↖
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-mono font-bold">
                  Partner ↖
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                Synced live
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-stone-500">
              <span>CLASSIC STUDIO PACK</span>
              <span>AUTO SHUTTER ON</span>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Digital Keepsake Fridge
    {
      id: "keepsake-fridge",
      badge: "MAGNETIC KEEPSAKES",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      title: "Digital Keepsake Fridge",
      description: "Pin photostrips, polaroids, and love reminders on your shared retro enamel fridge door. Arrange freely anytime.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-gradient-to-b from-[#FBF9F5] via-[#F4F0E8] to-[#E9E4D8] text-stone-900 font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-600 border-b border-stone-300/80 pb-1.5">
            <span className="font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Retro Fridge
            </span>
            <span className="text-[9px] font-bold text-stone-500">4°C · FRESH</span>
          </div>

          <div className="my-auto relative h-56 rounded-2xl bg-white/40 border border-stone-300/60 p-2 overflow-hidden flex flex-col justify-between">
            {/* Draggable Post-it */}
            <div className="w-36 p-2 rounded-lg bg-[#FEF08A] border border-amber-300 shadow-md rotate-[-4deg] self-start relative">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs absolute -top-1.5 left-1/2 -translate-x-1/2 border border-white" />
              <p className="font-sans font-bold text-[9px] text-stone-800 leading-snug">
                &ldquo;Don&apos;t forget: FaceTime date at 9pm! Love you ♡&rdquo;
              </p>
              <CuteCursor name="Partner" color="blue" className="absolute -bottom-2 right-1 z-10" />
            </div>

            {/* Draggable Photostrip */}
            <div className="w-28 bg-white border border-stone-300 p-1.5 rounded-sm shadow-md rotate-[3deg] self-end space-y-1 relative">
              <div className="w-3 h-3 rounded-full bg-sky-500 shadow-xs absolute -top-1.5 left-1/2 -translate-x-1/2 border border-white" />
              <div className="relative aspect-4/3 rounded bg-stone-100 overflow-hidden">
                <Image src="/booth/couple-heart.jpg" alt="Photo" fill className="object-cover" />
              </div>
              <div className="relative aspect-4/3 rounded bg-stone-100 overflow-hidden">
                <Image src="/booth/couple-peace.jpg" alt="Photo" fill className="object-cover" />
              </div>
              <p className="text-[7px] font-mono font-bold text-center text-stone-700">PAIRFECT 2026</p>
              <CuteCursor name="You" color="pink" className="absolute -bottom-2 -left-2 z-10" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-200">
            <span>Arrange freely ♡</span>
            <span className="font-bold text-rose-500">Live for Two</span>
          </div>
        </div>
      ),
    },

    // 4. IQ Duel
    {
      id: "iq-duel",
      badge: "LIVE QUIZ DUEL",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      title: "IQ Duel",
      description: "Battle in real-time brain teasers and couple trivia. Buzz in before your partner and see who claims bragging rights.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#1E1B4B] via-[#2E1065] to-[#0F172A] text-white font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold">
              Round 3 of 5
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] animate-pulse">
              ⚡ 00:08
            </span>
          </div>

          <div className="my-auto space-y-2.5 text-center">
            {/* Score Bar */}
            <div className="flex items-center justify-between px-1 text-[10px] font-mono font-bold">
              <span className="text-pink-300">You: 120 pts</span>
              <span className="text-sky-300">Partner: 95 pts</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs text-left space-y-1">
              <span className="text-[8px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                SPEED RIDDLE
              </span>
              <p className="font-heading font-black text-xs text-white leading-snug">
                &ldquo;A plane crashes on the border of the US and Canada. Where do you bury the survivors?&rdquo;
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-left">
              <div className="p-2 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-white font-mono text-[10px] font-bold flex items-center justify-between relative shadow-xs">
                <span>A. You don&apos;t bury survivors!</span>
                <span className="text-emerald-300 text-xs">✓ Fast Lock</span>
                <CuteCursor name="You" color="pink" className="absolute -bottom-2.5 right-6 z-10" />
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/15 text-stone-300 font-mono text-[10px] flex items-center justify-between relative">
                <span>B. In Canada</span>
                <CuteCursor name="Partner" color="blue" className="absolute -top-2.5 right-10 z-10" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-stone-300">
            <span className="text-emerald-400 font-bold">+25 Speed Bonus!</span>
            <span>Live Buzzer Synced</span>
          </div>
        </div>
      ),
    },

    // 5. Botanical Floral Studio (DigiBouquet)
    {
      id: "botanical-studio",
      badge: "BOTANICAL FLORAL STUDIO",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      title: "Botanical Floral Studio",
      description: "Arrange a custom digital bouquet stem by stem with Ecuadorian roses, baby's breath, and silk ribbons that never wilt.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-gradient-to-b from-[#F5FBF6] via-[#EFF8F1] to-[#E3F2E7] text-stone-900 font-sans text-xs select-none">
          {/* Top Status */}
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800">
            <span className="flex items-center gap-1 font-bold">
              <Flower2 className="w-3 h-3 text-emerald-600" /> DigiBouquet
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 font-bold text-[9px]">
              6 Stems Active
            </span>
          </div>

          {/* Central Layered Botanical Bouquet Stage */}
          <div className="relative my-auto flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-44 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute top-2 right-4 text-amber-400 text-xs"
              >
                ✦
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.8 }}
                className="absolute top-8 left-3 text-rose-400 text-xs"
              >
                ✦
              </motion.div>

              {/* Artistic Botanical Bouquet SVG */}
              <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="kraftWrap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EDE2CF" />
                    <stop offset="100%" stopColor="#D5BE9B" />
                  </linearGradient>
                  <linearGradient id="roseRed" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="60%" stopColor="#E11D48" />
                    <stop offset="100%" stopColor="#9F1239" />
                  </linearGradient>
                  <linearGradient id="peonyPink" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF1F2" />
                    <stop offset="50%" stopColor="#FDA4AF" />
                    <stop offset="100%" stopColor="#F43F5E" />
                  </linearGradient>
                </defs>

                {/* Craft paper wrapping fold */}
                <polygon points="36,168 124,168 144,92 16,92" fill="url(#kraftWrap)" stroke="#B89467" strokeWidth="1.2" />
                <polygon points="44,168 116,168 132,104 28,104" fill="#C8AE87" opacity="0.4" />

                {/* Stems */}
                <path d="M 54 110 Q 42 70 50 42" stroke="#3D6647" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M 80 115 Q 80 80 80 48" stroke="#3D6647" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 106 110 Q 118 70 110 42" stroke="#3D6647" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                {/* Eucalyptus leaves */}
                <ellipse cx="44" cy="50" rx="7" ry="5" fill="#68A578" transform="rotate(-25 44 50)" />
                <ellipse cx="52" cy="64" rx="8" ry="6" fill="#4E875E" transform="rotate(-15 52 64)" />
                <ellipse cx="116" cy="50" rx="7" ry="5" fill="#68A578" transform="rotate(25 116 50)" />
                <ellipse cx="108" cy="64" rx="8" ry="6" fill="#4E875E" transform="rotate(15 108 64)" />

                {/* Main Rose (Center) */}
                <circle cx="80" cy="70" r="18" fill="url(#roseRed)" stroke="#881337" strokeWidth="1" />
                <path d="M 70 66 Q 80 60 90 66 Q 88 78 80 78 Q 72 78 70 66" fill="#BE123C" />
                <path d="M 74 68 Q 80 64 86 68 Q 84 74 80 74 Q 76 74 74 68" fill="#FB7185" />
                <circle cx="80" cy="70" r="3" fill="#FFE4E6" />

                {/* Blush Peony (Left) */}
                <circle cx="56" cy="80" r="14" fill="url(#peonyPink)" stroke="#E11D48" strokeWidth="0.8" />
                <circle cx="56" cy="80" r="9" fill="#FB7185" />
                <circle cx="56" cy="80" r="4" fill="#FFF1F2" />

                {/* Sweetheart Rose (Right) */}
                <circle cx="104" cy="80" r="14" fill="url(#peonyPink)" stroke="#E11D48" strokeWidth="0.8" />
                <circle cx="104" cy="80" r="9" fill="#FB7185" />
                <circle cx="104" cy="80" r="4" fill="#FFF1F2" />

                {/* Daisy / Chamomile (Top) */}
                <g transform="translate(80, 38)">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <ellipse
                      key={angle}
                      cx="0"
                      cy="-9"
                      rx="3.2"
                      ry="6.5"
                      fill="#FFFFFF"
                      stroke="#E2E8F0"
                      strokeWidth="0.5"
                      transform={`rotate(${angle})`}
                    />
                  ))}
                  <circle cx="0" cy="0" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
                </g>

                {/* Silk Ribbon Tie */}
                <path d="M 62 128 Q 80 134 98 128" stroke="#E11D48" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="80" cy="130" r="4.5" fill="#BE123C" />
                <path d="M 76 132 Q 68 152 60 162" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 84 132 Q 92 152 100 162" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Note attached to wrapper */}
            <div className="mt-1 px-3 py-1 rounded-lg bg-white/95 border border-emerald-200 shadow-xs text-center">
              <p className="font-heading font-bold text-[10px] text-emerald-950">
                &ldquo;For my favorite person, my forever bloom ♡&rdquo;
              </p>
            </div>
          </div>

          {/* Stem Selector Rack */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[9px] font-mono text-emerald-800 font-bold px-0.5">
              <span>TAP TO ADD STEMS</span>
              <span className="text-rose-600">Partner added Rose 🌹</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { name: "Rose", icon: "🌹", color: "bg-rose-50 border-rose-200" },
                { name: "Daisy", icon: "🌼", color: "bg-amber-50 border-amber-200" },
                { name: "Leaf", icon: "🌿", color: "bg-emerald-50 border-emerald-200" },
                { name: "Ribbon", icon: "🎀", color: "bg-pink-50 border-pink-200" },
              ].map((stem, i) => (
                <div
                  key={i}
                  className={`p-1.5 rounded-xl border text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${stem.color}`}
                >
                  <span className="text-sm block">{stem.icon}</span>
                  <span className="text-[8px] font-mono font-bold text-stone-700">{stem.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // 6. Wax-Sealed Love Letters
    {
      id: "love-letters",
      badge: "TIMELESS ROMANCE",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      title: "Wax-Sealed Love Letters",
      description: "Write letters on textured parchment sealed with custom 3D wax stamps and animated reaction stickers.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FAF6EE] text-stone-900 font-sans text-xs select-none relative overflow-hidden">
          {/* Airmail header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-600 border-b border-stone-300 pb-1.5">
            <span className="font-bold tracking-wider text-rose-700">PAR AVION · AIRMAIL</span>
            <span className="text-[9px] text-stone-500">DELHI ➔ MUMBAI</span>
          </div>

          {/* Parchment letter content */}
          <div className="my-auto space-y-2.5 bg-white/90 p-3 rounded-2xl border border-stone-200 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-stone-400">November 10, 2026</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[8px] font-bold">
                STICKER
              </span>
            </div>
            <p className="font-serif italic text-xs text-stone-800 leading-relaxed">
              &ldquo;I saw the crescent moon tonight and wondered if you are looking at the exact same sky right now... counting every sunrise until we touch hands again.&rdquo;
            </p>

            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-pink-50 border border-pink-200">
              <span className="text-base">🐱</span>
              <span className="text-[9px] font-mono font-bold text-rose-600">
                [Love Hug Sparkles]
              </span>
            </div>
          </div>

          {/* Embossed Crimson Wax Seal */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 via-rose-800 to-red-950 border-2 border-red-500 shadow-md flex items-center justify-center text-white font-serif font-black text-xs rotate-6">
                ♥
              </div>
              <div className="text-left">
                <p className="text-[9px] font-mono font-bold text-stone-800">Wax Sealed</p>
                <p className="text-[8px] font-mono text-stone-400">Tap to break open</p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-rose-600">
              You ✉ Partner
            </span>
          </div>
        </div>
      ),
    },

    // 7. Spotify Mixtape Sync & Cassette Player
    {
      id: "spotify-mixtape",
      badge: "AUDIO SYNC",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      title: "Spotify Mixtape Sync",
      description: "Listen together in lockstep with dual spinning tape reels, handwritten cassette labels, and synced waveform scrubbers.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#18181B] to-[#09090B] text-white font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span className="flex items-center gap-1 font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> Cassette Radio
            </span>
            <span className="text-stone-400">0ms Latency</span>
          </div>

          <div className="my-auto space-y-3">
            <div className="relative h-28 rounded-2xl bg-gradient-to-r from-rose-950/80 via-stone-900 to-sky-950/80 border-2 border-stone-700 p-2.5 flex flex-col justify-between shadow-xl">
              <div className="bg-amber-100 text-stone-900 px-3 py-1 rounded-md text-center border border-amber-300">
                <span className="font-mono font-bold text-[9px] uppercase tracking-wider">
                  Side A · Our Roadtrip Soundtrack
                </span>
              </div>

              <div className="flex items-center justify-center gap-10 py-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-3 border-stone-400 bg-stone-950 flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-white" />
                </motion.div>

                <div className="w-14 h-4 rounded-sm bg-stone-800 border border-stone-600 overflow-hidden flex items-center justify-center">
                  <div className="w-8 h-2 bg-amber-900/60 rounded-full" />
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-3 border-stone-400 bg-stone-950 flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-white" />
                </motion.div>
              </div>
            </div>

            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="truncate">
                  <p className="font-bold text-white truncate">Texas Sun</p>
                  <p className="text-[9px] text-stone-400">Leon Bridges, Khruangbin</p>
                </div>
                <Disc className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>

              <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden relative">
                <div className="w-3/5 h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-stone-500">
                <span>02:14</span>
                <span className="text-emerald-400 font-bold">Both Listening</span>
                <span>04:12</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 pt-1 border-t border-stone-800">
            <span>You 🎧</span>
            <span>Partner 🎧</span>
          </div>
        </div>
      ),
    },

    // 8. Between the Lines (AI Vibe Judge courtroom)
    {
      id: "between-the-lines",
      badge: "AI COURTROOM",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      title: "Between the Lines",
      description: "Bring your playful couples debates before our impartial AI Judge for dramatic courtroom verdicts and peace treaties.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FAF8F5] text-stone-900 font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Scale className="w-3 h-3" /> Courtroom for Two
            </span>
            <span>Case #108</span>
          </div>

          <div className="my-auto space-y-2.5">
            <div className="p-2 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[9px] font-mono text-stone-400 uppercase">THE DISPUTE:</span>
              <p className="font-heading font-bold text-xs text-stone-900 leading-snug">
                &ldquo;Who is responsible for the late night snack raids on call?&rdquo;
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
                ⚖️
              </div>
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] uppercase">
                  VERDICT: 84% GUILTY (Partner)
                </span>
                <p className="text-[10px] font-sans font-medium text-stone-700 leading-tight pt-1">
                  &ldquo;The Court orders Partner to send you surprise dessert on next date night.&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pt-1">
            <span>You: Objection sustained!</span>
            <span className="text-indigo-600 font-bold">Judge AI Presiding</span>
          </div>
        </div>
      ),
    },

    // 9. Gratitude Jar
    {
      id: "gratitude-jar",
      badge: "DAILY RITUAL",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      title: "Gratitude Jar",
      description: "Fold daily origami lucky stars and parchment scrolls into a shared glass jar that grows richer over time.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#FFFDF9] via-[#FEFBF2] to-[#FEF3C7]/30 text-stone-900 font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-800">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Gratitude Jar
            </span>
            <span className="bg-amber-200/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
              Our Star Jar
            </span>
          </div>

          <div className="my-auto relative flex flex-col items-center">
            <div className="relative w-36 h-40 flex items-center justify-center">
              <svg viewBox="0 0 140 160" className="w-full h-full drop-shadow-md">
                <rect x="40" y="8" width="60" height="14" rx="4" fill="#C29A6B" stroke="#9A7447" strokeWidth="1.5" />
                <rect x="46" y="22" width="48" height="6" fill="#8F6B3E" />
                <path
                  d="M 46 28 L 30 50 C 20 65 20 140 30 150 C 40 155 100 155 110 150 C 120 140 120 65 110 50 L 94 28 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.45"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <path d="M 32 60 Q 26 100 32 140" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
                <polygon points="55,130 58,138 66,138 60,143 62,151 55,146 48,151 50,143 44,138 52,138" fill="#FBBF24" />
                <polygon points="85,125 88,133 96,133 90,138 92,146 85,141 78,146 80,138 74,133 82,133" fill="#F43F5E" />
                <polygon points="70,105 73,113 81,113 75,118 77,126 70,121 63,126 65,118 59,113 67,113" fill="#A78BFA" />
                <polygon points="48,95 51,103 59,103 53,108 55,116 48,111 41,116 43,108 37,103 45,103" fill="#34D399" />
                <polygon points="92,95 95,103 103,103 97,108 99,116 92,111 85,116 87,108 81,103 89,103" fill="#38BDF8" />
                <polygon points="70,72 73,80 81,80 75,85 77,93 70,88 63,93 65,85 59,80 67,80" fill="#F472B6" />
              </svg>
            </div>

            <div className="mt-1 p-2.5 rounded-xl bg-white/95 border border-amber-200 shadow-md text-center max-w-[210px]">
              <span className="text-[8px] font-mono text-amber-700 font-bold block uppercase">
                Partner&apos;s Star From Today
              </span>
              <p className="font-sans text-[10px] text-stone-800 leading-snug pt-0.5">
                &ldquo;When you fell asleep on our call and I could just hear you breathing peacefully.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-amber-900 pt-1">
            <span>Fold tomorrow&apos;s star ✦</span>
            <span className="font-bold">Synced Live</span>
          </div>
        </div>
      ),
    },

    // 10. Daily Mood Sanctuary & Distance Compass
    {
      id: "daily-sanctuary",
      badge: "DISTANCE COMPASS",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      title: "Daily Mood Sanctuary",
      description: "Track each other's live local weather, timezones, and emotional battery with synchronized ambient light orbs.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#F0F9FF] via-[#E6F4FE] to-[#DCEEFC] text-stone-900 font-sans text-xs select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-sky-800">
            <span className="font-bold flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-600" /> Connected for Two
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-200/80 font-bold text-[9px]">
              Live Sync
            </span>
          </div>

          <div className="my-auto space-y-2">
            <div className="p-2.5 rounded-2xl bg-white/95 border border-sky-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-stone-900 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Your City
                </span>
                <span className="text-[10px] font-mono font-bold text-stone-700">31°C · Sunny</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-stone-500">Your mood:</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                  Missing you 🥺
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/95 border border-sky-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-stone-900 flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" /> Partner&apos;s City
                </span>
                <span className="text-[10px] font-mono font-bold text-stone-700">18°C · Gentle Breeze</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-stone-500">Partner&apos;s mood:</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                  Warm tea &amp; cozy ☕
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-gradient-to-r from-rose-50 to-sky-50 border border-stone-200 text-center">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-stone-700 pb-1">
                <span>Love Battery</span>
                <span className="text-rose-600">100% Fully Charged ♡</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-rose-500 via-purple-500 to-sky-500" />
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] font-mono text-sky-700 font-bold">
            Synchronized in real-time across both screens
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="activities" className="py-20 px-4 sm:px-6 max-w-[1360px] mx-auto select-none space-y-10 relative">
      {/* Delicate Sky Blue Grid Accent in Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0F2FE_1px,transparent_1px),linear-gradient(to_bottom,#E0F2FE_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 pointer-events-none [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            AUTHENTIC PAIRFECT ACTIVITIES
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
            Pick tonight&apos;s{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              activity.
            </span>
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600 leading-relaxed">
            Real screens from our games and studios. Open a private room, send your partner the 4-digit code, and experience your dates in real-time.
          </p>
        </div>

        {/* Circular Arrow Navigation */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={scrollLeft}
            className="w-11 h-11 rounded-full border border-stone-300 bg-white hover:bg-stone-100 active:scale-95 flex items-center justify-center text-stone-800 shadow-xs transition-all cursor-pointer"
            aria-label="Previous activity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="w-11 h-11 rounded-full border border-stone-300 bg-white hover:bg-stone-100 active:scale-95 flex items-center justify-center text-stone-800 shadow-xs transition-all cursor-pointer"
            aria-label="Next activity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Smartphone Showcase Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none snap-x snap-mandatory relative z-10"
        style={{ scrollbarWidth: "none" }}
      >
        {activities.map((act) => (
          <div
            key={act.id}
            className="snap-start shrink-0 w-[270px] sm:w-[290px] flex flex-col space-y-3 group"
          >
            {/* Realistic Slim Curved Smartphone Frame */}
            <div className="w-full h-[480px] sm:h-[500px] rounded-[44px] bg-stone-950 p-3 shadow-[0_15px_35px_rgba(0,0,0,0.18)] border-4 border-stone-800 relative transition-transform duration-300 group-hover:-translate-y-2">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-900 rounded-full z-20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-stone-800" />
              </div>

              <div className="w-full h-full rounded-[34px] overflow-hidden bg-white relative z-10 pt-5">
                {act.screenContent}
              </div>
            </div>

            {/* Activity Meta Information */}
            <div className="px-2 space-y-1">
              {act.badge && (
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border mb-1 ${act.badgeColor}`}
                >
                  {act.badge}
                </span>
              )}
              <h3 className="font-heading font-black text-lg text-stone-900 group-hover:text-rose-600 transition-colors">
                {act.title}
              </h3>
              <p className="text-xs font-sans text-stone-600 leading-snug">
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA to Browse All */}
      <div className="pt-2 relative z-10">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-stone-900 bg-white hover:bg-stone-900 hover:text-white text-stone-900 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
        >
          <span>Browse all activities ▷</span>
        </Link>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   4. FRESH OUT OF THE BOOTH CLOTHESLINE SECTION
   ════════════════════════════════════════════════════════════════════════ */
/* Realistic SVG Clothespin Clip Component */
function ClothespinClip({ color = "#F59E0B" }: { color?: string }) {
  return (
    <svg width="22" height="34" viewBox="0 0 22 34" fill="none" className="drop-shadow-md z-20 -mb-2 select-none pointer-events-none">
      {/* Upper Pinch Handles */}
      <rect x="5.5" y="0.5" width="4" height="11" rx="1.5" fill={color} stroke="#78350F" strokeWidth="0.8" />
      <rect x="12.5" y="0.5" width="4" height="11" rx="1.5" fill={color} stroke="#78350F" strokeWidth="0.8" />
      {/* Spring wire coil */}
      <circle cx="11" cy="11.5" r="3.2" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
      <circle cx="11" cy="11.5" r="1.5" fill="#94A3B8" />
      {/* Lower clamping jaws gripping wire and strip */}
      <path d="M 5.5 12 L 6 32 C 6 33, 9 33, 9.5 32 L 10 12 Z" fill={color} stroke="#78350F" strokeWidth="0.8" />
      <path d="M 12 12 L 12.5 32 C 13 33, 16 33, 16.5 32 L 16.5 12 Z" fill={color} stroke="#78350F" strokeWidth="0.8" />
      {/* Center jaw shadow gap */}
      <rect x="9.5" y="15" width="3" height="16" fill="#000000" opacity="0.18" />
    </svg>
  );
}

function FreshOutOfTheBoothClothesline() {
  const [isPlaying, setIsPlaying] = useState(true);

  const baseAngles = [-3.2, 2.6, -1.9, 3.4, -2.5, 2.1];
  const clipColors = ["#F43F5E", "#38BDF8", "#F59E0B", "#FB7185", "#10B981", "#64748B"];

  const strips = [
    {
      id: "ticket",
      pegColor: "bg-rose-400",
      content: (
        <div className="w-44 bg-[#F8FAFC] border border-stone-300 p-2.5 rounded-sm shadow-md text-stone-900 font-mono text-[9px] space-y-1.5">
          <div className="border-b border-stone-300 pb-1 flex items-center justify-between">
            <span className="font-bold tracking-wider">BOARDING TICKET</span>
            <span className="text-rose-500 font-bold">YOUR♥HEART</span>
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/couple-heart.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/couple-peace.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/couple-reunion.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 border-t border-dashed border-stone-400 flex items-center justify-between text-[8px] text-stone-500">
            <span>PAIRFECT</span>
            <span className="font-bold text-stone-900">FOR TWO</span>
          </div>
        </div>
      ),
    },
    {
      id: "blue-gingham",
      pegColor: "bg-sky-400",
      content: (
        <div className="w-44 bg-[#E0F2FE] border-2 border-sky-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/couple-peace.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/couple-heart.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/couple-cozy.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-sky-800 font-bold">
            ♡ Pairfect Club · 2026
          </div>
        </div>
      ),
    },
    {
      id: "yellow-polka",
      pegColor: "bg-amber-400",
      content: (
        <div className="w-44 bg-[#FEF3C7] border-2 border-amber-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/couple-cozy.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/couple-peace.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/couple-heart.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-amber-800 font-bold">
            ✿ Sunshine Daze
          </div>
        </div>
      ),
    },
    {
      id: "red-tweed",
      pegColor: "bg-rose-500",
      content: (
        <div className="w-44 bg-[#FFE4E6] border-2 border-rose-400 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/couple-heart.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/couple-cozy.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/couple-peace.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-rose-800 font-bold">
            PAIRFECT · SWEETHEART
          </div>
        </div>
      ),
    },
    {
      id: "sage-green",
      pegColor: "bg-emerald-400",
      content: (
        <div className="w-44 bg-[#DCFCE7] border-2 border-emerald-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/couple-peace.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/couple-heart.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/couple-reunion.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-emerald-800 font-bold">
            🌿 Matcha Afternoon
          </div>
        </div>
      ),
    },
    {
      id: "minimalist",
      pegColor: "bg-stone-800",
      content: (
        <div className="w-44 bg-stone-900 border-2 border-stone-800 p-2 rounded-sm shadow-md text-white space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/couple-cozy.jpg" alt="Pose 1" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/couple-peace.jpg" alt="Pose 2" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/couple-heart.jpg" alt="Pose 3" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-stone-400 font-bold uppercase tracking-widest">
            pairfect.site
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full py-16 bg-gradient-to-b from-[#FFF7F9] via-[#FFFFFF] to-[#F8FAFC] border-y border-stone-200 relative overflow-hidden select-none">
      {/* Subtle Sky Blue Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0F2FE_1px,transparent_1px),linear-gradient(to_bottom,#E0F2FE_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

      {/* Header Container */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            FRESH OUT OF THE PHOTOBOOTH
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            Capture your moments in{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] bg-clip-text text-transparent">
              four-cut filmstrips
            </span>
            .
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600">
            Authentic studio frames designed for two screens. Tap any frame to open the photobooth together.
          </p>
        </div>

        {/* Feature Highlights & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0">
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-stone-700">Dual Sync Shutter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-bold text-stone-700">Custom Frame Packs</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/photo-booth"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open the photobooth ▷</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 shadow-2xs transition-colors cursor-pointer"
              aria-label={isPlaying ? "Pause ticker" : "Play ticker"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-stone-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* The Clothesline Wire and Hanging Strips Container */}
      <div className="relative w-full overflow-hidden pt-4 pb-12 relative z-10">
        {/* Wall Eyelets and Sagging Twine Line */}
        <div className="relative w-full max-w-[1360px] mx-auto px-4 mb-2">
          {/* Left Wall Brass Eyelet */}
          <div className="absolute left-2 top-[22px] w-4 h-4 rounded-full border-2 border-amber-700 bg-amber-200 shadow-xs flex items-center justify-center z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
          </div>
          {/* Braided Twine Cord */}
          <div className="w-full h-[3px] bg-gradient-to-r from-stone-400 via-stone-300 to-stone-400 shadow-[0_2px_4px_rgba(0,0,0,0.15)] relative">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#A8A29E,#A8A29E_3px,#D6D3D1_3px,#D6D3D1_6px)] opacity-60" />
          </div>
          {/* Right Wall Brass Eyelet */}
          <div className="absolute right-2 top-[22px] w-4 h-4 rounded-full border-2 border-amber-700 bg-amber-200 shadow-xs flex items-center justify-center z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
          </div>
        </div>

        <div
          className={`flex items-start gap-12 whitespace-nowrap pl-6 ${isPlaying ? "animate-marquee" : ""}`}
          style={{ width: "max-content" }}
        >
          {strips.concat(strips).map((strip, idx) => {
            const angle = baseAngles[idx % baseAngles.length];
            const clipColor = clipColors[idx % clipColors.length];

            return (
              <div
                key={`${strip.id}-${idx}`}
                className="relative flex flex-col items-center pt-2"
              >
                {/* SVG Clothespin Clip Clamping the Wire and Top Edge */}
                <ClothespinClip color={clipColor} />

                {/* Photo Strip Hanging with Physics Tilt and Breeze Sway */}
                <motion.div
                  style={{ transformOrigin: "top center" }}
                  animate={
                    isPlaying
                      ? {
                          rotate: [angle - 1.2, angle + 1.2, angle - 1.2],
                        }
                      : {
                          rotate: angle,
                        }
                  }
                  transition={{
                    duration: 3.5 + (idx % 3) * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -8,
                    rotate: angle * 0.2,
                    transition: { duration: 0.2 },
                  }}
                  className="relative z-10 transition-shadow drop-shadow-[0_12px_22px_rgba(0,0,0,0.16)]"
                >
                  {strip.content}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   5. INTERACTIVE DRAGGABLE KEEPSAKE FRIDGE SECTION
   ════════════════════════════════════════════════════════════════════════ */
function KeepsakeFridgeSection() {
  const fridgeBoundsRef = useRef<HTMLDivElement>(null);
  const [tidyKey, setTidyKey] = useState(0);

  const handleTidyFridge = () => {
    playTactileSound("click");
    setTidyKey((k) => k + 1);
  };

  return (
    <section className="py-20 px-4 sm:px-6 max-w-[1360px] mx-auto select-none relative">
      {/* Subtle Sky Blue Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0F2FE_1px,transparent_1px),linear-gradient(to_bottom,#E0F2FE_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Copy & Checklist */}
        <div className="lg:col-span-7 space-y-6 max-w-xl">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            SHARED KEEPSAKE SANCTUARY
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            A digital fridge door for{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              your memories
            </span>
            .
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600 leading-relaxed">
            Keep your favorite photostrips, polaroids, and surprise notes pinned on a living magnetic board. Arrange them freely, leave cute reminders, and wake up to what your partner moved.
          </p>

          {/* Checklist with Pink Hearts */}
          <div className="space-y-3 pt-2">
            {[
              "Interactive draggable magnets and polaroids with spring momentum",
              "Pin live photostrips straight from your photobooth dates",
              "Tidy button snaps your keepsakes back into neat alignment anytime",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-stone-800 text-sm font-sans font-medium">
                <span className="text-rose-500 text-base">♡</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Action CTA */}
          <div className="pt-3 space-y-2">
            <Link
              href="/fridge"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <span>Open Keepsake Fridge ▷</span>
            </Link>
            <p className="text-[11px] font-mono text-stone-500">
              Interactive magnetic fridge door · saves automatically in your private room
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Draggable Keepsake Fridge Door */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            ref={fridgeBoundsRef}
            className="relative w-full max-w-[420px] aspect-[4/5] rounded-[36px] bg-gradient-to-b from-[#FBF9F5] via-[#F4F0E8] to-[#E9E4D8] border-4 border-stone-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.22)] p-4 overflow-hidden select-none"
          >
            {/* Top Fridge Brand & Temperature Status Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-300/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-stone-600 tracking-wider uppercase">
                  PAIRFECT RETRO FRIDGE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-stone-500">
                  FRESH · FOR TWO
                </span>
                <button
                  type="button"
                  onClick={handleTidyFridge}
                  className="px-2 py-0.5 rounded-full bg-white border border-stone-300 shadow-2xs hover:bg-stone-100 text-[9px] font-mono font-bold text-stone-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Snap magnets back to default neat placement"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Tidy</span>
                </button>
              </div>
            </div>

            {/* Keepsake Badge Sticker */}
            <div className="absolute top-12 right-4 z-20 px-2.5 py-1 rounded-full bg-gradient-to-tr from-rose-500 to-sky-500 text-white flex items-center gap-1 font-mono shadow-md border border-white rotate-6 pointer-events-none">
              <Sparkle className="w-3 h-3" />
              <span className="text-[8px] uppercase tracking-wider font-bold">KEEPSAKES</span>
            </div>

            {/* Drag Hint Top Pill */}
            <div className="pt-2 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 border border-stone-200 shadow-xs text-[10px] font-mono font-bold text-stone-600">
                <Sparkle className="w-3 h-3 text-rose-500" />
                <span>Drag &amp; arrange magnets on the fridge door!</span>
              </span>
            </div>

            {/* Draggable Surface Area */}
            <div key={tidyKey} className="relative w-full h-[360px] mt-2">
              {/* 1. Classic Monochrome 3-Cut Magnet Strip */}
              <motion.div
                drag
                dragConstraints={fridgeBoundsRef}
                dragElastic={0.15}
                whileDrag={{ scale: 1.08, rotate: 6, zIndex: 40 }}
                whileHover={{ scale: 1.03, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                onDragStart={() => playTactileSound("pop")}
                onDragEnd={() => playTactileSound("click")}
                className="absolute top-4 left-4 w-28 sm:w-32 bg-white p-1.5 rounded-sm shadow-xl border border-stone-300 space-y-1 -rotate-3 cursor-grab select-none z-10"
              >
                <div className="w-4 h-4 mx-auto -mt-3 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 border border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">
                  ♥
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/couple-heart.jpg" alt="Pose 1" fill className="object-cover grayscale contrast-110" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/couple-peace.jpg" alt="Pose 2" fill className="object-cover grayscale contrast-110" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/couple-cozy.jpg" alt="Pose 3" fill className="object-cover grayscale contrast-110" />
                </div>
                <div className="pt-0.5 text-center font-mono text-[7px] font-bold text-stone-500 uppercase">
                  pairfect · magnet 01
                </div>
              </motion.div>

              {/* 2. Pastel Rose 3-Cut Magnet Strip */}
              <motion.div
                drag
                dragConstraints={fridgeBoundsRef}
                dragElastic={0.15}
                whileDrag={{ scale: 1.08, rotate: -6, zIndex: 40 }}
                whileHover={{ scale: 1.03, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                onDragStart={() => playTactileSound("pop")}
                onDragEnd={() => playTactileSound("click")}
                className="absolute top-4 right-6 w-28 sm:w-32 bg-[#FFE4E8] p-1.5 rounded-sm shadow-xl border border-rose-200 space-y-1 rotate-4 cursor-grab select-none z-10"
              >
                <div className="w-4 h-4 mx-auto -mt-3 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-white shadow-md flex items-center justify-center text-[8px] text-amber-900 font-bold">
                  ✿
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/couple-peace.jpg" alt="Pose 1" fill className="object-cover" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/couple-heart.jpg" alt="Pose 2" fill className="object-cover" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/couple-cozy.jpg" alt="Pose 3" fill className="object-cover" />
                </div>
                <div className="pt-0.5 text-center font-mono text-[7px] font-bold text-rose-600">
                  ♡ for our fridge
                </div>
              </motion.div>

              {/* 3. Romantic Couple Polaroid Magnet */}
              <motion.div
                drag
                dragConstraints={fridgeBoundsRef}
                dragElastic={0.15}
                whileDrag={{ scale: 1.1, rotate: 8, zIndex: 40 }}
                whileHover={{ scale: 1.04, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                onDragStart={() => playTactileSound("pop")}
                onDragEnd={() => playTactileSound("click")}
                className="absolute bottom-6 left-6 w-26 bg-white p-2 rounded-xs shadow-xl border border-stone-300 space-y-1.5 -rotate-6 cursor-grab select-none z-15"
              >
                <div className="w-3.5 h-3.5 mx-auto -mt-3.5 rounded-full bg-teal-400 border border-white shadow-xs" />
                <div className="relative aspect-square rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/couple-reunion.jpg" alt="Our Reunion" fill className="object-cover" />
                </div>
                <div className="text-center font-mono text-[7px] font-bold text-stone-700 leading-tight">
                  Our Reunion ♡
                </div>
              </motion.div>

              {/* 4. Yellow Sticky Post-It Love Note */}
              <motion.div
                drag
                dragConstraints={fridgeBoundsRef}
                dragElastic={0.15}
                whileDrag={{ scale: 1.1, rotate: -6, zIndex: 40 }}
                whileHover={{ scale: 1.04, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                onDragStart={() => playTactileSound("pop")}
                onDragEnd={() => playTactileSound("click")}
                className="absolute bottom-8 right-6 w-32 bg-[#FEF9C3] p-2.5 rounded-xs shadow-lg border border-amber-300 space-y-1 rotate-3 cursor-grab select-none z-15"
              >
                <div className="w-3.5 h-3.5 mx-auto -mt-4 rounded-full bg-amber-500 border border-white shadow-xs" />
                <p className="font-heading font-bold text-[9px] text-amber-950">
                  Partner&apos;s Reminder:
                </p>
                <p className="font-mono text-[7px] text-amber-900 leading-snug">
                  • Drink some water 🍵<br />
                  • 10:00 PM Date call<br />
                  • I love you the most ♡
                </p>
              </motion.div>

              {/* 5. Die-Cut CoupleBeans Mascot Magnet */}
              <motion.div
                drag
                dragConstraints={fridgeBoundsRef}
                dragElastic={0.15}
                whileDrag={{ scale: 1.15, rotate: 12, zIndex: 40 }}
                whileHover={{ scale: 1.06, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                onDragStart={() => playTactileSound("pop")}
                onDragEnd={() => playTactileSound("click")}
                className="absolute top-36 left-28 z-20 cursor-grab select-none bg-white/90 p-1.5 rounded-2xl shadow-lg border border-purple-200 flex flex-col items-center"
              >
                <div className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-xs -mt-2.5 mb-0.5" />
                <CoupleBeansMascot className="w-16 h-10" />
                <span className="text-[6px] font-mono font-bold text-purple-700 tracking-wider uppercase">
                  PAIRFECT BEANS
                </span>
              </motion.div>
            </div>

            {/* Fridge Handle Accent */}
            <div className="absolute top-1/3 left-1.5 w-1.5 h-28 rounded-full bg-gradient-to-r from-stone-400 via-stone-300 to-stone-200 shadow-md border border-stone-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   6. PRIVATE & ENCRYPTED SANCTUARY SECTION
   ════════════════════════════════════════════════════════════════════════ */
function PrivateSanctuarySection() {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-[1100px] mx-auto select-none">
      <div className="rounded-3xl bg-gradient-to-br from-[#FFF5F8] via-white to-[#F0F7FF] border border-stone-200 shadow-md p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        {/* Subtle Sky Blue Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0F2FE_1px,transparent_1px),linear-gradient(to_bottom,#E0F2FE_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

        <div className="space-y-3 max-w-xl relative z-10">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            PRIVATE &amp; ENCRYPTED
          </p>
          <h3 className="text-2xl sm:text-4xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            Just the two of you,{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              no third wheels
            </span>
            .
          </h3>
          <p className="text-xs sm:text-sm font-sans text-stone-600 leading-relaxed">
            Invite-only rooms, end-to-end encrypted letters and whispers, zero public feeds, and zero ads. Your relationship belongs to you, not an algorithm.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 relative z-10">
          <Link
            href="/onboarding"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Open Your Room ▷
          </Link>
          <p className="text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
            <span>🔒</span> Private 4-digit room code
          </p>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   7. FAQ ACCORDION SECTION
   ════════════════════════════════════════════════════════════════════════ */
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What games and activities can we experience on Pairfect?",
      a: "Pairfect features a rich suite of live shared activities: the synchronized 4-cut online photobooth, Botanical Floral Studio, Wax-Sealed Love Letters, IQ Duel, Between the Lines courtroom, Gratitude Jar, Spotify Mixtape Sync, Daily Mood Sanctuary, Love Roulette, Collaborative Canvas, Love Match, Riddle Night, and more. All activities run live in your private room at the exact same moment, so you are playing together in real-time, not texting back and forth.",
    },
    {
      q: "Is Pairfect free to play together?",
      a: "Yes, core activities, live games, and the online photobooth are free to enjoy together. We offer a Plus membership for couples who want unlimited high-definition photo downloads, custom sticker packs, and exclusive date themes.",
    },
    {
      q: "How does a real-time online date work?",
      a: "One partner creates a room and receives a private 4-digit code. Share the code or invite link with your partner. The instant they join, both your screens connect in real-time: you can see each other's live poses, drawing strokes, answers, and quiz choices as they happen.",
    },
    {
      q: "Do we need to install an app from an app store?",
      a: "No installation is required. Pairfect is a fast, responsive web application that works directly inside any mobile or desktop browser (Safari, Chrome, Firefox, Edge). You can also add it to your phone home screen with one tap for a full-screen native experience.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-[880px] mx-auto select-none space-y-10">
      <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
        Questions couples ask.
      </h2>

      <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left group cursor-pointer"
              >
                <span className="font-heading font-bold text-base sm:text-lg text-stone-900 group-hover:text-rose-600 transition-colors">
                  {faq.q}
                </span>
                <span className="text-stone-400 group-hover:text-stone-900 font-mono text-sm ml-4">
                  {isOpen ? "×" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   8. MAIN EXPORT: LANDING CONTENT COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function LandingContent() {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-white text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">

      {/* Top Announcement Ribbon with Pink to Blue Flow */}
      {isBannerVisible && (
        <div className="w-full bg-gradient-to-r from-[#FF6B8B] via-[#DF7BFE] to-[#4F86F7] text-white py-2 px-4 shadow-xs relative z-50 select-none">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-mono">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-stone-900 shadow-xs">
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] uppercase">
                PAIRFECT
              </span>
              <span className="font-medium text-[11px]">
                A private digital sanctuary for you and your favorite person
              </span>
              <Link
                href="/play"
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-0.5"
              >
                <span>explore</span>
                <span>&gt;</span>
              </Link>
            </div>

            <div className="hidden md:inline-flex items-center gap-1.5 text-white/90 text-xs font-medium ml-4">
              <span>♡</span>
              <span>Real dates, letters &amp; games for couples</span>
            </div>

            <button
              type="button"
              onClick={() => setIsBannerVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Clean White Sticky Navbar with Pairfect Logo */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo with official Pairfect emblem and dots */}
          <Link href="/" className="flex items-center gap-2.5 group select-none shrink-0">
            <Image
              src="/logo-book.png"
              alt="Pairfect Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain shadow-xs transition-transform group-hover:scale-105"
              priority
            />
            <span className="font-heading font-black text-2xl tracking-tight text-stone-900 group-hover:text-rose-600 transition-colors">
              pairfect
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E8E] group-hover:scale-125 transition-transform" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F86F7] group-hover:scale-125 transition-transform" />
            </div>
          </Link>

          {/* Navigation Links (Shop and 30s Film removed) */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">
            <a href="#activities" className="hover:text-stone-900 transition-colors">
              Activities
            </a>
            <Link href="/photo-booth" className="hover:text-stone-900 transition-colors">
              Photobooth
            </Link>
            <Link href="/whisper" className="hover:text-stone-900 transition-colors">
              Radio
            </Link>
            <Link href="/bouquet" className="hover:text-stone-900 transition-colors">
              Bouquets
            </Link>
            <Link href="/love-letter" className="hover:text-stone-900 transition-colors">
              Letters
            </Link>
            <a href="#faq" className="hover:text-stone-900 transition-colors">
              FAQ
            </a>
            <Link href="/profile" className="hover:text-stone-900 transition-colors flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </nav>

          {/* Right Action: Sign In & Browse Activities Gradient Pill */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-xs font-mono font-bold text-stone-600 hover:text-stone-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/play"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Browse activities ▷</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Pink-White Flow & Subtle Blue Grid Pattern */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16">
        {/* Pink & White Flow Ambient Background with Sky-Blue Precision Grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[560px] bg-gradient-to-b from-[#FFF0F4] via-[#FFF9FA] to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0F2FE_1px,transparent_1px),linear-gradient(to_bottom,#E0F2FE_1px,transparent_1px)] bg-[size:32px_32px] opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Column: Headlines, Interactive Cursors, CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left relative">

              {/* Top Pill Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>DIGITAL SANCTUARY · FOR TWO</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-300 text-sky-700 bg-sky-50/70 font-mono text-xs">
                  <span>✨</span>
                  <span>Real-time dates, letters &amp; photobooth</span>
                  <span>✨</span>
                </div>
              </div>

              {/* H1 with Gradient & Interactive Floating Partner Cursors */}
              <div className="relative">
                <h1 className="text-4xl sm:text-6xl md:text-[4.4rem] font-heading font-black text-stone-900 tracking-tight leading-[1.05]">
                  A Private Sanctuary for{" "}
                  <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
                    Two Hearts
                  </span>
                </h1>

                {/* Live Partner Cursor 1: "You" (Rose/Pink) with Expanding Heart Ripples */}
                <HeroLiveCursor
                  name="You"
                  label="Online ♡"
                  color="#FF5E8E"
                  textColor="text-rose-700"
                  bgColor="bg-white/95"
                  borderColor="border-rose-200"
                  initialPos={{ x: 0, y: 0 }}
                  pathX={[0, 24, 10, 28, 0]}
                  pathY={[0, -14, -24, -8, 0]}
                  duration={4.8}
                  className="top-1/2 left-32 sm:left-48"
                />
              </div>

              {/* Genuine Pairfect Subtitle */}
              <p className="text-base sm:text-lg font-sans text-stone-600 leading-relaxed max-w-xl">
                Love deserves better than an endless chat history. Pairfect gives you and your partner a private sanctuary to snap photobooth strips, arrange digital bouquets, write wax-sealed letters, and play real-time games together.
              </p>

              {/* Dual CTAs with "Partner" Cursor */}
              <div className="relative pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#activities"
                    className="px-6 sm:px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Pick an activity ▷</span>
                  </a>
                  <Link
                    href="/photo-booth"
                    className="px-6 sm:px-7 py-3.5 rounded-xl border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-900 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Open the photobooth
                  </Link>
                </div>

                {/* Live Partner Cursor 2: "Partner" (Sky Blue) with Expanding Heart Ripples */}
                <HeroLiveCursor
                  name="Partner"
                  label="Connected ♡"
                  color="#4F86F7"
                  textColor="text-sky-700"
                  bgColor="bg-white/95"
                  borderColor="border-sky-200"
                  initialPos={{ x: 0, y: 0 }}
                  pathX={[0, -22, -8, -26, 0]}
                  pathY={[0, 14, 24, 8, 0]}
                  duration={5.2}
                  className="-bottom-6 left-60 sm:left-72"
                />
              </div>

              {/* Platform Availability (Web Application with zero install) */}
              <div className="pt-6 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-stone-500">
                  <span className="font-bold text-stone-700">WORKS EVERYWHERE</span>
                  <span className="flex items-center gap-1 text-stone-700 font-medium">
                    <Globe className="w-3.5 h-3.5 text-sky-500" /> Web Browser · Safari, Chrome &amp; Edge
                  </span>
                  <span>·</span>
                  <span className="text-rose-600 font-medium">Zero install required</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E8E]" /> you
                  </span>
                  <span>+</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4F86F7]" /> partner
                  </span>
                  <span>=</span>
                  <span className="text-stone-700 font-bold">one synchronized room</span>
                </div>
              </div>

            </div>

            {/* Right Column: Realistic 3D Earth Globe with Flight Arc & Emerging Photostrip Dispenser */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroGlobeGraphic />
            </div>

          </div>
        </div>
      </section>

      {/* Curated Activities Carousel Section (10 Genuine Features) */}
      <ActivitiesCarousel />

      {/* Fresh Out of The Booth Clothesline */}
      <FreshOutOfTheBoothClothesline />

      {/* Interactive Draggable Keepsake Fridge */}
      <KeepsakeFridgeSection />

      {/* Private & Encrypted Sanctuary Section */}
      <PrivateSanctuarySection />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* Clean Footer with Pairfect Logo */}
      <footer className="border-t border-stone-200 py-10 px-4 sm:px-8 bg-white select-none">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo with official Pairfect emblem */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-book.png"
              alt="Pairfect Logo"
              width={26}
              height={26}
              className="rounded-md object-contain"
            />
            <span className="font-heading font-black text-xl tracking-tight text-stone-900">
              pairfect
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF5E8E]" />
              <span className="w-2 h-2 rounded-full bg-[#4F86F7]" />
            </div>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-500 font-mono">
            <Link href="/blog" className="hover:text-stone-900 transition-colors">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">
              Terms &amp; Conditions
            </Link>
            <a href="mailto:contact@pairfect.site" className="hover:text-stone-900 transition-colors">
              contact@pairfect.site
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-stone-400 font-mono">
              pairfect.site · your private relationship sanctuary
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
