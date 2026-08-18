"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, AlertCircle, Check, Loader2 } from "lucide-react";
import { OtpInput } from "@/components/otp-input";
import { trackLogin } from "@/lib/analytics";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read any error passed via query parameter (e.g. from OAuth failure)
  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) {
      setError(queryError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailUnconfirmed(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        const isUnconfirmed =
          loginError.message.toLowerCase().includes("confirm") ||
          loginError.message.toLowerCase().includes("verified") ||
          loginError.message.toLowerCase().includes("verification");

        const isRateLimit =
          loginError.status === 429 ||
          loginError.message.toLowerCase().includes("rate limit") ||
          loginError.message.toLowerCase().includes("too many requests") ||
          loginError.message.toLowerCase().includes("throttle");

        if (isUnconfirmed) {
          setEmailUnconfirmed(true);
        } else if (isRateLimit) {
          setError("Too many login attempts. Please wait a moment before trying again, or use Google Sign-In.");
        } else {
          setError(loginError.message || "Invalid email or password.");
        }
        setLoading(false);
      } else {
        trackLogin("email");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    trackLogin("google");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (cooldown > 0 || !cleanEmail) return;
    setError(null);
    setResendStatus(null);
    setLoading(true);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });
      if (resendErr) throw resendErr;
      setResendStatus("Verification code sent! Check your inbox.");
      setCooldown(60);
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join("");
    const cleanEmail = email.trim().toLowerCase();
    if (enteredCode.length < 6 || !cleanEmail) return;
    setLoading(true);
    setError(null);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: enteredCode,
        type: "signup",
      });

      if (verifyErr) throw verifyErr;

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Verification error on login:", err);
      setError("Incorrect code, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-[var(--bg)] text-[var(--text)] paper-grain selection:bg-[var(--burgundy)] selection:text-white">
      
      {/* ── AMBIENT WARMTH GLOW ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 animate-fade-in opacity-40"
        style={{
          background: "radial-gradient(50rem 30rem at 50% 10%, var(--rose) 0%, transparent 60%)",
        }}
      />

      {/* ── HEADER ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2 px-4">
        <Link href="/" className="inline-flex items-center gap-2 justify-center group transition-transform hover:scale-105">
          <Image src="/logo-book.png" alt="Pairfect" width={32} height={32} className="rounded-lg shadow-xs" priority />
          <span className="font-display italic text-3xl font-black tracking-tight text-[var(--text)]">pairfect</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8DA1] inline-block shadow-xs" />
        </Link>
        <h1 className="font-display italic text-3xl sm:text-4xl font-bold text-[var(--text)] leading-tight">
          Welcome to Pairfect
        </h1>
        <p className="text-xs text-[var(--text-soft)] font-mono uppercase tracking-[0.2em]">
          A PRIVATE ROOM FOR THE TWO OF YOU
        </p>
      </div>

      {/* ── CARD CONTAINER ── */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--paper-warm)] p-7 sm:p-9 shadow-xl paper-grain backdrop-blur-md">
          {/* Top Rose-Burgundy Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--rose)] via-[var(--burgundy)] to-[var(--rose)]" />

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {emailUnconfirmed && (
            <form onSubmit={handleVerifyOtp} className="mb-6 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-[var(--text)] text-sm space-y-4 animate-fade-in">
              <div className="flex items-start space-x-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-sans font-bold text-xs uppercase tracking-wider font-mono">Verify Your Email</p>
                  <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                    Please verify your email first — enter the 6-digit verification code sent to <span className="font-bold text-[var(--text)]">{email}</span>
                  </p>
                </div>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full btn-journal py-3 text-xs font-mono font-bold justify-center shadow-sm cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify Code ▷"}
              </button>

              <button
                type="button"
                disabled={loading || cooldown > 0}
                onClick={handleResendEmail}
                className="w-full text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] py-1 transition-colors"
              >
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
              </button>
            </form>
          )}

          {resendStatus && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:border-[var(--burgundy)] focus-within:ring-2 focus-within:ring-[var(--burgundy)]/20 transition-all shadow-inner">
                <Mail className="h-4 w-4 text-[var(--text-soft)]/70 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/45 focus:outline-none focus:ring-0"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5">
                Password
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:border-[var(--burgundy)] focus-within:ring-2 focus-within:ring-[var(--burgundy)]/20 transition-all shadow-inner">
                <Lock className="h-4 w-4 text-[var(--text-soft)]/70 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/45 focus:outline-none focus:ring-0"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-journal py-3.5 text-xs font-mono font-bold justify-center shadow-md cursor-pointer hover:shadow-lg transition-all"
              >
                <span>{loading ? "Signing in..." : "Sign In ▷"}</span>
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
              <span className="bg-[var(--paper-warm)] px-3 text-[var(--text-soft)]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full btn-journal-ghost py-3.5 text-xs font-mono font-bold justify-center cursor-pointer hover:bg-[var(--paper-mid)] transition-all"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 text-center border-t border-[var(--border)] pt-5">
            <p className="text-xs text-[var(--text-soft)] font-mono">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/signup"
                className="font-bold text-[var(--burgundy)] hover:underline transition-colors ml-1"
              >
                Sign up instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--burgundy)]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
