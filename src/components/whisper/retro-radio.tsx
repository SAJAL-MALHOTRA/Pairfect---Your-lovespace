"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Mic, Radio, Volume2, VolumeX, ListMusic, Sparkles } from "lucide-react";
import { MIN_FREQUENCY, MAX_FREQUENCY, PRESET_STATIONS, RadioStation, WhisperNote } from "@/lib/whisper/types";
import { playStaticNoise, playRadioClick, playStationLockChime } from "@/lib/whisper/audio-fx";

interface RetroRadioProps {
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  activeWhisper?: WhisperNote | null;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onOpenRecorder: () => void;
  onOpenArchive: () => void;
  whispers?: WhisperNote[];
  className?: string;
}

export function RetroRadio({
  frequency,
  onFrequencyChange,
  activeWhisper,
  isPlaying = false,
  onTogglePlay,
  onOpenRecorder,
  onOpenArchive,
  whispers = [],
  className = "",
}: RetroRadioProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startFreq: number }>({ startX: 0, startFreq: frequency });

  // Map frequency to rotary knob rotation angle (-120deg to +120deg)
  const knobAngle = useMemo(() => {
    const range = MAX_FREQUENCY - MIN_FREQUENCY;
    const ratio = Math.max(0, Math.min(1, (frequency - MIN_FREQUENCY) / range));
    return ratio * 240 - 120;
  }, [frequency]);

  // Map frequency to needle position percentage (0% to 100%)
  const needlePercent = useMemo(() => {
    const range = MAX_FREQUENCY - MIN_FREQUENCY;
    const ratio = Math.max(0, Math.min(1, (frequency - MIN_FREQUENCY) / range));
    return ratio * 100;
  }, [frequency]);

  // Signal strength calculation (0 to 4 bars)
  const signalStrength = useMemo(() => {
    if (activeWhisper) return 4;
    // Check if close to any whisper frequency
    const closestWhisper = whispers.find((w) => Math.abs(w.frequency - frequency) < 0.25);
    if (closestWhisper) return 3;
    // Check if close to a preset station
    const isCloseToPreset = PRESET_STATIONS.some((st) => Math.abs(st.frequency - frequency) < 0.2);
    if (isCloseToPreset) return 2;
    return 1;
  }, [activeWhisper, whispers, frequency]);

  // Stepper handlers
  const handleStepDown = () => {
    playRadioClick();
    playStaticNoise(0.18, 0.1);
    const nextFreq = Math.round((Math.max(MIN_FREQUENCY, frequency - 0.5)) * 10) / 10;
    onFrequencyChange(nextFreq);
  };

  const handleStepUp = () => {
    playRadioClick();
    playStaticNoise(0.18, 0.1);
    const nextFreq = Math.round((Math.min(MAX_FREQUENCY, frequency + 0.5)) * 10) / 10;
    onFrequencyChange(nextFreq);
  };

  // Auto-scan to next frequency with a whisper
  const handleScan = () => {
    playRadioClick();
    playStaticNoise(0.3, 0.14);
    if (whispers.length === 0) {
      // cycle preset stations
      const currentIndex = PRESET_STATIONS.findIndex((s) => Math.abs(s.frequency - frequency) < 0.1);
      const nextIndex = (currentIndex + 1) % PRESET_STATIONS.length;
      onFrequencyChange(PRESET_STATIONS[nextIndex].frequency);
      return;
    }

    // find next whisper with frequency higher than current, or loop
    const sorted = [...whispers].sort((a, b) => a.frequency - b.frequency);
    const higher = sorted.find((w) => w.frequency > frequency + 0.05);
    if (higher) {
      onFrequencyChange(higher.frequency);
      playStationLockChime();
    } else {
      onFrequencyChange(sorted[0].frequency);
      playStationLockChime();
    }
  };

  // Knob drag interactions
  const handleKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingKnob(true);
    dragStartRef.current = { startX: e.clientX, startFreq: frequency };
    playRadioClick();
  };

  const handleKnobTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDraggingKnob(true);
      dragStartRef.current = { startX: e.touches[0].clientX, startFreq: frequency };
      playRadioClick();
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDraggingKnob) return;
      const deltaX = clientX - dragStartRef.current.startX;
      // Sensitivity: 15px drag = 0.1 MHz
      const freqDelta = (deltaX / 150) * (MAX_FREQUENCY - MIN_FREQUENCY);
      const raw = dragStartRef.current.startFreq + freqDelta;
      const clamped = Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, raw));
      const rounded = Math.round(clamped * 10) / 10;
      if (rounded !== frequency) {
        onFrequencyChange(rounded);
        playStaticNoise(0.08, 0.06);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const onEnd = () => {
      if (isDraggingKnob) {
        setIsDraggingKnob(false);
      }
    };

    if (isDraggingKnob) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDraggingKnob, frequency, onFrequencyChange]);

  // Wheel to tune
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.1 : -0.1;
    const nextFreq = Math.round((Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, frequency + step))) * 10) / 10;
    if (nextFreq !== frequency) {
      onFrequencyChange(nextFreq);
      playStaticNoise(0.08, 0.06);
    }
  };

  return (
    <div className={`relative select-none ${className}`} style={{ maxWidth: 580, width: "100%" }}>
      {/* ─── PHYSICAL RETRO RADIO ENCLOSURE ─── */}
      <div className="relative pt-6">
        {/* ─── TOP TACTILE PUSH BUTTONS ─── */}
        <div className="absolute top-0 left-16 sm:left-24 flex items-end gap-2.5 sm:gap-3.5 z-10">
          {/* Button 1: Library / Stations */}
          <button
            onClick={() => {
              playRadioClick();
              onOpenArchive();
            }}
            title="Whisper Library & Guide"
            className="w-10 sm:w-12 h-6 sm:h-7 rounded-t-md bg-gradient-to-b from-[#4A4753] to-[#2B2931] border-t border-l border-r border-[#696577] shadow-[0_-2px_4px_rgba(0,0,0,0.3)] transition-all active:translate-y-1 hover:brightness-110 flex items-center justify-center cursor-pointer group"
          >
            <ListMusic className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white" />
          </button>

          {/* Button 2: Scan / Auto-Tune */}
          <button
            onClick={handleScan}
            title="Scan to Next Voice Note"
            className="w-10 sm:w-12 h-6 sm:h-7 rounded-t-md bg-gradient-to-b from-[#4A4753] to-[#2B2931] border-t border-l border-r border-[#696577] shadow-[0_-2px_4px_rgba(0,0,0,0.3)] transition-all active:translate-y-1 hover:brightness-110 flex items-center justify-center cursor-pointer group"
          >
            <Radio className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white" />
          </button>

          {/* Button 3: Prominent RED RECORD BUTTON */}
          <button
            onClick={() => {
              playRadioClick();
              onOpenRecorder();
            }}
            title="Drop a Whisper (Record Voice Note)"
            className="relative w-12 sm:w-14 h-7 sm:h-8 rounded-t-md bg-gradient-to-b from-[#FF5B45] via-[#E83C25] to-[#B81F0C] border-t-2 border-l border-r border-[#FFA192] shadow-[0_-3px_8px_rgba(232,60,37,0.4)] transition-all active:translate-y-1 hover:brightness-110 flex items-center justify-center cursor-pointer group"
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
          </button>

          {/* Button 4: Power / Mute */}
          <button
            onClick={() => {
              playRadioClick();
              setIsMuted(!isMuted);
            }}
            title={isMuted ? "Unmute Radio" : "Mute Radio"}
            className="w-10 sm:w-12 h-6 sm:h-7 rounded-t-md bg-gradient-to-b from-[#4A4753] to-[#2B2931] border-t border-l border-r border-[#696577] shadow-[0_-2px_4px_rgba(0,0,0,0.3)] transition-all active:translate-y-1 hover:brightness-110 flex items-center justify-center cursor-pointer group"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </button>
        </div>

        {/* Ambient Warm Vacuum Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-300/20 via-rose-300/25 to-amber-200/20 rounded-[40px] blur-xl pointer-events-none" />

        {/* ─── MAIN RADIO BODY CHASSIS ─── */}
        <div className="relative rounded-[30px] sm:rounded-[38px] bg-gradient-to-b from-[#609E8F] via-[#468677] to-[#2E6B5D] border-[3px] border-[#7FBDAE] shadow-[0_24px_50px_rgba(30,70,60,0.25),inset_0_3px_6px_rgba(255,255,255,0.45),inset_0_-4px_10px_rgba(0,0,0,0.3)] p-4 sm:p-6 overflow-hidden">
          {/* Subtle Vintage Radiance Texture */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none" />

          {/* Grid Layout: Left Speaker Grille + Right Tuning Console */}
          <div className="relative grid grid-cols-12 gap-3 sm:gap-5 items-center">
            {/* ─── LEFT: SPEAKER GRILLE & BRANDING (5 Cols) ─── */}
            <div className="col-span-5 flex flex-col justify-between h-full min-h-[170px] sm:min-h-[200px]">
              {/* Slotted Speaker Louvers with Acoustic Glow Behind */}
              <div className="relative py-2 flex flex-col justify-center gap-1.5 sm:gap-2 flex-1">
                {/* Acoustic Diaphragm Ambient Glow */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-300/30 via-emerald-100/40 to-transparent blur-md pointer-events-none transition-opacity duration-300 ${
                    isPlaying ? "opacity-100 scale-105" : "opacity-30"
                  }`}
                />

                {/* 9 Horizontal Grille Louver Slots */}
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="relative h-2 sm:h-2.5 rounded-full bg-[#184239] shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden"
                  >
                    {/* Glowing audio wave ripple behind slat when playing */}
                    {isPlaying && (
                      <div
                        className="h-full bg-gradient-to-r from-emerald-200/50 to-emerald-400/20 rounded-full animate-pulse"
                        style={{
                          width: `${50 + (idx % 4) * 15}%`,
                          animationDelay: `${idx * 0.08}s`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Radio Brand Typography */}
              <div className="pt-2">
                <span className="font-heading font-extrabold text-sm sm:text-base text-white tracking-wide drop-shadow-sm flex items-center gap-1.5">
                  <span>Pairfect</span>
                  <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[#BDE7DC] uppercase font-bold">
                    RADIO
                  </span>
                </span>
              </div>
            </div>

            {/* ─── RIGHT: RECESS TUNING PANEL (7 Cols) ─── */}
            <div className="col-span-7">
              <div className="rounded-2xl sm:rounded-[24px] bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E6] to-[#F1E6D0] border-2 border-[#D4AF37]/50 shadow-[inset_0_2px_8px_rgba(180,140,50,0.15),0_6px_16px_rgba(0,0,0,0.1)] p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
                {/* ─── TOP LCD FREQUENCY SCREEN ─── */}
                <div className="rounded-xl bg-[#13171B] border border-black/40 shadow-inner px-3 py-2 flex items-center justify-between text-white">
                  <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
                    FM
                  </div>

                  <div className="flex items-center gap-1.5 font-mono font-bold text-base sm:text-xl tracking-wider text-white">
                    <span>{frequency.toFixed(1)}</span>
                    <span className="text-[11px] sm:text-xs text-zinc-400">FM</span>
                  </div>

                  {/* 4 Green LED Signal Strength Bars */}
                  <div className="flex items-end gap-1 h-3.5 sm:h-4">
                    {[1, 2, 3, 4].map((bar) => {
                      const active = bar <= signalStrength;
                      return (
                        <span
                          key={bar}
                          className={`w-1 rounded-xs transition-colors duration-200 ${
                            active
                              ? "bg-[#2DF312] shadow-[0_0_6px_rgba(45,243,18,0.7)]"
                              : "bg-zinc-800"
                          }`}
                          style={{ height: `${bar * 25}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* ─── ROTARY BRASS TUNING KNOB WITH GOLDEN DIAL TICKS ─── */}
                <div
                  ref={knobRef}
                  onMouseDown={handleKnobMouseDown}
                  onTouchStart={handleKnobTouchStart}
                  onWheel={handleWheel}
                  title="Turn or drag to tune radio frequency"
                  className="relative flex items-center justify-center py-1 sm:py-2 cursor-grab active:cursor-grabbing"
                >
                  {/* Circular Tick Marks Ring */}
                  <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#BFA054] via-[#F5E6C4] to-[#9E7A32] p-1 shadow-[0_6px_16px_rgba(0,0,0,0.18),inset_0_2px_4px_rgba(255,255,255,0.8)] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#FFFDF9] via-[#FAF4E8] to-[#EFE2C6] border border-[#C5A059]/40 relative flex items-center justify-center shadow-inner">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const rot = (i / 24) * 360;
                        return (
                          <div
                            key={i}
                            className={`absolute w-0.5 rounded-full origin-bottom ${
                              i % 4 === 0 ? "h-3 bg-[#8C6D2B]" : "h-1.5 bg-[#8C6D2B]/50"
                            }`}
                            style={{
                              transform: `rotate(${rot}deg) translateY(-40px)`,
                            }}
                          />
                        );
                      })}

                      {/* Rotary Brass Knob Face */}
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#9E7833] via-[#E5C77A] to-[#8C6524] border-2 border-[#6D4E1B] shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center transition-transform duration-75"
                        style={{
                          transform: `rotate(${knobAngle}deg)`,
                        }}
                      >
                        {/* Red Indicator Pointer Notch */}
                        <div className="absolute -top-3 w-1.5 h-6 rounded-full bg-[#E51E2B] shadow-[0_0_6px_rgba(229,30,43,0.7)]" />

                        {/* Brushed Center Cap */}
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#FAF0D7] via-[#D8BA75] to-[#8C6524] border border-[#7A561E] shadow-inner" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── ANALOG TUNER SCALE SLIDER (With Red Needle) ─── */}
                <div className="rounded-xl bg-[#141618] border border-black/50 p-2 text-white shadow-inner flex flex-col justify-between">
                  {/* Calibrated Ticks */}
                  <div className="relative h-6 flex items-center overflow-hidden">
                    {/* Tick Lines */}
                    <div className="absolute inset-0 flex justify-between px-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-px ${
                            i % 6 === 0 ? "h-4 bg-zinc-300" : "h-2 bg-zinc-600"
                          } self-start`}
                        />
                      ))}
                    </div>

                    {/* Sliding Fluorescent Red Needle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#D70D08] shadow-[0_0_6px_rgba(215,13,8,0.9)] transition-[left] duration-150 rounded-full"
                      style={{
                        left: `${needlePercent}%`,
                        transform: "translateX(-50%)",
                      }}
                    />
                  </div>

                  {/* Frequency Labels */}
                  <div className="flex justify-between px-0.5 pt-1 text-[9px] sm:text-[10px] font-mono text-zinc-400">
                    <span>87.6</span>
                    <span>89.2</span>
                    <span>91.2</span>
                    <span>94.3</span>
                    <span>98.1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CHASSIS BOTTOM FEET ─── */}
          <div className="absolute bottom-0 left-8 w-12 h-2.5 rounded-t-md bg-[#1C1B1E] border-t border-black/40" />
          <div className="absolute bottom-0 right-8 w-12 h-2.5 rounded-t-md bg-[#1C1B1E] border-t border-black/40" />
        </div>
      </div>

      {/* ─── WOODEN DESK SURFACE & QUICK STEP CONTROLS ─── */}
      <div className="mt-3 flex items-center justify-center gap-3">
        {/* Step Down Button */}
        <button
          onClick={handleStepDown}
          disabled={frequency <= MIN_FREQUENCY}
          title="Tune Down"
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white disabled:opacity-40 text-zinc-700 shadow-sm border border-[var(--border)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Current Frequency Display Pill */}
        <div
          onClick={onOpenArchive}
          title="Click to view stations"
          className="px-4 py-1.5 rounded-full bg-[#181C20] border border-black/60 shadow-md text-white font-mono font-bold text-xs sm:text-sm tracking-wider flex items-center gap-2 cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{frequency.toFixed(1)} FM</span>
          {activeWhisper && (
            <span className="text-[10px] text-rose-300 font-sans font-semibold truncate max-w-[120px]">
              • {activeWhisper.title}
            </span>
          )}
        </div>

        {/* Step Up Button */}
        <button
          onClick={handleStepUp}
          disabled={frequency >= MAX_FREQUENCY}
          title="Tune Up"
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white disabled:opacity-40 text-zinc-700 shadow-sm border border-[var(--border)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
