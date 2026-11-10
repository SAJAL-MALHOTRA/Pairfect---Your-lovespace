import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function run() {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "malhotraxsajal@gmail.com",
  });
  console.log("Error:", error);
  console.log("Action link:", data?.properties?.action_link);
}

run();
