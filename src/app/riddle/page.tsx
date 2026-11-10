"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Gamepad2,
  Check,
  X,
  Loader2,
  Sparkles,
  Lock,
  ArrowLeft,
  Timer,
  HelpCircle,
  Share2,
  Copy,
  Bot,
  User,
  Volume2,
  VolumeX,
  Download,
  BookmarkCheck,
  Shield,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { checkCorrectAnswer } from "@/lib/string-similarity";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

interface RiddleItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

const FALLBACK_RIDDLES: RiddleItem[] = [
  {
    id: "r-1",
    question: "What can travel all around the world while remaining in the same corner?",
    answer: "A stamp",
    category: "Lateral Thinking",
    difficulty: "Easy",
  },
  {
    id: "r-2",
    question: "What has a neck but no head, and two arms but no hands?",
    answer: "A shirt",
    category: "Wordplay",
    difficulty: "Easy",
  },
  {
    id: "r-3",
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answer: "An echo",
    category: "Poetic Riddle",
    difficulty: "Medium",
  },
  {
    id: "r-4",
    question: "What has keys, but no locks; space, but no room; and you can enter, but not go inside?",
    answer: "A keyboard",
    category: "Tech Logic",
    difficulty: "Easy",
  },
  {
    id: "r-5",
    question: "The more of this there is, the less you see. What is it?",
    answer: "Darkness",
    category: "Classic Logic",
    difficulty: "Easy",
  },
  {
    id: "r-6",
    question: "What gets wetter and wetter the more it dries?",
    answer: "A towel",
    category: "Classic Riddle",
    difficulty: "Easy",
  },
  {
    id: "r-7",
    question: "I have branches, but no fruit, trunk, or leaves. What am I?",
    answer: "A bank",
    category: "Wordplay",
    difficulty: "Medium",
  },
  {
    id: "r-8",
    question: "What can you catch, but not throw?",
    answer: "A cold",
    category: "Everyday Riddle",
    difficulty: "Easy",
  },
  {
    id: "r-9",
    question: "Forward I am heavy, but backward I am not. What am I?",
    answer: "Ton",
    category: "Wordplay",
    difficulty: "Hard",
  },
  {
    id: "r-10",
    question: "What has cities, but no houses; forests, but no trees; and water, but no fish?",
    answer: "A map",
    category: "Geography",
    difficulty: "Easy",
  },
  {
    id: "r-11",
    question: "What runs around the whole backyard without ever moving?",
    answer: "A fence",
    category: "Spatial Logic",
    difficulty: "Medium",
  },
  {
    id: "r-12",
    question: "What has words, but never speaks?",
    answer: "A book",
    category: "Classic Logic",
    difficulty: "Easy",
  },
  {
    id: "r-13",
    question: "I am always hungry and must be fed; the finger I touch will soon turn red. What am I?",
    answer: "Fire",
    category: "Poetic Riddle",
    difficulty: "Medium",
  },
  {
    id: "r-14",
    question: "What belongs to you, but other people use it more than you do?",
    answer: "Your name",
    category: "Identity Riddle",
    difficulty: "Easy",
  },
  {
    id: "r-15",
    question: "I shave every day, but my beard stays the same. What am I?",
    answer: "A barber",
    category: "Lateral Thinking",
    difficulty: "Medium",
  },
  {
    id: "r-16",
    question: "What begins with T, ends with T, and has T in it?",
    answer: "A teapot",
    category: "Wordplay",
    difficulty: "Easy",
  },
];

export default function RiddlePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // 1. Room Code and Identity Management
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2. Riddle and Game States
  const [riddles, setRiddles] = useState<RiddleItem[]>(FALLBACK_RIDDLES);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(180); // 3 minutes default
  const [initiatingSession, setInitiatingSession] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);

  // 3. Answer and Turn States
  const [myAnswerInput, setMyAnswerInput] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [myAnswerSubmitted, setMyAnswerSubmitted] = useState<any>(null);
  const [partnerAnswerSubmitted, setPartnerAnswerSubmitted] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context
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

  const playChime = useCallback((freq = 520, duration = 0.15) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
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
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.38);
        }, idx * 120);
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

  // Fetch DB Riddles and Sessions if authenticated
  const fetchLobbyData = useCallback(async () => {
    try {
      const { data: rData } = await supabase.from("riddles").select("*");
      if (rData && rData.length > 0) {
        setRiddles(rData);
      }
    } catch {}

    if (pair?.id) {
      try {
        const { data: sData } = await supabase
          .from("riddle_sessions")
          .select("*, riddles (question, answer, category, difficulty)")
          .eq("pair_id", pair.id)
          .order("started_at", { ascending: false });
        if (sData) setSessions(sData);
      } catch {}
    }
    setFetching(false);
  }, [supabase, pair?.id]);

  useEffect(() => {
    fetchLobbyData();
  }, [fetchLobbyData]);

  // Realtime Broadcast Channel for Room Sync
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    const channel = supabase.channel(`riddle-room-${roomCode}`, {
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
      .on("broadcast", { event: "riddle-started" }, ({ payload }: any) => {
        if (payload?.session && payload.startedBy !== myEffectiveId) {
          setActiveSession(payload.session);
          setMyAnswerSubmitted(null);
          setPartnerAnswerSubmitted(null);
          setMyAnswerInput("");
          setIsSoloMode(false);
          setPinnedToMemories(false);
          playChime(640, 0.2);
        }
      })
      .on("broadcast", { event: "riddle-locked" }, ({ payload }: any) => {
        if (payload?.userId !== myEffectiveId) {
          setPartnerAnswerSubmitted({
            user_id: payload.userId,
            answer_text: payload.answer_text,
          });
          playChime(780, 0.25);
        }
      })
      .on("broadcast", { event: "riddle-revealed" }, ({ payload }: any) => {
        setActiveSession((prev: any) => ({ ...prev, status: "revealed" }));
        if (payload?.partnerAns) {
          setPartnerAnswerSubmitted(payload.partnerAns);
        }
        playFanfare();
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
  }, [roomCode, myEffectiveId, isGuestPromptOpen, effectiveDisplayName, supabase, playChime, playFanfare]);

  // Timer Countdown Calculation
  useEffect(() => {
    if (!activeSession || activeSession.status === "revealed" || !activeSession.timer_seconds) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const startMs = parseISO(activeSession.started_at).getTime();
      const nowMs = new Date().getTime();
      const elapsed = Math.floor((nowMs - startMs) / 1000);
      const remaining = activeSession.timer_seconds - elapsed;

      if (remaining <= 0) {
        setSecondsRemaining(0);
        triggerReveal();
      } else {
        setSecondsRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Trigger Final Reveal
  const triggerReveal = useCallback(() => {
    if (!activeSession || activeSession.status === "revealed") return;

    setActiveSession((prev: any) => ({ ...prev, status: "revealed" }));
    playFanfare();

    if (channelRef.current && !isSoloMode) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "riddle-revealed",
          payload: { partnerAns: myAnswerSubmitted },
        });
      } catch {}
    }
  }, [activeSession, isSoloMode, myAnswerSubmitted, playFanfare]);

  // Reveal automatically once both participants submit
  useEffect(() => {
    if (activeSession && activeSession.status !== "revealed" && myAnswerSubmitted && partnerAnswerSubmitted) {
      triggerReveal();
    }
  }, [activeSession, myAnswerSubmitted, partnerAnswerSubmitted, triggerReveal]);

  // Start Riddle Session (PVP or Solo)
  const handleStartRiddle = (solo = false) => {
    if (initiatingSession || riddles.length === 0) return;
    setInitiatingSession(true);
    setIsSoloMode(solo);
    setError(null);
    setPinnedToMemories(false);

    const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];
    const newSession = {
      id: `riddle_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      riddle_id: randomRiddle.id,
      riddles: randomRiddle,
      timer_seconds: selectedTimer,
      status: "active",
      started_at: new Date().toISOString(),
      is_solo: solo,
    };

    setActiveSession(newSession);
    setMyAnswerSubmitted(null);
    setPartnerAnswerSubmitted(null);
    setMyAnswerInput("");
    setInitiatingSession(false);
    playChime(580, 0.2);

    if (!solo && channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "riddle-started",
          payload: { session: newSession, startedBy: myEffectiveId },
        });
      } catch {}
    }
  };

  // Lock in player answer
  const handleLockIn = () => {
    if (!activeSession || submittingAnswer || myAnswerSubmitted) return;
    setSubmittingAnswer(true);

    const ansText = myAnswerInput.trim() || "No answer submitted";
    const mySub = {
      user_id: myEffectiveId,
      user_name: effectiveDisplayName,
      answer_text: ansText,
    };
    setMyAnswerSubmitted(mySub);
    playChime(720, 0.2);

    if (isSoloMode) {
      // Simulate Cozy Bot answering with a gentle delay
      setTimeout(() => {
        const correctAns = activeSession.riddles?.answer || "";
        const willGuessCorrectly = Math.random() < 0.72;
        let botGuess = correctAns;
        if (!willGuessCorrectly) {
          const alternateGuesses = ["Maybe a shadow?", "A mirror?", "Time itself?", "A clock ticking?"];
          botGuess = alternateGuesses[Math.floor(Math.random() * alternateGuesses.length)];
        }
        setPartnerAnswerSubmitted({
          user_id: "cozy_bot",
          user_name: "Cozy Bot",
          answer_text: botGuess,
        });
        playChime(820, 0.2);
      }, 1600 + Math.random() * 1200);
    } else if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "riddle-locked",
          payload: { userId: myEffectiveId, answer_text: ansText },
        });
      } catch {}
    }

    setSubmittingAnswer(false);
  };

  // Copy Room Link
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/riddle?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // Guest Name Submit
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
    riddleQuestion: string,
    riddleAnswer: string,
    isSolved: boolean,
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

    // Header stamp
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAIRFECT KEEPSAKE : RIDDLE NIGHT REPORT", canvas.width / 2, 105);

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
    ctx.fillStyle = "#8C7A68";
    ctx.font = "14px monospace";
    ctx.fillText(dateStr, canvas.width / 2, 135);

    // Horizontal divider
    ctx.strokeStyle = "#DECBC0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 165);
    ctx.lineTo(canvas.width - 100, 165);
    ctx.stroke();

    // Couple detectives
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  ♡  ${userB}`, canvas.width / 2, 225);

    ctx.fillStyle = "#8C7A68";
    ctx.font = "13px monospace";
    ctx.fillText("PARTNERS IN LATERAL LOGIC", canvas.width / 2, 255);

    // Verdict Badge Box
    ctx.fillStyle = isSolved ? "#EBF7EE" : "#FFF4ED";
    ctx.strokeStyle = isSolved ? "#A7D8B1" : "#F8CDB4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(140, 290, canvas.width - 280, 80, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isSolved ? "#236B36" : "#A3471F";
    ctx.font = "bold 24px serif";
    ctx.fillText(isSolved ? "CASE SOLVED! 🔍 ✨" : "CASE CLOSED : A VALIANT EFFORT! 📜", canvas.width / 2, 340);

    // Riddle Question Box
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E8DED2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 400, canvas.width - 160, 260, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 13px monospace";
    ctx.fillText("THE RIDDLE", canvas.width / 2, 435);

    // Word wrap question text
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "italic 22px serif";
    const words = riddleQuestion.split(" ");
    let line = "";
    let y = 485;
    const maxLineW = canvas.width - 240;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && i > 0) {
        ctx.fillText(line.trim(), canvas.width / 2, y);
        line = words[i] + " ";
        y += 34;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), canvas.width / 2, y);

    // Correct Answer Stamp
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 13px monospace";
    ctx.fillText("OFFICIAL SOLUTION", canvas.width / 2, 705);

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold italic 36px serif";
    ctx.fillText(`"${riddleAnswer}"`, canvas.width / 2, 755);

    // Detective Answers Comparison
    ctx.strokeStyle = "#E4D5C5";
    ctx.beginPath();
    ctx.moveTo(100, 810);
    ctx.lineTo(canvas.width - 100, 810);
    ctx.stroke();

    // Box for User A
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(90, 840, 330, 140, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${userA.toUpperCase()}'S GUESS`, 255, 875);

    ctx.fillStyle = "#2D1F2D";
    ctx.font = "italic bold 18px serif";
    ctx.fillText(`"${myAnswerSubmitted?.answer_text || "None"}"`, 255, 925);

    // Box for User B
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(480, 840, 330, 140, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${userB.toUpperCase()}'S GUESS`, 645, 875);

    ctx.fillStyle = "#2D1F2D";
    ctx.font = "italic bold 18px serif";
    ctx.fillText(`"${partnerAnswerSubmitted?.answer_text || "None"}"`, 645, 925);

    // Bottom Decorative Wax Stamp & Footer
    ctx.fillStyle = "#C49A45";
    ctx.font = "bold 20px serif";
    ctx.fillText("✦ PAIRFECT DETECTIVE ARCHIVE ✦", canvas.width / 2, 1050);

    ctx.fillStyle = "#A89482";
    ctx.font = "12px monospace";
    ctx.fillText("Preserved in the lovers' sanctuary · pairfect.site", canvas.width / 2, 1085);

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
      const isSolved =
        checkCorrectAnswer(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ||
        checkCorrectAnswer(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer);

      const { error } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Riddle Night: "${activeSession.riddles?.answer}" 🔍`,
        description: `Solved a co-op lateral riddle! ${isSolved ? "Case Solved together!" : "Valiant sleuthing effort!"} Question: "${activeSession.riddles?.question}". Your answer: "${myAnswerSubmitted?.answer_text}". ${effectivePartnerName}'s answer: "${partnerAnswerSubmitted?.answer_text}".`,
        moment_date: new Date().toISOString().split("T")[0],
      });

      if (!error) {
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
      const isSolved =
        checkCorrectAnswer(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ||
        checkCorrectAnswer(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer);

      const dataUrl = await generateKeepsakeImage(
        activeSession.riddles?.question || "",
        activeSession.riddles?.answer || "",
        isSolved,
        effectiveDisplayName,
        effectivePartnerName
      );

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `pairfect-riddle-keepsake-${Date.now()}.png`;
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

  const isCaseSolved =
    checkCorrectAnswer(myAnswerSubmitted?.answer_text, activeSession?.riddles?.answer) ||
    checkCorrectAnswer(partnerAnswerSubmitted?.answer_text, activeSession?.riddles?.answer);

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-16 bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Guest Nickname Modal */}
      {isGuestPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-stone-800 text-[#E11D48] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif italic text-2xl font-bold text-stone-900">Join Riddle Night</h3>
              <p className="text-xs text-stone-600">
                You were invited to crack co-op brain teasers in Room <span className="font-mono font-bold text-[#E11D48]">{roomCode}</span>.
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
                className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] hover:opacity-95 disabled:opacity-50 cursor-pointer transition-all"
              >
                Join the Room
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-stone-800 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
            >
              <Share2 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span className="font-mono font-bold">Room: {roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {partnerOnline && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border-2 border-emerald-600 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                {effectivePartnerName} sleuthing live
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
        {!activeSession && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Sanctuary Card with Mascot */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-[#FAF9F6] p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.7)]">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>OUR DETECTIVE NOOK · RIDDLE NIGHT</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-3">
                    <Gamepad2 className="w-8 h-8 text-[#E11D48]" />
                    <span>Riddle Night</span>
                  </h1>
                  <p className="text-sm text-stone-600 leading-relaxed font-sans">
                    Test your lateral thinking together! Pick a timer limit, submit private deductions, and unveil whether your minds harmonized to crack the case.
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                  <CoupleBeansMascot className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* Launch Card */}
            <div className="rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3.5 text-left w-full md:w-auto">
                <p className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">
                  Configure Riddle Timer
                </p>
                <div className="flex gap-2">
                  {[
                    { label: "3 Minutes", value: 180 },
                    { label: "5 Minutes", value: 300 },
                    { label: "Untimed", value: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedTimer(opt.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                        selectedTimer === opt.value
                          ? "bg-stone-900 text-white border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                          : "bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-800 hover:bg-stone-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleStartRiddle(false)}
                  disabled={initiatingSession || riddles.length === 0}
                  className="inline-flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  {initiatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gamepad2 className="w-4 h-4" />}
                  <span>Start Co-op Riddle 🚀</span>
                </button>

                <button
                  onClick={() => handleStartRiddle(true)}
                  disabled={initiatingSession || riddles.length === 0}
                  className="inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-xl text-xs font-bold text-stone-800 bg-rose-50 hover:bg-rose-100 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-[#E11D48]" />
                  <span>Team up with Cozy Bot 🤖</span>
                </button>
              </div>
            </div>

            {/* Session History Logs */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-[#E11D48]" />
                <span>Riddle Case Archives</span>
              </h2>

              {fetching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[#E11D48] animate-spin mx-auto" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-500 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  No previous riddle records found. Click above to kick off your first case!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessions.slice(0, 4).map((s: any) => {
                    const riddleInfo = s.riddles;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSession(s);
                          setMyAnswerSubmitted(null);
                          setPartnerAnswerSubmitted(null);
                        }}
                        className="rounded-2xl border-2 border-stone-800 bg-white p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                              {s.status}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono font-bold">
                              {s.started_at ? format(parseISO(s.started_at), "MMM d, h:mm a") : ""}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-stone-900 line-clamp-2">
                            "{riddleInfo?.question}"
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between text-xs">
                          <span className="text-stone-500 font-mono text-[10px] font-bold">SOLUTION</span>
                          <span className="font-bold text-[#E11D48]">
                            {riddleInfo?.answer}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE SESSION VIEW */}
        {activeSession && (
          <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in">
            {/* Header Details */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-stone-200">
              <button
                onClick={() => {
                  setActiveSession(null);
                  fetchLobbyData();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 uppercase font-mono tracking-widest cursor-pointer px-3 py-1.5 rounded-xl border-2 border-stone-800 bg-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Riddle Lobby</span>
              </button>

              <div className="text-right">
                <span className="bg-rose-100 text-rose-900 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                  {isSoloMode ? "SOLO CO-OP (COZY BOT)" : `ROOM : ${roomCode}`}
                </span>
                <p className="text-[10px] text-stone-500 uppercase font-mono mt-1 font-bold">
                  {activeSession.riddles?.difficulty} • {activeSession.riddles?.category}
                </p>
              </div>
            </div>

            {/* Riddle Display Board */}
            <div className="rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-8 text-center relative overflow-hidden">
              {/* Question */}
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-mono font-bold text-[#E11D48] uppercase tracking-widest">
                  Can you crack this together?
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 leading-normal max-w-xl mx-auto">
                  "{activeSession.riddles?.question}"
                </h2>
              </div>

              {/* Circular Countdown Timer */}
              {secondsRemaining !== null && secondsRemaining > 0 && activeSession.status !== "revealed" && (
                <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="36" className="stroke-stone-200 fill-none" strokeWidth="4" />
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        className={`fill-none transition-all duration-1000 ${
                          secondsRemaining < 30 ? "stroke-red-500" : "stroke-[#E11D48]"
                        }`}
                        strokeWidth="4"
                        strokeDasharray="226.2"
                        strokeDashoffset={226.2 - (226.2 * secondsRemaining) / (activeSession.timer_seconds || 1)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-mono font-black text-stone-900">
                      {secondsRemaining}s
                    </div>
                  </div>
                </div>
              )}

              {/* Input Response Box */}
              {!myAnswerSubmitted && activeSession.status !== "revealed" && (
                <div className="max-w-md mx-auto space-y-4 relative z-10">
                  <textarea
                    value={myAnswerInput}
                    onChange={(e) => setMyAnswerInput(e.target.value)}
                    placeholder="Type your confidential deduction here..."
                    className="w-full p-4 rounded-2xl border-2 border-stone-800 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48] h-24 resize-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                  />

                  <button
                    onClick={handleLockIn}
                    disabled={submittingAnswer || !myAnswerInput.trim()}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock In My Deduction 🔒</span>
                  </button>
                </div>
              )}

              {/* Locked in waiting screen */}
              {myAnswerSubmitted && !partnerAnswerSubmitted && activeSession.status !== "revealed" && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold text-stone-900">
                    Your answer has been locked in!
                  </p>
                  <p className="text-xs text-stone-500">
                    {isSoloMode
                      ? "Cozy Bot is pondering the clues..."
                      : partnerOnline
                      ? `Waiting for ${effectivePartnerName} to lock in...`
                      : `${effectivePartnerName} has not locked in yet. Awaiting deduction...`}
                  </p>
                </div>
              )}

              {/* Reveal Answers Board */}
              {activeSession.status === "revealed" && (
                <div className="space-y-6 relative z-10 text-left">
                  {/* Correct Solution Card */}
                  <div className="rounded-2xl border-2 border-stone-800 bg-amber-50 p-5 space-y-2 flex items-start justify-between shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-widest">
                        Official Solution
                      </p>
                      <p className="text-xl font-serif font-black text-stone-900 mt-1">
                        "{activeSession.riddles?.answer}"
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-stone-800 text-amber-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Guess Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Your Guess */}
                    <div
                      className={`rounded-2xl border-2 border-stone-800 p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] space-y-2 ${
                        checkCorrectAnswer(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer)
                          ? "bg-emerald-50"
                          : "bg-rose-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest">
                          Your Guess
                        </span>
                        {checkCorrectAnswer(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-200 border border-emerald-800 px-2 py-0.5 rounded-full">
                            Solved ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-rose-900 bg-rose-200 border border-rose-800 px-2 py-0.5 rounded-full">
                            Close!
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-stone-900">
                        "{myAnswerSubmitted?.answer_text || "No submission"}"
                      </p>
                    </div>

                    {/* Partner Guess */}
                    <div
                      className={`rounded-2xl border-2 border-stone-800 p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] space-y-2 ${
                        checkCorrectAnswer(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer)
                          ? "bg-emerald-50"
                          : "bg-rose-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest">
                          {effectivePartnerName}'s Guess
                        </span>
                        {checkCorrectAnswer(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-200 border border-emerald-800 px-2 py-0.5 rounded-full">
                            Solved ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-rose-900 bg-rose-200 border border-rose-800 px-2 py-0.5 rounded-full">
                            Close!
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-stone-900">
                        "{partnerAnswerSubmitted?.answer_text || "No submission"}"
                      </p>
                    </div>
                  </div>

                  {/* POST-RIDDLE MASTER SLEUTHS KEEPSAKE CERTIFICATE */}
                  <div className="relative overflow-hidden rounded-3xl border-2 border-stone-800 bg-[#FAF6F0] text-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] mt-6">
                    <div className="border-2 border-dashed border-stone-400 rounded-2xl p-5 space-y-4">
                      <div className="text-center border-b-2 border-stone-300 pb-2 space-y-1">
                        <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#E11D48]">
                          PAIRFECT KEEPSAKE : RIDDLE NIGHT REPORT
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
                          {isSoloMode && <Bot className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="text-center py-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${
                          isCaseSolved
                            ? "bg-emerald-100 text-emerald-950 border-stone-800"
                            : "bg-amber-100 text-amber-950 border-stone-800"
                        } shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]`}>
                          <Search className="w-3.5 h-3.5" />
                          <span>{isCaseSolved ? "Case Solved! Brilliant teamwork!" : "Case Closed : Valiant effort!"}</span>
                        </span>
                        <p className="text-base font-serif italic font-bold text-stone-900 mt-2">
                          "{activeSession.riddles?.question}"
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
                          className="py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-stone-50 border-2 border-stone-800 text-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] rounded-xl"
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
                        setActiveSession(null);
                        setMyAnswerSubmitted(null);
                        setPartnerAnswerSubmitted(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
                    >
                      Play Another Riddle 🚀
                    </button>
                  </div>
                </div>
              )}

              {/* Status footer before reveal */}
              {secondsRemaining !== 0 && activeSession.status !== "revealed" && (
                <div className="flex items-center justify-center gap-6 border-t-2 border-stone-100 pt-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${myAnswerSubmitted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span className="font-semibold text-stone-700">You: {myAnswerSubmitted ? "Locked in 🔒" : "Solving 🤔"}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${partnerAnswerSubmitted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span className="font-semibold text-stone-700">{effectivePartnerName}: {partnerAnswerSubmitted ? "Locked in 🔒" : "Solving 🤔"}</span>
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
