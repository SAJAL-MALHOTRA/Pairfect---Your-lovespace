import crypto from "crypto";

const IV_LENGTH = 16;

function getCandidateKeys(): Buffer[] {
  // The anon key that was historically used as the encryption key before APP_ENCRYPTION_KEY was added.
  // NEXT_PUBLIC_ env vars may not be available in server-side route handlers on Vercel,
  // so we hardcode this known value as a fallback candidate to decrypt legacy data.
  const LEGACY_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mjc1MjksImV4cCI6MjA5OTUwMzUyOX0.jn9tgjKXwq6Mn4VFIxvwlQ1xWu4JXRi_syC6oZVSLKc";

  const secrets = [
    process.env.APP_ENCRYPTION_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    LEGACY_ANON_KEY,
    "pairfect-secure-default-encryption-key-32-chars",
  ].filter((s): s is string => Boolean(s && s.trim()));

  // Deduplicate
  const unique = [...new Set(secrets)];
  return unique.map(secret =>
    crypto.createHash("sha256").update(secret, "utf8").digest()
  );
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
