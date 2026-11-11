"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Sparkles,
  Copy,
  Check,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Share2,
  Crown,
  Sparkle,
  Radio,
  Camera,
  Scale,
  CalendarHeart,
  CheckCircle2,
} from "lucide-react";
import {
  generateCoupleKey,
  savePairKey,
  savePendingKey,
  promotePendingKey,
  exportKeyToFragment,
  extractKeyFromFragment,
  importKeyFromFragment,
  wrapVaultKeyWithCode,
  unwrapVaultKeyWithCode,
  getPairKey,
} from "@/lib/crypto/e2ee";
import { CoupleBeansMascot } from "@/components/couple-mascot";

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

export default function OnboardingPage() {
  const { user, profile, pair, signOut, refreshSession } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);

  // E2EE states
  const [secretInviteLink, setSecretInviteLink] = useState("");
  const [detectedFragmentKey, setDetectedFragmentKey] = useState<CryptoKey | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Handle URL query code and hash fragment #k=... on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setInputCode(codeParam.toUpperCase().trim());
      setMode("join");
    }

    const hash = window.location.hash;
    let rawKey = extractKeyFromFragment(hash);

    if (rawKey) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
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

  // Sync display name input with profile
  useEffect(() => {
    if (profile?.display_name && !tempDisplayName) {
      setTempDisplayName(profile.display_name);
    }
  }, [profile, tempDisplayName]);

  // If user A is waiting for user B, set up subscription & polling fallback
  useEffect(() => {
    if (pair && pair.status === "pending" && pair.user_a_id === user?.id) {
      setMode("create");
      setCurrentStep(3);
      setInviteCode(pair.invite_code);

      getPairKey(pair.id)
        .then(async (existingKey) => {
          let key = existingKey;
          if (!key) {
            key = await generateCoupleKey();
            await savePairKey(pair.id, key);
            await savePendingKey(pair.invite_code, key);
          }
          try {
            const envelopeStr = await wrapVaultKeyWithCode(key, pair.invite_code, pair.id);
            await fetch("/api/vault/envelope", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pairId: pair.id, envelope: envelopeStr, type: "transport" }),
            });
          } catch (e) {
            console.warn("[E2EE] Envelope refresh warning:", e);
          }
          const keyFragment = await exportKeyToFragment(key);
          const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
          setSecretInviteLink(`${origin}/onboarding?code=${pair.invite_code}#k=${keyFragment}`);
        })
        .catch((e) => console.warn("Failed to load pair key:", e));

      // 1. WebSockets listener
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
              setPartnerConnected(true);
              refreshSession(true).then(() => {
                setTimeout(() => setCurrentStep(4), 1200);
              });
            }
          }
        )
        .subscribe();

      // 2. Polling interval fallback every 2s
      const interval = setInterval(async () => {
        try {
          const { data: updatedPair } = await supabase
            .from("pairs")
            .select("status")
            .eq("id", pair.id)
            .single();

          if (updatedPair?.status === "active") {
            clearInterval(interval);
            setPartnerConnected(true);
            await refreshSession(true);
            setTimeout(() => setCurrentStep(4), 1200);
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
  }, [pair, user, supabase, refreshSession]);

  const handleNameNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDisplayName.trim()) return;

    if (user && tempDisplayName.trim() !== profile?.display_name) {
      setLoading(true);
      setError(null);
      try {
        const { error: updateErr } = await supabase
          .from("users")
          .update({ display_name: tempDisplayName.trim() })
          .eq("id", user.id);

        if (updateErr) throw updateErr;
        await refreshSession();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to update display name.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (inputCode) {
      setMode("join");
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const handleCreatePair = async () => {
    setLoading(true);
    setError(null);
    try {
      let code = "";
      let createdPair: any = null;
      let lastError: any = null;

      const coupleKey = await generateCoupleKey();

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

      await savePairKey(createdPair.id, coupleKey);
      await savePendingKey(code, coupleKey);

      try {
        const envelopeStr = await wrapVaultKeyWithCode(coupleKey, code, createdPair.id);
        await fetch("/api/vault/envelope", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairId: createdPair.id, envelope: envelopeStr, type: "transport" }),
        });
      } catch (envErr) {
        console.warn("[E2EE] Envelope persist warning:", envErr);
      }

      const keyFragment = await exportKeyToFragment(coupleKey);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
      const fullSecretLink = `${origin}/onboarding?code=${code}#k=${keyFragment}`;
      setSecretInviteLink(fullSecretLink);

      setInviteCode(code);
      setMode("create");
      setCurrentStep(3);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanedCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not find a pending pair with that code.");
      }

      const pairId = data.pairId;
      if (detectedFragmentKey) {
        await savePairKey(pairId, detectedFragmentKey);
      } else if (data.vaultEnvelope) {
        try {
          const unwrappedKey = await unwrapVaultKeyWithCode(data.vaultEnvelope, cleanedCode, pairId);
          await savePairKey(pairId, unwrappedKey);
        } catch (unwrapErr) {
          console.warn("[E2EE] Auto-unwrap error:", unwrapErr);
          await promotePendingKey(cleanedCode, pairId);
        }
      } else {
        await promotePendingKey(cleanedCode, pairId);
      }

      await refreshSession(true);
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not find a pending pair with that code.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareInviteLink = async () => {
    if (!secretInviteLink) return;
    const shareData = {
      title: "Join me on Pairfect",
      text: `Join my private couple space on Pairfect! Use code ${inviteCode} or click this link to connect:`,
      url: secretInviteLink,
    };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Share sheet aborted, falling back to clipboard:", err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(secretInviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copySecretLink = () => {
    if (!secretInviteLink) return;
    navigator.clipboard.writeText(secretInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
    setCurrentStep(2);
  };

  const formattedCode = inviteCode ? inviteCode.split("").join(" ") : "· · · · · ·";

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-stone-900 flex flex-col justify-between py-6 px-4 selection:bg-rose-100 selection:text-rose-900">
      {/* Top Navigation & Step Indicator */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-book.png"
            alt="Pairfect Logo"
            width={28}
            height={28}
            className="rounded-lg object-contain shadow-xs"
            priority
          />
          <span className="font-heading font-black text-xl tracking-tight text-stone-900">
            pairfect<span className="text-rose-500">.</span>
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5" aria-label={`Step ${currentStep} of 4`}>
          {[1, 2, 3, 4].map((stepNum) => (
            <span
              key={stepNum}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === stepNum
                  ? "w-6 bg-stone-900"
                  : currentStep > stepNum
                  ? "w-2 bg-stone-400"
                  : "w-2 bg-stone-200"
              }`}
            />
          ))}
        </div>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto my-auto py-4">
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* STEP 1: What's your name? */}
        {currentStep === 1 && (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">
            {/* Washi tape badge */}
            <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
              <span className="bg-rose-500 text-white font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                HELLO, MY NAME IS
              </span>
            </div>

            <div className="mt-4 mb-6">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                What&apos;s your name?
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                Enter your nickname or first name so your partner knows who you are in your private room.
              </p>
            </div>

            <form onSubmit={handleNameNext} className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={tempDisplayName}
                  onChange={(e) => {
                    setTempDisplayName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Alex, Maya, Bun"
                  className="w-full px-4 py-3.5 text-base border-2 border-stone-800 rounded-2xl bg-[#FFFBF8] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !tempDisplayName.trim()}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Choose Your Path */}
        {currentStep === 2 && (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">
            <div className="mb-6">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block mb-2">
                Step 2 of 4
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                Connect with your partner
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                Pairfect is built for exactly two people. Choose how you want to begin:
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleCreatePair}
                disabled={loading}
                className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-stone-800 bg-[#FFFDFB] hover:bg-rose-50/40 hover:border-rose-500 group transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.8)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-stone-900 font-heading font-bold text-base">
                      <span>Create our space</span>
                      <Sparkles className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Generate a private room code and magic invite link to send to your partner.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5 ml-2" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("join");
                  setCurrentStep(3);
                }}
                disabled={loading}
                className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-stone-800 bg-[#FFFDFB] hover:bg-stone-50 group transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(28,25,23,0.8)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-stone-900 font-heading font-bold text-base">
                      <span>Join with partner&apos;s code</span>
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Your partner already created a room and sent you a 6-character code.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5 ml-2" />
                </div>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-mono text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono text-stone-400">Zero-Knowledge E2EE</span>
            </div>
          </div>
        )}

        {/* STEP 3A: Create Space Ready */}
        {currentStep === 3 && mode === "create" && (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative text-center">
            {/* Celebratory badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Sparkle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>YOUR SPACE IS READY</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
              Send this code to your partner
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
              Once they enter it, your private spaces will be connected instantly.
            </p>

            {/* Dashed Code Box */}
            <div className="my-5 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-stone-300 bg-[#FFFDFB]">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] text-stone-900 select-all block">
                {formattedCode}
              </span>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>

            {/* Primary Action Button: Send to my partner */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleShareInviteLink}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Send to my partner</span>
              </button>

              {/* Dual pills: Copy code / Copy invite link */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  className="py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-800 bg-[#FFFDFB] text-xs font-mono font-bold text-stone-800 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={copySecretLink}
                  className="py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-800 bg-[#FFFDFB] text-xs font-mono font-bold text-stone-800 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy invite link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WHAT'S NEXT 3-Step Guide */}
            <div className="text-left bg-[#FFFBF8] border border-stone-200 rounded-2xl p-4 mb-5 space-y-2.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                WHAT&apos;S NEXT
              </div>
              <div className="space-y-2 text-xs text-stone-700 font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white font-mono text-[11px] font-bold inline-flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Send the code or link to your partner</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white font-mono text-[11px] font-bold inline-flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>They enter it on their device</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white font-mono text-[11px] font-bold inline-flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>Your space unlocks together automatically</span>
                </div>
              </div>
            </div>

            {/* Waiting status / Real-time updates */}
            <div className="py-2 flex items-center justify-center gap-2 text-xs text-stone-500 font-mono">
              {partnerConnected ? (
                <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Partner joined! Advancing...
                </span>
              ) : (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>Waiting for partner to connect...</span>
                </>
              )}
            </div>

            {/* Manual Advance to preview step 4 */}
            <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCancelPendingPair}
                className="text-xs font-mono text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs font-mono font-bold text-stone-900 hover:text-rose-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3B: Join with Code */}
        {currentStep === 3 && mode === "join" && (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">
            <div className="mb-6">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block mb-2">
                Step 3 of 4
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                Enter partner&apos;s code
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                Enter the unique 6-character code from your partner&apos;s screen to unlock your shared space.
              </p>
            </div>

            <form onSubmit={handleJoinPair} className="space-y-5">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="e.g. 841557"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    if (error) setError(null);
                  }}
                  className="w-full text-center uppercase tracking-[0.25em] font-mono text-3xl py-4 border-2 border-stone-800 rounded-2xl bg-[#FFFDFB] text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-inner"
                />
              </div>

              {detectedFragmentKey && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Zero-knowledge client-side encryption key verified!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || inputCode.trim().length < 6}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Link with Partner</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode("choice");
                    setCurrentStep(2);
                  }}
                  className="text-xs font-mono text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    handleCreatePair();
                  }}
                  className="text-xs font-mono font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Need a code instead?
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: One More Thing: Premium */}
        {currentStep === 4 && (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative text-center">
            {/* Premium Gold Badge */}
            <div className="mb-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>PAIRFECT PREMIUM</span>
            </div>

            {/* Signature Couple Mascot */}
            <CoupleBeansMascot className="w-32 h-24 my-2" />

            <div className="mt-3 mb-5">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
                One more thing: Premium
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed max-w-xs mx-auto">
                One subscription unlocks everything for both of you, on the web and on any device.
              </p>
            </div>

            {/* Feature Checklist Box */}
            <div className="text-left bg-[#FFFBF8] border border-stone-200 rounded-2xl p-4 mb-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-stone-900">Monthly Wrapped:</strong> Relive your milestones, top memories, and connection streaks.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-stone-900">Weekly Check-in:</strong> Deep guided conversation prompts to grow closer every Sunday.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-stone-900">Unlimited Photobooth Strips:</strong> Vintage filters, dual-camera synchronization, and high-res keepsakes.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-stone-900">Whisper FM Radio:</strong> Private retro audio frequencies with analog tuning and zero-knowledge encryption.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-stone-900">AI Vibe Judge:</strong> Playful and impartial verdicts to settle couple debates.
                </div>
              </div>
            </div>

            {/* Cheaper on the web banner */}
            <div className="mb-5 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-medium text-center">
              ✦ Cheaper on the web than in the app
            </div>

            {/* CTAs: See the plans vs Maybe later */}
            <div className="space-y-2.5">
              <Link
                href="/checkout?plan=plus-monthly"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>See the plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 text-xs font-mono font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto text-center pt-4 text-[11px] font-mono text-stone-400">
        Pairfect &middot; End-to-End Encrypted Couple Space &middot; Built for Two
      </footer>
    </div>
  );
}
