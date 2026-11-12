import { BIP39_WORDLIST, BIP39_WORD_MAP } from "./bip39-wordlist";

/**
 * Client-Side 12-Word Recovery Phrase Module
 *
 * Cryptographic Specifications:
 * - Entropy: 128 bits (16 bytes) from cryptographically secure CSPRNG
 * - Checksum: 4 bits derived from SHA-256(entropy)
 * - Word Count: 12 words from official 2048-word dictionary
 * - Key Derivation: PBKDF2 with 100,000 iterations, HMAC-SHA-256
 * - Key Wrap: AES-256-GCM authenticated encryption (12-byte IV)
 * - Client Privacy: The recovery phrase is generated and processed exclusively on the client.
 *   Servers never receive, store, or log the recovery phrase.
 */

function getCryptoSubtle(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (subtle) is not available in this environment.");
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error("CSPRNG getRandomValues is not available in this environment.");
}

/**
 * Generate a new standard 12-word BIP-39 recovery phrase
 */
export async function generateRecoveryPhrase(): Promise<string> {
  const subtle = getCryptoSubtle();
  const entropy = getRandomBytes(16); // 128 bits

  // 1. Compute SHA-256 hash of entropy
  const hashBuffer = await subtle.digest("SHA-256", entropy as unknown as BufferSource);
  const hashBytes = new Uint8Array(hashBuffer);

  // 2. Build 132-bit array (128 bits entropy + 4 bits checksum)
  const bits: number[] = [];
  for (let i = 0; i < 16; i++) {
    for (let b = 7; b >= 0; b--) {
      bits.push((entropy[i] >> b) & 1);
    }
  }
  for (let b = 7; b >= 4; b--) {
    bits.push((hashBytes[0] >> b) & 1);
  }

  // 3. Map 132 bits into 12 words (11 bits per word: 0 to 2047)
  const words: string[] = [];
  for (let w = 0; w < 12; w++) {
    let index = 0;
    for (let b = 0; b < 11; b++) {
      index = (index << 1) | bits[w * 11 + b];
    }
    words.push(BIP39_WORDLIST[index]);
  }

  return words.join(" ");
}

/**
 * Validate a 12-word recovery phrase for wordlist validity and SHA-256 checksum
 */
export async function validateRecoveryPhrase(
  phrase: string
): Promise<{ valid: boolean; error?: string }> {
  if (!phrase || typeof phrase !== "string") {
    return { valid: false, error: "Please enter a recovery phrase." };
  }

  const words = phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length !== 12) {
    return {
      valid: false,
      error: `Recovery phrase must contain exactly 12 words (detected ${words.length}).`,
    };
  }

  const bits: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const index = BIP39_WORD_MAP[word];
    if (index === undefined) {
      return {
        valid: false,
        error: `Word "${word}" at position ${i + 1} is not a valid BIP-39 recovery word.`,
      };
    }
    for (let b = 10; b >= 0; b--) {
      bits.push((index >> b) & 1);
    }
  }

  // Extract 128 bits of entropy
  const entropy = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    entropy[i] = byte;
  }

  // Extract 4-bit checksum
  let checksum = 0;
  for (let b = 0; b < 4; b++) {
    checksum = (checksum << 1) | bits[128 + b];
  }

  // Verify checksum against SHA-256 of entropy
  const subtle = getCryptoSubtle();
  const hashBuffer = await subtle.digest("SHA-256", entropy as unknown as BufferSource);
  const hashBytes = new Uint8Array(hashBuffer);
  const expectedChecksum = hashBytes[0] >> 4;

  if (checksum !== expectedChecksum) {
    return {
      valid: false,
      error: "Invalid recovery phrase checksum. Please check the spelling or order of your words.",
    };
  }

  return { valid: true };
}

/**
 * Derive an AES-256 transport key from the recovery phrase using PBKDF2
 */
async function deriveTransportKeyFromPhrase(
  phrase: string,
  pairId: string
): Promise<CryptoKey> {
  const subtle = getCryptoSubtle();
  const normalizedPhrase = phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join(" ");

  const salt = new TextEncoder().encode(`pairfect_recovery_salt:${pairId}`);
  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(normalizedPhrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Helper: Convert ArrayBuffer to URL-safe Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Helper: Convert URL-safe Base64 to ArrayBuffer
 */
function base64ToBuffer(base64Str: string): ArrayBuffer {
  let base64 = base64Str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface RecoveryEnvelope {
  v: 2;
  type: "bip39_recovery_envelope";
  iv: string;
  data: string;
  created_at: string;
}

/**
 * Wrap a master vault CryptoKey into an encrypted envelope using a 12-word recovery phrase
 */
export async function wrapVaultKeyWithPhrase(
  vaultKey: CryptoKey,
  phrase: string,
  pairId: string
): Promise<string> {
  const validation = await validateRecoveryPhrase(phrase);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid recovery phrase.");
  }

  const subtle = getCryptoSubtle();
  const transportKey = await deriveTransportKeyFromPhrase(phrase, pairId);
  const rawMasterKey = await subtle.exportKey("raw", vaultKey);
  const iv = getRandomBytes(12);

  const encrypted = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    transportKey,
    rawMasterKey
  );

  const envelope: RecoveryEnvelope = {
    v: 2,
    type: "bip39_recovery_envelope",
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted),
    created_at: new Date().toISOString(),
  };

  return JSON.stringify(envelope);
}

/**
 * Unwrap a master vault CryptoKey from an encrypted recovery envelope using a 12-word recovery phrase
 */
export async function unwrapVaultKeyWithPhrase(
  envelopeStr: string,
  phrase: string,
  pairId: string
): Promise<CryptoKey> {
  const validation = await validateRecoveryPhrase(phrase);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid recovery phrase.");
  }

  const envelope: RecoveryEnvelope = JSON.parse(envelopeStr);
  if (envelope.v !== 2 || envelope.type !== "bip39_recovery_envelope" || !envelope.iv || !envelope.data) {
    throw new Error("Invalid or unsupported recovery envelope format.");
  }

  const subtle = getCryptoSubtle();
  const transportKey = await deriveTransportKeyFromPhrase(phrase, pairId);
  const iv = new Uint8Array(base64ToBuffer(envelope.iv));
  const encryptedBytes = base64ToBuffer(envelope.data);

  const decryptedRaw = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    transportKey,
    encryptedBytes as unknown as BufferSource
  );

  return subtle.importKey(
    "raw",
    decryptedRaw,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable: true enables multi-device sync and re-sharing
    ["encrypt", "decrypt"]
  );
}

/**
 * Security: The 12-word recovery phrase is generated and shown to the user once.
 * To ensure zero client persistence, the recovery phrase is NEVER saved in IndexedDB,
 * localStorage, server request bodies, logs, or analytics.
 * Any legacy offline recovery phrase database is deleted.
 */
export async function purgeRecoveryPhraseCache(): Promise<void> {
  if (typeof window !== "undefined" && window.indexedDB) {
    try {
      window.indexedDB.deleteDatabase("pairfect_recovery");
    } catch {}
  }
}

export async function saveRecoveryPhraseLocally(_pairId: string, _phrase: string): Promise<void> {
  // Deprecated: Recovery phrase is never persisted to client storage.
  // Purge any legacy cache that may exist from previous versions.
  await purgeRecoveryPhraseCache();
}

export async function getRecoveryPhraseLocally(_pairId: string): Promise<string | null> {
  // Deprecated: Recovery phrase is never retained in client storage.
  return null;
}

export async function deleteRecoveryPhraseLocally(_pairId: string): Promise<void> {
  await purgeRecoveryPhraseCache();
}
