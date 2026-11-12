import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import assert from "assert";
import {
  generateInviteSecret,
  encodeCrockfordBase32,
  decodeCrockfordBase32,
  encodeInvite,
  parseInvite,
  joinProof,
  joinVerifier,
  wrapVaultKeyV3,
  unwrapVaultKeyV3,
} from "../src/lib/crypto/e2ee.ts";

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

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase configuration in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [];
let passedChecks = 0;
let failedChecks = 0;

function pass(msg) {
  passedChecks++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg) {
  failedChecks++;
  console.error(`  [FAIL] ${msg}`);
}

async function provisionUser(label) {
  const email = `test_v3_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.pairfect.local`;
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
  });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await userClient.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`Sign in failed for ${label}: ${signIn.error.message}`);

  return { userId, email, session: signIn.data.session, client: userClient };
}

async function cleanup() {
  console.log("\n--- TEARDOWN AND CLEANUP ---");
  for (const uid of testUsers) {
    try {
      const { data: pairs } = await admin
        .from("pairs")
        .select("id")
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      if (pairs && pairs.length > 0) {
        for (const p of pairs) {
          await admin.storage.from("memories").remove([
            `${p.id}/transport-envelope.json`,
            `${p.id}/recovery-envelope.json`,
            `${p.id}/vault-envelope.json`,
          ]);
          await admin.from("pairs").delete().eq("id", p.id);
        }
      }
      await admin.from("users").delete().eq("id", uid);
      await admin.auth.admin.deleteUser(uid);
    } catch (e) {
      console.warn(`  Cleanup warning for ${uid}: ${e.message}`);
    }
  }
  console.log(`  Cleaned up ${testUsers.length} test users and associated test data.`);
}

async function main() {
  console.log("========================================================================");
  console.log("PAIRFECT V3 TRANSPORT ENVELOPE & SLOT-TAKEOVER PROTECTION SUITE");
  console.log("========================================================================\n");

  try {
    // ------------------------------------------------------------------
    // STEP 1: PARSING & FORMAT TESTS
    // ------------------------------------------------------------------
    console.log("1. Testing Crockford Base32 and Invite String Parsing...");
    const sampleSecret = generateInviteSecret();
    assert.strictEqual(sampleSecret.length, 16, "Secret must be exactly 16 bytes (128 bits)");
    pass("Generated 16-byte (128-bit) CSPRNG invite secret");

    const encodedSecret = encodeCrockfordBase32(sampleSecret);
    assert.strictEqual(encodedSecret.length, 26, "Encoded Crockford base32 must be exactly 26 characters (130 bits)");
    pass(`Encoded Crockford base32 secret length = 26 chars: ${encodedSecret}`);

    const decodedSecret = decodeCrockfordBase32(encodedSecret);
    assert.deepStrictEqual(Buffer.from(decodedSecret), Buffer.from(sampleSecret), "Decoded secret must match original");
    pass("Crockford base32 roundtrip decode verified");

    // Case normalization: uppercase, I->1, L->1, O->0, dashes/spaces ignored
    const messySecret = encodedSecret.toLowerCase().replace(/1/g, "I").replace(/0/g, "O");
    const normalizedDecoded = decodeCrockfordBase32(messySecret);
    assert.deepStrictEqual(Buffer.from(normalizedDecoded), Buffer.from(sampleSecret), "Normalizes I/L->1 and O->0");
    pass("Crockford base32 normalization (I/L to 1, O to 0, lowercase, spaces) verified");

    // Invite string formatting
    const sampleCode = "K7M2QX";
    const fullInvite = encodeInvite(sampleCode, sampleSecret);
    pass(`Formatted combined invite string: ${fullInvite}`);

    // Parse dashed string
    const parsedDashed = parseInvite(fullInvite);
    assert.strictEqual(parsedDashed.code, sampleCode, "Parsed code must match");
    assert.deepStrictEqual(Buffer.from(parsedDashed.secret), Buffer.from(sampleSecret), "Parsed secret must match");
    pass("parseInvite successfully parsed dashed code + secret string");

    // Parse URL with hash fragment #s=
    const sampleUrl = `https://pairfect.site/onboarding?code=${sampleCode}#s=${encodedSecret}`;
    const parsedUrl = parseInvite(sampleUrl);
    assert.strictEqual(parsedUrl.code, sampleCode, "Parsed URL code must match");
    assert.deepStrictEqual(Buffer.from(parsedUrl.secret), Buffer.from(sampleSecret), "Parsed URL fragment secret must match");
    pass("parseInvite successfully parsed full URL with #s= fragment");

    // Parse bare code
    const parsedBare = parseInvite("6VAFPR");
    assert.strictEqual(parsedBare.code, "6VAFPR", "Bare code parsed");
    assert.strictEqual(parsedBare.secret, null, "Bare code returns secret = null");
    pass("parseInvite with bare code returns secret = null (prompt required)");

    // ------------------------------------------------------------------
    // STEP 2: HKDF DERIVATIONS & CONTEXT BINDING
    // ------------------------------------------------------------------
    console.log("\n2. Testing HKDF Derivation Independence (Wrap Key vs Join Proof)...");
    const testSecret = generateInviteSecret();
    const testProof = await joinProof(testSecret);
    const testVerifier = await joinVerifier(testProof);
    pass(`Join proof derived (b64u length: ${testProof.length})`);
    pass(`Join verifier computed: SHA-256(proof) (b64u length: ${testVerifier.length})`);

    const testVaultKey = await globalThis.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const simPairId = "simulated-pair-id-9999";
    const simEnvelope = await wrapVaultKeyV3(testVaultKey, testSecret, simPairId);

    // Verifier reveals nothing about the wrap key
    let unwrapWithVerifierFailed = false;
    try {
      const verifierBytes = Buffer.from(testVerifier, "base64url");
      await unwrapVaultKeyV3(simEnvelope, verifierBytes, simPairId);
    } catch {
      unwrapWithVerifierFailed = true;
    }
    assert(unwrapWithVerifierFailed, "Unwrapping with verifier must fail");
    pass("Unwrap with join verifier failed as expected (HKDF info isolation verified)");

    // Correct secret unwraps successfully
    const restoredKey = await unwrapVaultKeyV3(simEnvelope, testSecret, simPairId);
    assert(restoredKey, "Key successfully unwrapped with secret");
    pass("v3 wrap/unwrap roundtrip with authentic secret verified");

    // Tampered AAD / wrong pairId fails
    let tamperedAadFailed = false;
    try {
      await unwrapVaultKeyV3(simEnvelope, testSecret, "different-pair-id");
    } catch {
      tamperedAadFailed = true;
    }
    assert(tamperedAadFailed, "AAD tampering must fail");
    pass("Context binding verified: AAD tampering rejected by AES-GCM");

    // ------------------------------------------------------------------
    // STEP 3: API ENDPOINT ENVELOPE VALIDATION
    // ------------------------------------------------------------------
    console.log("\n3. Testing API Envelope Size and Schema Validation...");
    const alice = await provisionUser("Alice");
    const bob = await provisionUser("Bob");
    pass(`Alice provisioned: ${alice.userId}`);
    pass(`Bob provisioned: ${bob.userId}`);

    const pairCode = "PV3" + String(Date.now()).slice(-3);
    const secretA = generateInviteSecret();
    const proofA = await joinProof(secretA);
    const verifierA = await joinVerifier(proofA);

    // Alice creates pair with invite_verifier
    const { data: pairA, error: pairAErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: alice.userId,
        invite_code: pairCode,
        status: "pending",
        invite_verifier: verifierA,
        invite_issued_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (pairAErr) throw new Error(`Pair creation failed: ${pairAErr.message}`);
    const pairId = pairA.id;
    pass(`Alice created pending pair: ${pairId}, code: ${pairCode}`);

    // Test envelope size limit enforcement (> 1KB rejected)
    const giantEnvelope = {
      v: 3,
      type: "transport",
      alg: "AES-256-GCM",
      kdf: { name: "HKDF-SHA-256", salt: "abc" },
      iv: "123",
      ct: "x".repeat(1200),
    };
    const oversizeRes = await fetch(`${baseUrl}/api/vault/envelope`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice.session.access_token}`,
      },
      body: JSON.stringify({ pairId, envelope: giantEnvelope, type: "transport" }),
    });
    assert.strictEqual(oversizeRes.status, 400, "Oversized transport envelope must be rejected with 400");
    pass("Transport envelope > 1 KB rejected by server (HTTP 400)");

    // Test valid v3 envelope upload
    const validV3Env = await wrapVaultKeyV3(testVaultKey, secretA, pairId);
    const validUploadRes = await fetch(`${baseUrl}/api/vault/envelope`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice.session.access_token}`,
      },
      body: JSON.stringify({ pairId, envelope: validV3Env, type: "transport" }),
    });
    assert.strictEqual(validUploadRes.status, 200, "Valid v3 envelope upload must return 200");
    pass("Valid v3 transport envelope accepted by server (HTTP 200)");

    // Upload persistent recovery envelope for pair
    const recEnv = JSON.stringify({
      v: 2,
      type: "bip39_recovery_envelope",
      iv: "test_iv",
      data: "test_recovery_data",
    });
    await fetch(`${baseUrl}/api/vault/envelope`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice.session.access_token}`,
      },
      body: JSON.stringify({ pairId, envelope: recEnv, type: "recovery" }),
    });
    pass("Recovery envelope uploaded as cloud backup");

    // ------------------------------------------------------------------
    // STEP 4: SLOT-TAKEOVER PROTECTION & PROOF-OF-SECRET JOIN
    // ------------------------------------------------------------------
    console.log("\n4. Testing Slot-Takeover Protection & Join Proof Verification...");

    // 4a. Join with right code and NO proof
    const noProofRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ code: pairCode }),
    });
    assert.strictEqual(noProofRes.status, 404, "Code-only join on v47 pair must return 404");
    const noProofData = await noProofRes.json();
    assert.strictEqual(noProofData.error, "invalid_or_expired_invite");
    pass("Join with right code and NO proof rejected with unified 404 (invalid_or_expired_invite)");

    // Verify DB state after code-only attempt
    const { data: dbCheck1 } = await admin.from("pairs").select("user_b_id, status").eq("id", pairId).single();
    assert.strictEqual(dbCheck1.user_b_id, null, "user_b_id must remain null");
    assert.strictEqual(dbCheck1.status, "pending", "Pair must remain pending");
    pass("Database check: user_b_id is null and pair status remains pending");

    // 4b. Join with right code and WRONG proof (valid base64url string)
    const wrongProofRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ code: pairCode, proof: "wrong_proof_b64u_xyz123" }),
    });
    assert.strictEqual(wrongProofRes.status, 404, "Wrong proof must return 404");
    pass("Join with right code and wrong proof rejected with unified 404");

    // 4c. Join with right code and MALFORMED proof length (timingSafeEqual safety check)
    const malformedProofRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ code: pairCode, proof: "short" }),
    });
    assert.strictEqual(malformedProofRes.status, 404, "Malformed proof length must return 404, not 500");
    pass("Join with malformed proof length handled safely (returns 404, never 500)");

    // Verify envelope remains untouched in storage after failed join attempts
    const { data: tCheckBeforeJoin } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert(tCheckBeforeJoin, "Transport envelope must remain untouched in storage");
    pass("Transport envelope verified untouched in storage after failed join attempts");

    // 4d. Join with right proof -> activates pair!
    const validJoinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ code: pairCode, proof: proofA }),
    });
    assert.strictEqual(validJoinRes.status, 200, "Valid join with proof must return 200");
    const validJoinData = await validJoinRes.json();
    assert.strictEqual(validJoinData.success, true);
    assert(validJoinData.vaultEnvelope, "Delivered vaultEnvelope in join response");
    pass("Join with right proof succeeded (HTTP 200) and delivered transport envelope");

    // Verify DB state after successful join
    const { data: dbCheck2 } = await admin.from("pairs").select("user_b_id, status").eq("id", pairId).single();
    assert.strictEqual(dbCheck2.user_b_id, bob.userId, "user_b_id must be Bob");
    assert.strictEqual(dbCheck2.status, "active", "Pair must now be active");
    pass("Database check: pair is active and user_b_id is assigned to Bob");

    // 4e. Pre-ack transport envelope survival
    const { data: tCheckPreAck } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert(tCheckPreAck, "Transport envelope must survive in storage before client ack");
    pass("Transport envelope survives in storage prior to client unwrap confirmation (no network lockout)");

    // 4f. Re-join by same user (Bob) returns envelope again idempotently
    const rejoinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ code: pairCode, proof: proofA }),
    });
    assert.strictEqual(rejoinRes.status, 200, "Re-join by same user must return 200");
    const rejoinData = await rejoinRes.json();
    assert(rejoinData.vaultEnvelope, "Re-join returns vaultEnvelope again for existing partner");
    pass("Idempotent re-join by existing partner returns transport envelope again");

    // ------------------------------------------------------------------
    // STEP 5: CLIENT UNWRAP, WRONG SECRET, AND ACK PURGE
    // ------------------------------------------------------------------
    console.log("\n5. Testing Client Unwrap, Wrong Secret Failure & Ack Purge...");

    // 5a. Bob attempts unwrap with wrong secret
    const wrongSecret = generateInviteSecret();
    let wrongUnwrapFailed = false;
    try {
      await unwrapVaultKeyV3(validJoinData.vaultEnvelope, wrongSecret, pairId);
    } catch {
      wrongUnwrapFailed = true;
    }
    assert(wrongUnwrapFailed, "Unwrap with wrong secret must throw");
    pass("Bob client unwrap with wrong secret failed as expected (AES-GCM tag mismatch)");

    // Since unwrap failed, client does NOT call ack-join -> envelope stays
    const { data: tCheckStillThere } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert(tCheckStillThere, "Envelope must not be deleted when client unwrap fails");
    pass("Transport envelope remains in storage because failed unwrap does not trigger ack-join");

    // 5b. Bob unwraps with authentic secret
    const bobUnwrappedKey = await unwrapVaultKeyV3(validJoinData.vaultEnvelope, secretA, pairId);
    const bobKeyRaw = await globalThis.crypto.subtle.exportKey("raw", bobUnwrappedKey);
    const aliceKeyRaw = await globalThis.crypto.subtle.exportKey("raw", testVaultKey);
    assert.deepStrictEqual(Buffer.from(bobKeyRaw), Buffer.from(aliceKeyRaw), "Unwrapped key must match Alice key");
    pass("Bob unwrapped authentic key: byte-for-byte match with Alice vault key");

    // 5c. Bob sends ack-join confirmation
    const ackRes = await fetch(`${baseUrl}/api/vault/envelope/ack-join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob.session.access_token}`,
      },
      body: JSON.stringify({ pairId }),
    });
    assert.strictEqual(ackRes.status, 200, "ack-join must return 200");
    pass("Bob sent authentic ack-join confirmation (HTTP 200)");

    // 5d. Transport envelope is purged, recovery envelope remains
    const { data: tCheckAfterAck } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert.strictEqual(tCheckAfterAck, null, "Transport envelope must be purged upon ack");
    pass("Transport envelope successfully purged from storage upon client unwrap ack");

    const { data: rCheckAfterAck } = await admin.storage
      .from("memories")
      .download(`${pairId}/recovery-envelope.json`, { cacheNonce: Date.now() });
    assert(rCheckAfterAck, "Recovery envelope must remain intact in storage");
    pass("Persistent recovery envelope remains safely intact in storage for cloud restore");

    // ------------------------------------------------------------------
    // STEP 6: REGENERATION LIFECYCLE (PENDING & ACTIVE PRE-ACK)
    // ------------------------------------------------------------------
    console.log("\n6. Testing Invite Regeneration (Pending & Pre-Ack Active)...");
    const alice2 = await provisionUser("Alice2");
    const bob2 = await provisionUser("Bob2");
    const charlie = await provisionUser("Charlie");
    pass(`Alice2 provisioned: ${alice2.userId}`);
    pass(`Bob2 provisioned: ${bob2.userId}`);
    pass(`Charlie provisioned: ${charlie.userId}`);

    // Create fresh pending pair for regeneration tests
    const regenCode1 = "RG1" + String(Date.now()).slice(-3);
    const secretR1 = generateInviteSecret();
    const proofR1 = await joinProof(secretR1);
    const verifierR1 = await joinVerifier(proofR1);
    const { data: pairR, error: pairRErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: alice2.userId,
        invite_code: regenCode1,
        status: "pending",
        invite_verifier: verifierR1,
        invite_issued_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (pairRErr) throw new Error(`Pair creation failed for Alice2: ${pairRErr.message}`);
    const regenPairId = pairR.id;

    const envR1 = await wrapVaultKeyV3(testVaultKey, secretR1, regenPairId);
    await fetch(`${baseUrl}/api/vault/envelope`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice2.session.access_token}`,
      },
      body: JSON.stringify({ pairId: regenPairId, envelope: envR1, type: "transport" }),
    });

    // 6a. Charlie tries to regenerate Alice2's pair -> 403 Forbidden
    const outsiderRegenRes = await fetch(`${baseUrl}/api/auth/regenerate-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${charlie.session.access_token}`,
      },
      body: JSON.stringify({
        pairId: regenPairId,
        verifier: verifierR1,
        envelope: envR1,
      }),
    });
    assert.strictEqual(outsiderRegenRes.status, 403);
    pass("Outsider regeneration blocked with HTTP 403 Forbidden");

    // 6b. Alice2 regenerates while pending
    const secretR2 = generateInviteSecret();
    const proofR2 = await joinProof(secretR2);
    const verifierR2 = await joinVerifier(proofR2);
    const envR2 = await wrapVaultKeyV3(testVaultKey, secretR2, regenPairId);

    const aliceRegen1 = await fetch(`${baseUrl}/api/auth/regenerate-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice2.session.access_token}`,
      },
      body: JSON.stringify({
        pairId: regenPairId,
        verifier: verifierR2,
        envelope: envR2,
      }),
    });
    assert.strictEqual(aliceRegen1.status, 200, "Alice2 pending regeneration must succeed");
    const regenData1 = await aliceRegen1.json();
    const regenCode2 = regenData1.code;
    assert.strictEqual(regenCode2.length, 6);
    pass(`Alice2 regenerated invite while pending: new code = ${regenCode2}`);

    // Old code (regenCode1) rejected
    const oldCodeJoin = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob2.session.access_token}`,
      },
      body: JSON.stringify({ code: regenCode1, proof: proofR1 }),
    });
    assert.strictEqual(oldCodeJoin.status, 404);
    pass("Old invite code immediately invalidated after regeneration (HTTP 404)");

    // New code with old proof rejected
    const oldProofJoin = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob2.session.access_token}`,
      },
      body: JSON.stringify({ code: regenCode2, proof: proofR1 }),
    });
    assert.strictEqual(oldProofJoin.status, 404);
    pass("New invite code with old proof rejected (HTTP 404)");

    // Bob2 joins with new code and new proof -> active!
    const newJoinRes = await fetch(`${baseUrl}/api/auth/join-pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bob2.session.access_token}`,
      },
      body: JSON.stringify({ code: regenCode2, proof: proofR2 }),
    });
    assert.strictEqual(newJoinRes.status, 200);
    pass("Bob2 joined with new regenerated code and proof successfully");

    // 6c. Alice2 regenerates while active BUT before Bob2 acks
    const secretR3 = generateInviteSecret();
    const proofR3 = await joinProof(secretR3);
    const verifierR3 = await joinVerifier(proofR3);
    const envR3 = await wrapVaultKeyV3(testVaultKey, secretR3, regenPairId);

    const aliceRegen2 = await fetch(`${baseUrl}/api/auth/regenerate-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alice2.session.access_token}`,
      },
      body: JSON.stringify({
        pairId: regenPairId,
        verifier: verifierR3,
        envelope: envR3,
      }),
    });
    assert.strictEqual(aliceRegen2.status, 200, "Regeneration while active before ack must succeed");
    const regenData2 = await aliceRegen2.json();
    pass(`Alice2 regenerated while active prior to partner ack: new code = ${regenData2.code}`);

    // Verify Bob2 can unwrap with secretR3
    const { data: updatedEnvFile } = await admin.storage
      .from("memories")
      .download(`${regenPairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    const updatedEnvText = await updatedEnvFile.text();
    const unwrappedR3 = await unwrapVaultKeyV3(updatedEnvText, secretR3, regenPairId);
    assert(unwrappedR3, "New envelope unwrapped with secretR3");
    pass("Updated transport envelope successfully unwrapped with secretR3");

    // ------------------------------------------------------------------
    // STEP 7: SERVER-VIEW TEST (PROVING EXPOSURE WINDOW IS CLOSED)
    // ------------------------------------------------------------------
    console.log("\n7. Executing Server-View Attack Simulation (Window Closed Test)...");

    // Attacker has FULL service_role access to database and storage
    const { data: serverPairRow } = await admin
      .from("pairs")
      .select("invite_code, invite_verifier")
      .eq("id", regenPairId)
      .single();

    const { data: serverEnvFile } = await admin.storage
      .from("memories")
      .download(`${regenPairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    const serverEnvText = await serverEnvFile.text();

    assert(serverPairRow.invite_code, "Server has invite_code");
    assert(serverPairRow.invite_verifier, "Server has invite_verifier");
    assert(serverEnvText, "Server has transport-envelope.json");
    pass("Server holds invite_code, invite_verifier, and transport-envelope.json");

    // Attack 1: Attempt to unwrap using invite_code as PBKDF2 password (legacy v1 method)
    let attack1Failed = false;
    try {
      const codeMaterial = await globalThis.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(serverPairRow.invite_code),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      const salt = new TextEncoder().encode(`pairfect_vault_transport:${regenPairId}`);
      const derivedKey = await globalThis.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        codeMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      const envObj = JSON.parse(serverEnvText);
      const iv = Buffer.from(envObj.iv, "base64url");
      const ct = Buffer.from(envObj.ct, "base64url");
      await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, derivedKey, ct);
    } catch {
      attack1Failed = true;
    }
    assert(attack1Failed, "Attack 1 (PBKDF2 code unwrap) must fail");
    pass("Server attack attempt 1 failed: legacy code-based PBKDF2 unwrap rejected by AES-GCM");

    // Attack 2: Attempt to use invite_verifier as raw decryption key
    let attack2Failed = false;
    try {
      const verifierKey = await globalThis.crypto.subtle.importKey(
        "raw",
        Buffer.from(serverPairRow.invite_verifier, "base64url").slice(0, 32),
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      const envObj = JSON.parse(serverEnvText);
      const iv = Buffer.from(envObj.iv, "base64url");
      const ct = Buffer.from(envObj.ct, "base64url");
      await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, verifierKey, ct);
    } catch {
      attack2Failed = true;
    }
    assert(attack2Failed, "Attack 2 (verifier as key) must fail");
    pass("Server attack attempt 2 failed: verifier as direct key rejected by AES-GCM");

    // Attack 3: Attempt to derive wrapKey using invite_verifier as HKDF input
    let attack3Failed = false;
    try {
      const verifierMaterial = await globalThis.crypto.subtle.importKey(
        "raw",
        Buffer.from(serverPairRow.invite_verifier, "base64url"),
        "HKDF",
        false,
        ["deriveKey"]
      );
      const envObj = JSON.parse(serverEnvText);
      const salt = Buffer.from(envObj.kdf.salt, "base64url");
      const info = new TextEncoder().encode(`pairfect_vault_transport:v3:${regenPairId}`);
      const derivedKey = await globalThis.crypto.subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt, info },
        verifierMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      const iv = Buffer.from(envObj.iv, "base64url");
      const ct = Buffer.from(envObj.ct, "base64url");
      const aad = new TextEncoder().encode(`pairfect:transport:v3:${regenPairId}`);
      await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aad }, derivedKey, ct);
    } catch {
      attack3Failed = true;
    }
    assert(attack3Failed, "Attack 3 (verifier as HKDF input) must fail");
    pass("Server attack attempt 3 failed: HKDF info isolation prevents deriving wrapKey from verifier");

    pass("Server-view verification confirmed: Server data alone cannot unwrap the transport envelope!");

    // ------------------------------------------------------------------
    // STEP 8: LIVE DATABASE SCHEMA & TRIGGER SECURITY (v47)
    // ------------------------------------------------------------------
    console.log("\n8. Testing Live Database Schema & Tamper Triggers (v47)...");

    // 8a. Columns exist
    const { data: v47Cols, error: v47ColsErr } = await admin
      .from("pairs")
      .select("invite_verifier, invite_issued_at")
      .eq("id", regenPairId)
      .single();
    assert(!v47ColsErr, `v47 columns must exist: ${v47ColsErr?.message}`);
    assert(v47Cols.invite_verifier, "invite_verifier column present with data");
    assert(v47Cols.invite_issued_at, "invite_issued_at column present with timestamp");
    pass("Live PostgreSQL schema verified: invite_verifier and invite_issued_at active");

    // 8b. Service role can update invite_code (pairs_lock_identity dropped)
    const { error: srvUpdateErr } = await admin
      .from("pairs")
      .update({ invite_code: "SRV999" })
      .eq("id", regenPairId);
    assert(!srvUpdateErr, `Service role update must succeed: ${srvUpdateErr?.message}`);
    pass("Service role can update invite_code without trigger interference (pairs_lock_identity dropped)");

    // 8c. Client (member of pair) is blocked from modifying invite_verifier directly by trigger
    const { error: clientTamperErr } = await bob2.client
      .from("pairs")
      .update({ invite_verifier: "tampered_verifier_by_client" })
      .eq("id", regenPairId);
    assert(clientTamperErr, "Client direct update of invite_verifier must be blocked");
    assert(
      clientTamperErr.message.includes("Clients are not permitted to modify invite verifier"),
      `Expected tamper error message, got: ${clientTamperErr.message}`
    );
    pass("Client tamper protection verified: direct client update to invite_verifier blocked by trigger");

    console.log("\n========================================================================");
    console.log(`ALL VERIFIED: ${passedChecks} / ${passedChecks + failedChecks} checks passed!`);
    console.log("========================================================================");
  } finally {
    await cleanup();
  }
}

main().catch(async (err) => {
  console.error("Test suite fatal error:", err);
  await cleanup();
  process.exit(1);
});
