"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  Loader2,
  Plus,
  X,
  Heart,
  Sparkles,
  Archive,
  BookOpen,
  Share2,
  Check,
  Copy,
  Download,
  BookmarkCheck,
  Camera,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GratitudeJarRitual } from "@/components/cozy-illustrations";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// Natural colors for paper slips
const SLIP_COLORS = [
  "bg-[#FDF3F5] dark:bg-rose-950/30 border-[#F5C2C9] dark:border-rose-900/40",
  "bg-[#F5F8F6] dark:bg-emerald-950/30 border-[#C9DEC3] dark:border-emerald-900/40",
  "bg-[#FFFDF3] dark:bg-amber-950/30 border-[#F4E3B1] dark:border-amber-900/40",
  "bg-[#F5FAFD] dark:bg-sky-950/30 border-[#C4E1F6] dark:border-sky-900/40",
  "bg-[#FAF7F2] dark:bg-stone-900/50 border-[#E8DDCD] dark:border-stone-800/60",
];

// Helper to determine coordinate stacks for slips inside jar
function getSlipLayout(i: number, total: number) {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const baseBottom = 16 + row * 10;
  const baseLeft = 20 + col * 16 + (row % 2 === 0 ? 3 : -3);

  const seedX = Math.sin(i * 12.9898) * 43758.5453;
  const seedY = Math.cos(i * 78.233) * 43758.5453;
  const seedR = Math.sin(i * 45.123) * 43758.5453;

  const noiseX = (seedX - Math.floor(seedX)) * 8 - 4;
  const noiseY = (seedY - Math.floor(seedY)) * 5 - 2.5;
  const noiseR = (seedR - Math.floor(seedR)) * 40 - 20;

  return {
    bottom: `${Math.max(10, baseBottom + noiseY)}px`,
    left: `${Math.max(10, Math.min(85, baseLeft + noiseX))}%`,
    rotate: `${noiseR}deg`,
  };
}

const DEMO_NOTES = [
  {
    id: "demo-1",
    user_id: "demo-partner",
    content: "I love the way your eyes crinkle when you laugh at silly memes.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-me",
    content: "Thank you for making that warm lavender tea when I was stressed out.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo-partner",
    content: "You make every rainy Tuesday feel like a peaceful Sunday morning.",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "demo-4",
    user_id: "demo-me",
    content: "Remember dancing in the kitchen while waiting for the pasta water to boil?",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export default function GratitudeJarPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // Quick-Drop & Share Link states
  const [quickDropId, setQuickDropId] = useState<string | null>(null);
  const [guestSenderName, setGuestSenderName] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [quickDropSuccess, setQuickDropSuccess] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("demo") === "true";
    }
    return false;
  });

  // Core jar states
  const [notes, setNotes] = useState<any[]>(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "true") {
      return DEMO_NOTES;
    }
    return [];
  });
  const [fetching, setFetching] = useState(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "true") {
      return false;
    }
    return true;
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Archive Drawer & Filters
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState<"all" | "me" | "partner">("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Animations & active drawn note
  const [shaking, setShaking] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);

  // Keepsake actions
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingPolaroid, setIsDownloadingPolaroid] = useState(false);

  // Read URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dropParam = params.get("drop") || params.get("room");
    if (dropParam) {
      setQuickDropId(dropParam.trim());
    }
    if (params.get("demo") === "true") {
      setIsDemoMode(true);
      setNotes(DEMO_NOTES);
    }

    const savedGuestName = localStorage.getItem("pairfect_guest_name");
    if (savedGuestName) {
      setGuestSenderName(savedGuestName);
    }
  }, []);

  const activePairId = pair?.id || quickDropId;

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    if (isDemoMode) {
      setNotes(DEMO_NOTES);
      setFetching(false);
      return;
    }
    if (!activePairId) {
      setFetching(false);
      return;
    }
    try {
      const res = await fetch(`/api/gratitude?pairId=${activePairId}`);
      if (!res.ok) throw new Error("Failed to load gratitude notes");
      const data = await res.json();
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [activePairId, isDemoMode]);

  useEffect(() => {
    if (!loading) {
      fetchNotes();
      if (activePairId) {
        const ch = supabase
          .channel(`gratitude-jar-${activePairId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "gratitude_entries",
              filter: `pair_id=eq.${activePairId}`,
            },
            fetchNotes
          )
          .subscribe();
        return () => {
          supabase.removeChannel(ch);
        };
      }
    }
  }, [loading, activePairId, fetchNotes, supabase]);

  // Drop Note Handler
  const handleDropNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    if (isDemoMode) {
      const newDemoNote = {
        id: `demo-${Date.now()}`,
        user_id: "demo-me",
        content: message.trim(),
        created_at: new Date().toISOString(),
      };
      setNotes((prev) => [newDemoNote, ...prev]);
      setDroppedId(newDemoNote.id);
      setMessage("");
      setQuickDropSuccess(true);
      setTimeout(() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }, 550);
      setTimeout(() => setDroppedId(null), 1200);
      setTimeout(() => setQuickDropSuccess(false), 4000);
      setSubmitting(false);
      return;
    }

    if (!activePairId) {
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/gratitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: activePairId,
          content: message.trim(),
          senderName: guestSenderName.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        if (!pair && quickDropId) {
          console.log("Local guest drop recorded for guest session");
        } else {
          throw new Error(result.error || "Failed to drop note");
        }
      }

      if (guestSenderName.trim()) {
        localStorage.setItem("pairfect_guest_name", guestSenderName.trim());
      }

      setDroppedId(`note_${Date.now()}`);
      setMessage("");
      setQuickDropSuccess(true);

      setTimeout(() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }, 550);

      await fetchNotes();
      setTimeout(() => setDroppedId(null), 1200);
      setTimeout(() => setQuickDropSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to drop note.");
    } finally {
      setSubmitting(false);
    }
  };

  // Draw Random Note
  const handleDrawNote = () => {
    if (notes.length === 0 || shaking || drawing) return;
    setShaking(true);
    setActiveNote(null);
    setPinnedToMemories(false);

    setTimeout(() => {
      setShaking(false);
      setDrawing(true);
      setTimeout(() => {
        setDrawing(false);
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        setActiveNote(randomNote);
      }, 700);
    }, 800);
  };

  // Copy Quick-Drop Share Link
  const handleCopyDropLink = async () => {
    if (typeof window === "undefined" || !activePairId) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/gratitude-jar?drop=${activePairId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      alert(`Share this Quick-Drop link with your partner: ${shareUrl}`);
    }
  };

  // Generate Vintage Polaroid Keepsake (900x1100 PNG)
  const generatePolaroidKeepsake = async (
    noteContent: string,
    senderLabel: string,
    createdDate: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Warm table shadow background
    ctx.fillStyle = "#F5EFE6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Realistic Polaroid white card with subtle bevel
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(45, 31, 45, 0.12)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 14;
    ctx.beginPath();
    ctx.roundRect(70, 60, 760, 960, 16);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Inner photo area with warm golden hour watercolor wash
    const grad = ctx.createLinearGradient(120, 110, 780, 740);
    grad.addColorStop(0, "#FAF2E8");
    grad.addColorStop(0.5, "#F7E8DA");
    grad.addColorStop(1, "#EED8C6");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(110, 100, 680, 650, 8);
    ctx.fill();

    // Subtle inner vignette border
    ctx.strokeStyle = "rgba(180, 140, 110, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(110, 100, 680, 650);

    // Decorative origami heart stamp at top
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 28px serif";
    ctx.textAlign = "center";
    ctx.fillText("♡", canvas.width / 2, 175);

    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 13px monospace";
    ctx.fillText("APPRECIATION SLIP", canvas.width / 2, 210);

    // Word wrap note text inside polaroid photo area
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "italic bold 32px serif";
    const words = noteContent.split(" ");
    let line = "";
    let y = 300;
    const maxLineW = 580;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && i > 0) {
        ctx.fillText(line.trim(), canvas.width / 2, y);
        line = words[i] + " ";
        y += 46;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), canvas.width / 2, y);

    // Polaroid Bottom White Chin: handwritten captions
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 26px serif";
    ctx.textAlign = "center";
    ctx.fillText(`"From: ${senderLabel}"`, canvas.width / 2, 830);

    const formattedDate = new Date(createdDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    ctx.fillStyle = "#8C7A68";
    ctx.font = "14px monospace";
    ctx.fillText(formattedDate.toUpperCase(), canvas.width / 2, 875);

    // Bottom brand tag
    ctx.fillStyle = "#C49A45";
    ctx.font = "bold 14px monospace";
    ctx.fillText("PAIRFECT · THE GRATITUDE JAR", canvas.width / 2, 955);

    return canvas.toDataURL("image/png");
  };

  // Pin Note to Memory Wall
  const handlePinToMemoryWall = async () => {
    if (!activeNote || pinnedToMemories || isSavingMemory) return;

    if (!user || !pair?.id) {
      setPinnedToMemories(true);
      return;
    }

    try {
      setIsSavingMemory(true);
      const isMine = activeNote.user_id === user.id;
      const authorLabel = isMine ? "You" : partner?.display_name || "Partner";

      const { error: pinErr } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Gratitude Note from ${authorLabel} 💌`,
        description: `"${activeNote.content}"`,
        moment_date: new Date(activeNote.created_at).toISOString().split("T")[0],
      });

      if (!pinErr) {
        setPinnedToMemories(true);
      }
    } catch (err) {
      console.error("Pin memory error:", err);
    } finally {
      setIsSavingMemory(false);
    }
  };

  // Download Polaroid Keepsake
  const handleDownloadPolaroid = async () => {
    if (!activeNote) return;
    try {
      setIsDownloadingPolaroid(true);
      const isMine = activeNote.user_id === user?.id;
      const authorLabel = isMine ? "You" : partner?.display_name || "Partner";

      const dataUrl = await generatePolaroidKeepsake(
        activeNote.content,
        authorLabel,
        activeNote.created_at
      );

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `pairfect-gratitude-polaroid-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloadingPolaroid(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (filterAuthor === "me" && n.user_id !== user?.id) return false;
    if (filterAuthor === "partner" && n.user_id === user?.id) return false;
    if (filterYear !== "all") {
      const year = new Date(n.created_at).getFullYear().toString();
      if (year !== filterYear) return false;
    }
    return true;
  });

  const availableYears = Array.from(
    new Set(notes.map((n) => new Date(n.created_at).getFullYear().toString()))
  ).sort().reverse();

  if (loading || (pair && fetching)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Navigation />
        <Loader2 className="w-6 h-6 text-[#E11D48] animate-spin" />
      </div>
    );
  }

  // Standalone Quick-Drop Mode for Unpaired / Guest Visitors via ?drop=...
  if (!pair && quickDropId) {
    return (
      <div className="relative min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900 pb-24">
        <Navigation />

        <main className="max-w-md w-full mx-auto px-5 pt-20 sm:pt-24 pb-16 flex-1 flex flex-col justify-center animate-fade-in">
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border-2 border-stone-800 text-[#E11D48] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Heart className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-widest uppercase text-[#E11D48] font-bold">QUICK-DROP STATION</p>
              <h1 className="font-serif italic text-2xl font-bold text-stone-900">The Gratitude Jar</h1>
              <p className="text-xs text-stone-600">
                Slip a sweet note into the jar. No account or password required.
              </p>
            </div>

            {quickDropSuccess ? (
              <div className="py-8 space-y-3 bg-emerald-50 rounded-2xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-800 text-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-sm font-bold text-emerald-900">Your origami note was slipped into the jar! 💌</p>
                <p className="text-xs text-emerald-700">Your partner will discover it when they draw from the jar.</p>
              </div>
            ) : (
              <form onSubmit={handleDropNote} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest block mb-1.5">
                    Your Name or Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={guestSenderName}
                    onChange={(e) => setGuestSenderName(e.target.value)}
                    placeholder="e.g. Maya"
                    maxLength={32}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-800 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest block mb-1.5">
                    Appreciation Note
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What are you grateful for today? Write a warm memory, inside joke, or little thank you..."
                    className="w-full p-4 rounded-xl border-2 border-stone-800 bg-stone-50 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] resize-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Fold & Drop into Jar 💌"}
                </button>
              </form>
            )}
          </div>
        </main>

        <AmbientSoundscapeBar />
      </div>
    );
  }

  // Unpaired Prompt if not in quick-drop mode and not in demo mode
  if (!pair && !isDemoMode) {
    return (
      <div className="relative min-h-screen flex flex-col justify-center bg-[#FAF9F6]">
        <Navigation />
        <UnpairedPrompt
          title="Gratitude Jar"
          description="Fold little paper notes of appreciation, drop them in your shared glass jar, and draw random memories on cozy evenings. Connect your partner to start filling your jar."
          icon={Heart}
        />
        <div className="text-center -mt-8 pb-16 z-20">
          <button
            onClick={() => {
              setIsDemoMode(true);
              setNotes(DEMO_NOTES);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase tracking-wider border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Interactive Demo Jar ✨</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-16 bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-36">
        
        {/* Top Actions: Copy Quick-Drop Link */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCopyDropLink}
            title="Copy Quick-Drop link so partner can drop notes from any phone"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-stone-800 text-stone-700 hover:text-stone-950 text-xs font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
          >
            <Share2 className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Copy Quick-Drop Link</span>
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Hero Sanctuary Card with Mascot */}
        <div className="relative rounded-3xl border-2 border-stone-800 bg-[#FAF9F6] p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.7)]">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>DAILY GRATITUDE · PRIVATE VAULT</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-3">
                <span>The Gratitude Jar</span>
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed font-sans">
                Fold little paper slips of appreciation, drop them into your shared jar, and draw random memories on quiet evenings.
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
              <CoupleBeansMascot className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Side-by-Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: The Jar + Draw Note Actions */}
          <div className="lg:col-span-6 flex flex-col items-center select-none bg-white border-2 border-stone-800 rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
            <motion.div
              className="relative my-4"
              animate={
                shaking
                  ? {
                      x: [0, -10, 8, -8, 6, -6, 4, -4, 2, 0],
                      y: [0, 2, -2, 2, -2, 1, -1, 0],
                      rotate: [0, -4, 3, -3, 2, -2, 1, 0],
                    }
                  : drawing
                  ? {
                      y: [0, -25, 0],
                      scale: [1, 1.02, 1],
                    }
                  : {}
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
              onClick={handleDrawNote}
            >
              {/* Glass Jar */}
              <div
                className="w-52 h-76 rounded-t-[48px] rounded-b-[28px] border-[3px] border-stone-800 relative cursor-pointer overflow-hidden flex flex-col justify-end p-4 shadow-xl transition-transform duration-300 hover:scale-[1.01]"
                style={{
                  background: "rgba(253, 250, 244, 0.65)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow:
                    "inset 0 12px 24px rgba(255,255,255,0.4), inset 0 -12px 24px rgba(0,0,0,0.06), 0 20px 40px rgba(60,40,20,0.08)",
                }}
              >
                {/* Cork Lid */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 rounded-md border-2 border-stone-800 shadow-inner z-20 flex flex-col justify-between py-1"
                  style={{
                    background: "linear-gradient(135deg, #C29B72 0%, #A88663 100%)",
                  }}
                >
                  <div className="w-24 h-[1px] bg-white/30 mx-auto rounded" />
                  <div className="w-20 h-0.5 bg-black/20 mx-auto rounded-full" />
                </div>

                {/* Reflections */}
                <div className="absolute top-8 left-10 w-1 h-56 bg-white/40 rounded-full blur-[0.5px] pointer-events-none z-10" />
                <div className="absolute top-12 right-6 w-0.5 h-40 bg-white/30 rounded-full blur-[0.5px] pointer-events-none z-10" />

                {/* Tag label */}
                <div className="absolute top-10 left-5 w-8 h-12 bg-[#FAF7F2] border-2 border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.8)] rounded-sm origin-top rotate-[14deg] z-10 flex flex-col items-center justify-center p-0.5 pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-200 mb-1 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-[#E11D48] rounded-full" />
                  </div>
                  <span className="text-[6px] font-mono font-bold text-stone-700 leading-none">MEMOIRES</span>
                </div>

                {/* Accumulated slips */}
                <div className="relative flex-1 w-full mt-8 flex flex-wrap items-end justify-center p-2">
                  {notes.slice(0, 32).map((_, i) => {
                    const layout = getSlipLayout(i, notes.length);
                    const color = SLIP_COLORS[i % SLIP_COLORS.length];
                    return (
                      <motion.div
                        key={i}
                        className={`absolute w-4 h-4 rounded-sm border shadow-xs ${color}`}
                        style={{
                          bottom: layout.bottom,
                          left: layout.left,
                          transform: `rotate(${layout.rotate})`,
                          transformOrigin: "center center",
                        }}
                        animate={
                          shaking
                            ? {
                                y: [0, -30, 0],
                                x: [0, i % 2 === 0 ? 10 : -10, 0],
                                rotate: [layout.rotate, `${parseFloat(layout.rotate) + 90}deg`, layout.rotate],
                              }
                            : {}
                        }
                        transition={{ duration: 0.8, delay: i * 0.015 }}
                      />
                    );
                  })}

                  {notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                      <p className="text-[9px] font-mono text-stone-500 uppercase tracking-wider font-bold">Empty Jar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dropped slip animation */}
              <AnimatePresence>
                {droppedId && (
                  <motion.div
                    initial={{ y: -180, x: 80, scale: 1.6, rotate: 0, opacity: 1 }}
                    animate={{ y: 80, x: 0, scale: 0.25, rotate: 360, opacity: [1, 1, 0.8] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeIn" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm bg-rose-100 border border-rose-300 shadow z-30"
                  />
                )}
              </AnimatePresence>

              {/* Drawn slip animation */}
              <AnimatePresence>
                {drawing && (
                  <motion.div
                    initial={{ y: 120, x: 0, scale: 0.25, rotate: 0, opacity: 0.8 }}
                    animate={{ y: -100, x: 0, scale: 1.8, rotate: -360, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-sm bg-amber-100 border border-amber-300 shadow z-30"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Wooden Shelf */}
            <div className="w-64 h-3.5 bg-gradient-to-b from-[#A06D44] to-[#7B4D25] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-t border-[#C08F60]/30 relative -mt-1.5 z-0 flex flex-col justify-end">
              <div className="w-full h-0.5 bg-black/15" />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full">
              <button
                onClick={handleDrawNote}
                disabled={notes.length === 0 || shaking || drawing}
                className="py-2.5 px-6 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 transition-all border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                {shaking || drawing ? "Unfolding..." : "Pick a random memory ✨"}
              </button>

              <button
                onClick={() => setArchiveOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 transition-all border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <Archive className="w-3.5 h-3.5 text-[#E11D48]" /> Read All ({notes.length})
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Write Note Form + Drawn Active Note */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Drawn Active Note (Unfolded Letter + Polaroid Keepsake Action) */}
            <AnimatePresence mode="wait">
              {activeNote && (
                <motion.div
                  key={activeNote.id}
                  initial={{ scale: 0.94, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 12 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className="w-full rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 bg-[#FFFDF7] space-y-4"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-stone-500 border-b-2 border-stone-200 pb-2 font-bold">
                    <span>Appreciation note</span>
                    <span>From: {activeNote.user_id === user?.id ? "You" : partner?.display_name || "Partner"}</span>
                  </div>

                  <p className="font-serif italic text-xl text-stone-900 leading-relaxed whitespace-pre-wrap py-2 font-bold">
                    "{activeNote.content}"
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t-2 border-stone-200 text-[10px] font-mono text-stone-500 font-bold">
                    <span>{format(new Date(activeNote.created_at), "MMMM d, yyyy")}</span>
                    <button
                      onClick={() => setActiveNote(null)}
                      className="text-[10px] font-mono uppercase tracking-widest text-stone-900 hover:text-[#E11D48] cursor-pointer font-bold border-b-2 border-stone-900 pb-0.5"
                    >
                      Fold & Return
                    </button>
                  </div>

                  {/* KEEPSAKE POLAROID & PIN ACTIONS */}
                  <div className="pt-2 grid grid-cols-2 gap-2.5 border-t border-stone-200">
                    <button
                      onClick={handlePinToMemoryWall}
                      disabled={pinnedToMemories || isSavingMemory}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] ${
                        pinnedToMemories
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                      }`}
                    >
                      {isSavingMemory ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : pinnedToMemories ? (
                        <><Check className="w-3.5 h-3.5" /> Pinned to Memories</>
                      ) : (
                        <><BookmarkCheck className="w-3.5 h-3.5" /> Pin to Memory Wall</>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadPolaroid}
                      disabled={isDownloadingPolaroid}
                      className="py-2 px-3 rounded-xl border-2 border-stone-800 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                    >
                      {isDownloadingPolaroid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Export Polaroid 📷</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drop Note Slip Form */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <form
                onSubmit={handleDropNote}
                className="rounded-3xl border-2 border-stone-800 bg-white p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">Write a keepsake</p>
                  <h2 className="font-serif italic text-xl font-bold text-stone-900">Drop a Note into the Jar</h2>
                </div>

                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What are you grateful for today? Write a sweet note to drop in your jar..."
                  className="w-full p-4 rounded-2xl border-2 border-stone-800 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48] resize-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] text-stone-900"
                />

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2 border-2 border-red-200">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 transition-all cursor-pointer disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Fold & Drop into Jar 💌"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Archive Drawer */}
      <AnimatePresence>
        {archiveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="w-full max-w-md bg-[#FAF9F6] h-full shadow-2xl flex flex-col border-l-2 border-stone-800 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b-2 border-stone-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="font-serif italic text-xl font-bold text-stone-900">Jar Archive</h2>
                  <p className="text-xs text-stone-500 font-mono font-bold">All your saved slips of love</p>
                </div>
                <button
                  onClick={() => setArchiveOpen(false)}
                  className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 bg-stone-100 border-b-2 border-stone-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">Author:</span>
                  <select
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value as any)}
                    className="bg-white border-2 border-stone-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none shadow-[1px_1px_0px_0px_rgba(28,25,23,0.8)] font-bold"
                  >
                    <option value="all">Everyone</option>
                    <option value="me">Only Me</option>
                    <option value="partner">Only Partner</option>
                  </select>
                </div>

                {availableYears.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">Year:</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border-2 border-stone-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none shadow-[1px_1px_0px_0px_rgba(28,25,23,0.8)] font-bold"
                    >
                      <option value="all">All Time</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Note Slips List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs font-mono font-bold">No notes match your filters.</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isMine = note.user_id === user?.id;
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setActiveNote(note);
                          setArchiveOpen(false);
                        }}
                        className="p-4 rounded-2xl border-2 border-stone-800 bg-white space-y-2 relative shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] cursor-pointer hover:translate-y-[-1px] transition-all"
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider font-bold">
                          <span>{isMine ? "You" : partner?.display_name || "Partner"}</span>
                          <span>{format(new Date(note.created_at), "MMM d, yyyy")}</span>
                        </div>
                        <p className="font-serif italic text-sm text-stone-900 leading-relaxed font-bold">
                          "{note.content}"
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AmbientSoundscapeBar />
    </div>
  );
}
