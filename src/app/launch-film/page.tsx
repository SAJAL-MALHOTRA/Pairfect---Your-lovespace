"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Lock,
  CloudRain,
  Share2,
  Check,
  Disc3,
  Camera,
  Compass,
} from "lucide-react";

export default function LaunchFilmPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const DURATION = 30.0;

  // Animation frame loop for hyper-smooth time synchronization
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (audioRef.current && isPlaying) {
        const t = audioRef.current.currentTime;
        setCurrentTime(t);
        if (t >= DURATION) {
          setIsPlaying(false);
          setCurrentTime(DURATION);
        }
      }
      animId = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= DURATION) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch(() => {
        setIsPlaying(true);
        setHasStarted(true);
      });
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setHasStarted(true);
    }).catch(() => {});
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Keyboard shortcut for presentation control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleRestart();
      } else if (e.code === "KeyM") {
        e.preventDefault();
        handleToggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isMuted, currentTime]);

  return (
    <div className="relative w-screen h-screen bg-[#0D0C0C] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      <audio
        ref={audioRef}
        src="/launch_film_audio.mp3"
        preload="auto"
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(DURATION);
        }}
      />

      {/* 16:9 Aspect Ratio Master Stage */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[1280px] aspect-video max-h-[92vh] bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#2D2A2A]/40 flex flex-col"
        style={{
          boxShadow: "0 25px 80px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* ================================================================= */}
        {/* SCENE 1: THE NOISE & THE SPARK (0.00s - 4.00s) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {currentTime < 4.2 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#0E0D0D] text-white flex flex-col items-center justify-center p-8 z-30 overflow-hidden"
            >
              {/* Vertical stream of suffocating notification bubbles (0.00s - 2.80s) */}
              {currentTime < 2.9 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-90 overflow-hidden">
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: -120, opacity: [0, 0.9, 0] }}
                    transition={{ duration: 2.2, ease: "linear" }}
                    className="px-5 py-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 font-mono flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Slack: Can you review this slide deck before 5pm?</span>
                  </motion.div>

                  <motion.div
                    initial={{ y: 140, opacity: 0 }}
                    animate={{ y: -80, opacity: [0, 1, 0] }}
                    transition={{ duration: 2.5, ease: "linear", delay: 0.2 }}
                    className="px-5 py-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 font-mono flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>WhatsApp: Don't forget oat milk from the store</span>
                  </motion.div>

                  <motion.div
                    initial={{ y: 180, opacity: 0 }}
                    animate={{ y: -40, opacity: [0, 1, 0] }}
                    transition={{ duration: 2.6, ease: "linear", delay: 0.4 }}
                    className="px-5 py-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 font-mono flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Instagram: Sent you a reel (Tap to view)</span>
                  </motion.div>

                  <motion.div
                    initial={{ y: 220, opacity: 0 }}
                    animate={{ y: 0, opacity: [0, 1, 0] }}
                    transition={{ duration: 2.4, ease: "linear", delay: 0.6 }}
                    className="px-5 py-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 font-mono flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Calendar: 15 minutes before Product Sync</span>
                  </motion.div>
                </div>
              )}

              {/* The Silence & The Two Synchronized Embers (2.80s - 4.20s) */}
              {currentTime >= 2.6 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xl"
                >
                  <div className="flex items-center gap-6">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.9)]"
                    />
                    <div className="w-8 h-[1px] bg-gradient-to-r from-rose-500/60 via-amber-300/40 to-rose-500/60" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.9)]"
                    />
                  </div>

                  <p className="font-serif italic text-2xl sm:text-3xl text-stone-200 tracking-wide font-normal leading-relaxed">
                    "Where does your love live when you close your phone?"
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* SCENE 2: THE THESIS & BRAND REVEAL (4.00s - 8.20s) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {currentTime >= 4.0 && currentTime < 8.4 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-[#FAFAF9] text-[#1C1917] flex flex-col items-center justify-center p-8 z-20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(#E7E5E4_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-[#E11D48] text-xs font-mono font-semibold tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>The Private Sanctuary For Two</span>
                </div>

                <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[#1C1917]">
                  PAIRFECT
                </h1>

                <p className="font-serif italic text-2xl sm:text-3xl text-[#E11D48] font-normal">
                  Love deserves better than a chat history.
                </p>

                <p className="text-xs sm:text-sm font-sans text-stone-500 max-w-md pt-2 leading-relaxed">
                  Not a public social network. Not an unread inbox. A shared digital room designed exclusively for two.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* SCENE 3: THE CAPABILITY SPRINT (8.20s - 18.20s) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {currentTime >= 8.2 && currentTime < 18.4 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-[#FAF7F2] text-[#1C1917] flex flex-col items-center justify-center p-6 z-20"
            >
              {/* Sub-scene A: Date Night Roulette (8.2s - 11.4s) */}
              {currentTime >= 8.2 && currentTime < 11.5 && (
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-mono font-bold tracking-wider uppercase border border-amber-200">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    <span>01 : Date Night Roulette</span>
                  </div>

                  <div className="relative w-56 h-56 rounded-full border-4 border-[#D4AF37] bg-white shadow-xl flex items-center justify-center overflow-hidden">
                    {/* Spinning wheel segments */}
                    <motion.div
                      animate={{ rotate: [0, 720, 1080, 1260] }}
                      transition={{ duration: 2.8, ease: [0.12, 0.95, 0.28, 1] }}
                      className="absolute inset-0 rounded-full flex items-center justify-center"
                    >
                      <div className="absolute top-4 font-mono text-[10px] font-bold text-rose-800">Ramen 🍜</div>
                      <div className="absolute bottom-4 font-mono text-[10px] font-bold text-amber-800">Tacos 🌮</div>
                      <div className="absolute left-4 font-mono text-[10px] font-bold text-emerald-800">Pizza 🍕</div>
                      <div className="absolute right-4 font-mono text-[10px] font-bold text-indigo-800">Sushi 🍣</div>
                    </motion.div>

                    {/* Center Hub */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5C8A] via-[#E8527D] to-[#B82B54] text-white flex flex-col items-center justify-center shadow-md z-10">
                      <span className="font-mono text-[9px] font-black tracking-widest">FATE</span>
                      <Heart className="w-3.5 h-3.5 fill-white mt-0.5" />
                    </div>

                    {/* Top Pointer */}
                    <div className="absolute top-1 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-amber-600 z-20 filter drop-shadow-sm" />
                  </div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="p-3 px-6 rounded-2xl bg-white border border-[#FFD9E3] shadow-md"
                  >
                    <p className="font-serif italic text-lg font-bold text-[#8E2B45]">
                      "Tonight's Decree: Steaming hot ramen together."
                    </p>
                    <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">
                      No arguing. The wheel has spoken. ♡
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Sub-scene B: Retro Photobooth (11.5s - 14.8s) */}
              {currentTime >= 11.5 && currentTime < 14.9 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 text-[#E11D48] text-[11px] font-mono font-bold tracking-wider uppercase border border-rose-200">
                    <Camera className="w-3.5 h-3.5" />
                    <span>02 : Virtual Retro Photobooth</span>
                  </div>

                  {/* 4-Shot Polaroid Keepsake Strip */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-56 p-3 bg-white border border-stone-200 shadow-2xl rounded-xl space-y-2"
                  >
                    <div className="w-full h-16 bg-[#FFF2F5] rounded-md border border-rose-100 flex items-center justify-center text-xl">
                      📸 ✦ 3... 2... 1... FLASH
                    </div>
                    <div className="w-full h-16 bg-[#FDF6E2] rounded-md border border-amber-100 flex items-center justify-center text-xl">
                      ✌️ Laughing together
                    </div>
                    <div className="w-full h-16 bg-[#EEF5FF] rounded-md border border-blue-100 flex items-center justify-center text-xl">
                      ✨ Inside jokes
                    </div>
                    <div className="pt-1 text-center border-t border-stone-100 flex items-center justify-between px-1">
                      <span className="font-mono text-[9px] font-bold text-stone-400">OCT 15, 2026</span>
                      <span className="font-mono text-[9px] font-bold text-rose-500">PAIRFECT STRIP</span>
                    </div>
                  </motion.div>

                  <p className="font-serif italic text-base text-stone-700">
                    "Spontaneous moments turned into tangible keepsakes."
                  </p>
                </motion.div>
              )}

              {/* Sub-scene C: Wax-Sealed Letters & Gratitude Jar (14.9s - 18.4s) */}
              {currentTime >= 14.9 && currentTime < 18.4 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center space-y-4 max-w-lg"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold tracking-wider uppercase border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>03 : Letters & Gratitude Jar</span>
                  </div>

                  {/* Wax Sealed Envelope */}
                  <div className="relative w-80 p-6 rounded-2xl bg-[#FFFDF9] border border-[#EADBCC] shadow-xl text-left space-y-2">
                    <div className="flex items-center justify-between border-b border-[#F0E6DA] pb-2">
                      <span className="font-mono text-[10px] font-bold text-[#8E3D52] tracking-wider uppercase">
                        SEALED LOVE LETTER
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">OPENS ON ANNIVERSARY</span>
                    </div>
                    <p className="font-serif italic text-base text-stone-800 pt-1">
                      "Thank you for making ordinary days feel like quiet poetry."
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-stone-500">
                      <span>Written with love ♡</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        Wax Seal: Verified
                      </span>
                    </div>
                  </div>

                  <p className="font-serif italic text-base text-stone-700">
                    "Folded memories safely kept forever."
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* SCENE 4: THE SANCTUARY ACROSS DISTANCE (18.20s - 24.20s) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {currentTime >= 18.2 && currentTime < 24.4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-[#161414] text-white flex flex-col items-center justify-center p-8 z-20 overflow-hidden"
            >
              {/* Rain particle ambient layer */}
              <div className="absolute inset-0 bg-[radial-gradient(#332D2D_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-rose-300 text-xs font-mono font-semibold tracking-widest uppercase">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Shared Ambient Atmosphere</span>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-md pt-2">
                  <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-700 text-left space-y-1">
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">DEVICE 01</p>
                    <p className="font-serif text-lg font-bold text-stone-200">London, 23:45</p>
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Rain on Window (Live)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-700 text-left space-y-1">
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">DEVICE 02</p>
                    <p className="font-serif text-lg font-bold text-stone-200">Tokyo, 08:45</p>
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Rain on Window (Live)</span>
                    </div>
                  </div>
                </div>

                {/* 3 Privacy & Sanctuary Pillars */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-lg pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 text-neutral-300">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Zero Public Feeds</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 text-neutral-300">
                    <Share2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Invite Room Code</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 text-neutral-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Only Two People</span>
                  </div>
                </div>

                <p className="font-serif italic text-2xl text-stone-300 font-normal pt-2">
                  "Even oceans apart. The same room."
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* SCENE 5: FINAL CLIMAX & BRAND LOCKUP (24.20s - 30.00s) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {currentTime >= 24.2 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-[#FAFAF9] text-[#1C1917] flex flex-col items-center justify-center p-8 z-30"
            >
              <div className="absolute inset-0 bg-[radial-gradient(#E7E5E4_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5C8A] via-[#E8527D] to-[#B82B54] text-white flex items-center justify-center shadow-lg">
                  <Heart className="w-7 h-7 fill-white" />
                </div>

                <div className="space-y-1">
                  <h2 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[#1C1917]">
                    PAIRFECT
                  </h2>
                  <p className="font-serif italic text-2xl text-[#E11D48] font-normal">
                    Love deserves better than a chat history.
                  </p>
                </div>

                <div className="pt-4 flex flex-col items-center space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-400">
                    START YOUR SHARED SANCTUARY AT
                  </p>
                  <a
                    href="https://pairfect.site"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1C1917] hover:bg-black text-white font-mono text-sm font-bold tracking-wider transition-all shadow-md hover:scale-105"
                  >
                    <span>pairfect.site</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Top Film Watermark */}
        <div className="absolute top-4 left-6 z-40 flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-stone-400 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
          <span>PAIRFECT GTM FILM · 30S CUT</span>
        </div>

        {/* Elapsed Timer Counter */}
        <div className="absolute top-4 right-6 z-40 font-mono text-xs font-bold text-stone-400 pointer-events-none">
          {currentTime.toFixed(1)}s / {DURATION.toFixed(1)}s
        </div>

        {/* Start Overlay if not yet started */}
        {!hasStarted && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white cursor-pointer group"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-2xl pl-1"
            >
              <Play className="w-8 h-8 fill-white" />
            </motion.div>
            <p className="mt-4 font-serif text-xl italic font-bold">Watch 30s Launch Film</p>
            <p className="text-xs font-mono text-white/70 mt-1">Press Spacebar or Click anywhere to play with audio</p>
          </div>
        )}
      </div>

      {/* Modern Cinema Player Controls Bar below stage */}
      <div className="w-full max-w-[1280px] mt-4 px-4 flex items-center justify-between text-xs text-stone-400 font-mono">
        <div className="flex items-center gap-4">
          <button
            onClick={handleTogglePlay}
            className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer border border-neutral-800"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer border border-neutral-800"
            title="Restart Film (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer border border-neutral-800"
            title={isMuted ? "Unmute (M)" : "Mute (M)"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrubbing timeline bar */}
        <div className="flex-1 max-w-xl mx-6 flex items-center gap-3">
          <span className="text-[11px]">{currentTime.toFixed(1)}s</span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const nextTime = ratio * DURATION;
              setCurrentTime(nextTime);
              if (audioRef.current) audioRef.current.currentTime = nextTime;
            }}
            className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden cursor-pointer relative group"
          >
            <div
              className="h-full bg-[#E11D48] transition-all duration-75"
              style={{ width: `${(currentTime / DURATION) * 100}%` }}
            />
          </div>
          <span className="text-[11px]">{DURATION.toFixed(1)}s</span>
        </div>

        <div className="text-[11px] text-neutral-500">
          HD 1080p Master · pairfect.site
        </div>
      </div>
    </div>
  );
}
