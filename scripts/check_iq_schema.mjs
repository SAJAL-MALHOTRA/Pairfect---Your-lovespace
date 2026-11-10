import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const anon = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function main() {
  const { data: anonQ, error: anonErr } = await anon.from("iq_questions").select("*").limit(5);
  console.log("Anon iq_questions count:", anonQ?.length, "err:", anonErr?.message);

  const { data: adminQ, error: adminErr } = await admin.from("iq_questions").select("*").limit(5);
  console.log("Admin iq_questions count:", adminQ?.length, "err:", adminErr?.message);
  if (adminQ && adminQ.length > 0) {
    console.log("Sample iq question:", adminQ[0]);
  }
}

main().catch(console.error);
