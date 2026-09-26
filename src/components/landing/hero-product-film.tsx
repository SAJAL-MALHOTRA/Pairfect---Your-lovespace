"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Flame,
  Mail,
  Camera,
  Sparkles,
  MapPin,
  Clock,
  Check,
  ChevronRight,
  Send,
  Play,
  Pause,
} from "lucide-react";

type SceneKey = "home" | "letter" | "polaroid" | "ritual";

interface SceneTab {
  key: SceneKey;
  label: string;
  subtitle: string;
}

const SCENES: SceneTab[] = [
  { key: "home", label: "01 · Sanctuary", subtitle: "Living room for two" },
  { key: "letter", label: "02 · Letter", subtitle: "Wax-sealed note" },
  { key: "polaroid", label: "03 · Scrapbook", subtitle: "Living photo memory" },
  { key: "ritual", label: "04 · Ritual", subtitle: "Tonight's sync" },
];

export default function HeroProductFilm() {
  const [activeScene, setActiveScene] = useState<SceneKey>("home");
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-advance scenes every 6 seconds unless paused
  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // update progress smoothly
    const duration = 6000;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Switch to next scene
          setActiveScene((current) => {
            const idx = SCENES.findIndex((s) => s.key === current);
            return SCENES[(idx + 1) % SCENES.length].key;
          });
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, activeScene]);

  const handleSelectScene = (key: SceneKey) => {
    setActiveScene(key);
    setProgress(0);
  };

  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] shadow-2xl overflow-hidden select-none"
      style={{
        boxShadow: "0 24px 70px -12px rgba(44, 30, 26, 0.16), 0 4px 16px rgba(44, 30, 26, 0.04)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Application Bar (Actual Pairfect styling) */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8DFD5] bg-white/70 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E57373]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD54F]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#81C784]/80" />
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#6E5D57] font-semibold pl-1">
            Mia & Alex's Sanctuary
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5EFE6] border border-[#E8DFD5] text-[10px] font-mono font-semibold text-[#8E2B45]">
            <Flame className="w-3 h-3 fill-current" />
            <span>152 Days Together</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-md text-[#9E8C85] hover:text-[#2C1E1A] transition-colors"
            title={isPaused ? "Resume tour" : "Pause tour"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div className="relative min-h-[380px] sm:min-h-[420px] p-6 sm:p-8 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {/* SCENE 1: SANCTUARY HOME */}
          {activeScene === "home" && (
            <motion.div
              key="scene-home"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-4 max-w-lg"
            >
              {/* Couple Header Pill */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8E2B45] to-[#D38CA2] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    M & A
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2C1E1A]">Our Room</h4>
                    <p className="text-[11px] text-[#6E5D57]">Mia is online · Alex is writing...</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected</span>
                </div>
              </div>

              {/* Meanwhile Proximity Preview */}
              <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E8DFD5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#8E2B45]/10 text-[#8E2B45]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E8C85] block">
                      Meanwhile Proximity
                    </span>
                    <p className="text-xs font-semibold text-[#2C1E1A]">
                      86 miles apart · Rain in Delhi, Stars in Jalandhar
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#6E5D57] block">Local Time</span>
                  <span className="text-xs font-bold text-[#2C1E1A] font-mono">08:24 PM</span>
                </div>
              </div>

              {/* Quick Action Activity Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF2EC] to-[#F5EAE1] border border-[#E4D8CB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#8E2B45] text-white flex items-center justify-center shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2C1E1A]">Sealed Letter Delivered</div>
                    <div className="text-[11px] text-[#6E5D57]">Tap to break the wax seal and open</div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectScene("letter")}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD5] text-[11px] font-semibold text-[#8E2B45] hover:bg-[#8E2B45] hover:text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Letter</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCENE 2: LOVE LETTER UNSEALED */}
          {activeScene === "letter" && (
            <motion.div
              key="scene-letter"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md relative"
            >
              <div
                className="relative rounded-2xl p-6 sm:p-7 border border-[#E4D8CB] paper-grain shadow-md space-y-4"
                style={{
                  background: "linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%)",
                  backgroundImage:
                    "linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%), linear-gradient(transparent calc(28px - 1px), rgba(196,168,130,0.22) calc(28px - 1px), rgba(196,168,130,0.22) 28px, transparent 28px)",
                  backgroundSize: "100%, 100% 28px",
                }}
              >
                {/* Washi tape on top corner */}
                <div
                  className="absolute -top-2.5 right-6 w-16 h-5 rounded-xs pointer-events-none opacity-80"
                  style={{
                    background: "rgba(211, 140, 162, 0.35)",
                    transform: "rotate(3deg)",
                  }}
                />

                <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#9E8C85]">
                    Letter · July 18
                  </span>
                  <span className="text-[10px] font-mono text-[#8E2B45] font-semibold flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-current" />
                    Sealed with wax
                  </span>
                </div>

                <div className="space-y-2 text-[#2C1E1A] font-handwriting text-base sm:text-lg leading-relaxed pt-1">
                  <p className="font-bold">My love,</p>
                  <p>
                    Some days I just look at you across the breakfast counter and wonder how I got so
                    lucky. Thank you for making coffee every morning even when it&apos;s your turn to
                    sleep in.
                  </p>
                  <p className="text-right pt-2">— Yours forever, Alex ♡</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E8DFD5] text-[11px] text-[#6E5D57]">
                  <span className="italic">Saved to our permanent heirloom</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#8E2B45] font-mono font-bold text-[10px]">
                    Encrypted for Two
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCENE 3: POLAROID SCRAPBOOK */}
          {activeScene === "polaroid" && (
            <motion.div
              key="scene-polaroid"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <div
                className="polaroid relative rounded-sm shadow-xl transition-transform hover:scale-105"
                style={{
                  transform: "rotate(-2deg)",
                  boxShadow: "0 16px 36px rgba(44, 30, 26, 0.14)",
                }}
              >
                {/* Washi tape at top */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 rounded-xs pointer-events-none"
                  style={{
                    background: "rgba(142, 43, 69, 0.25)",
                    transform: "rotate(-1deg)",
                  }}
                />

                {/* Photo artwork frame */}
                <div className="w-56 sm:w-64 h-56 sm:h-64 rounded-xs overflow-hidden bg-gradient-to-tr from-[#3D2432] via-[#8E2B45] to-[#E8A0B2] relative flex items-center justify-center p-4">
                  <div className="text-center text-white space-y-1">
                    <span className="text-3xl">🌅</span>
                    <p className="font-display italic text-lg font-bold text-white/95">
                      First Sunset Walk
                    </p>
                    <p className="text-[10px] font-mono text-white/80">Marine Drive, 6:48 PM</p>
                  </div>

                  {/* Gentle film grain texture overlay */}
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
                </div>

                {/* Handwritten Caption at base of Polaroid */}
                <div className="pt-3 pb-1 text-center font-handwriting text-sm sm:text-base text-[#2C1E1A]">
                  &ldquo;Neither of us wanted to go back inside.&rdquo;
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#6E5D57] font-mono">
                <Camera className="w-3.5 h-3.5 text-[#8E2B45]" />
                <span>Memory #42 added to Couple Scrapbook</span>
              </div>
            </motion.div>
          )}

          {/* SCENE 4: PLAYFUL RITUAL */}
          {activeScene === "ritual" && (
            <motion.div
              key="scene-ritual"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md space-y-4"
            >
              <div className="p-6 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC] border border-[#E4D8CB] text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E2B45]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8E2B45]" />
                  <span>Tonight&apos;s Daily Spark</span>
                </div>

                <h3 className="font-display italic text-lg sm:text-xl font-bold text-[#2C1E1A] leading-snug">
                  &ldquo;If we could teleport anywhere right now for one hour, where are we going?&rdquo;
                </h3>

                <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                  <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-emerald-300 shadow-2xs space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#9E8C85]">Alex Answered</span>
                    <p className="text-xs font-bold text-[#2C1E1A]">The rooftop greenhouse 🌿</p>
                    <span className="text-[10px] text-emerald-700 font-semibold block flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Locked in
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-emerald-300 shadow-2xs space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#9E8C85]">Mia Answered</span>
                    <p className="text-xs font-bold text-[#2C1E1A]">The rooftop greenhouse 🌿</p>
                    <span className="text-[10px] text-emerald-700 font-semibold block flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Locked in
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#8E2B45] font-bold inline-flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>100% Match! Teleportation coordinates aligned.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Scene Navigator Tabs */}
      <div className="grid grid-cols-4 border-t border-[#E8DFD5] bg-white divide-x divide-[#E8DFD5]">
        {SCENES.map((scene) => {
          const isActive = activeScene === scene.key;
          return (
            <button
              key={scene.key}
              onClick={() => handleSelectScene(scene.key)}
              className={`p-3 text-left transition-colors relative cursor-pointer ${
                isActive ? "bg-[#FAF5EC]/80" : "hover:bg-stone-50"
              }`}
            >
              {/* Active Progress Bar */}
              {isActive && !isPaused && (
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-[#8E2B45] transition-all"
                  style={{ width: `${progress}%` }}
                />
              )}

              <span
                className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
                  isActive ? "text-[#8E2B45]" : "text-[#6E5D57]"
                }`}
              >
                {scene.label}
              </span>
              <span className="hidden sm:block text-[10px] text-[#9E8C85] truncate mt-0.5">
                {scene.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
