"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Gamepad2, Check, X, Loader2, AlertCircle, 
  HelpCircle, Trophy, Sparkles, Send, Lock, Unlock, 
  ArrowLeft, RefreshCw, Smile, Users, Heart, Star, Flame, Coffee, Compass, Utensils
} from "lucide-react";

// The 14 Quiz Packs
const quizPacks = [
  {
    id: "cute-sweet",
    title: "Cute & Sweet",
    emoji: "🌸",
    tag: "★ Most played",
    description: "Cute questions about habits, love languages, and pet peeves.",
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
    description: "Playful prompts about desires, intimacy, and sparks.",
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
    description: "High-stakes questions about secrets and quirks.",
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
    description: "House styles, children, and aging together.",
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
    description: "Hot questions and surprise double-points rounds.",
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
    description: "The ultimate test to find your exact match.",
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
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [gameState, setGameState] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [myAnswerInput, setMyAnswerInput] = useState("");
  const [partnerAnswerText, setPartnerAnswerText] = useState("");
  
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  
  const [gradingProgress, setGradingProgress] = useState(false);
  const channelRef = useRef<any>(null);

  // Initialize and Sync Realtime Channels
  useEffect(() => {
    if (loading || !pair || !user) return;

    // Try to load any existing locally saved state
    const saved = localStorage.getItem(`quiz-game-${pair.id}`);
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

    const channel = supabase.channel(`quiz-broadcast-${pair.id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "game-state" }, ({ payload }: any) => {
        setGameState(payload.gameState);
        localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(payload.gameState));
        const pack = quizPacks.find(p => p.id === payload.gameState.packId);
        setSelectedPack(pack || null);
        // Reset local answer input if question index changed
        if (payload.gameState.lockedIn && !payload.gameState.lockedIn[user.id]) {
          setMyAnswerInput("");
          setPartnerAnswerText("");
        }
      })
      .on("broadcast", { event: "request-state" }, () => {
        // If we have an active game, broadcast it back
        const current = localStorage.getItem(`quiz-game-${pair.id}`);
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
          localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(updated));
          return updated;
        });
      })
      .on("broadcast", { event: "typing-state" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          setPartnerTyping(payload.isTyping);
        }
      })
      .on("broadcast", { event: "reveal-answer" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          setPartnerAnswerText(payload.answer);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const presences = channel.presenceState();
        const userKeys = Object.keys(presences);
        // If partner key is present
        const isPartnerOnline = userKeys.some(key => key !== user.id);
        setPartnerOnline(isPartnerOnline);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          // Send request state to find if partner has game active
          channel.send({ type: "broadcast", event: "request-state", payload: {} });
          // Track presence
          channel.track({ userId: user.id, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, pair, user]);

  // Handle countdown triggers
  useEffect(() => {
    if (!gameState || !user) return;
    const bothLocked = gameState.lockedIn[user.id] && gameState.lockedIn[partner?.id || ""];
    
    if (bothLocked && !gameState.revealed && countdown === null) {
      setCountdown(3);
    }
  }, [gameState, countdown, user, partner]);

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null || !user || !pair) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished! Trigger Reveal
      setCountdown(null);
      
      // Broadcast our answer to partner
      channelRef.current?.send({
        type: "broadcast",
        event: "reveal-answer",
        payload: { userId: user.id, answer: myAnswerInput }
      });

      // Update state locally
      setGameState((prev: any) => {
        const updated = {
          ...prev,
          revealed: true,
          answers: {
            ...prev.answers,
            [prev.currentQuestionIndex]: {
              ...prev.answers[prev.currentQuestionIndex],
              [user.id]: myAnswerInput
            }
          }
        };
        localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [countdown, myAnswerInput, pair, user]);

  // Merge partner's answer once received
  useEffect(() => {
    if (partnerAnswerText && gameState && gameState.revealed && user && pair) {
      setGameState((prev: any) => {
        const currentAnswers = prev.answers[prev.currentQuestionIndex] || {};
        if (currentAnswers[partner?.id || ""] === partnerAnswerText) return prev;
        
        const updated = {
          ...prev,
          answers: {
            ...prev.answers,
            [prev.currentQuestionIndex]: {
              ...currentAnswers,
              [partner?.id || ""]: partnerAnswerText,
              [user.id]: myAnswerInput // assure mine is locked in
            }
          }
        };
        localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [partnerAnswerText, gameState, partner, user, myAnswerInput, pair]);

  // Start a new pack game
  const handleStartGame = (pack: any) => {
    if (!pair || !user) return;

    const initial: any = {
      packId: pack.id,
      currentQuestionIndex: 0,
      answers: {
        0: {}
      },
      lockedIn: {
        [user.id]: false,
        [partner?.id || ""]: false
      },
      revealed: false,
      gradings: {},
      turnOwnerId: user.id, // User who is the subject of Q0
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
    localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(initial));

    channelRef.current?.send({
      type: "broadcast",
      event: "game-state",
      payload: { gameState: initial }
    });
  };

  // Typing state broadcasting
  const handleTyping = (text: string) => {
    if (!user) return;
    setMyAnswerInput(text);
    if (!typing) {
      setTyping(true);
      channelRef.current?.send({
        type: "broadcast",
        event: "typing-state",
        payload: { userId: user.id, isTyping: true }
      });
    }
    // Timeout to clear typing indicator
    const timeout = setTimeout(() => {
      setTyping(false);
      channelRef.current?.send({
        type: "broadcast",
        event: "typing-state",
        payload: { userId: user.id, isTyping: false }
      });
    }, 1500);
    return () => clearTimeout(timeout);
  };

  // Lock in Answer
  const handleLockIn = () => {
    if (!gameState || !myAnswerInput.trim() || !user || !pair) return;

    // Broadcast lock-in event
    channelRef.current?.send({
      type: "broadcast",
      event: "lock-in",
      payload: { userId: user.id }
    });

    setGameState((prev: any) => {
      const updated = {
        ...prev,
        lockedIn: {
          ...prev.lockedIn,
          [user.id]: true
        }
      };
      localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Log to database in background
  const logQuizStepToDb = async (questionText: string, correctAnswer: string, guessText: string, isCorrect: boolean) => {
    if (!pair || !user) return;
    try {
      const isSubjectMe = gameState.turnOwnerId === user.id;
      const creatorId = isSubjectMe ? user.id : partner?.id;
      if (!creatorId) return;

      // 1. Insert question
      const { data: qData, error: qErr } = await supabase
        .from("quiz_questions")
        .insert({
          pair_id: pair.id,
          created_by: creatorId,
          question_text: questionText,
          correct_answer: correctAnswer,
        })
        .select("id")
        .single();

      if (qErr) throw qErr;

      // 2. Insert guess
      const guesserId = isSubjectMe ? partner?.id : user.id;
      if (guesserId) {
        const { error: gErr } = await supabase
          .from("quiz_guesses")
          .insert({
            question_id: qData.id,
            guessed_by: guesserId,
            guess_text: guessText,
            status: isCorrect ? "correct" : "incorrect",
          });
        if (gErr) throw gErr;
      }
    } catch (e) {
      console.error("Error logging trivia state to DB:", e);
    }
  };

  // Save completed quiz session score metrics to Supabase
  const saveQuizSessionToDb = async (finalCorrect: number, finalTotal: number) => {
    if (!pair || !selectedPack) return;
    try {
      console.log("[QuizPage] Persisting completed quiz session to DB...");
      const { error } = await supabase
        .from("quiz_history")
        .insert({
          pair_id: pair.id,
          pack_id: selectedPack.id,
          score_correct: finalCorrect,
          score_total: finalTotal
        });

      if (error) throw error;
      console.log("[QuizPage] Quiz history saved successfully!");
    } catch (e) {
      console.error("Error saving quiz session to DB:", e);
    }
  };

  // Grade Guesses & Move to Next Question
  const handleGrade = async (isCorrect: boolean) => {
    if (!gameState || !selectedPack || gradingProgress || !user || !pair) return;
    setGradingProgress(true);

    const currentQIndex = gameState.currentQuestionIndex;
    const questionText = selectedPack.questions[currentQIndex];
    const isSubjectMe = gameState.turnOwnerId === user.id;

    // Calculate answers & guesses mapping
    const subjectId = gameState.turnOwnerId;
    const guesserId = isSubjectMe ? partner?.id : user.id;
    
    const correctAnswer = gameState.answers[currentQIndex]?.[subjectId] || "";
    const guessAnswer = gameState.answers[currentQIndex]?.[guesserId || ""] || "";

    // Write to Supabase Quiz Trivia DB in background for permanent metrics / History compatibility
    await logQuizStepToDb(questionText, correctAnswer, guessAnswer, isCorrect);

    const isDoublePoints = selectedPack.id === "double-points" || selectedPack.id === "spicy-twists";
    const pointsAwarded = isCorrect ? (isDoublePoints ? 2 : 1) : 0;

    const finalCorrect = gameState.scores.correct + pointsAwarded;
    const finalTotal = gameState.scores.total + (isDoublePoints ? 2 : 1);

    const nextQuestionIndex = currentQIndex + 1;
    const isFinished = nextQuestionIndex >= selectedPack.questions.length;

    if (isFinished) {
      await saveQuizSessionToDb(finalCorrect, finalTotal);
    }

    // Alternate Subject Turns for next question
    const nextTurnOwnerId = gameState.turnOwnerId === user.id ? partner?.id : user.id;

    const updated = {
      ...gameState,
      currentQuestionIndex: nextQuestionIndex,
      revealed: false,
      lockedIn: {
        [user.id]: false,
        [partner?.id || ""]: false
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
    localStorage.setItem(`quiz-game-${pair.id}`, JSON.stringify(updated));

    // Broadcast next step to partner
    channelRef.current?.send({
      type: "broadcast",
      event: "game-state",
      payload: { gameState: updated }
    });

    setGradingProgress(false);
  };

  // Exit current game
  const handleExitGame = () => {
    if (!pair) return;
    localStorage.removeItem(`quiz-game-${pair.id}`);
    setGameState(null);
    setSelectedPack(null);
    setMyAnswerInput("");
    setPartnerAnswerText("");
    
    // Broadcast end
    channelRef.current?.send({
      type: "broadcast",
      event: "game-state",
      payload: { gameState: null }
    });
  };

  // Rendering Loader
  if (loading || !user || !pair) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const partnerName = partner?.display_name || "Partner";

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY / SELECTION SCREEN */}
        {!gameState && (
          <div className="space-y-8">
            {/* Header Description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border/40 pb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-pink-500/10 text-pink-500 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-pink-500/20">
                    ★ Most played
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                    ● Live now
                  </span>
                </div>
                <h1 className="text-3xl font-sans font-black tracking-tight text-foreground">
                  How Well Do You Know Me?
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Both lock in your answers privately, then reveal at the exact same second. 14 packs from cute to spicy, surprise twists like double-points and emoji-only rounds — and a compatibility score to keep at the end.
                </p>
              </div>

              {/* Status widget */}
              <div className="flex items-center space-x-3 px-4 py-2.5 rounded-button bg-card border border-border">
                <Users className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                    Partner Connection
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {partnerOnline ? `${partnerName} is Online` : `Waiting for ${partnerName}...`}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid of 14 packs */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <span>Select a Play Pack to Start</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {quizPacks.map((pack: any) => {
                  let packColor = "border-border hover:border-primary/40 bg-card";
                  if (pack.tag === "Hot" || pack.tag === "Spicy" || pack.tag === "Wild") {
                    packColor = "border-rose-500/20 hover:border-rose-500/50 bg-rose-500/5";
                  } else if (pack.tag === "New" || pack.tag === "Fun") {
                    packColor = "border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5";
                  }

                  return (
                    <div 
                      key={pack.id} 
                      className={`rounded-card border p-5 shadow-sm transition-all hover:scale-[1.01] flex flex-col justify-between ${packColor}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl select-none">{pack.emoji}</span>
                          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider bg-card px-2 py-0.5 rounded border border-border">
                            {pack.tag}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-md font-bold text-foreground font-sans">
                            {pack.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {pack.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartGame(pack)}
                        disabled={!partnerOnline}
                        className="w-full mt-4 btn-primary py-2.5 text-xs"
                      >
                        <span>Start the quiz</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE GAME VIEW */}
        {gameState && gameState.active && selectedPack && (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            
            {/* Header details bar */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={handleExitGame}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Quiz</span>
              </button>
              
              <div className="text-right">
                <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary/20">
                  {selectedPack.title} Pack {selectedPack.emoji}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Question {gameState.currentQuestionIndex + 1} of {selectedPack.questions.length}
                </p>
              </div>
            </div>

            {/* Question Display Card */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-center">
              
              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-[#f472b6] uppercase tracking-wider">
                  {gameState.turnOwnerId === user.id 
                    ? "Answer about yourself!" 
                    : `Guess about ${partnerName}`}
                </p>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-foreground leading-snug max-w-xl mx-auto">
                  "{selectedPack.questions[gameState.currentQuestionIndex]}"
                </h2>
              </div>

              {/* Reveal Countdown Overlay */}
              {countdown !== null && (
                <div className="py-6 flex flex-col items-center justify-center space-y-2">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary animate-spin flex items-center justify-center">
                    <span className="text-3xl font-black text-primary font-mono select-none animate-pulse">
                      {countdown}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-muted-foreground animate-pulse tracking-widest uppercase">
                    Locking answers & revealing...
                  </p>
                </div>
              )}

              {/* Input Forms */}
              {countdown === null && !gameState.revealed && (
                <div className="max-w-md mx-auto space-y-4">
                  {gameState.lockedIn[user.id] ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        Your answer is locked in privately!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gameState.lockedIn[partner?.id || ""] 
                          ? `Revealing instantly...` 
                          : `Waiting for ${partnerName} to lock in their answer...`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={myAnswerInput}
                        onChange={(e) => handleTyping(e.target.value)}
                        placeholder={gameState.turnOwnerId === user.id 
                          ? "Write your private answer here..." 
                          : `What do you think ${partnerName}'s answer is?`}
                        className="block w-full h-24 px-3.5 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm resize-none placeholder:text-muted-foreground/45 transition-all"
                      />
                      
                      <button
                        onClick={handleLockIn}
                        disabled={!myAnswerInput.trim()}
                        className="w-full btn-primary"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Lock In Answer 🔒</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Simultaneous Reveal view */}
              {gameState.revealed && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Polaroid comparison panels */}
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch">
                    
                    {/* Polaroid A: Subject's actual answer */}
                    <div className="flex-1 max-w-xs bg-[#faf9f6] p-4 border border-stone-200 shadow-md rotate-[-1deg] text-center flex flex-col justify-between">
                      <div className="aspect-square bg-stone-100 border border-stone-300 flex flex-col items-center justify-center p-4">
                        <p className="text-stone-800 text-lg font-bold italic font-mono break-all leading-normal">
                          "{gameState.answers[gameState.currentQuestionIndex]?.[gameState.turnOwnerId] || ""}"
                        </p>
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                          {gameState.turnOwnerId === user.id ? "Your Answer" : `${partnerName}'s Answer`}
                        </p>
                      </div>
                    </div>

                    {/* Polaroid B: Guesser's Guess */}
                    <div className="flex-1 max-w-xs bg-[#faf9f6] p-4 border border-stone-200 shadow-md rotate-[1deg] text-center flex flex-col justify-between">
                      <div className="aspect-square bg-stone-100 border border-stone-300 flex flex-col items-center justify-center p-4">
                        <p className="text-stone-800 text-lg font-bold italic font-mono break-all leading-normal">
                          "{gameState.answers[gameState.currentQuestionIndex]?.[gameState.turnOwnerId === user.id ? (partner?.id || "") : user.id] || ""}"
                        </p>
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                          {gameState.turnOwnerId === user.id ? `${partnerName}'s Guess` : "Your Guess"}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Grading panel (Subject decides if guess is correct) */}
                  <div className="max-w-md mx-auto rounded-button border border-border/80 bg-background/50 p-5 space-y-4">
                    {gameState.turnOwnerId === user.id ? (
                      <div className="space-y-3.5">
                        <p className="text-xs font-bold text-foreground">
                          👉 Was {partnerName}'s guess correct?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleGrade(true)}
                            disabled={gradingProgress}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Correct!</span>
                          </button>
                          <button
                            onClick={() => handleGrade(false)}
                            disabled={gradingProgress}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>Incorrect</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <p className="font-bold">
                          Waiting for {partnerName} to grade your guess...
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Status display footer */}
              {countdown === null && !gameState.revealed && (
                <div className="flex items-center justify-center gap-6 border-t border-border/40 pt-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${gameState.lockedIn[user.id] ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span>You: {gameState.lockedIn[user.id] ? "Locked in 🔒" : (typing ? "Typing..." : "Thinking 🤔")}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${gameState.lockedIn[partner?.id || ""] ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span>{partnerName}: {gameState.lockedIn[partner?.id || ""] ? "Locked in 🔒" : (partnerTyping ? "Typing..." : "Thinking 🤔")}</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* FINISHED SCOREBOARD SCREEN */}
        {gameState && !gameState.active && selectedPack && (
          <div className="max-w-2xl w-full mx-auto space-y-6 text-center">
            
            {/* Scorecard panel */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 relative overflow-hidden">
              
              {/* Confetti ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent pointer-events-none" />

              <div className="space-y-2 z-10 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 mb-2">
                  <Trophy className="w-8 h-8 fill-pink-500/10" />
                </div>
                <h1 className="text-3xl font-sans font-black tracking-tight text-foreground">
                  Quiz Completed!
                </h1>
                <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest font-bold">
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
                      className="stroke-muted fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#f472b6] fill-none transition-all"
                      strokeWidth="6"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (gameState.scores.correct || 0)) / (gameState.scores.total || 1)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground font-sans tracking-tight">
                      {gameState.scores.total > 0 
                        ? Math.round((gameState.scores.correct / gameState.scores.total) * 100) 
                        : 0}%
                    </span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase font-mono tracking-widest">
                      Compatibility
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">
                  You matched {gameState.scores.correct} points out of {gameState.scores.total} total weight!
                </p>
              </div>

              {/* Summary table of answers */}
              <div className="border border-border/80 rounded-button overflow-hidden text-left bg-background/40">
                <div className="bg-muted px-4 py-3 border-b border-border/80 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  Match Summary
                </div>
                <div className="divide-y divide-border/60">
                  {selectedPack.questions.map((q: string, idx: number) => {
                    const grade = gameState.gradings[idx];
                    return (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">
                            {idx + 1}. {q}
                          </p>
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <p>Actual: <span className="font-mono text-foreground font-medium">"{gameState.answers[idx]?.[gameState.turnOwnerId === user.id ? user.id : (partner?.id || "")] || ""}"</span></p>
                            <p>Guess: <span className="font-mono text-foreground font-medium">"{gameState.answers[idx]?.[gameState.turnOwnerId === user.id ? (partner?.id || "") : user.id] || ""}"</span></p>
                          </div>
                        </div>

                        <div>
                          {grade === "correct" ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-500 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="w-3.5 h-3.5" />
                              <span>Match</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-500 font-mono uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <X className="w-3.5 h-3.5" />
                              <span>Miss</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary action return to lobby */}
              <button
                onClick={handleExitGame}
                className="w-full btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Return to Lobby</span>
              </button>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
