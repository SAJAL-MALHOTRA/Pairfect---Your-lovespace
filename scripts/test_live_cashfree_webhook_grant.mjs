import { createCashfreeOrder, getCashfreeClient, getResolvedCashfreeEnv } from "../src/lib/cashfree.ts";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import assert from "node:assert";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim();
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const cashfreeSecret = env.CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runLivePaymentWebhookTest() {
  console.log("================================================================");
  console.log("   CASHFREE GATEWAY & WEBHOOK SUBSCRIPTION UPGRADE TEST         ");
  console.log("================================================================\n");

  const timestamp = Date.now();
  let testUserId = null;
  let testPairId = null;
  let orderId = null;
  let underpayOrderId = null;

  try {
    // ------------------------------------------------------------
    // 1. Provision test user and active free pair
    // ------------------------------------------------------------
    console.log("1. Creating test user and initial free pair...");
    const userEmail = `billing.test.${timestamp}@pairfect.internal`;
    const { data: uData, error: uErr } = await admin.auth.admin.createUser({
      email: userEmail,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
      user_metadata: { display_name: "BillingTester" },
    });
    if (uErr) throw uErr;
    testUserId = uData.user.id;
    await admin.from("users").upsert([{ id: testUserId, display_name: "BillingTester", email: userEmail }]);

    const { data: pairData, error: pairErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: testUserId,
        invite_code: `CF${Math.floor(1000 + Math.random() * 8999)}`,
        status: "active",
        subscription_tier: "free",
        subscription_status: "inactive",
      })
      .select()
      .single();
    if (pairErr) throw pairErr;
    testPairId = pairData.id;

    console.log(`   [PASS] User created: ${testUserId}`);
    console.log(`   [PASS] Active Pair created: ${testPairId} (Initial Tier: ${pairData.subscription_tier})\n`);

    // ------------------------------------------------------------
    // 2. Create real order on Cashfree Gateway for Plus Monthly
    // ------------------------------------------------------------
    console.log("2. Creating live order on Cashfree Gateway for Plus Monthly (₹129)...");
    orderId = `cf_plus-monthly_${timestamp}_${Math.floor(100 + Math.random() * 899)}`;
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      orderAmount: 129.0,
      orderCurrency: "INR",
      customerId: testUserId,
      customerEmail: userEmail,
      customerName: "BillingTester",
      customerPhone: "9876543210",
      returnUrl: `https://www.pairfect.site/payment-status?order_id=${orderId}`,
      notes: {
        plan_id: "plus-monthly",
        user_id: testUserId,
      },
    });

    console.log(`   [PASS] Cashfree Gateway accepted order!`);
    console.log(`   Order ID: ${cashfreeOrder.order_id}`);
    console.log(`   Gateway Order Status: ${cashfreeOrder.order_status}`);
    console.log(`   Payment Session ID: ${cashfreeOrder.payment_session_id.substring(0, 25)}...\n`);

    // Insert pending order in public.payments table
    await admin.from("payments").insert({
      user_id: testUserId,
      order_id: orderId,
      amount: 129.0,
      currency: "INR",
      status: "pending",
      metadata: { plan_id: "plus-monthly", user_id: testUserId },
    });

    // ------------------------------------------------------------
    // 3. Construct Authentic Cashfree Webhook Event
    // ------------------------------------------------------------
    console.log("3. Constructing cryptographic HMAC-SHA256 Cashfree Webhook payload...");
    const webhookEvent = {
      type: "PAYMENT_SUCCESS_WEBHOOK",
      event_time: new Date().toISOString(),
      data: {
        order: {
          order_id: orderId,
          order_amount: 129.0,
          order_currency: "INR",
          order_tags: null,
        },
        payment: {
          cf_payment_id: "cf_pay_" + timestamp,
          payment_status: "SUCCESS",
          payment_amount: 129.0,
          payment_currency: "INR",
          payment_message: "Transaction Successful (Live Gateway Verification)",
          payment_time: new Date().toISOString(),
          bank_reference: "BANK_REF_" + timestamp,
          auth_id: null,
          payment_method: { upi: { channel: null, upi_id: "tester@okaxis" } },
          payment_group: "upi",
        },
        customer_details: {
          customer_name: "BillingTester",
          customer_id: testUserId,
          customer_email: userEmail,
          customer_phone: "9876543210",
        },
      },
    };

    const rawBody = JSON.stringify(webhookEvent);
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();

    // Compute Cashfree authentic HMAC signature
    const signature = crypto
      .createHmac("sha256", cashfreeSecret)
      .update(webhookTimestamp + rawBody)
      .digest("base64");

    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    console.log(`   Timestamp: ${webhookTimestamp}\n`);

    // ------------------------------------------------------------
    // 4. Dispatch Webhook to /api/cashfree/webhook
    // ------------------------------------------------------------
    console.log("4. Dispatching authentic webhook to /api/cashfree/webhook...");
    const webhookRes = await fetch("http://localhost:3000/api/cashfree/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
        "x-webhook-timestamp": webhookTimestamp,
      },
      body: rawBody,
    });

    const webhookJson = await webhookRes.json();
    console.log(`   HTTP Status: ${webhookRes.status}`);
    console.log(`   Response:`, webhookJson);
    assert.strictEqual(webhookRes.status, 200, "Webhook should return HTTP 200");
    assert.strictEqual(webhookJson.success, true, "Webhook response should be success: true");
    console.log("   [PASS] Webhook successfully verified signature and granted entitlement!\n");

    // ------------------------------------------------------------
    // 5. Verify Database State after Webhook Delivery
    // ------------------------------------------------------------
    console.log("5. Verifying database state on pairs and payments...");
    const { data: updatedPayment } = await admin
      .from("payments")
      .select("id, status, metadata, updated_at")
      .eq("order_id", orderId)
      .single();

    console.log("   Updated Payment Row:", updatedPayment);
    assert.strictEqual(updatedPayment.status, "paid", "Payment status must be 'paid'");
    assert.strictEqual(updatedPayment.metadata?.subscription_granted, true, "metadata.subscription_granted must be true");

    const { data: updatedPair } = await admin
      .from("pairs")
      .select("id, subscription_tier, subscription_status, subscription_expires_at, subscription_order_id")
      .eq("id", testPairId)
      .single();

    console.log("   Updated Pair Row:", updatedPair);
    assert.strictEqual(updatedPair.subscription_tier, "plus", "Pair tier must be upgraded to 'plus'");
    assert.strictEqual(updatedPair.subscription_status, "active", "Pair subscription status must be 'active'");
    assert.strictEqual(updatedPair.subscription_order_id, orderId, "Pair subscription order ID must match");
    assert(updatedPair.subscription_expires_at !== null, "Pair subscription must have expiration date");
    console.log("   [PASS] Pair subscription tier successfully upgraded to Plus under service role trigger exemption!\n");

    // ------------------------------------------------------------
    // 6. Test Idempotency: Re-dispatching same webhook
    // ------------------------------------------------------------
    console.log("6. Testing Webhook Idempotency (replay identical payload)...");
    const duplicateRes = await fetch("http://localhost:3000/api/cashfree/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
        "x-webhook-timestamp": webhookTimestamp,
      },
      body: rawBody,
    });

    const duplicateJson = await duplicateRes.json();
    console.log(`   HTTP Status: ${duplicateRes.status}`);
    console.log(`   Duplicate Response:`, duplicateJson);
    assert.strictEqual(duplicateRes.status, 200, "Duplicate webhook must return HTTP 200");
    assert(duplicateJson.message?.includes("already paid"), "Should recognize duplicate without error");
    console.log("   [PASS] Duplicate webhook correctly acknowledged and suppressed without duplicate grants!\n");

    // ------------------------------------------------------------
    // 7. Test Underpayment Tampering Protection (on fresh pending order)
    // ------------------------------------------------------------
    console.log("7. Testing Underpayment Tampering Protection (tampered amount on fresh order)...");
    underpayOrderId = `cf_plus-monthly_${timestamp + 1000}_underpay`;
    await admin.from("payments").insert({
      user_id: testUserId,
      order_id: underpayOrderId,
      amount: 129.0, // Expected amount is ₹129
      currency: "INR",
      status: "pending",
      metadata: { plan_id: "plus-monthly", user_id: testUserId },
    });

    const tamperedEvent = {
      type: "PAYMENT_SUCCESS_WEBHOOK",
      event_time: new Date().toISOString(),
      data: {
        order: {
          order_id: underpayOrderId,
          order_amount: 50.00, // Attacker forged amount to 50
          order_currency: "INR",
        },
        payment: {
          cf_payment_id: "cf_pay_tampered",
          payment_status: "SUCCESS",
          payment_amount: 50.00,
          payment_currency: "INR",
          payment_message: "Tampered Underpayment",
          payment_time: new Date().toISOString(),
        },
        customer_details: {
          customer_name: "BillingTester",
          customer_id: testUserId,
          customer_email: userEmail,
        },
      },
    };
    const tamperedBody = JSON.stringify(tamperedEvent);
    const tamperedSig = crypto
      .createHmac("sha256", cashfreeSecret)
      .update(webhookTimestamp + tamperedBody)
      .digest("base64");

    const tamperedRes = await fetch("http://localhost:3000/api/cashfree/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": tamperedSig,
        "x-webhook-timestamp": webhookTimestamp,
      },
      body: tamperedBody,
    });

    const tamperedJson = await tamperedRes.json();
    console.log(`   HTTP Status: ${tamperedRes.status}`);
    console.log(`   Tampered Response:`, tamperedJson);
    assert.strictEqual(tamperedRes.status, 400, "Underpayment must be rejected with HTTP 400");
    assert(tamperedJson.error?.includes("less than required"), "Must flag underpayment in response");
    console.log("   [PASS] Underpayment tampering rejected with HTTP 400!\n");

  } catch (err) {
    console.error("FATAL ERROR IN LIVE WEBHOOK TEST:", err);
    throw err;
  } finally {
    // ------------------------------------------------------------
    // 8. Cleanup test data
    // ------------------------------------------------------------
    console.log("8. Cleaning up test accounts from Supabase...");
    try {
      if (orderId) {
        await admin.from("payments").delete().eq("order_id", orderId);
      }
      if (underpayOrderId) {
        await admin.from("payments").delete().eq("order_id", underpayOrderId);
      }
      if (testPairId) {
        await admin.from("pairs").delete().eq("id", testPairId);
      }
      if (testUserId) {
        await admin.from("users").delete().eq("id", testUserId);
        await admin.auth.admin.deleteUser(testUserId);
      }
      console.log("   [PASS] Database cleaned up. Zero test records remain.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr);
    }

    console.log("\n================================================================");
    console.log("         CASHFREE TEST COMPLETE: 100% OPERATIONAL               ");
    console.log("================================================================");
  }
}

runLivePaymentWebhookTest().then(() => process.exit(0)).catch(() => process.exit(1));
