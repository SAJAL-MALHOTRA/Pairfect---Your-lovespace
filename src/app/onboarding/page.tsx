"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Copy, Check, LogOut, ArrowRight, Loader2, Link2, Info, ShieldCheck, ShieldAlert, KeyRound } from "lucide-react";
import {
  generateCoupleKey,
  savePairKey,
  savePendingKey,
  promotePendingKey,
  exportKeyToFragment,
  extractKeyFromFragment,
  importKeyFromFragment,
  hasPairKey,
  getPairKey,
} from "@/lib/crypto/e2ee";

export default function OnboardingPage() {
  const { user, profile, pair, signOut, refreshSession } = useAuth();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // E2EE states
  const [secretInviteLink, setSecretInviteLink] = useState("");
  const [secretLinkCopied, setSecretLinkCopied] = useState(false);
  const [detectedFragmentKey, setDetectedFragmentKey] = useState<CryptoKey | null>(null);
  const [missingKeyWarning, setMissingKeyWarning] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [joinedPairId, setJoinedPairId] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Handle URL query code and hash fragment #k=... immediately on mount.
  // The onboarding layout contains an inline synchronous script that stashes
  // the key in sessionStorage under 'e2ee_pending_fragment' and strips the
  // hash before any analytics script sees location.href. We read both sources
  // here and clear the sessionStorage slot after consuming it.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check query params for code
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setInputCode(codeParam.toUpperCase().trim());
      setMode("join");
    }

    // Primary source: current hash (if the layout script didn't already strip it)
    const hash = window.location.hash;
    let rawKey = extractKeyFromFragment(hash);

    if (rawKey) {
      // Strip hash from URL now in case the layout script missed it
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
      // Fallback: the layout's inline script already stripped the hash and
      // stashed the raw key in sessionStorage before GA could read location.href
      const stashed = sessionStorage.getItem("e2ee_pending_fragment");
      if (stashed) {
        rawKey = stashed;
        sessionStorage.removeItem("e2ee_pending_fragment");
      }
    }

    if (rawKey) {
      importKeyFromFragment(rawKey)
        .then(async (cryptoKey) => {
          setDetectedFragmentKey(cryptoKey);
          if (codeParam) {
            await savePendingKey(codeParam, cryptoKey);
          }
        })
        .catch((err) => {
          console.error("[E2EE] Failed to parse key from link fragment:", err);
        });
    }
  }, []);

  // Keep display name input in sync with loaded profile
  useEffect(() => {
    if (profile?.display_name && !tempDisplayName) {
      setTempDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDisplayName.trim() || !user) return;
    setLoading(true);
    setError(null);
    setDisplayNameSaved(false);
    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ display_name: tempDisplayName.trim() })
        .eq("id", user.id);

      if (updateErr) throw updateErr;
      setDisplayNameSaved(true);
      await refreshSession();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update display name.");
    } finally {
      setLoading(false);
    }
  };

  // If user A is waiting for user B, set up subscription & 2s polling fallback on the pair row
  useEffect(() => {
    if (pair && pair.status === "pending" && pair.user_a_id === user?.id) {
      setMode("create");
      setInviteCode(pair.invite_code);

      // Reconstruct secret link from IndexedDB key
      getPairKey(pair.id)
        .then(async (existingKey) => {
          let key = existingKey;
          if (!key) {
            key = await generateCoupleKey();
            await savePairKey(pair.id, key);
            await savePendingKey(pair.invite_code, key);
          }
          const keyFragment = await exportKeyToFragment(key);
          const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
          setSecretInviteLink(`${origin}/onboarding?code=${pair.invite_code}#k=${keyFragment}`);
        })
        .catch((e) => console.warn("Failed to load pair key:", e));

      // 1. Subscribe to WebSockets
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
              refreshSession(true).then(() => {
                router.push("/dashboard");
              });
            }
          }
        )
        .subscribe();

      // 2. Fallback polling interval every 2s to guarantee instant redirect if WebSockets lag
      const interval = setInterval(async () => {
        try {
          const { data: updatedPair } = await supabase
            .from("pairs")
            .select("status")
            .eq("id", pair.id)
            .single();

          if (updatedPair?.status === "active") {
            clearInterval(interval);
            await refreshSession(true);
            router.push("/dashboard");
          }
        } catch (e) {
          console.warn("Pair status check polling error:", e);
        }
      }, 2000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [pair, user, router]);

  const handleCancelPendingPair = async () => {
    if (pair && pair.status === "pending" && pair.user_a_id === user?.id) {
      setLoading(true);
      try {
        await supabase.from("pairs").delete().eq("id", pair.id);
        await refreshSession(false);
      } catch (e) {
        console.warn("Cancel pending pair error:", e);
      } finally {
        setLoading(false);
      }
    }
    setMode("choice");
  };

function generateSecureInviteCode(length = 6): string {
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const randomValues = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset[randomValues[i] % charset.length];
  }
  return code;
}

  const handleCreatePair = async () => {
    setLoading(true);
    setError(null);
    try {
      let code = "";
      let createdPair: any = null;
      let lastError: any = null;

      // Generate cryptographically random 256-bit AES-GCM key for this couple
      const coupleKey = await generateCoupleKey();

      // Retry up to 3 times in case of rare code collision
      for (let attempt = 0; attempt < 3 && !createdPair; attempt++) {
        code = generateSecureInviteCode(6);

        const { data: pairData, error: insertError } = await supabase
          .from("pairs")
          .insert({
            user_a_id: user!.id,
            invite_code: code,
            status: "pending",
          })
          .select()
          .single();

        if (!insertError && pairData) {
          createdPair = pairData;
          break;
        }
        lastError = insertError;
      }

      if (!createdPair) {
        throw lastError || new Error("Failed to create pair invite code. Please try again.");
      }

      // Persist key in local IndexedDB under both pair ID and pending code
      await savePairKey(createdPair.id, coupleKey);
      await savePendingKey(code, coupleKey);

      // Export key to URL fragment
      const keyFragment = await exportKeyToFragment(coupleKey);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
      const fullSecretLink = `${origin}/onboarding?code=${code}#k=${keyFragment}`;
      setSecretInviteLink(fullSecretLink);

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
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const cleanedCode = inputCode.trim().toUpperCase();

      if (cleanedCode === "PAIRFECT2026") {
        setError("PAIRFECT2026 was the early access beta code. Please enter the 6-character invite code from your partner's screen (e.g. 6VAFPR).");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/join-pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: cleanedCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not find a pending pair with that code.");
      }

      const pairId = data.pairId;
      if (detectedFragmentKey) {
        await savePairKey(pairId, detectedFragmentKey);
      } else {
        await promotePendingKey(cleanedCode, pairId);
      }

      const hasKey = await hasPairKey(pairId);
      if (!hasKey) {
        // User joined manually without secret key fragment
        setJoinedPairId(pairId);
        setMissingKeyWarning(true);
        setLoading(false);
        return;
      }

      await refreshSession(true);
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

  const copySecretLink = () => {
    if (!secretInviteLink) return;
    navigator.clipboard.writeText(secretInviteLink);
    setSecretLinkCopied(true);
    setTimeout(() => setSecretLinkCopied(false), 2000);
  };

  const handleImportManualKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKeyInput.trim() || !joinedPairId) return;
    setImportingKey(true);
    try {
      const text = manualKeyInput.trim();
      let rawKey = extractKeyFromFragment(text);
      if (!rawKey) {
        if (text.includes("http://") || text.includes("https://") || text.includes("/onboarding")) {
          throw new Error("This link is missing the secret key fragment (#k=...). Please paste the full secret link.");
        }
        rawKey = text;
      }
      const importedKey = await importKeyFromFragment(rawKey);
      await savePairKey(joinedPairId, importedKey);
      await refreshSession(true);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not parse key. Please paste the full secret invite link containing #k=");
    } finally {
      setImportingKey(false);
    }
  };

  const handleProceedWithoutKey = async () => {
    await refreshSession(true);
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-[var(--bg)] transition-colors">
      <div className="absolute top-4 right-4">
        <button
          onClick={signOut}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[var(--text-soft)] hover:text-[var(--text)] px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--rose)]/20 text-[var(--burgundy)] mb-4 animate-bounce border border-[var(--rose)]/40">
          <Link2 className="w-8 h-8 text-[var(--burgundy)]" />
        </div>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
          Hello, {profile?.display_name || "there"}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-soft)] font-sans">
          Pairfect connects two people. Let's link you with your partner.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[var(--radius-card)] p-8 bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xl min-h-[300px] flex flex-col justify-between">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {mode === "choice" && (
            <div className="space-y-6 my-auto">
              {/* Profile Display Name Update */}
              <form onSubmit={handleUpdateDisplayName} className="space-y-2 border-b border-[var(--border)] pb-6">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)]">
                  Your Display Name (What partner calls you)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={tempDisplayName}
                    onChange={(e) => {
                      setTempDisplayName(e.target.value);
                      setDisplayNameSaved(false);
                    }}
                    placeholder="e.g. Sunny, Alex, Bun"
                    className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
                  />
                  <button
                    type="submit"
                    disabled={loading || !tempDisplayName.trim() || tempDisplayName.trim() === profile?.display_name}
                    className="btn-primary px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                  </button>
                </div>
                {displayNameSaved && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                    ✓ Name saved successfully!
                  </p>
                )}
              </form>

              <button
                onClick={handleCreatePair}
                disabled={loading}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--paper-warm)] hover:border-[var(--burgundy)]/50 group transition-all text-left cursor-pointer shadow-xs"
              >
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--text)] flex items-center">
                    Create a new pair
                    <Sparkles className="w-4 h-4 ml-2 text-[var(--burgundy)] fill-[var(--burgundy)]/30" />
                  </h3>
                  <p className="text-xs text-[var(--text-soft)] font-sans mt-1">
                    Get an invite code to send to your partner.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-soft)] group-hover:text-[var(--burgundy)] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--paper-warm)] hover:border-[var(--burgundy)]/50 group transition-all text-left cursor-pointer shadow-xs"
              >
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--text)] flex items-center">
                    Join with invite code
                    <Heart className="w-4 h-4 ml-2 text-[var(--burgundy)] fill-[var(--burgundy)]/30" />
                  </h3>
                  <p className="text-xs text-[var(--text-soft)] font-sans mt-1">
                    Enter a code shared by your partner.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-soft)] group-hover:text-[var(--burgundy)] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="text-center space-y-5 my-auto">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase font-bold text-[var(--burgundy)] tracking-widest">
                  Secret Invite Link (E2EE)
                </p>
                <p className="text-[11px] text-[var(--text-soft)]">
                  Contains your shared zero-knowledge encryption key.
                </p>
              </div>

              {/* Primary action: Copy Secret Invite Link */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={copySecretLink}
                  disabled={!secretInviteLink}
                  className="w-full btn-primary py-3.5 px-4 text-xs font-mono uppercase font-bold tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {secretLinkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Secret Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Copy Secret Invite Link</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                  Recommended: Partner clicks link to auto-link with encryption key.
                </p>
              </div>

              {/* Secondary action: Manual 6-character code */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-[10px] font-mono uppercase font-bold text-[var(--text-soft)] mb-2">
                  Or share 6-character code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-[var(--paper-warm)] border border-[var(--border)] rounded-xl py-2 px-4 select-all font-mono text-xl font-bold tracking-widest text-[var(--text)] shadow-inner">
                    <span>{inviteCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="btn-secondary py-2 px-3 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-[11px] text-[var(--text-soft)] leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Zero-Knowledge Notice</span>
                </div>
                <p>
                  Keep this link safe. If both partners lose their devices without this link, encrypted photos cannot be recovered by anyone, including Pairfect support.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex flex-col items-center">
                <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin mb-1.5" />
                <p className="text-xs font-sans text-[var(--text-soft)] font-medium">
                  Waiting for your partner to join.
                </p>
                <p className="text-[11px] text-[var(--text-soft)] opacity-80 mt-0.5 max-w-[240px] leading-relaxed">
                  This page will automatically update once they link with your code.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelPendingPair}
                className="text-xs font-mono font-semibold text-[var(--text-soft)] hover:text-[var(--text)] transition-colors mt-2 inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                ← Choose another option
              </button>
            </div>
          )}

          {mode === "join" && (
            <div>
              {missingKeyWarning ? (
                <div className="space-y-5 my-auto text-left">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>Pair Linked: Encryption Key Missing</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      You joined with the code directly. Without your partner&apos;s secret link fragment, end-to-end encrypted memories will show a locked placeholder on this device until imported.
                    </p>
                  </div>

                  <form onSubmit={handleImportManualKey} className="space-y-3">
                    <label className="block text-[11px] font-mono uppercase font-bold text-[var(--text-soft)]">
                      Paste Partner&apos;s Secret Link to Restore Key
                    </label>
                    <input
                      type="text"
                      placeholder="https://pairfect.site/onboarding?code=...#k=..."
                      value={manualKeyInput}
                      onChange={(e) => setManualKeyInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
                    />
                    <button
                      type="submit"
                      disabled={importingKey || !manualKeyInput.trim()}
                      className="w-full btn-primary py-3 text-xs font-mono uppercase font-bold tracking-widest cursor-pointer disabled:opacity-40"
                    >
                      {importingKey && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      <span>Import Key & Enter</span>
                    </button>
                  </form>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleProceedWithoutKey}
                      className="text-xs font-mono font-semibold text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      Skip for now (import later in Settings) →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleJoinPair} className="space-y-6 my-auto">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-[var(--text-soft)] mb-1">
                      Enter Partner&apos;s 6-Letter Code
                    </label>
                    <p className="text-[11px] text-[var(--text-soft)] mb-3 leading-relaxed">
                      Enter the unique 6-character code from your partner&apos;s screen (e.g. <span className="font-mono font-bold text-[var(--burgundy)]">A1B2C3</span>).
                    </p>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="E.G. A1B2C3"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                        if (error) setError(null);
                      }}
                      className="block w-full text-center uppercase tracking-widest font-mono text-2xl py-4 border border-[var(--border)] rounded-2xl bg-[var(--paper-warm)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 text-[var(--text)]"
                    />
                  </div>

                  {detectedFragmentKey && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                      <span>Zero-knowledge encryption key detected from link!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !inputCode.trim()}
                    className="w-full btn-primary py-3 text-xs font-mono uppercase font-bold tracking-widest cursor-pointer"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <span>Link with Partner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("create");
                    }}
                    className="w-full text-center text-xs font-mono font-semibold text-[var(--burgundy)] hover:underline transition-colors mt-2 block cursor-pointer"
                  >
                    Don&apos;t have a partner code yet? Create a new pair instead →
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("choice")}
                    className="w-full text-center text-xs font-mono font-semibold text-[var(--text-soft)] hover:text-[var(--text)] transition-colors mt-4 block cursor-pointer"
                  >
                    ← Choose another option
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
