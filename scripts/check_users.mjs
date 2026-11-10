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
  const { data: u1, error: e1 } = await supabase.from("profiles").select("*");
  console.log("profiles:", u1?.length, e1);

  const { data: u2, error: e2 } = await supabase.from("users").select("*");
  console.log("users:", u2?.length, e2);

  const { data: u3, error: e3 } = await supabase.auth.admin.listUsers();
  console.log("auth.users count:", u3?.users?.length);
  for (const u of (u3?.users || [])) {
    console.log("User:", u.id, u.email, u.user_metadata);
  }
}

main().catch(console.error);
