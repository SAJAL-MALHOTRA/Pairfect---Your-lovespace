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
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "malhotraxsajal@gmail.com",
  });
  
  const token_hash = linkData.properties.hashed_token;
  const anon = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  const { data: sessionData, error: sessErr } = await anon.auth.verifyOtp({
    token_hash,
    type: "magiclink"
  });

  console.log("Session obtained:", !!sessionData?.session);
  if (sessionData?.session) {
    console.log("Access token length:", sessionData.session.access_token.length);
    fs.writeFileSync("scripts/test_session.json", JSON.stringify(sessionData.session));
  }
}

run();
