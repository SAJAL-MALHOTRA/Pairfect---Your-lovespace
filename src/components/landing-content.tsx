"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Lock, Shield, Heart, Eye, Volume2, VolumeX, Sparkles, Tv, Camera,
  HelpCircle, Brain, Music, Film, Flame, Play, Check, ChevronRight, MessageSquare,
  BookOpen, Scale, PenTool, Search, Calendar, Gift, Mail, Timer,
  CloudRain, Clock, MapPin, Feather, CheckCircle2, Star, Zap, RefreshCw, X
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

/* ─── Interactive Dual-Phone Quiz Simulation Component (Fully Mobile & Viewport Responsive) ─── */
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
    <div className="relative w-full max-w-[620px] mx-auto p-3 min-[400px]:p-6 sm:p-10 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FB] to-[#FFF0F4] border border-[#FFDCE5] shadow-xl overflow-hidden paper-grain select-none">
      {/* Decorative ambient sparkles & floating hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 sm:top-6 left-6 sm:left-10 text-base sm:text-xl"
        >
          💖
        </motion.div>
        <motion.div
          animate={{ y: [0, -16, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-6 sm:top-10 right-6 sm:right-12 text-sm sm:text-lg"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 sm:bottom-8 left-6 sm:left-14 text-xs sm:text-sm"
        >
          🌸
        </motion.div>
      </div>

      {/* Main Dual Phone Stage */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 relative z-10">
        
        {/* Left Phone (Mia - Pink Theme) */}
        <div className="w-[120px] min-[380px]:w-[140px] sm:w-[200px] md:w-[210px] rounded-[20px] sm:rounded-[30px] p-2 sm:p-3.5 bg-white border-[2.5px] sm:border-[3px] border-[#FF8DA1] shadow-lg flex flex-col justify-between aspect-[9/16] relative transition-transform duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between pb-1 sm:pb-1.5 border-b border-rose-100">
            <span className="text-[7px] sm:text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
              ✨ Mia
            </span>
            <div className="w-6 sm:w-12 h-1.5 sm:h-2 rounded-full bg-rose-200" />
            <span className="text-[7px] sm:text-[9px] font-mono text-rose-400">Live</span>
          </div>

          <div className="my-1 sm:my-1.5 p-1.5 sm:p-2 rounded-xl bg-rose-50 border border-rose-100 text-center">
            <span className="text-[6px] sm:text-[9px] font-mono uppercase font-bold text-rose-400 block">Question 04</span>
            <p className="text-[8px] sm:text-[11px] font-display italic font-bold text-[#3D2432] leading-tight mt-0.5">
              Ideal Friday night ritual?
            </p>
          </div>

          <div className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-center relative">
            <div className={`p-1.5 sm:p-2 rounded-xl text-left border transition-all duration-300 relative ${
              step === "revealed"
                ? "bg-rose-500 text-white border-rose-600 shadow-md scale-[1.02]"
                : step === "locked"
                ? "bg-rose-100 border-rose-300 text-rose-900"
                : "bg-rose-50/70 border-rose-100 text-[#3D2432]"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px] font-bold">Midnight Drive 🌙</span>
                {step === "revealed" && <span className="text-[8px] sm:text-[10px]">✓</span>}
              </div>
            </div>

            <div className="p-1.5 sm:p-2 rounded-xl text-left border border-rose-100 bg-white/80 text-[var(--text-soft)] opacity-60">
              <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px]">Rooftop Pizza 🍕</span>
            </div>
          </div>

          <div className="pt-1 sm:pt-1.5 border-t border-rose-100 flex items-center justify-between text-[6px] sm:text-[8px] font-mono">
            <span className="text-rose-400">Pairfect Sync</span>
            {step === "locked" && <span className="text-amber-600 font-bold">🔒 LOCKED IN</span>}
            {step === "revealed" && <span className="text-rose-600 font-bold">100% MATCH 🎉</span>}
          </div>
        </div>

        {/* Sync Heart Pulse Center */}
        <div className="flex flex-col items-center gap-1 z-20 shrink-0">
          <motion.div
            animate={{ scale: step === "revealed" ? [1, 1.4, 1.2] : [1, 1.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`w-7 min-[380px]:w-8 sm:w-12 h-7 min-[380px]:h-8 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-xl shadow-md transition-colors duration-500 ${
              step === "revealed" ? "bg-rose-500 text-white" : "bg-white text-rose-500 border border-rose-200"
            }`}
          >
            ♥
          </motion.div>
          <span className="text-[6px] sm:text-[8px] font-mono font-bold text-rose-400 uppercase tracking-widest text-center">
            {step === "revealed" ? "SYNC" : "SYNCING"}
          </span>
        </div>

        {/* Right Phone (Alex - Slate Theme) */}
        <div className="w-[120px] min-[380px]:w-[140px] sm:w-[200px] md:w-[210px] rounded-[20px] sm:rounded-[30px] p-2 sm:p-3.5 bg-white border-[2.5px] sm:border-[3px] border-[#93B1C6] shadow-lg flex flex-col justify-between aspect-[9/16] relative transition-transform duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between pb-1 sm:pb-1.5 border-b border-slate-100">
            <span className="text-[7px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              💙 Alex
            </span>
            <div className="w-6 sm:w-12 h-1.5 sm:h-2 rounded-full bg-slate-200" />
            <span className="text-[7px] sm:text-[9px] font-mono text-slate-400">Live</span>
          </div>

          <div className="my-1 sm:my-1.5 p-1.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[6px] sm:text-[9px] font-mono uppercase font-bold text-slate-400 block">Question 04</span>
            <p className="text-[8px] sm:text-[11px] font-display italic font-bold text-[#1F2937] leading-tight mt-0.5">
              Ideal Friday night ritual?
            </p>
          </div>

          <div className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-center relative">
            <div className={`p-1.5 sm:p-2 rounded-xl text-left border transition-all duration-300 relative ${
              step === "revealed"
                ? "bg-slate-700 text-white border-slate-800 shadow-md scale-[1.02]"
                : step === "locked"
                ? "bg-slate-100 border-slate-300 text-slate-900"
                : "bg-slate-50/70 border-slate-100 text-[#1F2937]"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px] font-bold">Midnight Drive 🌙</span>
                {step === "revealed" && <span className="text-[8px] sm:text-[10px]">✓</span>}
              </div>
            </div>

            <div className="p-1.5 sm:p-2 rounded-xl text-left border border-slate-100 bg-white/80 text-[var(--text-soft)] opacity-60">
              <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px]">Rooftop Pizza 🍕</span>
            </div>
          </div>

          <div className="pt-1 sm:pt-1.5 border-t border-slate-100 flex items-center justify-between text-[6px] sm:text-[8px] font-mono">
            <span className="text-slate-400">Pairfect Sync</span>
            {step === "locked" && <span className="text-amber-600 font-bold">🔒 LOCKED IN</span>}
            {step === "revealed" && <span className="text-slate-700 font-bold">100% MATCH 🎉</span>}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LandingContent() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);
  
  // Interactive Letter Tabs & Atelier State
  const [activeLetterStep, setActiveLetterStep] = useState<number>(0);
  const waxColors = [
    { name: "Crimson Rose", hex: "#E8527D", border: "#FFCCD8", icon: "♥" },
    { name: "Velvet Violet", hex: "#8B5CF6", border: "#DDD6FE", icon: "🌙" },
    { name: "Honey Amber", hex: "#F59E0B", border: "#FDE68A", icon: "☀️" },
    { name: "Sage Emerald", hex: "#10B981", border: "#A7F3D0", icon: "🌿" },
  ];
  const [selectedWax, setSelectedWax] = useState(waxColors[0]);

  const [journalRevealed, setJournalRevealed] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("anniversary");
  const [heartbeatSent, setHeartbeatSent] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play tactile UI soundscapes
  const playTactileSound = (type: "tap" | "paper" | "click" | "pop" = "tap") => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tap" || type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
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

  const triggerHeartbeat = () => {
    setHeartbeatSent(true);
    playTactileSound("pop");
    setTimeout(() => setHeartbeatSent(false), 3000);
  };

  // Memory vault sample mock database
  const vaultItems = [
    { title: "First Anniversary Letter", date: "Oct 14, 2025", type: "Letter", icon: "💌", excerpt: "Written from the cafe window while you were getting croissants..." },
    { title: "Photobooth Strip #04", date: "Nov 02, 2025", type: "Photobooth", icon: "📸", excerpt: "Studio neon frame · 4 poses in our matching winter coats." },
    { title: "Love Match: 100% Sync", date: "Dec 18, 2025", type: "Quiz", icon: "✨", excerpt: "Matched on: Midnight drive, hot chocolate, and waking up at 10 AM." },
    { title: "First Coffee Date Polaroids", date: "Jan 05, 2026", type: "Memory", icon: "☕", excerpt: "Blue Tokai · You spilled sugar on the table and laughed." },
    { title: "Rainy Tuesday Gratitude Note", date: "Feb 14, 2026", type: "Gratitude", icon: "🌿", excerpt: "Thank you for bringing me warm socks without being asked." },
  ];

  const filteredVault = vaultItems.filter(item =>
    item.title.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
    item.excerpt.toLowerCase().includes(vaultSearchQuery.toLowerCase())
  );

  return (
    <div className="landing-journal relative min-h-screen flex flex-col overflow-x-hidden bg-[var(--bg)]">

      {/* ── TOP ANNOUNCEMENT BANNER (From Screenshot 2) ── */}
      <div className="bg-gradient-to-r from-[var(--burgundy)] via-[#D13D68] to-[var(--burgundy)] text-white text-[11px] font-mono py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs z-30 relative">
        <Image src="/logo-book.png" alt="Pairfect" width={14} height={14} className="rounded-xs shrink-0" />
        <span className="truncate">♡ Pairfect · The private digital sanctuary &amp; living archive for two</span>
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
          NAVBAR — Book Logo & Navigation Links
          ══════════════════════════════════════════════════════════ */}
      <header className="px-4 sm:px-6 py-4 max-w-[1280px] w-full mx-auto flex items-center justify-between z-20 relative bg-[var(--bg)]/90 backdrop-blur-md sticky top-0 border-b border-[var(--border)]">
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

        <nav className="hidden lg:flex items-center space-x-7 text-xs font-mono font-medium text-[var(--text-soft)] uppercase tracking-wider">
          <a href="#why-pairfect" className="hover:text-[var(--text)] transition-colors">Why Pairfect</a>
          <a href="#see-in-action" className="hover:text-[var(--text)] transition-colors">See In Action</a>
          <a href="#letters" className="hover:text-[var(--text)] transition-colors">Letters</a>
          <a href="#rituals" className="hover:text-[var(--text)] transition-colors">Rituals</a>
          <a href="#photobooth" className="hover:text-[var(--text)] transition-colors">Photobooth</a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3">
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
            className="text-xs font-mono uppercase tracking-widest text-[var(--text-soft)] hover:text-[var(--text)] transition-colors px-2 sm:px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-journal py-2 px-4 sm:px-6 text-xs"
            onMouseEnter={() => playTactileSound("tap")}
          >
            Open Room ▷
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT — THE 15-SECTION NARRATIVE
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full z-10 relative">

        {/* ── 01 · HERO (Matches Screenshot 2) ── */}
        <section id="hero" aria-label="01 Hero Introduction" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 md:pt-16 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            
            {/* Left Column: Pairfect Headline & Subtext */}
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
                Pairfect is your private digital sanctuary — a place for wax-sealed love letters, photobooth strips, synchronized dates, and daily connection rituals designed exclusively for two.
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

            {/* Right Column: Mia & Alex's Lovespace Card (Exact from Screenshot 2) */}
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
                  
                  {/* Pairfect Portrait */}
                  <div className="p-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-center">
                    <PairfectPortrait className="w-full h-40 rounded-xl" />
                  </div>
                  
                  {/* Item 1: Wax Letter Unsealed */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-[var(--burgundy)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--burgundy)]/10 border border-[var(--burgundy)]/30 flex items-center justify-center text-lg shrink-0">
                        💌
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Wax Letter Unsealed</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">&quot;Written 365 days ago on our 1st date...&quot;</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full shrink-0">
                      UNSEALED
                    </span>
                  </div>

                  {/* Item 2: Photobooth Strip */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-lg shrink-0">
                        📸
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">4-Frame Photostrip</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">Saved to shared memory wall</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full shrink-0">
                      SAVED
                    </span>
                  </div>

                  {/* Item 3: Movie Night */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-lg shrink-0">
                        🍿
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Movie Night: Studio Ghibli</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)]">Alex synchronized playhead</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
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

        {/* ── 02 · WHY PAIRFECT (Why relationship memories disappear in chat) ── */}
        <section id="why-pairfect" aria-label="02 Why Pairfect" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                02 · WHY PAIRFECT
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                Why relationship memories <br />
                <span className="text-[var(--burgundy)]">disappear in chat.</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                Chat apps are built for quick logistical noise — grocery lists, links, memes, and daily coordination. That heartfelt 3-paragraph love note you wrote at 2 AM is buried under 12,000 text bubbles and forgotten.
              </p>
            </div>

            {/* Contrast Visual: Chat Stream vs Pairfect Sanctuary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Card A: The Chaotic Chat Stream */}
              <div className="p-5 sm:p-8 rounded-3xl bg-white/70 border border-slate-200/80 shadow-sm relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Standard Messaging App
                  </span>
                  <span className="text-[9px] font-mono text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                    4,218 UNREAD MESSAGES
                  </span>
                </div>

                <div className="space-y-2.5 opacity-80 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 max-w-[85%]">
                    Can you pick up eggs and oat milk on your way back? 🥚
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 max-w-[80%]">
                    Look at this funny reel https://instagram.com/reel/xyz...
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 max-w-[90%] relative">
                    <span className="text-[8px] font-mono font-bold text-rose-400 uppercase block mb-1">
                      Anniversary Note (Sent 6 months ago)
                    </span>
                    &quot;I love you more than words can say. You make every day magic...&quot;
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 max-w-[75%]">
                    Where is the Netflix password again?
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 max-w-[85%]">
                    Running late by 15 mins! See you soon.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400 text-center">
                  ✕ Buried under logistical noise · Impossible to search by feeling
                </div>
              </div>

              {/* Card B: The Dedicated Pairfect Sanctuary */}
              <div className="p-5 sm:p-8 rounded-3xl bg-[var(--paper-warm)] border-2 border-[#FFCCD8] shadow-lg relative overflow-hidden space-y-4 paper-grain">
                <div className="washi-tape-top" />
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <span className="text-[10px] font-mono font-bold text-[var(--burgundy)] uppercase tracking-widest">
                    Your Living Pairfect Archive
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    PRESERVED FOREVER
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">💌</span>
                      <div>
                        <p className="font-bold text-[var(--text)]">Wax-Sealed Love Letter</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Unseals on 1st Anniversary · Encrypted</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] shrink-0">SEALED</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">📸</span>
                      <div>
                        <p className="font-bold text-[var(--text)]">Rainy Day 4-Frame Strip</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Realtime booth capture · High-Res</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 shrink-0">SAVED</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">✨</span>
                      <div>
                        <p className="font-bold text-[var(--text)]">Love Match · 100% Sync</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Midnight drive question · Day 152</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 shrink-0">MATCHED</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--burgundy)] font-bold text-center">
                  ✓ Every memory kept, searchable, and safe from algorithms
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* ── 03 · SEE IT IN ACTION (Matches Screenshot 1) ── */}
        <section id="see-in-action" aria-label="03 See It In Action Game Demo" className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-8 text-left"
          >
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase block">
                03 · SEE IT IN ACTION
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-black text-[var(--text)] tracking-tight leading-[1.12]">
                Watch a round of our most-played game.
              </h2>
            </div>

            <DualPhoneInteractiveDemo />

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

        {/* ── 04 · LETTERS (Seal → open → read → reply) — FULLY INTERACTIVE & RESPONSIVE ── */}
        <section id="letters" aria-label="04 Love Letters" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                04 · LOVE LETTERS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                Seal → open → read → reply.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                Some words are too precious for a disposable text bubble. Click any step below to experience how a letter travels from molten wax to your living archive.
              </p>
            </div>

            {/* 4-Step Interactive Flow Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              {[
                { step: "01", label: "SEAL", desc: "Choose wax & stamp" },
                { step: "02", label: "LOCK", desc: "Set future unseal date" },
                { step: "03", label: "OPEN", desc: "Break the wax together" },
                { step: "04", label: "REPLY", desc: "Archived in your book" },
              ].map((s, idx) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setActiveLetterStep(idx);
                    playTactileSound("paper");
                  }}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer select-none ${
                    activeLetterStep === idx
                      ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-md scale-[1.02]"
                      : "bg-white border-[var(--border)] text-[var(--text)] hover:border-[var(--burgundy)]/40 hover:bg-rose-50/30"
                  }`}
                >
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold block ${activeLetterStep === idx ? "text-rose-100" : "text-[var(--text-soft)]"}`}>
                    {s.step}
                  </span>
                  <p className="font-display italic font-bold text-sm sm:text-base mt-0.5">{s.label}</p>
                  <p className={`text-[9px] sm:text-[10px] font-mono mt-1 ${activeLetterStep === idx ? "text-rose-100" : "text-[var(--text-soft)]"}`}>
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Dynamic Interactive Letter Card responding to activeLetterStep */}
            <div className="max-w-[720px] mx-auto p-5 sm:p-10 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl relative overflow-hidden paper-grain">
              <div className="washi-tape-top" />
              
              <AnimatePresence mode="wait">
                {activeLetterStep === 0 && (
                  <motion.div
                    key="step-seal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Step 1: SEAL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-xl shrink-0">
                          💌
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] uppercase tracking-wider block">
                            STEP 1 OF 4 · DIGITAL WAX ATELIER
                          </span>
                          <h3 className="font-display italic font-bold text-base sm:text-lg text-[var(--text)]">
                            Crafting a Wax-Sealed Letter
                          </h3>
                        </div>
                      </div>

                      {/* Interactive Stamp Preview */}
                      <div
                        className="w-12 h-12 rounded-full shadow-md border-2 flex items-center justify-center text-white text-lg font-bold select-none cursor-pointer self-start sm:self-center transition-transform hover:scale-105"
                        style={{ backgroundColor: selectedWax.hex, borderColor: selectedWax.border }}
                      >
                        {selectedWax.icon}
                      </div>
                    </div>

                    {/* Wax Color Picker */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider block">
                        Choose Wax Color &amp; Stamp Motif:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {waxColors.map((w) => (
                          <button
                            key={w.name}
                            onClick={() => {
                              setSelectedWax(w);
                              playTactileSound("tap");
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                              selectedWax.name === w.name
                                ? "bg-white border-2 shadow-sm font-bold scale-105"
                                : "bg-white/70 border-slate-200 text-stone-600 hover:bg-white"
                            }`}
                            style={{ borderColor: selectedWax.name === w.name ? w.hex : undefined }}
                          >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: w.hex }} />
                            <span>{w.name}</span>
                            <span>{w.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Letter Draft Excerpt */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
                      <p className="text-[9px] font-mono text-[var(--text-soft)] uppercase">Letter In Progress</p>
                      <p className="font-handwriting text-xl sm:text-2xl text-[var(--text)] leading-relaxed">
                        &quot;Dear Mia, I&apos;m writing this so when you wake up on our anniversary in 18 days, you remember how much I love this quiet world of ours...&quot;
                      </p>
                      <p className="text-right text-xs font-mono text-[var(--text-soft)]">— Alex</p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)]">
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">
                        Seals letter with authentic molten wax imprint
                      </span>
                      <button
                        onClick={() => {
                          setActiveLetterStep(1);
                          playTactileSound("pop");
                        }}
                        className="btn-journal py-2 px-5 text-[10px] w-full sm:w-auto text-center"
                      >
                        Seal &amp; Lock Letter ▷
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeLetterStep === 1 && (
                  <motion.div
                    key="step-lock"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Step 2: LOCK (What was selected in screenshot) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                          🔒
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-wider block">
                            STEP 2 OF 4 · SCHEDULED &amp; ENCRYPTED
                          </span>
                          <h3 className="font-display italic font-bold text-base sm:text-lg text-[var(--text)]">
                            Anniversary Letter for Mia
                          </h3>
                        </div>
                      </div>

                      <div
                        className="w-12 h-12 rounded-full shadow-md border-2 flex items-center justify-center text-white text-lg font-bold select-none self-start sm:self-center"
                        style={{ backgroundColor: selectedWax.hex, borderColor: selectedWax.border }}
                      >
                        {selectedWax.icon}
                      </div>
                    </div>

                    {/* Lock Countdown Display */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center space-y-3">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block">
                        SCHEDULED TO UNSEAL TOGETHER IN:
                      </span>
                      <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono font-bold text-lg sm:text-2xl text-amber-950">
                        <div className="bg-white px-2 sm:px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs">
                          18<span className="text-[8px] sm:text-[9px] text-amber-600 block font-normal">DAYS</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white px-2 sm:px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs">
                          14<span className="text-[8px] sm:text-[9px] text-amber-600 block font-normal">HOURS</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white px-2 sm:px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs">
                          22<span className="text-[8px] sm:text-[9px] text-amber-600 block font-normal">MINS</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white px-2 sm:px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs">
                          05<span className="text-[8px] sm:text-[9px] text-amber-600 block font-normal">SECS</span>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-amber-800 leading-relaxed max-w-md mx-auto">
                        Locked with AES-256 encryption. Neither partner can peek early until both devices synchronize on October 14th.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)]">
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">
                        🔒 Safe inside your encrypted relationship vault
                      </span>
                      <button
                        onClick={() => {
                          setActiveLetterStep(2);
                          playTactileSound("paper");
                        }}
                        className="btn-journal py-2 px-5 text-[10px] w-full sm:w-auto text-center"
                      >
                        Fast-Forward to Unseal Day ▷
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeLetterStep === 2 && (
                  <motion.div
                    key="step-open"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Step 3: OPEN */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-xl shrink-0">
                          ✨
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-rose-600 uppercase tracking-wider block">
                            STEP 3 OF 4 · UNSEALED TOGETHER
                          </span>
                          <h3 className="font-display italic font-bold text-base sm:text-lg text-[var(--text)]">
                            The Wax Seal Breaks in Sync
                          </h3>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[var(--burgundy)] border border-rose-200 text-[9px] font-mono font-bold self-start sm:self-center">
                        UNSEALED · OCT 14
                      </span>
                    </div>

                    {/* Unsealed Handwritten Letter */}
                    <div className="p-4 sm:p-7 rounded-2xl bg-white border border-[var(--border)] shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <span className="text-[10px] font-mono text-[var(--text-soft)]">From: Alex · Unsealed 10:00 AM</span>
                        <span className="text-xs">💌</span>
                      </div>
                      <p className="font-handwriting text-xl sm:text-2xl text-[var(--text)] leading-relaxed">
                        &quot;I still remember the rain on our first drive through the hills. You fell asleep with the radio playing, and I knew right then I wanted to protect this quiet world of ours forever.&quot;
                      </p>
                      <p className="text-right font-display italic text-sm text-[var(--burgundy)] font-bold">
                        — Always, Alex
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)]">
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">
                        Both screens unlocked simultaneously with gentle audio chime
                      </span>
                      <button
                        onClick={() => {
                          setActiveLetterStep(3);
                          playTactileSound("tap");
                        }}
                        className="btn-journal py-2 px-5 text-[10px] w-full sm:w-auto text-center"
                      >
                        Write Reply to Alex ▷
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeLetterStep === 3 && (
                  <motion.div
                    key="step-reply"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Step 4: REPLY */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xl shrink-0">
                          📖
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-purple-600 uppercase tracking-wider block">
                            STEP 4 OF 4 · WOVEN INTO THE ARCHIVE
                          </span>
                          <h3 className="font-display italic font-bold text-base sm:text-lg text-[var(--text)]">
                            Mia&apos;s Reply Sealed in Return
                          </h3>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[9px] font-mono font-bold self-start sm:self-center">
                        SAVED TO VOLUME 1
                      </span>
                    </div>

                    {/* Dual Thread Excerpt */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                        <span className="text-[9px] font-mono font-bold text-rose-500 uppercase block">Alex&apos;s Letter:</span>
                        <p className="font-display italic text-stone-700 mt-0.5">
                          &quot;...I knew right then I wanted to protect this quiet world of ours forever.&quot;
                        </p>
                      </div>

                      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[var(--border)] shadow-xs space-y-1">
                        <span className="text-[9px] font-mono font-bold text-purple-600 uppercase block">Mia&apos;s Handwritten Reply:</span>
                        <p className="font-handwriting text-xl sm:text-2xl text-[var(--text)] leading-relaxed">
                          &quot;I wasn&apos;t actually asleep — I was just listening to the rain and your heartbeat. Happy anniversary, my love.&quot;
                        </p>
                        <p className="text-right text-xs font-mono text-[var(--text-soft)]">— Mia ♡</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)]">
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">
                        Kept forever in your private living relationship library
                      </span>
                      <Link
                        href="/love-letter"
                        className="btn-journal py-2 px-5 text-[10px] w-full sm:w-auto text-center"
                        onMouseEnter={() => playTactileSound("tap")}
                      >
                        Start Your First Letter ▷
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* ── 05 · MEMORIES (Polaroids → caption → save) ── */}
        <section id="memories" aria-label="05 Shared Memories" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              05 · SHARED MEMORIES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-[1.15]">
              Polaroids → caption → save.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
              Your relationship isn&apos;t an algorithm feed. It&apos;s living keepsakes pinned to your shared wall.
            </p>
          </motion.div>

          {/* 3 Real Tactile Tilted Polaroids (Fully responsive stack on mobile) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 pt-4">
            
            {/* Polaroid 1 */}
            <div
              className="w-[220px] sm:w-[230px] p-4 pb-6 rounded-lg bg-white shadow-xl border border-stone-200 -rotate-2 sm:-rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300 cursor-pointer relative"
              onMouseEnter={() => playTactileSound("paper")}
            >
              <div className="washi-tape-top" />
              <div className="w-full aspect-[4/3] bg-gradient-to-tr from-amber-100 to-rose-100 rounded flex items-center justify-center text-4xl shadow-inner">
                ☕
              </div>
              <div className="pt-3 text-center">
                <p className="font-handwriting text-xl text-[var(--text)]">First coffee at Blue Tokai</p>
                <p className="text-[9px] font-mono text-[var(--text-soft)] mt-0.5">Oct 12, 2025 · 10:14 AM</p>
              </div>
            </div>

            {/* Polaroid 2 */}
            <div
              className="w-[220px] sm:w-[230px] p-4 pb-6 rounded-lg bg-white shadow-xl border border-stone-200 rotate-1 sm:rotate-2 transition-transform hover:rotate-0 hover:scale-105 duration-300 cursor-pointer relative"
              onMouseEnter={() => playTactileSound("paper")}
            >
              <div className="washi-tape-top" />
              <div className="w-full aspect-[4/3] bg-gradient-to-tr from-sky-100 to-indigo-100 rounded flex items-center justify-center text-4xl shadow-inner">
                🌧️
              </div>
              <div className="pt-3 text-center">
                <p className="font-handwriting text-xl text-[var(--text)]">Midnight rain in the car</p>
                <p className="text-[9px] font-mono text-[var(--text-soft)] mt-0.5">Nov 03, 2025 · 11:42 PM</p>
              </div>
            </div>

            {/* Polaroid 3 */}
            <div
              className="w-[220px] sm:w-[230px] p-4 pb-6 rounded-lg bg-white shadow-xl border border-stone-200 -rotate-1 sm:-rotate-2 transition-transform hover:rotate-0 hover:scale-105 duration-300 cursor-pointer relative"
              onMouseEnter={() => playTactileSound("paper")}
            >
              <div className="washi-tape-top" />
              <div className="w-full aspect-[4/3] bg-gradient-to-tr from-rose-100 to-orange-100 rounded flex items-center justify-center text-4xl shadow-inner">
                🌅
              </div>
              <div className="pt-3 text-center">
                <p className="font-handwriting text-xl text-[var(--text)]">First road trip sunrise</p>
                <p className="text-[9px] font-mono text-[var(--text-soft)] mt-0.5">Dec 24, 2025 · 6:05 AM</p>
              </div>
            </div>

          </div>

          {/* Memory Wall Badges Grid */}
          <div className="pt-8">
            <motion.div
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="memory-wall grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              {memoryWallItems.map((item, i) => (
                <div
                  key={item.label}
                  onMouseEnter={() => playTactileSound("paper")}
                  className="memory-wall-card rounded-xl p-3 sm:p-5 flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md border border-[var(--border)]"
                  style={{
                    background: item.color,
                    transform: `rotate(${item.rotate}deg)`,
                    zIndex: i % 3 === 0 ? 10 : 5,
                  }}
                >
                  <span className="text-xl sm:text-3xl">{item.emoji}</span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 06 · JOURNAL (Prompt → write → archive) ── */}
        <section id="journal" aria-label="06 Couple's Journal" className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                06 · THE COUPLE&apos;S JOURNAL
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                Prompt → write → archive.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                One shared question every single morning. Neither partner can read the other&apos;s reflection until both have submitted — unlocking honest, beautiful closeness.
              </p>
            </div>

            {/* Cozy Hardcover Book Spread */}
            <div className="p-5 sm:p-10 md:p-12 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl relative overflow-hidden paper-grain">
              <div className="washi-tape-top" />
              
              <div className="text-center pb-6 border-b border-[var(--border)] space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] uppercase tracking-widest">
                  DAILY QUESTION · DAY 152
                </span>
                <p className="text-lg sm:text-2xl font-display italic font-bold text-[var(--text)]">
                  &quot;What is a small, quiet moment with you this week that I never want to forget?&quot;
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-6">
                
                {/* Mia's Entry */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 font-mono">Mia&apos;s Answer</span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">SUBMITTED</span>
                  </div>
                  <p className="font-handwriting text-xl sm:text-2xl text-[var(--text)] leading-relaxed">
                    &quot;When we sat by the window during the rainstorm and you handed me the warm mug without saying a word.&quot;
                  </p>
                </div>

                {/* Alex's Entry (Interactive Lock/Unlock Toggle) */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 font-mono">Alex&apos;s Answer</span>
                    <button
                      onClick={() => {
                        setJournalRevealed(!journalRevealed);
                        playTactileSound("tap");
                      }}
                      className="text-[9px] font-mono font-bold text-[var(--burgundy)] underline cursor-pointer"
                    >
                      {journalRevealed ? "Hide Answer" : "Tap To Preview Unlock"}
                    </button>
                  </div>

                  {journalRevealed ? (
                    <p className="font-handwriting text-xl sm:text-2xl text-[var(--text)] leading-relaxed animate-in fade-in duration-300">
                      &quot;Watching you burst out laughing at the airport gate because we both bought the exact same book.&quot;
                    </p>
                  ) : (
                    <div className="p-4 sm:p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                      <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-mono text-slate-500">
                        Locked until both write their entry
                      </p>
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-[var(--text-soft)]">
                <span>Bound into Volume 1 · 152 Entries Kept</span>
                <span className="font-bold text-[var(--burgundy)]">Permanent Keepsake Archive</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 07 · RITUALS (Games & Activities Directory from Screenshot 4 & 5) ── */}
        <section id="rituals" aria-label="07 Games and Activities Directory" className="max-w-[1180px] mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-10">
          
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              07 · CONNECTION RITUALS
            </span>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)]">
                15 ways to spend an <span className="text-[var(--burgundy)]">evening together.</span>
              </h2>
              <div className="hidden sm:block flex-1 h-[1px] bg-[var(--border)] ml-4" />
            </div>
          </div>

          {/* Featured Banner: Online Photobooth (ALWAYS FREE) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-5 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 paper-grain"
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
                  The realtime 4-frame photo booth for two — a shared countdown fires the shot on both screens at once, so every frame holds both of you.
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

          {/* 3x3 Real Rituals Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* 1: Love Match */}
            <Link
              href="/play/love-match"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-purple-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 2: Know Me Quiz */}
            <Link
              href="/quiz"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-[var(--burgundy)]/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 3: IQ Duel */}
            <Link
              href="/iq-duel"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-blue-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 4: Couples Debate */}
            <Link
              href="/vibe-judge"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-emerald-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 5: Riddle Night */}
            <Link
              href="/riddle"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-amber-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 6: Watch Together */}
            <Link
              href="/watch"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-indigo-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 7: Gratitude Jar */}
            <Link
              href="/gratitude-jar"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-rose-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 8: Love Letters */}
            <Link
              href="/love-letter"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-[var(--burgundy)]/40 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

            {/* 9: Focus Session */}
            <Link
              href="/focus"
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[var(--border)] shadow-xs hover:border-teal-400/50 hover:shadow-md transition-all group flex flex-col justify-between text-left space-y-3"
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

          </div>
        </section>

        {/* ── 08 · PHOTOBOOTH (3 → 2 → 1 → ♡ → strip → memory) ── */}
        <section id="photobooth" aria-label="08 Realtime Photobooth" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-12"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                08 · REALTIME PHOTOBOOTH
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                3 → 2 → 1 → ♡ → strip → memory.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                The synchronized 4-frame photobooth for two. Both of your cameras flash at the exact same instant, developing into a physical-style strip you can download, print, or pin to your wall.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Photobooth Strip Visual */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[190px] sm:w-[200px] p-4 bg-[#FFFDFC] border-2 border-stone-200 rounded-2xl shadow-2xl space-y-3 relative paper-grain">
                  <div className="washi-tape-top" />
                  
                  {/* 4 Photo Frames */}
                  {[
                    { num: "01", pose: "Synchronized Smile ✨", emoji: "😊" },
                    { num: "02", pose: "Heart Hands 💕", emoji: "🫶" },
                    { num: "03", pose: "Silly Face 🤪", emoji: "😝" },
                    { num: "04", pose: "Cheek Kiss ♡", emoji: "🥰" },
                  ].map(frame => (
                    <div key={frame.num} className="aspect-[4/3] bg-gradient-to-br from-rose-50 to-pink-100 rounded-lg border border-rose-200 flex flex-col items-center justify-center p-2 text-center shadow-xs">
                      <span className="text-2xl">{frame.emoji}</span>
                      <span className="text-[8px] font-mono font-bold text-rose-500 mt-1 uppercase">
                        {frame.pose}
                      </span>
                    </div>
                  ))}

                  {/* Photostrip Bottom Print Label */}
                  <div className="pt-2 text-center border-t border-stone-200">
                    <p className="text-[8px] font-mono font-bold text-stone-500 tracking-wider">
                      PAIRFECT PHOTOBOOTH · 2026.09.26
                    </p>
                    <p className="text-[7px] font-mono text-stone-400">
                      ROOM #7821 · DEVELOPED IN SYNC
                    </p>
                  </div>
                </div>
              </div>

              {/* Photobooth Features & Controls */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
                      3s
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)]">Synchronized Web Countdown</h4>
                      <p className="text-xs text-[var(--text-soft)]">No lag. The shutter fires at the exact same millisecond on both devices.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                      🎞️
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)]">Authentic Strip Borders &amp; Stickers</h4>
                      <p className="text-xs text-[var(--text-soft)]">Choose classic film, blush pink, retro sepia, or modern darkroom borders.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[var(--border)] shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                      🖨️
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)]">High-Res Print &amp; Memory Wall</h4>
                      <p className="text-xs text-[var(--text-soft)]">Download print-ready 300DPI strips or pin them straight into your shared story.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Link
                    href="/photo-booth"
                    className="btn-journal"
                    onMouseEnter={() => playTactileSound("tap")}
                  >
                    Open the booth ▷
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* ── 09 · PRESENCE ("Kimi checked in as peaceful.") ── */}
        <section id="presence" aria-label="09 Quiet Presence" className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                09 · QUIET PRESENCE
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                &quot;Kimi checked in as peaceful.&quot;
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                Feel close without the pressure of an endless text thread. Daily check-ins, local weather, and gentle nudges across the miles.
              </p>
            </div>

            {/* Ambient Presence Dashboard Card */}
            <div className="max-w-[700px] mx-auto p-5 sm:p-10 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl relative overflow-hidden paper-grain">
              <div className="washi-tape-top" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
                
                {/* Partner Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-rose-200 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                      🌸
                    </div>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-[var(--text)]">Kimi</h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        🌿 Peaceful
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-soft)] mt-0.5">
                      &quot;Finishing up tea before bed · thinking of you&quot;
                    </p>
                  </div>
                </div>

                {/* Local Weather & Timezone */}
                <div className="text-left sm:text-right sm:border-l sm:pl-6 sm:border-[var(--border)] space-y-1">
                  <div className="flex items-center gap-1.5 sm:justify-end text-xs font-mono text-[var(--text)]">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <span>24°C · Light rain</span>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--text-soft)]">
                    Delhi · 86 miles apart · 11:20 PM
                  </p>
                </div>
              </div>

              {/* Heartbeat Send Nudge */}
              <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-xs font-mono text-[var(--text-soft)]">
                  No read receipts. No typing bubbles. Just gentle ambient closeness.
                </span>

                <button
                  onClick={triggerHeartbeat}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto justify-center ${
                    heartbeatSent
                      ? "bg-rose-500 text-white scale-105"
                      : "bg-white border border-[var(--border)] text-[var(--burgundy)] hover:border-[var(--burgundy)]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${heartbeatSent ? "animate-ping" : ""}`} />
                  <span>{heartbeatSent ? "Heartbeat Delivered! ♡" : "Send Heartbeat ♡"}</span>
                </button>
              </div>

            </div>
          </motion.div>
        </section>

        {/* ── 10 · MEMORY VAULT (Search across the relationship) ── */}
        <section id="vault" aria-label="10 Memory Vault" className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                10 · THE MEMORY VAULT
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                Search across the relationship.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                Every letter, photo, quiz result, and gratitude note is indexed. Filter by date, tag, feeling, or keyword in a single instant.
              </p>
            </div>

            {/* Interactive Vault Search Box */}
            <div className="max-w-[760px] mx-auto space-y-6">
              
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[var(--border)] shadow-md flex items-center gap-3">
                <Search className="w-5 h-5 text-[var(--text-soft)] shrink-0" />
                <input
                  type="text"
                  value={vaultSearchQuery}
                  onChange={(e) => setVaultSearchQuery(e.target.value)}
                  placeholder="Search by date, tag, feeling, or word..."
                  className="w-full text-sm font-mono text-[var(--text)] outline-none bg-transparent"
                />
                {vaultSearchQuery && (
                  <button onClick={() => setVaultSearchQuery("")} className="text-xs text-stone-400 hover:text-stone-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sample Tag Pills to click */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                <span className="text-[10px] text-[var(--text-soft)] uppercase tracking-wider mr-1">Quick Filters:</span>
                {["anniversary", "photobooth", "quiz", "coffee", "gratitude"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setVaultSearchQuery(tag);
                      playTactileSound("tap");
                    }}
                    className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                      vaultSearchQuery.toLowerCase() === tag
                        ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)]"
                        : "bg-white border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Filtered Search Results Cards */}
              <div className="space-y-3 pt-2">
                {filteredVault.length > 0 ? (
                  filteredVault.map((item, idx) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between text-left hover:border-[var(--burgundy)] transition-colors paper-grain gap-2 sm:gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-[var(--text)]">{item.title}</h4>
                            <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-soft)] mt-0.5 line-clamp-1">{item.excerpt}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-soft)] shrink-0 sm:pl-3">
                        {item.date}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-[var(--text-soft)] bg-white rounded-2xl border border-[var(--border)]">
                    No memories found for &quot;{vaultSearchQuery}&quot;. Try filtering by #anniversary or #quiz.
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </section>

        {/* ── 11 · YOUR STORY (Timeline & Relationship Archive from Screenshot 3) ── */}
        <section id="your-story" aria-label="11 Today's Story Preview" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="p-6 sm:p-12 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center paper-grain">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 text-left space-y-5">
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                11 · YOUR STORY
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

            {/* Right Story Feed Showcase (from Screenshot 3) */}
            <div className="lg:col-span-7 relative">
              <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-inner space-y-4">
                <div className="space-y-3">
                  
                  {/* Story Entry 1: Love Letter */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">💌</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Letter Sealed for Anniversary</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Unseals in 14 days · Encrypted</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[var(--burgundy)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full shrink-0">
                      SEALED
                    </span>
                  </div>

                  {/* Story Entry 2: Photobooth */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">📸</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">4-Frame Photobooth Strip</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Saved to shared memories</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                      SAVED
                    </span>
                  </div>

                  {/* Story Entry 3: Daily Quiz */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs flex items-center justify-between text-left gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">✨</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">Know Me Quiz · 100% Match</p>
                        <p className="text-[10px] text-[var(--text-soft)]">Karaoke Songs Pack</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-full shrink-0">
                      MATCHED
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Shared Timeline Milestones */}
          <div className="pt-12 sm:pt-16 text-center space-y-6">
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              Milestones Kept In Order
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
              {timelineMilestones.map((m, i) => (
                <React.Fragment key={m.label}>
                  {i > 0 && (
                    <span className="hidden sm:inline text-[var(--border)] font-mono text-sm">
                      →
                    </span>
                  )}
                  <div
                    className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-sm text-center keepsake-lift cursor-pointer"
                    onMouseEnter={() => playTactileSound("tap")}
                  >
                    <p className="text-lg sm:text-xl mb-0.5 sm:mb-1">{m.emoji}</p>
                    <p className="text-[8px] sm:text-[9px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider whitespace-nowrap">
                      {m.label}
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12 · PRIVACY ("A little world that stays yours.") ── */}
        <section id="privacy" aria-label="12 Privacy by Design" className="max-w-[850px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="bg-[var(--paper-warm)] border border-[var(--border)] p-6 sm:p-12 md:p-14 rounded-3xl text-center space-y-8 shadow-sm relative overflow-hidden paper-grain"
          >
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                12 · PRIVACY BY DESIGN
              </p>
              <h2 className="text-2xl sm:text-3xl font-display italic font-black text-[var(--text)]">
                A little world that stays yours.
              </h2>
              <p className="font-quote italic text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                Not on a public feed. Not inside an ad algorithm. Never used to train public models. Only you two hold the keys.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-lg mx-auto">
              {[
                { icon: <Shield className="w-4 h-4" />, label: "AES-256 Encrypted" },
                { icon: <Lock className="w-4 h-4" />, label: "Invite-Only Rooms" },
                { icon: <Eye className="w-4 h-4" />, label: "Zero Public Feeds" },
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

        {/* ── 13 · PRICING (Actual Paid Plans for Both) ── */}
        <section id="pricing" aria-label="13 Paid Plans" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-12"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                13 · SIMPLE, TRANSPARENT PLANS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
                Actual paid plans. <span className="text-[var(--burgundy)]">Built for two.</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                One pass covers both of you. No hidden subscriptions or recurring entrapment. Upgrade whenever you want infinite memory storage.
              </p>
            </div>

            {/* 3 Pricing Cards (Cashfree Integration) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Plan 1: Free Forever */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-wider">
                      STARTER
                    </span>
                    <h3 className="font-display italic font-bold text-2xl text-[var(--text)]">Free Forever</h3>
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl font-black text-[var(--text)]">₹0</span>
                      <span className="text-xs font-mono text-[var(--text-soft)]">/ forever for two</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[var(--text-soft)] pt-4 border-t border-[var(--border)]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>All 11 connection games &amp; rituals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Unlimited Photobooth sessions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Realtime synchronized dates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>30-day shared memory archive</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Standard digital wax love letters</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/onboarding"
                  className="btn-journal-ghost w-full text-center py-3 text-xs"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Get Started Free
                </Link>
              </div>

              {/* Plan 2: Pairfect Plus 3-Month Pass (Most Popular) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper-warm)] border-2 border-[var(--burgundy)] shadow-xl flex flex-col justify-between space-y-6 relative paper-grain">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--burgundy)] text-white text-[9px] font-mono font-bold uppercase tracking-widest shadow-xs whitespace-nowrap">
                  MOST POPULAR FOR COUPLES
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[var(--burgundy)] uppercase tracking-wider">
                      PAIRFECT PLUS
                    </span>
                    <h3 className="font-display italic font-bold text-2xl text-[var(--text)]">3-Month Pass</h3>
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl font-black text-[var(--burgundy)]">₹249</span>
                      <span className="text-xs font-mono text-[var(--text-soft)]">/ one-time for BOTH of you</span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-600 font-bold">Only ₹125 per partner</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[var(--text)] pt-4 border-t border-[var(--border)]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] font-bold shrink-0" />
                      <span><strong>Everything in Free</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] shrink-0" />
                      <span>Unlimited permanent Memory Wall &amp; Vault</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] shrink-0" />
                      <span>High-Res photostrip print exports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] shrink-0" />
                      <span>Schedule letters up to 10 years ahead</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] shrink-0" />
                      <span>Meanwhile weather &amp; distance card</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--burgundy)] shrink-0" />
                      <span>Custom Spotify cassette mixtape shells</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/checkout?plan=plus-quarterly"
                  className="btn-journal w-full text-center py-3 text-xs"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Get 3-Month Pass ▷
                </Link>
              </div>

              {/* Plan 3: Lifetime Forever Pass */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                      LIFETIME SANCTUARY
                    </span>
                    <h3 className="font-display italic font-bold text-2xl text-[var(--text)]">Forever Pass</h3>
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl font-black text-[var(--text)]">₹699</span>
                      <span className="text-xs font-mono text-[var(--text-soft)] whitespace-nowrap">/ lifetime for both</span>
                    </div>
                    <p className="text-[10px] font-mono text-purple-600 font-bold">Never pay again · Only ₹350 per partner</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[var(--text-soft)] pt-4 border-t border-[var(--border)]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 font-bold shrink-0" />
                      <span><strong>Permanent encrypted living archive for life</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Gold VIP couple badge on profile &amp; room</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Early access to all upcoming date rituals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>All future updates included forever</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/checkout?plan=pairfect-forever"
                  className="btn-journal-ghost w-full text-center py-3 text-xs"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Get Forever Pass ▷
                </Link>
              </div>

            </div>
          </motion.div>
        </section>

        {/* ── 14 · EMOTIONAL PAUSE ("Not another chat app.") ── */}
        <section aria-label="14 Emotional Pause" className="max-w-[800px] mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-8"
          >
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase block">
              14 · AN EMOTIONAL PAUSE
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] leading-tight">
              &quot;Not another chat app.&quot;
            </h2>

            <div className="space-y-4 max-w-lg mx-auto">
              <p className="font-handwriting text-2xl text-[var(--text)] leading-relaxed">
                Chats are for logistics. Pairfect is for love.
              </p>
              <p className="font-sans text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
                One day — years from now — you&apos;ll forget what happened on an ordinary Tuesday. You&apos;ll forget the song playing on the highway, the photo in the booth, the silly inside joke.
              </p>
              <p className="font-display italic text-xl sm:text-2xl text-[var(--burgundy)] font-bold">
                Pairfect won&apos;t.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── 15 · FINAL CTA ("Make a little world of your own.") ── */}
        <section aria-label="15 Final Call to Action" className="max-w-[850px] mx-auto px-4 sm:px-6 pb-24 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="p-6 sm:p-12 md:p-16 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl space-y-8 paper-grain relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--rose)] via-[var(--burgundy)] to-[var(--rose)]" />

            <div className="space-y-3 max-w-md mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase block">
                15 · MAKE A LITTLE WORLD OF YOUR OWN
              </span>
              <h3 className="text-2xl sm:text-3xl font-display italic font-bold text-[var(--text)]">
                Make a little world of your own.
              </h3>
              <p className="text-xs font-mono text-[var(--text-soft)]">
                Enter your 6-character invite code from your partner to open your private room.
              </p>
            </div>

            {/* Quick Room Code Input Box */}
            <form onSubmit={handleJoinWithCode} className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    id={`code-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={joinCode[idx]}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    className="w-9 sm:w-10 h-11 sm:h-12 text-center text-base sm:text-lg font-mono font-bold uppercase rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--burgundy)] focus:ring-2 focus:ring-[var(--burgundy)]/20 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
                <button type="submit" className="btn-journal py-2.5 px-5 sm:px-6 text-[10px]">
                  Join Room Now ▷
                </button>
                <Link href="/onboarding" className="btn-journal py-2.5 px-5 sm:px-6 text-[10px]">
                  Create New Room ▷
                </Link>
                <Link href="/login" className="btn-journal-ghost py-2.5 px-5 sm:px-6 text-[10px]">
                  Sign In With Email
                </Link>
              </div>
            </form>

            {/* Frequently Asked Questions Accordion */}
            <div className="pt-8 sm:pt-10 border-t border-[var(--border)] text-left space-y-4 max-w-xl mx-auto">
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase block text-center">
                FREQUENTLY ASKED QUESTIONS
              </span>

              <div className="space-y-2 divide-y divide-[var(--border)]">
                {[
                  {
                    q: "What games and activities can we play on Pairfect?",
                    a: "Eleven realtime connection rituals and games are live: Love Match, Online Photobooth, Know Me Quiz, IQ Duel, Couples Debate, Riddle Night, Watch Together, Gratitude Jar, Wax-Sealed Letters, Focus Session, and Spotify Mixtapes."
                  },
                  {
                    q: "Is Pairfect free to use?",
                    a: "Yes! Every game, photobooth session, quiz, and wax-sealed letter is 100% free for both of you with a standard 30-day archive."
                  },
                  {
                    q: "How does a realtime online date work?",
                    a: "Open a room, copy your 6-character code, and send it to your partner. They'll join in a single tap, and both of your screens synchronize live in real time."
                  },
                  {
                    q: "Does one subscription cover both partners?",
                    a: "Yes! If either partner upgrades to Pairfect Plus (₹249 for 3 months or ₹699 for lifetime), both of your accounts immediately unlock unlimited memories and all premium features."
                  }
                ].map((faq, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1">
                    <button
                      onClick={() => {
                        setOpenFaqIndex(openFaqIndex === idx ? null : idx);
                        playTactileSound("tap");
                      }}
                      className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-[var(--text)] hover:text-[var(--burgundy)] transition-colors cursor-pointer py-1"
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

          </motion.div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER (Matches Brand Standard)
          ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--border)] py-12 px-4 sm:px-6 bg-[var(--paper-warm)]">
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
            <a href="mailto:pairfect.site@yahoo.com" className="hover:text-[var(--text)] transition-colors">
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
