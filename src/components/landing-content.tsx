"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera, Heart, Smile, Check, ChevronRight, ChevronLeft,
  Volume2, VolumeX, ArrowRight, Lock, Shield, Zap, Play, Pause, Flame,
  Gift, Mail, Clock, Download, Star, HelpCircle, X,
  CheckCircle2, Award, Smartphone, Brain, Disc, Archive,
  Tv, Sparkles, RotateCw, Mic, Send, Radio, Flower2, Printer,
  Users, Plane, Globe, Laptop, ShoppingBag, User, ExternalLink,
  RefreshCw, Compass, Music, CloudSun, Scale, Bookmark, Palette,
  Sun, Snowflake, MessageSquare, Sparkle
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform
} from "framer-motion";
import { CoupleBeansMascot, HeartBeansAirplaneMascot } from "@/components/couple-mascot";

/* Easing curve for motion system */
const EASE_CUBIC = [0.22, 0.61, 0.36, 1] as const;

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
    // Ignore audio autoplay restrictions
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

        {/* Expanding Heart Ripple 2 (staggered phase) */}
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
   1. HERO RETRO 3D PHOTOBOOTH KIOSK & MECHANICAL SPRING DISPENSER
   ════════════════════════════════════════════════════════════════════════ */
function HeroPhotoboothDispenser() {
  const [ejectKey, setEjectKey] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const photos = [
    { src: "/booth/monkey-heart.jpg", alt: "Heart hands pose" },
    { src: "/booth/monkey-point.jpg", alt: "Pointing at each other pose" },
    { src: "/booth/monkey-shock.jpg", alt: "Surprise gasp pose" },
    { src: "/booth/monkey-heart.jpg", alt: "Cheek squeeze pose" },
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
        {/* Subtle Sweeping Diagonal Gloss Sheen Reflection */}
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
   2. HERO 3D GLOBE WITH FLIGHT ARC, 3D TILT & PINNED COUPLE AVATARS
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
        {/* Atmospheric Glow Circle Behind Globe */}
        <div className="absolute w-84 h-84 rounded-full bg-gradient-to-tr from-sky-200/50 via-rose-100/40 to-purple-200/40 blur-2xl pointer-events-none" />

        {/* Earth Globe Sphere */}
        <div
          style={{ transform: "translateZ(20px)" }}
          className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-[#4F86F7] via-[#2F6AE3] to-[#1C44A6] shadow-[0_20px_50px_rgba(47,106,227,0.35)] overflow-hidden border-4 border-white/60 flex items-center justify-center"
        >
          {/* Continents SVG Texture Layer */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full object-cover opacity-85 scale-125"
            fill="#34D399"
          >
            {/* North America */}
            <path
              d="M 60 70 Q 110 50 140 80 Q 170 110 150 160 Q 120 180 80 150 Q 50 110 60 70 Z"
              fill="#48BB78"
              opacity="0.9"
            />
            {/* Asia & Indonesia */}
            <path
              d="M 230 140 Q 280 120 330 150 Q 360 210 320 260 Q 260 280 220 220 Q 210 170 230 140 Z"
              fill="#38A169"
              opacity="0.9"
            />
            {/* Island arcs */}
            <circle cx="210" cy="270" r="10" fill="#48BB78" />
            <circle cx="240" cy="290" r="8" fill="#48BB78" />
            <circle cx="270" cy="300" r="12" fill="#48BB78" />
          </svg>

          {/* Flight Trajectory Curved Arc */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
            <path
              d="M 90 230 Q 160 90 240 120"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="opacity-90"
            />
            {/* Tiny Plane indicator moving along arc */}
            <circle cx="165" cy="140" r="4" fill="#FFFFFF" className="animate-ping" />
          </svg>

          {/* Globe Shine Glare */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
        </div>

        {/* Mascot Soaring Along Flight Path */}
        <div
          style={{ transform: "translateZ(45px)" }}
          className="absolute -top-10 sm:-top-12 z-25 pointer-events-none hidden sm:block"
        >
          <HeartBeansAirplaneMascot className="w-24 h-16 drop-shadow-md" />
        </div>

        {/* Avatar Pin 1: Jakarta, Indonesia (Bottom Left) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ transform: "translateZ(55px)" }}
          className="absolute bottom-2 left-0 sm:-left-4 z-30 flex flex-col items-center group cursor-pointer"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-xl overflow-hidden bg-rose-100">
            <Image
              src="/booth/monkey-point.jpg"
              alt="Jakarta Partner"
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

        {/* Avatar Pin 2: Calgary, Canada (Top Right) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ transform: "translateZ(55px)" }}
          className="absolute top-2 right-0 sm:-right-4 z-30 flex flex-col items-center group cursor-pointer"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-xl overflow-hidden bg-sky-100">
            <Image
              src="/booth/monkey-heart.jpg"
              alt="Calgary Partner"
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
    // 1. Botanical Floral Studio (DigiBouquet)
    {
      id: "botanical-studio",
      badge: "NEW BOTANICAL STUDIO",
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
              {/* Petal sparkles */}
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

              {/* Hand-drawn layered bouquet SVG */}
              <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
                {/* Kraft paper wrapper cone */}
                <polygon points="40,165 120,165 140,95 20,95" fill="#D7B58B" stroke="#B89467" strokeWidth="1.5" />
                <polygon points="50,165 110,165 130,105 30,105" fill="#E4C8A3" opacity="0.6" />

                {/* Silk Ribbon Bow */}
                <path d="M 65 130 Q 80 136 95 130" stroke="#F43F5E" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="80" cy="132" r="4" fill="#E11D48" />
                <path d="M 76 134 Q 70 152 64 160" stroke="#F43F5E" strokeWidth="3" fill="none" />
                <path d="M 84 134 Q 90 152 96 160" stroke="#F43F5E" strokeWidth="3" fill="none" />

                {/* Eucalyptus Stems */}
                <path d="M 50 100 Q 35 60 45 35" stroke="#4B7B58" strokeWidth="2.5" fill="none" />
                <ellipse cx="40" cy="48" rx="6" ry="4" fill="#68A578" />
                <ellipse cx="48" cy="62" rx="7" ry="5" fill="#68A578" />

                {/* Ecuadorian Roses */}
                <circle cx="80" cy="65" r="16" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.5" />
                <circle cx="80" cy="65" r="10" fill="#FB7185" />
                <circle cx="80" cy="65" r="5" fill="#FFE4E6" />

                <circle cx="106" cy="78" r="13" fill="#FDA4AF" stroke="#F43F5E" strokeWidth="1.2" />
                <circle cx="106" cy="78" r="8" fill="#FFF1F2" />

                <circle cx="56" cy="78" r="13" fill="#FB7185" stroke="#E11D48" strokeWidth="1.2" />
                <circle cx="56" cy="78" r="8" fill="#FFE4E6" />

                {/* Chamomile Daisy */}
                <circle cx="80" cy="40" r="6" fill="#FBBF24" />
                <ellipse cx="80" cy="28" rx="3" ry="6" fill="#FFFFFF" />
                <ellipse cx="80" cy="52" rx="3" ry="6" fill="#FFFFFF" />
                <ellipse cx="68" cy="40" rx="6" ry="3" fill="#FFFFFF" />
                <ellipse cx="92" cy="40" rx="6" ry="3" fill="#FFFFFF" />
                <ellipse cx="72" cy="32" rx="5" ry="3" fill="#FFFFFF" />
                <ellipse cx="88" cy="32" rx="5" ry="3" fill="#FFFFFF" />
                <ellipse cx="72" cy="48" rx="5" ry="3" fill="#FFFFFF" />
                <ellipse cx="88" cy="48" rx="5" ry="3" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Note attached to wrapper */}
            <div className="mt-1 px-3 py-1 rounded-lg bg-white/95 border border-emerald-200 shadow-xs text-center">
              <p className="font-heading font-bold text-[10px] text-emerald-950">
                &ldquo;For Angie, my forever bloom ♡&rdquo;
              </p>
            </div>
          </div>

          {/* Stem Selector Rack */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[9px] font-mono text-emerald-800 font-bold px-0.5">
              <span>TAP TO ADD STEMS</span>
              <span className="text-rose-600">Angie added Rose 🌹</span>
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

    // 2. Korean 인생네컷 Virtual Photobooth
    {
      id: "korean-photobooth",
      badge: "#1 MOST PLAYED",
      badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
      title: "Korean 인생네컷 Photobooth",
      description: "One countdown takes the photo on both your phones, framing your shots in authentic Seoul studio 4-cut filmstrips.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-stone-950 text-white font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> 인생네컷
            </span>
            <span className="font-bold text-stone-300">Shot 3 of 4</span>
          </div>

          {/* Split Screen Synchronized Live Viewfinder */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 my-auto flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
              {/* You (Jakarta) */}
              <div className="relative rounded-xl overflow-hidden bg-stone-800">
                <Image
                  src="/booth/monkey-heart.jpg"
                  alt="You"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-rose-300 font-bold">
                  Jakarta (You)
                </span>
                <span className="absolute top-1 right-1 text-xs">🎀</span>
              </div>
              {/* Partner (Calgary) */}
              <div className="relative rounded-xl overflow-hidden bg-stone-800">
                <Image
                  src="/booth/monkey-point.jpg"
                  alt="Partner"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-sky-300 font-bold">
                  Calgary (Angie)
                </span>
                <span className="absolute top-1 right-1 text-xs">✨</span>
              </div>
            </div>

            {/* Pulsing Countdown Overlay */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-black/75 backdrop-blur-xs border-2 border-rose-400 flex items-center justify-center font-mono font-black text-2xl text-rose-400 animate-pulse shadow-lg">
              3
            </div>
          </div>

          {/* Y2K Filter and Cursors */}
          <div className="space-y-1.5 pt-1 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold">
                  Angie ↖
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-mono font-bold">
                  Alden ↖
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                98% pose sync
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-stone-500">
              <span>COQUETTE BOWS PACK</span>
              <span>AUTO SHUTTER ON</span>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Wax-Sealed Love Letters with GIPHY stickers
    {
      id: "love-letters",
      badge: "TIMELESS ROMANCE",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      title: "Wax-Sealed Love Letters",
      description: "Write letters on textured parchment sealed with custom 3D wax stamps and animated GIPHY reaction stickers.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FAF6EE] text-stone-900 font-sans text-xs select-none relative overflow-hidden">
          {/* Airmail header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-600 border-b border-stone-300 pb-1.5">
            <span className="font-bold tracking-wider text-rose-700">PAR AVION · AIRMAIL</span>
            <span className="text-[9px] text-stone-500">YVR ➔ CGK</span>
          </div>

          {/* Parchment letter content */}
          <div className="my-auto space-y-2.5 bg-white/90 p-3 rounded-2xl border border-stone-200 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-stone-400">November 10, 2026</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[8px] font-bold">
                GIPHY STICKER
              </span>
            </div>
            <p className="font-serif italic text-xs text-stone-800 leading-relaxed">
              &ldquo;I saw the crescent moon tonight and wondered if you are looking at the exact same sky from Calgary... counting every sunrise until we touch hands again.&rdquo;
            </p>

            {/* Cute GIPHY Reaction Sticker Badge */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-pink-50 border border-pink-200">
              <span className="text-base">🐱</span>
              <span className="text-[9px] font-mono font-bold text-rose-600">
                [GIPHY: Love Hug Sparkles]
              </span>
            </div>
          </div>

          {/* Embossed Crimson Wax Seal */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 via-rose-800 to-red-950 border-2 border-red-500 shadow-md flex items-center justify-center text-white font-serif font-black text-xs rotate-6">
                A&amp;A
              </div>
              <div className="text-left">
                <p className="text-[9px] font-mono font-bold text-stone-800">Wax Sealed</p>
                <p className="text-[8px] font-mono text-stone-400">Tap to break open</p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-rose-600">
              Alden ✉ Angie
            </span>
          </div>
        </div>
      ),
    },

    // 4. IQ Duel (live simultaneous puzzle battle)
    {
      id: "iq-duel",
      badge: "SIMULTANEOUS BATTLE",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      title: "IQ Duel",
      description: "Solve progressive Raven matrix puzzles on the exact same timer. Watch each other's streak climb in real-time.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-white text-stone-900 font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span>Pattern 4 of 10</span>
            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              14.8s left
            </span>
          </div>

          {/* Head to Head Score Bar */}
          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-center">
              <span className="text-[9px] font-mono text-sky-700 font-bold block">Alden</span>
              <span className="font-heading font-black text-sm text-sky-900">420 pts</span>
              <span className="text-[8px] font-mono text-sky-600 block">Streak 🔥 3</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[9px] font-mono text-rose-700 font-bold block">Angie</span>
              <span className="font-heading font-black text-sm text-rose-900">480 pts</span>
              <span className="text-[8px] font-mono text-rose-600 block">Streak 🔥 4</span>
            </div>
          </div>

          {/* 3x3 Raven Matrix Grid */}
          <div className="my-auto text-center space-y-2">
            <p className="font-heading font-bold text-xs text-stone-900">
              Which shape completes the sequence?
            </p>
            <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto p-1.5 rounded-xl bg-stone-100 border border-stone-200">
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">■</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">●</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">▲</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">●</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">▲</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">■</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">▲</span>
              <span className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold">■</span>
              <span className="w-8 h-8 rounded bg-rose-500 text-white flex items-center justify-center font-bold font-mono animate-pulse">?</span>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-[10px] font-mono pt-1">
            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Angie locked in C ✓
            </span>
            <span className="text-stone-400">Locking in...</span>
          </div>
        </div>
      ),
    },

    // 5. Between the Lines (AI Vibe Judge courtroom verdicts)
    {
      id: "between-the-lines",
      badge: "AI COURTROOM",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      title: "Between the Lines",
      description: "Bring your playful couples debates before our impartial AI Judge for dramatic courtroom verdicts and peace treaties.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FAF8F5] text-stone-900 font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Scale className="w-3 h-3" /> Courtroom for Two
            </span>
            <span>Case #108</span>
          </div>

          {/* Case subject and verdict */}
          <div className="my-auto space-y-2.5">
            <div className="p-2 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[9px] font-mono text-stone-400 uppercase">THE DISPUTE:</span>
              <p className="font-heading font-bold text-xs text-stone-900 leading-snug">
                &ldquo;Who is responsible for the 2:00 AM snack raids on FaceTime?&rdquo;
              </p>
            </div>

            {/* AI Judge Gavel and Verdict Card */}
            <div className="p-3 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
                ⚖️
              </div>
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] uppercase">
                  VERDICT: 84% GUILTY (Alden)
                </span>
                <p className="text-[10px] font-sans font-medium text-stone-700 leading-tight pt-1">
                  &ldquo;The Court orders Alden to DoorDash Angie her favorite brown sugar boba immediately.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Reaction */}
          <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pt-1">
            <span>Angie: Objection sustained!</span>
            <span className="text-indigo-600 font-bold">Judge AI Presiding</span>
          </div>
        </div>
      ),
    },

    // 6. Gratitude Jar (origami notes floating in glass jar)
    {
      id: "gratitude-jar",
      badge: "DAILY RITUAL",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      title: "Gratitude Jar",
      description: "Fold daily origami lucky stars and parchment scrolls into a shared glass jar that grows richer over time.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#FFFDF9] via-[#FEFBF2] to-[#FEF3C7]/30 text-stone-900 font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-800">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Gratitude Jar
            </span>
            <span className="bg-amber-200/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
              148 Stars
            </span>
          </div>

          {/* Apothecary Glass Jar Graphic with Folded Stars */}
          <div className="my-auto relative flex flex-col items-center">
            {/* Glass Jar SVG */}
            <div className="relative w-36 h-40 flex items-center justify-center">
              <svg viewBox="0 0 140 160" className="w-full h-full drop-shadow-md">
                {/* Cork lid */}
                <rect x="40" y="8" width="60" height="14" rx="4" fill="#C29A6B" stroke="#9A7447" strokeWidth="1.5" />
                <rect x="46" y="22" width="48" height="6" fill="#8F6B3E" />
                {/* Glass bottle container */}
                <path
                  d="M 46 28 L 30 50 C 20 65 20 140 30 150 C 40 155 100 155 110 150 C 120 140 120 65 110 50 L 94 28 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.45"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                {/* Glass reflection highlight */}
                <path d="M 32 60 Q 26 100 32 140" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />

                {/* Floating Colorful Origami Stars */}
                <polygon points="55,130 58,138 66,138 60,143 62,151 55,146 48,151 50,143 44,138 52,138" fill="#FBBF24" />
                <polygon points="85,125 88,133 96,133 90,138 92,146 85,141 78,146 80,138 74,133 82,133" fill="#F43F5E" />
                <polygon points="70,105 73,113 81,113 75,118 77,126 70,121 63,126 65,118 59,113 67,113" fill="#A78BFA" />
                <polygon points="48,95 51,103 59,103 53,108 55,116 48,111 41,116 43,108 37,103 45,103" fill="#34D399" />
                <polygon points="92,95 95,103 103,103 97,108 99,116 92,111 85,116 87,108 81,103 89,103" fill="#38BDF8" />
                <polygon points="70,72 73,80 81,80 75,85 77,93 70,88 63,93 65,85 59,80 67,80" fill="#F472B6" />
              </svg>
            </div>

            {/* Unfolded Star Note Popup */}
            <div className="mt-1 p-2.5 rounded-xl bg-white/95 border border-amber-200 shadow-md text-center max-w-[210px]">
              <span className="text-[8px] font-mono text-amber-700 font-bold block uppercase">
                Angie&apos;s Star From Today
              </span>
              <p className="font-sans text-[10px] text-stone-800 leading-snug pt-0.5">
                &ldquo;When you fell asleep on our call and I could just hear you breathing peacefully.&rdquo;
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between text-[9px] font-mono text-amber-900 pt-1">
            <span>Fold tomorrow&apos;s star ✦</span>
            <span className="font-bold">2/2 Synced</span>
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
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span className="flex items-center gap-1 font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> Cassette Radio
            </span>
            <span className="text-stone-400">0ms Latency</span>
          </div>

          {/* Retro Audio Cassette Tape Graphic with Spinning Reels */}
          <div className="my-auto space-y-3">
            <div className="relative h-28 rounded-2xl bg-gradient-to-r from-rose-950/80 via-stone-900 to-sky-950/80 border-2 border-stone-700 p-2.5 flex flex-col justify-between shadow-xl">
              {/* Handwritten Label */}
              <div className="bg-amber-100 text-stone-900 px-3 py-1 rounded-md text-center border border-amber-300">
                <p className="font-mono font-bold text-[10px] tracking-tight">
                  SIDE A: Late Night Drives With You
                </p>
              </div>

              {/* Dual Spinning Cassette Wheels */}
              <div className="flex items-center justify-around px-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-3 border-stone-400 bg-stone-950 flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-white" />
                </motion.div>

                {/* Center magnetic tape window */}
                <div className="w-14 h-6 rounded-md bg-stone-950/90 border border-stone-600 flex items-center justify-center">
                  <div className="w-10 h-2 bg-amber-900/60 rounded-full" />
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

            {/* Track Info & Synced Audio Scrubber */}
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="truncate">
                  <p className="font-bold text-white truncate">Texas Sun</p>
                  <p className="text-[9px] text-stone-400">Leon Bridges, Khruangbin</p>
                </div>
                <Disc className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>

              {/* Scrubber */}
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

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 pt-1 border-t border-stone-800">
            <span>Angie 🎧</span>
            <span>Alden 🎧</span>
          </div>
        </div>
      ),
    },

    // 8. Daily Mood Sanctuary & Weather Sync
    {
      id: "daily-sanctuary",
      badge: "DISTANCE COMPASS",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      title: "Daily Mood Sanctuary",
      description: "Track each other's live local weather, timezones, and emotional battery with synchronized ambient light orbs.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#F0F9FF] via-[#E6F4FE] to-[#DCEEFC] text-stone-900 font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-sky-800">
            <span className="font-bold flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-600" /> 12,480 km Apart
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-200/80 font-bold text-[9px]">
              Connected
            </span>
          </div>

          {/* Dual Location Weather and Mood Cards */}
          <div className="my-auto space-y-2">
            {/* Jakarta Card */}
            <div className="p-2.5 rounded-2xl bg-white/95 border border-sky-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-stone-900 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Jakarta, ID
                </span>
                <span className="text-[10px] font-mono font-bold text-stone-700">31°C · 11:42 PM</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-stone-500">Alden&apos;s mood:</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                  Missing you 🥺
                </span>
              </div>
            </div>

            {/* Calgary Card */}
            <div className="p-2.5 rounded-2xl bg-white/95 border border-sky-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-stone-900 flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" /> Calgary, CA
                </span>
                <span className="text-[10px] font-mono font-bold text-stone-700">-4°C · 10:42 AM</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-stone-500">Angie&apos;s mood:</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                  Warm tea &amp; cozy ☕
                </span>
              </div>
            </div>

            {/* Shared Battery Meter */}
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

          {/* Footer */}
          <div className="text-center text-[9px] font-mono text-sky-700 font-bold">
            Next meeting: 42 days till reunion ✈
          </div>
        </div>
      ),
    },

    // 9. Love Roulette (romantic decision wheel)
    {
      id: "love-roulette",
      badge: "DATE NIGHT SOLVER",
      badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
      title: "Love Roulette",
      description: "Can't decide what to eat, watch, or do? Spin the romantic fortune wheel and let destiny settle it.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FFF9F9] text-stone-900 font-sans text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Date Decider
            </span>
            <span>Spin to decide</span>
          </div>

          {/* 6-Color Segmented Romantic Wheel */}
          <div className="my-auto relative flex flex-col items-center">
            {/* Top Pointer */}
            <div className="w-0 h-0 border-x-[7px] border-x-transparent border-t-[10px] border-t-rose-600 z-20 -mb-1 drop-shadow-sm" />

            {/* Spinning Wheel SVG */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className="relative w-36 h-36 rounded-full shadow-lg border-3 border-stone-900 overflow-hidden"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* 6 Slices */}
                <path d="M50 50 L50 0 A50 50 0 0 1 93.3 25 Z" fill="#FDA4AF" />
                <path d="M50 50 L93.3 25 A50 50 0 0 1 93.3 75 Z" fill="#BAE6FD" />
                <path d="M50 50 L93.3 75 A50 50 0 0 1 50 100 Z" fill="#FDE68A" />
                <path d="M50 50 L50 100 A50 50 0 0 1 6.7 75 Z" fill="#DDD6FE" />
                <path d="M50 50 L6.7 75 A50 50 0 0 1 6.7 25 Z" fill="#BBF7D0" />
                <path d="M50 50 L6.7 25 A50 50 0 0 1 50 0 Z" fill="#FECDD3" />
                {/* Center Hub */}
                <circle cx="50" cy="50" r="10" fill="#1C1917" />
                <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
              </svg>
            </motion.div>

            {/* Winner Decree Card */}
            <div className="mt-2.5 p-2 rounded-xl bg-white border border-rose-200 shadow-sm text-center">
              <span className="text-[8px] font-mono text-rose-500 font-bold uppercase block">
                DESTINY SELECTED:
              </span>
              <p className="font-heading font-black text-[11px] text-stone-900">
                Order partner surprise dessert! 🍰
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pt-1">
            <span>Alden spun</span>
            <span className="text-rose-600 font-bold">Angie approved ✓</span>
          </div>
        </div>
      ),
    },

    // 10. Collaborative Canvas & Memory Wall
    {
      id: "collaborative-canvas",
      badge: "SHARED SCRAPBOOK",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      title: "Collaborative Canvas",
      description: "An infinite digital bulletin board where you pin polaroids, sketch together in real time, and leave doodle love notes.",
      screenContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-[#FAF8F3] text-stone-900 font-sans text-xs select-none relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-600">
            <span className="font-bold flex items-center gap-1">
              <Palette className="w-3 h-3 text-teal-600" /> Corkboard Studio
            </span>
            <span className="text-[9px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
              Live 2/2
            </span>
          </div>

          {/* Collaborative Bulletin Board Content */}
          <div className="my-auto space-y-2 relative">
            {/* Pinned Mini Polaroid */}
            <div className="w-28 bg-white p-1.5 rounded-xs shadow-md border border-stone-300 -rotate-3 mx-auto">
              <div className="relative h-14 rounded-xs overflow-hidden bg-stone-100">
                <Image
                  src="/booth/monkey-point.jpg"
                  alt="Airport hug"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[7px] font-mono font-bold text-stone-600 text-center pt-1">
                Airport hug · 2026 ♡
              </p>
            </div>

            {/* Hand-drawn Mascot and Doodles */}
            <div className="relative flex items-center justify-center">
              <CoupleBeansMascot className="w-24 h-14" />
            </div>

            {/* Sticky Love Note with washi tape */}
            <div className="w-32 bg-[#FEF9C3] p-1.5 rounded-xs shadow-sm border border-amber-300 rotate-2 mx-auto text-center">
              <p className="font-mono text-[8px] font-bold text-amber-900">
                &ldquo;You are my home.&rdquo;
              </p>
            </div>

            {/* Live Dual Cursors Drawing */}
            <div className="absolute top-2 left-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[7px] font-bold">
                Angie drawing
              </span>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between text-[8px] font-mono text-stone-500 pt-1 border-t border-stone-200">
            <span>DRAWING TOGETHER</span>
            <span className="text-teal-700 font-bold">SAVED LIVE</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="activities" className="py-20 px-4 sm:px-6 max-w-[1360px] mx-auto select-none space-y-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
            AUTHENTIC PAIRFECT ACTIVITIES
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
            Pick tonight&apos;s{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              activity.
            </span>
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600 leading-relaxed">
            Real screens from our games and studios. Open a room, send your partner the 4-digit code, and you will see each other&apos;s moves as they happen.
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
        className="flex items-start gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {activities.map((act) => (
          <div
            key={act.id}
            className="snap-start shrink-0 w-[270px] sm:w-[290px] flex flex-col space-y-3 group"
          >
            {/* Realistic Slim Curved Smartphone Frame */}
            <div className="w-full h-[480px] sm:h-[500px] rounded-[44px] bg-stone-950 p-3 shadow-[0_15px_35px_rgba(0,0,0,0.18)] border-4 border-stone-800 relative transition-transform duration-300 group-hover:-translate-y-2">
              {/* Top Dynamic Island Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-900 rounded-full z-20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-stone-800" />
              </div>

              {/* Screen Bezel Container */}
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
      <div className="pt-2">
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
function FreshOutOfTheBoothClothesline() {
  const [isPlaying, setIsPlaying] = useState(true);

  const strips = [
    // 1. Boarding Pass Ticket
    {
      id: "ticket",
      pegColor: "bg-rose-400",
      content: (
        <div className="w-44 bg-[#F8FAFC] border border-stone-300 p-2.5 rounded-sm shadow-md text-stone-900 font-mono text-[9px] space-y-1.5">
          <div className="border-b border-stone-300 pb-1 flex items-center justify-between">
            <span className="font-bold tracking-wider">FLIGHT TICKET</span>
            <span className="text-rose-500 font-bold">YOUR♥HEART</span>
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/monkey-point.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 border-t border-dashed border-stone-400 flex items-center justify-between text-[8px] text-stone-500">
            <span>IDN + YVR</span>
            <span className="font-bold text-stone-900">PAIRFECT</span>
          </div>
        </div>
      ),
    },

    // 2. Blue Gingham Frame
    {
      id: "blue-gingham",
      pegColor: "bg-sky-400",
      content: (
        <div className="w-44 bg-[#E0F2FE] border-2 border-sky-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/monkey-point.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-sky-200">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-sky-800 font-bold">
            ♡ Angie Club · 2026
          </div>
        </div>
      ),
    },

    // 3. Yellow Polka Dot Frame
    {
      id: "yellow-polka",
      pegColor: "bg-amber-400",
      content: (
        <div className="w-44 bg-[#FEF3C7] border-2 border-amber-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/monkey-point.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-amber-200">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-amber-800 font-bold">
            ✿ Sunshine Daze
          </div>
        </div>
      ),
    },

    // 4. Red Tweed Vintage Frame
    {
      id: "red-tweed",
      pegColor: "bg-rose-500",
      content: (
        <div className="w-44 bg-[#FFE4E6] border-2 border-rose-400 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-rose-300">
            <Image src="/booth/monkey-point.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-rose-800 font-bold">
            PAIRFECT · SWEETHEART
          </div>
        </div>
      ),
    },

    // 5. Sage Green Gingham
    {
      id: "sage-green",
      pegColor: "bg-emerald-400",
      content: (
        <div className="w-44 bg-[#DCFCE7] border-2 border-emerald-300 p-2 rounded-sm shadow-md space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/monkey-point.jpg" alt="Pose 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-4/3 rounded bg-white overflow-hidden border border-emerald-200">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 3" fill className="object-cover" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-emerald-800 font-bold">
            🌿 Matcha Afternoon
          </div>
        </div>
      ),
    },

    // 6. Modern Minimalist Frame
    {
      id: "minimalist",
      pegColor: "bg-stone-800",
      content: (
        <div className="w-44 bg-stone-900 border-2 border-stone-800 p-2 rounded-sm shadow-md text-white space-y-1.5">
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/monkey-shock.jpg" alt="Pose 1" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/monkey-point.jpg" alt="Pose 2" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="relative aspect-4/3 rounded bg-stone-800 overflow-hidden">
            <Image src="/booth/monkey-heart.jpg" alt="Pose 3" fill className="object-cover grayscale contrast-125" />
          </div>
          <div className="pt-1 text-center font-mono text-[9px] text-stone-400 font-bold uppercase tracking-widest">
            pairfect.site
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full py-16 bg-[#FAFAF9] border-y border-stone-200 relative overflow-hidden select-none">
      {/* Header Container */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
            FRESH OUT OF THE BOOTH
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] bg-clip-text text-transparent">
              328,226
            </span>{" "}
            strips made in our booth so far.
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600">
            Our cosiest frames, waiting for the two of you. New ones go up every few weeks.
          </p>
        </div>

        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0">
          <div className="flex items-center gap-8">
            <div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
                60,128
              </p>
              <p className="text-[10px] font-mono font-bold text-stone-500 tracking-wider uppercase">
                BOOTH VISITS
              </p>
            </div>
            <div>
              <p className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
                80
              </p>
              <p className="text-[10px] font-mono font-bold text-stone-500 tracking-wider uppercase">
                FRAMES TO PICK FROM
              </p>
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
      <div className="relative w-full overflow-hidden pt-4 pb-12">
        {/* Taut Realistic Clothesline Cable Wire */}
        <div className="absolute top-7 left-0 right-0 h-[2px] bg-stone-300 shadow-xs z-10" />

        {/* Scrolling Clothesline Track */}
        <div
          className={`flex items-start gap-10 whitespace-nowrap pl-4 ${isPlaying ? "animate-marquee" : ""}`}
          style={{ width: "max-content" }}
        >
          {strips.concat(strips).map((strip, idx) => (
            <div
              key={`${strip.id}-${idx}`}
              className="relative flex flex-col items-center pt-5 transition-transform duration-300 hover:scale-105"
            >
              {/* Clothespin Peg Clipping the Wire */}
              <div
                className={`w-3.5 h-6 rounded-xs shadow-md border border-black/20 relative z-20 -mb-2 ${strip.pegColor}`}
              >
                <div className="w-full h-1 bg-black/20 my-2" />
              </div>

              {/* The Hanging Strip Card */}
              <div className="relative z-10 transition-transform hover:rotate-1">
                {strip.content}
              </div>
            </div>
          ))}
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
    <section className="py-20 px-4 sm:px-6 max-w-[1360px] mx-auto select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Copy & Checklist */}
        <div className="lg:col-span-7 space-y-6 max-w-xl">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            KEEPSAKES · SHIPS WORLDWIDE
          </p>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            Put your strip on{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              both your fridges
            </span>
            .
          </h2>
          <p className="text-sm sm:text-base font-sans text-stone-600 leading-relaxed">
            We print your strip as a die-cut fridge magnet and ship it anywhere in the world. Order two and send one to each of your addresses so every morning feels closer.
          </p>

          {/* Checklist with Pink Hearts */}
          <div className="space-y-3 pt-2">
            {[
              "Die-cut vinyl magnets from your real HD photobooth strip",
              "One order can split and ship to both your addresses",
              "20% off when you print 3 or more keepsake strips",
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
              href="/checkout?plan=plus-monthly"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <span>Order a magnet from ₹499 ▷</span>
            </Link>
            <p className="text-[11px] font-mono text-stone-500">
              🌍 Magnets worldwide · keychains &amp; HD prints across India &amp; worldwide
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
                  38°F · FRESH
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

            {/* Price Badge Sticker */}
            <div className="absolute top-12 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center font-mono shadow-lg border-2 border-white rotate-12 pointer-events-none">
              <span className="text-xs font-black">₹499</span>
              <span className="text-[7px] uppercase tracking-wider">EACH</span>
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
                {/* Red Strawberry / Heart Enamel Magnet Button at Top */}
                <div className="w-4 h-4 mx-auto -mt-3 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 border border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">
                  ♥
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/monkey-heart.jpg" alt="Pose 1" fill className="object-cover grayscale contrast-110" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/monkey-point.jpg" alt="Pose 2" fill className="object-cover grayscale contrast-110" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/monkey-shock.jpg" alt="Pose 3" fill className="object-cover grayscale contrast-110" />
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
                {/* Yellow Daisy Enamel Magnet Pin at Top */}
                <div className="w-4 h-4 mx-auto -mt-3 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-white shadow-md flex items-center justify-center text-[8px] text-amber-900 font-bold">
                  ✿
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/monkey-point.jpg" alt="Pose 1" fill className="object-cover" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/monkey-heart.jpg" alt="Pose 2" fill className="object-cover" />
                </div>
                <div className="relative h-12 sm:h-14 rounded-xs overflow-hidden bg-white">
                  <Image src="/booth/monkey-shock.jpg" alt="Pose 3" fill className="object-cover" />
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
                {/* Teal Heart Magnet */}
                <div className="w-3.5 h-3.5 mx-auto -mt-3.5 rounded-full bg-teal-400 border border-white shadow-xs" />
                <div className="relative aspect-square rounded-xs overflow-hidden bg-stone-100">
                  <Image src="/booth/monkey-heart.jpg" alt="Bali Reunion" fill className="object-cover" />
                </div>
                <div className="text-center font-mono text-[7px] font-bold text-stone-700 leading-tight">
                  Bali Reunion ♡
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
                {/* Orange Button Magnet */}
                <div className="w-3.5 h-3.5 mx-auto -mt-4 rounded-full bg-amber-500 border border-white shadow-xs" />
                <p className="font-heading font-bold text-[9px] text-amber-950">
                  Angie&apos;s Reminder:
                </p>
                <p className="font-mono text-[7px] text-amber-900 leading-snug">
                  • Drink your matcha 🍵<br />
                  • 10:00 PM FaceTime call<br />
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

            {/* Fridge Handle Accent on Left Edge */}
            <div className="absolute top-1/3 left-1.5 w-1.5 h-28 rounded-full bg-gradient-to-r from-stone-400 via-stone-300 to-stone-200 shadow-md border border-stone-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   6. CREATOR PROGRAM SECTION
   ════════════════════════════════════════════════════════════════════════ */
function CreatorProgramSection() {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-[1100px] mx-auto select-none">
      <div className="rounded-3xl bg-white border border-stone-200 shadow-md p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            CREATOR PROGRAM
          </p>
          <h3 className="text-2xl sm:text-4xl font-heading font-black text-stone-900 tracking-tight leading-tight">
            Post one video,{" "}
            <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
              get Pairfect free for life
            </span>
            .
          </h3>
          <p className="text-xs sm:text-sm font-sans text-stone-600 leading-relaxed">
            Film yourselves using the photobooth, post it on TikTok or Instagram and send us the link. If we approve it, you get a <strong className="text-stone-900">Lifetime Pass</strong>: every game and every HD download, for good.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <Link
            href="/onboarding"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Become a creator ▷
          </Link>
          <p className="text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
            <span>🎬</span> Takes 2 minutes to apply
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
      q: "What games can we play on Pairfect?",
      a: "There are 22 activities right now, and you play 20 of them together live: the online photobooth, Botanical Floral Studio, Wax-Sealed Love Letters, IQ Duel, Between the Lines courtroom, Gratitude Jar, Spotify Mixtape Sync, Daily Mood Sanctuary, Love Roulette, Collaborative Canvas, How Well Do You Know Me, Draw Together, the Arcade, Love Match, Truth or Dare, Riddle Night, Honest Cards, and more. The live ones happen in one shared room at the exact same moment, so you are playing together, not texting back and forth.",
    },
    {
      q: "Is Pairfect free to play?",
      a: "Yes, the core games and photobooth are free to play together. We offer a Plus membership for unlimited high-definition photo downloads, custom sticker packs, physical fridge magnets, and exclusive date themes.",
    },
    {
      q: "How does a realtime online date work?",
      a: "One person opens a room and gets a private 4-digit code. Send the code or invite link to your partner. As soon as they enter, your screens connect in real-time. You will see their cursor, drawings, photo poses, and quiz answers as they happen.",
    },
    {
      q: "Do we need to install an app?",
      a: "No installation is required. Pairfect works directly inside any mobile or desktop web browser (Safari, Chrome, Firefox, Edge). You can also add it to your home screen as a Progressive Web App (PWA) with one tap.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-[880px] mx-auto select-none space-y-10">
      <h2 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
        Questions long distance couples ask.
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-white text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">

      {/* Top Announcement Ribbon */}
      {isBannerVisible && (
        <div className="w-full bg-gradient-to-r from-[#FF6B8B] via-[#DF7BFE] to-[#4F86F7] text-white py-2 px-4 shadow-xs relative z-50 select-none">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-mono">
            {/* Pill Notification */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-stone-900 shadow-xs">
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] uppercase">
                NEW
              </span>
              <span className="font-medium text-[11px]">
                Coquette + 2 more packs in the photobooth: bows &amp; hearts
              </span>
              <Link
                href="/photo-booth"
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-0.5"
              >
                <span>take some</span>
                <span>&gt;</span>
              </Link>
            </div>

            {/* Subline */}
            <div className="hidden md:inline-flex items-center gap-1.5 text-white/90 text-xs font-medium ml-4">
              <span>♡</span>
              <span>Real dates for couples who live apart</span>
            </div>

            {/* Dismiss button */}
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

      {/* Clean White Sticky Navbar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo with Pink & Sky Blue Dots */}
          <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
            <span className="font-sans font-black text-2xl tracking-tight text-stone-900">
              pairfect
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E8E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F86F7]" />
            </div>
          </Link>

          {/* Navigation Links */}
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
            <Link href="/checkout" className="hover:text-stone-900 transition-colors flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop</span>
            </Link>
            <Link href="/profile" className="hover:text-stone-900 transition-colors flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </nav>

          {/* Right Action: Browse Activities Gradient Pill */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] font-mono text-stone-700 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>30s Film</span>
            </button>
            <Link
              href="/play"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] hover:opacity-95 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Browse activities ▷</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Headlines, Interactive Cursors, CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left relative">

            {/* Top Pill Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700 font-mono text-xs font-bold uppercase tracking-wider">
                <span>MADE FOR TWO · 22 ACTIVITIES</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-300 text-rose-600 bg-rose-50/50 font-mono text-xs">
                <span>✈</span>
                <span>Countdown till next time we meet</span>
                <span>✈</span>
              </div>
            </div>

            {/* H1 with Gradient & Interactive Floating Partner Cursors */}
            <div className="relative">
              <h1 className="text-4xl sm:text-6xl md:text-[4.4rem] font-heading font-black text-stone-900 tracking-tight leading-[1.05]">
                Fun Dates for{" "}
                <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
                  Long Distance
                </span>{" "}
                Relationships
              </h1>

              {/* Live Partner Cursor 1: "You" (Rose/Pink) with Expanding Heart Ripples */}
              <HeroLiveCursor
                name="You"
                label="Angie ♡"
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

            {/* Subtitle */}
            <p className="text-base sm:text-lg font-sans text-stone-600 leading-relaxed max-w-xl">
              I made this for my partner. We have been long distance for two years, and these are the dates and games we actually play. I hope you two like them too.
            </p>

            {/* Dual CTAs with "Me" Cursor */}
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

              {/* Live Partner Cursor 2: "Me" (Sky Blue) with Expanding Heart Ripples */}
              <HeroLiveCursor
                name="Me"
                label="Alden ♡"
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

            {/* App Store & Platform Availability */}
            <div className="pt-6 space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500">
                <span className="font-bold text-stone-700">AVAILABLE ON</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Web
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Android
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> iOS
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E8E]" /> you
                </span>
                <span>+</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F86F7]" /> me
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Earth Globe with Flight Arc & Emerging Photostrip Dispenser */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroGlobeGraphic />
          </div>

        </div>
      </section>

      {/* Curated Activities Carousel Section (10 Genuine Features) */}
      <ActivitiesCarousel />

      {/* Fresh Out of The Booth Clothesline */}
      <FreshOutOfTheBoothClothesline />

      {/* Interactive Draggable Keepsake Fridge */}
      <KeepsakeFridgeSection />

      {/* Creator Program */}
      <CreatorProgramSection />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* Clean Footer */}
      <footer className="border-t border-stone-200 py-10 px-4 sm:px-8 bg-white select-none">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo with dots */}
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-xl tracking-tight text-stone-900">
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
            <a href="mailto:pairfect.site@yahoo.com" className="hover:text-stone-900 transition-colors">
              contact@pairfect.site
            </a>
          </div>

          {/* Korean Tagline matching reference */}
          <div className="text-center md:text-right">
            <p className="text-xs text-stone-400 font-mono">
              인생네컷 · fun dates for long distance
            </p>
          </div>
        </div>
      </footer>

      {/* 30-Second GTM Launch Film Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-stone-950 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/80 bg-stone-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-stone-200 uppercase">
                    Pairfect · Official 30s Launch Film
                  </span>
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close launch video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  src="/pairfect_30s_launch_video.mp4"
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 sm:px-6 bg-stone-900/80 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
                <p className="font-sans">
                  Love deserves better than a chat history. A private digital sanctuary for two.
                </p>
                <Link
                  href="/onboarding"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-sky-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider"
                >
                  Open Your Room ▷
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
