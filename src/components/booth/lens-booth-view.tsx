"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  X,
  Sparkles,
  Loader2,
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
export type BackgroundTheme = "grid" | "dark_grid" | "parchment" | "pastel";

interface BackgroundOption {
  key: BackgroundTheme;
  label: string;
  className: string;
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { key: "grid", label: "Classic Grid", className: "booth-grid-canvas" },
  { key: "dark_grid", label: "Studio Noir", className: "booth-grid-canvas-dark" },
  { key: "parchment", label: "Warm Paper", className: "bg-[#F7F2E9]" },
  { key: "pastel", label: "Candy Pink", className: "bg-[#FFF0F4]" },
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

interface LensBoothViewProps {
  initialSessionId?: string | null;
  onExit?: () => void;
}

export default function LensBoothView({
  initialSessionId,
  onExit,
}: LensBoothViewProps) {
  const { user, profile, pair, partner } = useAuth();
  const supabase = createClient();

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Room / WebRTC state
  const roomId = initialSessionId || pair?.id || "pairfect-booth-room";
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
    if (screen === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [screen, startCamera, stopCamera]);

  // Realtime Supabase Channel for synchronized booth and partner video
  useEffect(() => {
    if (!roomId) return;

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
        runCaptureFlow();
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
  }, [roomId, user, profile, partner, makeOffer, handleSignal]);

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

      const frameData = captureDualSplitFrame();
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
    flashEnabled,
    playShutterSound,
    captureDualSplitFrame,
    activeFilter,
  ]);

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
      const img = new Image();
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
            (_, i) => capturedFrames[i] || capturedFrames[0] || captureDualSplitFrame()
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

  // Save to couple scrapbook in Supabase
  const handleSaveToScrapbook = async () => {
    if (!pair) {
      alert("Sign in and link with your partner to save directly to your shared scrapbook!");
      return;
    }
    setIsSaving(true);
    try {
      const { data: stripData, error: stripErr } = await supabase
        .from("photo_strips")
        .insert({
          pair_id: pair.id,
          layout: selectedStripStyle,
          title: "LensBooth Memory Snap",
          caption: "Picture perfect!",
          frame_color: selectedStripStyle === "retro_film" ? "warm_brown" : "white",
          paper_texture: "plain",
          filter: resultFilter,
        })
        .select("id")
        .single();

      if (stripErr || !stripData) throw stripErr;

      const imageRows = capturedFrames.map((url, pos) => ({
        strip_id: stripData.id,
        url,
        position: pos,
      }));
      await supabase.from("photo_strip_images").insert(imageRows);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save scrapbook strip:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Retake photos
  const handleRetake = () => {
    setCapturedFrames([]);
    setCurrentShotIndex(0);
    setScreen("capture");
  };

  // Share room link handler
  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
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

      {/* ── TOP HEADER BAR ── */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-white/80 hover:bg-white border border-zinc-200 shadow-xs text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Return to lobby"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="font-sans font-bold text-lg text-zinc-900 tracking-tight flex items-center gap-1.5">
            <span>Pairfect</span>
            <span className="text-red-500">❤️</span>
          </span>
        </div>

        {/* Room / Partner Indicator & Invite Button */}
        <div className="flex items-center gap-2">
          {isPartnerConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{partnerDisplayName} Connected</span>
            </div>
          ) : partner?.display_name ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{partner.display_name} • In Pair</span>
            </div>
          ) : (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-300 text-xs font-semibold text-zinc-800 shadow-xs cursor-pointer transition-all hover:scale-102"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-600" />
              <span>Invite Partner</span>
            </button>
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
          SCREEN 1: CAPTURE SCREEN (Matching media_1790804984346.png)
          ════════════════════════════════════════════════════════════════════════ */}
      {screen === "capture" && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-2">
          {/* Main 50/50 Dual-Split Viewfinder Container */}
          <div className="relative w-full max-w-2xl sm:max-w-3xl aspect-[16/10] bg-zinc-900 rounded-[28px] sm:rounded-[32px] overflow-hidden border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-center">
            {/* Viewfinder Split Content (Left: You, Right: Partner) */}
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

              {/* Right Pane: Partner or Local Duo Split */}
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

                {/* Local Duo Mirror if partner not connected yet */}
                {!isPartnerConnected && !partnerFallbackUrl && (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => {
                      if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                      }
                    }}
                    style={{
                      transform: `scale(${getZoomScale()})`,
                      filter: currentFilterObj.css,
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 opacity-90"
                  />
                )}

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] font-mono text-white/90 flex items-center gap-1.5">
                  <span>{partnerDisplayName}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPartnerConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                </div>
              </div>
            </div>

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

            {/* Floating Zoom Pill (Bottom-Center inside viewfinder) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full p-1 flex items-center gap-1 z-20 shadow-md">
              {([0.5, 1, 2] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    zoom === z
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>

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

          {/* Inline Filter Tray Drawer when opened */}
          <AnimatePresence>
            {showFilterTray && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-md mt-4 p-3 bg-white border border-zinc-200 rounded-2xl shadow-lg flex items-center justify-around gap-2"
              >
                {BOOTH_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeFilter === f.key
                        ? "bg-black text-white shadow-xs"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls Below Viewfinder Matching media_1790804984346.png */}
          <div className="w-full max-w-md flex flex-col items-center mt-6 gap-5">
            {/* Upper Row: Filters and Background Circular Buttons */}
            <div className="flex items-center justify-center gap-6">
              {/* Filters Button with 3 overlapping circles icon */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setShowFilterTray(!showFilterTray);
                    setShowBgTray(false);
                  }}
                  className={`w-14 h-14 rounded-full bg-white border shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    showFilterTray
                      ? "border-zinc-900 ring-2 ring-zinc-900/10"
                      : "border-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Choose visual filter"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#18181B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="9" r="4.5" />
                    <circle cx="15" cy="9" r="4.5" />
                    <circle cx="12" cy="15" r="4.5" />
                  </svg>
                </button>
                <span className="text-xs font-medium text-zinc-700 mt-1.5">
                  Filters
                </span>
              </div>

              {/* Background Button with portrait backdrop icon */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setShowBgTray(!showBgTray);
                    setShowFilterTray(false);
                  }}
                  className={`w-14 h-14 rounded-full bg-white border shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    showBgTray
                      ? "border-zinc-900 ring-2 ring-zinc-900/10"
                      : "border-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Canvas background"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#18181B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 19c0-2.5 2.2-4 5-4s5 1.5 5 4" />
                  </svg>
                </button>
                <span className="text-xs font-medium text-zinc-700 mt-1.5">
                  Background
                </span>
              </div>
            </div>

            {/* Lower Row: Mic Mute, Capture Pill Button, Flash Button */}
            <div className="flex items-center justify-center gap-4">
              {/* Mic / Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-16 h-14 rounded-2xl bg-white border shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                  isMuted
                    ? "border-red-300 text-red-500 bg-red-50/50"
                    : "border-zinc-300 hover:border-zinc-400 text-zinc-800"
                }`}
                title={isMuted ? "Unmute mic" : "Mute mic"}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-red-500" />
                ) : (
                  <Mic className="w-5 h-5 text-zinc-800" />
                )}
              </button>

              {/* Prominent Black Pill Capture Button */}
              <button
                disabled={isCapturing}
                onClick={startCaptureSequence}
                className="h-14 px-10 rounded-2xl bg-black hover:bg-zinc-800 text-white font-semibold text-base shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-102 active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>Capture</span>
              </button>

              {/* Flash Button */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className={`w-16 h-14 rounded-2xl bg-white border shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                  flashEnabled
                    ? "border-zinc-300 hover:border-zinc-400 text-zinc-800"
                    : "border-zinc-300 text-zinc-400"
                }`}
                title={flashEnabled ? "Screen flash enabled" : "Screen flash disabled"}
              >
                {flashEnabled ? (
                  <Zap className="w-5 h-5 text-zinc-800 fill-zinc-800" />
                ) : (
                  <ZapOff className="w-5 h-5 text-zinc-400" />
                )}
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
            {/* 3D Molded Photobooth Dispenser Slot Mouth */}
            <div className="w-72 sm:w-84 h-16 sm:h-20 bg-gradient-to-b from-[#FFFFFF] via-[#F3F3F5] to-[#DFDFE3] border border-zinc-200/90 rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.06)] relative z-20 flex items-center justify-center px-6">
              {/* Recessed dark printer slot mouth slit */}
              <div className="w-full h-7 sm:h-8 bg-[#09090B] rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.95),inset_0_-1px_2px_rgba(255,255,255,0.12)] relative overflow-hidden" />
            </div>

            {/* Emerging Photo Strip sliding down out of the slit */}
            <motion.div
              initial={{ y: -70, opacity: 0 }}
              animate={{ y: -26, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[240px] sm:w-[260px] shadow-[0_18px_40px_rgba(0,0,0,0.15)] rounded-b-2xl overflow-hidden transition-all duration-300"
            >
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

                  {/* 3 Stacked Photo Frames */}
                  <div className="w-full space-y-2.5">
                    {capturedFrames.map((frameSrc, idx) => (
                      <div
                        key={idx}
                        className="w-full aspect-[16/10] rounded-sm overflow-hidden border-2 border-red-500/90 shadow-xs bg-zinc-900"
                      >
                        <img
                          src={frameSrc}
                          alt={`Shot ${idx + 1}`}
                          style={{ filter: currentResultFilterObj.css }}
                          className="w-full h-full object-cover transition-all duration-200"
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
                          style={{ filter: currentResultFilterObj.css }}
                          className="w-full h-full object-cover transition-all duration-200"
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
                      <div key={i} className="w-1.5 h-2.5 rounded-xs bg-[#E4E4E7]" />
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 right-1 w-2 flex flex-col justify-around py-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-2.5 rounded-xs bg-[#E4E4E7]" />
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
                          style={{ filter: currentResultFilterObj.css }}
                          className="w-full h-full object-cover transition-all duration-200"
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
                  <button
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
                  </button>
                  <span className="text-xs font-semibold text-zinc-800 mt-1.5">
                    None
                  </span>
                </div>

                {/* Styled Look Filters */}
                {BOOTH_FILTERS.filter((f) => f.key !== "none").map((f) => (
                  <div key={f.key} className="flex flex-col items-center shrink-0">
                    <button
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
                    </button>
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
                <button
                  onClick={() => setSelectedStripStyle("classic")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-102 ${
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
                </button>

                {/* Card 2: Retro Film */}
                <button
                  onClick={() => setSelectedStripStyle("retro_film")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-102 ${
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
                </button>

                {/* Card 3: Web Rush */}
                <button
                  onClick={() => setSelectedStripStyle("web_rush")}
                  className={`w-24 sm:w-28 h-44 sm:h-48 rounded-2xl border-2 bg-white p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-102 ${
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
                </button>

                {/* Cycle Style Next Arrow */}
                <button
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
                  className="w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-transform hover:scale-105"
                  title="Next style"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <button
                disabled={isExporting}
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? "Rendering 300 DPI Strip…" : "Download Strip"}
                </span>
              </button>

              <button
                disabled={isSaving}
                onClick={handleSaveToScrapbook}
                className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                <Heart className="w-4 h-4 text-red-500" />
                <span>{isSaving ? "Saving…" : "Save to Scrapbook"}</span>
              </button>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Saved to your shared couple memories!</span>
                </div>
              )}

              <div className="flex justify-center pt-1">
                <button
                  onClick={handleRetake}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Snaps</span>
                </button>
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
                <h3 className="font-bold text-base text-zinc-900">
                  Invite Partner to Booth
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Send this link to your partner. When they open it, their live camera feed will instantly connect side by side with yours!
              </p>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
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
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold cursor-pointer"
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
