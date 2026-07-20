"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Gamepad2, Check, X, Loader2, AlertCircle, 
  Trophy, Sparkles, Send, Lock, Unlock, 
  ArrowLeft, Timer, MessageSquare, Plus, RefreshCw, HelpCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { checkCorrectAnswer } from "@/lib/string-similarity";

export default function RiddlePage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [riddles, setRiddles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Lobby choices
  const [selectedTimer, setSelectedTimer] = useState<number | null>(180); // default 3 min
  const [initiatingSession, setInitiatingSession] = useState(false);

  // Active game states
  const [myAnswerInput, setMyAnswerInput] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [myAnswerSubmitted, setMyAnswerSubmitted] = useState<any>(null);
  const [partnerAnswerSubmitted, setPartnerAnswerSubmitted] = useState<any>(null);
  
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  // 1. Fetch Riddles & Historic Sessions
  const fetchLobbyData = async () => {
    if (!pair) return;
    try {
      // Fetch riddles pool
      const { data: rData } = await supabase.from("riddles").select("*");
      setRiddles(rData || []);

      // Fetch sessions
      const { data: sData, error: sErr } = await supabase
        .from("riddle_sessions")
        .select(`
          *,
          riddles (
            question,
            answer,
            category,
            difficulty
          )
        `)
        .eq("pair_id", pair.id)
        .order("started_at", { ascending: false });

      if (sErr) throw sErr;
      setSessions(sData || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load riddle sessions.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchLobbyData();

      // Realtime subscription for sessions list updates
      const listChan = supabase
        .channel(`riddles-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "riddle_sessions", filter: `pair_id=eq.${pair.id}` },
          () => fetchLobbyData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(listChan);
      };
    }
  }, [loading, pair]);

  // 2. Fetch Active Session details & answers
  const loadSessionDetails = async (sessionId: string) => {
    try {
      const { data: sess } = await supabase
        .from("riddle_sessions")
        .select(`
          *,
          riddles (
            question,
            answer,
            category,
            difficulty
          )
        `)
        .eq("id", sessionId)
        .single();

      if (!sess) return;

      const { data: answers } = await supabase
        .from("riddle_answers")
        .select("*")
        .eq("session_id", sessionId);

      const mine = answers?.find((a: any) => a.user_id === user?.id);
      const partnerAns = answers?.find((a: any) => a.user_id === partner?.id);

      setMyAnswerSubmitted(mine || null);
      setPartnerAnswerSubmitted(partnerAns || null);
      setMyAnswerInput(mine?.answer_text || "");

      setActiveSession(sess);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Realtime subscription to active session answers & status updates
  useEffect(() => {
    if (!activeSession || !user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`riddle-sync-${activeSession.id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "lock-in" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          // Fetch answers to get partner's lock status (we don't broadcast raw text to prevent cheating!)
          loadSessionDetails(activeSession.id);
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "riddle_answers", filter: `session_id=eq.${activeSession.id}` },
        (payload: any) => {
          const newAns = payload.new;
          if (newAns.user_id === user.id) {
            setMyAnswerSubmitted(newAns);
          } else {
            setPartnerAnswerSubmitted(newAns);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "riddle_sessions", filter: `id=eq.${activeSession.id}` },
        (payload: any) => {
          setActiveSession(payload.new);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const presences = channel.presenceState();
        const userKeys = Object.keys(presences);
        const isPartnerOnline = userKeys.some(key => key !== user.id);
        setPartnerOnline(isPartnerOnline);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          channel.track({ userId: user.id, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession, user]);

  // 4. Timer Countdown Sync (Server started_at calculation)
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
        handleReveal(); // Trigger reveal once time runs out
      } else {
        setSecondsRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // 5. Submit Riddle Answer
  const handleLockIn = async () => {
    if (!activeSession || submittingAnswer || myAnswerSubmitted || !user) return;
    setSubmittingAnswer(true);

    const ansText = myAnswerInput.trim() || "No answer submitted";

    try {
      const { data, error: err } = await supabase
        .from("riddle_answers")
        .insert({
          session_id: activeSession.id,
          user_id: user.id,
          answer_text: ansText
        })
        .select()
        .single();

      if (err) throw err;
      setMyAnswerSubmitted(data);

      // Broadcast lock-in event
      channelRef.current?.send({
        type: "broadcast",
        event: "lock-in",
        payload: { userId: user.id }
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to submit answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // 6. Reveal state transition (Triggered once both submit or timer finishes)
  const handleReveal = async () => {
    if (!activeSession || activeSession.status === "revealed") return;

    try {
      await supabase
        .from("riddle_sessions")
        .update({ status: "revealed" })
        .eq("id", activeSession.id);

      setActiveSession((prev: any) => ({ ...prev, status: "revealed" }));
      fetchLobbyData();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeSession && activeSession.status !== "revealed" && myAnswerSubmitted && partnerAnswerSubmitted) {
      handleReveal();
    }
  }, [activeSession, myAnswerSubmitted, partnerAnswerSubmitted]);

  // 7. Start Riddle Session
  const handleStartRiddle = async () => {
    if (!pair || riddles.length === 0 || initiatingSession || !user) return;
    setInitiatingSession(true);
    setError(null);

    try {
      // Pick a random riddle
      const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

      const { data, error: err } = await supabase
        .from("riddle_sessions")
        .insert({
          pair_id: pair.id,
          riddle_id: randomRiddle.id,
          timer_seconds: selectedTimer,
          status: "active"
        })
        .select()
        .single();

      if (err) throw err;

      loadSessionDetails(data.id);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to initiate riddle session.");
    } finally {
      setInitiatingSession(false);
    }
  };

  // 8. Fuzz Match Helper
  const checkCorrect = (userAns: string, correctAns: string) => {
    return checkCorrectAnswer(userAns, correctAns);
  };

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

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY SCREEN */}
        {!activeSession && (
          <div className="space-y-8">
            <div className="border-b border-border/40 pb-6 space-y-2">
              <h1 className="text-3xl font-sans font-black tracking-tight text-foreground flex items-center space-x-2.5">
                <Gamepad2 className="w-7 h-7 text-primary" />
                <span>Riddle Night</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Test your lateral thinking! Start a riddle, choose a timer limit, and lock in your answers privately before the grand reveal.
              </p>
            </div>

            {/* Config & Launch Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3.5 text-left w-full md:w-auto">
                <p className="text-xs font-mono font-bold text-[var(--ink-light)] uppercase tracking-widest">
                  Configure Riddle Timer
                </p>
                <div className="flex gap-2">
                  {[
                    { label: "3 Minutes", value: 180 },
                    { label: "5 Minutes", value: 300 },
                    { label: "No Timer", value: null }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedTimer(opt.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedTimer === opt.value
                          ? "bg-primary text-white border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartRiddle}
                disabled={initiatingSession || riddles.length === 0}
                className="w-full md:w-auto inline-flex items-center justify-center space-x-1.5 py-3.5 px-6 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                {initiatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gamepad2 className="w-4 h-4" />}
                <span>Start Riddle 🚀</span>
              </button>
            </div>

            {/* Session log list */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-[var(--ink-light)] uppercase tracking-widest flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Riddle Session Logs</span>
              </h2>

              {fetching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/45 p-12 text-center text-muted-foreground">
                  No riddles started yet! Click above to kick off Riddle Night.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessions.map((s: any) => {
                    const riddleInfo = s.riddles;
                    return (
                      <div
                        key={s.id}
                        onClick={() => loadSessionDetails(s.id)}
                        className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              s.status === "revealed" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                            }`}>
                              {s.status}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {format(parseISO(s.started_at), "MMM d, h:mm a")}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                            "{riddleInfo?.question}"
                          </h3>
                        </div>

                        {s.status === "revealed" && (
                          <div className="mt-4 pt-3 border-t border-border/40 flex items-center space-x-1.5 text-xs text-muted-foreground">
                            <span>Ans: </span>
                            <span className="font-bold text-foreground">
                              {riddleInfo?.answer}
                            </span>
                          </div>
                        )}
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
          <div className="max-w-2xl w-full mx-auto space-y-6">
            
            {/* Header Details */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={() => {
                  setActiveSession(null);
                  fetchLobbyData();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Riddle Lobby</span>
              </button>

              <div className="text-right">
                <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary/20">
                  RIDDLE #{activeSession.riddle_id.slice(0, 8).toUpperCase()}
                </span>
                <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1 font-bold">
                  {activeSession.riddles?.difficulty} • {activeSession.riddles?.category}
                </p>
              </div>
            </div>

            {/* Riddle display board */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-8 text-center relative overflow-hidden">
              
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

              {/* The Riddle Question */}
              <div className="space-y-2 z-10 relative">
                <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                  Can you solve this?
                </p>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-foreground leading-normal max-w-xl mx-auto">
                  {activeSession.riddles?.question}
                </h2>
              </div>

              {/* SVG circular countdown timer */}
              {secondsRemaining !== null && secondsRemaining > 0 && activeSession.status !== "revealed" && (
                <div className="flex flex-col items-center justify-center space-y-2 z-10 relative">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        className="stroke-muted fill-none"
                        strokeWidth="4"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        className={`fill-none transition-all duration-1000 ${
                          secondsRemaining < 30 ? "stroke-red-500" : "stroke-primary"
                        }`}
                        strokeWidth="4"
                        strokeDasharray="226.2"
                        strokeDashoffset={226.2 - (226.2 * secondsRemaining) / (activeSession.timer_seconds || 1)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-mono font-black text-foreground">
                      {secondsRemaining}s
                    </div>
                  </div>
                </div>
              )}

              {/* Input Response Box */}
              {!myAnswerSubmitted && activeSession.status !== "revealed" && (
                <div className="max-w-md mx-auto space-y-4 z-10 relative animate-fade-in">
                  <textarea
                    value={myAnswerInput}
                    onChange={(e) => setMyAnswerInput(e.target.value)}
                    placeholder="Type your private guess here... discussing aloud is allowed!"
                    className="block w-full h-24 px-3.5 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm resize-none placeholder:text-muted-foreground/45 transition-all"
                  />

                  <button
                    onClick={handleLockIn}
                    disabled={submittingAnswer || !myAnswerInput.trim()}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 disabled:scale-100 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock In My Answer 🔒</span>
                  </button>
                </div>
              )}

              {/* Locked in waiting screen */}
              {myAnswerSubmitted && !partnerAnswerSubmitted && activeSession.status !== "revealed" && (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto z-10 relative animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Your answer has been locked in!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {partnerOnline ? `Waiting for ${partnerName} to submit...` : `${partnerName} is offline. Waiting for their guess...`}
                  </p>
                </div>
              )}

              {/* Reveal Answers Board */}
              {activeSession.status === "revealed" && (
                <div className="space-y-8 animate-fade-in z-10 relative text-left">
                  
                  {/* Correct Answer Card */}
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 space-y-2 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-yellow-600 uppercase tracking-widest">
                        Correct Riddle Answer
                      </p>
                      <p className="text-lg font-black text-foreground mt-1">
                        "{activeSession.riddles?.answer}"
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 fill-yellow-500/10" />
                    </div>
                  </div>

                  {/* Partner comparison slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Your Answer */}
                    <div className={`rounded-xl border p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                      checkCorrect(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer)
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                            Your Guess
                          </span>
                          {checkCorrect(myAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ? (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-500 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-red-500 font-mono uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <X className="w-3 h-3" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold text-foreground">
                          "{myAnswerSubmitted?.answer_text || "No submission"}"
                        </p>
                      </div>
                    </div>

                    {/* Partner Answer */}
                    <div className={`rounded-xl border p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                      checkCorrect(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer)
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">
                            {partnerName}'s Guess
                          </span>
                          {checkCorrect(partnerAnswerSubmitted?.answer_text, activeSession.riddles?.answer) ? (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-500 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-red-500 font-mono uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <X className="w-3 h-3" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold text-foreground">
                          "{partnerAnswerSubmitted?.answer_text || "No submission"}"
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Status display footer */}
              {secondsRemaining !== 0 && activeSession.status !== "revealed" && (
                <div className="flex items-center justify-center gap-6 border-t border-border/40 pt-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${myAnswerSubmitted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span>You: {myAnswerSubmitted ? "Locked in 🔒" : "Solving 🤔"}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${partnerAnswerSubmitted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <span>{partnerName}: {partnerAnswerSubmitted ? "Locked in 🔒" : "Solving 🤔"}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
