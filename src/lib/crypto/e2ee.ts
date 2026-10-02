/**
 * Client-Side Zero-Knowledge End-to-End Encryption (E2EE) Module
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
 * Helper: Convert ArrayBuffer to URL-safe Base64 string
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
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
