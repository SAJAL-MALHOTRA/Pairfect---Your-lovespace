import { hasPlusAccess, getSubscriptionDetails } from "../lib/entitlements";
import { getPlan, PAYMENT_PLANS } from "../lib/plans";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== RUNNING SUBSCRIPTION LOGIC TESTS ===");

// 1. Plan Catalog Tests
console.log("\n1. Plan Catalog & Aliases:");
const monthly = getPlan("plus-monthly");
assert(!!monthly && monthly.amount === 99 && monthly.durationDays === 30, "plus-monthly is ₹99 for 30 days");

const annual = getPlan("plus-annual");
assert(!!annual && annual.amount === 799 && annual.durationDays === 365, "plus-annual is ₹799 for 365 days");

const forever = getPlan("pairfect-forever");
assert(!!forever && forever.amount === 1499 && forever.durationDays === null && forever.tier === "forever", "pairfect-forever is ₹1499 lifetime");

const microTest = getPlan("micro-test");
assert(!!microTest && microTest.amount === 1 && microTest.isTestPlan === true, "micro-test is flagged as test plan");

const legacyAlias = getPlan("pairfect-plus");
assert(!!legacyAlias && legacyAlias.id === "plus-monthly", "pairfect-plus aliases to plus-monthly");

const invalidPlan = getPlan("non-existent-plan");
assert(invalidPlan === null, "Unknown plan returns null");

// 2. Entitlement Evaluation Tests
console.log("\n2. Entitlements - hasPlusAccess():");
assert(hasPlusAccess(null) === false, "Null pair has no Plus access");
assert(hasPlusAccess(undefined) === false, "Undefined pair has no Plus access");

assert(
  hasPlusAccess({
    subscription_tier: "free",
    subscription_status: "inactive",
    subscription_expires_at: null,
  }) === false,
  "Free tier pair has no Plus access"
);

const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
assert(
  hasPlusAccess({
    subscription_tier: "plus",
    subscription_status: "active",
    subscription_expires_at: futureDate,
  }) === true,
  "Active plus pair with future expiry has Plus access"
);

const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
assert(
  hasPlusAccess({
    subscription_tier: "plus",
    subscription_status: "active",
    subscription_expires_at: pastDate,
  }) === false,
  "Active plus pair with past expiry has NO Plus access"
);

assert(
  hasPlusAccess({
    subscription_tier: "plus",
    subscription_status: "cancelled",
    subscription_expires_at: futureDate,
  }) === false,
  "Cancelled pair with future date has NO Plus access"
);

assert(
  hasPlusAccess({
    subscription_tier: "forever",
    subscription_status: "active",
    subscription_expires_at: null,
  }) === true,
  "Forever tier pair has Plus access indefinitely"
);

assert(
  hasPlusAccess({
    subscription_tier: "forever",
    subscription_status: "inactive",
    subscription_expires_at: null,
  }) === true,
  "Forever tier pair has Plus access regardless of status"
);

// 3. Subscription Details & Expiry Warning
console.log("\n3. getSubscriptionDetails():");
const expiringSoonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const detailsExpiringSoon = getSubscriptionDetails({
  subscription_tier: "plus",
  subscription_status: "active",
  subscription_expires_at: expiringSoonDate,
});
assert(detailsExpiringSoon.isPlus === true, "Expiring soon pair has isPlus = true");
assert(detailsExpiringSoon.isExpiringSoon === true, "2 days remaining triggers isExpiringSoon");
assert(detailsExpiringSoon.daysRemaining === 2 || detailsExpiringSoon.daysRemaining === 3, "daysRemaining calculated accurately");

const detailsForever = getSubscriptionDetails({
  subscription_tier: "forever",
});
assert(detailsForever.isLifetime === true, "Forever tier sets isLifetime = true");
assert(detailsForever.isPlus === true, "Forever tier sets isPlus = true");
assert(detailsForever.daysRemaining === null, "Forever tier has null daysRemaining");

console.log("\n🎉 ALL UNIT ASSERTIONS PASSED SUCCESSFULLY!\n");
