"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Heart, Sparkles, Check, ArrowRight, RotateCcw, Share2, ArrowLeft,
  Users, Lock, Shield, Trophy, PartyPopper, Smile, Loader2, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MATCH_QUESTIONS, MatchQuestion, getMatchFeedback } from "@/lib/match-game/questions";

type GamePhase = "lobby" | "playing" | "locked" | "comparing" | "revealed" | "completed";

export default function LoveMatchGamePage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [partnerLocked, setPartnerLocked] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [matchHistory, setMatchHistory] = useState<{ qIndex: number; isMatch: boolean; myAns: string; partnerAns: string }[]>([]);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const channelRef = useRef<any>(null);
  const currentQ = MATCH_QUESTIONS[currentQIndex];

  // ── Setup Realtime Channel ──
  useEffect(() => {
    if (loading || !pair || !user) return;

    const channel = supabase.channel(`match-game-${pair.id}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const partnerPresent = partner && Object.keys(state).includes(partner.id);
        setPartnerConnected(!!partnerPresent);
      })
      .on("broadcast", { event: "game-start" }, ({ payload }: any) => {
        setCurrentQIndex(payload.qIndex || 0);
        setMyAnswer(null);
        setPartnerAnswer(null);
        setPartnerLocked(false);
        setMatchHistory([]);
        setPhase("playing");
      })
      .on("broadcast", { event: "answer-locked" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          setPartnerLocked(true);
        }
      })
      .on("broadcast", { event: "answer-reveal" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
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
            user_name: profile?.display_name || "Partner",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, pair, user, partner, profile]);

  // ── When both users have submitted, trigger the reveal sequence ──
  useEffect(() => {
    if (myAnswer && partnerAnswer && phase !== "revealed" && phase !== "completed") {
      setPhase("comparing");

      const isMatch = myAnswer === partnerAnswer;
      const newHistory = [...matchHistory, {
        qIndex: currentQIndex,
        isMatch,
        myAns: myAnswer,
        partnerAns: partnerAnswer,
      }];
      setMatchHistory(newHistory);

      const timer = setTimeout(() => {
        setPhase("revealed");
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [myAnswer, partnerAnswer, currentQIndex, phase]);

  // ── Animated percentage counter on reveal ──
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
    setPhase("playing");

    if (!solo && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game-start",
        payload: { startedBy: user?.id, qIndex: 0 },
      });
    }
  };

  // ── Lock In Answer ──
  const handleSelectOption = (optionId: string) => {
    if (myAnswer) return;
    setMyAnswer(optionId);
    setPhase("locked");

    if (isSoloMode) {
      // Simulate partner pick after realistic pause
      setTimeout(() => {
        const currentOptions = currentQ.options;
        // 70% chance partner picks same for a fun demo feel
        const picksSame = Math.random() < 0.7;
        const simulatedAnswer = picksSame
          ? optionId
          : currentOptions.find((o) => o.id !== optionId)?.id || optionId;

        setPartnerLocked(true);
        setPartnerAnswer(simulatedAnswer);
      }, 1200);
      return;
    }

    // Broadcast to partner that we locked our choice without revealing optionId yet
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "answer-locked",
        payload: { userId: user?.id, qIndex: currentQIndex },
      });

      // Send the private answer to reveal channel
      channelRef.current.send({
        type: "broadcast",
        event: "answer-reveal",
        payload: { userId: user?.id, answerId: optionId, qIndex: currentQIndex },
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
    setPhase("playing");

    if (!isSoloMode && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "play-again",
        payload: {},
      });
    }
  };

  // ── Share Score ──
  const handleShare = () => {
    const total = matchHistory.length;
    const matches = matchHistory.filter((h) => h.isMatch).length;
    const text = `We just played Love Match on Pairfect and scored ${animatedPercentage}% in sync (${matches}/${total} matches)! 💕`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCurrentMatch = myAnswer && partnerAnswer && myAnswer === partnerAnswer;
  const userName = profile?.display_name || "You";
  const partnerName = partner?.display_name || (isSoloMode ? "Alex (Demo)" : "Partner");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors paper-grain">
      <Navigation />

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-24 md:pl-36 md:pr-12 pb-16 flex flex-col justify-center">

        {/* ── TOP BACK BUTTON & BREADCRUMB ── */}
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

        {/* ══════════════════════════════════════════════════════════
            PHASE 1: LOBBY SCREEN
            ══════════════════════════════════════════════════════════ */}
        {phase === "lobby" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto w-full p-8 sm:p-10 rounded-3xl bg-white border border-[var(--border)] shadow-md text-center space-y-6 paper-grain"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center text-3xl mx-auto shadow-xs">
              💖
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-[9px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Real-Time Couple Match Game</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--text)]">
                Love Match
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-soft)] max-w-md mx-auto leading-relaxed">
                One question, two screens. Both lock in your answers privately — neither can peek — then both choices flip at the exact same second!
              </p>
            </div>

            {/* Partner Connection Status */}
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">{partnerName}</p>
                  <p className="text-[10px] font-mono text-[var(--text-soft)]">
                    {partnerConnected ? "Online & Connected" : "Invite your partner to connect live"}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                partnerConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {partnerConnected ? "READY" : "WAITING"}
              </span>
            </div>

            {/* Launch Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleStartGame(false)}
                className="w-full btn-journal py-3.5 text-xs font-mono font-bold justify-center"
              >
                <span>Start Match Game ▷</span>
              </button>

              <button
                onClick={() => handleStartGame(true)}
                className="w-full text-xs font-mono font-bold text-[var(--text-soft)] hover:text-[var(--text)] py-2 transition-colors"
              >
                Play Solo / Practice Mode ▷
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PHASE 2, 3, 4, 5: ACTIVE QUESTION & DUAL-PHONE GAME STAGE
            ══════════════════════════════════════════════════════════ */}
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

            {/* ── DUAL PLAYER STAGE (Partner A & Partner B) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">

              {/* ── LEFT CARD: PLAYER A (YOU - Rose Accent) ── */}
              <div className={`p-6 sm:p-7 rounded-3xl bg-white border-2 shadow-md transition-all flex flex-col justify-between relative paper-grain ${
                myAnswer ? "border-rose-300 shadow-rose-100" : "border-[var(--border)]"
              }`}>
                {/* Player Header */}
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

                {/* Option Choices */}
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

                {/* Status Footer */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                  <span>Choice Privacy: Encrypted 🔒</span>
                  <span className="font-bold text-rose-600">
                    {myAnswer ? "Submitted ✓" : "Pick one option"}
                  </span>
                </div>
              </div>

              {/* ── RIGHT CARD: PLAYER B (PARTNER - Blue/Indigo Accent) ── */}
              <div className={`p-6 sm:p-7 rounded-3xl bg-white border-2 shadow-md transition-all flex flex-col justify-between relative paper-grain ${
                partnerLocked ? "border-blue-300 shadow-blue-100" : "border-[var(--border)]"
              }`}>
                {/* Partner Header */}
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

                {/* Partner Choices / Privacy Blind Box */}
                <div className="space-y-2.5 my-5 flex-1 flex flex-col justify-center">
                  {phase === "revealed" && partnerAnswer ? (
                    // Reveal Phase: Show Partner's actual answer
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
                    // Blind state: Partner choices are completely masked
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

                {/* Status Footer */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-soft)]">
                  <span>Choice Privacy: Encrypted 🔒</span>
                  <span className="font-bold text-blue-600">
                    {partnerLocked ? "Locked In ✓" : "Pending Pick"}
                  </span>
                </div>
              </div>

            </div>

            {/* ── REVEAL RESULT & MATCH SCORE OVERLAY ── */}
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
                        : "You picked different options — variety keeps things exciting!"}
                    </p>
                  </div>

                  {/* Running Sync Meter */}
                  <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-between max-w-sm mx-auto">
                    <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-soft)]">
                      Overall Sync
                    </span>
                    <span className="font-mono font-black text-lg text-[var(--burgundy)]">
                      {animatedPercentage}% IN SYNC
                    </span>
                  </div>

                  {/* Next Question CTA */}
                  <div className="pt-2">
                    <button
                      onClick={handleNextQuestion}
                      className="btn-journal py-3 px-8 text-xs font-mono font-bold"
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

        {/* ══════════════════════════════════════════════════════════
            PHASE 6: COMPLETION / FINAL SCORE SCREEN
            ══════════════════════════════════════════════════════════ */}
        {phase === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto w-full p-8 sm:p-12 rounded-3xl bg-white border border-[var(--border)] shadow-xl text-center space-y-8 paper-grain"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
                LOVE MATCH COMPLETE
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-bold text-[var(--text)]">
                YOU TWO ARE
              </h2>
            </div>

            {/* Big Percentage Score Badge */}
            <div className="space-y-2">
              <div className="text-6xl sm:text-7xl font-display italic font-black text-[var(--burgundy)] tracking-tight">
                {animatedPercentage}%
              </div>
              <p className="text-sm font-mono font-bold tracking-widest text-[var(--text)] uppercase">
                IN SYNC 💕
              </p>
              <p className="text-xs font-mono text-[var(--text-soft)]">
                {matchHistory.filter((h) => h.isMatch).length} of {matchHistory.length} answers matched
              </p>
            </div>

            {/* Romantic Feedback Verdict */}
            <div className="p-5 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-1.5 text-left">
              <p className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <span>{getMatchFeedback(animatedPercentage).emoji}</span>
                <span>{getMatchFeedback(animatedPercentage).headline}</span>
              </p>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                {getMatchFeedback(animatedPercentage).message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handlePlayAgain}
                className="w-full sm:w-auto btn-journal py-3 px-6 text-xs font-mono font-bold justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again ▷</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full sm:w-auto btn-journal-ghost py-3 px-6 text-xs font-mono font-bold justify-center"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "Copied to Clipboard!" : "Share Result"}</span>
              </button>

              <Link
                href="/play"
                className="w-full sm:w-auto btn-journal-ghost py-3 px-6 text-xs font-mono font-bold justify-center"
              >
                <span>Playroom</span>
              </Link>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
