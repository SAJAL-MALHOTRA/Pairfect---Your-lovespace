"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CashfreeCheckoutButton } from "@/components/payment/cashfree-checkout-button";
import { useAuth } from "@/components/providers/auth-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { PAYMENT_PLANS, PaymentPlan, getPlan } from "@/lib/plans";
import {
  Heart,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Camera,
  Scale,
  Vault,
  Calendar,
  Infinity,
  RotateCcw,
  Users,
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const { user, profile } = useAuth();
  const { isPlus, tier, daysRemaining, isLifetime } = useSubscription();

  // Primary public plans
  const primaryPlans: PaymentPlan[] = [
    PAYMENT_PLANS["plus-monthly"],
    PAYMENT_PLANS["plus-quarterly"],
    PAYMENT_PLANS["plus-annual"],
    PAYMENT_PLANS["pairfect-forever"],
  ].filter(Boolean);

  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>(() => {
    if (planParam) {
      const p = getPlan(planParam);
      if (p) return p;
    }
    return PAYMENT_PLANS["plus-quarterly"] || PAYMENT_PLANS["plus-annual"] || primaryPlans[0];
  });

  // Customer contact info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  // 7-Day Free Trial state
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [trialMessage, setTrialMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/trials/eligibility")
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.eligible === "boolean") {
            setTrialEligible(data.eligible);
          }
        })
        .catch(() => setTrialEligible(false));
    }
  }, [user]);

  const handleActivateTrial = async () => {
    setTrialLoading(true);
    setLastError(null);
    try {
      const res = await fetch("/api/trials/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to activate 7-day trial.");
      }
      setTrialMessage("✨ 7-day Pairfect Plus trial activated for both of you! Refreshing your sanctuary...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setLastError(err?.message || "Failed to activate trial.");
    } finally {
      setTrialLoading(false);
    }
  };

  // Update selected plan if URL query param changes
  useEffect(() => {
    if (planParam) {
      const matched = getPlan(planParam);
      if (matched) {
        setSelectedPlan(matched);
      }
    }
  }, [planParam]);

  // Prefill user details from auth session
  useEffect(() => {
    if (profile?.display_name && !customerName) {
      setCustomerName(profile.display_name);
    } else if (user?.user_metadata?.display_name && !customerName) {
      setCustomerName(user.user_metadata.display_name);
    }

    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
  }, [user, profile]);

  const handleError = (errorMsg: string) => {
    setLastError(errorMsg);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 py-12 px-4 sm:px-6 lg:px-8 selection:bg-rose-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb / Plus Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold tracking-wide uppercase shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-current text-rose-600" />
            <span>One Payment Covers Both Partners</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-display">
            Pairfect Plus Passes
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600 leading-relaxed">
            When either partner buys a pass, both accounts get full access. No recurring auto-debit surprises — recharge only when you want.
          </p>

          {/* User Sign-In Notice if unauthenticated */}
          {!user && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-left">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Sign in required to activate:</strong> Passes are bound to your couple account.
                </span>
              </div>
              <Link
                href={`/login?redirect=${encodeURIComponent("/checkout" + (planParam ? `?plan=${planParam}` : ""))}`}
                className="btn-journal py-1.5 px-4 text-xs shrink-0 w-full sm:w-auto text-center"
              >
                Sign In First ▷
              </Link>
            </div>
          )}

          {/* Active Membership Banner if already Plus */}
          {isPlus && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Pairfect Plus is currently active for both of you</strong>
                {isLifetime
                  ? " (Forever Pass)"
                  : daysRemaining !== null
                  ? ` (${daysRemaining} days remaining)`
                  : ""}
                . Renewing now extends your pass.
              </span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {lastError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Checkout Notice:</span>
              <span>{lastError}</span>
            </div>
          </div>
        )}

        {/* Trial Success Message */}
        {trialMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{trialMessage}</span>
          </div>
        )}

        {/* 7-Day Free Trial Banner for Eligible Couples */}
        {!isPlus && trialEligible && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 border-2 border-rose-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-heading font-extrabold text-base text-stone-900">
                    Try Pairfect Plus free for 7 days
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    NO CARD REQUIRED
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 max-w-xl">
                  Full access for both of you. Keep everything on your Memory Wall forever, schedule letters up to 10 years ahead, and play all 14 quiz packs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleActivateTrial}
              disabled={trialLoading}
              className="btn-journal py-3 px-6 text-xs font-mono font-bold shrink-0 w-full sm:w-auto shadow-sm whitespace-nowrap cursor-pointer hover:scale-105 transition-transform"
            >
              {trialLoading ? "Activating..." : "Start 7-Day Free Trial ▷"}
            </button>
          </div>
        )}

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryPlans.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setLastError(null);
                }}
                className={`relative cursor-pointer rounded-[24px] p-5 sm:p-6 transition-all duration-200 border-2 flex flex-col justify-between ${
                  isSelected
                    ? "border-rose-600 bg-white shadow-xl shadow-rose-900/10 ring-2 ring-rose-600/20 scale-[1.02]"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-md"
                }`}
              >
                {/* Badge if present */}
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-xs whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-base">{plan.name}</h3>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {plan.durationDays ? `${plan.durationDays} days access` : "Lifetime access"}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? "border-rose-600 bg-rose-600" : "border-stone-300"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-2xl sm:text-3xl font-black text-stone-900">
                      ₹{plan.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {plan.durationDays === 30
                        ? "/ 30 days"
                        : plan.durationDays === 90
                        ? " (~₹83/mo)"
                        : plan.durationDays === 365
                        ? " (~₹66/mo)"
                        : " / lifetime"}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-normal">{plan.subtitle}</p>

                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                      Included for both of you:
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-600">
                      {plan.features.slice(0, 4).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-5">
                  <div
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isSelected ? "Selected Plan" : "Choose Plan"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Execution Panel */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-stone-900 text-lg">Instant Payment &amp; Activation</h2>
                <p className="text-xs text-stone-500">
                  Secured by Cashfree with UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards &amp; Netbanking.
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-stone-500 block">Total Due</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600">
                ₹{selectedPlan.amount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Contact Prefill Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-stone-50/50"
                placeholder="Alex Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-stone-50/50"
                placeholder="alex@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-stone-50/50"
                placeholder="Leave blank for all UPI options"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Leave blank to prevent 1-click saved method lock-in.
              </span>
            </div>
          </div>

          {/* Pay Button & Security Badges */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-500" />
                <span>Unlocks for Both Partners</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <CashfreeCheckoutButton
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                displayAmount={`₹${selectedPlan.amount.toLocaleString("en-IN")}`}
                phone={customerPhone}
                customerName={customerName}
                buttonText={`Pay ₹${selectedPlan.amount.toLocaleString("en-IN")} via Cashfree`}
                onSuccess={(orderId) => {
                  router.push(`/payment-status?order_id=${encodeURIComponent(orderId)}`);
                }}
                onError={(err) => {
                  handleError(err);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.99] transition-all shadow-md hover:shadow-lg cursor-pointer text-sm"
              />
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-stone-700 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-700 w-fit">
              <Camera className="w-4 h-4" />
            </div>
            <strong className="block font-bold text-stone-900 text-sm">Unlimited Photobooth</strong>
            <p className="text-stone-500 leading-normal">
              Capture synchronous photo strips with grain filters and custom couple frames.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 w-fit">
              <Scale className="w-4 h-4" />
            </div>
            <strong className="block font-bold text-stone-900 text-sm">AI Vibe Judge</strong>
            <p className="text-stone-500 leading-normal">
              Playful, objective mediation for relationship debates, habits, and gentle verdicts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 w-fit">
              <Vault className="w-4 h-4" />
            </div>
            <strong className="block font-bold text-stone-900 text-sm">Lossless Cloud Vault</strong>
            <p className="text-stone-500 leading-normal">
              Permanent high-fidelity storage for love letters, moments, voice clips, and milestone memories.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 w-fit">
              <Infinity className="w-4 h-4" />
            </div>
            <strong className="block font-bold text-stone-900 text-sm">No Auto-Debit Traps</strong>
            <p className="text-stone-500 leading-normal">
              Recharge with simple UPI passes when you need them. No surprise recurring charges ever.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/dashboard"
            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-4"
          >
            Return to Sanctuary Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
            <p className="font-mono text-xs text-stone-500 uppercase tracking-wider">
              Loading sanctuary passes...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
