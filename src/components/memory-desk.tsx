"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Coffee, Plane, Ticket, Mail, Flower, Trophy } from "lucide-react";

// ── Warm Shadow Utilities & Constants ──
const WARM_SHADOW_REST = "0 14px 35px rgba(70, 45, 55, 0.07), 0 4px 12px rgba(70, 45, 55, 0.04)";
const WARM_SHADOW_HOVER = "0 24px 50px rgba(70, 45, 55, 0.13), 0 8px 20px rgba(70, 45, 55, 0.06)";

export default function MemoryDesk() {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Parallax Mouse Position ──
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHoveredOnDesk, setIsHoveredOnDesk] = useState(false);

  // ── Accessibility: Reduced Motion Check ──
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const posX = (e.clientX - centerX) / (rect.width / 2);
    const posY = (e.clientY - centerY) / (rect.height / 2);

    setMouseOffset({
      x: Math.max(-1, Math.min(1, posX)),
      y: Math.max(-1, Math.min(1, posY)),
    });
  };

  // State for interactive keepsakes
  const [letterOpen, setLetterOpen] = useState(false);
  const [ticketShimmer, setTicketShimmer] = useState(false);
  const [badgeSparkle, setBadgeSparkle] = useState(false);

  return (
    <section className="space-y-8 text-center select-none">
      {/* Section Header */}
      <div className="space-y-2 max-w-xl mx-auto px-4">
        <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
          CHAPTER 6 · KEEPSAKE DESK
        </span>
        <h2 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--ink-dark)] tracking-tight">
          A physical memory desk, collected over time.
        </h2>
        <p className="font-quote italic text-sm text-[var(--ink-mid)]">
          Real moments. Real keepsakes. Touch or hover any artifact to explore.
        </p>
      </div>

      {/* ── MEMORY DESK MAIN SCENE ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveredOnDesk(true)}
        onMouseLeave={() => {
          setIsHoveredOnDesk(false);
          setMouseOffset({ x: 0, y: 0 });
        }}
        className="relative w-full rounded-[36px] border border-[var(--border-mid)] p-4 sm:p-8 md:p-12 overflow-hidden shadow-sm transition-all duration-500 paper-grain"
        style={{
          background: "linear-gradient(135deg, #FAF7F2 0%, #FFF2F4 50%, #FAF0EC 100%)",
        }}
      >
        {/* ── BACKGROUND LAYER 1: LIGHT LEAKS & AMBIENT GLOWS ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Orange Warm Light Leak Top-Left */}
          <div
            className={`absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full transition-transform duration-1000 ease-out ${
              !reducedMotion ? "animate-pulse" : ""
            }`}
            style={{
              background: "radial-gradient(circle, rgba(254, 215, 170, 0.28) 0%, rgba(251, 146, 60, 0.1) 45%, transparent 75%)",
              transform: `translate(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px)`,
              animationDuration: "12s",
            }}
          />

          {/* Pink Soft Light Leak Bottom-Right */}
          <div
            className={`absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full transition-transform duration-1000 ease-out ${
              !reducedMotion ? "animate-pulse" : ""
            }`}
            style={{
              background: "radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, rgba(225, 29, 72, 0.08) 50%, transparent 75%)",
              transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -4}px)`,
              animationDuration: "15s",
            }}
          />

          {/* Faint Noise Texture Overlay (opacity < 3%) */}
          <div
            className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* ── BACKGROUND LAYER 2: SUBCONSCIOUS FAINT TIMELINE ── */}
        <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
          <svg className="w-full h-full" fill="none">
            <path
              d="M 60 120 C 240 70, 480 180, 680 110 C 820 60, 960 140, 1100 120"
              stroke="rgba(160, 110, 120, 0.11)"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
          </svg>
          <span className="absolute left-[12%] top-[70px] text-[9px] font-mono text-[var(--ink-light)] opacity-35 tracking-widest uppercase">
            2023 · First Chapter
          </span>
          <span className="absolute left-[44%] top-[140px] text-[9px] font-mono text-[var(--ink-light)] opacity-35 tracking-widest uppercase">
            2024 · Summer Trips
          </span>
          <span className="absolute right-[18%] top-[80px] text-[9px] font-mono text-[var(--ink-light)] opacity-35 tracking-widest uppercase">
            2025 · Today &amp; Forever
          </span>
        </div>

        {/* ── DESKTOP SCATTERED CONTAINER (680px height on md+) / MOBILE VERTICAL FLOW ── */}
        <div className="relative w-full md:h-[680px] flex flex-col md:block items-center gap-8 md:gap-0 py-4 md:py-0">

          {/* ════════════════════════════════════════════════════════════════
              1. POLAROID ("First Sunset Together")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 6}px, ${mouseOffset.y * 6}px)`
                : undefined,
            }}
            className="md:absolute md:left-[3%] md:top-[5%] w-full max-w-[240px] z-20 group cursor-pointer"
          >
            <motion.div
              className="relative p-3.5 pb-5 rounded-2xl border border-[var(--border-warm)] transition-all duration-500 paper-grain"
              style={{
                backgroundColor: "#FAF7F2",
                boxShadow: WARM_SHADOW_REST,
                rotate: -4.5,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -6,
                      rotate: 0,
                      scale: 1.03,
                      boxShadow: WARM_SHADOW_HOVER,
                    }
                  : undefined
              }
            >
              {/* Washi Tape Top Left */}
              <div
                className="absolute -top-3 left-4 w-12 h-5 z-30 pointer-events-none opacity-80"
                style={{
                  background: "rgba(224, 184, 184, 0.45)",
                  transform: "rotate(-12deg)",
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)",
                }}
              />
              {/* Washi Tape Top Right */}
              <div
                className="absolute -top-2 right-4 w-11 h-5 z-30 pointer-events-none opacity-75"
                style={{
                  background: "rgba(196, 164, 130, 0.4)",
                  transform: "rotate(8deg)",
                }}
              />

              {/* Photo Frame */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F0EAE1] border border-black/5">
                <img
                  src="/ghibli-hero.jpg"
                  alt="First Sunset Together"
                  className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Handwritten Caption & Date */}
              <div className="mt-3 text-center space-y-0.5">
                <p className="font-handwriting text-base text-[var(--ink-dark)] leading-tight">
                  First Sunset Together ♡
                </p>
                <p className="text-[9px] font-mono text-[var(--ink-light)] tracking-wider uppercase">
                  June 2025 · Sunset Point
                </p>
              </div>
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              2. FOLDED LOVE LETTER ("To: My favorite person ♡")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px)`
                : undefined,
            }}
            className="md:absolute md:left-[27%] md:top-[40%] w-full max-w-[230px] z-30 group cursor-pointer"
            onMouseEnter={() => setLetterOpen(true)}
            onMouseLeave={() => setLetterOpen(false)}
          >
            <motion.div
              className="relative p-4 rounded-2xl border border-[var(--border-warm)] transition-all duration-500 paper-grain overflow-hidden"
              style={{
                backgroundColor: "#FDF9F0",
                boxShadow: WARM_SHADOW_REST,
                rotate: -1.8,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -5,
                      scale: 1.02,
                      boxShadow: WARM_SHADOW_HOVER,
                    }
                  : undefined
              }
            >
              {/* Inside Letter Card Sliding Up */}
              <motion.div
                animate={letterOpen ? { y: -18 } : { y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="p-3 rounded-xl bg-[#FFFDF8] border border-[var(--border-mid)] shadow-xs mb-2 text-left"
              >
                <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--seal-red)] font-bold mb-1">
                  CONFIDENTIAL · FOR YOUR EYES ONLY
                </p>
                <p className="font-handwriting text-xs text-[var(--ink-dark)] leading-snug line-clamp-2">
                  "I knew from the very first moment we laughed together..."
                </p>
              </motion.div>

              {/* Envelope Flap & Seal Front */}
              <div className="flex items-center justify-between border-t border-[var(--border-mid)] pt-2.5">
                <div>
                  <p className="font-handwriting text-sm text-[var(--ink-dark)] font-bold">
                    To: My favorite person ♡
                  </p>
                  <p className="text-[8px] font-mono text-[var(--ink-light)] uppercase tracking-wider">
                    Wax-Sealed Stationery
                  </p>
                </div>

                {/* Wax Seal Icon */}
                <div className="w-7 h-7 rounded-full bg-[var(--seal-red)] text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>

              {/* Envelope Triangular Fold Overlay */}
              <motion.div
                animate={letterOpen ? { rotateX: -140, opacity: 0.4 } : { rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ transformOrigin: "top center" }}
                className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#FAF2E2] to-transparent pointer-events-none border-b border-[#E8D9C0]"
              />
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              3. COFFEE RECEIPT ("Café Lumière - 2 Cappuccinos, 1 Croissant")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 5}px, ${mouseOffset.y * 5}px)`
                : undefined,
            }}
            className="md:absolute md:left-[4%] md:top-[44%] w-full max-w-[210px] z-20 group cursor-pointer"
          >
            {/* Pencil Scribble Note Floating Beside Receipt */}
            <div
              className="absolute -top-7 -right-8 z-30 pointer-events-none transform rotate-[-6deg]"
            >
              <p className="font-handwriting text-xs text-[#78716C] italic drop-shadow-xs whitespace-nowrap">
                don't forget this day ♡
              </p>
            </div>

            <motion.div
              className="relative p-4 rounded-xl border border-[#E8DFC8] transition-all duration-500 paper-grain overflow-hidden"
              style={{
                backgroundColor: "#F5EFE0",
                boxShadow: WARM_SHADOW_REST,
                rotate: -2.8,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -4,
                      rotate: -1,
                      boxShadow: WARM_SHADOW_HOVER,
                    }
                  : undefined
              }
            >
              {/* Coffee Stain Ring SVG */}
              <svg className="absolute -top-4 -right-4 w-20 h-20 opacity-15 pointer-events-none" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="38" stroke="#704D38" strokeWidth="6" strokeDasharray="18 4 12 8" />
              </svg>

              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-[#D4C8AE] pb-2 mb-2.5">
                <p className="font-mono text-xs font-bold tracking-widest text-[#4A3E2C] uppercase">
                  CAFÉ LUMIÈRE
                </p>
                <p className="font-mono text-[8px] text-[#8C7D6B] uppercase tracking-wider">
                  Oct 14 · Rainy Morning
                </p>
              </div>

              {/* Receipt Line Items */}
              <div className="font-mono text-[10px] text-[#4A3E2C] space-y-1 leading-tight">
                <div className="flex justify-between">
                  <span>2x Cappuccino</span>
                  <span>$8.00</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Butter Croissant</span>
                  <span>$4.40</span>
                </div>
                <div className="border-t border-dashed border-[#D4C8AE] pt-1.5 flex justify-between font-bold text-black">
                  <span>TOTAL</span>
                  <span>$12.40</span>
                </div>
              </div>

              {/* Receipt Bottom Cut Edge Zig-zag */}
              <div className="mt-3 pt-2 border-t border-dotted border-[#D4C8AE] text-center">
                <p className="font-handwriting text-xs text-[#6B5B45]">
                  "Rainy morning coffee date."
                </p>
              </div>
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              4. MOVIE / CONCERT TICKET ("Inside Out 2 - Row G, Seat 14 & 15")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 3}px, ${mouseOffset.y * 3}px)`
                : undefined,
            }}
            className="md:absolute md:left-[32%] md:top-[6%] w-full max-w-[230px] z-20 group cursor-pointer"
            onMouseEnter={() => {
              setTicketShimmer(true);
              setTimeout(() => setTicketShimmer(false), 900);
            }}
          >
            <motion.div
              className="relative p-4 rounded-2xl border border-[#E6DCB8] transition-all duration-500 paper-grain overflow-hidden"
              style={{
                backgroundColor: "#F7F0DC",
                boxShadow: WARM_SHADOW_REST,
                rotate: 2.2,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -4,
                      rotate: 0.5,
                      boxShadow: WARM_SHADOW_HOVER,
                    }
                  : undefined
              }
            >
              {/* Shimmer Sweep Animation Overlay */}
              <AnimatePresence>
                {ticketShimmer && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.85, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-20"
                  />
                )}
              </AnimatePresence>

              {/* Perforated Edge Side Cutouts */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-[#FAF7F2] rounded-r-full border-r border-t border-b border-[#E6DCB8]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-[#FAF7F2] rounded-l-full border-l border-t border-b border-[#E6DCB8]" />

              {/* Ticket Top Badge */}
              <div className="flex items-center justify-between border-b border-dashed border-[#D4C49A] pb-2 mb-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[#8C7A54] font-bold">
                  CINEMA ADMIT ONE
                </span>
                <Ticket className="w-3.5 h-3.5 text-[#A88842]" />
              </div>

              {/* Content */}
              <div className="space-y-1 text-center">
                <p className="font-heading font-bold text-base text-[#4A3B22] leading-tight">
                  Inside Out 2
                </p>
                <p className="font-handwriting text-xs text-[#8A744C]">
                  Row G · Seats 14 &amp; 15 ♡
                </p>
              </div>

              {/* Barcode Footer */}
              <div className="mt-3 pt-2 border-t border-dashed border-[#D4C49A] flex items-center justify-between">
                <div className="font-mono text-[7px] tracking-tighter text-[#6E5D3B] select-none font-bold">
                  ||| | |||| || | |||| |||
                </div>
                <span className="text-[8px] font-mono text-[#8C7A54]">DEC 2025</span>
              </div>
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              5. BOARDING PASS ("Punjab → Goa - Window Seats ♡")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.35 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 5}px, ${mouseOffset.y * 5}px)`
                : undefined,
            }}
            className="md:absolute md:left-[51%] md:top-[38%] w-full max-w-[270px] z-20 group cursor-pointer"
          >
            <motion.div
              className="relative p-4 rounded-2xl border border-[#D5E5F2] transition-all duration-500 paper-grain overflow-hidden"
              style={{
                backgroundColor: "#F4F8FB",
                boxShadow: WARM_SHADOW_REST,
                rotate: -1.6,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      x: 10,
                      y: -3,
                      rotate: 0,
                      boxShadow: WARM_SHADOW_HOVER,
                    }
                  : undefined
              }
            >
              {/* Faint Passport Stamp Overlay */}
              <div className="absolute right-3 top-2 pointer-events-none opacity-20 group-hover:opacity-60 transition-opacity duration-500">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#2E6E9E] flex flex-col items-center justify-center rotate-[-12deg] p-1">
                  <span className="text-[6px] font-mono font-bold text-[#2E6E9E] tracking-widest uppercase">PASSPORT</span>
                  <span className="text-[7px] font-bold text-[#2E6E9E]">GOA 2025</span>
                </div>
              </div>

              {/* Airline Header */}
              <div className="flex items-center justify-between border-b border-[#D5E5F2] pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#2E6E9E]">
                  <Plane className="w-3.5 h-3.5" />
                  <span>PAIRAIR · BOARDING PASS</span>
                </div>
                <span className="text-[8px] font-mono text-[#6A94B8]">PF-2025</span>
              </div>

              {/* Route Display */}
              <div className="flex items-center justify-between my-2 px-1">
                <div>
                  <p className="font-heading font-black text-xl text-[#1E4A6F]">ATQ</p>
                  <p className="text-[8px] font-mono text-[#5B82A6]">Punjab</p>
                </div>

                <div className="flex flex-col items-center px-2">
                  <span className="text-xs text-[#2E6E9E]">✈</span>
                  <div className="w-12 h-px bg-[#2E6E9E]/40 my-1" />
                </div>

                <div className="text-right">
                  <p className="font-heading font-black text-xl text-[#1E4A6F]">GOI</p>
                  <p className="text-[8px] font-mono text-[#5B82A6]">Goa</p>
                </div>
              </div>

              {/* Footer details */}
              <div className="pt-2 border-t border-[#D5E5F2] flex items-center justify-between text-[8px] font-mono text-[#4A7296]">
                <span>2 TICKETS · WINDOW SEATS ♡</span>
                <span className="font-bold text-[#1E4A6F]">SEAT 12A &amp; 12B</span>
              </div>
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              6. PRESSED FLOWER (Frosted Glass Card with SVG Flower)
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 2}px, ${mouseOffset.y * 2}px)`
                : undefined,
            }}
            className="md:absolute md:right-[3%] md:top-[4%] w-full max-w-[210px] z-30 group cursor-pointer"
          >
            <motion.div
              className="relative p-4 rounded-2xl border border-white/60 transition-all duration-500 overflow-hidden backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.42)",
                boxShadow: WARM_SHADOW_REST,
                rotate: 2.8,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -5,
                      rotate: 0,
                      boxShadow: "0 20px 40px rgba(244, 114, 182, 0.22), 0 4px 12px rgba(70, 45, 55, 0.06)",
                    }
                  : undefined
              }
            >
              {/* Glass Reflection Highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />

              {/* Realistic Pressed Flower Botanical SVG */}
              <div className="relative h-28 flex items-center justify-center py-2">
                <svg className="w-20 h-24 filter drop-shadow-xs" viewBox="0 0 100 120" fill="none">
                  {/* Stem */}
                  <path d="M50 110 C50 85 46 60 52 25" stroke="#4A6B53" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M50 80 C40 70 30 68 22 58" stroke="#5C8266" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M50 65 C62 55 72 52 80 42" stroke="#5C8266" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Pressed Petals */}
                  <circle cx="52" cy="25" r="14" fill="#F49EA8" opacity="0.85" />
                  <circle cx="42" cy="20" r="12" fill="#FB7185" opacity="0.75" />
                  <circle cx="62" cy="20" r="12" fill="#FDA4AF" opacity="0.75" />
                  <circle cx="52" cy="14" r="12" fill="#F472B6" opacity="0.8" />
                  {/* Golden Stamen Center */}
                  <circle cx="52" cy="23" r="5" fill="#F59E0B" />
                  <circle cx="52" cy="23" r="2.5" fill="#78350F" />
                </svg>

                {/* Pollen Particle Dots appearing on hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 absolute top-4 left-6 animate-ping" />
                  <div className="w-1 h-1 rounded-full bg-pink-300 absolute top-8 right-8 animate-pulse" />
                </div>
              </div>

              {/* Caption */}
              <div className="text-center border-t border-white/50 pt-2 mt-1">
                <p className="font-handwriting text-xs text-[var(--ink-dark)] leading-tight">
                  Flower from our first picnic 🌸
                </p>
              </div>
            </motion.div>
          </motion.div>


          {/* ════════════════════════════════════════════════════════════════
              7. ANNIVERSARY BADGE ("365 Days")
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              transform: !reducedMotion
                ? `translate(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px)`
                : undefined,
            }}
            className="md:absolute md:right-[5%] md:top-[44%] w-full max-w-[200px] z-30 group cursor-pointer"
            onMouseEnter={() => setBadgeSparkle(true)}
            onMouseLeave={() => setBadgeSparkle(false)}
          >
            {/* Sparkle Floating Near Badge */}
            <motion.div
              animate={badgeSparkle ? { rotate: 360, scale: 1.25 } : { rotate: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute -top-3 -right-2 z-40 text-amber-500 drop-shadow-xs"
            >
              <Sparkles className="w-5 h-5 fill-current" />
            </motion.div>

            <motion.div
              className="relative p-5 rounded-full border-4 border-[#D4AF37] transition-all duration-500 paper-grain flex flex-col items-center justify-center text-center aspect-square mx-auto max-w-[165px]"
              style={{
                backgroundColor: "#FBE9EE",
                boxShadow: WARM_SHADOW_REST,
                rotate: 3.5,
              }}
              whileHover={
                !reducedMotion
                  ? {
                      y: -5,
                      scale: 1.06,
                      boxShadow: "0 22px 48px rgba(212, 175, 55, 0.25), 0 6px 16px rgba(70, 45, 55, 0.08)",
                    }
                  : undefined
              }
            >
              {/* Inner Gold Ring Accent */}
              <div className="absolute inset-1.5 rounded-full border border-[#D4AF37]/50 pointer-events-none" />

              <div className="space-y-0.5 z-10">
                <Trophy className="w-4 h-4 text-[#B8860B] mx-auto mb-1" />
                <p className="font-display italic font-black text-2xl text-[var(--ink-dark)] leading-none">
                  365
                </p>
                <p className="font-mono text-[9px] text-[var(--seal-red)] uppercase font-bold tracking-widest">
                  DAYS TOGETHER
                </p>
                <p className="font-handwriting text-[10px] text-[var(--ink-mid)] italic">
                  &amp; forever to go ♡
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>

        {/* Bottom Small Ambient Disclaimer */}
        <div className="pt-6 border-t border-[var(--border-mid)] text-center max-w-sm mx-auto">
          <p className="text-[10px] font-mono text-[var(--ink-light)] tracking-wider uppercase">
            ✦ Every keepsake stored privately only for the two of you
          </p>
        </div>
      </div>
    </section>
  );
}
