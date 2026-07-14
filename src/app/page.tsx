import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Sparkles, Music, BookOpen, Shield, ArrowRight, Play, Check } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#f8f9fb] dark:bg-[#0a0a0b] transition-colors duration-300">
      
      {/* Header */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between border-b border-gray-200 dark:border-white/10 z-10 relative bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="font-sans text-2xl font-black tracking-tighter text-foreground">
              pairfect
            </span>
            <div className="flex space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-foreground transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 px-5 py-2.5 rounded-md shadow-sm transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 md:py-20 flex flex-col space-y-24 z-10 relative">
        
        {/* HERO SECTION */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl">
            <div className="inline-flex items-center text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">
              MADE FOR TWO • 100% PRIVATE COMPANION
            </div>

            <h1 className="text-5xl sm:text-7xl font-sans font-black text-foreground tracking-tight leading-[1.05] text-balance">
              Sync your <span className="bg-gradient-to-r from-[#f472b6] to-[#60a5fa] bg-clip-text text-transparent">emotional rhythm</span>.
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed text-pretty">
              Pairfect is a private, couple-facing relationship companion. Log your mood, track daily streaks, link cozy songs, and read weekly AI-generated recaps. No public feed, no distraction — just you and your partner.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-3 px-6 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 transition-all shadow-md shadow-pink-500/10 dark:shadow-none"
              >
                <span>Create Your Space</span>
                <Play className="w-3.5 h-3.5 fill-white" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-6 rounded-md text-sm font-bold text-foreground bg-white dark:bg-[#16161a] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1e1e24] transition-all"
              >
                <span>Sign in with Partner</span>
              </Link>
            </div>
          </div>

          {/* Photo strip preview illustration */}
          <div className="flex-1 flex justify-center relative">
            <div className="relative border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161a] p-4 rounded-xl shadow-lg max-w-sm rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/5 pb-2">
                <span className="text-[10px] font-mono font-bold text-gray-400">POLAROID STRIP #04</span>
                <span className="text-[10px] font-mono text-gray-400">JULY 2026</span>
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=320&h=240&fit=crop" className="w-full h-full object-cover" alt="Date" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">01</div>
                </div>
                <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=320&h=240&fit=crop" className="w-full h-full object-cover" alt="Coffee" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">02</div>
                </div>
                <p className="font-serif italic text-sm text-center text-gray-700 dark:text-gray-300 py-1.5 font-bold">
                  Handwriting notes and quiet coffee mornings
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="space-y-12">
          <div className="text-left max-w-xl">
            <span className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">
              ALL FEATURES & PLACES
            </span>
            <h2 className="text-3xl font-sans font-black text-foreground tracking-tight mt-1.5">
              Everything in a single private room.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161a] p-6 rounded-md relative overflow-hidden flex flex-col justify-between min-h-[200px] hover:border-gray-300 dark:hover:border-white/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded bg-[#f472b6]/10 text-[#f472b6] flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-[#f472b6]" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Always Free
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Daily Check-ins</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Log your mood once a day using emoji states and intensity levels. Attach short personal thoughts for your partner.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161a] p-6 rounded-md relative overflow-hidden flex flex-col justify-between min-h-[200px] hover:border-gray-300 dark:hover:border-white/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded bg-[#60a5fa]/10 text-[#60a5fa] flex items-center justify-center">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Active
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Cozy Music Sync</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Attach cozy lo-fi tracks directly to your daily check-in logs to express your musical mood and share the soundtrack of your day.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161a] p-6 rounded-md relative overflow-hidden flex flex-col justify-between min-h-[200px] hover:border-gray-300 dark:hover:border-white/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded bg-[#f472b6]/10 text-[#f472b6] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 fill-[#f472b6]" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
                    New
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Weekly AI Recaps</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Gemini AI compiles your weekly logs and private notes into warm, cozy summaries of your emotional trend over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHOWCASE SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-white dark:bg-[#16161a] border border-gray-200 dark:border-white/10 p-8 md:p-12 rounded-xl">
          <div className="flex-1 space-y-6 max-w-xl">
            <span className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">
              SEE IT IN ACTION
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-foreground tracking-tight leading-tight">
              Watch a round of daily check-ins.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              One question, two screens. You both lock in privately — nobody can peek — then the answers flip at the exact same second. Match, and the spark flies.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center space-x-2 py-3 px-5 rounded-md text-xs font-bold text-white bg-black dark:bg-[#0a0a0b] hover:opacity-95 transition-all border border-gray-300 dark:border-white/10"
            >
              <span>Play it free</span>
              <Play className="w-3 h-3 fill-white ml-1" />
            </Link>
          </div>

          {/* Split screen demonstration card */}
          <div className="flex-1 flex justify-center w-full">
            <div className="border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0b] p-6 rounded-xl w-full max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Screen */}
                <div className="border-t-4 border-pink-400 bg-white dark:bg-[#16161a] border border-gray-200 dark:border-white/10 p-4 rounded-md space-y-3">
                  <div className="flex justify-between items-center text-[8px] font-mono font-bold">
                    <span className="text-pink-500">MIA</span>
                    <span className="text-gray-400">ANSWERS HONESTLY</span>
                  </div>
                  <p className="text-[10px] font-bold text-foreground">What's Mia's go-to karaoke song?</p>
                  <div className="bg-gradient-to-r from-[#f472b6] to-[#60a5fa] text-white p-2 rounded text-[10px] font-bold flex justify-between items-center">
                    <span>Bohemian Rhapsody</span>
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded text-[10px] text-gray-400">Something by IU</div>
                  <span className="text-[8px] font-bold text-green-500 block">locked in ✓</span>
                </div>

                {/* Right Screen */}
                <div className="border-t-4 border-blue-400 bg-white dark:bg-[#16161a] border border-gray-200 dark:border-white/10 p-4 rounded-md space-y-3">
                  <div className="flex justify-between items-center text-[8px] font-mono font-bold">
                    <span className="text-blue-500">ALEX</span>
                    <span className="text-gray-400">GUESSES HER ANSWER</span>
                  </div>
                  <p className="text-[10px] font-bold text-foreground">What's Mia's go-to karaoke song?</p>
                  <div className="bg-gradient-to-r from-[#f472b6] to-[#60a5fa] text-white p-2 rounded text-[10px] font-bold flex justify-between items-center">
                    <span>Bohemian Rhapsody</span>
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded text-[10px] text-gray-400">Something by IU</div>
                  <span className="text-[8px] font-bold text-green-500 block">locked in ✓</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center space-x-1 shadow-sm">
                  <span>✓ Matched! 💖</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACY SHIELD FOOTER */}
        <section className="flex flex-col items-center justify-center space-y-4 text-center py-6 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4 text-gray-400" />
            <span>Encrypted under Row Level Security. Only you and your partner can access your space.</span>
          </div>
          <p className="text-[10px] text-gray-400">&copy; 2026 Pairfect. All rights reserved.</p>
        </section>

      </main>
    </div>
  );
}
