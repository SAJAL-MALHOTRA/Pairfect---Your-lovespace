"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Heart, RotateCcw, Download } from "lucide-react";

interface StripFrame {
  id: number;
  label: string;
  emoji: string;
  gradient: string;
}

const STRIP_FRAMES: StripFrame[] = [
  { id: 1, label: "Look here!", emoji: "✌️", gradient: "from-[#8E2B45] to-[#C97A8E]" },
  { id: 2, label: "Silly faces", emoji: "🤪", gradient: "from-[#6E4253] to-[#A06173]" },
  { id: 3, label: "Warm hugs", emoji: "🫂", gradient: "from-[#4A2D39] to-[#7D495B]" },
  { id: 4, label: "Forever us", emoji: "🥰", gradient: "from-[#8E2B45] to-[#D38CA2]" },
];

export default function InteractivePhotoboothDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [capturedCount, setCapturedCount] = useState<number>(4); // default full view
  const [flash, setFlash] = useState(false);

  const startBoothSession = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCapturedCount(0);

    let currentFrame = 1;

    const runFrame = () => {
      // 3
      setCountdown(3);
      setTimeout(() => {
        // 2
        setCountdown(2);
        setTimeout(() => {
          // 1
          setCountdown(1);
          setTimeout(() => {
            // ♡
            setCountdown("♡");
            setTimeout(() => {
              // Flash
              setCountdown(null);
              setFlash(true);
              setTimeout(() => setFlash(false), 300);

              setCapturedCount(currentFrame);

              if (currentFrame < 4) {
                currentFrame++;
                setTimeout(runFrame, 700);
              } else {
                setIsPlaying(false);
              }
            }, 400);
          }, 600);
        }, 600);
      }, 600);
    };

    runFrame();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Photobooth Housing */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-10 shadow-xl overflow-hidden select-none min-h-[520px] flex flex-col items-center justify-between"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        {/* Flash screen overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white z-50 animate-camera-flash pointer-events-none" />
        )}

        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-[#E8DFD5] pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FAF5EC] text-[#8E2B45]">
              <Camera className="w-4 h-4" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#8E2B45] font-bold">
              Pairfect Synchronous Photobooth
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#9E8C85]">Classic 4-Cut Strip</span>
        </div>

        {/* Viewfinder and Film Strip Container */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-4 items-center">
          {/* LEFT: Viewfinder Camera screen */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-3xl bg-[#2C1E1A] border-4 border-[#3D2924] shadow-2xl flex flex-col items-center justify-center overflow-hidden p-4">
              {/* Corner crosshairs */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/40" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/40" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/40" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/40" />

              {/* Viewfinder Content */}
              {countdown !== null ? (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="text-6xl font-display italic font-black text-white drop-shadow-md"
                >
                  {countdown}
                </motion.span>
              ) : (
                <div className="text-center space-y-2 text-white/80">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/20">
                    <Heart className="w-8 h-8 text-[#D38CA2] fill-current animate-pulse" />
                  </div>
                  <p className="text-xs font-mono tracking-wider uppercase text-white/70">
                    {isPlaying ? "Ready for flash..." : "Both Cameras Synced"}
                  </p>
                </div>
              )}

              {/* Film Grain Texture */}
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />

              {/* Live Status indicator */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-white/60">
                <span>REC ● 4K 24FPS</span>
                <span>FRAME {Math.min(4, capturedCount + 1)}/4</span>
              </div>
            </div>

            {/* Shutter Button */}
            <button
              onClick={startBoothSession}
              disabled={isPlaying}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#8E2B45] to-[#A83250] hover:from-[#752238] hover:to-[#8E2B45] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>{isPlaying ? "Capturing 4-Cut Strip..." : "Test Photobooth Shutter"}</span>
            </button>
          </div>

          {/* RIGHT: Classic 4-Cut Film Strip Result */}
          <div className="flex flex-col items-center">
            <div
              className="w-44 p-2.5 pb-4 bg-white rounded-xl shadow-2xl border border-[#E8DFD5] space-y-2 transition-transform hover:scale-102"
              style={{
                boxShadow: "0 18px 40px -10px rgba(44, 30, 26, 0.2)",
              }}
            >
              {/* Top Film Strip Brand Stamp */}
              <div className="text-center border-b border-[#F0EAE1] pb-1">
                <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-[#8E2B45]">
                  PAIRFECT · SANCTUARY STRIP
                </span>
              </div>

              {/* 4 Photo Frames */}
              <div className="space-y-1.5">
                {STRIP_FRAMES.map((f, idx) => {
                  const isCaptured = idx < capturedCount;
                  return (
                    <div
                      key={f.id}
                      className={`w-full aspect-[4/3] rounded-sm overflow-hidden flex items-center justify-center text-white relative transition-all duration-300 ${
                        isCaptured
                          ? `bg-gradient-to-tr ${f.gradient} shadow-2xs`
                          : "bg-[#F5EFE6] text-[#9E8C85]"
                      }`}
                    >
                      {isCaptured ? (
                        <div className="text-center">
                          <span className="text-xl block">{f.emoji}</span>
                          <span className="text-[8px] font-mono opacity-80">{f.label}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono opacity-40">Frame {f.id}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Film Strip Details */}
              <div className="pt-1 text-center space-y-0.5 border-t border-[#F0EAE1]">
                <p className="font-handwriting text-xs text-[#2C1E1A] font-bold">
                  Mia & Alex · Sep 2026
                </p>
                <p className="text-[7px] font-mono uppercase tracking-widest text-[#9E8C85]">
                  Lossless Cloud Keepsake
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="w-full text-center text-[11px] text-[#6E5D57] font-mono border-t border-[#E8DFD5] pt-2">
          Pay for one pass, unlocks unmetered photobooth strips for both of you.
        </div>
      </div>
    </div>
  );
}
