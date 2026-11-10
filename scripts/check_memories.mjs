import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function main() {
  const { data: rootFiles } = await admin.storage.from("memories").list();
  console.log("Root files/folders in memories:", rootFiles);

  const { data: demoFiles } = await admin.storage.from("memories").list("demo-pair/whispers");
  console.log("Files in demo-pair/whispers:", demoFiles);
}

main().catch(console.error);
