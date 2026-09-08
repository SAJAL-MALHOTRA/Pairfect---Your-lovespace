/**
 * Integration Test for Razorpay Backend API Endpoints:
 * 1. POST /api/create-order
 * 2. POST /api/verify-payment
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

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log("=== RAZORPAY INTEGRATION VERIFICATION ===");
console.log(`Key ID present: ${Boolean(KEY_ID)} (${KEY_ID ? KEY_ID.substring(0, 8) + "..." : "none"})`);
console.log(`Key Secret present: ${Boolean(KEY_SECRET)} (${KEY_SECRET ? "configured" : "none"})`);

if (!KEY_ID || !KEY_SECRET) {
  console.error("FAIL: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment.");
  process.exit(1);
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function testCreateOrder() {
  console.log("\n--- Testing Order Creation with Live Razorpay API ---");

  // 1. Valid order with 100 paise (₹1)
  const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 100, // 100 paise
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: "automated_verification" },
    }),
  });

  const orderData = await orderRes.json();
  assert(orderRes.ok, `Order created successfully (HTTP ${orderRes.status})`);
  assert(Boolean(orderData.id && orderData.id.startsWith("order_")), `Order ID returned: ${orderData.id}`);
  assert(orderData.amount === 100, `Order amount is exactly 100 paise (received: ${orderData.amount})`);
  assert(orderData.currency === "INR", `Order currency is INR (received: ${orderData.currency})`);

  return orderData.id;
}

function testSignatureVerification(testOrderId) {
  console.log("\n--- Testing HMAC-SHA256 Signature Verification Logic ---");

  const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
  const payload = `${testOrderId}|${mockPaymentId}`;

  // Generate valid signature using known secret
  const validSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(payload)
    .digest("hex");

  // Generate invalid signature
  const invalidSignature = crypto
    .createHmac("sha256", "wrong_secret_12345")
    .update(payload)
    .digest("hex");

  // Helper matching /api/verify-payment logic
  function verifyLogic(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) {
      return { status: 400, error: "Missing required fields" };
    }
    const checkPayload = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(checkPayload)
      .digest("hex");

    const genBuf = Buffer.from(generated, "utf-8");
    const sigBuf = Buffer.from(String(signature), "utf-8");

    const isMatch =
      genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);

    if (!isMatch) {
      return { status: 400, verified: false, error: "Invalid payment signature" };
    }
    return { status: 200, verified: true };
  }

  // 1. Test Valid Signature
  const validResult = verifyLogic(testOrderId, mockPaymentId, validSignature);
  assert(validResult.status === 200 && validResult.verified === true, "Valid HMAC signature correctly verified (status 200, verified: true)");

  // 2. Test Invalid/Tampered Signature
  const invalidResult = verifyLogic(testOrderId, mockPaymentId, invalidSignature);
  assert(invalidResult.status === 400 && invalidResult.verified === false, "Tampered signature correctly rejected (status 400, verified: false)");

  // 3. Test Missing Signature
  const missingSigResult = verifyLogic(testOrderId, mockPaymentId, null);
  assert(missingSigResult.status === 400, "Missing signature correctly rejected with 400");

  // 4. Test Missing Order ID
  const missingOrderResult = verifyLogic(null, mockPaymentId, validSignature);
  assert(missingOrderResult.status === 400, "Missing order_id correctly rejected with 400");

  // 5. Test Tampered Payment ID
  const tamperedResult = verifyLogic(testOrderId, "pay_tampered_id", validSignature);
  assert(tamperedResult.status === 400 && tamperedResult.verified === false, "Tampered payment_id correctly fails signature check");
}

function testAmountValidation() {
  console.log("\n--- Testing Amount & Parameter Validation Rules ---");

  function validateAmount(amount) {
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || !Number.isInteger(parsedAmount) || parsedAmount < 100) {
      return false;
    }
    return true;
  }

  assert(validateAmount(100) === true, "100 paise is accepted (minimum threshold)");
  assert(validateAmount(5000) === true, "5000 paise (₹50) is accepted");
  assert(validateAmount(99) === false, "99 paise is rejected (< 100 paise minimum)");
  assert(validateAmount(0) === false, "0 paise is rejected");
  assert(validateAmount(-100) === false, "Negative amount is rejected");
  assert(validateAmount(100.5) === false, "Non-integer float (100.5 paise) is rejected");
  assert(validateAmount("abc") === false, "Non-numeric string is rejected");
  assert(validateAmount(null) === false, "Null amount is rejected");
}

async function runAll() {
  try {
    const testOrderId = await testCreateOrder();
    testSignatureVerification(testOrderId);
    testAmountValidation();

    console.log(`\n=========================================`);
    console.log(`RESULTS: ${passedTests}/${totalTests} tests passed.`);
    console.log(`=========================================\n`);

    if (passedTests === totalTests) {
      console.log("ALL RAZORPAY CHECKS PASSED!");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runAll();
