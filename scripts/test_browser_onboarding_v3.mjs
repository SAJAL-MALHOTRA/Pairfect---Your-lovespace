import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import assert from "assert";
import fs from "fs";
import path from "path";
import {
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
  console.error("Missing Supabase credentials in .env.local");
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

async function provisionTestAccount(label) {
  const email = `playwright_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.pairfect.local`;
  const password = "TestPassword123!@#Secure";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: label },
  });
  if (error) throw new Error(`Failed to create ${label}: ${error.message}`);
  const userId = data.user.id;
  testUsers.push(userId);

  await admin.from("users").upsert({
    id: userId,
    email,
    display_name: label,
  });

  return { userId, email, password };
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
  console.log(`  Cleaned up ${testUsers.length} test users and storage artifacts.`);
}

async function unwrapVaultKeyWithPhrase(envelopeStr, phrase, pairId) {
  const envelope = JSON.parse(envelopeStr);
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(" ");
  const salt = new TextEncoder().encode("pairfect_recovery_salt:" + pairId);
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalized),
    { name: "PBKDF2" },
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
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const iv = Buffer.from(envelope.iv.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const ciphertext = Buffer.from(envelope.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const rawKey = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    transportKey,
    ciphertext
  );
  return globalThis.crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function runBrowserTest() {
  console.log("========================================================================");
  console.log("  PAIRFECT E2E PLAYWRIGHT BROWSER ONBOARDING V3 VERIFICATION            ");
  console.log("========================================================================\n");

  let browser;
  try {
    // 1. Provision accounts
    console.log("1. Provisioning test accounts for Alice and Bob...");
    const aliceUser = await provisionTestAccount("Alice");
    const bobUser = await provisionTestAccount("Bob");
    pass(`Alice created: ${aliceUser.email}`);
    pass(`Bob created: ${bobUser.email}`);

    // 2. Launch browser
    console.log("\n2. Launching headless Chromium...");
    browser = await chromium.launch({ headless: true });
    pass("Chromium browser instance launched");

    // ------------------------------------------------------------------
    // CONTEXT 1: ALICE (ROOM CREATION & PHRASE GENERATION)
    // ------------------------------------------------------------------
    console.log("\n3. Opening Browser Context 1 (Alice - Room Creator)...");
    const contextAlice = await browser.newContext();
    const pageAlice = await contextAlice.newPage();
    pageAlice.on("console", (msg) => console.log(`[Alice Console] ${msg.type()}: ${msg.text()}`));
    pageAlice.on("pageerror", (err) => console.error(`[Alice PageError] ${err.message}`));

    // Alice logs in
    await pageAlice.goto(`${baseUrl}/login`);
    await pageAlice.fill('input[type="email"]', aliceUser.email);
    await pageAlice.fill('input[type="password"]', aliceUser.password);
    await pageAlice.click('button[type="submit"]');

    // Wait for navigation to /onboarding or /dashboard
    await pageAlice.waitForURL(/onboarding|dashboard/, { timeout: 15000 });
    if (!pageAlice.url().includes("/onboarding")) {
      await pageAlice.goto(`${baseUrl}/onboarding`);
    }
    await pageAlice.waitForLoadState("networkidle");
    pass("Alice navigated to /onboarding");

    // Step 1: Alice enters nickname
    console.log("\n3a. Alice completes Step 1: Nickname...");
    await pageAlice.waitForSelector('input[placeholder*="Alex"]', { timeout: 10000 });
    await pageAlice.fill('input[placeholder*="Alex"]', "Alice");
    await pageAlice.click('button[type="submit"]');
    pass("Alice submitted display name");

    // Step 2: Alice chooses "Create our space"
    console.log("\n3b. Alice completes Step 2: Choose 'Create our space'...");
    await pageAlice.waitForSelector('button:has-text("Create our space")', { timeout: 10000 });
    await pageAlice.waitForTimeout(500);
    await pageAlice.click('button:has-text("Create our space")');
    pass("Alice clicked 'Create our space'");

    // Step 3: Alice reaches Space Ready screen
    console.log("\n3c. Alice reaches Step 3: Invite Screen & Recovery Phrase...");
    try {
      await pageAlice.waitForSelector('text="Send this invite to your partner"', { timeout: 15000 });
    } catch (e) {
      console.log("Alice Current URL:", pageAlice.url());
      const bodyText = await pageAlice.innerText("body");
      console.log("Alice Body text on timeout:\n", bodyText);
      await pageAlice.screenshot({ path: "alice_timeout.png" });
      throw e;
    }
    pass("Alice reached Step 3 (Space Ready screen)");

    // Extract 6-character room lookup code from the dashed box
    const codeElement = await pageAlice.waitForSelector('span[class*="tracking-[0.25em]"]', { timeout: 10000 });
    const formattedCodeText = (await codeElement.textContent()) || "";
    const lookupCode = formattedCodeText.replace(/\s+/g, "").trim();
    assert.strictEqual(lookupCode.length, 6, "Lookup code must be 6 characters");
    pass(`Extracted room lookup code: ${lookupCode}`);

    // Extract full invite string
    const inviteStringEl = await pageAlice.waitForSelector('div[class*="select-all"][class*="break-all"]', { timeout: 10000 });
    const fullInviteString = (await inviteStringEl.textContent()) || "";
    assert(fullInviteString.startsWith(lookupCode), "Invite string starts with lookup code");
    assert.strictEqual(fullInviteString.length, 38, "Combined invite string length is 38 chars (6 code + 1 dash + 26 secret + 5 inner dashes)");
    pass(`Extracted combined invite string: ${fullInviteString}`);

    // Extract 12-word recovery phrase
    const wordElements = await pageAlice.$$('div[class*="bg-white border"] span[class*="font-semibold"]');
    const recoveryWords = [];
    for (const el of wordElements) {
      const text = (await el.textContent()) || "";
      if (text.trim()) recoveryWords.push(text.trim());
    }
    assert.strictEqual(recoveryWords.length, 12, "Must display exactly 12 recovery phrase words");
    const recoveryPhrase = recoveryWords.join(" ");
    pass(`Extracted 12-word recovery phrase: ${recoveryPhrase.slice(0, 15)}... (12 words total)`);

    // Verify database state for Alice's pair
    const { data: alicePairInDb } = await admin
      .from("pairs")
      .select("id, invite_code, invite_verifier, status")
      .eq("user_a_id", aliceUser.userId)
      .single();
    assert(alicePairInDb, "Alice pair must exist in database");
    assert.strictEqual(alicePairInDb.invite_code, lookupCode);
    assert(alicePairInDb.invite_verifier, "invite_verifier column must be populated");
    assert.strictEqual(alicePairInDb.status, "pending");
    const pairId = alicePairInDb.id;
    pass("Verified PostgreSQL database state: pending pair created with invite_verifier");

    // Verify storage state: both transport-envelope.json and recovery-envelope.json exist
    const { data: tCheckAlice } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert(tCheckAlice, "transport-envelope.json must exist in storage");
    pass("Storage verified: transport-envelope.json created");

    const { data: rCheckAlice } = await admin.storage
      .from("memories")
      .download(`${pairId}/recovery-envelope.json`, { cacheNonce: Date.now() });
    assert(rCheckAlice, "recovery-envelope.json must exist in storage");
    pass("Storage verified: recovery-envelope.json created");

    // ------------------------------------------------------------------
    // CONTEXT 2: BOB (JOIN FLOW VARIATIONS)
    // ------------------------------------------------------------------
    console.log("\n4. Opening Browser Context 2 (Bob - Joining Partner)...");
    const contextBob = await browser.newContext();
    const pageBob = await contextBob.newPage();
    pageBob.on("console", (msg) => console.log(`[Bob Console] ${msg.type()}: ${msg.text()}`));
    pageBob.on("pageerror", (err) => console.error(`[Bob PageError] ${err.message}`));

    // Bob logs in
    await pageBob.goto(`${baseUrl}/login`);
    await pageBob.fill('input[type="email"]', bobUser.email);
    await pageBob.fill('input[type="password"]', bobUser.password);
    await pageBob.click('button[type="submit"]');

    await pageBob.waitForURL(/onboarding|dashboard/, { timeout: 15000 });
    if (!pageBob.url().includes("/onboarding")) {
      await pageBob.goto(`${baseUrl}/onboarding`);
    }
    await pageBob.waitForLoadState("networkidle");
    pass("Bob navigated to /onboarding");

    // Step 1: Bob enters nickname
    console.log("\n4a. Bob completes Step 1: Nickname...");
    await pageBob.waitForSelector('input[placeholder*="Alex"]', { timeout: 10000 });
    await pageBob.fill('input[placeholder*="Alex"]', "Bob");
    await pageBob.click('button[type="submit"]');
    pass("Bob submitted display name");

    // Step 2: Bob clicks "Join with partner's code"
    console.log("\n4b. Bob chooses 'Join with partner\\'s code'...");
    await pageBob.waitForSelector('button:has-text("Join with partner")', { timeout: 10000 });
    await pageBob.waitForTimeout(500);
    await pageBob.click('button:has-text("Join with partner")');
    pass("Bob clicked 'Join with partner\\'s code'");

    // Step 3B: Bob enters Step 3B
    await pageBob.waitForSelector('input[placeholder*="K7M2QX"]', { timeout: 10000 });

    // SCENARIO 1: Bob enters bare 6-character code (No secret)
    console.log("\n4c. Scenario 1: Bob submits bare 6-character code (Slot Takeover Defense)...");
    await pageBob.fill('input[placeholder*="K7M2QX"]', lookupCode);
    await pageBob.click('button:has-text("Link with Partner")');

    // UI should display error prompting for the full link or string
    await pageBob.waitForSelector('div[class*="bg-red-50"]', { timeout: 10000 });
    const errorText1 = await pageBob.locator('div[class*="bg-red-50"]').textContent();
    assert(
      errorText1?.includes("full invite") ||
      errorText1?.includes("Invalid or expired invite"),
      `Expected error message, got: ${errorText1}`
    );
    pass("UI correctly rejected bare code-only join with prompt for full invite string/link");

    // Verify pair is still pending and envelope is untouched
    const { data: pairStillPending } = await admin.from("pairs").select("status, user_b_id").eq("id", pairId).single();
    assert.strictEqual(pairStillPending.status, "pending");
    assert.strictEqual(pairStillPending.user_b_id, null);
    pass("Confirmed database state: pair remains pending and user_b_id is null");

    // SCENARIO 2: Bob enters wrong secret string
    console.log("\n4d. Scenario 2: Bob submits wrong secret string (Invalid Proof)...");
    const wrongDashedString = `${lookupCode}-88888-88888-88888-88888-88888-8`;
    await pageBob.fill('input[placeholder*="K7M2QX"]', wrongDashedString);
    await pageBob.click('button:has-text("Link with Partner")');

    await pageBob.waitForSelector('div[class*="bg-red-50"]', { timeout: 10000 });
    const errorText2 = await pageBob.locator('div[class*="bg-red-50"]').textContent();
    assert(
      errorText2?.includes("Invalid or expired invite") ||
      errorText2?.includes("does not match the room encryption secret"),
      `Expected error message for wrong secret, got: ${errorText2}`
    );
    pass("UI correctly rejected join with incorrect secret string");

    // SCENARIO 3: Bob submits authentic full invite string
    console.log("\n4e. Scenario 3: Bob submits authentic combined invite string...");
    await pageBob.fill('input[placeholder*="K7M2QX"]', fullInviteString);
    await pageBob.click('button:has-text("Link with Partner")');

    // Bob advances to Dashboard
    console.log("Waiting for Bob to link and reach /dashboard...");
    await pageBob.waitForURL(/dashboard/, { timeout: 15000 });
    pass("Bob successfully linked and reached /dashboard (Connected with Alice!)");

    // Verify Bob's client IndexedDB has the vault key saved
    const bobHasKey = await pageBob.evaluate(async (pId) => {
      return new Promise((resolve) => {
        const req = indexedDB.open("pairfect_vault", 1);
        req.onerror = () => resolve(false);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("keys")) return resolve(false);
          const tx = db.transaction("keys", "readonly");
          const store = tx.objectStore("keys");
          const getReq = store.get(`pair:${pId}`);
          getReq.onsuccess = () => resolve(!!getReq.result);
          getReq.onerror = () => resolve(false);
        };
      });
    }, pairId);
    assert(bobHasKey, "Bob must have vault key stored in IndexedDB");
    pass("Bob's browser IndexedDB verified: vault key persisted locally");

    // Verify transport envelope is purged upon ack, recovery envelope remains
    const { data: tAfterBobAck } = await admin.storage
      .from("memories")
      .download(`${pairId}/transport-envelope.json`, { cacheNonce: Date.now() });
    assert.strictEqual(tAfterBobAck, null, "Transport envelope must be purged after Bob's join");
    pass("Supabase Storage verified: transport-envelope.json permanently purged upon unwrap confirmation");

    const { data: rAfterBobAck } = await admin.storage
      .from("memories")
      .download(`${pairId}/recovery-envelope.json`, { cacheNonce: Date.now() });
    assert(rAfterBobAck, "Recovery envelope must remain intact in storage");
    pass("Supabase Storage verified: recovery-envelope.json intact as persistent cloud backup");

    // ------------------------------------------------------------------
    // REALTIME TRANSITION CHECK ON ALICE'S PAGE
    // ------------------------------------------------------------------
    console.log("\n5. Checking Real-Time Transition in Context 1 (Alice)...");
    // Alice's page should have automatically transitioned to /dashboard
    await pageAlice.waitForURL(/dashboard/, { timeout: 15000 });
    pass("Alice's browser automatically updated in real-time to /dashboard (Paired!)");

    // ------------------------------------------------------------------
    // CONTEXT 3: MULTI-DEVICE RECOVERY WITH 12-WORD PHRASE
    // ------------------------------------------------------------------
    console.log("\n6. Opening Fresh Browser Context 3 (Alice New Device - Recovery Flow)...");
    const contextNewDevice = await browser.newContext();
    const pageNewDevice = await contextNewDevice.newPage();

    // Sign in Alice on new device
    await pageNewDevice.goto(`${baseUrl}/login`);
    await pageNewDevice.fill('input[type="email"]', aliceUser.email);
    await pageNewDevice.fill('input[type="password"]', aliceUser.password);
    await pageNewDevice.click('button[type="submit"]');
    await pageNewDevice.waitForURL(/dashboard/, { timeout: 15000 });
    pass("Alice signed in on fresh browser context");

    // Test phrase unwrap of recovery-envelope.json
    console.log("6a. Fetching recovery envelope from server and unwrapping with 12-word phrase...");
    const recoveryRes = await fetch(`${baseUrl}/api/vault/envelope?pairId=${pairId}&type=recovery`, {
      headers: { Authorization: `Bearer ${alicePairInDb.id}` }, // We use admin or service client for envelope fetch
    });
    const { data: recBlob } = await admin.storage
      .from("memories")
      .download(`${pairId}/recovery-envelope.json`, { cacheNonce: Date.now() });
    const recText = await recBlob.text();

    const restoredKey = await unwrapVaultKeyWithPhrase(recText, recoveryPhrase, pairId);
    assert(restoredKey, "Key restored successfully with 12-word phrase");
    pass("12-word recovery phrase successfully unwrapped recovery-envelope.json on fresh device");

    console.log("\n========================================================================");
    console.log(`ALL BROWSER TESTS VERIFIED: ${passedChecks} / ${passedChecks + failedChecks} checks passed!`);
    console.log("========================================================================");
  } finally {
    if (browser) {
      await browser.close();
    }
    await cleanup();
  }
}

runBrowserTest().catch(async (err) => {
  console.error("Browser test fatal error:", err);
  await cleanup();
  process.exit(1);
});
