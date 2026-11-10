"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Camera,
  Heart,
  Volume2,
  VolumeX,
  Share2,
  Check,
  X,
  Sparkle,
  Bookmark,
  Calendar,
  Smile
} from "lucide-react";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { CoupleBeansMascot } from "@/components/couple-mascot";

/* Tactical Web Audio Magnetic Clack Sound Engine */
function playFridgeSound(type: "snap" | "peel" | "click" | "pop" = "snap", soundEnabled = true) {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "snap") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "peel") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.07);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Ignore audio context errors if blocked by browser autoplay
  }
}

interface FridgeItem {
  id: string;
  type: "photostrip" | "polaroid" | "note" | "checklist" | "magnet";
  x: number;
  y: number;
  rotate: number;
  data: any;
}

const DEFAULT_FRIDGE_ITEMS: FridgeItem[] = [
  // 1. Studio 4-Cut Photostrip
  {
    id: "strip-1",
    type: "photostrip",
    x: 48,
    y: 30,
    rotate: -2.5,
    data: {
      photos: ["/booth/couple-heart.jpg", "/booth/couple-peace.jpg", "/booth/couple-reunion.jpg"],
      caption: "PAIRFECT · STUDIO 4-CUT",
      date: "NOV 2026",
    },
  },
  // 2. Sweet Couple Polaroid 1
  {
    id: "polaroid-1",
    type: "polaroid",
    x: 235,
    y: 45,
    rotate: 3.2,
    data: {
      photo: "/booth/couple-cozy.jpg",
      caption: "Our coffee date sanctuary ♡",
      date: "Saturday afternoon",
      magnetColor: "bg-amber-400",
    },
  },
  // 3. Post-it Note 1 (Yellow)
  {
    id: "note-1",
    type: "note",
    x: 480,
    y: 28,
    rotate: -1.8,
    data: {
      color: "bg-[#FEF08A] border-amber-300 text-stone-900",
      pinColor: "bg-rose-500",
      title: "Movie Night 🍿",
      text: "Facetime movie date at 9pm sharp! Popcorn is ready, don't be late silly 💕",
      author: "Her",
    },
  },
  // 4. Checklist Sticky Pad
  {
    id: "checklist-1",
    type: "checklist",
    x: 720,
    y: 40,
    rotate: 2.2,
    data: {
      title: "Date Ideas Bucket List",
      items: [
        { text: "Send DigiBouquet roses", done: true },
        { text: "Snap 4-cut photostrip", done: true },
        { text: "Mixtape roadtrip listen", done: true },
        { text: "Cook creamy pasta on call", done: false },
        { text: "Airport reunion hug!", done: false },
      ],
    },
  },
  // 5. Sweet Couple Polaroid 2
  {
    id: "polaroid-2",
    type: "polaroid",
    x: 320,
    y: 340,
    rotate: -3.8,
    data: {
      photo: "/booth/couple-reunion.jpg",
      caption: "Finally in your arms again ♡",
      date: "Airport terminal",
      magnetColor: "bg-sky-400",
    },
  },
  // 6. Post-it Note 2 (Blush Pink)
  {
    id: "note-2",
    type: "note",
    x: 570,
    y: 310,
    rotate: 3.5,
    data: {
      color: "bg-[#FFE4E8] border-rose-300 text-stone-900",
      pinColor: "bg-sky-500",
      title: "Daily Reminder 💕",
      text: "I love you more than all the stars in both our night skies. Sleep well my favorite person 🌙",
      author: "Him",
    },
  },
  // 7. Standalone Cute Magnets
  {
    id: "magnet-mascot",
    type: "magnet",
    x: 180,
    y: 420,
    rotate: 5,
    data: { kind: "mascot" },
  },
  {
    id: "magnet-strawberry",
    type: "magnet",
    x: 520,
    y: 240,
    rotate: -8,
    data: { kind: "strawberry" },
  },
  {
    id: "magnet-tape",
    type: "magnet",
    x: 760,
    y: 380,
    rotate: -4,
    data: { kind: "tape" },
  },
];

export default function FridgePage() {
  const { user, pair, partner } = useAuth();
  const fridgeContainerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<FridgeItem[]>(DEFAULT_FRIDGE_ITEMS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  // New Note Form State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("yellow");
  const [newNotePin, setNewNotePin] = useState("rose");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pairfect_fridge_items_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  // Save to localStorage whenever items update
  const saveItems = (updated: FridgeItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem("pairfect_fridge_items_v2", JSON.stringify(updated));
    } catch {
      // Local storage quota exceeded or disabled
    }
  };

  const handleTidyFridge = () => {
    playFridgeSound("snap", soundEnabled);
    saveItems(DEFAULT_FRIDGE_ITEMS);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    playFridgeSound("pop", soundEnabled);

    const colorMap: Record<string, string> = {
      yellow: "bg-[#FEF08A] border-amber-300 text-stone-900",
      pink: "bg-[#FFE4E8] border-rose-300 text-stone-900",
      mint: "bg-[#DCFCE7] border-emerald-300 text-stone-900",
      sky: "bg-[#E0F2FE] border-sky-300 text-stone-900",
      lavender: "bg-[#F3E8FF] border-purple-300 text-stone-900",
    };

    const pinMap: Record<string, string> = {
      rose: "bg-rose-500",
      sky: "bg-sky-500",
      amber: "bg-amber-400",
      emerald: "bg-emerald-500",
      purple: "bg-purple-500",
    };

    const newItem: FridgeItem = {
      id: `custom-note-${Date.now()}`,
      type: "note",
      x: 350 + Math.random() * 80 - 40,
      y: 120 + Math.random() * 80 - 40,
      rotate: Math.random() * 8 - 4,
      data: {
        title: newNoteTitle.trim() || "Love Note",
        text: newNoteText.trim(),
        color: colorMap[newNoteColor] || colorMap.yellow,
        pinColor: pinMap[newNotePin] || pinMap.rose,
        author: user?.user_metadata?.display_name || "You",
      },
    };

    saveItems([...items, newItem]);
    setNewNoteTitle("");
    setNewNoteText("");
    setIsAddNoteOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    playFridgeSound("peel", soundEnabled);
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const handleToggleCheck = (itemId: string, checkIndex: number) => {
    playFridgeSound("click", soundEnabled);
    const updated = items.map((item) => {
      if (item.id === itemId && item.data?.items) {
        const nextChecks = [...item.data.items];
        nextChecks[checkIndex] = {
          ...nextChecks[checkIndex],
          done: !nextChecks[checkIndex].done,
        };
        return {
          ...item,
          data: {
            ...item.data,
            items: nextChecks,
          },
        };
      }
      return item;
    });
    saveItems(updated);
  };

  const handleShareFridge = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      playFridgeSound("click", soundEnabled);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans select-none">
      <Navigation />

      {/* Main Content Area with Desktop Sidebar Offset */}
      <div className="lg:pl-60 xl:pl-64 min-h-screen pt-16 lg:pt-8 pb-12 px-4 sm:px-8 flex justify-center">
        <main className="flex-1 max-w-[1360px] w-full space-y-6">
          {/* Top Header & Context */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE4E8] text-rose-700 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>SHARED KEEPSAKE SANCTUARY</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
              A digital fridge door for{" "}
              <span className="bg-gradient-to-r from-[#FF5E8E] via-[#FF758F] to-[#4F86F7] bg-clip-text text-transparent">
                your memories
              </span>
              .
            </h1>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              Pin photostrips, polaroids, and love notes on your shared magnetic enamel fridge door. Drag them around freely, leave cute surprises, and tidy up anytime.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Add Note Button */}
            <button
              type="button"
              onClick={() => {
                playFridgeSound("pop", soundEnabled);
                setIsAddNoteOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>

            {/* Link to Photobooth */}
            <Link
              href="/photo-booth"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-mono text-xs font-bold uppercase tracking-wider shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-rose-500" />
              <span>Snap Photos</span>
            </Link>

            {/* Tidy Button */}
            <button
              type="button"
              onClick={handleTidyFridge}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-mono text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Reset magnets to neat positions"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>Tidy</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-xl bg-white border border-stone-300 text-stone-600 hover:bg-stone-50 flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
              title={soundEnabled ? "Mute fridge clacks" : "Enable fridge clacks"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShareFridge}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-mono text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* The Retro Magnetic Enamel Fridge Door Canvas */}
        <div className="relative w-full rounded-[36px] bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#E9E2D4] border-4 border-stone-300/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] p-4 sm:p-6 overflow-hidden">
          {/* Subtle Enamel Sheen Reflection Bar */}
          <div className="absolute top-0 bottom-0 left-12 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none transform -skew-x-12" />

          {/* Retro Fridge Brand Header & Temperature Status */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-300/80 relative z-20">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider uppercase text-stone-700">
                PAIRFECT RETRO ENAMEL FRIDGE
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-stone-200/80 font-mono text-[10px] font-bold text-stone-600">
                {partner?.display_name ? `Connected with ${partner.display_name}` : "Private Room for Two"}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-stone-600">
              <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-stone-300 shadow-2xs">
                4°C · FRESH MEMORIES
              </span>
            </div>
          </div>

          {/* Chrome Door Handle on Right */}
          <div className="hidden lg:block absolute right-4 top-24 bottom-24 w-4 rounded-full bg-gradient-to-r from-stone-300 via-stone-100 to-stone-400 border border-stone-400 shadow-md pointer-events-none z-10" />

          {/* Drag Surface Canvas Area */}
          <div
            ref={fridgeContainerRef}
            className="relative w-full min-h-[700px] h-[750px] overflow-hidden rounded-2xl bg-[radial-gradient(#D6D3D1_1px,transparent_1px)] [background-size:24px_24px] opacity-95 pt-4"
          >
            {/* Top Prompt Hint */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-stone-200 shadow-xs text-xs font-mono font-bold text-stone-600">
                <Sparkle className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                <span>Drag &amp; arrange keepsakes anywhere on the fridge door!</span>
              </span>
            </div>

            {/* Render Fridge Keepsake Items */}
            {items.map((item) => (
              <motion.div
                key={item.id}
                drag
                dragConstraints={fridgeContainerRef}
                dragElastic={0.15}
                dragMomentum={false}
                onDragStart={() => playFridgeSound("peel", soundEnabled)}
                onDragEnd={() => playFridgeSound("snap", soundEnabled)}
                whileDrag={{ scale: 1.08, zIndex: 60, cursor: "grabbing" }}
                whileHover={{ scale: 1.02 }}
                initial={{ rotate: item.rotate, x: item.x, y: item.y }}
                animate={{ rotate: item.rotate }}
                className="absolute cursor-grab select-none z-30 group"
              >
                {/* 1. PHOTOSTRIP */}
                {item.type === "photostrip" && (
                  <div className="w-48 bg-[#F8FAFC] border-2 border-stone-300 p-2.5 rounded-sm shadow-[0_12px_24px_rgba(0,0,0,0.18)] space-y-1.5 relative">
                    {/* Top Magnets */}
                    <div className="absolute -top-2 left-4 w-4 h-4 rounded-full bg-rose-500 border border-white shadow-md z-40" />
                    <div className="absolute -top-2 right-4 w-4 h-4 rounded-full bg-sky-500 border border-white shadow-md z-40" />

                    <div className="border-b border-stone-300 pb-1 flex items-center justify-between text-[8px] font-mono text-stone-500 font-bold">
                      <span>STUDIO 4-CUT</span>
                      <span className="text-rose-600 font-black">PAIRFECT</span>
                    </div>

                    {item.data.photos.map((src: string, pIdx: number) => (
                      <div key={pIdx} className="relative aspect-4/3 rounded bg-stone-200 overflow-hidden shadow-2xs">
                        <Image src={src} alt="Photo" fill className="object-cover" />
                      </div>
                    ))}

                    <div className="pt-1 border-t border-dashed border-stone-300 flex items-center justify-between text-[8px] font-mono text-stone-600">
                      <span>{item.data.date}</span>
                      <span className="font-bold">FOR TWO ♡</span>
                    </div>
                  </div>
                )}

                {/* 2. POLAROID */}
                {item.type === "polaroid" && (
                  <div className="w-52 bg-white border border-stone-300 p-2.5 pb-4 rounded-xs shadow-[0_12px_24px_rgba(0,0,0,0.16)] space-y-2 relative">
                    {/* Top Magnet */}
                    <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${item.data.magnetColor || "bg-amber-400"} border-2 border-white shadow-md z-40 flex items-center justify-center text-[10px]`}>
                      ✦
                    </div>

                    <div className="relative aspect-square rounded-xs bg-stone-100 overflow-hidden shadow-inner">
                      <Image src={item.data.photo} alt="Polaroid photo" fill className="object-cover" />
                    </div>

                    <div className="text-center space-y-0.5">
                      <p className="font-serif italic font-bold text-xs text-stone-800">
                        {item.data.caption}
                      </p>
                      <p className="font-mono text-[8px] text-stone-400">
                        {item.data.date}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. POST-IT NOTE */}
                {item.type === "note" && (
                  <div className={`w-52 p-3.5 rounded-sm border shadow-[0_10px_20px_rgba(0,0,0,0.14)] space-y-1.5 relative ${item.data.color}`}>
                    {/* Center Magnet Pin */}
                    <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${item.data.pinColor} border-2 border-white shadow-md z-40 flex items-center justify-center text-white text-[9px] font-black`}>
                      ♥
                    </div>

                    {/* Delete Icon on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 text-stone-500 cursor-pointer"
                      title="Remove note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider uppercase text-stone-600 border-b border-black/10 pb-1">
                      <span>{item.data.title}</span>
                      <span className="text-[8px]">From: {item.data.author}</span>
                    </div>

                    <p className="font-sans font-medium text-xs text-stone-800 leading-relaxed pt-0.5">
                      {item.data.text}
                    </p>
                  </div>
                )}

                {/* 4. CHECKLIST */}
                {item.type === "checklist" && (
                  <div className="w-56 p-3.5 bg-[#FAF6EE] border-2 border-[#E7DFCE] rounded-sm shadow-[0_10px_22px_rgba(0,0,0,0.15)] space-y-2 relative">
                    {/* Top Magnet */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-md z-40 flex items-center justify-center text-white text-[10px]">
                      ★
                    </div>

                    <div className="border-b border-stone-300 pb-1 text-center">
                      <span className="font-mono font-black text-[10px] tracking-wider uppercase text-stone-800">
                        {item.data.title}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {item.data.items.map((checkItem: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          onClick={() => handleToggleCheck(item.id, cIdx)}
                          className="flex items-start gap-2 cursor-pointer group/chk"
                        >
                          <div className={`w-3.5 h-3.5 rounded border mt-0.5 flex items-center justify-center transition-colors ${checkItem.done ? "bg-emerald-500 border-emerald-600 text-white" : "border-stone-400 bg-white"}`}>
                            {checkItem.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] font-sans leading-tight transition-all ${checkItem.done ? "line-through text-stone-400 font-normal" : "text-stone-800 font-medium"}`}>
                            {checkItem.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-stone-300/80 text-center font-mono text-[8px] text-stone-400">
                      Tap items to check off together
                    </div>
                  </div>
                )}

                {/* 5. CUTE STANDALONE MAGNET */}
                {item.type === "magnet" && (
                  <div className="w-16 h-16 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                    {item.data.kind === "mascot" && (
                      <div className="p-1 rounded-2xl bg-white border border-stone-200 shadow-md">
                        <CoupleBeansMascot className="w-12 h-10" />
                      </div>
                    )}
                    {item.data.kind === "strawberry" && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                        🍓
                      </div>
                    )}
                    {item.data.kind === "tape" && (
                      <div className="w-14 h-9 rounded-md bg-stone-900 border border-stone-600 shadow-md flex items-center justify-around px-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border border-white" />
                        <span className="font-mono text-[7px] text-amber-300 font-bold">SIDE A</span>
                        <div className="w-3.5 h-3.5 rounded-full border border-white" />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>

      {/* Add Love Note Modal */}
      <AnimatePresence>
        {isAddNoteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFE4E8] flex items-center justify-center text-rose-600">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-stone-900">
                      Stick a Love Note
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                      Pinned right on your couple fridge door
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                {/* Note Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold text-stone-700 uppercase">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="e.g. Good Morning My Love ♡"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-rose-500"
                    maxLength={35}
                  />
                </div>

                {/* Note Content */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold text-stone-700 uppercase">
                    Your Message
                  </label>
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Leave a sweet reminder, a love confession, or date night plans..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-rose-500 resize-none"
                    maxLength={160}
                    required
                  />
                  <span className="text-[10px] font-mono text-stone-400 block text-right">
                    {newNoteText.length} / 160
                  </span>
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-stone-700 uppercase">
                    Paper Color
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "yellow", name: "Butter", bg: "bg-[#FEF08A] border-amber-300" },
                      { id: "pink", name: "Blush", bg: "bg-[#FFE4E8] border-rose-300" },
                      { id: "mint", name: "Mint", bg: "bg-[#DCFCE7] border-emerald-300" },
                      { id: "sky", name: "Sky", bg: "bg-[#E0F2FE] border-sky-300" },
                      { id: "lavender", name: "Lilac", bg: "bg-[#F3E8FF] border-purple-300" },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewNoteColor(col.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${col.bg} ${newNoteColor === col.id ? "scale-115 ring-2 ring-stone-900 shadow-sm" : "hover:scale-105"}`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Magnet Pin Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-stone-700 uppercase">
                    Magnet Pin
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "rose", color: "bg-rose-500", label: "Rose Heart" },
                      { id: "sky", color: "bg-sky-500", label: "Sky Pin" },
                      { id: "amber", color: "bg-amber-400", label: "Gold Star" },
                      { id: "emerald", color: "bg-emerald-500", label: "Mint Pin" },
                      { id: "purple", color: "bg-purple-500", label: "Purple Heart" },
                    ].map((pin) => (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={() => setNewNotePin(pin.id)}
                        className={`w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] cursor-pointer ${pin.color} ${newNotePin === pin.id ? "ring-2 ring-stone-900 scale-115" : "hover:scale-105"}`}
                      >
                        ♥
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAddNoteOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E8E] to-[#4F86F7] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stick on Fridge</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
