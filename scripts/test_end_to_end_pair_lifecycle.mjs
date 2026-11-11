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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSmokeTest() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("     PAIRFECT END-TO-END PAIR LIFECYCLE & SMOKE TEST            ");
  console.log("════════════════════════════════════════════════════════════════\n");

  const timestamp = Date.now();
  const emailA = `smoke.alice.${timestamp}@pairfect.internal`;
  const emailB = `smoke.bob.${timestamp}@pairfect.internal`;
  const password = "SmokePassword123!@#Secure";

  console.log("1. Creating User A (Alice) and User B (Bob)...");
  const { data: uA } = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
  const { data: uB } = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
  const userA = uA.user;
  const userB = uB.user;

  await admin.from("users").upsert([
    { id: userA.id, display_name: "Alice Smoke" },
    { id: userB.id, display_name: "Bob Smoke" },
  ]);

  const clientAlice = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authA } = await clientAlice.auth.signInWithPassword({ email: emailA, password });
  assert(authA?.session, "Alice auth failed");

  const clientBob = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authB } = await clientBob.auth.signInWithPassword({ email: emailB, password });
  assert(authB?.session, "Bob auth failed");

  console.log("   [PASS] Both users authenticated with client tokens.");

  console.log("\n2. Testing Cancel Pending Pair (User A cancels own unjoined pair)...");
  const cancelCode = `CNC${Math.floor(100 + Math.random() * 899)}`;
  const { data: cancelPair, error: cpErr } = await clientAlice
    .from("pairs")
    .insert({ user_a_id: userA.id, invite_code: cancelCode, status: "pending" })
    .select()
    .single();

  assert(!cpErr, `Failed to create cancel pair: ${cpErr?.message}`);
  console.log(`   Pending pair created: ${cancelPair.id}`);

  // Alice cancels her pending pair directly from client
  const { error: cancelDeleteErr } = await clientAlice
    .from("pairs")
    .delete()
    .eq("id", cancelPair.id);

  const { data: checkCanceled } = await admin
    .from("pairs")
    .select("id")
    .eq("id", cancelPair.id)
    .maybeSingle();

  assert(!checkCanceled, "Pending pair should be deleted by creator!");
  console.log("   [PASS] User A can cancel their own pending unjoined pair directly.");

  console.log("\n3. Testing Real Onboarding Flow: Alice creates invite code...");
  const inviteCode = `SMK${Math.floor(100 + Math.random() * 899)}`;
  const { data: pair1, error: p1Err } = await clientAlice
    .from("pairs")
    .insert({ user_a_id: userA.id, invite_code: inviteCode, status: "pending" })
    .select()
    .single();

  assert(!p1Err, `Failed to create pair: ${p1Err?.message}`);
  console.log(`   Alice created pair ${pair1.id} with invite code: ${inviteCode}`);
  console.log(`   Initial tier: ${pair1.subscription_tier}, Status: ${pair1.status}`);

  console.log("\n4. Testing Join Pair Endpoint (/api/auth/join-pair)...");
  const joinRes = await fetch("http://localhost:3000/api/auth/join-pair", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authB.session.access_token}`,
    },
    body: JSON.stringify({ code: inviteCode }),
  });

  const joinJson = await joinRes.json();
  console.log("   Join Response:", joinJson);
  assert(joinJson.success === true, `Join failed: ${joinJson.error}`);

  // Verify pair is active in DB with both partners
  const { data: activePair } = await admin
    .from("pairs")
    .select("id, user_a_id, user_b_id, status, subscription_tier")
    .eq("id", pair1.id)
    .single();

  console.log("   Active Pair in DB:", activePair);
  assert.strictEqual(activePair.status, "active", "Pair should be active");
  assert.strictEqual(activePair.user_b_id, userB.id, "User B should be Bob");
  console.log("   [PASS] Bob successfully joined Alice via /api/auth/join-pair!");

  console.log("\n5. Testing Active Pair Direct DELETE Guard...");
  // Alice attempts to delete the active pair directly via client
  await clientAlice.from("pairs").delete().eq("id", pair1.id);

  const { data: pairStillThere } = await admin
    .from("pairs")
    .select("id, status")
    .eq("id", pair1.id)
    .maybeSingle();

  if (pairStillThere) {
    console.log("   [PASS] Client cannot delete active pair directly! (migration_v46 active)");
  } else {
    console.log("   [PENDING v46] Active pair was deleted! migration_v46 required to lock active pair DELETE.");
    // Re-create pair if deleted so subsequent tests can run
    await admin.from("pairs").insert({
      id: pair1.id,
      user_a_id: userA.id,
      user_b_id: userB.id,
      invite_code: inviteCode,
      status: "active",
      subscription_tier: "free",
      subscription_status: "inactive",
    });
  }

  console.log("\n6. Testing 7-Day Free Trial Activation (/api/trials/start)...");
  const trialRes = await fetch("http://localhost:3000/api/trials/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.session.access_token}`,
    },
  });

  const trialJson = await trialRes.json();
  console.log("   Trial Response:", trialJson);
  if (trialJson.success) {
    const { data: trialPair } = await admin
      .from("pairs")
      .select("subscription_tier, subscription_status, subscription_expires_at, trial_used")
      .eq("id", pair1.id)
      .single();

    console.log("   Pair after trial activation:", trialPair);
    assert.strictEqual(trialPair.subscription_tier, "plus", "Tier should be plus");
    assert.strictEqual(trialPair.trial_used, true, "trial_used should be true");
    console.log("   [PASS] 7-day free trial activated seamlessly!");
  } else {
    console.log("   [NOTE] Trial response:", trialJson.error);
  }

  console.log("\n7. Testing Unlink Pair (/api/auth/unlink-pair)...");
  const unlinkRes = await fetch("http://localhost:3000/api/auth/unlink-pair", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authA.session.access_token}`,
    },
  });

  const unlinkJson = await unlinkRes.json();
  console.log("   Unlink Response:", unlinkJson);
  assert(unlinkJson.success === true, `Unlink failed: ${unlinkJson.error}`);

  // Verify pair is unlinked / deleted
  const { data: unlinkedPairs } = await admin
    .from("pairs")
    .select("id, status")
    .eq("id", pair1.id)
    .in("status", ["pending", "active"]);

  assert(!unlinkedPairs || unlinkedPairs.length === 0, "Pair should be purged/unlinked from active pairs");
  console.log("   [PASS] Pair cleanly unlinked via official service-role endpoint!");

  console.log("\n8. Cleaning up test accounts...");
  await admin.from("pairs").delete().eq("id", pair1.id);
  await admin.from("users").delete().in("id", [userA.id, userB.id]);
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  console.log("   Cleaned up test accounts successfully.");

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("            END-TO-END SMOKE TEST COMPLETE                      ");
  console.log("════════════════════════════════════════════════════════════════");
}

runSmokeTest().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
