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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-semibold text-[var(--text)] shadow-xs border border-[var(--border)] transition-all active:scale-95 cursor-pointer"
            >
              <ListMusic className="w-3.5 h-3.5 text-[var(--burgundy)]" />
              <span>Guide ({whispers.length})</span>
            </button>

            <button
              onClick={() => {
                playRadioClick();
                setIsRecorderOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
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
        <div className="w-full max-w-[540px] mt-6">
          {activeWhisper ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-[var(--border)] shadow-[0_12px_32px_rgba(232,82,125,0.08)]">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs bg-[#1C1F24] text-emerald-400 px-2 py-0.5 rounded-md">
                      {frequency.toFixed(1)} FM
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${MOOD_TAG_LABELS[activeWhisper.mood_tag]?.color || "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {MOOD_TAG_LABELS[activeWhisper.mood_tag]?.icon} {MOOD_TAG_LABELS[activeWhisper.mood_tag]?.label}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-[var(--text)] truncate">
                    {activeWhisper.title}
                  </h3>

                  <p className="text-xs text-[var(--text-soft)] mt-0.5">
                    From <span className="font-medium text-[var(--text)]">{activeWhisper.sender_name}</span> • {new Date(activeWhisper.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Heard / Heart Reaction */}
                <button
                  onClick={() => handleMarkListened(activeWhisper.id)}
                  title="Listened with love"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                    hasHearted
                      ? "bg-rose-50 border-rose-200 text-rose-600 shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-600 hover:text-rose-500"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${hasHearted ? "fill-current text-rose-500" : ""}`} />
                  <span>{hasHearted ? "Heard ♡" : "Send Love"}</span>
                </button>
              </div>

              {/* Scrubber Slider */}
              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[var(--burgundy)] focus:outline-none"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Actions Bar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]/60">
                <div className="text-[11px] font-mono text-[var(--text-soft)]">
                  SIGNAL LOCKED • 100%
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReplay}
                    className="p-2 text-zinc-500 hover:text-[var(--text)] transition-colors rounded-full hover:bg-rose-50 cursor-pointer"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    className="w-11 h-11 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setIsRecorderOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--burgundy)] hover:underline cursor-pointer"
                >
                  <span>Reply</span>
                  <Mic className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-3xl bg-white/80 border border-[var(--border)] text-center text-xs sm:text-sm text-[var(--text-soft)] shadow-xs">
              <p className="font-semibold text-[var(--text)]">
                {frequency.toFixed(1)} FM: {currentStation ? currentStation.name : "Open Airwave"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Soft static hums on this frequency. Drop a whisper here for your partner to find!
              </p>
              <button
                onClick={() => setIsRecorderOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
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
