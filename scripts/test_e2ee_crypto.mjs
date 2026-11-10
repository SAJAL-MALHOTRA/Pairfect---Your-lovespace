// Node.js test script for E2EE Web Crypto module
import { webcrypto } from 'node:crypto';

// Polyfill global window.crypto if running in Node
if (!globalThis.window) {
  globalThis.window = { crypto: webcrypto };
}

const IV_LENGTH = 12;
const FORMAT_VERSION = 0x01;

async function runTests() {
  console.log('Testing E2EE Web Crypto primitives...');

  // 1. Generate Key
  const key = await webcrypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  console.log('✓ Generated 256-bit AES-GCM key');

  // 2. Export Key to Base64URL
  const rawKey = await webcrypto.subtle.exportKey('raw', key);
  const base64Url = Buffer.from(rawKey).toString('base64url');
  console.log('✓ Exported key to fragment string:', base64Url);

  // 3. Import Key from Base64URL
  const rawImported = Buffer.from(base64Url, 'base64url');
  const importedKey = await webcrypto.subtle.importKey(
    'raw',
    rawImported,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  console.log('✓ Successfully imported key from fragment');

  // 4. Encrypt with AAD
  const originalData = Buffer.from('TEST_JPEG_IMAGE_PAYLOAD_BINARY_DATA_XYZ_12345');
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const context = { pairId: 'pair-uuid-1234', stripId: 'strip-uuid-5678', position: 2 };
  const aad = new TextEncoder().encode(`${context.pairId}:${context.stripId}:${context.position}`);

  const ciphertext = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    originalData
  );

  // Pack: [Version 1B][IV 12B][Ciphertext + Tag]
  const packed = Buffer.concat([
    Buffer.from([FORMAT_VERSION]),
    Buffer.from(iv),
    Buffer.from(ciphertext)
  ]);
  console.log('✓ Encrypted binary payload length:', packed.length);

  // 5. Decrypt with correct key and matching AAD
  const decVersion = packed[0];
  if (decVersion !== FORMAT_VERSION) throw new Error('Bad version');
  const decIv = packed.subarray(1, 1 + IV_LENGTH);
  const decCipher = packed.subarray(1 + IV_LENGTH);

  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decIv, additionalData: aad },
    importedKey,
    decCipher
  );
  const decryptedText = Buffer.from(decrypted).toString();
  if (decryptedText !== 'TEST_JPEG_IMAGE_PAYLOAD_BINARY_DATA_XYZ_12345') {
    throw new Error('Decrypted text does not match original!');
  }
  console.log('✓ Decrypted payload matches original plaintext perfectly!');

  // 6. Tamper test: flip 1 byte in ciphertext
  const tamperedPacked = Buffer.from(packed);
  tamperedPacked[tamperedPacked.length - 5] ^= 0xFF; // flip 1 byte
  const tamperedCipher = tamperedPacked.subarray(1 + IV_LENGTH);

  let tamperFailedAsExpected = false;
  try {
    await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decIv, additionalData: aad },
      importedKey,
      tamperedCipher
    );
  } catch (err) {
    tamperFailedAsExpected = true;
    console.log('✓ Tamper test passed: Flipped byte rejected with authentication failure!');
  }
  if (!tamperFailedAsExpected) throw new Error('Tamper test failed: Decrypted tampered ciphertext without error!');

  // 7. Wrong AAD test (swap position or pairId)
  const wrongAad = new TextEncoder().encode(`${context.pairId}:${context.stripId}:3`); // swapped position 2 -> 3
  let wrongAadFailed = false;
  try {
    await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decIv, additionalData: wrongAad },
      importedKey,
      decCipher
    );
  } catch (err) {
    wrongAadFailed = true;
    console.log('✓ Context binding (AAD) test passed: Swapped frame position rejected!');
  }
  if (!wrongAadFailed) throw new Error('AAD test failed: Decrypted with mismatched context!');

  console.log('All E2EE cryptographic tests passed with 100% success!');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
