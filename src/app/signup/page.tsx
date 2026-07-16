"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Lock, Mail, User, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
    } else {
      // Direct login after signup if confirmation is disabled, or show check email
      router.push("/onboarding");
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

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-accent/40 border border-border flex items-start space-x-2 text-primary text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
