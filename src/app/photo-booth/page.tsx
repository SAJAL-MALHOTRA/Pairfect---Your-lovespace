"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Loader2, Camera, RefreshCw, Sparkles, Check, ArrowLeft, Download,
  Share2, Heart, Trash2, Sliders, ShieldAlert, FileText, Image as ImageIcon,
  RotateCw, ZoomIn, ZoomOut, Move
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Layout Definitions ──────────────────────────────────────────────────────
type LayoutType = "strip_4" | "strip_3" | "polaroid_grid" | "anniversary_card" | "journal" | "film_roll";

interface LayoutConfig {
  key: LayoutType;
  label: string;
  count: number;
  description: string;
}

const LAYOUTS: LayoutConfig[] = [
  { key: "strip_4",          label: "Classic 4-Cut Strip",      count: 4, description: "Iconic 4-photo vertical photobooth strip" },
  { key: "strip_3",          label: "Classic 3-Cut Strip",      count: 3, description: "Traditional 3-photo vertical memory strip" },
  { key: "polaroid_grid",    label: "2x2 Polaroid Grid",        count: 4, description: "2x2 vintage polaroid quad keepsake" },
  { key: "anniversary_card", label: "Anniversary Card",         count: 3, description: "1 featured centerpiece photo + 2 side snaps" },
  { key: "journal",          label: "Journal Memory",           count: 2, description: "Side-by-side photos with story notes margin" },
  { key: "film_roll",        label: "35mm Film Roll",           count: 3, description: "Vintage 35mm film reel frames with sprockets" },
];

// ── CSS Filter Definitions ──────────────────────────────────────────────────
type FilterKey = "none" | "warm" | "vintage" | "film" | "bw" | "soft" | "golden";

interface FilterConfig {
  key: FilterKey;
  label: string;
  css: string;
}

const FILTERS: FilterConfig[] = [
  { key: "none",    label: "No Filter",     css: "none" },
  { key: "warm",    label: "Warm",          css: "sepia(0.25) saturate(1.2) contrast(1.05) brightness(1.02)" },
  { key: "vintage", label: "Vintage",       css: "sepia(0.4) contrast(1.1) brightness(0.95) hue-rotate(-10deg)" },
  { key: "film",    label: "Film",          css: "contrast(1.15) saturate(0.85) sepia(0.15)" },
  { key: "bw",      label: "Black & White", css: "grayscale(1) contrast(1.2) brightness(1.05)" },
  { key: "soft",    label: "Soft",          css: "brightness(1.08) contrast(0.92) saturate(0.95) blur(0.3px)" },
  { key: "golden",  label: "Golden",        css: "sepia(0.35) saturate(1.4) hue-rotate(5deg) contrast(1.05)" },
];

// ── Frame Colors ────────────────────────────────────────────────────────────
type FrameColor = "cream" | "white" | "paper" | "vintage" | "warm_brown" | "burgundy";

const FRAME_COLORS: Record<FrameColor, { label: string; bg: string; text: string; border: string }> = {
  cream:      { label: "Cream",      bg: "#FAF5EB", text: "#3A2E22", border: "#E7DED5" },
  white:      { label: "White",      bg: "#FFFFFF", text: "#221C16", border: "#E5E0D8" },
  paper:      { label: "Paper",      bg: "#F5EDD8", text: "#3A2E22", border: "#DFD2B8" },
  vintage:    { label: "Vintage",    bg: "#EADCC6", text: "#2E2418", border: "#D4C2A6" },
  warm_brown: { label: "Warm Brown", bg: "#4A362D", text: "#FFF3F6", border: "#35261F" },
  burgundy:   { label: "Burgundy",   bg: "#E8527D", text: "#FFF8FA", border: "#D13D68" },
};

// ── Paper Textures ──────────────────────────────────────────────────────────
type PaperTexture = "plain" | "journal" | "vintage" | "linen" | "kraft";

const PAPER_TEXTURES: Record<PaperTexture, { label: string; style: React.CSSProperties }> = {
  plain:   { label: "Plain", style: {} },
  journal: {
    label: "Journal",
    style: {
      backgroundImage: "linear-gradient(transparent 95%, rgba(142, 43, 69, 0.08) 95%)",
      backgroundSize: "100% 24px"
    }
  },
  vintage: {
    label: "Vintage Paper",
    style: {
      backgroundImage: "radial-gradient(rgba(142, 43, 69, 0.05) 1px, transparent 1px)",
      backgroundSize: "16px 16px"
    }
  },
  linen: {
    label: "Linen",
    style: {
      backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 0, transparent 50%)",
      backgroundSize: "8px 8px"
    }
  },
  kraft: {
    label: "Kraft",
    style: {
      backgroundColor: "#D9C3A5",
      backgroundImage: "radial-gradient(rgba(80, 50, 20, 0.06) 1px, transparent 1px)",
      backgroundSize: "12px 12px"
    }
  },
};

// ── Curated Sticker Definitions ─────────────────────────────────────────────
const STICKER_PALETTE = [
  { id: "heart_sparkle", icon: "💖", label: "Sparkle Heart" },
  { id: "red_heart",      icon: "❤️", label: "Love Heart" },
  { id: "rose",           icon: "🌹", label: "Red Rose" },
  { id: "wax_seal",       icon: "💌", label: "Love Letter" },
  { id: "sparkles",       icon: "✨", label: "Sparkles" },
  { id: "cherry_blossom", icon: "🌸", label: "Blossom" },
  { id: "camera",         icon: "📷", label: "Camera" },
  { id: "star",           icon: "⭐", label: "Star" },
  { id: "ribbon",         icon: "🎀", label: "Ribbon" },
  { id: "rings",          icon: "💍", label: "Rings" },
  { id: "two_hearts",     icon: "💕", label: "Two Hearts" },
  { id: "kiss",           icon: "💋", label: "Kiss" },
];

interface PlacedSticker {
  id: string;
  type: string;
  icon: string;
  x: number; // percentage of container width
  y: number; // percentage of container height
  rotation: number;
  scale: number;
}

// ── Canvas Center-Crop (object-fit: cover) Helper ───────────────────────────
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgW = img.naturalWidth || img.width || 640;
  const imgH = img.naturalHeight || img.height || 480;
  const imgRatio = imgW / imgH;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;

  if (imgRatio > targetRatio) {
    sWidth = imgH * targetRatio;
    sx = (imgW - sWidth) / 2;
  } else {
    sHeight = imgW / targetRatio;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

export default function PhotoBoothPage() {
  const { pair } = useAuth();
  const supabase = createClient();

  // ── Step Navigation (1: Layout, 2: Capture, 3: Decorate, 4: Export) ─────────
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Layout & Styling Config
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("strip_4");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("warm");
  const [frameColor, setFrameColor] = useState<FrameColor>("cream");
  const [paperTexture, setPaperTexture] = useState<PaperTexture>("journal");

  // Step 2: Camera & Capture State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [countdownSec, setCountdownSec] = useState<number>(3);
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [videoIsReady, setVideoIsReady] = useState(false);

  // Step 3: Decoration State
  const [showDateStamp, setShowDateStamp] = useState(true);
  const [showTimeStamp, setShowTimeStamp] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [captionText, setCaptionText] = useState("");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Step 4: Export & Scrapbook State
  const [savingScrapbook, setSavingScrapbook] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stripPreviewRef = useRef<HTMLDivElement | null>(null);

  const currentLayoutConfig = LAYOUTS.find(l => l.key === selectedLayout) || LAYOUTS[0];
  const currentFilterConfig = FILTERS.find(f => f.key === selectedFilter) || FILTERS[1];

  // Play shutter sound on capture
  const playShutterSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable
    }
  }, []);

  // ── Camera Initialization & Cleanup ──────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(mediaStream);
      setCameraAvailable(true);
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access failed or unavailable:", err);
      setCameraAvailable(false);
      setCameraError(err.message || "Camera permission denied or device unavailable.");
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setVideoIsReady(false);
  }, [stream]);

  useEffect(() => {
    if (step === 2) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  // Bind video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ── Capture Single Frame from Video or Fallback Canvas ───────────────────
  const capturePhotoFrame = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const vid = videoRef.current;
      const isVideoPlaying = vid && vid.readyState >= 2 && vid.videoWidth > 0 && cameraAvailable;

      if (isVideoPlaying) {
        ctx.save();
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Fallback drawing if camera is unavailable — ALWAYS upright & centered!
        ctx.fillStyle = "#FAF5EB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#FFD9E3";
        ctx.lineWidth = 12;
        ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

        ctx.fillStyle = "#E8527D";
        ctx.font = "bold 52px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Pairfect Memory Snap ♡", canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = "#7A4B5D";
        ctx.font = "28px sans-serif";
        ctx.fillText(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), canvas.width / 2, canvas.height / 2 + 40);
      }
    }
    return canvas.toDataURL("image/jpeg", 0.95);
  }, [isMirrored, cameraAvailable]);

  // ── Execute Photo Capture Sequence ──────────────────────────────────────
  const triggerCaptureSequence = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    const neededCount = currentLayoutConfig.count;
    let currentPhotos = [...capturedPhotos];

    if (currentPhotos.length >= neededCount) {
      currentPhotos = [];
    }

    for (let p = currentPhotos.length; p < neededCount; p++) {
      // Countdown numbers
      for (let sec = countdownSec; sec > 0; sec--) {
        setCountdownNumber(sec);
        await new Promise(r => setTimeout(r, 1000));
      }

      // Show heart badge moment
      setCountdownNumber(0);
      await new Promise(r => setTimeout(r, 400));
      setCountdownNumber(null);

      // Play sound & flash UI
      playShutterSound();
      if (flashEnabled) {
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 250);
      }

      const snapData = capturePhotoFrame();
      currentPhotos.push(snapData);
      setCapturedPhotos([...currentPhotos]);

      // Small pause between multiple photos so user can change poses
      if (p < neededCount - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    setIsCapturing(false);
  }, [isCapturing, currentLayoutConfig, capturedPhotos, countdownSec, flashEnabled, capturePhotoFrame, playShutterSound]);

  // ── Manual File Upload Fallback ─────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const list: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          list.push(ev.target.result as string);
          if (list.length === files.length) {
            setCapturedPhotos(prev => [...prev, ...list].slice(0, currentLayoutConfig.count));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Sticker Drag & Placement Helpers ─────────────────────────────────────
  const addSticker = (type: string, icon: string) => {
    const newSticker: PlacedSticker = {
      id: `${type}-${Date.now()}`,
      type,
      icon,
      x: 35 + (placedStickers.length * 6) % 30,
      y: 35 + (placedStickers.length * 8) % 30,
      rotation: (Math.random() - 0.5) * 30,
      scale: 1,
    };
    setPlacedStickers(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const removeSticker = (id: string) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const updateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Helper to load async images
  const loadImageAsync = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = 640;
        fallbackCanvas.height = 480;
        const fCtx = fallbackCanvas.getContext("2d");
        if (fCtx) {
          fCtx.fillStyle = "#FAF5EB";
          fCtx.fillRect(0, 0, 640, 480);
          fCtx.fillStyle = "#E8527D";
          fCtx.font = "bold 32px Georgia, serif";
          fCtx.textAlign = "center";
          fCtx.fillText("Pairfect Photo Snap ♡", 320, 240);
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = fallbackCanvas.toDataURL("image/png");
      };

      if (src.startsWith("http://") || src.startsWith("https://")) {
        fetch(src, { mode: "cors" })
          .then(r => r.blob())
          .then(b => {
            const reader = new FileReader();
            reader.onloadend = () => {
              img.src = reader.result as string;
            };
            reader.onerror = () => { img.src = src; };
            reader.readAsDataURL(b);
          })
          .catch(() => {
            img.src = src;
          });
      } else {
        img.src = src;
      }
    });
  }, []);

  // ── High-Res Canvas Exporter for PNG/PDF Download (300 DPI) ──────────────
  const renderStripToCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const count = currentLayoutConfig.count;
    const padding = 60;
    const gap = 32;

    const dateText = showDateStamp ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
    const timeText = showTimeStamp ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
    const stampCombined = [dateText, timeText, locationText].filter(Boolean).join(" · ");

    const topHeaderHeight = stampCombined ? 160 : 120;
    const bottomFooterHeight = captionText ? 150 : 110;

    // Calculate dimensions based on layout geometry
    let width = 800;
    let height = 2400;

    if (selectedLayout === "strip_4") {
      width = 800;
      const slotW = width - padding * 2;
      const slotH = Math.floor(slotW * (3 / 4)); // 4:3 ratio
      height = topHeaderHeight + (4 * slotH) + (3 * gap) + bottomFooterHeight;
    } else if (selectedLayout === "strip_3") {
      width = 800;
      const slotW = width - padding * 2;
      const slotH = Math.floor(slotW * (3 / 4));
      height = topHeaderHeight + (3 * slotH) + (2 * gap) + bottomFooterHeight;
    } else if (selectedLayout === "polaroid_grid") {
      width = 1200;
      const gridW = (width - padding * 2 - gap) / 2;
      const gridH = gridW; // Square polaroids
      height = topHeaderHeight + (2 * gridH) + gap + bottomFooterHeight;
    } else if (selectedLayout === "anniversary_card") {
      width = 1200;
      const cardH = 860;
      height = topHeaderHeight + cardH + bottomFooterHeight;
    } else if (selectedLayout === "journal") {
      width = 1200;
      const slotW = (width - padding * 2 - gap) / 2;
      const slotH = Math.floor(slotW * (3 / 4));
      height = topHeaderHeight + slotH + 280 + bottomFooterHeight;
    } else if (selectedLayout === "film_roll") {
      width = 800;
      const slotW = width - padding * 2 - 80;
      const slotH = Math.floor(slotW * (3 / 4));
      height = topHeaderHeight + (3 * slotH) + (2 * gap) + bottomFooterHeight;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const fStyle = FRAME_COLORS[frameColor] || FRAME_COLORS.cream;

    // Background frame color fill
    ctx.fillStyle = fStyle.bg;
    ctx.fillRect(0, 0, width, height);

    // Frame border
    ctx.strokeStyle = fStyle.border;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, width - 14, height - 14);

    // Header title
    ctx.fillStyle = fStyle.text;
    ctx.font = "italic bold 44px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Pairfect Photo Booth ♡", width / 2, 70);

    if (stampCombined) {
      ctx.font = "26px Caveat, cursive";
      ctx.fillText(stampCombined, width / 2, 115);
    }

    // Ensure we have loaded images for all slots
    const photosToRender = [...capturedPhotos];
    while (photosToRender.length < count) {
      photosToRender.push(photosToRender[0] || capturePhotoFrame());
    }

    const loadedImages = await Promise.all(photosToRender.map(src => loadImageAsync(src)));

    // Save context for filter application
    ctx.save();
    if (currentFilterConfig.css && currentFilterConfig.css !== "none") {
      ctx.filter = currentFilterConfig.css;
    }

    // ── Draw Layout Elements with drawImageCover ───────────────────────────
    if (selectedLayout === "strip_3" || selectedLayout === "strip_4") {
      const slotW = width - padding * 2;
      const slotH = Math.floor(slotW * (3 / 4));

      loadedImages.slice(0, count).forEach((img, idx) => {
        const y = topHeaderHeight + idx * (slotH + gap);

        // Photo white polaroid border
        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(padding - 8, y - 8, slotW + 16, slotH + 16);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - 8, y - 8, slotW + 16, slotH + 16);
        ctx.restore();

        // Draw photo cropped with cover
        drawImageCover(ctx, img, padding, y, slotW, slotH);
      });
    } else if (selectedLayout === "polaroid_grid") {
      const gridW = (width - padding * 2 - gap) / 2;
      const gridH = gridW;

      loadedImages.slice(0, 4).forEach((img, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = padding + col * (gridW + gap);
        const y = topHeaderHeight + row * (gridH + gap);

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, gridW + 16, gridH + 16);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 8, y - 8, gridW + 16, gridH + 16);
        ctx.restore();

        drawImageCover(ctx, img, x, y, gridW, gridH);
      });
    } else if (selectedLayout === "anniversary_card") {
      const totalW = width - padding * 2;
      const mainW = Math.floor(totalW * 0.58);
      const sideW = totalW - mainW - gap;
      const totalH = 860;
      const sideH = (totalH - gap) / 2;

      // 1. Centerpiece Hero Photo (Left)
      if (loadedImages[0]) {
        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(padding - 8, topHeaderHeight - 8, mainW + 16, totalH + 16);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - 8, topHeaderHeight - 8, mainW + 16, totalH + 16);
        ctx.restore();

        drawImageCover(ctx, loadedImages[0], padding, topHeaderHeight, mainW, totalH);
      }

      // 2. Stacked Side Snaps (Right)
      loadedImages.slice(1, 3).forEach((img, idx) => {
        const x = padding + mainW + gap;
        const y = topHeaderHeight + idx * (sideH + gap);

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, sideW + 16, sideH + 16);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 8, y - 8, sideW + 16, sideH + 16);
        ctx.restore();

        drawImageCover(ctx, img, x, y, sideW, sideH);
      });
    } else if (selectedLayout === "journal") {
      const slotW = (width - padding * 2 - gap) / 2;
      const slotH = Math.floor(slotW * (3 / 4));

      loadedImages.slice(0, 2).forEach((img, idx) => {
        const x = padding + idx * (slotW + gap);
        const y = topHeaderHeight + 10;

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, slotW + 16, slotH + 16);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 8, y - 8, slotW + 16, slotH + 16);
        ctx.restore();

        drawImageCover(ctx, img, x, y, slotW, slotH);
      });

      // Journal notes lines
      ctx.save();
      ctx.filter = "none";
      ctx.strokeStyle = "rgba(142, 43, 69, 0.25)";
      ctx.lineWidth = 2;
      const lineStartY = topHeaderHeight + slotH + 60;
      for (let l = lineStartY; l < height - bottomFooterHeight - 20; l += 45) {
        ctx.beginPath();
        ctx.moveTo(padding, l);
        ctx.lineTo(width - padding, l);
        ctx.stroke();
      }
      ctx.restore();
    } else if (selectedLayout === "film_roll") {
      // Film reel container
      const slotW = width - padding * 2 - 80;
      const slotH = Math.floor(slotW * (3 / 4));
      const filmH = (3 * slotH) + (2 * gap) + 40;

      ctx.save();
      ctx.filter = "none";
      ctx.fillStyle = "#1A1410";
      ctx.fillRect(padding - 20, topHeaderHeight - 20, width - (padding - 20) * 2, filmH);

      // Sprocket holes
      ctx.fillStyle = "#FAF5EB";
      for (let yH = topHeaderHeight - 10; yH < topHeaderHeight + filmH - 20; yH += 50) {
        ctx.fillRect(padding - 12, yH, 16, 24);
        ctx.fillRect(width - padding - 4, yH, 16, 24);
      }
      ctx.restore();

      loadedImages.slice(0, 3).forEach((img, idx) => {
        const y = topHeaderHeight + idx * (slotH + gap);
        drawImageCover(ctx, img, padding + 40, y, slotW, slotH);
      });
    }

    ctx.restore(); // Restore filter

    // Draw Caption Footer
    if (captionText) {
      ctx.fillStyle = fStyle.text;
      ctx.font = "italic 38px EB Garamond, serif";
      ctx.textAlign = "center";
      ctx.fillText(`“${captionText}”`, width / 2, height - 50);
    }

    // Draw Stickers
    placedStickers.forEach((st) => {
      ctx.save();
      const posX = (st.x / 100) * width;
      const posY = (st.y / 100) * height;

      ctx.translate(posX, posY);
      ctx.rotate((st.rotation * Math.PI) / 180);
      ctx.scale(st.scale, st.scale);

      ctx.font = "56px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.icon, 0, 0);

      ctx.restore();
    });

    return canvas;
  }, [frameColor, selectedLayout, currentLayoutConfig, capturedPhotos, showDateStamp, showTimeStamp, locationText, captionText, placedStickers, currentFilterConfig, loadImageAsync, capturePhotoFrame]);

  // ── Download Handlers ────────────────────────────────────────────────────
  const downloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderStripToCanvas();
      const link = document.createElement("a");
      link.download = `pairfect-photo-strip-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("PNG export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderStripToCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Photo Strip - Pairfect</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#FAF5EB;">
              <img src="${dataUrl}" style="max-height:95vh; max-width:95vw; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" onload="window.print();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Save to Supabase Scrapbook Database ─────────────────────────────────
  const saveToScrapbook = async () => {
    if (!pair) return;
    setSavingScrapbook(true);
    try {
      const { data: stripData, error: stripErr } = await supabase
        .from("photo_strips")
        .insert({
          pair_id: pair.id,
          layout: selectedLayout,
          title: "Photo Booth Snap",
          caption: captionText || null,
          frame_color: frameColor,
          paper_texture: paperTexture,
          filter: selectedFilter,
        })
        .select("id")
        .single();

      if (stripErr || !stripData) throw stripErr;

      // Insert images
      const imageRows = capturedPhotos.map((url, pos) => ({
        strip_id: stripData.id,
        url,
        position: pos,
      }));
      await supabase.from("photo_strip_images").insert(imageRows);

      // Insert stickers
      if (placedStickers.length > 0) {
        const stickerRows = placedStickers.map(st => ({
          strip_id: stripData.id,
          type: st.type,
          x: st.x,
          y: st.y,
          rotation: st.rotation,
          scale: st.scale,
        }));
        await supabase.from("photo_strip_stickers").insert(stickerRows);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save to scrapbook:", e);
    } finally {
      setSavingScrapbook(false);
    }
  };

  const fStyle = FRAME_COLORS[frameColor] || FRAME_COLORS.cream;
  const pTexture = PAPER_TEXTURES[paperTexture] || PAPER_TEXTURES.plain;

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] paper-grain">
      <Navigation />

      {/* Screen White Flash Animation */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 py-12 pb-36">

        {/* ─── HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-8"
        >
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--paper-mid)] border border-[var(--border)] text-[var(--burgundy)] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Always Free</span>
          </div>
          <h1 className="font-display italic font-bold text-4xl text-[var(--text)]">Online Photobooth</h1>
          <p className="font-sans text-xs sm:text-sm text-[var(--text-soft)] max-w-md mx-auto leading-relaxed">
            A realtime 4-frame photo booth for two — snap, customize vintage frames & stickers, and export high-res strips.
          </p>
        </motion.div>

        {/* ─── STEPPER BAR ─── */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-2 sm:gap-4 p-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs">
            {[
              { num: 1, label: "Layout" },
              { num: 2, label: "Capture" },
              { num: 3, label: "Decorate" },
              { num: 4, label: "Export" },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isCompleted = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => { if (step > s.num || (s.num === 2 && capturedPhotos.length > 0)) setStep(s.num as any); }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--burgundy)] text-white font-bold shadow-xs"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
                      : "text-[var(--text-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                    {isCompleted ? "✓" : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: SELECT LAYOUT
            ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-display italic font-bold text-[var(--text)]">Choose Your Strip Format</h2>
              <p className="text-xs text-[var(--text-soft)] font-mono uppercase tracking-wider">Select the style of your keepsake</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LAYOUTS.map((layout) => {
                const isSelected = selectedLayout === layout.key;
                return (
                  <motion.button
                    key={layout.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedLayout(layout.key)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--paper-mid)] border-[var(--burgundy)] ring-2 ring-[var(--burgundy)]/20 shadow-md"
                        : "bg-[var(--paper-warm)] border-[var(--border)] hover:border-[var(--burgundy)]/40 shadow-xs"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-sans font-bold text-sm text-[var(--text)]">{layout.label}</h3>
                        {isSelected && <span className="text-xs text-[var(--burgundy)] font-bold">Selected ✓</span>}
                      </div>
                      <p className="text-xs text-[var(--text-soft)] font-sans">{layout.description}</p>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--burgundy)]">
                      {layout.count} Photo Snaps
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="btn-journal py-3 px-8 text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Continue to Camera ▷</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: CAMERA & CAPTURE
            ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Change Layout
              </button>

              <span className="text-xs font-mono text-[var(--burgundy)] font-bold">
                Photo {capturedPhotos.length} of {currentLayoutConfig.count}
              </span>
            </div>

            {/* Main Camera Viewfinder Card */}
            <div className="p-6 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-md space-y-6">

              {/* Viewfinder Video Stream Container */}
              <div className="relative mx-auto max-w-md aspect-4/3 rounded-2xl bg-black overflow-hidden border-2 border-[var(--border)] shadow-inner flex items-center justify-center">
                {cameraAvailable ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => setVideoIsReady(true)}
                    style={{
                      transform: isMirrored ? "scaleX(-1)" : "none",
                      filter: currentFilterConfig.css,
                    }}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-10 h-10 text-[var(--rose)] mx-auto opacity-70" />
                    <p className="font-display italic text-lg text-white">Camera Unavailable</p>
                    <p className="text-xs text-[var(--text-soft)] font-sans">
                      {cameraError || "Your camera stream is loading or permission is needed."}
                    </p>
                    <button
                      onClick={() => startCamera()}
                      className="btn-journal py-2 px-5 text-xs mx-auto inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" /> Retry Camera Stream
                    </button>
                  </div>
                )}

                {/* Animated Countdown Overlay */}
                <AnimatePresence>
                  {countdownNumber !== null && (
                    <motion.div
                      key={countdownNumber}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-30"
                    >
                      <span className="font-display font-bold text-7xl text-white drop-shadow-md">
                        {countdownNumber === 0 ? "♡" : countdownNumber}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Realtime Filters Ribbon */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] text-center">
                  Filters
                </p>
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {FILTERS.map((f) => {
                    const isSel = selectedFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setSelectedFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                          isSel
                            ? "bg-[var(--burgundy)] text-white font-bold shadow-xs"
                            : "bg-[var(--paper-mid)] text-[var(--text-soft)] hover:text-[var(--text)] border border-[var(--border)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Viewfinder Controls (Mirror, Timer, Flash, Retake) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`p-2 rounded-xl text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                      isMirrored ? "bg-[var(--paper-mid)] border-[var(--burgundy)] text-[var(--burgundy)] font-bold" : "border-[var(--border)] text-[var(--text-soft)]"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Mirror: {isMirrored ? "ON" : "OFF"}
                  </button>

                  <button
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className={`p-2 rounded-xl text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                      flashEnabled ? "bg-[var(--paper-mid)] border-[var(--burgundy)] text-[var(--burgundy)] font-bold" : "border-[var(--border)] text-[var(--text-soft)]"
                    }`}
                  >
                    ⚡ Flash: {flashEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Countdown Duration Toggle */}
                <div className="flex items-center gap-1 bg-[var(--paper-mid)] p-1 rounded-xl border border-[var(--border)]">
                  {[3, 5, 10].map((s) => (
                    <button
                      key={s}
                      onClick={() => setCountdownSec(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition-colors ${countdownSec === s ? "bg-[var(--burgundy)] text-white font-bold" : "text-[var(--text-soft)]"}`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>

                {capturedPhotos.length > 0 && (
                  <button
                    onClick={() => setCapturedPhotos([])}
                    className="p-2 rounded-xl border border-red-200 text-xs font-mono text-red-600 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Snaps
                  </button>
                )}
              </div>

              {/* Big Capture Trigger Button */}
              <div className="text-center pt-2">
                <button
                  disabled={isCapturing}
                  onClick={triggerCaptureSequence}
                  className="btn-journal py-4 px-10 text-sm font-mono font-bold rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all"
                >
                  {isCapturing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Capturing Frame…</>
                  ) : (
                    <><Camera className="w-5 h-5" /> Start Photo Snap ({currentLayoutConfig.count} Shots)</>
                  )}
                </button>
              </div>

            </div>

            {/* Captured Photos Thumbnail Strip Preview */}
            {capturedPhotos.length > 0 && (
              <div className="p-5 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)]">
                  Captured Snaps ({capturedPhotos.length} / {currentLayoutConfig.count})
                </p>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {capturedPhotos.map((imgSrc, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[var(--border)] flex-shrink-0 shadow-xs">
                      <img src={imgSrc} alt="" style={{ filter: currentFilterConfig.css }} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[var(--burgundy)] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setStep(3)}
                    className="btn-journal py-3 px-8 text-xs font-mono font-bold cursor-pointer shadow-md"
                  >
                    Proceed to Decorate ▷
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3: DECORATE (LIVE STRIP PREVIEW & CUSTOMIZER)
            ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Camera
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-journal py-2 px-6 text-xs font-mono font-bold cursor-pointer shadow-sm"
              >
                Done Decorating ▷
              </button>
            </div>

            {/* Two-Column Editor Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

              {/* ── LEFT COLUMN: LIVE STRIP PREVIEW CANVAS ── */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div
                  ref={stripPreviewRef}
                  style={{
                    backgroundColor: fStyle.bg,
                    borderColor: fStyle.border,
                    color: fStyle.text,
                    ...pTexture.style,
                  }}
                  className="relative w-full max-w-sm p-6 rounded-3xl border-4 shadow-xl space-y-4 select-none overflow-hidden transition-all duration-300"
                >
                  {/* Photo Strip Header Title */}
                  <div className="text-center space-y-1">
                    <p className="font-display italic font-bold text-2xl tracking-tight">Pairfect Photo Booth ♡</p>

                    {(showDateStamp || showTimeStamp || locationText) && (
                      <p className="font-handwriting text-xs text-[var(--ink-mid)]">
                        {[
                          showDateStamp ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
                          showTimeStamp ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
                          locationText || null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Captured Photos Rendering Matching Layout Geometry */}
                  {selectedLayout === "anniversary_card" ? (
                    <div className="grid grid-cols-12 gap-2.5">
                      <div className="col-span-7 rounded-xl overflow-hidden bg-white p-1.5 shadow-xs border border-black/10">
                        <img
                          src={capturedPhotos[0] || capturePhotoFrame()}
                          alt=""
                          style={{ filter: currentFilterConfig.css }}
                          className="w-full h-full aspect-3/4 object-cover rounded-lg"
                        />
                      </div>
                      <div className="col-span-5 flex flex-col gap-2.5">
                        <div className="rounded-xl overflow-hidden bg-white p-1.5 shadow-xs border border-black/10">
                          <img
                            src={capturedPhotos[1] || capturedPhotos[0] || capturePhotoFrame()}
                            alt=""
                            style={{ filter: currentFilterConfig.css }}
                            className="w-full aspect-4/3 object-cover rounded-lg"
                          />
                        </div>
                        <div className="rounded-xl overflow-hidden bg-white p-1.5 shadow-xs border border-black/10">
                          <img
                            src={capturedPhotos[2] || capturedPhotos[0] || capturePhotoFrame()}
                            alt=""
                            style={{ filter: currentFilterConfig.css }}
                            className="w-full aspect-4/3 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selectedLayout === "polaroid_grid" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {(capturedPhotos.length >= 4 ? capturedPhotos.slice(0, 4) : [0, 1, 2, 3].map(i => capturedPhotos[i] || capturedPhotos[0] || capturePhotoFrame())).map((src, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden bg-white p-1.5 shadow-xs border border-black/10">
                          <img
                            src={src}
                            alt=""
                            style={{ filter: currentFilterConfig.css }}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(capturedPhotos.length >= currentLayoutConfig.count ? capturedPhotos.slice(0, currentLayoutConfig.count) : Array.from({ length: currentLayoutConfig.count }).map((_, i) => capturedPhotos[i] || capturedPhotos[0] || capturePhotoFrame())).map((src, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden bg-white p-1.5 shadow-xs border border-black/10">
                          <img
                            src={src}
                            alt=""
                            crossOrigin="anonymous"
                            style={{ filter: currentFilterConfig.css }}
                            className="w-full aspect-4/3 object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Caption Footer */}
                  {captionText && (
                    <p className="font-quote italic text-sm text-center pt-2 leading-relaxed">
                      &ldquo;{captionText}&rdquo;
                    </p>
                  )}

                  {/* Draggable/Scalable Placed Stickers Layer */}
                  {placedStickers.map((st) => (
                    <motion.div
                      key={st.id}
                      drag
                      dragConstraints={stripPreviewRef}
                      style={{
                        position: "absolute",
                        left: `${st.x}%`,
                        top: `${st.y}%`,
                        transform: `rotate(${st.rotation}deg) scale(${st.scale})`,
                        cursor: "grab",
                      }}
                      onClick={(e) => { e.stopPropagation(); setActiveStickerId(st.id); }}
                      className={`z-40 text-3xl filter drop-shadow-sm ${activeStickerId === st.id ? "ring-2 ring-[var(--burgundy)] rounded-lg" : ""}`}
                    >
                      {st.icon}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT COLUMN: CUSTOMIZATION CONTROLS PANEL ── */}
              <div className="md:col-span-6 space-y-6 p-6 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-sm">

                {/* 1. Frame Color */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)] block">Frame Color</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FRAME_COLORS) as FrameColor[]).map((colKey) => {
                      const col = FRAME_COLORS[colKey];
                      const isSel = frameColor === colKey;
                      return (
                        <button
                          key={colKey}
                          onClick={() => setFrameColor(colKey)}
                          className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                            isSel ? "border-[var(--burgundy)] ring-1 ring-[var(--burgundy)] font-bold" : "border-[var(--border)]"
                          }`}
                          style={{ backgroundColor: col.bg, color: col.text }}
                        >
                          <span className="w-3 h-3 rounded-full border border-current" style={{ backgroundColor: col.bg }} />
                          <span className="truncate">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Paper Texture */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)] block">Paper Texture</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PAPER_TEXTURES) as PaperTexture[]).map((texKey) => {
                      const tex = PAPER_TEXTURES[texKey];
                      const isSel = paperTexture === texKey;
                      return (
                        <button
                          key={texKey}
                          onClick={() => setPaperTexture(texKey)}
                          className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                            isSel ? "border-[var(--burgundy)] bg-[var(--paper-mid)] font-bold text-[var(--burgundy)]" : "border-[var(--border)] text-[var(--text-soft)] bg-[var(--bg)]"
                          }`}
                        >
                          {tex.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Decal Stickers Palette */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)] block">Add Stickers (Drag to place)</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                    {STICKER_PALETTE.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => addSticker(st.id, st.icon)}
                        className="text-2xl p-2 rounded-xl hover:bg-[var(--paper-mid)] active:scale-90 transition-transform cursor-pointer"
                        title={st.label}
                      >
                        {st.icon}
                      </button>
                    ))}
                  </div>

                  {placedStickers.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[var(--text-soft)]">{placedStickers.length} stickers placed</span>
                      <button
                        onClick={() => setPlacedStickers([])}
                        className="text-[10px] font-mono text-red-500 hover:underline cursor-pointer"
                      >
                        Remove All Stickers
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Timestamp & Location Toggles */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)] block">Stamp Details</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowDateStamp(!showDateStamp)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors ${
                        showDateStamp ? "bg-[var(--paper-mid)] border-[var(--burgundy)] text-[var(--burgundy)] font-bold" : "border-[var(--border)] text-[var(--text-soft)]"
                      }`}
                    >
                      📅 Date: {showDateStamp ? "ON" : "OFF"}
                    </button>

                    <button
                      onClick={() => setShowTimeStamp(!showTimeStamp)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors ${
                        showTimeStamp ? "bg-[var(--paper-mid)] border-[var(--burgundy)] text-[var(--burgundy)] font-bold" : "border-[var(--border)] text-[var(--text-soft)]"
                      }`}
                    >
                      ⏰ Time: {showTimeStamp ? "ON" : "OFF"}
                    </button>
                  </div>

                  {/* Location & Caption Inputs */}
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add location (e.g. Paris, Living Room, Beach)"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-[var(--burgundy)]"
                    />

                    <input
                      type="text"
                      placeholder="Add romantic caption or quote..."
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-[var(--burgundy)]"
                    />
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 4: EXPORT & SAVE KEEPSAKE
            ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xs">
                ✨
              </div>
              <h2 className="font-display italic font-bold text-3xl text-[var(--text)]">Your Photo Strip is Ready!</h2>
              <p className="text-xs text-[var(--text-soft)] font-mono uppercase tracking-wider">
                Download high-res memory or save to your shared scrapbook
              </p>
            </div>

            {/* Export Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <button
                disabled={isExporting}
                onClick={downloadPNG}
                className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)] shadow-sm text-center space-y-2 cursor-pointer transition-all hover:scale-102"
              >
                <Download className="w-6 h-6 text-[var(--burgundy)] mx-auto" />
                <h3 className="font-sans font-bold text-sm text-[var(--text)]">Download PNG</h3>
                <p className="text-[11px] text-[var(--text-soft)] font-mono">300 DPI high-res image</p>
              </button>

              <button
                disabled={isExporting}
                onClick={downloadPDF}
                className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)] shadow-sm text-center space-y-2 cursor-pointer transition-all hover:scale-102"
              >
                <FileText className="w-6 h-6 text-[var(--burgundy)] mx-auto" />
                <h3 className="font-sans font-bold text-sm text-[var(--text)]">Print / PDF</h3>
                <p className="text-[11px] text-[var(--text-soft)] font-mono">Ready to print strip</p>
              </button>

              <button
                disabled={savingScrapbook || !pair}
                onClick={saveToScrapbook}
                className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] hover:border-[var(--burgundy)] shadow-sm text-center space-y-2 cursor-pointer transition-all hover:scale-102"
              >
                <Heart className="w-6 h-6 text-[var(--burgundy)] mx-auto" />
                <h3 className="font-sans font-bold text-sm text-[var(--text)]">Save to Scrapbook</h3>
                <p className="text-[11px] text-[var(--text-soft)] font-mono">
                  {pair ? "Add to shared memories" : "Connect partner to save"}
                </p>
              </button>
            </div>

            {savedSuccess && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium animate-fade-in flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Saved successfully to your shared couple memories!</span>
              </div>
            )}

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setCapturedPhotos([]);
                  setPlacedStickers([]);
                  setStep(1);
                }}
                className="btn-journal-ghost py-3 px-8 text-xs font-mono font-bold cursor-pointer"
              >
                Take Another Photo Strip ▷
              </button>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
