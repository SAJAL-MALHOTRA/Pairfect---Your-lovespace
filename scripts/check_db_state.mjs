import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: users, error: uErr } = await supabase.from("users").select("id, email, display_name");
  console.log("Users:", users);

  const { data: pairs, error: pErr } = await supabase.from("pairs").select("*");
  console.log("Pairs:", pairs);

  // Check storage buckets
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log("Buckets:", buckets?.map(b => b.name));

  if (buckets) {
    for (const b of buckets) {
      const { data: files } = await supabase.storage.from(b.name).list();
      console.log(`Bucket ${b.name} root files:`, files?.map(f => f.name));
    }
  }
}

main().catch(console.error);
