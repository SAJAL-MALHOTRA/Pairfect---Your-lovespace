export type SubscriptionTier = "free" | "plus" | "forever";

export interface PaymentPlan {
  id: string;
  name: string;
  amount: number; // In INR (Rupees)
  currency: string;
  tier: SubscriptionTier;
  durationDays: number | null; // null represents lifetime / forever
  subtitle: string;
  features: string[];
  popular?: boolean;
  badge?: string;
  isTestPlan?: boolean;
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  "plus-monthly": {
    id: "plus-monthly",
    name: "Plus Monthly",
    amount: 129.0, // ₹129/mo (₹65/partner)
    currency: "INR",
    tier: "plus",
    durationDays: 30,
    subtitle: "Month-to-month access for couples who want flexibility without a longer commitment.",
    features: [
      "One pass covers both partners",
      "Unlimited Botanical Bouquets & Wax-Sealed Letters",
      "Keep all photos and letters on your Memory Wall forever",
      "Seal time-capsule letters for future anniversaries and dates",
      "Play all 14 quiz packs",
      "Unlimited full-resolution photo booth downloads",
      "Create unlimited Spotify mixtapes",
    ],
  },
  "plus-quarterly": {
    id: "plus-quarterly",
    name: "3-Month Pass",
    amount: 249.0, // ₹249 (₹125/partner)
    currency: "INR",
    tier: "plus",
    durationDays: 90,
    popular: true,
    badge: "Most Popular",
    subtitle: "Three months of Plus for less than the cost of two monthly renewals.",
    features: [
      "Everything in Plus Monthly",
      "Saves 35% compared to month-to-month renewals",
      "Guaranteed price for 90 days with no monthly bill",
      "Ideal window for testing shared daily habits together",
    ],
  },
  "plus-annual": {
    id: "plus-annual",
    name: "1-Year Pass",
    amount: 799.0, // ₹799 (₹400/partner)
    currency: "INR",
    tier: "plus",
    durationDays: 365,
    badge: "Best Value",
    subtitle: "A full year together at our lowest monthly rate, saving nearly half off monthly pricing.",
    features: [
      "Everything in 3-Month Pass",
      "Covers every anniversary, birthday, and holiday across the entire year",
      "Saves 48% compared to month-to-month renewals (₹66/month total)",
      "One payment protects your Memory Wall for 365 days",
    ],
  },
  "pairfect-forever": {
    id: "pairfect-forever",
    name: "Forever Pass",
    amount: 1999.0, // ₹1,999 (₹1,000/partner)
    currency: "INR",
    tier: "forever",
    durationDays: null,
    badge: "Pay Once, Keep Forever",
    subtitle: "Pay once, never pay again. Your shared space stays active for life with zero future charges.",
    features: [
      "Everything in 1-Year Pass, with no expiration date",
      "One single payment covers both of you permanently",
      "Memory Wall never expires or deletes older files",
      "Includes every new feature and quiz pack added in the future",
      "Equals the cost of two and a half annual passes",
    ],
  },
  "micro-test": {
    id: "micro-test",
    name: "Standard Test Payment",
    amount: 1.0, // ₹1
    currency: "INR",
    tier: "plus",
    durationDays: 1,
    isTestPlan: true,
    subtitle: "Minimum allowable transaction (₹1) for gateway connectivity verification.",
    features: [
      "Instant Cashfree gateway verification",
      "Cryptographic webhook signature check",
      "Guarded against production loophole",
    ],
  },
};

// Aliases for backward compatibility and flexible URL params
const PLAN_ALIASES: Record<string, string> = {
  "pairfect-plus": "plus-monthly",
  "monthly": "plus-monthly",
  "plus-3month": "plus-quarterly",
  "3month": "plus-quarterly",
  "quarterly": "plus-quarterly",
  "annual": "plus-annual",
  "yearly": "plus-annual",
  "forever": "pairfect-forever",
  "lifetime": "pairfect-forever",
};

export function getPlan(planId: string): PaymentPlan | null {
  if (!planId || typeof planId !== "string") return null;
  const normalized = planId.trim().toLowerCase();
  const targetId = PLAN_ALIASES[normalized] || normalized;
  return PAYMENT_PLANS[targetId] || null;
}
