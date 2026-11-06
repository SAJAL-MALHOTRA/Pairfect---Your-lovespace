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
import { decryptAudioBuffer, getPairKey } from "@/lib/crypto/e2ee";

const WAVEFORM_BARS = [32, 48, 70, 42, 65, 88, 62, 78, 48, 72, 94, 82, 58, 42, 72, 88, 98, 74, 52, 82, 64, 84, 62, 46, 68, 54, 38, 28];

function sanitizeWhisper(raw: any): WhisperNote {
  const freq = typeof raw?.frequency === "number" && !isNaN(raw.frequency)
    ? raw.frequency
    : parseFloat(String(raw?.frequency)) || 91.7;
  const dur = typeof raw?.duration === "number" && !isNaN(raw.duration)
    ? raw.duration
    : parseFloat(String(raw?.duration)) || 0;
  return {
    id: String(raw?.id || `whisper-${Date.now()}`),
    pair_id: String(raw?.pair_id || ""),
    sender_id: String(raw?.sender_id || ""),
    sender_name: String(raw?.sender_name || "Partner"),
    frequency: Math.round(freq * 10) / 10,
    title: String(raw?.title || "Sweet Whisper"),
    audio_url: String(raw?.audio_url || "/whisper-chime.wav"),
    duration: dur,
    mood_tag: (raw?.mood_tag && MOOD_TAG_LABELS[raw.mood_tag as keyof typeof MOOD_TAG_LABELS]) ? raw.mood_tag : "romantic",
    listened_at: raw?.listened_at || null,
    created_at: raw?.created_at || new Date().toISOString(),
  };
}

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
  const isFirstMountRef = useRef(true);

  // Fetch whispers
  const fetchWhispers = useCallback(async () => {
    try {
      const pairId = pair?.id || "local-space";
      const res = await fetch(`/api/whisper?pairId=${pairId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWhispers(data.map(sanitizeWhisper));
          return;
        }
      }

      // Check localStorage for offline/demo notes
      const cached = localStorage.getItem("pairfect_whispers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWhispers(parsed.map(sanitizeWhisper));
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
          audio_url: "/whisper-chime.wav",
          duration: 3,
          mood_tag: "romantic",
          listened_at: null,
          created_at: new Date().toISOString(),
        },
      ];
      setWhispers(initialSeed);
      try {
        localStorage.setItem("pairfect_whispers", JSON.stringify(initialSeed));
      } catch {}
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
    return (
      whispers.find((w) => {
        const noteFreq = typeof w.frequency === "number" && !isNaN(w.frequency) ? w.frequency : parseFloat(String(w.frequency)) || 91.7;
        return Math.abs(noteFreq - frequency) < 0.05;
      }) || null
    );
  }, [whispers, frequency]);

  // Station info if tuned to a known preset
  const currentStation = useMemo(() => {
    return PRESET_STATIONS.find((s) => Math.abs(s.frequency - frequency) < 0.1) || null;
  }, [frequency]);

  // Handle tuning changes
  const handleFrequencyChange = (newFreq: number) => {
    const safe = typeof newFreq === "number" && !isNaN(newFreq) ? newFreq : parseFloat(String(newFreq)) || 91.7;
    setFrequency(safe);
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
    let objectUrl: string | null = null;
    let cancelled = false;

    if (activeWhisper && activeWhisper.audio_url) {
      const audioUrl = activeWhisper.audio_url;
      const isEncrypted = audioUrl.startsWith("enc:v1:") || audioUrl.includes(".enc");
      const loadSource = async () => {
        try {
          if (isEncrypted) {
            if (!pair?.id) throw new Error("This encrypted whisper needs its paired vault key.");
            const key = await getPairKey(pair.id);
            if (!key) throw new Error("Your private key is unavailable on this device.");
            let encryptedBuffer: ArrayBuffer;
            if (audioUrl.startsWith("enc:v1:")) {
              const binary = atob(audioUrl.slice("enc:v1:".length));
              const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
              encryptedBuffer = bytes.buffer;
            } else {
              const response = await fetch(audioUrl);
              if (!response.ok) throw new Error("Could not download the encrypted whisper.");
              encryptedBuffer = await response.arrayBuffer();
            }
            const decryptedBlob = await decryptAudioBuffer(encryptedBuffer, key);
            if (cancelled) return;
            const mimeType = audioUrl.includes(".mp4.enc")
              ? "audio/mp4"
              : audioUrl.includes(".ogg.enc")
                ? "audio/ogg"
                : "audio/webm";
            objectUrl = URL.createObjectURL(new Blob([decryptedBlob], { type: mimeType }));
            audio.src = objectUrl;
          } else {
            audio.src = audioUrl;
          }
          audio.load();
        } catch (error) {
          console.error("Whisper decryption error:", error);
          setIsPlaying(false);
        }
      };
      void loadSource();
      setHasHearted(Boolean(activeWhisper.listened_at));

      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
      } else {
        playStationLockChime();
      }

      // Immediately initialize duration from activeWhisper metadata
      setCurrentTime(0);
      setDuration(activeWhisper.duration || 0);

      audio.onloadedmetadata = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        } else if (activeWhisper.duration) {
          setDuration(activeWhisper.duration);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // Mark listened
        handleMarkListened(activeWhisper.id);
      };

      audio.onerror = (e) => {
        console.error("Audio element error on frequency:", frequency, e, audio.error);
        setIsPlaying(false);
      };
    } else {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    return () => {
      cancelled = true;
      audio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeWhisper, pair?.id]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    playRadioClick();
    if (!audioRef.current || !activeWhisper) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Audio playback error:", err);
            setIsPlaying(false);
          });
      }
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
      setCurrentTime(0);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Audio replay error:", err);
            setIsPlaying(false);
          });
      }
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
        try {
          localStorage.setItem("pairfect_whispers", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch {
      // ignore
    }
  };

  // Broadcast success
  const handleBroadcastSuccess = (newWhisper: WhisperNote) => {
    const safe = sanitizeWhisper(newWhisper);
    setWhispers((prev) => {
      const next = [safe, ...prev];
      try {
        localStorage.setItem("pairfect_whispers", JSON.stringify(next));
      } catch {}
      return next;
    });
    // Tune radio directly to the new broadcast frequency
    setFrequency(safe.frequency);
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
                      {(Number(frequency) || 91.7).toFixed(1)} FM
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-[var(--burgundy)] border border-rose-200/80 flex items-center gap-1">
                      {(activeWhisper.mood_tag && MOOD_TAG_LABELS[activeWhisper.mood_tag]?.icon) || "♡"} {(activeWhisper.mood_tag && MOOD_TAG_LABELS[activeWhisper.mood_tag]?.label) || "Romantic Vibe"}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-xl text-[var(--text)] truncate tracking-tight">
                    {activeWhisper.title}
                  </h3>

                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-2">
                    <span>From <strong className="font-semibold text-[var(--text)]">{activeWhisper.sender_name || "Partner"}</strong></span>
                    <span>•</span>
                    <span>{activeWhisper.created_at ? new Date(activeWhisper.created_at).toLocaleDateString() : "Recent"}</span>
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
                <span>{(Number(frequency) || 91.7).toFixed(1)} FM: {currentStation ? currentStation.name : "Open Airwave"}</span>
              </span>
              <p className="text-xs text-[var(--text-soft)] max-w-sm mx-auto mt-1 font-medium">
                Soft static hums on this frequency. Drop a private audio whisper here for your partner to find!
              </p>
              <button
                onClick={() => setIsRecorderOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Record on {(Number(frequency) || 91.7).toFixed(1)} FM</span>
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

class WhisperErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Whisper error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem("pairfect_whispers");
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-[#F5CAD6] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[var(--burgundy)] mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[var(--text)]">
              Radio Tuner Recalibrating
            </h2>
            <p className="text-xs text-[var(--text-soft)] leading-relaxed">
              We encountered a minor static blip while scanning the airwaves. Click below to recalibrate and reset your radio frequency.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="btn-journal py-2.5 px-6 text-xs font-mono font-bold cursor-pointer"
              >
                Reset & Tune In
              </button>
              <Link
                href="/dashboard"
                className="btn-journal-ghost py-2.5 px-5 text-xs font-mono font-bold"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WhisperPage() {
  return (
    <WhisperErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--burgundy)]" />
          </div>
        }
      >
        <WhisperContent />
      </Suspense>
    </WhisperErrorBoundary>
  );
}
