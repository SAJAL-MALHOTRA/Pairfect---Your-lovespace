"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Shield, Heart, Eye } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Shared animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 1.0, delay, ease: "easeOut" as const },
  }),
};

/* ─── Memory Wall data (the "wow" section) ─── */
const memoryWallItems = [
  { emoji: "☕", label: "First Coffee", rotate: -4, color: "#F8F4EB" },
  { emoji: "🌅", label: "Sunset Walk", rotate: 3, color: "#FFF0F3" },
  { emoji: "🎵", label: "Our Song", rotate: -2, color: "#F0EAE0" },
  { emoji: "✈️", label: "First Trip", rotate: 5, color: "#F8F4EB" },
  { emoji: "🌧️", label: "Rainy Day In", rotate: -6, color: "#EDE8E0" },
  { emoji: "🍕", label: "Pizza Night", rotate: 2, color: "#FFF0F3" },
  { emoji: "📸", label: "Photobooth", rotate: -3, color: "#F8F4EB" },
  { emoji: "💌", label: "First Letter", rotate: 4, color: "#F0EAE0" },
  { emoji: "🎂", label: "Birthday", rotate: -5, color: "#FFF0F3" },
  { emoji: "🌸", label: "Spring Walk", rotate: 1, color: "#F8F4EB" },
  { emoji: "🏠", label: "Moved In", rotate: -2, color: "#EDE8E0" },
  { emoji: "❤️", label: "Still Us", rotate: 3, color: "#FFF0F3" },
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
  return (
    <div className="landing-journal relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Floating Dust & Petal Particles (replaces hearts) ── */}
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
          HEADER — Minimal editorial wordmark
          ══════════════════════════════════════════════════════════ */}
      <header className="px-6 py-5 max-w-6xl w-full mx-auto flex items-center justify-between z-20 relative">
        <div className="flex items-center space-x-2.5">
          <span className="font-display italic text-2xl font-black tracking-tight text-[#2C2628]">
            pairfect
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#8C2C3D]" />
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[#9A8E85] hover:text-[#2C2628] transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link href="/signup" className="btn-journal">
            Open Your Journal
          </Link>
        </div>
      </header>


      {/* ══════════════════════════════════════════════════════════
          CHAPTER 1 — HERO
          Emotion first. No features. Just a feeling.
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full z-10 relative">
        <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-28 pb-24 flex flex-col items-center text-center">

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase mb-8"
          >
            Built for two. Kept forever.
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display italic font-black text-[#2C2628] tracking-tight leading-[1.1] max-w-4xl"
          >
            Some days{" "}
            <br className="hidden sm:block" />
            become memories.
            <br />
            <span className="text-[#8C2C3D]">
              Some memories{" "}
              <br className="hidden sm:block" />
              become home.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.25}
            className="mt-8 font-quote italic text-lg sm:text-xl text-[#6B5E58] max-w-lg leading-relaxed"
          >
            Not another messaging app. A shared journal, memory book, gratitude
            space, and little universe — for just the two of you.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <Link href="/signup" className="btn-journal">
              Start Your Story <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-journal-ghost">
              Sign In With Partner
            </Link>
          </motion.div>

          {/* Hero Image — Journal with pressed flowers */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.55}
            className="mt-20 w-full max-w-2xl mx-auto"
          >
            <div className="editorial-image rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-45 shimmer-active" />
              </div>
              <img
                src="/hero-journal.jpg"
                alt="An open vintage journal with pressed flowers between the pages"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 2 — EMOTIONAL PULL
            Make them fall in love before explaining features
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-28 text-center space-y-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase mb-6">
              Love deserves better than a chat history
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[#2C2628] leading-[1.15]">
              For every{" "}
              <span className="text-[#8C2C3D]">&ldquo;I miss you.&rdquo;</span>
              <br />
              For every{" "}
              <span className="text-[#8C2C3D]">
                &ldquo;Remember this?&rdquo;
              </span>
              <br />
              For every ordinary Tuesday.
            </h2>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.15}
            className="font-handwriting text-2xl sm:text-3xl text-[#8C2C3D] leading-relaxed max-w-lg mx-auto"
          >
            A quiet place where ordinary days become unforgettable.
          </motion.p>

          <hr className="stitch-line max-w-xs mx-auto mt-16" />
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 3 — LOVE LETTERS (Cotton paper + wax seal)
            Image LEFT, Text RIGHT
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0}
              className="flex-1 w-full"
            >
              <div className="editorial-image rounded-2xl shadow-lg keepsake-lift overflow-hidden">
                <img
                  src="/love-letter-seal.jpg"
                  alt="A wax-sealed love letter on cotton paper"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0.15}
              className="flex-1 space-y-5 text-left"
            >
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D6B36A] uppercase">
                Wax-Sealed Letters
              </p>
              <h3 className="text-2xl sm:text-3xl font-display italic font-bold text-[#2C2628] leading-snug">
                Write thoughts that deserve more than a text message.
              </h3>
              <p className="text-sm text-[#6B5E58] leading-relaxed">
                Seal them with wax. Unseal them together. Every letter is
                encrypted, private, and yours to keep forever. Like passing
                notes — but beautiful.
              </p>
              <Link href="/signup" className="btn-journal inline-flex">
                Write a Letter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 4 — MEMORIES & POLAROIDS
            Text LEFT, Image RIGHT
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0}
              className="flex-1 w-full"
            >
              <div className="editorial-image rounded-2xl shadow-lg keepsake-lift overflow-hidden">
                <img
                  src="/polaroid-memories.jpg"
                  alt="Scattered polaroid photographs on a cream linen surface"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0.15}
              className="flex-1 space-y-5 text-left"
            >
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#B85C7A] uppercase">
                Polaroid Memories
              </p>
              <h3 className="text-2xl sm:text-3xl font-display italic font-bold text-[#2C2628] leading-snug">
                Capture real, unfiltered smiles together.
              </h3>
              <p className="text-sm text-[#6B5E58] leading-relaxed">
                A webcam photobooth that creates 4-frame strips like the ones
                in arcade photo booths. Stickers, themes, and instant keepsakes.
                No filters. Just you.
              </p>
              <Link href="/signup" className="btn-journal inline-flex">
                Open Photobooth <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 5 — GRATITUDE (Handwritten sticky notes)
            Image LEFT, Text RIGHT
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0}
              className="flex-1 w-full"
            >
              <div className="editorial-image rounded-2xl shadow-lg keepsake-lift overflow-hidden">
                <img
                  src="/gratitude-notes.jpg"
                  alt="Handwritten gratitude notes with dried flowers"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={0.15}
              className="flex-1 space-y-5 text-left"
            >
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D6B36A] uppercase">
                Gratitude Jar
              </p>
              <h3 className="text-2xl sm:text-3xl font-display italic font-bold text-[#2C2628] leading-snug">
                Celebrate the little things you never want to forget.
              </h3>
              <p className="text-sm text-[#6B5E58] leading-relaxed">
                Drop a folded note into a shared jar. Read them together on rainy days.
                Small thank-yous that become the foundation of something
                extraordinary.
              </p>
              <Link href="/signup" className="btn-journal inline-flex">
                Start a Jar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 6 — MOVIE NIGHT (Full-width atmospheric)
            ══════════════════════════════════════════════════════════ */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/cozy-movie-night.jpg"
              alt="Cozy movie night with cocoa and blankets"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2C2628]/85 via-[#2C2628]/50 to-[#2C2628]/30" />
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-6"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D6B36A] uppercase">
              Synchronized Streaming
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-white leading-[1.15]">
              Movie night, even when you&apos;re miles apart.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
              Watch YouTube together in perfect sync. Share your Netflix tab
              through Virtual Cinema. React with floating emojis. It&apos;s not
              just watching — it&apos;s being together.
            </p>
            <Link
              href="/signup"
              className="btn-journal inline-flex !bg-white/15 !text-white !border !border-white/20 backdrop-blur-sm hover:!bg-white/25"
            >
              Start Movie Night <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 7 — THE MEMORY WALL (The "wow" section)
            Hundreds of Polaroids floating in 3D
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-28 space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="text-center space-y-4"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase">
              The Memory Wall
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[#2C2628] leading-[1.15]">
              Every moment you&apos;ve kept.
              <br />
              <span className="text-[#8C2C3D]">All in one place.</span>
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
                className="memory-wall-card rounded-xl p-4 sm:p-5 flex flex-col items-center gap-2 cursor-pointer shadow-md border border-[#E8DFD3]"
                style={{
                  background: item.color,
                  transform: `rotate(${item.rotate}deg)`,
                  zIndex: i % 3 === 0 ? 10 : 5,
                }}
              >
                <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                <span className="text-[9px] font-mono font-bold text-[#6B5E58] uppercase tracking-wider text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            className="text-center font-handwriting text-xl sm:text-2xl text-[#8C2C3D] italic"
          >
            &ldquo;Hover any memory. They all lift for you.&rdquo;
          </motion.p>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 8 — TIMELINE (Real memories, not numbers)
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-28 text-center space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="space-y-4"
          >
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase">
              Your Shared Timeline
            </p>
            <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[#2C2628] leading-[1.15]">
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
                  <span className="hidden sm:inline text-[#E0D5C8] font-mono text-sm">
                    →
                  </span>
                )}
                <div className="px-4 py-3 rounded-xl bg-[#FFFDF8] border border-[#E8DFD3] shadow-sm text-center keepsake-lift">
                  <p className="text-xl mb-1">{m.emoji}</p>
                  <p className="text-[9px] font-mono font-bold text-[#6B5E58] uppercase tracking-wider whitespace-nowrap">
                    {m.label}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            className="font-handwriting text-xl text-[#8C2C3D] italic"
          >
            &ldquo;Everything still here. That&apos;s Pairfect.&rdquo;
          </motion.p>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 8.5 — TRUST & PRIVACY (Understated, editorial)
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="bg-[#FFFDF8] border border-[#E8DFD3] p-10 md:p-14 rounded-2xl text-center space-y-8 shadow-sm relative overflow-hidden paper-grain"
          >
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase">
                Privacy by Design
              </p>
              <h2 className="text-2xl sm:text-3xl font-display italic font-black text-[#2C2628]">
                Your memories belong here.
              </h2>
              <p className="font-quote italic text-base text-[#6B5E58] leading-relaxed">
                Not on a public feed. Not inside an algorithm. Only you two can
                open them.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[
                { icon: <Shield className="w-4 h-4" />, label: "AES-256 Encrypted" },
                { icon: <Lock className="w-4 h-4" />, label: "Invite Only" },
                { icon: <Eye className="w-4 h-4" />, label: "No Public Profiles" },
                { icon: <Heart className="w-4 h-4" />, label: "No Followers" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-[#F8F4EB] border border-[#E0D5C8] flex flex-col items-center space-y-1.5"
                >
                  <span className="text-[#8C2C3D]">{item.icon}</span>
                  <span className="text-[9px] font-mono font-bold text-[#6B5E58] text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════════════
            CHAPTER 9 — YOUR STORY BEGINS NOW (Emotional closing CTA)
            ══════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto px-6 py-28">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="bg-[#FFFDF8] border border-[#E8DFD3] p-12 md:p-16 rounded-2xl text-center space-y-8 shadow-lg relative overflow-hidden paper-grain"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D86B8A] via-[#8C2C3D] to-[#D6B36A]" />

            <div className="space-y-6 max-w-md mx-auto">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#9A8E85] uppercase">
                One last page waits
              </p>

              <p className="text-xl sm:text-2xl font-display italic font-bold text-[#2C2628] leading-relaxed">
                Imagine this.
              </p>
              <p className="font-handwriting text-2xl text-[#2C2628] leading-relaxed">
                One day — years from now — you&apos;ll forget what happened on
                an ordinary Tuesday.
              </p>
              <p className="font-quote italic text-lg text-[#8C2C3D] font-bold">
                But Pairfect won&apos;t.
              </p>
              <p className="text-xs text-[#9A8E85] font-mono leading-relaxed">
                Every letter. Every photo. Every little joke.
                <br />
                Still waiting for you. Exactly where you left it.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <Link href="/signup" className="btn-journal">
                Start Writing Together <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>


      {/* ══════════════════════════════════════════════════════════
          FOOTER — Minimal, warm, editorial
          ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#E8DFD3] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-display italic text-lg font-black tracking-tight text-[#2C2628]">
                pairfect
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#8C2C3D]" />
            </div>
            <p className="text-[10px] text-[#9A8E85] font-mono">
              The place where relationships become memories.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#9A8E85] font-mono">
            <Link href="/privacy" className="hover:text-[#2C2628] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#2C2628] transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@pairfect.app" className="hover:text-[#2C2628] transition-colors">
              Contact
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-[#9A8E85] font-mono">
              &copy; 2026 Pairfect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
