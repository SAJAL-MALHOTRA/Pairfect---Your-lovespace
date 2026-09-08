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
  const iv = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  // Method A: sha256 of secret
  try {
    const key = crypto.createHash("sha256").update(secret, "utf8").digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let dec = decipher.update(encrypted, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch (e) {}

  // Method B: raw secret padded/truncated to 32 bytes
  try {
    const key = Buffer.alloc(32);
    key.write(secret);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let dec = decipher.update(encrypted, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch (e) {}

  return null;
}

async function run() {
  const { data: notes, error } = await supabase.from('gratitude_entries').select('*').limit(10);
  if (error) { console.error(error); return; }
  console.log("Found", notes?.length, "notes");
  for (const n of notes || []) {
    console.log("\nNote ID:", n.id, "Raw content:", n.content);
    if (n.content?.startsWith("enc:")) {
      let decrypted = null;
      for (const sec of candidateSecrets) {
        decrypted = tryDecrypt(n.content, sec);
        if (decrypted) {
          console.log(">>> SUCCESS decrypted with secret:", sec, "=>", decrypted);
          break;
        }
      }
      if (!decrypted) {
        console.log("FAILED to decrypt with candidate secrets");
      }
    } else {
      console.log("Plaintext note:", n.content);
    }
  }
}

run();
