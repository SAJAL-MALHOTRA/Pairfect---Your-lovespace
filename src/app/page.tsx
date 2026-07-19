import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Sparkles, Music, Shield, ArrowRight, Play, Camera, Brain, Smile, Timer, Tv, HelpCircle, Lock } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#f8f9fb] dark:bg-[#09090b] transition-colors duration-300 overflow-hidden">
      
      {/* CSS Keyframes for Floating Hearts & animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-heart {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.12;
          }
          90% {
            opacity: 0.12;
          }
          100% {
            transform: translateY(-10vh) translateX(50px) scale(1) rotate(45deg);
            opacity: 0;
          }
        }
        .floating-heart {
          position: absolute;
          bottom: -50px;
          pointer-events: none;
          z-index: 1;
          color: #f472b6;
          fill: #f472b6;
          opacity: 0;
        }
      `}} />

      {/* Floating Hearts Background (Hero context) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Heart elements with varying animations */}
        <Heart className="floating-heart" style={{ left: "8%", animation: "float-heart 16s infinite linear", animationDelay: "0s" }} size={24} />
        <Heart className="floating-heart" style={{ left: "22%", animation: "float-heart 20s infinite linear", animationDelay: "3s" }} size={16} />
        <Heart className="floating-heart" style={{ left: "35%", animation: "float-heart 14s infinite linear", animationDelay: "1s" }} size={20} />
        <Heart className="floating-heart" style={{ left: "48%", animation: "float-heart 18s infinite linear", animationDelay: "5s" }} size={28} />
        <Heart className="floating-heart" style={{ left: "62%", animation: "float-heart 15s infinite linear", animationDelay: "2s" }} size={18} />
        <Heart className="floating-heart" style={{ left: "75%", animation: "float-heart 22s infinite linear", animationDelay: "4s" }} size={22} />
        <Heart className="floating-heart" style={{ left: "90%", animation: "float-heart 17s infinite linear", animationDelay: "6s" }} size={16} />
        <Heart className="floating-heart" style={{ left: "15%", animation: "float-heart 19s infinite linear", animationDelay: "8s" }} size={20} />
        <Heart className="floating-heart" style={{ left: "55%", animation: "float-heart 21s infinite linear", animationDelay: "9s" }} size={24} />
        <Heart className="floating-heart" style={{ left: "85%", animation: "float-heart 16s infinite linear", animationDelay: "11s" }} size={18} />
      </div>

      {/* Header */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between border-b border-border/65 z-10 relative bg-background/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-2.5">
          <span className="font-sans text-2xl font-black tracking-tighter text-foreground">
            pairfect
          </span>
          <div className="flex space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary rounded-chip text-xs py-2.5 px-5 shadow-pink-500/10 dark:shadow-none"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 md:py-20 flex flex-col space-y-32 z-10 relative">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16">
          <div className="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl">
            <div className="inline-flex items-center text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
              MADE FOR TWO • 100% PRIVATE COMPANION
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-sans font-black text-foreground tracking-tight leading-[1.05] text-balance">
              Sync your <span className="bg-gradient-to-r from-[#f472b6] to-[#60a5fa] bg-clip-text text-transparent">emotional rhythm</span>.
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed text-pretty">
              Pairfect is a dedicated private room for couples to share daily vibes, synchronize timers, broadcast media, and celebrate milestones away from public feeds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto btn-primary rounded-chip py-3 px-8 text-sm"
              >
                <span>Create Your Space</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto btn-secondary rounded-chip py-3 px-8 text-sm"
              >
                <span>Sign in with Partner</span>
              </Link>
            </div>
          </div>

          {/* Polaroid Strip Preview Illustration */}
          <div className="flex-1 flex justify-center relative w-full lg:max-w-md">
            <div className="relative border border-border bg-card p-4 rounded-card shadow-lg max-w-sm rotate-2 hover:rotate-0 transition-transform duration-300 w-full">
              {/* top strip header */}
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">POLAROID MEMORY STRIP</span>
                <span className="text-[10px] font-mono text-muted-foreground">JULY 2026</span>
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-muted rounded-image overflow-hidden relative border border-border/40">
                  <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=320&h=240&fit=crop" className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-300" alt="Cozy Date night" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">#01</div>
                </div>
                <div className="aspect-[4/3] bg-muted rounded-image overflow-hidden relative border border-border/40">
                  <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=320&h=240&fit=crop" className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-300" alt="Quiet morning cafe" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">#02</div>
                </div>
                <p className="font-sans font-extrabold text-sm text-center text-foreground py-2 italic text-pretty">
                  "Handwriting notes and quiet mornings together."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SHOWCASE GRID (6 features with icons, copy, visual previews) */}
        <section className="space-y-12">
          <div className="text-left max-w-xl">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
              THE PAIRFECT COMPANION SUITE
            </span>
            <h2 className="text-3xl font-sans font-black text-foreground tracking-tight mt-1.5">
              Everything in a single private room.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Daily Check-ins */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-pink-500/10 text-pink-500 border border-pink-500/25">
                    <Heart className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Daily
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Daily Vibe Check-in</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Log your rhythm using handpicked emoji states, intensity levels, and lo-fi tracks. Keeps you in sync with your partner's mood.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-3.5 rounded-button space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🥰</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-muted-foreground uppercase">
                      <span>Alex's Vibe</span>
                      <span>Loved (5/5)</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-foreground/80 italic">"Can't wait for our picnic tonight!"</p>
              </div>
            </div>

            {/* Feature 2: AI Vibe Judge */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-purple-500/10 text-purple-500 border border-purple-500/25">
                    <Brain className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Playful
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">AI Vibe Judge</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Settle playful relationship disputes using Gemini AI. Lock in your arguments and receive a binding, cute verdict.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-3 rounded-button space-y-2 text-[10px]">
                <div className="flex justify-between text-[8px] font-mono font-bold text-muted-foreground uppercase">
                  <span>Dispute Filed</span>
                  <span>VERDICT READY</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground">"Who left the window open?"</p>
                  <p className="text-purple-500 font-bold bg-purple-500/5 dark:bg-purple-950/20 p-1.5 rounded border border-purple-500/20 leading-snug">
                    ⚖️ Verdict: Mia buys ice cream to cool down the room.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Riddle Night */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-amber-500/10 text-amber-500 border border-amber-500/25">
                    <Smile className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Co-op
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Riddle Night</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Solve co-op riddles together. Supports instant typo-tolerant keyword validation so you can focus on guessing, not spelling.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-3 rounded-button space-y-2 text-[10px]">
                <div className="flex justify-between text-[8px] font-mono font-bold text-muted-foreground">
                  <span>Riddle #4</span>
                  <span className="text-amber-500 font-bold">12:34 elapsed</span>
                </div>
                <p className="font-medium text-foreground">"I speak without a mouth and hear without ears..."</p>
                <div className="bg-[#eab308]/10 text-amber-600 dark:text-amber-400 p-1.5 rounded font-mono text-[9px] text-center border border-yellow-500/20">
                  Guess: "ecko" (Matched: Echo! ✓)
                </div>
              </div>
            </div>

            {/* Feature 4: Love Letters */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-rose-500/10 text-rose-500 border border-rose-500/25">
                    <Heart className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Letters
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Wax-Sealed Love Letters</h3>
                  <h4 className="sr-only">Digital letters with custom wax stamps</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Compose digital envelopes sealed with physical-looking wax stamps. Embed cute cat photos using the Unsplash api.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-3.5 rounded-button flex items-center justify-center">
                <div className="border border-border/80 bg-card p-2 rounded shadow-sm text-center relative w-full max-w-[12rem] flex flex-col items-center">
                  <span className="text-2xl select-none">✉️</span>
                  <span className="block text-[8px] font-mono text-muted-foreground mt-1">To: My Sunshine</span>
                  {/* Wax Stamp Seal Mock */}
                  <div className="size-5 rounded-full bg-rose-500/35 border-2 border-rose-600 flex items-center justify-center text-[7px] text-rose-700 font-bold mt-1.5 shadow-sm">
                    ♥
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: Watch Together */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-sky-500/10 text-sky-500 border border-sky-500/25">
                    <Tv className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">
                    Sync
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Watch Together</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stream synchronized YouTube players over low-latency channels. Perfect for long-distance calls and digital dates.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-2.5 rounded-button space-y-1.5 text-[10px]">
                <div className="relative aspect-video bg-zinc-800 rounded overflow-hidden flex items-center justify-center text-white border border-border">
                  <Play className="size-6 fill-white" />
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] font-mono">
                    02:14 / 14:05
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-muted-foreground">
                  <span className="text-green-500">● Connected</span>
                  <span>Sync active</span>
                </div>
              </div>
            </div>

            {/* Feature 6: Shared Scrapbook */}
            <div className="card-standard p-6 flex flex-col justify-between min-h-[340px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex size-9 items-center justify-center rounded-button bg-teal-500/10 text-teal-500 border border-teal-500/25">
                    <Camera className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-500 border border-teal-500/20">
                    Memories
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-foreground">Shared Scrapbook</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A secure timeline of polaroid snapshots and anniversary counters. Keeps your shared milestones safe and searchable.
                  </p>
                </div>
              </div>
              {/* Visual preview */}
              <div className="mt-4 bg-muted/40 border border-border p-3 rounded-button flex justify-around gap-2">
                <div className="border border-border/80 bg-card p-1 pb-4 rounded shadow-sm text-center max-w-[4.5rem]">
                  <div className="w-12 h-10 bg-slate-200 dark:bg-zinc-800 rounded-sm overflow-hidden" />
                  <span className="block text-[6px] font-mono text-muted-foreground mt-1">JULY 12</span>
                </div>
                <div className="border border-border/80 bg-card p-1 pb-4 rounded shadow-sm text-center max-w-[4.5rem]">
                  <div className="w-12 h-10 bg-slate-200 dark:bg-zinc-800 rounded-sm overflow-hidden" />
                  <span className="block text-[6px] font-mono text-muted-foreground mt-1">JULY 19</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SOCIAL PROOF SECTION (Centered block with warm copy) */}
        <section className="bg-card border border-border/80 p-12 md:p-16 rounded-hero text-center space-y-6 relative overflow-hidden max-w-4xl mx-auto shadow-sm">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />
          
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#f472b6] dark:text-[#60a5fa] uppercase">
              100% PRIVATE • ZERO DISTRACTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-foreground tracking-tight leading-tight">
              Built for couples who want to stay close.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              No ads, no public feeds, and no vanity metrics. Pairfect was built from the ground up to offer couples a distraction-free, securely encrypted space to support each other, preserve daily memories, and share laughs.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-4 bg-muted px-4 py-2 rounded-chip border border-border text-xs text-foreground font-mono">
              <span className="flex items-center gap-1.5 text-green-500 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure RLS Applied</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span>No public indexing</span>
            </div>
          </div>
        </section>

      </main>

      {/* PRIVACY SHIELD FOOTER */}
      <footer className="border-t border-border bg-card/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-sans text-lg font-black tracking-tighter text-foreground">
                pairfect
              </span>
              <div className="flex space-x-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Dedicated space for couples. 100% private companion.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:support@pairfect.app" className="hover:text-foreground transition-colors">Contact Support</a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-muted-foreground">&copy; 2026 Pairfect. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
