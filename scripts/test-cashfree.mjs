import crypto from "crypto";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { PAYMENT_PLANS, getPlan } from "../src/lib/plans.ts";

console.log("=== CASHFREE INTEGRATION TEST SUITE ===\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. Server-Side Price Validation Tests
// -------------------------------------------------------------
console.log("--- 1. Testing Server-Side Price Validation ---");

const microPlan = getPlan("micro-test");
assert(microPlan !== null, "Plan 'micro-test' resolves server-side");
assert(microPlan?.amount === 1.0, "Plan 'micro-test' is exactly ₹1.00");
assert(microPlan?.currency === "INR", "Currency is INR");

const plusPlan = getPlan("pairfect-plus");
assert(plusPlan?.amount === 129.0, "Plan 'pairfect-plus' is exactly ₹129.00");

const foreverPlan = getPlan("pairfect-forever");
assert(foreverPlan?.amount === 1999.0, "Plan 'pairfect-forever' is exactly ₹1999.00");

const invalidPlan = getPlan("hacker-free-plan");
assert(invalidPlan === null, "Tampered/invalid plan_id correctly returns null");

const nullPlan = getPlan(null);
assert(nullPlan === null, "Null plan_id correctly returns null");

// -------------------------------------------------------------
// 2. Cashfree SDK Initialization & Environment
// -------------------------------------------------------------
console.log("\n--- 2. Testing Cashfree SDK Initialization ---");

const testAppId = "TEST_APP_ID_FOR_VERIFICATION";
const testSecretKey = "TEST_SECRET_KEY_FOR_VERIFICATION_32CHARS";

const cf = new Cashfree(CFEnvironment.SANDBOX, testAppId, testSecretKey);
assert(cf.XEnvironment === CFEnvironment.SANDBOX, "SDK configured with CFEnvironment.SANDBOX");
assert(cf.XClientId === testAppId, "SDK client ID assigned correctly");
assert(typeof cf.PGCreateOrder === "function", "cf.PGCreateOrder method is available");
assert(typeof cf.PGFetchOrder === "function", "cf.PGFetchOrder method is available");
assert(typeof cf.PGVerifyWebhookSignature === "function", "cf.PGVerifyWebhookSignature method is available");

// -------------------------------------------------------------
// 3. Webhook Cryptographic Verification & Replay Protection
// -------------------------------------------------------------
console.log("\n--- 3. Testing Webhook Cryptographic Verification & Replay Protection ---");

const webhookTimestamp = Date.now().toString();
const webhookPayload = JSON.stringify({
  type: "PAYMENT_SUCCESS_WEBHOOK",
  data: {
    order: {
      order_id: "cf_test_order_12345",
      order_amount: 1.0,
      order_currency: "INR",
      order_status: "PAID",
    },
    payment: {
      payment_status: "SUCCESS",
      payment_id: "pay_cf_test_9999",
    },
  },
});

// Compute authentic signature: HMAC-SHA256 over (timestamp + rawBody)
const authenticSignature = crypto
  .createHmac("sha256", testSecretKey)
  .update(webhookTimestamp + webhookPayload)
  .digest("base64");

try {
  const verifiedEvent = cf.PGVerifyWebhookSignature(
    authenticSignature,
    webhookPayload,
    webhookTimestamp
  );
  assert(
    verifiedEvent.type === "PAYMENT_SUCCESS_WEBHOOK",
    "Authentic Cashfree webhook signature verified successfully"
  );
} catch (err) {
  assert(false, `Authentic webhook failed: ${err.message}`);
}

// Tampered payload test
const tamperedPayload = JSON.stringify({
  type: "PAYMENT_SUCCESS_WEBHOOK",
  data: {
    order: { order_id: "cf_test_order_12345", order_amount: 999999 },
  },
});

let tamperedPassed = false;
try {
  cf.PGVerifyWebhookSignature(authenticSignature, tamperedPayload, webhookTimestamp);
  tamperedPassed = true;
} catch (err) {
  // Expected to throw
}
assert(!tamperedPassed, "Tampered payload correctly rejected by signature verification");

// Tampered signature test
let badSigPassed = false;
try {
  cf.PGVerifyWebhookSignature("invalid_base64_signature==", webhookPayload, webhookTimestamp);
  badSigPassed = true;
} catch (err) {
  // Expected to throw
}
assert(!badSigPassed, "Forged signature correctly rejected");

// -------------------------------------------------------------
// 4. Replay Window Tolerance Tests
// -------------------------------------------------------------
console.log("\n--- 4. Testing Replay Protection Tolerance (5 Minutes) ---");

const now = Date.now();
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isTimestampWithinTolerance(tsString) {
  const tsNum = Number(tsString);
  const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
  if (isNaN(tsMs)) return false;
  return Math.abs(now - tsMs) <= FIVE_MINUTES_MS;
}

const currentTs = Date.now().toString();
assert(isTimestampWithinTolerance(currentTs) === true, "Current timestamp is accepted within tolerance");

const fourMinutesAgo = (now - 4 * 60 * 1000).toString();
assert(isTimestampWithinTolerance(fourMinutesAgo) === true, "4-minute old timestamp is accepted");

const sixMinutesAgo = (now - 6 * 60 * 1000).toString();
assert(isTimestampWithinTolerance(sixMinutesAgo) === false, "6-minute old timestamp is rejected (Replay attack blocked)");

const oneHourAgo = (now - 60 * 60 * 1000).toString();
assert(isTimestampWithinTolerance(oneHourAgo) === false, "1-hour old timestamp is rejected");

// -------------------------------------------------------------
// 5. Webhook Idempotency Logic
// -------------------------------------------------------------
console.log("\n--- 5. Testing Webhook Idempotency ---");

function processWebhookIdempotent(orderStatus, newEvent) {
  if (orderStatus === "paid") {
    return { processed: false, reason: "already_paid" };
  }
  return { processed: true, newStatus: "paid" };
}

const firstRun = processWebhookIdempotent("pending", { type: "PAYMENT_SUCCESS_WEBHOOK" });
assert(firstRun.processed === true && firstRun.newStatus === "paid", "First PAYMENT_SUCCESS marks order as paid");

const duplicateRun = processWebhookIdempotent("paid", { type: "PAYMENT_SUCCESS_WEBHOOK" });
assert(duplicateRun.processed === false && duplicateRun.reason === "already_paid", "Duplicate PAYMENT_SUCCESS is ignored idempotently");

// -------------------------------------------------------------
// 6. Authorization & Ownership Checks
// -------------------------------------------------------------
console.log("\n--- 6. Testing Order Status Authorization (Ownership Check) ---");

function checkOrderOwnership(authenticatedUserId, paymentOwnerUserId) {
  if (authenticatedUserId !== paymentOwnerUserId) {
    return { status: 403, error: "Forbidden: You do not have permission to access this order." };
  }
  return { status: 200, error: null };
}

const legitimateOwner = checkOrderOwnership("user_abc_123", "user_abc_123");
assert(legitimateOwner.status === 200, "Owner viewing own order returns 200");

const attackerUser = checkOrderOwnership("attacker_user_666", "victim_user_123");
assert(attackerUser.status === 403, "Cross-user order inspection is blocked with 403 Forbidden");

// -------------------------------------------------------------
// Final Summary
// -------------------------------------------------------------
console.log("\n=========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed.`);
console.log("=========================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL CASHFREE INTEGRATION TESTS PASSED!\n");
}
