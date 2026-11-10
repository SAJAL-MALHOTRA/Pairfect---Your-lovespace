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
  const { data: tables, error } = await supabase.from("whispers").select("*");
  console.log("whispers count:", tables?.length, "error:", error);
  if (tables && tables.length > 0) {
    console.log(JSON.stringify(tables, null, 2));
  }
}

main().catch(console.error);
