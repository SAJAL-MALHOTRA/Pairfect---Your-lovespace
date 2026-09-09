"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";

interface CashfreeCheckoutButtonProps {
  planId: string;
  planName?: string;
  displayAmount?: string;
  phone?: string;
  customerName?: string;
  className?: string;
  buttonText?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (errorMessage: string) => void;
}

export function CashfreeCheckoutButton({
  planId,
  planName,
  displayAmount,
  phone,
  customerName,
  className,
  buttonText,
  onSuccess,
  onError,
}: CashfreeCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch active session from Supabase browser client (refresh if needed)
      const supabase = createClient();
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
        session = refreshed?.session || null;
      }

      if (!session) {
        // User is genuinely not signed in
        router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // 1. Call server endpoint to create order and get payment_session_id
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan_id: planId,
          phone: phone || undefined,
          customer_name: customerName || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setError(data?.error || "Your session may have expired. Please sign in again.");
        onError?.(data?.error);
        setLoading(false);
        return;
      }

      if (!res.ok || !data?.payment_session_id) {
        const errorMsg =
          data?.error || "Failed to initialize Cashfree payment order.";
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
        return;
      }

      // 2. Initialize Cashfree Web SDK v3
      const envMode =
        process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
          ? "production"
          : "sandbox";

      const cashfree = await load({
        mode: envMode,
      });

      if (!cashfree) {
        throw new Error("Failed to load Cashfree checkout SDK.");
      }

      // 3. Initiate checkout with redirectTarget: "_self"
      // Cashfree will redirect to return_url: /payment-status?order_id={order_id}
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });

      onSuccess?.(data.order_id);
    } catch (err: any) {
      console.error("[Cashfree Checkout Error]:", err);
      const msg =
        err?.message || "An unexpected error occurred during checkout.";
      setError(msg);
      onError?.(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50 cursor-pointer"
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Connecting to Cashfree...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-rose-200" />
            <span>
              {buttonText ||
                `Pay ${displayAmount ? displayAmount : ""} with Cashfree`}
            </span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-rose-500 text-center font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
