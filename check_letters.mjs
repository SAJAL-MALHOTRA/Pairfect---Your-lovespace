import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = "https://vhykmhfrptyjkagwetku.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkyNzUyOSwiZXhwIjoyMDk5NTAzNTI5fQ.lUUfG5r_eqItnQ7ATQTs82PN4EoKRZ8CQ1z_hXEw_y4";
const supabase = createClient(supabaseUrl, supabaseKey);

const candidateSecrets = [
  "super_secret_key_32_bytes_long_12345",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mjc1MjksImV4cCI6MjA5OTUwMzUyOX0.jn9tgjKXwq6Mn4VFIxvwlQ1xWu4JXRi_syC6oZVSLKc",
  "pairfect-secure-default-encryption-key-32-chars",
];

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
