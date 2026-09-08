export interface PaymentPlan {
  id: string;
  name: string;
  amount: number; // In INR (Rupees)
  currency: string;
  subtitle: string;
  features: string[];
  popular?: boolean;
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  "micro-test": {
    id: "micro-test",
    name: "Standard Test Payment",
    amount: 1.0, // ₹1
    currency: "INR",
    subtitle: "Minimum allowable transaction (₹1) for instant verification test.",
    features: [
      "Live Cashfree Sandbox Checkout",
      "Instant order creation via /api/create-order",
      "Cryptographic webhook signature verification",
      "Instant feedback on /payment-status",
    ],
  },
  "pairfect-plus": {
    id: "pairfect-plus",
    name: "Pairfect Plus",
    amount: 49.0, // ₹49
    currency: "INR",
    popular: true,
    subtitle: "Everything you need for an enriched couple journey.",
    features: [
      "Unlimited Photobooth high-res strips",
      "Full access to AI Vibe Judge",
      "Custom stickers & love letter templates",
      "Priority customer support",
    ],
  },
  "pairfect-forever": {
    id: "pairfect-forever",
    name: "Pairfect Forever",
    amount: 199.0, // ₹199
    currency: "INR",
    subtitle: "Lifetime memories pass for the dedicated couple.",
    features: [
      "All Pairfect Plus features included",
      "Lifetime memory vault & recap access",
      "Exclusive romantic game decks",
      "Early access to all new couple tools",
    ],
  },
};

export function getPlan(planId: string): PaymentPlan | null {
  if (!planId || typeof planId !== "string") return null;
  return PAYMENT_PLANS[planId.trim()] || null;
}
