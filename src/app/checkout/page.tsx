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
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Camera,
  Scale,
  Archive,
  Infinity,
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
      setTrialMessage("✨ 7-day Pairfect Plus trial activated for both of you! Refreshing your couple space...");
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

  const getPeriodLabel = (plan: PaymentPlan) => {
    if (plan.durationDays === 30) return "/ 30 days";
    if (plan.durationDays === 90) return "/ 3 months";
    if (plan.durationDays === 365) return "/ 1 year";
    return "/ lifetime";
  };

  const getPerMonthOrPartnerText = (plan: PaymentPlan) => {
    if (plan.durationDays === 30) return "₹65 / partner · 30 days";
    if (plan.durationDays === 90) return "~₹83/mo · Save 35%";
    if (plan.durationDays === 365) return "~₹66/mo · Save 48%";
    return "₹1,000 / partner · One-time";
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3D2432] py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#E8527D] selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb / Plus Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F4] border border-[#FFD9E3] text-[#802030] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-current text-[#E8527D]" />
            <span>One Payment Covers Both Partners</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3D2432] font-display italic">
            Pairfect Plus Passes
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#7A4B5D] leading-relaxed">
            When either partner buys a pass, both accounts get full access. No recurring auto-debit surprises - recharge only when you want.
          </p>

          {/* User Sign-In Notice if unauthenticated */}
          {!user && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-left shadow-xs">
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
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 flex items-center justify-center gap-3 text-sm shadow-xs">
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
          <div className="p-4 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#802030] flex items-start gap-3 text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 text-[#E8527D] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Checkout Notice:</span>
              <span>{lastError}</span>
            </div>
          </div>
        )}

        {/* Trial Success Message */}
        {trialMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{trialMessage}</span>
          </div>
        )}

        {/* 7-Day Free Trial Banner for Eligible Couples */}
        {!isPlus && trialEligible && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF5F8] via-[#FFF9F5] to-[#FFF3F6] border border-[#FFD9E3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8527D] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#E8527D]/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-display italic font-bold text-lg text-[#3D2432]">
                    Try Pairfect Plus free for 7 days
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    NO CARD REQUIRED
                  </span>
                </div>
                <p className="text-xs text-[#7A4B5D] mt-1 max-w-xl leading-relaxed">
                  Full access for both of you. Keep everything on your Memory Wall forever, seal time-capsule letters for future anniversaries, and play all 14 quiz packs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleActivateTrial}
              disabled={trialLoading}
              className="btn-journal py-3 px-6 text-xs font-mono font-bold shrink-0 w-full sm:w-auto shadow-sm whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-98 transition-transform"
            >
              {trialLoading ? "Activating..." : "Start 7-Day Free Trial ▷"}
            </button>
          </div>
        )}

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {primaryPlans.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setLastError(null);
                }}
                className={`relative cursor-pointer rounded-[28px] p-6 transition-all duration-300 flex flex-col justify-between group ${
                  isSelected
                    ? "bg-gradient-to-b from-[#FFFDFE] to-[#FFF5F8] border-2 border-[#E8527D] shadow-[0_12px_36px_rgba(232,82,125,0.14)] ring-4 ring-[#E8527D]/10 sm:-translate-y-1 z-10"
                    : "bg-white/90 hover:bg-white border border-[#FFD9E3] hover:border-[#E8527D]/50 shadow-[0_4px_20px_rgba(61,36,50,0.04)] hover:shadow-[0_8px_30px_rgba(232,82,125,0.08)] hover:-translate-y-0.5"
                }`}
              >
                {/* Badge if present */}
                {plan.badge && (
                  <span
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-widest py-1 px-3.5 rounded-full shadow-xs whitespace-nowrap transition-transform group-hover:scale-105 ${
                      isSelected
                        ? "bg-[#E8527D] text-white ring-2 ring-white"
                        : plan.popular
                        ? "bg-[#802030] text-white ring-2 ring-white"
                        : "bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3] ring-2 ring-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  {/* Title & Radio indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display italic font-bold text-[#3D2432] text-xl">
                        {plan.name}
                      </h3>
                      <p className="text-[10px] text-[#7A4B5D] font-mono uppercase tracking-wider mt-0.5">
                        {plan.durationDays ? `${plan.durationDays} days access` : "Lifetime access"}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-[#E8527D] text-white shadow-xs scale-105"
                          : "border-2 border-[#FFD9E3] bg-white group-hover:border-[#E8527D]/40"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : null}
                    </div>
                  </div>

                  {/* Price Row */}
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#3D2432] tracking-tight">
                        ₹{plan.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-[#7A4B5D] font-mono font-medium">
                        {getPeriodLabel(plan)}
                      </span>
                    </div>
                    <div className="mt-1.5 inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3]/70">
                      {getPerMonthOrPartnerText(plan)}
                    </div>
                  </div>

                  {/* Subtitle */}
                  <p className="text-xs text-[#7A4B5D] leading-relaxed min-h-[2.5rem]">
                    {plan.subtitle}
                  </p>

                  {/* Features List */}
                  <div className="pt-3.5 border-t border-[#FFD9E3]/70 space-y-2.5">
                    <div className="text-[10px] font-mono font-bold text-[#7A4B5D] uppercase tracking-wider">
                      Included for both of you:
                    </div>
                    <ul className="space-y-2 text-xs text-[#3D2432]">
                      {plan.features.slice(0, 4).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#FFF0F4] text-[#E8527D] flex items-center justify-center shrink-0 mt-0.5 border border-[#FFD9E3]/60">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Selection Action Button */}
                <div className="pt-5 mt-auto">
                  <div
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center transition-all ${
                      isSelected
                        ? "bg-[#E8527D] text-white shadow-sm"
                        : "bg-[#FFF0F4] text-[#802030] group-hover:bg-[#FFE3EB] border border-[#FFD9E3]"
                    }`}
                  >
                    {isSelected ? "Selected Pass ✓" : "Choose Pass ▷"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Execution Panel */}
        <div className="p-6 sm:p-8 rounded-[32px] bg-white/95 border border-[#FFD9E3] shadow-[0_8px_32px_rgba(232,82,125,0.08)] paper-grain relative space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#FFD9E3]/70 pb-6 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display italic font-bold text-[#3D2432] text-xl sm:text-2xl">
                    Instant Payment &amp; Activation
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3] uppercase tracking-wider">
                    Safe &amp; Encrypted
                  </span>
                </div>
                <p className="text-xs text-[#7A4B5D] mt-0.5">
                  Secured by Cashfree with UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards &amp; Netbanking.
                </p>
              </div>
            </div>
            <div className="sm:text-right bg-[#FFF9FB] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#FFD9E3]/60 flex sm:block items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A4B5D] block">
                  Total Due ({selectedPlan.name})
                </span>
                <span className="text-3xl sm:text-4xl font-display font-black text-[#3D2432] tracking-tight">
                  ₹{selectedPlan.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Prefill Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#7A4B5D] tracking-wider uppercase mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-[#3D2432] placeholder:text-[#B392A0] focus:bg-white focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 outline-none transition-all shadow-xs"
                placeholder="Alex Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#7A4B5D] tracking-wider uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-[#3D2432] placeholder:text-[#B392A0] focus:bg-white focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 outline-none transition-all shadow-xs"
                placeholder="alex@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#7A4B5D] tracking-wider uppercase mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#FFD9E3] bg-[#FFF9FB] text-[#3D2432] placeholder:text-[#B392A0] focus:bg-white focus:border-[#E8527D] focus:ring-2 focus:ring-[#E8527D]/20 outline-none transition-all shadow-xs"
                placeholder="Leave blank for all UPI options"
              />
              <span className="text-[10px] text-[#7A4B5D]/70 mt-1 block">
                Leave blank to prevent 1-click saved method lock-in.
              </span>
            </div>
          </div>

          {/* Pay Button & Security Badges */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#FFD9E3]/70">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A4B5D]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <span className="text-[#FFD9E3]">•</span>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#E8527D] fill-current" />
                <span>One Pass for Both Partners</span>
              </div>
              <span className="text-[#FFD9E3]">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instant Activation</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <CashfreeCheckoutButton
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                displayAmount={`₹${selectedPlan.amount.toLocaleString("en-IN")}`}
                phone={customerPhone}
                customerName={customerName}
                buttonText={`Pay ₹${selectedPlan.amount.toLocaleString("en-IN")} via Cashfree ▷`}
                onSuccess={(orderId) => {
                  router.push(`/payment-status?order_id=${encodeURIComponent(orderId)}`);
                }}
                onError={(err) => {
                  handleError(err);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-mono text-xs font-bold tracking-wider uppercase text-white bg-[#E8527D] hover:bg-[#D13D68] active:scale-[0.99] transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
              />
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white/80 border border-[#FFD9E3] space-y-2 shadow-xs hover:border-[#E8527D]/40 hover:bg-white transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <strong className="block font-display italic font-bold text-[#3D2432] text-sm">
              Unlimited Photobooth
            </strong>
            <p className="text-[#7A4B5D] leading-relaxed">
              Capture photo strips with vintage grain filters and custom couple frames.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 border border-[#FFD9E3] space-y-2 shadow-xs hover:border-[#E8527D]/40 hover:bg-white transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F4] border border-[#FFD9E3] text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <strong className="block font-display italic font-bold text-[#3D2432] text-sm">
              AI Vibe Judge
            </strong>
            <p className="text-[#7A4B5D] leading-relaxed">
              Playful, objective mediation for relationship debates, habits, and gentle verdicts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 border border-[#FFD9E3] space-y-2 shadow-xs hover:border-[#E8527D]/40 hover:bg-white transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <strong className="block font-display italic font-bold text-[#3D2432] text-sm">
              Permanent Memory Wall
            </strong>
            <p className="text-[#7A4B5D] leading-relaxed">
              Full-resolution cloud storage for love letters, moments, voice clips, and milestone photos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 border border-[#FFD9E3] space-y-2 shadow-xs hover:border-[#E8527D]/40 hover:bg-white transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#802030] flex items-center justify-center">
              <Infinity className="w-4 h-4" />
            </div>
            <strong className="block font-display italic font-bold text-[#3D2432] text-sm">
              No Auto-Debit Traps
            </strong>
            <p className="text-[#7A4B5D] leading-relaxed">
              Recharge with simple passes when you need them. No surprise recurring charges ever.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/dashboard"
            className="text-xs font-mono text-[#7A4B5D] hover:text-[#3D2432] underline underline-offset-4 transition-colors"
          >
            Return to Dashboard
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
            <div className="w-8 h-8 rounded-full border-3 border-[#FFD9E3] border-t-[#E8527D] animate-spin" />
            <p className="font-mono text-xs text-[#7A4B5D] uppercase tracking-wider">
              Loading passes...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
