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
