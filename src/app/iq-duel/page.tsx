"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Brain, Loader2, AlertCircle, Zap, Trophy, Clock,
  RefreshCw, CheckCircle2, XCircle, Swords, Sparkles,
  Copy, Check, Share2, Download, Bookmark, Volume2, VolumeX, Bot, User, ArrowRight
} from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// Lightweight Web Audio API Synthesizer (Zero External Audio Dependencies)
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playBlipSound(muted: boolean) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

function playTickSound(muted: boolean) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

function playFanfareSound(muted: boolean) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const startTime = ctx.currentTime + idx * 0.09;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch {}
}

// Built-in Fallback Questions Pool (Guarantees zero downtime even offline)
const FALLBACK_QUESTIONS = [
  {
    id: "fallback-1",
    question_type: "pattern",
    question_text: "2, 4, 8, 16, ?",
    options: ["24", "32", "20", "18"],
    correct_answer: "32",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-2",
    question_type: "logic",
    question_text: "Which word does NOT belong with the others?",
    options: ["Apple", "Banana", "Carrot", "Peach"],
    correct_answer: "Carrot",
    difficulty: 1,
    time_limit_seconds: 20
  },
  {
    id: "fallback-3",
    question_type: "math",
    question_text: "A bat and ball cost $1.10 total. The bat costs $1.00 more than the ball. How much is the ball?",
    options: ["$0.05", "$0.10", "$0.15", "$0.01"],
    correct_answer: "$0.05",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-4",
    question_type: "pattern",
    question_text: "3, 6, 12, 24, ?",
    options: ["36", "48", "40", "52"],
    correct_answer: "48",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-5",
    question_type: "logic",
    question_text: "If all Zips are Zaps, and all Zaps are Zops, are all Zips definitely Zops?",
    options: ["Yes", "No", "Cannot be determined", "Only on weekends"],
    correct_answer: "Yes",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-6",
    question_type: "math",
    question_text: "If it takes 5 machines 5 minutes to make 5 widgets, how many minutes do 100 machines need for 100 widgets?",
    options: ["5 minutes", "100 minutes", "20 minutes", "1 minute"],
    correct_answer: "5 minutes",
    difficulty: 3,
    time_limit_seconds: 20
  },
  {
    id: "fallback-7",
    question_type: "pattern",
    question_text: "AZ, BY, CX, DW, ?",
    options: ["EV", "EU", "FU", "FW"],
    correct_answer: "EV",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-8",
    question_type: "logic",
    question_text: "Some months have 30 days, some have 31. How many have 28 days?",
    options: ["1 month", "2 months", "All 12 months", "6 months"],
    correct_answer: "All 12 months",
    difficulty: 2,
    time_limit_seconds: 20
  },
  {
    id: "fallback-9",
    question_type: "math",
    question_text: "Divide 30 by half (1/2) and add 10. What do you get?",
    options: ["25", "70", "40", "50"],
    correct_answer: "70",
    difficulty: 3,
    time_limit_seconds: 20
  },
  {
    id: "fallback-10",
    question_type: "pattern",
    question_text: "1, 1, 2, 3, 5, 8, ?",
    options: ["11", "13", "15", "12"],
    correct_answer: "13",
    difficulty: 2,
    time_limit_seconds: 20
  }
];

// Playful IQ Estimator Function
function getPlayfulIQ(correctCount: number, totalQuestions: number, avgTimeSeconds: number) {
  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const speedBonus = avgTimeSeconds < 10 ? 10 : 0;
  const baseScore = Math.round(90 + accuracy * 60 + speedBonus);

  const labels = [
    { min: 140, label: "Absolute Genius 🧠" },
    { min: 125, label: "Sharp Cookie ✨" },
    { min: 110, label: "Solid Thinker 💭" },
    { min: 0,   label: "Vibes over Logic 😄" },
  ];
  const label = labels.find((l) => baseScore >= l.min)!.label;
  return { score: baseScore, label };
}

const TYPE_BADGE: Record<string, string> = {
  pattern: "PATTERN",
  logic:   "LOGIC",
  math:    "MATH",
};

const TYPE_COLOR: Record<string, string> = {
  pattern: "text-[var(--burgundy)] border-[var(--burgundy)]/30 bg-[var(--burgundy)]/5",
  logic:   "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/5",
  math:    "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
};

// Circular Countdown Timer
function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? seconds / total : 0;
  const dash = circ * progress;
  const urgent = seconds <= 5;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="4" className="text-border" />
        <circle cx="32" cy="32" r={r} fill="none"
          stroke="url(#timer-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s linear" }}
        />
        <defs>
          <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={urgent ? "#ef4444" : "#f472b6"} />
            <stop offset="100%" stopColor={urgent ? "#f97316" : "#60a5fa"} />
          </linearGradient>
        </defs>
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-black font-mono ${urgent ? "text-red-500 animate-pulse" : "text-[var(--text)]"}`}>
        {seconds}
      </span>
    </div>
  );
}

// Animated IQ Count-Up
function IQCountUp({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(90);

  useEffect(() => {
    let start = 90;
    const step = Math.ceil((target - start) / 35);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplayed(target);
        clearInterval(interval);
      } else {
        setDisplayed(start);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [target]);

  return <>{displayed}</>;
}

export default function IQDuelPage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const { sendGameNotification } = useNotifications();
  const supabase = createClient();

  type Screen = "lobby" | "questions" | "waiting" | "reveal";
  const [screen, setScreen] = useState<Screen>("lobby");
  const [error, setError] = useState<string | null>(null);

  // Identity and Room Codes
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Duel State
  const [duelId, setDuelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [starting, setStarting] = useState(false);
  const [botStatusText, setBotStatusText] = useState<string>("");

  // Per-answer tracking
  const qStartRef = useRef<number>(Date.now());
  const answersRef = useRef<{ questionId: string; isCorrect: boolean; timeTaken: number }[]>([]);
  const botAnswersRef = useRef<{ questionId: string; isCorrect: boolean; timeTaken: number }[]>([]);

  // Results
  const [myResult, setMyResult] = useState<any>(null);
  const [partnerResult, setPartnerResult] = useState<any>(null);

  // Keepsake Card State
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // Realtime channel ref
  const channelRef = useRef<any>(null);

  // 1. Audio and Sound Preference Initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSound = localStorage.getItem("pairfect_sound_fx");
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("pairfect_sound_fx", String(next));
    }
  };

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
  const effectivePartnerName = isSoloMode ? "Logic Bot 🤖" : (dynamicPartnerName || partner?.display_name || "Partner");

  // 3. Realtime Channel Subscription for Room Code
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    const channel = supabase.channel(`iq-duel-${roomCode}`);
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
      .on("broadcast", { event: "duel-started" }, ({ payload }: any) => {
        if (payload.startedBy !== myEffectiveId && payload.questions) {
          setDuelId(payload.duelId);
          setQuestions(payload.questions);
          setQIndex(0);
          answersRef.current = [];
          botAnswersRef.current = [];
          setSelected(null);
          setConfirmed(false);
          setIsSoloMode(false);
          setPinnedToMemories(false);
          setScreen("questions");
        }
      })
      .on("broadcast", { event: "duel-reveal" }, ({ payload }: any) => {
        const mine = payload.results.find((r: any) => r.userId === myEffectiveId) || null;
        const theirs = payload.results.find((r: any) => r.userId !== myEffectiveId) || null;
        setMyResult(mine);
        setPartnerResult(theirs);
        setScreen("reveal");
        playFanfareSound(!soundEnabled);
      })
      .on("broadcast", { event: "partner-finished" }, ({ payload }: any) => {
        if (payload.userId !== myEffectiveId) {
          setPartnerResult(payload.result);
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
  }, [roomCode, myEffectiveId, isGuestPromptOpen, effectiveDisplayName, soundEnabled, supabase]);

  // 4. Countdown Timer per Question
  useEffect(() => {
    if (screen !== "questions" || confirmed) return;
    if (questions.length === 0) return;

    const limit = questions[qIndex]?.time_limit_seconds ?? 20;
    setTimeLeft(limit);
    qStartRef.current = Date.now();

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 5 && t > 1) {
          playTickSound(!soundEnabled);
        }
        if (t <= 1) {
          clearInterval(interval);
          handleSubmitAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qIndex, screen, confirmed, questions, soundEnabled]);

  // 5. Simulate Solo Logic Bot Progress
  useEffect(() => {
    if (screen !== "questions" || !isSoloMode || questions.length === 0) return;

    const currentQ = questions[qIndex];
    if (!currentQ) return;

    setBotStatusText("🤖 Logic Bot is calculating...");
    const simulatedDelayMs = 2800 + Math.random() * 3200;

    const timer = setTimeout(() => {
      // 75% probability bot gets correct answer
      const isBotCorrect = Math.random() < 0.75;
      const botTimeTaken = Math.round(simulatedDelayMs / 1000);
      botAnswersRef.current.push({
        questionId: currentQ.id,
        isCorrect: isBotCorrect,
        timeTaken: botTimeTaken,
      });
      setBotStatusText("🤖 Logic Bot locked in!");
    }, simulatedDelayMs);

    return () => clearTimeout(timer);
  }, [screen, isSoloMode, qIndex, questions]);

  // 6. Start Duel (With Partner or Solo Bot)
  const handleStartDuel = async (solo: boolean = false) => {
    if (starting) return;
    setError(null);
    setStarting(true);
    setIsSoloMode(solo);

    try {
      // Fetch pool from database or fallback
      let candidatePool: any[] = [];
      try {
        const { data: dbQuestions, error: qErr } = await supabase
          .from("iq_questions")
          .select("*");
        if (!qErr && dbQuestions && dbQuestions.length >= 6) {
          candidatePool = dbQuestions;
        }
      } catch {}

      if (candidatePool.length < 6) {
        candidatePool = FALLBACK_QUESTIONS;
      }

      // Shuffle and pick 6 questions
      const shuffled = [...candidatePool].sort(() => Math.random() - 0.5).slice(0, 6);
      const generatedDuelId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      setDuelId(generatedDuelId);
      setQuestions(shuffled);
      setQIndex(0);
      answersRef.current = [];
      botAnswersRef.current = [];
      setSelected(null);
      setConfirmed(false);
      setPinnedToMemories(false);
      setScreen("questions");

      // Broadcast to partner if playing together
      if (!solo && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "duel-started",
          payload: {
            duelId: generatedDuelId,
            startedBy: myEffectiveId,
            questions: shuffled,
          },
        });
        sendGameNotification("IQ Duel", `/iq-duel?room=${roomCode}`);
      }
    } catch (e: any) {
      setError(e.message || "Failed to start duel.");
    } finally {
      setStarting(false);
    }
  };

  // 7. Submit Answer Logic
  const handleSubmitAnswer = useCallback(async (answer: string | null) => {
    if (!questions[qIndex]) return;
    setConfirmed(true);
    playBlipSound(!soundEnabled);

    const q = questions[qIndex];
    const isCorrect = answer !== null && answer === q.correct_answer;
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000);

    answersRef.current.push({ questionId: q.id, isCorrect, timeTaken });

    // Optional database record if authenticated
    if (user && duelId) {
      try {
        await supabase.from("iq_duel_answers").insert({
          duel_id: duelId,
          user_id: user.id,
          question_id: q.id,
          answer_given: answer,
          is_correct: isCorrect,
          time_taken_seconds: timeTaken,
        });
      } catch {}
    }

    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setConfirmed(false);
      } else {
        finishDuel();
      }
    }, 750);
  }, [duelId, user, questions, qIndex, soundEnabled, supabase]);

  // 8. Finish Duel and Compute Results
  const finishDuel = async () => {
    const correctCount = answersRef.current.filter((a) => a.isCorrect).length;
    const avgTime = answersRef.current.reduce((s, a) => s + a.timeTaken, 0) / (answersRef.current.length || 1);
    const { score, label } = getPlayfulIQ(correctCount, questions.length, avgTime);

    const myResultPayload = {
      userId: myEffectiveId,
      name: effectiveDisplayName,
      score: correctCount,
      estimatedIq: score,
      playfulLabel: label,
    };

    setMyResult(myResultPayload);

    // Solo Mode: Bot results
    if (isSoloMode) {
      const botCorrect = botAnswersRef.current.filter((a) => a.isCorrect).length;
      const botAvgTime = botAnswersRef.current.reduce((s, a) => s + a.timeTaken, 0) / (botAnswersRef.current.length || 1);
      const botIQ = getPlayfulIQ(botCorrect, questions.length, botAvgTime);
      const botResultPayload = {
        userId: "logic-bot",
        name: "Logic Bot 🤖",
        score: botCorrect,
        estimatedIq: botIQ.score,
        playfulLabel: botIQ.label,
      };

      setPartnerResult(botResultPayload);
      setScreen("reveal");
      playFanfareSound(!soundEnabled);
      return;
    }

    // Multiplayer Mode
    setScreen("waiting");

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "partner-finished",
        payload: { userId: myEffectiveId, result: myResultPayload },
      });
    }

    // If partner already finished, reveal immediately
    if (partnerResult) {
      const allResults = [myResultPayload, partnerResult];
      channelRef.current?.send({
        type: "broadcast",
        event: "duel-reveal",
        payload: { results: allResults },
      });
      setScreen("reveal");
      playFanfareSound(!soundEnabled);
    }
  };

  // 9. Reset and Rematch
  const handleReset = () => {
    setScreen("lobby");
    setDuelId(null);
    setQuestions([]);
    setQIndex(0);
    setSelected(null);
    setConfirmed(false);
    setMyResult(null);
    setPartnerResult(null);
    setPinnedToMemories(false);
    answersRef.current = [];
    botAnswersRef.current = [];
  };

  // 10. Copy Room Invite Link
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/iq-duel?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // 11. Guest Modal Submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const clean = guestInput.trim();
    setGuestName(clean);
    localStorage.setItem("pairfect_guest_name", clean);
    setIsGuestPromptOpen(false);
  };

  // 12. Keepsake Canvas Certificate Generator
  const generateKeepsakeImage = async (
    myScore: number,
    partnerScore: number,
    myIQ: number,
    partnerIQ: number,
    userA: string,
    userB: string,
    verdictTitle: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Warm parchment background
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
    ctx.fillText("PAIRFECT KEEPSAKE : LOGIC DUEL REPORT", canvas.width / 2, 105);

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

    // Couple / Duelist Names
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  vs  ${userB}`, canvas.width / 2, 230);

    // Dual Score Highlights
    ctx.fillStyle = "#8E3D52";
    ctx.font = "italic 900 88px serif";
    ctx.fillText(`${myIQ}`, canvas.width / 3, 360);

    ctx.fillStyle = "#3B82F6";
    ctx.font = "italic 900 88px serif";
    ctx.fillText(`${partnerIQ}`, (canvas.width * 2) / 3, 360);

    // Labels under scores
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`${userA.toUpperCase()} (IQ)`, canvas.width / 3, 400);

    ctx.fillStyle = "#3B82F6";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`${userB.toUpperCase()} (IQ)`, (canvas.width * 2) / 3, 400);

    // Verdict Box
    ctx.fillStyle = "#F2E8DC";
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(100, 445, canvas.width - 200, 70, 16);
    } else {
      ctx.rect(100, 445, canvas.width - 200, 70);
    }
    ctx.fill();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 20px serif";
    ctx.fillText(`"${verdictTitle}"`, canvas.width / 2, 488);

    // Duelist Statistics Section
    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 15px monospace";
    ctx.fillText("ROUND BREAKDOWN", canvas.width / 2, 575);

    let currentY = 630;
    ctx.textAlign = "left";

    // Row 1: Accuracy
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Accuracy", 130, currentY);
    ctx.font = "17px monospace";
    ctx.fillStyle = "#2D1F2D";
    ctx.fillText(`${myScore}/6 correct`, 400, currentY);
    ctx.fillText(`${partnerScore}/6 correct`, 640, currentY);

    currentY += 55;
    // Row 2: Logic rating
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Logic Title", 130, currentY);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#2D1F2D";
    ctx.fillText(myResult?.playfulLabel || "Thinker", 400, currentY);
    ctx.fillText(partnerResult?.playfulLabel || "Thinker", 640, currentY);

    currentY += 55;
    // Row 3: Challenge Type
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Discipline", 130, currentY);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#55444E";
    ctx.fillText("Pattern, Logic & Math", 400, currentY);

    // Footer Stamp
    ctx.textAlign = "center";
    ctx.strokeStyle = "#DECBC0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 1030);
    ctx.lineTo(canvas.width - 100, 1030);
    ctx.stroke();

    ctx.fillStyle = "#A38F7D";
    ctx.font = "14px monospace";
    ctx.fillText("PAIRFECT SANCTUARY : CERTIFIED TOGETHER", canvas.width / 2, 1070);

    return canvas.toDataURL("image/png");
  };

  // 13. Pin Keepsake to Memory Wall
  const handlePinToMemoryWall = async () => {
    if (!user || !pair?.id || pinnedToMemories || isSavingMemory) {
      if (!user || !pair?.id) {
        setPinnedToMemories(true);
      }
      return;
    }

    try {
      setIsSavingMemory(true);
      const myIQ = myResult?.estimatedIq || 100;
      const partnerIQ = partnerResult?.estimatedIq || 100;

      const { error } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `IQ Duel: ${myIQ} vs ${partnerIQ} 🧠`,
        description: `Completed a friendly IQ Duel! You scored ${myResult?.score || 0}/6 (${myResult?.playfulLabel || ""}), and ${effectivePartnerName} scored ${partnerResult?.score || 0}/6 (${partnerResult?.playfulLabel || ""}).`,
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

  // 14. Download Keepsake Certificate
  const handleDownloadKeepsake = async () => {
    try {
      setIsDownloadingCard(true);
      const myScore = myResult?.score || 0;
      const partnerScore = partnerResult?.score || 0;
      const myIQ = myResult?.estimatedIq || 100;
      const partnerIQ = partnerResult?.estimatedIq || 100;

      let verdictTitle = "Perfect Harmony: Two sharp minds!";
      if (myIQ > partnerIQ) {
        verdictTitle = `${effectiveDisplayName} takes the logic crown!`;
      } else if (partnerIQ > myIQ) {
        verdictTitle = `${effectivePartnerName} takes the logic crown!`;
      }

      const dataUrl = await generateKeepsakeImage(
        myScore,
        partnerScore,
        myIQ,
        partnerIQ,
        effectiveDisplayName,
        effectivePartnerName,
        verdictTitle
      );

      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `pairfect-iq-duel-${effectiveDisplayName.toLowerCase()}-${effectivePartnerName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download keepsake error:", err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--burgundy)] animate-spin" />
        </div>
      </div>
    );
  }

  const currentQ = questions[qIndex];
  const correctCount = answersRef.current.filter((a) => a.isCorrect).length;

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-[#FAF9F6] text-stone-900">
      <Navigation />

      {/* Guest Nickname Modal */}
      {isGuestPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FAF9F6] border-2 border-stone-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 text-rose-600 flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Swords className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-heading font-black text-stone-900">Join IQ Duel</h2>
              <p className="text-xs text-stone-600 font-sans">
                You were invited to room <span className="font-mono font-bold text-rose-600">{roomCode}</span>. What should your partner call you?
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
                className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-800 bg-white text-stone-900 text-sm font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <button
                type="submit"
                disabled={!guestInput.trim()}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer transition-all"
              >
                Join the Room
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-16 flex-1 flex flex-col justify-center z-10">

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border-2 border-stone-800 text-rose-700 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Control Bar (Room Code, Presence, Sound Toggle) */}
        <div className="flex items-center justify-between mb-4 px-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy Room Link to Invite Partner"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border-2 border-stone-800 text-stone-900 font-mono font-bold shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-stone-50 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Room: {roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            </button>

            {partnerConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-mono font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{effectivePartnerName} connected</span>
              </span>
            )}
          </div>

          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            className="p-2 rounded-xl bg-white border-2 border-stone-800 text-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-stone-50 transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>
        </div>

        {/* ── LOBBY SCREEN ─────────────────────────────────────────── */}
        {screen === "lobby" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] p-6 sm:p-8 text-center">
              {/* Coral Washi Tape */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 -rotate-1 shadow-xs">
                <span className="bg-rose-500 text-white font-mono uppercase text-[10px] sm:text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                  OUR PLAYFUL ARENA · LOGIC DUEL
                </span>
              </div>

              <div className="pt-2">
                <CoupleBeansMascot className="w-24 h-16 sm:w-28 sm:h-20 mx-auto mb-2" />
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-stone-900">
                  Challenge your favorite brain.
                </h1>
                <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed font-sans">
                  A playful real-time timed challenge: you and{" "}
                  <strong className="text-rose-600 font-bold">{effectivePartnerName}</strong>{" "}
                  answer rapid logic, pattern, and lateral thinking dilemmas. Reveal results together!
                </p>

                <div className="mt-5 flex items-center justify-center gap-4 text-xs text-stone-700 font-mono font-bold flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 border border-stone-800">
                    <Zap className="w-3.5 h-3.5 text-rose-600" /> 6 Questions
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 border border-stone-800">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> 15-20s Each
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 border border-stone-800">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Couple IQ Score
                  </span>
                </div>

                <p className="mt-3 text-[10px] text-stone-400 font-mono">
                  For playful connection only: not a formal psychometric exam
                </p>
              </div>
            </div>

            {/* How It Works Pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "01", text: "Start live duel or practice solo", color: "text-rose-600" },
                { step: "02", text: "Answer 6 questions separately", color: "text-amber-600" },
                { step: "03", text: "Reveal scores & keepsake card!", color: "text-blue-600" },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border-2 border-stone-800 bg-white p-3.5 text-center space-y-1.5 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  <span className={`text-xl font-black font-mono ${s.color}`}>{s.step}</span>
                  <p className="text-[11px] font-sans font-bold text-stone-700 leading-snug">{s.text}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                onClick={() => handleStartDuel(false)}
                disabled={starting}
                className="w-full py-4 rounded-2xl font-sans font-black text-white text-sm uppercase tracking-wider bg-rose-500 hover:bg-rose-600 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                {starting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Duel...</>
                ) : (
                  <><Swords className="w-4 h-4 stroke-[2.5]" /> Start Duel with Partner</>
                )}
              </button>

              <button
                onClick={() => handleStartDuel(true)}
                disabled={starting}
                className="w-full py-3.5 rounded-2xl font-sans font-bold text-stone-900 text-xs sm:text-sm border-2 border-stone-800 bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-rose-600 stroke-[2.5]" /> Practice Solo vs Logic Bot 🤖
              </button>
            </div>
          </div>
        )}

        {/* ── QUESTION SCREEN ───────────────────────────────────────── */}
        {screen === "questions" && currentQ && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress bar and Bot Status */}
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-xs font-mono font-bold text-stone-500 tracking-wider uppercase">
                Question {qIndex + 1} of {questions.length}
              </span>
              {isSoloMode && botStatusText && (
                <span className="text-xs font-mono font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                  {botStatusText}
                </span>
              )}
            </div>

            <div className="w-full h-2.5 rounded-full bg-stone-200 border border-stone-800 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] p-6 sm:p-8 space-y-6">
              {/* Type badge + timer row */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-lg border-2 border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)] ${TYPE_COLOR[currentQ.question_type] || "bg-stone-100 text-stone-800"}`}>
                  {TYPE_BADGE[currentQ.question_type] || currentQ.question_type}
                </span>
                <CircularTimer
                  seconds={timeLeft}
                  total={currentQ.time_limit_seconds ?? 20}
                />
              </div>

              {/* Question text */}
              <p className="text-xl sm:text-2xl font-heading font-black leading-snug text-stone-900">
                {currentQ.question_text}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt: string) => {
                  const isSelected = selected === opt;
                  const isCorrect = confirmed && opt === currentQ.correct_answer;
                  const isWrong = confirmed && isSelected && opt !== currentQ.correct_answer;

                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (confirmed) return;
                        setSelected(opt);
                        handleSubmitAnswer(opt);
                      }}
                      disabled={confirmed}
                      className={`relative px-4 py-3.5 rounded-2xl text-sm font-bold text-left transition-all border-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                        ${isCorrect
                          ? "border-stone-800 bg-emerald-100 text-emerald-950 font-black"
                          : isWrong
                          ? "border-stone-800 bg-red-100 text-red-950 font-black"
                          : isSelected
                          ? "border-stone-800 bg-rose-50 text-rose-900 font-black"
                          : "border-stone-800 bg-white hover:bg-stone-50 text-stone-900"
                        }`}
                    >
                      {isCorrect && <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-emerald-600 stroke-[2.5]" />}
                      {isWrong && <XCircle className="w-4 h-4 inline mr-1.5 text-red-600 stroke-[2.5]" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Dots Trail */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {answersRef.current.map((a, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border border-stone-800 ${a.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}
                />
              ))}
              {Array.from({ length: questions.length - answersRef.current.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-3 h-3 rounded-full bg-stone-200 border border-stone-800" />
              ))}
            </div>
          </div>
        )}

        {/* ── WAITING SCREEN ────────────────────────────────────────── */}
        {screen === "waiting" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative rounded-3xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] p-8 sm:p-10">
              <CoupleBeansMascot className="w-24 h-16 sm:w-28 sm:h-20 mx-auto mb-4" />

              <p className="text-xs font-mono font-bold text-stone-500 tracking-wider uppercase mb-2">
                Round Complete!
              </p>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900">
                {correctCount}/{questions.length} answered correctly
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                Waiting for{" "}
                <strong className="text-rose-600 font-bold">{effectivePartnerName}</strong>{" "}
                to complete their duel questions...
              </p>

              <div className="flex items-center justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce border border-stone-800"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REVEAL SCREEN & KEEPSAKE CARD ──────────────────────────── */}
        {screen === "reveal" && myResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="text-xs font-mono font-bold text-stone-500 tracking-wider uppercase">Duel Completed</p>
              <h2 className="font-heading font-black text-3xl text-stone-900 flex items-center justify-center gap-2">
                <Trophy className="w-7 h-7 text-amber-500" />
                <span>Duel Results</span>
              </h2>
            </div>

            {/* Side-by-side Score Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* My Card */}
              <div className="relative rounded-3xl border-2 border-stone-800 bg-white shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] p-5 text-center space-y-2">
                <p className="text-xs font-mono font-black text-rose-600 tracking-wider uppercase">
                  {effectiveDisplayName}
                </p>
                <p className="text-4xl sm:text-5xl font-black font-mono text-stone-900">
                  <IQCountUp target={myResult.estimatedIq} />
                </p>
                <p className="text-xs font-bold text-stone-600">{myResult.playfulLabel}</p>
                <div className="pt-2 border-t-2 border-stone-200 mt-2">
                  <span className="text-xs font-mono font-bold text-stone-600">
                    {myResult.score}/{questions.length} correct
                  </span>
                </div>
              </div>

              {/* Partner / Bot Card */}
              <div className="relative rounded-3xl border-2 border-stone-800 bg-white shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] p-5 text-center space-y-2">
                <p className="text-xs font-mono font-black text-blue-600 tracking-wider uppercase">
                  {effectivePartnerName}
                </p>
                {partnerResult ? (
                  <>
                    <p className="text-4xl sm:text-5xl font-black font-mono text-stone-900">
                      <IQCountUp target={partnerResult.estimatedIq} />
                    </p>
                    <p className="text-xs font-bold text-stone-600">{partnerResult.playfulLabel}</p>
                    <div className="pt-2 border-t-2 border-stone-200 mt-2">
                      <span className="text-xs font-mono font-bold text-stone-600">
                        {partnerResult.score}/{questions.length} correct
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-stone-500 py-4 font-mono font-bold">Tallying partner answers...</p>
                )}
              </div>
            </div>

            {/* Winner Banner */}
            {partnerResult && (
              <div className="rounded-2xl border-2 border-stone-800 bg-amber-50 p-4 text-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="text-sm font-black text-stone-900">
                  {myResult.estimatedIq > partnerResult.estimatedIq
                    ? `🎉 ${effectiveDisplayName} takes the logic crown!`
                    : myResult.estimatedIq < partnerResult.estimatedIq
                    ? `🏆 ${effectivePartnerName} takes the logic crown!`
                    : "🤝 It's a tie: perfectly matched minds!"}
                </p>
              </div>
            )}

            {/* Post-Duel Keepsake Card */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] text-stone-900 p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
              <div className="border-2 border-dashed border-stone-800 rounded-2xl p-5 space-y-4">

                {/* Vintage Header */}
                <div className="text-center border-b-2 border-stone-200 pb-3 space-y-1">
                  <p className="text-xs font-mono font-black tracking-wider uppercase text-rose-600">
                    PAIRFECT KEEPSAKE · LOGIC DUEL
                  </p>
                  <p className="text-xs font-mono font-bold text-stone-500">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
                  </p>
                </div>

                {/* Duelists Badges */}
                <div className="flex items-center justify-between text-xs px-2 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <User className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{effectiveDisplayName} ({myResult.estimatedIq} IQ)</span>
                  </div>
                  <span className="text-stone-400 font-black">VS</span>
                  <div className="flex items-center gap-1.5 font-bold text-blue-600">
                    <span>{effectivePartnerName} ({partnerResult?.estimatedIq || 100} IQ)</span>
                    <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Question Category Recap */}
                <div className="space-y-2 pt-2 border-t-2 border-stone-200">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                    Challenge Summary
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-stone-800 shadow-xs">
                      <span className="block text-[10px] font-mono text-rose-600 font-bold">PATTERN</span>
                      <span className="font-bold">{questions.filter((q) => q.question_type === "pattern").length} Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-stone-800 shadow-xs">
                      <span className="block text-[10px] font-mono text-blue-600 font-bold">LOGIC</span>
                      <span className="font-bold">{questions.filter((q) => q.question_type === "logic").length} Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-stone-800 shadow-xs">
                      <span className="block text-[10px] font-mono text-emerald-600 font-bold">MATH</span>
                      <span className="font-bold">{questions.filter((q) => q.question_type === "math").length} Qs</span>
                    </div>
                  </div>
                </div>

                {/* Keepsake Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handlePinToMemoryWall}
                    disabled={isSavingMemory || pinnedToMemories}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 border-stone-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                      ${pinnedToMemories
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-rose-500 hover:bg-rose-600 text-white"
                      }`}
                  >
                    {isSavingMemory ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : pinnedToMemories ? (
                      <><Check className="w-3.5 h-3.5 stroke-[2.5]" /> Pinned to Wall</>
                    ) : (
                      <><Bookmark className="w-3.5 h-3.5 stroke-[2.5]" /> Pin to Memory Wall</>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadKeepsake}
                    disabled={isDownloadingCard}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-stone-900 border-2 border-stone-800 hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    {isDownloadingCard ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <><Download className="w-3.5 h-3.5 stroke-[2.5]" /> Download Certificate</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Duel Again CTA */}
            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl font-sans font-bold text-xs uppercase tracking-wider text-stone-900 border-2 border-stone-800 bg-white hover:bg-stone-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" /> Rematch / Duel Again
            </button>
          </div>
        )}

      </main>

      <AmbientSoundscapeBar />
    </div>
  );
}
