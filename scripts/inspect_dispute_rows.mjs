import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env.local");
let env = {};
for (const l of fs.readFileSync(envPath, "utf8").split("\n")) {
  const t = l.trim();
  if (t && !t.startsWith("#") && t.includes("=")) {
    const [k, ...v] = t.split("=");
    env[k.trim()] = v.join("=").trim();
  }
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const candidateSecrets = [
  { name: "APP_ENCRYPTION_KEY", val: env.APP_ENCRYPTION_KEY },
  { name: "SUPABASE_SERVICE_ROLE_KEY", val: env.SUPABASE_SERVICE_ROLE_KEY },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", val: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  { name: "legacy_default", val: "pairfect-secure-default-encryption-key-32-chars" },
  { name: "dev_fallback", val: "pairfect-dev-local-encryption-key-do-not-use-in-prod" },
];

async function inspect() {
  const { data: rows, error } = await admin.from("dispute_arguments").select("id, argument_text, submitted_at");
  if (error) {
    console.error("Error fetching dispute_arguments:", error);
    return;
  }
  console.log("Found " + rows.length + " dispute argument rows:");
  for (const r of rows) {
    console.log(`\nRow ${r.id} (${r.submitted_at}):`);
    if (!r.argument_text.startsWith("enc:")) {
      console.log("  Format: Plaintext");
      continue;
    }
    const parts = r.argument_text.split(":");
    console.log("  Format:", parts[0] + (parts[1] === "v2" ? ":v2" : ":v1"));
    let decryptedBy = null;
    if (parts[1] === "v2") {
      const iv = Buffer.from(parts[2], "hex");
      const authTag = Buffer.from(parts[3], "hex");
      const ciphertext = parts[4];
      for (const cand of candidateSecrets) {
        if (!cand.val) continue;
        const key = crypto.createHash("sha256").update(cand.val, "utf8").digest();
        try {
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(authTag);
          const dec = decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
          decryptedBy = cand.name;
          console.log(`  Decrypted with: ${cand.name} -> "${dec.slice(0, 40)}..."`);
          break;
        } catch {}
      }
    }
    if (!decryptedBy) {
      console.log("  WARNING: Could NOT decrypt with any known candidate key!");
    }
  }
}

inspect();
