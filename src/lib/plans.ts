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
    amount: 129.0, // ₹129/mo (~₹65/partner)
    currency: "INR",
    tier: "plus",
    durationDays: 30,
    subtitle: "30 days of unmetered digital sanctuary features for both of you (~₹65/partner).",
    features: [
      "Pay once, unlocks for BOTH partners (~₹65/person)",
      "Unlimited high-resolution Photobooth sessions",
      "Priority AI Vibe Judge mediation",
      "Unlimited cloud keepsake vault storage",
      "Exclusive romantic game decks & audio",
    ],
  },
  "plus-quarterly": {
    id: "plus-quarterly",
    name: "3-Month Pass",
    amount: 249.0, // ₹249 (~₹125/partner)
    currency: "INR",
    tier: "plus",
    durationDays: 90,
    popular: true,
    badge: "Most Popular for Couples",
    subtitle: "90 days of living memories, rituals, and celebration for both of you (Only ₹125/partner).",
    features: [
      "Pay once, unlocks for BOTH partners (Only ₹125/person)",
      "Unlimited permanent Memory Wall & Vault",
      "High-Res photostrip print exports",
      "Schedule letters up to 10 years ahead",
      "Meanwhile weather & distance card",
      "Custom Spotify cassette mixtape shells",
    ],
  },
  "plus-annual": {
    id: "plus-annual",
    name: "1-Year Sanctuary Pass",
    amount: 799.0, // ₹799
    currency: "INR",
    tier: "plus",
    durationDays: 365,
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
    name: "Forever Pass",
    amount: 1999.0, // ₹1,999 (~₹1,000/partner)
    currency: "INR",
    tier: "forever",
    durationDays: null,
    badge: "Lifetime Sanctuary",
    subtitle: "One-time purchase of ₹1,999 (₹1,000/partner). Lifetime keepsake archive for exactly two people.",
    features: [
      "Pay once — unlocks for BOTH partners forever",
      "Permanent encrypted living archive for life",
      "All couple themes, frames, and audio mixtapes",
      "Gold VIP couple badge on profile & room",
      "All future updates & date rituals included forever",
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
