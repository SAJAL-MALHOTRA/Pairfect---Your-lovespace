"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Mic,
  MicOff,
  Zap,
  ZapOff,
  Maximize2,
  Minimize2,
  Download,
  Heart,
  RotateCcw,
  Check,
  ChevronRight,
  Share2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  X,
  Sparkles,
  Loader2,
  Users,
  User,
  Volume2,
  VolumeX,
  ChevronLeft,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

// Filter definitions matching LensBooth looks
export type BoothFilterKey =
  | "none"
  | "soft_warm"
  | "mono_noir"
  | "golden_hour"
  | "vintage_rose"
  | "film_35mm";

interface FilterOption {
  key: BoothFilterKey;
  label: string;
  css: string;
}

const BOOTH_FILTERS: FilterOption[] = [
  { key: "none", label: "None", css: "none" },
  {
    key: "soft_warm",
    label: "Soft Warm",
    css: "brightness(1.06) saturate(1.18) sepia(0.16) contrast(1.03)",
  },
  {
    key: "mono_noir",
    label: "Mono Noir",
    css: "grayscale(1) contrast(1.28) brightness(1.02)",
  },
  {
    key: "golden_hour",
    label: "Golden Hour",
    css: "sepia(0.35) saturate(1.35) contrast(1.08) hue-rotate(6deg)",
  },
  {
    key: "vintage_rose",
    label: "Vintage Rose",
    css: "sepia(0.22) saturate(1.12) contrast(1.05) hue-rotate(-12deg)",
  },
  {
    key: "film_35mm",
    label: "Film 35mm",
    css: "contrast(1.18) saturate(0.9) sepia(0.12) brightness(0.98)",
  },
];

// Strip styles matching reference
export type StripStyleKey = "classic" | "retro_film" | "web_rush";

interface StripStyleOption {
  key: StripStyleKey;
  label: string;
}

const STRIP_STYLES: StripStyleOption[] = [
  { key: "classic", label: "Classic" },
  { key: "retro_film", label: "Retro Film" },
  { key: "web_rush", label: "Web Rush" },
];

// Background textures
export type BackgroundTheme = "grid" | "parchment" | "blush" | "pastel";

interface BackgroundOption {
  key: BackgroundTheme;
  label: string;
  className: string;
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { key: "grid", label: "Pairfect Grid", className: "booth-grid-canvas paper-grain" },
  { key: "parchment", label: "Cozy Paper", className: "bg-[var(--bg)] paper-grain" },
  { key: "blush", label: "Rose Sanctuary", className: "bg-[#FFEBF0] paper-grain" },
  { key: "pastel", label: "Candy Pink", className: "bg-[#FFF0F4] paper-grain" },
];

// Festive Decorative SVGs for Web Rush Candy Love Style
function PeppermintCandy({ className = "w-4 h-4 text-red-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M12 4 C12 8, 14 10, 12 12 C10 14, 12 16, 12 20" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M4 12 C8 12, 10 14, 12 12 C14 10, 16 12, 20 12" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M6.3 6.3 C9 9, 11 11, 12 12 C13 13, 15 15, 17.7 17.7" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M17.7 6.3 C15 9, 13 11, 12 12 C11 13, 9 15, 6.3 17.7" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M3 8 L4 12 L3 16 Z" fill="#EF4444" />
      <path d="M21 8 L20 12 L21 16 Z" fill="#EF4444" />
    </svg>
  );
}

function CandyCane({ className = "w-5 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 36" fill="none">
      <path
        d="M6 34 L6 14 C6 8, 18 8, 18 14"
        stroke="#DC2626"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M4 30 L8 28" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 24 L8 22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 18 L8 16" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 11 L11 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 9 L17 11" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleStar({ className = "w-3 h-3 text-red-500 fill-red-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 0 L14 9 L23 12 L14 15 L12 24 L10 15 L1 12 L10 9 Z" />
    </svg>
  );
}

function formatBoothDate(date: Date = new Date()): string {
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${month} ${day}, ${year} • ${time}`;
}

// Center-crop drawing helper for canvas
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgW =
    (img as HTMLVideoElement).videoWidth ||
    (img as HTMLImageElement).naturalWidth ||
    (img as any).width ||
    640;
  const imgH =
    (img as HTMLVideoElement).videoHeight ||
    (img as HTMLImageElement).naturalHeight ||
    (img as any).height ||
    480;
  const imgRatio = imgW / imgH;
  const targetRatio = w / h;
  let sx = 0,
    sy = 0,
    sWidth = imgW,
    sHeight = imgH;

  if (imgRatio > targetRatio) {
    sWidth = imgH * targetRatio;
    sx = (imgW - sWidth) / 2;
  } else {
    sHeight = imgW / targetRatio;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

// Rounded rect helper for canvas
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function generateBoothCode(length = 4): string {
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  return code;
}

interface LensBoothViewProps {
  initialSessionId?: string | null;
  initialMode?: "lobby" | "solo" | "duo" | null;
  onExit?: () => void;
}

export default function LensBoothView({
  initialSessionId,
  initialMode,
  onExit,
}: LensBoothViewProps) {
  const { user, profile, pair, partner } = useAuth();
  const supabase = createClient();

  // Mode: "lobby" | "solo" | "duo"
  const [boothMode, setBoothMode] = useState<"lobby" | "solo" | "duo">(() => {
    if (initialSessionId) return "duo";
    if (initialMode === "solo") return "solo";
    if (initialMode === "duo") return "duo";
    return "lobby";
  });

  const [boothCode, setBoothCode] = useState<string>(() => {
    if (initialSessionId) return initialSessionId.toUpperCase();
    return generateBoothCode(4);
  });

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Screen flow: "capture" | "result"
  const [screen, setScreen] = useState<"capture" | "result">("capture");

  // Camera and controls state
  const [zoom, setZoom] = useState<0.5 | 1 | 2>(1);
  const [isMirrored, setIsMirrored] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<BoothFilterKey>("none");
  const [selectedBackground, setSelectedBackground] = useState<BackgroundTheme>("grid");

  // Popovers
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [showBgTray, setShowBgTray] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Capture sequence state
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);

  // Result strip state
  const [selectedStripStyle, setSelectedStripStyle] = useState<StripStyleKey>("web_rush");
  const [resultFilter, setResultFilter] = useState<BoothFilterKey>("none");
  const [isExporting, setIsExporting] = useState(false);

  // Photostrip printing animation state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStep, setPrintStep] = useState<number>(4); // 0: slit retracted, 1: inch 1, 2: inch 2, 3: inch 3, 4: settled

  // Room / WebRTC state
  const roomId = boothCode || initialSessionId || pair?.id || "pairfect-booth-room";
  const [isPartnerConnected, setIsPartnerConnected] = useState(false);
  const [partnerDisplayName, setPartnerDisplayName] = useState<string>(
    partner?.display_name || "Partner"
  );
  const [partnerFallbackUrl, setPartnerFallbackUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const isInitiatorRef = useRef(false);
  const runCaptureFlowRef = useRef<() => void>(() => {});

  const currentFilterObj = BOOTH_FILTERS.find((f) => f.key === activeFilter) || BOOTH_FILTERS[0];
  const currentResultFilterObj = BOOTH_FILTERS.find((f) => f.key === resultFilter) || BOOTH_FILTERS[0];

  // Synthesize camera shutter click sound
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

  // Synthesize photobooth mechanical roller click & stepper motor pulse
  const playPrinterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(155, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(135, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio autoplay policy
    }
  }, []);

  // Stepped mechanical printer feed animation
  const triggerPrintAnimation = useCallback(async () => {
    setIsPrinting(true);
    setPrintStep(0);
    playPrinterSound();
    await new Promise((r) => setTimeout(r, 300));
    setPrintStep(1);
    playPrinterSound();
    await new Promise((r) => setTimeout(r, 700));
    setPrintStep(2);
    playPrinterSound();
    await new Promise((r) => setTimeout(r, 700));
    setPrintStep(3);
    playPrinterSound();
    await new Promise((r) => setTimeout(r, 750));
    setPrintStep(4);
    setIsPrinting(false);
  }, [playPrinterSound]);

  // Auto-trigger print animation upon entering result screen
  useEffect(() => {
    if (screen === "result") {
      triggerPrintAnimation();
    }
  }, [screen, triggerPrintAnimation]);

  // Chemical photo developing filter transition
  const getFrameFilter = useCallback(
    (idx: number) => {
      if (isPrinting && printStep < (idx === 0 ? 2 : idx === 1 ? 3 : 4)) {
        return "sepia(0.75) saturate(0.4) contrast(0.85) brightness(1.15)";
      }
      return currentResultFilterObj.css;
    },
    [isPrinting, printStep, currentResultFilterObj.css]
  );

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: { from: user.id, signal: { candidate: event.candidate } },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsPartnerConnected(true);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [user]);

  // Handle incoming WebRTC signal
  const handleSignal = useCallback(
    async (signal: any) => {
      const pc = pcRef.current || createPeerConnection();
      try {
        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channelRef.current?.send({
              type: "broadcast",
              event: "signal",
              payload: { from: user?.id, signal: { sdp: pc.localDescription } },
            });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn("WebRTC signal error:", err);
      }
    },
    [createPeerConnection, user]
  );

  // Send WebRTC Offer
  const makeOffer = useCallback(async () => {
    const pc = pcRef.current || createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { from: user?.id, signal: { sdp: pc.localDescription } },
      });
    } catch (err) {
      console.warn("WebRTC offer error:", err);
    }
  }, [createPeerConnection, user]);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 800 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to existing PC if available
      if (pcRef.current) {
        stream.getTracks().forEach((track) => {
          pcRef.current?.addTrack(track, stream);
        });
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (boothMode !== "lobby" && screen === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [boothMode, screen, startCamera, stopCamera]);

  // Realtime Supabase Channel for synchronized booth and partner video
  useEffect(() => {
    if (boothMode !== "duo" || !roomId) return;

    const myName =
      profile?.display_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "You";

    const channel = supabase.channel(`booth-room-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "peer_joined" }, ({ payload }: { payload: any }) => {
        setIsPartnerConnected(true);
        if (payload?.name) setPartnerDisplayName(payload.name);

        // Offerer determination: deterministic by ID
        if (user && payload?.id && user.id < payload.id) {
          isInitiatorRef.current = true;
          setTimeout(makeOffer, 800);
        }
      })
      .on("broadcast", { event: "signal" }, ({ payload }: { payload: any }) => {
        if (payload?.from !== user?.id && payload?.signal) {
          handleSignal(payload.signal);
        }
      })
      .on("broadcast", { event: "preview_frame" }, ({ payload }: { payload: any }) => {
        if (payload?.from !== user?.id && payload?.dataURL) {
          setPartnerFallbackUrl(payload.dataURL);
          setIsPartnerConnected(true);
        }
      })
      .on("broadcast", { event: "trigger_capture" }, () => {
        // Partner triggered the capture sequence
        runCaptureFlowRef.current?.();
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "peer_joined",
            payload: { id: user?.id, name: myName },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [boothMode, roomId, user, profile, partner, makeOffer, handleSignal]);

  // Handle Mute toggle
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Capture single 50/50 dual-split frame
  const captureDualSplitFrame = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const halfW = canvas.width / 2; // 640
    const h = canvas.height; // 800

    // 1. Draw Left Half (Local Camera)
    const localVid = localVideoRef.current;
    if (localVid && localVid.readyState >= 2 && localVid.videoWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW, h);
      ctx.clip();
      if (isMirrored) {
        ctx.translate(halfW, 0);
        ctx.scale(-1, 1);
        drawImageCover(ctx, localVid, 0, 0, halfW, h);
      } else {
        drawImageCover(ctx, localVid, 0, 0, halfW, h);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#27272A";
      ctx.fillRect(0, 0, halfW, h);
      ctx.fillStyle = "#E8527D";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("You ♡", halfW / 2, h / 2);
    }

    // 2. Draw Right Half (Partner Camera or Local Duo)
    const remoteVid = remoteVideoRef.current;
    const hasRemote =
      remoteVid && remoteVid.readyState >= 2 && remoteVid.videoWidth > 0;
    if (hasRemote) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfW, 0, halfW, h);
      ctx.clip();
      drawImageCover(ctx, remoteVid, halfW, 0, halfW, h);
      ctx.restore();
    } else if (localVid && localVid.readyState >= 2 && localVid.videoWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfW, 0, halfW, h);
      ctx.clip();
      drawImageCover(ctx, localVid, halfW, 0, halfW, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#18181B";
      ctx.fillRect(halfW, 0, halfW, h);
      ctx.fillStyle = "#FAF5EB";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(partnerDisplayName || "Partner ♡", halfW + halfW / 2, h / 2);
    }

    // Vertical seam divider
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, h);
    ctx.stroke();

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [isMirrored, partnerDisplayName]);

  // Capture full frame for solo mode
  const captureSoloFrame = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const localVid = localVideoRef.current;
    if (localVid && localVid.readyState >= 2 && localVid.videoWidth > 0) {
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      drawImageCover(ctx, localVid, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = "#18181B";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [isMirrored]);

  // Execute 3-shot automated sequence
  const runCaptureFlow = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setShowFilterTray(false);
    setShowBgTray(false);

    const shots: string[] = [];

    for (let shotIdx = 0; shotIdx < 3; shotIdx++) {
      setCurrentShotIndex(shotIdx);

      // Countdown 3, 2, 1
      for (let c = 3; c > 0; c--) {
        setCountdownNumber(c);
        await new Promise((r) => setTimeout(r, 900));
      }

      // Heart / smile flash
      setCountdownNumber(0);
      await new Promise((r) => setTimeout(r, 350));
      setCountdownNumber(null);

      // Shutter sound and flash
      playShutterSound();
      if (flashEnabled) {
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 240);
      }

      const frameData = boothMode === "solo" ? captureSoloFrame() : captureDualSplitFrame();
      shots.push(frameData);
      setCapturedFrames([...shots]);

      // Pause between shots so couple can switch poses
      if (shotIdx < 2) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setIsCapturing(false);
    // Transition to Print Result screen
    setTimeout(() => {
      setResultFilter(activeFilter);
      setScreen("result");
    }, 500);
  }, [
    isCapturing,
    boothMode,
    flashEnabled,
    playShutterSound,
    captureSoloFrame,
    captureDualSplitFrame,
    activeFilter,
  ]);

  runCaptureFlowRef.current = runCaptureFlow;

  // User click trigger: broadcasts to partner and runs locally
  const startCaptureSequence = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "trigger_capture",
        payload: {},
      });
    }
    runCaptureFlow();
  };

  // Load image helper for canvas export
  const loadImageAsync = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // High-Resolution 300 DPI Canvas Strip Rendering
  const renderStripToCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 2450;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const W = canvas.width;
    const H = canvas.height;
    const dateStr = formatBoothDate();
    const filterCss = currentResultFilterObj.css;

    // Load captured frames
    const framesToLoad =
      capturedFrames.length >= 3
        ? capturedFrames.slice(0, 3)
        : Array.from({ length: 3 }).map(
            (_, i) =>
              capturedFrames[i] ||
              capturedFrames[0] ||
              (boothMode === "solo" ? captureSoloFrame() : captureDualSplitFrame())
          );

    const loadedImages = await Promise.all(framesToLoad.map(loadImageAsync));

    if (selectedStripStyle === "retro_film") {
      // 35mm Retro Film Strip
      ctx.fillStyle = "#121214";
      ctx.fillRect(0, 0, W, H);

      // Film sprockets along left and right borders
      const sprocketPitch = 55;
      const totalSprockets = Math.floor(H / sprocketPitch);
      for (let i = 0; i < totalSprockets; i++) {
        const sy = i * sprocketPitch + 16;
        ctx.fillStyle = "#E4E4E7";
        drawRoundedRect(ctx, 16, sy, 18, 30, 4);
        ctx.fill();
        drawRoundedRect(ctx, W - 34, sy, 18, 30, 4);
        ctx.fill();
      }

      // Top title
      ctx.fillStyle = "#E4E4E7";
      ctx.font = "bold 26px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";
      ctx.fillText("PAIRFECT 400 • VIRTUAL BOOTH", W / 2, 70);

      const marginX = 58;
      const frameW = W - marginX * 2;
      const frameH = 590;
      const startY = 110;
      const gapY = 40;

      loadedImages.forEach((img, idx) => {
        if (!img) return;
        const fy = startY + idx * (frameH + gapY);

        ctx.save();
        if (filterCss !== "none") ctx.filter = filterCss;
        drawRoundedRect(ctx, marginX, fy, frameW, frameH, 8);
        ctx.clip();
        drawImageCover(ctx, img, marginX, fy, frameW, frameH);
        ctx.restore();

        // Frame number annotation
        ctx.fillStyle = "#71717A";
        ctx.font = "bold 18px ui-monospace, monospace";
        ctx.fillText(`▲ ${idx + 24}A`, marginX + 16, fy + frameH + 26);
      });

      // Footer
      ctx.fillStyle = "#A1A1AA";
      ctx.font = "bold 20px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(dateStr, W / 2, H - 40);
    } else if (selectedStripStyle === "classic") {
      // Classic Clean Paper Strip
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = "#18181B";
      ctx.font = "bold 44px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("Pairfect ❤️", W / 2, 85);

      const marginX = 54;
      const frameW = W - marginX * 2;
      const frameH = 610;
      const startY = 125;
      const gapY = 36;

      loadedImages.forEach((img, idx) => {
        if (!img) return;
        const fy = startY + idx * (frameH + gapY);

        ctx.save();
        ctx.fillStyle = "#09090B";
        drawRoundedRect(ctx, marginX - 4, fy - 4, frameW + 8, frameH + 8, 12);
        ctx.fill();
        ctx.restore();

        ctx.save();
        if (filterCss !== "none") ctx.filter = filterCss;
        drawRoundedRect(ctx, marginX, fy, frameW, frameH, 10);
        ctx.clip();
        drawImageCover(ctx, img, marginX, fy, frameW, frameH);
        ctx.restore();
      });

      // Footer
      ctx.fillStyle = "#52525B";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(dateStr, W / 2, H - 55);
    } else {
      // Web Rush / Candy Love Strip matching reference image
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);

      // Top logo
      ctx.fillStyle = "#DC2626";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pairfect  ❤️", W / 2, 90);

      // Draw festive candy cane decorations in canvas
      ctx.save();
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(80, 80, 40, Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(80, 160);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(W - 80, 80, 40, 1.2 * Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 80, 80);
      ctx.lineTo(W - 80, 160);
      ctx.stroke();
      ctx.restore();

      const marginX = 56;
      const frameW = W - marginX * 2;
      const frameH = 600;
      const startY = 130;
      const gapY = 38;

      loadedImages.forEach((img, idx) => {
        if (!img) return;
        const fy = startY + idx * (frameH + gapY);

        // Red frame outer border
        ctx.save();
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 6;
        drawRoundedRect(ctx, marginX - 3, fy - 3, frameW + 6, frameH + 6, 8);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        if (filterCss !== "none") ctx.filter = filterCss;
        drawRoundedRect(ctx, marginX, fy, frameW, frameH, 6);
        ctx.clip();
        drawImageCover(ctx, img, marginX, fy, frameW, frameH);
        ctx.restore();

        // Decorative candy swirls between frames
        if (idx < 2) {
          const cy = fy + frameH + gapY / 2;
          ctx.save();
          ctx.fillStyle = "#EF4444";
          ctx.beginPath();
          ctx.arc(30, cy, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(W - 30, cy, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Bottom candy ribbons
      ctx.save();
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(70, H - 80);
      ctx.lineTo(70, H - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 70, H - 80);
      ctx.lineTo(W - 70, H - 30);
      ctx.stroke();
      ctx.restore();

      // Footer
      ctx.fillStyle = "#18181B";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(dateStr, W / 2, H - 55);
    }

    return canvas;
  };

  // Download high-resolution PNG
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderStripToCanvas();
      const link = document.createElement("a");
      link.download = `pairfect-booth-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // Retake photos
  const handleRetake = () => {
    setCapturedFrames([]);
    setCurrentShotIndex(0);
    setScreen("capture");
  };

  // Mode selection and navigation handlers
  const handleStartSolo = () => {
    setBoothMode("solo");
    setScreen("capture");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + "?mode=solo");
    }
  };

  const handleStartDuoWithCode = () => {
    const code = generateBoothCode(4);
    setBoothCode(code);
    setBoothMode("duo");
    setScreen("capture");
    setShowShareModal(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + `?code=${code}`);
    }
  };

  const handleQuickStartDuoWithPartner = () => {
    const code = pair?.id?.slice(0, 4).toUpperCase() || generateBoothCode(4);
    setBoothCode(code);
    setBoothMode("duo");
    setScreen("capture");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + `?code=${code}`);
    }
  };

  const handleJoinDuoWithCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = joinCodeInput.trim().toUpperCase();
    if (clean.length < 3) {
      setJoinError("Please enter a valid booth code.");
      return;
    }
    setJoinError(null);
    setBoothCode(clean);
    setBoothMode("duo");
    setScreen("capture");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + `?code=${clean}`);
    }
  };

  const handleBackToLobby = () => {
    stopCamera();
    setBoothMode("lobby");
    setScreen("capture");
    setCapturedFrames([]);
    setIsCapturing(false);
    setCountdownNumber(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (onExit) onExit();
  };

  // Get full invite URL for Duo mode
  const getInviteUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/photo-booth?code=${boothCode}`;
  };

  // Share room link handler
  const handleCopyShareLink = async () => {
    const url = getInviteUrl();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Applied zoom transform style
  const getZoomScale = () => {
    if (zoom === 0.5) return 0.85;
    if (zoom === 2) return 1.6;
    return 1;
  };

  const bgConfig =
    BACKGROUND_OPTIONS.find((b) => b.key === selectedBackground) ||
    BACKGROUND_OPTIONS[0];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen relative flex flex-col justify-between transition-colors duration-300 ${bgConfig.className}`}
    >
      {/* Screen White Flash */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {boothMode !== "lobby" ? (
            <button
              onClick={handleBackToLobby}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#F5CAD6] hover:border-pink-300 text-[var(--text)] flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Return to mode selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : onExit ? (
            <button
              onClick={onExit}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#F5CAD6] hover:border-pink-300 text-[var(--text)] flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#F5CAD6] hover:border-pink-300 text-[var(--text)] flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <span className="font-pixel text-[11px] sm:text-xs tracking-wider bg-[var(--burgundy)] text-white px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg font-bold shadow-xs select-none">
            PAIRFECT
          </span>
          <h1 className="font-pixel text-sm sm:text-lg tracking-wider text-[var(--text)] uppercase">
            PHOTO BOOTH
          </h1>
        </div>

        {/* Room / Partner Indicator & Invite Button */}
        <div className="flex items-center gap-2">
          {boothMode === "lobby" ? (
            partner?.display_name ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-mono font-medium">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>{partner.display_name} • In Pair</span>
              </div>
            ) : null
          ) : boothMode === "solo" ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono font-medium">
                <User className="w-3.5 h-3.5 text-zinc-600" />
                <span>Solo Mode</span>
              </div>
              <button
                onClick={handleStartDuoWithCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-300 text-xs font-semibold text-zinc-800 shadow-xs cursor-pointer transition-all hover:scale-102"
              >
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>Switch to Duo</span>
              </button>
            </>
          ) : (
            <>
              {isPartnerConnected ? (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium shadow-xs">
                  <span>{profile?.display_name ? `${profile.display_name} & ${partnerDisplayName}` : partnerDisplayName} • Live Connected</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-mono font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Code: {boothCode}</span>
                </div>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-300 text-xs font-semibold text-zinc-800 shadow-xs cursor-pointer transition-all hover:scale-102"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Invite Duo</span>
              </button>
            </>
          )}

          {/* Background switcher trigger */}
          <button
            onClick={() => {
              setShowBgTray(!showBgTray);
              setShowFilterTray(false);
            }}
            className="p-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 shadow-xs cursor-pointer"
            title="Canvas background"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── BACKGROUND SELECTION TRAY MODAL ── */}
      <AnimatePresence>
        {showBgTray && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-6 z-40 bg-white border border-zinc-200 rounded-2xl p-3 shadow-xl flex flex-col gap-1.5 w-44"
          >
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Background
              </span>
              <button
                onClick={() => setShowBgTray(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.key}
                onClick={() => {
                  setSelectedBackground(bg.key);
                  setShowBgTray(false);
                }}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedBackground === bg.key
                    ? "bg-zinc-900 text-white font-semibold"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {bg.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 1: LOBBY VIEW (Angie-Style Photobooth Split Screen)
          ════════════════════════════════════════════════════════════════════════ */}
      {screen === "capture" && boothMode === "lobby" && (
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
            {/* Left Column: Actions & Details */}
            <div className="lg:col-span-7 space-y-6 max-w-lg mx-auto lg:mx-0">
              {/* Back to Activities */}
              <Link
                href="/play"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Activities</span>
              </Link>

              {/* Tag & Heading */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE4E8] text-rose-600 font-mono text-xs font-bold tracking-wider">
                  <span>인생네컷 · for two</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
                  Photobooth
                </h1>
                <p className="text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
                  One photo strip, both of you in it, taken from two places at once.
                </p>
              </div>

              {/* Primary Action: Start a room */}
              <motion.button
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
                type="button"
                onClick={partner?.display_name ? handleQuickStartDuoWithPartner : handleStartDuoWithCode}
                className="w-full p-4 sm:p-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-between shadow-md transition-all cursor-pointer group text-left border-2 border-stone-900"
              >
                <div>
                  <p className="font-heading font-bold text-base sm:text-lg text-white">
                    Start a room
                  </p>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">
                    {partner?.display_name ? `with ${partner.display_name}` : "with your partner"}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>

              {/* Secondary Action: Join a room */}
              <div className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-400 shadow-xs transition-all text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-base text-stone-900">
                      Join a room
                    </p>
                    <p className="text-xs text-stone-500 font-sans">
                      with a code
                    </p>
                  </div>
                </div>
                <form onSubmit={handleJoinDuoWithCode} className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setJoinError(null);
                    }}
                    placeholder="ENTER CODE (E.G. P7K4)"
                    className="flex-1 px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-stone-300 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-900"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    type="submit"
                    disabled={joinCodeInput.trim().length < 3}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    Join
                  </motion.button>
                </form>
                {joinError && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-mono">{joinError}</p>
                )}
              </div>

              {/* Other ways to play */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 text-center sm:text-left">
                  Other ways to play
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Just me */}
                  <motion.button
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    type="button"
                    onClick={handleStartSolo}
                    className="p-3.5 rounded-2xl bg-[#FFEBEF] hover:bg-[#FFDFE7] border border-rose-200 flex flex-col items-center justify-center text-center cursor-pointer group shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-heading font-bold text-stone-900">Just me</span>
                  </motion.button>

                  {/* Friends, one camera */}
                  <motion.button
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    type="button"
                    onClick={handleStartSolo}
                    className="p-3.5 rounded-2xl bg-[#E8F3FF] hover:bg-[#DBECFF] border border-blue-200 flex flex-col items-center justify-center text-center cursor-pointer group shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-heading font-bold text-stone-900 leading-tight">Friends, 1 cam</span>
                  </motion.button>

                  {/* Group of 4 */}
                  <motion.button
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    type="button"
                    onClick={handleStartDuoWithCode}
                    className="p-3.5 rounded-2xl bg-[#F0EBFF] hover:bg-[#E5DDFF] border border-purple-200 flex flex-col items-center justify-center text-center cursor-pointer group shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-heading font-bold text-stone-900">Group of 4</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right Column: Physical 3D Photobooth Dispenser with 4-Cut Strip */}
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="lg:col-span-5 flex flex-col items-center justify-center relative py-6"
            >
              {/* Dispenser Status Indicator Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-700 shadow-md mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-stone-300">
                  LENSBOOTH DISPENSER READY
                </span>
              </div>

              {/* Dispenser Hardware Slot Mouth */}
              <div className="w-64 sm:w-72 h-7 bg-gradient-to-b from-stone-800 via-stone-900 to-black rounded-full shadow-[0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.2)] relative z-20 flex items-center justify-center border border-stone-700">
                <div className="w-48 sm:w-52 h-2 bg-black rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] relative overflow-hidden flex items-center justify-center">
                  <motion.div
                    className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Emerging 4-Cut Vertical Photo Strip with realistic vertical dispensing slide-down */}
              <motion.div
                initial={{ y: -260, opacity: 0 }}
                animate={{ y: -6, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 24,
                  delay: 0.35,
                }}
                className="w-52 sm:w-56 bg-white p-2.5 rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] space-y-2 border-x-2 border-b-2 border-stone-200 relative z-10"
              >
                {[
                  { src: "/booth/monkey-heart.jpg", alt: "Heart hands pose", caption: "FRAME #01" },
                  { src: "/booth/monkey-point.jpg", alt: "Pointing pose", caption: "FRAME #02" },
                  { src: "/booth/monkey-shock.jpg", alt: "Scream surprise pose", caption: "FRAME #03" },
                  { src: "/booth/monkey-heart.jpg", alt: "Big smile pose", caption: "FRAME #04" },
                ].map((frame, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shadow-xs group"
                  >
                    <motion.div
                      initial={{
                        filter: "sepia(0.8) saturate(0.35) contrast(0.85) brightness(1.15)",
                      }}
                      animate={{
                        filter: "sepia(0) saturate(1.15) contrast(1.05) brightness(1)",
                      }}
                      transition={{
                        duration: 2.2,
                        delay: 0.9 + idx * 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="w-full h-full relative"
                    >
                      <Image
                        src={frame.src}
                        alt={frame.alt}
                        fill
                        className="object-cover"
                        sizes="220px"
                      />
                    </motion.div>

                    {/* Developing Shimmer Overlay */}
                    <motion.div
                      initial={{ opacity: 0.7, top: "-10%" }}
                      animate={{ opacity: 0, top: "110%" }}
                      transition={{
                        duration: 1.6,
                        delay: 0.9 + idx * 0.45,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-white/60 to-transparent pointer-events-none"
                    />

                    {/* Frame index pill */}
                    <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[8px] font-mono font-bold text-white tracking-wider">
                      {frame.caption}
                    </span>
                  </div>
                ))}

                <div className="pt-1.5 pb-0.5 text-center">
                  <p className="text-[10px] font-mono tracking-widest text-stone-500 font-bold uppercase">
                    PAIRFECT : MEMORIES
                  </p>
                  <p className="text-[9px] font-mono text-stone-400">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </main>
      )}

      {/* SCREEN 1: CAPTURE SCREEN (When boothMode === "solo" or "duo") */}
      {screen === "capture" && boothMode !== "lobby" && (
        <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 sm:gap-8 px-4 py-2 max-w-6xl mx-auto w-full">
          {/* Left / Center Viewfinder & Controls */}
          <div className="flex-1 flex flex-col items-center w-full max-w-2xl sm:max-w-3xl">
            {/* Main Viewfinder Container */}
            <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-[28px] sm:rounded-[32px] overflow-hidden border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-center">
              {boothMode === "solo" ? (
                /* SOLO SINGLE CAMERA VIEWFINDER */
                <div className="relative w-full h-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      transform: `${isMirrored ? "scaleX(-1)" : "none"} scale(${getZoomScale()})`,
                      filter: currentFilterObj.css,
                    }}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-xs text-[10px] font-mono text-white/90 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-red-400" />
                    <span>Solo Studio</span>
                  </div>
                </div>
              ) : (
                /* DUO 50/50 DUAL-SPLIT VIEWFINDER */
                <div className="w-full h-full grid grid-cols-2">
                  {/* Left Pane: You */}
                  <div className="relative w-full h-full overflow-hidden bg-zinc-900 border-r border-black/20 flex items-center justify-center">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        transform: `${isMirrored ? "scaleX(-1)" : "none"} scale(${getZoomScale()})`,
                        filter: currentFilterObj.css,
                      }}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] font-mono text-white/90">
                      You
                    </div>
                  </div>

                  {/* Right Pane: Partner or Friendly Waiting State */}
                  <div className="relative w-full h-full overflow-hidden bg-zinc-850 flex items-center justify-center">
                    {/* P2P WebRTC Video Stream */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        transform: `scale(${getZoomScale()})`,
                        filter: currentFilterObj.css,
                      }}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isPartnerConnected ? "block" : "hidden"
                      }`}
                    />

                    {/* Low-FPS Relay Fallback */}
                    {partnerFallbackUrl && !remoteVideoRef.current?.srcObject && (
                      <img
                        src={partnerFallbackUrl}
                        alt="Partner Relay"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Friendly Waiting Card when partner not connected yet */}
                    {!isPartnerConnected && !partnerFallbackUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 text-white">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-2.5 animate-pulse">
                          <Heart className="w-6 h-6 text-red-400 fill-red-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-white/95">
                          Waiting for {partnerDisplayName}...
                        </p>
                        <div className="mt-2 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono font-bold tracking-widest text-amber-300">
                          Code: {boothCode}
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={handleCopyShareLink}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-700" /> Copy Link
                              </>
                            )}
                          </button>
                        </div>
                        <button
                          onClick={handleStartSolo}
                          className="mt-2.5 text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                        >
                          Switch to Solo Photobooth
                        </button>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] font-mono text-white/90 flex items-center gap-1.5 z-10">
                      <span>{partnerDisplayName}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPartnerConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Countdown Overlay during capture sequence */}
              <AnimatePresence>
                {countdownNumber !== null && (
                  <motion.div
                    key={countdownNumber}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="absolute inset-0 bg-black/35 backdrop-blur-xs flex flex-col items-center justify-center z-30 pointer-events-none"
                  >
                    <span className="font-display font-extrabold text-7xl sm:text-8xl text-white drop-shadow-lg">
                      {countdownNumber === 0 ? "♡" : countdownNumber}
                    </span>
                    <span className="text-white/90 font-mono text-xs uppercase tracking-widest mt-3">
                      Shot {currentShotIndex + 1} of 3
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Expand Button (Bottom-Right inside viewfinder) */}
              <button
                onClick={toggleFullscreen}
                className="absolute bottom-3 right-3 bg-white hover:bg-zinc-100 text-zinc-900 p-2 rounded-xl shadow-md z-20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Floating Frosted Glass Dock matching photobooth_studio_redesign */}
            <div className="w-auto mx-auto mt-4 px-4 sm:px-6 py-2.5 rounded-full bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgba(232,82,125,0.12)] flex items-center justify-center gap-2.5 sm:gap-3.5 z-20">
              {/* Speaker / Volume Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-10 h-10 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                title={isMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-zinc-700" />}
              </button>

              {/* Mic / Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-10 h-10 rounded-full bg-white hover:bg-zinc-50 border text-zinc-700 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer ${
                  isMuted ? "border-red-300 text-red-500 bg-red-50/50" : "border-zinc-200"
                }`}
                title={isMuted ? "Unmute mic" : "Mute mic"}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-zinc-700" />}
              </button>

              {/* Centerpiece Burgundy Capture Button */}
              <button
                disabled={isCapturing}
                onClick={startCaptureSequence}
                className="h-12 px-6 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ring-4 ring-[#E8527D]/20 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture (3 Snaps)</span>
              </button>

              {/* Flash Button */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="w-10 h-10 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                title={flashEnabled ? "Screen flash enabled" : "Screen flash disabled"}
              >
                {flashEnabled ? (
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />
                ) : (
                  <ZapOff className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Zoom Selector Inside Dock */}
              <div className="flex items-center gap-0.5 bg-zinc-100 rounded-full p-0.5 border border-zinc-200/80">
                {([0.5, 1, 2] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                      zoom === z
                        ? "bg-white text-zinc-900 shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>

            {/* Circular Filter Carousel directly underneath the dock */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 w-full overflow-x-auto pb-1">
              <button
                onClick={() => {
                  const idx = BOOTH_FILTERS.findIndex((f) => f.key === activeFilter);
                  const prevIdx = (idx - 1 + BOOTH_FILTERS.length) % BOOTH_FILTERS.length;
                  setActiveFilter(BOOTH_FILTERS[prevIdx].key);
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-white/60 transition-colors cursor-pointer"
                title="Previous look"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 sm:gap-3.5">
                {BOOTH_FILTERS.map((f) => {
                  const isActive = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 transition-all ${
                          isActive
                            ? "border-2 border-[var(--burgundy)] scale-105 ring-2 ring-[#E8527D]/30 shadow-xs"
                            : "border-2 border-white hover:border-zinc-300 opacity-80 group-hover:opacity-100"
                        }`}
                      >
                        <div
                          className="w-full h-full rounded-full bg-gradient-to-tr from-rose-300 via-amber-100 to-rose-200 shadow-inner flex items-center justify-center text-[10px] font-bold text-zinc-800"
                          style={{ filter: f.css }}
                        >
                          <span className="text-[9px] uppercase font-mono tracking-tight">Look</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? "text-[var(--burgundy)] font-bold"
                            : "text-zinc-600 group-hover:text-zinc-900"
                        }`}
                      >
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  const idx = BOOTH_FILTERS.findIndex((f) => f.key === activeFilter);
                  const nextIdx = (idx + 1) % BOOTH_FILTERS.length;
                  setActiveFilter(BOOTH_FILTERS[nextIdx].key);
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-white/60 transition-colors cursor-pointer"
                title="Next look"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Realistic 3D Film Strip Dispenser matching mockup */}
          <div className="hidden lg:flex flex-col items-center w-60 shrink-0">
            <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-3.5 border border-[var(--border)] shadow-[0_12px_36px_rgba(232,82,125,0.08)] flex flex-col items-center">
              {/* Dispenser Slot Frame */}
              <div className="w-full h-5 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-inner mb-3 flex items-center justify-center">
                <span className="w-20 h-1 rounded-full bg-zinc-600/50" />
              </div>

              {/* 3-Shot Photostrip Sliding Out */}
              <div className="w-full bg-[#18181B] rounded-xl p-2.5 shadow-md flex flex-col items-center gap-2 border border-zinc-700">
                {/* 3 Photostrip Frame Windows */}
                {[0, 1, 2].map((idx) => {
                  const frame = capturedFrames[idx];
                  return (
                    <div
                      key={idx}
                      className="w-full aspect-[16/10] rounded-xs bg-zinc-900 border border-white/20 overflow-hidden relative flex items-center justify-center"
                    >
                      {frame ? (
                        <img
                          src={frame}
                          alt={`Snap ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-500">
                          <Camera className="w-4 h-4 text-zinc-600" />
                          <span className="text-[9px] font-mono uppercase tracking-wider">
                            Frame #{idx + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Date & Film Branding */}
                <div className="text-center pt-1">
                  <p className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {new Date().toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[9px] font-pixel text-rose-400/90 tracking-widest mt-0.5">
                    PAIRFECT 400
                  </p>
                </div>
              </div>

              {/* Save & Print Button */}
              <button
                disabled={capturedFrames.length === 0}
                onClick={() => setScreen("result")}
                className="mt-3.5 w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 text-rose-300" />
                <span>Save & Print Strip</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 2: PRINT RESULT SCREEN (Matching media_1790804993028.png)
          ════════════════════════════════════════════════════════════════════════ */}
      {screen === "result" && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-10 sm:gap-14">
          {/* ── LEFT COLUMN: 3D Molded Dispenser Mouth & Sliding Photo Strip ── */}
          <div className="flex flex-col items-center relative">
            {/* Dispenser Status Indicator Badge */}
            <div className="absolute -top-3.5 z-30 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 shadow-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPrinting
                    ? "bg-amber-400 animate-ping"
                    : "bg-emerald-400 shadow-[0_0_6px_#34D399]"
                }`}
              />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-300">
                {isPrinting ? "PRINTING STRIP..." : "DISPENSER READY"}
              </span>
            </div>

            {/* 3D Molded Photobooth Dispenser Slot Mouth */}
            <div className="w-72 sm:w-84 h-16 sm:h-20 bg-gradient-to-b from-[#FFFFFF] via-[#F3F3F5] to-[#DFDFE3] border border-zinc-200/90 rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.06)] relative z-20 flex items-center justify-center px-6">
              {/* Recessed dark printer slot mouth slit */}
              <div className="w-full h-7 sm:h-8 bg-[#09090B] rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.95),inset_0_-1px_2px_rgba(255,255,255,0.12)] relative overflow-hidden flex items-center justify-center">
                {/* Internal printhead roller glow during printing */}
                {isPrinting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-cyan-400/35 to-amber-400/20"
                    animate={{ opacity: [0.35, 0.9, 0.35] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            {/* Emerging Photo Strip sliding down out of the slit with stepped mechanical feed */}
            <motion.div
              initial={false}
              animate={{
                y:
                  printStep === 0
                    ? -140
                    : printStep === 1
                    ? -95
                    : printStep === 2
                    ? -60
                    : -26,
                opacity: printStep === 0 ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 24,
              }}
              className="relative z-10 w-[240px] sm:w-[260px] shadow-[0_18px_40px_rgba(0,0,0,0.15)] rounded-b-2xl overflow-hidden transition-all duration-300"
            >
              {/* Thermal / Printhead Laser Scanline Shimmer */}
              {isPrinting && (
                <motion.div
                  className="absolute inset-x-0 h-3 bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent pointer-events-none z-40 shadow-[0_0_14px_rgba(34,211,238,0.9)]"
                  animate={{
                    top: ["0%", "100%"],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Strip Style: Web Rush / Candy Love */}
              {selectedStripStyle === "web_rush" && (
                <div className="bg-white p-3.5 pt-7 pb-5 flex flex-col items-center relative border border-red-100">
                  {/* Decorative Festive Candy Cane SVGs in Corners */}
                  <div className="absolute top-2 left-2 pointer-events-none -rotate-12">
                    <CandyCane className="w-5 h-7" />
                  </div>
                  <div className="absolute top-2 right-2 pointer-events-none rotate-12 scale-x-[-1]">
                    <CandyCane className="w-5 h-7" />
                  </div>

                  {/* Sparkle Stars & Peppermints in margins */}
                  <div className="absolute top-20 left-1.5 pointer-events-none">
                    <SparkleStar className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                  </div>
                  <div className="absolute top-44 left-1.5 pointer-events-none">
                    <PeppermintCandy className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute top-68 left-1.5 pointer-events-none">
                    <SparkleStar className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                  </div>

                  <div className="absolute top-20 right-1.5 pointer-events-none">
                    <SparkleStar className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                  </div>
                  <div className="absolute top-44 right-1.5 pointer-events-none">
                    <PeppermintCandy className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute top-68 right-1.5 pointer-events-none">
                    <SparkleStar className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                  </div>

                  {/* Strip Header: Pairfect ❤️ */}
                  <div className="text-center mb-3">
                    <span className="font-sans font-extrabold text-base text-zinc-900 tracking-tight flex items-center justify-center gap-1">
                      <span>Pairfect</span>
                      <span className="text-red-500 text-sm">❤️</span>
                    </span>
                  </div>

                  {/* 3 Stacked Photo Frames with Chemical Developing Transition */}
                  <div className="w-full space-y-2.5">
                    {capturedFrames.map((frameSrc, idx) => (
                      <div
                        key={idx}
                        className="w-full aspect-[16/10] rounded-sm overflow-hidden border-2 border-red-500/90 shadow-xs bg-zinc-900"
                      >
                        <img
                          src={frameSrc}
                          alt={`Shot ${idx + 1}`}
                          style={{
                            filter: getFrameFilter(idx),
                            transition:
                              "filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Bottom Candy Canes */}
                  <div className="absolute bottom-2 left-2 pointer-events-none rotate-45">
                    <CandyCane className="w-4 h-6" />
                  </div>
                  <div className="absolute bottom-2 right-2 pointer-events-none -rotate-45 scale-x-[-1]">
                    <CandyCane className="w-4 h-6" />
                  </div>

                  {/* Strip Footer: Timestamp */}
                  <div className="mt-3.5 text-center">
                    <p className="font-mono text-[10px] font-bold text-zinc-800 tracking-wider">
                      {formatBoothDate()}
                    </p>
                  </div>
                </div>
              )}

              {/* Strip Style: Classic */}
              {selectedStripStyle === "classic" && (
                <div className="bg-white p-3.5 pt-7 pb-5 flex flex-col items-center border border-zinc-200">
                  <div className="text-center mb-3">
                    <span className="font-serif italic font-bold text-lg text-zinc-900 tracking-tight flex items-center justify-center gap-1">
                      <span>Pairfect</span>
                      <span className="text-red-500 text-sm">❤️</span>
                    </span>
                  </div>

                  <div className="w-full space-y-2.5">
                    {capturedFrames.map((frameSrc, idx) => (
                      <div
                        key={idx}
                        className="w-full aspect-[16/10] rounded-sm overflow-hidden border border-black/10 shadow-xs bg-zinc-900"
                      >
                        <img
                          src={frameSrc}
                          alt={`Shot ${idx + 1}`}
                          style={{
                            filter: getFrameFilter(idx),
                            transition:
                              "filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="font-mono text-[10px] font-medium text-zinc-600 tracking-wider">
                      {formatBoothDate()}
                    </p>
                  </div>
                </div>
              )}

              {/* Strip Style: Retro Film */}
              {selectedStripStyle === "retro_film" && (
                <div className="bg-[#141416] p-3.5 pt-7 pb-5 flex flex-col items-center relative text-zinc-300">
                  {/* Sprocket cuts on sides */}
                  <div className="absolute top-0 bottom-0 left-1 w-2 flex flex-col justify-around py-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-2.5 rounded-xs bg-[#E4E4E7]"
                      />
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 right-1 w-2 flex flex-col justify-around py-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-2.5 rounded-xs bg-[#E4E4E7]"
                      />
                    ))}
                  </div>

                  <div className="text-center mb-3">
                    <span className="font-mono text-xs font-bold text-zinc-200 tracking-wider flex items-center justify-center gap-1">
                      <span>PAIRFECT 400</span>
                      <span className="text-red-500 text-xs">❤️</span>
                    </span>
                  </div>

                  <div className="w-full px-2 space-y-2.5">
                    {capturedFrames.map((frameSrc, idx) => (
                      <div
                        key={idx}
                        className="w-full aspect-[16/10] rounded-xs overflow-hidden border border-white/20 bg-zinc-900"
                      >
                        <img
                          src={frameSrc}
                          alt={`Shot ${idx + 1}`}
                          style={{
                            filter: getFrameFilter(idx),
                            transition:
                              "filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="font-mono text-[9px] font-bold text-zinc-400 tracking-wider">
                      {formatBoothDate()}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Controls Panel (Matching media_1790804993028.png) ── */}
          <div className="flex-1 max-w-md flex flex-col gap-6 pt-2">
            {/* Title */}
            <div>
              <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-zinc-900 tracking-tight flex items-center gap-2">
                <span>Picture perfect!</span>
                <span className="text-red-500">❤️</span>
              </h1>
            </div>

            {/* FILTERS SECTION */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                FILTERS
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {/* None Filter */}
                <div className="flex flex-col items-center">
                  <motion.button
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => setResultFilter("none")}
                    className={`w-14 h-14 rounded-full border-2 bg-white flex items-center justify-center cursor-pointer transition-all ${
                      resultFilter === "none"
                        ? "border-zinc-900 ring-2 ring-zinc-900/20 shadow-xs"
                        : "border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#52525B"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
                    </svg>
                  </motion.button>
                  <span className="text-xs font-semibold text-zinc-800 mt-1.5">
                    None
                  </span>
                </div>

                {/* Styled Look Filters */}
                {BOOTH_FILTERS.filter((f) => f.key !== "none").map((f) => (
                  <div key={f.key} className="flex flex-col items-center shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => setResultFilter(f.key)}
                      className={`relative w-14 h-14 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                        resultFilter === f.key
                          ? "border-zinc-900 ring-2 ring-zinc-900/20 shadow-xs scale-105"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={capturedFrames[0] || "/assets/heart-icon.svg"}
                        alt={f.label}
                        style={{ filter: f.css }}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold text-center py-0.5 tracking-wider">
                        LOOK
                      </span>
                    </motion.button>
                    <span className="text-[11px] font-medium text-zinc-700 mt-1.5">
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STRIP STYLE SECTION */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                STRIP STYLE
              </span>
              <div className="flex items-center gap-3">
                {/* Card 1: Classic */}
                <motion.button
                  whileHover={{ y: -5, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  onClick={() => setSelectedStripStyle("classic")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all ${
                    selectedStripStyle === "classic"
                      ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="w-full flex-1 bg-zinc-50 rounded-lg p-1.5 flex flex-col gap-1 items-center justify-center">
                    <div className="w-full h-7 bg-zinc-200 rounded-xs" />
                    <div className="w-full h-7 bg-zinc-200 rounded-xs" />
                    <div className="w-full h-7 bg-zinc-200 rounded-xs" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 pt-2">
                    Classic
                  </span>
                </motion.button>

                {/* Card 2: Retro Film */}
                <motion.button
                  whileHover={{ y: -5, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  onClick={() => setSelectedStripStyle("retro_film")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all ${
                    selectedStripStyle === "retro_film"
                      ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="w-full flex-1 bg-zinc-900 rounded-lg p-1.5 flex flex-col gap-1 items-center justify-center relative">
                    <div className="w-full h-7 bg-zinc-700 rounded-xs" />
                    <div className="w-full h-7 bg-zinc-700 rounded-xs" />
                    <div className="w-full h-7 bg-zinc-700 rounded-xs" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 pt-2">
                    Retro Film
                  </span>
                </motion.button>

                {/* Card 3: Web Rush */}
                <motion.button
                  whileHover={{ y: -5, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  onClick={() => setSelectedStripStyle("web_rush")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all ${
                    selectedStripStyle === "web_rush"
                      ? "border-red-500 ring-2 ring-red-500/20 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="w-full flex-1 bg-red-50/70 border border-red-300 rounded-lg p-1.5 flex flex-col gap-1 items-center justify-center">
                    <div className="w-full h-7 bg-red-200 rounded-xs" />
                    <div className="w-full h-7 bg-red-200 rounded-xs" />
                    <div className="w-full h-7 bg-red-200 rounded-xs" />
                  </div>
                  <span className="text-xs font-bold text-red-600 pt-2">
                    Web Rush
                  </span>
                </motion.button>

                {/* Cycle Style Next Arrow */}
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 12 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  onClick={() => {
                    const styles: StripStyleKey[] = [
                      "classic",
                      "retro_film",
                      "web_rush",
                    ];
                    const nextIdx =
                      (styles.indexOf(selectedStripStyle) + 1) % styles.length;
                    setSelectedStripStyle(styles[nextIdx]);
                  }}
                  className="w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  title="Next style"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                disabled={isExporting}
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? "Rendering 300 DPI Strip..." : "Download Strip"}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                disabled={isPrinting}
                onClick={triggerPrintAnimation}
                className="w-full py-2.5 px-6 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/80 text-zinc-700 font-semibold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-600" />
                <span>
                  {isPrinting
                    ? "Printing Strip In Progress..."
                    : "Watch Print Animation Again"}
                </span>
              </motion.button>

              <div className="flex items-center justify-center gap-4 pt-1">
                <motion.button
                  whileHover={{ scale: 1.06, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={handleRetake}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Snaps</span>
                </motion.button>
                <span className="text-zinc-300">•</span>
                <motion.button
                  whileHover={{ scale: 1.06, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={handleBackToLobby}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Mode</span>
                </motion.button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── SHARE / INVITE PARTNER MODAL ── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900">
                    Invite Duo to Booth
                  </h3>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                  4-Letter Booth Code
                </span>
                <span className="font-mono text-3xl font-extrabold text-zinc-900 tracking-widest">
                  {boothCode}
                </span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed text-center">
                Share this code or link with your partner. When they open it, their live camera will link side by side with yours!
              </p>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <input
                  type="text"
                  readOnly
                  value={getInviteUrl()}
                  className="flex-1 bg-transparent text-xs text-zinc-700 outline-none truncate font-mono"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="w-full py-2 text-center">
        <span className="text-[10px] font-mono text-zinc-400">
          Pairfect LensBooth • Synchronized Memories
        </span>
      </footer>
    </div>
  );
}
