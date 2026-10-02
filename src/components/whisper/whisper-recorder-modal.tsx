"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Square, Play, Pause, RotateCcw, Send, Radio, Sparkles, Check, AlertCircle } from "lucide-react";
import { PRESET_STATIONS, WhisperMoodTag, MOOD_TAG_LABELS } from "@/lib/whisper/types";
import { playRadioClick } from "@/lib/whisper/audio-fx";

interface WhisperRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrequency?: number;
  onBroadcastSuccess: (newWhisper: any) => void;
  pairId?: string;
  senderName?: string;
}

export function WhisperRecorderModal({
  isOpen,
  onClose,
  defaultFrequency = 91.7,
  onBroadcastSuccess,
  pairId,
  senderName = "Partner",
}: WhisperRecorderModalProps) {
  const [recordState, setRecordState] = useState<"idle" | "recording" | "paused" | "preview" | "broadcasting">("idle");
  const [seconds, setSeconds] = useState(0);
  const [targetFrequency, setTargetFrequency] = useState(defaultFrequency);
  const [title, setTitle] = useState("");
  const [moodTag, setMoodTag] = useState<WhisperMoodTag>("romantic");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio recording refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview audio playback refs
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Canvas visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const MAX_SECONDS = 60;

  // Cleanup on unmount or close
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    setIsPreviewPlaying(false);
    setPreviewProgress(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setRecordState("idle");
      setSeconds(0);
      setErrorMessage(null);
    } else {
      setTargetFrequency(defaultFrequency);
    }
  }, [isOpen, defaultFrequency, cleanupRecording]);

  // Visualizer loop
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / 24) - 2;
    let x = 1;

    for (let i = 0; i < 24; i++) {
      const value = dataArray[i * 2] || 0;
      const barHeight = Math.max(4, (value / 255) * canvas.height * 0.9);
      const y = (canvas.height - barHeight) / 2;

      ctx.fillStyle = "#E8527D";
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 3);
      ctx.fill();

      x += barWidth + 2;
    }

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Start audio recording
  const handleStartRecording = async () => {
    playRadioClick();
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup audio analyzer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualizer
      drawWaveform();

      // Setup MediaRecorder
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const supportedMime = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });

        if (!blob || blob.size < 500) {
          console.error("Audio recording blob is empty or too small:", blob?.size);
          setErrorMessage("No audio was captured. Please speak into your microphone and try again.");
          setRecordState("idle");
          setSeconds(0);
          return;
        }

        recordedBlobRef.current = blob;

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        previewAudioRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
            setPreviewProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          setIsPreviewPlaying(false);
          setPreviewProgress(0);
        };

        setRecordState("preview");
      };

      recorder.start(100);
      setRecordState("recording");
      setSeconds(0);

      // Start second timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            handleStopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error("Mic access error:", err);
      setErrorMessage("Could not access your microphone. Please check browser permissions.");
    }
  };

  // Pause / Resume recording
  const handleTogglePause = () => {
    playRadioClick();
    if (!mediaRecorderRef.current) return;

    if (recordState === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordState("paused");
    } else if (recordState === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            handleStopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
      setRecordState("recording");
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    playRadioClick();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.requestData();
      } catch (err) {
        console.warn("requestData error:", err);
      }
      mediaRecorderRef.current.stop();
    }
  };

  // Discard and re-record
  const handleRecordAgain = () => {
    playRadioClick();
    cleanupRecording();
    recordedBlobRef.current = null;
    setSeconds(0);
    setRecordState("idle");
  };

  // Preview Play / Pause
  const handleTogglePreviewPlay = () => {
    playRadioClick();
    if (!previewAudioRef.current) return;

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => {
          setIsPreviewPlaying(true);
        })
        .catch((err) => {
          console.error("Preview play failed:", err);
          setIsPreviewPlaying(false);
        });
    }
  };

  // Final Broadcast Submission
  const handleBroadcast = async () => {
    if (!recordedBlobRef.current || recordedBlobRef.current.size < 500) {
      setErrorMessage("No audio captured. Please speak into the mic and try again.");
      return;
    }
    playRadioClick();
    setRecordState("broadcasting");
    setErrorMessage(null);

    try {
      // Convert Blob to base64 Data URL
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(recordedBlobRef.current!);
      });

      const response = await fetch("/api/whisper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pairId || "demo-pair",
          frequency: targetFrequency,
          title: title.trim() || `${MOOD_TAG_LABELS[moodTag].label} Whisper`,
          audioData: base64Data,
          duration: seconds,
          moodTag,
          senderName,
        }),
      });

      const data = await response.json();
      if (data.success && data.whisper) {
        onBroadcastSuccess(data.whisper);
        onClose();
      } else {
        throw new Error(data.error || "Failed to broadcast voice note");
      }
    } catch (err: unknown) {
      console.error("Broadcast error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to broadcast voice note. Please try again.");
      setRecordState("preview");
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FFF5F8] border-2 border-[var(--border)] shadow-2xl p-5 sm:p-7 overflow-hidden text-[var(--text)]">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-[var(--text-soft)] hover:text-[var(--text)] shadow-xs border border-[var(--border)] transition-transform active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--text)] leading-tight">
              Drop a Whisper
            </h3>
            <p className="text-xs text-[var(--text-soft)]">
              Broadcast a voice note across your private radio frequency
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ─── RECORDING / VISUALIZER WORKSPACE ─── */}
        <div className="my-4 rounded-2xl bg-white/90 border border-[var(--border)] shadow-sm p-4 text-center">
          {/* Waveform Canvas / Meter */}
          <div className="h-16 flex items-center justify-center">
            {recordState === "recording" || recordState === "paused" ? (
              <canvas
                ref={canvasRef}
                width={260}
                height={60}
                className="w-full max-w-[260px] h-14"
              />
            ) : recordState === "preview" ? (
              <div className="w-full max-w-[280px] flex items-center gap-2">
                <button
                  onClick={handleTogglePreviewPlay}
                  className="w-10 h-10 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                    <div
                      className="h-full bg-[var(--burgundy)] transition-all"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                    <span>{formatTimer(Math.floor((previewProgress / 100) * seconds))}</span>
                    <span>{formatTimer(seconds)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-[var(--text-soft)]">
                <Mic className="w-6 h-6 text-[var(--burgundy)] opacity-60" />
                <span className="text-xs">Press record to start speaking</span>
              </div>
            )}
          </div>

          {/* Timer Display */}
          {(recordState === "recording" || recordState === "paused") && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm font-mono font-bold text-[var(--burgundy)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{formatTimer(seconds)}</span>
              <span className="text-xs text-zinc-400 font-normal">/ 01:00</span>
            </div>
          )}

          {/* Record Actions Bar */}
          <div className="mt-3 flex items-center justify-center gap-3">
            {recordState === "idle" && (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            )}

            {(recordState === "recording" || recordState === "paused") && (
              <>
                <button
                  onClick={handleTogglePause}
                  className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium border border-zinc-300 transition-all active:scale-95 cursor-pointer"
                >
                  {recordState === "recording" ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--burgundy)] text-white text-xs font-semibold shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done</span>
                </button>
              </>
            )}

            {recordState === "preview" && (
              <button
                onClick={handleRecordAgain}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-zinc-50 text-[var(--text-soft)] text-xs font-medium border border-[var(--border)] shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Record Again</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── STATION & METADATA CONFIGURATION ─── */}
        <div className="space-y-3 pt-2">
          {/* Target Radio Station Frequency */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[var(--text-soft)] mb-1.5">
              Broadcast Station ({targetFrequency.toFixed(1)} FM)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {PRESET_STATIONS.map((station) => {
                const isSelected = Math.abs(station.frequency - targetFrequency) < 0.05;
                return (
                  <button
                    key={station.frequency}
                    onClick={() => {
                      playRadioClick();
                      setTargetFrequency(station.frequency);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-center border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-xs scale-102"
                        : "bg-white text-zinc-700 border-[var(--border)] hover:bg-rose-50"
                    }`}
                  >
                    <div>{station.frequency} FM</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Whisper Title */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[var(--text-soft)] mb-1">
              Whisper Note Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Good morning my love, just thinking of you"
              maxLength={60}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--burgundy)] transition-colors"
            />
          </div>

          {/* Mood Tag Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[var(--text-soft)] mb-1.5">
              Mood Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MOOD_TAG_LABELS) as WhisperMoodTag[]).map((tag) => {
                const isSelected = tag === moodTag;
                const info = MOOD_TAG_LABELS[tag];
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      playRadioClick();
                      setMoodTag(tag);
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-xs"
                        : "bg-white text-zinc-700 border-[var(--border)] hover:bg-rose-50"
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── BROADCAST SUBMIT BUTTON ─── */}
        <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-medium text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleBroadcast}
            disabled={recordState !== "preview"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] disabled:opacity-40 text-white font-semibold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {recordState === "broadcasting" ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast to Airwaves</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
