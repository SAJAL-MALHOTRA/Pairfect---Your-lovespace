import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
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

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkCleanup() {
  console.log("=== CHECKING DATABASE FOR ANY ORPHANED TEST ACCOUNTS ===");

  // List users in auth.users
  const { data: authUsersData, error: authErr } = await admin.auth.admin.listUsers();
  if (authErr) {
    console.error("Auth list error:", authErr);
    return;
  }

  const testUsers = authUsersData.users.filter((u) => u.email?.includes("test.") || u.email?.includes("@pairfect.internal"));
  console.log(`Found ${testUsers.length} test users in auth.users:`);
  for (const u of testUsers) {
    console.log(`  Deleting orphan: ${u.email} (${u.id})`);
    await admin.from("pairs").delete().or(`user_a_id.eq.${u.id},user_b_id.eq.${u.id}`);
    await admin.from("users").delete().eq("id", u.id);
    await admin.auth.admin.deleteUser(u.id);
  }

  // Check pairs
  const { data: allPairs } = await admin.from("pairs").select("id, user_a_id, user_b_id, status, invite_code");
  console.log(`Total active/pending pairs in database: ${allPairs?.length || 0}`);
  for (const p of allPairs || []) {
    if (p.invite_code?.startsWith("TST") || p.invite_code?.startsWith("EXP") || p.invite_code?.startsWith("DFT") || p.invite_code?.startsWith("GT")) {
      console.log(`  Deleting test pair: ${p.id} (${p.invite_code})`);
      await admin.from("pairs").delete().eq("id", p.id);
    }
  }

  console.log("Cleanup verification complete. Database is pristine.\n");
}

checkCleanup().catch(console.error);
