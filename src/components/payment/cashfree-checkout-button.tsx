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

    console.log("[Cashfree Checkout Step 1] Click handler initiated. Plan:", planId);

    try {
      // Step 1: Auth token fetch
      console.log("[Cashfree Checkout Step 2] Fetching active session from Supabase browser client...");
      const supabase = createClient();
      let {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("[Cashfree Checkout Step 3] Initial session lookup result:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
      });

      if (!session) {
        console.log("[Cashfree Checkout Step 3a] Session is null, attempting refreshSession()...");
        const { data: refreshed } = await supabase.auth
          .refreshSession()
          .catch((refreshErr: any) => {
            console.warn("[Cashfree Checkout Step 3b] refreshSession exception:", refreshErr);
            return { data: { session: null } };
          });
        session = refreshed?.session || null;
        console.log("[Cashfree Checkout Step 3c] Refreshed session lookup result:", {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id,
        });
      }

      if (!session) {
        console.warn("[Cashfree Checkout Step 3d] No session available. Calling router.push('/login?redirect=/checkout')");
        router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Step 2: Call server endpoint to create order
      console.log("[Cashfree Checkout Step 4] Calling POST /api/create-order with payload:", {
        plan_id: planId,
        hasPhone: !!phone,
        hasCustomerName: !!customerName,
        hasAuthHeader: !!headers["Authorization"],
      });

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan_id: planId,
          phone: phone || undefined,
          customer_name: customerName || undefined,
        }),
      });

      console.log("[Cashfree Checkout Step 5] /api/create-order response status:", res.status, res.statusText);

      const data = await res.json().catch((jsonErr) => {
        console.error("[Cashfree Checkout Step 5a] JSON parse error:", jsonErr);
        return null;
      });

      console.log("[Cashfree Checkout Step 5b] /api/create-order response payload:", data);

      if (res.status === 401) {
        console.warn("[Cashfree Checkout Step 5c] /api/create-order returned 401 Unauthorized:", data?.error);
        setError(data?.error || "Your session may have expired. Please sign in again.");
        onError?.(data?.error);
        setLoading(false);
        return;
      }

      if (!res.ok || !data?.payment_session_id) {
        const errorMsg =
          data?.error || "Failed to initialize Cashfree payment order.";
        console.error("[Cashfree Checkout Step 5d] /api/create-order failed:", {
          status: res.status,
          errorMsg,
        });
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
        return;
      }

      // Step 3: Initialize Cashfree Web SDK
      const envMode =
        process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
          ? "production"
          : "sandbox";

      console.log("[Cashfree Checkout Step 6] Loading Cashfree SDK with mode:", envMode);

      const cashfree = await load({
        mode: envMode,
      });

      if (!cashfree) {
        console.error("[Cashfree Checkout Step 6a] Cashfree SDK failed to load (returned null/undefined)");
        throw new Error("Failed to load Cashfree checkout SDK.");
      }

      console.log("[Cashfree Checkout Step 7] Cashfree SDK loaded successfully. Invoking cashfree.checkout() with:", {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      });

      // Step 4: Initiate checkout with _modal for modal popup
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      });

      console.log("[Cashfree Checkout Step 8] cashfree.checkout() call resolved:", checkoutResult);

      onSuccess?.(data.order_id);
    } catch (err: any) {
      console.error("[Cashfree Checkout Exception]:", err);
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
