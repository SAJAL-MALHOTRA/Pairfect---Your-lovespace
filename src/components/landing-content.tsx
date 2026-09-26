"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowRight,
  Shield,
  Lock,
  Sparkles,
  Camera,
  Mail,
  BookOpen,
  Search,
  Check,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";

import HeroProductFilm from "@/components/landing/hero-product-film";
import InteractiveLetterDemo from "@/components/landing/interactive-letter-demo";
import InteractiveMemoriesDemo from "@/components/landing/interactive-memories-demo";
import InteractiveJournalDemo from "@/components/landing/interactive-journal-demo";
import InteractiveRitualsDemo from "@/components/landing/interactive-rituals-demo";
import InteractivePhotoboothDemo from "@/components/landing/interactive-photobooth-demo";
import InteractivePresenceDemo from "@/components/landing/interactive-presence-demo";
import InteractiveVaultDemo from "@/components/landing/interactive-vault-demo";

export default function LandingContent() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll to compact navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F3EE] text-[#2C1E1A] selection:bg-[#8E2B45] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ─── STICKY EDITORIAL NAVIGATION BAR ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-3 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E8DFD5] shadow-xs"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display italic text-2xl font-bold tracking-tight text-[#2C1E1A] group-hover:text-[#8E2B45] transition-colors">
              Pairfect
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E2B45]" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wider uppercase text-[#6E5D57]">
            <a href="#why" className="hover:text-[#8E2B45] transition-colors">
              Why Pairfect
            </a>
            <a href="#letters" className="hover:text-[#8E2B45] transition-colors">
              Letters
            </a>
            <a href="#memories" className="hover:text-[#8E2B45] transition-colors">
              Memories
            </a>
            <a href="#rituals" className="hover:text-[#8E2B45] transition-colors">
              Rituals
            </a>
            <a href="#vault" className="hover:text-[#8E2B45] transition-colors">
              Memory Vault
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-mono tracking-wider uppercase text-[#6E5D57] hover:text-[#2C1E1A] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#8E2B45] hover:bg-[#752238] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start Your Pairfect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── CHAPTER 01: HERO & LIVE PRODUCT WINDOW ─── */}
      <section className="pt-32 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-8 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Subtle Sanctuary Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2EAE1] border border-[#E8DFD5] text-[11px] font-mono font-semibold text-[#8E2B45] uppercase tracking-wider shadow-2xs">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>A Private Digital Sanctuary For Exactly Two</span>
          </div>

          {/* Editorial Serif Headline */}
          <h1 className="font-display italic text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#2C1E1A] tracking-tight leading-[1.08] max-w-3xl mx-auto">
            Keep the little world you built together.
          </h1>

          {/* Short Emotional Supporting Copy */}
          <p className="max-w-xl mx-auto text-base sm:text-lg text-[#6E5D57] leading-relaxed">
            Letters, memories, rituals, and ordinary moments — kept somewhere that belongs only to the
            two of you.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#8E2B45] hover:bg-[#752238] text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Your Pairfect Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#why"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white border border-[#E8DFD5] hover:border-[#8E2B45] text-[#2C1E1A] text-sm font-semibold hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>See How It Works ↓</span>
            </a>
          </div>

          {/* Live Product Film Showcase */}
          <div className="pt-10 sm:pt-14">
            <HeroProductFilm />
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 02: WHY PAIRFECT (PROBLEM & POSITIONING) ─── */}
      <section id="why" className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E8C85] font-semibold">
              The Problem With Modern Messaging
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Some things deserve more than a chat bubble.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Every day, heartfelt words and irreplaceable memories get buried between grocery lists,
              work notifications, and memes.
            </p>
          </div>

          {/* Side-by-Side Comparison: Chat Noise vs Pairfect Sanctuary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Ephemeral Messaging Noise */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4 opacity-75">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
                  Standard Chat Apps
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Disappearing in scroll</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-stone-100 text-stone-600 max-w-[80%] rounded-bl-xs">
                  &ldquo;Did you buy the oat milk?&rdquo;
                </div>
                <div className="p-3 rounded-2xl bg-stone-200 text-stone-800 ml-auto max-w-[85%] rounded-br-xs">
                  &ldquo;Yeah, grabbing it now. Meeting ran late.&rdquo;
                </div>
                <div className="p-3 rounded-2xl bg-stone-100 text-stone-600 max-w-[85%] rounded-bl-xs">
                  &ldquo;K. Also remember to call the landlord.&rdquo;
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 text-stone-700 border border-rose-100 max-w-[85%] rounded-bl-xs">
                  &ldquo;I love you so much. Thank you for holding my hand today.&rdquo;
                  <span className="text-[9px] text-stone-400 block pt-1 italic">
                    (Lost forever under 400 new messages)
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-500 pt-2 border-t border-stone-100 font-mono">
                Ephemeral · Cluttered · Forgotten within days
              </p>
            </div>

            {/* Pairfect Sanctuary Intention */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDF8] border-2 border-[#8E2B45] shadow-md space-y-4 relative">
              <div className="absolute -top-3 right-6 bg-[#8E2B45] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                The Pairfect Way
              </div>

              <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8E2B45] font-bold">
                  Living Relationship Sanctuary
                </span>
                <span className="text-[10px] text-[#9E8C85] font-mono">Preserved for life</span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E8DFD5] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E2B45]">
                    <span>💌 Sealed Love Letter</span>
                    <span>July 18</span>
                  </div>
                  <p className="font-handwriting text-base text-[#2C1E1A] leading-snug">
                    &ldquo;Home isn&apos;t an address anymore. It&apos;s wherever you lean your
                    head.&rdquo;
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E8DFD5] flex items-center gap-3">
                  <span className="text-2xl">🌅</span>
                  <div>
                    <span className="text-xs font-bold text-[#2C1E1A] block">
                      Polaroid: Marine Drive Sunset
                    </span>
                    <span className="text-[10px] font-mono text-[#6E5D57]">
                      Saved with audio & journal notes
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#8E2B45] pt-2 border-t border-[#E8DFD5] font-mono font-semibold">
                Messages are immediate. Letters are intentional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 03: PRODUCT STORY #1 — LETTERS ─── */}
      <section id="letters" className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 01 · Love Letters
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Write something worth keeping.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Not a hurried text while walking into a subway. An intentional, wax-sealed letter written
              on lined stationery that arrives quietly and stays in your archive forever.
            </p>
          </div>

          {/* Interactive Letter Demo */}
          <InteractiveLetterDemo />

          <div className="text-center pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8E2B45] hover:underline underline-offset-4"
            >
              <span>Write your first letter to your partner →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 04: PRODUCT STORY #2 — MEMORIES ─── */}
      <section id="memories" className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 02 · Scrapbook Moments
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Keep the little things.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Not a generic social feed for strangers. A tactile couple scrapbook where 3:42 AM diner
              stops, monsoon rains, and quiet living room memories are held in real Polaroid frames.
            </p>
          </div>

          {/* Interactive Memories Demo */}
          <InteractiveMemoriesDemo />

          <div className="text-center pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8E2B45] hover:underline underline-offset-4"
            >
              <span>Start keeping your memories together →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 05: PRODUCT STORY #3 — JOURNAL ─── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 03 · Ruled Journal
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Some days are worth writing down.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Pairfect doesn&apos;t look like a Notion workspace or spreadsheet. It looks and feels
              like authentic stationery paper, inviting gentle reflections you&apos;ll cherish reading
              ten years from now.
            </p>
          </div>

          {/* Interactive Journal Demo */}
          <InteractiveJournalDemo />
        </div>
      </section>

      {/* ─── CHAPTER 06: PRODUCT STORY #4 — RITUALS ─── */}
      <section id="rituals" className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 04 · Daily Rituals & Games
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Small sparks of fun together.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Pairfect isn&apos;t only sentimental — it&apos;s playful. Daily spontaneous questions,
              Know Me quizzes, and playful AI Vibe Judge debates designed to spark genuine conversation.
            </p>
          </div>

          {/* Interactive Rituals Demo */}
          <InteractiveRitualsDemo />

          <div className="text-center pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8E2B45] hover:underline underline-offset-4"
            >
              <span>Play tonight&apos;s ritual with your person →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 07: PRODUCT STORY #5 — PHOTOBOOTH ─── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 05 · Synchronous Photobooth
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Four frames of us.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Capture synchronous 4-cut photobooth film strips together across any distance. Real film
              grain, vintage countdowns, and instant cloud archiving.
            </p>
          </div>

          {/* Interactive Photobooth Demo */}
          <InteractivePhotoboothDemo />
        </div>
      </section>

      {/* ─── CHAPTER 08: PRODUCT STORY #6 — PRESENCE ─── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 06 · Peaceful Presence
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              A quiet glimpse into their day.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              No invasive surveillance or battery-draining live tracking. Just a calm glance at their
              mood, their weather, and a gentle tap to send warmth across the distance.
            </p>
          </div>

          {/* Interactive Presence Demo */}
          <InteractivePresenceDemo />
        </div>
      </section>

      {/* ─── CHAPTER 09: PRODUCT STORY #7 — MEMORY VAULT ─── */}
      <section id="vault" className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E2B45] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Chapter 07 · Searchable Memory Vault
            </span>
            <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight">
              Search across everything you&apos;ve lived.
            </h2>
            <p className="text-sm sm:text-base text-[#6E5D57] leading-relaxed">
              Pairfect isn&apos;t just cute individual tools. It is an organized, instant-searchable
              archive of your relationship. Type &ldquo;coffee&rdquo; or &ldquo;July&rdquo; and relive
              the exact moments you thought were lost.
            </p>
          </div>

          {/* Interactive Vault Demo */}
          <InteractiveVaultDemo />
        </div>
      </section>

      {/* ─── CHAPTER 10: THE LIVING RELATIONSHIP ARCHIVE ─── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E8C85] font-semibold">
            The Living Archive
          </span>

          <h2 className="font-display italic text-3xl sm:text-5xl font-black text-[#2C1E1A] leading-tight max-w-2xl mx-auto">
            47 little moments you decided to keep.
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#6E5D57] leading-relaxed">
            Letters, photos, voice notes, questions, and dates woven together into one seamless heirloom
            that grows more precious every single day you spend together.
          </p>

          {/* Connected Archive Heirloom Collage Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
              <span className="text-xl">💌</span>
              <div className="text-xs font-bold text-[#2C1E1A]">18 Letters</div>
              <p className="text-[10px] text-[#6E5D57] font-mono">Written and sealed with wax</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
              <span className="text-xl">📸</span>
              <div className="text-xs font-bold text-[#2C1E1A]">42 Film Strips</div>
              <p className="text-[10px] text-[#6E5D57] font-mono">Photobooth strips captured</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
              <span className="text-xl">💭</span>
              <div className="text-xs font-bold text-[#2C1E1A]">152 Days</div>
              <p className="text-[10px] text-[#6E5D57] font-mono">Streak of shared connection</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
              <span className="text-xl">🎁</span>
              <div className="text-xs font-bold text-[#2C1E1A]">64 Slips</div>
              <p className="text-[10px] text-[#6E5D57] font-mono">Gratitude notes in the jar</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER 11: THE EMOTIONAL PAUSE ─── */}
      <section className="py-24 sm:py-36 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#2C1E1A] text-white relative overflow-hidden">
        {/* Subtle warm glow background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8E2B45]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D38CA2] font-semibold">
            A Note On Remembering
          </span>

          <blockquote className="font-display italic text-2xl sm:text-4xl md:text-5xl font-bold leading-relaxed text-[#FAF6F0]">
            &ldquo;Imagine this. One day — years from now — you&apos;ll forget what happened on an
            ordinary Tuesday.
            <br />
            <span className="text-[#D38CA2] font-black block pt-4">
              But Pairfect won&apos;t.&rdquo;
            </span>
          </blockquote>

          <p className="text-xs sm:text-sm text-stone-300 font-mono max-w-lg mx-auto leading-relaxed">
            The small jokes, the handwritten words, the late-night photos — preserved safely in a place
            where only the two of you have the key.
          </p>
        </div>
      </section>

      {/* ─── CHAPTER 12: FINAL SANCTUARY CTA & REAL TRUST GUARANTEES ─── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#FAF6F0]">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DFD5] text-[11px] font-mono font-semibold text-[#8E2B45] uppercase tracking-wider shadow-2xs">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Begin Your Story</span>
          </div>

          <h2 className="font-display italic text-4xl sm:text-6xl font-black text-[#2C1E1A] leading-tight">
            Create your little world.
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#6E5D57] leading-relaxed">
            Set up your couple room in under 60 seconds. Send your partner an invite link or secret code,
            and step inside your shared sanctuary.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#8E2B45] hover:bg-[#752238] text-white text-base font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Your Pairfect Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white border border-[#E8DFD5] text-[#2C1E1A] text-sm font-semibold hover:bg-stone-50 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>Already partnered? Sign In</span>
            </Link>
          </div>

          {/* Genuine Trust Guarantees */}
          <div className="pt-8 border-t border-[#E8DFD5] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#6E5D57]">
            <div className="flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8E2B45]" />
              <span>Private for Two</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>No Public Feed</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#8E2B45]" />
              <span>Zero Advertising</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Never Sells Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WARM PAPER FOOTER ─── */}
      <footer className="py-12 px-5 sm:px-8 border-t border-[#E8DFD5] bg-[#F8F3EE] text-xs font-mono text-[#9E8C85]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display italic text-lg font-bold text-[#2C1E1A]">Pairfect</span>
            <span>· The digital sanctuary and living archive for couples</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#2C1E1A] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/checkout" className="hover:text-[#2C1E1A] transition-colors">
              Sanctuary Passes
            </Link>
            <a
              href="mailto:pairfect.site@yahoo.com"
              className="hover:text-[#2C1E1A] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
