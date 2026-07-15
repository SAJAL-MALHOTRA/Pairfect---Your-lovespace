"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { format } from "date-fns";
import {
  Camera, Loader2, AlertCircle, RefreshCw, Sparkles,
  BookOpen, Check, Video, VideoOff, Zap, LayoutTemplate, Palette as PaletteIcon
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
  { id: "sidebyside", label: "Side by Side", icon: "⬛⬛" },
  { id: "classic",    label: "Classic Strip", icon: "📷" },
  { id: "grid",       label: "2×2 Grid",      icon: "⊞"  },
];

// ─── Background Presets ───────────────────────────────────────────────
type BgPreset = {
  id: string; label: string;
  apply: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  preview: string;
};
const BG_PRESETS: BgPreset[] = [
  {
    id: "cream", label: "Cream",
    apply: (ctx, w, h) => { ctx.fillStyle = "#f8f4f0"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#f8f4f0] border-gray-200",
  },
  {
    id: "pink_blue", label: "Pink→Blue",
    apply: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#fce7f3"); g.addColorStop(1, "#dbeafe");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    preview: "bg-gradient-to-br from-pink-100 to-blue-100",
  },
  {
    id: "dark", label: "Midnight",
    apply: (ctx, w, h) => { ctx.fillStyle = "#0a0a0b"; ctx.fillRect(0, 0, w, h); },
    preview: "bg-[#0a0a0b]",
  },
  {
    id: "rose", label: "Rose",
    apply: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#fff1f2"); g.addColorStop(1, "#fce7f3");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    preview: "bg-gradient-to-b from-red-50 to-pink-100",
  },
  {
    id: "sky", label: "Sky",
    apply: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#eff6ff"); g.addColorStop(1, "#dbeafe");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    preview: "bg-gradient-to-b from-blue-50 to-blue-100",
  },
  {
    id: "confetti", label: "Confetti",
    apply: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      const dots = ["#f472b6","#60a5fa","#fbbf24","#34d399","#a78bfa"];
      for (let i = 0; i < 120; i++) {
        ctx.fillStyle = dots[i % dots.length];
        ctx.beginPath();
        ctx.ellipse(
          Math.random()*w, Math.random()*h,
          4 + Math.random()*5, 2 + Math.random()*3,
          Math.random()*Math.PI, 0, Math.PI*2
        );
        ctx.fill();
      }
    },
    preview: "bg-white",
  },
];

// ─── Sticker Presets ──────────────────────────────────────────────────
const STICKERS = ["❤️","✨","🐾","⭐","😘","🌸","💋","🎉","🔥","🌈","💭","🦋"];

// ─── Sticker type ─────────────────────────────────────────────────────
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

  type Screen = "lobby" | "camera" | "countdown" | "preview" | "customize" | "strip" | "gallery";
  const [screen, setScreen] = useState<Screen>("lobby");
  const [error, setError] = useState<string | null>(null);

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [partnerReady, setPartnerReady] = useState(false);
  const [iAmReady, setIAmReady] = useState(false);

  // Camera
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (node) {
      if (streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(err => {
          console.error("Camera play failed on mount:", err);
          setCameraError("Camera play failed: " + err.message);
        });
      }
    }
  }, []);

  // Countdown
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  // Photos & Strip
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(null);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Customization (post-capture, pre-compose)
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const stripPreviewRef = useRef<HTMLDivElement | null>(null);
  const [customizeTab, setCustomizeTab] = useState<"layout" | "bg" | "stickers">("layout");

  // Gallery
  const [strips, setStrips] = useState<any[]>([]);
  const [fetchingStrips, setFetchingStrips] = useState(false);

  const channelRef = useRef<any>(null);
  const ROTATIONS = ["-rotate-2","rotate-1","-rotate-1","rotate-2","-rotate-3","rotate-3","rotate-0"];

  // ── Camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      console.log("Requesting camera stream via getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoElementRef.current;
      if (video) {
        video.srcObject = stream;
        video.play().catch(err => {
          console.error("video.play() failed on stream update:", err);
          setCameraError("Camera play failed: " + err.message);
        });
      }
    } catch (e: any) {
      console.error("getUserMedia error caught:", e);
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

  // ── Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !pair || !user) return;
    const channel = supabase.channel(`photobooth-${pair.id}`);
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "session-created" }, ({ payload }: any) => {
        if (payload.createdBy !== user.id) {
          setSessionId(payload.sessionId);
          setScreen("camera");
          startCamera();
        }
      })
      .on("broadcast", { event: "partner-ready" }, ({ payload }: any) => {
        if (payload.userId !== user.id) setPartnerReady(true);
      })
      .on("broadcast", { event: "countdown-start" }, ({ payload }: any) => {
        const elapsed = (Date.now() - payload.startedAt) / 1000;
        runCountdown(Math.max(1, Math.round(3 - elapsed)));
      })
      .on("broadcast", { event: "partner-captured" }, ({ payload }: any) => {
        if (payload.userId !== user.id) setPartnerPhotoUrl(payload.signedUrl);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); stopCamera(); };
  }, [loading, pair, user]);

  // ── Gallery fetch ─────────────────────────────────────────────────
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

  // ── Start session ─────────────────────────────────────────────────
  const handleStartSession = async () => {
    if (!pair || !user) return;
    setError(null);
    try {
      const { data: sess, error: e } = await supabase
        .from("photobooth_sessions")
        .insert({ pair_id: pair.id, filter_applied: selectedFilter.id, status: "waiting" })
        .select().single();
      if (e) throw e;
      channelRef.current?.send({ type: "broadcast", event: "session-created",
        payload: { sessionId: sess.id, createdBy: user.id } });
      setSessionId(sess.id);
      setScreen("camera");
      await startCamera();
    } catch (e: any) { setError(e.message || "Failed to start."); }
  };

  // ── Ready / countdown ─────────────────────────────────────────────
  const handleReady = () => {
    setIAmReady(true);
    channelRef.current?.send({ type: "broadcast", event: "partner-ready",
      payload: { userId: user!.id } });
    if (partnerReady) triggerCountdown();
  };

  useEffect(() => { if (iAmReady && partnerReady) triggerCountdown(); }, [partnerReady]);

  const triggerCountdown = () => {
    const startedAt = Date.now();
    channelRef.current?.send({ type: "broadcast", event: "countdown-start",
      payload: { startedAt } });
    runCountdown(3);
  };

  const runCountdown = (from: number) => {
    setScreen("countdown");
    setCountdownValue(from);
    let val = from;
    const tick = setInterval(() => {
      val -= 1;
      if (val <= 0) { clearInterval(tick); setCountdownValue(0); setTimeout(capturePhoto, 200); }
      else setCountdownValue(val);
    }, 1000);
  };

  // ── Capture — client-side only, no upload of raw frame ───────────
  const capturePhoto = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = selectedFilter.css === "none" ? "none" : selectedFilter.css;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setMyPhotoUrl(URL.createObjectURL(blob));
      stopCamera();

      // Upload raw capture so partner can receive via broadcast
      if (sessionId && user && pair) {
        setUploading(true);
        try {
          const filename = `photobooth/${pair.id}/${sessionId}-${user.id}-${Date.now()}.jpg`;
          await supabase.storage.from("memories")
            .upload(filename, blob, { contentType: "image/jpeg", upsert: false });
          await supabase.from("photobooth_captures")
            .insert({ session_id: sessionId, user_id: user.id, photo_url: filename });
          const { data: urlData } = await supabase.storage.from("memories")
            .createSignedUrl(filename, 86400);
          channelRef.current?.send({ type: "broadcast", event: "partner-captured",
            payload: { userId: user.id, signedUrl: urlData?.signedUrl } });
        } catch (e: any) { setError(e.message); }
        finally { setUploading(false); }
      }
      setScreen("preview");
    }, "image/jpeg", 0.92);
  }, [selectedFilter, stopCamera, sessionId, user, pair, supabase]);

  // ── Open customize when both photos available ─────────────────────
  const handleOpenCustomize = () => {
    if (!partnerPhotoUrl) { setError("Waiting for partner's photo…"); return; }
    setStickers([]);
    setScreen("customize");
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

  // ── Compose strip — all client-side ──────────────────────────────
  const composeStrip = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!myPhotoUrl || !partnerPhotoUrl) return null;

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((res, rej) => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => res(img); img.onerror = rej; img.src = src;
      });

    const [img1, img2] = await Promise.all([loadImg(myPhotoUrl), loadImg(partnerPhotoUrl)]);

    const photoSize = 400;
    const pad = 24;
    const capH = 80;
    const border = 6;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    // ── Layout: side by side ──
    if (selectedLayout.id === "sidebyside") {
      const W = pad * 3 + photoSize * 2;
      const H = pad * 2 + photoSize + capH;
      canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      ctx = canvas.getContext("2d")!;
      selectedBg.apply(ctx, W, H);

      // Gradient top bar
      const gb = ctx.createLinearGradient(0,0,W,0);
      gb.addColorStop(0,"#f472b6"); gb.addColorStop(1,"#60a5fa");
      ctx.fillStyle = gb; ctx.fillRect(0,0,W,5);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pad-border, pad-border, photoSize+border*2, photoSize+border*2);
      ctx.drawImage(img1, pad, pad, photoSize, photoSize);
      ctx.fillRect(pad*2+photoSize-border, pad-border, photoSize+border*2, photoSize+border*2);
      ctx.drawImage(img2, pad*2+photoSize, pad, photoSize, photoSize);

      const capY = pad+photoSize+12;
      ctx.fillStyle = selectedBg.id === "dark" ? "#e5e7eb" : "#374151";
      ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(caption || "📸 Our Photobooth Moment", W/2, capY+20);
      ctx.fillStyle = "#9ca3af"; ctx.font = "16px sans-serif";
      ctx.fillText(format(new Date(),"MMM d, yyyy"), W/2, capY+48);
    }

    // ── Layout: classic strip (vertical) ──
    else if (selectedLayout.id === "classic") {
      const W = photoSize + pad * 2;
      const H = pad * 3 + photoSize * 2 + capH;
      canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      ctx = canvas.getContext("2d")!;
      selectedBg.apply(ctx, W, H);

      const gb = ctx.createLinearGradient(0,0,W,0);
      gb.addColorStop(0,"#f472b6"); gb.addColorStop(1,"#60a5fa");
      ctx.fillStyle = gb; ctx.fillRect(0,0,W,5);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pad-border, pad-border, photoSize+border*2, photoSize+border*2);
      ctx.drawImage(img1, pad, pad, photoSize, photoSize);
      ctx.fillRect(pad-border, pad*2+photoSize-border, photoSize+border*2, photoSize+border*2);
      ctx.drawImage(img2, pad, pad*2+photoSize, photoSize, photoSize);

      const capY = pad*2+photoSize*2+12;
      ctx.fillStyle = selectedBg.id === "dark" ? "#e5e7eb" : "#374151";
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(caption || "📸 Together", W/2, capY+20);
      ctx.fillStyle = "#9ca3af"; ctx.font = "14px sans-serif";
      ctx.fillText(format(new Date(),"MMM d, yyyy"), W/2, capY+44);
    }

    // ── Layout: 2×2 grid ──
    else {
      const cell = 300;
      const W = cell * 2 + pad * 3;
      const H = cell * 2 + pad * 3 + capH;
      canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      ctx = canvas.getContext("2d")!;
      selectedBg.apply(ctx, W, H);

      const gb = ctx.createLinearGradient(0,0,W,0);
      gb.addColorStop(0,"#f472b6"); gb.addColorStop(1,"#60a5fa");
      ctx.fillStyle = gb; ctx.fillRect(0,0,W,5);

      ctx.fillStyle = "#ffffff";
      // Top-left: my photo
      ctx.fillRect(pad-border, pad-border, cell+border*2, cell+border*2);
      ctx.drawImage(img1, pad, pad, cell, cell);
      // Top-right: partner photo
      ctx.fillRect(pad*2+cell-border, pad-border, cell+border*2, cell+border*2);
      ctx.drawImage(img2, pad*2+cell, pad, cell, cell);
      // Bottom-left: partner mirrored
      ctx.fillRect(pad-border, pad*2+cell-border, cell+border*2, cell+border*2);
      ctx.save(); ctx.translate(pad + cell, pad*2+cell); ctx.scale(-1,1);
      ctx.drawImage(img2, 0, 0, cell, cell); ctx.restore();
      // Bottom-right: my mirrored
      ctx.fillRect(pad*2+cell-border, pad*2+cell-border, cell+border*2, cell+border*2);
      ctx.save(); ctx.translate(pad*2+cell+cell, pad*2+cell); ctx.scale(-1,1);
      ctx.drawImage(img1, 0, 0, cell, cell); ctx.restore();

      const capY = pad*2+cell*2+12;
      ctx.fillStyle = selectedBg.id === "dark" ? "#e5e7eb" : "#374151";
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(caption || "📸 Our Grid Moment", W/2, capY+20);
      ctx.fillStyle = "#9ca3af"; ctx.font = "14px sans-serif";
      ctx.fillText(format(new Date(),"MMM d, yyyy"), W/2, capY+44);
    }

    // ── Bake stickers onto canvas ──────────────────────────────────
    if (stickers.length > 0 && stripPreviewRef.current) {
      const previewRect = stripPreviewRef.current.getBoundingClientRect();
      const scaleX = canvas.width / previewRect.width;
      const scaleY = canvas.height / previewRect.height;

      for (const sticker of stickers) {
        const scaledSize = sticker.size * Math.max(scaleX, scaleY);
        ctx.font = `${scaledSize}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(sticker.emoji, sticker.x * scaleX, sticker.y * scaleY + scaledSize * 0.8);
      }
    }

    return canvas;
  }, [myPhotoUrl, partnerPhotoUrl, caption, selectedLayout, selectedBg, stickers]);

  // ── Make strip preview ────────────────────────────────────────────
  const handleMakeStrip = async () => {
    setError(null);
    try {
      const canvas = await composeStrip();
      if (!canvas) { setError("Waiting for partner's photo…"); return; }
      setStripUrl(canvas.toDataURL("image/jpeg", 0.92));
      setScreen("strip");
    } catch (e: any) { setError("Compose failed: " + e.message); }
  };

  // ── Save — only upload the final composited image ─────────────────
  const handleSaveToMoments = async () => {
    if (!pair || !user || !stripUrl || !sessionId) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(stripUrl);
      const blob = await res.blob();
      const filename = `photobooth/${pair.id}/strip-${sessionId}-${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("memories").upload(filename, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      await supabase.from("photobooth_strips").insert({
        session_id: sessionId, combined_image_url: filename,
        caption: caption || null, saved_to_moments: true,
      });
      await supabase.from("shared_moments").insert({
        pair_id: pair.id, created_by: user.id,
        title: caption || "📸 Photobooth Strip",
        description: `A ${selectedLayout.label} photobooth moment.`,
        photo_url: filename,
        moment_date: format(new Date(), "yyyy-MM-dd"),
      });
      await supabase.from("photobooth_sessions")
        .update({ status: "completed" }).eq("id", sessionId);

      setScreen("gallery"); fetchStrips();
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    stopCamera();
    setScreen("lobby"); setSessionId(null);
    setIAmReady(false); setPartnerReady(false);
    setMyPhotoUrl(null); setPartnerPhotoUrl(null);
    setStripUrl(null); setCaption(""); setStickers([]);
    setError(null); setCountdownValue(null);
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
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{
        background: "radial-gradient(50rem 35rem at 10% 5%,rgba(244,114,182,0.06) 0%,transparent 60%),radial-gradient(40rem 30rem at 90% 95%,rgba(96,165,250,0.06) 0%,transparent 60%)"
      }} />
      <Navigation />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col z-10">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── LOBBY ─────────────────────────────────────────────────── */}
        {screen === "lobby" && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f472b6] to-[#60a5fa] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-sans font-black text-3xl tracking-tight text-foreground">Photobooth</h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                A synced 3-2-1 capture — you and{" "}
                <span className="text-[#f472b6] font-bold">{partner?.display_name || "your partner"}</span>{" "}
                snap at the exact same moment, then customize together.
              </p>
              <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground font-mono flex-wrap">
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-[#f472b6]" /> Live camera</span>
                <span className="flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5 text-amber-400" /> 3 layouts</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#60a5fa]" /> Stickers + BG</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Saves to Moments</span>
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

            <button onClick={handleStartSession}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-lg bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-5 h-5" /> Open Camera
            </button>

            {strips.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Past Strips</p>
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

        {/* ── CAMERA ────────────────────────────────────────────────── */}
        {screen === "camera" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Live Preview</p>
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

            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setSelectedFilter(f)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer transition-all ${selectedFilter.id === f.id ? "scale-110" : "opacity-60 hover:opacity-100"}`}>
                  <div className={`w-10 h-10 rounded-full ${f.preview} border-2 ${selectedFilter.id === f.id ? "border-[#f472b6]" : "border-transparent"} transition-all`} />
                  <span className={`text-[8px] font-mono font-bold ${selectedFilter.id === f.id ? "text-[#f472b6]" : "text-muted-foreground"}`}>{f.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className={`flex-1 rounded-xl border p-3 text-center text-xs font-bold ${iAmReady ? "border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "border-border text-muted-foreground"}`}>
                {iAmReady ? "✓ You're ready" : "You"}
              </div>
              <div className={`flex-1 rounded-xl border p-3 text-center text-xs font-bold ${partnerReady ? "border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "border-border text-muted-foreground"}`}>
                {partnerReady ? `✓ ${partner?.display_name || "Partner"} ready` : partner?.display_name || "Partner"}
              </div>
            </div>

            <button onClick={handleReady} disabled={iAmReady}
              className={`w-full py-4 rounded-2xl font-sans font-black text-white text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer
                ${iAmReady ? "bg-emerald-500 opacity-80" : "bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 shadow-lg shadow-pink-500/20"}`}>
              {iAmReady ? <><Check className="w-5 h-5" /> Waiting for partner…</> : <><Zap className="w-5 h-5" /> I'm Ready — Start Countdown!</>}
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ─────────────────────────────────────────────── */}
        {screen === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
            <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Get ready…</p>
            <div key={countdownValue} className="text-[140px] font-black font-mono leading-none animate-pulse"
              style={{ background: "linear-gradient(135deg,#f472b6,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {countdownValue === 0 ? "📸" : countdownValue}
            </div>
            <p className="text-muted-foreground text-sm">{countdownValue === 0 ? "Captured!" : "Hold still…"}</p>
            <video ref={videoRefCallback} autoPlay muted playsInline
              style={{ position: "absolute", width: "1px", height: "1px", opacity: 0.01, left: "-9999px", pointerEvents: "none", filter: selectedFilter.css === "none" ? undefined : selectedFilter.css }} />
          </div>
        )}

        {/* ── PREVIEW ───────────────────────────────────────────────── */}
        {screen === "preview" && (
          <div className="space-y-5 animate-fade-in">
            <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase text-center">Your Capture</p>
            <div className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-square shadow-lg">
              {myPhotoUrl && <img src={myPhotoUrl} alt="Your capture" className="w-full h-full object-cover" />}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className={`rounded-xl border p-4 text-center text-sm font-bold transition-all
              ${partnerPhotoUrl ? "border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "border-border text-muted-foreground"}`}>
              {partnerPhotoUrl
                ? `✓ ${partner?.display_name || "Partner"}'s photo is in!`
                : <div className="space-y-3">
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for {partner?.display_name || "partner"}'s capture…
                    </span>
                    <button
                      onClick={() => setPartnerPhotoUrl(myPhotoUrl)}
                      className="text-xs text-[#f472b6] font-bold hover:underline cursor-pointer py-1 px-3 rounded-lg border border-[#f472b6]/20 bg-[#f472b6]/5"
                    >
                      ✨ Try Solo Mode (Use your photo twice to test)
                    </button>
                  </div>}
            </div>
            <button onClick={handleOpenCustomize} disabled={!partnerPhotoUrl || uploading}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-base bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Sparkles className="w-5 h-5" /> Customize Your Strip →
            </button>
          </div>
        )}

        {/* ── CUSTOMIZE ─────────────────────────────────────────────── */}
        {screen === "customize" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Customize Strip</p>
              <button onClick={() => setScreen("preview")} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">← Back</button>
            </div>

            {/* Live strip preview with sticker layer */}
            <div ref={stripPreviewRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-white shadow-md select-none" style={{ minHeight: 260 }}>
              {/* Side-by-side preview for visualization */}
              <div className="flex gap-2 p-3">
                {myPhotoUrl && <img src={myPhotoUrl} alt="me" className="flex-1 aspect-square object-cover rounded-lg" />}
                {partnerPhotoUrl && <img src={partnerPhotoUrl} alt="partner" className="flex-1 aspect-square object-cover rounded-lg" />}
              </div>
              <StickerLayer stickers={stickers} onMove={moveSticker} onRemove={removeSticker} containerRef={stripPreviewRef} />
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border">
              {(["layout","bg","stickers"] as const).map(tab => (
                <button key={tab} onClick={() => setCustomizeTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer
                    ${customizeTab === tab ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab === "layout" ? "📐 Layout" : tab === "bg" ? "🎨 Background" : "✨ Stickers"}
                </button>
              ))}
            </div>

            {/* Layout picker */}
            {customizeTab === "layout" && (
              <div className="grid grid-cols-3 gap-3">
                {LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setSelectedLayout(l)}
                    className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all space-y-1
                      ${selectedLayout.id === l.id ? "border-[#f472b6] bg-[#f472b6]/5 text-[#f472b6]" : "border-border bg-card text-muted-foreground hover:border-[#f472b6]/40"}`}>
                    <div className="text-2xl">{l.icon}</div>
                    <p className="text-[10px] font-mono font-bold">{l.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Background picker */}
            {customizeTab === "bg" && (
              <div className="grid grid-cols-3 gap-3">
                {BG_PRESETS.map(bg => (
                  <button key={bg.id} onClick={() => setSelectedBg(bg)}
                    className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all space-y-2
                      ${selectedBg.id === bg.id ? "border-[#f472b6]" : "border-border hover:border-[#f472b6]/40"}`}>
                    <div className={`w-10 h-10 rounded-full mx-auto border ${bg.preview}`} />
                    <p className="text-[9px] font-mono font-bold text-muted-foreground">{bg.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Sticker picker */}
            {customizeTab === "stickers" && (
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-muted-foreground">Tap to add • Drag to move • Double-tap to remove</p>
                <div className="flex flex-wrap gap-2">
                  {STICKERS.map(s => (
                    <button key={s} onClick={() => addSticker(s)}
                      className="w-12 h-12 rounded-xl border border-border bg-card hover:bg-accent hover:scale-110 active:scale-95 transition-all text-2xl cursor-pointer flex items-center justify-center">
                      {s}
                    </button>
                  ))}
                </div>
                {stickers.length > 0 && (
                  <button onClick={() => setStickers([])} className="text-xs text-red-500 hover:text-red-600 cursor-pointer">
                    Clear all stickers
                  </button>
                )}
              </div>
            )}

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Caption</label>
              <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="e.g. Friday night vibes 🌙" maxLength={80}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[#f472b6]/40" />
            </div>

            <button onClick={handleMakeStrip}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-base bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
              <Sparkles className="w-5 h-5" /> Compose Strip →
            </button>
          </div>
        )}

        {/* ── STRIP ─────────────────────────────────────────────────── */}
        {screen === "strip" && stripUrl && (
          <div className="space-y-5 animate-fade-in">
            <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase text-center">Your Photobooth Strip ✨</p>

            <div className="bg-white shadow-2xl rounded-sm p-4 pb-14 mx-auto max-w-sm">
              <div className="h-1 bg-gradient-to-r from-[#f472b6] to-[#60a5fa] mb-3 rounded-full" />
              <img src={stripUrl} alt="Photobooth strip" className="w-full rounded-sm" />
              <p className="mt-4 text-center text-gray-600 text-sm" style={{ fontFamily: "'Caveat', cursive" }}>
                {caption || "Our moment 💕"}
              </p>
              <p className="text-center text-gray-400 text-xs mt-1">{format(new Date(), "MMM d, yyyy")}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setScreen("customize")}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-muted-foreground border border-border bg-card hover:bg-accent transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <PaletteIcon className="w-4 h-4" /> Re-customize
              </button>
              <button onClick={handleSaveToMoments} disabled={saving}
                className="flex-1 py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                {saving ? "Saving…" : "Save to Moments"}
              </button>
            </div>

            <button onClick={handleReset}
              className="w-full py-3 rounded-2xl text-sm font-bold text-muted-foreground border border-border bg-card hover:bg-accent transition-all flex items-center justify-center gap-2 cursor-pointer">
              <RefreshCw className="w-4 h-4" /> Take Another
            </button>
          </div>
        )}

        {/* ── GALLERY ───────────────────────────────────────────────── */}
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
