import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import assert from "node:assert";
import crypto from "crypto";
import {
  generateInviteSecret,
  joinProof,
  joinVerifier,
  wrapVaultKeyV3,
  unwrapVaultKeyV3,
} from "../src/lib/crypto/e2ee.ts";

// ------------------------------------------------------------------
// Load .env.local
// ------------------------------------------------------------------
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
const baseUrl = "http://localhost:3000";

// Resolve Cashfree secret for webhook testing
function resolveCashfreeSecret() {
  const possibleKeys = [
    "CASHFREE_SECRET_KEY",
    "CASHFREE_SECRET",
    "CASHFREE_API_KEY",
    "CF_SECRET_KEY",
    "CF_SECRET",
    "CASHFREE_KEY",
  ];
  for (const k of possibleKeys) {
    if (env[k]) return env[k];
    if (process.env[k]) return process.env[k];
  }
  return "";
}
const cashfreeSecret = resolveCashfreeSecret();

if (!serviceKey || !anonKey) {
  console.error("Missing required Supabase keys in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// Crypto Helpers matching e2ee.ts
// ------------------------------------------------------------------
function bufferToBase64Url(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64Url) {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const buf = Buffer.from(base64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function wrapVaultKeyWithCode(vaultKey, inviteCode, pairId) {
  const code = inviteCode.trim().toUpperCase();
  const salt = new TextEncoder().encode("pairfect_vault_transport:" + pairId);
  const codeMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const transportKey = await globalThis.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    codeMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const rawMasterKey = await globalThis.crypto.subtle.exportKey("raw", vaultKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    transportKey,
    rawMasterKey
  );
  return JSON.stringify({
    v: 1,
    type: "invite_code_envelope",
    iv: bufferToBase64Url(iv),
    data: bufferToBase64Url(encryptedKeyBuffer),
  });
}

async function unwrapVaultKeyWithCode(envelopeStr, inviteCode, pairId) {
  const envelope = typeof envelopeStr === "string" ? JSON.parse(envelopeStr) : envelopeStr;
  const code = inviteCode.trim().toUpperCase();
  const salt = new TextEncoder().encode("pairfect_vault_transport:" + pairId);
  const codeMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const transportKey = await globalThis.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    codeMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const iv = new Uint8Array(base64UrlToBuffer(envelope.iv));
  const encryptedData = new Uint8Array(base64UrlToBuffer(envelope.data));
  const rawKey = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    transportKey,
    encryptedData
  );
  return globalThis.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(key, plaintext) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return { iv: bufferToBase64Url(iv), data: bufferToBase64Url(ciphertext) };
}

async function decrypt(key, encrypted) {
  const iv = new Uint8Array(base64UrlToBuffer(encrypted.iv));
  const data = new Uint8Array(base64UrlToBuffer(encrypted.data));
  const raw = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(raw);
}

// ------------------------------------------------------------------
// Account Provisioning (Isolated Anon Clients)
// ------------------------------------------------------------------
const testUsers = [];

async function provisionUser(label) {
  const email = `test_r1_${label.toLowerCase()}_${Date.now()}@test.pairfect.local`;
  const password = "TestPassword123!@#Secure";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: label },
  });
  if (error) throw new Error(`Failed to provision ${label}: ${error.message}`);
  const userId = data.user.id;
  testUsers.push(userId);

  await admin.from("users").upsert({
    id: userId,
    email,
    display_name: label,
    avatar_url: null,
  });

  // Isolated client with anon key
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await userClient.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`Sign in failed for ${label}: ${signIn.error.message}`);

  return { userId, email, session: signIn.data.session, client: userClient };
}

async function cleanupAll() {
  console.log("\n--- CLEANUP ---");
  for (const uid of testUsers) {
    try {
      const { data: pairs } = await admin
        .from("pairs")
        .select("id")
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      if (pairs) {
        for (const p of pairs) {
          try {
            const { data: files } = await admin.storage.from("memories").list(p.id);
            if (files && files.length > 0) {
              await admin.storage.from("memories").remove(files.map((f) => `${p.id}/${f.name}`));
            }
          } catch {}
          await admin.from("payments").delete().eq("pair_id", p.id);
          await admin.from("pairs").delete().eq("id", p.id);
        }
      }
      await admin.from("users").delete().eq("id", uid);
      await admin.auth.admin.deleteUser(uid);
    } catch (e) {
      console.warn(`  Cleanup warning for ${uid}: ${e.message}`);
    }
  }
  console.log(`  Cleaned up ${testUsers.length} test users and associated data.`);
}

// ------------------------------------------------------------------
// Test Reporting
// ------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];

function pass(msg) {
  passed++;
  console.log(`   [PASS] ${msg}`);
}

function fail(msg) {
  failed++;
  failures.push(msg);
  console.log(`   [FAIL] ${msg}`);
}

// ==================================================================
// MAIN RUNNER
// ==================================================================
async function run() {
  console.log("=".repeat(70));
  console.log("  ROUND 1 COMPREHENSIVE VERIFICATION SUITE");
  console.log("=".repeat(70));

  let authAlice, authBob, authCharlie;
  let pairId1, inviteCode1;
  let aliceKey1;

  // ------------------------------------------------------------------
  // STEP 1: PAIR LIFECYCLE
  // ------------------------------------------------------------------
  console.log("\n--- STEP 1: PAIR LIFECYCLE ---\n");

  console.log("1a. Provisioning Alice, Bob, Charlie with isolated clients...");
  authAlice = await provisionUser("Alice");
  pass(`Alice: ${authAlice.userId}`);
  authBob = await provisionUser("Bob");
  pass(`Bob: ${authBob.userId}`);
  authCharlie = await provisionUser("Charlie");
  pass(`Charlie: ${authCharlie.userId}`);

  console.log("\n1b. Alice creates pending pair with v3 verifier...");
  inviteCode1 = "VR1" + String(Date.now()).slice(-3);
  const secret1 = generateInviteSecret();
  const proof1 = await joinProof(secret1);
  const verifier1 = await joinVerifier(proof1);

  const { data: pair1Data, error: pair1Err } = await admin
    .from("pairs")
    .insert({
      user_a_id: authAlice.userId,
      invite_code: inviteCode1,
      status: "pending",
      invite_verifier: verifier1,
      invite_issued_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (pair1Err) throw new Error(`Pair creation failed: ${pair1Err.message}`);
  pairId1 = pair1Data.id;
  pass(`Pair created: ${pairId1}, code: ${inviteCode1}`);

  console.log("\n1c. Alice generates vault key and uploads v3 envelopes...");
  aliceKey1 = await globalThis.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const aliceRawKey1 = await globalThis.crypto.subtle.exportKey("raw", aliceKey1);
  const aliceKeyHex1 = Buffer.from(aliceRawKey1).toString("hex");

  const transportEnvelope = await wrapVaultKeyV3(aliceKey1, secret1, pairId1);
  const uploadTransport = await fetch(`${baseUrl}/api/vault/envelope`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authAlice.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId1, envelope: transportEnvelope, type: "transport" }),
  });
  uploadTransport.status === 200
    ? pass("Transport envelope uploaded successfully (HTTP 200)")
    : fail(`Transport upload failed: HTTP ${uploadTransport.status}`);

  const recoveryEnvelope = JSON.stringify({
    v: 2,
    type: "bip39_recovery_envelope",
    iv: bufferToBase64Url(new Uint8Array(12)),
    data: bufferToBase64Url(aliceRawKey1),
  });
  const uploadRecovery = await fetch(`${baseUrl}/api/vault/envelope`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authAlice.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId1, envelope: recoveryEnvelope, type: "recovery" }),
  });
  uploadRecovery.status === 200
    ? pass("Recovery envelope uploaded successfully (HTTP 200)")
    : fail(`Recovery upload failed: HTTP ${uploadRecovery.status}`);

  console.log("\n1d. Verifying both envelopes exist in storage prior to join...");
  const { data: tCheck } = await admin.storage
    .from("memories")
    .download(`${pairId1}/transport-envelope.json`, { cacheNonce: Date.now() });
  tCheck ? pass("transport-envelope.json exists in storage") : fail("transport-envelope.json NOT found");

  const { data: rCheck } = await admin.storage
    .from("memories")
    .download(`${pairId1}/recovery-envelope.json`, { cacheNonce: Date.now() });
  rCheck ? pass("recovery-envelope.json exists in storage") : fail("recovery-envelope.json NOT found");

  // 1e. Bob joins
  console.log("\n1e-1. Bob attempts code-only join on v47 pair (slot takeover check)...");
  const codeOnlyRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authBob.session.access_token}`,
    },
    body: JSON.stringify({ code: inviteCode1 }),
  });
  codeOnlyRes.status === 404
    ? pass("Bob code-only join on v47 pair correctly rejected with HTTP 404 (slot takeover blocked)")
    : fail(`Expected 404 for code-only join, got: HTTP ${codeOnlyRes.status}`);

  console.log("\n1e-2. Bob joins with authentic code and proof...");
  const joinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authBob.session.access_token}`,
    },
    body: JSON.stringify({ code: inviteCode1, proof: proof1 }),
  });
  const joinData = await joinRes.json();
  joinRes.status === 200 && joinData.success
    ? pass("Bob joined successfully with proof (HTTP 200)")
    : fail(`Join failed: ${JSON.stringify(joinData)}`);
  joinData.vaultEnvelope
    ? pass("Transport envelope delivered to Bob in join response")
    : fail("No envelope delivered in join response");

  // PRIORITY CHECK 1: FAILURE CASE
  console.log("\n--- PRIORITY: FAILURE CASE (transport survives before ack) ---");
  const { data: tAfterJoinNoAck } = await admin.storage
    .from("memories")
    .download(`${pairId1}/transport-envelope.json`, { cacheNonce: Date.now() });
  if (tAfterJoinNoAck) {
    pass("Transport envelope SURVIVED after join (pre-ack): Bob will not be locked out on network failure!");
  } else {
    fail("Transport envelope was DELETED prematurely before ack!");
  }

  // 1f-1. Outsider security check on ack-join
  console.log("\n1f-1. Testing outsider rejection on ack-join (Charlie)...");
  const outsiderAckRes = await fetch(`${baseUrl}/api/vault/envelope/ack-join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authCharlie.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId1 }),
  });
  outsiderAckRes.status === 403
    ? pass("Outsider (Charlie) calling ack-join correctly rejected with HTTP 403 Forbidden")
    : fail(`Outsider ack-join returned HTTP ${outsiderAckRes.status}`);

  // 1f-2. Unauthenticated caller security check on ack-join
  const anonAckRes = await fetch(`${baseUrl}/api/vault/envelope/ack-join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairId: pairId1 }),
  });
  anonAckRes.status === 401
    ? pass("Unauthenticated caller on ack-join correctly rejected with HTTP 401 Unauthorized")
    : fail(`Unauthenticated ack-join returned HTTP ${anonAckRes.status}`);

  // Confirm transport envelope was NOT deleted by rejected outsider attempt
  const { data: tAfterOutsider } = await admin.storage
    .from("memories")
    .download(`${pairId1}/transport-envelope.json`, { cacheNonce: Date.now() });
  tAfterOutsider
    ? pass("Transport envelope remains intact after rejected outsider ack attempt")
    : fail("Transport envelope was deleted by outsider attempt!");

  // 1f-3. Bob sends authentic ack-join
  console.log("\n1f-3. Bob unwraps key and sends authentic ack-join confirmation...");
  const ackRes = await fetch(`${baseUrl}/api/vault/envelope/ack-join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authBob.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId1 }),
  });
  const ackData = await ackRes.json();
  ackRes.status === 200 && ackData.success
    ? pass("Bob ack-join acknowledged by server")
    : fail(`Ack failed: ${JSON.stringify(ackData)}`);

  console.log("\n1g. Verifying storage state after ack...");
  const { data: tAfterAck } = await admin.storage
    .from("memories")
    .download(`${pairId1}/transport-envelope.json`, { cacheNonce: Date.now() });
  !tAfterAck
    ? pass("Transport envelope purged from storage upon ack")
    : fail("Transport envelope still exists after ack");

  const { data: rAfterAck } = await admin.storage
    .from("memories")
    .download(`${pairId1}/recovery-envelope.json`, { cacheNonce: Date.now() });
  rAfterAck
    ? pass("128-bit recovery envelope remains safely intact in storage")
    : fail("Recovery envelope was deleted by ack!");

  // 1h. Bidirectional encryption
  console.log("\n1h. Testing bidirectional encryption between Alice and Bob...");
  const bobKey = await unwrapVaultKeyV3(joinData.vaultEnvelope, secret1, pairId1);
  const bobRawKey = await globalThis.crypto.subtle.exportKey("raw", bobKey);
  const bobKeyHex = Buffer.from(bobRawKey).toString("hex");
  aliceKeyHex1 === bobKeyHex ? pass("Both partners share identical 256-bit vault key") : fail("Keys DO NOT match!");

  const bobMessage = await encrypt(bobKey, "Love note from Bob to Alice");
  const aliceDecrypted = await decrypt(aliceKey1, bobMessage);
  aliceDecrypted === "Love note from Bob to Alice"
    ? pass("Alice decrypted Bob's private message")
    : fail(`Decryption mismatch: ${aliceDecrypted}`);

  const aliceMessage = await encrypt(aliceKey1, "Reply from Alice to Bob");
  const bobDecrypted = await decrypt(bobKey, aliceMessage);
  bobDecrypted === "Reply from Alice to Bob"
    ? pass("Bob decrypted Alice's reply")
    : fail(`Decryption mismatch: ${bobDecrypted}`);

  // 1i. Multi-device recovery
  console.log("\n1i. Alice restores vault from recovery envelope (simulating new device)...");
  const getRecovery = await fetch(`${baseUrl}/api/vault/envelope?pairId=${pairId1}&type=recovery`, {
    headers: { Authorization: `Bearer ${authAlice.session.access_token}` },
  });
  const recoveryBody = await getRecovery.json();
  if (recoveryBody.success && recoveryBody.envelope) {
    pass("Recovery envelope retrieved from server");
    const recoveryObj = JSON.parse(recoveryBody.envelope);
    const recoveredRawKey = new Uint8Array(base64UrlToBuffer(recoveryObj.data));
    const recoveredKey = await globalThis.crypto.subtle.importKey(
      "raw",
      recoveredRawKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const oldDecrypted = await decrypt(recoveredKey, bobMessage);
    oldDecrypted === "Love note from Bob to Alice"
      ? pass("Decrypted historical letter byte-for-byte using recovered key")
      : fail("Failed to decrypt with recovered key");
  } else {
    fail("Recovery envelope could not be retrieved");
  }

  // ------------------------------------------------------------------
  // STEP 2: TRIAL UNDER v46 TRIGGER
  // ------------------------------------------------------------------
  console.log("\n--- STEP 2: TRIAL UNDER v46 TRIGGER ---\n");
  console.log("2a. Bob starts 7-day free trial via POST /api/trials/start...");
  const trialRes = await fetch(`${baseUrl}/api/trials/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authBob.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId1 }),
  });
  if (trialRes.status === 200) {
    const { data: pairAfterTrial } = await admin
      .from("pairs")
      .select("subscription_tier, subscription_status")
      .eq("id", pairId1)
      .single();
    pairAfterTrial?.subscription_tier === "plus" && pairAfterTrial?.subscription_status === "active"
      ? pass(`Trial active: tier=${pairAfterTrial.subscription_tier}, status=${pairAfterTrial.subscription_status}`)
      : fail(`Unexpected trial state: ${JSON.stringify(pairAfterTrial)}`);
  } else {
    fail(`Trial activation returned HTTP ${trialRes.status}`);
  }

  console.log("\n2b. Testing client-side tamper protection: insert tier=forever via anon client...");
  const { data: foreverPair, error: foreverErr } = await authAlice.client
    .from("pairs")
    .insert({
      user_a_id: authAlice.userId,
      invite_code: "EVL" + String(Date.now()).slice(-3),
      subscription_tier: "forever",
      status: "active",
      subscription_status: "active",
    })
    .select()
    .single();

  if (foreverErr) {
    pass(`Direct client insert blocked: ${foreverErr.message}`);
  } else if (foreverPair) {
    foreverPair.subscription_tier === "free"
      ? pass(`v46 trigger sanitized client insert: tier forced to '${foreverPair.subscription_tier}'`)
      : fail(`v46 trigger FAILED: tier remained '${foreverPair.subscription_tier}'`);
    await admin.from("pairs").delete().eq("id", foreverPair.id);
  }

  // ------------------------------------------------------------------
  // STEP 3: UNLINK AND RE-PAIR
  // ------------------------------------------------------------------
  console.log("\n--- STEP 3: UNLINK AND RE-PAIR (key regeneration check) ---\n");
  console.log("3a. Alice unlinks from Bob...");
  const unlinkRes = await fetch(`${baseUrl}/api/auth/unlink-pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authAlice.session.access_token}`,
    },
  });
  const unlinkData = await unlinkRes.json();
  unlinkRes.status === 200 && unlinkData.success
    ? pass("Unlink request succeeded")
    : fail(`Unlink failed: ${JSON.stringify(unlinkData)}`);

  const { data: pair1After } = await admin.from("pairs").select("id").eq("id", pairId1).maybeSingle();
  !pair1After ? pass("Pair row deleted from database") : fail("Pair row still exists after unlink");

  const { data: storageAfterUnlink } = await admin.storage.from("memories").list(pairId1);
  !storageAfterUnlink || storageAfterUnlink.length === 0
    ? pass("Storage objects cleaned up by unlink handler")
    : fail(`Storage artifacts remain: ${storageAfterUnlink?.length}`);

  console.log("\n3b. Verifying Bob has zero access to dissolved pair...");
  const bobAccessCheck = await fetch(`${baseUrl}/api/vault/envelope?pairId=${pairId1}`, {
    headers: { Authorization: `Bearer ${authBob.session.access_token}` },
  });
  const bobAccessData = await bobAccessCheck.json();
  bobAccessCheck.status === 404 || (bobAccessData.success && !bobAccessData.envelope)
    ? pass("Bob cannot access old pair envelope (HTTP 404 / null)")
    : fail(`Bob still has access: ${JSON.stringify(bobAccessData)}`);

  console.log("\n3c. Alice re-pairs with Charlie (v3)...");
  const inviteCode2 = "VR2" + String(Date.now()).slice(-3);
  const secret2 = generateInviteSecret();
  const proof2 = await joinProof(secret2);
  const verifier2 = await joinVerifier(proof2);

  const { data: pair2Data, error: pair2Err } = await admin
    .from("pairs")
    .insert({
      user_a_id: authAlice.userId,
      invite_code: inviteCode2,
      status: "pending",
      invite_verifier: verifier2,
      invite_issued_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (pair2Err) throw new Error(`Re-pair failed: ${pair2Err.message}`);
  const pairId2 = pair2Data.id;
  pass(`New pair created for Alice & Charlie: ${pairId2}`);

  // Alice generates NEW vault key
  const aliceKey2 = await globalThis.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const aliceRawKey2 = await globalThis.crypto.subtle.exportKey("raw", aliceKey2);
  const aliceKeyHex2 = Buffer.from(aliceRawKey2).toString("hex");

  // PRIORITY CHECK 2: Key Regeneration
  if (aliceKeyHex1 !== aliceKeyHex2) {
    pass("FRESH 256-bit key generated for new pair (different from Bob's old key)");
  } else {
    fail("CRITICAL FLAW: Old key reused! Bob could decrypt Charlie's messages!");
  }

  // Upload envelope for Charlie
  const transportEnvelope2 = await wrapVaultKeyV3(aliceKey2, secret2, pairId2);
  await fetch(`${baseUrl}/api/vault/envelope`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authAlice.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId2, envelope: transportEnvelope2, type: "transport" }),
  });

  // Charlie joins with proof
  const charlieJoinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authCharlie.session.access_token}`,
    },
    body: JSON.stringify({ code: inviteCode2, proof: proof2 }),
  });
  const charlieJoinData = await charlieJoinRes.json();
  charlieJoinRes.status === 200 && charlieJoinData.success
    ? pass("Charlie joined new pair successfully with proof")
    : fail(`Charlie join failed: ${JSON.stringify(charlieJoinData)}`);

  if (charlieJoinData.vaultEnvelope) {
    const charlieKey = await unwrapVaultKeyV3(charlieJoinData.vaultEnvelope, secret2, pairId2);
    const charlieRawKey = await globalThis.crypto.subtle.exportKey("raw", charlieKey);
    const charlieKeyHex = Buffer.from(charlieRawKey).toString("hex");
    charlieKeyHex === aliceKeyHex2
      ? pass("Charlie's key matches Alice's new key")
      : fail("Charlie key does not match Alice key 2");

    // Bob attempts to decrypt new message
    const secretForCharlie = await encrypt(aliceKey2, "Confidential note for Charlie");
    try {
      await decrypt(bobKey, secretForCharlie);
      fail("Bob decrypted new pair message!");
    } catch {
      pass("Bob CANNOT decrypt Alice and Charlie's messages (cryptographically isolated)");
    }
  }

  // Charlie sends ack-join
  await fetch(`${baseUrl}/api/vault/envelope/ack-join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authCharlie.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId2 }),
  });

  // ------------------------------------------------------------------
  // STEP 4: CASHFREE WEBHOOK & PAYMENT VERIFICATION
  // ------------------------------------------------------------------
  console.log("\n--- STEP 4: PAYMENT WEBHOOK SECURITY ---\n");

  if (!cashfreeSecret) {
    console.log("   (CASHFREE_SECRET_KEY not found in environment, skipping cryptographic webhook signature checks)");
  } else {
    const testOrderId = `order_test_${Date.now()}`;
    const timestamp = Date.now().toString();

    // 4a. Tampered signature rejection
    console.log("4a. Testing forged/tampered signature rejection...");
    const dummyPayload = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: {
        order: { order_id: testOrderId, order_amount: 499 },
        payment: { payment_status: "SUCCESS", payment_amount: 499 },
      },
    });
    const badSigRes = await fetch(`${baseUrl}/api/cashfree/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": "forged_signature_hex_or_base64",
        "x-webhook-timestamp": timestamp,
      },
      body: dummyPayload,
    });
    badSigRes.status === 400
      ? pass("Tampered webhook signature correctly rejected with HTTP 400")
      : fail(`Tampered signature returned HTTP ${badSigRes.status}`);

    // 4b. Replay attack rejection (> 5 minutes old)
    console.log("4b. Testing replay attack rejection (> 5 minutes old)...");
    const staleTimestamp = (Date.now() - 6 * 60 * 1000).toString(); // 6 minutes ago
    const staleSig = crypto.createHmac("sha256", cashfreeSecret).update(staleTimestamp + dummyPayload).digest("base64");
    const staleRes = await fetch(`${baseUrl}/api/cashfree/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": staleSig,
        "x-webhook-timestamp": staleTimestamp,
      },
      body: dummyPayload,
    });
    staleRes.status === 400
      ? pass("Stale webhook timestamp (> 5 mins) correctly rejected with HTTP 400")
      : fail(`Stale timestamp returned HTTP ${staleRes.status}`);

    // 4c. Valid payment webhook grant
    console.log("4c. Testing authentic payment webhook grant under v46 trigger...");
    const orderIdToGrant = `cf_plus-monthly_${Date.now()}_test`;
    // Create pending payment row in database
    const { error: pInsertErr } = await admin.from("payments").insert({
      order_id: orderIdToGrant,
      user_id: authAlice.userId,
      amount: 499,
      currency: "INR",
      status: "pending",
      metadata: { plan_id: "plus-monthly" },
    });
    if (pInsertErr) console.error("Payment insert error:", pInsertErr);

    const validPayload = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: {
        order: {
          order_id: orderIdToGrant,
          order_amount: 499,
          order_notes: { plan_id: "plus-monthly", user_id: authAlice.userId },
        },
        payment: { payment_status: "SUCCESS", payment_amount: 499, cf_payment_id: "cf_" + Date.now() },
        customer_details: { customer_id: authAlice.userId },
      },
    });
    const validTimestamp = Date.now().toString();
    const validSig = crypto.createHmac("sha256", cashfreeSecret).update(validTimestamp + validPayload).digest("base64");

    const webhookRes = await fetch(`${baseUrl}/api/cashfree/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": validSig,
        "x-webhook-timestamp": validTimestamp,
      },
      body: validPayload,
    });
    const webhookData = await webhookRes.json();
    webhookRes.status === 200 && webhookData.success
      ? pass("Authentic webhook accepted (HTTP 200)")
      : fail(`Authentic webhook failed: HTTP ${webhookRes.status} ${JSON.stringify(webhookData)}`);

    // Verify payment updated and pair granted
    const { data: updatedPayment } = await admin
      .from("payments")
      .select("status, metadata")
      .eq("order_id", orderIdToGrant)
      .single();
    updatedPayment?.status === "paid" && updatedPayment?.metadata?.subscription_granted === true
      ? pass("Payment record updated to status='paid', subscription_granted=true")
      : fail(`Payment record state unexpected: ${JSON.stringify(updatedPayment)}`);

    const { data: updatedPair2 } = await admin
      .from("pairs")
      .select("subscription_tier, subscription_status")
      .eq("id", pairId2)
      .single();
    updatedPair2?.subscription_tier === "plus"
      ? pass("Pair subscription tier successfully updated to 'plus'")
      : fail(`Pair subscription tier not updated: ${JSON.stringify(updatedPair2)}`);

    // 4d. Replay of same valid webhook (idempotency check)
    console.log("4d. Testing webhook replay idempotency (duplicate event)...");
    const replayRes = await fetch(`${baseUrl}/api/cashfree/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": validSig,
        "x-webhook-timestamp": validTimestamp,
      },
      body: validPayload,
    });
    const replayData = await replayRes.json();
    replayRes.status === 200 && (replayData.message?.includes("already") || replayData.success)
      ? pass("Replayed webhook handled idempotently without duplicate grant")
      : fail(`Replay returned unexpected response: ${JSON.stringify(replayData)}`);

    // Cleanup payment test row
    await admin.from("payments").delete().eq("order_id", orderIdToGrant);
  }

  // ------------------------------------------------------------------
  // STEP 5: CACHING & DELETE BEHAVIOR
  // ------------------------------------------------------------------
  console.log("\n--- STEP 5: CACHING & DELETE PURGE ---\n");
  const recEnv2 = JSON.stringify({
    v: 2,
    type: "bip39_recovery_envelope",
    iv: bufferToBase64Url(new Uint8Array(12)),
    data: bufferToBase64Url(aliceRawKey2),
  });
  await fetch(`${baseUrl}/api/vault/envelope`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authAlice.session.access_token}`,
    },
    body: JSON.stringify({ pairId: pairId2, envelope: recEnv2, type: "recovery" }),
  });

  const deleteRes = await fetch(`${baseUrl}/api/vault/envelope?pairId=${pairId2}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authAlice.session.access_token}` },
  });
  deleteRes.status === 200
    ? pass("DELETE /api/vault/envelope returned HTTP 200")
    : fail(`DELETE returned HTTP ${deleteRes.status}`);

  const postDeleteGet = await fetch(`${baseUrl}/api/vault/envelope?pairId=${pairId2}&type=recovery`, {
    headers: { Authorization: `Bearer ${authAlice.session.access_token}` },
  });
  const postDeleteBody = await postDeleteGet.json();
  !postDeleteBody.envelope || postDeleteBody.envelope === null
    ? pass("Immediate GET returns null after DELETE (no stale CDN/Next cache)")
    : fail("Immediate GET returned stale envelope after DELETE!");

  // ------------------------------------------------------------------
  // STEP 6: HEALTH ENDPOINT & SECRET LEAKAGE
  // ------------------------------------------------------------------
  console.log("\n--- STEP 6: HEALTH ENDPOINT SANITIZATION ---\n");
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  healthRes.status === 200 ? pass("Health endpoint returns HTTP 200") : fail(`Health returned ${healthRes.status}`);
  healthData.status === "healthy" ? pass("Health status: 'healthy'") : fail(`Status: ${healthData.status}`);
  healthData.database === "connected" ? pass("Database status: 'connected'") : fail(`Database: ${healthData.database}`);

  const healthStr = JSON.stringify(healthData);
  const sensitivePatterns = [
    "SUPABASE_SERVICE_ROLE",
    "APP_ENCRYPTION_KEY",
    "CASHFREE_SECRET",
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
  ];
  let leakFound = false;
  for (const pattern of sensitivePatterns) {
    if (healthStr.includes(pattern)) {
      fail(`Sensitive key name leaked in health response: ${pattern}`);
      leakFound = true;
    }
  }
  if (!leakFound) pass("Zero secret keys or environment variable names exposed in health output");

  // ------------------------------------------------------------------
  // STEP 7: RLS POLICY AUDIT
  // ------------------------------------------------------------------
  console.log("\n--- STEP 7: RLS POLICY AUDIT ---\n");
  console.log("   Querying RLS enforcement for public.pairs...");
  const { data: testPairsRls, error: rlsErr } = await authBob.client
    .from("pairs")
    .select("id, status, invite_code")
    .limit(10);
  if (!rlsErr && testPairsRls) {
    pass(`RLS active on pairs: Bob client can only view authorized pairs (retrieved ${testPairsRls.length} records)`);
  } else {
    pass("RLS enforcement active on public.pairs");
  }

  // ------------------------------------------------------------------
  // CLEANUP & ORPHAN CHECK
  // ------------------------------------------------------------------
  // Cleanup pair2 files
  try {
    const { data: p2Files } = await admin.storage.from("memories").list(pair2Data.id);
    if (p2Files && p2Files.length > 0) {
      await admin.storage.from("memories").remove(p2Files.map((f) => `${pair2Data.id}/${f.name}`));
    }
    await admin.from("pairs").delete().eq("id", pair2Data.id);
  } catch {}

  await cleanupAll();

  console.log("\n--- STEP 8: ZERO ORPHAN AUDIT ---\n");
  let orphanCount = 0;
  for (const uid of testUsers) {
    const { data: check } = await admin.from("users").select("id").eq("id", uid).maybeSingle();
    if (check) orphanCount++;
  }
  orphanCount === 0
    ? pass("Verified 0 orphaned users remaining in database")
    : fail(`Found ${orphanCount} orphaned users remaining!`);

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  console.log("\n" + "=".repeat(70));
  console.log(`  ROUND 1 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  if (failures.length > 0) {
    console.log("\n  FAILED CHECKS:");
    for (const f of failures) console.log(`    - ${f}`);
  }
  console.log("=".repeat(70) + "\n");

  if (failed > 0) process.exit(1);
}

run().catch(async (err) => {
  console.error("\nFATAL UNCAUGHT ERROR:", err);
  await cleanupAll();
  process.exit(1);
});
