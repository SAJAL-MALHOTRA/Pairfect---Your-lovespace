"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Lock, Mail, User, AlertCircle, Check } from "lucide-react";
import { OtpInput } from "@/components/otp-input";

export default function SignupPage() {
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
  const router = useRouter();
  const supabase = createClient();

  // Debug logging for mount and loading changes
  useEffect(() => {
    console.log("[SignupPage] Mounted");
  }, []);

  useEffect(() => {
    console.log("[SignupPage] loading state changed:", loading);
  }, [loading]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsRateLimited(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("[SignupPage] handleSignup calling signUp with cleanEmail:", cleanEmail);
      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signupError) {
        throw signupError;
      } else {
        if (data.user && !data.session) {
          // Email confirmation is enabled. Resend code to guarantee dispatch (bypasses silent suppression for existing unconfirmed accounts)
          console.log("[SignupPage] signUp succeeded. Dispatching explicit resend to cleanEmail:", cleanEmail);
          const { data: resendData, error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
          });
          console.log("[SignupPage] Explicit resend outcome:", { data: resendData, error: resendError });

          setVerificationEmail(cleanEmail);
          setNeedsVerification(true);
          setLoading(false);
        } else {
          // Direct login after signup if confirmation is disabled
          router.push("/onboarding");
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
        console.warn("[Analytics] Resend SMTP Email rate limit reached on signup flow");
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
    console.log("[SignupPage] handleVerifyOtp called with token:", enteredCode);
    if (enteredCode.length < 6 || !verificationEmail) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[SignupPage] calling supabase.auth.verifyOtp with email:", verificationEmail, "and token:", enteredCode);
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: enteredCode,
        type: "signup",
      });

      if (verifyErr) throw verifyErr;

      // Direct redirect to onboarding page on success
      router.push("/onboarding");
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
        <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
          <img src="/logo-book.png" alt="Pairfect Logo" className="w-20 h-20 object-contain" />
        </div>
        <h2 className="text-3xl font-sans font-black tracking-tight text-foreground">
          Create Your Space
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto text-pretty">
          Start your private journal for two. Let's get you set up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-8 shadow-sm">
          {/* 3px top gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

           {needsVerification ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center py-4 animate-fade-in">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Confirm your email</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed text-pretty">
                  Enter the 6-digit verification code sent to <span className="font-bold text-foreground">{verificationEmail}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-pink-500/10 dark:shadow-none"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>

                <button
                  type="button"
                  disabled={loading || cooldown > 0}
                  onClick={handleResendEmail}
                  className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-accent/40 border border-border flex items-start space-x-2 text-primary text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isRateLimited ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 text-foreground text-sm space-y-3 relative overflow-hidden">
                    {/* top highlight border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />
                    
                    <div className="flex items-start space-x-2 text-red-500">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-sans font-extrabold text-xs uppercase tracking-wider font-mono">Signup Limit Reached</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We're seeing high signup volume today, so email verification is a bit 
                          delayed. You can sign up instantly with Google instead — or try email 
                          signup again in a few hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={signInWithGoogle}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 pill-primary cursor-pointer shadow-md text-xs uppercase tracking-wider font-extrabold shadow-pink-500/10 dark:shadow-none transition-all active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
                      </svg>
                      <span>Sign Up with Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRateLimited(false)}
                      className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      Try Email Signup Again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        What should your partner call you?
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm placeholder:text-muted-foreground/45 transition-all"
                          placeholder="e.g. Sunny, Alex, Bun"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Email Address
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm placeholder:text-muted-foreground/45 transition-all"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Password
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm placeholder:text-muted-foreground/45 transition-all"
                          placeholder="At least 6 characters"
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-pink-500/10 dark:shadow-none"
                      >
                        {loading ? "Creating space..." : "Sign Up"}
                      </button>
                    </div>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-mono">
                      <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 pill-secondary cursor-pointer shadow-sm text-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}

              <div className="mt-8 text-center border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-primary hover:underline transition-colors"
                  >
                    Log in instead
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
