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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";

// ── Preset Wheels ─────────────────────────────────────────────────────────────
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
      { label: "Sci-Fi", fullTitle: "Mind-bending sci-fi journey", emoji: "🪐" },
      { label: "Indie Film", fullTitle: "Critically acclaimed indie gem", emoji: "🎬" },
    ],
  },
  {
    id: "chores",
    name: "Who Does It?",
    icon: "🧹",
    tagline: "Zero-resentment, democratic settling.",
    items: [
      { label: "Dishes", fullTitle: "Wash & dry tonight's dishes", emoji: "🫧" },
      { label: "Coffee", fullTitle: "Make tomorrow's morning coffee", emoji: "☕" },
      { label: "Pick Movie", fullTitle: "Pick tonight's film (no vetoes!)", emoji: "🎬" },
      { label: "Massage", fullTitle: "Give partner a 10-min foot rub", emoji: "💆" },
      { label: "Trash Run", fullTitle: "Take out all the trash bins", emoji: "🗑️" },
      { label: "10 Compliments", fullTitle: "Shower partner with 10 sweet compliments", emoji: "💖" },
      { label: "Cook Meal", fullTitle: "Cook breakfast in bed tomorrow", emoji: "🍳" },
      { label: "Be DJ", fullTitle: "Curate this evening's soundscape", emoji: "🎵" },
    ],
  },
  {
    id: "chaos",
    name: "Chaos Mode",
    icon: "😈",
    tagline: "Playful, spicy challenges for tonight.",
    isPlusOnly: true,
    items: [
      { label: "Phone Swap", fullTitle: "60-second phone swap (no panic!)", emoji: "📱" },
      { label: "1st Photo", fullTitle: "Recreate our very first photo", emoji: "📸" },
      { label: "Secret", fullTitle: "Whisper a secret you haven't told me", emoji: "🤫" },
      { label: "Dance Off", fullTitle: "2-minute silly pajama dance battle", emoji: "💃" },
      { label: "Taste Test", fullTitle: "Blindfolded mystery kitchen taste test", emoji: "🙈" },
      { label: "Impression", fullTitle: "Dramatic impression of how I act", emoji: "🎭" },
      { label: "Love Haiku", fullTitle: "Write a 30-second romantic haiku", emoji: "💌" },
      { label: "Eye Contact", fullTitle: "30 seconds of unbroken eye contact", emoji: "💋" },
    ],
  },
  {
    id: "talk",
    name: "Deep Talk",
    icon: "💬",
    tagline: "Intimacy prompts to remember why you fell in love.",
    items: [
      { label: "Childhood", fullTitle: "Tell me a childhood memory I haven't heard", emoji: "🧸" },
      { label: "Felt Loved", fullTitle: "When did you feel most loved this week?", emoji: "💖" },
      { label: "Next Year", fullTitle: "What is one dream you have for us next year?", emoji: "🌟" },
      { label: "Love Better", fullTitle: "How can I love you a little better right now?", emoji: "🕊️" },
      { label: "Three Words", fullTitle: "Describe our love story in three words", emoji: "📖" },
      { label: "1st Memory", fullTitle: "What was your very first impression of me?", emoji: "💭" },
      { label: "Admiration", fullTitle: "What is something you admire about my growth?", emoji: "🌱" },
      { label: "Home", fullTitle: "What does 'home' feel like to you today?", emoji: "🏡" },
    ],
  },
];

// Luxury Romance Palette: Alternating warm antique tones
const PALETTE = [
  { fill: "#FFF7F2", stroke: "#E8D5C8", text: "#422830" }, // antique linen
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
  const { user, pair, partner } = useAuth();
  const { isPlus } = useSubscription();
  const supabase = createClient();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<WheelPreset>(PRESETS[0]);
  const [items, setItems] = useState<RouletteOption[]>(PRESETS[0].items);
  const [customInput, setCustomInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Wheel physics state
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteOption | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [partnerOnline, setPartnerOnline] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio context initialization on user gesture
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

  // Realtime synchronization channel for couple
  useEffect(() => {
    if (!pair?.id) return;

    const channel = supabase.channel(`roulette:${pair.id}`, {
      config: { presence: { key: user?.id || "user" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPartnerOnline(Object.keys(state).length >= 2);
      })
      .on("broadcast", { event: "spin-wheel" }, (payload: any) => {
        if (payload?.payload?.targetRotation !== undefined) {
          executeSpin(payload.payload.targetRotation, payload.payload.winner);
        }
      })
      .subscribe(async (status: any) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pair?.id, user?.id]);

  // Select a preset
  const handleSelectPreset = (preset: WheelPreset) => {
    if (preset.isPlusOnly && !isPlus) {
      setIsPaywallOpen(true);
      return;
    }
    if (isSpinning) return;
    setActivePreset(preset);
    setItems(preset.items);
    setIsCustomMode(false);
    setWinner(null);
    setSavedToVault(false);
  };

  // Add custom item
  const handleAddCustom = () => {
    if (!customInput.trim() || isSpinning) return;
    const text = customInput.trim();
    const newItem: RouletteOption = {
      label: text.length > 14 ? text.slice(0, 13) + "…" : text,
      fullTitle: text,
      emoji: "✨",
    };
    setItems([...items, newItem]);
    setCustomInput("");
    setIsCustomMode(true);
    setWinner(null);
  };

  // Remove item
  const handleRemoveItem = (idx: number) => {
    if (items.length <= 2 || isSpinning) return;
    setItems(items.filter((_, i) => i !== idx));
    setIsCustomMode(true);
    setWinner(null);
  };

  // Reset to default preset
  const handleResetToPreset = () => {
    if (isSpinning) return;
    setItems(activePreset.items);
    setIsCustomMode(false);
    setWinner(null);
  };

  // Execute wheel spin with physical sound ticks and final winner decree
  const executeSpin = (targetRotation: number, winningOption: RouletteOption) => {
    setIsSpinning(true);
    setWinner(null);
    setSavedToVault(false);
    setRotation(targetRotation);

    if (soundEnabled && audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      let count = 0;
      const interval = setInterval(() => {
        count++;
        playClick(audioCtxRef.current);
        if (count >= 32) clearInterval(interval);
      }, 95 + count * 6);
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(winningOption);
      if (soundEnabled) playFanfare(audioCtxRef.current);
    }, 4500);
  };

  // Spin calculation (100% physically deterministic: pointer at 12 o'clock always matches winner)
  const handleSpinClick = () => {
    if (isSpinning || items.length === 0) return;

    const sliceAngle = 360 / items.length;
    // Extra full spins (5-7 full rotations)
    const extraFullRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    // Choose random winning index
    const winningIdx = Math.floor(Math.random() * items.length);
    const chosenOption = items[winningIdx];

    // To place winningIdx under top pointer (12 o'clock / 0 deg in our SVG orientation):
    // In our SVG layout, slice 0 center is at 0 degrees (top pointer).
    // So slice i center is at i * sliceAngle.
    // To rotate slice i to the top, we rotate by (360 - i * sliceAngle).
    const alignmentOffset = (360 - (winningIdx * sliceAngle)) % 360;
    // Add subtle jitter inside the wedge so it doesn't always land at dead center
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
    const nextRotation = rotation + extraFullRotations + alignmentOffset + jitter;

    // Broadcast to partner if paired
    if (pair?.id) {
      supabase.channel(`roulette:${pair.id}`).send({
        type: "broadcast",
        event: "spin-wheel",
        payload: { targetRotation: nextRotation, winner: chosenOption },
      });
    }

    executeSpin(nextRotation, chosenOption);
  };

  // Save to Memory Vault
  const handleSaveToVault = async () => {
    if (!winner || !pair?.id || savedToVault) return;
    try {
      await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user?.id,
        title: `🎡 The Wheel Spoke: ${winner.fullTitle}`,
        description: `Fate settled tonight's decision for ${activePreset.name}. No vetoes allowed! ♡`,
        moment_date: new Date().toISOString().split("T")[0],
      });
      setSavedToVault(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Wheel Geometry
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 14;
  const sliceAngle = 360 / items.length;

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#2D1F2D] flex flex-col transition-colors selection:bg-[#E8527D] selection:text-white">
      <Navigation />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-24 flex-1 flex flex-col items-center">
        
        {/* Header with Presence Pill */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#FFD9E3] text-[#E8527D] text-[10px] font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Pairfect Parlor · Let Fate Decide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[#2D1F2D] tracking-tight">
            Pairfect Roulette
          </h1>

          <p className="text-sm sm:text-base text-[#6E5564] leading-relaxed max-w-xl mx-auto">
            Can't decide what to eat, watch, or do? Spin the wheel together.{" "}
            <span className="font-semibold text-[#E8527D]">No arguing — the wheel has spoken. ♡</span>
          </p>

          {/* Connection presence indicator */}
          {pair && (
            <div className="inline-flex items-center gap-2 text-xs font-mono px-3.5 py-1 rounded-full bg-white/80 border border-[#FFD9E3] text-[#6E5564]">
              <Users className="w-3.5 h-3.5 text-[#E8527D]" />
              <span>
                {partnerOnline ? (
                  <strong className="text-emerald-700">● {partner?.display_name || "Partner"} is watching live</strong>
                ) : (
                  <span>Solo spin or spin for both</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Refined Segmented Preset Selector */}
        <div className="w-full max-w-3xl mb-8">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {PRESETS.map((preset) => {
              const isActive = activePreset.id === preset.id && !isCustomMode;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isSpinning}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#E8527D] text-white shadow-md shadow-pink-900/15 scale-105"
                      : "bg-white/85 hover:bg-white text-[#2D1F2D] border border-[#FFD9E3] hover:border-[#E8527D]/40"
                  }`}
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span>{preset.name}</span>
                  {preset.isPlusOnly && !isPlus && (
                    <span className="text-[9px] font-mono font-bold text-[#E8527D] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      🔒 PLUS
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The Main Stage (Wheel + Decree Card) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl">
          
          {/* LEFT: Physical Astrolabe Wheel Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-[32px] bg-[#FAF7F2] border border-[#EAD8CD] shadow-xl relative paper-grain">
            
            {/* Elegant Brass Pointer Needle at 12 o'clock */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none drop-shadow-md">
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
            </div>

            {/* SVG Interactive Wheel */}
            <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center mt-3">
              <div
                className="w-full h-full rounded-full shadow-2xl transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4500ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.12, 0.95, 0.28, 1.0)",
                }}
              >
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full select-none">
                  {/* Antique Outer Rim */}
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

                  {/* Wheel Wedges */}
                  {items.map((item, idx) => {
                    // In our coordinates, slice 0 starts at -sliceAngle/2 so its center is 0 deg (12 o'clock pointer)
                    const mid = idx * sliceAngle;
                    const startAngle = mid - sliceAngle / 2;
                    const endAngle = mid + sliceAngle / 2;

                    // Convert polar to cartesian (0 deg = 12 o'clock, so -90 in standard trig)
                    const radStart = ((startAngle - 90) * Math.PI) / 180;
                    const radEnd = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = cx + r * Math.cos(radStart);
                    const y1 = cy + r * Math.sin(radStart);
                    const x2 = cx + r * Math.cos(radEnd);
                    const y2 = cy + r * Math.sin(radEnd);

                    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
                    const theme = PALETTE[idx % PALETTE.length];

                    // Smart Spoke Typography: Text is NEVER upside down!
                    // If the angle falls on the lower half (90 to 270 degrees), we flip it 180 so it reads naturally
                    const normalizedMid = (mid % 360 + 360) % 360;
                    const isFlipped = normalizedMid > 90 && normalizedMid < 270;

                    return (
                      <g key={idx}>
                        {/* Wedge fill */}
                        <path
                          d={pathData}
                          fill={theme.fill}
                          stroke="#E0CDBC"
                          strokeWidth="1.5"
                        />

                        {/* Wedge spoke group rotated to slice mid angle */}
                        <g transform={`rotate(${mid}, ${cx}, ${cy})`}>
                          {/* Inner label + emoji positioned along the spoke */}
                          <g transform={`translate(${cx}, ${cy - r * 0.62})`}>
                            <g transform={isFlipped ? "rotate(180)" : "rotate(0)"}>
                              <text
                                x="0"
                                y="-10"
                                textAnchor="middle"
                                fontSize="16"
                                dominantBaseline="central"
                              >
                                {item.emoji}
                              </text>
                              <text
                                x="0"
                                y="10"
                                textAnchor="middle"
                                fill={theme.text}
                                fontSize="12"
                                fontWeight="700"
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

                  {/* Golden Center Brass Collar */}
                  <circle cx={cx} cy={cy} r="46" fill="#EBD5C2" stroke="#BFA28E" strokeWidth="2" />
                </svg>
              </div>

              {/* Central Wax Seal SPIN Button */}
              <button
                type="button"
                onClick={handleSpinClick}
                disabled={isSpinning}
                className="absolute z-20 w-22 h-22 rounded-full bg-gradient-to-br from-[#FF6B95] via-[#E8527D] to-[#B82B54] text-white shadow-2xl flex flex-col items-center justify-center border-4 border-[#FAF7F2] cursor-pointer hover:scale-105 active:scale-95 transition-all disabled:opacity-85 group"
                style={{
                  boxShadow: "0 8px 24px rgba(232, 82, 125, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
                }}
              >
                <span className="font-heading font-black text-xs tracking-widest uppercase text-white/95">
                  {isSpinning ? "SPINNING" : "SPIN"}
                </span>
                <Heart className="w-4 h-4 fill-white text-white mt-0.5 group-hover:scale-115 transition-transform" />
              </button>
            </div>

            {/* Bottom Bar: Option count + Sound Toggle */}
            <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-[#EAD8CD] text-xs text-[#6E5564]">
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {items.length} Options on Wheel
              </span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center gap-1.5 text-xs text-[#6E5564] hover:text-[#2D1F2D] transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E8527D]" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? "Audio clicks on" : "Muted"}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Fate's Decree Parchment Card */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Result / Prompt Card */}
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div
                  key="winner-decree"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-7 rounded-[32px] bg-white border border-[#FFD9E3] shadow-xl text-center space-y-4 paper-grain relative overflow-hidden"
                  style={{
                    boxShadow: "0 16px 40px rgba(232, 82, 125, 0.12)",
                  }}
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 text-[#E8527D] text-[10px] font-mono font-bold tracking-widest uppercase border border-rose-100">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Tonight's Decree</span>
                  </div>

                  <div className="space-y-1 py-1">
                    <span className="text-4xl block mb-2">{winner.emoji}</span>
                    <h3 className="text-2xl sm:text-3xl font-display italic font-bold text-[#2D1F2D] leading-snug">
                      {winner.fullTitle}
                    </h3>
                  </div>

                  <p className="font-handwriting text-lg text-[#E8527D] italic">
                    "No arguing. The wheel has spoken. ♡"
                  </p>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      onClick={handleSpinClick}
                      disabled={isSpinning}
                      className="btn-journal-ghost w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Spin Again</span>
                    </button>

                    {pair && (
                      <button
                        onClick={handleSaveToVault}
                        disabled={savedToVault}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          savedToVault
                            ? "bg-rose-100 text-[#E8527D] border border-[#FFD9E3]"
                            : "btn-journal shadow-xs"
                        }`}
                      >
                        {savedToVault ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#E8527D]" />
                            <span>Saved in Vault!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Lock in Vault ▷</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="p-7 rounded-[32px] bg-white/80 border border-[#FFD9E3] text-center space-y-3 paper-grain shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E8527D] flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-display italic text-2xl font-bold text-[#2D1F2D]">
                    Fate is Waiting...
                  </h3>
                  <p className="text-xs text-[#6E5564] leading-relaxed max-w-xs mx-auto">
                    Tap the center <strong className="text-[#E8527D]">SPIN</strong> button to settle tonight's adventure together.
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Curated Chalkboard / Option Manager */}
            <div className="p-6 rounded-[28px] bg-[#FAF7F2] border border-[#EAD8CD] space-y-4 paper-grain shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#2D1F2D]">Wheel Slices</h4>
                  <p className="text-[11px] text-[#6E5564]">{activePreset.tagline}</p>
                </div>
                {isCustomMode && (
                  <button
                    onClick={handleResetToPreset}
                    disabled={isSpinning}
                    className="text-[10px] font-mono text-[#E8527D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Add custom item input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom option (e.g. Thai Food)..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                  disabled={isSpinning}
                  className="flex-1 bg-white border border-[#EAD8CD] rounded-xl px-3.5 py-2 text-xs text-[#2D1F2D] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#E8527D]"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={isSpinning || !customInput.trim()}
                  className="btn-journal py-2 px-3 text-xs flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Chip list */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white text-xs border border-[#EAD8CD]/70 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{it.emoji}</span>
                      <span className="font-medium text-[#2D1F2D] truncate">{it.fullTitle}</span>
                    </div>
                    {items.length > 2 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
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

        {/* ─── PLUS PAYWALL MODAL ─── */}
        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle="Chaos Mode Wheel"
          featureDescription="Spicy couple challenges and playful dares for both partners."
        />

      </main>
    </div>
  );
}
