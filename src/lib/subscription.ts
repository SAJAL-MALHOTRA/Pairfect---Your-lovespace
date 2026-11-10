import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, PaymentPlan } from "@/lib/plans";

export interface GrantSubscriptionParams {
  userId: string;
  planId: string;
  orderId: string;
}

export interface GrantSubscriptionResult {
  success: boolean;
  message: string;
  pairId?: string;
  tier?: "plus" | "forever";
  expiresAt?: string | null;
  alreadyProcessed?: boolean;
}

/**
 * Transaction-safe, idempotent subscription entitlement granting engine.
 * Attaches the purchased membership to the couple's active pair_id so both partners get Plus.
 */
export async function grantPairSubscription({
  userId,
  planId,
  orderId,
}: GrantSubscriptionParams): Promise<GrantSubscriptionResult> {
  try {
    // 1. Validate Plan
    const plan: PaymentPlan | null = getPlan(planId);
    if (!plan) {
      return {
        success: false,
        message: `Invalid plan_id '${planId}' provided.`,
      };
    }

    // Safeguard: Do not allow ₹1 micro-test to grant production subscriptions
    if (plan.isTestPlan) {
      const isTestAllowed =
        process.env.ENABLE_MICRO_TEST_PASS === "true" ||
        process.env.NODE_ENV !== "production";

      if (!isTestAllowed) {
        console.warn(
          `[grantPairSubscription] Blocked test pass '${planId}' for order ${orderId} in production.`
        );
        return {
          success: false,
          message:
            "Test verification orders do not grant production subscription access.",
        };
      }
    }

    const admin = createAdminClient();

    // 2. Find User's Active Couple
    const { data: pairs, error: pairLookupErr } = await admin
      .from("pairs")
      .select("*")
      .eq("status", "active")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (pairLookupErr) {
      console.error("[grantPairSubscription] Error querying pairs table:", pairLookupErr);
      return { success: false, message: "Database error querying pair record." };
    }

    const pair = pairs?.[0];
    if (!pair) {
      console.warn(`[grantPairSubscription] No active pair found for user ${userId}.`);
      return {
        success: false,
        message:
          "User does not belong to an active pair. Subscription will link once partnered.",
      };
    }

    // 3. Strict Idempotency Check
    // A: Check if order ID is already stamped on the pair
    if (pair.subscription_order_id === orderId) {
      console.log(
        `[grantPairSubscription] Idempotent hit: Order ${orderId} already stamped on pair ${pair.id}.`
      );
      return {
        success: true,
        alreadyProcessed: true,
        pairId: pair.id,
        tier: pair.subscription_tier,
        expiresAt: pair.subscription_expires_at,
        message: "Order already granted to this pair.",
      };
    }

    // B: Check payments table metadata
    const { data: paymentRecord } = await admin
      .from("payments")
      .select("id, metadata")
      .eq("order_id", orderId)
      .maybeSingle();

    if (paymentRecord?.metadata?.subscription_granted) {
      console.log(
        `[grantPairSubscription] Idempotent hit: Payment ${orderId} metadata already marked as granted.`
      );
      return {
        success: true,
        alreadyProcessed: true,
        pairId: pair.id,
        message: "Order already processed according to payment record.",
      };
    }

    // 4. Calculate New Expiration & Tier
    const currentTier = pair.subscription_tier || "free";
    const currentExpiryMs = pair.subscription_expires_at
      ? new Date(pair.subscription_expires_at).getTime()
      : 0;
    const now = Date.now();

    let newTier: "plus" | "forever" = "plus";
    let newExpiresAt: Date | null = null;

    if (currentTier === "forever") {
      // RULE: Forever is lifetime - never downgrade if monthly is purchased
      newTier = "forever";
      newExpiresAt = null;
    } else if (plan.tier === "forever") {
      // UPGRADE to lifetime Forever
      newTier = "forever";
      newExpiresAt = null;
    } else {
      // PLUS pass: Monthly (30 days) or Annual (365 days)
      newTier = "plus";
      const durationMs = (plan.durationDays || 30) * 24 * 60 * 60 * 1000;

      if (currentExpiryMs > now) {
        // Active pass rollover: add new days on top of remaining days
        newExpiresAt = new Date(currentExpiryMs + durationMs);
      } else {
        // Expired or fresh pass: start from now
        newExpiresAt = new Date(now + durationMs);
      }
    }

    const expiresAtIso = newExpiresAt ? newExpiresAt.toISOString() : null;

    // 5. Update Pair Record
    const { error: updateErr } = await admin
      .from("pairs")
      .update({
        subscription_tier: newTier,
        subscription_status: "active",
        subscription_expires_at: expiresAtIso,
        subscription_order_id: orderId,
        subscription_updated_at: new Date().toISOString(),
      })
      .eq("id", pair.id);

    if (updateErr) {
      console.error(
        `[grantPairSubscription] Failed to update pair ${pair.id}:`,
        updateErr
      );
      return {
        success: false,
        message: `Failed to update pair subscription: ${updateErr.message}`,
      };
    }

    // 6. Record metadata on payments table
    await admin
      .from("payments")
      .update({
        metadata: {
          ...(paymentRecord?.metadata || {}),
          subscription_granted: true,
          granted_at: new Date().toISOString(),
          pair_id: pair.id,
          tier: newTier,
          expires_at: expiresAtIso,
        },
      })
      .eq("order_id", orderId);

    console.log(
      `[grantPairSubscription] Successfully granted '${newTier}' to pair ${pair.id} for order ${orderId} (Expires: ${expiresAtIso || "NEVER/LIFETIME"}).`
    );

    return {
      success: true,
      pairId: pair.id,
      tier: newTier,
      expiresAt: expiresAtIso,
      message: `Granted ${newTier} pass to pair. Both partners unlocked!`,
    };
  } catch (err: any) {
    console.error("[grantPairSubscription] Unexpected error:", err);
    return {
      success: false,
      message: err?.message || "An unexpected error occurred granting subscription.",
    };
  }
}
