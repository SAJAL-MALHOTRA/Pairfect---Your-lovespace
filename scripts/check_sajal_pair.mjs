import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function checkSajal() {
  const sajalId = "1ae10371-c26e-4c49-bb65-98872b5b992c";
  const { data: pairs, error } = await admin
    .from("pairs")
    .select("*")
    .or(`user_a_id.eq.${sajalId},user_b_id.eq.${sajalId}`);

  console.log("Sajal pairs:", pairs, "error:", error);
}

checkSajal().catch(console.error);
