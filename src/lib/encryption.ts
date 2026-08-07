import crypto from "crypto";

const IV_LENGTH = 16;

function getCandidateKeys(): Buffer[] {
  const secrets = [
    process.env.APP_ENCRYPTION_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "pairfect-secure-default-encryption-key-32-chars",
  ].filter((s): s is string => Boolean(s && s.trim()));

  const keys: Buffer[] = [];
  for (const secret of secrets) {
    // SHA-256 digest
    keys.push(crypto.createHash("sha256").update(secret, "utf8").digest());
  }
  return keys;
}

function getKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) {
    const devFallback =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "pairfect-secure-default-encryption-key-32-chars";
    return crypto.createHash("sha256").update(devFallback, "utf8").digest();
  }
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

export function encrypt(text: string): string {
  if (!text) return "";

  if (text.startsWith("enc:")) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", getKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `enc:${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  if (!encryptedText.startsWith("enc:")) return encryptedText;

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    return "A keepsake shared with love ♡";
  }

  const iv = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const keys = getCandidateKeys();

  for (const key of keys) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      if (decrypted) return decrypted;
    } catch (err) {
      // Try next key
    }
  }

  console.error("[Encryption] All candidate key decryptions failed for payload.");
  return "A keepsake shared with love ♡";
}
