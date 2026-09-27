"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Camera,
  Users,
  Sparkles,
  Link2,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  ArrowRight,
  Upload,
  Heart,
  Volume2,
  Clock,
  MapPin,
  Smile,
  Send,
  RefreshCw,
} from "lucide-react";
import { BoothSession, BoothStatus, getRandomPrompt } from "@/lib/booth/types";
import { ClockSync } from "@/lib/booth/clock-sync";
import { BoothWebRTCManager } from "@/lib/booth/webrtc-manager";

interface SharedBoothSessionProps {
  sessionId: string;
  initialSession: BoothSession;
  isHost: boolean;
  onFinishSession: (finalFrames: string[], layout: string) => void;
  onExit: () => void;
}

export default function SharedBoothSession({
  sessionId,
  initialSession,
  isHost,
  onFinishSession,
  onExit,
}: SharedBoothSessionProps) {
  const { user, profile, pair, partner } = useAuth();
  const supabase = createClient();

  // Session state
  const [session, setSession] = useState<BoothSession>(initialSession);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // WebRTC & Media states
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [isPartnerPresent, setIsPartnerPresent] = useState(false);
  const [isPartnerStreamActive, setIsPartnerStreamActive] = useState(false);
  const [rtcConnectionState, setRtcConnectionState] = useState<string>("new");

  // Sync & Countdown states
  const [clockOffset, setClockOffset] = useState<number>(0);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const [customNextPrompt, setCustomNextPrompt] = useState("");
  const [isProcessingShot, setIsProcessingShot] = useState(false);
  const [manualPhotoData, setManualPhotoData] = useState<string | null>(null);
  const [manualPhotoUploaded, setManualPhotoUploaded] = useState(false);

  const handleManualPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setManualPhotoData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualPhotoUpload = async () => {
    if (!manualPhotoData) return;
    try {
      const currentShotIndex = session.current_shot || 0;
      const res = await fetch("/api/booth/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          shotNumber: currentShotIndex,
          imageData: manualPhotoData,
        }),
      });
      const data = await res.json();
      const finalUrl = data.imageUrl || manualPhotoData;
      setCapturedFrames((prev) => {
        const next = [...prev];
        next[currentShotIndex] = finalUrl;
        return next;
      });
      setManualPhotoUploaded(true);
      setTimeout(() => setManualPhotoUploaded(false), 4000);
    } catch (e) {
      console.error("Manual photo upload error:", e);
    }
  };

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const clockSyncRef = useRef<ClockSync>(new ClockSync());
  const rtcManagerRef = useRef<BoothWebRTCManager | null>(null);
  const channelRef = useRef<any>(null);
  const isCapturingRef = useRef(false);
  const isRtcReadyRef = useRef(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Audio Shutter Synth
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio shutter context error:", e);
    }
  }, []);

  // 1. Initial Clock Calibration & Session Rehydration
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const syncResult = await clockSyncRef.current.calibrate("/api/booth/clock", 5);
        if (isMounted) {
          setClockOffset(syncResult.offsetMs);
        }

        const turnRes = await fetch("/api/booth/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const turnData = await turnRes.json().catch(() => ({}));
        const iceServers = turnData.iceServers || [];

        const manager = new BoothWebRTCManager(iceServers, {
          onRemoteStream: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              setIsPartnerStreamActive(true);
            }
          },
          onConnectionState: (state) => {
            setRtcConnectionState(state);
            if (state === "connected") {
              setSyncFeedback("Cameras connected live!");
              setTimeout(() => setSyncFeedback(null), 3000);
            }
          },
          onIceCandidate: (candidate) => {
            channelRef.current?.send({
              type: "broadcast",
              event: "webrtc-ice",
              payload: { sender: user?.id, candidate },
            });
          },
        });

        rtcManagerRef.current = manager;

        try {
          const localStream = await manager.startLocalCamera("user");
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            setIsCameraReady(true);
          }
        } catch (camErr: any) {
          console.warn("[SharedBooth] Local camera access rejected:", camErr);
          setIsCameraDenied(true);
        }

        isRtcReadyRef.current = true;

        // Process any queued incoming offer received before local camera was ready
        if (pendingOfferRef.current) {
          const queuedOffer = pendingOfferRef.current;
          pendingOfferRef.current = null;
          try {
            const answer = await manager.handleOffer(queuedOffer);
            channelRef.current?.send({
              type: "broadcast",
              event: "webrtc-answer",
              payload: { sender: user?.id, answer },
            });
          } catch (offerErr) {
            console.error("[SharedBooth] Error answering queued offer:", offerErr);
          }
        }

        // Flush any queued ICE candidates
        while (pendingIceCandidatesRef.current.length > 0) {
          const cand = pendingIceCandidatesRef.current.shift();
          if (cand) {
            await manager.addIceCandidate(cand);
          }
        }

        // Announce ready to channel
        channelRef.current?.send({
          type: "broadcast",
          event: "peer-ready",
          payload: { sender: user?.id },
        });

        // If host and partner is present, create initial offer
        if (isHost && (session.status === "PARTNER_JOINED" || session.status === "READY")) {
          try {
            const offer = await manager.createOffer();
            channelRef.current?.send({
              type: "broadcast",
              event: "webrtc-offer",
              payload: { sender: user?.id, offer },
            });
          } catch (e) {
            console.error("[SharedBooth] Error creating initial host offer:", e);
          }
        }

        const boothRes = await fetch(`/api/booth?id=${sessionId}`);
        if (boothRes.ok) {
          const { session: currentSession, shots } = await boothRes.json();
          if (currentSession && isMounted) {
            setSession(currentSession);
          }
          if (shots && shots.length > 0 && isMounted) {
            setCapturedFrames(shots.map((s: any) => s.image_url));
          }
        }
      } catch (err: any) {
        console.error("[SharedBooth] Init failed:", err);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      isRtcReadyRef.current = false;
      pendingOfferRef.current = null;
      pendingIceCandidatesRef.current = [];
      clockSyncRef.current.cancelScheduled();
      rtcManagerRef.current?.destroy();
    };
  }, [sessionId, user]);

  // 2. Realtime Channel Setup (Signaling + State Sync)
  useEffect(() => {
    if (!sessionId || !user) return;

    const channelName = `booth-session-${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    const sendHostOffer = async () => {
      if (!isHost || !isRtcReadyRef.current || !rtcManagerRef.current) return;
      try {
        const offer = await rtcManagerRef.current.createOffer();
        channel.send({
          type: "broadcast",
          event: "webrtc-offer",
          payload: { sender: user.id, offer },
        });
      } catch (err) {
        console.error("[SharedBooth] Error sending host offer:", err);
      }
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherPresent = Object.keys(state).some((id) => id !== user.id);
        setIsPartnerPresent(otherPresent);

        if (isHost && otherPresent) {
          sendHostOffer();
        }
      })
      .on("broadcast", { event: "peer-ready" }, async ({ payload }: any) => {
        if (payload?.sender === user.id) return;
        setIsPartnerPresent(true);
        if (isHost) {
          sendHostOffer();
        }
      })
      .on("broadcast", { event: "webrtc-offer" }, async ({ payload }: any) => {
        if (payload.sender === user.id) return;
        if (!isRtcReadyRef.current || !rtcManagerRef.current) {
          pendingOfferRef.current = payload.offer;
          return;
        }
        try {
          const answer = await rtcManagerRef.current.handleOffer(payload.offer);
          channel.send({
            type: "broadcast",
            event: "webrtc-answer",
            payload: { sender: user.id, answer },
          });
        } catch (err) {
          console.error("[SharedBooth] Error responding to offer:", err);
        }
      })
      .on("broadcast", { event: "webrtc-answer" }, async ({ payload }: any) => {
        if (payload.sender === user.id || !rtcManagerRef.current) return;
        try {
          await rtcManagerRef.current.handleAnswer(payload.answer);
        } catch (err) {
          console.error("[SharedBooth] Error accepting answer:", err);
        }
      })
      .on("broadcast", { event: "webrtc-ice" }, async ({ payload }: any) => {
        if (payload.sender === user.id) return;
        if (!isRtcReadyRef.current || !rtcManagerRef.current) {
          pendingIceCandidatesRef.current.push(payload.candidate);
          return;
        }
        await rtcManagerRef.current.addIceCandidate(payload.candidate);
      })
      .on("broadcast", { event: "shot-completed" }, ({ payload }: any) => {
        if (payload.imageUrl) {
          setCapturedFrames((prev) => {
            const next = [...prev];
            next[payload.shotNumber] = payload.imageUrl;
            return next;
          });
        }
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "photo_booth_sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload: any) => {
          if (payload.new) {
            setSession(payload.new as BoothSession);
            if (isHost && payload.new.status === "PARTNER_JOINED") {
              sendHostOffer();
            }
          }
        }
      )
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          if (isRtcReadyRef.current) {
            channel.send({
              type: "broadcast",
              event: "peer-ready",
              payload: { sender: user.id },
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, isHost]);

  // 3. Fallback Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/booth?id=${sessionId}`);
        if (res.ok) {
          const { session: refreshedSession } = await res.json();
          if (refreshedSession) {
            setSession((prev) => {
              if (
                prev.status !== refreshedSession.status ||
                prev.current_shot !== refreshedSession.current_shot ||
                prev.capture_at !== refreshedSession.capture_at
              ) {
                return refreshedSession;
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [sessionId]);

  // 4. Snapshot Engine
  const captureLocalSnapshot = useCallback(async (): Promise<string> => {
    if (localVideoRef.current && isCameraReady && !isCameraDenied) {
      return rtcManagerRef.current!.captureVideoFrame(localVideoRef.current, true);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#FAF5EB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#E8527D";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = "#3A2E22";
    ctx.font = "bold 32px serif";
    ctx.textAlign = "center";
    ctx.fillText("Pairfect Memory Snap ♡", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px monospace";
    ctx.fillStyle = "#8C7E72";
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height / 2 + 30);

    return canvas.toDataURL("image/jpeg", 0.9);
  }, [isCameraReady, isCameraDenied]);

  const compositeDualFrame = useCallback(
    async (localDataUrl: string, remoteDataUrl?: string): Promise<string> => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#FAF5EB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const localImg = new Image();
      localImg.src = localDataUrl;
      await new Promise((res) => (localImg.onload = res));

      if (remoteDataUrl) {
        const remoteImg = new Image();
        remoteImg.src = remoteDataUrl;
        await new Promise((res) => (remoteImg.onload = res));

        const halfWidth = canvas.width / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, halfWidth, canvas.height);
        ctx.clip();
        ctx.drawImage(localImg, 0, 0, halfWidth, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(halfWidth, 0, halfWidth, canvas.height);
        ctx.clip();
        ctx.drawImage(remoteImg, halfWidth, 0, halfWidth, canvas.height);
        ctx.restore();

        ctx.strokeStyle = "rgba(232, 82, 125, 0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(halfWidth, 0);
        ctx.lineTo(halfWidth, canvas.height);
        ctx.stroke();
      } else {
        ctx.drawImage(localImg, 0, 0, canvas.width, canvas.height);
      }

      return canvas.toDataURL("image/jpeg", 0.92);
    },
    []
  );

  const executeCapture = useCallback(async () => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setIsProcessingShot(true);

    try {
      playShutterSound();
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 350);

      // Dispatch custom in-browser event for synchronization measurement
      if (typeof window !== "undefined") {
        const perfNow =
          typeof performance !== "undefined" && performance.timeOrigin
            ? performance.timeOrigin + performance.now()
            : Date.now();
        window.dispatchEvent(
          new CustomEvent("booth:frame-captured", {
            detail: {
              performanceNow: perfNow,
              wallClockMs: Date.now(),
              shotNumber: session.current_shot || 0,
              captureAt: session.capture_at,
            },
          })
        );
      }

      const localFrame = await captureLocalSnapshot();

      let remoteFrame: string | undefined = undefined;
      if (remoteVideoRef.current && isPartnerStreamActive) {
        try {
          remoteFrame = rtcManagerRef.current?.captureVideoFrame(remoteVideoRef.current, false);
        } catch (e) {
          console.warn("Remote snapshot grab fallback:", e);
        }
      }

      const finalShotFrame = await compositeDualFrame(localFrame, remoteFrame);
      const currentShotIndex = session.current_shot || 0;

      const res = await fetch("/api/booth/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          shotNumber: currentShotIndex,
          imageData: finalShotFrame,
        }),
      });

      const uploadResult = await res.json();
      const frameUrl = uploadResult.imageUrl || finalShotFrame;

      setCapturedFrames((prev) => {
        const next = [...prev];
        next[currentShotIndex] = frameUrl;
        return next;
      });

      channelRef.current?.send({
        type: "broadcast",
        event: "shot-completed",
        payload: { shotNumber: currentShotIndex, imageUrl: frameUrl },
      });

      if (isHost) {
        await fetch("/api/booth/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, action: "preview" }),
        });
      }
    } catch (err: any) {
      console.error("[SharedBooth] Capture execution error:", err);
    } finally {
      setIsProcessingShot(false);
      isCapturingRef.current = false;
    }
  }, [
    session.current_shot,
    session.id,
    isHost,
    playShutterSound,
    captureLocalSnapshot,
    compositeDualFrame,
    isPartnerStreamActive,
  ]);

  // 5. Scheduled Capture Trigger
  useEffect(() => {
    if (session.status === "CAPTURE" && session.capture_at) {
      const serverCaptureMs = Date.parse(session.capture_at);
      const cancelScheduled = clockSyncRef.current.scheduleAt(serverCaptureMs, () => {
        executeCapture();
      });

      return () => {
        cancelScheduled();
      };
    }
  }, [session.status, session.capture_at, executeCapture]);

  // 6. Visual Countdown Timer
  useEffect(() => {
    if (session.status === "COUNTDOWN") {
      setCountdownNum(3);
      const t2 = setTimeout(() => setCountdownNum(2), 1000);
      const t1 = setTimeout(() => setCountdownNum(1), 2000);
      const t0 = setTimeout(async () => {
        setCountdownNum(null);
        if (isHost) {
          await fetch("/api/booth/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: session.id,
              action: "capture",
              leadTimeMs: 1000,
            }),
          });
        }
      }, 3000);

      return () => {
        clearTimeout(t2);
        clearTimeout(t1);
        clearTimeout(t0);
      };
    } else {
      setCountdownNum(null);
    }
  }, [session.status, isHost, session.id]);

  const handleStartCountdown = async () => {
    if (!isHost) return;
    setError(null);
    try {
      await fetch("/api/booth/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, action: "countdown" }),
      });
    } catch (e: any) {
      setError("Failed to start countdown.");
    }
  };

  const handleNextShot = async () => {
    if (!isHost) return;
    setError(null);
    try {
      await fetch("/api/booth/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          action: "next_shot",
          customPrompt: customNextPrompt.trim() || undefined,
        }),
      });
      setCustomNextPrompt("");
    } catch (e: any) {
      setError("Failed to advance to next shot.");
    }
  };

  const handleProceedToDecoration = () => {
    onFinishSession(capturedFrames, session.layout_style || "strip_4");
  };

  const copyBoothCode = () => {
    navigator.clipboard.writeText(session.booth_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLongDistance =
    profile?.city?.name && partner?.city?.name && profile.city.name !== partner.city.name;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {screenFlash && (
        <div className="fixed inset-0 bg-white z-[99999] pointer-events-none transition-opacity duration-300 opacity-90" />
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--rose)]/20 border border-[var(--rose)]/40 flex items-center justify-center text-[var(--burgundy)]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg text-[var(--text)]">
                Virtual Photobooth
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)]">
                {session.status === "PARTNER_JOINED" ? "Partner Joined" : session.status}
              </span>
            </div>
            <p className="text-xs text-[var(--text-soft)] font-sans">
              Frame {(session.current_shot || 0) + 1} of {session.total_shots || 4}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-[var(--text-soft)]">Code:</span>
            <span data-testid="booth-code-header" className="font-mono font-bold text-sm tracking-wider text-[var(--burgundy)]">
              {session.booth_code}
            </span>
            <button
              onClick={copyBoothCode}
              title="Copy code"
              className="p-1 text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onExit}
            className="text-xs font-mono text-[var(--text-soft)] hover:text-red-500 px-3 py-1.5 rounded-xl border border-[var(--border)] cursor-pointer"
          >
            Leave Booth
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="mb-4 p-2.5 rounded-xl bg-[var(--rose)]/20 border border-[var(--rose)]/40 text-[var(--burgundy)] text-xs font-mono text-center font-bold">
          {syncFeedback}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* WAITING State */}
      {session.status === "WAITING" && (
        <div className="max-w-md mx-auto my-12 text-center p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm space-y-6">
          {isCameraDenied && (
            <div className="p-6 rounded-2xl bg-neutral-900 text-white text-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-heading font-bold text-sm">Camera Unavailable / Denied</p>
              <p className="text-[11px] text-neutral-400 mt-1 mb-3">
                Upload a photo to use for this shot.
              </p>
              <input
                type="file"
                accept="image/*"
                data-testid="booth-photo-upload-input"
                onChange={handleManualPhotoSelect}
                className="text-xs text-neutral-300 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-[var(--rose)]/20 file:text-[var(--rose)] mb-3"
              />
              <button
                type="button"
                onClick={handleManualPhotoUpload}
                className="btn-primary py-1.5 px-4 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Use This Photo
              </button>
              {manualPhotoUploaded && (
                <span className="text-[11px] text-emerald-400 mt-2 font-mono font-bold block">
                  Photo uploaded!
                </span>
              )}
            </div>
          )}

          <div className="w-16 h-16 rounded-full bg-[var(--rose)]/20 border border-[var(--rose)]/40 flex items-center justify-center text-[var(--burgundy)] mx-auto animate-pulse">
            <Users className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-[var(--text)]">
              Waiting for Partner
            </h2>
            <p className="text-xs text-[var(--text-soft)] mt-1 font-sans">
              Share this 4-letter booth code with your partner:
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border-2 border-[var(--border)] inline-block select-all">
            <span data-testid="booth-code" className="font-mono text-4xl font-extrabold tracking-widest text-[var(--burgundy)]">
              {session.booth_code}
            </span>
          </div>

          <div>
            <button
              onClick={copyBoothCode}
              className="btn-primary py-2.5 px-6 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? "Code Copied!" : "Copy Booth Code"}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-soft)] pt-4 border-t border-[var(--border)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--burgundy)]" />
            <span>Booth will automatically open once your partner enters code...</span>
          </div>
        </div>
      )}

      {/* Active Booth Grid */}
      {session.status !== "WAITING" && session.status !== "FINISHED" && (
        <div className="space-y-6">
          {session.current_prompt && (
            <div className="p-4 rounded-2xl bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-center shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--burgundy)] block mb-1">
                Pose Prompt • Shot {(session.current_shot || 0) + 1}
              </span>
              <p className="font-heading font-bold text-lg sm:text-xl text-[var(--text)]">
                &ldquo;{session.current_prompt}&rdquo;
              </p>
            </div>
          )}

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 rounded-3xl overflow-hidden bg-black/5 p-2 sm:p-4 border border-[var(--border)]">
            {/* Tile 1: You */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md">
              <video
                ref={localVideoRef}
                data-testid="local-video"
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />

              {isCameraDenied && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900/95 text-white z-20">
                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="font-heading font-bold text-sm">Camera Unavailable / Denied</p>
                  <p className="text-[11px] text-neutral-400 mt-1 mb-3">
                    Upload a photo to use for this shot.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    data-testid="booth-photo-upload-input"
                    onChange={handleManualPhotoSelect}
                    className="text-xs text-neutral-300 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-[var(--rose)]/20 file:text-[var(--rose)] mb-3"
                  />
                  <button
                    type="button"
                    onClick={handleManualPhotoUpload}
                    className="btn-primary py-1.5 px-4 text-xs font-mono font-bold uppercase cursor-pointer"
                  >
                    Use This Photo
                  </button>
                  {manualPhotoUploaded && (
                    <span className="text-[11px] text-emerald-400 mt-2 font-mono font-bold">
                      Photo uploaded!
                    </span>
                  )}
                </div>
              )}

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>You {isHost ? "(Host)" : ""}</span>
              </div>
            </div>

            {/* Tile 2: Partner */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md">
              <video
                ref={remoteVideoRef}
                data-testid="partner-video"
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {!isPartnerStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 text-white">
                  <Loader2 className="w-8 h-8 text-[var(--burgundy)] animate-spin mb-3" />
                  <p className="font-heading font-bold text-sm">
                    {isPartnerPresent ? "Connecting Partner Video..." : "Waiting for partner's camera..."}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-xs font-mono">
                    RTC state: {rtcConnectionState}
                  </p>
                </div>
              )}

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPartnerStreamActive ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span>{partner?.display_name || "Partner"}</span>
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdownNum !== null && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
                <div className="font-heading font-extrabold text-8xl sm:text-9xl text-white drop-shadow-2xl animate-bounce">
                  {countdownNum}
                </div>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-black/70 text-white/90 text-xs font-mono font-bold tracking-wider">
                  Keep this tab active for perfect millisecond sync
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xs">
            {(session.status === "READY" || session.status === "PARTNER_JOINED") && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-bold text-base text-[var(--text)]">
                    Ready for Shot {(session.current_shot || 0) + 1}
                  </h4>
                  <p className="text-xs text-[var(--text-soft)] mt-0.5 font-sans">
                    {isHost
                      ? "Strike your poses and click below to fire both cameras simultaneously."
                      : "Host will trigger the 3-second synchronized countdown."}
                  </p>
                </div>

                {isHost ? (
                  <button
                    onClick={handleStartCountdown}
                    className="btn-primary py-3.5 px-8 text-xs font-mono font-bold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Shot {(session.current_shot || 0) + 1}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-soft)] px-4 py-2 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--burgundy)]" />
                    <span>Waiting for host to capture...</span>
                  </div>
                )}
              </div>
            )}

            {session.status === "PREVIEW" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-heading font-bold text-base text-[var(--text)]">
                      Shot {(session.current_shot || 0) + 1} Captured!
                    </h4>
                    <p className="text-xs text-[var(--text-soft)] mt-0.5">
                      Ready for the next pose?
                    </p>
                  </div>

                  {isHost ? (
                    <button
                      onClick={handleNextShot}
                      className="btn-primary py-3 px-6 text-xs font-mono font-bold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>
                        {(session.current_shot || 0) + 1 >= (session.total_shots || 4)
                          ? "Finish & Decorate Strip →"
                          : "Next Shot →"}
                      </span>
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-[var(--text-soft)]">
                      Waiting for host to advance...
                    </div>
                  )}
                </div>

                {isHost && (session.current_shot || 0) + 1 < (session.total_shots || 4) && (
                  <div className="pt-3 border-t border-[var(--border)] flex gap-2">
                    <input
                      type="text"
                      value={customNextPrompt}
                      onChange={(e) => setCustomNextPrompt(e.target.value)}
                      placeholder="Optional custom pose prompt for next shot (or leave blank for random)"
                      className="flex-1 px-3 py-2 text-xs font-sans rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-soft)]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Captured Snaps Reel */}
          {capturedFrames.length > 0 && (
            <div className="p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-soft)] block mb-3">
                Captured Frames Reel ({capturedFrames.filter(Boolean).length}/{session.total_shots || 4})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: session.total_shots || 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-center relative"
                  >
                    {capturedFrames[idx] ? (
                      <img
                        src={capturedFrames[idx]}
                        alt={`Shot ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace broken image with a visual placeholder
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex-col items-center justify-center text-center p-2"
                      style={{ display: capturedFrames[idx] ? "none" : "flex" }}
                    >
                      <span className="text-lg mb-1">📷</span>
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">
                        {capturedFrames[idx] ? `Shot ${idx + 1}` : `Frame ${idx + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FINISHED State */}
      {session.status === "FINISHED" && (
        <div className="max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--burgundy)]/40 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[var(--rose)]/20 border border-[var(--rose)]/40 flex items-center justify-center text-[var(--burgundy)] mx-auto">
            <Heart className="w-8 h-8 fill-[var(--burgundy)]" />
          </div>

          {isLongDistance ? (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] text-xs font-mono font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile?.city?.name} ♡ {partner?.city?.name}</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--text)]">
                You weren&apos;t in the same room.<br />
                <span className="text-[var(--burgundy)]">But you made the same memory.</span>
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--text)]">
                All Shots Captured!
              </h2>
              <p className="text-xs text-[var(--text-soft)] mt-1 font-sans">
                Every frame synchronized down to the millisecond.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto py-2">
            {capturedFrames.map((url, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl overflow-hidden border border-[var(--border)] bg-black/10 shadow-xs"
              >
                <img src={url} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-soft)] mb-4 font-sans">
              Now choose vintage filters, stickers, paper textures, and export your 300-DPI high-res keepsake strip.
            </p>
            <button
              onClick={handleProceedToDecoration}
              className="btn-primary py-3.5 px-8 text-xs font-mono font-bold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>Customize & Export Keepsake Strip →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
