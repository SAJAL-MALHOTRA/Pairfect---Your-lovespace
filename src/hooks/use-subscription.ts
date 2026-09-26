"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { getSubscriptionDetails } from "@/lib/entitlements";

export function useSubscription() {
  const { pair, loading } = useAuth();
  const details = getSubscriptionDetails(pair);

  return {
    ...details,
    loading,
    pair,
  };
}
