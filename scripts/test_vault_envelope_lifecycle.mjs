import { createClient } from "@supabase/supabase-js";
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
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== TESTING VAULT ENVELOPE LIFECYCLE & ZERO-KNOWLEDGE PURGE ===\n");

  const timestamp = Date.now();
  let aliceId = null;
  let charlieId = null;
  let pairId = null;

  try {
    // 1. Provision Alice and Charlie
    console.log("1. Creating test users Alice and Charlie...");
    const { data: uA } = await admin.auth.admin.createUser({
      email: `envelope.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
    });
    aliceId = uA.user.id;
    await admin.from("users").upsert([{ id: aliceId, display_name: "AliceEnvelope" }]);

    const { data: uC } = await admin.auth.admin.createUser({
      email: `envelope.charlie.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
    });
    charlieId = uC.user.id;
    await admin.from("users").upsert([{ id: charlieId, display_name: "CharlieEnvelope" }]);

    // Create pair for Alice
    const { data: pair } = await admin
      .from("pairs")
      .insert({
        user_a_id: aliceId,
        invite_code: `ENV${Math.floor(100 + Math.random() * 899)}`,
        status: "active",
      })
      .select()
      .single();
    pairId = pair.id;

    // Sign in Alice and Charlie to obtain client JWTs
    const clientAlice = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authAlice } = await clientAlice.auth.signInWithPassword({
      email: `envelope.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    const clientCharlie = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authCharlie } = await clientCharlie.auth.signInWithPassword({
      email: `envelope.charlie.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    console.log("   [PASS] Users and pair provisioned.\n");

    // 2. Alice uploads vault envelope via POST /api/vault/envelope
    console.log("2. Alice uploading vault envelope (POST /api/vault/envelope)...");
    const testEnvelope = JSON.stringify({ v: 2, test: true, data: "encrypted_key_material" });
    const postRes = await fetch("http://localhost:3000/api/vault/envelope", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authAlice.session.access_token}`,
      },
      body: JSON.stringify({ pairId, envelope: testEnvelope }),
    });
    const postJson = await postRes.json();
    assert.strictEqual(postRes.status, 200, "POST must return 200");
    assert.strictEqual(postJson.success, true);
    console.log("   [PASS] Envelope uploaded successfully.\n");

    // 3. Alice downloads vault envelope via GET /api/vault/envelope
    console.log("3. Alice fetching vault envelope (GET /api/vault/envelope)...");
    const getRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authAlice.session.access_token}`,
      },
    });
    const getJson = await getRes.json();
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getJson.success, true);
    assert(getJson.envelope !== null, "Envelope must exist");
    console.log("   [PASS] Envelope fetched cleanly.\n");

    // 4. Charlie attempts unauthorized DELETE (Cross-Pair Attack)
    console.log("4. Testing Cross-Pair DELETE protection (Charlie attempts to delete Alice's envelope)...");
    const attackRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authCharlie.session.access_token}`,
      },
    });
    console.log(`   Attack Response Status: ${attackRes.status}`);
    assert.strictEqual(attackRes.status, 403, "Outside user must be rejected with HTTP 403");
    console.log("   [PASS] Unauthorized DELETE blocked with HTTP 403!\n");

    // 5. Alice purges envelope for True Zero-Knowledge mode via DELETE /api/vault/envelope
    console.log("5. Alice purging server envelope (DELETE /api/vault/envelope)...");
    const deleteRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authAlice.session.access_token}`,
      },
    });
    const deleteJson = await deleteRes.json();
    console.log("   DELETE response body:", JSON.stringify(deleteJson));
    assert.strictEqual(deleteRes.status, 200, "DELETE must return 200");
    assert.strictEqual(deleteJson.success, true);
    console.log("   [PASS] Server envelope purged successfully.\n");

    // 6. Verify envelope is now null on server
    console.log("6. Verifying envelope is purged from storage...");
    const verifyRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${authAlice.session.access_token}`,
        "Cache-Control": "no-cache",
      },
    });
    const verifyJson = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyJson.envelope, null, "Purged envelope must return null");
    console.log("   [PASS] Confirmed envelope is null. Storage zero-knowledge active!\n");

  } catch (err) {
    console.error("TEST FAILED:", err);
    throw err;
  } finally {
    console.log("7. Cleaning up test accounts from Supabase...");
    try {
      if (pairId) {
        await admin.storage.from("memories").remove([`${pairId}/vault-envelope.json`]);
        await admin.from("pairs").delete().eq("id", pairId);
      }
      if (aliceId) {
        await admin.from("users").delete().eq("id", aliceId);
        await admin.auth.admin.deleteUser(aliceId);
      }
      if (charlieId) {
        await admin.from("users").delete().eq("id", charlieId);
        await admin.auth.admin.deleteUser(charlieId);
      }
      console.log("   [PASS] Cleanup complete. Zero test accounts remain.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr);
    }
  }

  console.log("\n================================================================");
  console.log("  VAULT ENVELOPE & ZERO-KNOWLEDGE PURGE: 100% OPERATIONAL       ");
  console.log("================================================================");
}

main().catch(err => {
  process.exit(1);
});
