"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Scale, Check, X, Loader2, AlertCircle, 
  Trophy, Sparkles, Send, Lock, Unlock, 
  ArrowLeft, Timer, MessageSquare, Plus, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { UnpairedPrompt } from "@/components/unpaired-prompt";

import { useNotifications } from "@/components/providers/notification-provider";

export default function VibeJudgePage() {
  const { user, pair, partner, loading } = useAuth();
  const { sendGameNotification } = useNotifications();
  const supabase = createClient();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Form states
  const [newTopic, setNewTopic] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [myArgument, setMyArgument] = useState("");
  const [submittingArgument, setSubmittingArgument] = useState(false);
  
  // Game states
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerActive, setTimerActive] = useState(false);
  const [myArgSubmitted, setMyArgSubmitted] = useState<any>(null);
  const [partnerArgSubmitted, setPartnerArgSubmitted] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  // 1. Fetch Disputes List
  const fetchDisputes = async () => {
    if (!pair) return;
    try {
      const res = await fetch(`/api/disputes?pairId=${pair.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load disputes");
      setDisputes(data || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load disputes.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchDisputes();

      // Realtime subscription for list updates
      const disputesChan = supabase
        .channel(`disputes-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vibe_disputes", filter: `pair_id=eq.${pair.id}` },
          () => fetchDisputes()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(disputesChan);
      };
    }
  }, [loading, pair]);

  // 2. Fetch specific dispute details & arguments
  const loadDisputeDetails = async (disputeId: string) => {
    try {
      const res = await fetch(`/api/disputes?disputeId=${disputeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load details");

      const disp = data.dispute;
      const args = data.arguments;
      const verd = data.verdict;

      if (!disp) return;

      const myArg = args?.find((a: any) => a.user_id === user?.id);
      const partnerArg = args?.find((a: any) => a.user_id === partner?.id);

      setMyArgSubmitted(myArg || null);
      setPartnerArgSubmitted(partnerArg || null);
      setVerdict(verd || null);

      setActiveDispute(disp);

      // Start argument countdown timer if my argument is not submitted yet
      if (!myArg) {
        setTimerSeconds(60);
        setTimerActive(true);
      } else {
        setTimerActive(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Real-time subscription to active dispute + Auto-polling fallback
  useEffect(() => {
    if (!activeDispute || !user) return;

    // Clean up previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`dispute-${activeDispute.id}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_arguments", filter: `dispute_id=eq.${activeDispute.id}` },
        (payload: any) => {
          const newArg = payload.new;
          if (newArg.user_id === user.id) {
            setMyArgSubmitted(newArg);
          } else {
            setPartnerArgSubmitted(newArg);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_verdicts", filter: `dispute_id=eq.${activeDispute.id}` },
        (payload: any) => {
          setVerdict(payload.new);
          setJudging(false);
          setActiveDispute((prev: any) => ({ ...prev, status: "judged" }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vibe_disputes", filter: `id=eq.${activeDispute.id}` },
        (payload: any) => {
          setActiveDispute(payload.new);
        }
      )
      .subscribe();

    // Auto-poll active dispute arguments & verdict every 2 seconds to eliminate sync delay
    const pollInterval = setInterval(() => {
      if (activeDispute.status !== "judged") {
        loadDisputeDetails(activeDispute.id);
      }
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [activeDispute, user]);

  // Auto-poll disputes list every 3.5 seconds so partner discovers newly created cases instantly
  useEffect(() => {
    if (!pair) return;
    const listInterval = setInterval(() => {
      fetchDisputes();
    }, 3500);
    return () => clearInterval(listInterval);
  }, [pair]);

  // 4. Timer Countdown Logic
  useEffect(() => {
    if (!timerActive || timerSeconds === null) return;

    if (timerSeconds > 0) {
      const timer = setTimeout(() => setTimerSeconds(timerSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setTimerActive(false);
      // Auto-submit whatever argument text is typed when timer runs out
      submitArgument();
    }
  }, [timerSeconds, timerActive]);

  // 5. Submit Dispute Argument
  const submitArgument = async () => {
    if (!activeDispute || submittingArgument || myArgSubmitted || !user) return;
    setSubmittingArgument(true);
    setTimerActive(false);

    const argText = myArgument.trim() || "I request the court's mercy. I rest my case.";

    try {
      const res = await fetch("/api/disputes/argument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: activeDispute.id,
          argumentText: argText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit argument");

      setMyArgSubmitted(data);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to submit argument.");
    } finally {
      setSubmittingArgument(false);
    }
  };

  // 6. Trigger Gemini Judge Call once both submit
  useEffect(() => {
    const triggerJudging = async () => {
      if (!activeDispute || !myArgSubmitted || !partnerArgSubmitted || activeDispute.status === "judged" || judging) return;
      setJudging(true);

      try {
        const res = await fetch("/api/disputes/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disputeId: activeDispute.id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Judging failed");
      } catch (e: any) {
        console.error("Judging error:", e);
        // Let it fallback or retry on conflict
      }
    };

    triggerJudging();
  }, [activeDispute, myArgSubmitted, partnerArgSubmitted, judging]);

  // 7. Initiate New Dispute
  const handleInitiateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !newTopic.trim() || !user || submittingDispute) return;
    setSubmittingDispute(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("vibe_disputes")
        .insert({
          pair_id: pair.id,
          topic: newTopic.trim(),
          created_by: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (err) throw err;

      setNewTopic("");
      sendGameNotification("Between the Lines", "/vibe-judge");
      loadDisputeDetails(data.id);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to initiate dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--burgundy)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt
        title="Couples Debate & AI Vibe Judge"
        description="Plead your case with timed rebuttals and let our playful AI judge deliver an impartial verdict and loving penalty. Connect your partner to start a debate."
        icon={Scale}
      />
    );
  }

  const partnerName = partner?.display_name || "Partner";

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-16 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* HEADER */}
        {!activeDispute && (
          <div className="space-y-8">
            <div className="border-b border-[var(--border)]/40 pb-6 space-y-2">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-[var(--text)] flex items-center space-x-2.5">
                <Scale className="w-7 h-7 text-[var(--burgundy)]" />
                <span>AI Vibe Judge</span>
              </h1>
              <p className="text-sm text-[var(--text-soft)] max-w-2xl leading-relaxed">
                Settle your relationship disputes playfully with Gemini. State your cases privately, lock in arguments, and receive a warm, fun verdict.
              </p>
            </div>

            {/* Initiate new case */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] paper-grain p-6 shadow-sm">
              <h2 className="text-xs font-mono font-bold text-[var(--ink-light)] uppercase tracking-widest flex items-center space-x-1.5 mb-4">
                <Plus className="w-4 h-4 text-[var(--burgundy)]" />
                <span>Initiate a Relationship Case</span>
              </h2>

              <form onSubmit={handleInitiateDispute} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Kaun movie select karega? or Who is washing the dishes tonight?"
                  className="block flex-1 px-3.5 py-2.5 input-warm text-sm"
                />
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-5 rounded-xl text-xs font-bold text-white btn-primary hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {submittingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  <span>Judge Us ⚖️</span>
                </button>
              </form>
            </div>

            {/* Past cases list */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-[var(--ink-light)] uppercase tracking-widest flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-[var(--burgundy)]" />
                <span>Relationship Court Log</span>
              </h2>

              {fetching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[var(--burgundy)] animate-spin mx-auto" />
                </div>
              ) : disputes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/45 p-12 text-center text-[var(--text-soft)]">
                  No disputes logged yet! Start a case above to settle it with AI.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {disputes.map((d: any) => {
                    const verdictText = d.dispute_verdicts?.[0]?.verdict_text;
                    const winnerId = d.dispute_verdicts?.[0]?.winner_user_id;
                    const isWinnerMe = winnerId === user.id;

                    return (
                      <div 
                        key={d.id}
                        onClick={() => loadDisputeDetails(d.id)}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              d.status === "judged" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}>
                              {d.status}
                            </span>
                            <span className="text-[9px] text-[var(--text-soft)] font-mono">
                              {format(new Date(d.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-[var(--text)] truncate">
                            "{d.topic}"
                          </h3>

                          {d.status === "judged" && verdictText && (
                            <p className="text-xs text-[var(--text-soft)] line-clamp-2 italic leading-relaxed">
                              "{verdictText}"
                            </p>
                          )}
                        </div>

                        {d.status === "judged" && (
                          <div className="mt-4 pt-3 border-t border-[var(--border)]/40 flex items-center space-x-1.5 text-xs">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="font-bold text-[var(--text)]">
                              {winnerId ? (isWinnerMe ? "You Won! 🏆" : `${partnerName} Won 🏆`) : "Draw Verdict 🤝"}
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

        {/* ACTIVE CASE OR VERDICT REVEAL VIEW */}
        {activeDispute && (
          <div className="max-w-2xl w-full mx-auto space-y-6">
            {/* Header Details */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]/40">
              <button
                onClick={() => {
                  setActiveDispute(null);
                  fetchDisputes();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[var(--text-soft)] hover:text-[var(--text)] uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Court Lobby</span>
              </button>

              <span className="bg-[var(--burgundy)]/10 text-[var(--burgundy)] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--burgundy)]/20">
                Dispute status: {activeDispute.status}
              </span>
            </div>

            {/* Active dispute details card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] paper-grain p-6 sm:p-8 shadow-sm space-y-6 text-center">
              
              {/* Question Text */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-[var(--burgundy)] uppercase tracking-widest">
                  Couples Court Topic
                </p>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-[var(--text)] leading-snug max-w-xl mx-auto">
                  "{activeDispute.topic}"
                </h2>
              </div>

              {/* Argument Submission Form */}
              {!myArgSubmitted && activeDispute.status !== "judged" && (
                <div className="max-w-md mx-auto space-y-6">
                  {/* Timer Display */}
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <Timer className={`w-6 h-6 ${timerSeconds < 15 ? "text-red-500 animate-pulse" : "text-[var(--burgundy)]"}`} />
                    <span className="text-2xl font-mono font-black text-[var(--text)]">{timerSeconds}s</span>
                  </div>

                  <div className="space-y-4">
                    <textarea
                      value={myArgument}
                      onChange={(e) => setMyArgument(e.target.value)}
                      placeholder="Write down your argument text here privately. Be creative, Gemini judges humor!"
                      className="block w-full h-28 px-3.5 py-2.5 input-warm text-sm resize-none placeholder:text-[var(--text-soft)]/45 transition-all"
                    />

                    <button
                      onClick={submitArgument}
                      disabled={submittingArgument}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white btn-primary hover:opacity-95 disabled:opacity-50 disabled:scale-100 active:scale-[0.98] transition-all cursor-pointer shadow-md"
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
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text)]">
                    Your argument has been locked in!
                  </p>
                  <p className="text-xs text-[var(--text-soft)]">
                    Waiting for {partnerName} to submit their argument. Gemini will evaluate the dispute once both cases are locked.
                  </p>
                </div>
              )}

              {/* Judging Loader */}
              {myArgSubmitted && partnerArgSubmitted && activeDispute.status !== "judged" && (
                <div className="py-10 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-[var(--burgundy)] animate-spin flex items-center justify-center" />
                  <p className="text-sm font-bold text-[var(--text)] animate-pulse">
                    Gemini is currently evaluating your cases...
                  </p>
                  <p className="text-xs text-[var(--text-soft)]">
                    Formulating a warm, playful verdict and sentencing the loser!
                  </p>
                </div>
              )}

              {/* Verdict Reveal View */}
              {activeDispute.status === "judged" && verdict && (
                <div className="space-y-8 animate-fade-in text-left">
                  
                  {/* Verdict detail card */}
                  <div className="rounded-xl border border-[var(--burgundy)]/20 bg-pink-500/5 p-6 space-y-4">
                    <h3 className="text-sm font-mono font-bold text-[var(--burgundy)] uppercase tracking-widest flex items-center space-x-1.5">
                      <Scale className="w-4 h-4" />
                      <span>The Official Verdict</span>
                    </h3>

                    <div className="space-y-2">
                      <p className="text-xl font-bold text-[var(--text)]">
                        Court Verdict: {verdict.winner_user_id === user.id ? "Victory is Yours! 🏆" : (verdict.winner_user_id === partner?.id ? `${partnerName} Wins 🏆` : "A Draw Decision 🤝")}
                      </p>
                      <p className="text-sm text-[var(--text)] leading-relaxed italic">
                        "{verdict.verdict_text}"
                      </p>
                    </div>

                    {verdict.playful_sentence && (
                      <div className="pt-4 border-t border-[var(--burgundy)]/20 space-y-1">
                        <p className="text-[10px] font-mono font-bold text-[var(--text-soft)] uppercase tracking-widest">
                          Playful sentence decreed
                        </p>
                        <p className="text-xs font-bold text-[var(--burgundy)] uppercase tracking-wider bg-[var(--burgundy)]/10 border border-[var(--burgundy)]/20 rounded-lg py-2 px-3 inline-block">
                          📜 {verdict.playful_sentence}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Arguments comparison columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 space-y-1">
                      <p className="text-[10px] font-mono text-[var(--text-soft)] uppercase tracking-widest">
                        Your Case
                      </p>
                      <p className="text-xs font-medium text-[var(--text)] leading-relaxed">
                        "{myArgSubmitted?.argument_text || "No argument provided"}"
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 space-y-1">
                      <p className="text-[10px] font-mono text-[var(--text-soft)] uppercase tracking-widest">
                        {partnerName}'s Case
                      </p>
                      <p className="text-xs font-medium text-[var(--text)] leading-relaxed">
                        "{partnerArgSubmitted?.argument_text || "No argument provided"}"
                      </p>
                    </div>
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
