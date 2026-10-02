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
  Tv, Sparkles, RotateCw, Mic, Send, Radio, Flower2, Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BouquetCanvas from "@/components/bouquet/bouquet-canvas";

/* ─── Easing curve for motion system ─── */
const EASE_CUBIC = [0.22, 0.61, 0.36, 1] as const;

/* ─── Audio Sound Effects Engine ─── */
function playTactileSound(
  type: "tap" | "paper" | "click" | "pop" | "shutter" | "spin" | "crack" | "seal" | "static" | "chime" | "roller" = "tap",
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

    if (type === "crack") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(860, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "seal") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === "shutter") {
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
    } else if (type === "spin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "chime") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "roller") {
      osc.type = "square";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "paper" || type === "static") {
      const duration = type === "static" ? 0.12 : 0.05;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = type === "static" ? 2200 : 1400;
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(type === "static" ? 0.05 : 0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.start(now);
      noise.stop(now + duration);
    }
  } catch (e) {
    // audio fallback
  }
}

/* ═══════════════════════════════════════════════════════════════
   HERO RETRO PHOTOBOOTH MACHINE WITH AUTHENTIC COUPLE PHOTOS
   ═══════════════════════════════════════════════════════════════ */
function RetroPhotoboothKiosk({ soundEnabled }: { soundEnabled: boolean }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(true);
  const [printStep, setPrintStep] = useState(0); // 0: tucked inside slot, 1: pose 1, 2: pose 2, 3: pose 3, 4: settled
  const [currentPose, setCurrentPose] = useState(1);

  const poses = [
    {
      title: "Heart Hands & Smiles",
      alexImg: "/booth/monkey-point.jpg",
      miaImg: "/booth/monkey-heart.jpg",
      Alex: "Look at your heart hands! 🫶",
      Mia: "Haha doing it now ♡",
    },
    {
      title: "Wink & Jaw-Drop Scream",
      alexImg: "/booth/monkey-shock.jpg",
      miaImg: "/booth/monkey-shock.jpg",
      Alex: "Your shock face is hilarious!",
      Mia: "You told me to scream! 😱",
    },
    {
      title: "Pointing to the Stars",
      alexImg: "/booth/monkey-point.jpg",
      miaImg: "/booth/monkey-point.jpg",
      Alex: "Look up there!",
      Mia: "I'm thinking about it 🤔",
    },
    {
      title: "Cheek Kiss & Big Grins",
      alexImg: "/booth/monkey-heart.jpg",
      miaImg: "/booth/monkey-point.jpg",
      Alex: "3, 2, 1 CHEESE! 📸",
      Mia: "Best photo ever! 🥰",
    },
  ];

  // Auto-play the photostrip extrusion animation shortly after page load
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsPrinting(true);
      setPrintStep(0);
      playTactileSound("roller", soundEnabled);

      const s1 = setTimeout(() => {
        setPrintStep(1);
        playTactileSound("roller", soundEnabled);
      }, 350);

      const s2 = setTimeout(() => {
        setPrintStep(2);
        playTactileSound("roller", soundEnabled);
      }, 700);

      const s3 = setTimeout(() => {
        setPrintStep(3);
        playTactileSound("roller", soundEnabled);
      }, 1050);

      const s4 = setTimeout(() => {
        setPrintStep(4);
        setIsPrinting(false);
        playTactileSound("paper", soundEnabled);
      }, 1450);

      return () => {
        clearTimeout(s1);
        clearTimeout(s2);
        clearTimeout(s3);
        clearTimeout(s4);
      };
    }, 450);

    return () => clearTimeout(mountTimer);
  }, [soundEnabled]);

  const replayPrintAnimation = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintStep(0);
    playTactileSound("roller", soundEnabled);

    setTimeout(() => {
      setPrintStep(1);
      playTactileSound("roller", soundEnabled);
    }, 350);

    setTimeout(() => {
      setPrintStep(2);
      playTactileSound("roller", soundEnabled);
    }, 700);

    setTimeout(() => {
      setPrintStep(3);
      playTactileSound("roller", soundEnabled);
    }, 1050);

    setTimeout(() => {
      setPrintStep(4);
      setIsPrinting(false);
      playTactileSound("paper", soundEnabled);
    }, 1450);
  };

  const triggerSnap = () => {
    if (isPrinting || isFlashing) return;
    setIsFlashing(true);
    playTactileSound("shutter", soundEnabled);

    setTimeout(() => {
      setIsFlashing(false);
      setCurrentPose((prev) => (prev % poses.length) + 1);
      setIsPrinting(true);
      setPrintStep(0);
      playTactileSound("roller", soundEnabled);

      setTimeout(() => {
        setPrintStep(1);
        playTactileSound("roller", soundEnabled);
      }, 350);

      setTimeout(() => {
        setPrintStep(2);
        playTactileSound("roller", soundEnabled);
      }, 700);

      setTimeout(() => {
        setPrintStep(3);
        playTactileSound("roller", soundEnabled);
      }, 1050);

      setTimeout(() => {
        setPrintStep(4);
        setIsPrinting(false);
        playTactileSound("paper", soundEnabled);
      }, 1450);
    }, 220);
  };

  const activePose = poses[currentPose - 1];

  const getDevelopingFilter = (frameIdx: number) => {
    if (isPrinting && printStep < (frameIdx === 0 ? 4 : frameIdx === 1 ? 3 : frameIdx === 2 ? 2 : 1)) {
      return "sepia(0.85) contrast(0.65) brightness(1.2) blur(1.5px)";
    }
    return "none";
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto select-none">
      {/* Photobooth Machine Enclosure */}
      <div className="photobooth-cabinet p-4 sm:p-7 relative overflow-visible transition-all duration-300">
        
        {/* Shutter Flash Screen Overlay */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none rounded-3xl"
            />
          )}
        </AnimatePresence>

        {/* Machine Header with Pairfect Logo */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-book.png" alt="Pairfect Logo" width={22} height={22} className="rounded-md object-contain" />
            <span className="font-mono text-xs font-black tracking-widest text-stone-900 uppercase">
              PAIRFECT BOOTH #01
            </span>
          </div>
          <span className="bg-stone-900 text-white font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
            LIVE SYNC
          </span>
        </div>

        {/* Dual Live Video Feed Viewfinder with REAL Photos */}
        <div className="relative w-full aspect-4/3 rounded-2xl bg-stone-900 border-2 border-stone-800 p-2.5 flex flex-col justify-between shadow-inner overflow-hidden">
          
          {/* Top connection status */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 bg-blue-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Alex (Mumbai)
            </div>
            <div className="flex items-center gap-1.5 bg-rose-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Mia (Delhi)
            </div>
          </div>

          {/* Split Screen Couple Feeds showing Real Photos */}
          <div className="grid grid-cols-2 gap-2.5 my-auto z-10 w-full">
            <div className="relative aspect-4/3 rounded-xl border border-blue-400/40 overflow-hidden shadow-md">
              <Image
                src={activePose.alexImg}
                alt="Alex live feed"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 150px, 180px"
              />
              <span className="absolute bottom-1 left-1.5 bg-blue-600/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                Alex 💙
              </span>
            </div>
            <div className="relative aspect-4/3 rounded-xl border border-rose-400/40 overflow-hidden shadow-md">
              <Image
                src={activePose.miaImg}
                alt="Mia live feed"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 150px, 180px"
              />
              <span className="absolute bottom-1 right-1.5 bg-rose-600/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                Mia 💖
              </span>
            </div>
          </div>

          {/* Bottom Countdown & Action Controls */}
          <div className="flex items-center justify-between z-10 pt-1 border-t border-white/10">
            <span className="text-[10px] font-mono text-stone-300 font-bold truncate mr-2">
              Pose {currentPose} of 4: {activePose.title}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={replayPrintAnimation}
                disabled={isPrinting}
                title="Replay extrusion print animation"
                className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isPrinting ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={triggerSnap}
                disabled={isPrinting || isFlashing}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 active:scale-95 text-white font-mono text-xs font-black rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isPrinting ? "Printing... ▷" : "Snap Pose ▷"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Machine Output Dispenser Slot */}
        <div className="mt-5 relative">
          {/* Dispenser Status Indicator Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-stone-900 border border-stone-700 shadow-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isPrinting
                  ? "bg-amber-400 animate-ping"
                  : "bg-emerald-400 shadow-[0_0_6px_#34D399]"
              }`}
            />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-stone-200">
              {isPrinting ? "PRINTING STRIP..." : "DISPENSER READY"}
            </span>
          </div>

          {/* 3D Molded Photobooth Dispenser Slot Mouth */}
          <div className="w-full h-12 sm:h-14 bg-gradient-to-b from-[#FFFFFF] via-[#F3F3F5] to-[#DFDFE3] border border-stone-300 rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.12),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.06)] relative z-20 flex items-center justify-center px-4">
            <div className="w-full h-5 sm:h-6 bg-[#09090B] rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] relative overflow-hidden flex items-center justify-center">
              {/* Internal printhead roller glow during printing */}
              {isPrinting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-cyan-400/35 to-amber-400/20"
                  animate={{ opacity: [0.35, 0.9, 0.35] }}
                  transition={{ duration: 0.35, repeat: Infinity }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Rolling Out Developed Photostrip with Mechanical Stepped Extrusion */}
        <div className="-mt-3 pt-3 relative z-10 overflow-hidden">
          <motion.div
            animate={{
              y: printStep === 0 ? -440 : printStep === 1 ? -320 : printStep === 2 ? -210 : printStep === 3 ? -100 : 0,
              opacity: 1,
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-[230px] sm:w-[250px] mx-auto bg-white p-3.5 border-2 border-stone-900 rounded-2xl shadow-2xl relative space-y-2.5"
          >
            {/* Thermal / Printhead Laser Scanline Shimmer */}
            {isPrinting && (
              <motion.div
                className="absolute inset-x-0 h-2.5 bg-gradient-to-b from-transparent via-cyan-300/70 to-transparent pointer-events-none z-40 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 0.65, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Partner 1 (Alex - Blue) Cursor Tag */}
            <div className="partner-cursor partner-cursor-blue -top-3 -left-5">
              <svg className="w-5 h-5 cursor-pointer-arrow fill-current transform -rotate-12" viewBox="0 0 24 24">
                <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.129z" />
              </svg>
              <span className="cursor-pill text-[9px] font-mono font-black px-2 py-0.5 rounded-md shadow-sm ml-2 -mt-2 inline-block whitespace-nowrap">
                Alex: {activePose.Alex}
              </span>
            </div>

            {/* Partner 2 (Mia - Pink) Cursor Tag - Repositioned comfortably above footer */}
            <div className="partner-cursor partner-cursor-pink bottom-16 -right-4">
              <svg className="w-5 h-5 cursor-pointer-arrow fill-current transform -rotate-45" viewBox="0 0 24 24">
                <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.129z" />
              </svg>
              <span className="cursor-pill text-[9px] font-mono font-black px-2 py-0.5 rounded-md shadow-sm ml-2 -mt-2 inline-block whitespace-nowrap">
                Mia: {activePose.Mia}
              </span>
            </div>

            {/* 4 Strip Frames with Real Couple Photos & Chemical Developing */}
            <div className="space-y-2 bg-[#FFF9FA] p-2 rounded-xl border border-rose-100">
              
              {/* Pose 1: Heart Hands */}
              <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-rose-200/80 shadow-xs">
                <Image
                  src="/booth/monkey-heart.jpg"
                  alt="Pose 01: Heart hands"
                  fill
                  className="object-cover object-center"
                  sizes="220px"
                  style={{ filter: getDevelopingFilter(0), transition: "filter 0.7s ease" }}
                />
                <span className="absolute bottom-1 right-1.5 bg-black/65 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  POSE 01
                </span>
              </div>

              {/* Pose 2: Wink & Scream */}
              <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-blue-200/80 shadow-xs">
                <Image
                  src="/booth/monkey-shock.jpg"
                  alt="Pose 02: Wink & scream"
                  fill
                  className="object-cover object-center"
                  sizes="220px"
                  style={{ filter: getDevelopingFilter(1), transition: "filter 0.7s ease" }}
                />
                <span className="absolute bottom-1 right-1.5 bg-black/65 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  POSE 02
                </span>
              </div>

              {/* Pose 3: Pointing Up */}
              <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-amber-200/80 shadow-xs">
                <Image
                  src="/booth/monkey-point.jpg"
                  alt="Pose 03: Pointing up"
                  fill
                  className="object-cover object-center"
                  sizes="220px"
                  style={{ filter: getDevelopingFilter(2), transition: "filter 0.7s ease" }}
                />
                <span className="absolute bottom-1 right-1.5 bg-black/65 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  POSE 03
                </span>
              </div>

              {/* Pose 4: Close Up Grin - Cleanly Framed & Centered */}
              <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-purple-200/80 shadow-xs">
                <Image
                  src="/booth/monkey-heart.jpg"
                  alt="Pose 04: Heart paws zoom"
                  fill
                  className="object-cover object-center"
                  sizes="220px"
                  style={{ filter: getDevelopingFilter(3), transition: "filter 0.7s ease" }}
                />
                <span className="absolute bottom-1 right-1.5 bg-black/65 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  POSE 04
                </span>
              </div>

            </div>

            {/* Strip Footer with Pairfect Logo */}
            <div className="text-center pt-1 border-t-2 border-dashed border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-600 font-black uppercase">
              <span className="flex items-center gap-1.5">
                <Image src="/logo-book.png" alt="Pairfect Logo" width={14} height={14} className="rounded-xs" />
                PAIRFECT STUDIO
              </span>
              <span className="text-rose-500 font-bold">1,420 KM APART</span>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLOTHESLINE GALLERY WITH REAL COUPLE PHOTOSTRIPS
   ═══════════════════════════════════════════════════════════════ */
function ClotheslineGallery() {
  const strips = [
    {
      id: 1,
      names: "Maya & Kabir",
      location: "Delhi & Mumbai · 1,420 km",
      badge: "NEW",
      frameBg: "bg-[#FFFDF7]",
      border: "border-stone-300",
      pegColor: "bg-amber-400",
      animClass: "clothesline-strip-1",
      photos: [
        "/booth/monkey-heart.jpg",
        "/booth/monkey-shock.jpg",
        "/booth/monkey-point.jpg",
        "/booth/monkey-heart.jpg",
      ],
    },
    {
      id: 2,
      names: "Liam & Emma",
      location: "London & New York · 5,570 km",
      badge: "SWEETEST",
      frameBg: "bg-[#1C1917] text-white",
      border: "border-stone-900",
      pegColor: "bg-rose-500",
      animClass: "clothesline-strip-2",
      photos: [
        "/booth/monkey-shock.jpg",
        "/booth/monkey-point.jpg",
        "/booth/monkey-heart.jpg",
        "/booth/monkey-shock.jpg",
      ],
    },
    {
      id: 3,
      names: "Aarav & Diya",
      location: "Bangalore & SF · 14,000 km",
      badge: "FAVORITE",
      frameBg: "bg-[#FFF0F5]",
      border: "border-rose-200",
      pegColor: "bg-blue-500",
      animClass: "clothesline-strip-3",
      photos: [
        "/booth/monkey-point.jpg",
        "/booth/monkey-heart.jpg",
        "/booth/monkey-shock.jpg",
        "/booth/monkey-point.jpg",
      ],
    },
    {
      id: 4,
      names: "Noah & Chloe",
      location: "Chicago & Seattle · 2,800 km",
      badge: "NEW",
      frameBg: "bg-[#F0FDF4]",
      border: "border-emerald-200",
      pegColor: "bg-emerald-500",
      animClass: "clothesline-strip-4",
      photos: [
        "/booth/monkey-heart.jpg",
        "/booth/monkey-point.jpg",
        "/booth/monkey-shock.jpg",
        "/booth/monkey-heart.jpg",
      ],
    },
    {
      id: 5,
      names: "Rohan & Ananya",
      location: "Pune & Toronto · 12,500 km",
      badge: "ANNIVERSARY",
      frameBg: "bg-[#FAF5FF]",
      border: "border-purple-200",
      pegColor: "bg-amber-500",
      animClass: "clothesline-strip-5",
      photos: [
        "/booth/monkey-shock.jpg",
        "/booth/monkey-heart.jpg",
        "/booth/monkey-point.jpg",
        "/booth/monkey-shock.jpg",
      ],
    },
  ];

  return (
    <section className="w-full py-16 bg-[#FAFAF9] border-y border-stone-200 relative overflow-hidden select-none">
      
      {/* Section Header */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-3 mb-10">
        <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
          Virtual Photobooth Keepsakes
        </p>
        <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight">
          Real dates. Real keepsakes.
        </h2>
        <p className="text-sm sm:text-base font-sans text-stone-600 max-w-xl mx-auto">
          Snap 4 synchronized poses with your partner across any distance, customize your vintage strip, and export print-ready memories for your fridge.
        </p>
      </div>

      {/* The Clothesline Wire and Hanging Strips Container */}
      <div className="relative w-full max-w-[1280px] mx-auto pt-8 pb-8 overflow-x-auto no-scrollbar">
        {/* Horizontal Wire */}
        <div className="clothesline-wire" />

        {/* Strips Flex Row */}
        <div className="flex items-start justify-center gap-6 sm:gap-10 min-w-[960px] px-6">
          {strips.map((strip) => (
            <div key={strip.id} className={`relative flex flex-col items-center ${strip.animClass} transition-transform hover:scale-105 duration-300`}>
              
              {/* Clothespin */}
              <div className={`clothesline-peg ${strip.pegColor}`} />

              {/* Photostrip Card with Real Photos */}
              <div className={`w-[170px] sm:w-[185px] mt-4 p-3 rounded-2xl border-2 ${strip.border} ${strip.frameBg} shadow-xl space-y-2`}>
                
                {/* Ribbon Tag */}
                <div className="flex justify-between items-center text-[9px] font-mono font-black uppercase">
                  <span className="bg-stone-900 text-white px-1.5 py-0.5 rounded tracking-wide">
                    {strip.badge}
                  </span>
                  <span className="opacity-70 flex items-center gap-1">
                    <Image src="/logo-book.png" alt="Logo" width={11} height={11} className="rounded-xs inline" />
                    PAIRFECT
                  </span>
                </div>

                {/* 4 Real Photos */}
                <div className="space-y-1.5">
                  {strip.photos.map((photoSrc, idx) => (
                    <div
                      key={idx}
                      className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-black/10 shadow-xs"
                    >
                      <Image
                        src={photoSrc}
                        alt={`${strip.names} pose ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                  ))}
                </div>

                {/* Couple metadata */}
                <div className="pt-2 border-t border-black/10 text-center space-y-0.5">
                  <p className="font-sans font-black text-xs truncate">
                    {strip.names}
                  </p>
                  <p className="text-[9px] font-mono opacity-70 truncate font-semibold">
                    {strip.location}
                  </p>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC INTERACTIVE GAME ARENA: LIVE MULTIPLAYER PREVIEWS
   ═══════════════════════════════════════════════════════════════ */
function DynamicInteractiveGameArena({ soundEnabled }: { soundEnabled: boolean }) {
  const [activeTab, setActiveTab] = useState<"quiz" | "whisper" | "bouquet" | "roulette" | "watch" | "letter">("quiz");
  
  /* Quiz state */
  const [quizStep, setQuizStep] = useState<"picking" | "locked" | "revealed">("picking");
  const [quizSelection, setQuizSelection] = useState<string>("Midnight Drive");

  /* Whisper FM state */
  const [whisperFreq, setWhisperFreq] = useState<number>(91.7);
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(false);
  const [isRadioMuted, setIsRadioMuted] = useState<boolean>(false);
  const whisperStations = [
    { freq: 91.7, sender: "Alex (Mumbai)", title: "Morning coffee & rain", duration: "0:42", note: "Sent 8:15 AM · Private couple frequency" },
    { freq: 102.4, sender: "Mia (Delhi)", title: "Goodnight whisper note", duration: "1:14", note: "Sent 11:30 PM · Verified stereo sync" },
    { freq: 107.1, sender: "Together", title: "Lo-Fi sunset acoustic", duration: "Loop", note: "Ambient Room Broadcast · 1,420 km" },
  ];

  const handleTuneStation = (freq: number) => {
    setWhisperFreq(freq);
    playTactileSound("static", soundEnabled);
    setTimeout(() => {
      playTactileSound("chime", soundEnabled);
      setIsRadioPlaying(true);
    }, 240);
  };

  /* Botanical Bouquet state */
  const [bouquetKey, setBouquetKey] = useState(0);

  /* Roulette state */
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [rouletteWinner, setRouletteWinner] = useState("Late Night Tacos 🌮");

  /* Watch Together state */
  const [isPlaying, setIsPlaying] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([
    { id: 1, emoji: "💖", x: 20 },
    { id: 2, emoji: "🍿", x: 45 },
    { id: 3, emoji: "🥺", x: 70 },
  ]);

  /* Wax Letter state & animations */
  const [isLetterUnsealed, setIsLetterUnsealed] = useState(false);
  const [isWaxBreaking, setIsWaxBreaking] = useState(false);
  const [isWaxPacking, setIsWaxPacking] = useState(false);
  const [waxShards, setWaxShards] = useState<{ id: number; x: number; y: number; rotate: number; size: number }[]>([]);

  /* Quiz auto-sequence */
  useEffect(() => {
    if (activeTab !== "quiz") return;
    const timer1 = setTimeout(() => setQuizStep("locked"), 2800);
    const timer2 = setTimeout(() => {
      setQuizStep("revealed");
      playTactileSound("pop", soundEnabled);
    }, 4600);
    const timer3 = setTimeout(() => setQuizStep("picking"), 9500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [activeTab, quizStep, soundEnabled]);

  const handleQuizPick = (opt: string) => {
    setQuizSelection(opt);
    setQuizStep("locked");
    playTactileSound("tap", soundEnabled);
    setTimeout(() => {
      setQuizStep("revealed");
      playTactileSound("pop", soundEnabled);
      setTimeout(() => setQuizStep("picking"), 5000);
    }, 1000);
  };

  /* Spin Roulette */
  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    playTactileSound("spin", soundEnabled);
    const options = [
      "Late Night Tacos 🌮",
      "Horror Movie Marathon 🍿",
      "Cook Same Recipe on Call 🍝",
      "Truth or Dare Duel 🔥",
      "Stargazing on FaceTime ✨",
      "Face Mask & Gossip Night 🧖‍♀️",
    ];
    const extraRotations = 1440 + Math.floor(Math.random() * 360);
    setWheelRotation((prev) => prev + extraRotations);

    setTimeout(() => {
      setIsSpinning(false);
      const picked = options[Math.floor(Math.random() * options.length)];
      setRouletteWinner(picked);
      playTactileSound("pop", soundEnabled);
    }, 2400);
  };

  /* Spawn Watch Reaction */
  const spawnReaction = (emoji: string) => {
    playTactileSound("pop", soundEnabled);
    const newId = Date.now();
    setFloatingEmojis((prev) => [...prev.slice(-6), { id: newId, emoji, x: 15 + Math.random() * 70 }]);
  };

  /* Break / Pack Wax Letter Seal */
  const handleToggleSeal = () => {
    if (isWaxBreaking || isWaxPacking) return;

    if (!isLetterUnsealed) {
      // BREAK SEAL ANIMATION: 4 primary physical shards + radial dust
      setIsWaxBreaking(true);
      playTactileSound("crack", soundEnabled);

      const shards = [
        { id: 1, x: -65, y: -65, rotate: -45, size: 24 }, // top-left quadrant shard
        { id: 2, x: 65, y: -65, rotate: 45, size: 24 },   // top-right quadrant shard
        { id: 3, x: -65, y: 65, rotate: -135, size: 24 }, // bottom-left quadrant shard
        { id: 4, x: 65, y: 65, rotate: 135, size: 24 },   // bottom-right quadrant shard
        ...Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 2 * Math.PI;
          const dist = 40 + Math.random() * 50;
          return {
            id: 10 + i,
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            rotate: (Math.random() - 0.5) * 360,
            size: 4 + Math.floor(Math.random() * 6),
          };
        }),
      ];
      setWaxShards(shards);

      setTimeout(() => {
        setIsLetterUnsealed(true);
        setIsWaxBreaking(false);
        setWaxShards([]);
        playTactileSound("paper", soundEnabled);
      }, 550);
    } else {
      // PACK & RESEAL CAPSULE ANIMATION
      setIsWaxPacking(true);
      playTactileSound("paper", soundEnabled);

      setTimeout(() => {
        setIsLetterUnsealed(false);
        playTactileSound("seal", soundEnabled);
        setTimeout(() => {
          setIsWaxPacking(false);
        }, 500);
      }, 400);
    }
  };

  return (
    <section id="playground" className="py-20 px-4 sm:px-6 bg-white border-b border-stone-200 select-none">
      <div className="max-w-[1040px] mx-auto space-y-8">
        
        {/* Section Heading with Pairfect Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold uppercase tracking-wider">
            <Image src="/logo-book.png" alt="Logo" width={16} height={16} className="rounded-xs inline" />
            LIVE MULTIPLAYER PLAYGROUND
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight">
            See how the games actually feel
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
            Test the live animations and dual-phone synchronization below. Everything you tap reacts simultaneously on your partner&apos;s screen.
          </p>
        </div>

        {/* Dynamic Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 p-1.5 bg-stone-100 rounded-2xl max-w-2xl mx-auto border border-stone-200">
          <button
            onClick={() => { setActiveTab("quiz"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "quiz"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz Duel</span>
          </button>

          <button
            onClick={() => { setActiveTab("whisper"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "whisper"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Whisper FM</span>
          </button>

          <button
            onClick={() => { setActiveTab("bouquet"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "bouquet"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Flower2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Digital Bouquet</span>
          </button>

          <button
            onClick={() => { setActiveTab("letter"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "letter"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            <span>Wax Letter</span>
          </button>

          <button
            onClick={() => { setActiveTab("roulette"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "roulette"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Date Roulette</span>
          </button>

          <button
            onClick={() => { setActiveTab("watch"); playTactileSound("tap", soundEnabled); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "watch"
                ? "bg-stone-900 text-white shadow-md scale-102"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Watch Together</span>
          </button>
        </div>

        {/* Dynamic Display Container */}
        <div className="p-4 sm:p-10 rounded-3xl bg-gradient-to-b from-[#FFF5F8] via-white to-[#FFF9FB] border-2 border-rose-200 shadow-xl min-h-[440px] flex items-center justify-center">
          
          {/* TAB 1: DUAL PHONE QUIZ DUEL */}
          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[700px] space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                  Question 04 of 10 · First Impressions
                </span>
                <p className="text-xs text-stone-500 font-mono">
                  Tap either choice on Mia&apos;s phone to test the instant dual-screen match reveal!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
                {/* Mia's Phone (Left - Rose) */}
                <div className="p-4 rounded-2xl bg-white border-2 border-rose-300 shadow-md space-y-3 relative">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-rose-600 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Mia&apos;s Screen (Delhi)
                    </span>
                    <span className="text-stone-400">9:41 AM</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-center">
                    <span className="text-[9px] font-mono font-bold text-rose-500 uppercase">Question 04</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-0.5">
                      Ideal Friday night date?
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleQuizPick("Midnight Drive")}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        quizSelection === "Midnight Drive"
                          ? "bg-rose-500 text-white border-rose-600 font-bold shadow-sm"
                          : "bg-stone-50 border-stone-200 text-stone-800 hover:border-rose-300"
                      }`}
                    >
                      <span className="text-xs">Midnight Drive 🚗</span>
                      {quizSelection === "Midnight Drive" && <span className="text-xs font-mono">✓ Picked</span>}
                    </button>

                    <button
                      onClick={() => handleQuizPick("Rooftop Pizza")}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        quizSelection === "Rooftop Pizza"
                          ? "bg-rose-500 text-white border-rose-600 font-bold shadow-sm"
                          : "bg-stone-50 border-stone-200 text-stone-800 hover:border-rose-300"
                      }`}
                    >
                      <span className="text-xs">Rooftop Pizza 🍕</span>
                      {quizSelection === "Rooftop Pizza" && <span className="text-xs font-mono">✓ Picked</span>}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-stone-500 font-medium">Status</span>
                    {quizStep === "picking" && <span className="text-rose-500 font-bold animate-pulse">Choosing...</span>}
                    {quizStep === "locked" && <span className="text-amber-600 font-bold">🔒 LOCKED IN</span>}
                    {quizStep === "revealed" && <span className="text-emerald-600 font-bold">100% MATCH 🎉</span>}
                  </div>
                </div>

                {/* Alex's Phone (Right - Blue) */}
                <div className="p-4 rounded-2xl bg-white border-2 border-blue-300 shadow-md space-y-3 relative">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-blue-600 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Alex&apos;s Screen (Mumbai)
                    </span>
                    <span className="text-stone-400">9:41 AM</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                    <span className="text-[9px] font-mono font-bold text-blue-500 uppercase">Question 04</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-0.5">
                      Ideal Friday night date?
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className={`p-2.5 rounded-xl text-left border transition-all ${
                      quizStep === "revealed"
                        ? "bg-blue-600 text-white border-blue-700 font-bold shadow-sm"
                        : quizStep === "locked"
                        ? "bg-stone-100 border-stone-300 text-stone-700 font-bold"
                        : "bg-stone-50 border-stone-200 text-stone-700"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Midnight Drive 🚗</span>
                        {quizStep === "revealed" && <span className="text-xs font-mono">✓ Match</span>}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl text-left border border-stone-100 bg-stone-50/50 text-stone-400">
                      <span className="text-xs">Rooftop Pizza 🍕</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-stone-500 font-medium">Status</span>
                    {quizStep === "picking" && <span className="text-blue-500 font-bold animate-pulse">Partner typing...</span>}
                    {quizStep === "locked" && <span className="text-amber-600 font-bold">🔒 LOCKED IN</span>}
                    {quizStep === "revealed" && <span className="text-emerald-600 font-bold">100% MATCH 🎉</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: WHISPER FM RETRO RADIO */}
          {activeTab === "whisper" && (
            <motion.div
              key="whisper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[720px] space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  VOICE BROADCAST · 1,420 KM APART
                </span>
                <h3 className="text-xl sm:text-2xl font-sans font-black text-stone-900">
                  Private frequency radio for two
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Drag the dial or tap preset stations to listen to warm whispered notes with analog static.
                </p>
              </div>

              {/* Retro Radio Enclosure with Twin Vacuum Tubes */}
              <div className="relative pt-6 max-w-[620px] mx-auto">
                {/* Twin Vacuum Tubes on top right */}
                <div className="absolute top-0 right-10 sm:right-16 flex items-end gap-3 z-20 pointer-events-none">
                  {[0, 1].map((tubeIdx) => (
                    <div
                      key={tubeIdx}
                      className="relative w-7 sm:w-8 h-10 sm:h-11 rounded-t-xl bg-gradient-to-b from-white/30 via-amber-100/10 to-transparent border-t border-l border-r border-white/50 shadow-md backdrop-blur-[0.5px] flex flex-col items-center justify-end pb-1 overflow-hidden"
                    >
                      <div className="absolute top-1 left-1 w-1.5 h-5 rounded-full bg-white/40 blur-[0.5px]" />
                      {/* Coiled Glowing Tungsten Filament */}
                      <motion.div
                        className="relative flex flex-col items-center"
                        animate={{
                          filter: isRadioPlaying
                            ? [
                                "drop-shadow(0 0 6px #FF8800) brightness(1.2)",
                                "drop-shadow(0 0 14px #FFAA00) brightness(1.45)",
                                "drop-shadow(0 0 7px #FF8800) brightness(1.25)",
                              ]
                            : [
                                "drop-shadow(0 0 4px #FF7700) brightness(1.0)",
                                "drop-shadow(0 0 8px #FFA500) brightness(1.2)",
                                "drop-shadow(0 0 4px #FF7700) brightness(1.0)",
                              ],
                        }}
                        transition={{
                          duration: isRadioPlaying ? 0.9 + tubeIdx * 0.2 : 2.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="flex gap-2">
                          <div className="w-0.5 h-3 bg-zinc-400" />
                          <div className="w-0.5 h-3 bg-zinc-400" />
                        </div>
                        <div className="w-3.5 h-2.5 -mt-2 rounded-t-sm border-t-2 border-l border-r border-amber-300 bg-amber-500/40 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
                        </div>
                      </motion.div>
                      <div className="w-full h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 border-t border-zinc-500/70" />
                    </div>
                  ))}
                </div>

                {/* Main Radio Cabinet Body */}
                <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#609E8F] via-[#468677] to-[#2E6B5D] border-[3px] border-[#7FBDAE] shadow-[0_20px_40px_rgba(30,70,60,0.25),inset_0_2px_4px_rgba(255,255,255,0.45)] p-4 sm:p-6 overflow-hidden">
                  <div className="relative grid grid-cols-12 gap-3 sm:gap-5 items-center">
                    
                    {/* Left: Speaker Louvers with Acoustic Glow & Soundwaves */}
                    <div className="col-span-12 sm:col-span-5 flex flex-col justify-between h-full min-h-[160px]">
                      <div className="relative py-2 flex flex-col justify-center gap-1.5 flex-1 overflow-hidden">
                        {/* Acoustic Pressure Soundwave Ripples */}
                        {isRadioPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {[0, 1, 2].map((ring) => (
                              <motion.div
                                key={`ring-${ring}`}
                                className="absolute rounded-full border border-emerald-300/40 bg-emerald-300/5"
                                initial={{ width: 16, height: 16, opacity: 0.8 }}
                                animate={{
                                  width: [16, 110, 170],
                                  height: [16, 110, 170],
                                  opacity: [0.8, 0.3, 0],
                                }}
                                transition={{
                                  duration: 2.2,
                                  repeat: Infinity,
                                  delay: ring * 0.7,
                                  ease: "easeOut",
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Speaker Grille Louvers */}
                        {Array.from({ length: 8 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="relative h-2 sm:h-2.5 rounded-full bg-[#184239] shadow-[inset_0_2px_3px_rgba(0,0,0,0.7)] overflow-hidden"
                          >
                            {isRadioPlaying ? (
                              <motion.div
                                className="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200/60 rounded-full"
                                animate={{
                                  width: [
                                    `${30 + ((idx * 8) % 40)}%`,
                                    `${75 + ((idx * 5) % 25)}%`,
                                    `${40 + ((idx * 7) % 35)}%`,
                                  ],
                                  opacity: [0.7, 1, 0.75],
                                }}
                                transition={{
                                  duration: 0.55 + (idx % 3) * 0.15,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  ease: "easeInOut",
                                }}
                              />
                            ) : (
                              <div
                                className="h-full bg-emerald-500/10 rounded-full"
                                style={{ width: `${20 + (idx % 3) * 10}%` }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Brand Typography */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white tracking-wide flex items-center gap-1.5">
                          <span>Pairfect</span>
                          <span className="font-mono text-[10px] tracking-widest text-[#BDE7DC] uppercase font-bold">
                            WHISPER FM
                          </span>
                        </span>
                        <button
                          onClick={() => {
                            setIsRadioPlaying(!isRadioPlaying);
                            playTactileSound("tap", soundEnabled);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#184239] hover:bg-[#11312a] text-white font-mono text-[10px] font-bold flex items-center gap-1 border border-emerald-400/30 transition-all cursor-pointer"
                        >
                          {isRadioPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                          <span>{isRadioPlaying ? "PAUSE" : "LISTEN"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Recessed Tuning Console */}
                    <div className="col-span-12 sm:col-span-7 space-y-3">
                      <div className="rounded-2xl bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E6] to-[#F1E6D0] border-2 border-[#D4AF37]/50 shadow-inner p-3 flex flex-col gap-2.5">
                        
                        {/* LCD Display */}
                        <div className="relative rounded-xl bg-[#13171B] border border-black/40 px-3 py-2 flex items-center justify-between text-white overflow-hidden shadow-inner">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400">FM</span>
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 rounded-xs animate-pulse">
                              LOCKED
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-mono font-bold text-lg text-white">
                            <span>{whisperFreq.toFixed(1)}</span>
                            <span className="text-[10px] text-zinc-400">MHz</span>
                          </div>

                          {/* 4 Green LED Signal Bars */}
                          <div className="flex items-end gap-1 h-3.5">
                            {[1, 2, 3, 4].map((bar) => (
                              <span
                                key={bar}
                                className="w-1 rounded-xs bg-[#2DF312] shadow-[0_0_6px_rgba(45,243,18,0.7)]"
                                style={{ height: `${bar * 25}%` }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Analog Needle Tuning Scale Slider */}
                        <div className="relative rounded-xl bg-[#141618] border border-black/50 p-2 text-white shadow-inner flex flex-col justify-between overflow-hidden">
                          <div className="relative h-6 flex items-center">
                            {/* Tick Marks */}
                            <div className="absolute inset-0 flex justify-between px-1">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-px ${
                                    i % 6 === 0 ? "h-3.5 bg-zinc-300" : "h-1.5 bg-zinc-600"
                                  } self-start`}
                                />
                              ))}
                            </div>

                            {/* Sliding Red Needle with Spring Inertia */}
                            <motion.div
                              className="absolute top-0 bottom-0 w-1 rounded-full z-10"
                              style={{
                                left: `${((whisperFreq - 88) / (108 - 88)) * 100}%`,
                                transform: "translateX(-50%)",
                                boxShadow: "0 0 10px rgba(239,68,68,1), 0 0 3px #FFFFFF",
                                background: "linear-gradient(180deg, #FF6B6B 0%, #E51E2B 50%, #B80F18 100%)",
                              }}
                              animate={{ scaleY: [1, 1.08, 1] }}
                              transition={{
                                left: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                              }}
                            >
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-red-500" />
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#FF2E3B]" />
                            </motion.div>
                          </div>

                          <div className="flex justify-between px-0.5 pt-1 text-[9px] font-mono text-zinc-400">
                            <span>88.0</span>
                            <span>94.0</span>
                            <span>100.0</span>
                            <span>108.0</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Station Preset Quick-Pick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {whisperStations.map((st) => {
                  const isCurrent = Math.abs(whisperFreq - st.freq) < 0.2;
                  return (
                    <button
                      key={st.freq}
                      onClick={() => handleTuneStation(st.freq)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                        isCurrent
                          ? "bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-white border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={`font-bold ${isCurrent ? "text-emerald-700" : "text-stone-500"}`}>
                          {st.freq} FM
                        </span>
                        <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                          {st.duration}
                        </span>
                      </div>
                      <p className="text-xs font-sans font-bold text-stone-900 truncate">
                        {st.title}
                      </p>
                      <p className="text-[10px] font-mono text-stone-500 truncate">
                        {st.sender} · {st.note}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Active Voice Note Player Preview Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-sans font-bold text-stone-900">
                        {whisperFreq === 91.7 ? "Alex: Morning coffee voice note" : whisperFreq === 102.4 ? "Mia: Goodnight whisper note" : "Lo-Fi sunset acoustic"}
                      </span>
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                        STEREO
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-stone-500">
                      {isRadioPlaying ? "Broadcasting through vintage audio tube filter..." : "Station tuned in. Tap Listen or choose a frequency above."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/whisper"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-emerald-600 text-white font-mono text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Open Whisper FM</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* TAB 3: BOTANICAL BOUQUET & UNWRAP REVEAL */}
          {activeTab === "bouquet" && (
            <motion.div
              key="bouquet"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[540px] text-center space-y-6"
            >
              {/* Header */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-700 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Flower2 className="w-3.5 h-3.5" />
                  BOTANICAL KEEPSAKE · NEVER WITHERS
                </span>
                <h3 className="text-xl sm:text-2xl font-sans font-black text-stone-900">
                  Flowers handcrafted for your partner
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Tap the ribbon to untie and watch the handpicked flowers bloom across your screen.
                </p>
              </div>

              {/* Authentic Bouquet Canvas Component matching user request */}
              <div className="relative flex justify-center py-2">
                <BouquetCanvas
                  key={bouquetKey}
                  flowers={["rose", "peony", "tulip", "peony"]}
                  wrappingId="kraft"
                  ribbonId="rose"
                  atmosphereId="petals"
                  toName="Mia"
                  fromName="Alex"
                  message="I wish I could be beside you today. Even with the miles between us, you are the first thought when I wake and the first smile in my day."
                  isRevealMode={true}
                  className="w-full max-w-[420px] aspect-[4/5] shadow-2xl"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => {
                    setBouquetKey((k) => k + 1);
                    playTactileSound("paper", soundEnabled);
                  }}
                  className="px-4 py-2.5 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-100 text-stone-900 font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rewrap &amp; Tie Ribbon</span>
                </button>
                <Link
                  href="/bouquet"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-600 text-white font-mono text-xs font-bold uppercase transition-all shadow-md flex items-center gap-2"
                >
                  <Flower2 className="w-3.5 h-3.5" />
                  <span>Build Your Own Bouquet ▷</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* TAB 4: DATE NIGHT ROULETTE */}
          {activeTab === "roulette" && (
            <motion.div
              key="roulette"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[500px] text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-amber-600 uppercase tracking-wider">
                  The Anti-Indecision Wheel
                </span>
                <h3 className="text-xl sm:text-2xl font-sans font-black text-stone-900">
                  Can&apos;t agree what to do? Let the wheel decide.
                </h3>
              </div>

              {/* Animated Interactive Wheel Graphic */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-4">
                {/* Pointer marker */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-stone-900 shadow-md" />
                
                {/* Spinning Disc */}
                <motion.div
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: isSpinning ? 2.4 : 0, ease: [0.15, 0.9, 0.25, 1] }}
                  className="w-full h-full rounded-full border-6 border-stone-900 shadow-2xl relative overflow-hidden bg-conic from-rose-400 via-amber-400 via-blue-400 via-purple-400 via-emerald-400 to-rose-400 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/30" />
                  
                  {/* Wheel Hub */}
                  <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center font-mono text-[10px] font-black shadow-lg z-10 border-2 border-white/50">
                    <Image src="/logo-book.png" alt="Logo" width={24} height={24} className="rounded-xs" />
                  </div>
                </motion.div>
              </div>

              {/* Spin Button */}
              <div className="space-y-3">
                <button
                  onClick={spinRoulette}
                  disabled={isSpinning}
                  className={`px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-rose-600 active:scale-95 text-white font-mono text-xs sm:text-sm font-black tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 mx-auto cursor-pointer ${
                    isSpinning ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  <RotateCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                  <span>{isSpinning ? "Spinning..." : "SPIN THE WHEEL 🎲"}</span>
                </button>

                <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-2xl max-w-sm mx-auto shadow-xs">
                  <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">Selected Date Night:</span>
                  <p className="font-sans font-black text-stone-900 text-sm mt-0.5">
                    {rouletteWinner}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: WATCH TOGETHER THEATER */}
          {activeTab === "watch" && (
            <motion.div
              key="watch"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[620px] space-y-4"
            >
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-purple-600 uppercase tracking-wider">
                  Live YouTube Cinema Tab Sync
                </span>
                <p className="text-xs text-stone-500 font-mono">
                  Shared play/pause, zero drift, and live floating reaction emojis!
                </p>
              </div>

              {/* Video Screen Simulation */}
              <div className="relative w-full aspect-16/9 rounded-2xl bg-stone-950 border-2 border-stone-800 overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
                
                {/* Floating Emojis Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {floatingEmojis.map((item) => (
                    <motion.span
                      key={item.id}
                      initial={{ y: 160, opacity: 1, scale: 0.8 }}
                      animate={{ y: -30, opacity: 0, scale: 1.3 }}
                      transition={{ duration: 2.2, ease: "easeOut" }}
                      style={{ left: `${item.x}%` }}
                      className="absolute text-2xl select-none"
                    >
                      {item.emoji}
                    </motion.span>
                  ))}
                </div>

                {/* Top Info */}
                <div className="flex items-center justify-between text-xs font-mono text-stone-300 z-10">
                  <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Room #812 · Synced with Mia</span>
                  </div>
                  <span className="bg-rose-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                    1080p FULL HD
                  </span>
                </div>

                {/* Center Cinema Play State */}
                <div className="text-center space-y-2 z-10 my-auto">
                  <button
                    onClick={() => { setIsPlaying(!isPlaying); playTactileSound("tap", soundEnabled); }}
                    className="w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-xl mx-auto transition-transform cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                  </button>
                  <p className="text-white text-xs font-sans font-bold shadow-xs">
                    City of Stars · La La Land (Live Sync)
                  </p>
                </div>

                {/* Bottom Timeline Controls */}
                <div className="space-y-1.5 z-10 bg-black/70 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: isPlaying ? ["38%", "45%"] : "38%" }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-stone-300">
                    <span>14:22 / 42:10</span>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Mic className="w-3 h-3 animate-pulse" />
                      <span>Mia speaking (Mic on)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Reaction Bar */}
              <div className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-2xl shadow-xs">
                <span className="text-xs font-mono text-stone-600 font-bold">Tap to send live reaction:</span>
                <div className="flex gap-2">
                  {["💖", "🥺", "🍿", "🔥", "😂"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => spawnReaction(emoji)}
                      className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-lg transition-all active:scale-90 cursor-pointer shadow-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: WAX SEALED LOVE LETTER & PACK ANIMATION */}
          {activeTab === "letter" && (
            <motion.div
              key="letter"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[540px] text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-800 uppercase tracking-wider">
                  The Permanent Keepsake
                </span>
                <h3 className="text-xl sm:text-2xl font-sans font-black text-stone-900">
                  Letters you can never accidentally delete
                </h3>
              </div>

              {/* Parchment Letter Mockup with 3D Wax Seal & Pack Animation */}
              <div
                className="relative p-5 sm:p-8 rounded-3xl bg-[#FDFBF7] border-2 border-amber-200/80 shadow-2xl space-y-4 text-left overflow-hidden"
                style={{ perspective: 1000 }}
              >
                {/* 3D Envelope Top Flap */}
                <motion.div
                  animate={{
                    rotateX: isLetterUnsealed ? 180 : 0,
                    opacity: isLetterUnsealed ? 0.35 : 1,
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "top", transformStyle: "preserve-3d" }}
                  className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#F5E6CC] to-[#E8D4B4] rounded-t-2xl border-t border-[#D9C099] shadow-sm z-20 pointer-events-none"
                />

                {/* Mobile Responsive Header Wrapping */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Image src="/logo-book.png" alt="Logo" width={18} height={18} className="rounded-xs" />
                    <span className="text-xs font-mono font-bold text-stone-700 uppercase tracking-wide">
                      From Alex to Mia · 1,420 km
                    </span>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-mono bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                    {isLetterUnsealed ? "Anniversary Capsule 💌" : "Anniversary Capsule 🔒"}
                  </span>
                </div>

                {/* Content: Sealed vs Unsealed */}
                <AnimatePresence mode="wait">
                  {!isLetterUnsealed ? (
                    <motion.div
                      key="sealed"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4 py-2 relative z-10"
                    >
                      <div className="space-y-2">
                        <p className="font-sans font-bold text-sm text-stone-900">
                          To the love of my life,
                        </p>
                        <p className="font-sans text-sm leading-relaxed text-stone-600 italic">
                          &ldquo;Even when we&apos;re living in different cities, you make my whole world feel warm. Promise me you won&apos;t peek until our date...&rdquo;
                        </p>
                      </div>

                      {/* 3D Wax Seal Button with Break Particles */}
                      <div className="pt-2 pb-1 text-center relative flex flex-col items-center justify-center">
                        <button
                          type="button"
                          onClick={handleToggleSeal}
                          disabled={isWaxBreaking || isWaxPacking}
                          aria-label="Break wax seal and open letter"
                          className="relative inline-flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                        >
                          {/* Radial Shards Bursting on Break */}
                          {isWaxBreaking && waxShards.map((s) => (
                            <motion.span
                              key={s.id}
                              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: s.x, y: s.y, scale: 0.3, opacity: 0, rotate: s.rotate }}
                              transition={{ duration: 0.52, ease: "easeOut" }}
                              className="absolute rounded-md bg-gradient-to-br from-[#C41C44] via-[#941332] to-[#5C0A1E] border border-rose-300 pointer-events-none z-30 shadow-md"
                              style={{ width: `${s.size}px`, height: `${s.size}px` }}
                            />
                          ))}

                          {/* 3D Wax Stamp with Rich Metallic Ring and Heart */}
                          <motion.div
                            animate={
                              isWaxBreaking
                                ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] }
                                : isWaxPacking
                                ? { scale: [0, 1.15, 1], opacity: [0, 1, 1] }
                                : { scale: 1, opacity: 1 }
                            }
                            transition={{ duration: 0.45 }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C41C44] via-[#941332] to-[#5C0A1E] shadow-[0_10px_25px_rgba(148,19,50,0.45)] ring-4 ring-[#5C0A1E]/30 border-2 border-rose-300/60 flex items-center justify-center text-rose-100 text-xl font-black group-hover:scale-105 transition-transform select-none relative"
                          >
                            <span className="drop-shadow-sm select-none">♥</span>
                            <div className="absolute top-1.5 left-2.5 w-4 h-2 rounded-full bg-white/35 blur-[1px] transform -rotate-45 pointer-events-none" />
                          </motion.div>

                          <span className="text-[10px] font-mono font-bold text-rose-800 mt-2.5 uppercase tracking-wider group-hover:text-rose-900 group-hover:underline flex items-center gap-1">
                            {isWaxBreaking ? "Breaking Wax Seal..." : "Tap Seal to Break Wax ▷"}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unsealed"
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: EASE_CUBIC }}
                      className="space-y-4 py-2 relative z-10"
                    >
                      {/* Full Unsealed Letter Note */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-amber-300/70 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                          <span className="font-bold text-stone-700">To Mia, with all my heart</span>
                          <span>Oct 14 · 11:42 PM</span>
                        </div>

                        <p className="font-sans text-sm sm:text-base leading-relaxed text-stone-800 font-medium">
                          &ldquo;I can&apos;t wait until airports are just places we visit for vacations, not goodbyes. Thank you for making distance feel small. Happy Anniversary my favorite human.&rdquo;
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                          <span className="font-display italic text-sm text-rose-700 font-bold">Forever yours, Alex ♡</span>
                          <span className="text-[10px] font-mono text-stone-400">Verified Capsule #2026</span>
                        </div>
                      </div>

                      {/* Attached Polaroid Keepsake */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-[#FFF8FA] border border-rose-200">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-stone-100">
                          <Image
                            src="/booth/monkey-heart.jpg"
                            alt="Alex & Mia"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left space-y-1">
                          <span className="text-[10px] font-mono font-bold text-rose-700 uppercase">Attached Memory Snapshot</span>
                          <p className="text-xs font-sans text-stone-700 font-medium">
                            &ldquo;Our favorite moment from the weekend we spent together.&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Pack & Reseal Capsule Button */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSeal}
                          disabled={isWaxBreaking || isWaxPacking}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-rose-700 active:scale-95 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer group"
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-300 group-hover:scale-110 transition-transform" />
                          <span>{isWaxPacking ? "Packing Capsule..." : "Pack & Reseal Capsule ▷"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-3 border-t border-amber-200/60 text-center text-[10px] font-mono text-stone-500">
                  Permanently archived in your shared vault forever
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY SHOWCASE: 8 100% REAL EXPERIENCES WITH HIGH-FIDELITY MOCKUPS
   ═══════════════════════════════════════════════════════════════ */
function ActivitiesShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -340, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  };

  const activities = [
    {
      id: "photobooth",
      title: "Virtual Photobooth",
      tag: "MOST POPULAR",
      desc: "Synchronized dual-shutter camera. Snap 4 goofy poses together, choose vintage frames, and download print-ready 300 DPI strips.",
      screenTheme: "from-stone-900 to-black",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3 bg-stone-900 text-white rounded-2xl select-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-stone-300">BOOTH #01 · SYNCED</span>
            </div>
            <span className="text-[9px] font-mono bg-white/10 text-stone-200 px-1.5 py-0.5 rounded">3s TIMER</span>
          </div>

          {/* Split Camera Feed with Real Photos */}
          <div className="grid grid-cols-2 gap-2 my-auto">
            <div className="relative aspect-3/4 rounded-xl overflow-hidden border border-blue-400/50 shadow-sm">
              <Image src="/booth/monkey-point.jpg" alt="Alex" fill className="object-cover" sizes="120px" />
              <span className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[8px] font-mono px-1 py-0.5 rounded font-bold">Alex 💙</span>
            </div>
            <div className="relative aspect-3/4 rounded-xl overflow-hidden border border-rose-400/50 shadow-sm">
              <Image src="/booth/monkey-heart.jpg" alt="Mia" fill className="object-cover" sizes="120px" />
              <span className="absolute bottom-1 right-1 bg-rose-600/90 text-white text-[8px] font-mono px-1 py-0.5 rounded font-bold">Mia 💖</span>
            </div>
          </div>

          {/* Shutter Trigger */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[9px] font-mono text-stone-400 font-bold">Pose 3 of 4</span>
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">Ready</span>
          </div>
        </div>
      ),
      link: "/photo-booth",
    },
    {
      id: "know-me",
      title: "Know Me Quiz Battle",
      tag: "DEEP CONVERSATION",
      desc: "Answer 14 curated question packs privately on your own phones, then reveal your answers together to see how well you really know each other.",
      screenTheme: "from-blue-50 to-indigo-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-blue-50/70 to-white rounded-2xl select-none border border-blue-100">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="font-bold text-blue-600 uppercase">Round 4 of 10</span>
            <span className="font-bold text-stone-700">Streak: 3 🔥</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-1">
            <span className="text-[9px] font-mono font-bold text-blue-500 uppercase">First Impressions</span>
            <p className="text-xs font-sans font-bold text-stone-900 leading-snug">
              &quot;What did I notice first when we met?&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-sm flex items-center justify-between">
              <span>Your laugh &amp; big smile</span>
              <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded">Alex 🔒</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500 text-white text-[11px] font-bold shadow-sm flex items-center justify-between">
              <span>Your laugh &amp; big smile</span>
              <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded">Mia 🔒</span>
            </div>
          </div>

          <div className="py-1 px-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] font-sans font-black text-emerald-700 tracking-wide">
              🎉 100% MATCH! (+200 PTS)
            </span>
          </div>
        </div>
      ),
      link: "/quiz",
    },
    {
      id: "botanical-bouquet",
      title: "Digital Bouquets & Letters",
      tag: "BOTANICAL KEEPSAKES",
      desc: "Handpick fresh botanical blooms, choose artisanal wrapping paper and silk ribbon ties, and seal with a personal note for your partner.",
      screenTheme: "from-rose-50 to-pink-100",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#FFFDF9] to-[#FBF4EC] text-stone-800 rounded-2xl select-none relative overflow-hidden border border-[#E8D9C8]">
          <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 border-b border-stone-200/60 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-stone-700 font-bold uppercase tracking-wider">Botanical Bloom</span>
            </div>
            <span className="text-rose-600 font-bold">12 Varieties</span>
          </div>

          <div className="py-2 text-center space-y-1">
            <div className="text-3xl">💐</div>
            <p className="font-serif italic font-bold text-sm text-[#3D2432]">
              Handcrafted with Love
            </p>
            <p className="text-[10px] text-stone-600 font-mono">
              Roses, Peonies &amp; Lavender tied with Silk Ribbon
            </p>
          </div>

          <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[9px] font-mono">
            <span className="text-stone-500">Sealed with wax</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">Keepsake PNG</span>
          </div>
        </div>
      ),
      link: "/bouquet",
    },
    {
      id: "whisper-fm",
      title: "Whisper FM Retro Radio",
      tag: "VOICE BROADCAST",
      desc: "Tune into your private analog couple frequency. Leave whispered voice notes that play over warm vacuum-tube radio with authentic static and chimes.",
      screenTheme: "from-[#203630] to-[#12221E] text-white",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#203630] to-[#142621] text-white rounded-2xl select-none border border-emerald-500/20">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">FM 91.7 MHz</span>
            </div>
            <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
              LOCKED
            </span>
          </div>

          {/* Radio Dial & Tubes Graphic */}
          <div className="py-1 space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-6 rounded-t-md bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                <span className="w-1 h-3 rounded-full bg-amber-300 animate-pulse" />
              </span>
              <span className="w-4 h-6 rounded-t-md bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                <span className="w-1 h-3 rounded-full bg-amber-300 animate-pulse" />
              </span>
            </div>
            <p className="font-sans font-bold text-xs text-emerald-100">
              Mia: &ldquo;Morning coffee &amp; miss you&rdquo;
            </p>
            <p className="text-[9px] font-mono text-emerald-300/70">
              0:42 · Recorded 8:15 AM
            </p>
          </div>

          {/* Acoustic Waveform & Equalizer Bars */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 flex-1">
              {[40, 75, 55, 90, 65, 80, 45, 70, 85, 50].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full"
                  style={{ height: `${h * 0.22}px` }}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">
              LIVE FM
            </span>
          </div>
        </div>
      ),
      link: "/whisper",
    },
    {
      id: "wax-letters",
      title: "Wax-Sealed Love Letters",
      tag: "KEEPSAKE ARCHIVE",
      desc: "Write letters that can't be deleted by an accidental swipe. Choose genuine wax colors, stamp your seal, and set an unlock date for anniversaries.",
      screenTheme: "from-[#FDFBF7] to-amber-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-[#FDFBF7] rounded-2xl select-none border border-amber-200/80 shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 border-b border-amber-200/60 pb-1.5">
            <span className="font-bold text-rose-800 uppercase tracking-wider">Vault Letter</span>
            <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Encrypted 🔒</span>
          </div>

          <div className="space-y-1 py-1 text-left">
            <p className="font-sans font-bold text-xs text-stone-900">
              Dearest Mia,
            </p>
            <p className="font-sans font-medium text-[11px] leading-relaxed text-stone-700">
              &quot;Even with 1,420 km between us, you are my favorite part of every day. Promise me you won&apos;t open this until midnight on our anniversary...&quot;
            </p>
          </div>

          <div className="relative py-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-rose-700 shadow-md ring-2 ring-rose-900/40 border border-rose-500 flex items-center justify-center text-rose-100 text-xs font-black">
              ♥
            </div>
            <span className="text-[8px] font-mono font-bold text-rose-800 mt-1 uppercase tracking-wider">
              Crimson Wax Seal
            </span>
          </div>

          <div className="p-1 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <span className="text-[9px] font-mono font-bold text-amber-800">
              📅 Unlocks: Nov 24 (Anniversary)
            </span>
          </div>
        </div>
      ),
      link: "/love-letter",
    },
    {
      id: "roulette",
      title: "Pairfect Roulette",
      tag: "DATE NIGHT DECIDER",
      desc: "Can't decide what to eat, watch, or do on call? Spin the interactive couples roulette wheel and let fate make the call without debates.",
      screenTheme: "from-amber-50 to-orange-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-amber-50/70 to-white rounded-2xl select-none border border-amber-200">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="font-bold text-amber-700 uppercase">Decision Wheel</span>
            <span className="font-bold text-stone-700">Fate Decides</span>
          </div>

          <div className="relative w-24 h-24 mx-auto my-1 flex items-center justify-center">
            <div className="w-full h-full rounded-full border-4 border-stone-800 shadow-md overflow-hidden relative bg-gradient-to-tr from-rose-400 via-amber-400 to-indigo-400" />
            <div className="absolute w-7 h-7 rounded-full bg-stone-900 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow-md">
              SPIN
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-stone-900" />
          </div>

          <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-stone-600 uppercase">Selected Result</span>
            <p className="text-xs font-sans font-black text-stone-900">
              Late Night Tacos &amp; Movie 🌮
            </p>
          </div>

          <div className="text-center text-[9px] font-mono text-stone-500">
            Zero arguing · No &quot;I don&apos;t know, you pick&quot;
          </div>
        </div>
      ),
      link: "/roulette",
    },
    {
      id: "gratitude-jar",
      title: "The Gratitude Jar",
      tag: "DAILY RITUAL",
      desc: "Drop folded digital notes into your shared jar throughout the week. Open and read them together on rainy days or quiet evenings.",
      screenTheme: "from-rose-50 to-pink-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-rose-50/70 to-white rounded-2xl select-none border border-rose-100">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="font-bold text-rose-600 uppercase">Daily Ritual</span>
            <span className="font-bold text-stone-700">18 Notes Inside</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1 text-left">
            <span className="text-[9px] font-mono font-bold text-rose-500 uppercase">Folded Note #18</span>
            <p className="text-xs font-sans font-medium text-stone-800 leading-relaxed">
              &quot;Thank you for staying on call until I fell asleep last night. Knowing you were there meant everything.&quot;
            </p>
            <div className="flex justify-between items-center text-[8px] font-mono text-stone-400 pt-0.5">
              <span>From Mia</span>
              <span>Opened Sunday</span>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 py-0.5">
            <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-md text-[8px] font-mono font-bold">💌 Note 1</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[8px] font-mono font-bold">✨ Note 2</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-mono font-bold">🌿 Note 3</span>
          </div>

          <div className="p-1.5 bg-stone-900 text-white rounded-xl text-center text-[10px] font-mono font-bold">
            + Drop a note into the jar
          </div>
        </div>
      ),
      link: "/gratitude-jar",
    },
    {
      id: "iq-duel",
      title: "IQ Duel & Brain Challenge",
      tag: "CO-OP & VERSUS",
      desc: "Fast-paced brain battle for two. Test memory, speed, and logic in quick 1-on-1 rounds to see who's doing the dishes next.",
      screenTheme: "from-indigo-50 to-purple-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-indigo-50/70 to-white rounded-2xl select-none border border-indigo-100">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="font-bold text-indigo-600 uppercase">Round 3 of 5</span>
            <span className="text-rose-600 font-bold">⏱ 02.4s</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-1 bg-blue-100 rounded-lg text-blue-900 font-mono text-[10px] font-bold">
              Alex: 240 pts
            </div>
            <div className="p-1 bg-rose-100 rounded-lg text-rose-900 font-mono text-[10px] font-bold">
              Mia: 260 pts 👑
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-indigo-200 text-center space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-stone-500">Speed Riddle</span>
            <p className="text-xs font-sans font-bold text-stone-900 leading-snug">
              &quot;What has keys but no locks, space but no room?&quot;
            </p>
          </div>

          <div className="p-2 bg-indigo-600 text-white rounded-xl text-center text-xs font-mono font-bold shadow-sm">
            Mia buzzed: A Keyboard! ⚡
          </div>
        </div>
      ),
      link: "/iq-duel",
    },
    {
      id: "love-match",
      title: "Love Match & Compatibility",
      tag: "SYNCHRONICITY",
      desc: "Rapid-fire Would You Rather and relationship showdown. Discover unexpected secrets and celebrate your 100% sync moments.",
      screenTheme: "from-emerald-50 to-teal-50",
      mockupContent: (
        <div className="h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-emerald-50/70 to-white rounded-2xl select-none border border-emerald-100">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="font-bold text-emerald-600 uppercase">Compatibility</span>
            <span className="font-bold text-stone-700">Round 5/10</span>
          </div>

          <div className="text-center py-0.5">
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Would you rather?</span>
            <p className="text-xs font-sans font-black text-stone-900 mt-0.5">
              Midnight drive with music, or breakfast in bed?
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-between">
              <span>Midnight Drive 🚗</span>
              <span className="text-[9px] font-mono bg-black/20 px-1.5 py-0.5 rounded-full font-bold">Both Picked!</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 font-medium text-xs flex items-center justify-between">
              <span>Breakfast in Bed ☕</span>
              <span className="text-[9px] font-mono text-stone-400">0 votes</span>
            </div>
          </div>

          <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              ⚡ Soulmate Sync: 92% Alignment
            </span>
          </div>
        </div>
      ),
      link: "/play/love-match",
    },
  ];

  return (
    <section id="activities" className="py-20 px-4 sm:px-6 max-w-[1280px] mx-auto select-none space-y-12">
      
      {/* Header - Clean Editorial Styling */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
            Interactive Date Nights
          </p>
          <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight">
            Pick tonight&apos;s activity
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl">
            Choose from 12+ realtime multiplayer games, vintage radio, synchronized cinema, and keepsakes built specifically for two phones in love.
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={scrollLeft}
            className="w-11 h-11 rounded-full border-2 border-stone-800 bg-white hover:bg-stone-100 active:scale-95 flex items-center justify-center text-stone-900 transition-all shadow-sm cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="w-11 h-11 rounded-full border-2 border-stone-800 bg-stone-900 hover:bg-stone-800 active:scale-95 flex items-center justify-center text-white transition-all shadow-md cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Row of Realistic High-Fidelity iPhones */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
      >
        {activities.map((act) => (
          <div
            key={act.id}
            className="w-[280px] sm:w-[320px] shrink-0 flex flex-col justify-between p-5 rounded-3xl bg-white border-2 border-stone-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="space-y-4">
              {/* iPhone chassis mockup with high-fidelity realistic UI */}
              <div className="phone-chassis w-full aspect-9/14 bg-gradient-to-b from-stone-50 to-white flex flex-col justify-between p-3 relative group-hover:border-rose-500 transition-colors">
                {/* Dynamic island */}
                <div className="phone-island" />

                {/* Status Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 px-2">
                  <span>9:41</span>
                  <span>5G 100%</span>
                </div>

                {/* Inner Screen Content - Rich, Realistic iOS Layout */}
                <div className={`w-full flex-1 rounded-2xl bg-gradient-to-b ${act.screenTheme} flex flex-col justify-center my-2 overflow-hidden relative border border-black/5`}>
                  {act.mockupContent}
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-24 h-1 bg-stone-900/30 rounded-full mx-auto mb-1" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                  {act.tag}
                </span>
                <h3 className="font-sans font-black text-xl text-stone-900 group-hover:text-rose-600 transition-colors">
                  {act.title}
                </h3>
                <p className="text-xs text-stone-600 font-sans leading-relaxed line-clamp-3">
                  {act.desc}
                </p>
              </div>
            </div>

            {/* Play Button */}
            <Link
              href={act.link}
              className="mt-5 w-full py-2.5 px-4 rounded-xl border-2 border-stone-900 bg-stone-900 hover:bg-rose-500 hover:border-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Play this tonight</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHYSICAL KEEPSAKES & FRIDGE MAGNETS WITH REAL PHOTOSTRIP
   ═══════════════════════════════════════════════════════════════ */
function KeepsakeFridgeSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FAF8F5] border-y border-stone-200 select-none">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Visual Mockup of Fridge with Magnets & Real Photos */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[420px] aspect-4/5 rounded-3xl bg-gradient-to-b from-stone-200 via-stone-100 to-stone-300 border-4 border-stone-400 p-6 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            
            {/* Fridge texture reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Sticky note on fridge */}
            <div className="absolute top-6 left-6 w-32 h-28 bg-yellow-100 border border-yellow-200 rounded-lg p-2.5 shadow-md transform -rotate-6">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto -mt-4 shadow-xs" />
              <p className="font-handwriting text-xs text-stone-700 leading-snug pt-1">
                Don&apos;t forget Friday photobooth date! ♡ Alex
              </p>
            </div>

            {/* Real Photostrip with 3D Fridge Magnets & Real Photos */}
            <div className="relative w-[210px] bg-white p-3.5 border-2 border-stone-800 rounded-2xl shadow-2xl transform rotate-2 space-y-2">
              
              {/* Strawberry Fridge Magnet on top */}
              <div className="fridge-magnet bg-rose-500 -top-4 left-6 border border-rose-600 text-xs text-white">
                🍓
              </div>

              {/* Heart Fridge Magnet on bottom */}
              <div className="fridge-magnet bg-yellow-400 -bottom-3 right-6 border border-yellow-500 text-xs text-white">
                ⭐️
              </div>

              {/* Strip Frames with Real Couple Photos */}
              <div className="space-y-2 bg-[#FFF9FA] p-1.5 rounded-xl border border-rose-100">
                <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-rose-200 shadow-xs">
                  <Image
                    src="/booth/monkey-heart.jpg"
                    alt="Fridge photostrip frame 1"
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
                <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-blue-200 shadow-xs">
                  <Image
                    src="/booth/monkey-shock.jpg"
                    alt="Fridge photostrip frame 2"
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
                <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-amber-200 shadow-xs">
                  <Image
                    src="/booth/monkey-point.jpg"
                    alt="Fridge photostrip frame 3"
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              </div>

              <div className="text-center pt-1 border-t border-stone-200 text-[9px] font-mono text-stone-600 font-black uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Image src="/logo-book.png" alt="Logo" width={11} height={11} className="rounded-xs" />
                  DELHI &amp; MUMBAI
                </span>
                <span>2026</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Copy & Value Proposition */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-600 uppercase">
            From Screen to Refrigerator
          </p>

          <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight leading-tight">
            Put your strip on both your fridges
          </h2>

          <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
            Long-distance shouldn&apos;t mean having zero tangible memories together. Pairfect develops your digital dates into high-resolution, print-ready keepsakes you can touch, stick on your fridge, or slip into your wallet.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">300 DPI Print-Ready Export</h4>
                <p className="text-xs text-stone-600">Export in standard 2x6 photobooth dimensions, ready for any photo printer or local shop.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Miles Apart &amp; Room Date Stamp</h4>
                <p className="text-xs text-stone-600">Each strip permanently etches the exact date, both city names, and the distance you bridged that night.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Living Vault For Two</h4>
                <p className="text-xs text-stone-600">Every single strip, quiz score, and wax letter is stored in your private room vault forever.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/photo-booth"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <span>Make your first strip for free ▷</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATE NIGHT ROADMAP: CLEAN ELEGANT ICONS (NO CHEAP EMOJIS)
   ═══════════════════════════════════════════════════════════════ */
function DateNightRoadmap() {
  const steps = [
    {
      num: "01",
      title: "Warm Up in the Photobooth",
      desc: "Take 4 goofy poses together to immediately shake off work stress and warm up your smiles.",
      time: "5 mins",
      icon: <Camera className="w-5 h-5" />,
      badgeBg: "bg-rose-500",
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200",
      accent: "border-rose-200",
      link: "/photo-booth",
    },
    {
      num: "02",
      title: "The 'Know Me' Quiz Battle",
      desc: "Answer 10 deep and hilarious questions simultaneously to see who knows the other better.",
      time: "12 mins",
      icon: <HelpCircle className="w-5 h-5" />,
      badgeBg: "bg-blue-500",
      iconBg: "bg-blue-50 text-blue-600 border border-blue-200",
      accent: "border-blue-200",
      link: "/quiz",
    },
    {
      num: "03",
      title: "Love Match Compatibility",
      desc: "Rapid-fire Would You Rather rounds with instant match percentages and synchronicity badges.",
      time: "8 mins",
      icon: <Heart className="w-5 h-5" />,
      badgeBg: "bg-amber-500",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      accent: "border-amber-200",
      link: "/play/love-match",
    },
    {
      num: "04",
      title: "Seal a Midnight Love Letter",
      desc: "Leave one heartfelt thought in wax that your partner will wake up to tomorrow morning.",
      time: "3 mins",
      icon: <Mail className="w-5 h-5" />,
      badgeBg: "bg-purple-500",
      iconBg: "bg-purple-50 text-purple-600 border border-purple-200",
      accent: "border-purple-200",
      link: "/love-letter",
    },
  ];

  return (
    <section id="roadmap" className="py-20 px-4 sm:px-6 max-w-[1240px] mx-auto select-none">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-16">
        <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
          Date Night Itinerary
        </p>
        <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight">
          Chapter 1: Start here
        </h2>
        <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
          Never wonder &quot;what should we do on FaceTime tonight?&quot; again. Just follow this guided 4-step couples itinerary.
        </p>
      </div>

      {/* Dotted Roadmap Path Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`relative p-6 rounded-3xl bg-white border-2 ${step.accent} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group`}
          >
            {/* Top Node Indicator */}
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-full ${step.badgeBg} text-white font-mono font-black text-xs flex items-center justify-center shadow-md`}>
                {step.num}
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                ⏱ {step.time}
              </span>
            </div>

            {/* Content with Clean Lucide Icon Badge */}
            <div className="space-y-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${step.iconBg}`}>
                {step.icon}
              </div>
              <h3 className="font-sans font-black text-xl text-stone-900 group-hover:text-rose-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {step.desc}
              </p>
            </div>

            {/* Link CTA */}
            <Link
              href={step.link}
              className="w-full py-2.5 px-3 rounded-xl border border-stone-800 bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-900 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Start this stop</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTHENTIC CASHFREE INR PRICING - HIGH CONVERTING FOR COUPLES
   ═══════════════════════════════════════════════════════════════ */
function PricingCardsSection({ soundEnabled }: { soundEnabled: boolean }) {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-[#FAFAF9] border-t border-stone-200 select-none">
      <div className="max-w-[1240px] mx-auto text-center space-y-12">
        
        {/* Header - Emotionally Grounded & Transparent */}
        <div className="space-y-4">
          <p className="text-xs font-mono font-bold tracking-widest text-rose-600 uppercase">
            Honest Pricing for Couples
          </p>
          <h2 className="text-3xl sm:text-5xl font-sans font-black text-stone-900 tracking-tight">
            One pass unlocks it for BOTH of you
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
            Your partner never has to pay a single rupee. If either of you upgrades, both accounts immediately unlock the full relationship suite.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold shadow-xs">
            <span>💡 Less than the cost of one takeout meal: for months of real date nights</span>
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
          
          {/* Card 1: Starter Free Forever */}
          <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">FREE FOREVER</span>
                <h3 className="font-sans font-black text-2xl text-stone-900">Starter</h3>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-black text-stone-900">₹0</span>
                  <span className="text-xs font-mono text-stone-500">/ forever for both</span>
                </div>
                <p className="text-xs font-mono text-emerald-600 font-bold mt-1">100% free · No card required</p>
              </div>

              <ul className="space-y-2 text-xs text-stone-600 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                  <span>11 realtime games &amp; activities</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                  <span>Virtual photobooth with 3 poses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                  <span>30-day memory archive</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                  <span>1 shared private room for two</span>
                </li>
              </ul>
            </div>

            <Link
              href="/onboarding"
              className="w-full py-3 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-100 text-stone-900 font-mono text-xs font-bold text-center transition-all cursor-pointer shadow-xs"
            >
              Get Started Free ▷
            </Link>
          </div>

          {/* Card 2: Plus Monthly */}
          <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">MONTHLY PASS</span>
                <h3 className="font-sans font-black text-2xl text-stone-900">Plus Monthly</h3>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-black text-stone-900">₹129</span>
                  <span className="text-xs font-mono text-stone-500">/ mo for both</span>
                </div>
                <p className="text-xs font-mono text-rose-600 font-bold mt-1">Only ₹65 per partner / month</p>
              </div>

              <ul className="space-y-2 text-xs text-stone-600 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 font-bold shrink-0" />
                  <span><strong>Covers both partners completely</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Unlimited 300 DPI photobooth prints</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Unlimited memory vault forever</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>All 11 realtime activities unlocked</span>
                </li>
              </ul>
            </div>

            <Link
              href="/checkout?plan=plus-monthly"
              className="w-full py-3 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-900 hover:text-white text-stone-900 font-mono text-xs font-bold text-center transition-all cursor-pointer shadow-xs"
            >
              Get Plus Monthly ▷
            </Link>
          </div>

          {/* Card 3: 3-Month Pass (THE HERO / CONVERSION LEADER) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFF5F8] to-white border-2 border-rose-500 shadow-xl ring-4 ring-rose-500/10 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-mono text-[10px] font-black uppercase px-3.5 py-1 rounded-full shadow-md tracking-wider whitespace-nowrap">
              ★ MOST POPULAR · SAVE 35%
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">QUARTERLY PASS</span>
                <h3 className="font-sans font-black text-2xl text-stone-900">3-Month Pass</h3>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-black text-rose-600">₹249</span>
                  <span className="text-xs font-mono text-stone-500">/ 3 months for both</span>
                </div>
                <p className="text-xs font-mono text-rose-700 font-bold mt-1 bg-rose-100/80 px-2 py-0.5 rounded-md inline-block">
                  Only ₹41 / partner / month!
                </p>
              </div>

              <ul className="space-y-2 text-xs text-stone-700 pt-4 border-t border-rose-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 font-bold shrink-0" />
                  <span><strong>Everything in Plus Monthly</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Save 35% compared to monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Free print-ready magnet downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Custom room background themes</span>
                </li>
              </ul>
            </div>

            <Link
              href="/checkout?plan=plus-quarterly"
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-mono text-xs font-black text-center transition-all shadow-md cursor-pointer tracking-wider"
            >
              Unlock for Both (₹249) ▷
            </Link>
          </div>

          {/* Card 4: Forever Lifetime Pass */}
          <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">PAY ONCE, KEEP FOREVER</span>
                <h3 className="font-sans font-black text-2xl text-stone-900">Forever Pass</h3>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-black text-stone-900">₹1,999</span>
                  <span className="text-xs font-mono text-stone-500">/ lifetime for both</span>
                </div>
                <p className="text-xs font-mono text-purple-600 font-bold mt-1">Never pay again · ₹1,000/partner</p>
              </div>

              <ul className="space-y-2 text-xs text-stone-600 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 font-bold shrink-0" />
                  <span><strong>Living Archive active forever</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Gold VIP badge on room &amp; profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>All future game packs included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Priority 24/7 couple support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/checkout?plan=pairfect-forever"
              className="w-full py-3 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-900 hover:text-white text-stone-900 font-mono text-xs font-bold text-center transition-all cursor-pointer shadow-xs"
            >
              Get Forever Pass ▷
            </Link>
          </div>

        </div>

        {/* Payment Methods & Instant Activation Guarantee */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-mono text-stone-600">
          <span className="flex items-center gap-1.5 font-bold text-stone-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            Instant UPI (Google Pay, PhonePe, Paytm), Cards &amp; NetBanking
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 font-bold text-stone-800">
            <Lock className="w-4 h-4 text-rose-500" />
            Instant 1-tap activation on both phones
          </span>
        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOM CODE QUICK JOIN + FAQ ACCORDION
   ═══════════════════════════════════════════════════════════════ */
function JoinRoomAndFaqSection() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleCodeChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newCode = [...joinCode];
    newCode[index] = val.toUpperCase();
    setJoinCode(newCode);

    if (val && index < 5) {
      const nextInput = document.getElementById(`quick-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = joinCode.join("").trim();
    if (fullCode.length === 6) {
      router.push(`/onboarding?code=${fullCode}`);
    } else {
      router.push("/login");
    }
  };

  const faqs = [
    {
      q: "Can my partner and I join from different cities or devices?",
      a: "Yes! One partner can be on an iPhone in Mumbai and the other on a laptop in New York. Pairfect runs seamlessly in any web browser without needing to download large apps.",
    },
    {
      q: "Do both of us have to buy a subscription?",
      a: "No! A single subscription covers both partners. When you upgrade, your partner's account automatically receives all Plus benefits with zero extra cost.",
    },
    {
      q: "How does the virtual photobooth develop real prints?",
      a: "Pairfect renders high-resolution 300 DPI exports formatted for standard 2x6 photobooth strips. You can download them instantly to print at home, order as magnets, or stick on your fridge.",
    },
    {
      q: "Are our love letters and photos private?",
      a: "Strictly private. Your room is completely protected by your private 6-character code and end-to-end user authentication. We do not sell data, display ads, or have public feeds.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support all major Indian and international payment methods via Cashfree: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-[840px] mx-auto select-none space-y-16">
      
      {/* Quick Room Code Input Box */}
      <div className="p-8 rounded-3xl bg-white border-2 border-stone-200 shadow-xl text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
            HAVE A ROOM CODE FROM YOUR PARTNER?
          </p>
          <h3 className="font-sans font-black text-2xl sm:text-3xl text-stone-900">
            Enter your 6-character code
          </h3>
          <p className="text-xs font-mono text-stone-500">
            Open your synchronized private room in one tap.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <input
                key={idx}
                id={`quick-code-${idx}`}
                type="text"
                maxLength={1}
                value={joinCode[idx]}
                onChange={(e) => handleCodeChange(idx, e.target.value)}
                className="w-9 sm:w-12 h-11 sm:h-14 text-center text-base sm:text-xl font-mono font-black uppercase rounded-xl border-2 border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Join Room Now ▷
            </button>
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-100 text-stone-900 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Create New Room ▷
            </Link>
          </div>
        </form>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-6 text-left">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">
            COMMON QUESTIONS
          </p>
          <h3 className="font-sans font-black text-2xl sm:text-3xl text-stone-900">
            Everything you need to know
          </h3>
        </div>

        <div className="space-y-3 divide-y divide-stone-200 pt-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="pt-4 first:pt-0 space-y-1">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-sm sm:text-base font-bold text-stone-900 hover:text-rose-600 transition-colors cursor-pointer py-1.5"
              >
                <span>{faq.q}</span>
                <span className="font-mono text-xs text-stone-400 pl-4 font-bold">
                  {openFaqIndex === idx ? "✕" : "+"}
                </span>
              </button>
              {openFaqIndex === idx && (
                <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed pt-1 pb-2">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT COMPONENT: LandingContent
   ═══════════════════════════════════════════════════════════════ */
export default function LandingContent() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  return (
    <div className="landing-journal relative min-h-screen flex flex-col overflow-x-hidden bg-[#FFFFFF] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">

      {/* ── TOP ANNOUNCEMENT RIBBON ── */}
      <div className="bg-[#D2436D] text-white text-[11px] sm:text-xs font-mono py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs z-30 relative select-none">
        <span className="text-white/80 text-xs">◎</span>
        <span className="text-white/90 text-xs">♡</span>
        <span>Pairfect · The private digital sanctuary &amp; living archive for two</span>
      </div>

      {/* ── STICKY NAVBAR MATCHING DESIGN SPEC ── */}
      <header className="w-full bg-[#FFF5F7] border-b border-[#F7D8E0] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between">
          
          {/* Brand Logo: circular icon wrapper with pink border + italic pairfect + pink dot */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group select-none shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#F5C2CC] flex items-center justify-center p-1 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/logo-book.png"
                alt="Pairfect"
                width={20}
                height={20}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display italic text-xl sm:text-2xl font-bold tracking-tight text-[#2C1E1A]">
                pairfect
              </span>
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FF8DA1] inline-block shrink-0" />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-6 text-xs font-mono font-semibold text-[#7A5B64] uppercase tracking-wider">
            <a href="#why-pairfect" className="hover:text-[#2C1E1A] transition-colors">WHY PAIRFECT</a>
            <a href="#playground" className="hover:text-[#2C1E1A] transition-colors">SEE IN ACTION</a>
            <Link href="/whisper" className="hover:text-[#2C1E1A] transition-colors">RADIO</Link>
            <Link href="/bouquet" className="hover:text-[#2C1E1A] transition-colors">BOUQUETS</Link>
            <Link href="/love-letter" className="hover:text-[#2C1E1A] transition-colors">LETTERS</Link>
            <Link href="/photo-booth" className="hover:text-[#2C1E1A] transition-colors">PHOTOBOOTH</Link>
            <a href="#pricing" className="hover:text-[#2C1E1A] transition-colors">PRICING</a>
          </nav>

          {/* Right CTA & Sound Control */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playTactileSound("pop", true);
              }}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full border border-[#F5C2CC] bg-white/70 hover:bg-white text-[10px] sm:text-[11px] font-mono font-medium text-[#7A5B64] hover:text-[#2C1E1A] uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              aria-label="Toggle soundscapes"
              title={soundEnabled ? "Soundscapes ON" : "Soundscapes OFF"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#D2436D]" />
                  <span className="hidden sm:inline">SOUNDSCAPES ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#A0707D]" />
                  <span className="hidden sm:inline">SOUNDSCAPES OFF</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-block text-xs font-mono font-semibold uppercase tracking-wider text-[#7A5B64] hover:text-[#2C1E1A] transition-colors px-1"
            >
              SIGN IN
            </Link>
            <Link
              href="/onboarding"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#E8557F] hover:bg-[#D43D69] active:scale-98 text-white font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(232,85,127,0.35)] hover:shadow-[0_6px_20px_rgba(232,85,127,0.45)] transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>OPEN ROOM</span>
              <span className="text-[10px]">▷</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ── MAIN HERO SECTION (MAJOR PAIRFECT LOGO PRESENCE & ELEGANT COPY) ── */}
      <section id="why-pairfect" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          
          {/* Left Column: Headline, Mission, CTAs, Feature Cards, Review */}
          <div className="w-full lg:w-7/12 text-left space-y-6">
            
            {/* Major Pairfect Brand Tag */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white border border-stone-300 shadow-xs">
              <Image src="/logo-book.png" alt="Pairfect Logo" width={24} height={24} className="object-contain" priority />
              <span className="font-mono text-xs font-bold text-stone-800 tracking-wider uppercase">
                PAIRFECT · A PRIVATE ROOM FOR TWO
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-sans font-black text-stone-900 tracking-tight leading-[1.06]">
              Fun dates for <span className="text-rose-600">long distance</span> relationships.
            </h1>

            {/* Heartfelt Purpose Note - Clean Modern Typography, No Em-Dashes */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#FFF9FA] border-l-4 border-rose-500 space-y-3 text-stone-800 shadow-xs">
              <p className="font-sans text-base sm:text-lg leading-relaxed text-stone-700 font-medium">
                One day, years from now, you&apos;ll forget what happened on an ordinary Tuesday. You&apos;ll forget the song playing on the highway, the photo in the booth, the silly inside joke.
              </p>
              <p className="font-sans font-black text-rose-600 text-lg sm:text-xl tracking-tight">
                Pairfect won&apos;t.
              </p>
            </div>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#activities"
                className="px-6 sm:px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-rose-600 active:scale-98 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Pick an activity ▷</span>
              </a>
              <Link
                href="/photo-booth"
                className="px-6 sm:px-7 py-3.5 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-100 text-stone-900 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Open the photobooth
              </Link>
            </div>

            {/* Authentic Feature Badges */}
            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-6 text-xs font-mono text-stone-600">
              <span className="flex items-center gap-1.5 font-bold text-stone-900">
                <Check className="w-4 h-4 text-emerald-600" /> Works in any browser
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-bold text-stone-900">
                <Check className="w-4 h-4 text-emerald-600" /> Private room code for two
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-bold text-stone-900">
                <Check className="w-4 h-4 text-emerald-600" /> 12+ free date activities
              </span>
            </div>

            {/* Interactive Feature Quick-Launch Trio Cards */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Feature 1: Whisper FM */}
              <Link
                href="/whisper"
                className="group p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Radio className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    91.7 FM
                  </span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-stone-900 group-hover:text-emerald-700 transition-colors">
                    Whisper FM
                  </h4>
                  <p className="text-[10px] font-mono text-stone-500 leading-tight mt-0.5">
                    Live tube radio for voice notes
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Tune in</span>
                  <span>▷</span>
                </div>
              </Link>

              {/* Feature 2: Digital Bouquets */}
              <Link
                href="/bouquet"
                className="group p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Flower2 className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                    Botanical
                  </span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-stone-900 group-hover:text-rose-700 transition-colors">
                    Handmade Bouquets
                  </h4>
                  <p className="text-[10px] font-mono text-stone-500 leading-tight mt-0.5">
                    Paper-wrapped blooms that never wilt
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Wrap blooms</span>
                  <span>▷</span>
                </div>
              </Link>

              {/* Feature 3: Wax Letters */}
              <Link
                href="/love-letter"
                className="group p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Wax Seal
                  </span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-stone-900 group-hover:text-amber-700 transition-colors">
                    Wax Love Letters
                  </h4>
                  <p className="text-[10px] font-mono text-stone-500 leading-tight mt-0.5">
                    Parchment notes with 3D wax break
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Write note</span>
                  <span>▷</span>
                </div>
              </Link>
            </div>


          </div>

          {/* Right Column: Retro 3D Photobooth Machine with Rolling Strip */}
          <div className="w-full lg:w-5/12 flex justify-center">
            <RetroPhotoboothKiosk soundEnabled={soundEnabled} />
          </div>

        </div>
      </section>

      {/* ── CLOTHESLINE SOCIAL PROOF SECTION ── */}
      <ClotheslineGallery />

      {/* ── DYNAMIC INTERACTIVE GAME ARENA (ANIMATED LIVE VIEWS) ── */}
      <DynamicInteractiveGameArena soundEnabled={soundEnabled} />

      {/* ── ACTIVITIES HORIZONTAL IPHONE CAROUSEL (8 REAL EXPERIENCES) ── */}
      <ActivitiesShowcase />

      {/* ── PHYSICAL KEEPSAKES & FRIDGE MAGNETS ── */}
      <KeepsakeFridgeSection />

      {/* ── DATE NIGHT ROADMAP: CHAPTER 1 (NO EMOJIS, CLEAN SVG ICONS) ── */}
      <DateNightRoadmap />

      {/* ── AUTHENTIC CASHFREE PRICING (HIGH-CONVERTING) ── */}
      <PricingCardsSection soundEnabled={soundEnabled} />

      {/* ── ROOM CODE JOIN + FAQ ACCORDION ── */}
      <JoinRoomAndFaqSection />

      {/* ── BRAND FOOTER - PROMINENT PAIRFECT LOGO (NO DOTS) ── */}
      <footer className="border-t border-stone-200 py-12 px-4 sm:px-6 bg-[#FAFAF9]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-3 select-none">
              <Image
                src="/logo-book.png"
                alt="Pairfect Logo"
                height={34}
                width={34}
                className="object-contain"
              />
              <span className="font-sans font-black text-2xl tracking-tight text-stone-900">
                pairfect
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono">
              The private relationship sanctuary for couples who live apart.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-500 font-mono">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:pairfect.site@yahoo.com" className="hover:text-stone-900 transition-colors">
              Contact Us
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-stone-500 font-mono">
              &copy; 2026 Pairfect. Built for two. Kept forever.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
