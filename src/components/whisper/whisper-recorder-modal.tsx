"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Square, Play, Pause, RotateCcw, Send, Radio, Sparkles, Check, AlertCircle } from "lucide-react";
import { PRESET_STATIONS, WhisperMoodTag, MOOD_TAG_LABELS } from "@/lib/whisper/types";
import { playRadioClick } from "@/lib/whisper/audio-fx";
import { encryptAudioBlob, getPairKey, autoRecoverVaultKeyIfMissing } from "@/lib/crypto/e2ee";

interface WhisperRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrequency?: number;
  onBroadcastSuccess: (newWhisper: any) => void;
  pairId?: string;
  senderName?: string;
  inviteCode?: string;
}

export function WhisperRecorderModal({
  isOpen,
  onClose,
  defaultFrequency = 91.7,
  onBroadcastSuccess,
  pairId,
  senderName = "Partner",
  inviteCode,
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
    let x = 0;

    for (let i = 0; i < 24; i++) {
      const idx = Math.floor((i / 24) * bufferLength);
      const val = dataArray[idx] || 0;
      const barHeight = Math.max(4, (val / 255) * canvas.height * 0.9);

      const y = (canvas.height - barHeight) / 2;
      ctx.fillStyle = "#E11D48";
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 3);
      ctx.fill();

      x += barWidth + 2;
    }

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Start recording
  const handleStartRecording = async () => {
    playRadioClick();
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup audio analysis for live waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported mimeType
      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        recordedBlobRef.current = audioBlob;

        // Init preview audio element
        const url = URL.createObjectURL(audioBlob);
        const prevAudio = new Audio(url);
        previewAudioRef.current = prevAudio;

        prevAudio.ontimeupdate = () => {
          if (prevAudio.duration) {
            setPreviewProgress((prevAudio.currentTime / prevAudio.duration) * 100);
          }
        };

        prevAudio.onended = () => {
          setIsPreviewPlaying(false);
          setPreviewProgress(0);
        };

        setRecordState("preview");
      };

      recorder.start(200);
      setRecordState("recording");
      setSeconds(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            handleStopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

      // Start visualizer
      drawWaveform();
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMessage("Could not access microphone. Please allow microphone permissions in your browser.");
    }
  };

  // Pause / Resume recording
  const handleTogglePause = () => {
    playRadioClick();
    if (!mediaRecorderRef.current) return;

    if (recordState === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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
      drawWaveform();
      setRecordState("recording");
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    playRadioClick();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Toggle preview playback
  const handleTogglePreviewPlay = () => {
    playRadioClick();
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.play().catch((err) => console.error("Preview play error:", err));
      setIsPreviewPlaying(true);
    }
  };

  // Reset and record again
  const handleRecordAgain = () => {
    playRadioClick();
    cleanupRecording();
    setRecordState("idle");
    setSeconds(0);
    recordedBlobRef.current = null;
  };

  // Submit and broadcast whisper
  const handleBroadcast = async () => {
    playRadioClick();
    if (!recordedBlobRef.current) {
      setErrorMessage("No recorded audio to broadcast.");
      return;
    }

    setRecordState("broadcasting");
    setErrorMessage(null);

    try {
      const audioBlob = recordedBlobRef.current;
      const effectivePairId = pairId || "local-space";
      let uploadPayload: Blob | string = audioBlob;
      let isEncrypted = false;

      // Encrypt audio blob on client using pair encryption vault key (fails closed)
      if (pairId) {
        let key = await getPairKey(pairId);
        if (!key && inviteCode) {
          // Attempt automatic recovery via encrypted envelope before failing
          try {
            const recovered = await autoRecoverVaultKeyIfMissing(pairId, inviteCode);
            if (recovered) {
              key = await getPairKey(pairId);
            }
          } catch (recErr) {
            console.warn("[Whisper] Auto key recovery attempt failed:", recErr);
          }
        }

        if (!key) {
          throw new Error("Cannot find your couple encryption key on this device. Restore it in Settings -> Vault using your 12-word recovery phrase.");
        }
        try {
          const encryptedBytes = await encryptAudioBlob(audioBlob, key);
          uploadPayload = new Blob([encryptedBytes], { type: "application/octet-stream" });
          isEncrypted = true;
        } catch (encErr: any) {
          throw new Error(`Failed to encrypt whisper audio: ${encErr.message || encErr}`);
        }
      }

      // Upload via FormData
      const formData = new FormData();
      const ext = audioBlob.type.includes("mp4") ? "mp4" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
      const filename = `whisper_${Date.now()}.${ext}${isEncrypted ? ".enc" : ""}`;
      formData.append("audio", uploadPayload, filename);
      formData.append("pair_id", effectivePairId);
      formData.append("frequency", String(targetFrequency));
      formData.append("title", title.trim() || `${senderName}'s Whisper`);
      formData.append("duration", String(Math.max(1, seconds)));
      formData.append("mood_tag", moodTag);
      formData.append("sender_name", senderName);

      const res = await fetch("/api/whisper", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.whisper) {
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
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF9F6] border-2 border-stone-800 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] p-6 sm:p-7 overflow-hidden text-stone-900">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
            <Radio className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xl text-stone-900 leading-tight">
              Drop a Whisper
            </h3>
            <p className="text-xs text-stone-600 font-sans">
              Broadcast a private voice note across your couple airwaves
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border-2 border-stone-800 text-xs font-bold text-rose-700 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recording Visualizer Workspace */}
        <div className="my-4 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] p-5 text-center">
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
              <div className="w-full max-w-[280px] flex items-center gap-3">
                <button
                  onClick={handleTogglePreviewPlay}
                  className="w-11 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                >
                  {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-stone-100 overflow-hidden border-2 border-stone-800">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono font-bold text-stone-500 mt-1.5">
                    <span>{formatTimer(Math.floor((previewProgress / 100) * seconds))}</span>
                    <span>{formatTimer(seconds)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-stone-500">
                <Mic className="w-7 h-7 text-rose-500 stroke-[2.5]" />
                <span className="text-xs font-mono font-bold">Press record to start speaking</span>
              </div>
            )}
          </div>

          {/* Timer Display */}
          {(recordState === "recording" || recordState === "paused") && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm font-mono font-bold text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{formatTimer(seconds)}</span>
              <span className="text-xs text-stone-400 font-normal">/ 01:00</span>
            </div>
          )}

          {/* Record Actions Bar */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {recordState === "idle" && (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all"
              >
                <Mic className="w-4 h-4 stroke-[2.5]" />
                <span>Start Recording</span>
              </button>
            )}

            {(recordState === "recording" || recordState === "paused") && (
              <>
                <button
                  onClick={handleTogglePause}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {recordState === "recording" ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done</span>
                </button>
              </>
            )}

            {recordState === "preview" && (
              <button
                onClick={handleRecordAgain}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Record Again</span>
              </button>
            )}
          </div>
        </div>

        {/* Station & Metadata Configuration */}
        <div className="space-y-3.5 pt-1">
          {/* Target Radio Station Frequency */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-stone-600 mb-1.5">
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
                    className={`py-2 px-2 rounded-xl text-center text-xs font-mono font-bold border-2 border-stone-800 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                        : "bg-white text-stone-800 hover:bg-stone-50 shadow-none"
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
            <label className="block text-xs font-mono font-bold uppercase text-stone-600 mb-1">
              Whisper Note Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Good morning my love, just thinking of you"
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-800 text-sm font-medium text-stone-900 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>

          {/* Mood Tag Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-stone-600 mb-1.5">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-stone-800 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                        : "bg-white text-stone-800 hover:bg-stone-50 shadow-none"
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

        {/* Broadcast Submit Button */}
        <div className="mt-5 pt-3.5 border-t-2 border-stone-200 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleBroadcast}
            disabled={recordState !== "preview"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            {recordState === "broadcasting" ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Broadcast to Airwaves</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
