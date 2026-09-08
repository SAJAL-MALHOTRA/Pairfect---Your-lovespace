import crypto from "crypto";

const GCM_IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const CBC_IV_LENGTH = 16; // 128-bit IV for legacy AES-CBC
const DEV_FALLBACK_KEY = "pairfect-dev-local-encryption-key-do-not-use-in-prod";

/**
 * Derives the active encryption key from environment variables.
 * In production, APP_ENCRYPTION_KEY is mandatory.
 */
function getActiveKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: APP_ENCRYPTION_KEY environment variable is required in production."
      );
    }
    console.warn(
      "[Security Warning] APP_ENCRYPTION_KEY is not set. Using dev fallback key. Set APP_ENCRYPTION_KEY in production."
    );
  }

  return crypto.createHash("sha256").update(secret || DEV_FALLBACK_KEY, "utf8").digest();
}

/**
 * Returns candidate keys for key rotation and backward-compatible decryption of legacy data.
 */
function getCandidateKeys(): Buffer[] {
  const secrets = [
    process.env.APP_ENCRYPTION_KEY,
    "pairfect-secure-default-encryption-key-32-chars",
    DEV_FALLBACK_KEY,
  ].filter((s): s is string => Boolean(s && s.trim()));

  const unique = [...new Set(secrets)];
  return unique.map(secret =>
    crypto.createHash("sha256").update(secret, "utf8").digest()
  );
}

/**
 * Encrypts a string using authenticated AES-256-GCM.
 * Output format: enc:v2:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encrypt(text: string): string {
  if (!text) return "";
  if (text.startsWith("enc:")) return text;

  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", getActiveKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `enc:v2:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext, supporting authenticated AES-256-GCM (v2) and legacy AES-256-CBC (v1).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc:")) return encryptedText;

  // 1. Authenticated AES-256-GCM (v2 format: enc:v2:<iv>:<tag>:<ciphertext>)
  if (encryptedText.startsWith("enc:v2:")) {
    const parts = encryptedText.split(":");
    if (parts.length === 5) {
      const iv = Buffer.from(parts[2], "hex");
      const authTag = Buffer.from(parts[3], "hex");
      const ciphertext = parts[4];
      const keys = getCandidateKeys();

      for (const key of keys) {
        try {
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(ciphertext, "hex", "utf8");
          decrypted += decipher.final("utf8");
          if (decrypted !== undefined) return decrypted;
        } catch {
          // Continue trying next candidate key if key was rotated
        }
      }
    }
  }

  // 2. Legacy AES-256-CBC (v1 format: enc:<iv>:<ciphertext>)
  const parts = encryptedText.split(":");
  if (parts.length === 3) {
    const iv = Buffer.from(parts[1], "hex");
    const ciphertext = parts[2];
    const keys = getCandidateKeys();

    for (const key of keys) {
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        let decrypted = decipher.update(ciphertext, "hex", "utf8");
        decrypted += decipher.final("utf8");
        if (decrypted) return decrypted;
      } catch {
        // Try next key
      }
    }
  }

  console.error("[Encryption] All candidate key decryptions failed for payload.");
  return "A keepsake shared with love ♡";
}
