import { createAdminClient } from "@/lib/supabase/admin";

export interface SubscriptionPairState {
  id?: string;
  subscription_tier?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  subscription_order_id?: string | null;
  trial_used?: boolean | null;
  trial_ends_at?: string | null;
}

/**
 * Single source of truth for verifying Plus access for a couple.
 */
export function hasPlusAccess(pair: SubscriptionPairState | null | undefined): boolean {
  if (!pair) return false;

  // 1. Lifetime Forever access
  if (pair.subscription_tier === "forever") {
    return true;
  }

  // 2. Active Plus term access (includes active paid passes and 7-day trials)
  if (
    pair.subscription_tier === "plus" &&
    pair.subscription_status === "active" &&
    pair.subscription_expires_at
  ) {
    const expiry = new Date(pair.subscription_expires_at).getTime();
    return !isNaN(expiry) && expiry > Date.now();
  }

  return false;
}

/**
 * Extracts granular subscription metadata for UI displays.
 */
export function getSubscriptionDetails(pair: SubscriptionPairState | null | undefined) {
  const isPlus = hasPlusAccess(pair);
  const tier = (pair?.subscription_tier || "free") as "free" | "plus" | "forever";
  const isLifetime = tier === "forever";
  const isTrial = isPlus && Boolean(pair?.trial_used && !pair?.subscription_order_id);

  let daysRemaining: number | null = null;
  let isExpiringSoon = false;

  if (pair?.subscription_expires_at && !isLifetime) {
    const diffMs = new Date(pair.subscription_expires_at).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    isExpiringSoon = isPlus && daysRemaining <= 3 && daysRemaining > 0;
  }

  return {
    isPlus,
    tier,
    isLifetime,
    isTrial,
    expiresAt: pair?.subscription_expires_at || null,
    daysRemaining,
    isExpiringSoon,
  };
}

/**
 * Server-side authorization check for API routes requiring Pairfect Plus.
 */
export async function requirePlusAccess(pairId: string): Promise<{ authorized: boolean; reason?: string }> {
  if (!pairId) {
    return { authorized: false, reason: "Missing pair_id" };
  }

  try {
    const admin = createAdminClient();
    const { data: pair, error } = await admin
      .from("pairs")
      .select("id, subscription_tier, subscription_status, subscription_expires_at")
      .eq("id", pairId)
      .maybeSingle();

    if (error || !pair) {
      return { authorized: false, reason: "Pair record not found" };
    }

    if (!hasPlusAccess(pair)) {
      return { authorized: false, reason: "Active Pairfect Plus membership required" };
    }

    return { authorized: true };
  } catch (err: any) {
    console.error("[requirePlusAccess] Exception:", err);
    return { authorized: false, reason: "Internal entitlement check failed" };
  }
}
