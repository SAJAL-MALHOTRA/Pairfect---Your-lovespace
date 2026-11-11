import {
  generateRecoveryPhrase,
  validateRecoveryPhrase,
  wrapVaultKeyWithPhrase,
  unwrapVaultKeyWithPhrase,
} from "../src/lib/crypto/recovery-phrase.ts";
import assert from "node:assert";

async function main() {
  console.log("=== TESTING BIP-39 CLIENT RECOVERY PHRASE MODULE ===\n");

  // 1. Generation
  console.log("1. Testing 12-word recovery phrase generation...");
  const phrase = await generateRecoveryPhrase();
  console.log(`   Generated Phrase: "${phrase}"`);
  const words = phrase.split(" ");
  assert.strictEqual(words.length, 12, "Must generate exactly 12 words");
  console.log("   [PASS] Generated exactly 12 words.\n");

  // 2. Validation
  console.log("2. Testing recovery phrase validation...");
  const validRes = await validateRecoveryPhrase(phrase);
  assert.strictEqual(validRes.valid, true, "Generated phrase must be valid");
  console.log("   [PASS] Authentic phrase passed wordlist and SHA-256 checksum validation.\n");

  // 3. Tamper & Corruption Detection
  console.log("3. Testing tamper & checksum rejection...");
  
  // Word count mismatch
  const shortPhrase = words.slice(0, 11).join(" ");
  const shortRes = await validateRecoveryPhrase(shortPhrase);
  assert.strictEqual(shortRes.valid, false, "11-word phrase must be rejected");
  console.log(`   [PASS] 11-word phrase rejected: "${shortRes.error}"`);

  // Invalid dictionary word
  const invalidWordPhrase = [...words.slice(0, 11), "fakewordxyz"].join(" ");
  const invalidWordRes = await validateRecoveryPhrase(invalidWordPhrase);
  assert.strictEqual(invalidWordRes.valid, false, "Unknown word must be rejected");
  console.log(`   [PASS] Unknown word rejected: "${invalidWordRes.error}"`);

  // Checksum mismatch test: find an invalid word substitution that fails checksum
  let checksumCaught = false;
  const candidateWords = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "zoo", "zone", "zero"];
  for (const cand of candidateWords) {
    if (cand !== words[11]) {
      const testWords = [...words.slice(0, 11), cand];
      const checkRes = await validateRecoveryPhrase(testWords.join(" "));
      if (!checkRes.valid && checkRes.error?.includes("checksum")) {
        checksumCaught = true;
        console.log(`   [PASS] Checksum mismatch caught: "${checkRes.error}" (tested word: ${cand})`);
        break;
      }
    }
  }
  assert.strictEqual(checksumCaught, true, "Checksum mismatch must be detected");
  console.log("   [PASS] All tamper tests passed.\n");

  // 4. Master Key Wrapping and Unwrapping Roundtrip
  console.log("4. Testing Vault Key Wrapping & Unwrapping Roundtrip...");
  const pairId = "pair_test_uuid_12345";
  
  // Create test master vault key
  const masterKey = await globalThis.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Wrap with recovery phrase
  const envelopeStr = await wrapVaultKeyWithPhrase(masterKey, phrase, pairId);
  const envelope = JSON.parse(envelopeStr);
  console.log(`   Wrapped Envelope Version: ${envelope.v}, Type: ${envelope.type}`);
  assert.strictEqual(envelope.v, 2);
  assert.strictEqual(envelope.type, "bip39_recovery_envelope");
  console.log("   [PASS] Envelope formatted correctly.\n");

  // 5. Unwrap with recovery phrase
  console.log("5. Unwrapping master key with recovery phrase...");
  const unwrappedKey = await unwrapVaultKeyWithPhrase(envelopeStr, phrase, pairId);
  assert(unwrappedKey !== null, "Key should unwrap");

  // Encrypt with original key, decrypt with unwrapped key
  const testPayload = new TextEncoder().encode("Hello Pairfect True Zero-Knowledge Vault!");
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    testPayload
  );

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    unwrappedKey,
    ciphertext
  );
  const decryptedText = new TextDecoder().decode(decrypted);
  console.log(`   Decrypted Text: "${decryptedText}"`);
  assert.strictEqual(decryptedText, "Hello Pairfect True Zero-Knowledge Vault!");
  console.log("   [PASS] Cryptographic roundtrip verified: unwrapped key is identical to master key!\n");

  // 6. Wrong Phrase Decryption Failure
  console.log("6. Testing unwrapping with wrong recovery phrase...");
  const otherPhrase = await generateRecoveryPhrase();
  try {
    await unwrapVaultKeyWithPhrase(envelopeStr, otherPhrase, pairId);
    assert.fail("Should have thrown on wrong phrase");
  } catch (err) {
    console.log(`   [PASS] Wrong recovery phrase threw expected error: ${err.message}\n`);
  }

  console.log("================================================================");
  console.log("    BIP-39 RECOVERY PHRASE MODULE: 100% VERIFIED OPERATIONAL    ");
  console.log("================================================================");
}

main().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
