"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Copy, Check, LogOut, ArrowRight, Loader2, Link2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, profile, pair, signOut, refreshSession } = useAuth();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // If user A is waiting for user B, set up subscription on the pair row
  useEffect(() => {
    if (pair && pair.status === "pending" && pair.user_a_id === user?.id) {
      setMode("create");
      setInviteCode(pair.invite_code);

      // Subscribe to updates for this pair
      const channel = supabase
        .channel(`onboarding-pair-${pair.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pairs",
            filter: `id=eq.${pair.id}`,
          },
          (payload: any) => {
            const updatedPair = payload.new as any;
            if (updatedPair.status === "active") {
              refreshSession().then(() => {
                router.push("/dashboard");
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pair, user, router]);

  const handleCreatePair = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error: insertError } = await supabase
        .from("pairs")
        .insert({
          user_a_id: user!.id,
          invite_code: code,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setInviteCode(code);
      setMode("create");
      await refreshSession();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create pair invite code.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cleanedCode = inputCode.trim().toUpperCase();
      const { data: pairId, error: rpcError } = await supabase.rpc(
        "join_pair_by_code",
        { code: cleanedCode }
      );

      if (rpcError) throw rpcError;

      await refreshSession();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not find a pending pair with that code.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-brand-rose-50 via-brand-peach-50 to-brand-lavender-50 dark:from-[#151312] dark:via-[#1a1514] dark:to-[#12141a]">
      <div className="absolute top-4 right-4">
        <button
          onClick={signOut}
          className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground font-medium px-4 py-2 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-rose-100 dark:bg-brand-rose-950/30 text-brand-rose-500 mb-4 animate-bounce">
          <Link2 className="w-8 h-8 stroke-brand-rose-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Hello, {profile?.display_name || "there"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Valence connects two people. Let's link you with your partner.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cozy-card p-8 bg-white/70 dark:bg-[#1e1a19]/70 backdrop-blur-md min-h-[300px] flex flex-col justify-between">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === "choice" && (
            <div className="space-y-6 my-auto">
              <button
                onClick={handleCreatePair}
                disabled={loading}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-card-border bg-background/50 hover:bg-brand-rose-50/50 dark:hover:bg-brand-rose-950/10 group active:scale-[0.99] transition-all text-left"
              >
                <div>
                  <h3 className="font-semibold text-lg text-foreground flex items-center">
                    Create a new pair
                    <Sparkles className="w-4 h-4 ml-2 text-brand-peach-400 fill-brand-peach-400" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get an invite code to send to your partner.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-rose-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-card-border bg-background/50 hover:bg-brand-lavender-50/50 dark:hover:bg-brand-lavender-950/10 group active:scale-[0.99] transition-all text-left"
              >
                <div>
                  <h3 className="font-semibold text-lg text-foreground flex items-center">
                    Join with invite code
                    <Heart className="w-4 h-4 ml-2 text-brand-rose-400 fill-brand-rose-400" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter a code shared by your partner.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-lavender-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="text-center space-y-6 my-auto">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-brand-rose-500 tracking-wider uppercase">
                  Your Invite Code
                </p>
                <div className="flex items-center justify-center space-x-2 bg-background border border-card-border rounded-2xl py-4 px-6 select-all font-mono text-3xl font-bold tracking-wider text-foreground">
                  <span>{inviteCode}</span>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={copyCode}
                  className="flex items-center space-x-2 py-3 px-6 rounded-xl border border-card-border bg-background/50 hover:bg-background transition-all text-sm font-medium text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-6 border-t border-card-border flex flex-col items-center">
                <Loader2 className="w-6 h-6 text-brand-rose-400 animate-spin mb-2" />
                <p className="text-xs text-muted-foreground">
                  Waiting for your partner to join.
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
                  This page will automatically update once they link with your code.
                </p>
              </div>

              <button
                onClick={() => setMode("choice")}
                className="text-xs text-muted-foreground hover:text-foreground mt-4 underline decoration-dotted"
              >
                Go back options
              </button>
            </div>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoinPair} className="space-y-6 my-auto">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. A1B2C3"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="block w-full text-center uppercase tracking-widest font-mono text-2xl py-4 border border-card-border rounded-2xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-lavender-300 dark:focus:ring-brand-lavender-800 text-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputCode}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-lavender-500 hover:bg-brand-lavender-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-lavender-400 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Link Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("choice")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 underline decoration-dotted block"
              >
                Go back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
