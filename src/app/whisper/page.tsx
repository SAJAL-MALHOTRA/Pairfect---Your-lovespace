"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ArrowLeft,
  Radio,
  Mic,
  ListMusic,
  Play,
  Pause,
  RotateCcw,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { RetroRadio } from "@/components/whisper/retro-radio";
import { WhisperRecorderModal } from "@/components/whisper/whisper-recorder-modal";
import { WhisperArchiveDrawer } from "@/components/whisper/whisper-archive-drawer";
import { WhisperNote, DEFAULT_FREQUENCY, PRESET_STATIONS, MOOD_TAG_LABELS } from "@/lib/whisper/types";
import { playRadioClick, playStaticNoise, playStationLockChime } from "@/lib/whisper/audio-fx";

const WAVEFORM_BARS = [32, 48, 70, 42, 65, 88, 62, 78, 48, 72, 94, 82, 58, 42, 72, 88, 98, 74, 52, 82, 64, 84, 62, 46, 68, 54, 38, 28];

function WhisperContent() {
  const { user, profile, pair, partner } = useAuth();

  const [frequency, setFrequency] = useState<number>(DEFAULT_FREQUENCY);
  const [whispers, setWhispers] = useState<WhisperNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHearted, setHasHearted] = useState(false);

  // Modals
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch whispers
  const fetchWhispers = useCallback(async () => {
    try {
      const pairId = pair?.id || "local-space";
      const res = await fetch(`/api/whisper?pairId=${pairId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWhispers(data);
          return;
        }
      }

      // Check localStorage for offline/demo notes
      const cached = localStorage.getItem("pairfect_whispers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWhispers(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }

      // Seed initial welcoming whisper note if empty
      const initialSeed: WhisperNote[] = [
        {
          id: "seed-welcome-whisper",
          pair_id: pairId,
          sender_id: partner?.id || "partner-demo",
          sender_name: partner?.display_name || "Your Partner",
          frequency: 91.7,
          title: "Welcome to our private frequency ♡",
          audio_url: "https://actions.google.com/sounds/v1/ambiences/humming_music_box.ogg",
          duration: 14,
          mood_tag: "romantic",
          listened_at: null,
          created_at: new Date().toISOString(),
        },
      ];
      setWhispers(initialSeed);
      localStorage.setItem("pairfect_whispers", JSON.stringify(initialSeed));
    } catch (err) {
      console.error("Fetch whispers error:", err);
    } finally {
      setLoading(false);
    }
  }, [pair?.id, partner?.id, partner?.display_name]);

  useEffect(() => {
    fetchWhispers();
  }, [fetchWhispers]);

  // Find whisper exactly matching or very close to current frequency
  const activeWhisper = useMemo(() => {
    return whispers.find((w) => Math.abs(w.frequency - frequency) < 0.05) || null;
  }, [whispers, frequency]);

  // Station info if tuned to a known preset
  const currentStation = useMemo(() => {
    return PRESET_STATIONS.find((s) => Math.abs(s.frequency - frequency) < 0.1) || null;
  }, [frequency]);

  // Handle tuning changes
  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(newFreq);
    // Pause existing audio when turning dial
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Sync Audio element when active whisper changes
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    if (activeWhisper && activeWhisper.audio_url) {
      audio.src = activeWhisper.audio_url;
      audio.load();
      setHasHearted(Boolean(activeWhisper.listened_at));
      playStationLockChime();

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || activeWhisper.duration || 0);
      };

      audio.onended = () => {
        setIsPlaying(false);
        // Mark listened
        handleMarkListened(activeWhisper.id);
      };
    } else {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    return () => {
      audio.pause();
    };
  }, [activeWhisper]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    playRadioClick();
    if (!audioRef.current || !activeWhisper) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Replay handler
  const handleReplay = () => {
    playRadioClick();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Mark listened
  const handleMarkListened = async (whisperId: string) => {
    setHasHearted(true);
    try {
      await fetch("/api/whisper", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: whisperId, listened: true }),
      });
      // update local
      setWhispers((prev) =>
        prev.map((w) => (w.id === whisperId ? { ...w, listened_at: new Date().toISOString() } : w))
      );
    } catch {
      // ignore
    }
  };

  // Delete whisper
  const handleDeleteWhisper = async (whisperId: string) => {
    playRadioClick();
    try {
      await fetch(`/api/whisper?id=${whisperId}`, { method: "DELETE" });
      setWhispers((prev) => {
        const next = prev.filter((w) => w.id !== whisperId);
        localStorage.setItem("pairfect_whispers", JSON.stringify(next));
        return next;
      });
    } catch {
      // ignore
    }
  };

  // Broadcast success
  const handleBroadcastSuccess = (newWhisper: WhisperNote) => {
    setWhispers((prev) => {
      const next = [newWhisper, ...prev];
      localStorage.setItem("pairfect_whispers", JSON.stringify(next));
      return next;
    });
    // Tune radio directly to the new broadcast frequency
    setFrequency(newWhisper.frequency);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-36 sm:pb-40 paper-grain">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-[var(--border)] px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#F5CAD6] hover:border-pink-300 text-[var(--text)] flex items-center justify-center shadow-xs transition-transform active:scale-95"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-pixel text-[11px] sm:text-xs tracking-wider bg-[var(--burgundy)] text-white px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg font-bold shadow-xs select-none">
              PAIRFECT
            </span>
            <h1 className="font-pixel text-sm sm:text-lg tracking-wider text-[var(--text)] uppercase">
              WHISPER RADIO
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playRadioClick();
                setIsArchiveOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50/50 text-xs font-semibold text-[var(--text)] shadow-xs border border-[#F5CAD6] transition-all active:scale-95 cursor-pointer"
            >
              <ListMusic className="w-3.5 h-3.5 text-[var(--burgundy)]" />
              <span>Audio Guide ({whispers.length})</span>
            </button>

            <button
              onClick={() => {
                playRadioClick();
                setIsRecorderOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Drop Whisper</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN STAGE: RETRO RADIO ATOP COZY DESK ─── */}
      <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-10 flex flex-col items-center">
        {/* Intro Subtitle */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-xs font-mono font-semibold text-[var(--burgundy)] mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>FM 87.6 - 98.1 PRIVATE BROADCAST</span>
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--text)]">
            Tune in to your loved one&apos;s voice
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] max-w-md mx-auto mt-1">
            Turn the rotary dial to scan the airwaves. When you lock into your partner&apos;s frequency, their voice comes alive.
          </p>
        </div>

        {/* ─── RETRO RADIO DEVICE ─── */}
        <div className="w-full flex justify-center py-2">
          <RetroRadio
            frequency={frequency}
            onFrequencyChange={handleFrequencyChange}
            activeWhisper={activeWhisper}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onOpenRecorder={() => setIsRecorderOpen(true)}
            onOpenArchive={() => setIsArchiveOpen(true)}
            whispers={whispers}
          />
        </div>

        {/* ─── ACTIVE FREQUENCY STATUS & AUDIO CONTROLS ─── */}
        {/* ─── ACTIVE FREQUENCY STATUS & AUDIO CONTROLS CAPSULE ─── */}
        <div className="w-full max-w-[560px] mt-6">
          {activeWhisper ? (
            <div className="p-5 sm:p-6 rounded-[32px] bg-white/95 backdrop-blur-xl border border-[#F5CAD6]/70 shadow-[0_16px_40px_rgba(232,82,125,0.1)] transition-all">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-[var(--burgundy)] text-white px-3 py-0.5 rounded-full shadow-xs">
                      {frequency.toFixed(1)} FM
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-[var(--burgundy)] border border-rose-200/80 flex items-center gap-1">
                      {MOOD_TAG_LABELS[activeWhisper.mood_tag]?.icon || "♡"} {MOOD_TAG_LABELS[activeWhisper.mood_tag]?.label || "Romantic Vibe"}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-xl text-[var(--text)] truncate tracking-tight">
                    {activeWhisper.title}
                  </h3>

                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-2">
                    <span>From <strong className="font-semibold text-[var(--text)]">{activeWhisper.sender_name}</strong></span>
                    <span>•</span>
                    <span>{new Date(activeWhisper.created_at).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Heard / Heart Reaction */}
                <button
                  onClick={() => handleMarkListened(activeWhisper.id)}
                  title="Listened with love"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer shadow-xs ${
                    hasHearted
                      ? "bg-rose-50 border-rose-300 text-rose-600 shadow-rose-100"
                      : "bg-white border-zinc-200 text-zinc-600 hover:text-rose-500 hover:border-rose-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <Heart className={`w-3.5 h-3.5 ${hasHearted ? "fill-current text-rose-500" : ""}`} />
                  <span>{hasHearted ? "Heard ♡" : "Send Love"}</span>
                </button>
              </div>

              {/* Dynamic 28-Bar Waveform Scrubber */}
              <div className="mt-5">
                <div
                  className="group relative flex items-center justify-between gap-1 sm:gap-1.5 h-14 px-3.5 py-2 rounded-2xl bg-rose-50/50 hover:bg-rose-50/80 border border-rose-100/80 transition-colors cursor-pointer select-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, clickX / rect.width));
                    const newTime = pct * (duration || 1);
                    setCurrentTime(newTime);
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                  }}
                  title="Click anywhere to seek"
                >
                  {WAVEFORM_BARS.map((heightPercent, barIdx) => {
                    const barProgress = (barIdx / (WAVEFORM_BARS.length - 1)) * 100;
                    const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;
                    const isPlayed = barProgress <= currentPct;

                    return (
                      <div
                        key={barIdx}
                        className="flex-1 flex items-center justify-center h-full"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[5px] rounded-full transition-all duration-150 ${
                            isPlayed
                              ? "bg-[var(--burgundy)] shadow-[0_0_8px_rgba(232,82,125,0.4)]"
                              : "bg-[#F5CAD6] group-hover:bg-[#EBB9C7]"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-soft)] mt-1.5 px-1 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Actions Bar */}
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--border)]/70">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SIGNAL LOCKED • 100%</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReplay}
                    className="w-9 h-9 rounded-full bg-white border border-[#F5CAD6] text-zinc-600 hover:text-[var(--text)] hover:bg-rose-50/50 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xs"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-rose-300/40 cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setIsRecorderOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-xs font-semibold text-[var(--burgundy)] transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[28px] bg-white/90 backdrop-blur-md border border-[#F5CAD6] text-center shadow-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-mono font-bold text-[var(--burgundy)] mb-2">
                <Radio className="w-3.5 h-3.5" />
                <span>{frequency.toFixed(1)} FM: {currentStation ? currentStation.name : "Open Airwave"}</span>
              </span>
              <p className="text-xs text-[var(--text-soft)] max-w-sm mx-auto mt-1 font-medium">
                Soft static hums on this frequency. Drop a private audio whisper here for your partner to find!
              </p>
              <button
                onClick={() => setIsRecorderOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Record on {frequency.toFixed(1)} FM</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS & DRAWERS ─── */}
      <WhisperRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        defaultFrequency={frequency}
        onBroadcastSuccess={handleBroadcastSuccess}
        pairId={pair?.id}
        senderName={profile?.display_name || "Partner"}
      />

      <WhisperArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        whispers={whispers}
        currentFrequency={frequency}
        onTuneToFrequency={handleFrequencyChange}
        onDeleteWhisper={handleDeleteWhisper}
        currentUserId={user?.id}
      />
    </div>
  );
}

export default function WhisperPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--burgundy)]" />
        </div>
      }
    >
      <WhisperContent />
    </Suspense>
  );
}
