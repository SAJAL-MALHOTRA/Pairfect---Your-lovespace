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
const baseUrl = "http://localhost:3000";

if (!serviceKey || !anonKey) {
  console.error("Missing required Supabase keys in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Crypto Helpers matching e2ee.ts exactly
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
  while (base64.length % 4) {
    base64 += "=";
  }
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
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    codeMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  const rawMasterKey = await globalThis.crypto.subtle.exportKey("raw", vaultKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const encryptedKeyBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
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
  const code = inviteCode.trim().toUpperCase();
  const envelope = JSON.parse(envelopeStr);

  if (!envelope.iv || !envelope.data) {
    throw new Error("Invalid envelope format.");
  }

  const salt = new TextEncoder().encode("pairfect_vault_transport:" + pairId);
  const codeMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const transportKey = await globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    codeMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = new Uint8Array(base64UrlToBuffer(envelope.iv));
  const encryptedBytes = base64UrlToBuffer(envelope.data);

  const decryptedRawBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    transportKey,
    encryptedBytes
  );

  return globalThis.crypto.subtle.importKey(
    "raw",
    decryptedRawBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function runJoinEncryptionRoundtripTest() {
  console.log("==================================================================");
  console.log("  PAIR JOIN ENCRYPTION ROUNDTRIP & AUTO-PURGE VERIFICATION TEST  ");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  let aliceId, bobId, pairId;
  const inviteCode = "TST" + Math.floor(100 + Math.random() * 899);

  try {
    // 1. Provision Alice and Bob
    console.log("1. Provisioning fresh user accounts for Alice and Bob...");
    const { data: userA, error: errA } = await admin.auth.admin.createUser({
      email: `join.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
      user_metadata: { display_name: "Alice" },
    });
    if (errA) throw errA;
    aliceId = userA.user.id;

    const { data: userB, error: errB } = await admin.auth.admin.createUser({
      email: `join.bob.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
      user_metadata: { display_name: "Bob" },
    });
    if (errB) throw errB;
    bobId = userB.user.id;

    await admin.from("users").insert([
      { id: aliceId, email: userA.user.email, display_name: "Alice" },
      { id: bobId, email: userB.user.email, display_name: "Bob" },
    ]);

    // Sign in to get client JWTs
    const clientAlice = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authAlice } = await clientAlice.auth.signInWithPassword({
      email: `join.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    const clientBob = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authBob } = await clientBob.auth.signInWithPassword({
      email: `join.bob.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    console.log(`   [PASS] Alice: ${aliceId}`);
    console.log(`   [PASS] Bob: ${bobId}\n`);

    // 2. Alice creates a pending pair (simulating onboarding Step 3A)
    console.log("2. Alice creates a pending pair with code: " + inviteCode + "...");
    const { data: pair, error: pairErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: aliceId,
        invite_code: inviteCode,
        status: "pending",
        trial_used: false,
      })
      .select()
      .single();
    if (pairErr) throw pairErr;
    pairId = pair.id;

    console.log(`   [PASS] Pending pair created: ${pairId}`);
    console.log(`   [PASS] Initial status: ${pair.status}, tier: ${pair.subscription_tier || "free"}\n`);

    // 3. Alice generates AES-256 master key on client and wraps with invite code
    console.log("3. Alice generates 256-bit AES-GCM vault key and wraps with invite code...");
    const aliceVaultKey = await globalThis.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const aliceRawKey = await globalThis.crypto.subtle.exportKey("raw", aliceVaultKey);
    const aliceKeyHex = Buffer.from(aliceRawKey).toString("hex");

    const wrappedEnvelope = await wrapVaultKeyWithCode(aliceVaultKey, inviteCode, pairId);

    // Alice uploads envelope to /api/vault/envelope as transport type
    const uploadRes = await fetch(`${baseUrl}/api/vault/envelope`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authAlice.session.access_token}`,
      },
      body: JSON.stringify({ pairId, envelope: wrappedEnvelope, type: "transport" }),
    });

    assert.strictEqual(uploadRes.status, 200, "Envelope upload must return 200");
    console.log("   [PASS] Wrapped transport envelope uploaded to server.\n");

    // 4. Verify envelope exists in Supabase Storage
    console.log("4. Verifying transport envelope is present on Supabase Storage prior to join...");
    const { data: preJoinStorageData, error: preJoinErr } = await admin.storage.from("memories").download(
      `${pairId}/transport-envelope.json`,
      { cacheNonce: Date.now() },
      { cache: "no-store" }
    );
    assert(!preJoinErr && preJoinStorageData, "Storage must contain transport-envelope.json before join");
    console.log("   [PASS] Transport envelope exists in storage bucket 'memories'.\n");

    // 5. Bob joins with invite code ONLY (no URL hash fragment #k=...)
    console.log("5. Bob joins via POST /api/auth/join-pair using code ONLY (no #k= fragment)...");
    const joinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authBob.session.access_token}`,
      },
      body: JSON.stringify({ code: inviteCode }),
    });

    const joinData = await joinRes.json();
    assert.strictEqual(joinRes.status, 200, "Join endpoint must return 200");
    assert.strictEqual(joinData.success, true, "Join endpoint must report success: true");
    assert.strictEqual(joinData.pairId, pairId, "Returned pairId must match");
    assert(joinData.vaultEnvelope, "Join endpoint must deliver vaultEnvelope to Bob");
    console.log("   [PASS] Bob received vault envelope in join response.");
    console.log(`   [PASS] Envelope size: ${joinData.vaultEnvelope.length} characters\n`);

    // 6. Verify that server immediately deleted the transport envelope
    console.log("6. Verifying server auto-purged the transport envelope from storage upon delivery...");
    const { data: postJoinStorageData, error: postJoinErr } = await admin.storage.from("memories").download(
      `${pairId}/transport-envelope.json`,
      { cacheNonce: Date.now() },
      { cache: "no-store" }
    );
    assert(
      !postJoinStorageData || postJoinErr,
      "Transport envelope must be purged from Supabase Storage after partner join"
    );
    console.log("   [PASS] Confirmed: Transport envelope purged from storage bucket.\n");

    // 7. Bob unwraps the vault key using the 6-character code
    console.log("7. Bob unwraps vault key using invite code...");
    const bobVaultKey = await unwrapVaultKeyWithCode(joinData.vaultEnvelope, inviteCode, pairId);
    const bobRawKey = await globalThis.crypto.subtle.exportKey("raw", bobVaultKey);
    const bobKeyHex = Buffer.from(bobRawKey).toString("hex");

    assert.strictEqual(bobKeyHex, aliceKeyHex, "Bob's unwrapped key must match Alice's original key bit-for-bit");
    console.log("   [PASS] Key match confirmed! Both partners share the exact same 256-bit master key.\n");

    // 8. Bob encrypts a message with his unwrapped key
    console.log("8. Bob encrypts a private love note using his unwrapped key...");
    const originalSecretMessage = "Secret love note from Bob to Alice in their new private sanctuary!";
    const bobIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: bobIv },
      bobVaultKey,
      new TextEncoder().encode(originalSecretMessage)
    );
    console.log("   [PASS] Message encrypted: " + encryptedBuffer.byteLength + " bytes.\n");

    // 9. Alice decrypts Bob's message using her local key
    console.log("9. Alice decrypts Bob's message using her local key...");
    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bobIv },
      aliceVaultKey,
      encryptedBuffer
    );
    const decryptedMessage = new TextDecoder().decode(decryptedBuffer);

    assert.strictEqual(
      decryptedMessage,
      originalSecretMessage,
      "Alice's decrypted message must match Bob's plaintext exactly"
    );
    console.log("   [PASS] Decryption succeeded! Decrypted text: '" + decryptedMessage + "'\n");

    // 10. Reverse direction: Alice encrypts, Bob decrypts
    console.log("10. Testing reverse encryption: Alice encrypts, Bob decrypts...");
    const aliceAnswer = "Alice's encrypted reply: I love our private space!";
    const aliceIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const aliceEncrypted = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: aliceIv },
      aliceVaultKey,
      new TextEncoder().encode(aliceAnswer)
    );
    const bobDecrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: aliceIv },
      bobVaultKey,
      aliceEncrypted
    );
    assert.strictEqual(new TextDecoder().decode(bobDecrypted), aliceAnswer);
    console.log("   [PASS] Reverse bidirectional decryption verified.\n");

    // 11. Test 7-Day Free Trial Start on newly joined pair
    console.log("11. Bob activates the 7-day free trial via POST /api/trials/start...");
    const trialRes = await fetch(`${baseUrl}/api/trials/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authBob.session.access_token}`,
      },
    });

    const trialData = await trialRes.json();
    assert.strictEqual(trialRes.status, 200, "Trial activation must return 200");
    assert.strictEqual(trialData.success, true, "Trial activation must succeed");

    const { data: updatedPair } = await admin.from("pairs").select("*").eq("id", pairId).single();
    assert.strictEqual(updatedPair.subscription_tier, "plus", "Pair tier must be updated to plus");
    assert.strictEqual(updatedPair.subscription_status, "active", "Pair subscription status must be active");
    assert.strictEqual(updatedPair.trial_used, true, "trial_used must be true");
    console.log("   [PASS] 7-day trial activated under v46 trigger: tier=plus, status=active\n");

    // 12. Verify rate limiting on join endpoint (User & IP)
    console.log("12. Testing join-pair rate limiting (per-user / per-IP)...");
    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${baseUrl}/api/auth/join-pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authBob.session.access_token}`,
        },
        body: JSON.stringify({ code: "FAKE99" }),
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(rateLimited, "Must return HTTP 429 Too Many Requests after threshold");
    console.log("   [PASS] Rate limiting active: blocked brute-force attempts with HTTP 429.\n");

    console.log("==================================================================");
    console.log("  ALL JOIN ENCRYPTION ROUNDTRIP TESTS PASSED (12/12)             ");
    console.log("==================================================================\n");
  } finally {
    // 13. Cleanup
    console.log("13. Cleaning up test accounts and pair data...");
    if (pairId) {
      await admin.from("pair_trial_history").delete().eq("pair_id", pairId);
      await admin.from("pairs").delete().eq("id", pairId);
      await admin.storage.from("memories").remove([
        `${pairId}/transport-envelope.json`,
        `${pairId}/recovery-envelope.json`,
        `${pairId}/vault-envelope.json`,
      ]);
    }
    if (aliceId) {
      await admin.from("users").delete().eq("id", aliceId);
      await admin.auth.admin.deleteUser(aliceId);
    }
    if (bobId) {
      await admin.from("users").delete().eq("id", bobId);
      await admin.auth.admin.deleteUser(bobId);
    }
    console.log("    Cleanup complete. Zero orphans remaining.\n");
  }
}

runJoinEncryptionRoundtripTest().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
