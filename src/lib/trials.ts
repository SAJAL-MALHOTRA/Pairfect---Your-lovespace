import { createAdminClient } from "@/lib/supabase/admin";

export interface TrialEligibilityResult {
  eligible: boolean;
  reason?: string;
  trialEndsAt?: string | null;
  daysRemaining?: number | null;
}

/**
 * Checks if a couple is eligible for the 7-day free trial.
 * Enforces one trial per couple ever, checked across historical trial records
 * so unlinking, canceling, or re-creating rooms cannot farm free trials.
 */
export async function checkTrialEligibility(
  pairId: string,
  userAId: string,
  userBId?: string | null
): Promise<TrialEligibilityResult> {
  if (!pairId) {
    return { eligible: false, reason: "No active room found." };
  }

  try {
    const admin = createAdminClient();

    // 1. Check current pair record
    const { data: pair, error: pairErr } = await admin
      .from("pairs")
      .select("trial_used, trial_ends_at, subscription_tier, subscription_status")
      .eq("id", pairId)
      .maybeSingle();

    if (pairErr || !pair) {
      return { eligible: false, reason: "Pair record not found." };
    }

    if (pair.trial_used) {
      // If currently in an active trial, return remaining time
      if (pair.trial_ends_at && new Date(pair.trial_ends_at).getTime() > Date.now()) {
        const diffMs = new Date(pair.trial_ends_at).getTime() - Date.now();
        const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        return {
          eligible: false,
          reason: `Your 7-day free trial is currently active (${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining).`,
          trialEndsAt: pair.trial_ends_at,
          daysRemaining,
        };
      }
      return {
        eligible: false,
        reason: "Your couple has already used the 7-day free trial.",
      };
    }

    // 2. Anti-abuse check: see if either partner has EVER redeemed a trial in history
    const userIds = [userAId, userBId].filter(Boolean) as string[];
    if (userIds.length > 0) {
      const { data: history, error: histErr } = await admin
        .from("pair_trial_history")
        .select("id, started_at, expires_at")
        .or(`user_a_id.in.(${userIds.join(",")}),user_b_id.in.(${userIds.join(",")})`)
        .limit(1);

      if (!histErr && history && history.length > 0) {
        return {
          eligible: false,
          reason: "One or both partners have previously redeemed a 7-day trial in another room.",
        };
      }
    }

    return { eligible: true };
  } catch (err: any) {
    console.error("[checkTrialEligibility] Exception:", err);
    return { eligible: false, reason: "Unable to verify trial eligibility." };
  }
}

/**
 * Activates the 7-day free trial for a couple.
 * Unlocks the full Pairfect Plus feature set for both partners with no credit card required.
 */
export async function startPairTrial(
  pairId: string,
  userAId: string,
  userBId?: string | null
): Promise<{ success: boolean; error?: string; trialEndsAt?: string }> {
  const eligibility = await checkTrialEligibility(pairId, userAId, userBId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason || "Not eligible for free trial." };
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 full days
    const trialEndsISO = trialEndsAt.toISOString();

    // 1. Update pairs table
    const { error: updateErr } = await admin
      .from("pairs")
      .update({
        trial_used: true,
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEndsISO,
        subscription_tier: "plus",
        subscription_status: "active",
        subscription_expires_at: trialEndsISO,
        subscription_updated_at: now.toISOString(),
      })
      .eq("id", pairId);

    if (updateErr) {
      console.error("[startPairTrial] pairs update error:", updateErr);
      return { success: false, error: "Failed to activate trial." };
    }

    // 2. Record in permanent anti-abuse audit table
    await admin.from("pair_trial_history").insert({
      pair_id: pairId,
      user_a_id: userAId,
      user_b_id: userBId || null,
      started_at: now.toISOString(),
      expires_at: trialEndsISO,
      status: "active",
    });

    return { success: true, trialEndsAt: trialEndsISO };
  } catch (err: any) {
    console.error("[startPairTrial] Exception:", err);
    return { success: false, error: err?.message || "Internal error activating trial." };
  }
}

/**
 * Daily cron sweeper to expire lapsed trials back to Free tier.
 */
export async function expireLapsedTrials(): Promise<{ expiredCount: number; error?: string }> {
  try {
    const admin = createAdminClient();

    // Attempt RPC first if migration_v40 function exists
    const { data: rpcCount, error: rpcErr } = await admin.rpc("expire_lapsed_trials");
    if (!rpcErr && typeof rpcCount === "number") {
      return { expiredCount: rpcCount };
    }

    // Fallback direct query if RPC is not yet created in Supabase
    const nowISO = new Date().toISOString();
    const { data: expiredPairs, error: findErr } = await admin
      .from("pairs")
      .select("id")
      .eq("subscription_status", "active")
      .eq("subscription_tier", "plus")
      .eq("trial_used", true)
      .is("subscription_order_id", null)
      .lte("trial_ends_at", nowISO);

    if (findErr || !expiredPairs || expiredPairs.length === 0) {
      return { expiredCount: 0 };
    }

    const pairIds = expiredPairs.map((p) => p.id);
    const { error: updateErr } = await admin
      .from("pairs")
      .update({
        subscription_tier: "free",
        subscription_status: "expired",
        subscription_updated_at: nowISO,
      })
      .in("id", pairIds);

    if (updateErr) {
      console.error("[expireLapsedTrials] fallback update error:", updateErr);
      return { expiredCount: 0, error: updateErr.message };
    }

    // Update trial history status
    await admin
      .from("pair_trial_history")
      .update({ status: "expired" })
      .in("pair_id", pairIds)
      .eq("status", "active");

    return { expiredCount: pairIds.length };
  } catch (err: any) {
    console.error("[expireLapsedTrials] Exception:", err);
    return { expiredCount: 0, error: err?.message };
  }
}
