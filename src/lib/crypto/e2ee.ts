/**
 * Client-Side Encrypted Couple Vault (E2EE) Module
 * 
 * Cryptographic Specifications:
 * - Algorithm: AES-256-GCM (W3C Web Crypto API)
 * - Key Length: 256 bits, cryptographically random, extractable: true (for re-sharing)
 * - Binary Payload Format: [1 byte: Version 0x01][12 bytes: IV][Ciphertext + 16 bytes: GCM Tag]
 * - Additional Authenticated Data (AAD): Context-bound to `${pairId}:${stripId}:${position}`
 * - Key Storage: Client IndexedDB (`pairfect_vault` -> `keys`)
 * - Key Exchange: URL hash fragments (`#k=...`), RFC 3986 client-only, never sent to server
 */

const DB_NAME = "pairfect_vault";
const STORE_NAME = "keys";
const DB_VERSION = 1;
const FORMAT_VERSION = 0x01;
const IV_LENGTH = 12;

// In-memory LRU/Session Cache for decrypted image Blobs to avoid re-decryption on scroll
const sessionDecryptedBlobCache = new Map<string, Blob>();

/**
 * Open or initialize IndexedDB for persistent client-side key storage
 */
function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an extractable CryptoKey to IndexedDB
 */
export async function saveKeyToIndexedDB(keyId: string, key: CryptoKey): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, keyId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve a CryptoKey from IndexedDB
 */
export async function getKeyFromIndexedDB(keyId: string): Promise<CryptoKey | null> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(keyId);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Promote temporary key from `pending:<code>` to `pair:<pairId>` upon successful join
 */
export async function promotePendingKey(inviteCode: string, pairId: string): Promise<boolean> {
  try {
    const pendingKeyId = `pending:${inviteCode.toUpperCase()}`;
    const key = await getKeyFromIndexedDB(pendingKeyId);
    if (!key) return false;

    // Save under permanent pair ID
    await saveKeyToIndexedDB(`pair:${pairId}`, key);

    // Delete pending record
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(pendingKeyId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return true;
  } catch (err) {
    console.error("[E2EE] Failed to promote pending key:", err);
    return false;
  }
}

/**
 * Extract key from URL hash fragment (e.g. #k=... or &k=...)
 */
export function extractKeyFromFragment(hash: string): string | null {
  if (!hash) return null;
  const match = hash.match(/[#&]k=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Retrieve couple key by pair ID
 */
export async function getPairKey(pairId: string): Promise<CryptoKey | null> {
  return getKeyFromIndexedDB(`pair:${pairId}`);
}

/**
 * Save couple key by pair ID
 */
export async function savePairKey(pairId: string, key: CryptoKey): Promise<void> {
  return saveKeyToIndexedDB(`pair:${pairId}`, key);
}

/**
 * Save temporary key under pending invite code
 */
export async function savePendingKey(inviteCode: string, key: CryptoKey): Promise<void> {
  return saveKeyToIndexedDB(`pending:${inviteCode.toUpperCase()}`, key);
}

/**
 * Check if pair key exists in IndexedDB
 */
export async function hasPairKey(pairId: string): Promise<boolean> {
  const key = await getKeyFromIndexedDB(`pair:${pairId}`);
  return Boolean(key);
}

/**
 * Permanently delete couple key from IndexedDB on unlink or account deletion
 */
export async function deletePairKey(pairId: string): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(`pair:${pairId}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[E2EE] Failed to delete pair key:", err);
  }
}

/**
 * Generate a cryptographically random 256-bit AES-GCM key with extractable: true
 */
export async function generateCoupleKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable: true enables in-app key re-sharing
    ["encrypt", "decrypt"]
  );
}

/**
 * Helper: Convert ArrayBuffer or Uint8Array to URL-safe Base64 string
 */
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
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
 * Helper: Convert URL-safe Base64 string to ArrayBuffer
 */
function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
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

/**
 * Export a CryptoKey to a URL-safe Base64 string suitable for URL hash fragment (#k=...)
 */
export async function exportKeyToFragment(key: CryptoKey): Promise<string> {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return bufferToBase64Url(raw);
}

/**
 * Import a CryptoKey from a URL-safe Base64 string
 */
export async function importKeyFromFragment(base64UrlKey: string): Promise<CryptoKey> {
  const rawBuffer = base64UrlToBuffer(base64UrlKey);
  return window.crypto.subtle.importKey(
    "raw",
    rawBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable: true
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap a master vault CryptoKey using an envelope derived from the 6-character invite code
 * Enables 100% automated key delivery when a partner enters only the invite code.
 */
export async function wrapVaultKeyWithCode(
  vaultKey: CryptoKey,
  inviteCode: string,
  pairId: string
): Promise<string> {
  const code = inviteCode.trim().toUpperCase();
  const salt = new TextEncoder().encode("pairfect_vault_transport:" + pairId);
  const codeMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const transportKey = await window.crypto.subtle.deriveKey(
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

  const rawMasterKey = await window.crypto.subtle.exportKey("raw", vaultKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    transportKey,
    rawMasterKey
  );

  const envelopePayload = {
    v: 1,
    iv: bufferToBase64Url(iv),
    data: bufferToBase64Url(encryptedKeyBuffer),
  };

  return JSON.stringify(envelopePayload);
}

/**
 * Unwrap a master vault CryptoKey envelope using the 6-character invite code
 */
export async function unwrapVaultKeyWithCode(
  envelopeStr: string,
  inviteCode: string,
  pairId: string
): Promise<CryptoKey> {
  const code = inviteCode.trim().toUpperCase();
  const envelope = JSON.parse(envelopeStr);

  if (!envelope.iv || !envelope.data) {
    throw new Error("Invalid envelope format.");
  }

  const salt = new TextEncoder().encode("pairfect_vault_transport:" + pairId);
  const codeMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const transportKey = await window.crypto.subtle.deriveKey(
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

  const decryptedRawBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    transportKey,
    encryptedBytes
  );

  return window.crypto.subtle.importKey(
    "raw",
    decryptedRawBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable: true enables re-sharing and multi-device sync
    ["encrypt", "decrypt"]
  );
}

// =====================================================================
// TRANSPORT ENVELOPE V3: FRAGMENT SECRET & PROOF-OF-SECRET ARCHITECTURE
// =====================================================================

export const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function encodeCrockfordBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += CROCKFORD_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeCrockfordBase32(str: string): Uint8Array {
  const normalized = str
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const idx = CROCKFORD_ALPHABET.indexOf(normalized[i]);
    if (idx === -1) throw new Error("Invalid Crockford base32 character: " + normalized[i]);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes.slice(0, 16));
}

export function formatSecretDashed(secretB32: string): string {
  if (secretB32.length < 26) return secretB32;
  return [
    secretB32.slice(0, 5),
    secretB32.slice(5, 10),
    secretB32.slice(10, 15),
    secretB32.slice(15, 20),
    secretB32.slice(20, 25),
    secretB32.slice(25, 26),
  ].join("-");
}

export function encodeInvite(code: string, secretBytes: Uint8Array): string {
  const cleanCode = code.trim().toUpperCase();
  const secretB32 = encodeCrockfordBase32(secretBytes);
  return `${cleanCode}-${formatSecretDashed(secretB32)}`;
}

export function parseInvite(input: string): { code: string; secret: Uint8Array | null } {
  if (!input || typeof input !== "string") {
    return { code: "", secret: null };
  }

  const trimmed = input.trim();

  // 1. Check if input is a URL
  if (trimmed.includes("http://") || trimmed.includes("https://") || trimmed.includes("onboarding")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://pairfect.site${trimmed.startsWith("/") ? "" : "/"}${trimmed}`);
      const code = (url.searchParams.get("code") || "").trim().toUpperCase();
      let secretB32 = "";

      // Check hash fragment #s=...
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        secretB32 = hashParams.get("s") || "";
        if (!secretB32) {
          const match = url.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
          if (match) secretB32 = match[1];
        }
      }

      // Fallback: check query param ?s=
      if (!secretB32) {
        secretB32 = url.searchParams.get("s") || "";
      }

      let secret: Uint8Array | null = null;
      if (secretB32) {
        try {
          secret = decodeCrockfordBase32(secretB32);
        } catch {
          secret = null;
        }
      }
      return { code, secret };
    } catch {
      // Not a valid URL, fall through
    }
  }

  // 2. Text input: check for DASHED format (e.g. CODE-SECRET)
  const cleaned = trimmed.replace(/[\s]/g, "");

  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    const code = parts[0].toUpperCase();
    const rest = parts.slice(1).join("");
    if (code.length === 6 && rest.length >= 26) {
      try {
        const secret = decodeCrockfordBase32(rest.slice(0, 26));
        return { code, secret };
      } catch {
        return { code, secret: null };
      }
    }
  }

  // 3. Contiguous string: 6 code + 26 secret = 32 chars
  const noDashes = cleaned.replace(/-/g, "");
  if (noDashes.length >= 32) {
    const code = noDashes.slice(0, 6).toUpperCase();
    try {
      const secret = decodeCrockfordBase32(noDashes.slice(6, 32));
      return { code, secret };
    } catch {
      return { code, secret: null };
    }
  }

  // 4. Bare code (e.g. 6 chars)
  if (noDashes.length === 6) {
    return { code: noDashes.toUpperCase(), secret: null };
  }

  return { code: noDashes.slice(0, 6).toUpperCase(), secret: null };
}

export function generateInviteSecret(): Uint8Array {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  return cryptoObj.getRandomValues(new Uint8Array(16));
}

const encUtf8 = new TextEncoder();

async function hkdfDerive(secret: Uint8Array, salt: Uint8Array, info: string): Promise<Uint8Array> {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const base = await cryptoObj.subtle.importKey("raw", secret as unknown as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await cryptoObj.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: salt as unknown as BufferSource, info: encUtf8.encode(info) as unknown as BufferSource },
      base,
      256
    )
  );
}

async function deriveTransportWrapKey(secret: Uint8Array, salt: Uint8Array, pairId: string): Promise<CryptoKey> {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const bits = await hkdfDerive(secret, salt, `pairfect_vault_transport:v3:${pairId}`);
  const k = await cryptoObj.subtle.importKey("raw", bits as unknown as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
  bits.fill(0);
  return k;
}

export async function joinProof(secret: Uint8Array, _pairId?: string | null): Promise<string> {
  // Salt is fixed because the client cannot know pairId before joining.
  const p = await hkdfDerive(secret, new Uint8Array(16), "pairfect_join_proof:v3");
  return bufferToBase64Url(p); // sent to server on join
}

export async function joinVerifier(proofB64: string): Promise<string> {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const rawProof = base64UrlToBuffer(proofB64);
  const hash = await cryptoObj.subtle.digest("SHA-256", rawProof);
  return bufferToBase64Url(new Uint8Array(hash));
}

export interface TransportEnvelopeV3 {
  v: 3;
  type: "transport";
  alg: "AES-256-GCM";
  kdf: {
    name: "HKDF-SHA-256";
    salt: string;
  };
  iv: string;
  ct: string;
}

export async function wrapVaultKeyV3(
  vaultKey: CryptoKey,
  secret: Uint8Array,
  pairId: string
): Promise<TransportEnvelopeV3> {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const raw = new Uint8Array(await cryptoObj.subtle.exportKey("raw", vaultKey));
  const wrapKey = await deriveTransportWrapKey(secret, salt, pairId);
  const ct = await cryptoObj.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encUtf8.encode(`pairfect:transport:v3:${pairId}`) as unknown as BufferSource,
    },
    wrapKey,
    raw as unknown as BufferSource
  );
  raw.fill(0);
  return {
    v: 3,
    type: "transport",
    alg: "AES-256-GCM",
    kdf: { name: "HKDF-SHA-256", salt: bufferToBase64Url(salt) },
    iv: bufferToBase64Url(iv),
    ct: bufferToBase64Url(new Uint8Array(ct)),
  };
}

export async function unwrapVaultKeyV3(
  env: any,
  secret: Uint8Array,
  pairId: string
): Promise<CryptoKey> {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  const envObj = typeof env === "string" ? JSON.parse(env) : env;
  const ciphertext = base64UrlToBuffer(envObj.ct || envObj.data);
  const salt = new Uint8Array(base64UrlToBuffer(envObj.kdf?.salt));
  const iv = new Uint8Array(base64UrlToBuffer(envObj.iv));
  const wrapKey = await deriveTransportWrapKey(secret, salt, pairId);
  const raw = await cryptoObj.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encUtf8.encode(`pairfect:transport:v3:${pairId}`) as unknown as BufferSource,
    },
    wrapKey,
    ciphertext
  );
  return cryptoObj.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    true, // extractable: true enables multi-device sync and local backup
    ["encrypt", "decrypt"]
  );
}

/**
 * Automatically recovers the vault key for an active pair if missing from local IndexedDB
 * Retrieves the encrypted envelope from the server and unwraps it with the invite code.
 */
export async function autoRecoverVaultKeyIfMissing(pairId: string, inviteCode?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const exists = await hasPairKey(pairId);
    if (exists) return true;

    const res = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}`);
    if (!res.ok) return false;

    const data = await res.json();
    if (!data.success || !data.envelope) return false;

    let envelopeObj: any = null;
    try {
      envelopeObj = typeof data.envelope === "string" ? JSON.parse(data.envelope) : data.envelope;
    } catch {
      return false;
    }

    if (envelopeObj?.type === "bip39_recovery_envelope" || envelopeObj?.v === 2) {
      const { getRecoveryPhraseLocally, unwrapVaultKeyWithPhrase } = await import("@/lib/crypto/recovery-phrase");
      const phrase = await getRecoveryPhraseLocally(pairId);
      if (phrase) {
        const unwrapped = await unwrapVaultKeyWithPhrase(data.envelope, phrase, pairId);
        await savePairKey(pairId, unwrapped);
        return true;
      }
      return false;
    }

    if (envelopeObj?.v === 3) {
      const storedSecret = typeof window !== "undefined"
        ? (localStorage.getItem(`pairfect_invite_secret_${pairId}`) || sessionStorage.getItem(`pairfect_invite_secret_${pairId}`))
        : null;
      if (storedSecret) {
        try {
          const secretBytes = decodeCrockfordBase32(storedSecret);
          const unwrappedKey = await unwrapVaultKeyV3(data.envelope, secretBytes, pairId);
          await savePairKey(pairId, unwrappedKey);
          return true;
        } catch (e) {
          console.warn("[E2EE] Auto-recovery with stored secret failed:", e);
        }
      }
    }

    if (inviteCode) {
      const unwrappedKey = await unwrapVaultKeyWithCode(data.envelope, inviteCode, pairId);
      await savePairKey(pairId, unwrappedKey);
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[E2EE] Background vault key auto-recovery skipped:", err);
    return false;
  }
}

export interface E2EEContext {
  pairId: string;
  stripId: string;
  position: number;
}

/**
 * Build Additional Authenticated Data (AAD) to cryptographically bind ciphertext to context
 */
function buildAAD(context: E2EEContext): Uint8Array {
  const aadString = `${context.pairId}:${context.stripId}:${context.position}`;
  return new TextEncoder().encode(aadString);
}

/**
 * Encrypt a raw photo Blob (JPEG/WebP) using AES-256-GCM with context AAD
 * Returns binary Blob with structure: [1 byte: 0x01][12 bytes: IV][ciphertext + 16 bytes: tag]
 */
export async function encryptPhotoBlob(
  photoBlob: Blob,
  key: CryptoKey,
  context: E2EEContext
): Promise<Blob> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const photoBuffer = await photoBlob.arrayBuffer();
  const additionalData = buildAAD(context);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: additionalData as unknown as BufferSource,
    },
    key,
    photoBuffer
  );

  const versionHeader = new Uint8Array([FORMAT_VERSION]);
  const cipherBytes = new Uint8Array(ciphertextBuffer);

  // Concatenate: [Version 1B][IV 12B][Ciphertext]
  const combined = new Uint8Array(1 + IV_LENGTH + cipherBytes.byteLength);
  combined.set(versionHeader, 0);
  combined.set(iv, 1);
  combined.set(cipherBytes, 1 + IV_LENGTH);

  return new Blob([combined], { type: "application/octet-stream" });
}

/**
 * Decrypt a binary ArrayBuffer using AES-256-GCM with context AAD verification
 * Returns readable image/jpeg Blob
 */
export async function decryptPhotoBuffer(
  encryptedBuffer: ArrayBuffer,
  key: CryptoKey,
  context: E2EEContext
): Promise<Blob> {
  const bytes = new Uint8Array(encryptedBuffer);

  if (bytes.byteLength < 1 + IV_LENGTH + 16) {
    throw new Error("Ciphertext buffer is too short to be a valid encrypted payload.");
  }

  const version = bytes[0];
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported encryption payload version: ${version}`);
  }

  const iv = bytes.slice(1, 1 + IV_LENGTH);
  const ciphertextWithTag = bytes.slice(1 + IV_LENGTH);
  const additionalData = buildAAD(context);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: additionalData as unknown as BufferSource,
    },
    key,
    ciphertextWithTag
  );

  return new Blob([decryptedBuffer], { type: "image/jpeg" });
}

/**
 * Encrypt an audio Blob using AES-256-GCM
 * Returns binary Blob with structure: [1 byte: 0x01][12 bytes: IV][ciphertext + 16 bytes: tag]
 */
export async function encryptAudioBlob(audioBlob: Blob, key: CryptoKey): Promise<Blob> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const audioBuffer = await audioBlob.arrayBuffer();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    audioBuffer
  );
  const cipherBytes = new Uint8Array(ciphertextBuffer);
  const combined = new Uint8Array(1 + IV_LENGTH + cipherBytes.byteLength);
  combined[0] = FORMAT_VERSION;
  combined.set(iv, 1);
  combined.set(cipherBytes, 1 + IV_LENGTH);
  return new Blob([combined], { type: "application/octet-stream" });
}

/**
 * Decrypt an audio ArrayBuffer using AES-256-GCM
 */
export async function decryptAudioBuffer(
  encryptedBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<Blob> {
  const bytes = new Uint8Array(encryptedBuffer);
  if (bytes.byteLength < 1 + IV_LENGTH + 16) {
    throw new Error("Ciphertext buffer is too short to be a valid encrypted payload.");
  }
  if (bytes[0] !== FORMAT_VERSION) {
    throw new Error(`Unsupported encryption payload version: ${bytes[0]}`);
  }
  const iv = bytes.slice(1, 1 + IV_LENGTH);
  const ciphertextWithTag = bytes.slice(1 + IV_LENGTH);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextWithTag
  );
  return new Blob([decryptedBuffer], { type: "audio/webm" });
}

/**
 * Encrypt text using AES-256-GCM and return a Base64 payload
 * Payload format: [12 bytes: IV][ciphertext + 16 bytes: tag]
 */
export async function encryptText(plainText: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(plainText);
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);
  let binary = "";
  for (const byte of combined) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Decrypt a Base64 AES-256-GCM text payload
 */
export async function decryptText(ciphertextPayload: string, key: CryptoKey): Promise<string> {
  const binary = atob(ciphertextPayload);
  if (binary.length < IV_LENGTH + 16) {
    throw new Error("Ciphertext payload is too short to be valid.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const iv = bytes.slice(0, IV_LENGTH);
  const ciphertext = bytes.slice(IV_LENGTH);
  const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/**
 * Helper: Convert a base64 Data URL to a binary Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Check if a storage URL or path represents an encrypted photo
 */
export function isEncryptedPhotoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes(".enc") || url.startsWith("enc:v1:");
}

/**
 * Session Decrypted Blob LRU Cache helpers
 * Caching the binary Blob avoids re-decryption on scroll/re-render, while allowing
 * each mounting component to safely manage and revoke its own URL.createObjectURL.
 */
export function getCachedDecryptedBlob(storagePathOrUrl: string): Blob | undefined {
  return sessionDecryptedBlobCache.get(storagePathOrUrl);
}

export function setCachedDecryptedBlob(storagePathOrUrl: string, blob: Blob): void {
  // Cap session cache to 100 entries to manage browser memory
  if (sessionDecryptedBlobCache.size >= 100) {
    const firstKey = sessionDecryptedBlobCache.keys().next().value;
    if (firstKey) {
      sessionDecryptedBlobCache.delete(firstKey);
    }
  }
  sessionDecryptedBlobCache.set(storagePathOrUrl, blob);
}

export function clearDecryptedBlobCache(): void {
  sessionDecryptedBlobCache.clear();
}
