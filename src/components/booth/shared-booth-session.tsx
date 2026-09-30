"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  RefreshCw,
  Sparkles,
  Link2,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  ArrowRight,
  Heart,
  Volume2,
  Clock,
  MapPin,
  Smile,
  Send,
  Zap,
  Layers,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { BoothSession, getRandomPrompt } from "@/lib/booth/types";
import { PhotostripTemplate, BoothPhotoItem } from "@/lib/booth/strip-engine";

interface SharedBoothSessionProps {
  sessionId: string;
  initialSession: BoothSession;
  isHost: boolean;
  onFinishSession: (finalFrames: string[], layout: string, photoItems?: BoothPhotoItem[]) => void;
  onExit: () => void;
}

const MAX_PHOTOS = 6;
const COUNTDOWN_DELAY_MS = 3200;

export default function SharedBoothSession({
  sessionId,
  initialSession,
  isHost,
  onFinishSession,
  onExit,
}: SharedBoothSessionProps) {
  const { user, pair, partner } = useAuth();
  const supabase = createClient();

  // ── States ────────────────────────────────────────────────────────────────
  const [session, setSession] = useState<BoothSession>(initialSession);
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing your booth...");

  // Camera & Video
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [rtcState, setRtcState] = useState<string>("connecting");
  const [isUsingRelay, setIsUsingRelay] = useState(false);
  const [partnerFallbackUrl, setPartnerFallbackUrl] = useState<string | null>(null);

  // Partner State
  const [isPartnerPresent, setIsPartnerPresent] = useState(false);
  const [partnerName, setPartnerName] = useState<string>(partner?.display_name || "Partner");

  // Synchronized Countdown & Clock Offset
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(0);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>(
    initialSession.current_prompt || "Soft romantic gaze: like the day you met"
  );

  // Photos & Gallery
  const [myPhotos, setMyPhotos] = useState<BoothPhotoItem[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<BoothPhotoItem[]>([]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const previewLoopTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownRafId = useRef<number | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const isMakingOffer = useRef(false);
  const activeCaptureIdRef = useRef<string | null>(null);
  const completedCaptures = useRef<Set<string>>(new Set());

  // Shutter Sound Synthesizer
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy
    }
  }, []);

  // ── High-Precision NTP Clock Calibration ──────────────────────────────────
  const syncClock = useCallback(async (samples = 3) => {
    const measurements: { rtt: number; offset: number }[] = [];
    for (let i = 0; i < samples; i++) {
      const t0 = performance.now();
      const startClientTime = Date.now();
      try {
        const res = await fetch("/api/booth/clock", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const t1 = performance.now();
          const rtt = t1 - t0;
          const serverTime = Number(data.t || data.serverTime);
          const midpoint = startClientTime + rtt / 2;
          measurements.push({ rtt, offset: serverTime - midpoint });
        }
      } catch {
        // fallback
      }
    }
    if (measurements.length > 0) {
      measurements.sort((a, b) => a.rtt - b.rtt);
      setClockOffsetMs(measurements[0].offset);
      return measurements[0].offset;
    }
    return 0;
  }, []);

  // ── Camera Initialization & Live Switching ────────────────────────────────
  const startCamera = useCallback(async (mode: "user" | "environment" = facingMode) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 960, max: 1440 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      localStreamRef.current = stream;
      setFacingMode(mode);
      setIsCameraReady(true);
      setIsCameraDenied(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Live track replacement in existing peer connection
      if (pcRef.current) {
        const nextTrack = stream.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender && nextTrack) {
          videoSender.replaceTrack(nextTrack);
        } else if (nextTrack) {
          pcRef.current.addTrack(nextTrack, stream);
        }
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      setIsCameraDenied(true);
    }
  }, [facingMode]);

  // Flip camera (front <-> back)
  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  };

  // ── WebRTC & Deterministic Signaling ──────────────────────────────────────
  const myUserId = user?.id || `anon-${Math.random().toString(36).slice(2, 8)}`;
  const partnerId = partner?.id || "partner";
  const shouldInitiateOffer = myUserId.localeCompare(partnerId) < 0;

  const createPeerConnection = useCallback((iceServers: RTCIceServer[]) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServers.length > 0 ? iceServers : [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 2,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: { from: myUserId, signal: { type: "candidate", candidate: event.candidate.toJSON() } },
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      setIsUsingRelay(false);
      setPartnerFallbackUrl(null);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setRtcState(state);
      if (state === "connected") {
        setIsUsingRelay(false);
        setStatusMessage("Both cameras connected live!");
      } else if (state === "failed" || state === "disconnected") {
        setIsUsingRelay(true);
        setStatusMessage("Connected via live relay preview");
      }
    };

    // Attach local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [myUserId]);

  // Handle incoming WebRTC signals
  const handleSignal = useCallback(async (signal: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (signal.type === "offer") {
        if (pc.signalingState !== "stable") {
          await pc.setLocalDescription({ type: "rollback" } as any).catch(() => {});
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Flush queued candidates
        while (iceCandidatesQueue.current.length > 0) {
          const cand = iceCandidatesQueue.current.shift();
          if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channelRef.current?.send({
          type: "broadcast",
          event: "signal",
          payload: { from: myUserId, signal: { type: "answer", sdp: pc.localDescription } },
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        while (iceCandidatesQueue.current.length > 0) {
          const cand = iceCandidatesQueue.current.shift();
          if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      } else if (signal.type === "candidate" && signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
        } else {
          iceCandidatesQueue.current.push(signal.candidate);
        }
      }
    } catch (err) {
      console.warn("Signal handling error:", err);
    }
  }, [myUserId]);

  // Make WebRTC Offer
  const makeOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || isMakingOffer.current || pc.signalingState !== "stable") return;

    try {
      isMakingOffer.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { from: myUserId, signal: { type: "offer", sdp: pc.localDescription } },
      });
    } catch (err) {
      console.warn("Offer error:", err);
    } finally {
      isMakingOffer.current = false;
    }
  }, [myUserId]);

  // ── Bulletproof Low-FPS Preview Relay Fallback ────────────────────────────
  // When WebRTC is blocked on mobile networks, send a 320x240 frame every 250ms
  // so the partner's camera preview NEVER goes blank!
  const sendPreviewFallbackFrame = useCallback(() => {
    const video = localVideoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (pcRef.current?.connectionState === "connected") return; // Direct P2P active

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, vw, vh, 0, 0, 320, 240);

      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.52);

      channelRef.current?.send({
        type: "broadcast",
        event: "preview_frame",
        payload: { from: myUserId, dataURL: frameDataUrl },
      });
    } catch {
      // ignore
    }
  }, [myUserId]);

  useEffect(() => {
    previewLoopTimer.current = setInterval(sendPreviewFallbackFrame, 250);
    return () => {
      if (previewLoopTimer.current) clearInterval(previewLoopTimer.current);
    };
  }, [sendPreviewFallbackFrame]);

  // ── Local Snapshot Capture ────────────────────────────────────────────────
  const captureLocalPhoto = useCallback(async (captureId: string) => {
    const video = localVideoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const vRatio = vw / vh;
    const targetRatio = 960 / 720;
    let sx = 0, sy = 0, sw = vw, sh = vh;

    if (vRatio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }

    ctx.save();
    if (facingMode === "user") {
      ctx.translate(960, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 960, 720);
    ctx.restore();

    const dataURL = canvas.toDataURL("image/jpeg", 0.84);
    const photoItem: BoothPhotoItem = {
      id: crypto.randomUUID(),
      dataURL,
      name: user?.user_metadata?.name || user?.email?.split("@")[0] || "You",
      isSelf: true,
      captureId,
      takenAt: Date.now(),
    };

    setMyPhotos((prev) => [...prev, photoItem].slice(-MAX_PHOTOS));
    return photoItem;
  }, [facingMode, user]);

  // ── Synchronized Countdown Trigger ────────────────────────────────────────
  const triggerShutterCountdown = useCallback(() => {
    if (isCountingDown) return;
    if (myPhotos.length >= MAX_PHOTOS) {
      setStatusMessage("You have reached 6 shots! Finish to design your strip.");
      return;
    }

    const captureId = crypto.randomUUID();
    const serverNowEstimate = Date.now() + clockOffsetMs;
    const captureAt = serverNowEstimate + COUNTDOWN_DELAY_MS;

    channelRef.current?.send({
      type: "broadcast",
      event: "countdown_start",
      payload: { captureId, captureAt },
    });

    // Start local countdown
    startCountdown(captureId, captureAt);
  }, [isCountingDown, myPhotos.length, clockOffsetMs]);

  const startCountdown = useCallback((captureId: string, captureAt: number) => {
    if (completedCaptures.current.has(captureId)) return;
    activeCaptureIdRef.current = captureId;
    setIsCountingDown(true);

    // Re-calibrate clock offset freshly for this countdown
    syncClock(2).catch(() => {});

    if (countdownRafId.current) cancelAnimationFrame(countdownRafId.current);

    const tick = () => {
      const serverNow = Date.now() + clockOffsetMs;
      const remainingMs = captureAt - serverNow;

      if (remainingMs <= 0) {
        setCountdownText(null);
        setIsCountingDown(false);
        activeCaptureIdRef.current = null;
        completedCaptures.current.add(captureId);

        // Flash screen
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 280);

        // Play shutter sound
        playShutterSound();

        // Snap photo
        captureLocalPhoto(captureId).then((photo) => {
          if (photo) {
            channelRef.current?.send({
              type: "broadcast",
              event: "user_photo",
              payload: {
                photo: {
                  id: photo.id,
                  dataURL: photo.dataURL,
                  name: photo.name,
                  captureId,
                  takenAt: photo.takenAt,
                },
              },
            });
          }
        });
        return;
      }

      const seconds = Math.ceil(remainingMs / 1000);
      setCountdownText(seconds > 0 ? String(seconds) : "SMILE!");
      countdownRafId.current = requestAnimationFrame(tick);
    };

    tick();
  }, [clockOffsetMs, syncClock, playShutterSound, captureLocalPhoto]);

  // ── Channel Connection & Event Listeners ──────────────────────────────────
  useEffect(() => {
    startCamera("user");
    syncClock(4);

    // Fetch ICE/TURN servers
    fetch("/api/booth/turn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) })
      .then((res) => res.json())
      .then((data) => {
        const iceServers = data.iceServers || [];
        createPeerConnection(iceServers);
      })
      .catch(() => {
        createPeerConnection([]);
      });

    // Supabase Realtime Channel
    const channel = supabase.channel(`booth-room-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "signal" }, ({ payload }: { payload: Record<string, any> }) => {
        if (payload?.from !== myUserId && payload?.signal) {
          handleSignal(payload.signal);
        }
      })
      .on("broadcast", { event: "preview_frame" }, ({ payload }: { payload: Record<string, any> }) => {
        if (payload?.from !== myUserId && payload?.dataURL) {
          setPartnerFallbackUrl(payload.dataURL);
          setIsUsingRelay(true);
        }
      })
      .on("broadcast", { event: "countdown_start" }, ({ payload }: { payload: Record<string, any> }) => {
        if (payload?.captureId && payload?.captureAt) {
          startCountdown(payload.captureId, Number(payload.captureAt));
        }
      })
      .on("broadcast", { event: "user_photo" }, ({ payload }: { payload: Record<string, any> }) => {
        if (payload?.photo) {
          const remotePhoto: BoothPhotoItem = {
            id: payload.photo.id || crypto.randomUUID(),
            dataURL: payload.photo.dataURL,
            name: payload.photo.name || partnerName,
            isSelf: false,
            captureId: payload.photo.captureId,
            takenAt: payload.photo.takenAt,
          };
          setPartnerPhotos((prev) => [...prev, remotePhoto].slice(-MAX_PHOTOS));
        }
      })
      .on("broadcast", { event: "peer_joined" }, ({ payload }: { payload: Record<string, any> }) => {
        setIsPartnerPresent(true);
        if (payload?.name) setPartnerName(payload.name);
        setStatusMessage(`${payload?.name || "Your partner"} joined the booth!`);
        if (shouldInitiateOffer) {
          setTimeout(makeOffer, 600);
        }
      })
      .on("broadcast", { event: "finish_session" }, ({ payload }: { payload: Record<string, any> }) => {
        const combined = [...myPhotos, ...partnerPhotos].map((p) => p.dataURL);
        onFinishSession(combined, session.layout_style || "filmStrip", [...myPhotos, ...partnerPhotos]);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "peer_joined",
            payload: { name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Partner" },
          });
          if (shouldInitiateOffer) {
            setTimeout(makeOffer, 1000);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) pcRef.current.close();
      if (previewLoopTimer.current) clearInterval(previewLoopTimer.current);
      if (countdownRafId.current) cancelAnimationFrame(countdownRafId.current);
    };
  }, [sessionId, myUserId, shouldInitiateOffer, makeOffer, handleSignal, createPeerConnection, startCamera, syncClock, startCountdown, myPhotos, partnerPhotos, session.layout_style, onFinishSession, partnerName, user]);

  const handleFinish = () => {
    channelRef.current?.send({
      type: "broadcast",
      event: "finish_session",
      payload: {},
    });
    const combined = [...myPhotos, ...partnerPhotos].map((p) => p.dataURL);
    onFinishSession(combined, session.layout_style || "filmStrip", [...myPhotos, ...partnerPhotos]);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="relative min-h-[90vh] bg-[#0E0C0A] text-zinc-100 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden border border-amber-900/20">
      {/* Full-Screen White Shutter Flash Effect */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="font-mono text-sm uppercase tracking-wider text-amber-200/90 font-semibold">
              SYNCHRONIZED PHOTOBOOTH
            </h3>
            <p className="text-xs text-zinc-400">{statusMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-zinc-300 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? "Link Copied" : "Share Link"}</span>
          </button>

          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
            title="Flip Camera (Front/Back)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Curated Pose Prompt Banner */}
      <div className="max-w-md mx-auto mb-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
        <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
          CURRENT POSE PROMPT
        </span>
        <p className="font-heading italic text-sm text-amber-100 mt-0.5">
          &quot;{currentPrompt}&quot;
        </p>
      </div>

      {/* ── DUAL VIDEO TILES (YOU + PARTNER) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-6">
        {/* Your Camera Tile */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-lg flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-zinc-300">
            You ({facingMode})
          </div>

          {/* Countdown Display Overlay */}
          {isCountingDown && countdownText && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <span className="font-mono text-6xl sm:text-7xl font-extrabold text-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-pulse">
                {countdownText}
              </span>
            </div>
          )}
        </div>

        {/* Partner Camera Tile */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-lg flex items-center justify-center">
          {/* P2P WebRTC Video Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isUsingRelay ? "hidden" : "block"}`}
          />

          {/* Low-FPS Relay Preview Fallback (Active when WebRTC P2P NAT fails) */}
          {isUsingRelay && partnerFallbackUrl && (
            <img
              src={partnerFallbackUrl}
              alt="Partner Relay"
              className="w-full h-full object-cover"
            />
          )}

          {/* Waiting Placeholder if partner not yet streaming */}
          {!partnerFallbackUrl && rtcState !== "connected" && (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-mono">
                {isPartnerPresent ? "Connecting to partner's camera..." : "Waiting for partner to open the booth..."}
              </p>
            </div>
          )}

          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
            <span>{partnerName}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                rtcState === "connected" || isUsingRelay ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-[9px] text-zinc-400 uppercase">
              {rtcState === "connected" ? "HD P2P" : isUsingRelay ? "Live Relay" : "Connecting"}
            </span>
          </div>

          {/* Countdown Display on Partner Tile */}
          {isCountingDown && countdownText && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <span className="font-mono text-6xl sm:text-7xl font-extrabold text-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-pulse">
                {countdownText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Shutter Button & Controls */}
      <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto mb-6">
        <button
          onClick={triggerShutterCountdown}
          disabled={isCountingDown || myPhotos.length >= MAX_PHOTOS}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-white font-mono font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span>
            {isCountingDown
              ? "COUNTING DOWN..."
              : `SNAP SYNCHRONIZED SHOT (${myPhotos.length}/${MAX_PHOTOS})`}
          </span>
        </button>

        <p className="text-[11px] font-mono text-zinc-400">
          Server-synced countdown fires both shutters at the exact same instant
        </p>
      </div>

      {/* ── SHARED PHOTO TRAY ────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto bg-black/40 rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold">
              Shared Photo Tray ({myPhotos.length} Yours • {partnerPhotos.length} {partnerName}&apos;s)
            </h4>
          </div>

          {(myPhotos.length > 0 || partnerPhotos.length > 0) && (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase transition-all shadow-md active:scale-95"
            >
              <span>Design Photostrip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {myPhotos.length === 0 && partnerPhotos.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-500">
            No shots captured yet. Press the shutter button above to take your first synchronized photo!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {myPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-amber-500/50 bg-zinc-900 shadow-sm"
              >
                <img src={photo.dataURL} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-amber-300">
                  You #{idx + 1}
                </span>
              </div>
            ))}

            {partnerPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-rose-500/50 bg-zinc-900 shadow-sm"
              >
                <img src={photo.dataURL} alt={`Partner shot ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-rose-300">
                  {partnerName} #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
