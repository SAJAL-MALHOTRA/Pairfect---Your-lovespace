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
    <div className="relative min-h-screen flex flex-col justify-between bg-[var(--bg)] transition-colors duration-300 overflow-hidden">
      
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
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between border-b border-[var(--border-mid)] z-10 relative bg-[var(--background)]/85 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-2.5">
          <span className="font-display italic text-2xl font-black tracking-tight text-[var(--ink-dark)]">
            pairfect
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)]" />
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[var(--ink-mid)] hover:text-[var(--ink-dark)] transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary py-2.5 px-5 text-[10px] uppercase tracking-widest"
          >
            <span>Get Started</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 md:py-20 flex flex-col space-y-32 z-10 relative">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16">
          <div className="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl">
            <div className="inline-flex items-center text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              MADE FOR TWO · 100% PRIVATE KEEPSAKE
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display italic font-black text-[var(--ink-dark)] tracking-tight leading-[1.1] text-balance">
              A private space for the <span className="text-[var(--seal-red)]">two of you</span>.
            </h1>

            <p className="text-[var(--ink-mid)] text-base leading-relaxed text-pretty max-w-lg">
              Pairfect is a dedicated private companion for couples. A safe room to share daily moods, compose sealed love letters, compile shared scrapbooks, and spend quality digital time together.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto btn-primary py-3 px-8 text-[10px] uppercase tracking-widest"
              >
                <span>Create Your Space</span>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto btn-secondary py-3 px-8 text-[10px] uppercase tracking-widest"
              >
                <span>Sign in with Partner</span>
              </Link>
            </div>
          </div>

          {/* Polaroid Strip Preview Illustration */}
          <div className="flex-1 flex justify-center relative w-full lg:max-w-md">
            <div className="relative border border-[var(--border-mid)] bg-[var(--card-bg)] p-4 rounded-3xl shadow-lg max-w-sm rotate-2 hover:rotate-0 transition-transform duration-300 w-full paper-grain">
              {/* top strip header */}
              <div className="flex items-center justify-between mb-3 border-b border-[var(--border-mid)] pb-2">
                <span className="text-[8px] font-mono font-bold text-[var(--ink-light)]">POLAROID MEMORY STRIP</span>
                <span className="text-[8px] font-mono text-[var(--ink-light)]">JULY 2026</span>
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-[var(--border-mid)] rounded-xl overflow-hidden relative border">
                  <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=320&h=240&fit=crop" className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-300" alt="Cozy Date night" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">#01</div>
                </div>
                <div className="aspect-[4/3] bg-[var(--border-mid)] rounded-xl overflow-hidden relative border">
                  <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=320&h=240&fit=crop" className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-300" alt="Quiet morning cafe" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white">#02</div>
                </div>
                <p className="font-handwriting text-base text-center text-[var(--ink-dark)] py-2 italic">
                  "Handwritten notes and quiet mornings together."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SHOWCASE GRID (6 features with icons, copy, visual previews) */}
        <section className="space-y-8">
          <div className="text-left max-w-xl">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              THE RITUAL SUITE
            </span>
            <h2 className="text-2xl font-display italic font-black text-[var(--ink-dark)] mt-1">
              Everything in a single private space.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Daily Check-ins */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-[var(--seal-red)]/10 text-[var(--seal-red)] border border-[var(--seal-red)]/20">
                    <Heart className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                    Daily
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Daily Vibe Check-in</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    Log your daily feelings using handpicked emoji states, intensity levels, and lo-fi tracks. Keeps you in sync with your partner's mood.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Vibe Judge */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/25">
                    <Brain className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    Playful
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">AI Vibe Judge</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    Settle playful relationship disputes using Gemini AI. Lock in your arguments and receive a binding, cute verdict.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Riddle Night */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/25">
                    <Smile className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Co-op
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Riddle Night</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    Solve co-op riddles together. Supports instant typo-tolerant keyword validation so you can focus on guessing, not spelling.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Love Letters */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/25">
                    <Heart className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    Letters
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Wax-Sealed Love Letters</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    Compose digital envelopes sealed with physical-looking wax stamps. Fold, seal, and break the wax stamp ceremony.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5: Watch Together */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/25">
                    <Tv className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 border border-sky-500/20">
                    Sync
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Watch Together</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    Stream synchronized YouTube players over low-latency channels. Perfect for long-distance calls and digital dates.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6: Shared Scrapbook */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-6 rounded-3xl flex flex-col justify-between min-h-[320px] transition-transform hover:-translate-y-0.5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/25">
                    <Camera className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    Memories
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading italic font-bold text-base text-[var(--ink-dark)]">Shared Scrapbook</h3>
                  <p className="text-xs text-[var(--ink-mid)] leading-relaxed">
                    A secure timeline of polaroid snapshots and anniversary counters. Keeps your shared milestones safe and searchable.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SOCIAL PROOF SECTION */}
        <section className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-12 md:p-16 rounded-[32px] text-center space-y-6 relative overflow-hidden max-w-2xl mx-auto shadow-sm">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--seal-red)]" />
          
          <div className="space-y-4">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--ink-light)] uppercase">
              100% PRIVATE · ZERO NOISE
            </span>
            <h2 className="text-2xl font-display italic font-black text-[var(--ink-dark)] tracking-tight leading-tight">
              Built for couples who want to stay close.
            </h2>
            <p className="text-xs text-[var(--ink-mid)] leading-relaxed text-pretty">
              No ads, no public feeds, and no vanity metrics. Pairfect was built from the ground up to offer couples a distraction-free space to support each other, preserve daily memories, and share laughs.
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
      <footer className="border-t border-[var(--border-mid)] bg-[var(--card-bg)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-display italic text-lg font-black tracking-tight text-[var(--ink-dark)]">
                pairfect
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)]" />
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
