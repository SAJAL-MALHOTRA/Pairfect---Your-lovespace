"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Gamepad2, Check, X, Loader2, AlertCircle,
  HelpCircle, Trophy, Sparkles, Send, Lock, Unlock,
  ArrowLeft, RefreshCw, Smile, Users, Heart, Star, Flame, Coffee, Compass, Utensils,
  Share2, Copy, Bookmark, Download, Bot, User, CheckCircle2, Play
} from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import AmbientSoundscapeBar from "@/components/ambient-soundscape-bar";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// The 14 Curated Quiz Packs
const quizPacks = [
  {
    id: "cute-sweet",
    title: "Cute & Sweet",
    emoji: "🌸",
    tag: "★ Most played",
    description: "Cute questions about habits, love languages, and pet peeves.",
    botAnswers: [
      "Warm morning hugs and forehead kisses",
      "When you get really excited about small things",
      "Two cozy sea otters holding hands",
      "Making warm tea and listening to soft rain",
      "Building a treehouse studio together"
    ],
    questions: [
      "What is my absolute favorite way to receive affection?",
      "What is a tiny habit of mine that you find adorable?",
      "If we were animals, what kind of animal pair would we be?",
      "What is my go-to mood lifter when I'm feeling down?",
      "Which of my childhood dreams do I still secretly cherish?"
    ]
  },
  {
    id: "deep-connection",
    title: "Deep Connection",
    emoji: "🧠",
    tag: "Live now",
    description: "Thoughtful questions about life goals, fears, and memories.",
    botAnswers: [
      "Losing touch with our everyday playfulness",
      "When we stayed up late talking about everything",
      "Making someone feel completely understood and safe",
      "That evening we cooked together and laughed endlessly",
      "Learning to be kind to myself when things get messy"
    ],
    questions: [
      "What is my biggest fear about our future together?",
      "What moment made you realize you fell for me?",
      "What is one thing I want to be remembered for?",
      "What is my absolute favorite memory of us so far?",
      "What is a lesson from my past that shaped who I am today?"
    ]
  },
  {
    id: "spicy-playful",
    title: "Spicy & Playful",
    emoji: "🔥",
    tag: "Hot",
    isPlusOnly: true,
    description: "Playful prompts about desires, intimacy, and sparks.",
    botAnswers: [
      "Under the stars on a secluded balcony",
      "Your genuine laugh and expressive eyes",
      "A surprise candlelit room with quiet music",
      "Dim fairy lights, silk blankets, and no phones",
      "When you lean in and whisper softly"
    ],
    questions: [
      "Where is the most adventurous place I'd want to kiss you?",
      "What is my favorite physical feature of yours?",
      "What is a romantic surprise I've always wanted to try?",
      "What is my idea of the perfect intimate night in?",
      "What is one thing that instantly gives me butterflies?"
    ]
  },
  {
    id: "comfort-food",
    title: "Foodie Friends",
    emoji: "🍕",
    tag: "Trending",
    description: "Comfort foods, cooking disasters, and restaurant picks.",
    botAnswers: [
      "Warm homemade pasta with garlic bread",
      "Authentic ramen and Japanese street food",
      "Iced oat milk latte or a crisp sparkling drink",
      "Definitely cooking a cozy meal together with music",
      "Anything with soggy mushrooms or raw celery"
    ],
    questions: [
      "What is my absolute comfort food after a long day?",
      "If I could only eat one cuisine for the rest of my life, what would it be?",
      "What is my go-to drink order (caffeine or alcohol)?",
      "Do I prefer cooking a meal together or ordering takeout?",
      "What is one ingredient I absolutely refuse to eat?"
    ]
  },
  {
    id: "wanderlust",
    title: "Wanderlust",
    emoji: "✈️",
    tag: "Fun",
    description: "Dream trips, packing styles, and road trip vibes.",
    botAnswers: [
      "A quiet coastal seaside village in Japan or Italy",
      "A cozy wooden cabin in the misty pine woods",
      "Definitely an over-packer just in case",
      "Salted pretzels and an indie folk road trip mix",
      "Switzerland or New Zealand for mountain views"
    ],
    questions: [
      "What is my dream travel destination right now?",
      "Would I prefer a cozy cabin in the woods or a luxury beach resort?",
      "Am I an over-packer or a light-packer?",
      "What is my favorite road trip snack or music playlist style?",
      "If we could move to any country tomorrow, where would I want to go?"
    ]
  },
  {
    id: "emoji-only",
    title: "Emoji Only",
    emoji: "💬",
    tag: "Emoji Twist",
    description: "Answer using ONLY emojis. Twists and fun guesses.",
    botAnswers: [
      "🥱☕🛌",
      "🍿🎬🥰",
      "🎨📚🎧",
      "🥹🎁✨",
      "🧑‍🍳🏡🌸"
    ],
    questions: [
      "Which emoji represents my mood when I first wake up?",
      "If our relationship was a movie, which emoji would it be?",
      "What is my favorite hobby represented in emojis?",
      "Which emoji represents my reaction to a surprise gift?",
      "What is my dream job represented in emojis?"
    ]
  },
  {
    id: "double-points",
    title: "Double Points",
    emoji: "🏆",
    tag: "High Stakes",
    isPlusOnly: true,
    description: "High-stakes questions about secrets and quirks.",
    botAnswers: [
      "Remembering lyrics to obscure songs from childhood",
      "When you tap your feet while concentrating",
      "Rewatching cozy sitcoms for the tenth time",
      "A cozy cottage surrounded by lavender and books",
      "Trying to keep up with too many deadlines at once"
    ],
    questions: [
      "What is a secret talent of mine that most people don't know?",
      "Which of your habits makes me smile the most?",
      "What is a guilty pleasure of mine I am secretly proud of?",
      "If I won the lottery tomorrow, what is the first thing I would buy?",
      "What is my absolute biggest source of stress right now?"
    ]
  },
  {
    id: "future-dreams",
    title: "Future Dreams",
    emoji: "🔮",
    tag: "New",
    isPlusOnly: true,
    description: "House styles, children, and aging together.",
    botAnswers: [
      "In a sunny home with big windows and a garden",
      "Modern Scandinavian with warm oak and soft light",
      "Two golden retrievers and endless houseplants",
      "Pottery making or growing our own vegetables",
      "Publishing a creative project or building something lasting"
    ],
    questions: [
      "Where do I see us living in 10 years?",
      "What is my dream home style (modern, rustic, city loft)?",
      "How many kids or pets do I want to have?",
      "What hobby do I want us to take up when we are old?",
      "What is one big achievement I want us to share in the future?"
    ]
  },
  {
    id: "childhood-memories",
    title: "Childhood Memories",
    emoji: "🧸",
    tag: "Retro",
    description: "First school, childhood pets, and old stories.",
    botAnswers: [
      "Building blanket forts in the living room",
      "A fluffy stray cat that visited every morning",
      "Tripping over nothing in front of the whole class",
      "An astronaut or a storybook illustrator",
      "Art class or creative writing"
    ],
    questions: [
      "What was my favorite toy or game growing up?",
      "What was the name of my first pet or childhood best friend?",
      "What was my most embarrassing school moment?",
      "What did I want to be when I grew up?",
      "What was my favorite subject in school?"
    ]
  },
  {
    id: "quirky-habits",
    title: "Quirky Habits",
    emoji: "🤪",
    tag: "Popular",
    description: "Funny things you do when no one is watching.",
    botAnswers: [
      "Twirling a strand of hair or tapping my ring",
      "Night owl who loves the quiet midnight stillness",
      "People chewing loudly with their mouth open",
      "Hogging the duvet and making a blanket burrito",
      "Yes, full conversational debates with myself"
    ],
    questions: [
      "What is a weird habit of mine that I do when I am nervous?",
      "Am I a morning person or a night owl?",
      "What is my biggest pet peeve in daily life?",
      "What is a funny quirk I have when sleeping?",
      "Do I talk to myself when I am alone?"
    ]
  },
  {
    id: "secret-desires",
    title: "Secret Desires",
    emoji: "🤫",
    tag: "Spicy",
    description: "Hidden thoughts, cute secrets, and dreams.",
    botAnswers: [
      "Running away to a seaside town for a month",
      "When we make eye contact and know what the other thinks",
      "Gentle forehead caresses and unhurried cuddle time",
      "Do you really think about me as much as I think of you?",
      "Playing piano by ear without looking at sheet music"
    ],
    questions: [
      "What is a secret dream of mine I rarely talk about?",
      "What makes me feel most connected to you?",
      "What is a love language I wish you used more often?",
      "What is one question I am always afraid to ask?",
      "What is a hidden talent of mine I wish I could master?"
    ]
  },
  {
    id: "music-vibes",
    title: "Music & Vibes",
    emoji: "🎵",
    tag: "Classic",
    description: "Favorite songs, concerts, and audio trends.",
    botAnswers: [
      "Dreamy acoustic indie and warm 70s soul",
      "Vinyl records spinning on a Sunday afternoon",
      "That slow acoustic ballad from our first road trip",
      "A cozy intimate acoustic gig with fairy lights",
      "Cello or acoustic fingerstyle guitar"
    ],
    questions: [
      "What is my absolute favorite music genre or artist?",
      "Do I prefer listening to vinyl, radio, or streaming?",
      "What is a song that always makes me think of you?",
      "Would I rather attend a massive music festival or a cozy acoustic gig?",
      "What instrument have I always wanted to learn?"
    ]
  },
  {
    id: "spicy-twists",
    title: "Spicy Twists",
    emoji: "🌶️",
    tag: "Wild",
    isPlusOnly: true,
    description: "Hot questions and surprise double-points rounds.",
    botAnswers: [
      "Late at night when everything outside is asleep",
      "Stealing away during a formal dinner for a private kiss",
      "That oversized soft sweater with messy hair",
      "Slowly, with both hands holding my face",
      "In the car looking out at the city lights"
    ],
    questions: [
      "What is my favorite time of day for intimacy?",
      "What is the wildest thing I'd do with you?",
      "What outfit or style of yours do I find most attractive?",
      "What is my favorite way to be kissed?",
      "Where is the most unusual place we've shared a spark?"
    ]
  },
  {
    id: "extreme-compat",
    title: "Extreme Compatibility",
    emoji: "⚡",
    tag: "Hard",
    isPlusOnly: true,
    description: "The ultimate test to find your exact match.",
    botAnswers: [
      "Leaving half-empty water glasses around the room",
      "Needing 15 minutes of quiet before speaking calmly",
      "Warm blanket, herbal tea, and a gripping book",
      "Do what makes your heart peaceful, not just what's expected",
      "Honesty and the ability to laugh through anything"
    ],
    questions: [
      "What is my absolute biggest pet peeve about you?",
      "How do I handle arguments or disagreements?",
      "What is my favorite way to spend a rainy day?",
      "What is the best piece of advice I have ever received?",
      "What do I value most in our relationship?"
    ]
  }
];

export default function QuizPage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const { isPlus } = useSubscription();
  const supabase = createClient();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTitle, setPaywallTitle] = useState("");
  const [gameState, setGameState] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [myAnswerInput, setMyAnswerInput] = useState("");
  const [partnerAnswerText, setPartnerAnswerText] = useState("");

  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string>("");
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Guest and Room Code State
  const [roomCode, setRoomCode] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestInput, setGuestInput] = useState<string>("");
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [myEffectiveId, setMyEffectiveId] = useState<string>("");

  // Keepsake Card State
  const [pinnedToMemories, setPinnedToMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  const [gradingProgress, setGradingProgress] = useState(false);
  const channelRef = useRef<any>(null);

  // 1. Initialize Room Code and Identity on Mount
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
  const partnerIdOrBot = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");
  const effectivePartnerName = isSoloMode ? "Cozy Bot 🌸" : (dynamicPartnerName || partner?.display_name || "Partner");

  // 2. Initialize and Sync Realtime Channels
  useEffect(() => {
    if (!roomCode || !myEffectiveId || isGuestPromptOpen) return;

    // Load any existing locally saved state
    const saved = localStorage.getItem(`quiz-game-${roomCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.active) {
          setGameState(parsed);
          const pack = quizPacks.find(p => p.id === parsed.packId);
          setSelectedPack(pack || null);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const channel = supabase.channel(`quiz-broadcast-${roomCode}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "game-state" }, ({ payload }: any) => {
        setGameState(payload.gameState);
        if (payload.gameState) {
          localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(payload.gameState));
          const pack = quizPacks.find(p => p.id === payload.gameState.packId);
          setSelectedPack(pack || null);
          setIsSoloMode(false);
          if (payload.gameState.lockedIn && !payload.gameState.lockedIn[myEffectiveId]) {
            setMyAnswerInput("");
            setPartnerAnswerText("");
          }
        } else {
          localStorage.removeItem(`quiz-game-${roomCode}`);
          setSelectedPack(null);
        }
      })
      .on("broadcast", { event: "request-state" }, () => {
        const current = localStorage.getItem(`quiz-game-${roomCode}`);
        if (current) {
          try {
            const parsed = JSON.parse(current);
            if (parsed.active) {
              channel.send({
                type: "broadcast",
                event: "game-state",
                payload: { gameState: parsed }
              });
            }
          } catch (e) {}
        }
      })
      .on("broadcast", { event: "lock-in" }, ({ payload }: any) => {
        setGameState((prev: any) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            lockedIn: {
              ...prev.lockedIn,
              [payload.userId]: true
            }
          };
          localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));
          return updated;
        });
      })
      .on("broadcast", { event: "typing-state" }, ({ payload }: any) => {
        if (payload.userId !== myEffectiveId) {
          setPartnerTyping(payload.isTyping);
        }
      })
      .on("broadcast", { event: "reveal-answer" }, ({ payload }: any) => {
        if (payload.userId !== myEffectiveId) {
          setPartnerAnswerText(payload.answer);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const presences = channel.presenceState();
        const otherEntries = Object.entries(presences)
          .filter(([key]) => key !== myEffectiveId)
          .flatMap(([_, list]) => list);

        if (otherEntries.length > 0) {
          setPartnerOnline(true);
          const info = otherEntries[0] as any;
          if (info?.user_name) {
            setDynamicPartnerName(info.user_name);
          }
        } else {
          setPartnerOnline(false);
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "request-state", payload: {} });
          channel.track({
            user_id: myEffectiveId,
            user_name: effectiveDisplayName,
            onlineAt: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myEffectiveId, isGuestPromptOpen, effectiveDisplayName, supabase]);

  // 3. Handle Countdown Triggers
  useEffect(() => {
    if (!gameState || !myEffectiveId) return;
    const partnerId = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");
    const bothLocked = gameState.lockedIn[myEffectiveId] && gameState.lockedIn[partnerId];

    if (bothLocked && !gameState.revealed && countdown === null) {
      setCountdown(3);
    }
  }, [gameState, countdown, myEffectiveId, partner?.id, isSoloMode]);

  // 4. Countdown Timer Logic
  useEffect(() => {
    if (countdown === null || !myEffectiveId) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);

      if (!isSoloMode && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "reveal-answer",
          payload: { userId: myEffectiveId, answer: myAnswerInput }
        });
      }

      setGameState((prev: any) => {
        const partnerId = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");
        const updated = {
          ...prev,
          revealed: true,
          answers: {
            ...prev.answers,
            [prev.currentQuestionIndex]: {
              ...prev.answers[prev.currentQuestionIndex],
              [myEffectiveId]: myAnswerInput,
              ...(isSoloMode ? { [partnerId]: partnerAnswerText } : {})
            }
          }
        };
        localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [countdown, myAnswerInput, myEffectiveId, roomCode, isSoloMode, partnerAnswerText, partner?.id]);

  // 5. Merge Partner Answer Once Received
  useEffect(() => {
    if (partnerAnswerText && gameState && gameState.revealed && myEffectiveId) {
      const partnerId = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");
      setGameState((prev: any) => {
        const currentAnswers = prev.answers[prev.currentQuestionIndex] || {};
        if (currentAnswers[partnerId] === partnerAnswerText) return prev;

        const updated = {
          ...prev,
          answers: {
            ...prev.answers,
            [prev.currentQuestionIndex]: {
              ...currentAnswers,
              [partnerId]: partnerAnswerText,
              [myEffectiveId]: myAnswerInput
            }
          }
        };
        localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [partnerAnswerText, gameState, partner?.id, myEffectiveId, myAnswerInput, roomCode, isSoloMode]);

  // 6. Start a New Pack Game (Partner or Solo)
  const handleStartGame = (pack: any, solo: boolean = false) => {
    if (pack.isPlusOnly && !isPlus) {
      setPaywallTitle(`${pack.title} Deck`);
      setIsPaywallOpen(true);
      return;
    }

    setIsSoloMode(solo);
    const partnerId = solo ? "cozy-bot" : (partner?.id || "partner-guest");

    const initial: any = {
      packId: pack.id,
      currentQuestionIndex: 0,
      answers: {
        0: {}
      },
      lockedIn: {
        [myEffectiveId]: false,
        [partnerId]: false
      },
      revealed: false,
      gradings: {},
      turnOwnerId: myEffectiveId,
      active: true,
      scores: {
        correct: 0,
        total: 0
      }
    };

    setGameState(initial);
    setSelectedPack(pack);
    setMyAnswerInput("");
    setPartnerAnswerText("");
    setPinnedToMemories(false);
    localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(initial));

    if (!solo && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game-state",
        payload: { gameState: initial }
      });
    }
  };

  // 7. Typing State Broadcasting
  const handleTyping = (text: string) => {
    setMyAnswerInput(text);
    if (!isSoloMode && channelRef.current && !typing) {
      setTyping(true);
      channelRef.current.send({
        type: "broadcast",
        event: "typing-state",
        payload: { userId: myEffectiveId, isTyping: true }
      });
    }

    const timeout = setTimeout(() => {
      setTyping(false);
      if (!isSoloMode && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "typing-state",
          payload: { userId: myEffectiveId, isTyping: false }
        });
      }
    }, 1500);
    return () => clearTimeout(timeout);
  };

  // 8. Lock in Answer (With Solo Bot Simulation)
  const handleLockIn = () => {
    if (!gameState || !myAnswerInput.trim()) return;

    const partnerId = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");

    if (!isSoloMode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "lock-in",
        payload: { userId: myEffectiveId }
      });
    }

    setGameState((prev: any) => {
      const updated = {
        ...prev,
        lockedIn: {
          ...prev.lockedIn,
          [myEffectiveId]: true
        }
      };
      localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));
      return updated;
    });

    // Solo Mode: Simulate Cozy Bot typing and lock-in
    if (isSoloMode) {
      setPartnerTyping(true);
      const simulatedDelay = 1400 + Math.random() * 800;

      setTimeout(() => {
        setPartnerTyping(false);
        const qIdx = gameState.currentQuestionIndex;
        const botPicks = selectedPack.botAnswers || [];
        const botChoice = botPicks[qIdx] || "Something very sweet that always makes you smile!";

        setPartnerAnswerText(botChoice);
        setGameState((prev: any) => {
          const updated = {
            ...prev,
            lockedIn: {
              ...prev.lockedIn,
              [myEffectiveId]: true,
              [partnerId]: true
            }
          };
          localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));
          return updated;
        });
      }, simulatedDelay);
    }
  };

  // 9. Grade and Move to Next Question
  const handleGrade = async (isCorrect: boolean) => {
    if (!gameState || !selectedPack || gradingProgress) return;
    setGradingProgress(true);

    const currentQIndex = gameState.currentQuestionIndex;
    const isDoublePoints = selectedPack.id === "double-points" || selectedPack.id === "spicy-twists";
    const pointsAwarded = isCorrect ? (isDoublePoints ? 2 : 1) : 0;

    const finalCorrect = gameState.scores.correct + pointsAwarded;
    const finalTotal = gameState.scores.total + (isDoublePoints ? 2 : 1);

    const nextQuestionIndex = currentQIndex + 1;
    const isFinished = nextQuestionIndex >= selectedPack.questions.length;
    const partnerId = isSoloMode ? "cozy-bot" : (partner?.id || "partner-guest");

    // Alternate Subject Turns for next question
    const nextTurnOwnerId = gameState.turnOwnerId === myEffectiveId ? partnerId : myEffectiveId;

    const updated = {
      ...gameState,
      currentQuestionIndex: nextQuestionIndex,
      revealed: false,
      lockedIn: {
        [myEffectiveId]: false,
        [partnerId]: false
      },
      gradings: {
        ...gameState.gradings,
        [currentQIndex]: isCorrect ? "correct" : "incorrect"
      },
      scores: {
        correct: finalCorrect,
        total: finalTotal
      },
      turnOwnerId: nextTurnOwnerId,
      active: !isFinished
    };

    setGameState(updated);
    setMyAnswerInput("");
    setPartnerAnswerText("");
    localStorage.setItem(`quiz-game-${roomCode}`, JSON.stringify(updated));

    if (!isSoloMode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game-state",
        payload: { gameState: updated }
      });
    }

    setGradingProgress(false);
  };

  // 10. Exit current game
  const handleExitGame = () => {
    localStorage.removeItem(`quiz-game-${roomCode}`);
    setGameState(null);
    setSelectedPack(null);
    setMyAnswerInput("");
    setPartnerAnswerText("");
    setPinnedToMemories(false);

    if (!isSoloMode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game-state",
        payload: { gameState: null }
      });
    }
  };

  // 11. Copy Room Invite Link
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/quiz?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert(`Share this room code with your partner: ${roomCode}`);
    }
  };

  // 12. Guest Modal Submit
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const clean = guestInput.trim();
    setGuestName(clean);
    localStorage.setItem("pairfect_guest_name", clean);
    setIsGuestPromptOpen(false);
  };

  // 13. Keepsake Canvas Certificate Generator
  const generateKeepsakeImage = async (
    percent: number,
    correctPts: number,
    totalPts: number,
    packTitle: string,
    packEmoji: string,
    userA: string,
    userB: string,
    matches: string[]
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
    ctx.fillText("PAIRFECT KEEPSAKE : KNOW ME QUIZ", canvas.width / 2, 105);

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

    // Couple / Player Names
    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold italic 34px serif";
    ctx.fillText(`${userA}  ♡  ${userB}`, canvas.width / 2, 230);

    // Pack Subtitle
    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${packTitle.toUpperCase()} DECK ${packEmoji}`, canvas.width / 2, 275);

    // Big Compatibility Score
    ctx.fillStyle = "#8E3D52";
    ctx.font = "italic 900 110px serif";
    ctx.fillText(`${percent}%`, canvas.width / 2, 400);

    ctx.fillStyle = "#2D1F2D";
    ctx.font = "bold 22px monospace";
    ctx.fillText("COMPATIBILITY SCORE", canvas.width / 2, 445);

    // Verdict Box
    ctx.fillStyle = "#F2E8DC";
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(100, 485, canvas.width - 200, 65, 16);
    } else {
      ctx.rect(100, 485, canvas.width - 200, 65);
    }
    ctx.fill();

    ctx.fillStyle = "#8E3D52";
    ctx.font = "bold 20px serif";
    ctx.fillText(`"${correctPts} of ${totalPts} points matched"`, canvas.width / 2, 526);

    // Match Highlights
    ctx.fillStyle = "#8C7A68";
    ctx.font = "bold 15px monospace";
    ctx.fillText("SYNCHRONIZED ANSWERS", canvas.width / 2, 600);

    let currentY = 645;
    ctx.textAlign = "left";
    if (matches.length > 0) {
      matches.slice(0, 4).forEach((item) => {
        ctx.fillStyle = "#8E3D52";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("✓", 120, currentY);

        ctx.fillStyle = "#3D2E35";
        ctx.font = "16px sans-serif";
        const truncated = item.length > 48 ? item.slice(0, 45) + "..." : item;
        ctx.fillText(truncated, 155, currentY);
        currentY += 55;
      });
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "#6E5A64";
      ctx.font = "italic 18px serif";
      ctx.fillText("Every answer brought a new surprise: opposites create the spark!", canvas.width / 2, currentY + 30);
      currentY += 70;
    }

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

  // 14. Pin Keepsake to Memory Wall
  const handlePinToMemoryWall = async () => {
    if (pinnedToMemories || isSavingMemory) return;
    if (!user || !pair?.id) {
      setPinnedToMemories(true);
      return;
    }

    try {
      setIsSavingMemory(true);
      const compatPercent = gameState.scores.total > 0
        ? Math.round((gameState.scores.correct / gameState.scores.total) * 100)
        : 0;

      const matchedQuestions = selectedPack.questions
        .filter((_: string, idx: number) => gameState.gradings[idx] === "correct")
        .slice(0, 3)
        .map((q: string) => `"${q}"`);

      const summaryText = matchedQuestions.length > 0
        ? `Top synced questions: ${matchedQuestions.join(", ")}.`
        : "Learned new things about each other across every question!";

      const { error } = await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: `Know Me Quiz: ${compatPercent}% Match in ${selectedPack.title} 💕`,
        description: `Played the ${selectedPack.title} pack together! Matched on ${gameState.scores.correct}/${gameState.scores.total} points. ${summaryText}`,
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

  // 15. Download Keepsake Certificate
  const handleDownloadKeepsake = async () => {
    try {
      setIsDownloadingCard(true);
      const compatPercent = gameState.scores.total > 0
        ? Math.round((gameState.scores.correct / gameState.scores.total) * 100)
        : 0;

      const matches = selectedPack.questions
        .filter((_: string, idx: number) => gameState.gradings[idx] === "correct")
        .map((q: string, idx: number) => {
          const actualAns = gameState.answers[idx]?.[gameState.turnOwnerId === myEffectiveId ? myEffectiveId : partnerIdOrBot] || "";
          return `${q}: ${actualAns}`;
        });

      const dataUrl = await generateKeepsakeImage(
        compatPercent,
        gameState.scores.correct,
        gameState.scores.total,
        selectedPack.title,
        selectedPack.emoji,
        effectiveDisplayName,
        effectivePartnerName,
        matches
      );

      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `pairfect-quiz-${selectedPack.id}-${effectiveDisplayName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download keepsake error:", err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // Rendering Loader
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
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-heading font-bold text-stone-900">Join Know Me Quiz</h2>
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

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pl-36 md:pr-12 pb-16 flex-1 flex flex-col justify-start z-10 animate-fade-in">

        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-5 px-1 text-xs">
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
                {effectivePartnerName} connected
              </span>
            )}
          </div>
        </div>

        {/* LOBBY / SELECTION SCREEN */}
        {!gameState && (
          <div className="space-y-6">
            {/* Hero Sanctuary Card with Mascot */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-[#FAF9F6] p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.7)]">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>OUR COMPATIBILITY NOOK · COUPLES QUIZ</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-3">
                    <Gamepad2 className="w-8 h-8 text-[#E11D48]" />
                    <span>How Well Do You Know Me?</span>
                  </h1>
                  <p className="text-sm text-stone-600 leading-relaxed font-sans">
                    Both lock in your answers privately, then reveal simultaneously. 14 decks from cute to spicy, surprise twists, and a compatibility scorecard to keep at the end.
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                  <CoupleBeansMascot className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* Grid of 14 packs */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-1.5">
                <Gamepad2 className="w-4 h-4 text-[#E11D48]" />
                <span>Select a Play Pack to Start</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {quizPacks.map((pack: any) => {
                  return (
                    <div
                      key={pack.id}
                      className="rounded-2xl border-2 border-stone-800 p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] transition-all hover:translate-y-[-2px] flex flex-col justify-between bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl select-none">{pack.emoji}</span>
                          <div className="flex items-center gap-1.5">
                            {pack.isPlusOnly && (
                              <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-stone-800 uppercase tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                                <Lock className="w-2.5 h-2.5" /> PLUS
                              </span>
                            )}
                            <span className="text-[9px] font-mono font-bold text-stone-700 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                              {pack.tag}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-md font-bold text-stone-900 font-sans">
                            {pack.title}
                          </h3>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {pack.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t-2 border-stone-100 space-y-2">
                        <button
                          onClick={() => handleStartGame(pack, false)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#E11D48] hover:bg-[#BE123C] text-white flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play with Partner</span>
                        </button>

                        <button
                          onClick={() => handleStartGame(pack, true)}
                          className="w-full py-2 rounded-xl font-bold text-xs bg-stone-50 hover:bg-stone-100 text-stone-800 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        >
                          <Bot className="w-3.5 h-3.5 text-[#E11D48]" />
                          <span>Solo vs Cozy Bot</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE QUESTION GAME SCREEN */}
        {gameState && gameState.active && selectedPack && (
          <div className="max-w-2xl w-full mx-auto space-y-6">

            {/* Top Navigation & Status */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-stone-200">
              <button
                onClick={handleExitGame}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 uppercase font-mono tracking-widest cursor-pointer px-3 py-1.5 rounded-xl border-2 border-stone-800 bg-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Deck</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-stone-600">
                  Question {gameState.currentQuestionIndex + 1} of {selectedPack.questions.length}
                </span>
                <span className="text-sm">{selectedPack.emoji}</span>
              </div>
            </div>

            {/* Question card */}
            <div className="relative rounded-3xl border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-6 overflow-hidden">
              <div className="space-y-3 text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-900 bg-rose-100 px-3 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                  {gameState.turnOwnerId === myEffectiveId
                    ? "✨ You are the Subject"
                    : `✨ Guess for ${effectivePartnerName}`}
                </span>

                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 leading-snug">
                  {selectedPack.questions[gameState.currentQuestionIndex]}
                </h2>

                <p className="text-xs text-stone-600">
                  {gameState.turnOwnerId === myEffectiveId
                    ? "Answer honestly for yourself. Your partner will guess what you typed."
                    : `Guess what ${effectivePartnerName} would say!`}
                </p>
              </div>

              {/* Countdown overlay if both locked */}
              {countdown !== null && (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 animate-fade-in">
                  <div className="text-5xl font-black font-mono text-[#E11D48] animate-bounce">
                    {countdown}
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500 font-bold">
                    Revealing Answers...
                  </p>
                </div>
              )}

              {/* Input Area (Before Countdown & Reveal) */}
              {countdown === null && !gameState.revealed && (
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <input
                      type="text"
                      disabled={gameState.lockedIn[myEffectiveId]}
                      value={myAnswerInput}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && myAnswerInput.trim()) {
                          handleLockIn();
                        }
                      }}
                      placeholder={gameState.turnOwnerId === myEffectiveId ? "Your authentic answer..." : `Your guess for ${effectivePartnerName}...`}
                      maxLength={120}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-800 bg-stone-50 text-stone-900 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#E11D48] disabled:opacity-60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                    />
                  </div>

                  {!gameState.lockedIn[myEffectiveId] ? (
                    <button
                      onClick={handleLockIn}
                      disabled={!myAnswerInput.trim()}
                      className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock In Answer</span>
                    </button>
                  ) : (
                    <div className="py-2.5 px-4 rounded-xl bg-emerald-100 border-2 border-stone-800 text-emerald-900 text-xs font-bold flex items-center justify-center space-x-2 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Answer Locked In! Waiting for {effectivePartnerName}...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Simultaneous Reveal View */}
              {gameState.revealed && (
                <div className="space-y-8 animate-fade-in">

                  {/* Polaroid comparison panels */}
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch">

                    {/* Polaroid A: Subject's actual answer */}
                    <div className="flex-1 max-w-xs bg-[#FAF6F0] p-4 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] rotate-[-1deg] text-center flex flex-col justify-between rounded-2xl">
                      <div className="aspect-square bg-white border-2 border-stone-800 flex flex-col items-center justify-center p-4 rounded-xl shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]">
                        <p className="text-stone-900 text-base font-bold italic font-serif break-words leading-relaxed">
                          "{gameState.answers[gameState.currentQuestionIndex]?.[gameState.turnOwnerId] || ""}"
                        </p>
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest font-bold">
                          {gameState.turnOwnerId === myEffectiveId ? "Your Answer" : `${effectivePartnerName}'s Answer`}
                        </p>
                      </div>
                    </div>

                    {/* Polaroid B: Guesser's Guess */}
                    <div className="flex-1 max-w-xs bg-[#FAF6F0] p-4 border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] rotate-[1deg] text-center flex flex-col justify-between rounded-2xl">
                      <div className="aspect-square bg-white border-2 border-stone-800 flex flex-col items-center justify-center p-4 rounded-xl shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]">
                        <p className="text-stone-900 text-base font-bold italic font-serif break-words leading-relaxed">
                          "{gameState.answers[gameState.currentQuestionIndex]?.[gameState.turnOwnerId === myEffectiveId ? partnerIdOrBot : myEffectiveId] || ""}"
                        </p>
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest font-bold">
                          {gameState.turnOwnerId === myEffectiveId ? `${effectivePartnerName}'s Guess` : "Your Guess"}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Grading panel */}
                  <div className="max-w-md mx-auto rounded-2xl border-2 border-stone-800 bg-stone-50 p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]">
                    <div className="space-y-3.5">
                      <p className="text-xs font-bold text-stone-900">
                        Was {gameState.turnOwnerId === myEffectiveId ? effectivePartnerName : "your"} guess close enough to count?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleGrade(true)}
                          disabled={gradingProgress}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Match! (+1 Pt)</span>
                        </button>

                        <button
                          onClick={() => handleGrade(false)}
                          disabled={gradingProgress}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                          <span>Not Quite</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Status display footer */}
              {countdown === null && !gameState.revealed && (
                <div className="flex items-center justify-center gap-6 border-t-2 border-stone-100 pt-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${gameState.lockedIn[myEffectiveId] ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span className="font-semibold text-stone-700">You: {gameState.lockedIn[myEffectiveId] ? "Locked in" : (typing ? "Typing..." : "Thinking")}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${gameState.lockedIn[partnerIdOrBot] ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span className="font-semibold text-stone-700">{effectivePartnerName}: {gameState.lockedIn[partnerIdOrBot] ? "Locked in" : (partnerTyping ? "Typing..." : "Thinking")}</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* FINISHED SCOREBOARD SCREEN & KEEPSAKE CARD */}
        {gameState && !gameState.active && selectedPack && (
          <div className="max-w-2xl w-full mx-auto space-y-6 text-center animate-fade-in">

            {/* Scorecard panel */}
            <div className="rounded-3xl border-2 border-stone-800 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] space-y-6 relative overflow-hidden">
              <div className="space-y-2 z-10 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 border-2 border-stone-800 text-[#E11D48] mb-2 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                  <Trophy className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-serif font-black tracking-tight text-stone-900">
                  Quiz Completed!
                </h1>
                <p className="text-xs text-stone-500 uppercase font-mono tracking-widest font-bold">
                  {selectedPack.title} Pack {selectedPack.emoji}
                </p>
              </div>

              {/* Compatibility score calculation circle */}
              <div className="py-6 flex flex-col items-center justify-center space-y-2 z-10 relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-stone-200 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#E11D48] fill-none transition-all"
                      strokeWidth="6"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (gameState.scores.correct || 0)) / (gameState.scores.total || 1)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-stone-900 font-sans tracking-tight">
                      {gameState.scores.total > 0
                        ? Math.round((gameState.scores.correct / gameState.scores.total) * 100)
                        : 0}%
                    </span>
                    <span className="text-[8px] font-bold text-stone-500 uppercase font-mono tracking-widest">
                      Compatibility
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-stone-900 mt-2">
                  You matched {gameState.scores.correct} points out of {gameState.scores.total} total weight!
                </p>
              </div>

              {/* Summary table of answers */}
              <div className="border-2 border-stone-800 rounded-2xl overflow-hidden text-left bg-stone-50">
                <div className="bg-stone-100 px-4 py-3 border-b-2 border-stone-800 text-xs font-mono font-bold text-stone-600 uppercase tracking-widest">
                  Match Summary
                </div>
                <div className="divide-y-2 divide-stone-200">
                  {selectedPack.questions.map((q: string, idx: number) => {
                    const grade = gameState.gradings[idx];
                    return (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-stone-900">
                            {idx + 1}. {q}
                          </p>
                          <div className="text-[11px] text-stone-600 space-y-0.5">
                            <p>Actual: <span className="font-mono text-stone-900 font-bold">"{gameState.answers[idx]?.[gameState.turnOwnerId === myEffectiveId ? myEffectiveId : partnerIdOrBot] || ""}"</span></p>
                            <p>Guess: <span className="font-mono text-stone-900 font-bold">"{gameState.answers[idx]?.[gameState.turnOwnerId === myEffectiveId ? partnerIdOrBot : myEffectiveId] || ""}"</span></p>
                          </div>
                        </div>

                        <div>
                          {grade === "correct" ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-900 font-mono uppercase bg-emerald-100 px-2 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Match</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-900 font-mono uppercase bg-rose-100 px-2 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.6)]">
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Miss</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Post-Quiz Keepsake Card */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-stone-800 bg-[#FAF6F0] text-stone-900 p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
                <div className="border-2 border-dashed border-stone-400 rounded-2xl p-5 space-y-4">

                  {/* Vintage Header */}
                  <div className="text-center border-b-2 border-stone-300 pb-3 space-y-1">
                    <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#E11D48]">
                      PAIRFECT KEEPSAKE : KNOW ME QUIZ
                    </p>
                    <p className="text-xs font-mono text-stone-600 font-bold">
                      {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
                    </p>
                  </div>

                  {/* Player Badges */}
                  <div className="flex items-center justify-between text-xs px-2 font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-[#E11D48]">
                      <User className="w-3.5 h-3.5" />
                      <span>{effectiveDisplayName}</span>
                    </div>
                    <span className="text-stone-500 font-bold">♡</span>
                    <div className="flex items-center gap-1.5 font-bold text-blue-700">
                      <span>{effectivePartnerName}</span>
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Compatibility Callout */}
                  <div className="py-2 text-center">
                    <p className="text-4xl font-serif font-black text-[#E11D48]">
                      {gameState.scores.total > 0 ? Math.round((gameState.scores.correct / gameState.scores.total) * 100) : 0}%
                    </p>
                    <p className="text-[10px] font-mono tracking-widest uppercase text-stone-600 font-bold">
                      {selectedPack.title} Deck Compatibility
                    </p>
                  </div>

                  {/* Keepsake Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handlePinToMemoryWall}
                      disabled={isSavingMemory || pinnedToMemories}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]
                        ${pinnedToMemories
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                        }`}
                    >
                      {isSavingMemory ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : pinnedToMemories ? (
                        <><Check className="w-3.5 h-3.5" /> Pinned to Memories</>
                      ) : (
                        <><Bookmark className="w-3.5 h-3.5" /> Pin to Memory Wall</>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadKeepsake}
                      disabled={isDownloadingCard}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-stone-900 border-2 border-stone-800 hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
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

              {/* Primary action return to lobby */}
              <button
                onClick={handleExitGame}
                className="w-full py-3.5 rounded-2xl font-sans font-bold text-sm text-stone-900 border-2 border-stone-800 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Return to Deck Selection</span>
              </button>

            </div>

          </div>
        )}

        {/* PLUS PAYWALL MODAL */}
        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle={paywallTitle}
          featureDescription="Includes this deck and all 14 quiz packs for both partners."
        />

      </main>

      <AmbientSoundscapeBar />
    </div>
  );
}
