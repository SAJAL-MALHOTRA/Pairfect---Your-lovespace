"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, Lock, Mail, User, AlertCircle, Check, KeyRound, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { OtpInput } from "@/components/otp-input";
import { isBetaModeEnabled, isValidBetaCode, isEmailWhitelisted } from "@/lib/beta";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const betaEnabled = isBetaModeEnabled();
  const urlBetaCode = searchParams.get("beta") || "";

  // Beta gating state
  const [betaCodeInput, setBetaCodeInput] = useState(urlBetaCode);
  const [isBetaUnlocked, setIsBetaUnlocked] = useState(false);
  const [betaError, setBetaError] = useState<string | null>(null);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Registration state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check URL beta code on mount
  useEffect(() => {
    if (!betaEnabled) {
      setIsBetaUnlocked(true);
      return;
    }

    if (urlBetaCode && isValidBetaCode(urlBetaCode)) {
      setIsBetaUnlocked(true);
      setBetaCodeInput(urlBetaCode);
    }
  }, [betaEnabled, urlBetaCode]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle manual Beta code unlock
  const handleUnlockBeta = (e: React.FormEvent) => {
    e.preventDefault();
    setBetaError(null);

    if (isValidBetaCode(betaCodeInput)) {
      setIsBetaUnlocked(true);
    } else {
      setBetaError("Invalid invite code. Please check for typos or join our waitlist below.");
    }
  };

  // Handle Waitlist application
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) return;

    setWaitlistLoading(true);
    try {
      await fetch("/api/beta/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      setWaitlistSubmitted(true);
    } catch (err) {
      setWaitlistSubmitted(true);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsRateLimited(false);

    const cleanEmail = email.trim().toLowerCase();

    // Verify beta permission if beta mode is active
    if (betaEnabled && !isValidBetaCode(betaCodeInput) && !isEmailWhitelisted(cleanEmail)) {
      setError("A valid Beta Invite Code is required to create an account during our private testing.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName,
            beta_code: betaCodeInput,
          },
        },
      });

      if (signupError) {
        throw signupError;
      } else {
        if (data.user && !data.session) {
          // Email confirmation is enabled
          setVerificationEmail(cleanEmail);
          setNeedsVerification(true);
          setLoading(false);
        } else {
          // Direct login after signup
          window.location.href = "/onboarding";
        }
      }
    } catch (err: any) {
      console.error("Signup exception caught:", err);

      const isRateLimit =
        err.status === 429 ||
        err.message?.toLowerCase().includes("rate limit") ||
        err.message?.toLowerCase().includes("email limit") ||
        err.message?.toLowerCase().includes("throttle") ||
        err.code === "over_email_send_rate_limit" ||
        err.message?.toLowerCase().includes("exceeded");

      if (isRateLimit) {
        setIsRateLimited(true);
      } else {
        setError(err.message || "Failed to create account.");
      }
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || !verificationEmail) return;
    setError(null);
    setResendStatus(null);
    setLoading(true);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
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
    if (enteredCode.length < 6 || !verificationEmail) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: enteredCode,
        type: "signup",
      });

      if (verifyErr) throw verifyErr;

      window.location.href = "/onboarding";
    } catch (err: any) {
      console.error("Verification error:", err);
      setError("Incorrect code, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
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

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-[var(--bg)] text-[var(--text)] paper-grain">
      
      {/* ── HEADER ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-1">
        <Link href="/" className="inline-flex items-center gap-1.5 justify-center mb-2">
          <span className="font-display italic text-3xl font-black text-[var(--text)]">pairfect</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8DA1] inline-block shadow-xs" />
        </Link>
        <h2 className="font-display italic text-2xl sm:text-3xl font-bold text-[var(--text)]">
          {betaEnabled && !isBetaUnlocked ? "Private Beta Access" : "Create Your Space"}
        </h2>
        <p className="text-xs text-[var(--text-soft)] font-mono max-w-xs mx-auto uppercase tracking-wider">
          {betaEnabled && !isBetaUnlocked ? "Invitation Only Testing" : "Start your private journal for two"}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-7 sm:p-9 shadow-md paper-grain">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[var(--burgundy)]" />

          {/* ══════════════════════════════════════════════════════════
              CASE 1: BETA GATE LOCKED SCREEN (Requires Beta Code)
              ══════════════════════════════════════════════════════════ */}
          {betaEnabled && !isBetaUnlocked ? (
            <div className="space-y-6 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto text-xl shadow-xs">
                🔒
              </div>

              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 text-[9px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Early Access</span>
                </div>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Pairfect is currently open exclusively to invited beta tester couples. Enter your invite code below to unlock your space.
                </p>
              </div>

              {/* Beta Code Entry Form */}
              <form onSubmit={handleUnlockBeta} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-2">
                    Beta Invite Code
                  </label>
                  <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                    <KeyRound className="h-4 w-4 text-[var(--text-soft)]/60 shrink-0" />
                    <input
                      type="text"
                      required
                      value={betaCodeInput}
                      onChange={(e) => setBetaCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] font-mono text-sm font-bold uppercase tracking-widest placeholder:text-[var(--text-soft)]/40 focus:outline-none focus:ring-0"
                      placeholder="ENTER INVITE CODE"
                    />
                  </div>
                </div>

                {betaError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{betaError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full btn-journal py-3 text-xs font-mono font-bold justify-center shadow-sm"
                >
                  <span>Unlock Signup ▷</span>
                </button>
              </form>

              {/* Waitlist Section */}
              <div className="pt-5 border-t border-[var(--border)] space-y-3 text-center">
                <p className="text-[11px] font-bold text-[var(--text)]">
                  Don&apos;t have an invite code?
                </p>

                {waitlistSubmitted ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="font-medium">You&apos;re on the waitlist! We&apos;ll send your code soon.</span>
                  </div>
                ) : (
                  <form onSubmit={handleJoinWaitlist} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-[var(--burgundy)]"
                      />
                      <button
                        type="submit"
                        disabled={waitlistLoading}
                        className="px-3.5 py-2 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] text-[10px] font-mono font-bold uppercase tracking-wider hover:border-[var(--burgundy)] transition-colors shrink-0"
                      >
                        {waitlistLoading ? "..." : "Join Waitlist"}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-soft)]">
                      We roll out new beta invites weekly.
                    </p>
                  </form>
                )}
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                >
                  Already approved? <span className="font-bold text-[var(--burgundy)] underline">Log in</span>
                </Link>
              </div>
            </div>
          ) : needsVerification ? (
            /* ══════════════════════════════════════════════════════════
               CASE 2: OTP EMAIL CONFIRMATION SCREEN
               ══════════════════════════════════════════════════════════ */
            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center py-4 animate-fade-in">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-[var(--text)]">Confirm your email</h3>
                <p className="text-xs text-[var(--text-soft)] max-w-xs mx-auto leading-relaxed">
                  Enter the 6-digit verification code sent to <span className="font-bold text-[var(--text)]">{verificationEmail}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="w-full btn-journal py-3 text-xs font-mono font-bold justify-center"
                >
                  {loading ? "Verifying..." : "Verify Code ▷"}
                </button>

                <button
                  type="button"
                  disabled={loading || cooldown > 0}
                  onClick={handleResendEmail}
                  className="w-full text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] py-1.5"
                >
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          ) : (
            /* ══════════════════════════════════════════════════════════
               CASE 3: REGISTRATION FORM (Unlocked)
               ══════════════════════════════════════════════════════════ */
            <>
              {/* Beta Unlocked Badge */}
              {betaEnabled && isBetaUnlocked && (
                <div className="mb-5 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Beta Access Granted</span>
                  </span>
                  {betaCodeInput && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100/80 font-bold uppercase text-[9px]">
                      {betaCodeInput}
                    </span>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5">
                    What should your partner call you?
                  </label>
                  <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                    <User className="h-4 w-4 text-[var(--text-soft)]/60 shrink-0" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/45 focus:outline-none focus:ring-0"
                      placeholder="e.g. Sunny, Alex, Bun"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5">
                    Email Address
                  </label>
                  <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                    <Mail className="h-4 w-4 text-[var(--text-soft)]/60 shrink-0" />
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
                  <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                    <Lock className="h-4 w-4 text-[var(--text-soft)]/60 shrink-0" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/45 focus:outline-none focus:ring-0"
                      placeholder="At least 6 characters"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-journal py-3.5 text-xs font-mono font-bold justify-center shadow-sm"
                  >
                    <span>{loading ? "Creating space..." : "Create Account ▷"}</span>
                  </button>
                </div>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
                  <span className="bg-white px-3 text-[var(--text-soft)]">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={signInWithGoogle}
                className="w-full btn-journal-ghost py-3 text-xs font-mono font-bold justify-center"
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
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[var(--burgundy)] hover:underline transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--burgundy)]" />
        </div>
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}
