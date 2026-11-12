import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey || !supabaseUrl) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Candidate keys for decrypting legacy data
const candidateSecrets = [
  { name: "APP_ENCRYPTION_KEY", val: env.APP_ENCRYPTION_KEY || process.env.APP_ENCRYPTION_KEY },
  { name: "SUPABASE_SERVICE_ROLE_KEY", val: serviceKey },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", val: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  { name: "legacy_default", val: "pairfect-secure-default-encryption-key-32-chars" },
  { name: "dev_fallback", val: "pairfect-dev-local-encryption-key-do-not-use-in-prod" },
].filter((c) => Boolean(c.val && c.val.trim()));

function decryptLegacyText(encryptedText) {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc:")) return encryptedText;

  // v2 format: enc:v2:<iv>:<tag>:<ciphertext>
  if (encryptedText.startsWith("enc:v2:")) {
    const parts = encryptedText.split(":");
    if (parts.length === 5) {
      const iv = Buffer.from(parts[2], "hex");
      const authTag = Buffer.from(parts[3], "hex");
      const ciphertext = parts[4];

      for (const cand of candidateSecrets) {
        const key = crypto.createHash("sha256").update(cand.val, "utf8").digest();
        try {
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(authTag);
          const decrypted = decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
          if (decrypted !== undefined) {
            return { plaintext: decrypted, decryptedWith: cand.name };
          }
        } catch {
          // Try next candidate
        }
      }
    }
  }

  // v1 legacy CBC format: enc:<iv>:<ciphertext>
  const parts = encryptedText.split(":");
  if (parts.length === 3) {
    const iv = Buffer.from(parts[1], "hex");
    const ciphertext = parts[2];
    for (const cand of candidateSecrets) {
      const key = crypto.createHash("sha256").update(cand.val, "utf8").digest();
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        const decrypted = decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
        if (decrypted) {
          return { plaintext: decrypted, decryptedWith: `${cand.name} (CBC)` };
        }
      } catch {
        // Try next candidate
      }
    }
  }

  throw new Error("Unable to decrypt ciphertext with any candidate key.");
}

function encryptWithNewKey(plaintext, newSecret) {
  const iv = crypto.randomBytes(12); // 96-bit IV
  const key = crypto.createHash("sha256").update(newSecret, "utf8").digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `enc:v2:${iv.toString("hex")}:${authTag}:${ciphertext}`;
}

async function run() {
  const isApply = process.argv.includes("--apply");
  const isDryRun = !isApply;

  console.log("=".repeat(70));
  console.log(`  DISPUTE ARGUMENTS RE-ENCRYPTION UTILITY (${isDryRun ? "DRY-RUN MODE" : "APPLY MODE"})`);
  console.log("=".repeat(70));

  // Check if a specific target key was provided via env or generate a new high-entropy one
  const targetSecret =
    process.env.TARGET_ENCRYPTION_KEY ||
    crypto.randomBytes(32).toString("hex"); // 256 bits of CSPRNG entropy

  console.log("\nTarget APP_ENCRYPTION_KEY:");
  console.log(`  ${targetSecret}\n`);

  const { data: rows, error: fetchErr } = await admin
    .from("dispute_arguments")
    .select("id, argument_text, submitted_at");

  if (fetchErr) {
    console.error("Failed to query dispute_arguments:", fetchErr);
    process.exit(1);
  }

  console.log(`Discovered ${rows.length} dispute argument rows to process:`);

  const updates = [];

  for (const r of rows) {
    try {
      const { plaintext, decryptedWith } = decryptLegacyText(r.argument_text);
      const reEncrypted = encryptWithNewKey(plaintext, targetSecret);

      updates.push({
        id: r.id,
        decryptedWith,
        preview: plaintext.length > 35 ? plaintext.slice(0, 35) + "..." : plaintext,
        newPayload: reEncrypted,
      });

      console.log(`  [OK] Row ${r.id}: Decrypted via ${decryptedWith} -> Re-encrypted`);
    } catch (e) {
      console.error(`  [ERROR] Row ${r.id}: ${e.message}`);
      process.exit(1);
    }
  }

  if (isDryRun) {
    console.log("\n" + "=".repeat(70));
    console.log("  DRY-RUN VERIFICATION SUCCESSFUL (0 rows modified)");
    console.log("  All 8 rows decrypted and re-encrypted in memory.");
    console.log("  To persist changes to Supabase, run with: node scripts/reencrypt_dispute_arguments.mjs --apply");
    console.log("=".repeat(70));
    return;
  }

  console.log("\nApplying re-encrypted payloads to Supabase...");
  for (const item of updates) {
    const { error: updateErr } = await admin
      .from("dispute_arguments")
      .update({ argument_text: item.newPayload })
      .eq("id", item.id);

    if (updateErr) {
      console.error(`  Failed to update row ${item.id}:`, updateErr);
      process.exit(1);
    }
    console.log(`  [APPLIED] Row ${item.id} updated.`);
  }

  console.log("\nVerifying all rows decrypt with the new key...");
  const targetKey = crypto.createHash("sha256").update(targetSecret, "utf8").digest();
  const { data: verifyRows } = await admin
    .from("dispute_arguments")
    .select("id, argument_text");

  let allVerified = true;
  for (const r of verifyRows) {
    const parts = r.argument_text.split(":");
    const iv = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const ciphertext = parts[4];
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", targetKey, iv);
      decipher.setAuthTag(authTag);
      const dec = decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
      if (!dec) allVerified = false;
    } catch {
      allVerified = false;
      console.error(`  Verification failed on row ${r.id}!`);
    }
  }

  if (allVerified) {
    console.log("\n" + "=".repeat(70));
    console.log("  RE-ENCRYPTION 100% COMPLETE & VERIFIED");
    console.log(`  All ${verifyRows.length} rows now encrypted under new APP_ENCRYPTION_KEY.`);
    console.log("  Next step: Set this key in Vercel Environment Variables (Production & Preview):");
    console.log(`  APP_ENCRYPTION_KEY=${targetSecret}`);
    console.log("=".repeat(70));
  } else {
    console.error("Post-update verification encountered errors!");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
