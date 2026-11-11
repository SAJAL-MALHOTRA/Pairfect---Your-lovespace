import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import assert from "node:assert";

const envPath = path.resolve(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim();
    }
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== LIVE PAYMENT GRANT & TRIGGER COMPATIBILITY TEST ===");

  const timestamp = Date.now();
  const emailA = `test.grant.user.${timestamp}@pairfect.internal`;
  const password = "TestPassword123!@#Secure";

  console.log("1. Creating temporary test user and active pair...");
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (userErr) throw userErr;
  const testUser = userData.user;

  await admin.from("users").upsert([{ id: testUser.id, display_name: "GrantTest" }]);

  const { data: pair, error: pairErr } = await admin
    .from("pairs")
    .insert({
      user_a_id: testUser.id,
      invite_code: `GT${Math.floor(1000 + Math.random() * 8999)}`,
      status: "active",
      subscription_tier: "free",
      subscription_status: "inactive",
    })
    .select()
    .single();
  if (pairErr) throw pairErr;

  console.log(`   Pair created: ${pair.id} (Initial Tier: ${pair.subscription_tier})`);

  // Create an initial pending payment row
  const fakeOrderId = `cf_plus-monthly_${timestamp}_test`;
  await admin.from("payments").insert({
    user_id: testUser.id,
    order_id: fakeOrderId,
    amount: 129,
    currency: "INR",
    status: "pending",
    metadata: { plan_id: "plus-monthly" },
  });

  console.log("\n2. Simulating Webhook Atomic Claim and Grant as Service Role...");
  // Step 2a: Atomic conditional update on payments table
  const { data: claimedPayment, error: claimErr } = await admin
    .from("payments")
    .update({
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", fakeOrderId)
    .or("status.neq.paid,status.is.null")
    .select()
    .maybeSingle();

  if (claimErr) throw claimErr;
  assert(claimedPayment !== null, "Payment should be claimed");
  console.log("   Atomic payment claim succeeded (status -> paid).");

  // Step 2b: Service role updates subscription on pairs table (verifies trigger allows service_role)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updatePairErr } = await admin
    .from("pairs")
    .update({
      subscription_tier: "plus",
      subscription_status: "active",
      subscription_expires_at: expiresAt,
      subscription_order_id: fakeOrderId,
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", pair.id);

  if (updatePairErr) {
    throw new Error(`Trigger blocked service role! ${updatePairErr.message}`);
  }

  // Verify pair in database
  const { data: updatedPair } = await admin
    .from("pairs")
    .select("subscription_tier, subscription_status, subscription_order_id, subscription_expires_at")
    .eq("id", pair.id)
    .single();

  console.log("   Updated Pair in Live DB:", updatedPair);
  assert.strictEqual(updatedPair.subscription_tier, "plus", "Tier should be plus");
  assert.strictEqual(updatedPair.subscription_status, "active", "Status should be active");
  assert.strictEqual(updatedPair.subscription_order_id, fakeOrderId, "Order ID should match");
  console.log("   [PASS] Service-role payment grant succeeded with prevent_pair_tampering trigger active!");

  console.log("\n3. Testing Idempotent Concurrent Duplicate Prevention...");
  // Attempting second claim on already paid payment returns null row (blocked)
  const { data: dupClaim } = await admin
    .from("payments")
    .update({ status: "paid" })
    .eq("order_id", fakeOrderId)
    .or("status.neq.paid,status.is.null")
    .select()
    .maybeSingle();

  assert.strictEqual(dupClaim, null, "Concurrent duplicate update should be suppressed (0 rows updated)");
  console.log("   [PASS] Atomic check-and-set suppressed duplicate webhook execution.");

  console.log("\n4. Cleaning up test data...");
  await admin.from("payments").delete().eq("order_id", fakeOrderId);
  await admin.from("pairs").delete().eq("id", pair.id);
  await admin.from("users").delete().eq("id", testUser.id);
  await admin.auth.admin.deleteUser(testUser.id);
  console.log("   Cleanup complete (removed from pairs, users, and auth.users).");

  console.log("\n=== ALL PAYMENT GRANT & TRIGGER COMPATIBILITY TESTS PASSED! ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
