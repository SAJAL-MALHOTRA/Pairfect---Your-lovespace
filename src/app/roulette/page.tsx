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
  Compass,
  Volume2,
  VolumeX,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Preset Wheels ─────────────────────────────────────────────────────────────
interface WheelPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: string[];
}

const PRESETS: WheelPreset[] = [
  {
    id: "food",
    name: "What to Eat",
    icon: "🍕",
    description: "End the 45-minute 'I don't know, what do you want?' debate.",
    items: [
      "🍜 Get ramen together",
      "🌮 Street tacos & salsa",
      "🍣 Fresh sushi date",
      "🍝 Handmade pasta night",
      "🍕 Build-a-pizza from scratch",
      "🥞 Breakfast for dinner",
      "🍲 Cozy hotpot evening",
      "🍔 Smash burger run",
    ],
  },
  {
    id: "date",
    name: "Date Night",
    icon: "💕",
    description: "Spontaneous connection ideas when routine gets boring.",
    items: [
      "🧺 Living room candlelit picnic",
      "✨ Stargazing midnight drive",
      "👩‍🍳 Bake a new dessert together",
      "📚 Bookstore & warm coffee date",
      "🎲 Fierce board game showdown",
      "🕯️ 15-minute foot & shoulder rub",
      "🎨 Paint portraits of each other",
      "🌃 Late night ice cream walk",
    ],
  },
  {
    id: "movie",
    name: "What to Watch",
    icon: "🎬",
    description: "Stop scrolling streaming apps for 2 hours.",
    items: [
      "🍃 Cozy Studio Ghibli film",
      "🍿 Comfort 2000s rom-com",
      "😱 Mind-bending psychological thriller",
      "🏰 Nostalgic childhood Disney",
      "🔍 Binge a true crime doc",
      "🛋️ 4 episodes of our comfort sitcom",
      "🪐 Epic sci-fi adventure",
      "🎬 Oscar-winning indie movie",
    ],
  },
  {
    id: "chores",
    name: "Who Does It?",
    icon: "🧹",
    description: "Fair, democratic, zero-resentment domestic settling.",
    items: [
      "🫧 Wash & dry tonight's dishes",
      "☕ Make tomorrow's morning coffee",
      "🎬 Pick tonight's movie with zero vetoes",
      "💆 Give partner a 10-min massage",
      "🗑️ Take out all the trash bins",
      "💖 Shower partner with 10 compliments",
      "🍳 Cook breakfast in bed",
      "🎵 DJ tonight's road trip / home playlist",
    ],
  },
  {
    id: "chaos",
    name: "Chaos Mode",
    icon: "😈",
    description: "Playful, spicy challenges for the bold.",
    items: [
      "📱 60-second phone swap (no panic!)",
      "📸 Recreate our very first photo",
      "🤫 Whisper a secret you haven't shared",
      "💃 2-minute silly dance battle in pajamas",
      "🙈 Blindfolded mystery taste test",
      "🎭 Dramatic impression of how partner acts",
      "💌 Write a 30-second romantic haiku",
      "💋 30-second silent eye-contact challenge",
    ],
  },
  {
    id: "talk",
    name: "Deep Talk",
    icon: "💬",
    description: "Prompts to rekindle intimacy and storytelling.",
    items: [
      "Tell a childhood memory I haven't heard",
      "What made you feel truly loved this week?",
      "What is one dream you have for us next year?",
      "How can I love you a little better right now?",
      "Describe our love story in three words",
      "What was your first real impression of me?",
      "What is something you admire about how I grow?",
      "What does 'home' feel like to you today?",
    ],
  },
];

// Color palette for wheel wedges (warm blush & romantic tones)
const WEDGE_COLORS = [
  "#FF9EB5", // rose blush
  "#FFC4A3", // warm peach
  "#FFD9E3", // soft pink
  "#D8B4F8", // lilac dream
  "#A7F3D0", // mint sage
  "#BAE6FD", // sky blue
  "#FDE68A", // warm butter
  "#FBCFE8", // cotton candy
  "#FECDD3", // blossom
  "#DDD6FE", // lavender
];

// ── Web Audio Synthesizer (Zero asset dependencies) ───────────────────────────
function playTickSound(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
  } catch {
    // audio context may be locked
  }
}

function playWinSound(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.08);
      osc.stop(audioCtx.currentTime + idx * 0.08 + 0.35);
    });
  } catch {}
}

export default function RoulettePage() {
  const { user, pair, partner } = useAuth();
  const supabase = createClient();

  const [activePreset, setActivePreset] = useState<WheelPreset>(PRESETS[0]);
  const [items, setItems] = useState<string[]>(PRESETS[0].items);
  const [customItemInput, setCustomItemInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Wheel physics state
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Partner synchronization indicator
  const [partnerOnline, setPartnerOnline] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickAngleRef = useRef<number>(0);

  // Init audio context on first user interaction
  useEffect(() => {
    const handleInitAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
    };
    window.addEventListener("pointerdown", handleInitAudio, { once: true });
    return () => window.removeEventListener("pointerdown", handleInitAudio);
  }, []);

  // Supabase Realtime synchronization channel for paired couples
  useEffect(() => {
    if (!pair?.id) return;

    const channel = supabase.channel(`roulette:${pair.id}`, {
      config: { presence: { key: user?.id || "anon" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const usersPresent = Object.keys(state);
        setPartnerOnline(usersPresent.length >= 2);
      })
      .on("broadcast", { event: "spin-wheel" }, (payload: any) => {
        if (payload?.payload?.targetRotation !== undefined) {
          triggerSpinAnimation(payload.payload.targetRotation, payload.payload.winner);
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

  // Handle Preset Selection
  const handleSelectPreset = (preset: WheelPreset) => {
    if (isSpinning) return;
    setActivePreset(preset);
    setItems(preset.items);
    setIsCustomMode(false);
    setWinner(null);
    setSavedToVault(false);
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    if (!customItemInput.trim() || isSpinning) return;
    const updated = [...items, customItemInput.trim()];
    setItems(updated);
    setCustomItemInput("");
    setIsCustomMode(true);
    setWinner(null);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 2 || isSpinning) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setIsCustomMode(true);
    setWinner(null);
  };

  // Trigger spin animation
  const triggerSpinAnimation = (targetRotation: number, finalWinner: string) => {
    setIsSpinning(true);
    setWinner(null);
    setSavedToVault(false);
    setRotation(targetRotation);

    // Audio ticks during spin
    if (soundEnabled && audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      let ticks = 0;
      const maxTicks = 35;
      const interval = setInterval(() => {
        ticks++;
        playTickSound(audioCtxRef.current);
        if (ticks >= maxTicks) {
          clearInterval(interval);
        }
      }, 90 + ticks * 4);
    }

    // Spin duration matches CSS transition (4500ms)
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(finalWinner);
      if (soundEnabled) {
        playWinSound(audioCtxRef.current);
      }
    }, 4500);
  };

  // User presses Spin button
  const handleSpin = () => {
    if (isSpinning || items.length === 0) return;

    const wedgeAngle = 360 / items.length;
    // Pick random winning index
    const winningIndex = Math.floor(Math.random() * items.length);
    const chosenWinner = items[winningIndex];

    // Calculate rotation: 5 full spins (1800deg) + offset to align winning wedge under top pointer (270deg or 0deg)
    // Pointer is at the top (angle 0).
    const randomExtraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 spins
    const targetSliceCenter = winningIndex * wedgeAngle + wedgeAngle / 2;
    // To land under top pointer (0 degrees), the wheel must rotate so that targetSliceCenter is at top
    const nextRotation = rotation + randomExtraSpins * 360 + (360 - (targetSliceCenter % 360));

    // Broadcast to partner if paired
    if (pair?.id) {
      supabase.channel(`roulette:${pair.id}`).send({
        type: "broadcast",
        event: "spin-wheel",
        payload: { targetRotation: nextRotation, winner: chosenWinner },
      });
    }

    triggerSpinAnimation(nextRotation, chosenWinner);
  };

  // Lock in & Save to Moments Vault
  const handleSaveToVault = async () => {
    if (!winner || !pair?.id || savedToVault) return;
    try {
      await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user?.id,
        title: `🎡 Fate Decided: ${winner}`,
        description: `The wheel has spoken for ${activePreset.name}. No arguing allowed! ♡`,
        moment_date: new Date().toISOString().split("T")[0],
      });
      setSavedToVault(true);
    } catch (err) {
      console.error("Failed to save to vault:", err);
    }
  };

  // SVG Wheel geometry calculations
  const wheelSize = 340;
  const radius = wheelSize / 2;
  const wedgeAngle = 360 / items.length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">
      <Navigation />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-24 flex-1 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-[var(--burgundy)] text-[10px] font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Can't Decide? Let Fate Choose</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black text-[var(--text)] tracking-tight">
            Pairfect Roulette
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed">
            Pick a wheel, tap spin, and let fate decide. <span className="font-semibold text-[var(--burgundy)]">No arguing — the wheel has spoken. ♡</span>
          </p>

          {/* Partner sync pill */}
          {pair && (
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-soft)] bg-white/70 px-3 py-1 rounded-full border border-[var(--border)]">
              <Users className="w-3.5 h-3.5 text-[var(--burgundy)]" />
              <span>
                {partnerOnline ? (
                  <strong className="text-emerald-600">● {partner?.display_name || "Partner"} is watching live</strong>
                ) : (
                  <span>Solo spin or spin for both</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Preset Wheels Selector */}
        <div className="w-full max-w-3xl mb-8">
          <p className="text-[10px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-widest text-center mb-3">
            Choose a Decision Wheel:
          </p>
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
            {PRESETS.map((preset) => {
              const isActive = activePreset.id === preset.id && !isCustomMode;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isSpinning}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[var(--burgundy)] text-white shadow-md shadow-rose-900/15 scale-105"
                      : "bg-white/80 hover:bg-white text-[var(--text)] border border-[var(--border)]"
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wheel & Stage Area */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl">
          
          {/* Wheel Canvas Card (Left / Center) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl relative paper-grain">
            
            {/* Top pointer marker (needle) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="w-6 h-7 bg-[var(--burgundy)] text-white rounded-b-md shadow-md flex items-center justify-center -mb-1 transform rotate-180">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white" />
              </div>
            </div>

            {/* SVG Interactive Wheel */}
            <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center mt-2">
              <div
                className="w-full h-full rounded-full shadow-2xl transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4500ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.15, 0.95, 0.35, 1.0)",
                }}
              >
                <svg
                  viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                  className="w-full h-full transform select-none"
                >
                  <circle
                    cx={radius}
                    cy={radius}
                    r={radius - 4}
                    fill="white"
                    stroke="#FFD9E3"
                    strokeWidth="8"
                  />
                  {items.map((item, idx) => {
                    const startAngle = idx * wedgeAngle;
                    const endAngle = startAngle + wedgeAngle;
                    const color = WEDGE_COLORS[idx % WEDGE_COLORS.length];

                    // Convert polar to cartesian coordinates
                    const radStart = ((startAngle - 90) * Math.PI) / 180;
                    const radEnd = ((endAngle - 90) * Math.PI) / 180;
                    const x1 = radius + (radius - 8) * Math.cos(radStart);
                    const y1 = radius + (radius - 8) * Math.sin(radStart);
                    const x2 = radius + (radius - 8) * Math.cos(radEnd);
                    const y2 = radius + (radius - 8) * Math.sin(radEnd);

                    const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius - 8} ${radius - 8} 0 0 1 ${x2} ${y2} Z`;

                    // Text rotation & position
                    const midAngle = startAngle + wedgeAngle / 2;
                    const labelRadius = radius * 0.65;
                    const textAngleRad = ((midAngle - 90) * Math.PI) / 180;
                    const tx = radius + labelRadius * Math.cos(textAngleRad);
                    const ty = radius + labelRadius * Math.sin(textAngleRad);

                    const shortText = item.length > 20 ? item.slice(0, 18) + "…" : item;

                    return (
                      <g key={idx}>
                        <path d={pathData} fill={color} stroke="white" strokeWidth="2" />
                        <text
                          x={tx}
                          y={ty}
                          fill="#3D2432"
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                        >
                          {shortText}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Golden Spin Button Hub */}
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="absolute z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B95] to-[var(--burgundy)] text-white shadow-xl flex flex-col items-center justify-center border-4 border-white cursor-pointer hover:scale-105 active:scale-95 transition-all disabled:opacity-80"
              >
                <span className="font-heading font-black text-xs tracking-wider uppercase">
                  {isSpinning ? "..." : "SPIN"}
                </span>
                <Heart className="w-3.5 h-3.5 fill-current mt-0.5 animate-pulse" />
              </button>
            </div>

            {/* Sound toggle button */}
            <div className="w-full flex items-center justify-between mt-6 text-xs text-[var(--text-soft)]">
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {items.length} Options on Wheel
              </span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? "Sound on" : "Muted"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Result or Item Manager */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* The Result Card */}
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div
                  key="winner-card"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-6 rounded-3xl bg-white border-2 border-[var(--burgundy)] shadow-xl text-center space-y-4 paper-grain relative overflow-hidden"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[var(--burgundy)] text-[10px] font-mono font-bold tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Tonight's Decision</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-display italic font-black text-[var(--text)] leading-snug">
                    {winner}
                  </h3>

                  <p className="font-handwriting text-lg text-[var(--burgundy)] italic">
                    "No arguing. The wheel has spoken. 😭 ♡"
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={handleSpin}
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
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          savedToVault
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "btn-journal shadow-xs"
                        }`}
                      >
                        {savedToVault ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Locked in Vault!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save to Vault ▷</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 rounded-3xl bg-white/70 border border-[var(--border)] text-center space-y-2">
                  <p className="font-display italic text-lg text-[var(--text)]">Ready to spin?</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    Tap the center <strong className="text-[var(--burgundy)]">SPIN</strong> button to let fate choose tonight's adventure.
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Item Editor & Customization Box */}
            <div className="p-6 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-4 paper-grain">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--text)]">Wheel Options</h4>
                  <p className="text-[11px] text-[var(--text-soft)]">{activePreset.description}</p>
                </div>
              </div>

              {/* Add custom option input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom option (e.g. Tacos)..."
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomItem()}
                  disabled={isSpinning}
                  className="flex-1 bg-white border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
                />
                <button
                  onClick={handleAddCustomItem}
                  disabled={isSpinning || !customItemInput.trim()}
                  className="btn-journal py-2 px-3 text-xs flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Chip list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white text-xs border border-[var(--border)]"
                  >
                    <span className="truncate text-stone-800">{it}</span>
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

      </main>
    </div>
  );
}
