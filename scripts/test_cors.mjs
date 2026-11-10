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
  const { data: signData } = await admin.storage
    .from("memories")
    .createSignedUrl("test-pair/whispers/test_1790893219690.webm", 3600);

  if (!signData?.signedUrl) {
    console.error("No signed url");
    return;
  }

  console.log("Fetching signed URL:", signData.signedUrl);
  const res = await fetch(signData.signedUrl, {
    method: "GET",
    headers: {
      Origin: "https://pairfect.site",
    },
  });

  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
}

main().catch(console.error);
