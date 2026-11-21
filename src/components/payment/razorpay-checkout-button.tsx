"use client";

import React, { useState } from "react";
import {
  loadRazorpayCheckoutScript,
  RazorpayCheckoutOptions,
  RazorpayPrefill,
  RazorpaySuccessResponse,
  RazorpayVerificationResponse,
} from "@/lib/razorpay";
import { Loader2, ShieldCheck } from "lucide-react";

export interface RazorpayCheckoutButtonProps {
  amount?: number; // In paise (minimum 100 paise = ₹1)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  themeColor?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onSuccess?: (verification: RazorpayVerificationResponse) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
}

export function RazorpayCheckoutButton({
  amount = 100, // 100 paise = ₹1
  currency = "INR",
  name = "Pairfect",
  description = "Pairfect Premium",
  receipt,
  prefill,
  notes,
  themeColor = "#E11D48",
  className = "",
  disabled = false,
  children,
  onSuccess,
  onError,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);

      // 1. Ensure Razorpay Checkout SDK script is loaded
      const isScriptLoaded = await loadRazorpayCheckoutScript();
      if (!isScriptLoaded) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection and try again."
        );
      }

      // 2. Step 1: Create order on backend
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          receipt,
          notes,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initialize payment order.");
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      if (!keyId) {
        throw new Error("Payment gateway configuration is missing. Please contact support.");
      }

      // 3. Step 2: Configure & open Razorpay modal
      const options: RazorpayCheckoutOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name,
        description,
        order_id: orderData.order_id,
        handler: async (response: RazorpaySuccessResponse) => {
          // 4. Step 3: Send payment details to backend for HMAC verification
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData: RazorpayVerificationResponse = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              onSuccess?.(verifyData);
            } else {
              const errMsg = verifyData.error || "Payment verification failed on the server.";
              onError?.(errMsg);
            }
          } catch (verifyErr: any) {
            console.error("Verification network error:", verifyErr);
            onError?.(verifyErr.message || "Failed to contact verification server.");
          } finally {
            setIsLoading(false);
          }
        },
        redirect: false,
        remember_customer: false,
        callback_url:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/payment/callback`
            : undefined,
        prefill,
        notes,
        theme: {
          color: themeColor,
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            onDismiss?.();
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      // Handle payment failure event (declined card, cancelled bank, etc.)
      rzp.on("payment.failed", (response: any) => {
        setIsLoading(false);
        const failureReason =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed or was declined.";
        onError?.(failureReason);
      });

      rzp.open();
    } catch (err: any) {
      setIsLoading(false);
      onError?.(err?.message || "An unexpected error occurred.");
    }
  };

  const displayAmountFormatted = (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isLoading || disabled}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : children ? (
        children
      ) : (
        <>
          <ShieldCheck className="w-5 h-5 text-white/90" />
          <span>Pay ₹{displayAmountFormatted}</span>
        </>
      )}
    </button>
  );
}
