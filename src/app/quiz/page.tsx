"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Gamepad2, Plus, Check, X, Loader2, AlertCircle, 
  HelpCircle, MessageCircle, Trophy, Sparkles, Send 
} from "lucide-react";
import { format } from "date-fns";

export default function QuizPage() {
  const { user, pair, profile, partner, loading } = useAuth();
  
  // Quiz states
  const [questions, setQuestions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingGuess, setSubmittingGuess] = useState<string | null>(null);
  
  // Form states
  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [guessesInput, setGuessesInput] = useState<{ [key: string]: string }>({});
  
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchQuestionsAndGuesses = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      // Query questions and embed their answers/guesses
      const { data, error: fetchErr } = await supabase
        .from("quiz_questions")
        .select(`
          *,
          quiz_guesses (
            id,
            guessed_by,
            guess_text,
            status,
            created_at
          )
        `)
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (fetchErr) throw fetchErr;
      setQuestions(data || []);
    } catch (err) {
      console.error("Error loading trivia database:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchQuestionsAndGuesses();

      // Subscribe to quiz changes (real-time updates)
      const qChannel = supabase
        .channel(`quiz-channel-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quiz_questions", filter: `pair_id=eq.${pair.id}` },
          () => fetchQuestionsAndGuesses()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quiz_guesses" },
          () => fetchQuestionsAndGuesses()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(qChannel);
      };
    }
  }, [pair, loading]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) return;
    if (!questionText.trim() || !correctAnswer.trim()) {
      setError("Please fill in both the question and the correct answer.");
      return;
    }

    setSubmittingQuestion(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("quiz_questions")
        .insert({
          pair_id: pair.id,
          created_by: user!.id,
          question_text: questionText.trim(),
          correct_answer: correctAnswer.trim(),
        });

      if (insertErr) throw insertErr;

      setQuestionText("");
      setCorrectAnswer("");
      await fetchQuestionsAndGuesses();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create question.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitGuess = async (questionId: string) => {
    const guessText = guessesInput[questionId];
    if (!guessText || !guessText.trim()) return;

    setSubmittingGuess(questionId);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("quiz_guesses")
        .insert({
          question_id: questionId,
          guessed_by: user!.id,
          guess_text: guessText.trim(),
          status: "pending",
        });

      if (insertErr) throw insertErr;

      // Clear input
      setGuessesInput((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });

      await fetchQuestionsAndGuesses();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit guess.");
    } finally {
      setSubmittingGuess(null);
    }
  };

  const handleGradeGuess = async (guessId: string, status: "correct" | "incorrect") => {
    try {
      const { error: updateErr } = await supabase
        .from("quiz_guesses")
        .update({ status })
        .eq("id", guessId);

      if (updateErr) throw updateErr;
      await fetchQuestionsAndGuesses();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to grade guess.");
    }
  };

  // Compatibility score math
  const calculateScore = () => {
    let totalGraded = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      q.quiz_guesses?.forEach((g: any) => {
        if (g.status === "correct" || g.status === "incorrect") {
          totalGraded++;
          if (g.status === "correct") {
            correctCount++;
          }
        }
      });
    });

    return {
      percentage: totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : null,
      correctCount,
      totalGraded,
    };
  };

  const scoreData = calculateScore();
  const myQuestions = questions.filter((q) => q.created_by === user?.id);
  const partnerQuestions = questions.filter((q) => q.created_by !== user?.id);

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-peach-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-peach-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-2">
              <Gamepad2 className="w-8 h-8 text-brand-peach-500" />
              <span>Couple Trivia</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Test how well you know each other! Create questions and grade guesses.
            </p>
          </div>

          {/* Compatibility Score Widget */}
          {scoreData.percentage !== null && (
            <div className="inline-flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-brand-rose-500/10 border border-brand-rose-200/50 dark:border-brand-rose-950/20 self-start md:self-auto shadow-sm">
              <Trophy className="w-6 h-6 text-brand-rose-500 fill-brand-rose-400/25" />
              <div>
                <p className="text-xs text-brand-rose-600 dark:text-brand-rose-400 font-semibold tracking-wide uppercase">
                  Compatibility Score
                </p>
                <p className="text-lg font-bold text-foreground">
                  {scoreData.percentage}% Match ({scoreData.correctCount}/{scoreData.totalGraded})
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column A: Feed & Inputs (2/3 width) */}
          <div className="md:col-span-2 space-y-8">
            
            {/* 1. GUESS PARTNER'S QUESTIONS */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-brand-peach-500" />
                <span>Guess {partner?.display_name || "Partner"}'s Answers</span>
              </h2>

              {partnerQuestions.length === 0 ? (
                <div className="cozy-card p-8 text-center text-muted-foreground border border-dashed border-card-border bg-white/20">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs">No questions written by your partner yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {partnerQuestions.map((q) => {
                    const myGuess = q.quiz_guesses?.find((g: any) => g.guessed_by === user?.id);

                    return (
                      <div key={q.id} className="cozy-card p-5 bg-white/60 dark:bg-[#1e1a19]/60 border border-card-border space-y-4">
                        <p className="font-bold text-base text-foreground">
                          "{q.question_text}"
                        </p>

                        {myGuess ? (
                          <div className="pt-3 border-t border-card-border/50 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                Your Guess
                              </p>
                              <p className="text-sm font-medium text-foreground italic">
                                "{myGuess.guess_text}"
                              </p>
                            </div>
                            
                            {myGuess.status === "pending" && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full uppercase border border-amber-200/50">
                                Pending Grading
                              </span>
                            )}
                            {myGuess.status === "correct" && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full uppercase border border-green-200/50">
                                <Check className="w-3.5 h-3.5" />
                                <span>Correct!</span>
                              </span>
                            )}
                            {myGuess.status === "incorrect" && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full uppercase border border-red-200/50">
                                <X className="w-3.5 h-3.5" />
                                <span>Incorrect</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="pt-2 flex items-center space-x-3">
                            <input
                              type="text"
                              placeholder="Type your guess here..."
                              value={guessesInput[q.id] || ""}
                              onChange={(e) =>
                                setGuessesInput((prev) => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
                              className="flex-1 px-3.5 py-2 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-sm text-foreground"
                            />
                            <button
                              onClick={() => handleSubmitGuess(q.id)}
                              disabled={submittingGuess === q.id || !guessesInput[q.id]?.trim()}
                              className="p-2.5 rounded-xl bg-brand-peach-500 hover:bg-brand-peach-600 text-white active:scale-95 disabled:opacity-50 transition-all"
                            >
                              {submittingGuess === q.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. MY QUESTIONS (GRADING FEED) */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5 text-brand-rose-500" />
                <span>Your Questions & Grading</span>
              </h2>

              {myQuestions.length === 0 ? (
                <div className="cozy-card p-8 text-center text-muted-foreground border border-dashed border-card-border bg-white/20">
                  <p className="text-xs">You haven't written any questions yet. Add one in the sidebar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myQuestions.map((q) => {
                    const partnerGuess = q.quiz_guesses?.[0]; // single guess unique constraint

                    return (
                      <div key={q.id} className="cozy-card p-5 bg-white/60 dark:bg-[#1e1a19]/60 border border-card-border space-y-4">
                        <div>
                          <p className="font-bold text-base text-foreground">
                            "{q.question_text}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your correct answer: <span className="font-semibold text-brand-peach-500">"{q.correct_answer}"</span>
                          </p>
                        </div>

                        {partnerGuess ? (
                          <div className="pt-3 border-t border-card-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                {partner?.display_name || "Partner"}'s Guess
                              </p>
                              <p className="text-sm font-medium text-foreground italic">
                                "{partnerGuess.guess_text}"
                              </p>
                            </div>

                            {partnerGuess.status === "pending" ? (
                              <div className="flex items-center space-x-2 self-end sm:self-auto">
                                <button
                                  onClick={() => handleGradeGuess(partnerGuess.id, "incorrect")}
                                  className="p-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                                  title="Mark Incorrect"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleGradeGuess(partnerGuess.id, "correct")}
                                  className="px-4 py-2 border border-transparent bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
                                  title="Mark Correct"
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="text-xs">Correct</span>
                                </button>
                              </div>
                            ) : (
                              <div className="self-end sm:self-auto">
                                {partnerGuess.status === "correct" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full uppercase border border-green-200/50">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Correct</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full uppercase border border-red-200/50">
                                    <X className="w-3.5 h-3.5" />
                                    <span>Incorrect</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-card-border/50 text-xs text-muted-foreground italic">
                            Waiting for {partner?.display_name || "your partner"} to write a guess.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Column B: Form Input (1/3 width) */}
          <div className="space-y-4">
            <div className="cozy-card p-6 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border sticky top-24">
              <h2 className="text-base font-bold text-foreground flex items-center space-x-2 pb-3 border-b border-card-border/50">
                <Plus className="w-5 h-5 text-brand-peach-500" />
                <span>Write a Question</span>
              </h2>

              <form onSubmit={handleCreateQuestion} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Trivia Question
                  </label>
                  <textarea
                    placeholder="e.g. What is my favorite movie of all time?"
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="block w-full h-20 px-3 py-2 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-foreground text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interstellar"
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-peach-300 text-foreground text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                    This answer remains hidden from your partner until they submit their guess.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingQuestion || !questionText.trim() || !correctAnswer.trim()}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-peach-500 hover:bg-brand-peach-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  {submittingQuestion && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Question</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
