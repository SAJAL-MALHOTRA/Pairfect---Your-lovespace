import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = "https://vhykmhfrptyjkagwetku.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkyNzUyOSwiZXhwIjoyMDk5NTAzNTI5fQ.lUUfG5r_eqItnQ7ATQTs82PN4EoKRZ8CQ1z_hXEw_y4";
const supabase = createClient(supabaseUrl, supabaseKey);

const candidateSecrets = [
  "super_secret_key_32_bytes_long_12345",
  "pairfect-secure-default-encryption-key-32-chars",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mjc1MjksImV4cCI6MjA5OTUwMzUyOX0.jn9tgjKXwq6Mn4VFIxvwlQ1xWu4JXRi_syC6oZVSLKc",
  "pairfect-secret",
  "pairfect",
  "secret",
  "",
];

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
