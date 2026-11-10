"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Heart,
  Save,
  Check,
  Users,
  Volume2,
  VolumeX,
  Share2,
  ArrowRight,
  RefreshCw,
  Utensils,
  Film,
  Flame,
  CheckCircle2,
  Lock,
  Copy,
  Bookmark,
  Download,
  Loader2,
  User,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// Preset Wheels
interface RouletteOption {
  label: string;      // Punchy label on wheel wedge (max 15 chars, never truncated)
  fullTitle: string;  // Rich decree text
  emoji: string;      // Visual anchor
}

interface WheelPreset {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  isPlusOnly?: boolean;
  items: RouletteOption[];
}

const PRESETS: WheelPreset[] = [
  {
    id: "food",
    name: "What to Eat",
    icon: "🍕",
    tagline: "End the 45-minute 'I don't know, you pick' debate.",
    items: [
      { label: "Ramen", fullTitle: "Steaming hot ramen together", emoji: "🍜" },
      { label: "Tacos", fullTitle: "Street tacos with lime & salsa", emoji: "🌮" },
      { label: "Sushi", fullTitle: "Fresh sushi & sashimi date", emoji: "🍣" },
      { label: "Pasta", fullTitle: "Handmade pasta & wine night", emoji: "🍝" },
      { label: "Pizza", fullTitle: "Build-a-pizza from scratch", emoji: "🍕" },
      { label: "Breakfast", fullTitle: "Fluffy pancakes for dinner", emoji: "🥞" },
      { label: "Hotpot", fullTitle: "Cozy hotpot feast for two", emoji: "🍲" },
      { label: "Burgers", fullTitle: "Late-night smash burger run", emoji: "🍔" },
    ],
  },
  {
    id: "date",
    name: "Date Night",
    icon: "💕",
    tagline: "Spontaneous connection when routine sets in.",
    items: [
      { label: "Picnic", fullTitle: "Living room candlelit floor picnic", emoji: "🧺" },
      { label: "Stargazing", fullTitle: "Late-night stargazing drive", emoji: "✨" },
      { label: "Bake Night", fullTitle: "Bake a warm dessert together", emoji: "👩‍🍳" },
      { label: "Bookstore", fullTitle: "Bookstore & warm matcha date", emoji: "📚" },
      { label: "Board Games", fullTitle: "Fierce board game duel", emoji: "🎲" },
      { label: "Massage", fullTitle: "15-minute foot & shoulder massage", emoji: "🕯️" },
      { label: "Portraits", fullTitle: "Paint portraits of each other", emoji: "🎨" },
      { label: "Ice Cream", fullTitle: "Midnight ice cream stroll", emoji: "🍦" },
    ],
  },
  {
    id: "movie",
    name: "What to Watch",
    icon: "🎬",
    tagline: "Stop browsing Netflix for 2 hours.",
    items: [
      { label: "Ghibli", fullTitle: "Cozy Studio Ghibli classic", emoji: "🍃" },
      { label: "Rom-Com", fullTitle: "Nostalgic 2000s rom-com", emoji: "🍿" },
      { label: "Thriller", fullTitle: "Twisted psychological thriller", emoji: "😱" },
      { label: "Disney", fullTitle: "Childhood Disney favorite", emoji: "🏰" },
      { label: "True Crime", fullTitle: "Gripping true crime documentary", emoji: "🔍" },
      { label: "Sitcom", fullTitle: "Binge 4 comfort sitcom episodes", emoji: "🛋️" },
      { label: "Sci-Fi", fullTitle: "Mind-bending sci-fi movie", emoji: "🪐" },
      { label: "Indie Film", fullTitle: "Critically acclaimed indie film", emoji: "🎬" },
    ],
  },
  {
    id: "chores",
    name: "Who Does It?",
    icon: "🧹",
    tagline: "Zero-resentment, democratic settling.",
    items: [
      { label: "Dishes", fullTitle: "Loser tackles the full sink of dishes", emoji: "🫧" },
      { label: "Takeout", fullTitle: "Loser pays for tonight's takeout order", emoji: "🥡" },
      { label: "Trash", fullTitle: "Take out all trash and recycling bags", emoji: "🗑️" },
      { label: "Breakfast", fullTitle: "Winner gets breakfast in bed tomorrow", emoji: "🥞" },
      { label: "Both Do It", fullTitle: "Truce: play music and clean together in 10 mins", emoji: "🤝" },
      { label: "Coffee Run", fullTitle: "Loser makes tomorrow morning's coffee run", emoji: "☕" },
    ],
  },
  {
    id: "spicy",
    name: "Spicy Moves",
    icon: "🌶️",
    tagline: "Playful dares and intimate physical challenges.",
    isPlusOnly: true,
    items: [
      { label: "Slow Dance", fullTitle: "Slow dance to 1 song in dim light", emoji: "🕯️" },
      { label: "Neck Kiss", fullTitle: "60-second gentle neck kisses", emoji: "💋" },
      { label: "Blindfold", fullTitle: "Feed each other dessert blindfolded", emoji: "🍓" },
      { label: "Whisper", fullTitle: "Whisper your favorite fantasy in their ear", emoji: "🤫" },
      { label: "Massage", fullTitle: "5-minute full back rub with oil", emoji: "💆" },
      { label: "Stare", fullTitle: "Look into each other's eyes for 2 mins without talking", emoji: "👀" },
    ],
  },
  {
    id: "micro-adventure",
    name: "Micro-Adventures",
    icon: "🧭",
    tagline: "Break routine with quick mini-dates.",
    items: [
      { label: "Walk & Tea", fullTitle: "Night walk with warm boba tea", emoji: "🧋" },
      { label: "Convenience Run", fullTitle: "Late-night snack haul from convenience store", emoji: "🏪" },
      { label: "Music Drive", fullTitle: "Drive with windows down to favorite album", emoji: "🚗" },
      { label: "Photo Walk", fullTitle: "Take 5 creative photos of each other", emoji: "📷" },
      { label: "Paper Planes", fullTitle: "Fold paper planes and race from balcony", emoji: "✈️" },
      { label: "Sunset Spot", fullTitle: "Find a bench with a high view of sunset", emoji: "🌇" },
    ],
  },
];

// Warm editorial color palette for wedges
const PALETTE = [
  { fill: "#FFE2E8", stroke: "#F5BFCC", text: "#4A1825" }, // soft rose
  { fill: "#FFF8F0", stroke: "#EED7C5", text: "#3B2A20" }, // warm cream
  { fill: "#FFEBF1", stroke: "#F0CAD6", text: "#521A28" }, // vintage blush
  { fill: "#F7EFE9", stroke: "#DFCFC2", text: "#3D2B24" }, // warm parchment
  { fill: "#F9E8EE", stroke: "#ECCAD6", text: "#4E2135" }, // soft rose silk
  { fill: "#FFF3EB", stroke: "#EED7C8", text: "#4D2C1E" }, // peach cream
  { fill: "#F3EDF5", stroke: "#DFD2E3", text: "#3E2644" }, // lilac haze
  { fill: "#FDF5EE", stroke: "#EBDACD", text: "#422F22" }, // champagne
  { fill: "#FFEFF3", stroke: "#F7CDD7", text: "#501A29" }, // blossom petal
];

// Web Audio clicks and fanfare synthesizer
function playClick(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800 + Math.random() * 150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch {}
}

function playFanfare(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  try {
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.09);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.09 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.09);
      osc.stop(audioCtx.currentTime + idx * 0.09 + 0.4);
    });
  } catch {}
}

export default function RoulettePage() {
  const { user, pair, partner, profile } = useAuth();
  const { isPlus } = useSubscription();
  const supabase = createClient();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<WheelPreset>(PRESETS[0]);
  const [items, setItems] = useState<RouletteOption[]>(PRESETS[0].items);
  const [customInput, setCustomInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Identity and Room Codes
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Wheel physics state
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteOption | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [confettiBurst, setConfettiBurst] = useState(false);
  const [savedToVault, setSavedToVault] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [vetoUsed, setVetoUsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [partnerOnline, setPartnerOnline] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<any>(null);

  // 1. Audio context initialization on user gesture
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioClass) audioCtxRef.current = new AudioClass();
      }
    };
    window.addEventListener("pointerdown", initAudio, { once: true });
    return () => window.removeEventListener("pointerdown", initAudio);
  }, []);

  // 2. Initialize Room Code and Identity on Mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    let clientId = user?.id;
    if (!clientId) {
      let storedGid = sessionStorage.getItem("pairfect_guest_id");
      if (!storedGid) {
        storedGid = `guest_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("pairfect_guest_id", storedGid);
      }
      clientId = storedGid;
    }
    setMyEffectiveId(clientId);

    const storedName = localStorage.getItem("pairfect_guest_name");
    if (storedName) {
      setGuestName(storedName);
    }

    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get("room");

    if (queryRoom) {
      setRoomCode(queryRoom.trim());
      if (!user && !storedName) {
        setIsGuestPromptOpen(true);
      }
    } else if (pair?.id) {
      setRoomCode(pair.id);
    } else {
      const generated = Math.random().toString(36).substring(2, 7).toUpperCase();
      setRoomCode(generated);
    }
  }, [user, pair?.id]);

  const effectiveDisplayName = profile?.display_name || user?.email?.split("@")[0] || guestName || "You";
  const effectivePartnerName = dynamicPartnerName || partner?.display_name || "Partner";

  // 3. Realtime Synchronization Channel
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    const channel = supabase.channel(`roulette:${roomCode}`, {
      config: { presence: { key: myEffectiveId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherEntries = Object.entries(state)
          .filter(([key]) => key !== myEffectiveId)
          .flatMap(([_, presences]) => presences);

        if (otherEntries.length > 0) {
          setPartnerOnline(true);
          const otherInfo = otherEntries[0] as any;
          if (otherInfo?.user_name) {
            setDynamicPartnerName(otherInfo.user_name);
          }
        } else {
          setPartnerOnline(false);
        }
      })
      .on("broadcast", { event: "spin-wheel" }, (payload: any) => {
        if (payload?.payload?.targetRotation !== undefined) {
          executeSpin(payload.payload.targetRotation, payload.payload.winner, payload.payload.winningIndex);
        }
      })
      .on("broadcast", { event: "preset-change" }, (payload: any) => {
        const found = PRESETS.find((p) => p.id === payload?.payload?.presetId);
        if (found) {
          setActivePreset(found);
          setItems(found.items);
          setIsCustomMode(false);
          setWinner(null);
          setSavedToVault(false);
        }
      })
      .subscribe(async (status: any) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
            user_name: effectiveDisplayName,
            user_id: myEffectiveId,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myEffectiveId, isGuestPromptOpen, effectiveDisplayName, supabase]);

  // Execute Wheel Rotation Animation and Deceleration Audio
  const executeSpin = (nextRotation: number, winningOption: RouletteOption, winIdx?: number) => {
    setIsSpinning(true);
    setWinner(null);
    setWinningIndex(null);
    setSavedToVault(false);
    setRotation(nextRotation);

    if (soundEnabled && audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const startTime = Date.now();
      const totalDuration = 4500;

      const scheduleTick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= totalDuration) return;

        playClick(audioCtxRef.current);

        const progress = elapsed / totalDuration;
        const nextDelay = 30 + Math.pow(progress, 2.6) * 320;
        setTimeout(scheduleTick, nextDelay);
      };

      scheduleTick();
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(winningOption);
      if (winIdx !== undefined) setWinningIndex(winIdx);
      setConfettiBurst(true);
      if (soundEnabled) playFanfare(audioCtxRef.current);
      setTimeout(() => setConfettiBurst(false), 3800);
    }, 4500);
  };

  // Deterministic Spin Calculation
  const handleSpinClick = () => {
    console.log("SPIN_TRIGGERED", { isSpinning, count: items.length });
    if (isSpinning || items.length === 0) return;

    const sliceAngle = 360 / items.length;
    const extraFullRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const winningIdx = Math.floor(Math.random() * items.length);
    const chosenOption = items[winningIdx];

    const targetNormalized = (360 - ((winningIdx * sliceAngle) % 360)) % 360;
    const currentNormalized = ((rotation % 360) + 360) % 360;
    const delta = (targetNormalized - currentNormalized + 360) % 360;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.4);
    const nextRotation = rotation + extraFullRotations + delta + jitter;

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "spin-wheel",
          payload: { targetRotation: nextRotation, winner: chosenOption, winningIndex: winningIdx },
        });
      } catch (err) {
        console.warn("Realtime spin broadcast non-blocking error:", err);
      }
    }

    executeSpin(nextRotation, chosenOption, winningIdx);
  };

  // Switch Active Preset
  const handlePresetSelect = (preset: WheelPreset) => {
    if (preset.isPlusOnly && !isPlus) {
      setIsPaywallOpen(true);
      return;
    }
    setActivePreset(preset);
    setItems(preset.items);
    setIsCustomMode(false);
    setWinner(null);
    setSavedToVault(false);

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "preset-change",
          payload: { presetId: preset.id },
        });
      } catch (err) {
        console.warn("Realtime preset broadcast non-blocking error:", err);
      }
    }
  };

  // Copy Room Link
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/roulette?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // Guest Modal Submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const clean = guestInput.trim();
    setGuestName(clean);
    localStorage.setItem("pairfect_guest_name", clean);
    setIsGuestPromptOpen(false);
  };

  // Canvas Keepsake Certificate Generator
  const generateKeepsakeImage = async (
    winnerTitle: string,
    winnerEmoji: string,
    presetName: string,
    userA: string,
    userB: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Warm textured parchment background
    ctx.fillStyle = "#FAF6F0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer border
    ctx.strokeStyle = "#E4D5C5";
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    // Inner dashed ticket border
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#C9B59F";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
    ctx.setLineDash([]);

    // Header & Vintage Date Stamp
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAIRFECT KEEPSAKE : TONIGHT'S DECREE", canvas.width / 2, 105);

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
    ctx.fillStyle = "#8C7A68";
    ctx.font = "14px monospace";
    ctx.fillText(dateStr, canvas.width / 2, 135);

    // Divider
    ctx.strokeStyle = "#DECBC0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 165);
    ctx.lineTo(canvas.width - 100, 165);
    ctx.stroke();

    // Couple Names
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  ♡  ${userB}`, canvas.width / 2, 230);

    // Category
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${presetName.toUpperCase()} WHEEL`, canvas.width / 2, 275);

    // Big Emoji
    ctx.font = "96px serif";
    ctx.fillText(winnerEmoji, canvas.width / 2, 395);

    // Winner Title
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 38px serif";
    ctx.fillText(`"${winnerTitle}"`, canvas.width / 2, 475);

    // Decree Seal Box
    ctx.fillStyle = "#F2E8DC";
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(100, 520, canvas.width - 200, 80, 16);
    } else {
      ctx.rect(100, 520, canvas.width - 200, 80);
    }
    ctx.fill();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 19px serif";
    ctx.fillText("SEALED BY FATE", canvas.width / 2, 555);
    ctx.fillStyle = "#55444E";
    ctx.font = "15px sans-serif";
    ctx.fillText("Accepted without objection. No arguments allowed!", canvas.width / 2, 582);

    // Bottom Decorative Compass
    ctx.strokeStyle = "#DECBC0";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 780, 75, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 15px monospace";
    ctx.fillText("THE WHEEL HAS SPOKEN", canvas.width / 2, 880);

    // Footer stamp
    ctx.textAlign = "center";
    ctx.strokeStyle = "#DECBC0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 1030);
    ctx.lineTo(canvas.width - 100, 1030);
    ctx.stroke();

    ctx.fillStyle = "#A38F7D";
    ctx.font = "14px monospace";
    ctx.fillText("PAIRFECT SANCTUARY : KEPT FOREVER", canvas.width / 2, 1070);

    return canvas.toDataURL("image/png");
  };

  // Pin Keepsake to Memory Wall
  const handlePinToMemoryWall = async () => {
    if (!winner || savedToVault || isSavingMemory) return;
    if (!user || !pair?.id) {
      setSavedToVault(true);
      return;
    }

    try {
      setIsSavingMemory(true);
      const { error } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Fate's Decree: ${winner.fullTitle} ${winner.emoji}`,
        description: `Spun the ${activePreset.name} wheel together! Fate sealed tonight's decree: "${winner.fullTitle}". No vetoes allowed! ♡`,
        moment_date: new Date().toISOString().split("T")[0],
      });

      if (!error) {
        setSavedToVault(true);
      } else {
        console.error("Failed to pin memory:", error);
      }
    } catch (err) {
      console.error("Pin memory error:", err);
    } finally {
      setIsSavingMemory(false);
    }
  };

  // Download Keepsake Image
  const handleDownloadKeepsake = async () => {
    if (!winner) return;
    try {
      setIsDownloadingCard(true);
      const dataUrl = await generateKeepsakeImage(
        winner.fullTitle,
        winner.emoji,
        activePreset.name,
        effectiveDisplayName,
        effectivePartnerName
      );

      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `pairfect-decree-${winner.label.toLowerCase()}-${effectiveDisplayName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download keepsake error:", err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // Wheel Geometry
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 14;
  const sliceAngle = 360 / items.length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col transition-colors selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Guest Nickname Modal */}
      {isGuestPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 text-[#E11D48] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-heading font-bold text-stone-900">Join Pairfect Roulette</h2>
              <p className="text-xs text-stone-600">
                You were invited to room <span className="font-mono font-bold text-[#E11D48]">{roomCode}</span>. What should your partner call you?
              </p>
            </div>
            <form onSubmit={handleGuestSubmit} className="space-y-4 pt-2">
              <input
                type="text"
                placeholder="Enter your name or nickname"
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                autoFocus
                maxLength={24}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-800 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
              />
              <button
                type="submit"
                disabled={!guestInput.trim()}
                className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 cursor-pointer transition-all"
              >
                Join the Room
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pl-36 md:pr-12 pb-24 flex-1 flex flex-col items-center">

        {/* Top Control Bar with Room Code and Presence */}
        <div className="w-full flex items-center justify-between mb-5 px-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy Room Link to Invite Partner"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-stone-800 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] font-mono font-bold text-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span className="font-mono font-bold">Room: {roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {partnerOnline && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border-2 border-emerald-600 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                {effectivePartnerName} watching live
              </span>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio clicks" : "Unmute audio clicks"}
            className="p-2 rounded-full bg-white border-2 border-stone-800 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hover:bg-stone-50"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E11D48]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Hero Sanctuary Card with Mascot */}
        <div className="w-full relative rounded-3xl border-2 border-stone-800 bg-[#FAF9F6] p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.7)]">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>OUR PLAYFUL ORACLE · LOVE ROULETTE</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-3">
                <span>Pairfect Roulette</span>
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed font-sans">
                Can't decide what to eat, watch, or do? Spin the wheel together. No arguing: the wheel has spoken. ♡
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
              <CoupleBeansMascot className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Wheel Presets Pills */}
        <div className="w-full flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 pt-1 mb-8 scrollbar-none px-2">
          {PRESETS.map((preset) => {
            const isSelected = !isCustomMode && activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-2 ${
                  isSelected
                    ? "bg-stone-900 text-white border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] scale-105"
                    : "bg-white text-stone-700 border-stone-800 hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                {preset.isPlusOnly && (
                  <span className="ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase font-mono font-bold border border-rose-300">
                    Plus
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Stage Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Roulette Wheel Mechanism */}
          <div className="lg:col-span-7 flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">

            {/* Pointer / Flapper Arrow */}
            <motion.div
              className="z-20 -mb-5"
              animate={
                isSpinning
                  ? { rotate: [0, -18, 12, -15, 8, -6, 0] }
                  : { rotate: 0 }
              }
              transition={
                isSpinning
                  ? { repeat: Infinity, duration: 0.16, ease: "linear" }
                  : { duration: 0.3 }
              }
              style={{ transformOrigin: "14px 4px" }}
            >
              <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                <path
                  d="M14 34L2 10C-1 5 2 0 8 0H20C26 0 29 5 26 10L14 34Z"
                  fill="url(#brass-grad)"
                  stroke="#7A4E2D"
                  strokeWidth="1.5"
                />
                <circle cx="14" cy="9" r="4" fill="#FFF2D6" />
                <defs>
                  <linearGradient id="brass-grad" x1="0" y1="0" x2="28" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F9D976" />
                    <stop offset="0.5" stopColor="#E0A948" />
                    <stop offset="1" stopColor="#B37C22" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Wheel Stage */}
            <div className="relative w-[320px] h-[320px] sm:w-[355px] sm:h-[355px] flex items-center justify-center mt-3">
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(180, 140, 120, 0.22), 0 10px 32px -4px rgba(139, 92, 73, 0.16), 0 2px 8px rgba(139, 92, 73, 0.08), inset 0 2px 6px rgba(255, 255, 255, 0.8)",
                }}
              />

              <div
                className="absolute -inset-2.5 rounded-full pointer-events-none"
                style={{
                  border: "2px solid rgba(212, 175, 55, 0.35)",
                  boxShadow: "inset 0 1px 3px rgba(255, 255, 255, 0.9), 0 4px 16px rgba(139, 92, 73, 0.08)",
                }}
              />

              {isSpinning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.98, 1.02, 0.98] }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                  className="absolute -inset-3.5 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(232, 82, 125, 0.16) 40%, transparent 72%)",
                  }}
                />
              )}

              {/* Confetti Particle Burst */}
              <AnimatePresence>
                {confettiBurst && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const angle = (i / 24) * 360;
                      const rad = (angle * Math.PI) / 180;
                      const dist = 110 + (i % 3) * 35;
                      const dx = dist * Math.cos(rad);
                      const dy = dist * Math.sin(rad);
                      const icons = ["♥", "✦", "★", "💖", "✨", "🌸"];
                      const icon = icons[i % icons.length];
                      const colors = ["#FF6B95", "#E8527D", "#E0A948", "#F9D976", "#B82B54"];
                      const color = colors[i % colors.length];

                      return (
                        <motion.div
                          key={`burst-${i}`}
                          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                          animate={{ opacity: 0, scale: [0.6, 1.3, 0.8], x: dx, y: dy }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="absolute text-lg font-bold select-none"
                          style={{ color }}
                        >
                          {icon}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              {/* Rotating Wheel Disc */}
              <div
                className="w-full h-full rounded-full overflow-hidden transition-transform will-change-transform"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4500ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.12, 0.95, 0.28, 1.0)",
                }}
              >
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full select-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={cx - 3}
                    fill="#F2E6DC"
                    stroke="#D9C2B2"
                    strokeWidth="4"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={cx - 8}
                    fill="none"
                    stroke="#C8AA96"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />

                  {items.map((item, idx) => {
                    const mid = idx * sliceAngle;
                    const startAngle = mid - sliceAngle / 2;
                    const endAngle = mid + sliceAngle / 2;

                    const radStart = ((startAngle - 90) * Math.PI) / 180;
                    const radEnd = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = cx + r * Math.cos(radStart);
                    const y1 = cy + r * Math.sin(radStart);
                    const x2 = cx + r * Math.cos(radEnd);
                    const y2 = cy + r * Math.sin(radEnd);

                    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
                    const theme = PALETTE[idx % PALETTE.length];
                    const isWinnerSlice = !isSpinning && winner && winningIndex === idx;
                    const normalizedMid = (mid % 360 + 360) % 360;
                    const isFlipped = normalizedMid >= 90 && normalizedMid <= 270;

                    return (
                      <g key={idx}>
                        <path
                          d={pathData}
                          fill={isWinnerSlice ? "#FFE8F0" : theme.fill}
                          stroke={isWinnerSlice ? "#E8527D" : "#E0CDBC"}
                          strokeWidth={isWinnerSlice ? "3" : "1.5"}
                        />

                        {isWinnerSlice && (
                          <path
                            d={pathData}
                            fill="rgba(232, 82, 125, 0.12)"
                            stroke="#FF6B95"
                            strokeWidth="3.5"
                            className="animate-pulse"
                          />
                        )}

                        <g transform={`rotate(${mid}, ${cx}, ${cy})`}>
                          <g transform={`translate(${cx}, ${cy - r * 0.62})`}>
                            <g transform={isFlipped ? "rotate(180)" : "rotate(0)"}>
                              <text
                                x="0"
                                y={isFlipped ? "10" : "-10"}
                                textAnchor="middle"
                                fontSize="16"
                                dominantBaseline="central"
                              >
                                {item.emoji}
                              </text>
                              <text
                                x="0"
                                y={isFlipped ? "-8" : "10"}
                                textAnchor="middle"
                                fill={isWinnerSlice ? "#B82B54" : theme.text}
                                fontSize="12"
                                fontWeight={isWinnerSlice ? "900" : "700"}
                                fontFamily="sans-serif"
                                letterSpacing="0.02em"
                                dominantBaseline="central"
                              >
                                {item.label}
                              </text>
                            </g>
                          </g>
                        </g>
                      </g>
                    );
                  })}

                  {items.map((_, pIdx) => {
                    const pAngle = pIdx * sliceAngle - sliceAngle / 2;
                    const pRad = ((pAngle - 90) * Math.PI) / 180;
                    const pegDistance = cx - 5.5;
                    const px = cx + pegDistance * Math.cos(pRad);
                    const py = cy + pegDistance * Math.sin(pRad);
                    return (
                      <g key={`peg-${pIdx}`}>
                        <circle cx={px} cy={py} r="3" fill="#D4AF37" stroke="#7A4E2D" strokeWidth="1" />
                        <circle cx={px - 0.7} cy={py - 0.7} r="1" fill="#FFF9E6" />
                      </g>
                    );
                  })}

                  <circle cx={cx} cy={cy} r="46" fill="#EBD5C2" stroke="#BFA28E" strokeWidth="2" />
                </svg>
              </div>

              {/* Center Spin Trigger Button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10">
                <button
                  id="roulette-spin-button"
                  onClick={handleSpinClick}
                  disabled={isSpinning || items.length === 0}
                  className="group relative w-20 h-20 rounded-full bg-[#E11D48] hover:bg-[#BE123C] border-2 border-stone-800 text-white flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed hover:scale-105"
                >
                  <span className="font-heading font-black text-xs tracking-widest uppercase text-white">
                    {isSpinning ? "SPINNING" : "SPIN"}
                  </span>
                  <Heart
                    className={`w-4 h-4 fill-white text-white mt-0.5 transition-transform ${
                      isSpinning ? "animate-spin" : "group-hover:scale-110"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Bottom Bar: Option Count */}
            <div className="w-full flex items-center justify-between mt-6 pt-4 border-t-2 border-stone-100 text-xs text-stone-600 font-bold">
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {items.length} Options on Wheel
              </span>
              <span className="text-[10px] font-mono text-[#E11D48] font-bold">
                Room: {roomCode}
              </span>
            </div>
          </div>

          {/* RIGHT: Fate's Decree Parchment Card & Keepsake */}
          <div className="lg:col-span-5 flex flex-col space-y-6">

            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div
                  key="winner-decree"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  {/* Result Decree Card */}
                  <div className="p-7 rounded-3xl bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-4 relative overflow-hidden">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-stone-800 text-[10px] font-mono font-bold tracking-widest uppercase shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Tonight's Decree</span>
                    </div>

                    <div className="space-y-1 py-1">
                      <span className="text-4xl block mb-2">{winner.emoji}</span>
                      <h3 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 leading-snug">
                        {winner.fullTitle}
                      </h3>
                    </div>

                    <p className="font-serif italic text-base text-[#E11D48] font-bold">
                      "No arguing. The wheel has spoken. ♡"
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      <button
                        onClick={handleSpinClick}
                        disabled={isSpinning}
                        className="w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] rounded-xl transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Spin Again</span>
                      </button>

                      <button
                        onClick={() => {
                          setVetoUsed(true);
                          handleSpinClick();
                        }}
                        disabled={isSpinning || vetoUsed}
                        className="w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer bg-stone-50 hover:bg-stone-100 text-stone-800 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] rounded-xl transition-all"
                        title={vetoUsed ? "Veto already used for this session" : "Playful couple rule: 1 free veto per night!"}
                      >
                        <span>{vetoUsed ? "Veto Used ♡" : "Use Veto (1x) 🚫"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Post-Decree Keepsake Card */}
                  <div className="relative overflow-hidden rounded-3xl border-2 border-stone-800 bg-[#FAF6F0] text-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
                    <div className="border-2 border-dashed border-stone-400 rounded-2xl p-4 space-y-3.5">

                      <div className="text-center border-b-2 border-stone-300 pb-2 space-y-1">
                        <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#E11D48]">
                          PAIRFECT KEEPSAKE : TONIGHT'S DECREE
                        </p>
                        <p className="text-xs font-mono text-stone-600 font-bold">
                          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs px-2 font-mono">
                        <div className="flex items-center gap-1 font-bold text-[#E11D48]">
                          <User className="w-3.5 h-3.5" />
                          <span>{effectiveDisplayName}</span>
                        </div>
                        <span className="text-stone-500 font-bold">♡</span>
                        <div className="flex items-center gap-1 font-bold text-blue-700">
                          <span>{effectivePartnerName}</span>
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="text-center py-1">
                        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 font-bold">
                          {activePreset.name} Wheel
                        </p>
                        <p className="text-xl font-serif font-black text-[#E11D48] italic mt-1">
                          "{winner.fullTitle}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={handlePinToMemoryWall}
                          disabled={savedToVault || isSavingMemory}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]
                            ${savedToVault
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                            }`}
                        >
                          {isSavingMemory ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : savedToVault ? (
                            <><Check className="w-3.5 h-3.5" /> Pinned to Memories</>
                          ) : (
                            <><Bookmark className="w-3.5 h-3.5" /> Pin to Memory Wall</>
                          )}
                        </button>

                        <button
                          onClick={handleDownloadKeepsake}
                          disabled={isDownloadingCard}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-white text-stone-900 border-2 border-stone-800 hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                        >
                          {isDownloadingCard ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <><Download className="w-3.5 h-3.5" /> Download Keepsake</>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-7 rounded-3xl bg-white border-2 border-stone-800 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 text-[#E11D48] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif italic text-2xl font-bold text-stone-900">
                    Fate is Waiting...
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                    Tap the red heart in the center of the wheel to spin. Whatever wedge lands under the top pointer becomes tonight's official decree!
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Custom Option Editor Panel */}
            <div className="p-6 rounded-3xl bg-white border-2 border-stone-800 space-y-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Edit Wheel Wedges
                </span>
                <span className="text-[10px] font-mono text-stone-500 font-bold">
                  {items.length}/10 wedges
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom option (e.g. Thai Food 🍜)..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      const trimmed = customInput.trim();
                      const newItem: RouletteOption = {
                        label: trimmed.slice(0, 14),
                        fullTitle: trimmed,
                        emoji: "✨",
                      };
                      setItems([...items, newItem]);
                      setIsCustomMode(true);
                      setCustomInput("");
                    }
                  }}
                  maxLength={40}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border-2 border-stone-800 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                />
                <button
                  onClick={() => {
                    if (!customInput.trim()) return;
                    const trimmed = customInput.trim();
                    const newItem: RouletteOption = {
                      label: trimmed.slice(0, 14),
                      fullTitle: trimmed,
                      emoji: "✨",
                    };
                    setItems([...items, newItem]);
                    setIsCustomMode(true);
                    setCustomInput("");
                  }}
                  disabled={!customInput.trim() || items.length >= 10}
                  className="px-3.5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {items.map((opt, i) => (
                  <div
                    key={`${opt.label}-${i}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-50 border-2 border-stone-200 text-xs font-medium text-stone-900"
                  >
                    <span className="truncate max-w-[200px]">
                      {opt.emoji} {opt.fullTitle}
                    </span>
                    {items.length > 2 && (
                      <button
                        onClick={() => {
                          setItems(items.filter((_, idx) => idx !== i));
                          setIsCustomMode(true);
                        }}
                        disabled={isSpinning}
                        className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* PLUS PAYWALL MODAL */}
        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle="Chaos Mode Wheel"
          featureDescription="Spicy couple challenges and playful dares for both partners."
        />

      </main>

      <AmbientSoundscapeBar />
    </div>
  );
}
