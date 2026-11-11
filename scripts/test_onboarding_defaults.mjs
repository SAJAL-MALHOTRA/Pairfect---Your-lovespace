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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkDefaults() {
  const timestamp = Date.now();
  const email = `test.defaults.${timestamp}@pairfect.internal`;
  const password = "TestPassword123!@#Secure";

  const { data: uData } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  const user = uData.user;
  await admin.from("users").upsert([{ id: user.id, display_name: "DefaultTester" }]);

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await client.auth.signInWithPassword({ email, password });

  // Insert exactly what onboarding inserts: only user_a_id, invite_code, status
  const code = `DFT${Math.floor(100 + Math.random() * 899)}`;
  const { data: pair, error } = await client
    .from("pairs")
    .insert({
      user_a_id: user.id,
      invite_code: code,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Onboarding default pair insert result:");
    console.log("  ID:", pair.id);
    console.log("  Status:", pair.status);
    console.log("  Subscription Tier:", pair.subscription_tier);
    console.log("  Subscription Status:", pair.subscription_status);
    console.log("  Subscription Expires At:", pair.subscription_expires_at);
    console.log("  Trial Used:", pair.trial_used);
    console.log("  Trial Ends At:", pair.trial_ends_at);
  }

  // Cleanup
  if (pair) await admin.from("pairs").delete().eq("id", pair.id);
  await admin.from("users").delete().eq("id", user.id);
  await admin.auth.admin.deleteUser(user.id);
}

checkDefaults().catch(console.error);
