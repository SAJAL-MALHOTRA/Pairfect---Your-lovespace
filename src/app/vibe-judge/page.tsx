"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Scale,
  Check,
  Loader2,
  Sparkles,
  Lock,
  ArrowLeft,
  Timer,
  MessageSquare,
  Plus,
  Share2,
  Copy,
  Bot,
  User,
  Volume2,
  VolumeX,
  Download,
  BookmarkCheck,
  Trophy,
  Gavel,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

interface DisputeItem {
  id: string;
  topic: string;
  status: "pending" | "judged";
  created_at: string;
  created_by?: string;
  is_solo?: boolean;
}

const PRESET_TOPICS = [
  "Who takes longer to get ready in the morning?",
  "Does pineapple genuinely belong on pizza?",
  "Who is the superior navigator on road trips?",
  "Is leaving 1% battery on your phone an emotional crime?",
  "Who falls asleep first during movie night?",
  "Should the bed be made every single morning?",
];

const PENALTY_POOL = [
  "Must bring morning coffee in bed tomorrow ☕",
  "Gives a relaxing 5-minute shoulder massage 💆‍♂️",
  "Must surrender full movie selection rights tonight 🎬",
  "Owes an emergency midnight snack run 🍦",
  "Cleans the dinner dishes without complaint 🍽️",
  "Picks up tomorrow's takeout order 🍕",
];

export default function VibeJudgePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // 1. Room Code & Identity Management
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2. Dispute & Court States
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [activeDispute, setActiveDispute] = useState<DisputeItem | null>(null);
  const [fetching, setFetching] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);

  // 3. Argument & Verdict States
  const [myArgument, setMyArgument] = useState("");
  const [submittingArgument, setSubmittingArgument] = useState(false);
  const [myArgSubmitted, setMyArgSubmitted] = useState<any>(null);
  const [partnerArgSubmitted, setPartnerArgSubmitted] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerActive, setTimerActive] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [judging, setJudging] = useState(false);

  // 4. Keepsake Actions
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  const channelRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Synthesizer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioClass) {
        audioCtxRef.current = new AudioClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playGavelSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  const playChime = useCallback((freq = 520, duration = 0.2) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  const playFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [392, 523, 659, 784];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.38);
        }, idx * 130);
      });
    } catch {}
  }, [soundEnabled, getAudioContext]);

  // Resolve room code and identity on mount
  useEffect(() => {
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
  const effectivePartnerName = isSoloMode
    ? "Cozy Bot"
    : dynamicPartnerName || partner?.display_name || "Partner";

  // Fetch disputes list if authenticated
  const fetchDisputes = useCallback(async () => {
    if (pair?.id) {
      try {
        const res = await fetch(`/api/disputes?pairId=${pair.id}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setDisputes(data);
        }
      } catch {}
    }
    setFetching(false);
  }, [pair?.id]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Realtime Broadcast Channel for Room Sync
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    const channel = supabase.channel(`vibe-room-${roomCode}`, {
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
      .on("broadcast", { event: "case-started" }, ({ payload }: any) => {
        if (payload?.dispute && payload.startedBy !== myEffectiveId) {
          setActiveDispute(payload.dispute);
          setMyArgSubmitted(null);
          setPartnerArgSubmitted(null);
          setVerdict(null);
          setMyArgument("");
          setIsSoloMode(false);
          setPinnedToMemories(false);
          setTimerSeconds(60);
          setTimerActive(true);
          playGavelSound();
        }
      })
      .on("broadcast", { event: "case-arg-locked" }, ({ payload }: any) => {
        if (payload?.userId !== myEffectiveId) {
          setPartnerArgSubmitted({
            user_id: payload.userId,
            user_name: payload.userName,
            argument_text: payload.argumentText,
          });
          playChime(680, 0.2);
        }
      })
      .on("broadcast", { event: "verdict-announced" }, ({ payload }: any) => {
        if (payload?.verdict) {
          setVerdict(payload.verdict);
          setJudging(false);
          setActiveDispute((prev) => (prev ? { ...prev, status: "judged" } : null));
          playFanfare();
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_name: effectiveDisplayName,
            user_id: myEffectiveId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myEffectiveId, isGuestPromptOpen, effectiveDisplayName, supabase, playChime, playGavelSound, playFanfare]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerSeconds === null) return;

    if (timerSeconds > 0) {
      const timer = setTimeout(() => setTimerSeconds(timerSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setTimerActive(false);
      handleLockIn();
    }
  }, [timerSeconds, timerActive]);

  // Intelligent Court Verdict Evaluator
  const evaluateCourtVerdict = useCallback(
    (argA: string, argB: string, userAName: string, userBName: string, topic: string) => {
      const scoreA = argA.length + (argA.toLowerCase().includes("love") ? 15 : 0) + (argA.toLowerCase().includes("always") ? 10 : 0);
      const scoreB = argB.length + (argB.toLowerCase().includes("love") ? 15 : 0) + (argB.toLowerCase().includes("never") ? 10 : 0);

      let winnerLetter = "A";
      let winnerName = userAName;
      let loserName = userBName;

      if (Math.abs(scoreA - scoreB) < 6) {
        winnerLetter = "TIE";
      } else if (scoreB > scoreA) {
        winnerLetter = "B";
        winnerName = userBName;
        loserName = userAName;
      }

      const randomPenalty = PENALTY_POOL[Math.floor(Math.random() * PENALTY_POOL.length)];

      let verdictText = "";
      if (winnerLetter === "TIE") {
        verdictText = `Both ${userAName} and ${userBName} pleaded passionate cases regarding "${topic}". The Court rules a mutual compromise: both arguments possess undeniable merit, charm, and emotional depth!`;
      } else {
        verdictText = `After reviewing the courtroom testimony, ${winnerName}'s passionate plea for "${topic}" was persuasive! While ${loserName} made a spirited rebuttal, the Court rules firmly in favor of ${winnerName}.`;
      }

      return {
        winner: winnerLetter,
        winner_name: winnerName,
        loser_name: loserName,
        verdict_text: verdictText,
        playful_sentence: winnerLetter === "TIE" ? `Both partners share ice cream together 🍦` : `${loserName} ${randomPenalty}`,
      };
    },
    []
  );

  // Trigger evaluation when both cases submitted
  useEffect(() => {
    if (activeDispute && myArgSubmitted && partnerArgSubmitted && activeDispute.status !== "judged" && !judging) {
      setJudging(true);
      playGavelSound();

      setTimeout(() => {
        const courtRuling = evaluateCourtVerdict(
          myArgSubmitted.argument_text,
          partnerArgSubmitted.argument_text,
          effectiveDisplayName,
          effectivePartnerName,
          activeDispute.topic
        );

        setVerdict(courtRuling);
        setJudging(false);
        setActiveDispute((prev) => (prev ? { ...prev, status: "judged" } : null));
        playFanfare();

        if (channelRef.current && !isSoloMode) {
          try {
            channelRef.current.send({
              type: "broadcast",
              event: "verdict-announced",
              payload: { verdict: courtRuling },
            });
          } catch {}
        }
      }, 2000);
    }
  }, [
    activeDispute,
    myArgSubmitted,
    partnerArgSubmitted,
    judging,
    effectiveDisplayName,
    effectivePartnerName,
    isSoloMode,
    evaluateCourtVerdict,
    playGavelSound,
    playFanfare,
  ]);

  // Initiate a new dispute case
  const handleInitiateDispute = (topicToStart: string, solo = false) => {
    if (!topicToStart.trim() || submittingDispute) return;
    setSubmittingDispute(true);
    setIsSoloMode(solo);
    setPinnedToMemories(false);

    const disputeItem: DisputeItem = {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      topic: topicToStart.trim(),
      status: "pending",
      created_at: new Date().toISOString(),
      created_by: myEffectiveId,
      is_solo: solo,
    };

    setActiveDispute(disputeItem);
    setMyArgSubmitted(null);
    setPartnerArgSubmitted(null);
    setVerdict(null);
    setMyArgument("");
    setTimerSeconds(60);
    setTimerActive(true);
    setNewTopic("");
    setSubmittingDispute(false);
    playGavelSound();

    if (!solo && channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "case-started",
          payload: { dispute: disputeItem, startedBy: myEffectiveId },
        });
      } catch {}
    }
  };

  // Lock in player's argument
  const handleLockIn = () => {
    if (!activeDispute || submittingArgument || myArgSubmitted) return;
    setSubmittingArgument(true);
    setTimerActive(false);

    const argText = myArgument.trim() || "I request the court's mercy. I rest my case with love.";
    const mySub = {
      user_id: myEffectiveId,
      user_name: effectiveDisplayName,
      argument_text: argText,
    };
    setMyArgSubmitted(mySub);
    playChime(640, 0.2);

    if (isSoloMode) {
      // Cozy Bot generates counter-argument with realistic delay
      setTimeout(() => {
        const botRebuttals = [
          "Your Honor, with all due respect, science and cozy common sense dictate that my perspective is 100% indisputable!",
          "While my partner makes a poetic point, history proves that my way saves at least 15 minutes of confusion every time.",
          "I present Exhibit A: my heart is pure and my intentions are entirely wholesome. Case closed!",
          "I will agree to disagree, but only if hugs and snacks are delivered immediately as compensation!",
        ];
        const botText = botRebuttals[Math.floor(Math.random() * botRebuttals.length)];
        setPartnerArgSubmitted({
          user_id: "cozy_bot",
          user_name: "Cozy Bot",
          argument_text: botText,
        });
        playChime(760, 0.2);
      }, 1800 + Math.random() * 1000);
    } else if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "case-arg-locked",
          payload: {
            userId: myEffectiveId,
            userName: effectiveDisplayName,
            argumentText: argText,
          },
        });
      } catch {}
    }

    setSubmittingArgument(false);
  };

  // Copy Room Link
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/vibe-judge?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // Guest Nickname Submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const clean = guestInput.trim();
    setGuestName(clean);
    localStorage.setItem("pairfect_guest_name", clean);
    setIsGuestPromptOpen(false);
  };

  // Generate Keepsake Certificate Image (900x1180 PNG)
  const generateKeepsakeImage = async (
    topic: string,
    rulingText: string,
    penaltyText: string,
    userA: string,
    userB: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Warm parchment background
    ctx.fillStyle = "#FAF6F0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer double border
    ctx.strokeStyle = "#E4D5C5";
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    // Inner dashed ticket border
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#C9B59F";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
    ctx.setLineDash([]);

    // Header Stamp
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAIRFECT KEEPSAKE : COURT OF PETTY LOVERS", canvas.width / 2, 105);

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

    // Disputants
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  vs  ${userB}`, canvas.width / 2, 225);

    ctx.fillStyle = "#8C7A68";
    ctx.font = "13px monospace";
    ctx.fillText("CASE OF PLAYFUL CONTENTION", canvas.width / 2, 255);

    // Topic Box
    ctx.fillStyle = "#FFF4ED";
    ctx.strokeStyle = "#F8CDB4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(100, 290, canvas.width - 200, 80, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#A3471F";
    ctx.font = "bold italic 22px serif";
    ctx.fillText(`"${topic}"`, canvas.width / 2, 340);

    // Official Verdict Ruling Box
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E8DED2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 400, canvas.width - 160, 320, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 13px monospace";
    ctx.fillText("THE HONORABLE COURT RULING", canvas.width / 2, 440);

    // Word wrap verdict
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "italic 20px serif";
    const words = rulingText.split(" ");
    let line = "";
    let y = 490;
    const maxLineW = canvas.width - 240;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && i > 0) {
        ctx.fillText(line.trim(), canvas.width / 2, y);
        line = words[i] + " ";
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), canvas.width / 2, y);

    // Penalty Stamp Box
    ctx.fillStyle = "#FAF1F4";
    ctx.strokeStyle = "#E4B8C4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(100, 750, canvas.width - 200, 110, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 13px monospace";
    ctx.fillText("DECREED LOVING PENALTY", canvas.width / 2, 785);

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold italic 22px serif";
    ctx.fillText(penaltyText, canvas.width / 2, 830);

    // Court seal at bottom
    ctx.fillStyle = "#C49A45";
    ctx.font = "bold 20px serif";
    ctx.fillText("✦ SEALED BY THE COURT OF PETTY LOVERS ✦", canvas.width / 2, 1040);

    ctx.fillStyle = "#A89482";
    ctx.font = "12px monospace";
    ctx.fillText("Preserved in the lovers' sanctuary · pairfect.site", canvas.width / 2, 1075);

    return canvas.toDataURL("image/png");
  };

  // Pin Keepsake to Memory Wall
  const handlePinToMemoryWall = async () => {
    if (!user || !pair?.id || pinnedToMemories || isSavingMemory) {
      if (!user || !pair?.id) {
        setPinnedToMemories(true);
      }
      return;
    }

    try {
      setIsSavingMemory(true);
      const { error: pinErr } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Court Verdict: "${activeDispute?.topic}" ⚖️`,
        description: `The Court of Petty Lovers has ruled! ${verdict?.verdict_text} Decreed sentence: ${verdict?.playful_sentence}.`,
        moment_date: new Date().toISOString().split("T")[0],
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

  // Download Keepsake Certificate
  const handleDownloadKeepsake = async () => {
    try {
      setIsDownloadingCard(true);
      const dataUrl = await generateKeepsakeImage(
        activeDispute?.topic || "",
        verdict?.verdict_text || "",
        verdict?.playful_sentence || "",
        effectiveDisplayName,
        effectivePartnerName
      );

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `pairfect-court-verdict-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAF9F6]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-16 bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Guest Nickname Modal */}
      {isGuestPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 text-[#E11D48] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Scale className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif italic text-2xl font-bold text-stone-900">Join Relationship Court</h3>
              <p className="text-xs text-stone-600">
                You were invited to settle a dispute in Room <span className="font-mono font-bold text-[#E11D48]">{roomCode}</span>.
              </p>
            </div>
            <form onSubmit={handleGuestSubmit} className="space-y-3 pt-2">
              <input
                type="text"
                placeholder="Your name or nickname..."
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
                Enter the Court
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pl-36 md:pr-12 pb-16 flex-1 flex flex-col justify-start z-10">
        
        {/* Top Control Bar with Room Code and Sound Toggle */}
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
                {effectivePartnerName} in court live
              </span>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            className="p-2 rounded-full bg-white border-2 border-stone-800 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] hover:bg-stone-50"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E11D48]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* LOBBY SCREEN */}
        {!activeDispute && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Sanctuary Card with Mascot */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-[#FAF9F6] p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.7)]">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>OUR RELATIONSHIP COURT · VIBE JUDGE</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-3">
                    <Scale className="w-8 h-8 text-[#E11D48]" />
                    <span>AI Vibe Judge</span>
                  </h1>
                  <p className="text-sm text-stone-600 leading-relaxed font-sans">
                    Welcome to the Court of Petty Lovers. Plead your lighthearted relationship cases privately, lock in arguments before time runs out, and receive a fun, affectionate verdict.
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                  <CoupleBeansMascot className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* Quick Pick Debate Topics */}
            <div className="rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>Popular Debate Topics</span>
                </p>
                <span className="text-[11px] text-stone-500 font-bold">1-tap to start case</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleInitiateDispute(topic, false)}
                    className="p-3.5 rounded-2xl border-2 border-stone-200 hover:border-stone-800 bg-stone-50 hover:bg-stone-100 text-left text-xs font-bold text-stone-900 transition-all cursor-pointer flex items-center justify-between group shadow-xs hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                  >
                    <span>"{topic}"</span>
                    <Gavel className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#E11D48] shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Custom Topic Form */}
              <div className="pt-3 border-t-2 border-stone-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newTopic.trim()) handleInitiateDispute(newTopic, false);
                  }}
                  className="flex gap-2.5"
                >
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Or type a custom topic (e.g. Who washes the dishes tonight?)"
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-800 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                  />
                  <button
                    type="submit"
                    disabled={submittingDispute || !newTopic.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all cursor-pointer border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50"
                  >
                    Judge Us ⚖️
                  </button>
                </form>
              </div>

              {/* Solo Practice Mode */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleInitiateDispute(PRESET_TOPICS[0], true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-stone-800 bg-rose-50 hover:bg-rose-100 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-all cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>Debate with Cozy Bot 🤖</span>
                </button>
              </div>
            </div>

            {/* Past Cases Archive */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-[#E11D48]" />
                <span>Relationship Court Log</span>
              </h2>

              {fetching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[#E11D48] animate-spin mx-auto" />
                </div>
              ) : disputes.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-500 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  No disputes logged yet! Pick a topic above to initiate your first court case.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {disputes.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setActiveDispute(d);
                        setMyArgSubmitted(null);
                        setPartnerArgSubmitted(null);
                      }}
                      className="rounded-2xl border-2 border-stone-800 bg-white p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                            {d.status}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono font-bold">
                            {d.created_at ? format(new Date(d.created_at), "MMM d, h:mm a") : ""}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-stone-900 truncate">
                          "{d.topic}"
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE CASE OR VERDICT REVEAL VIEW */}
        {activeDispute && (
          <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in">
            {/* Header Details */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-stone-200">
              <button
                onClick={() => {
                  setActiveDispute(null);
                  fetchDisputes();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 uppercase font-mono tracking-widest cursor-pointer px-3 py-1.5 rounded-xl border-2 border-stone-800 bg-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Court Lobby</span>
              </button>

              <span className="bg-rose-100 text-rose-900 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                {isSoloMode ? "SOLO DEBATE (COZY BOT)" : `ROOM : ${roomCode}`}
              </span>
            </div>

            {/* Active Dispute Board */}
            <div className="rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-6 text-center relative overflow-hidden">
              {/* Question Text */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-[#E11D48] uppercase tracking-widest">
                  Couples Court Topic
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 leading-snug max-w-xl mx-auto">
                  "{activeDispute.topic}"
                </h2>
              </div>

              {/* Argument Submission Form */}
              {!myArgSubmitted && activeDispute.status !== "judged" && (
                <div className="max-w-md mx-auto space-y-6">
                  {/* Timer Display */}
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <Timer className={`w-6 h-6 ${timerSeconds < 15 ? "text-red-500 animate-pulse" : "text-[#E11D48]"}`} />
                    <span className="text-2xl font-mono font-black text-stone-900">{timerSeconds}s</span>
                  </div>

                  <div className="space-y-4">
                    <textarea
                      value={myArgument}
                      onChange={(e) => setMyArgument(e.target.value)}
                      placeholder="Write your plea privately. Be witty, playful, and persuasive!"
                      className="w-full p-4 rounded-2xl border-2 border-stone-800 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48] h-28 resize-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                    />

                    <button
                      onClick={handleLockIn}
                      disabled={submittingArgument}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock In My Case ⚖️</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Locked in waiting screen */}
              {myArgSubmitted && !partnerArgSubmitted && activeDispute.status !== "judged" && (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                    <Lock className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold text-stone-900">
                    Your argument has been locked in!
                  </p>
                  <p className="text-xs text-stone-500">
                    {isSoloMode
                      ? "Cozy Bot is preparing its counter-rebuttal..."
                      : partnerOnline
                      ? `Waiting for ${effectivePartnerName} to lock in their plea...`
                      : `${effectivePartnerName} is drafting their case...`}
                  </p>
                </div>
              )}

              {/* Judging Loader */}
              {judging && (
                <div className="py-10 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-[#E11D48] animate-spin flex items-center justify-center" />
                  <p className="text-sm font-bold text-stone-900 animate-pulse">
                    The AI Judge is evaluating both pleas...
                  </p>
                  <p className="text-xs text-stone-500 font-bold">
                    Balancing emotional nuance, humor, and relationship harmony!
                  </p>
                </div>
              )}

              {/* Verdict Reveal View */}
              {activeDispute.status === "judged" && verdict && (
                <div className="space-y-6 animate-fade-in text-left">
                  {/* Verdict detail card */}
                  <div className="rounded-2xl border-2 border-stone-800 bg-amber-50 p-6 space-y-4 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold text-amber-900 uppercase tracking-widest flex items-center space-x-1.5">
                        <Scale className="w-4 h-4" />
                        <span>The Official Verdict</span>
                      </h3>
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1 font-mono">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        {verdict.winner === "TIE"
                          ? "Mutual Compromise 🤝"
                          : `${verdict.winner_name} Wins! 🏆`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-stone-900 leading-relaxed italic font-serif font-bold">
                        "{verdict.verdict_text}"
                      </p>
                    </div>

                    {verdict.playful_sentence && (
                      <div className="pt-3 border-t-2 border-stone-200 space-y-1">
                        <p className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest">
                          Playful sentence decreed
                        </p>
                        <p className="text-xs font-bold text-[#E11D48] uppercase tracking-wider bg-white border-2 border-stone-800 rounded-xl py-2 px-3 inline-block shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                          📜 {verdict.playful_sentence}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Arguments comparison columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border-2 border-stone-800 bg-stone-50 p-4 space-y-1.5 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                      <p className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest">
                        Your Case
                      </p>
                      <p className="text-xs text-stone-900 leading-relaxed font-medium">
                        "{myArgSubmitted?.argument_text || "No argument provided"}"
                      </p>
                    </div>
                    <div className="rounded-2xl border-2 border-stone-800 bg-stone-50 p-4 space-y-1.5 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                      <p className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest">
                        {effectivePartnerName}'s Case
                      </p>
                      <p className="text-xs text-stone-900 leading-relaxed font-medium">
                        "{partnerArgSubmitted?.argument_text || "No argument provided"}"
                      </p>
                    </div>
                  </div>

                  {/* POST-VERDICT KEEPSAKE CERTIFICATE CARD */}
                  <div className="relative overflow-hidden rounded-3xl border-2 border-stone-800 bg-[#FAF6F0] text-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] mt-6">
                    <div className="border-2 border-dashed border-stone-400 rounded-2xl p-5 space-y-4">
                      <div className="text-center border-b-2 border-stone-300 pb-2 space-y-1">
                        <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#E11D48]">
                          PAIRFECT KEEPSAKE : COURT OF PETTY LOVERS
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
                        <span className="text-stone-500 font-bold">vs</span>
                        <div className="flex items-center gap-1 font-bold text-blue-700">
                          <span>{effectivePartnerName}</span>
                          {isSoloMode && <Bot className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="text-center py-1 space-y-1">
                        <p className="text-xs font-mono text-stone-500 uppercase font-bold">TOPIC IN DISPUTE</p>
                        <p className="text-base font-serif italic font-bold text-stone-900">
                          "{activeDispute.topic}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
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
                          onClick={handleDownloadKeepsake}
                          disabled={isDownloadingCard}
                          className="py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white text-stone-900 border-2 border-stone-800 hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] rounded-xl"
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

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => {
                        setActiveDispute(null);
                        setMyArgSubmitted(null);
                        setPartnerArgSubmitted(null);
                        setVerdict(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
                    >
                      Settle Another Dispute ⚖️
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AmbientSoundscapeBar />
    </div>
  );
}
