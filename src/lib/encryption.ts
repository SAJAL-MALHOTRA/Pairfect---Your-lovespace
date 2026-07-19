import crypto from "crypto";

const ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY || "";
const IV_LENGTH = 16;

function getKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error("APP_ENCRYPTION_KEY is not configured");
  }

  return crypto.createHash("sha256").update(ENCRYPTION_KEY, "utf8").digest();
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
    throw new Error("Invalid encrypted payload");
  }

  const iv = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
