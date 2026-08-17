"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Lock, Shield, Heart, Eye, Volume2, VolumeX, Sparkles, Tv, Camera,
  HelpCircle, Brain, Music, Film, Flame, Play, Check, ChevronRight, MessageSquare,
  BookOpen, Scale, PenTool, Search, Shirt, FlaskConical, Calendar, Gamepad2, Sun,
  Smile, Share2, Layers, Compass, Gift, Mail, Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PairfectPortrait } from "@/components/cozy-illustrations";

/* ─── Easing curve for motion system ─── */
const EASE_CUBIC = [0.22, 0.61, 0.36, 1] as const;

/* ─── Shared animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE_CUBIC },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay, ease: EASE_CUBIC },
  }),
};

/* ─── Memory Wall items ─── */
const memoryWallItems = [
  { emoji: "☕", label: "First Coffee", rotate: -4, color: "#FFF8FA" },
  { emoji: "🌅", label: "Sunset Walk", rotate: 3, color: "#FFEEF3" },
  { emoji: "🎵", label: "Our Song", rotate: -2, color: "#FFF8FA" },
  { emoji: "✈️", label: "First Trip", rotate: 5, color: "#FFEEF3" },
  { emoji: "🌧️", label: "Rainy Day In", rotate: -6, color: "#FFF8FA" },
  { emoji: "🍕", label: "Pizza Night", rotate: 2, color: "#FFEEF3" },
  { emoji: "📸", label: "Photobooth", rotate: -3, color: "#FFF8FA" },
  { emoji: "💌", label: "First Letter", rotate: 4, color: "#FFEEF3" },
  { emoji: "🎂", label: "Birthday", rotate: -5, color: "#FFF8FA" },
  { emoji: "🌸", label: "Spring Walk", rotate: 1, color: "#FFEEF3" },
  { emoji: "🏠", label: "Moved In", rotate: -2, color: "#FFF8FA" },
  { emoji: "❤️", label: "Still Us", rotate: 3, color: "#FFEEF3" },
];

/* ─── Timeline milestones ─── */
const timelineMilestones = [
  { emoji: "👋", label: "First Hello" },
  { emoji: "☕", label: "First Date" },
  { emoji: "✈️", label: "First Trip" },
  { emoji: "⚡", label: "First Fight" },
  { emoji: "🤝", label: "Made Up" },
  { emoji: "🏠", label: "Moved Together" },
  { emoji: "💍", label: "Still Choosing Each Other" },
];

/* ─── Interactive Dual-Phone Quiz Simulation Component ─── */
function DualPhoneInteractiveDemo() {
  const [step, setStep] = useState<"picking" | "locked" | "revealed">("picking");

  useEffect(() => {
    const timer1 = setTimeout(() => setStep("locked"), 2200);
    const timer2 = setTimeout(() => setStep("revealed"), 4200);
    const timer3 = setTimeout(() => setStep("picking"), 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [step]);

  return (
    <div className="relative w-full max-w-[620px] mx-auto p-6 sm:p-10 rounded-[32px] bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FB] to-[#FFF0F4] border border-[#FFDCE5] shadow-xl overflow-hidden paper-grain select-none">
      {/* Decorative ambient sparkles & floating hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-6 left-10 text-xl"
        >
          💖
        </motion.div>
        <motion.div
          animate={{ y: [0, -16, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-10 right-12 text-lg"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-14 text-sm"
        >
          🌸
        </motion.div>
      </div>

      {/* Main Dual Phone Stage */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 relative z-10">
        
        {/* ── Left Phone (User A - Pink Theme) ── */}
        <div className="w-[145px] sm:w-[210px] rounded-[24px] sm:rounded-[30px] p-2.5 sm:p-3.5 bg-white border-[3px] border-[#FF8DA1] shadow-lg flex flex-col justify-between aspect-[9/16] relative transition-transform duration-300 hover:scale-[1.02]">
          {/* Phone Notch & Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
            <span className="text-[8px] sm:text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
              ✨ Mia
            </span>
            <div className="w-8 sm:w-12 h-2 rounded-full bg-rose-200" />
            <span className="text-[8px] sm:text-[9px] font-mono text-rose-400">Live</span>
          </div>

          {/* Question Banner */}
          <div className="my-1.5 p-2 rounded-xl bg-rose-50 border border-rose-100 text-center">
            <span className="text-[7px] sm:text-[9px] font-mono uppercase font-bold text-rose-400 block">Question 04</span>
            <p className="text-[9px] sm:text-[11px] font-display italic font-bold text-[#3D2432] leading-tight mt-0.5">
              Ideal Friday night ritual?
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-1.5 flex-1 flex flex-col justify-center relative">
            
            {/* Option 1: Midnight Drive (The Match) */}
            <div className={`p-2 rounded-xl text-left border transition-all duration-300 relative ${
              step === "revealed"
                ? "bg-rose-500 text-white border-rose-600 shadow-md scale-[1.02]"
                : step === "locked"
                ? "bg-rose-100 border-rose-300 text-rose-900"
                : "bg-rose-50/70 border-rose-100 text-[#3D2432]"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[10px] font-bold">Midnight Drive 🌙</span>
                {step === "revealed" && <span className="text-[10px]">✓</span>}
              </div>
              {/* Pink Cursor Locking in */}
              {step === "picking" && (
                <motion.div
                  initial={{ opacity: 0, x: 20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className="absolute -right-2 -bottom-2 z-20 pointer-events-none"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#E8527D] drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.702z" />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Option 2 */}
            <div className="p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-left opacity-70">
              <span className="text-[8px] sm:text-[10px] font-medium text-gray-500">Cook Ramen Together 🍜</span>
            </div>

            {/* Option 3 */}
            <div className="p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-left opacity-70">
              <span className="text-[8px] sm:text-[10px] font-medium text-gray-500">Watch Studio Ghibli 🍿</span>
            </div>

          </div>

          {/* Status Bar */}
          <div className="pt-1 text-center">
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest">
              {step === "picking" ? "Selecting..." : step === "locked" ? "🔒 Locked In" : "🎉 Matched!"}
            </span>
          </div>
        </div>

        {/* ── Center Match Indicator & Countdown ── */}
        <div className="flex flex-col items-center justify-center space-y-2 z-20">
          <motion.div
            animate={step === "revealed" ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#E8527D] to-[#4A88E8] text-white flex items-center justify-center font-bold text-base sm:text-xl shadow-lg border-2 border-white"
          >
            {step === "revealed" ? "💖" : "?"}
          </motion.div>

          <div className="px-2.5 py-1 rounded-full bg-white/90 border border-pink-200 shadow-xs text-center backdrop-blur-xs">
            <span className="text-[8px] sm:text-[10px] font-mono font-bold uppercase text-[var(--text)] tracking-wider">
              {step === "revealed" ? "100% MATCH" : "REVEAL SYNC"}
            </span>
          </div>
        </div>

        {/* ── Right Phone (User B - Blue Theme) ── */}
        <div className="w-[145px] sm:w-[210px] rounded-[24px] sm:rounded-[30px] p-2.5 sm:p-3.5 bg-white border-[3px] border-[#5B95F5] shadow-lg flex flex-col justify-between aspect-[9/16] relative transition-transform duration-300 hover:scale-[1.02]">
          {/* Phone Notch & Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
            <span className="text-[8px] sm:text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wider">
              💙 Alex
            </span>
            <div className="w-8 sm:w-12 h-2 rounded-full bg-blue-200" />
            <span className="text-[8px] sm:text-[9px] font-mono text-blue-400">Live</span>
          </div>

          {/* Question Banner */}
          <div className="my-1.5 p-2 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <span className="text-[7px] sm:text-[9px] font-mono uppercase font-bold text-blue-400 block">Question 04</span>
            <p className="text-[9px] sm:text-[11px] font-display italic font-bold text-[#3D2432] leading-tight mt-0.5">
              Ideal Friday night ritual?
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-1.5 flex-1 flex flex-col justify-center relative">
            
            {/* Option 1: Midnight Drive (The Match) */}
            <div className={`p-2 rounded-xl text-left border transition-all duration-300 relative ${
              step === "revealed"
                ? "bg-blue-500 text-white border-blue-600 shadow-md scale-[1.02]"
                : step === "locked"
                ? "bg-blue-100 border-blue-300 text-blue-900"
                : "bg-blue-50/70 border-blue-100 text-[#3D2432]"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[10px] font-bold">Midnight Drive 🌙</span>
                {step === "revealed" && <span className="text-[10px]">✓</span>}
              </div>
              {/* Blue Cursor Locking in */}
              {step === "picking" && (
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className="absolute -left-2 -bottom-2 z-20 pointer-events-none"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4A88E8] drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.702z" />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Option 2 */}
            <div className="p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-left opacity-70">
              <span className="text-[8px] sm:text-[10px] font-medium text-gray-500">Cook Ramen Together 🍜</span>
            </div>

            {/* Option 3 */}
            <div className="p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-left opacity-70">
              <span className="text-[8px] sm:text-[10px] font-medium text-gray-500">Watch Studio Ghibli 🍿</span>
            </div>

          </div>

          {/* Status Bar */}
          <div className="pt-1 text-center">
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-blue-500 uppercase tracking-widest">
              {step === "picking" ? "Selecting..." : step === "locked" ? "🔒 Locked In" : "🎉 Matched!"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LandingContent() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize tactile micro-sounds via Web Audio API
  const playTactileSound = (type: "paper" | "tap" | "pop") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "tap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "paper") {
        const bufferSize = ctx.sampleRate * 0.06;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1200;
        noise.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.start(now);
        noise.stop(now + 0.06);
      }
    } catch (e) {}
  };

  const handleCodeChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newCode = [...joinCode];
    newCode[index] = val.toUpperCase();
    setJoinCode(newCode);

    if (val && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = joinCode.join("").trim();
    if (fullCode.length === 6) {
      router.push(`/onboarding?code=${fullCode}`);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="landing-journal relative min-h-screen flex flex-col overflow-hidden bg-[var(--bg)]">

      {/* ── TOP ANNOUNCEMENT BANNER ── */}
      <div className="bg-gradient-to-r from-[var(--burgundy)] via-[#D13D68] to-[var(--burgundy)] text-white text-[11px] font-mono py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs z-30 relative">
        <Image src="/logo-book.png" alt="Pairfect" width={14} height={14} className="rounded-xs" />
        <span>♡ Pairfect · The private digital sanctuary &amp; living archive for two</span>
      </div>

      {/* ── FLOATING PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {[6, 15, 28, 42, 58, 72, 88].map((left, i) => (
          <div
            key={`dust-${i}`}
            className="dust-particle"
            style={{
              left: `${left}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              animation: `float-dust ${18 + i * 4}s infinite linear`,
              animationDelay: `${i * 2.5}s`,
            }}
          />
        ))}
        {[10, 35, 60, 82].map((left, i) => (
          <div
            key={`petal-${i}`}
            className="petal-particle"
            style={{
              left: `${left}%`,
              fontSize: `${10 + i * 2}px`,
              animation: `float-petal ${24 + i * 6}s infinite linear`,
              animationDelay: `${i * 4}s`,
            }}
          >
            {["🌸", "🥀", "🍂", "✿"][i]}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          HEADER — Brand Ribbon & Controls
          ══════════════════════════════════════════════════════════ */}
      <header className="px-6 py-4 max-w-[1280px] w-full mx-auto flex items-center justify-between z-20 relative bg-[var(--bg)]/90 backdrop-blur-md sticky top-0 border-b border-[var(--border)]">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <Image src="/logo-book.png" alt="Pairfect" height={32} width={32} className="rounded-lg shadow-xs" priority />
            <div className="flex items-center gap-1.5">
              <span className="font-display italic text-2xl font-black tracking-tight text-[var(--text)]">
                pairfect
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8DA1] inline-block shadow-xs" />
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono font-medium text-[var(--text-soft)] uppercase tracking-wider">
          <a href="#see-in-action" className="hover:text-[var(--text)] transition-colors">See In Action</a>
          <a href="#all-activities" className="hover:text-[var(--text)] transition-colors">Games &amp; Activities</a>
          <Link href="/photo-booth" className="hover:text-[var(--text)] transition-colors">Photobooth</Link>
          <Link href="/love-letter" className="hover:text-[var(--text)] transition-colors">Love Letters</Link>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playTactileSound("pop");
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--paper-warm)] text-[9px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider hover:border-[var(--burgundy)] transition-colors cursor-pointer"
            aria-label="Toggle ambient soundscapes"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[var(--burgundy)]" />
                <span>Soundscapes On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[var(--ink-light)]" />
                <span>Soundscapes Off</span>
              </>
            )}
          </button>

          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[var(--text-soft)] hover:text-[var(--text)] transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-journal"
            onMouseEnter={() => playTactileSound("tap")}
          >
            Open Room ▷
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full z-10 relative">

        {/* ── HERO SECTION ── */}
        <section aria-label="Hero Introduction" className="max-w-[1280px] mx-auto px-6 pt-10 md:pt-16 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Column: Pairfect Iconic Headline */}
            <div className="w-full lg:w-7/12 text-left space-y-6">
              
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[9px] font-mono font-bold tracking-widest text-[var(--text-soft)] uppercase shadow-xs"
              >
                <Image src="/logo-book.png" alt="Pairfect" width={14} height={14} className="rounded-xs" />
                <span>BUILT FOR TWO · 15 REALTIME RITUALS &amp; DATES</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.1rem] font-display italic font-black text-[var(--text)] tracking-tight leading-[1.08]"
              >
                Love deserves <br />
                <span className="text-[var(--burgundy)] font-black">
                  better than a chat
                </span> <br />
                history.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.25}
                className="font-sans text-base sm:text-lg text-[var(--text-soft)] max-w-[560px] leading-relaxed"
              >
                Pairfect is your private digital sanctuary — a place for wax-sealed love letters, photobooth strips, synchronized movie nights, and daily connection rituals designed exclusively for two.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.4}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <Link
                  href="/onboarding"
                  className="btn-journal"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Create your room ▷
                </Link>
                <a
                  href="#see-in-action"
                  className="btn-journal-ghost"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Watch game demo ▷
                </a>
                <Link
                  href="/photo-booth"
                  className="btn-journal-ghost"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Open photobooth
                </Link>
              </motion.div>
            </div>

            {/* Right Column: Live Interactive Sanctuary Room UI Mockup */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
              className="w-full lg:w-5/12 relative"
            >
              <div className="relative p-5 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-2xl space-y-4 paper-grain keepsake-lift">
                <div className="washi-tape-top" />
                
                {/* App Window Titlebar */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-heading font-bold text-xs text-[var(--text)] ml-1">
                      Mia &amp; Alex&apos;s Lovespace
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    2 Online
                  </span>
                </div>

                {/* App Feature Cards Stack */}
                <div className="space-y-3 pt-1">
                  
                  {/* Pairfect Portrait Card */}
                  <div className="p-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-center">
                    <PairfectPortrait className="w-full h-40 rounded-xl" />
                  </div>
                  
                  {/* Item 1: Wax Letter Unsealed */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-[var(--burgundy)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--burgundy)]/10 border border-[var(--burgundy)]/30 flex items-center justify-center text-lg">
                        💌
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Wax Letter Unsealed</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">&quot;Written 365 days ago on our 1st date...&quot;</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full">
                      UNSEALED
                    </span>
                  </div>

                  {/* Item 2: Photobooth Strip */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-lg">
                        📸
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">4-Frame Photostrip</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">Saved to shared memory wall</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                      SAVED
                    </span>
                  </div>

                  {/* Item 3: Movie Night */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-lg">
                        🍿
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Movie Night: Studio Ghibli</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">Alex synchronized playhead</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      LIVE SYNC
                    </span>
                  </div>

                </div>

                {/* Live Partner Badges Footer */}
                <div className="pt-2 px-1 flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)] border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[var(--burgundy)] text-white font-bold text-[9px] shadow-xs">
                      ✨ You
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white font-bold text-[9px] shadow-xs">
                      ❤️ Partner
                    </span>
                  </div>
                  <span className="font-bold text-[var(--burgundy)]">152 DAYS TOGETHER 🔥</span>
                </div>

              </div>
            </motion.div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION: SEE IT IN ACTION (NEW - Exact from User Image 1)
            ══════════════════════════════════════════════════════════ */}
        <section id="see-in-action" aria-label="See It In Action Game Demo" className="max-w-[1000px] mx-auto px-6 py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-8 text-left"
          >
            {/* Header */}
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase block">
                SEE IT IN ACTION
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-black text-[var(--text)] tracking-tight leading-[1.12]">
                Watch a round of our most-played game.
              </h2>
            </div>

            {/* Interactive Dual-Phone Visual Showcase */}
            <DualPhoneInteractiveDemo />

            {/* Description and CTA matching image 1 */}
            <div className="max-w-2xl space-y-6 pt-2">
              <p className="font-sans text-base sm:text-lg text-[var(--text-soft)] leading-relaxed">
                One question, two screens. You both lock in privately — nobody can peek — then the answers flip at the exact same second. Match, and the confetti flies.
              </p>
              
              <div>
                <Link
                  href="/play/love-match"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1E191D] hover:bg-[#32282F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md hover:translate-y-[-1px]"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  <span>Play it free ▷</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION: ALL GAMES & ACTIVITIES (100% Real, Working Pairfect Experiences)
            ══════════════════════════════════════════════════════════ */}
        <section id="all-activities" aria-label="All Games and Activities Directory" className="max-w-[1180px] mx-auto px-6 py-20 space-y-10">
          
          {/* Section Divider Header */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase whitespace-nowrap">
              ALL GAMES &amp; ACTIVITIES
            </span>
            <div className="flex-1 h-[1px] bg-[var(--border)]" />
          </div>

          {/* ── Featured Banner: Online Photobooth (ALWAYS FREE) ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 paper-grain"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-sans font-bold text-[var(--text)]">
                    Online Photobooth
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                    ALWAYS FREE
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed max-w-2xl">
                  The realtime 인생네컷 booth for two — a shared countdown fires the shot on both screens at once, so every frame holds both of you.
                </p>
              </div>
            </div>

            <Link
              href="/photo-booth"
              className="shrink-0 text-xs font-mono font-bold text-[var(--text)] hover:text-[var(--burgundy)] inline-flex items-center gap-1.5 group transition-colors"
            >
              <span>Open the booth ▷</span>
            </Link>
          </motion.div>

          {/* ── Real Experience Cards Grid (All 100% Genuine, Working Pairfect Features) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Card 1: Love Match */}
            <Link
              href="/play/love-match"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-purple-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-purple-600 transition-colors">
                    Love Match
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Answer the same questions at the same instant — then discover just how in sync you really are.
                </p>
              </div>
            </Link>

            {/* Card 2: Know Me Quiz */}
            <Link
              href="/quiz"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-[var(--burgundy)]/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors">
                    Know Me Quiz
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    ★ MOST PLAYED
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Lock in privately, reveal together, score your compatibility — 14 question packs from cute to spicy.
                </p>
              </div>
            </Link>

            {/* Card 3: IQ Duel */}
            <Link
              href="/iq-duel"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-blue-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-blue-600 transition-colors">
                    IQ Duel
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    VERSUS
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  A fast-paced brain challenge for two. Test memory, speed, and logic in quick 1-on-1 rounds.
                </p>
              </div>
            </Link>

            {/* Card 4: Couples Debate */}
            <Link
              href="/vibe-judge"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-emerald-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-emerald-600 transition-colors">
                    Couples Debate
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    AI JUDGE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Pick a playful topic, plead your case on camera or text, and let the AI judge deliver a fair verdict.
                </p>
              </div>
            </Link>

            {/* Card 5: Riddle Night */}
            <Link
              href="/riddle"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-amber-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-amber-600 transition-colors">
                    Riddle Night
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    CO-OP
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Team up against the clock. Crack mind-bending logic puzzles and team riddles together.
                </p>
              </div>
            </Link>

            {/* Card 6: Watch Together */}
            <Link
              href="/watch"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-indigo-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-indigo-600 transition-colors">
                    Watch Together
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    REALTIME
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Synchronize YouTube videos in real-time with live floating emoji reactions and cinema tab sharing.
                </p>
              </div>
            </Link>

            {/* Card 7: Gratitude Jar */}
            <Link
              href="/gratitude-jar"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-rose-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-rose-600 transition-colors">
                    Gratitude Jar
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[var(--burgundy)] border border-rose-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    DAILY RITUAL
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Drop folded handwritten notes into a shared jar. Open and read them together on rainy days.
                </p>
              </div>
            </Link>

            {/* Card 8: Love Letters */}
            <Link
              href="/love-letter"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-[var(--burgundy)]/40 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[var(--burgundy)]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-[var(--burgundy)] transition-colors">
                    Love Letters
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[var(--burgundy)] border border-rose-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    ENCRYPTED
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Write letters sealed with digital wax. Schedule them to unseal together on future anniversaries.
                </p>
              </div>
            </Link>

            {/* Card 9: Focus Session */}
            <Link
              href="/focus"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-teal-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-teal-600 transition-colors">
                    Focus Session
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    CO-OP
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Work or study side-by-side with synchronized Pomodoro timers and cozy ambient soundscapes.
                </p>
              </div>
            </Link>

            {/* Card 10: Handmade Mixtape */}
            <Link
              href="/mixtape"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-emerald-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-emerald-700 transition-colors">
                    Handmade Mixtape
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    SPOTIFY
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Design a physical vintage cassette tape with custom shells and stickers, and curate your shared soundtrack.
                </p>
              </div>
            </Link>

            {/* Card 11: Stories & Archive */}
            <Link
              href="/stories"
              className="p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-violet-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-base text-[var(--text)] group-hover:text-violet-600 transition-colors">
                    Stories &amp; Archive
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-200 text-[8px] font-mono font-bold uppercase tracking-wider">
                    STORIES
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Explore living relationship stories, community wisdom, and write your shared milestones.
                </p>
              </div>
            </Link>

          </div>

        </section>

        {/* ── ROOM CODE QUICK JOIN BOX ── */}
        <section className="max-w-[800px] mx-auto px-6 py-10 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-md space-y-5 paper-grain"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-display italic font-bold text-[var(--text)]">
                Step directly into your sanctuary
              </h3>
              <p className="text-xs font-mono text-[var(--text-soft)]">
                Enter your 6-character invite code from your partner to open your private room.
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    id={`code-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={joinCode[idx]}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    className="w-10 h-12 text-center text-lg font-mono font-bold uppercase rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--burgundy)] focus:ring-2 focus:ring-[var(--burgundy)]/20 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" className="btn-journal py-2.5 px-6 text-[10px]">
                  Join Room Now ▷
                </button>
                <Link href="/login" className="btn-journal-ghost py-2.5 px-6 text-[10px]">
                  Sign In With Email
                </Link>
              </div>
            </form>
          </motion.div>
        </section>

        {/* ── TODAY'S STORY PREVIEW (Pairfect Original Feed) ── */}
        <section aria-label="Today's Story Preview" className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-md grid grid-cols-1 lg:grid-cols-12 gap-10 items-center paper-grain">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 text-left space-y-5">
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                TODAY&apos;S STORY
              </span>
              <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)] leading-tight">
                Your private daily <span className="text-[var(--burgundy)]">relationship feed.</span>
              </h2>
              <p className="text-xs font-sans text-[var(--text-soft)] leading-relaxed">
                Every letter sealed, photostrip taken, and quiz answered automatically weaves into your shared daily timeline — creating a living digital keepsake of your relationship over time.
              </p>
              <Link href="/dashboard" className="btn-journal inline-flex py-3 px-6 text-[10px]">
                Open your dashboard ▷
              </Link>
            </div>

            {/* Right Story Feed Showcase */}
            <div className="lg:col-span-7 relative">
              <div className="p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-inner space-y-4">
                <div className="space-y-3">
                  
                  {/* Story Entry 1: Love Letter */}
                  <div className="p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💌</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Letter Sealed for Anniversary</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Unseals in 14 days · Encrypted</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full">
                      SEALED
                    </span>
                  </div>

                  {/* Story Entry 2: Photobooth */}
                  <div className="p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📸</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">4-Frame Photobooth Strip</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Saved to shared memories</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      SAVED
                    </span>
                  </div>

                  {/* Story Entry 3: Daily Quiz */}
                  <div className="p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✨</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Know Me Quiz · 100% Match</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Karaoke Songs Pack</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-full">
                      MATCHED
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── THE MEMORY WALL ── */}
        <section aria-label="The Memory Wall" className="max-w-[1100px] mx-auto px-6 py-20 space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="text-center space-y-4"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              The Memory Wall
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-[1.15]">
              Every moment you&apos;ve kept.
              <br />
              <span className="text-[var(--burgundy)]">All in one place.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.2}
            className="memory-wall grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-5"
          >
            {memoryWallItems.map((item, i) => (
              <div
                key={item.label}
                onMouseEnter={() => playTactileSound("paper")}
                className="memory-wall-card rounded-xl p-4 sm:p-5 flex flex-col items-center gap-2 cursor-pointer shadow-md border border-[var(--border)]"
                style={{
                  background: item.color,
                  transform: `rotate(${item.rotate}deg)`,
                  zIndex: i % 3 === 0 ? 10 : 5,
                }}
              >
                <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                <span className="text-[9px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── SHARED MEMORY TIMELINE ── */}
        <section aria-label="Shared Memory Timeline" className="max-w-[850px] mx-auto px-6 py-20 text-center space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="space-y-4"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              Your Shared Timeline
            </p>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)] leading-[1.15]">
              Time passes. Love stays.
            </h2>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.15}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            {timelineMilestones.map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && (
                  <span className="hidden sm:inline text-[var(--border)] font-mono text-sm">
                    →
                  </span>
                )}
                <div
                  className="px-4 py-3 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-sm text-center keepsake-lift cursor-pointer"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  <p className="text-xl mb-1">{m.emoji}</p>
                  <p className="text-[9px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider whitespace-nowrap">
                    {m.label}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </section>

        {/* ── PRIVACY & TRUST GUARANTEES ── */}
        <section aria-label="Privacy Guarantees" className="max-w-[800px] mx-auto px-6 py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="bg-[var(--paper-warm)] border border-[var(--border)] p-10 md:p-14 rounded-3xl text-center space-y-8 shadow-sm relative overflow-hidden paper-grain"
          >
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                Privacy by Design
              </p>
              <h2 className="text-2xl sm:text-3xl font-display italic font-black text-[var(--text)]">
                Your memories belong here.
              </h2>
              <p className="font-quote italic text-base text-[var(--text-soft)] leading-relaxed">
                Not on a public feed. Not inside an algorithm. Only you two can open them.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[
                { icon: <Shield className="w-4 h-4" />, label: "AES-256 Encrypted" },
                { icon: <Lock className="w-4 h-4" />, label: "Invite Only" },
                { icon: <Eye className="w-4 h-4" />, label: "No Public Profiles" },
                { icon: <Heart className="w-4 h-4" />, label: "Only 2 People" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-[var(--paper-mid)] border border-[var(--border)] flex flex-col items-center space-y-1.5"
                >
                  <span className="text-[var(--burgundy)]">{item.icon}</span>
                  <span className="text-[9px] font-mono font-bold text-[var(--text-soft)] text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS ── */}
        <section aria-label="Frequently Asked Questions" className="max-w-[800px] mx-auto px-6 py-16 text-left">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)]">
                Everything you need to <span className="text-[var(--burgundy)]">ask.</span>
              </h2>
            </div>

            <div className="space-y-3 pt-4 divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {[
                {
                  q: "What games and activities can we play on Pairfect?",
                  a: "Fifteen realtime activities are live: Know Me Quiz, Online Photobooth, Love Match, Our Future, Arcade, Couples Debate, Draw Together, Couples Court, Snap Hunt, Fashion Show, The Lab, Honest Cards, Create a Date, and Movie Night."
                },
                {
                  q: "Is Pairfect free to use?",
                  a: "Yes! Every activity, photobooth session, quiz, and wax-sealed letter is 100% free for both of you."
                },
                {
                  q: "How does a realtime online date work?",
                  a: "Open a room, copy your 6-character code, and send it to your partner. They'll join in a single tap, and both of your screens synchronize live in real time."
                },
                {
                  q: "Do we need to install an app?",
                  a: "No app installation required. Pairfect runs directly in any web browser on iOS, Android, Mac, or Windows."
                },
                {
                  q: "How is the online photobooth different from a physical photo booth?",
                  a: "Take your own 4-frame photo strip right from your browser, customize it with frame borders and stickers, and export or save it to your shared memories."
                }
              ].map((faq, idx) => (
                <div key={idx} className="pt-4 first:pt-0 space-y-2">
                  <button
                    onClick={() => {
                      setOpenFaqIndex(openFaqIndex === idx ? null : idx);
                      playTactileSound("tap");
                    }}
                    className="w-full flex items-center justify-between text-left text-sm sm:text-base font-bold text-[var(--text)] hover:text-[var(--burgundy)] transition-colors cursor-pointer py-1"
                  >
                    <span>{faq.q}</span>
                    <span className="font-mono text-xs text-[var(--text-soft)] pl-4">
                      {openFaqIndex === idx ? "✕" : "+"}
                    </span>
                  </button>
                  {openFaqIndex === idx && (
                    <p className="text-xs text-[var(--text-soft)] font-sans leading-relaxed pt-1 pb-2">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA SECTION ── */}
        <section aria-label="Call to Action" className="max-w-[800px] mx-auto px-6 py-24">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="bg-[var(--paper-warm)] border border-[var(--border)] p-12 md:p-16 rounded-3xl text-center space-y-8 shadow-lg relative overflow-hidden paper-grain"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--rose)] via-[var(--burgundy)] to-[var(--rose)]" />

            <div className="space-y-6 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                One last page waits
              </p>

              <p className="text-xl sm:text-2xl font-display italic font-bold text-[var(--text)] leading-relaxed">
                Imagine this.
              </p>
              <p className="font-handwriting text-2xl text-[var(--text)] leading-relaxed">
                One day — years from now — you&apos;ll forget what happened on an ordinary Tuesday.
              </p>
              <p className="font-quote italic text-lg text-[var(--burgundy)] font-bold">
                But Pairfect won&apos;t.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <Link
                href="/signup"
                className="btn-journal"
                onMouseEnter={() => playTactileSound("pop")}
              >
                Start Writing Together <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--border)] py-12 px-6 bg-[var(--paper-warm)]">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-2 select-none">
              <Image src="/logo-book.png" alt="Pairfect" height={26} width={26} className="rounded-md shadow-xs" />
              <div className="flex items-center gap-1.5">
                <span className="font-display italic text-lg font-black tracking-tight text-[var(--text)]">
                  pairfect
                </span>
                <span className="w-2 h-2 rounded-full bg-[#FF8DA1] inline-block" />
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-soft)] font-mono">
              The private digital sanctuary &amp; living archive for two.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[var(--text-soft)] font-mono">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@pairfect.app" className="hover:text-[var(--text)] transition-colors">
              Contact
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-[var(--text-soft)] font-mono">
              &copy; 2026 Pairfect. Built for two. Kept forever.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
