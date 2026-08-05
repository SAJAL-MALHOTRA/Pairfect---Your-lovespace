"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Lock, Shield, Heart, Eye, Volume2, VolumeX, Sparkles, Tv, Camera,
  HelpCircle, Brain, Music, Film, Flame, Play, Check, ChevronRight, MessageSquare, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
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

      {/* ── TOP ANNOUNCEMENT BANNER (Pairfect Originality + Angie Ribbon Style) ── */}
      <div className="bg-gradient-to-r from-[var(--burgundy)] via-[#D13D68] to-[var(--burgundy)] text-white text-[11px] font-mono py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs z-30 relative">
        <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
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
          <a href="#rituals" className="hover:text-[var(--text)] transition-colors">Rituals</a>
          <Link href="/photo-booth" className="hover:text-[var(--text)] transition-colors">Photobooth</Link>
          <Link href="/love-letter" className="hover:text-[var(--text)] transition-colors">Love Letters</Link>
          <Link href="/watch" className="hover:text-[var(--text)] transition-colors">Watch Together</Link>
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
          MAIN CONTENT — PAIRFECT ORIGINALITY + ANGIE UI SPACING
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full z-10 relative">

        {/* ── HERO SECTION (Pairfect Iconic Positioning + Angie Layout Mechanics) ── */}
        <section aria-label="Hero Introduction" className="max-w-[1280px] mx-auto px-6 pt-10 md:pt-16 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Column: Pairfect Iconic Headline & Single Clear Promise */}
            <div className="w-full lg:w-7/12 text-left space-y-6">
              
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[9px] font-mono font-bold tracking-widest text-[var(--text-soft)] uppercase shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--burgundy)]" />
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
                  href="#rituals"
                  className="btn-journal-ghost"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Explore rituals ▷
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

            {/* Right Column: Real Interactive Pairfect Sanctuary Room UI Mockup */}
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

        {/* ── RITUALS DIRECTORY (Pairfect Features + Angie Clean Spacing & Badges) ── */}
        <section id="rituals" className="max-w-[1100px] mx-auto px-6 py-24 space-y-12">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-soft)] uppercase">
              CONNECTION RITUALS &amp; MEMORIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)]">
              Rituals built for <span className="text-[var(--burgundy)]">two.</span>
            </h2>
            <p className="text-xs font-mono text-[var(--text-soft)]">
              Open a room and send the code to start a shared date night together.
            </p>
          </div>

          {/* 1. Featured Top Activities (2 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature 1: Wax-Sealed Letters */}
            <div className="p-6 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-sm space-y-4 paper-grain keepsake-lift">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-xl">
                  💌
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[var(--burgundy)] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  AES-256 ENCRYPTED
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-display italic font-bold text-[var(--text)]">
                  Wax-Sealed Love Letters
                </h3>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Write letters sealed with digital wax. Schedule them to unseal together on future anniversaries or rainy days.
                </p>
              </div>
              <Link href="/love-letter" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--burgundy)] hover:underline pt-2">
                <span>Write a letter ▷</span>
              </Link>
            </div>

            {/* Feature 2: Online Photobooth */}
            <div className="p-6 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-sm space-y-4 paper-grain keepsake-lift">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">
                  📸
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  FREE TOOL
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-display italic font-bold text-[var(--text)]">
                  Online Photobooth
                </h3>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Take your own 4-frame photo strip right from your browser, customize with stickers &amp; borders, and save to memories.
                </p>
              </div>
              <Link href="/photo-booth" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600 hover:underline pt-2">
                <span>Open photobooth ▷</span>
              </Link>
            </div>

          </div>

          {/* 2. Full Activities Directory Grid */}
          <div className="space-y-6">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              ALL GAMES &amp; ACTIVITIES
            </span>

            {/* 3-Column Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Know Me Quiz */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">❓</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-mono font-bold uppercase">MOST PLAYED</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">Know Me Quiz</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Lock in privately, reveal together, score your compatibility — 17 packs from cute to spicy.
                </p>
                <Link href="/quiz" className="inline-block text-xs font-mono font-bold text-[var(--burgundy)] hover:underline pt-1">
                  Play quiz ▷
                </Link>
              </div>

              {/* Card 2: Synchronized Movie Night */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🍿</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-mono font-bold uppercase">LIVE SYNC</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">Movie Night</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Watch YouTube together in sync or stream Netflix via Virtual Cinema tab share.
                </p>
                <Link href="/watch" className="inline-block text-xs font-mono font-bold text-blue-600 hover:underline pt-1">
                  Start watching ▷
                </Link>
              </div>

              {/* Card 3: Gratitude Jar */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🫙</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-mono font-bold uppercase">DAILY RITUAL</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">Gratitude Jar</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Drop folded notes into a shared jar. Read them together on rainy days.
                </p>
                <Link href="/gratitude-jar" className="inline-block text-xs font-mono font-bold text-emerald-600 hover:underline pt-1">
                  Open jar ▷
                </Link>
              </div>

              {/* Card 4: Riddle Night */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🧩</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[8px] font-mono font-bold uppercase">CO-OP</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">Riddle Night</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Mind-bending logic puzzles and team riddles. Solve clues together before time runs out.
                </p>
                <Link href="/riddle" className="inline-block text-xs font-mono font-bold text-amber-600 hover:underline pt-1">
                  Start riddling ▷
                </Link>
              </div>

              {/* Card 5: IQ Duel */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🧠</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6E9E] text-white text-[8px] font-mono font-bold uppercase">VERSUS</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">IQ Duel</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Fast-paced pattern and logic challenges. Answer privately against the clock in 1-on-1 rounds.
                </p>
                <Link href="/iq-duel" className="inline-block text-xs font-mono font-bold text-[#2E6E9E] hover:underline pt-1">
                  Start duel ▷
                </Link>
              </div>

              {/* Card 6: AI Couples Debate */}
              <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3 keepsake-lift text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xl">⚖️</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E7A60] text-white text-[8px] font-mono font-bold uppercase">AI JUDGE</span>
                </div>
                <h4 className="font-display italic font-bold text-base text-[var(--text)]">Couples Debate</h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Argue your case — an AI judge evaluates both arguments and crowns a playful winner.
                </p>
                <Link href="/vibe-judge" className="inline-block text-xs font-mono font-bold text-[#2E7A60] hover:underline pt-1">
                  Start debate ▷
                </Link>
              </div>

            </div>
          </div>

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

        {/* ── THE MEMORY WALL (Pairfect 3D Perspective Grid) ── */}
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
                  a: "Fifteen realtime activities are live: Know Me Quiz, Riddle Night, IQ Duel, Wax-Sealed Love Letters, Online Photobooth, Couples Debate, Movie Night, Gratitude Jar, Spotify Mixtape, and Stitched Memory Stories."
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
