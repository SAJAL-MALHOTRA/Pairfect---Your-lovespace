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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-brand-rose-50 via-brand-peach-50 to-brand-lavender-50 dark:from-[#151312] dark:via-[#1a1514] dark:to-[#12141a]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-rose-100 dark:bg-brand-rose-950/30 text-brand-rose-500 mb-4">
          <Heart className="w-8 h-8 fill-brand-rose-400 stroke-brand-rose-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Create Your Space
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          Start your private journal for two. Let's get you set up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="cozy-card p-8 bg-white/70 dark:bg-[#1e1a19]/70 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-start space-x-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                What should your partner call you?
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-300 dark:focus:ring-brand-rose-800 text-foreground text-sm placeholder:text-muted-foreground/50 transition-all"
                  placeholder="e.g. Sunny, Alex, Bun"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-300 dark:focus:ring-brand-rose-800 text-foreground text-sm placeholder:text-muted-foreground/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-300 dark:focus:ring-brand-rose-800 text-foreground text-sm placeholder:text-muted-foreground/50 transition-all"
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-rose-500 hover:bg-brand-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-rose-400 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {loading ? "Creating space..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-card-border pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-brand-rose-500 hover:text-brand-rose-600 transition-colors"
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
