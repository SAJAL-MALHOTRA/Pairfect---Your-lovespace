"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Lock, Shield, Heart, Eye, Volume2, VolumeX, Sparkles, Tv, Camera,
  HelpCircle, Brain, Music, Film, Flame, Play, Check, ChevronRight, MessageSquare, BookOpen, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Easing curve as specified in motion language system ─── */
const EASE_CUBIC = [0.22, 0.61, 0.36, 1] as const;

/* ─── Shared animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
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

/* ─── Memory Wall Scrapbook Cards ─── */
const memoryScrapbookItems = [
  { emoji: "☕", title: "First Coffee", date: "Oct 14", weather: "☀️ 68°F", rotate: -4, tapeColor: "#FFE3EC" },
  { emoji: "🌅", title: "Sunset Walk", date: "Nov 02", weather: "🌅 62°F", rotate: 3, tapeColor: "#FFD0DD" },
  { emoji: "🎵", title: "Our Song", date: "Nov 19", weather: "🌙 55°F", rotate: -2, tapeColor: "#FFE3EC" },
  { emoji: "✈️", title: "First Trip", date: "Dec 12", weather: "❄️ 42°F", rotate: 5, tapeColor: "#FFD0DD" },
  { emoji: "🌧️", title: "Rainy Day In", date: "Jan 08", weather: "🌧️ 48°F", rotate: -6, tapeColor: "#FFE3EC" },
  { emoji: "🍕", title: "Pizza Night", date: "Jan 24", weather: "🌙 50°F", rotate: 2, tapeColor: "#FFD0DD" },
  { emoji: "📸", title: "Photobooth", date: "Feb 14", weather: "💖 65°F", rotate: -3, tapeColor: "#FFE3EC" },
  { emoji: "💌", title: "First Letter", date: "Mar 01", weather: "🌸 58°F", rotate: 4, tapeColor: "#FFD0DD" },
  { emoji: "🎂", title: "Birthday", date: "Apr 10", weather: "☀️ 72°F", rotate: -5, tapeColor: "#FFE3EC" },
  { emoji: "🌸", title: "Spring Walk", date: "May 04", weather: "🌺 75°F", rotate: 1, tapeColor: "#FFD0DD" },
  { emoji: "🏠", title: "Moved In", date: "Jun 18", weather: "☀️ 80°F", rotate: -2, tapeColor: "#FFE3EC" },
  { emoji: "❤️", title: "Still Us", date: "Today", weather: "✨ Warm", rotate: 3, tapeColor: "#FFD0DD" },
];

/* ─── Timeline milestones ─── */
const timelineMilestones = [
  { emoji: "👋", label: "First Hello", date: "Day 1" },
  { emoji: "☕", label: "First Date", date: "Day 14" },
  { emoji: "✈️", label: "First Trip", date: "Day 90" },
  { emoji: "⚡", label: "First Fight", date: "Day 140" },
  { emoji: "🤝", label: "Made Up", date: "Day 141" },
  { emoji: "🏠", label: "Moved Together", date: "Day 365" },
  { emoji: "💍", label: "Still Choosing Us", date: "Forever" },
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
    <div className="landing-journal relative min-h-screen flex flex-col overflow-hidden bg-[#FFF9FA]">

      {/* ── TOP ANNOUNCEMENT BANNER ── */}
      <div className="bg-gradient-to-r from-[#8C2C3D] via-[#D13D68] to-[#8C2C3D] text-white text-[11px] font-mono py-2.5 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs z-30 relative">
        <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
        <span>Built for two. Kept forever. Your private digital sanctuary.</span>
      </div>

      {/* ── FLOATING DUST PARTICLES ── */}
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
      </div>

      {/* ══════════════════════════════════════════════════════════
          HEADER — Minimal Brand Ribbon & Soundscapes Toggle
          ══════════════════════════════════════════════════════════ */}
      <header className="px-6 py-4 max-w-[1280px] w-full mx-auto flex items-center justify-between z-20 relative bg-[#FFF9FA]/90 backdrop-blur-md sticky top-0 border-b border-[#FFD0DD]">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-display italic text-2xl font-black tracking-tight text-[#3D2432]">
              pairfect
            </span>
            <div className="w-2 h-2 rounded-full bg-[#8C2C3D] animate-pulse" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono font-medium text-[#7A4B5D] uppercase tracking-wider">
          <a href="#rituals" className="hover:text-[#3D2432] transition-colors">Rituals</a>
          <Link href="/photo-booth" className="hover:text-[#3D2432] transition-colors">Photobooth</Link>
          <Link href="/love-letter" className="hover:text-[#3D2432] transition-colors">Love Letters</Link>
          <Link href="/watch" className="hover:text-[#3D2432] transition-colors">Watch</Link>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playTactileSound("pop");
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FFD0DD] bg-[#FFF8FA] text-[9px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider hover:border-[#8C2C3D] transition-colors cursor-pointer"
            aria-label="Toggle ambient soundscapes"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#8C2C3D]" />
                <span>Soundscapes On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#7A4B5D]" />
                <span>Soundscapes Off</span>
              </>
            )}
          </button>

          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[#7A4B5D] hover:text-[#3D2432] transition-colors px-3 py-2"
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
          MAIN CONTENT — OBJECTS ON A MEMORY DESK
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full z-10 relative">

        {/* ── HERO SECTION: REAL PAIRFECT ROOM UI MOCKUP ── */}
        <section aria-label="Hero Introduction" className="max-w-[1280px] mx-auto px-6 pt-12 md:pt-20 pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Column: Focused Single Promise & Action */}
            <div className="w-full lg:w-6/12 text-left space-y-6">
              
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF8FA] border border-[#FFD0DD] text-[9px] font-mono font-bold tracking-widest text-[#7A4B5D] uppercase shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C2C3D]" />
                <span>THE PRIVATE LOVESPACE FOR TWO</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-display italic font-black text-[#3D2432] tracking-tight leading-[1.06]"
              >
                Love deserves <br />
                <span className="text-[#8C2C3D] font-black">
                  better than a chat
                </span> <br />
                history.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.25}
                className="font-sans text-base sm:text-lg text-[#7A4B5D] max-w-[520px] leading-relaxed"
              >
                A private room built exclusively for two people. Share wax-sealed letters, photobooth strips, synchronized movie nights, and daily connection rituals that turn into lifetime keepsakes.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.4}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  href="/onboarding"
                  className="btn-journal py-3 px-8 text-[11px]"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Create Your Room ▷
                </Link>
                <a
                  href="#rituals"
                  className="btn-journal-ghost py-3 px-8 text-[11px]"
                  onMouseEnter={() => playTactileSound("tap")}
                >
                  Explore Keepsakes
                </a>
              </motion.div>
            </div>

            {/* Right Column: REAL PAIRFECT ROOM INTERACTIVE UI MOCKUP (No generic stock image) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
              className="w-full lg:w-6/12 relative"
            >
              <div className="relative p-6 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-2xl space-y-4 paper-grain">
                
                {/* Room Top Bar with Live Partner Cursors */}
                <div className="flex items-center justify-between pb-3 border-b border-[#FFD0DD]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-heading font-bold text-sm text-[#3D2432]">Mia &amp; Alex&apos;s Sanctuary</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7A4B5D] uppercase tracking-wider">ROOM #4829</span>
                </div>

                {/* Live Room Activity Feed Mockup */}
                <div className="space-y-3 pt-1">
                  
                  {/* Live Card 1: Wax Letter Unsealing */}
                  <div className="p-4 rounded-2xl bg-white border border-[#FFD0DD] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#8C2C3D]/10 border border-[#8C2C3D]/30 flex items-center justify-center text-lg">
                        💌
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D2432]">Wax Letter Unsealed Today</p>
                        <p className="text-[10px] text-[#7A4B5D]">Written 365 days ago · Encrypted</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#8C2C3D] bg-[#FFEEF3] px-2.5 py-1 rounded-full">
                      UNSEALED
                    </span>
                  </div>

                  {/* Live Card 2: Photobooth Strip */}
                  <div className="p-4 rounded-2xl bg-white border border-[#FFD0DD] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-lg">
                        📸
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D2432]">4-Frame Photobooth Strip</p>
                        <p className="text-[10px] text-[#7A4B5D]">Added by Mia · Saved to memory wall</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                      SAVED
                    </span>
                  </div>

                  {/* Live Card 3: Synchronized Movie Night */}
                  <div className="p-4 rounded-2xl bg-white border border-[#FFD0DD] shadow-xs flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-lg">
                        🍿
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D2432]">Movie Night: Studio Ghibli</p>
                        <p className="text-[10px] text-[#7A4B5D]">Alex synchronized playhead</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      LIVE SYNC
                    </span>
                  </div>

                </div>

                {/* Live Presence Badges */}
                <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-[#7A4B5D] border-t border-[#FFD0DD]">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">✨ You Online</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold">❤️ Partner Online</span>
                  </div>
                  <span>142 DAYS TOGETHER 🔥</span>
                </div>

              </div>
            </motion.div>

          </div>
        </section>

        {/* ── QUICK ROOM JOIN CODE BOX ── */}
        <section className="max-w-[760px] mx-auto px-6 py-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 paper-grain"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-display italic font-bold text-[#3D2432]">
                Have an invite code from your partner?
              </h3>
              <p className="text-xs font-mono text-[#7A4B5D]">
                Enter your 6-character code to step directly into your shared room.
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
                    className="w-10 h-12 text-center text-lg font-mono font-bold uppercase rounded-xl border border-[#FFD0DD] bg-white text-[#3D2432] focus:border-[#8C2C3D] focus:ring-2 focus:ring-[#8C2C3D]/20 outline-none transition-all"
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


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 2 — OBJECTS ON A MEMORY DESK (Tactile Rituals)
            No rounded rectangle syndrome! Every ritual has its own material.
            ══════════════════════════════════════════════════════════ */}
        <section id="rituals" className="max-w-[1150px] mx-auto px-6 py-24 space-y-16">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#7A4B5D] uppercase">
              RITUALS &amp; KEEPSAKES
            </span>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[#3D2432]">
              Objects on a <span className="text-[#8C2C3D]">memory desk.</span>
            </h2>
            <p className="text-xs font-mono text-[#7A4B5D]">
              Every feature in Pairfect is designed like a physical keepsake you can open, seal, or hold.
            </p>
          </div>

          {/* ── OBJECT GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* OBJECT 1: WAX-SEALED ENVELOPE (Love Letters) */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/love-letter")}>
              <div className="p-6 rounded-t-3xl rounded-b-xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 transition-transform duration-300 group-hover:-translate-y-2 paper-grain relative overflow-hidden">
                
                {/* Envelope Flap Cutout */}
                <div className="absolute top-0 inset-x-0 h-10 bg-[#FFEEF3] border-b border-[#FFD0DD] [clip-path:polygon(0_0,50%_100%,100%_0)]" />
                
                {/* Embossed Wax Seal Button */}
                <div className="pt-6 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#8C2C3D] text-white flex items-center justify-center text-xl shadow-md border-2 border-white font-serif font-black">
                    ⚜️
                  </div>
                </div>

                <div className="text-center space-y-1.5">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#8C2C3D]">AES-256 ENCRYPTED</span>
                  <h3 className="text-xl font-display italic font-bold text-[#3D2432]">Wax-Sealed Letter</h3>
                  <p className="text-xs text-[#7A4B5D] leading-relaxed">
                    Write letters sealed with digital wax. Schedule them to open together on future anniversaries or rainy days.
                  </p>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] font-mono font-bold text-[#8C2C3D] group-hover:underline">Write a letter ▷</span>
                </div>
              </div>
            </div>

            {/* OBJECT 2: FILM STRIP WITH SPROCKET HOLES (Photobooth) */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/photo-booth")}>
              <div className="p-6 rounded-2xl bg-[#2C2628] text-white shadow-xl space-y-4 transition-transform duration-300 group-hover:-translate-y-2 relative overflow-hidden">
                
                {/* Film Sprocket Holes (Left & Right) */}
                <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-2.5 h-3 rounded-xs bg-white/20" />
                  ))}
                </div>
                <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-2.5 h-3 rounded-xs bg-white/20" />
                  ))}
                </div>

                <div className="px-5 space-y-3">
                  <div className="flex items-center justify-between text-[8px] font-mono text-white/60 uppercase">
                    <span>FRAME STRIP 35MM</span>
                    <span>FREE TOOL</span>
                  </div>

                  <div className="aspect-[4/3] rounded-lg bg-black/40 border border-white/20 flex items-center justify-center text-3xl">
                    📸
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-display italic font-bold text-white">4-Frame Photobooth</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Take your own 4-frame strip right from your browser, customize with stickers, and save to memories.
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold text-pink-300 group-hover:underline">Open photobooth ▷</span>
                  </div>
                </div>

              </div>
            </div>

            {/* OBJECT 3: VINTAGE CINEMA TICKET (Movie Night) */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/watch")}>
              <div className="p-6 rounded-2xl bg-[#1A1418] border border-amber-500/30 text-amber-100 shadow-xl space-y-4 transition-transform duration-300 group-hover:-translate-y-2 relative overflow-hidden">
                
                {/* Ticket Notch (Left & Right Cutouts) */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FFF9FA]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FFF9FA]" />

                <div className="px-3 space-y-3">
                  <div className="flex items-center justify-between text-[8px] font-mono text-amber-400 uppercase tracking-widest border-b border-amber-500/20 pb-2">
                    <span>ADM-01 · LIVE SYNC</span>
                    <span>ADMIT TWO</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-display italic font-bold text-amber-200">Movie Night Ticket</h3>
                    <p className="text-xs text-amber-100/70 leading-relaxed">
                      Watch YouTube videos together with synchronized playback controls and live reaction floating emojis.
                    </p>
                  </div>

                  {/* Golden Barcode */}
                  <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
                    <span className="text-[8px] font-mono text-amber-400/60">||| |||| || | |||||</span>
                    <span className="text-[10px] font-mono font-bold text-amber-300 group-hover:underline">Start watching ▷</span>
                  </div>
                </div>

              </div>
            </div>

            {/* OBJECT 4: GLASS GRATITUDE JAR */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/gratitude-jar")}>
              <div className="p-6 rounded-3xl bg-[#FFF8FA] border border-emerald-200 shadow-md space-y-4 transition-transform duration-300 group-hover:-translate-y-2 paper-grain relative">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                  🫙
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-emerald-600">DAILY APPRECIATION</span>
                  <h3 className="text-xl font-display italic font-bold text-[#3D2432]">Gratitude Jar</h3>
                  <p className="text-xs text-[#7A4B5D] leading-relaxed">
                    Drop folded notes into a shared glass jar. Draw random notes together on quiet evenings.
                  </p>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 group-hover:underline">Open jar ▷</span>
                </div>
              </div>
            </div>

            {/* OBJECT 5: PLAYING CARD (Riddle & Quiz) */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/quiz")}>
              <div className="p-6 rounded-2xl bg-[#FFF8FA] border-2 border-[#FFD0DD] shadow-md space-y-4 transition-transform duration-300 group-hover:-translate-y-2 paper-grain relative">
                
                {/* Playing card corner suits */}
                <div className="flex justify-between text-xs font-mono font-bold text-[#8C2C3D]">
                  <span>A ♥</span>
                  <span>♥ A</span>
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className="text-xl font-display italic font-bold text-[#3D2432]">Know Me Quiz</h3>
                  <p className="text-xs text-[#7A4B5D] leading-relaxed">
                    Lock in privately, reveal together, and score your compatibility across 17 distinct packs.
                  </p>
                </div>

                <div className="pt-1 text-center">
                  <span className="text-[10px] font-mono font-bold text-[#8C2C3D] group-hover:underline">Play quiz ▷</span>
                </div>
              </div>
            </div>

            {/* OBJECT 6: STITCHED LINEN NOTEBOOK (Timeline) */}
            <div className="relative group cursor-pointer" onClick={() => router.push("/stories")}>
              <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-md space-y-4 transition-transform duration-300 group-hover:-translate-y-2 paper-grain relative border-l-4 border-l-[#8C2C3D]">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">
                  📜
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-purple-600">STITCHED TIMELINE</span>
                  <h3 className="text-xl font-display italic font-bold text-[#3D2432]">Memory Timeline</h3>
                  <p className="text-xs text-[#7A4B5D] leading-relaxed">
                    A living notebook of your relationship milestones from first hello to years from now.
                  </p>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] font-mono font-bold text-purple-600 group-hover:underline">View timeline ▷</span>
                </div>
              </div>
            </div>

          </div>

        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 3 — THE MEMORY SCRAPBOOK WALL (Real Memories Feel)
            Scrapbook cards with tape corners, weather & date stamps
            ══════════════════════════════════════════════════════════ */}
        <section aria-label="The Memory Wall" className="max-w-[1150px] mx-auto px-6 py-20 space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="text-center space-y-3"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#7A4B5D] uppercase">
              The Memory Wall
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[#3D2432] leading-[1.12]">
              Every moment you&apos;ve kept. <br />
              <span className="text-[#8C2C3D]">All in your private vault.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.2}
            className="memory-wall grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"
          >
            {memoryScrapbookItems.map((item, i) => (
              <div
                key={item.title}
                onMouseEnter={() => playTactileSound("paper")}
                className="relative rounded-2xl p-4 flex flex-col items-center justify-between gap-3 cursor-pointer shadow-md border border-[#FFD0DD] transition-all hover:scale-105 hover:shadow-xl hover:z-20 paper-grain"
                style={{
                  background: "#FFF8FA",
                  transform: `rotate(${item.rotate}deg)`,
                }}
              >
                {/* Translucent Washi Tape Corner */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 opacity-75 backdrop-blur-xs border border-white/40 shadow-xs"
                  style={{ background: item.tapeColor }}
                />

                <span className="text-3xl pt-2">{item.emoji}</span>

                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold text-[#3D2432]">{item.title}</p>
                  <p className="text-[9px] font-mono text-[#7A4B5D]">{item.date} · {item.weather}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 4 — STITCHED LINEN TIMELINE
            ══════════════════════════════════════════════════════════ */}
        <section aria-label="Shared Memory Timeline" className="max-w-[900px] mx-auto px-6 py-20 text-center space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="space-y-3"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#7A4B5D] uppercase">
              Stitched Notebook Timeline
            </p>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[#3D2432]">
              Time passes. Love stays.
            </h2>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.15}
            className="p-8 rounded-3xl bg-[#FFF8FA] border-2 border-dashed border-[#FFD0DD] shadow-md paper-grain"
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              {timelineMilestones.map((m, i) => (
                <React.Fragment key={m.label}>
                  {i > 0 && (
                    <span className="hidden sm:inline text-[#FFD0DD] font-mono text-sm font-bold">
                      ➔
                    </span>
                  )}
                  <div
                    className="px-4 py-3 rounded-2xl bg-white border border-[#FFD0DD] shadow-xs text-center keepsake-lift cursor-pointer hover:border-[#8C2C3D]"
                    onMouseEnter={() => playTactileSound("tap")}
                  >
                    <p className="text-xl mb-0.5">{m.emoji}</p>
                    <p className="text-xs font-bold text-[#3D2432]">{m.label}</p>
                    <p className="text-[9px] font-mono text-[#7A4B5D] uppercase">{m.date}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 5 — PRIVACY VAULT (Show Privacy, Don't Tell!)
            A physical embossed lockbox vault instead of generic 4 boxes
            ══════════════════════════════════════════════════════════ */}
        <section aria-label="Privacy Guarantees" className="max-w-[850px] mx-auto px-6 py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="p-10 md:p-14 rounded-3xl bg-[#2C2628] text-white text-center space-y-8 shadow-2xl relative overflow-hidden border border-white/10"
          >
            {/* Embossed Brass Lock Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 text-[#2C2628] flex items-center justify-center shadow-xl border-2 border-white/40">
                <Key className="w-7 h-7 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-amber-300 uppercase">
                PRIVACY BY DESIGN
              </p>
              <h2 className="text-2xl sm:text-3xl font-display italic font-black text-white">
                Your memories belong here.
              </h2>
              <p className="font-quote italic text-base text-white/70 leading-relaxed">
                Not on a public feed. Not inside an algorithm. Only you two hold the key.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto pt-2">
              <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white/90 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>AES-256 Encrypted Letters</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white/90 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Invite-Only Rooms</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white/90 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>No Public Feeds</span>
              </div>
            </div>
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 5.5 — TACTILE INDEX CARD FAQ BOX
            Cards flip & lift like an index card box
            ══════════════════════════════════════════════════════════ */}
        <section aria-label="Frequently Asked Questions" className="max-w-[850px] mx-auto px-6 py-16 text-left">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#7A4B5D] uppercase">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[#3D2432]">
                Everything you need to <span className="text-[#8C2C3D]">ask.</span>
              </h2>
            </div>

            <div className="space-y-4 pt-4">
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
                <div
                  key={idx}
                  onClick={() => {
                    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
                    playTactileSound("tap");
                  }}
                  className="p-5 rounded-2xl bg-[#FFF8FA] border border-[#FFD0DD] shadow-xs cursor-pointer transition-all hover:border-[#8C2C3D] hover:shadow-md paper-grain"
                >
                  <div className="flex items-center justify-between text-sm sm:text-base font-bold text-[#3D2432]">
                    <span>{faq.q}</span>
                    <span className="font-mono text-xs text-[#8C2C3D] pl-4">
                      {openFaqIndex === idx ? "✕" : "+"}
                    </span>
                  </div>
                  {openFaqIndex === idx && (
                    <p className="text-xs text-[#7A4B5D] font-sans leading-relaxed pt-3 border-t border-[#FFD0DD] mt-3">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 6 — CINEMATIC CLOSING CTA (Handwritten Letter)
            Everything fades into a quiet candlelit ending
            ══════════════════════════════════════════════════════════ */}
        <section aria-label="Call to Action" className="max-w-[850px] mx-auto px-6 py-24">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="bg-[#2C2628] text-white p-12 md:p-16 rounded-3xl text-center space-y-8 shadow-2xl relative overflow-hidden border border-white/10"
          >
            <div className="space-y-6 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-pink-300 uppercase">
                ONE LAST PAGE WAITS
              </p>

              <p className="text-xl sm:text-2xl font-display italic font-bold text-white leading-relaxed">
                Imagine this.
              </p>
              <p className="font-handwriting text-2xl sm:text-3xl text-pink-200 leading-relaxed">
                One day — years from now — you&apos;ll forget what happened on an ordinary Tuesday.
              </p>
              <p className="font-quote italic text-lg text-pink-300 font-bold">
                But Pairfect won&apos;t.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <Link
                href="/signup"
                className="btn-journal bg-[#8C2C3D] hover:bg-[#D13D68] text-white py-3.5 px-10 text-xs shadow-xl"
                onMouseEnter={() => playTactileSound("pop")}
              >
                Start Writing Together <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — Handcrafted Book Binding Stamp
          ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#FFD0DD] py-12 px-6 bg-[#FFF8FA]">
        <div className="max-w-[1150px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-display italic text-lg font-black tracking-tight text-[#3D2432]">
                pairfect
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#8C2C3D]" />
            </div>
            <p className="text-[10px] text-[#7A4B5D] font-mono">
              The private digital sanctuary &amp; living archive for two.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#7A4B5D] font-mono">
            <Link href="/privacy" className="hover:text-[#3D2432] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#3D2432] transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@pairfect.app" className="hover:text-[#3D2432] transition-colors">
              Contact
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-[#7A4B5D] font-mono">
              &copy; 2026 Pairfect. Built for two. Kept forever.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
