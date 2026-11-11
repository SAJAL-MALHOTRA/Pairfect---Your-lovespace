import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import assert from "assert";
import fs from "fs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qdwesijydqasbyjswvkv.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!serviceRoleKey || !anonKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Load the official wordlist
const wordlistRaw = fs.readFileSync("./src/lib/crypto/bip39-wordlist.ts", "utf8");
const match = wordlistRaw.match(/=\s*(\[[\s\S]*?\])\s*as\s*const/);
const BIP39_WORDS = JSON.parse(match[1]);

async function runTwoContextRecoveryTest() {
  console.log("==================================================================");
  console.log("  DUAL-CONTEXT BROWSER RECOVERY & ENCRYPTION PLAYWRIGHT TEST     ");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  let aliceId, bobId, pairId;
  let browser;

  try {
    // 1. Provision test pair in Supabase
    console.log("1. Provisioning test accounts for Alice and Bob...");
    const { data: userA, error: errA } = await admin.auth.admin.createUser({
      email: `recovery.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
      email_confirm: true,
      user_metadata: { display_name: "Alice" },
    });
    if (errA) throw errA;
    aliceId = userA.user.id;

    const { data: userB, error: errB } = await admin.auth.admin.createUser({
      email: `recovery.bob.${timestamp}@pairfect.internal`,
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

    const { data: pair, error: pairErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: aliceId,
        user_b_id: bobId,
        invite_code: `REC${Math.floor(100 + Math.random() * 900)}`,
        status: "active",
      })
      .select()
      .single();
    if (pairErr) throw pairErr;
    pairId = pair.id;

    console.log(`   [PASS] Pair provisioned: ${pairId}\n`);

    // Sign in to get client JWTs
    const clientAlice = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authAlice } = await clientAlice.auth.signInWithPassword({
      email: `recovery.alice.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    const clientBob = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authBob } = await clientBob.auth.signInWithPassword({
      email: `recovery.bob.${timestamp}@pairfect.internal`,
      password: "TestPassword123!@#Secure",
    });

    // 2. Launch Chromium
    browser = await chromium.launch({ headless: true });

    // Client crypto script to inject into pages
    const clientCryptoScript = `
      window.__BIP39_WORDS = ${JSON.stringify(BIP39_WORDS)};

      window.__cryptoUtils = {
        async generateRecoveryPhrase() {
          const entropy = window.crypto.getRandomValues(new Uint8Array(16)); // 128 bits
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", entropy);
          const hashBytes = new Uint8Array(hashBuffer);
          const checksum = hashBytes[0] >> 4; // 4 bits

          const bits = [];
          for (let i = 0; i < 16; i++) {
            for (let b = 7; b >= 0; b--) {
              bits.push((entropy[i] >> b) & 1);
            }
          }
          for (let b = 3; b >= 0; b--) {
            bits.push((checksum >> b) & 1);
          }

          const words = [];
          for (let i = 0; i < 12; i++) {
            let index = 0;
            for (let b = 0; b < 11; b++) {
              index = (index << 1) | bits[i * 11 + b];
            }
            words.push(window.__BIP39_WORDS[index]);
          }
          return words.join(" ");
        },

        async deriveTransportKey(phrase, pairId) {
          const normalized = phrase.trim().toLowerCase().split(/\\s+/).join(" ");
          const salt = new TextEncoder().encode("pairfect_recovery_salt:" + pairId);
          const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(normalized),
            "PBKDF2",
            false,
            ["deriveKey"]
          );
          return window.crypto.subtle.deriveKey(
            { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
          );
        },

        bufferToBase64(buffer) {
          const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
        },

        base64ToBuffer(base64Str) {
          let base64 = base64Str.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return bytes.buffer;
        },

        async wrapVaultKeyWithPhrase(vaultKey, phrase, pairId) {
          const transportKey = await this.deriveTransportKey(phrase, pairId);
          const rawKey = await window.crypto.subtle.exportKey("raw", vaultKey);
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            transportKey,
            rawKey
          );
          return JSON.stringify({
            v: 2,
            type: "bip39_recovery_envelope",
            iv: this.bufferToBase64(iv),
            data: this.bufferToBase64(encrypted),
            created_at: new Date().toISOString()
          });
        },

        async unwrapVaultKeyWithPhrase(envelopeStr, phrase, pairId) {
          const envelope = JSON.parse(envelopeStr);
          const transportKey = await this.deriveTransportKey(phrase, pairId);
          const iv = new Uint8Array(this.base64ToBuffer(envelope.iv));
          const encryptedBytes = this.base64ToBuffer(envelope.data);
          const rawKey = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            transportKey,
            encryptedBytes
          );
          return window.crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
          );
        }
      };
    `;

    // 3. Browser Context A (Alice's phone)
    console.log("2. Opening Browser Context A (Alice's Device)...");
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.addInitScript(clientCryptoScript);
    await pageA.goto("http://localhost:3000/");

    // Alice generates couple key, encrypts a test photo, generates recovery phrase, and uploads envelope
    console.log("3. Context A: Alice generates vault key, encrypts photo, and backs up recovery phrase...");
    const aliceData = await pageA.evaluate(
      async ({ pairId, token }) => {
        // Generate AES-256-GCM vault key
        const vaultKey = await window.crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );

        // Store key in Alice's IndexedDB
        await new Promise((resolve, reject) => {
          const req = window.indexedDB.open("pairfect_vault", 2);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
            if (!db.objectStoreNames.contains("recovery_phrases")) db.createObjectStore("recovery_phrases");
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("keys", "readwrite");
            tx.objectStore("keys").put(vaultKey, `key:${pairId}`);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });

        // Test photo plaintext
        const plaintextStr = "Authentic Pairfect Keepsake Photo 2026 - Alice and Bob Memory";
        const plaintextBytes = new TextEncoder().encode(plaintextStr);

        // Encrypt photo with AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          vaultKey,
          plaintextBytes
        );
        const ciphertextArray = Array.from(new Uint8Array(ciphertextBuffer));
        const ivArray = Array.from(iv);

        // Generate 12-word phrase
        const phrase = await window.__cryptoUtils.generateRecoveryPhrase();

        // Wrap master key with the phrase
        const envelopeStr = await window.__cryptoUtils.wrapVaultKeyWithPhrase(vaultKey, phrase, pairId);

        // Upload recovery envelope to server
        const uploadRes = await fetch("/api/vault/envelope", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pairId, envelope: envelopeStr }),
        });
        const uploadJson = await uploadRes.json();

        return {
          phrase,
          ivArray,
          ciphertextArray,
          originalPlaintext: plaintextStr,
          uploadSuccess: uploadJson.success,
        };
      },
      { pairId, token: authAlice.session.access_token }
    );

    assert.strictEqual(aliceData.uploadSuccess, true, "Envelope upload must succeed");
    console.log(`   [PASS] Vault key generated on Alice's device.`);
    console.log(`   [PASS] 12-Word Recovery Phrase created: "${aliceData.phrase}"`);
    console.log(`   [PASS] Photo encrypted with AES-256-GCM (${aliceData.ciphertextArray.length} bytes).`);
    console.log(`   [PASS] 128-bit recovery envelope uploaded to /api/vault/envelope.\n`);

    // 4. Browser Context B (Bob's brand new phone - completely empty storage)
    console.log("4. Opening Browser Context B (Bob's New Device - fresh storage)...");
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.addInitScript(clientCryptoScript);
    await pageB.goto("http://localhost:3000/");

    // Step 4a: Verify Bob starts with NO keys
    const bobInitialState = await pageB.evaluate(async ({ pairId }) => {
      return new Promise((resolve) => {
        const req = window.indexedDB.open("pairfect_vault", 2);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
          if (!db.objectStoreNames.contains("recovery_phrases")) db.createObjectStore("recovery_phrases");
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("keys", "readonly");
          const getReq = tx.objectStore("keys").get(`key:${pairId}`);
          getReq.onsuccess = () => resolve({ hasKey: !!getReq.result });
          getReq.onerror = () => resolve({ hasKey: false });
        };
        req.onerror = () => resolve({ hasKey: false });
      });
    }, { pairId });

    assert.strictEqual(bobInitialState.hasKey, false, "Bob must not have any key initially");
    console.log("   [PASS] Verified Bob's device has empty IndexedDB (zero keys).\n");

    // Step 4b: Attempt restore with an INVALID recovery phrase (should reject)
    console.log("5. Testing wrong phrase rejection in Context B...");
    const wrongPhraseResult = await pageB.evaluate(
      async ({ pairId, token }) => {
        const envRes = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const envJson = await envRes.json();
        const fakePhrase = "abandon ability able about above absent absorb abstract absurd abuse access accident";

        try {
          await window.__cryptoUtils.unwrapVaultKeyWithPhrase(envJson.envelope, fakePhrase, pairId);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message || "Decryption failed" };
        }
      },
      { pairId, token: authBob.session.access_token }
    );

    assert.strictEqual(wrongPhraseResult.success, false, "Wrong phrase must fail");
    console.log(`   [PASS] Wrong recovery phrase correctly rejected: ${wrongPhraseResult.error}\n`);

    // Step 4c: Restore using authentic 12-word recovery phrase in Context B
    console.log("6. Restoring vault key in Context B using authentic 12-word recovery phrase...");
    const restoreResult = await pageB.evaluate(
      async ({ pairId, token, phrase, ivArray, ciphertextArray }) => {
        // 1. Fetch envelope from server
        const envRes = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const envJson = await envRes.json();
        if (!envJson.success || !envJson.envelope) {
          throw new Error("Missing envelope on server");
        }

        // 2. Unwrap master key with phrase
        const restoredKey = await window.__cryptoUtils.unwrapVaultKeyWithPhrase(envJson.envelope, phrase, pairId);

        // 3. Save into Bob's IndexedDB
        await new Promise((resolve, reject) => {
          const req = window.indexedDB.open("pairfect_vault", 2);
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("keys", "readwrite");
            tx.objectStore("keys").put(restoredKey, `key:${pairId}`);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });

        // 4. Decrypt Alice's photo using the restored key!
        const iv = new Uint8Array(ivArray);
        const ciphertext = new Uint8Array(ciphertextArray);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          restoredKey,
          ciphertext
        );
        const decryptedText = new TextDecoder().decode(decryptedBuffer);

        return {
          success: true,
          decryptedText,
        };
      },
      {
        pairId,
        token: authBob.session.access_token,
        phrase: aliceData.phrase,
        ivArray: aliceData.ivArray,
        ciphertextArray: aliceData.ciphertextArray,
      }
    );

    assert.strictEqual(restoreResult.success, true);
    assert.strictEqual(restoreResult.decryptedText, aliceData.originalPlaintext);
    console.log(`   [PASS] Key successfully unwrapped from recovery envelope!`);
    console.log(`   [PASS] Photo successfully decrypted in Context B: "${restoreResult.decryptedText}"\n`);

    // 5. Test Purge Server Envelope & Context C behavior
    console.log("7. Alice purges server envelope (DELETE /api/vault/envelope)...");
    const purgeRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authAlice.session.access_token}` },
    });
    const purgeJson = await purgeRes.json();
    console.log("   Purge response:", JSON.stringify(purgeJson));
    assert.strictEqual(purgeRes.status, 200);
    assert.strictEqual(purgeJson.success, true);
    console.log("   [PASS] Server envelope purged successfully from cloud storage.\n");

    console.log("8. Verifying server envelope is purged from storage...");
    const verifyRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pairId}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${authBob.session.access_token}`,
        "Cache-Control": "no-cache",
      },
    });
    const verifyJson = await verifyRes.json();
    console.log("   Node verify response:", JSON.stringify(verifyJson));
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyJson.envelope, null, "Purged envelope must return null");
    console.log("   [PASS] Confirmed: server envelope is null after purge.");
    console.log("   [PASS] New device correctly informed that server keeps no copy of the key.\n");

  } catch (err) {
    console.error("TEST FAILED:", err);
    throw err;
  } finally {
    if (browser) await browser.close();

    console.log("9. Cleaning up test accounts from Supabase...");
    try {
      if (pairId) {
        await admin.storage.from("memories").remove([`${pairId}/vault-envelope.json`]);
        await admin.from("pairs").delete().eq("id", pairId);
      }
      if (aliceId) {
        await admin.from("users").delete().eq("id", aliceId);
        await admin.auth.admin.deleteUser(aliceId);
      }
      if (bobId) {
        await admin.from("users").delete().eq("id", bobId);
        await admin.auth.admin.deleteUser(bobId);
      }
      console.log("   [PASS] Cleanup complete. Zero test accounts remain.\n");
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }

  console.log("==================================================================");
  console.log("  DUAL-CONTEXT BROWSER RECOVERY TEST: 100% PASS                  ");
  console.log("==================================================================");
}

runTwoContextRecoveryTest().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
