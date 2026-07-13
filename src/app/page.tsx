import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Sparkles, Music, BookOpen, Shield, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-tr from-brand-rose-50/50 via-brand-peach-50/30 to-brand-lavender-50/50 dark:from-[#131110] dark:via-[#1a1413] dark:to-[#11131a] overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-rose-300/10 dark:bg-brand-rose-950/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-peach-300/10 dark:bg-brand-peach-950/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-rose-500 flex items-center justify-center text-white shadow-md shadow-brand-rose-200 dark:shadow-none">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground bg-gradient-to-r from-brand-rose-500 to-brand-peach-500 bg-clip-text text-transparent">
            Valence
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-sm font-bold text-white bg-brand-rose-500 hover:bg-brand-rose-600 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col items-center justify-center text-center space-y-8 z-10 relative">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-rose-500/10 text-brand-rose-600 dark:text-brand-rose-400 text-xs font-bold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-brand-rose-500" />
          <span>A Private Space for Two</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight max-w-3xl leading-[1.15]">
          Sync your{" "}
          <span className="bg-gradient-to-r from-brand-rose-500 to-brand-peach-500 bg-clip-text text-transparent">
            emotional rhythm
          </span>{" "}
          together.
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
          Valence is a private, couple-facing relationship companion. Log your mood, track daily check-in streaks, link songs, and read weekly AI-generated recaps. No public feed, no distraction — just you and your partner.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-4 px-8 rounded-2xl text-base font-bold text-white bg-brand-rose-500 hover:bg-brand-rose-600 shadow-md shadow-brand-rose-200 dark:shadow-none active:scale-[0.98] transition-all"
          >
            <span>Create Your Space</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center py-4 px-8 rounded-2xl text-base font-bold text-foreground bg-white/60 dark:bg-card-bg/40 border border-card-border hover:bg-white transition-all active:scale-[0.98]"
          >
            <span>Sign in with Partner</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="cozy-card p-6 bg-white/40 dark:bg-card-bg/20 border border-card-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-rose-100 dark:bg-brand-rose-950/30 text-brand-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-brand-rose-400 stroke-brand-rose-500" />
            </div>
            <h3 className="font-bold text-base text-foreground">Daily Check-ins</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log your mood once a day using emoji states and intensity levels. Attach short personal thoughts for your partner.
            </p>
          </div>

          <div className="cozy-card p-6 bg-white/40 dark:bg-card-bg/20 border border-card-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-sage-100 dark:bg-brand-sage-950/30 text-brand-sage-600 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Spotify Mood Sync</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Link your Spotify account to attach your song of the moment directly to your check-ins and share your musical vibe.
            </p>
          </div>

          <div className="cozy-card p-6 bg-white/40 dark:bg-card-bg/20 border border-card-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-peach-100 dark:bg-brand-peach-950/30 text-brand-peach-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-brand-peach-300 stroke-brand-peach-500" />
            </div>
            <h3 className="font-bold text-base text-foreground">Weekly AI Recaps</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gemini AI compiles your weekly logs and private notes into warm, cozy summaries of your emotional trend over time.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground/60 pt-8">
          <Shield className="w-4 h-4" />
          <span>Encrypted under Row Level Security. Only you and your partner can access your space.</span>
        </div>
      </main>
    </div>
  );
}
