/**
 * End-to-end HTTP test against the live Next.js development server
 */

import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local manually
try {
  const envContent = fs.readFileSync(join(__dirname, "../.env.local"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch (e) {
  console.warn("Could not read .env.local:", e.message);
}

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const BASE_URL = "http://localhost:3000";

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

async function runHttpTests() {
  console.log("=== RUNNING LIVE HTTP ROUTE INTEGRATION TESTS ===");

  // Test 1: POST /api/create-order (Valid 100 paise)
  console.log("\n1. Testing POST /api/create-order with 100 paise...");
  const res1 = await fetch(`${BASE_URL}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "INR", receipt: "rcpt_live_test" }),
  });
  const data1 = await res1.json();
  assert(res1.status === 200, `Returns 200 OK (got ${res1.status})`);
  assert(Boolean(data1.order_id && data1.order_id.startsWith("order_")), `Returns valid order_id: ${data1.order_id}`);
  assert(data1.amount === 100, `Amount is 100 paise (got ${data1.amount})`);
  assert(data1.currency === "INR", `Currency is INR (got ${data1.currency})`);

  const createdOrderId = data1.order_id;

  // Test 2: POST /api/create-order with < 100 paise
  console.log("\n2. Testing POST /api/create-order with invalid amount (50 paise)...");
  const res2 = await fetch(`${BASE_URL}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 50 }),
  });
  const data2 = await res2.json();
  assert(res2.status === 400, `Rejects < 100 paise with HTTP 400 (got ${res2.status})`);
  assert(Boolean(data2.error), `Returns descriptive error message: "${data2.error}"`);

  // Test 3: POST /api/create-order with non-numeric amount
  console.log("\n3. Testing POST /api/create-order with string amount...");
  const res3 = await fetch(`${BASE_URL}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: "abc" }),
  });
  assert(res3.status === 400, `Rejects non-numeric amount with HTTP 400 (got ${res3.status})`);

  // Test 4: POST /api/verify-payment with valid signature
  console.log("\n4. Testing POST /api/verify-payment with valid HMAC-SHA256 signature...");
  const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
  const validSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${createdOrderId}|${mockPaymentId}`)
    .digest("hex");

  const res4 = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: validSignature,
    }),
  });
  const data4 = await res4.json();
  assert(res4.status === 200, `Returns 200 OK (got ${res4.status})`);
  assert(data4.verified === true, `verified is true`);
  assert(data4.order_id === createdOrderId, `Echoes back order_id`);
  assert(data4.payment_id === mockPaymentId, `Echoes back payment_id`);

  // Test 5: POST /api/verify-payment with invalid signature
  console.log("\n5. Testing POST /api/verify-payment with fraudulent/tampered signature...");
  const invalidSignature = crypto
    .createHmac("sha256", "tampered_fake_secret")
    .update(`${createdOrderId}|${mockPaymentId}`)
    .digest("hex");

  const res5 = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: invalidSignature,
    }),
  });
  const data5 = await res5.json();
  assert(res5.status === 400, `Rejects tampered signature with HTTP 400 (got ${res5.status})`);
  assert(data5.verified === false, `verified is false`);

  // Test 6: POST /api/verify-payment with missing parameters
  console.log("\n6. Testing POST /api/verify-payment with missing parameters...");
  const res6 = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: createdOrderId,
    }),
  });
  assert(res6.status === 400, `Rejects missing payment_id/signature with HTTP 400 (got ${res6.status})`);

  // Test 7: GET /checkout (Frontend demo page)
  console.log("\n7. Testing GET /checkout page rendering...");
  const res7 = await fetch(`${BASE_URL}/checkout`);
  const html7 = await res7.text();
  assert(res7.status === 200, `Page loads with HTTP 200 (got ${res7.status})`);
  assert(html7.includes("Razorpay Web Checkout") || html7.includes("Secure Payment Integration"), `Page contains Razorpay checkout interface`);

  console.log(`\n=========================================`);
  console.log(`HTTP TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runHttpTests().catch((e) => {
  console.error("HTTP tests threw exception:", e);
  process.exit(1);
});
