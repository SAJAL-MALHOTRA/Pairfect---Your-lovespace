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
import { playRadioClick, playStaticNoise, playStationLockChime, playSynthesizedWhisper, getAudioContext } from "@/lib/whisper/audio-fx";
import { decryptAudioBuffer, getPairKey } from "@/lib/crypto/e2ee";
import { CoupleBeansMascot } from "@/components/couple-mascot";

const WAVEFORM_BARS = [32, 48, 70, 42, 65, 88, 62, 78, 48, 72, 94, 82, 58, 42, 72, 88, 98, 74, 52, 82, 64, 84, 62, 46, 68, 54, 38, 28];

function sanitizeWhisper(raw: any): WhisperNote {
  const freq = typeof raw?.frequency === "number" && !isNaN(raw.frequency)
    ? raw.frequency
    : parseFloat(String(raw?.frequency)) || 91.7;
  const dur = typeof raw?.duration === "number" && !isNaN(raw.duration)
    ? raw.duration
    : parseFloat(String(raw?.duration)) || 0;

  let audioUrl = String(raw?.audio_url || "/whisper-chime.wav");
  // If stored audio_url is a revoked blob URL from a previous session, recover with standard chime
  if (audioUrl.startsWith("blob:")) {
    audioUrl = "/whisper-chime.wav";
  }

  return {
    id: String(raw?.id || `whisper-${Date.now()}`),
    pair_id: String(raw?.pair_id || ""),
    sender_id: String(raw?.sender_id || ""),
    sender_name: String(raw?.sender_name || "Partner"),
    frequency: Math.round(freq * 10) / 10,
    title: String(raw?.title || "Sweet Whisper"),
    audio_url: audioUrl,
    duration: dur || 2.5,
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
  const synthStopRef = useRef<(() => void) | null>(null);
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
    if (synthStopRef.current) {
      synthStopRef.current();
      synthStopRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Sync Audio element when active whisper changes
  useEffect(() => {
    if (synthStopRef.current) {
      synthStopRef.current();
      synthStopRef.current = null;
    }

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
            let encryptedBuffer;
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
            const candidateUrl = audioUrl.startsWith("blob:")
              ? "/whisper-chime.wav"
              : audioUrl;
            audio.src = candidateUrl;
          }
          audio.load();
        } catch (error) {
          console.error("Whisper decryption error, falling back to /whisper-chime.wav:", error);
          if (!cancelled) {
            audio.src = "/whisper-chime.wav";
            audio.load();
          }
        }
      };
      void loadSource();
      setHasHearted(Boolean(activeWhisper.listened_at));

      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
      } else {
        playStationLockChime();
      }

      setCurrentTime(0);
      setDuration(activeWhisper.duration || 2.5);

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
        handleMarkListened(activeWhisper.id);
      };

      audio.onerror = () => {
        if (audio.src && !audio.src.endsWith("/whisper-chime.wav")) {
          console.warn("Audio element error on URL, loading fallback /whisper-chime.wav");
          audio.src = "/whisper-chime.wav";
          audio.load();
        } else {
          setIsPlaying(false);
        }
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
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }
      audio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeWhisper, pair?.id]);

  // Play / Pause toggle with three-tier fallback
  const handleTogglePlay = async () => {
    playRadioClick();
    if (!activeWhisper) return;

    if (isPlaying) {
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const audio = audioRef.current;
    let playedSuccessfully = false;

    if (audio) {
      try {
        const candidateUrl = (activeWhisper.audio_url && !activeWhisper.audio_url.startsWith("blob:"))
          ? activeWhisper.audio_url
          : "/whisper-chime.wav";

        if (!audio.src || !audio.src.includes(candidateUrl) || audio.error) {
          audio.src = candidateUrl;
          audio.load();
        }

        await audio.play();
        setIsPlaying(true);
        playedSuccessfully = true;
      } catch (audioErr) {
        console.warn("Primary audio element playback rejected, attempting /whisper-chime.wav:", audioErr);
        try {
          audio.src = "/whisper-chime.wav";
          audio.load();
          await audio.play();
          setIsPlaying(true);
          playedSuccessfully = true;
        } catch (chimeErr) {
          console.warn("Audio file playback blocked or format unsupported, engaging synthesized acoustic radio stream:", chimeErr);
        }
      }
    }

    // Web Audio Synthesizer Fallback
    if (!playedSuccessfully) {
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }

      const totalDur = activeWhisper.duration || 2.5;
      setDuration(totalDur);
      setCurrentTime(0);
      setIsPlaying(true);

      synthStopRef.current = playSynthesizedWhisper(
        totalDur,
        (progressSec) => {
          setCurrentTime(progressSec);
        },
        () => {
          setIsPlaying(false);
          setCurrentTime(0);
          handleMarkListened(activeWhisper.id);
          synthStopRef.current = null;
        }
      );
    }
  };

  // Replay handler
  const handleReplay = async () => {
    playRadioClick();
    if (synthStopRef.current) {
      synthStopRef.current();
      synthStopRef.current = null;
    }
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setTimeout(() => {
      handleTogglePlay();
    }, 40);
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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-28 sm:pb-36">
      {/* Hidden DOM Audio Element for Solid Browser Media Pipeline */}
      <audio ref={audioRef} className="hidden" preload="auto" playsInline />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF9F6]/90 border-b-2 border-stone-800 px-3 py-2.5 sm:px-8 sm:py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-stone-800 text-stone-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hover:bg-stone-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg sm:text-xl text-stone-900 tracking-tight">
                pairfect
              </span>
              <span className="bg-rose-500 text-white font-mono text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hidden sm:inline-block">
                WHISPER FM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                playRadioClick();
                setIsArchiveOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-stone-50 text-xs font-bold text-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <ListMusic className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Audio Guide</span>
              <span className="bg-stone-100 border border-stone-800 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                {whispers.length}
              </span>
            </button>

            <button
              onClick={() => {
                playRadioClick();
                setIsRecorderOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Drop Whisper</span>
              <span className="sm:hidden">Drop</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 flex flex-col items-center">
        {/* Sanctuary Hero Banner */}
        <div className="w-full bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative mb-6">
          {/* Coral Washi Tape */}
          <div className="absolute -top-3.5 left-6 sm:left-8 -rotate-1 shadow-xs">
            <span className="bg-rose-500 text-white font-mono uppercase text-[10px] sm:text-[11px] font-black tracking-wider px-3 sm:px-3.5 py-1 rounded-sm border border-stone-800">
              PRIVATE AIRWAVES · FM 87.6 - 98.1
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-2">
            <div className="space-y-2 text-center md:text-left max-w-lg">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono font-bold text-stone-500 uppercase tracking-wider flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500" />
                  <span>E2EE Broadcast</span>
                </span>
                <span>·</span>
                <span className="text-emerald-700 font-bold">Signal Ready</span>
              </div>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
                Tune in to your loved one&apos;s voice
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                Turn the vintage rotary dial or tap preset stations below. When you tune into your partner&apos;s frequency, their voice resonates through your private sanctuary.
              </p>
            </div>

            {/* Signature Couple Mascot */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <CoupleBeansMascot className="w-24 h-16 sm:w-28 sm:h-20" />
            </div>
          </div>
        </div>

        {/* Preset Stations Quick Jump Pills */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              PRESET STATIONS ({PRESET_STATIONS.length})
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              Current: {(Number(frequency) || 91.7).toFixed(1)} FM
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PRESET_STATIONS.map((st) => {
              const isSelected = Math.abs(st.frequency - frequency) < 0.1;
              const countForStation = whispers.filter(
                (w) => Math.abs((Number(w.frequency) || 91.7) - st.frequency) < 0.1
              ).length;

              return (
                <button
                  key={st.frequency}
                  onClick={() => {
                    playRadioClick();
                    handleFrequencyChange(st.frequency);
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold border-2 border-stone-800 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] -translate-y-0.5"
                      : "bg-white text-stone-800 hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? "bg-black/20" : "bg-stone-100 border border-stone-300"}`}>
                    {st.frequency.toFixed(1)}
                  </span>
                  <span className="font-sans font-semibold truncate max-w-[120px] sm:max-w-none">
                    {st.name}
                  </span>
                  {countForStation > 0 && (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isSelected ? "bg-white text-rose-600 font-black" : "bg-rose-100 text-rose-700 font-bold"
                      }`}
                    >
                      {countForStation}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Retro Radio Device */}
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

        {/* Active Frequency Status & Audio Controls Capsule */}
        <div className="w-full max-w-[580px] mt-6">
          {activeWhisper ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-stone-800 shadow-[5px_5px_0px_0px_rgba(28,25,23,0.9)] transition-all">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-black text-xs bg-stone-900 text-white px-3 py-1 rounded-lg border border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                      {(Number(frequency) || 91.7).toFixed(1)} FM
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] flex items-center gap-1.5">
                      <span>{(activeWhisper.mood_tag && MOOD_TAG_LABELS[activeWhisper.mood_tag]?.icon) || "♡"}</span>
                      <span>{(activeWhisper.mood_tag && MOOD_TAG_LABELS[activeWhisper.mood_tag]?.label) || "Romantic Vibe"}</span>
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl sm:text-2xl text-stone-900 truncate tracking-tight">
                    {activeWhisper.title}
                  </h3>

                  <p className="text-xs font-mono font-medium text-stone-500 mt-1.5 flex items-center gap-2">
                    <span>From <strong className="font-bold text-stone-800">{activeWhisper.sender_name || "Partner"}</strong></span>
                    <span>·</span>
                    <span>{activeWhisper.created_at ? new Date(activeWhisper.created_at).toLocaleDateString() : "Recent"}</span>
                  </p>
                </div>

                {/* Heard / Send Love Reaction Button */}
                <button
                  onClick={() => handleMarkListened(activeWhisper.id)}
                  title="Listened with love"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                    hasHearted
                      ? "bg-rose-500 text-white"
                      : "bg-white hover:bg-stone-50 text-stone-800"
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${hasHearted ? "text-amber-200" : "text-amber-500"}`} />
                  <Heart className={`w-3.5 h-3.5 ${hasHearted ? "fill-current text-white" : "text-rose-500"}`} />
                  <span>{hasHearted ? "Heard ♡" : "Send Love"}</span>
                </button>
              </div>

              {/* Dynamic 28-Bar Waveform Scrubber */}
              <div className="mt-5">
                <div
                  className="group relative flex items-center justify-between gap-1 sm:gap-1.5 h-16 px-4 py-2 rounded-2xl bg-stone-50 hover:bg-amber-50/40 border-2 border-stone-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-colors cursor-pointer select-none"
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
                              ? "bg-rose-500 shadow-sm"
                              : "bg-stone-300 group-hover:bg-stone-400"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs font-mono text-stone-600 mt-2 px-1 font-bold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Actions Bar */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t-2 border-stone-200">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SIGNAL LOCKED · 100%</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReplay}
                    className="w-11 h-11 rounded-xl bg-white border-2 border-stone-800 text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-stone-800 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setIsRecorderOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border-2 border-stone-800 text-xs font-bold text-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4 stroke-[2.5]" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-7 rounded-3xl bg-[#FFFDF9] border-2 border-dashed border-stone-800 text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-100 border-2 border-stone-800 text-xs font-mono font-bold text-stone-800 mb-2 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <Radio className="w-3.5 h-3.5" />
                <span>{(Number(frequency) || 91.7).toFixed(1)} FM: {currentStation ? currentStation.name : "Open Airwave"}</span>
              </span>
              <p className="text-xs text-stone-600 max-w-sm mx-auto mt-2 font-medium">
                Soft static hums on this frequency. Drop a private audio whisper here for your partner to discover!
              </p>
              <button
                onClick={() => setIsRecorderOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Record on {(Number(frequency) || 91.7).toFixed(1)} FM</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
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
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 flex items-center justify-center text-rose-600 mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-black text-xl text-stone-900">
              Radio Tuner Recalibrating
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              We encountered a minor static blip while scanning the airwaves. Click below to recalibrate and reset your radio frequency.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="py-2.5 px-6 text-xs font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                Reset &amp; Tune In
              </button>
              <Link
                href="/dashboard"
                className="py-2.5 px-5 text-xs font-mono font-bold bg-white hover:bg-stone-50 text-stone-900 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
          <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
          </div>
        }
      >
        <WhisperContent />
      </Suspense>
    </WhisperErrorBoundary>
  );
}
