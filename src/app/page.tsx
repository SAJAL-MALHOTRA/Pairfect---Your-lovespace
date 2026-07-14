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
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, #3a2527 0%, transparent 55%), radial-gradient(50rem 40rem at 100% 10%, #2e1e20 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-2.5">
          <img src="/logo-book.png" alt="Pairfect Logo" className="w-12 h-12 object-contain" />
          <span className="font-serif text-xl font-semibold tracking-tight text-primary">
            Pairfect
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
            className="inline-flex items-center justify-center text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center space-y-8 z-10 relative">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-primary" />
          <span>A Private Space for Two</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-semibold text-foreground tracking-tight max-w-3xl leading-[1.15] text-balance">
          Sync your{" "}
          <span className="bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
            emotional rhythm
          </span>{" "}
          together.
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed text-pretty">
          Pairfect is a private, couple-facing relationship companion. Log your mood, track daily check-in streaks, link cozy songs, and read weekly AI-generated recaps. No public feed, no distraction — just you and your partner.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-4 px-8 rounded-2xl text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/95 active:scale-[0.98] transition-all"
          >
            <span>Create Your Space</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center py-4 px-8 rounded-2xl text-base font-semibold text-foreground bg-card/55 border border-border/60 hover:bg-card transition-all active:scale-[0.98]"
          >
            <span>Sign in with Partner</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-sm backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center">
              <Heart className="w-5 h-5 fill-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Daily Check-ins</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log your mood once a day using emoji states and intensity levels. Attach short personal thoughts for your partner.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-sm backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Cozy Music Sync</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Attach cozy lo-fi tracks directly to your daily check-in logs to express your musical mood and share the soundtrack of your day.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-sm backdrop-blur-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Weekly AI Recaps</h3>
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
