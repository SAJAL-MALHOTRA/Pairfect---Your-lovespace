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
    name: "1-Month Sanctuary Pass",
    amount: 99.0, // ₹99
    currency: "INR",
    tier: "plus",
    durationDays: 30,
    subtitle: "30 days of unmetered digital sanctuary features for both of you.",
    features: [
      "Pay once, unlocks for BOTH partners",
      "Unlimited high-resolution Photobooth sessions",
      "Priority AI Vibe Judge mediation",
      "Unlimited cloud keepsake vault storage",
      "Exclusive romantic game decks",
    ],
  },
  "plus-annual": {
    id: "plus-annual",
    name: "1-Year Sanctuary Pass",
    amount: 799.0, // ₹799 (Save ~33%)
    currency: "INR",
    tier: "plus",
    durationDays: 365,
    popular: true,
    badge: "Save 33% · Best Value",
    subtitle: "A full year of living memories, rituals, and celebration.",
    features: [
      "Everything in Monthly Pass for 365 days",
      "Custom anniversary frames & keepsakes",
      "Priority customer care & memory recovery",
      "Early beta access to new couple rituals",
    ],
  },
  "pairfect-forever": {
    id: "pairfect-forever",
    name: "Forever Sanctuary Pass",
    amount: 1499.0, // ₹1,499
    currency: "INR",
    tier: "forever",
    durationDays: null,
    badge: "Anniversary Gift #1",
    subtitle: "One-time purchase. Lifetime keepsake archive for exactly two people.",
    features: [
      "Lifetime access to all current & future features",
      "Permanent digital memory vault forever",
      "All couple themes, frames, and audio mixtapes",
      "Pay once — no recurring charges ever",
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

// Aliases for backward compatibility
const PLAN_ALIASES: Record<string, string> = {
  "pairfect-plus": "plus-monthly",
};

export function getPlan(planId: string): PaymentPlan | null {
  if (!planId || typeof planId !== "string") return null;
  const normalized = planId.trim();
  const targetId = PLAN_ALIASES[normalized] || normalized;
  return PAYMENT_PLANS[targetId] || null;
}
