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
type LayoutType = "strip_3" | "strip_4" | "journal" | "polaroid_grid" | "film_roll" | "anniversary_card";

interface LayoutConfig {
  key: LayoutType;
  label: string;
  count: number;
  description: string;
}

const LAYOUTS: LayoutConfig[] = [
  { key: "strip_3",          label: "Classic Strip (3 Photos)", count: 3, description: "Traditional vertical photo booth strip" },
  { key: "strip_4",          label: "Classic Strip (4 Photos)", count: 4, description: "Extended vertical memory strip" },
  { key: "journal",          label: "Journal Layout",           count: 2, description: "Side-by-side photos with story margin" },
  { key: "polaroid_grid",    label: "Polaroid Grid",            count: 4, description: "2x2 vintage polaroid quad" },
  { key: "film_roll",        label: "Film Roll",                count: 3, description: "Classic 35mm film reel frames" },
  { key: "anniversary_card", label: "Anniversary Card",         count: 3, description: "1 featured centerpiece photo + 2 side snaps" },
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
  warm_brown: { label: "Warm Brown", bg: "#4A362D", text: "#F8F3EE", border: "#35261F" },
  burgundy:   { label: "Burgundy",   bg: "#8E2B45", text: "#FAF5EB", border: "#6E1B29" },
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
type StickerType = "flower" | "heart" | "ribbon" | "seal" | "coffee" | "star" | "sparkle" | "bow" | "film_tape" | "polaroid_tape";

interface StickerItem {
  id: string;
  type: StickerType;
  icon: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  rotation: number;
  scale: number;
}

const STICKER_PALETTE: { type: StickerType; icon: string; label: string }[] = [
  { type: "flower",        icon: "🌸", label: "Pressed Flowers" },
  { type: "heart",         icon: "💖", label: "Tiny Hearts" },
  { type: "ribbon",        icon: "🎀", label: "Ribbon" },
  { type: "seal",          icon: "📜", label: "Wax Seal" },
  { type: "coffee",        icon: "☕", label: "Coffee Stain" },
  { type: "star",          icon: "⭐", label: "Stars" },
  { type: "sparkle",       icon: "✨", label: "Sparkles" },
  { type: "bow",           icon: "🎀", label: "Bow" },
  { type: "film_tape",     icon: "🎞️", label: "Film Tape" },
  { type: "polaroid_tape", icon: "🏷️", label: "Polaroid Tape" },
];

// ── Synthesize Shutter Sound using Web Audio API ─────────────────────────────
function playShutterSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function PhotoBoothPage() {
  const { pair } = useAuth();
  const supabase = createClient();

  // Stepper State: 1 | 2 | 3 | 4
  const [step, setStep] = useState<number>(1);

  // Step 1: Layout Selection
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("strip_4");

  // Step 2: Camera & Capture State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("none");
  const [countdownSec, setCountdownSec] = useState<number>(3);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);

  // Step 3: Decorate State
  const [frameColor, setFrameColor] = useState<FrameColor>("cream");
  const [paperTexture, setPaperTexture] = useState<PaperTexture>("plain");
  const [showDateStamp, setShowDateStamp] = useState<boolean>(true);
  const [showTimeStamp, setShowTimeStamp] = useState<boolean>(false);
  const [locationText, setLocationText] = useState<string>("");
  const [captionText, setCaptionText] = useState<string>("");
  const [placedStickers, setPlacedStickers] = useState<StickerItem[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Step 4: Save & Export State
  const [savingScrapbook, setSavingScrapbook] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stripPreviewRef = useRef<HTMLDivElement>(null);

  const currentLayoutConfig = LAYOUTS.find(l => l.key === selectedLayout) || LAYOUTS[1];
  const currentFilterConfig = FILTERS.find(f => f.key === selectedFilter) || FILTERS[0];

  // Nav show/hide effect
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("navigation-hide"));
    return () => {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    };
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
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Mirroring transform if needed
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      if (videoRef.current && cameraAvailable) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback camera canvas drawing (simulated warm photobooth snap)
        ctx.fillStyle = "#F5EDD8";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#8E2B45";
        ctx.font = "bold 32px Cormorant Garamond";
        ctx.textAlign = "center";
        ctx.fillText("Pairfect Memory Snap ♡", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#6B564F";
        ctx.font = "18px Inter";
        ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height / 2 + 20);
      }
    }
    return canvas.toDataURL("image/jpeg", 0.92);
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

      // Small pause between multiple photos
      if (p < neededCount - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    setIsCapturing(false);
  }, [isCapturing, currentLayoutConfig, capturedPhotos, countdownSec, flashEnabled, capturePhotoFrame]);

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
          setCapturedPhotos(prev => [...prev, ev.target!.result as string].slice(0, currentLayoutConfig.count));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Sticker Helpers ──────────────────────────────────────────────────────
  const addSticker = (type: StickerType, icon: string, label: string) => {
    const newSticker: StickerItem = {
      id: "st-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type,
      icon,
      label,
      x: 35 + Math.random() * 30,
      y: 20 + Math.random() * 50,
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    setPlacedStickers(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const updateSticker = (id: string, updates: Partial<StickerItem>) => {
    setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSticker = (id: string) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  // ── Preload image safely as Data URL / HTMLImageElement ─────────────────
  const loadImageAsync = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback canvas image if load fails
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = 640;
        fallbackCanvas.height = 480;
        const fCtx = fallbackCanvas.getContext("2d");
        if (fCtx) {
          fCtx.fillStyle = "#F5EDD8";
          fCtx.fillRect(0, 0, 640, 480);
          fCtx.fillStyle = "#8E2B45";
          fCtx.font = "bold 28px sans-serif";
          fCtx.textAlign = "center";
          fCtx.fillText("Pairfect Photo Snap ♡", 320, 240);
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = fallbackCanvas.toDataURL("image/png");
      };

      if (src.startsWith("http://") || src.startsWith("https://")) {
        // Fetch as blob to convert to Data URL, bypassing cross-origin canvas taints completely
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

  // ── Async Canvas Exporter for PNG/PDF Download (300 DPI High-Res) ──────────────
  const renderStripToCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const width = 1200; // 300 DPI high-res output
    const height = selectedLayout === "polaroid_grid" ? 1200 : selectedLayout === "journal" ? 1500 : 2000;
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
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Header title
    ctx.fillStyle = fStyle.text;
    ctx.font = "italic bold 44px Cormorant Garamond, serif";
    ctx.textAlign = "center";
    ctx.fillText("Pairfect Photo Booth ♡", width / 2, 80);

    // Date & Time Stamps
    ctx.font = "28px Caveat, cursive";
    const dateText = showDateStamp ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
    const timeText = showTimeStamp ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
    const stampCombined = [dateText, timeText, locationText].filter(Boolean).join(" · ");

    if (stampCombined) {
      ctx.fillText(stampCombined, width / 2, 125);
    }

    // Preload ALL images asynchronously as Data URLs
    const loadedImages = await Promise.all(capturedPhotos.map(src => loadImageAsync(src)));

    // Calculate layout parameters
    const count = currentLayoutConfig.count;
    const padding = 60;
    const topOffset = stampCombined ? 160 : 110;
    const availableHeight = height - topOffset - 160;

    // Save context for filter application
    ctx.save();
    if (currentFilterConfig.css && currentFilterConfig.css !== "none") {
      ctx.filter = currentFilterConfig.css;
    }

    if (selectedLayout === "strip_3" || selectedLayout === "strip_4") {
      const slotHeight = (availableHeight - (count - 1) * 30) / count;
      const slotWidth = width - padding * 2;

      loadedImages.forEach((img, idx) => {
        const y = topOffset + idx * (slotHeight + 30);

        // Photo white border box
        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(padding - 8, y - 8, slotWidth + 16, slotHeight + 16);
        ctx.restore();

        // Draw photo with filter applied
        ctx.drawImage(img, padding, y, slotWidth, slotHeight);
      });
    } else if (selectedLayout === "polaroid_grid") {
      const gridW = (width - padding * 2 - 30) / 2;
      const gridH = (availableHeight - 30) / 2;

      loadedImages.slice(0, 4).forEach((img, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = padding + col * (gridW + 30);
        const y = topOffset + row * (gridH + 30);

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, gridW + 16, gridH + 16);
        ctx.restore();

        ctx.drawImage(img, x, y, gridW, gridH);
      });
    } else if (selectedLayout === "journal") {
      const slotW = (width - padding * 2 - 30) / 2;
      const slotH = slotW * 0.75;

      loadedImages.slice(0, 2).forEach((img, idx) => {
        const x = padding + idx * (slotW + 30);
        const y = topOffset + 20;

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, slotW + 16, slotH + 16);
        ctx.restore();

        ctx.drawImage(img, x, y, slotW, slotH);
      });

      // Journal notes area lines
      ctx.save();
      ctx.filter = "none";
      ctx.strokeStyle = "rgba(142, 43, 69, 0.2)";
      ctx.lineWidth = 2;
      const lineStartY = topOffset + slotH + 80;
      for (let l = lineStartY; l < height - 120; l += 50) {
        ctx.beginPath();
        ctx.moveTo(padding, l);
        ctx.lineTo(width - padding, l);
        ctx.stroke();
      }
      ctx.restore();
    } else if (selectedLayout === "film_roll") {
      // Dark film roll background
      ctx.save();
      ctx.filter = "none";
      ctx.fillStyle = "#1A1410";
      ctx.fillRect(padding - 20, topOffset - 20, width - (padding - 20) * 2, availableHeight + 40);

      // Sprocket holes
      ctx.fillStyle = "#FAF5EB";
      for (let yH = topOffset; yH < topOffset + availableHeight; yH += 60) {
        ctx.fillRect(padding - 10, yH, 16, 26);
        ctx.fillRect(width - padding - 6, yH, 16, 26);
      }
      ctx.restore();

      const slotHeight = (availableHeight - (count - 1) * 30) / count;
      const slotWidth = width - padding * 2 - 80;

      loadedImages.forEach((img, idx) => {
        const y = topOffset + idx * (slotHeight + 30);
        ctx.drawImage(img, padding + 40, y, slotWidth, slotHeight);
      });
    } else if (selectedLayout === "anniversary_card") {
      // 1 main hero photo + 2 side photos
      const mainW = (width - padding * 2) * 0.58;
      const mainH = availableHeight;
      const sideW = (width - padding * 2) * 0.38;
      const sideH = (availableHeight - 30) / 2;

      if (loadedImages[0]) {
        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(padding - 8, topOffset - 8, mainW + 16, mainH + 16);
        ctx.restore();

        ctx.drawImage(loadedImages[0], padding, topOffset, mainW, mainH);
      }

      loadedImages.slice(1, 3).forEach((img, idx) => {
        const y = topOffset + idx * (sideH + 30);
        const x = padding + mainW + 30;

        ctx.save();
        ctx.filter = "none";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 8, y - 8, sideW + 16, sideH + 16);
        ctx.restore();

        ctx.drawImage(img, x, y, sideW, sideH);
      });
    }

    ctx.restore(); // Restore filter

    // Draw Caption Footer
    if (captionText) {
      ctx.fillStyle = fStyle.text;
      ctx.font = "italic 38px EB Garamond, serif";
      ctx.textAlign = "center";
      ctx.fillText(`“${captionText}”`, width / 2, height - 60);
    }

    // Draw Stickers on top of canvas
    placedStickers.forEach((st) => {
      ctx.save();
      const posX = (st.x / 100) * width;
      const posY = (st.y / 100) * height;

      ctx.translate(posX, posY);
      ctx.rotate((st.rotation * Math.PI) / 180);
      ctx.scale(st.scale, st.scale);

      ctx.font = "52px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.icon, 0, 0);

      ctx.restore();
    });

    return canvas;
  }, [frameColor, paperTexture, selectedLayout, currentLayoutConfig, capturedPhotos, showDateStamp, showTimeStamp, locationText, captionText, placedStickers, currentFilterConfig, loadImageAsync]);

  const [isExporting, setIsExporting] = useState(false);

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

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
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

      <main className="max-w-4xl mx-auto px-4 py-16 pb-36">

        {/* ─── HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-8"
        >
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Pairfect Keepsakes</p>
          <h1 className="font-heading font-bold text-4xl text-[var(--text)]">Photo Booth</h1>
          <p className="font-quote italic text-sm text-[var(--text-soft)]">
            Capture moments you&apos;ll smile at years from now.
          </p>
        </motion.div>

        {/* ─── STEPPER BAR ─── */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-2 sm:gap-4 p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xs">
            {[
              { num: 1, label: "Choose Layout" },
              { num: 2, label: "Capture" },
              { num: 3, label: "Decorate" },
              { num: 4, label: "Save" },
            ].map((s, idx) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => { if (step > s.num || (s.num === 2 && capturedPhotos.length > 0)) setStep(s.num); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                      isActive
                        ? "bg-[var(--burgundy)] text-white font-bold shadow-xs"
                        : isDone
                        ? "bg-[var(--rose)]/20 text-[var(--burgundy)] font-medium cursor-pointer"
                        : "text-[var(--text-soft)] opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-current">
                      {isDone ? "✓" : s.num}
                    </span>
                    <span className="font-mono hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < 3 && <div className="w-4 sm:w-8 h-0.5 bg-[var(--border)]" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: CHOOSE LAYOUT
            ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Select Your Photo Strip Layout</h2>
              <p className="font-quote italic text-xs text-[var(--text-soft)]">Choose the arrangement for your keepsake</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {LAYOUTS.map((layout) => {
                const isSelected = selectedLayout === layout.key;
                return (
                  <motion.button
                    key={layout.key}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedLayout(layout.key)}
                    className={`p-5 rounded-[var(--radius-card)] border flex flex-col justify-between text-left transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? "bg-[var(--paper-warm)] border-2 border-[var(--burgundy)] shadow-md"
                        : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--rose)]"
                    }`}
                  >
                    <div className="space-y-2 mb-4">
                      {/* Layout Icon Placeholder Box */}
                      <div className="w-full h-32 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center p-3">
                        {layout.key === "strip_3" && (
                          <div className="flex flex-col gap-1.5 w-12">
                            {[1, 2, 3].map(i => <div key={i} className="h-6 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />)}
                          </div>
                        )}
                        {layout.key === "strip_4" && (
                          <div className="flex flex-col gap-1 w-12">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-5 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />)}
                          </div>
                        )}
                        {layout.key === "journal" && (
                          <div className="grid grid-cols-2 gap-2 w-28">
                            <div className="h-16 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />
                            <div className="h-16 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />
                          </div>
                        )}
                        {layout.key === "polaroid_grid" && (
                          <div className="grid grid-cols-2 gap-1.5 w-20">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-9 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />)}
                          </div>
                        )}
                        {layout.key === "film_roll" && (
                          <div className="flex items-center gap-1.5 w-28">
                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-14 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />)}
                          </div>
                        )}
                        {layout.key === "anniversary_card" && (
                          <div className="flex items-center gap-1.5 w-28">
                            <div className="w-14 h-16 rounded bg-[var(--burgundy)]/20 border border-[var(--burgundy)]/30" />
                            <div className="flex flex-col gap-1">
                              <div className="w-8 h-7 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />
                              <div className="w-8 h-7 rounded bg-[var(--rose)]/30 border border-[var(--burgundy)]/20" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-base text-[var(--text)]">{layout.label}</h3>
                        {isSelected && <span className="text-xs text-[var(--burgundy)] font-bold">Selected ✓</span>}
                      </div>
                      <p className="text-xs text-[var(--text-soft)] font-sans">{layout.description}</p>
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)]">
                      {layout.count} Photo Snaps
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="btn-primary py-3 px-8 text-sm inline-flex items-center gap-2"
              >
                Continue to Camera →
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
                className="flex items-center gap-1 text-xs font-sans text-[var(--text-soft)] hover:text-[var(--text)]"
              >
                <ArrowLeft className="w-4 h-4" /> Change Layout
              </button>

              <span className="text-[10px] font-mono text-[var(--burgundy)] font-bold">
                Photo {capturedPhotos.length} of {currentLayoutConfig.count}
              </span>
            </div>

            {/* Main Camera Viewfinder Card */}
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-md space-y-6">

              {/* Viewfinder Video Stream Container */}
              <div className="relative mx-auto max-w-md aspect-4/3 rounded-2xl bg-black overflow-hidden border-2 border-[var(--border)] shadow-inner flex items-center justify-center">
                {cameraAvailable ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      transform: isMirrored ? "scaleX(-1)" : "none",
                      filter: currentFilterConfig.css,
                    }}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-10 h-10 text-[var(--rose)] mx-auto opacity-70" />
                    <p className="font-heading text-lg text-[#F8F3EE]">Camera Unavailable</p>
                    <p className="text-xs text-[var(--text-soft)] font-sans">
                      {cameraError || "Your browser camera stream couldn't be loaded."}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary py-2 px-4 text-xs mx-auto"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Upload Photo Files Instead
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
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
                      <span className="font-heading font-bold text-7xl text-white drop-shadow-md">
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
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                          isSel
                            ? "bg-[var(--burgundy)] text-white font-bold shadow-xs"
                            : "bg-[var(--bg-secondary)] text-[var(--text-soft)] hover:text-[var(--text)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Camera Action Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`btn-secondary py-2 px-3 text-xs ${isMirrored ? "border-[var(--burgundy)] text-[var(--burgundy)]" : ""}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Mirror
                </button>

                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`btn-secondary py-2 px-3 text-xs ${flashEnabled ? "border-[var(--burgundy)] text-[var(--burgundy)]" : ""}`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Flash: {flashEnabled ? "ON" : "OFF"}
                </button>

                {/* Countdown Timer Selector */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
                  {[3, 5, 10].map(s => (
                    <button
                      key={s}
                      onClick={() => setCountdownSec(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono ${countdownSec === s ? "bg-[var(--burgundy)] text-white font-bold" : "text-[var(--text-soft)]"}`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>

                {capturedPhotos.length > 0 && (
                  <button
                    onClick={() => setCapturedPhotos([])}
                    className="btn-secondary py-2 px-3 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Retake
                  </button>
                )}
              </div>

              {/* Big Capture Trigger Button */}
              <div className="text-center pt-2">
                <button
                  disabled={isCapturing}
                  onClick={triggerCaptureSequence}
                  className="btn-primary py-3.5 px-10 text-base rounded-full shadow-lg"
                >
                  {isCapturing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Capturing…</>
                  ) : (
                    <><Camera className="w-5 h-5" /> Start Photo Snap</>
                  )}
                </button>
              </div>

            </div>

            {/* Captured Photos Thumbnail Strip Preview */}
            {capturedPhotos.length > 0 && (
              <div className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                  Captured Snaps ({capturedPhotos.length} / {currentLayoutConfig.count})
                </p>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {capturedPhotos.map((imgSrc, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0 shadow-xs">
                      <img src={imgSrc} alt="" style={{ filter: currentFilterConfig.css }} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[var(--burgundy)] text-white text-[9px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {capturedPhotos.length >= currentLayoutConfig.count && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="btn-primary py-2.5 px-6 text-sm"
                    >
                      Proceed to Decorate →
                    </button>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3: DECORATE (TWO-COLUMN EDITOR)
            ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs font-sans text-[var(--text-soft)] hover:text-[var(--text)]"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Camera
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-primary py-2 px-6 text-xs"
              >
                Done Decorating →
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
                  className="relative w-full max-w-sm p-6 rounded-[var(--radius-card)] border-2 shadow-xl space-y-4 select-none overflow-hidden transition-all duration-300"
                >
                  {/* Photo Strip Header Title */}
                  <div className="text-center space-y-1">
                    <p className="font-heading font-bold text-2xl tracking-tight">Pairfect Photo Booth ♡</p>

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

                  {/* Captured Photos Grid/Strip */}
                  <div className="space-y-3">
                    {capturedPhotos.map((src, idx) => (
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
              <div className="md:col-span-6 space-y-6 p-6 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-sm">

                {/* 1. Frame Color */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block">Frame Color</label>
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
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block">Paper Texture</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PAPER_TEXTURES) as PaperTexture[]).map((texKey) => {
                      const isSel = paperTexture === texKey;
                      return (
                        <button
                          key={texKey}
                          onClick={() => setPaperTexture(texKey)}
                          className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                            isSel ? "bg-[var(--burgundy)] text-white font-bold" : "bg-[var(--bg-secondary)] text-[var(--text-soft)] border-[var(--border)]"
                          }`}
                        >
                          {PAPER_TEXTURES[texKey].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Stamps & Text Inputs */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans text-[var(--text)]">Date Stamp</span>
                    <button
                      onClick={() => setShowDateStamp(!showDateStamp)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${showDateStamp ? "bg-[var(--burgundy)]" : "bg-[var(--border)]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showDateStamp ? "translate-x-4" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans text-[var(--text)]">Time Stamp</span>
                    <button
                      onClick={() => setShowTimeStamp(!showTimeStamp)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${showTimeStamp ? "bg-[var(--burgundy)]" : "bg-[var(--border)]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showTimeStamp ? "translate-x-4" : ""}`} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Location (e.g. Paris, Living Room)"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)]"
                  />

                  <input
                    type="text"
                    placeholder="Caption (e.g. Silly faces & sweet smiles ♡)"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)]"
                  />
                </div>

                {/* 4. Stickers Palette */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block">
                    Curated Stickers (Tap to place)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {STICKER_PALETTE.map((st) => (
                      <button
                        key={st.type}
                        onClick={() => addSticker(st.type, st.icon, st.label)}
                        className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                        title={st.label}
                      >
                        <span className="text-xl">{st.icon}</span>
                        <span className="text-[8px] font-mono text-[var(--text-soft)] truncate max-w-full">{st.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Sticker Control Toolbar */}
                  {activeStickerId && (
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-[var(--burgundy)] font-bold">Sticker Selected</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const current = placedStickers.find(s => s.id === activeStickerId);
                            if (current) updateSticker(activeStickerId, { rotation: current.rotation + 15 });
                          }}
                          className="p-1 rounded bg-[var(--bg-secondary)] text-[var(--text)]"
                          title="Rotate"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const current = placedStickers.find(s => s.id === activeStickerId);
                            if (current) updateSticker(activeStickerId, { scale: Math.min(2, current.scale + 0.2) });
                          }}
                          className="p-1 rounded bg-[var(--bg-secondary)] text-[var(--text)]"
                          title="Scale Up"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeSticker(activeStickerId)}
                          className="p-1 rounded bg-red-100 text-red-600"
                          title="Delete Sticker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 4: SAVE & PRIVACY & SCRAPBOOK
            ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-bold text-3xl text-[var(--text)]">Your Photo Strip Keepsake</h2>
              <p className="font-quote italic text-sm text-[var(--text-soft)]">Ready to download and save to your scrapbook</p>
            </div>

            {/* Privacy Card */}
            <div className="p-4 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-2 text-center">
              <p className="font-heading font-bold text-base text-[var(--burgundy)]">♡ A little reminder</p>
              <p className="text-xs text-[var(--text-soft)] font-sans leading-relaxed">
                Your photo strip is never uploaded to Pairfect. For your privacy, everything stays on your device. Once you leave this page, the strip can&apos;t be recovered. Be sure to download it first.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                disabled={isExporting}
                onClick={downloadPNG}
                className="btn-primary py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PNG
              </button>

              <button
                disabled={isExporting}
                onClick={downloadPDF}
                className="btn-secondary py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Download PDF
              </button>

              <button
                onClick={() => {
                  setCapturedPhotos([]);
                  setPlacedStickers([]);
                  setStep(1);
                }}
                className="btn-secondary sm:col-span-2 py-3 text-xs inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Create Another Strip
              </button>
            </div>

          </motion.div>
        )}

      </main>
    </div>
  );
}
