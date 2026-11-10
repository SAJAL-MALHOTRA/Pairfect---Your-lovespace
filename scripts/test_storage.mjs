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
  const testBuffer = Buffer.from("test audio content");
  const filePath = `test-pair/whispers/test_${Date.now()}.webm`;
  const { data: upData, error: upErr } = await admin.storage
    .from("memories")
    .upload(filePath, testBuffer, { contentType: "audio/webm", upsert: true });

  console.log("Upload result:", { upData, upErr });

  if (upData) {
    const { data: signData, error: signErr } = await admin.storage
      .from("memories")
      .createSignedUrl(upData.path, 60 * 60 * 24 * 365);
    console.log("Signed URL result:", { signData, signErr });

    const { data: listBuckets } = await admin.storage.listBuckets();
    console.log("Buckets:", listBuckets);
  }
}

main().catch(console.error);
