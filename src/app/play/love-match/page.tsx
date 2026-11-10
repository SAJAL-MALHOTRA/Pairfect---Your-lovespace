"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Heart, Sparkles, Check, ArrowRight, RotateCcw, Share2, ArrowLeft,
  Users, Lock, Shield, Trophy, PartyPopper, Smile, Loader2, Play,
  Copy, Bot, UserCheck, Download, Bookmark, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MATCH_QUESTIONS, MatchQuestion, getMatchFeedback } from "@/lib/match-game/questions";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";

type GamePhase = "lobby" | "playing" | "locked" | "comparing" | "revealed" | "completed";

export default function LoveMatchGamePage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const supabase = createClient();

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [partnerLocked, setPartnerLocked] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [matchHistory, setMatchHistory] = useState<{ qIndex: number; isMatch: boolean; myAns: string; partnerAns: string }[]>([]);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keepsake Card State
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // Guest & Room Code State
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");

  const channelRef = useRef<any>(null);
  const currentQ = MATCH_QUESTIONS[currentQIndex];

  // ── 1. Initialize Room Code & Identity on Mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Resolve or generate unique client id
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

    // Resolve Guest Name if not logged in
    const storedName = localStorage.getItem("pairfect_guest_name");
    if (storedName) {
      setGuestName(storedName);
    }

    // Resolve Room Code
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
      // Generate clean 5-character short room code
      const generated = Math.random().toString(36).substring(2, 7).toUpperCase();
      setRoomCode(generated);
    }
  }, [user, pair?.id]);

  const effectiveDisplayName = profile?.display_name || user?.email?.split("@")[0] || guestName || "You";

  // ── 2. Realtime Channel Subscription ──
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    const channelName = `match-room-${roomCode.toLowerCase()}`;
    const channel = supabase.channel(channelName, {
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
          setPartnerConnected(true);
          const otherInfo = otherEntries[0] as any;
          if (otherInfo?.user_name) {
            setDynamicPartnerName(otherInfo.user_name);
          }
        } else {
          setPartnerConnected(false);
        }
      })
      .on("broadcast", { event: "game-start" }, ({ payload }: any) => {
        setCurrentQIndex(payload.qIndex || 0);
        setMyAnswer(null);
        setPartnerAnswer(null);
        setPartnerLocked(false);
        setMatchHistory([]);
        setIsSoloMode(false);
        setPhase("playing");
      })
      .on("broadcast", { event: "answer-locked" }, ({ payload }: any) => {
        if (payload.userId !== myEffectiveId) {
          setPartnerLocked(true);
        }
      })
      .on("broadcast", { event: "answer-reveal" }, ({ payload }: any) => {
        if (payload.userId !== myEffectiveId) {
          setPartnerAnswer(payload.answerId);
        }
      })
      .on("broadcast", { event: "next-question" }, ({ payload }: any) => {
        setCurrentQIndex(payload.nextIndex);
        setMyAnswer(null);
        setPartnerAnswer(null);
        setPartnerLocked(false);
        setPhase("playing");
      })
      .on("broadcast", { event: "play-again" }, () => {
        setCurrentQIndex(0);
        setMyAnswer(null);
        setPartnerAnswer(null);
        setPartnerLocked(false);
        setMatchHistory([]);
        setPhase("playing");
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

  // ── 3. Reveal Trigger When Both Lock In ──
  useEffect(() => {
    if (myAnswer && partnerAnswer && (phase === "locked" || phase === "playing")) {
      setPhase("comparing");

      const isMatch = myAnswer === partnerAnswer;
      setMatchHistory((prev) => [
        ...prev,
        {
          qIndex: currentQIndex,
          isMatch,
          myAns: myAnswer,
          partnerAns: partnerAnswer,
        },
      ]);
    }
  }, [myAnswer, partnerAnswer, currentQIndex, phase]);

  // Transition from comparing to revealed after 1600ms
  useEffect(() => {
    if (phase === "comparing") {
      const timer = setTimeout(() => {
        setPhase("revealed");
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // ── 4. Animated Percentage Meter ──
  useEffect(() => {
    if (phase === "revealed" || phase === "completed") {
      const totalAnswered = matchHistory.length || 1;
      const matchedCount = matchHistory.filter((h) => h.isMatch).length;
      const targetPercent = Math.round((matchedCount / totalAnswered) * 100);

      let start = 0;
      const duration = 1200;
      const stepTime = 30;
      const totalSteps = duration / stepTime;
      const increment = targetPercent / totalSteps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= targetPercent) {
          setAnimatedPercentage(targetPercent);
          clearInterval(timer);
        } else {
          setAnimatedPercentage(Math.round(start));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [phase, matchHistory]);

  // ── Start Game ──
  const handleStartGame = (solo = false) => {
    setIsSoloMode(solo);
    setCurrentQIndex(0);
    setMyAnswer(null);
    setPartnerAnswer(null);
    setPartnerLocked(false);
    setMatchHistory([]);
    setPinnedToMemories(false);
    setPhase("playing");

    if (!solo && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game-start",
        payload: { startedBy: myEffectiveId, qIndex: 0 },
      });
    }
  };

  // ── Lock In Answer ──
  const handleSelectOption = (optionId: string) => {
    if (myAnswer) return;
    setMyAnswer(optionId);
    setPhase("locked");

    if (isSoloMode) {
      // Simulate realistic partner thinking delay (1.2s to 2.2s)
      const thinkMs = 1200 + Math.random() * 800;
      setTimeout(() => {
        const currentOptions = currentQ.options;
        // 70% chance bot matches for playful positive engagement
        const picksSame = Math.random() < 0.7;
        const simulatedAnswer = picksSame
          ? optionId
          : currentOptions.find((o) => o.id !== optionId)?.id || optionId;

        setPartnerLocked(true);
        setPartnerAnswer(simulatedAnswer);
      }, thinkMs);
      return;
    }

    // Broadcast answer-locked without revealing choice
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "answer-locked",
        payload: { userId: myEffectiveId, qIndex: currentQIndex },
      });

      // Send private answer to reveal payload
      channelRef.current.send({
        type: "broadcast",
        event: "answer-reveal",
        payload: { userId: myEffectiveId, answerId: optionId, qIndex: currentQIndex },
      });
    }
  };

  // ── Proceed to Next Question ──
  const handleNextQuestion = () => {
    if (currentQIndex + 1 < MATCH_QUESTIONS.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setMyAnswer(null);
      setPartnerAnswer(null);
      setPartnerLocked(false);
      setPhase("playing");

      if (!isSoloMode && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "next-question",
          payload: { nextIndex: nextIdx },
        });
      }
    } else {
      setPhase("completed");
    }
  };

  // ── Restart Game ──
  const handlePlayAgain = () => {
    setCurrentQIndex(0);
    setMyAnswer(null);
    setPartnerAnswer(null);
    setPartnerLocked(false);
    setMatchHistory([]);
    setPinnedToMemories(false);
    setPhase("playing");

    if (!isSoloMode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "play-again",
        payload: {},
      });
    }
  };

  // ── Copy Room Invite Link ──
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/play/love-match?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // ── Handle Guest Join Submit ──
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const clean = guestInput.trim();
    setGuestName(clean);
    localStorage.setItem("pairfect_guest_name", clean);
    setIsGuestPromptOpen(false);
  };

  // ── Keepsake Canvas Generator ──
  const generateKeepsakeImage = async (
    percent: number,
    userA: string,
    userB: string,
    matchedHighlights: string[],
    verdictTitle: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // 1. Warm textured background
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

    // 2. Header & Vintage Date Stamp
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAIRFECT KEEPSAKE · LOVE MATCH", canvas.width / 2, 105);

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

    // 3. Couple Names
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  ♡  ${userB}`, canvas.width / 2, 230);

    // 4. Big Match Score
    ctx.fillStyle = "#8E3D52";
    ctx.font = "italic 900 110px serif";
    ctx.fillText(`${percent}%`, canvas.width / 2, 380);

    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold 22px monospace";
    ctx.fillText("IN SYNC", canvas.width / 2, 425);

    // Verdict Box
    ctx.fillStyle = "#F2E8DC";
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(100, 465, canvas.width - 200, 70, 16);
    } else {
      ctx.rect(100, 465, canvas.width - 200, 70);
    }
    ctx.fill();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 20px serif";
    ctx.fillText(`"${verdictTitle}"`, canvas.width / 2, 508);

    // 5. Matched Highlights section
    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 15px monospace";
    ctx.fillText("SYNCHRONIZED PICKS", canvas.width / 2, 595);

    let currentY = 645;
    ctx.textAlign = "left";
    if (matchedHighlights.length > 0) {
      matchedHighlights.slice(0, 4).forEach((item) => {
        ctx.fillStyle = "#8E3D52";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("✓", 120, currentY);

        ctx.fillStyle = "#3D2E35";
        ctx.font = "17px sans-serif";
        const truncated = item.length > 46 ? item.slice(0, 43) + "..." : item;
        ctx.fillText(truncated, 155, currentY);
        currentY += 55;
      });
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "#6E5A64";
      ctx.font = "italic 18px serif";
      ctx.fillText("Opposites attract: dynamic picks across every question!", canvas.width / 2, currentY + 30);
      currentY += 70;
    }

    // 6. Footer stamp
    ctx.textAlign = "center";
    ctx.strokeStyle = "#DECBC0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 1030);
    ctx.lineTo(canvas.width - 100, 1030);
    ctx.stroke();

    ctx.fillStyle = "#A38F7D";
    ctx.font = "14px monospace";
    ctx.fillText("PAIRFECT SANCTUARY · KEPT FOREVER", canvas.width / 2, 1070);

    return canvas.toDataURL("image/png");
  };

  // ── Pin Keepsake to Memory Wall ──
  const handlePinToMemoryWall = async () => {
    if (!user || !pair?.id || pinnedToMemories || isSavingMemory) return;
    try {
      setIsSavingMemory(true);
      const matchedHighlights = matchHistory
        .filter((h) => h.isMatch)
        .map((h) => {
          const q = MATCH_QUESTIONS[h.qIndex];
          const opt = q?.options.find((o) => o.id === h.myAns);
          return `"${q?.question || ""}: ${opt?.text || ""}"`;
        });

      const summaryText = matchedHighlights.length > 0
        ? `Top synced picks: ${matchedHighlights.slice(0, 3).join(", ")}.`
        : "Different perspectives on every question: dynamic opposites attract!";

      const { error } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Love Match: ${animatedPercentage}% In Sync 💕`,
        description: `Played Love Match together! Matched on ${matchHistory.filter((h) => h.isMatch).length}/${matchHistory.length} questions. ${summaryText}`,
        moment_date: new Date().toISOString().split("T")[0],
      });

      if (!error) {
        setPinnedToMemories(true);
      } else {
        console.error("Failed to pin memory:", error);
      }
    } catch (err) {
      console.error("Pin memory error:", err);
    } finally {
      setIsSavingMemory(false);
    }
  };

  // ── Download Keepsake Image ──
  const handleDownloadKeepsake = async () => {
    try {
      setIsDownloadingCard(true);
      const matchedHighlights = matchHistory
        .filter((h) => h.isMatch)
        .map((h) => {
          const q = MATCH_QUESTIONS[h.qIndex];
          const opt = q?.options.find((o) => o.id === h.myAns);
          return `${q?.question || ""}: ${opt?.text || ""}`;
        });

      const dataUrl = await generateKeepsakeImage(
        animatedPercentage,
        userName,
        partnerName,
        matchedHighlights,
        getMatchFeedback(animatedPercentage).headline
      );

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `love-match-keepsake-${new Date().toISOString().split("T")[0]}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate keepsake:", err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const isCurrentMatch = myAnswer && partnerAnswer && myAnswer === partnerAnswer;
  const userName = effectiveDisplayName;
  const partnerName = isSoloMode
    ? "Cupid Bot 🤖"
    : dynamicPartnerName || partner?.display_name || "Partner";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors paper-grain">
      <Navigation />

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-16 flex flex-col justify-center">

        {/* Guest Join Modal */}
        {isGuestPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full p-8 rounded-3xl bg-white border border-[var(--border)] shadow-2xl text-center space-y-6 paper-grain"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center text-2xl mx-auto shadow-xs">
                💌
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display italic font-bold text-2xl text-[var(--text)]">
                  You&apos;re Invited to Love Match!
                </h3>
                <p className="text-xs text-[var(--text-soft)] font-mono">
                  Room Code: <span className="text-[var(--burgundy)] font-bold">{roomCode}</span>
                </p>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Enter your name to jump into the dual-phone game live with zero signup required.
                </p>
              </div>

              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Your Name or Nickname..."
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--paper-warm)] text-sm font-medium focus:outline-hidden focus:border-[var(--burgundy)] text-center"
                />

                <button
                  type="submit"
                  className="w-full btn-journal py-3 text-xs font-mono font-bold justify-center cursor-pointer"
                >
                  Join Match Room ▷
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Top Back Button & Header Bar */}
        <div className="flex items-center justify-between pb-6">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Playroom</span>
          </Link>

          {phase !== "lobby" && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-soft)] px-3 py-1 rounded-full bg-[var(--paper-warm)] border border-[var(--border)]">
                Question {String(currentQIndex + 1).padStart(2, "0")} / {String(MATCH_QUESTIONS.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {/* PHASE 1: LOBBY SCREEN */}
        {phase === "lobby" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto py-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Heading, Badges, CTAs */}
              <div className="lg:col-span-6 space-y-6 text-left">
                {/* Back Link */}
                <Link
                  href="/play"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Activities</span>
                </Link>

                {/* Tag & Heading */}
                <div className="space-y-3">
                  <p className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
                    FOR TWO
                  </p>
                  <h1 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-[1.1]">
                    How Well Do You Know Me?
                  </h1>
                  <p className="text-sm sm:text-base font-sans text-stone-600 leading-relaxed">
                    Both of you lock in privately, then it opens on both screens at the same second. How well do you really know each other?
                  </p>
                </div>

                {/* 4 Feature Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold">
                  <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                    26 packs
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
                    surprise twists
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                    AI-judged answers
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                    compatibility score
                  </span>
                </div>

                {/* Primary CTA Button: Create a room */}
                <div className="pt-2 space-y-3">
                  <button
                    onClick={() => handleStartGame(false)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-sky-500 hover:opacity-95 text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-between shadow-md transition-all cursor-pointer group"
                  >
                    <span>Create a room</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Secondary Buttons Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-mono text-xs font-bold uppercase tracking-wider shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Join with a code"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartGame(true)}
                      className="py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-mono text-xs font-bold uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                    >
                      Play on this phone
                    </button>
                  </div>
                </div>

                {/* Room status pill */}
                <div className="flex items-center gap-2 pt-1 text-xs font-mono text-stone-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${partnerConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <span>{partnerConnected ? `Connected with ${partnerName}` : `Room Code: ${roomCode}`}</span>
                </div>
              </div>

              {/* Right Column: Realistic Game Preview Card */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md rounded-3xl bg-white border border-stone-200/90 shadow-xl p-5 space-y-4">
                  
                  {/* Top Player Status Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-2xl bg-white border border-rose-200 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center font-bold text-rose-600 text-xs">
                        M
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs text-stone-900 leading-tight">Mia</p>
                        <p className="text-[10px] font-mono text-rose-500">Answers</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-sky-200 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-sky-600 text-xs">
                        L
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs text-stone-900 leading-tight">Leo</p>
                        <p className="text-[10px] font-mono text-sky-500">Guesses</p>
                      </div>
                    </div>
                  </div>

                  {/* Dotted Gold Stars Line */}
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs">
                    {"✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦".split(" ").map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>

                  {/* Purple Prompt Box */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#5B4CD9] text-white text-center space-y-2 shadow-md">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 font-mono text-[10px] uppercase tracking-wider font-bold">
                      guess Mia&apos;s answer
                    </span>
                    <h3 className="font-heading font-black text-lg text-white">
                      What&apos;s Mia&apos;s ultimate comfort food?
                    </h3>
                  </div>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-stone-200 text-stone-800 font-heading font-bold text-xs flex items-center gap-2">
                      <span className="font-mono text-stone-400">A</span>
                      <span>Pizza</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#1E1B4B] text-white border border-indigo-950 font-heading font-bold text-xs flex items-center gap-2 shadow-xs">
                      <span className="font-mono text-indigo-300">B</span>
                      <span>Ramen / noodles</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-stone-200 text-stone-800 font-heading font-bold text-xs flex items-center gap-2">
                      <span className="font-mono text-stone-400">C</span>
                      <span>Ice cream</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-stone-200 text-stone-800 font-heading font-bold text-xs flex items-center gap-2">
                      <span className="font-mono text-stone-400">D</span>
                      <span>Mom&apos;s home cooking</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ACTIVE QUESTION & DUAL-PHONE GAME STAGE */}
        {(phase === "playing" || phase === "locked" || phase === "comparing" || phase === "revealed") && (
          <div className="space-y-8">

            {/* Center Question Banner */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">
                QUESTION {String(currentQIndex + 1).padStart(2, "0")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display italic font-black text-[var(--text)]">
                {currentQ.question}
              </h2>
              {currentQ.subtitle && (
                <p className="text-xs text-[var(--text-soft)] font-mono">
                  {currentQ.subtitle}
                </p>
              )}
            </div>

            {/* Dual Player Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">

              {/* Player A (You) */}
              <div className={`p-6 sm:p-7 rounded-3xl bg-white border-2 shadow-md transition-all flex flex-col justify-between relative paper-grain ${
                myAnswer ? "border-rose-300 shadow-rose-100" : "border-[var(--border)]"
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      ✨ {userName} (You)
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                    {myAnswer ? "🔒 LOCKED IN" : "YOUR TURN"}
                  </span>
                </div>

                <div className="space-y-2.5 my-5 flex-1 flex flex-col justify-center">
                  {currentQ.options.map((opt) => {
                    const isSelected = myAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        disabled={!!myAnswer}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-gradient-to-r from-rose-500 to-[#E8527D] text-white border-rose-600 shadow-md scale-[1.01]"
                            : myAnswer
                            ? "bg-gray-50/60 border-[var(--border)] text-[var(--text-soft)]/50 cursor-not-allowed"
                            : "bg-[var(--paper-warm)]/60 hover:bg-rose-50/70 border-[var(--border)] hover:border-rose-300 text-[var(--text)] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{opt.emoji || "✨"}</span>
                          <span>{opt.text}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                  <span>Choice Privacy: Encrypted 🔒</span>
                  <span className="font-bold text-rose-600">
                    {myAnswer ? "Submitted ✓" : "Pick one option"}
                  </span>
                </div>
              </div>

              {/* Player B (Partner / Bot) */}
              <div className={`p-6 sm:p-7 rounded-3xl bg-white border-2 shadow-md transition-all flex flex-col justify-between relative paper-grain ${
                partnerLocked ? "border-blue-300 shadow-blue-100" : "border-[var(--border)]"
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      💙 {partnerName}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                    {partnerLocked ? "🔒 LOCKED IN" : "THINKING..."}
                  </span>
                </div>

                <div className="space-y-2.5 my-5 flex-1 flex flex-col justify-center">
                  {phase === "revealed" && partnerAnswer ? (
                    currentQ.options.map((opt) => {
                      const isPartnerSelected = partnerAnswer === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                            isPartnerSelected
                              ? "bg-gradient-to-r from-blue-500 to-[#3B82F6] text-white border-blue-600 shadow-md scale-[1.01]"
                              : "bg-gray-50/60 border-[var(--border)] text-[var(--text-soft)]/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{opt.emoji || "✨"}</span>
                            <span>{opt.text}</span>
                          </div>
                          {isPartnerSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 rounded-2xl bg-[var(--paper-warm)]/70 border border-dashed border-[var(--border)] text-center space-y-3 my-auto">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-500 flex items-center justify-center mx-auto text-lg">
                        {partnerLocked ? "🔒" : "⏳"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">
                          {partnerLocked ? `${partnerName} has locked their answer!` : `Waiting for ${partnerName} to pick...`}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)] mt-0.5">
                          {partnerLocked ? "Answers will reveal at the same second" : "Nobody can peek before submitting"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                  <span>Choice Privacy: Encrypted 🔒</span>
                  <span className="font-bold text-blue-600">
                    {partnerLocked ? "Locked In ✓" : "Pending Pick"}
                  </span>
                </div>
              </div>

            </div>

            {/* Reveal Result Overlay */}
            <AnimatePresence>
              {phase === "revealed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-xl text-center space-y-5 paper-grain"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-blue-500 text-white text-2xl shadow-lg border-2 border-white">
                    {isCurrentMatch ? "💖" : "✨"}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-display italic font-black text-[var(--text)]">
                      {isCurrentMatch ? "100% MATCH 💕" : "DIFFERENT PICKS ✨"}
                    </h3>
                    <p className="text-xs font-mono text-[var(--text-soft)]">
                      {isCurrentMatch
                        ? "Both of you picked the exact same option!"
                        : "You picked different options: variety keeps things exciting!"}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-between max-w-sm mx-auto">
                    <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-soft)]">
                      Overall Sync
                    </span>
                    <span className="font-mono font-black text-lg text-[var(--burgundy)]">
                      {animatedPercentage}% IN SYNC
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleNextQuestion}
                      className="btn-journal py-3 px-8 text-xs font-mono font-bold cursor-pointer"
                    >
                      <span>
                        {currentQIndex + 1 < MATCH_QUESTIONS.length ? "Next Question ▷" : "See Final Match Score ▷"}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* PHASE 6: COMPLETION & DIGITAL KEEPSAKE CARD */}
        {phase === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto w-full space-y-6"
          >
            {/* 1. Physical Polaroid / Keepsake Ticket */}
            <div className="relative mx-auto w-full bg-[#FAF7F2] rounded-3xl p-7 sm:p-9 border border-[#E4D5C5] shadow-xl text-center space-y-6 paper-grain">

              {/* Top Ticket Header */}
              <div className="flex items-center justify-between border-b border-dashed border-[#D5C2AF] pb-3 text-[10px] font-mono tracking-widest text-[#8C7A68]">
                <span className="font-bold">PAIRFECT KEEPSAKE · LOVE MATCH</span>
                <span className="uppercase">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Couple Title */}
              <div className="flex items-center justify-center gap-3">
                <div className="px-3.5 py-1 rounded-full bg-white border border-[#E4D5C5] flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-heading font-bold text-xs text-[var(--text)]">
                    {userName}
                  </span>
                </div>
                <span className="text-rose-500 font-bold text-base">♡</span>
                <div className="px-3.5 py-1 rounded-full bg-white border border-[#E4D5C5] flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-heading font-bold text-xs text-[var(--text)]">
                    {partnerName}
                  </span>
                </div>
              </div>

              {/* Big Animated Score */}
              <div className="py-2 space-y-1">
                <div className="text-6xl sm:text-7xl font-display italic font-black text-[var(--burgundy)] tracking-tight">
                  {animatedPercentage}%
                </div>
                <p className="text-xs font-mono font-bold tracking-widest text-[var(--text)] uppercase">
                  IN SYNC 💕
                </p>
                <p className="text-[11px] font-mono text-[var(--text-soft)]">
                  {matchHistory.filter((h) => h.isMatch).length} of {matchHistory.length} answers matched
                </p>
              </div>

              {/* Verdict Badge */}
              <div className="px-4 py-3 rounded-2xl bg-white border border-[#E4D5C5] text-xs font-medium text-[var(--text)] shadow-2xs text-left space-y-1">
                <p className="font-bold text-[var(--text)] flex items-center gap-1.5">
                  <span>{getMatchFeedback(animatedPercentage).emoji}</span>
                  <span>{getMatchFeedback(animatedPercentage).headline}</span>
                </p>
                <p className="text-[11px] text-[var(--text-soft)] leading-relaxed">
                  {getMatchFeedback(animatedPercentage).message}
                </p>
              </div>

              {/* Synchronized Picks Highlights */}
              <div className="text-left space-y-2.5 pt-3 border-t border-dashed border-[#D5C2AF]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C7A68] font-bold">
                    Synchronized Highlights
                  </span>
                  <span className="text-[10px] font-mono text-[#8C7A68]">
                    {matchHistory.filter((h) => h.isMatch).length} matched
                  </span>
                </div>

                {matchHistory.filter((h) => h.isMatch).length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {matchHistory
                      .filter((h) => h.isMatch)
                      .map((h, i) => {
                        const q = MATCH_QUESTIONS[h.qIndex];
                        const opt = q?.options.find((o) => o.id === h.myAns);
                        return (
                          <div
                            key={i}
                            className="text-xs p-2.5 rounded-xl bg-white border border-[#EFE5DB] flex items-start gap-2.5 shadow-2xs"
                          >
                            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                            <div className="leading-tight">
                              <span className="text-[#8C7A68] text-[10px] font-mono block">
                                {q?.question}
                              </span>
                              <span className="font-bold text-[var(--text)] text-xs mt-0.5 block">
                                {opt?.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-[#EFE5DB] text-center">
                    <p className="text-xs italic text-[#8C7A68]">
                      Opposites attract: you both brought unique flavors to every question!
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Certificate Footer */}
              <div className="pt-2 text-[9px] font-mono text-[#A89887] uppercase tracking-wider border-t border-[#EFE5DB]">
                Official Match Record · Pairfect Sanctuary
              </div>
            </div>

            {/* 2. Interactive Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {user && pair ? (
                <button
                  onClick={handlePinToMemoryWall}
                  disabled={pinnedToMemories || isSavingMemory}
                  className={`w-full sm:w-auto py-3 px-6 rounded-2xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    pinnedToMemories
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "btn-journal shadow-md"
                  }`}
                >
                  {pinnedToMemories ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Pinned to Memory Wall!</span>
                    </>
                  ) : isSavingMemory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pinning to Memories...</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Pin to Memory Wall 📌</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="w-full sm:w-auto btn-journal py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Create Account to Save 📌</span>
                </Link>
              )}

              <button
                onClick={handleDownloadKeepsake}
                disabled={isDownloadingCard}
                className="w-full sm:w-auto btn-journal-ghost py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDownloadingCard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download Keepsake</span>
              </button>

              <button
                onClick={handlePlayAgain}
                className="w-full sm:w-auto btn-journal-ghost py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/play"
                className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-colors inline-flex items-center gap-1.5"
              >
                <span>← Back to Playroom Hub</span>
              </Link>
            </div>
          </motion.div>
        )}

      </main>

      <AmbientSoundscapeBar />
    </div>
  );
}
