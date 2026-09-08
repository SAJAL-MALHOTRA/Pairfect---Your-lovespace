import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';

try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...rest] = trimmed.split('=');
      process.env[k.trim()] = rest.join('=').trim();
    }
  }
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vhykmhfrptyjkagwetku.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const candidateSecrets = [
  process.env.APP_ENCRYPTION_KEY,
  "super_secret_key_32_bytes_long_12345",
  "pairfect-secure-default-encryption-key-32-chars",
].filter(Boolean);

function tryDecrypt(encryptedText, secret) {
  if (!encryptedText || !encryptedText.startsWith("enc:")) return null;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return null;
  try {
    const key = crypto.createHash("sha256").update(secret, "utf8").digest();
    const iv = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let dec = decipher.update(parts[2], "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch (e) { return null; }
}

async function run() {
  // Check love_letters
  const { data: letters, error } = await supabase.from('love_letters').select('*').limit(5);
  if (error) { console.error("DB error:", error); return; }
  console.log("=== LOVE LETTERS ===");
  console.log("Found", letters?.length, "letters\n");
  
  for (const l of letters || []) {
    console.log("Letter ID:", l.id);
    console.log("  sender_id:", l.sender_id);
    console.log("  content type:", typeof l.content);
    console.log("  content (first 200 chars):", JSON.stringify(l.content).slice(0, 200));
    
    if (typeof l.content === "string" && l.content.startsWith("enc:")) {
      for (const sec of candidateSecrets) {
        const dec = tryDecrypt(l.content, sec);
        if (dec) {
          console.log("  DECRYPTED with key:", sec.slice(0, 30) + "...");
          console.log("  Plaintext (first 200):", dec.slice(0, 200));
          break;
        }
      }
    } else if (typeof l.content === "object") {
      console.log("  Content is ALREADY an object/array (JSONB column, not encrypted as string)");
      // Check if any values inside are encrypted
      const contentStr = JSON.stringify(l.content);
      if (contentStr.includes("enc:")) {
        console.log("  WARNING: JSONB content contains enc: strings inside!");
        console.log("  Full content:", contentStr.slice(0, 500));
      }
    }
    console.log();
  }
}

run();
