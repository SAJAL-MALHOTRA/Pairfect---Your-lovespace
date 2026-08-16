"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Lock, Mail, AlertCircle, Check } from "lucide-react";
import { OtpInput } from "@/components/otp-input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Debug logging for mount and loading changes
  useEffect(() => {
    console.log("[LoginPage] Mounted");
  }, []);

  useEffect(() => {
    console.log("[LoginPage] loading state changed:", loading);
  }, [loading]);

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

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      const isUnconfirmed = 
        loginError.message.toLowerCase().includes("confirm") || 
        loginError.message.toLowerCase().includes("verified") ||
        loginError.message.toLowerCase().includes("verification");
      
      if (isUnconfirmed) {
        setEmailUnconfirmed(true);
      } else {
        setError(loginError.message);
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
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

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email) return;
    setError(null);
    setResendStatus(null);
    setLoading(true);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendErr) throw resendErr;
      setResendStatus("Verification code resent! Check your inbox.");
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
    console.log("[LoginPage] handleVerifyOtp called with token:", enteredCode);
    if (enteredCode.length < 6 || !email) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[LoginPage] calling supabase.auth.verifyOtp with email:", email.trim(), "and token:", enteredCode);
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: enteredCode,
        type: "signup",
      });

      if (verifyErr) throw verifyErr;

      // Successfully verified - redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Verification error on login:", err);
      setError("Incorrect code, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="flex justify-center mb-4">
          <Image src="/logo-book.png" alt="Pairfect" width={72} height={72} className="rounded-2xl shadow-md" priority />
        </div>
        <h2 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">
          Welcome to Pairfect
        </h2>
        <p className="mt-2 text-xs text-[var(--ink-mid)] font-mono max-w-xs mx-auto uppercase tracking-wider">
          A private room for the two of you.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-[var(--card-bg)] p-8 shadow-sm paper-grain">
          {/* 2px top brand accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--seal-red)]" />

          {error && (
            <div className="mb-6 p-4 rounded-button bg-[var(--bg-secondary)]/40 border border-[var(--border)] flex items-start space-x-2 text-[var(--burgundy)] text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {emailUnconfirmed && (
            <form onSubmit={handleVerifyOtp} className="mb-6 p-4 rounded-button border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 text-[var(--text)] text-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />
              <div className="flex items-start space-x-2 text-red-500">
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
                className="w-full btn-primary py-2.5 text-xs"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                disabled={loading || cooldown > 0}
                onClick={handleResendEmail}
                className="w-full btn-tertiary py-2 text-xs font-bold uppercase tracking-wider"
              >
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
              </button>
            </form>
          )}

          {resendStatus && (
            <div className="mb-6 p-4 rounded-button border border-green-500/20 bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-2">
                Email Address
              </label>
              <div className="relative rounded-button shadow-sm">
                <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-button bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                  <Mail className="h-5 w-5 text-[var(--text-soft)]/60 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/40 focus:outline-none focus:ring-0"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] mb-2">
                Password
              </label>
              <div className="relative rounded-button shadow-sm">
                <div className="input-warm flex items-center gap-3 px-3.5 py-3 border border-[var(--border)] rounded-button bg-[var(--bg)] focus-within:ring-1 focus-within:ring-[var(--burgundy)]">
                  <Lock className="h-5 w-5 text-[var(--text-soft)]/60 shrink-0" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none outline-none p-0 text-[var(--text)] text-sm placeholder:text-[var(--text-soft)]/40 focus:outline-none focus:ring-0"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-mono">
              <span className="bg-[var(--bg-secondary)] px-3 text-[var(--text-soft)]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full btn-secondary text-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center border-t border-[var(--border)] pt-6">
            <p className="text-sm text-[var(--text-soft)]">
              Don't have an account yet?{" "}
              <Link
                href="/signup"
                className="font-bold text-[var(--burgundy)] hover:underline transition-colors"
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
