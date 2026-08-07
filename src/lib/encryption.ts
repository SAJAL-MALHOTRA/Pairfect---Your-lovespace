import crypto from "crypto";

const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.APP_ENCRYPTION_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: APP_ENCRYPTION_KEY environment variable is not defined in production. Insecure encryption fallback rejected."
      );
    }
    // Local development fallback only
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

  try {
    const iv = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[Encryption] Decryption failed:", err);
    return "A keepsake shared with love ♡";
  }
}
