"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import {
  Camera, Loader2, AlertCircle, RefreshCw, Sparkles,
  BookOpen, Check, Video, VideoOff, Zap, LayoutTemplate, Palette as PaletteIcon, Download
} from "lucide-react";

// ─── Filter Presets ───────────────────────────────────────────────────
const FILTERS = [
  { id: "none",    label: "Normal",  css: "none",                                           preview: "bg-gray-200" },
  { id: "warm",    label: "Warm",    css: "sepia(0.3) saturate(1.4) brightness(1.05)",      preview: "bg-amber-200" },
  { id: "vintage", label: "Vintage", css: "sepia(0.55) contrast(1.1) brightness(0.95)",     preview: "bg-yellow-700/40" },
  { id: "bw",      label: "B&W",     css: "grayscale(1) contrast(1.1)",                     preview: "bg-gray-500" },
  { id: "vibrant", label: "Vibrant", css: "saturate(1.8) contrast(1.1) brightness(1.05)",  preview: "bg-pink-300" },
  { id: "soft",    label: "Soft",    css: "brightness(1.1) contrast(0.85) saturate(0.9)",  preview: "bg-rose-100" },
];

// ─── Strip Layouts ────────────────────────────────────────────────────
const LAYOUTS = [
  { id: "classic", label: "Classic Strip (1 × 4)", icon: "📷", desc: "1 × 4" },
  { id: "grid",    label: "Grid Layout (2 × 2)",   icon: "⊞",  desc: "2 × 2" },
];

// ─── Background Presets ───────────────────────────────────────────────
type BgPreset = {
  id: string;
  label: string;
  pack: "simple" | "patterns";
  apply: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  preview: string;
  previewClass?: string;
};
const BG_PRESETS: BgPreset[] = [
  // Simple (Solid colors)
  {
    id: "cream", label: "Cream", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#f8f4f0"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#f8f4f0] border-gray-200",
  },
  {
    id: "white", label: "White", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-white border-gray-200",
  },
  {
    id: "dark", label: "Midnight", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#0a0a0b"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#0a0a0b] border-gray-800",
  },
  {
    id: "rose", label: "Rose", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#fff1f2"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#fff1f2] border-rose-200",
  },
  {
    id: "sky", label: "Sky", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#eff6ff"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#eff6ff] border-blue-200",
  },
  {
    id: "lavender", label: "Lilac", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#faf5ff"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#faf5ff] border-purple-200",
  },
  {
    id: "peach", label: "Peach", pack: "simple",
    apply: (ctx, w, h) => { ctx.fillStyle = "#fff7ed"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#fff7ed] border-orange-200",
  },

  // Patterns (Prints & scenes)
  {
    id: "teddy", label: "teddy", pack: "patterns",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#fcf5eb"; ctx.fillRect(0, 0, w, h);
      ctx.font = "28px sans-serif";
      ctx.fillText("🐻", 12, 40); ctx.fillText("🐻", w - 42, 40);
      ctx.fillText("🐻", 12, h - 20); ctx.fillText("🐻", w - 42, h - 20);
      ctx.fillText("🍪", w / 2 - 14, h - 20);
    },
    preview: "bg-[#fcf5eb] border-amber-200",
    previewClass: "bg-[#fcf5eb] relative overflow-hidden after:content-['🐻'] after:absolute after:bottom-1 after:right-1 after:text-[10px]",
  },
  {
    id: "hearts", label: "hearts", pack: "patterns",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#fff5f5"; ctx.fillRect(0, 0, w, h);
      ctx.font = "22px sans-serif";
      for (let y = 40; y < h; y += 90) {
        ctx.fillText("❤️", 12, y);
        ctx.fillText("❤️", w - 32, y + 45);
      }
    },
    preview: "bg-[#fff5f5] border-red-200",
    previewClass: "bg-[#fff5f5] relative overflow-hidden after:content-['❤️'] after:absolute after:bottom-1 after:right-1 after:text-[10px]",
  },
  {
    id: "cherry", label: "cherry", pack: "patterns",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#f0f9ff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e0f2fe";
      const size = 30;
      for (let x = 0; x < w; x += size * 2) {
        for (let y = 0; y < h; y += size * 2) {
          ctx.fillRect(x, y, size, size);
          ctx.fillRect(x + size, y + size, size, size);
        }
      }
      ctx.font = "28px sans-serif";
      ctx.fillText("🍒", 12, 40); ctx.fillText("🍒", w - 42, 40);
      ctx.fillText("🍒", 12, h - 20); ctx.fillText("🍒", w - 42, h - 20);
    },
    preview: "bg-sky-100 border-sky-300",
    previewClass: "bg-sky-100 relative overflow-hidden after:content-['🍒'] after:absolute after:bottom-1 after:right-1 after:text-[10px]",
  },
  {
    id: "gingham", label: "gingham", pack: "patterns",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#f0fdf4"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#dcfce7";
      const size = 25;
      for (let x = 0; x < w; x += size * 2) {
        for (let y = 0; y < h; y += size * 2) {
          ctx.fillRect(x, y, size, size);
          ctx.fillRect(x + size, y + size, size, size);
        }
      }
      ctx.font = "24px sans-serif";
      ctx.fillText("⭐", 15, 35); ctx.fillText("⭐", w - 35, 35);
      ctx.fillText("⭐", 15, h - 20); ctx.fillText("⭐", w - 35, h - 20);
    },
    preview: "bg-emerald-100 border-emerald-300",
    previewClass: "bg-emerald-100 relative overflow-hidden after:content-['⭐'] after:absolute after:bottom-1 after:right-1 after:text-[10px]",
  },
  {
    id: "confetti", label: "confetti", pack: "patterns",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      const dots = ["#f472b6","#60a5fa","#fbbf24","#34d399","#a78bfa"];
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = dots[i % dots.length];
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    preview: "bg-white border-pink-200",
    previewClass: "bg-white relative overflow-hidden after:content-['🎉'] after:absolute after:bottom-1 after:right-1 after:text-[10px]",
  },
];

// ─── Sticker Presets ──────────────────────────────────────────────────
const STICKERS = ["❤️","✨","🐾","⭐","😘","🌸","💋","🎉","🔥","🌈","💭","🦋"];

type Sticker = { id: string; emoji: string; x: number; y: number; size: number };

// ─── Polaroid Card ────────────────────────────────────────────────────
function PolaroidCard({ src, caption, date, rotate }: {
  src: string; caption?: string; date: string; rotate: string;
}) {
  return (
    <div
      className={`bg-white shadow-lg p-3 pb-10 flex flex-col items-center ${rotate} hover:scale-105 hover:z-10 transition-all duration-300 cursor-pointer`}
      style={{ fontFamily: "'Caveat', cursive" }}
    >
      <div className="w-full aspect-square overflow-hidden bg-gray-100 mb-2">
        <img src={src} alt={caption || "Photobooth"} className="w-full h-full object-cover" />
      </div>
      {caption && <p className="text-gray-700 text-sm text-center leading-tight mt-1 px-1 line-clamp-2">{caption}</p>}
      <p className="text-gray-400 text-[10px] mt-1">{date}</p>
    </div>
  );
}

// ─── Draggable Sticker Layer ──────────────────────────────────────────
function StickerLayer({
  stickers, onMove, onRemove, containerRef,
}: {
  stickers: Sticker[];
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sticker = stickers.find(s => s.id === id)!;
    dragging.current = {
      id,
      ox: e.clientX - rect.left - sticker.x,
      oy: e.clientY - rect.top  - sticker.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onMove(dragging.current.id,
      e.clientX - rect.left - dragging.current.ox,
      e.clientY - rect.top  - dragging.current.oy
    );
  };

  const onPointerUp = () => { dragging.current = null; };

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {stickers.map(s => (
        <div
          key={s.id}
          className="absolute select-none touch-none group"
          style={{ left: s.x, top: s.y, fontSize: s.size, lineHeight: 1, cursor: "grab" }}
          onPointerDown={e => onPointerDown(e, s.id)}
          onDoubleClick={() => onRemove(s.id)}
          title="Drag to move · Double-tap to remove"
        >
          {s.emoji}
          <span className="absolute -top-3 -right-3 hidden group-hover:flex w-5 h-5 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full cursor-pointer z-10"
            onClick={e => { e.stopPropagation(); onRemove(s.id); }}
          >×</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function PhotoboothPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  type Screen = "lobby" | "camera" | "countdown" | "customize" | "strip" | "gallery";
  const [screen, setScreen] = useState<Screen>("lobby");
  const [error, setError] = useState<string | null>(null);

  // Customization step wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<"simple" | "patterns">("simple");

  // Camera settings
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);

  // Multiple Poses Capture State
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]); // local Blob/Object URLs (size 4)
  const [captureIndex, setCaptureIndex] = useState(0);                // 0 to 3
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  // Customization elements
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const stripPreviewRef = useRef<HTMLDivElement | null>(null);
  const [caption, setCaption] = useState("");
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Gallery
  const [strips, setStrips] = useState<any[]>([]);
  const [fetchingStrips, setFetchingStrips] = useState(false);

  const ROTATIONS = ["-rotate-2","rotate-1","-rotate-1","rotate-2","-rotate-3","rotate-3","rotate-0"];

  // Callback ref for camera view binding
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(err => {
        console.error("Camera play failed on callback ref bind:", err);
      });
    }
  }, []);

  // ── Camera helpers ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(err => {
          console.error("Camera play failed:", err);
        });
      }
    } catch (e: any) {
      setCameraError(`Camera connection error: ${e.name} - ${e.message}. Please check browser settings and permissions.`);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
  }, []);

  // ── Gallery strips fetch ──────────────────────────────────────────
  const fetchStrips = useCallback(async () => {
    if (!pair) return;
    setFetchingStrips(true);
    try {
      const { data } = await supabase
        .from("photobooth_strips")
        .select("*, photobooth_sessions(pair_id)")
        .eq("photobooth_sessions.pair_id", pair.id)
        .order("created_at", { ascending: false });

      const resolved = await Promise.all((data || []).map(async (strip: any) => {
        try {
          const { data: urlData } = await supabase.storage
            .from("memories").createSignedUrl(strip.combined_image_url, 3600);
          return { ...strip, resolved_url: urlData?.signedUrl };
        } catch { return { ...strip, resolved_url: null }; }
      }));
      setStrips(resolved.filter((s: any) => s.resolved_url));
    } catch (e: any) { console.error(e); }
    finally { setFetchingStrips(false); }
  }, [pair, supabase]);

  useEffect(() => { if (!loading && pair) fetchStrips(); }, [loading, pair]);

  // ── Start Capture sequence ────────────────────────────────────────
  const handleStartCapture = async () => {
    setCapturedPhotos([]);
    setCaptureIndex(0);
    setError(null);
    setScreen("camera");
    await startCamera();
  };

  // ── Trigger the 4 poses countdown loop ───────────────────────────
  const startPoseCountdown = () => {
    setScreen("countdown");
    runPoseCountdown(3);
  };

  const runPoseCountdown = (from: number) => {
    setCountdownValue(from);
    let val = from;
    const tick = setInterval(() => {
      val -= 1;
      if (val <= 0) {
        clearInterval(tick);
        setCountdownValue(0);
        // Snap!
        capturePoseFrame();
      } else {
        setCountdownValue(val);
      }
    }, 1000);
  };

  // ── Capture a single pose frame ──────────────────────────────────
  const capturePoseFrame = async () => {
    const video = videoElementRef.current;
    if (!video) return;

    // Trigger flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    // Ensure video isn't paused
    if (video.paused) {
      try { await video.play(); } catch (_) {}
    }

    // Wait for frames ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      await new Promise<void>((res) => {
        const onFrame = () => { video.removeEventListener("loadeddata", onFrame); res(); };
        video.addEventListener("loadeddata", onFrame);
        setTimeout(onFrame, 500);
      });
    }

    // Draw first to temp canvas (unfiltered, mirrored for Safari compatibility)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 640; tempCanvas.height = 640;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Apply CSS filters on main canvas
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    if (selectedFilter.css !== "none") {
      ctx.filter = selectedFilter.css;
    }
    ctx.drawImage(tempCanvas, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedPhotos(prev => {
        const next = [...prev, url];
        const nextIndex = next.length;

        if (nextIndex < 4) {
          // Move to next pose
          setCaptureIndex(nextIndex);
          setTimeout(() => runPoseCountdown(3), 1500); // 1.5s delay to pose
        } else {
          // Finished all 4 poses
          stopCamera();
          setWizardStep(1); // Choose layout
          setScreen("customize");
        }
        return next;
      });
    }, "image/jpeg", 0.92);
  };

  // ── Sticker helpers ───────────────────────────────────────────────
  const addSticker = (emoji: string) => {
    const container = stripPreviewRef.current;
    const rect = container?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 - 20 : 80;
    const cy = rect ? rect.height / 2 - 20 : 80;
    setStickers(prev => [...prev, {
      id: crypto.randomUUID(), emoji,
      x: cx + Math.random() * 40 - 20,
      y: cy + Math.random() * 40 - 20,
      size: 40,
    }]);
  };

  const moveSticker = (id: string, x: number, y: number) =>
    setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));

  const removeSticker = (id: string) =>
    setStickers(prev => prev.filter(s => s.id !== id));

  // ── Compose strip client-side ─────────────────────────────────────
  const composeStrip = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (capturedPhotos.length < 4) return null;

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((res, rej) => {
        const img = new Image();
        if (src.startsWith("http")) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => res(img);
        img.onerror = () => rej(new Error("Failed to load: " + src));
        img.src = src;
      });

    // Load all 4 pictures
    const [img1, img2, img3, img4] = await Promise.all([
      loadImg(capturedPhotos[0]),
      loadImg(capturedPhotos[1]),
      loadImg(capturedPhotos[2]),
      loadImg(capturedPhotos[3]),
    ]);

    const photoSize = 380;
    const pad = 24;
    const capH = 85;
    const border = 6;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    // ── Layout: Classic Strip (1x4 vertical) ──
    if (selectedLayout.id === "classic") {
      const W = photoSize + pad * 2;
      const H = pad * 5 + photoSize * 4 + capH;
      canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      ctx = canvas.getContext("2d")!;
      selectedBg.apply(ctx, W, H);

      // Top bar gradient
      const gb = ctx.createLinearGradient(0, 0, W, 0);
      gb.addColorStop(0, "#f472b6"); gb.addColorStop(1, "#60a5fa");
      ctx.fillStyle = gb; ctx.fillRect(0, 0, W, 5);

      const imgs = [img1, img2, img3, img4];
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 4; i++) {
        const y = pad + i * (photoSize + pad);
        ctx.fillRect(pad - border, y - border, photoSize + border * 2, photoSize + border * 2);
        ctx.drawImage(imgs[i], pad, y, photoSize, photoSize);
      }

      const capY = pad * 4 + photoSize * 4 + 14;
      ctx.fillStyle = selectedBg.id === "dark" ? "#e5e7eb" : "#374151";
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(caption || "📸 Our Photobooth strip", W / 2, capY + 22);
      ctx.fillStyle = "#9ca3af"; ctx.font = "14px sans-serif";
      ctx.fillText(format(new Date(), "MMM d, yyyy"), W / 2, capY + 46);
    }

    // ── Layout: Grid (2x2 Grid) ──
    else {
      const cell = 290;
      const W = cell * 2 + pad * 3;
      const H = cell * 2 + pad * 3 + capH;
      canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      ctx = canvas.getContext("2d")!;
      selectedBg.apply(ctx, W, H);

      // Top bar gradient
      const gb = ctx.createLinearGradient(0, 0, W, 0);
      gb.addColorStop(0, "#f472b6"); gb.addColorStop(1, "#60a5fa");
      ctx.fillStyle = gb; ctx.fillRect(0, 0, W, 5);

      ctx.fillStyle = "#ffffff";
      // Top-Left: Pose 1
      ctx.fillRect(pad - border, pad - border, cell + border * 2, cell + border * 2);
      ctx.drawImage(img1, pad, pad, cell, cell);
      // Top-Right: Pose 2
      ctx.fillRect(pad * 2 + cell - border, pad - border, cell + border * 2, cell + border * 2);
      ctx.drawImage(img2, pad * 2 + cell, pad, cell, cell);
      // Bottom-Left: Pose 3
      ctx.fillRect(pad - border, pad * 2 + cell - border, cell + border * 2, cell + border * 2);
      ctx.drawImage(img3, pad, pad * 2 + cell, cell, cell);
      // Bottom-Right: Pose 4
      ctx.fillRect(pad * 2 + cell - border, pad * 2 + cell - border, cell + border * 2, cell + border * 2);
      ctx.drawImage(img4, pad * 2 + cell, pad * 2 + cell, cell, cell);

      const capY = pad * 2 + cell * 2 + 14;
      ctx.fillStyle = selectedBg.id === "dark" ? "#e5e7eb" : "#374151";
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(caption || "📸 Our Grid strip", W / 2, capY + 22);
      ctx.fillStyle = "#9ca3af"; ctx.font = "14px sans-serif";
      ctx.fillText(format(new Date(), "MMM d, yyyy"), W / 2, capY + 46);
    }

    // ── Bake stickers ──
    if (stickers.length > 0 && stripPreviewRef.current) {
      const previewRect = stripPreviewRef.current.getBoundingClientRect();
      const scaleX = canvas.width / previewRect.width;
      const scaleY = canvas.height / previewRect.height;

      for (const s of stickers) {
        const size = s.size * Math.max(scaleX, scaleY);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(s.emoji, s.x * scaleX, s.y * scaleY + size * 0.8);
      }
    }

    return canvas;
  }, [capturedPhotos, caption, selectedLayout, selectedBg, stickers]);

  // ── Compose preview ───────────────────────────────────────────────
  const handleMakeStrip = async () => {
    setError(null);
    try {
      const canvas = await composeStrip();
      if (!canvas) { setError("Failed to compose strip."); return; }
      setStripUrl(canvas.toDataURL("image/jpeg", 0.92));
      setScreen("strip");
    } catch (e: any) { setError("Compose failed: " + e.message); }
  };

  // ── Save strip to Moments ─────────────────────────────────────────
  const handleSaveToMoments = async () => {
    if (!pair || !user || !stripUrl) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(stripUrl);
      const blob = await res.blob();

      // Create a dummy session for the database record
      const { data: sess, error: sErr } = await supabase
        .from("photobooth_sessions")
        .insert({ pair_id: pair.id, filter_applied: selectedFilter.id, status: "completed" })
        .select().single();
      if (sErr) throw sErr;

      const filename = `photobooth/${pair.id}/strip-${sess.id}-${Date.now()}.jpg`;

      // Upload composited strip
      const { error: upErr } = await supabase.storage
        .from("memories").upload(filename, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      // Save strip record
      await supabase.from("photobooth_strips").insert({
        session_id: sess.id, combined_image_url: filename,
        caption: caption || null, saved_to_moments: true,
      });

      // Save shared moment
      await supabase.from("shared_moments").insert({
        pair_id: pair.id, created_by: user.id,
        title: caption || "📸 Photobooth strip",
        description: `A customized photobooth strip.`,
        photo_url: filename,
        moment_date: format(new Date(), "yyyy-MM-dd"),
      });

      setScreen("gallery"); fetchStrips();
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  // ── Download strip to device ──────────────────────────────────────
  const handleDownload = () => {
    if (!stripUrl) return;
    const link = document.createElement("a");
    link.download = `pairfect-photobooth-${Date.now()}.png`;
    link.href = stripUrl;
    link.click();
  };

  const handleReset = () => {
    stopCamera();
    setScreen("lobby");
    setCapturedPhotos([]);
    setCaptureIndex(0);
    setStripUrl(null);
    setCaption("");
    setStickers([]);
    setError(null);
    setCountdownValue(null);
    setWizardStep(1);
    setSelectedPack("simple");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground">
      {/* Ambient backgrounds */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{
        background: "radial-gradient(50rem 35rem at 10% 5%,rgba(244,114,182,0.06) 0%,transparent 60%),radial-gradient(40rem 30rem at 90% 95%,rgba(96,165,250,0.06) 0%,transparent 60%)"
      }} />
      <Navigation />

      {/* Screen flash layer */}
      {flashActive && (
        <div className="fixed inset-0 bg-white z-50 animate-fade-out pointer-events-none" />
      )}

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col z-10">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── LOBBY SCREEN ──────────────────────────────────────────── */}
        {screen === "lobby" && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f472b6] to-[#60a5fa] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-sans font-black text-3xl tracking-tight text-foreground">Photobooth</h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Take 4 sequential photos in a row to create a classic custom photo strip. Pose, snap, apply custom themes and stickers!
              </p>
              <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground font-mono flex-wrap">
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-[#f472b6]" /> 4 Poses Burst</span>
                <span className="flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5 text-amber-400" /> layouts</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#60a5fa]" /> Stickers &amp; Themes</span>
              </div>
            </div>

            {/* Filter picker */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Choose Filter</p>
              <div className="flex gap-3 flex-wrap">
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setSelectedFilter(f)}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${selectedFilter.id === f.id ? "scale-110" : "opacity-70 hover:opacity-100"}`}>
                    <div className={`w-12 h-12 rounded-full ${f.preview} border-2 ${selectedFilter.id === f.id ? "border-[#f472b6] shadow-md shadow-pink-500/20" : "border-transparent"} transition-all`} />
                    <span className={`text-[9px] font-mono font-bold ${selectedFilter.id === f.id ? "text-[#f472b6]" : "text-muted-foreground"}`}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleStartCapture}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-lg bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-5 h-5" /> Start Photobooth
            </button>

            {strips.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Your Strips</p>
                <div className="grid grid-cols-3 gap-6 py-4">
                  {strips.slice(0, 6).map((strip: any, i) => (
                    <PolaroidCard key={strip.id} src={strip.resolved_url}
                      caption={strip.caption} date={format(new Date(strip.created_at), "MMM d")}
                      rotate={ROTATIONS[i % ROTATIONS.length]} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CAMERA PREVIEW SCREEN ─────────────────────────────────── */}
        {screen === "camera" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Webcam Ready</p>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-[#f472b6]/30 bg-black aspect-square">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                  <VideoOff className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                  <button onClick={startCamera} className="text-xs text-[#f472b6] underline cursor-pointer">Try again</button>
                </div>
              ) : (
                <video ref={videoRefCallback} autoPlay muted playsInline className="w-full h-full object-cover"
                  style={{ filter: selectedFilter.css === "none" ? undefined : selectedFilter.css, transform: "scaleX(-1)" }} />
              )}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-bold">
                {selectedFilter.label}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Make sure you are framed well. Once ready, tap start to begin the 4 poses.
            </p>

            <button onClick={startPoseCountdown}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-base bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Zap className="w-5 h-5" /> Start Poses Countdown ▷
            </button>
          </div>
        )}

        {/* ── COUNTDOWN CAPTURING SCREEN ────────────────────────────── */}
        {screen === "countdown" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                Pose {captureIndex + 1} of 4
              </p>
              <span className="text-xs text-[#f472b6] font-mono animate-pulse">Hold still!</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-[#f472b6]/30 bg-black aspect-square">
              <video ref={videoRefCallback} autoPlay muted playsInline className="w-full h-full object-cover"
                style={{ filter: selectedFilter.css === "none" ? undefined : selectedFilter.css, transform: "scaleX(-1)" }} />

              {/* Overlay countdown digits in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div key={countdownValue} className="text-[120px] font-black font-mono leading-none animate-bounce"
                  style={{
                    background: "linear-gradient(135deg, #f472b6, #60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {countdownValue === 0 ? "📸" : countdownValue}
                </div>
                <p className="text-white text-xs font-mono tracking-wider mt-4">
                  {countdownValue === 0 ? "Snapping Pose!" : `Posing in ${countdownValue}s`}
                </p>
              </div>

              {/* Visual mini-gallery of completed snaps inside capture screen */}
              <div className="absolute bottom-3 right-3 flex gap-1 bg-black/50 p-1.5 rounded-lg border border-white/20">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded border border-white/40 bg-stone-900 overflow-hidden flex items-center justify-center">
                    {capturedPhotos[i] ? (
                      <img src={capturedPhotos[i]} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono text-white/50">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CUSTOMIZE WIZARD SCREEN ───────────────────────────────── */}
        {screen === "customize" && (
          <div className="space-y-6 animate-fade-in">

            {/* WIZARD STEP 1: CHOOSE YOUR STRIP */}
            {wizardStep === 1 && (
              <div className="space-y-6 text-center">
                <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                  Choose Your Strip
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Classic Strip (1x4 representation) */}
                  <button
                    onClick={() => setSelectedLayout(LAYOUTS.find(l => l.id === "classic") || LAYOUTS[0])}
                    className={`flex flex-col items-center justify-center p-6 bg-card border-2 rounded-2xl transition-all cursor-pointer space-y-4
                      ${selectedLayout.id === "classic" ? "border-[#f472b6] shadow-lg shadow-pink-500/10" : "border-border hover:border-[#f472b6]/40"}`}
                  >
                    <div className="flex flex-col gap-1 w-12 border-2 border-foreground p-1.5 rounded bg-background">
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">1 × 4</span>
                  </button>

                  {/* Grid (2x2 representation) */}
                  <button
                    onClick={() => setSelectedLayout(LAYOUTS.find(l => l.id === "grid") || LAYOUTS[0])}
                    className={`flex flex-col items-center justify-center p-6 bg-card border-2 rounded-2xl transition-all cursor-pointer space-y-4
                      ${selectedLayout.id === "grid" ? "border-[#f472b6] shadow-lg shadow-pink-500/10" : "border-border hover:border-[#f472b6]/40"}`}
                  >
                    <div className="grid grid-cols-2 gap-1 w-16 border-2 border-foreground p-1.5 rounded bg-background">
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                      <div className="aspect-square border border-foreground/60 w-full" />
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">2 × 2</span>
                  </button>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 rounded-xl font-bold bg-[#8e8d92] text-white text-xs tracking-wider hover:opacity-95 cursor-pointer uppercase flex items-center gap-1.5 shadow"
                  >
                    next ▷
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 2: PICK A THEME PACK */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase text-center">
                  Pick a Theme Pack
                </p>

                <div className="space-y-3">
                  {/* Simple Pack Card */}
                  <button
                    onClick={() => { setSelectedPack("simple"); setWizardStep(3); }}
                    className="w-full flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:border-[#f472b6]/40 hover:shadow-md transition-all cursor-pointer text-left"
                  >
                    <div>
                      <h3 className="text-sm font-sans font-bold text-foreground">Simple</h3>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">solid colors · 7</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-1.5">
                        {BG_PRESETS.filter(b => b.pack === "simple").slice(0, 5).map(b => (
                          <div key={b.id} className={`w-6 h-6 rounded-full border border-white ${b.preview}`} />
                        ))}
                        <div className="w-6 h-6 rounded-full border border-white bg-stone-100 flex items-center justify-center text-[9px] font-mono font-bold text-stone-500">
                          +2
                        </div>
                      </div>
                      <span className="text-stone-400 font-mono text-xs">▷</span>
                    </div>
                  </button>

                  {/* Patterns Pack Card */}
                  <button
                    onClick={() => { setSelectedPack("patterns"); setWizardStep(3); }}
                    className="w-full flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:border-[#f472b6]/40 hover:shadow-md transition-all cursor-pointer text-left"
                  >
                    <div>
                      <h3 className="text-sm font-sans font-bold text-foreground">Patterns</h3>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">prints &amp; scenes · 11</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-1.5">
                        {BG_PRESETS.filter(b => b.pack === "patterns").slice(0, 5).map(b => (
                          <div key={b.id} className={`w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] bg-stone-100 ${b.preview}`} />
                        ))}
                        <div className="w-6 h-6 rounded-full border border-white bg-stone-100 flex items-center justify-center text-[9px] font-mono font-bold text-stone-500">
                          +6
                        </div>
                      </div>
                      <span className="text-stone-400 font-mono text-xs">▷</span>
                    </div>
                  </button>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button onClick={() => setWizardStep(1)} className="text-xs text-muted-foreground hover:underline cursor-pointer">
                    ◁ back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 rounded-xl font-bold bg-[#8e8d92] text-white text-xs tracking-wider hover:opacity-95 cursor-pointer uppercase flex items-center gap-1.5 shadow"
                  >
                    next ▷
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 3: THEMES SELECTION */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                    {selectedPack === "simple" ? "Simple Themes" : "Patterns Themes"}
                  </p>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="mt-2 text-[10px] font-mono font-bold bg-card border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ◁ packs
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x">
                  {BG_PRESETS.filter(b => b.pack === selectedPack).map(bg => {
                    const isSelected = selectedBg.id === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg)}
                        className={`flex-shrink-0 w-36 snap-start flex flex-col items-center justify-center p-4 bg-card border-2 rounded-2xl transition-all cursor-pointer space-y-4
                          ${isSelected ? "border-[#f472b6] bg-pink-500/5 shadow-md shadow-pink-500/10" : "border-border hover:border-[#f472b6]/40"}`}
                      >
                        <div className={`w-14 h-24 border border-foreground/30 rounded p-1 flex flex-col gap-1 ${bg.previewClass || bg.preview}`}>
                          <div className="w-full aspect-square border border-foreground/10 bg-white" />
                          <div className="w-full aspect-square border border-foreground/10 bg-white" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-foreground">{bg.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button onClick={() => setWizardStep(2)} className="text-xs text-muted-foreground hover:underline cursor-pointer">
                    ◁ back
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-6 py-2.5 rounded-xl font-bold bg-[#8e8d92] text-white text-xs tracking-wider hover:opacity-95 cursor-pointer uppercase flex items-center gap-1.5 shadow"
                  >
                    next ▷
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 4: STICKERS & CAPTION */}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                    Add Stickers &amp; Caption
                  </p>
                  <button onClick={() => setWizardStep(3)} className="text-xs text-muted-foreground hover:underline cursor-pointer">
                    ◁ back
                  </button>
                </div>

                {/* Combined preview with stickers layer */}
                <div ref={stripPreviewRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-white shadow-md select-none" style={{ minHeight: 280 }}>
                  {/* Visual mockup of the 4 stacked photos inside editor preview */}
                  <div className={`p-4 flex flex-col gap-2 items-center w-full min-h-[300px] ${selectedBg.previewClass || selectedBg.preview}`}>
                    {selectedLayout.id === "classic" ? (
                      <div className="flex flex-col gap-2 w-48">
                        {capturedPhotos.slice(0, 4).map((p, i) => (
                          <div key={i} className="aspect-square bg-white border-2 border-white shadow-sm overflow-hidden rounded">
                            <img src={p} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                        {capturedPhotos.slice(0, 4).map((p, i) => (
                          <div key={i} className="aspect-square bg-white border-2 border-white shadow-sm overflow-hidden rounded">
                            <img src={p} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <StickerLayer stickers={stickers} onMove={moveSticker} onRemove={removeSticker} containerRef={stripPreviewRef} />
                </div>

                {/* Stickers Selector */}
                <div className="space-y-2.5">
                  <p className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase">Stickers (tap to add, drag to place)</p>
                  <div className="flex flex-wrap gap-2">
                    {STICKERS.map(s => (
                      <button
                        key={s}
                        onClick={() => addSticker(s)}
                        className="w-11 h-11 rounded-xl border border-border bg-card hover:bg-accent hover:scale-110 active:scale-95 transition-all text-xl cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Pose for the camera 📸"
                    maxLength={80}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[#f472b6]/40"
                  />
                </div>

                <button
                  onClick={handleMakeStrip}
                  className="w-full py-4 rounded-2xl font-sans font-black text-white text-base bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Sparkles className="w-5 h-5" /> Compose Strip ▷
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── FINAL STRIP SCREEN ────────────────────────────────────── */}
        {screen === "strip" && stripUrl && (
          <div className="py-12 flex flex-col items-center gap-8 max-w-sm mx-auto animate-fade-in w-full">
            <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase text-center">Your Photobooth Strip ✨</p>

            <div className="relative bg-white shadow-2xl rounded-sm p-6 pb-12 mx-auto w-full border border-gray-100/50">
              {/* Polaroid-style scalloped edge decorations (hearts along sides) */}
              <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-between py-8 text-[9px] text-pink-400/40 select-none pointer-events-none">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <span key={idx}>♥</span>
                ))}
              </div>
              <div className="absolute right-2.5 top-0 bottom-0 flex flex-col justify-between py-8 text-[9px] text-pink-400/40 select-none pointer-events-none">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <span key={idx}>♥</span>
                ))}
              </div>

              {/* Decorative top bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#f472b6] to-[#60a5fa] mb-6 rounded-full" />
              
              {/* Image with padding */}
              <div className="px-3">
                <img src={stripUrl} alt="Photobooth strip" className="w-full rounded-sm shadow-sm border border-gray-100" />
              </div>

              {/* Caption and Date with clear vertical spacing */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-gray-700 text-xl font-bold font-sans" style={{ fontFamily: "'Caveat', cursive" }}>
                  {caption || "Our moment 💕"}
                </p>
                <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">{format(new Date(), "MMM d, yyyy")}</p>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex gap-4">
                <button onClick={() => setScreen("customize")}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-accent transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <PaletteIcon className="w-4 h-4" /> Re-customize
                </button>
                <button onClick={handleSaveToMoments} disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white text-xs bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save to Moments"}
                </button>
              </div>

              <div className="flex gap-4">
                <button onClick={handleDownload}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-foreground border border-foreground/30 bg-transparent hover:bg-foreground/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <Download className="w-4 h-4" /> Download Strip
                </button>
                <button onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-accent transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                  <RefreshCw className="w-4 h-4" /> Take Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── GALLERY SCREEN ────────────────────────────────────────── */}
        {screen === "gallery" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Saved!</p>
              <h2 className="font-sans font-black text-2xl text-foreground">Strip saved to Moments ✨</h2>
            </div>
            {fetchingStrips ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : strips.length > 0 ? (
              <div className="grid grid-cols-3 gap-6 py-4">
                {strips.map((strip: any, i) => (
                  <PolaroidCard key={strip.id} src={strip.resolved_url} caption={strip.caption}
                    date={format(new Date(strip.created_at), "MMM d")} rotate={ROTATIONS[i % ROTATIONS.length]} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">Your strips will appear here!</p>
            )}
            <button onClick={handleReset}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-base bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-5 h-5" /> Take Another Shot
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
