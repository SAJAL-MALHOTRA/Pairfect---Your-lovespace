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
          <div className="w-8 h-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
              <Gamepad2 className="w-7 h-7 text-primary" />
              <span>Couple Trivia</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Test how well you know each other! Create questions and grade guesses.
            </p>
          </div>

          {/* Compatibility Score Widget */}
          {scoreData.percentage !== null && (
            <div className="inline-flex items-center space-x-3 px-5 py-3.5 rounded-lg bg-pink-500/10 border border-pink-500/20 self-start md:self-auto shadow-sm">
              <Trophy className="w-6 h-6 text-pink-500 fill-pink-500/10" />
              <div>
                <p className="text-[9px] font-mono font-bold text-pink-500 tracking-wider uppercase">
                  Compatibility Score
                </p>
                <p className="text-base font-bold text-foreground">
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
              <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Guess {partner?.display_name || "Partner"}'s Answers</span>
              </h2>

              {partnerQuestions.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/45" />
                  <p className="text-xs font-bold font-sans">No questions written by your partner yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {partnerQuestions.map((q) => {
                    const myGuess = q.quiz_guesses?.find((g: any) => g.guessed_by === user?.id);

                    return (
                      <div key={q.id} className="relative overflow-hidden rounded-lg border border-border bg-card p-5 space-y-4 hover:border-gray-300 dark:hover:border-white/20 transition-all">
                        {/* 3px top gradient accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

                        <p className="font-bold text-base text-foreground leading-tight">
                          "{q.question_text}"
                        </p>

                        {myGuess ? (
                          <div className="pt-3 border-t border-border flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                                Your Guess
                              </p>
                              <p className="text-sm font-medium text-foreground italic">
                                "{myGuess.guess_text}"
                              </p>
                            </div>
                            
                            {myGuess.status === "pending" && (
                              <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 uppercase">
                                Pending Grading
                              </span>
                            )}
                            {myGuess.status === "correct" && (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20 uppercase">
                                <Check className="w-3.5 h-3.5" />
                                <span>Correct!</span>
                              </span>
                            )}
                            {myGuess.status === "incorrect" && (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 uppercase">
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
                              className="flex-1 px-3.5 py-2 border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground"
                            />
                            <button
                              onClick={() => handleSubmitGuess(q.id)}
                              disabled={submittingGuess === q.id || !guessesInput[q.id]?.trim()}
                              className="p-2.5 rounded-md bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 text-white active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow"
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
              <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <span>Your Questions & Grading</span>
              </h2>

              {myQuestions.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                  <p className="text-xs font-bold font-sans">You haven't written any questions yet. Add one in the sidebar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myQuestions.map((q) => {
                    const partnerGuess = q.quiz_guesses?.[0]; // single guess unique constraint

                    return (
                      <div key={q.id} className="relative overflow-hidden rounded-lg border border-border bg-card p-5 space-y-4 hover:border-gray-300 dark:hover:border-white/20 transition-all">
                        {/* 3px top gradient accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

                        <div>
                          <p className="font-bold text-base text-foreground leading-tight">
                            "{q.question_text}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Your correct answer: <span className="font-bold text-pink-500">"{q.correct_answer}"</span>
                          </p>
                        </div>

                        {partnerGuess ? (
                          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
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
                                  className="p-2 border border-border bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors cursor-pointer"
                                  title="Mark Incorrect"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleGradeGuess(partnerGuess.id, "correct")}
                                  className="px-4 py-2 border border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-bold rounded flex items-center space-x-1.5 transition-all active:scale-95 shadow cursor-pointer text-xs"
                                  title="Mark Correct"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Correct</span>
                                </button>
                              </div>
                            ) : (
                              <div className="self-end sm:self-auto">
                                {partnerGuess.status === "correct" ? (
                                  <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20 uppercase">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Correct</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 uppercase">
                                    <X className="w-3.5 h-3.5" />
                                    <span>Incorrect</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-border text-xs text-muted-foreground italic">
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
            <div className="rounded-lg border border-border bg-card p-6 sticky top-24 shadow-sm">
              <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-primary" />
                <span>Write a Question</span>
              </h2>

              <form onSubmit={handleCreateQuestion} className="space-y-4 mt-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Trivia Question
                  </label>
                  <textarea
                    placeholder="e.g. What is my favorite movie of all time?"
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="block w-full h-20 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interstellar"
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                    This answer remains hidden from your partner until they submit their guess.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingQuestion || !questionText.trim() || !correctAnswer.trim()}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-md shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
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
