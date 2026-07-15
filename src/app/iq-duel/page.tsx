"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Brain, Loader2, AlertCircle, Zap, Trophy, Clock,
  RefreshCw, CheckCircle2, XCircle, Swords, Sparkles
} from "lucide-react";

// ─── IQ Estimate Logic ────────────────────────────────────────────────
function getPlayfulIQ(correctCount: number, totalQuestions: number, avgTimeSeconds: number) {
  const accuracy = correctCount / totalQuestions;
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
  pattern: "text-[#f472b6] border-[#f472b6]/30 bg-[#f472b6]/5",
  logic:   "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/5",
  math:    "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
};

// ─── Circular Countdown Timer ─────────────────────────────────────────
function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const dash = circ * progress;
  const urgent = seconds <= 5;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        {/* Track */}
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="4" className="text-border" />
        {/* Progress */}
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
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-black font-mono ${urgent ? "text-red-500" : "text-foreground"}`}>
        {seconds}
      </span>
    </div>
  );
}

// ─── Animated IQ Count-Up ─────────────────────────────────────────────
function IQCountUp({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(90);

  useEffect(() => {
    let start = 90;
    const step = Math.ceil((target - start) / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplayed(target);
        clearInterval(interval);
      } else {
        setDisplayed(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [target]);

  return <>{displayed}</>;
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function IQDuelPage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const supabase = createClient();

  type Screen = "lobby" | "questions" | "waiting" | "reveal";
  const [screen, setScreen] = useState<Screen>("lobby");
  const [error, setError] = useState<string | null>(null);

  // Duel state
  const [duelId, setDuelId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [starting, setStarting] = useState(false);

  // Per-answer tracking
  const qStartRef = useRef<number>(Date.now());
  const answersRef = useRef<{ questionId: string; isCorrect: boolean; timeTaken: number }[]>([]);

  // Results
  const [myResult, setMyResult] = useState<any>(null);
  const [partnerResult, setPartnerResult] = useState<any>(null);

  // Realtime
  const channelRef = useRef<any>(null);

  // ── Realtime channel setup ────────────────────────────────────────
  useEffect(() => {
    if (loading || !pair || !user) return;

    const channel = supabase.channel(`duel-${pair.id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "duel-started" }, ({ payload }: any) => {
        // Partner started a duel — join it
        if (payload.startedBy !== user.id) {
          joinExistingDuel(payload.duelId);
        }
      })
      .on("broadcast", { event: "duel-reveal" }, ({ payload }: any) => {
        // Both done — receive results
        setMyResult(payload.results.find((r: any) => r.userId === user.id) || null);
        setPartnerResult(payload.results.find((r: any) => r.userId !== user.id) || null);
        setScreen("reveal");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, pair, user]);

  // ── Countdown timer per question ─────────────────────────────────
  useEffect(() => {
    if (screen !== "questions" || confirmed) return;
    if (questions.length === 0) return;

    const limit = questions[qIndex]?.time_limit_seconds ?? 20;
    setTimeLeft(limit);
    qStartRef.current = Date.now();

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmitAnswer(null); // time out → wrong
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qIndex, screen, confirmed]);

  // ── Start a new duel ─────────────────────────────────────────────
  const handleStartDuel = async () => {
    if (!pair || !user || starting) return;
    setError(null);
    setStarting(true);

    try {
      // Pick 6 random questions
      const { data: allQ, error: qErr } = await supabase
        .from("iq_questions")
        .select("*");
      if (qErr) throw qErr;

      const shuffled = [...(allQ || [])].sort(() => Math.random() - 0.5).slice(0, 6);
      const qIds = shuffled.map((q: any) => q.id);

      // Create duel row
      const { data: duelRow, error: duelErr } = await supabase
        .from("iq_duels")
        .insert({ pair_id: pair.id, question_ids: qIds, status: "active" })
        .select()
        .single();
      if (duelErr) throw duelErr;

      // Broadcast to partner
      channelRef.current?.send({
        type: "broadcast",
        event: "duel-started",
        payload: { duelId: duelRow.id, startedBy: user.id },
      });

      setDuelId(duelRow.id);
      setQuestions(shuffled);
      setQIndex(0);
      answersRef.current = [];
      setSelected(null);
      setConfirmed(false);
      setScreen("questions");
    } catch (e: any) {
      setError(e.message || "Failed to start duel.");
    } finally {
      setStarting(false);
    }
  };

  // ── Join existing duel started by partner ────────────────────────
  const joinExistingDuel = useCallback(async (id: string) => {
    try {
      const { data: duelRow, error: dErr } = await supabase
        .from("iq_duels")
        .select("*")
        .eq("id", id)
        .single();
      if (dErr) throw dErr;

      const { data: questionsData, error: qErr } = await supabase
        .from("iq_questions")
        .select("*")
        .in("id", duelRow.question_ids);
      if (qErr) throw qErr;

      // Sort to match original question order
      const ordered = duelRow.question_ids.map((qid: string) =>
        questionsData!.find((q: any) => q.id === qid)
      ).filter(Boolean);

      setDuelId(id);
      setQuestions(ordered);
      setQIndex(0);
      answersRef.current = [];
      setSelected(null);
      setConfirmed(false);
      setScreen("questions");
    } catch (e: any) {
      setError(e.message || "Failed to join duel.");
    }
  }, [supabase]);

  // ── Submit an answer ─────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async (answer: string | null) => {
    if (!duelId || !user || !questions[qIndex]) return;
    setConfirmed(true);

    const q = questions[qIndex];
    const isCorrect = answer !== null && answer === q.correct_answer;
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000);

    // Record locally
    answersRef.current.push({ questionId: q.id, isCorrect, timeTaken });

    // Persist to DB
    try {
      await supabase.from("iq_duel_answers").insert({
        duel_id: duelId,
        user_id: user.id,
        question_id: q.id,
        answer_given: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken,
      });
    } catch (_) {}

    // Brief feedback delay then advance
    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setConfirmed(false);
      } else {
        finishDuel();
      }
    }, 800);
  }, [duelId, user, questions, qIndex]);

  // ── Finish — compute results, wait for partner ───────────────────
  const finishDuel = async () => {
    if (!duelId || !user) return;
    setScreen("waiting");

    const correctCount = answersRef.current.filter((a) => a.isCorrect).length;
    const avgTime = answersRef.current.reduce((s, a) => s + a.timeTaken, 0) / (answersRef.current.length || 1);
    const { score, label } = getPlayfulIQ(correctCount, questions.length, avgTime);

    try {
      // Insert result
      await supabase.from("iq_duel_results").insert({
        duel_id: duelId,
        user_id: user.id,
        score: correctCount,
        estimated_iq: score,
        playful_label: label,
      });

      // Check if partner already finished
      const { data: allResults } = await supabase
        .from("iq_duel_results")
        .select("*")
        .eq("duel_id", duelId);

      if (allResults && allResults.length >= 2) {
        // Both done — mark duel complete and reveal
        await supabase
          .from("iq_duels")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", duelId);

        const resultsPayload = allResults.map((r: any) => ({
          userId: r.user_id,
          score: r.score,
          estimatedIq: r.estimated_iq,
          playfulLabel: r.playful_label,
        }));

        channelRef.current?.send({
          type: "broadcast",
          event: "duel-reveal",
          payload: { results: resultsPayload },
        });

        // Set own results locally too
        const mine = resultsPayload.find((r: any) => r.userId === user.id);
        const theirs = resultsPayload.find((r: any) => r.userId !== user.id);
        setMyResult(mine);
        setPartnerResult(theirs);
        setScreen("reveal");
      }
      // Otherwise stay on waiting — partner's finish will trigger broadcast
    } catch (e: any) {
      setError(e.message || "Failed to save result.");
    }
  };

  const handleReset = () => {
    setScreen("lobby");
    setDuelId(null);
    setQuestions([]);
    setQIndex(0);
    setSelected(null);
    setConfirmed(false);
    setMyResult(null);
    setPartnerResult(null);
    answersRef.current = [];
  };

  // ── Guards ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-sm">
            <Brain className="w-12 h-12 text-primary mx-auto" />
            <h2 className="font-sans font-black text-xl">IQ Duel</h2>
            <p className="text-muted-foreground text-sm">Connect with your partner to start a duel.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[qIndex];
  const correctCount = answersRef.current.filter((a) => a.isCorrect).length;

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground">
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50rem 35rem at 80% 10%, rgba(244,114,182,0.06) 0%, transparent 60%), radial-gradient(40rem 30rem at 20% 90%, rgba(96,165,250,0.06) 0%, transparent 60%)",
        }}
      />
      <Navigation />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center z-10">

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── LOBBY ─────────────────────────────────────────────────── */}
        {screen === "lobby" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f472b6] to-[#60a5fa] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-sans font-black text-3xl tracking-tight text-foreground">IQ Duel</h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                A private timed logic, pattern &amp; math challenge — you and{" "}
                <span className="text-[#f472b6] font-bold">{partner?.display_name || "your partner"}</span>{" "}
                answer separately. Compare your results after!
              </p>

              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#f472b6]" /> 6 questions</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#60a5fa]" /> 15-20s each</span>
                <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" /> IQ estimate</span>
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground/60 font-mono">
                ⚠️ For fun only — not a real IQ test
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "01", text: "One partner starts the duel", color: "text-[#f472b6]" },
                { step: "02", text: "Both answer 6 questions privately", color: "text-amber-400" },
                { step: "03", text: "Reveal scores together!", color: "text-[#60a5fa]" },
              ].map((s) => (
                <div key={s.step} className="rounded-xl border border-border bg-card p-4 text-center space-y-2">
                  <span className={`text-2xl font-black font-mono ${s.color}`}>{s.step}</span>
                  <p className="text-xs text-muted-foreground leading-snug">{s.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartDuel}
              disabled={starting}
              className="w-full py-4 rounded-2xl font-sans font-black text-white text-lg bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {starting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Starting…</>
              ) : (
                <><Swords className="w-5 h-5" /> Start the Duel</>
              )}
            </button>
          </div>
        )}

        {/* ── QUESTION SCREEN ───────────────────────────────────────── */}
        {screen === "questions" && currentQ && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                Question {qIndex + 1} of {questions.length}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f472b6] to-[#60a5fa] rounded-full transition-all duration-300"
                  style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />
              <div className="p-6 space-y-5">
                {/* Type badge + timer row */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${TYPE_COLOR[currentQ.question_type] || ""}`}>
                    {TYPE_BADGE[currentQ.question_type] || currentQ.question_type}
                  </span>
                  <CircularTimer
                    seconds={timeLeft}
                    total={currentQ.time_limit_seconds ?? 20}
                  />
                </div>

                {/* Question text */}
                <p className="text-xl font-sans font-black leading-snug text-foreground">
                  {currentQ.question_text}
                </p>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                        className={`relative px-4 py-3.5 rounded-xl text-sm font-bold text-left transition-all duration-150 border-2 cursor-pointer active:scale-[0.97]
                          ${isCorrect
                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                            : isWrong
                            ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                            : isSelected
                            ? "border-[#f472b6] bg-gradient-to-r from-[#f472b6]/5 to-[#60a5fa]/5 text-foreground"
                            : "border-border bg-background hover:border-[#f472b6]/50 hover:bg-accent text-foreground"
                          }`}
                      >
                        {isCorrect && <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-emerald-500" />}
                        {isWrong && <XCircle className="w-4 h-4 inline mr-1.5 text-red-500" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mini score trail */}
            <div className="flex items-center justify-center gap-2">
              {answersRef.current.map((a, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${a.isCorrect ? "bg-emerald-400" : "bg-red-400"}`}
                />
              ))}
              {Array.from({ length: questions.length - answersRef.current.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-2.5 h-2.5 rounded-full bg-border" />
              ))}
            </div>
          </div>
        )}

        {/* ── WAITING ───────────────────────────────────────────────── */}
        {screen === "waiting" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-10">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

              {/* Animated brain pulse */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f472b6]/10 to-[#60a5fa]/10 border border-[#f472b6]/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Brain className="w-10 h-10 text-primary" />
              </div>

              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase mb-3">
                You finished!
              </p>
              <h2 className="font-sans font-black text-2xl text-foreground">
                {correctCount}/{questions.length} correct
              </h2>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                Waiting for{" "}
                <span className="text-[#60a5fa] font-bold">{partner?.display_name || "your partner"}</span>{" "}
                to finish their duel…
              </p>

              {/* Animated dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f472b6] to-[#60a5fa] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REVEAL ────────────────────────────────────────────────── */}
        {screen === "reveal" && myResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">Results are in</p>
              <h2 className="font-sans font-black text-3xl text-foreground flex items-center justify-center gap-2">
                <Trophy className="w-7 h-7 text-amber-400" /> IQ Duel Results
              </h2>
            </div>

            {/* Side-by-side stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* My card — pink */}
              <div className="relative overflow-hidden rounded-2xl border border-[#f472b6]/30 bg-card shadow-sm p-5 text-center space-y-2">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#f472b6]/50" />
                <p className="text-[9px] font-mono font-black text-[#f472b6] tracking-widest uppercase">You</p>
                <p className="text-4xl font-black font-mono text-foreground">
                  <IQCountUp target={myResult.estimatedIq} />
                </p>
                <p className="text-[10px] font-bold text-muted-foreground">{myResult.playfulLabel}</p>
                <div className="pt-1 border-t border-border mt-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {myResult.score}/{questions.length} correct
                  </span>
                </div>
              </div>

              {/* Partner card — blue */}
              <div className="relative overflow-hidden rounded-2xl border border-[#60a5fa]/30 bg-card shadow-sm p-5 text-center space-y-2">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#60a5fa]/50 to-[#60a5fa]" />
                <p className="text-[9px] font-mono font-black text-[#60a5fa] tracking-widest uppercase">
                  {partner?.display_name || "Partner"}
                </p>
                {partnerResult ? (
                  <>
                    <p className="text-4xl font-black font-mono text-foreground">
                      <IQCountUp target={partnerResult.estimatedIq} />
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{partnerResult.playfulLabel}</p>
                    <div className="pt-1 border-t border-border mt-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {partnerResult.score}/{questions.length} correct
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">Still calculating…</p>
                )}
              </div>
            </div>

            {/* Winner banner */}
            {partnerResult && (
              <div className={`rounded-2xl border p-4 text-center
                ${myResult.estimatedIq > partnerResult.estimatedIq
                  ? "border-[#f472b6]/30 bg-[#f472b6]/5"
                  : myResult.estimatedIq < partnerResult.estimatedIq
                  ? "border-[#60a5fa]/30 bg-[#60a5fa]/5"
                  : "border-amber-400/30 bg-amber-400/5"
                }`}
              >
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <p className="text-sm font-bold text-foreground">
                  {myResult.estimatedIq > partnerResult.estimatedIq
                    ? "🎉 You win this round!"
                    : myResult.estimatedIq < partnerResult.estimatedIq
                    ? `🏆 ${partner?.display_name || "Partner"} wins this round!`
                    : "🤝 It's a tie — perfectly matched minds!"}
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl font-sans font-bold text-sm text-foreground border border-border bg-card hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Duel Again
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
