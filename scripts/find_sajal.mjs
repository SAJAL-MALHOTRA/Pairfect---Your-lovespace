import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function main() {
  const { data: u } = await supabase.from("users").select("*").ilike("display_name", "%Sajal%");
  console.log("Users like Sajal:", u);

  const { data: allWhispers } = await supabase.from("whispers").select("*");
  console.log("All whispers in DB:", allWhispers);
}

main().catch(console.error);
