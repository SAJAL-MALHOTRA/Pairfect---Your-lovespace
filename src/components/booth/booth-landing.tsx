"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Users,
  Sparkles,
  Link2,
  ArrowRight,
  Loader2,
  Heart,
  LayoutGrid,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { PerspectiveMode } from "@/lib/booth/types";

interface BoothLandingProps {
  onStartSharedBooth: (config: {
    layoutStyle: string;
    perspective: PerspectiveMode;
    totalShots: number;
    customPrompt?: string;
  }) => Promise<void>;
  onJoinSharedBooth: (code: string) => Promise<void>;
  onStartSoloBooth: () => void;
  isStarting: boolean;
  isJoining: boolean;
  error: string | null;
  partnerName?: string;
}

const LAYOUT_OPTIONS = [
  { id: "strip_4", label: "Classic 4-Cut", shots: 4, desc: "Iconic vertical photo strip" },
  { id: "strip_3", label: "Classic 3-Cut", shots: 3, desc: "Traditional 3-frame strip" },
  { id: "polaroid_grid", label: "2×2 Polaroid Grid", shots: 4, desc: "Vintage scrapbook quad" },
  { id: "anniversary_card", label: "Hero & Snaps", shots: 3, desc: "1 hero photo + 2 snaps" },
  { id: "journal", label: "Journal Memory", shots: 2, desc: "2 wide shots + ruled notes" },
  { id: "film_roll", label: "35mm Film Reel", shots: 3, desc: "Dark borders & sprocket holes" },
];

export default function BoothLanding({
  onStartSharedBooth,
  onJoinSharedBooth,
  onStartSoloBooth,
  isStarting,
  isJoining,
  error,
  partnerName,
}: BoothLandingProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [joinCode, setJoinCode] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("strip_4");
  const [perspective, setPerspective] = useState<PerspectiveMode>("SIDE_BY_SIDE");
  const [customPrompt, setCustomPrompt] = useState("");

  const currentLayoutObj = LAYOUT_OPTIONS.find((l) => l.id === selectedLayout) || LAYOUT_OPTIONS[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStartSharedBooth({
      layoutStyle: selectedLayout,
      perspective,
      totalShots: currentLayoutObj.shots,
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    await onJoinSharedBooth(joinCode.trim());
  };

  const handleDirectStart = async () => {
    await onStartSharedBooth({
      layoutStyle: selectedLayout,
      perspective,
      totalShots: currentLayoutObj.shots,
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-[var(--burgundy)] text-xs font-mono font-bold uppercase tracking-wider mb-4"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--burgundy)]" />
          <span>Synchronized Virtual Photobooth</span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-[var(--text)] tracking-tight">
          Two cameras. One instant.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--text-soft)] max-w-xl mx-auto font-sans leading-relaxed">
          {partnerName ? (
            <>
              Connect with <span className="text-[var(--burgundy)] font-bold">{partnerName}</span> across any distance.
              Photos capture at the exact same millisecond and weave into a shared keepsake.
            </>
          ) : (
            "Step into the booth together across any distance. Live video feeds and millisecond-accurate sync capture your authentic moments together."
          )}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium text-center max-w-md mx-auto">
          {error}
        </div>
      )}

      {/* Main Choice Cards */}
      {mode === "choose" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Card 1: Start Shared Booth */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] hover:border-[var(--burgundy)]/50 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--rose)]/20 border border-[var(--rose)]/30 flex items-center justify-center text-[var(--burgundy)] mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[var(--text)]">
                Start a Shared Booth
              </h3>
              <p className="text-xs text-[var(--text-soft)] font-sans mt-2 leading-relaxed">
                Generate a 4-letter booth code. Send it to your partner so both of your cameras link up live.
              </p>
            </div>

            <button
              onClick={handleDirectStart}
              disabled={isStarting}
              aria-label="Start a Shared Booth"
              className="mt-6 w-full btn-primary py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Booth...</span>
                </>
              ) : (
                <>
                  <span>Start a Shared Booth</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>

          {/* Card 2: Join with Code */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] hover:border-[var(--burgundy)]/50 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] mb-4">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[var(--text)]">
                Join Partner&apos;s Booth
              </h3>
              <p className="text-xs text-[var(--text-soft)] font-sans mt-2 leading-relaxed">
                Did your partner already start a booth? Enter their 4-letter code to step into their camera room.
              </p>
            </div>

            <button
              onClick={() => setMode("join")}
              aria-label="Join Partner's Booth"
              className="mt-6 w-full btn-secondary py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join Partner&apos;s Booth</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Mode: Create Booth */}
      {mode === "create" && (
        <form onSubmit={handleCreate} className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2 className="font-heading font-bold text-lg text-[var(--text)] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[var(--burgundy)]" />
              Configure Virtual Booth
            </h2>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
            >
              ← Back
            </button>
          </div>

          {/* Layout Selector */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[var(--text-soft)] mb-2">
              1. Choose Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedLayout === layout.id
                      ? "border-[var(--burgundy)] bg-[var(--rose)]/10 text-[var(--burgundy)] shadow-xs"
                      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--burgundy)]/40"
                  }`}
                >
                  <div className="font-heading font-bold text-xs">{layout.label}</div>
                  <div className="text-[10px] font-mono text-[var(--text-soft)] mt-0.5">
                    {layout.shots} frames
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Perspective Selector */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[var(--text-soft)] mb-2">
              2. Camera Composition
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPerspective("SIDE_BY_SIDE")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  perspective === "SIDE_BY_SIDE"
                    ? "border-[var(--burgundy)] bg-[var(--rose)]/10 text-[var(--burgundy)]"
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--burgundy)]/40"
                }`}
              >
                <div className="font-heading font-bold text-xs">Side-by-Side Dual Tiles</div>
                <p className="text-[10px] text-[var(--text-soft)] mt-1">
                  You on left, partner on right in each frame.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPerspective("TOGETHER")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  perspective === "TOGETHER"
                    ? "border-[var(--burgundy)] bg-[var(--rose)]/10 text-[var(--burgundy)]"
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--burgundy)]/40"
                }`}
              >
                <div className="font-heading font-bold text-xs">Alternating Solo Snaps</div>
                <p className="text-[10px] text-[var(--text-soft)] mt-1">
                  Both capture each shot, choosing best hero shots.
                </p>
              </button>
            </div>
          </div>

          {/* Optional Initial Custom Prompt */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[var(--text-soft)] mb-1">
              3. Pose Prompt (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Look at each other and try not to laugh"
              className="w-full px-4 py-2.5 text-xs font-sans rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
            />
            <p className="text-[10px] text-[var(--text-soft)] mt-1">
              Leave blank to automatically pick from playful couple prompts for each shot.
            </p>
          </div>

          <button
            type="submit"
            disabled={isStarting}
            className="w-full btn-primary py-3.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Booth...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Get Booth Code →</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Mode: Join Booth */}
      {mode === "join" && (
        <form onSubmit={handleJoin} className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2 className="font-heading font-bold text-lg text-[var(--text)] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[var(--burgundy)]" />
              Join Booth
            </h2>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
            >
              ← Back
            </button>
          </div>

          <div>
            <label htmlFor="booth-code-input" className="block text-xs font-mono uppercase font-bold text-[var(--text-soft)] mb-2 text-center">
              Booth Code
            </label>
            <input
              id="booth-code-input"
              aria-label="Booth Code"
              type="text"
              maxLength={4}
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="P7K4"
              className="block w-full text-center uppercase tracking-widest font-mono text-3xl py-4 border-2 border-[var(--border)] rounded-2xl bg-[var(--paper-warm)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 text-[var(--text)] font-bold shadow-inner"
            />
            <p className="text-[11px] text-[var(--text-soft)] mt-2 text-center">
              Ask your partner for the 4-letter code shown on their screen.
            </p>
          </div>

          <button
            type="submit"
            aria-label="Join"
            disabled={isJoining || joinCode.trim().length < 4}
            className="w-full btn-primary py-3.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Booth...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Join</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Solo Booth Fallback Link */}
      <div className="mt-12 text-center border-t border-[var(--border)] pt-8">
        <p className="text-xs text-[var(--text-soft)] mb-2 font-sans">
          Taking photos on your own device without a remote partner?
        </p>
        <button
          onClick={onStartSoloBooth}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--burgundy)] hover:underline cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Launch Classic Solo Photobooth →</span>
        </button>
      </div>
    </div>
  );
}
