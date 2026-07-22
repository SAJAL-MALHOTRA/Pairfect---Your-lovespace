"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart, Sparkles, Music, Shield, ArrowRight, Play, Camera, Brain, Smile, Timer, Tv, Lock, Check,
  Clock, Sun, Coffee, Film, Gift, Flame, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoveLetterEnvelope, OpenScrapbook, PhotoboothFilmStrip, GratitudeJarRitual } from "@/components/cozy-illustrations";

export default function LandingContent() {
  const [sealUnsealed, setSealUnsealed] = useState(false);
  const [activeCheckinState, setActiveCheckinState] = useState<"happy" | "content" | "loved">("happy");

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[var(--bg)] transition-colors duration-300 overflow-hidden paper-grain">
      
      {/* ── Dynamic CSS Keyframes & Floating Heart Particles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-heart-quiet {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.7) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.14;
          }
          85% {
            opacity: 0.14;
          }
          100% {
            transform: translateY(-10vh) translateX(35px) scale(1.05) rotate(30deg);
            opacity: 0;
          }
        }
        .floating-quiet-heart {
          position: absolute;
          bottom: -50px;
          pointer-events: none;
          z-index: 1;
          color: var(--burgundy);
          fill: var(--rose);
          opacity: 0;
        }
      `}} />

      {/* Floating Quiet Hearts Layer */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <Heart className="floating-quiet-heart" style={{ left: "6%", animation: "float-heart-quiet 22s infinite linear", animationDelay: "0s" }} size={22} />
        <Heart className="floating-quiet-heart" style={{ left: "20%", animation: "float-heart-quiet 28s infinite linear", animationDelay: "4s" }} size={16} />
        <Heart className="floating-quiet-heart" style={{ left: "38%", animation: "float-heart-quiet 20s infinite linear", animationDelay: "1s" }} size={24} />
        <Heart className="floating-quiet-heart" style={{ left: "52%", animation: "float-heart-quiet 26s infinite linear", animationDelay: "6s" }} size={20} />
        <Heart className="floating-quiet-heart" style={{ left: "68%", animation: "float-heart-quiet 24s infinite linear", animationDelay: "2s" }} size={18} />
        <Heart className="floating-quiet-heart" style={{ left: "84%", animation: "float-heart-quiet 29s infinite linear", animationDelay: "5s" }} size={26} />
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <header className="px-6 py-5 max-w-6xl w-full mx-auto flex items-center justify-between z-20 relative bg-[var(--background)]/85 backdrop-blur-md sticky top-0 border-b border-[var(--border-mid)]">
        <div className="flex items-center space-x-2.5">
          <span className="font-display italic text-2xl font-black tracking-tight text-[var(--ink-dark)]">
            pairfect
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)] animate-pulse" />
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[var(--ink-mid)] hover:text-[var(--ink-dark)] transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary py-2.5 px-5 text-[10px] uppercase tracking-widest"
          >
            <span>Start Your Story</span>
          </Link>
        </div>
      </header>

      {/* ── MAIN NARRATIVE CONTENT ── */}
      <main className="flex-1 w-full mx-auto max-w-5xl px-6 py-12 md:py-20 flex flex-col space-y-36 z-10 relative">

        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 1 — A QUIET BEGINNING (HERO)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto pt-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--border-mid)] text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-[var(--seal-red)]" />
            <span>A Quiet Room Built Only For Two</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display italic font-black text-[var(--ink-dark)] tracking-tight leading-[1.15]">
              Some moments deserve <br className="hidden sm:block" />
              more than disappearing messages.
            </h1>
            <p className="text-xl sm:text-2xl font-quote italic text-[var(--seal-red)] font-semibold">
              They deserve a place where only two people exist.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="space-y-4 max-w-lg"
          >
            <p className="text-sm font-handwriting text-lg text-[var(--ink-mid)] leading-relaxed">
              Welcome to Pairfect.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-[var(--ink-light)] pt-1">
              <span>No followers.</span>
              <span>•</span>
              <span>No likes.</span>
              <span>•</span>
              <span>No algorithms.</span>
              <span>•</span>
              <span className="text-[var(--ink-dark)] font-bold">Just the two of you.</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-4"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto btn-primary py-3.5 px-8 text-[11px] uppercase tracking-widest shadow-md"
            >
              <span>Start Your Story 💌</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto btn-secondary py-3.5 px-8 text-[11px] uppercase tracking-widest"
            >
              <span>Sign In With Partner</span>
            </Link>
          </motion.div>

          {/* Hero Visual: Memory Box Polaroid Stack with Sunlight Shimmer Sweep */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
            className="relative pt-8 w-full max-w-md mx-auto select-none"
          >
            <div className="relative border border-[var(--border-mid)] bg-[var(--card-bg)] p-5 rounded-3xl shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500 paper-grain overflow-hidden">
              {/* Specular sunlight shimmer sweep overlay */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -rotate-45 shimmer-active" />
              </div>

              <div className="flex items-center justify-between mb-4 border-b border-[var(--border-mid)] pb-2.5">
                <span className="text-[9px] font-mono font-bold text-[var(--ink-light)] uppercase tracking-wider">
                  OUR DIGITAL MEMORY BOX
                </span>
                <span className="text-[9px] font-mono text-[var(--seal-red)] font-bold">152 DAYS TOGETHER 🔥</span>
              </div>

              <div className="space-y-4">
                <div className="polaroid rounded-2xl overflow-hidden shadow-sm relative">
                  <div className="aspect-[4/3] bg-[var(--paper-warm)] relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=450&fit=crop"
                      className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-500"
                      alt="Cozy memory"
                    />
                  </div>
                  <p className="font-handwriting text-base text-center text-[var(--ink-dark)] mt-2">
                    "Quiet coffee together on a rainy Sunday."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 2 — THE BEGINNING OF YOUR STORY (A DAY TOGETHER)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-12 text-center max-w-3xl mx-auto">
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 2 · A DAY TOGETHER
            </span>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--ink-dark)]">
              What does a day feel like inside Pairfect?
            </h2>
            <p className="font-quote italic text-sm text-[var(--ink-mid)]">
              From a quiet good morning to falling asleep under the same stars.
            </p>
          </div>

          {/* Connected Vertical Timeline */}
          <div className="relative pl-6 sm:pl-0 max-w-xl mx-auto space-y-8 before:absolute before:left-6 sm:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-[var(--seal-red)]/20 before:via-[var(--rose)] before:to-[var(--seal-red)]/20">
            
            {/* Timeline Item 1: Morning */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="sm:w-1/2 sm:text-right pr-6 space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">☀️ 08:30 AM</span>
                <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Good Morning Note</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--paper-warm)] border-2 border-[var(--seal-red)] flex items-center justify-center text-xs z-10 shadow-xs sm:mx-auto">
                ❤️
              </div>
              <div className="sm:w-1/2 sm:text-left pl-6">
                <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] shadow-xs inline-block text-left">
                  <p className="font-handwriting text-sm text-[var(--ink-dark)]">"Good morning my love! Hope your day starts with sunshine ☕"</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 2: Mood Check-in */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="sm:w-1/2 sm:text-right pr-6 order-1 sm:order-1">
                <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] shadow-xs inline-block text-left sm:text-right">
                  <p className="text-xs font-mono font-bold text-[var(--ink-dark)]">😊 Content &amp; Loved</p>
                  <p className="text-[10px] text-[var(--ink-mid)] font-mono">Intensity: 5/5 · Note: "Ready for the day!"</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--paper-warm)] border-2 border-[var(--seal-red)] flex items-center justify-center text-xs z-10 shadow-xs sm:mx-auto order-2 sm:order-2">
                😊
              </div>
              <div className="sm:w-1/2 sm:text-left pl-6 order-3 sm:order-3 space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">😊 11:00 AM</span>
                <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Daily Mood Check-in</p>
              </div>
            </div>

            {/* Timeline Item 3: Shared Playlist */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="sm:w-1/2 sm:text-right pr-6 space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">🎵 03:15 PM</span>
                <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Shared Playlist</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--paper-warm)] border-2 border-[var(--seal-red)] flex items-center justify-center text-xs z-10 shadow-xs sm:mx-auto">
                🎵
              </div>
              <div className="sm:w-1/2 sm:text-left pl-6">
                <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] shadow-xs inline-block text-left">
                  <p className="text-xs font-bold text-[var(--ink-dark)]">Now Playing: Laufey — Promise</p>
                  <p className="text-[10px] text-[var(--ink-mid)] font-mono">Shared Mixtape Vol. 1</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 4: Love Letter */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="sm:w-1/2 sm:text-right pr-6 order-1 sm:order-1">
                <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] shadow-xs inline-block text-left sm:text-right">
                  <p className="font-handwriting text-sm text-[var(--ink-dark)]">"A wax-sealed letter arrived in your inbox 💌"</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--paper-warm)] border-2 border-[var(--seal-red)] flex items-center justify-center text-xs z-10 shadow-xs sm:mx-auto order-2 sm:order-2">
                💌
              </div>
              <div className="sm:w-1/2 sm:text-left pl-6 order-3 sm:order-3 space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">💌 07:45 PM</span>
                <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Wax-Sealed Love Letter</p>
              </div>
            </div>

            {/* Timeline Item 5: Movie Night */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="sm:w-1/2 sm:text-right pr-6 space-y-1">
                <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">🍿 09:30 PM</span>
                <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Synchronized Movie Night</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--paper-warm)] border-2 border-[var(--seal-red)] flex items-center justify-center text-xs z-10 shadow-xs sm:mx-auto">
                🍿
              </div>
              <div className="sm:w-1/2 sm:text-left pl-6">
                <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] shadow-xs inline-block text-left">
                  <p className="text-xs font-bold text-[var(--ink-dark)]">Watching Together</p>
                  <p className="text-[10px] text-[var(--ink-mid)] font-mono">YouTube Stream · 01:22 / 03:54</p>
                </div>
              </div>
            </div>

            {/* Timeline End Badge */}
            <div className="pt-4 flex justify-center">
              <div className="px-5 py-2 rounded-full bg-[var(--paper-warm)] border border-[var(--border-warm)] text-xs font-mono font-bold text-[var(--seal-red)] shadow-xs">
                ✨ 365 Days &amp; Forever Together
              </div>
            </div>

          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 3 — MOMENTS, NOT FEATURES (TACTILE FEATURE WINDOWS)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 3 · MOMENTS, NOT FEATURES
            </span>
            <h2 className="text-3xl font-display italic font-black text-[var(--ink-dark)]">
              Windows into your private room.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Window 1: Daily Mood Check-In */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl shadow-sm space-y-5 paper-grain">
              <div className="flex items-center justify-between border-b border-[var(--border-mid)] pb-3">
                <span className="text-[9px] font-mono font-bold text-[var(--ink-light)] uppercase tracking-wider">DAILY CHECK-IN</span>
                <span className="text-[9px] font-mono text-[var(--seal-red)] font-bold">STREAK: 152 DAYS 🔥</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-dark)]">
                    <span>😊 Happy</span>
                    <span className="text-xs font-mono text-[var(--ink-light)]">Energy: 80%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border-mid)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#f472b6] to-[#60a5fa] w-[80%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--ink-mid)]">Partner Status:</span>
                  <span className="text-xs font-bold text-[var(--seal-red)] font-mono">🥰 Excited</span>
                </div>
              </div>
            </div>

            {/* Window 2: Wax-Sealed Love Letter */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl shadow-sm space-y-5 paper-grain relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-mid)] pb-3">
                <span className="text-[9px] font-mono font-bold text-[var(--ink-light)] uppercase tracking-wider">LOVE LETTER</span>
                <span className="text-[9px] font-mono text-[var(--ink-mid)]">SEALED WITH WAX</span>
              </div>

              <div className="paper-lined p-5 rounded-2xl border border-[var(--border-warm)] relative min-h-[140px] flex flex-col justify-between">
                <p className="font-handwriting text-base text-[var(--ink-dark)] leading-relaxed">
                  "Dear Love, Today's sunset reminded me of our first walk together..."
                </p>
                <div className="flex items-center justify-between pt-3 text-[10px] font-mono text-[var(--ink-light)]">
                  <span>From: Alex</span>
                  <button
                    onClick={() => setSealUnsealed(!sealUnsealed)}
                    className="btn-primary py-1 px-3 text-[9px] uppercase tracking-widest cursor-pointer"
                  >
                    {sealUnsealed ? "Seal Letter 🏷️" : "Unseal Envelope 💌"}
                  </button>
                </div>
              </div>
            </div>

            {/* Window 3: Watch Together */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl shadow-sm space-y-5 paper-grain">
              <div className="flex items-center justify-between border-b border-[var(--border-mid)] pb-3">
                <span className="text-[9px] font-mono font-bold text-[var(--ink-light)] uppercase tracking-wider">SYNCHRONIZED STREAMING</span>
                <span className="text-[9px] font-mono text-emerald-600 font-bold">LIVE SYNC ●</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[var(--seal-red)]" />
                    <span className="text-xs font-bold text-[var(--ink-dark)]">Laufey — Promise (Official Video)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--ink-light)]">01:22 / 03:54</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--border-mid)] overflow-hidden">
                  <div className="h-full bg-[var(--seal-red)] w-[35%]" />
                </div>
              </div>
            </div>

            {/* Window 4: Scrapbook Overlapping Collage */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl shadow-sm space-y-5 paper-grain">
              <div className="flex items-center justify-between border-b border-[var(--border-mid)] pb-3">
                <span className="text-[9px] font-mono font-bold text-[var(--ink-light)] uppercase tracking-wider">SCRAPBOOK MEMORIES</span>
                <span className="text-[9px] font-mono text-[var(--ink-mid)]">POLAROIDS &amp; KEEPSAKES</span>
              </div>

              <div className="relative h-36 flex items-center justify-center">
                <div className="polaroid absolute left-4 top-2 w-28 -rotate-6 shadow-md hover:rotate-0 hover:z-10 transition-transform">
                  <div className="aspect-[4/3] bg-rose-100 rounded overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200&h=150&fit=crop" className="w-full h-full object-cover" alt="Memory" />
                  </div>
                  <p className="text-[8px] font-mono text-center text-gray-500 mt-1">Coffee Date</p>
                </div>
                <div className="polaroid absolute right-4 top-4 w-28 rotate-6 shadow-md hover:rotate-0 hover:z-10 transition-transform">
                  <div className="aspect-[4/3] bg-sky-100 rounded overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&h=150&fit=crop" className="w-full h-full object-cover" alt="Memory" />
                  </div>
                  <p className="text-[8px] font-mono text-center text-gray-500 mt-1">Sunset Walk</p>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 4 — PRIVACY WITHOUT SAYING PRIVACY
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-10 md:p-14 rounded-3xl text-center space-y-8 paper-grain relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

          <div className="space-y-3 max-w-xl mx-auto">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 4 · TRUST &amp; PRIVACY
            </span>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--ink-dark)]">
              Your memories belong here.
            </h2>
            <p className="text-sm font-handwriting text-lg text-[var(--ink-mid)] leading-relaxed">
              Not on a public feed. Not inside an algorithm. Only you two can open them.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] flex flex-col items-center space-y-1.5">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-mono font-bold text-[var(--ink-dark)]">End-to-End Private</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] flex flex-col items-center space-y-1.5">
              <Lock className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-mono font-bold text-[var(--ink-dark)]">Invite Only</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] flex flex-col items-center space-y-1.5">
              <Check className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-mono font-bold text-[var(--ink-dark)]">No Public Profiles</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] flex flex-col items-center space-y-1.5">
              <Heart className="w-5 h-5 text-[var(--seal-red)]" />
              <span className="text-xs font-mono font-bold text-[var(--ink-dark)]">No Follower Counts</span>
            </div>
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 5 — GROWING TOGETHER (ALTERNATING SHOWCASES)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-20">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 5 · GROWING TOGETHER
            </span>
            <h2 className="text-3xl font-display italic font-black text-[var(--ink-dark)]">
              Crafted for long-term connection.
            </h2>
          </div>

          {/* Showcase 1: Image Left, Text Right */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 w-full">
              <div className="border border-[var(--border-mid)] bg-[var(--card-bg)] p-6 rounded-3xl shadow-md paper-grain">
                <OpenScrapbook className="w-full h-56" />
              </div>
            </div>
            <div className="flex-1 space-y-4 text-left">
              <span className="text-[9px] font-mono font-bold text-[var(--seal-red)] uppercase tracking-wider">DAILY CHECK-INS</span>
              <h3 className="text-2xl font-display italic font-bold text-[var(--ink-dark)]">
                Know how your partner feels before they even tell you.
              </h3>
              <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                A quiet daily pulse check with intensity meters, notes, and streak counters. Helps long-distance and co-located couples stay emotionally aligned without overwhelming chats.
              </p>
              <Link href="/signup" className="btn-primary py-2.5 px-5 text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <span>Create Today's Check-in</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Showcase 2: Text Left, Image Right */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 w-full">
              <div className="border border-[var(--border-mid)] bg-[var(--card-bg)] p-6 rounded-3xl shadow-md paper-grain flex items-center justify-center">
                <LoveLetterEnvelope className="w-full h-56" />
              </div>
            </div>
            <div className="flex-1 space-y-4 text-left">
              <span className="text-[9px] font-mono font-bold text-purple-600 uppercase tracking-wider">WAX-SEALED LETTERS</span>
              <h3 className="text-2xl font-display italic font-bold text-[var(--ink-dark)]">
                Write thoughts that deserve more than a text message.
              </h3>
              <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                Digital envelopes featuring physical-looking wax seal unsealing, ink bleed transitions, and synthesized audio. Every letter is stored with AES-256-CBC encryption.
              </p>
              <Link href="/signup" className="btn-secondary py-2.5 px-5 text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <span>Write a Sealed Letter</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Showcase 3: Image Left, Text Right */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 w-full">
              <div className="border border-[var(--border-mid)] bg-[var(--card-bg)] p-6 rounded-3xl shadow-md paper-grain">
                <PhotoboothFilmStrip className="w-full h-56" />
              </div>
            </div>
            <div className="flex-1 space-y-4 text-left">
              <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-wider">WEBCAM PHOTOBOOTH</span>
              <h3 className="text-2xl font-display italic font-bold text-[var(--ink-dark)]">
                Capture real, unfiltered smiles together.
              </h3>
              <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                4-pose burst countdown camera, custom theme patterns, draggable stickers, and high-res strip exports. Built to create spontaneous physical-feeling keepsakes.
              </p>
              <Link href="/signup" className="btn-primary py-2.5 px-5 text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <span>Open Photobooth</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 6 — THE MEMORY WALL (ORGANIC COLLAGE)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-10 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 6 · THE MEMORY WALL
            </span>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--ink-dark)]">
              An organic collage of your life together.
            </h2>
            <p className="font-quote italic text-sm text-[var(--ink-mid)]">
              Messy, real, and sacred. Touch any memory to lift it.
            </p>
          </div>

          {/* Organic Rotated Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-mid)] paper-grain shadow-sm select-none">
            
            <div className="polaroid -rotate-3 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="aspect-square bg-rose-100 rounded overflow-hidden">
                <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Sunset" />
              </div>
              <p className="font-handwriting text-sm text-[var(--ink-dark)] mt-2">First Sunset Together ♡</p>
            </div>

            <div className="paper-grain p-4 rounded-2xl border border-amber-200 bg-amber-50/60 rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between">
              <p className="text-[9px] font-mono text-amber-800 uppercase font-bold">☕ CAFE RECEIPT</p>
              <p className="font-handwriting text-sm text-amber-950 my-2">"2x Cappuccino, 1x Warm Croissant."</p>
              <p className="text-[8px] font-mono text-amber-700">Oct 14, 2025</p>
            </div>

            <div className="polaroid rotate-3 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="aspect-square bg-sky-100 rounded overflow-hidden">
                <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Date" />
              </div>
              <p className="font-handwriting text-sm text-[var(--ink-dark)] mt-2">Quiet Morning</p>
            </div>

            <div className="paper-grain p-4 rounded-2xl border border-purple-200 bg-purple-50/60 -rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between">
              <p className="text-[9px] font-mono text-purple-800 uppercase font-bold">🎵 CONCERT TICKET</p>
              <p className="font-handwriting text-sm text-purple-950 my-2">"Laufey Live Night — Row 4"</p>
              <p className="text-[8px] font-mono text-purple-700">Row 4, Seat 12 &amp; 13</p>
            </div>

            <div className="polaroid -rotate-1 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="aspect-square bg-emerald-100 rounded overflow-hidden">
                <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&h=300&fit=crop" className="w-full h-full object-cover" alt="Travel" />
              </div>
              <p className="font-handwriting text-sm text-[var(--ink-dark)] mt-2">Train Trip Abroad</p>
            </div>

            <div className="paper-grain p-4 rounded-2xl border border-rose-200 bg-rose-50/60 rotate-4 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between">
              <p className="text-[9px] font-mono text-rose-800 uppercase font-bold">🎂 ANNIVERSARY BADGE</p>
              <p className="font-handwriting text-sm text-rose-950 my-2">"365 Days &amp; Forever to Go"</p>
              <p className="text-[8px] font-mono text-rose-700">July 2026</p>
            </div>

          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 7 — TIME PASSES. LOVE STAYS.
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-10 text-center max-w-2xl mx-auto">
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 7 · TIME
            </span>
            <h2 className="text-3xl font-display italic font-black text-[var(--ink-dark)]">
              Time Passes. Love Stays.
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            <div className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] text-center">
              <p className="text-lg">❤️</p>
              <p className="text-xs font-mono font-bold text-[var(--ink-dark)] mt-1">Day 1</p>
            </div>
            <span className="text-muted-foreground font-mono">→</span>
            <div className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] text-center">
              <p className="text-lg">📸</p>
              <p className="text-xs font-mono font-bold text-[var(--ink-dark)] mt-1">30 Days</p>
            </div>
            <span className="text-muted-foreground font-mono">→</span>
            <div className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] text-center">
              <p className="text-lg">💌</p>
              <p className="text-xs font-mono font-bold text-[var(--ink-dark)] mt-1">100 Days</p>
            </div>
            <span className="text-muted-foreground font-mono">→</span>
            <div className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] text-center">
              <p className="text-lg">🎂</p>
              <p className="text-xs font-mono font-bold text-[var(--ink-dark)] mt-1">1 Year</p>
            </div>
            <span className="text-muted-foreground font-mono">→</span>
            <div className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-mid)] text-center">
              <p className="text-lg">🌸</p>
              <p className="text-xs font-mono font-bold text-[var(--ink-dark)] mt-1">5 Years</p>
            </div>
          </div>

          <p className="font-handwriting text-xl text-[var(--seal-red)] italic">
            "Everything still here. That's Pairfect."
          </p>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            CHAPTER 8 & 9 — EMOTIONAL ENDING & CALL TO ACTION
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-12 md:p-16 rounded-[36px] text-center space-y-8 paper-grain relative overflow-hidden shadow-md max-w-3xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] via-[#e8527d] to-[#60a5fa]" />

          <div className="space-y-6 max-w-xl mx-auto">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              CHAPTER 9 · YOUR STORY BEGINS NOW
            </span>

            <div className="space-y-4">
              <p className="text-lg sm:text-xl font-display italic font-bold text-[var(--ink-dark)] leading-relaxed">
                Imagine this.
              </p>
              <p className="font-handwriting text-2xl text-[var(--ink-dark)] leading-relaxed">
                One day— years from now— you'll forget what happened on an ordinary Tuesday.
              </p>
              <p className="font-quote italic text-lg text-[var(--seal-red)] font-bold">
                But Pairfect won't.
              </p>
              <p className="text-xs text-[var(--ink-mid)] font-mono leading-relaxed">
                Every letter. Every photo. Every little joke. <br />
                Still waiting for you. Exactly where you left it.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Link
              href="/signup"
              className="btn-primary py-4 px-10 text-xs uppercase tracking-widest shadow-lg shadow-pink-500/20 inline-flex items-center gap-2"
            >
              <span>Start Your Story 💌</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border-mid)] bg-[var(--card-bg)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-display italic text-lg font-black tracking-tight text-[var(--ink-dark)]">
                pairfect
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)]" />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Dedicated private companion for couples. Made for two.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground font-mono">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:support@pairfect.app" className="hover:text-foreground transition-colors">Contact Support</a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-muted-foreground font-mono">&copy; 2026 Pairfect. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
