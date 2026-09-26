"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RazorpayCheckoutButton } from "@/components/payment/razorpay-checkout-button";
import { CashfreeCheckoutButton } from "@/components/payment/cashfree-checkout-button";
import { RazorpayVerificationResponse } from "@/lib/razorpay";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Sparkles,
  Heart,
  Shield,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
  pricePaise: number;
  displayPrice: string;
  subtitle: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "micro-test",
    name: "Standard Test Payment",
    pricePaise: 100, // ₹1 (100 paise)
    displayPrice: "₹1",
    subtitle: "Minimum allowable transaction (100 paise) for instant verification test.",
    features: [
      "Live Cashfree Checkout modal",
      "Instant order creation via /api/create-order",
      "Cryptographic webhook signature verification",
      "Instant feedback & receipt on /payment-status",
    ],
  },
  {
    id: "pairfect-plus",
    name: "Pairfect Plus (Monthly)",
    pricePaise: 4900, // ₹49
    displayPrice: "₹49",
    subtitle: "Unlimited photobooth strips, soundscapes, and AI Vibe Judge access.",
    popular: true,
    features: [
      "All features in Free",
      "Synchronized Photobooth unmetered sessions",
      "High-resolution film strip rendering",
      "Priority AI Vibe Judge mediation",
    ],
  },
  {
    id: "pairfect-forever",
    name: "Pairfect Forever (Lifetime)",
    pricePaise: 19900, // ₹199
    displayPrice: "₹199",
    subtitle: "One-time payment for lifetime access to all current and future features.",
    features: [
      "Everything in Plus forever",
      "Unlimited digital keepsake cloud storage",
      "Exclusive couple themes & frames",
      "Early beta access to new features",
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(PLANS[0]);
  const [customAmountRupees, setCustomAmountRupees] = useState<string>("10");
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);

  // Prefill state (leaving phone empty avoids Razorpay 1-click saved methods lock-in)
  const [prefillName, setPrefillName] = useState("Alex Smith");
  const [prefillEmail, setPrefillEmail] = useState("alex@example.com");
  const [prefillPhone, setPrefillPhone] = useState("");

  // Verification result state
  const [verificationResult, setVerificationResult] = useState<RazorpayVerificationResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<boolean>(false);

  // Check URL query parameters in case of redirect callback
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      const orderId = params.get("order_id");
      const paymentId = params.get("payment_id");
      const message = params.get("message");

      if (status === "success" && orderId && paymentId) {
        setVerificationResult({
          verified: true,
          order_id: orderId,
          payment_id: paymentId,
          message: "Payment verified successfully via callback",
        });
      } else if (status === "error") {
        setLastError(message || "Payment or verification failed");
      }
    }
  }, []);

  const activeAmountPaise = useCustomAmount
    ? Math.max(100, Math.round((parseFloat(customAmountRupees) || 1) * 100))
    : selectedPlan.pricePaise;

  const handleSuccess = (result: RazorpayVerificationResponse) => {
    setVerificationResult(result);
    setLastError(null);
    setDismissedNotice(false);
  };

  const handleError = (errorMsg: string) => {
    setLastError(errorMsg);
    setDismissedNotice(false);
  };

  const handleDismiss = () => {
    setDismissedNotice(true);
  };

  const handleReset = () => {
    setVerificationResult(null);
    setLastError(null);
    setDismissedNotice(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold tracking-wide uppercase">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Cashfree Secure Checkout
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Pairfect Sanctuary Membership
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600">
            Seamless payments powered by Cashfree Payments. Instant UPI, Cards, Netbanking & Wallets with bank-grade 256-bit encryption.
          </p>
        </div>

        {/* Verification Success Banner */}
        {verificationResult && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-emerald-900">
                    Payment Verified Successfully!
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
                <p className="text-sm text-emerald-700">
                  The Razorpay signature was verified with HMAC-SHA256 on the backend server.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white/80 p-3 rounded-lg border border-emerald-200">
                  <div>
                    <span className="text-stone-500 font-sans block">Order ID:</span>
                    <span className="text-stone-900 font-semibold">{verificationResult.order_id}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-sans block">Payment ID:</span>
                    <span className="text-stone-900 font-semibold">{verificationResult.payment_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error / Dismissal Banners */}
        {lastError && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Payment Error:</span>
              <span>{lastError}</span>
            </div>
          </div>
        )}

        {dismissedNotice && !lastError && !verificationResult && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>The Razorpay checkout modal was closed without completing the payment.</span>
          </div>
        )}

        {/* Main Grid: Plan Selector & Checkout Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = !useCustomAmount && selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setUseCustomAmount(false);
                }}
                className={`relative cursor-pointer rounded-2xl p-6 transition-all border-2 flex flex-col justify-between ${
                  isSelected
                    ? "border-rose-600 bg-white shadow-lg shadow-rose-100 ring-2 ring-rose-600/20"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm">
                    Most Popular
                  </span>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-900">{plan.name}</h3>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-rose-600 bg-rose-600" : "border-stone-300"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900">{plan.displayPrice}</span>
                    <span className="text-xs text-stone-500">
                      ({plan.pricePaise} paise)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{plan.subtitle}</p>

                  <ul className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Amount Toggle */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Custom Amount Testing
              </h3>
              <p className="text-xs text-stone-500">
                Test with any custom amount (minimum ₹1 / 100 paise).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-stone-700 flex items-center gap-2">
                <span>Enter Amount (₹):</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmountRupees}
                  onChange={(e) => {
                    setCustomAmountRupees(e.target.value);
                    setUseCustomAmount(true);
                  }}
                  className="w-24 px-3 py-1.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => setUseCustomAmount(true)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  useCustomAmount
                    ? "bg-rose-600 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                Use Custom
              </button>
            </div>
          </div>
        </div>

        {/* Customer Prefill Configuration & Final Checkout CTA */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-stone-900">Checkout Details</h2>
                <p className="text-xs text-stone-500">
                  Prefill information passed to the Cashfree checkout modal
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 block">Total Due</span>
              <span className="text-2xl font-black text-rose-600">
                ₹{(activeAmountPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={prefillName}
                onChange={(e) => setPrefillName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Alex Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={prefillEmail}
                onChange={(e) => setPrefillEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="alex@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={prefillPhone}
                onChange={(e) => setPrefillPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Leave blank to show all payment methods"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Leave blank to prevent 1-Click saved method lock-in.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>256-bit encrypted • Cashfree Gateway Enabled</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <CashfreeCheckoutButton
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                displayAmount={`₹${(selectedPlan.pricePaise / 100).toLocaleString("en-IN")}`}
                phone={prefillPhone}
                customerName={prefillName}
                buttonText={`Pay ₹${(selectedPlan.pricePaise / 100).toLocaleString("en-IN")} with Cashfree`}
                onSuccess={(orderId) => {
                  router.push(`/payment-status?order_id=${encodeURIComponent(orderId)}`);
                }}
                onError={(err) => {
                  handleError(err);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.99] transition-all shadow-md hover:shadow-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Integration Architecture Documentation Box */}
        <div className="rounded-2xl bg-white p-6 border border-stone-200 text-xs text-stone-600 space-y-3">
          <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
            How Cashfree Payments Work
          </h4>
          <ol className="list-decimal pl-4 space-y-1.5 text-stone-600">
            <li>
              <strong>Order Creation:</strong> Frontend calls <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">POST /api/create-order</code> with the selected plan. The server resolves the price from the server catalog and calls Cashfree PG API (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">cf.PGCreateOrder</code>) to generate a secure <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">payment_session_id</code>.
            </li>
            <li>
              <strong>Seamless Web Checkout:</strong> The <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">@cashfreepayments/cashfree-js</code> SDK opens the official Cashfree checkout modal supporting UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, and Netbanking.
            </li>
            <li>
              <strong>Automatic Verification:</strong> Upon completion, the return URL (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">/payment-status?order_id=...</code>) invokes <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">GET /api/cashfree/order-status</code>, which server-verifies the order directly with Cashfree's gateway.
            </li>
            <li>
              <strong>Instant Webhook Sync:</strong> Real-time asynchronous payment updates are verified cryptographically via HMAC-SHA256 signatures on <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">POST /api/cashfree/webhook</code>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
