"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Heart,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface OrderStatusResult {
  order_id: string;
  order_status: "PAID" | "ACTIVE" | "EXPIRED" | "FAILED" | "PENDING" | string;
  amount?: number;
  currency?: string;
  payment_session_id?: string;
  created_at?: string;
  error?: string;
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrderStatusResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const fetchStatus = async () => {
    if (!orderId) {
      setErrorMessage("No order_id parameter provided in the return URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Pass Bearer token if session exists
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Call server-side verification route — never trust the client query param alone
      const res = await fetch(
        `/api/cashfree/order-status?order_id=${encodeURIComponent(orderId)}`,
        { headers }
      );
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setForbidden(true);
        setErrorMessage(
          json?.error || "You do not have permission to view this order."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMessage(json?.error || "Failed to verify order status.");
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    } catch (err: any) {
      console.error("[Payment Status Error]:", err);
      setErrorMessage("Network error verifying order status. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto" />
          <h2 className="text-xl font-semibold">Verifying Payment...</h2>
          <p className="text-sm text-neutral-400">
            Confirming your transaction with Cashfree Gateway servers.
          </p>
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Sign In Required</h2>
          <p className="text-sm text-neutral-400">
            Please sign in with your Pairfect account to securely view this
            transaction status.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(
              `/payment-status?order_id=${orderId}`
            )}`}
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors"
          >
            Sign In to Verify
          </Link>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-red-400">Access Forbidden</h2>
          <p className="text-sm text-neutral-400">{errorMessage}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl font-medium text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPaid =
    data?.order_status?.toUpperCase() === "PAID" ||
    data?.order_status?.toUpperCase() === "SUCCESS";
  const isFailed =
    data?.order_status?.toUpperCase() === "FAILED" ||
    data?.order_status?.toUpperCase() === "EXPIRED" ||
    data?.order_status?.toUpperCase() === "CANCELLED";
  const isPending = !isPaid && !isFailed;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          {isPaid && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}
          {isFailed && (
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/10">
              <XCircle className="w-8 h-8" />
            </div>
          )}
          {isPending && (
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight">
            {isPaid && "Payment Successful!"}
            {isFailed && "Payment Not Completed"}
            {isPending && "Payment Pending Confirmation"}
          </h1>

          <p className="text-sm text-neutral-400">
            {isPaid &&
              "Your transaction was securely verified by Cashfree Gateway."}
            {isFailed &&
              "The transaction was cancelled or failed by your bank/UPI provider."}
            {isPending &&
              "Your payment is currently being processed. This usually takes under a minute."}
          </p>
        </div>

        {/* Receipt Details Card */}
        {data && (
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center text-neutral-400">
              <span>Order Reference</span>
              <span className="font-mono text-xs text-neutral-200">
                {data.order_id}
              </span>
            </div>

            {data.amount !== undefined && (
              <div className="flex justify-between items-center text-neutral-400">
                <span>Amount</span>
                <span className="font-semibold text-neutral-100 text-base">
                  ₹{data.amount} {data.currency || "INR"}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-neutral-400">
              <span>Gateway Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-xs tracking-wide uppercase ${
                  isPaid
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isFailed
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {data.order_status}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {isPaid && (
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Continue to Pairfect Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}

          {isPending && (
            <button
              onClick={fetchStatus}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-white bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          )}

          {isFailed && (
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again at Checkout</span>
            </Link>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted Payment Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
